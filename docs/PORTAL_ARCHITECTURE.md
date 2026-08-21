# Operava Customer Portal + Operava MCP — architecture

This document was written before the implementation and describes the
architecture the portal is built on. It is the reference for anyone (human or
agent) extending the system.

## What already existed, and what we reuse

| Layer         | Existing state                                                                                                                                                                                                                                                                                                                                                   | Decision                                                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | Next.js 16 App Router, TypeScript strict, Tailwind v4, Geist fonts                                                                                                                                                                                                                                                                                               | Extend the same app. Portal + admin are new route groups, same deploy.                                                                                                                 |
| Design system | Navy/leaf tokens, `t-*` type utilities, Button/Field/Section primitives                                                                                                                                                                                                                                                                                          | Reused wholesale. The portal shares the marketing site's visual language.                                                                                                              |
| Backend       | Server actions + one JSON API route; no database                                                                                                                                                                                                                                                                                                                 | Server actions remain the mutation path for UI; MCP is a route handler.                                                                                                                |
| Database      | Supabase project **Operava** (`ihfocwkzpyknvqplpoef`) already carries a portal schema with RLS: companies, profiles, projects, project_members, milestones, project_updates, project_blockers, requests, request_comments, project_files, billing_records, activity_log, plus `portal_private` RLS helper functions and a private `project-files` storage bucket | Adopted as the baseline. The three live migrations are exported verbatim into `supabase/migrations/` so the repo is the source of truth; everything new is additive migrations on top. |
| Auth          | Supabase Auth (3 seeded users: one admin, two clients)                                                                                                                                                                                                                                                                                                           | Supabase Auth via `@supabase/ssr` cookies. No second auth system.                                                                                                                      |
| File storage  | Private `project-files` bucket, per-project folder RLS                                                                                                                                                                                                                                                                                                           | Reused. Downloads are short-lived signed URLs minted server-side.                                                                                                                      |
| Email         | Resend REST calls in `src/lib/leads.ts` (no SDK)                                                                                                                                                                                                                                                                                                                 | Same pattern for portal notifications (`src/lib/portal/notify.ts`).                                                                                                                    |
| Payments      | None (no Stripe anywhere)                                                                                                                                                                                                                                                                                                                                        | `billing_records` shows payment state + external invoice URLs. Stripe API integration deferred.                                                                                        |

There is deliberately **one architecture**: one Next.js app, one Postgres, one
domain layer. The customer portal, the admin surface and the MCP all call the
same services.

## Domain model

```
Company (tenant)
 ├─ Profile (portal user: role admin|client, client bound to a company)
 └─ Project
     ├─ Milestone            ordered plan; customer-visible or internal
     ├─ ProjectUpdate        the narrative timeline; customer or internal
     ├─ ClientRequest        action item Operava → customer (open/acknowledged/completed/cancelled)
     ├─ Request              customer → Operava (bug/change/question/support) + comments
     ├─ ProjectFile          stored artifact (visibility-scoped)
     ├─ ProjectLink          staging/production/repo/docs URLs (visibility-scoped)
     ├─ BillingRecord        payment state + external invoice URL
     └─ ActivityEntry        audit trail (actor, actor_type, action, entity, before/after)
```

Two request concepts exist on purpose and are named apart everywhere:

- **Client requests** (`client_requests`) — Operava asking the customer for
  something ("connect your Stripe account", "approve the workflow"). These are
  what make a `waiting_on_client` status explainable.
- **Requests** (`requests`) — the customer asking Operava for something (bug,
  change request, question). This table predates this build and is kept.

### Status vocabularies (machine-operable, enforced as Postgres enums)

- Project: `planning · in_progress · testing · waiting_on_client · blocked · ready_for_review · launching · complete · on_hold`
  (the pre-existing enum, plus `blocked`; `on_hold` covers "paused",
  `ready_for_review` covers "review")
- Milestone: `upcoming · in_progress · blocked · complete`
- Client request: `open · acknowledged · completed · cancelled`
- Customer request: `submitted · reviewing · approved · in_progress · waiting_on_client · done · declined`
- Billing: `pending · due · paid · overdue · cancelled`
- Visibility: `customer · internal` — every timeline-ish table carries it.

## Layering

```
        ┌────────────────┐  ┌───────────────┐  ┌──────────────────────┐
        │ /portal (UI)   │  │ /admin (UI)   │  │ /api/mcp (MCP tools) │
        │ server actions │  │ server actions│  │ streamable HTTP      │
        └───────┬────────┘  └───────┬───────┘  └──────────┬───────────┘
                └────────────┬──────┴──────────────────────┘
                             ▼
                src/lib/portal/services/*        ← the only write path
                (authorize → validate → mutate → audit → return state)
                             │
              ┌──────────────┼───────────────┐
              ▼              ▼               ▼
        Supabase Postgres  Supabase Auth  Supabase Storage
        (RLS = 2nd line)
```

- **Actor model.** Every service call takes an explicit `Actor`:
  `{ type: 'internal' | 'customer' | 'mcp' | 'system', profileId?, label }`.
  Authorization decisions are pure functions over the actor (`src/lib/portal/authz.ts`)
  and are unit-tested. UI actions build the actor from the Supabase session;
  the MCP builds it from its own key auth. No service trusts its caller.
- **Two database clients.** A cookie-bound anon client (RLS enforced — used
  for customer reads so row security is load-bearing even if app code is
  wrong) and a service-role client (server-only, used by the service layer
  after explicit authorization, and for signed URLs / auth admin).
- **RLS is defense-in-depth, not the only wall.** Customer scoping is checked
  in the service layer _and_ enforced by RLS. Internal fields never reach
  customer serializers (`serialize.ts` produces the customer view; there is no
  spread-the-row-into-JSON path for customer output).
- **Audit.** `activity_log` gains `actor_type`, `actor_label`, `entity_type`,
  `entity_id`, `data` (before/after snapshots, secrets never included) and
  `source`. Every mutating service writes one entry. MCP mutations are always
  `actor_type='mcp'`.
- **Idempotency.** MCP mutations accept `idempotency_key`. Keys are stored in
  `mcp_ops` with the serialized result; replays return the stored result and
  are marked as replays. Enforced with a unique index, so a race between two
  identical calls resolves to one execution.
- **Errors.** Services throw `PortalError { code, message, details? }`.
  Server actions map them to form state; MCP maps them to structured
  `{ error: { code, message, details } }` tool results with `isError`.

## Authentication & authorization

- **Customers / admins** sign in at `/portal/login` with email+password or an
  emailed magic link. Sessions are Supabase cookies (`@supabase/ssr`); a
  `proxy.ts` (Next 16 middleware) refreshes tokens on `/portal` + `/admin`.
- **Invites.** Admin creates a portal user → service generates a Supabase
  invite action link (admin API), emails it via Resend when configured, and
  always shows it in the admin UI for manual delivery. Invited users land on
  `/portal/auth/set-password`.
- **Tenancy.** A client profile belongs to exactly one company and can only
  ever read that company's rows — checked in the service layer, enforced by
  RLS (`portal_private.can_read_project`), and unreachable in the customer
  serializers. Optional `project_members` rows narrow a client to specific
  projects.
- **Admin** (`role='admin'`) is Operava staff: full access via both layers.
- **MCP** authenticates with `OPERAVA_MCP_KEY` (Authorization: Bearer, or an
  URL-embedded key for clients that cannot set headers, e.g. ChatGPT
  connectors). Constant-time comparison. MCP is privileged Operava-side
  access: it uses the service-role client through the same services, with
  `actor_type='mcp'` on every audit entry. Customer-only surfaces (e.g. file
  bytes) are not exposed as tools.

## The MCP surface

Stateless MCP over Streamable HTTP (JSON responses) at `POST /api/mcp`,
implemented with `@modelcontextprotocol/sdk`'s web-standard transport — one
server+transport per request, no session state, safe on serverless.

Reads: `list_customers`, `get_customer`, `list_projects`, `get_project`,
`get_project_timeline`, `list_project_milestones`, `list_client_requests`,
`get_project_activity`.

Writes: `create_customer`, `create_project`, `update_project_status`,
`update_project_progress`, `update_project_summary`, `create_project_update`,
`create_milestone`, `update_milestone`, `create_client_request`,
`complete_client_request`, `add_project_link`.

Every write validates with the same zod schemas the UI uses, runs through the
same service functions, writes the same audit entries, and returns the
resulting authoritative state.

## Testing strategy

1. **Unit (vitest)** — pure authz decisions, status transitions, input
   schemas, customer serializers (internal-field stripping), MCP tool
   handlers against a faked data gateway (idempotency, audit emission,
   structured errors), notification event selection.
2. **RLS integration (vitest + node-postgres)** — a scratch Postgres with
   minimal `auth`/`storage` shims applies the _real_ migration files, then
   asserts tenant isolation as the database sees it: client A cannot read
   client B's rows, internal visibility never leaks, storage path policies
   hold, write policies reject spoofed `created_by`. Runs when a local
   Postgres is available (`npm run test:rls`); skipped otherwise.

## Configuration

See `.env.example`. New variables: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only),
`OPERAVA_MCP_KEY` (server-only), optional `PORTAL_FROM_EMAIL` (falls back to
`LEAD_FROM_EMAIL`). Resend reuses `RESEND_API_KEY`.

## Deliberately deferred

- Stripe API integration (no Stripe exists anywhere yet; `billing_records`
  models payment state and links out to hosted invoices).
- Customer file uploads from the portal (schema + RLS already permit it;
  UI deferred to keep v1 tight).
- Per-project member scoping UI (`project_members` works and is enforced;
  managing it has no UI yet).
- Realtime updates, comment threads on updates, in-app notification center.
