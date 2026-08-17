# Operava site → Growth Engine lead integration

This document is the **contract** between the Operava marketing site and Growth
Engine. The site captures a lead; Growth Engine turns it into a *software
request* and owns everything after that — matching it to a company we may already
know, deduplicating it, and moving it through the sales pipeline.

The site deliberately knows **nothing** about Growth Engine's database. It sends a
stable JSON payload to a URL. That is the whole coupling.

> **Status: implemented on both sides.** The forwarding is live in
> `src/lib/leads.ts` (`deliverLead`), and Growth Engine's receiving end is built
> and tested. This document is now the reference for the contract, not a
> to-do list — an earlier revision was written while this repo still contained
> only a README and described a forwarder to add. Nothing needs to be added; set
> the two environment variables below and leads flow.

---

## The flow

```
visitor submits a form
        │
        ▼
POST /api/leads                     (this site — already the normalized Lead shape)
        │
        ├─ store / email as today
        │
        └─ forward to LEAD_WEBHOOK_URL, HMAC-signed
                 │
                 ▼
        POST /api/operava/leads     (Growth Engine)
                 │
                 ├─ verify signature + timestamp
                 ├─ validate + map onto a SoftwareRequest
                 ├─ deduplicate (idempotency key)
                 ├─ link to an existing Prospect if we know the company
                 └─ 202 Accepted
```

---

## Environment variables

### On the Operava site (Vercel)

| Variable | Value | Notes |
|---|---|---|
| `LEAD_WEBHOOK_URL` | `https://<growth-engine-host>/api/operava/leads` | The Growth Engine ingestion endpoint. |
| `LEAD_WEBHOOK_SECRET` | a long random string | **Must be byte-identical** to `OPERAVA_WEBHOOK_SECRET` in Growth Engine. |

### On Growth Engine (Railway)

| Variable | Value |
|---|---|
| `OPERAVA_WEBHOOK_SECRET` | the same long random string |

Generate one with:

```bash
openssl rand -hex 32
```

Both are **server-side only**. Never prefix the secret with `NEXT_PUBLIC_` — that
would ship it in the client bundle and let anyone forge leads into the sales
pipeline.

---

## Authentication

HMAC-SHA256 over the **raw request body**, with a timestamp to bound replay.

Two headers:

| Header | Value |
|---|---|
| `X-Operava-Signature` | `sha256=<hex digest>` |
| `X-Operava-Timestamp` | `Date.now()` as a string (ms since epoch) |

The signed message is `` `${timestamp}.` `` followed by the raw body bytes:

```
digest = HMAC_SHA256(secret, `${timestamp}.` + rawBody)
```

Two details that matter:

- **Sign the raw body string, not a re-serialised object.** `JSON.stringify` does
  not round-trip byte-for-byte (key order, unicode escapes), so signing a parsed
  object produces signatures that fail intermittently for reasons nobody can
  reproduce. Build the body string once, sign *that*, send *that*.
- **Requests older than 5 minutes are rejected.** A captured request cannot be
  replayed later.

---

## Where the forwarding lives

`src/lib/leads.ts` → `deliverLead()`. Every form on the site and `POST /api/leads`
funnel through that one function, so there is exactly **one** lead path and no
duplicate forwarding.

It fans out to three channels, in order:

1. **Structured log** — always on, always first. With zero configuration every
   lead is still recoverable from the platform log stream as a single JSON line
   prefixed `operava.lead`.
2. **Webhook** (Growth Engine) — HMAC-signed, see below.
3. **Email** via Resend, when `RESEND_API_KEY` / `LEAD_NOTIFY_EMAIL` /
   `LEAD_FROM_EMAIL` are all set.

Nothing in it throws. A Growth Engine outage produces `failed: ["webhook:network"]`
in the result and an `operava.lead.delivery_failed` log line — the visitor still
sees success, and the lead still exists in the log and the notification email. A
delivery problem is ours, not theirs.

The body is serialised **once** and both signed and sent, because `JSON.stringify`
does not round-trip byte-for-byte (key order, unicode escapes) and signing a
re-serialised object would drift from the payload intermittently.

## Payload

Every field is optional except that **one of** company/name must be present
**and** one of email/phone. Growth Engine needs something to call the record and
some way to reply; anything less is not a lead.

```jsonc
// The EXACT shape src/lib/leads.ts sends. This is the contract.
{
  "id": "a1b2c3d4-…",                  // crypto.randomUUID() — the idempotency key
  "source": "software_request",        // or "discovery_call"
  "page": "/request-software",
  "cta": "Request a build",
  "submittedAt": "2026-08-17T14:00:00.000Z",

  "name": "John Fields",
  "business": "Evergreen Grounds Co",
  "email": "john@evergreengrounds.test",
  "phone": "608-555-0134",
  "website": "https://evergreengrounds.test",

  "companySize": "26–50 people",
  "crewCount": "6–10 crews",

  "currentSoftware": "Jobber and QuickBooks",
  "integrations": "QuickBooks, Stripe",

  "painPoints": "Snow billing lives in spreadsheets and nothing talks to QuickBooks.",
  "desiredSystem": "One system that handles recurring routes and snow events",

  "budget": "$10k–$25k",
  "timeline": "Next 1–3 months",
  "preferredContact": "Phone call",
  "notes": "Busy until October",

  "meta": { "referrer": "https://www.google.com/", "userAgent": "…", "flags": [] }
}
```

### How Growth Engine maps it

| Site field | Growth Engine field |
|---|---|
| `business` (or `company`/`companyName`) | `companyName` |
| `name` | `contactName` |
| `painPoints` (or `problem`/`pain`/`message`) | `problem` |
| `companySize` + `crewCount` | `companySize`, joined |
| `integrations` | `operationalNotes` |
| `preferredContact`, `meta.referrer` | appended to `notes` |
| `page` (or `sourceUrl`/`pageUrl`) | `sourceUrl` |
| `cta` | `sourceCta` |
| `budget` | `budgetRange` |
| `id` | idempotency key |
| everything, verbatim | `rawSubmission` |

**`painPoints` is the single most valuable field.** A submission with a described
problem is a sales conversation; one without is a name in a list. Growth Engine's
mapper originally aliased only the singular `painPoint`, which meant this arrived
`null` on every website lead — that is fixed, and pinned by a test that uses this
exact payload as its fixture.

Field names are matched **tolerantly** on purpose: losing a real enquiry because
the site renamed a field is far worse than an imperfect mapping, and the complete
raw body is stored either way. If you do rename one, the contract test in Growth
Engine (`tests/integration/operavaLeadIngestion.test.js`) is where it will show up.

---

## Responses

| Status | Meaning | Should the site retry? |
|---|---|---|
| `202` | Accepted. `{ ok, duplicate, softwareRequestId, warnings }` | No |
| `401` | Signature/timestamp rejected | No — fix the secret |
| `422` | Payload has no usable identity | No — it will never succeed |
| `503` | `OPERAVA_WEBHOOK_SECRET` not set on Growth Engine | Yes, later |
| `5xx` | Unexpected | Yes, with backoff |

A **duplicate delivery also returns 202** with `duplicate: true` and the *same*
`softwareRequestId`. Retry freely — it cannot create a second request, and it will
not overwrite work already done on the first.

---

## Idempotency

Growth Engine derives a key from `id` when the site sends one, otherwise from a
hash of email + phone + company + submission minute.

**Send a stable `id`.** It is the only thing that survives the site retrying with
a slightly different body, and it makes deduplication exact rather than heuristic.

---

## Verifying a deployment

```bash
curl https://<growth-engine-host>/api/operava/leads/health
# { "ok": true, "ingestionConfigured": true, ... }
```

`ingestionConfigured: false` means `OPERAVA_WEBHOOK_SECRET` is missing on Growth
Engine and every lead will be refused with 503. Check that first.

End-to-end, from a terminal:

```bash
SECRET='...'; URL='https://<growth-engine-host>/api/operava/leads'
BODY='{"id":"smoke-1","company":"Smoke Test Co","email":"smoke@example.test","problem":"testing"}'
TS=$(node -e 'console.log(Date.now())')
SIG=$(node -e "const c=require('crypto');console.log('sha256='+c.createHmac('sha256',process.argv[1]).update(process.argv[2]+'.').update(Buffer.from(process.argv[3],'utf8')).digest('hex'))" "$SECRET" "$TS" "$BODY")
curl -i -X POST "$URL" -H 'Content-Type: application/json' \
  -H "X-Operava-Signature: $SIG" -H "X-Operava-Timestamp: $TS" -d "$BODY"
```

Expect `202`. Run it twice — the second should return `"duplicate": true` with the
same id.

---

## Positioning (do not drift)

The site's message is fixed and should not be softened into generic SaaS copy:

- **Custom software for landscaping companies that have outgrown generic tools.**
- Custom builds **starting at $6,000**.
- Hosting, maintenance and support **from $200/month** — described as ongoing
  support, not as "a subscription".

Operon and CallPilot may be shown as **things Alex has actually built**, i.e.
evidence of capability. They are not the product being sold here.

No fabricated testimonials, customers, results, metrics or case studies. There are
no Operava custom-project references yet, and inventing one is unrecoverable.
