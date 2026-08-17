/** Symptoms of a company that has outgrown its software. Concrete, no abstractions. */

export type PainPoint = { title: string; body: string };

export const painPoints: PainPoint[] = [
  {
    title: "The CRM almost works",
    body: "It handles the easy 80%. Your team keeps spreadsheets for the part that actually matters.",
  },
  {
    title: "Scheduling falls apart at scale",
    body: "One crew and one service line is fine. Six crews, recurring maintenance and project work is not.",
  },
  {
    title: "Estimating depends on rules the software has never heard of",
    body: "So your best estimator becomes the bottleneck, and pricing changes depending on who built the quote.",
  },
  {
    title: "The office retypes the same information",
    body: "Out of one system, into another. Every day. Nobody calls it data entry, but that is what it is.",
  },
  {
    title: "Customers call to ask things the portal should answer",
    body: "When was I serviced. What did I approve. What do I owe. Every one of those is a staffed phone call.",
  },
  {
    title: "Reporting never quite matches reality",
    body: "The numbers are close enough to look right and wrong enough that you do not make decisions on them.",
  },
  {
    title: "Your team built workarounds",
    body: "A shared sheet, a naming convention, a person who just knows. That is unpaid software development.",
  },
  {
    title: "You pay for five tools that do not talk",
    body: "Each one is fine on its own. No single workflow runs cleanly from lead to paid invoice.",
  },
];
