/**
 * The primary pain narrative: the company already has software, and the
 * important workflows still happen around it.
 *
 * Two rules for anything added here:
 *
 *   1. Describe a SCENARIO, not the reader. We do not know which of these is
 *      true of the person on the page, and asserting all of them reads as a
 *      script rather than as recognition. The section lead says out loud that
 *      most operations recognise three or four, not eight.
 *   2. Keep it trade-neutral in the noun and specific in the detail. "A change
 *      gets texted from the jobsite" works for an electrician, a roofer and a
 *      landscaper. "The mowing schedule" works for one of them.
 */

export type PainPoint = { title: string; body: string };

export const painPoints: PainPoint[] = [
  {
    title: "A change gets texted in from the field",
    body: "Then someone updates the schedule, someone tells the customer, and someone adds it to the invoice. Three people, or none.",
  },
  {
    title: "Your office staff are the integration",
    body: "Information moves between your systems because a person carries it. That is a salary, and a single point of failure when they are out.",
  },
  {
    title: "Estimates lose their context once the job is won",
    body: "The assumptions, measurements and exclusions stay in the estimate. The crew gets a work order without any of them.",
  },
  {
    title: "Project managers keep their own spreadsheets",
    body: "Because the software tracks what it was built to track, not what they are actually accountable for on Friday.",
  },
  {
    title: "A change order takes five manual steps",
    body: "Approve it, reschedule it, order materials, bill it, tell the customer. Any one of them can be missed, and eventually one is.",
  },
  {
    title: "Job costing has to be reconciled",
    body: "Hours in one system, materials in another, invoices in a third. By the time the numbers agree, the job is two months gone.",
  },
  {
    title: "Photos and documentation live in four places",
    body: "Someone's phone, a text thread, a shared drive and the folder in the truck. Finding one later is a project.",
  },
  {
    title: "Customer updates depend on someone remembering",
    body: "Nothing sends them automatically, so they go out when the office has a quiet moment — which is never the week it matters.",
  },
];
