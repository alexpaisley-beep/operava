export type ProcessStep = {
  index: string;
  title: string;
  summary: string;
  detail: string;
  points: string[];
  note?: string;
};

/**
 * Four steps, phrased from the customer's side of the table: show us the
 * workflow, we map the problem, we build the missing piece, your team stops
 * babysitting it. The titles stay operational (Discovery / Scope / Build /
 * Launch) because that is what the contract and the invoices call them.
 */
export const processSteps: ProcessStep[] = [
  {
    index: "01",
    title: "Discovery",
    summary: "You walk us through the workflow that is causing the problem.",
    detail:
      "This is not a feature wishlist meeting. Before anyone talks about screens, we map how work actually moves through your business today — including the steps that only exist in somebody's head and the ones nobody has ever written down.",
    points: [
      "How leads and requests arrive, and what happens in the first hour",
      "How estimates get built, priced and approved",
      "How work gets scheduled, assigned and resequenced",
      "What the field sees, and what it reports back",
      "How change orders get approved, scheduled and billed",
      "How customers get updated, and by whom",
      "How money moves, from invoice to job cost to reconciliation",
      "Which systems you already run, and what each one is genuinely good at",
      "Every manual workaround your team has invented",
    ],
    note: "The workarounds are the most valuable thing in this list. They are a map of exactly where your software stops and your staff start.",
  },
  {
    index: "02",
    title: "Scope",
    summary: "We map the problem, and say what it is worth fixing.",
    detail:
      "Replacing working software is expensive and rarely improves anything. We separate what is genuinely broken from what simply needs to be connected, put a number on the manual work each gap is costing, and write down the difference.",
    points: [
      "The manual steps, the disconnected systems and what they cost you",
      "What gets built custom, and why it has to be",
      "What stays where it is and gets integrated instead",
      "What is explicitly out of scope for this phase",
      "Milestones, sequence and what you see at each one",
      "A fixed price for the defined scope",
    ],
    note: "If QuickBooks works, we integrate QuickBooks. If your field software works, we integrate that. We are not interested in selling you a replacement for something already doing its job.",
  },
  {
    index: "03",
    title: "Build",
    summary: "We build the missing piece, in milestones you can see.",
    detail:
      "Work ships in reviewable pieces rather than disappearing for three months. You see the system as it becomes real, while changing direction is still cheap.",
    points: [
      "Milestone reviews on working software, not mockups",
      "Your data and your real workflows used during the build",
      "Integrations tested against live accounts, not sandboxes alone",
      "Changes in scope quoted before they are built, never after",
    ],
    note: "Timelines depend on scope. Focused systems tend to run several weeks. Larger multi-department builds run longer, and we will say so before you sign anything.",
  },
  {
    index: "04",
    title: "Launch & Support",
    summary: "Your team stops babysitting the workflow.",
    detail:
      "Launch is a process, not a date. We move real data, train the people who have to live in the system, and stay on afterwards — because software nobody maintains becomes the next thing your staff work around.",
    points: [
      "Data migration from your current tools",
      "Testing against real jobs before cutover",
      "Training for office staff, PMs, sales and the field",
      "Hosting, monitoring and backups",
      "Bug fixes and ongoing support",
      "Improvements as the business changes",
    ],
  },
];
