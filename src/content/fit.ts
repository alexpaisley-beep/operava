/**
 * Qualification. The point is to make the right buyer feel recognised, not to
 * make the wrong one feel stupid.
 *
 * Kept in terms of how a business OPERATES rather than what trade it is in.
 * A 50-person electrical contractor and a 30-person landscaping company belong
 * on the same side of this list, and both should be able to tell which side
 * without reading an industry list first.
 */

export const goodFit: string[] = [
  "Crews or technicians working away from the office every day",
  "Office staff coordinating between customers, the field and accounting",
  "More than one service line, division or type of work",
  "Recurring or contract work alongside project work",
  "Several systems that each hold part of the truth",
  "Enough volume that one manual step costs real hours",
  "A spreadsheet that has quietly become load-bearing",
  "Workflows no off-the-shelf product supports properly",
];

export const notFit: { item: string; because: string }[] = [
  {
    item: "A brand new solo operator",
    because:
      "Off-the-shelf tools will serve you well for a while. Spend the money on trucks and equipment.",
  },
  {
    item: "Someone who needs a website",
    because: "We build operating software. A good web designer is a better use of your budget.",
  },
  {
    item: "Basic invoicing only",
    because:
      "If invoicing is the whole problem, existing products already solve it for far less.",
  },
  {
    item: "A franchise with corporate-mandated software",
    because: "If you cannot choose your own systems, custom software cannot help you.",
  },
];
