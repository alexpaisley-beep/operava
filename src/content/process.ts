export type ProcessStep = {
  index: string;
  title: string;
  summary: string;
  detail: string;
  points: string[];
  note?: string;
};

export const processSteps: ProcessStep[] = [
  {
    index: "01",
    title: "Discovery",
    summary: "We learn how your company actually operates.",
    detail:
      "This is not a feature wishlist meeting. Before anyone talks about screens, we map the way work moves through your business today — including the parts that only exist in somebody's head.",
    points: [
      "How leads arrive and what happens in the first hour",
      "How estimates get built, priced and approved",
      "How work gets scheduled, assigned and resequenced",
      "What crews see, and what they report back",
      "How customers are communicated with, and by whom",
      "How money moves, from invoice to reconciliation",
      "Which systems you already run and what each one is genuinely good at",
      "Every manual workaround your team has invented",
    ],
    note: "The workarounds are the most valuable thing in this list. They are a map of exactly where your software stops.",
  },
  {
    index: "02",
    title: "Scope",
    summary: "We decide what should be built — and what should be left alone.",
    detail:
      "Replacing working software is expensive and rarely improves anything. We separate what is genuinely broken from what simply needs to be connected, then write down the difference.",
    points: [
      "What gets built custom, and why it has to be",
      "What stays where it is and gets integrated instead",
      "What is explicitly out of scope for this phase",
      "Milestones, sequence and what you see at each one",
      "A fixed price for the defined scope",
    ],
    note: "If QuickBooks works, we integrate QuickBooks. If Stripe works, we integrate Stripe. We are not interested in selling you a replacement for something that is already doing its job.",
  },
  {
    index: "03",
    title: "Build",
    summary: "We build in milestones you can see and react to.",
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
    summary: "Deployment, training, and someone who answers when it breaks.",
    detail:
      "Launch is a process, not a date. We move real data, train the people who have to live in the system, and stay on afterwards.",
    points: [
      "Data migration from your current tools",
      "Testing against real jobs before cutover",
      "Training for office staff, sales and crews",
      "Hosting, monitoring and backups",
      "Bug fixes and ongoing support",
      "Improvements as the business changes",
    ],
  },
];
