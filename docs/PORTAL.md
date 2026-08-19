# Operava client portal

A private portal for the companies Operava builds software for. It exists to
answer, without anyone having to ask: what is the status, what are you waiting
on, did you see my bug report, where is that file, what is next.

There is **no public signup**. Operava creates every account.

---

## Setup

### Environment

| Variable                        | Where it goes   | Notes                                                   |
| ------------------------------- | --------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + server | Project URL                                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public identifier; every table it reaches is behind RLS |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only** | Bypasses RLS. Never prefix `NEXT_PUBLIC_`               |

`RESEND_API_KEY` and `LEAD_FROM_EMAIL` are optional and already used for lead
notifications. When set, setup links are emailed automatically; when not, the
link is shown in the admin UI to send by hand.

Without the first two, `/portal/*` renders an honest "not configured" screen and
the marketing site is unaffected. `next build` succeeds either way.

### Database

Migrations are in `supabase/migrations/`, applied in order:

1. `0001_portal_schema.sql` — enums, tables, indexes, `portal_private` helpers, triggers
2. `0002_portal_rls.sql` — RLS, policies, the private storage bucket

The live project has a third migration (`portal_private_helpers`) from moving
the RLS helpers out of `public` after the fact. A fresh database replaying
0001 + 0002 lands in exactly the same state.

### One manual step

**Supabase → Authentication → URL Configuration → Redirect URLs** must include
every origin the portal runs on:

```
http://localhost:3000/portal/auth/confirm
https://operavallc.com/portal/auth/confirm
```

Supabase refuses to redirect anywhere not on this list, so setup and reset links
silently fail without it. This is the only step that cannot be done from code.

### Optional: email template

Setup links are generated server-side with `generateLink`, so the default
Supabase template is not used for provisioning and needs no change. If you ever
want Supabase to send the recovery email itself, point its template at:

```
{{ .SiteURL }}/portal/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/portal/set-password
```

---

## Auth architecture

Supabase Auth, cookie sessions via `@supabase/ssr`.

- **Login** — `/portal/login`, email + password. One error message for every
  failure so the form cannot be used to enumerate which addresses have accounts.
- **Provisioning** — an admin creates the auth user with a random password
  nobody records, then a one-time `token_hash` link lets the person set their
  own. **No plaintext password is ever generated, stored, displayed or emailed.**
- **Why `generateLink` and not `inviteUserByEmail`** — invite and
  `resetPasswordForEmail` write a PKCE code verifier to the _caller's_ browser.
  Triggered by staff, the customer could never complete the exchange.
  `generateLink` returns a verifier-free token that works in any browser.
- **`/portal/auth/confirm`** accepts both `token_hash` (staff-initiated) and
  `code` (customer's own reset), so either path works.
- **Middleware** refreshes the session and turns away anonymous visitors. It is
  a first gate, not the boundary: every page re-checks server-side, and RLS
  decides what the identity can see. It calls `getUser()` (revalidates with the
  auth server) rather than `getSession()` (trusts the cookie).

## Roles

`admin` (Operava staff) and `client`. Admins have no `company_id`, which is what
makes them global; the `client_requires_company` constraint rejects a client
without one, because such an account can see nothing and is a provisioning bug.

Promoting someone to admin is deliberately **not** in the UI:

```sql
update profiles set role = 'admin', company_id = null where email = 'you@operavallc.com';
```

An admin form that can also mint admins is one misclick from handing a customer
every other customer's data.

## Security

- RLS on every table, no permissive fallback.
- Policies resolve through `SECURITY DEFINER` helpers in the **`portal_private`**
  schema. Private because PostgREST exposes `public`, so a helper there is also
  an HTTP endpoint. `search_path = ''` on each, with every reference schema
  qualified.
- Clients write in exactly two places: raising a request and commenting on one.
  Both policies pin `created_by` to their own profile and force
  `visibility = 'customer'`, so authorship cannot be forged and a client cannot
  post an internal note or open a pre-closed ticket.
- Billing is read-only for clients. The portal reports what is owed; it does not
  let the person who owes it edit the record.
- `visibility = 'internal'` rows are filtered **by policy**, not by a query
  someone might forget a filter on.
- Files live in a private bucket. Downloads go through
  `/portal/files/download/[id]`, which re-checks access through RLS and mints a
  60-second signed URL. No signed URL is ever rendered into the page.
- An id in the URL is not an access grant: anything the viewer cannot read
  returns 404, identical to an id that does not exist.

### Running the security tests

```bash
psql "$DATABASE_URL" -f supabase/seed/dev_seed.sql
psql "$DATABASE_URL" -f supabase/tests/rls.sql          # reads + isolation
psql "$DATABASE_URL" -f supabase/tests/write_paths.sql  # writes, rolls back
```

Both raise an exception listing every failure, so they drop straight into CI.
They run as role `authenticated` with a JWT claim set — exactly how PostgREST
evaluates a request — because testing isolation through the application would
only prove the application's filters work, and the filters are not the boundary.

## Routes

**Client** — `/portal` (overview), `/portal/project`, `/portal/requests`,
`/portal/requests/new`, `/portal/requests/[id]`, `/portal/files`,
`/portal/billing`, `/portal/support`

**Admin** — `/portal/admin`, `/portal/admin/companies[/id]`,
`/portal/admin/projects[/id]`, `/portal/admin/requests[/id]`,
`/portal/admin/people`

**Auth** — `/portal/login`, `/portal/forgot-password`, `/portal/set-password`,
`/portal/auth/confirm`, `/portal/unavailable`

Support is the front door, Requests is the record. Two parallel ticket systems
would be redundant, so Support only starts things and points at a person.

## Layout structure

Marketing pages live in `src/app/(marketing)/`, which owns the site header and
footer. The root layout provides only `<html>`, fonts and JSON-LD. Route groups
do not appear in URLs, so every public path is unchanged — the split exists
because a signed-in client has no use for the site nav, and the login page was
rendering two Operava logos.

## Not built, on purpose

Stripe automation, contract generation, MCP, agent workflows, email
notification infrastructure, realtime, analytics, Kanban, time tracking.

The change-request columns (`estimated_cost`, `estimated_timeline_impact`,
`approval_status`) exist and are editable by admins but drive nothing. They are
there so adding billing later is a feature, not a migration of live data.
