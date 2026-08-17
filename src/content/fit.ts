/**
 * Qualification. The point is to make the right buyer feel recognised, not to
 * make the wrong one feel stupid.
 */

export const goodFit: string[] = [
  "Multiple crews running at the same time",
  "Residential and commercial work under one roof",
  "Recurring maintenance alongside project work",
  "More than one service line or department",
  "Office staff who coordinate the work",
  "Enough lead volume that intake matters",
  "A software stack that has quietly fragmented",
  "Workflows no off-the-shelf product supports properly",
];

export const notFit: { item: string; because: string }[] = [
  {
    item: "A brand new solo operator",
    because: "Off-the-shelf tools will serve you well for a while. Spend the money on trucks.",
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
