/**
 * Representative markets — examples, not a qualifying list.
 *
 * Two rules, because this is the section most likely to drift back into a
 * single-industry pitch or out into meaningless breadth:
 *
 *   1. These are examples of WHERE the problem shows up, never a claim that we
 *      have delivered a project in that trade. Operava has published client
 *      work nowhere (see content/work.ts), so nothing here may imply a
 *      customer, a reference or a track record in a named industry.
 *   2. Every entry has to name a concrete operational failure. "We serve the
 *      construction industry" is what every agency says and means nothing. The
 *      whole value of this section is that a reader recognises their own week
 *      in it.
 *
 * Landscaping stays on the list — it is where the founder's operating
 * experience comes from — but it is one row of six, not the frame.
 */

export type Industry = { title: string; body: string };

// Bodies are kept to roughly one sentence: on a phone these become six stacked
// cards, and a fifth line each is what turns a scannable section into a wall.
// The title already names the market, so the body never has to repeat it.
export const industries: Industry[] = [
  {
    title: "Construction & specialty trades",
    body: "The estimate, the schedule, the change orders and the accounting all need the same numbers — and a person is the only thing moving them.",
  },
  {
    title: "HVAC, plumbing & electrical",
    body: "Dispatch, service agreements, recurring maintenance and parts, split across a field app and an accounting system that disagree by month end.",
  },
  {
    title: "Roofing, concrete & excavation",
    body: "Measurements, takeoffs, subs and change orders that happen in photos, email and texts — then get re-entered by somebody in the office.",
  },
  {
    title: "Landscaping & property services",
    body: "Recurring maintenance alongside install work, several crews out at once, and seasonal schedules generic schedulers do not survive.",
  },
  {
    title: "Field & property-service businesses",
    body: "Anywhere technicians work away from the office and someone has to keep both halves of the company agreeing about what happened today.",
  },
];

/** The sixth cell of the grid. Says out loud that the list is not a gate. */
export const industryNote = {
  title: "Not on the list?",
  body: "Examples, not requirements. What matters is whether your workflows are specific enough that off-the-shelf products cannot hold them, and whether people are filling the gaps by hand.",
};
