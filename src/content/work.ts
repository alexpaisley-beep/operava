/**
 * Proof, not marketing.
 *
 * Every claim on this page has to be true of something that exists. The rules,
 * because they are easy to erode one edit at a time:
 *
 *   1. Nothing here describes a client project. Operava has not published one
 *      yet, and `clientPortfolio` is deliberately empty until it can.
 *   2. Nothing here describes software that does not exist. CallPilot is listed
 *      as in development because that is what it is — omitting it would be
 *      tidier, but the homepage already names it, and a page about what we have
 *      built is exactly the wrong place to be selective.
 *   3. `integrations` and `technologies` list what is actually wired up and
 *      running, verified against the source, not what we could plausibly build.
 *   4. No usage numbers, no revenue impact, no customer counts, no logos, no
 *      quotes. We do not have permission to publish any of those, and inventing
 *      one is unrecoverable. This includes the SOFT forms, which are the ones
 *      that actually slip through: "real billing", "people pay for it",
 *      "trusted by operators" all assert a customer base without naming a
 *      number. Describe the software, not its imagined adoption.
 *
 * If you are adding an entry: it ships when it ships, not when it is planned.
 */

export type BuildStatus = {
  label: string;
  /** `live` = available today. `internal` = running, not for sale. `pending` = not available. */
  tone: "live" | "internal" | "pending";
};

export type BuiltSystem = {
  id: string;
  name: string;
  /** What kind of thing this is, so nobody has to guess. */
  kind: string;
  status: BuildStatus;
  /** One line: what it is. */
  summary: string;
  /** The operational problem it was built to remove. */
  problem: string;
  /** What was actually built — capabilities that exist, not a roadmap. */
  built: string[];
  /** The parts worth pointing at, because they are where systems usually fail. */
  workflows?: { title: string; body: string }[];
  /** Systems it is genuinely connected to. */
  integrations?: string[];
  technologies?: string[];
  /** Stated limits. A proof page that only lists strengths is an advert. */
  limits?: string[];
  /** Why this is evidence of anything. */
  proves: string;
};

export const builtSystems: BuiltSystem[] = [
  {
    id: "operon",
    name: "Operon",
    kind: "Product · Built by Operava",
    status: { label: "Live", tone: "live" },
    summary:
      "Operating software for home-service companies — estimates, scheduling, invoicing and customer records in one place. A product with published pricing, not a one-off build.",
    problem:
      "An owner-operated crew typically runs the business across a quoting tool, a shared calendar, an invoicing app and an inbox. None of them know about each other, so the same job gets typed in four times and a lead can disappear in the gap between any two of them.",
    built: [
      "Estimating, from enquiry through to an accepted quote",
      "Job scheduling across multiple crews",
      "Invoicing off the back of completed work",
      "Customer records that carry the full service history",
      "Lead intake with automated email follow-up",
      "Founder-assisted onboarding and data import",
    ],
    workflows: [
      {
        title: "Lead → estimate → schedule → invoice",
        body: "The whole path lives in one system, so a job never has to be re-entered to move to the next stage and nothing is waiting in someone's inbox to be copied across.",
      },
      {
        title: "Automated follow-up that stops when a human replies",
        body: "Follow-up runs on its own until the customer answers, at which point it gets out of the way. Sequences that keep firing after a reply do more damage than no sequence at all.",
      },
    ],
    technologies: ["Web application"],
    limits: [
      "Web application — there is no dedicated mobile app yet",
      "No built-in payment processing yet",
    ],
    proves:
      "We have designed, shipped and maintained the full lead-to-invoice path for this industry, as a product we still run — not as a demo, and not as a single project that was handed over and forgotten.",
  },
  {
    id: "growth-engine",
    name: "Growth Engine",
    kind: "Internal platform · Built by Operava",
    status: { label: "In production, internal", tone: "internal" },
    summary:
      "The system Operava runs its own sales on. It is not for sale — it is here because it is the most honest illustration of what we mean by an operating system for a business.",
    problem:
      "Outbound that has to run every day without a person driving it, and that must never contact someone who asked not to be contacted. Both halves are hard; the second one is the half that gets companies in trouble.",
    built: [
      "Prospect discovery from public sources, with enrichment and fit scoring",
      "Campaign enrolment with eligibility rules evaluated again at send time",
      "Sequenced outbound email across a fleet of sending mailboxes",
      "Per-mailbox warm-up and daily capacity limits, enforced at the point of send",
      "Reply detection and classification, with follow-up that cancels itself on a reply",
      "Opt-out and suppression that cascade across every channel at once",
      "An operator console for reviewing, approving and holding what goes out",
      "Deliverability monitoring — bounces, complaints, domain authentication",
      "Software request intake — the receiving end of the request form on this site",
    ],
    workflows: [
      {
        title: "One opt-out stops everything, everywhere",
        body: "An unsubscribe does not just tick a box. It stops live enrolments, cancels scheduled messages, cancels pending follow-ups and suppresses both the address and the phone number, in a single transaction. Partial opt-outs are the kind of bug you find out about from a complaint.",
      },
      {
        title: "Capacity holds are deferrals, not deletions",
        body: "When a mailbox hits its daily limit the message is held, then re-offered once capacity returns — and every gate is re-run before it goes, so releasing a hold is never a way to bypass a rule. Getting this wrong once silently retired real prospects for weeks.",
      },
      {
        title: "Signed, idempotent request intake",
        body: "Requests from this website are HMAC-signed over the raw body with a timestamp bound, deduplicated on a stable key, and matched against a company we may already know. A retried delivery cannot create a second request or overwrite work already done on the first.",
      },
    ],
    integrations: [
      "Gmail API",
      "Google OAuth",
      "Google Calendar",
      "Google Places",
      "Meta Graph API",
      "Operon's internal API",
    ],
    technologies: ["Node.js", "PostgreSQL", "Prisma", "Express", "React", "TypeScript"],
    proves:
      "The unglamorous parts of an integration — scheduling, retries, idempotency, rate limits, signed requests and permission rules that hold under load — are where most custom software quietly fails. This is a system where all of them are load-bearing, and we run our own business on it.",
  },
  {
    id: "callpilot",
    name: "CallPilot",
    kind: "Product · Built by Operava",
    status: { label: "In development — not available", tone: "pending" },
    summary:
      "AI call answering for home-service companies. It is in development and cannot be bought today.",
    problem:
      "A missed call during the working day is usually a lost job, because the caller rings the next company on the list rather than leaving a voicemail.",
    built: [
      "In development — answering missed calls, qualifying the caller, collecting job details, booking appointments and transferring urgent calls",
    ],
    limits: [
      "Not available today, on any plan, at any price",
      "No launch date is being given, because we do not have one worth trusting",
    ],
    proves:
      "Nothing yet — and that is the point of listing it. It is named on our homepage, so leaving it off a page about what we have built would be a convenient omission. Anything you buy from us will be described this plainly.",
  },
];

/**
 * Client work Operava has shipped and has permission to publish.
 *
 * Empty, and correctly so. There is exactly one wrong way to fill this array,
 * and it is filling it with anything that did not happen.
 */
export const clientPortfolio: never[] = [];

/** What a published client entry will contain, once there is one. */
export const clientEntryPromise = [
  "The company, named, with their permission",
  "What was actually broken before we started",
  "What we built, in enough detail to judge it",
  "What changed afterwards — measured, or not claimed",
];
