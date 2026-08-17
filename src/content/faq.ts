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
      "Not necessarily, and usually not entirely. The best result is often integrating what already works and replacing only the parts that do not. Ripping out a working accounting system to sell a bigger project is a bad trade for you and a bad reference for us.",
  },
  {
    question: "Can you integrate with QuickBooks, Stripe, or our current CRM?",
    answer:
      "We build API and webhook integrations wherever the service supports them. QuickBooks, Stripe and Twilio are systems we work with regularly. For anything else, we check what its API actually allows during discovery — before it becomes an assumption in a scope document.",
  },
  {
    question: "Is this just another CRM?",
    answer:
      "No. The entire reason to build custom software is the workflows generic products handle badly: your estimating rules, your crew structure, your service lines, your reporting. If a standard CRM covered it, we would tell you to buy one.",
  },
  {
    question: "How long does a project take?",
    answer:
      "It depends on scope. A focused system — one department, a couple of integrations — typically runs several weeks. Larger builds spanning sales, operations and accounting run longer. You get a milestone schedule during scoping, not a number designed to win the deal.",
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
      "Yes, where the project justifies it. In practice a well-built mobile web interface handles most crew and field workflows, works on every device your team already owns, and updates without an app store. We recommend a native app when there is a real reason for one — offline requirements, device hardware, background location.",
  },
];
