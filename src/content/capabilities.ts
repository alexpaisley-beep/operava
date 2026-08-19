/**
 * What we're capable of building. Deliberately framed as capability, not as a
 * package — no project includes all of this, and the copy says so out loud.
 *
 * Ordered and titled by BUSINESS PROBLEM rather than by product category. An
 * owner is not shopping for "a CRM" or "an integration"; they are trying to
 * stop paying somebody to retype a change order. The summary line names the
 * problem, the points name what actually gets built.
 *
 * One honesty rule on the named systems below: naming QuickBooks, ServiceTitan,
 * Jobber, Procore or Buildertrend here is a statement that we build against
 * their APIs, not that a connector is sitting on a shelf. What any given
 * platform's API genuinely allows gets checked during discovery, before it
 * becomes an assumption in a scope document — the FAQ says the same thing.
 */

export type Capability = {
  id: string;
  index: string;
  title: string;
  summary: string;
  points: string[];
};

export const capabilities: Capability[] = [
  {
    id: "connect",
    index: "01",
    title: "Connect what you already run",
    summary:
      "Your field software, your accounting and your spreadsheets hold the same information, and none of them share it. We move it between them automatically, in both directions.",
    points: [
      "QuickBooks, so the books stay reconciled without anyone retyping",
      "Field, service and project software — Jobber, ServiceTitan, Procore, Buildertrend and similar",
      "Stripe and card, ACH or stored payment methods",
      "Twilio for SMS, call routing and notifications",
      "Email, calendars and the line-of-business tools nobody is giving up",
      "REST APIs and webhooks in both directions, with retries and reconciliation",
    ],
  },
  {
    id: "automate",
    index: "02",
    title: "Automate the manual handoffs",
    summary:
      "The steps that only happen because someone remembers them: re-entry, follow-ups, notifications, document handling and the monthly reconciliation nobody wants.",
    points: [
      "The same information entered once instead of in three systems",
      "Estimate and invoice follow-up that stops the moment someone replies",
      "Appointment, service and renewal reminders that send themselves",
      "Internal handoffs between office, sales, PMs and the field",
      "Documents generated, filed and attached to the right job",
      "Lead routing by service line, territory or value",
    ],
  },
  {
    id: "field",
    index: "03",
    title: "Field-to-office operations",
    summary:
      "A change called in from a jobsite should not need three people to become a schedule change, a change order and an invoice line.",
    points: [
      "A field view built for a phone in a truck, not a desktop",
      "Job status that updates the office without a phone call",
      "Photos, notes and documentation attached to the job, not to a phone",
      "Scheduling and dispatch across crews, techs and service lines",
      "Recurring and contract work that survives a reschedule",
      "Day sequencing, routing and crew assignment",
    ],
  },
  {
    id: "estimating",
    index: "04",
    title: "Estimating & change orders",
    summary:
      "Your pricing rules encoded properly, and the context of the estimate carried into the job instead of being rebuilt from memory once the work is awarded.",
    points: [
      "Pricing logic based on your measurements, tiers and modifiers",
      "Templates for the work you quote every week",
      "Multi-option proposals a customer can actually understand",
      "Approvals before anything goes out the door",
      "Digital acceptance and signature capture",
      "Change orders priced, approved, scheduled and billed as one flow",
    ],
  },
  {
    id: "internal-tools",
    index: "05",
    title: "Internal tools & custom CRM",
    summary:
      "The spreadsheet that quietly became a system, turned into software your team can actually run on — with permissions, history and no risk of somebody sorting one column.",
    points: [
      "Customer, property and site records modelled the way your company thinks",
      "Custom fields and statuses for the things your team actually tracks",
      "The workflow no product supports, built as its own tool",
      "Roles and permissions, so the right people see the right records",
      "History and audit trail instead of a version called final-v3",
      "Contracts, service agreements and renewal dates in one place",
    ],
  },
  {
    id: "portals",
    index: "06",
    title: "Customer self-service",
    summary:
      "When was I serviced, what did I approve, what do I owe. Every one of those is currently a staffed phone call.",
    points: [
      "Service history, upcoming visits and project status",
      "Estimates and change orders to review, approve and sign",
      "Invoices and online payment",
      "Service requests that land in your workflow, not an inbox",
      "Documents, photos and site details",
      "Lives inside your existing website or alongside it — customers see one company, not two systems",
    ],
  },
  {
    id: "reporting",
    index: "07",
    title: "Job costing & reporting",
    summary:
      "Numbers reconciled once by the system, instead of assembled by hand out of three tools at the end of every month.",
    points: [
      "Job costing against estimated hours and materials",
      "Margin by job, service line, crew and customer",
      "Revenue, recurring work and contract renewals",
      "Close rates by lead source and estimator",
      "Field productivity and schedule adherence",
      "Reports built on one set of figures, not three that nearly agree",
    ],
  },
  {
    id: "ai",
    index: "08",
    title: "AI where it removes real work",
    summary:
      "Applied to specific jobs where it saves measurable hours — reading documents, handling calls, drafting replies. Not bolted on so the word appears on a page.",
    points: [
      "Pulling structured data out of invoices, POs, plans and submittals",
      "Turning a messy phone call or email into a structured lead or request",
      "AI phone answering that qualifies, books and hands off to a person",
      "Drafting estimates, follow-ups and customer replies for review",
      "Classifying and routing inbound requests",
      "Consequential actions held for a human to approve, always",
    ],
  },
];
