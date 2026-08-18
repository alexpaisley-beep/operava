/**
 * What we're capable of building. Deliberately framed as capability, not as a
 * package — no project includes all of this, and the copy says so out loud.
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
    id: "crm",
    index: "01",
    title: "Custom CRM",
    summary:
      "Customer records that match how your company thinks about customers — not how a software vendor decided to model them.",
    points: [
      "Properties, contacts and job history under one customer",
      "Communication log tied to the customer, not somebody's inbox",
      "Custom fields for the things your team actually tracks",
      "Per-customer pricing, contracts and renewal dates",
      "Notes crews can read and office staff can trust",
    ],
  },
  {
    id: "scheduling",
    index: "02",
    title: "Scheduling & Crew Operations",
    summary:
      "Recurring maintenance, one-off projects and multiple crews on the same board — without a spreadsheet holding it together.",
    points: [
      "Recurring service schedules that survive weather and reschedules",
      "Crew assignment by skill, equipment or service line",
      "A crew view built for a phone in a truck, not a desktop",
      "Job status that updates the office without a phone call",
      "Route order and day sequencing",
    ],
  },
  {
    id: "estimating",
    index: "03",
    title: "Estimating & Quoting",
    summary:
      "Your pricing rules encoded properly, so estimates stop depending on who is building them.",
    points: [
      "Pricing logic based on your measurements, tiers and modifiers",
      "Templates for the work you quote every week",
      "Multi-option proposals customers can actually understand",
      "Approval steps before anything goes out the door",
      "Digital acceptance and signature capture",
    ],
  },
  {
    id: "portals",
    index: "04",
    title: "Customer Portals",
    summary:
      "A place customers can answer their own questions, so the office stops answering the same five calls.",
    points: [
      "Service history and upcoming visits",
      "Estimates to review, approve and sign",
      "Invoices and online payment",
      "Service requests that land in your workflow, not an inbox",
      "Documents, photos and property details",
      "Lives inside your existing website or alongside it — customers see one company, not two systems",
    ],
  },
  {
    id: "integrations",
    index: "05",
    title: "Integrations",
    summary:
      "Keep the systems that already work. We connect them instead of replacing them for the sake of it.",
    // Jobber leads deliberately. "We already run on Jobber" is the most common
    // reason an established operator stops reading, and the answer is that they
    // do not have to rip it out.
    points: [
      "Jobber and the field tools your crews already know",
      "QuickBooks for accounting that stays reconciled",
      "Stripe for cards, ACH and stored payment methods",
      "Twilio for SMS, call routing and notifications",
      "Email, calendars and existing line-of-business tools",
      "REST APIs and webhooks in both directions",
    ],
  },
  {
    id: "automation",
    index: "06",
    title: "Automation",
    summary:
      "The repetitive admin your staff does because the software will not. Encoded once, then it just happens.",
    points: [
      "Estimate follow-up sequences that stop when someone replies",
      "Lead routing by service line, territory or value",
      "Appointment and service reminders",
      "Renewal and seasonal campaign triggers",
      "Internal handoffs between office, sales and crews",
    ],
  },
  {
    id: "ai",
    index: "07",
    title: "AI Tools",
    summary:
      "Applied where it removes real work. Not bolted on so we can put the word on a slide.",
    points: [
      "AI receptionist that answers, qualifies and books",
      "Intake that turns a messy phone call into a structured lead",
      "Internal assistants over your own operational data",
      "Drafting for estimates, follow-ups and customer replies",
      "Classification and routing for inbound requests",
    ],
  },
  {
    id: "reporting",
    index: "08",
    title: "Reporting & Dashboards",
    summary:
      "The numbers you actually run the company on — not a generic CRM dashboard nobody opens.",
    points: [
      "Revenue by service line, crew and property type",
      "Job costing against estimated hours",
      "Close rates by lead source and estimator",
      "Recurring revenue and contract renewals",
      "Crew productivity and schedule adherence",
    ],
  },
];
