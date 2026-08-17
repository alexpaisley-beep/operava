# Operava site → Growth Engine lead integration

This document is the **contract** between the Operava marketing site and Growth
Engine. The site captures a lead; Growth Engine turns it into a *software
request* and owns everything after that — matching it to a company we may already
know, deduplicating it, and moving it through the sales pipeline.

The site deliberately knows **nothing** about Growth Engine's database. It sends a
stable JSON payload to a URL. That is the whole coupling.

> **Note on repository state.** At the time of writing, this repository contains
> only a README — the Next.js marketing site described in planning is not present
> here. This document therefore specifies the site side of the integration and
> gives working code to drop in, rather than editing files that do not exist.
> Growth Engine's receiving end is **built, tested and merged**.

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

## Drop-in forwarder

Add to the site's lead handler, after the lead has been stored/emailed. Forwarding
failures must **never** fail the visitor's submission — they already filled the
form in; a webhook problem is ours, not theirs.

```ts
// lib/forwardLeadToGrowthEngine.ts
import crypto from 'node:crypto';

/**
 * Forward a captured lead to Growth Engine.
 *
 * Fire-and-log: a webhook failure must not turn into a visible error for the
 * person who just filled in the form. Growth Engine's endpoint is idempotent, so
 * retrying a lead is always safe.
 */
export async function forwardLeadToGrowthEngine(lead: Record<string, unknown>) {
  const url = process.env.LEAD_WEBHOOK_URL;
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!url || !secret) return { forwarded: false, reason: 'not configured' };

  // Serialise ONCE and sign exactly these bytes.
  const body = JSON.stringify(lead);
  const timestamp = String(Date.now());
  const signature =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(`${timestamp}.`).update(Buffer.from(body, 'utf8')).digest('hex');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Operava-Signature': signature,
        'X-Operava-Timestamp': timestamp,
      },
      body,
      // Growth Engine answers in milliseconds; don't hold the form response.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[lead-webhook] non-2xx', res.status, await res.text().catch(() => ''));
      return { forwarded: false, status: res.status };
    }
    return { forwarded: true, ...(await res.json().catch(() => ({}))) };
  } catch (err) {
    console.error('[lead-webhook] failed', err);
    return { forwarded: false, reason: 'network' };
  }
}
```

Call it from `POST /api/leads`:

```ts
const lead = normalizeLead(await req.json());
await storeLeadAsToday(lead);          // existing behaviour, unchanged
void forwardLeadToGrowthEngine(lead);  // additive; never blocks the response
return Response.json({ ok: true });
```

---

## Payload

Every field is optional except that **one of** company/name must be present
**and** one of email/phone. Growth Engine needs something to call the record and
some way to reply; anything less is not a lead.

```jsonc
{
  "id": "lead_abc123",                    // any stable id — used for idempotency
  "company": "Evergreen Grounds Co",
  "name": "John Fields",
  "email": "john@evergreengrounds.test",
  "phone": "608-555-0134",
  "website": "https://evergreengrounds.test",
  "city": "Madison",
  "state": "WI",

  "companySize": "6 crews, about 26 people",
  "serviceMix": "maintenance, install, irrigation, snow",
  "serviceArea": "Dane County + surrounding",
  "currentSoftware": "Jobber and QuickBooks",

  "problem": "Our snow billing lives in spreadsheets and nothing talks to QuickBooks.",
  "desiredSystem": "One system that handles recurring routes and snow events",
  "desiredOutcome": "Stop re-keying every push",

  "budget": "$10k-15k",
  "timeline": "before next winter",
  "urgency": "planning now",

  "sourceUrl": "https://operava.com/custom-software",
  "cta": "Request a build",
  "submittedAt": "2026-08-17T14:00:00.000Z"
}
```

**Field names are tolerant.** `company`/`companyName`/`business`/`businessName`
are equivalent, as are `problem`/`message`/`painPoint`/`details` and
`sourceUrl`/`pageUrl`/`page`. This is deliberate: losing a real enquiry because
the site renamed a field is far worse than an imperfect mapping, and the complete
raw body is stored on every request either way.

`problem` is the single most valuable field. A submission with a described
problem is a sales conversation; one without is a name in a list.

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
