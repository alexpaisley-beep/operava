/**
 * Capability evidence — systems and platform work, explicitly not client case
 * studies. No invented metrics, no borrowed logos, no fabricated quotes.
 */

export type SystemBuilt = {
  title: string;
  body: string;
  tags: string[];
};

export const systemsBuilt: SystemBuilt[] = [
  {
    title: "AI receptionist and intake",
    body: "Answers inbound calls, qualifies the caller, captures the details a real estimate needs, and books the appointment straight into the schedule.",
    tags: ["Voice", "Lead capture", "Scheduling"],
  },
  {
    title: "Recurring scheduling engine",
    body: "Recurring service plans across multiple crews and service types, with reschedules, seasonal cycles and exceptions that do not corrupt the rest of the calendar.",
    tags: ["Scheduling", "Crew operations"],
  },
  {
    title: "Customer portals",
    body: "Self-service access to service history, estimates, approvals, invoices and payments — the questions that otherwise arrive by phone.",
    tags: ["Portal", "Self-service"],
  },
  {
    title: "Payment and subscription infrastructure",
    body: "Stripe-backed card and ACH processing, stored payment methods, recurring billing and reconciliation that survives contact with accounting.",
    tags: ["Stripe", "Billing"],
  },
  {
    title: "Estimating and proposal workflows",
    body: "Rule-driven pricing, multi-option proposals, internal approvals and digital acceptance, built so pricing does not depend on who is quoting.",
    tags: ["Estimating", "Approvals"],
  },
  {
    title: "Lead pipelines and routing",
    body: "Inbound leads captured, deduplicated, scored and routed by service line and territory, with follow-up that stops when a human replies.",
    tags: ["CRM", "Automation"],
  },
  {
    title: "Route and field workflows",
    body: "Day sequencing, crew assignment and job status reported from the field, so the office knows where work stands without calling the truck.",
    tags: ["Routing", "Mobile"],
  },
  {
    title: "Cross-system API orchestration",
    body: "Keeping several systems of record in agreement — webhooks, retries, idempotency and reconciliation, which is where most integrations quietly fail.",
    tags: ["APIs", "Webhooks", "Integrations"],
  },
];
