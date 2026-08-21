# Operava LLC — marketing site

Marketing site for Operava LLC. The offer is **custom software and automation
for established home-service businesses, specialty contractors and other
operationally complex service companies**, not an Operon subscription. Every
page points at one of two conversions: booking a discovery call, or submitting a
custom software request.

- **Primary CTA** — "Walk us through a workflow" (`/book`)
- **Secondary CTA** — "Tell us what isn't working" (`/request-software`)
- **Price anchor** — custom builds from $6,000; hosting, maintenance and support from $200/month

## Stack

|                      |                                                             |
| -------------------- | ----------------------------------------------------------- |
| Framework            | Next.js 16 (App Router, Turbopack)                          |
| Language             | TypeScript, strict                                          |
| Styling              | Tailwind CSS v4 (CSS-first config in `src/app/globals.css`) |
| Fonts                | Geist / Geist Mono via `next/font`                          |
| Runtime dependencies | `next`, `react`, `react-dom` — that is the whole list       |

Forms use server actions. Validation, the lead model and lead delivery are
plain TypeScript with no external packages.

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write .
```

## Project layout

```
src/
  app/
    page.tsx                       Home
    what-we-build/                 Capabilities, in depth
    work/                          Proof — what we have built, and an honest
                                   empty client portfolio. See content/work.ts
                                   before editing: it carries accuracy rules.
    process/                       Discovery → Scope → Build → Launch
    pricing/                       Pricing model + commercial structure
    about/                         Company
    contact/                       Three ways to get in touch
    privacy/                       What happens to form submissions
    book/                          Discovery call form (3 steps)
    book/confirmed/                Confirmation + scheduler handoff
    request-software/              Software request form
    request-software/received/     Confirmation
    api/leads/route.ts             JSON lead endpoint
    opengraph-image.tsx            Social card, generated at build
    icon.svg, apple-icon.tsx       Favicons
    sitemap.ts, robots.ts          SEO
  components/
    brand/logo.tsx                 Mark + wordmark (SVG, theme-aware)
    forms/                         Booking + request forms
    sections/                      Shared page sections
    ui/                            Button, field, section primitives
  content/                         All marketing copy, as data
  lib/
    leads.ts                       Lead model + delivery fan-out
    actions.ts                     Server actions + anti-spam
    validation.ts                  Dependency-free field validation
    analytics.ts                   Vendor-neutral conversion events
    seo.ts                         Per-page canonical + Open Graph metadata
    site.ts                        Company facts, nav, canonical origin
```

Copy lives in `src/content/*` as typed data, so wording changes never require
touching layout.

## Customer portal + Operava MCP

The same app hosts a customer-facing project portal, an internal Operava admin
surface, and a remote MCP server — all on one Supabase-backed domain model.
Full design notes are in [`docs/PORTAL_ARCHITECTURE.md`](docs/PORTAL_ARCHITECTURE.md).

```
src/
  app/
    portal/                          Customer portal (auth-gated)
      login/                         Password + magic-link sign in
      auth/                          Invite/callback/set-password
      (app)/                         Dashboard, project pages, requests
      files/[fileId]/                Signed-URL file downloads
    admin/                           Operava staff surface
      page.tsx                       Portfolio overview
      customers/                     Customers, invites, new projects
      projects/[projectId]/          Project control center
    api/mcp/[[...key]]/              Operava MCP (streamable HTTP)
  lib/portal/
    authz.ts transitions.ts         Pure authorization + state machines
    validation.ts                   zod schemas shared by UI and MCP
    services/                       The one write path (authorize→validate→
                                    mutate→audit→return state)
    reads/                          customer.ts (RLS) · internal.ts (service)
    serialize.ts                    Customer vs internal view models
    audit.ts notify.ts             Audit trail + customer notifications
    mcp/                            Tool registry, key auth, idempotency
  proxy.ts                          Session refresh for /portal + /admin
supabase/migrations/                Baseline (live export) + v1 extensions
tests/                              unit/ (vitest) + rls/ (real Postgres)
```

- **One source of truth.** UI, portal and MCP all call `lib/portal/services/*`,
  so authorization and business rules cannot diverge between them.
- **Two database clients.** Customer reads use a cookie-bound client (RLS is
  load-bearing); the service layer uses a service-role client after an explicit
  authorization decision. Column-level grants keep internal fields off the
  customer API role even on a direct PostgREST call.
- **Audit + idempotency.** Every mutation records an `activity_log` entry with
  actor type (internal / customer / mcp / system); MCP writes are idempotent by
  key.

### Portal commands

```bash
npm run test         # unit tests (vitest)
npm run test:rls     # RLS integration — spins up a scratch Postgres and
                     # applies the real migrations (skips if none available)
npm run test:all     # both
```

### Configuration

The portal needs four variables (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), and
`OPERAVA_MCP_KEY` (server-only). Without them the marketing site is unaffected
and the portal shows a "not configured" state. Customer notifications reuse the
existing `RESEND_API_KEY`.

## Where leads go

Every submission is normalised into a single `Lead` shape
(`src/lib/leads.ts`) and fanned out to whatever is configured:

1. **Server log — always on.** One JSON line prefixed `operava.lead`. With zero
   configuration no lead is ever lost; it is recoverable from the platform's
   log stream.
2. **Email** — via Resend's REST API when `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`
   and `LEAD_FROM_EMAIL` are all set. Replies go to the prospect.
3. **Webhook** — `LEAD_WEBHOOK_URL` receives the same JSON object. This is the
   seam for Growth Engine, a CRM, Zapier or n8n later.

Delivery failures are logged and never surfaced to the prospect.

`POST /api/leads` accepts the same shape over JSON for anything external.
Gate it with `LEAD_API_TOKEN` before pointing something real at it.

## Booking

`/book` qualifies first (company, operation, scope), then hands off to
scheduling. **No fake availability is ever rendered.**

The scheduler defaults to the live Operava Discovery Call:

```
https://calendly.com/alexpaisley-operavallc/30min
```

- That default is in `src/lib/site.ts`, so the picker works on a fresh deploy
  with no environment configuration. It used to default to `""`, which meant any
  deploy missing `NEXT_PUBLIC_BOOKING_URL` silently degraded every booking CTA
  on the site into "we'll email you" — the flow still completed, nobody could
  pick a time, and nothing said so.
- `NEXT_PUBLIC_BOOKING_URL` still overrides it, for a staging deploy that should
  not book real calls.
- If the override is ever set to an empty string, the confirmation page falls
  back to promising a human follow-up rather than rendering fake availability.

## Anti-spam

Three layers, ordered so a real prospect is never silently dropped:

1. **Honeypot** — a hidden field no human sees. The only check that discards a
   submission, because a filled hidden field is unambiguous.
2. **IP throttle** — best effort, per instance.
3. **Dwell time** — submissions faster than 1.2s are _flagged_, not dropped.
   They still reach the inbox with a `[check]` subject prefix.

Validation runs before the dwell heuristic so a real person always gets real
field errors rather than a fake success.

## Analytics

`src/lib/analytics.ts` emits to whatever is on the page — GTM `dataLayer`,
Plausible, or `gtag` — with no vendor SDK. Adding a provider is a script tag.

Events: `cta_clicked`, `booking_started`, `booking_submitted`,
`software_request_started`, `software_request_submitted`.

## Configuration

Copy `.env.example` to `.env.local`. Nothing in it is required to run the site.

## Domains and SEO

The canonical production host is **`https://www.operava-systems.com`**.

Everything a search engine reads — the canonical tag on each page, the sitemap,
robots.txt, the Open Graph URLs and the JSON-LD `@id`s — is derived from
`site.url` in `src/lib/site.ts`, which the root layout feeds to `metadataBase`.
There is one place to change the domain, and it defaults to the canonical host,
so a deploy with no environment configuration is already correct.

`NEXT_PUBLIC_SITE_URL` still overrides it for a preview or staging deploy that
should point at itself. Three values are _not_ honoured — the retired
`operavallc.com`, its www form, and the bare `operava-systems.com` apex — because
each is this same site under a name that must not appear in metadata. They are
corrected back to the canonical host rather than trusted.

That distinction is the whole reason this section exists. The site previously
told Google it lived on `operavallc.com`: the fallback in `site.ts` named the old
domain, production never set `NEXT_PUBLIC_SITE_URL`, and so every page — while
returning 200 and crawling fine — self-canonicalised onto a host Search Console
was not indexing. Nothing failed loudly. `tests/unit/seo.test.ts` now fails if
any of it regresses.

### Redirects

`next.config.ts` permanently redirects (308, path and query preserved) to the
canonical host from `operavallc.com`, `www.operavallc.com` and the
`operava-systems.com` apex.

These only fire for requests that actually reach this app. Whichever of those
hostnames you want redirected must be attached to this deployment in the hosting
provider and pointed here in DNS — otherwise the rule never runs and the old
domain keeps serving whatever it serves today. If the platform already does
apex → www at the edge, the in-app rule is simply a harmless second line.

### Still configured outside this repo

- **DNS / hosting.** `operavallc.com` and `operava-systems.com` must both resolve
  to this deployment for the redirects above to apply.
- **Search Console.** Verify the `www.operava-systems.com` property, submit
  `https://www.operava-systems.com/sitemap.xml`, and — once the old domain
  redirects — use the Change of Address tool from the `operavallc.com` property.
  Reindexing is Google's schedule, not ours.

## Accessibility & progressive enhancement

- Every form works without JavaScript: the booking form renders all three
  panels and submits in one go when scripting is unavailable.
- Field errors are wired with `aria-invalid` / `aria-describedby`, plus a
  focusable error summary that jumps to the offending field.
- Skip link, keyboard-navigable mobile menu, `prefers-reduced-motion`
  respected throughout.
