/**
 * Objection handling, in the order it actually comes up on a call.
 *
 * Five of these questions are also rendered on /pricing, matched by exact
 * question text. If you reword one of the following, update the filter in
 * app/pricing/page.tsx or it will silently drop out of that page:
 *
 *   "How much does custom software cost?"
 *   "Do you replace our current software?"
 *   "How long does a project take?"
 *   "Who owns the software?"
 *   "What happens after launch?"
 */

export type FaqItem = { question: string; answer: string };

export const faqItems: FaqItem[] = [
  {
    question: "How much does custom software cost?",
    answer:
      "Most projects begin around $6,000. Larger systems are scoped based on complexity — number of workflows, integrations, user roles, data migration and how much custom business logic is involved. You get a fixed price for a defined scope before development starts, and anything added later is quoted separately.",
  },
  {
    question: "Do you replace our current software?",
    answer:
      "Not necessarily, and usually not entirely. The best result is often integrating what already works and building only the parts that are genuinely missing. A migration off a working system is expensive, disruptive and rarely the thing that was costing you money — and selling you one to make the project bigger is a bad trade for you and a bad reference for us.",
  },
  {
    question:
      "Can you work with QuickBooks, ServiceTitan, Procore, Jobber or what we already run?",
    answer:
      "That is the normal starting point. We build API and webhook integrations wherever the platform supports them, and QuickBooks, Stripe and Twilio are ones we work with regularly. For anything else — ServiceTitan, Procore, Buildertrend, Jobber, an estimating package, an in-house database — we check what its API actually allows during discovery, before it becomes an assumption in a scope document. Where a system genuinely has no usable API, we say so and we look at what can be done around it.",
  },
  {
    question: "We are not a landscaping company. Do you only work with one industry?",
    answer:
      "No. The work is with established service and contracting businesses generally — trades, field service, property services, specialty contractors. The founder's own operating experience came from a home-service business, which is why that language shows up on this site, but nothing we build is specific to a trade. The problem we work on is the shape of the operation: crews in the field, an office coordinating them, money that has to be costed and billed accurately, and several systems that each hold part of the truth.",
  },
  {
    question: "How much of our industry do you have to learn first?",
    answer:
      "Some of it, and that happens during discovery rather than being billed to you as education. What we do not have to learn is how this kind of operation fails — where information gets re-entered, where estimates lose their context, where a change order goes missing between the field and the invoice. Those repeat across trades, and they are usually where the money is.",
  },
  {
    question: "Is this just another CRM?",
    answer:
      "No. The entire reason to build custom software is the workflows generic products handle badly: your pricing rules, your crew or dispatch structure, your change-order process, your reporting. Often the work is not a new system at all — it is the layer between the systems you already pay for. If a standard product covered it, we would tell you to buy one.",
  },
  {
    question: "How long does a project take?",
    answer:
      "It depends on scope. A focused system — one workflow, a couple of integrations — typically runs several weeks. Larger builds spanning sales, operations and accounting run longer. You get a milestone schedule during scoping, not a number designed to win the deal.",
  },
  {
    question: "Who owns the software?",
    answer:
      "Your company owns its business data and the custom deliverables built for you. Operava retains ownership of the reusable frameworks, libraries, infrastructure and pre-existing technology used to build the system. Exact terms are defined in the project agreement, and we go through them before you sign.",
  },
  {
    question: "What happens after launch?",
    answer:
      "Hosting, maintenance, monitoring, bug fixes and support continue through a monthly support plan starting at $200/month. New features and expanded scope are quoted separately as you need them.",
  },
  {
    question: "Can you build mobile apps?",
    answer:
      "Yes, where the project justifies it. In practice a well-built mobile web interface handles most field workflows, works on every device your team already owns, and updates without an app store. We recommend a native app when there is a real reason for one — offline requirements, device hardware, background location.",
  },
];
