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
 *      available" and listed "no built-in payment processing" as a limitation.
 *      Both were false: CallPilot is live with metered minutes, and payment
 *      processing runs across hundreds of files. Understating what we built is
 *      not modesty, it is an inaccurate claim that costs us the sale.
 *   2b. This page is EVIDENCE OF CAPABILITY, not a shop window for our other
 *      products. Describe what we BUILT and what it PROVES — never what a
 *      reader should go and buy. No product pricing, no sign-up links, no
 *      "available on the Pro plan". The moment a card reads like a pitch for
 *      another product, it stops working as proof for this one. CallPilot in
 *      particular is a separate product and must never be described as
 *      included with, or part of, anything else.
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
      "A complete operating platform for home-service companies, designed and built here end to end — and still run here. It is not what Operava sells you; it is the evidence that we can build one.",
    problem:
      "The hard part was never any single screen. It was making customers, estimates, scheduling, crews, invoicing, payments and payroll behave as one system instead of six that happen to share a login — which is the same problem every custom build for an established operator runs into.",
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
        title: "A customer portal wired to the back office",
        body: "Customers see upcoming service, approve estimates, sign contracts, pay invoices and ask questions — reading and writing to the same records the office works from, not a separate copy that drifts.",
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
    id: "travis",
    name: "Travis AI",
    kind: "Operations and intelligence layer · Built by Operava",
    status: { label: "Live", tone: "live" },
    summary:
      "Not a chat window bolted onto a product. Travis answers from the live business, runs the same operations the screens run, and stops for a human before anything consequential. It works across Operon and Growth Engine — how the work gets done, and how it gets sold.",
    problem:
      "Most AI inside business software is a text box wired to a model that cannot see the company's data and cannot change anything, so it answers in generalities and every real action still gets done by hand on another screen. The conversation was never the hard part. Giving an assistant accurate business context, a real set of actions, and limits strict enough that an owner will let it act at all — that is the hard part.",
    built: [
      "Reads the live business before answering — the day's schedule, customers, open estimates, unpaid invoices, crews, leads, and the weather against the jobs that are booked",
      "Calls the same operations the screens call: customers, jobs and scheduling, estimates and contracts, invoicing and payments, payroll and timesheets, equipment, reviews, website and marketing",
      "Stages consequential actions as approval cards — sending, charging, refunding, deleting, anything in bulk — rather than executing them inline",
      "Autonomy the owner sets per category of work: off, draft only, ask first, or go ahead",
      "Realtime voice in the browser — the owner talking to their own system, running through the same tools and the same approval rules as the typed chat",
      "Durable business memory: standing facts kept and versioned when they change, deliberately separate from the settings that already own a value",
      "A daily brief covering where the business stands and the one action worth doing first",
      "Scheduling help that reads the real calendar and proposes a placement, with the times computed rather than guessed",
      "Lead intake that turns a loose message into a structured lead, and follow-up drafted for review",
      "In Growth Engine: prospect discovery and scoring, outreach drafting, campaigns, reply sync, and sending that is gated behind approval",
    ],
    workflows: [
      {
        title: "Consequential actions stop at an approval card",
        body: "Reading the business is free. Changing it is not. Sending an invoice, charging a card, deleting a customer or messaging a list all stop and wait as a card showing the exact action. Voice is held to the same rule, and the riskiest of them — money, legal, bulk sends — cannot be approved out loud at all, because a microphone hears the room as well as the owner.",
      },
      {
        title: "One execution path, whichever way the owner is talking to it",
        body: "Typed chat, voice and the proactive cards all run through the same tools, the same permission checks and the same approval engine. The voice layer owns the connection and nothing else. A second execution path is how a system ends up disagreeing with itself about what needs permission — usually discovered the first time something goes out that should not have.",
      },
      {
        title: "Data out of the database is treated as data, not instructions",
        body: "Customer notes, imported rows and inbound email bodies all reach the model as tool results, and every one of them arrived through a door we do not control — a public form, a spreadsheet, someone else's inbox. It is fenced off and marked untrusted, so text sitting in a lead form cannot talk the assistant into taking an action nobody asked for.",
      },
    ],
    integrations: ["Operon", "Growth Engine", "Stripe", "Twilio", "Gmail", "Google Places"],
    handles: [
      "Live business context assembled per request, scoped to one company",
      "Actions against real records, not a sandbox copy",
      "Role, permission and approval checks before anything executes",
      "Repeated and retried requests without doing the work twice",
      "A log of what was asked, what ran and what it changed",
      "Realtime voice alongside typed chat",
    ],
    proves:
      "A chat window over a database is a weekend. The difficulty is everything around it — assembling accurate context on every request, permissions and approvals that hold when the model is wrong, execution that survives a retry, an audit trail, and untrusted record text kept well away from the instructions. That is the layer we built, into two systems we also built, and it is the part that decides whether an owner can let software act on their behalf.",
  },
  {
    id: "callpilot",
    name: "CallPilot",
    kind: "Product · Built by Operava",
    status: { label: "Live", tone: "live" },
    summary:
      "An AI receptionist that answers the phone when nobody can, takes the call properly, and books it straight into a schedule. A separate product in its own right, running on real phone numbers with metered call minutes.",
    problem:
      "A missed call during the working day is usually a lost job, because the caller rings the next company on the list rather than leaving a voicemail. Crews cannot answer from a jobsite and the office cannot answer while quoting.",
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
    integrations: ["Twilio", "Scheduling, customer and billing systems"],
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
