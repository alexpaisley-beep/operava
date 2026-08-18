/**
 * One lead shape for every form on the site.
 *
 * Both the discovery-call form and the software-request form normalise into
 * this object, so whatever we point it at later (Growth Engine, a CRM, a
 * database) receives a single, stable contract.
 */

export const LEAD_SOURCES = ["discovery_call", "software_request"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const COMPANY_SIZES = [
  "1–10 people",
  "11–25 people",
  "26–50 people",
  "51–100 people",
  "100+ people",
] as const;

export const CREW_COUNTS = [
  "1–2 crews",
  "3–5 crews",
  "6–10 crews",
  "11–20 crews",
  "20+ crews",
] as const;

export const BUDGET_RANGES = ["$5k–$10k", "$10k–$25k", "$25k+", "Not sure yet"] as const;

export const TIMELINES = [
  "As soon as possible",
  "Next 1–3 months",
  "Next 3–6 months",
  "Planning ahead / exploring",
] as const;

export const CONTACT_METHODS = ["Phone call", "Email", "Text message"] as const;

export interface Lead {
  /** Envelope — how and where this lead arrived. */
  id: string;
  source: LeadSource;
  page: string;
  cta: string;
  submittedAt: string;

  /** Identity. */
  name: string;
  business: string;
  email: string;
  phone: string;
  website: string;

  /** Scale of the operation. */
  companySize: string;
  crewCount: string;

  /** Current stack. */
  currentSoftware: string;
  integrations: string;

  /** The actual problem. */
  painPoints: string;
  desiredSystem: string;

  /** Commercial. */
  budget: string;
  timeline: string;
  preferredContact: string;

  /** Anything else. */
  notes: string;

  /** Request metadata, best effort. */
  meta: {
    referrer: string;
    userAgent: string;
    /** Heuristic markers, e.g. "fast_submit". Never a reason to discard a lead. */
    flags: string[];
  };
}

export interface DeliveryResult {
  delivered: string[];
  failed: string[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LABELS: [keyof Lead, string][] = [
  ["name", "Name"],
  ["business", "Company"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["website", "Website"],
  ["companySize", "Company size"],
  ["crewCount", "Crews"],
  ["currentSoftware", "Current software"],
  ["integrations", "Depends on integrations"],
  ["painPoints", "What is not working"],
  ["desiredSystem", "What they wish existed"],
  ["budget", "Budget"],
  ["timeline", "Timeline"],
  ["preferredContact", "Preferred contact"],
  ["notes", "Notes"],
];

function renderEmail(lead: Lead): { subject: string; html: string; text: string } {
  const kind =
    lead.source === "discovery_call" ? "Discovery call request" : "Custom software request";
  // Flagged leads still arrive; the subject just says so, so they can be
  // filtered rather than lost.
  const prefix = lead.meta.flags.length > 0 ? "[check] " : "";
  const subject = `${prefix}${kind} — ${lead.business || lead.name}`;

  const rows = LABELS.filter(([key]) => {
    const value = lead[key];
    return typeof value === "string" && value.length > 0;
  });

  const text = [
    subject,
    "",
    ...rows.map(([key, label]) => `${label}: ${String(lead[key])}`),
    "",
    `Source: ${lead.source}`,
    `Page: ${lead.page}`,
    `CTA: ${lead.cta}`,
    `Submitted: ${lead.submittedAt}`,
    `Lead ID: ${lead.id}`,
    ...(lead.meta.flags.length > 0 ? [`Flags: ${lead.meta.flags.join(", ")}`] : []),
  ].join("\n");

  const html = `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55;color:#101a2b">
  <h2 style="margin:0 0 4px;font-size:17px;color:#1e3a66">${escapeHtml(kind)}</h2>
  <p style="margin:0 0 20px;color:#6b7789;font-size:13px">${escapeHtml(lead.submittedAt)}</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px">
    ${rows
      .map(
        ([key, label]) =>
          `<tr>
      <td style="padding:8px 16px 8px 0;vertical-align:top;color:#6b7789;font-size:13px;white-space:nowrap;border-bottom:1px solid #e2e6ec">${escapeHtml(label)}</td>
      <td style="padding:8px 0;vertical-align:top;border-bottom:1px solid #e2e6ec;white-space:pre-wrap">${escapeHtml(String(lead[key]))}</td>
    </tr>`,
      )
      .join("\n    ")}
  </table>
  <p style="margin:20px 0 0;color:#6b7789;font-size:12px">
    source ${escapeHtml(lead.source)} &middot; page ${escapeHtml(lead.page)} &middot; cta ${escapeHtml(lead.cta)}<br/>
    lead id ${escapeHtml(lead.id)}
  </p>
</div>`;

  return { subject, html, text };
}

/**
 * Fan the lead out to whichever channels are configured.
 *
 * Nothing here is allowed to throw: a delivery problem must never cost us the
 * lead or show the prospect an error. Every submission is written to the
 * server log first, so even with zero configuration the lead is recoverable
 * from the platform's log stream.
 */
export async function deliverLead(lead: Lead): Promise<DeliveryResult> {
  const delivered: string[] = [];
  const failed: string[] = [];

  // 1. Structured log — always on, always the backstop.
  console.log(`operava.lead ${JSON.stringify(lead)}`);
  delivered.push("log");

  // 2. Webhook — Growth Engine, or any CRM/Zapier endpoint pointed at the same URL.
  //
  // HMAC-SHA256 over the EXACT bytes we send, plus a timestamp. Two details, both
  // of which were wrong before and would have rejected every single lead:
  //
  //   1. The header carries a SIGNATURE, not the secret. Sending the raw secret
  //      means anyone who captures one request owns the credential forever, and
  //      Growth Engine — which verifies an HMAC — rejected it outright.
  //   2. `X-Operava-Timestamp` is required, and is part of the signed message.
  //      Without it the receiver cannot bound replay, so it refuses the request.
  //
  // `body` is serialised ONCE and both signed and sent. Signing a re-serialised
  // object cannot work: JSON.stringify does not round-trip byte-for-byte (key
  // order, unicode escapes), so the digest would drift from the payload for
  // reasons nobody can reproduce afterwards.
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    const body = JSON.stringify(lead);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.LEAD_WEBHOOK_SECRET;
      if (secret) {
        const timestamp = String(Date.now());
        const { createHmac } = await import("node:crypto");
        const digest = createHmac("sha256", secret)
          .update(`${timestamp}.`)
          .update(Buffer.from(body, "utf8"))
          .digest("hex");
        headers["X-Operava-Signature"] = `sha256=${digest}`;
        headers["X-Operava-Timestamp"] = timestamp;
      }
      const response = await fetch(webhook, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) delivered.push("webhook");
      else failed.push(`webhook:${response.status}`);
    } catch {
      failed.push("webhook:network");
    }
  }

  // 3. Email notification via Resend's REST API (no SDK needed).
  const resendKey = process.env.RESEND_API_KEY;
  const notify = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (resendKey && notify && from) {
    try {
      const { subject, html, text } = renderEmail(lead);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: notify.split(",").map((address) => address.trim()),
          reply_to: lead.email,
          subject,
          html,
          text,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) delivered.push("email");
      else failed.push(`email:${response.status}`);
    } catch {
      failed.push("email:network");
    }
  }

  if (failed.length > 0) {
    console.error(`operava.lead.delivery_failed ${lead.id} ${failed.join(",")}`);
  }

  return { delivered, failed };
}
