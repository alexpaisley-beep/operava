/**
 * Proof, not marketing.
 *
 * Every claim on this page has to be true of something that exists, and every
 * claim below was checked against the Operon and Growth Engine source before it
 * was written. The rules, because they are easy to erode one edit at a time:
 *
 *   1. Nothing here describes a client project. Operava has not published one
 *      yet, and `clientPortfolio` is deliberately empty until it can.
 *   2. Nothing here describes software that does not exist — and, just as
 *      importantly, nothing here describes shipped software as missing. An
 *      earlier version of this file called CallPilot "in development, not
 *      available" and listed "no built-in payment processing" as an Operon
 *      limitation. Both were false: CallPilot is live inside Operon with
 *      metered minutes, and Stripe runs across hundreds of files. Understating
 *      what we built is not modesty, it is an inaccurate claim that costs us
 *      the sale.
 *   3. `integrations` lists what is genuinely wired up and running. Systems we
 *      can BUILD a connection to belong on /what-we-build, not here.
 *   4. No usage numbers, no revenue impact, no customer counts, no logos, no
 *      quotes. We do not have permission to publish any of those, and inventing
 *      one is unrecoverable. This includes the SOFT forms, which are the ones
 *      that actually slip through: "real billing", "people pay for it",
 *      "trusted by operators" all assert a customer base without naming a
 *      number. Describe the software, not its imagined adoption.
 *   5. No stack lists. A landscaping owner deciding on a $6,000 build does not
 *      care which ORM we used, and printing one reads as a CV rather than as
 *      evidence. `handles` describes operational load instead.
 *
 * If you are adding an entry: it ships when it ships, not when it is planned.
 */

export type BuildStatus = {
  label: string;
  /** `live` = shipped and running. `internal` = running, not for sale. */
  tone: "live" | "internal";
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
  /** Systems it is genuinely connected to and running against. */
  integrations?: string[];
  /**
   * Operational load it carries. Replaces the old `technologies` list — the
   * question a buyer is actually asking is "can this handle my business", not
   * "which framework is this".
   */
  handles?: string[];
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
      "A full operating system for home-service companies — customers, estimates, scheduling, crews, invoicing, payments, payroll and a customer portal, in one system rather than six.",
    problem:
      'An established crew usually runs the business across a quoting tool, a shared calendar, an invoicing app, a payroll provider and an inbox. None of them know about each other, so the same job gets typed in four times, and the office cannot answer "where does this customer stand" without opening five tabs.',
    built: [
      "Customer records with properties, contacts, service history and preferences",
      "Estimates and multi-option proposals, with digital signature and acceptance",
      "Job scheduling across multiple crews, including recurring service plans and seasonal cycles",
      "Daily routing, crew assignment and job status reported from the field",
      "Invoicing with card and ACH payment collection, stored payment methods and recurring billing",
      "Payroll, timesheets, mileage and employee documents",
      "A customer portal — appointments, estimates, contracts, invoices, payments, project status and messages",
      "Inbound lead capture, follow-up automation and two-way SMS",
      "Equipment, inventory and property records",
      "iOS and Android apps alongside the web application",
    ],
    workflows: [
      {
        title: "Lead → estimate → schedule → invoice → paid",
        body: "The whole path lives in one system, so a job never has to be re-entered to move to the next stage and nothing waits in someone's inbox to be copied across. Payment closes the loop in the same record the estimate started in.",
      },
      {
        title: "Recurring work that survives a reschedule",
        body: "Recurring service plans across crews and service types, where moving one visit does not corrupt the rest of the season. This is the part most scheduling tools get wrong and the part that costs an operator real money.",
      },
      {
        title: "A portal that answers the phone for you",
        body: "Customers see their upcoming service, approve estimates, sign contracts, pay invoices and ask questions themselves. Every one of those is a call the office does not have to take.",
      },
    ],
    integrations: ["Stripe", "Twilio", "Google", "Apple and Google app stores"],
    handles: [
      "Multi-crew scheduling and recurring services",
      "Card and ACH payments, refunds and reconciliation",
      "Payroll and time tracking",
      "Two-way customer messaging",
      "Customer-facing self-service",
      "Field and office working from the same record",
    ],
    proves:
      "We have designed, shipped and maintained the entire operational path for this industry — quote to schedule to invoice to paid, with a customer portal and payroll attached. Not a dashboard on top of somebody else's system: the system itself.",
  },
  {
    id: "callpilot",
    name: "CallPilot",
    kind: "Product · Built by Operava",
    status: { label: "Live in Operon", tone: "live" },
    summary:
      "An AI receptionist that answers the phone when nobody can, takes the call properly, and books it straight into the schedule. Live inside Operon, on real phone numbers, with metered call minutes.",
    problem:
      "A missed call during the working day is usually a lost job, because the caller rings the next company on the list rather than leaving a voicemail. Crews cannot answer from a mower and the office cannot answer while quoting.",
    built: [
      "Answers inbound calls on a real business number",
      "Takes the caller's name, number, service address and access notes — gate codes, dogs, where to park",
      "Recognises existing customers and pulls up their record",
      "Answers questions about the business, and gives prices over the phone",
      "Books estimate visits and recurring work directly into the schedule",
      "Reschedules and cancels existing appointments",
      "Answers billing questions",
      "Emails estimates and confirmations from the call",
      "Transfers the caller through when they need a person",
      "Takes a message when it should not handle something itself",
      "Spam and robocall filtering, trusted-contact rules and blocked numbers",
    ],
    workflows: [
      {
        title: "The call becomes a record, not a note",
        body: "A caller who has never existed in the system before comes off the phone as a lead with an address, a service request and a booked appointment. Nothing is waiting to be typed up later, which is where phone messages usually die.",
      },
      {
        title: "Capabilities are the owner's decision, and the toggles are real",
        body: 'The owner chooses what the agent may do in plain language — "give prices over the phone", "book recurring work" — and turning one off genuinely removes those abilities from the call rather than just unticking a box. A setting that looks real and does nothing is worse than no setting.',
      },
    ],
    integrations: ["Twilio", "Operon scheduling, customers and billing"],
    handles: [
      "Live inbound phone calls",
      "Appointment booking and rescheduling",
      "Caller identification against existing customers",
      "Metered usage and per-minute accounting",
      "Spam filtering and call routing",
    ],
    proves:
      "Real-time voice is the least forgiving software there is — it runs live, in front of a customer, with no chance to retry. Building one that books into a live schedule and bills by the minute is a much harder problem than the CRUD screens most business software is made of.",
  },
  {
    id: "growth-engine",
    name: "Growth Engine",
    kind: "Internal platform · Built by Operava",
    status: { label: "In production, internal", tone: "internal" },
    summary:
      "The system Operava runs its own sales on. It is not for sale, and it is not client work — it is here because it is the clearest illustration of what we mean by an operating system for a business.",
    problem:
      "Outbound that has to run every day without a person driving it, and that must never contact someone who asked not to be contacted. Both halves are hard; the second is the half that gets companies in trouble.",
    built: [
      "Prospect research and enrichment from public sources, with fit scoring",
      "A pipeline with stages, ownership and next actions",
      "Software requests from this website, captured and matched to a company we may already know",
      "Sequenced outreach with per-account sending limits enforced at the point of send",
      "Reply detection and classification, with follow-up that cancels itself on a reply",
      "Opt-out and suppression that cascade across every channel at once",
      "An operator console for reviewing, approving and holding what goes out",
    ],
    workflows: [
      {
        title: "One opt-out stops everything, everywhere",
        body: "An unsubscribe does not just tick a box. It stops live enrolments, cancels scheduled messages, cancels pending follow-ups and suppresses both the address and the phone number, in a single transaction. Partial opt-outs are the kind of bug you learn about from a complaint.",
      },
      {
        title: "Capacity holds are deferrals, not deletions",
        body: "When an account hits its daily limit the message is held, then re-offered once capacity returns — and every rule is re-checked before it goes, so releasing a hold never becomes a way to bypass one. Getting this wrong once silently retired real prospects for weeks.",
      },
      {
        title: "Signed, idempotent request intake",
        body: "Requests from this website are cryptographically signed, deduplicated on a stable key, and matched against a company we may already know. A retried delivery cannot create a second request or overwrite work already done on the first.",
      },
    ],
    integrations: ["Gmail", "Google Calendar", "Google Places", "Meta", "Operon"],
    handles: [
      "Scheduled work that runs unattended, every day",
      "Rate limits and sending caps that hold under load",
      "Consent and suppression rules that cannot be bypassed",
      "Signed, deduplicated inbound requests",
      "Keeping several systems of record in agreement",
    ],
    proves:
      "The unglamorous parts of an integration — scheduling, retries, idempotency, rate limits, signed requests and permission rules that hold under load — are where most custom software quietly fails. This is a system where all of them are load-bearing, and we run our own business on it.",
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
