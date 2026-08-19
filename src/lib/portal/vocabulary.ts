/**
 * Every status the portal can display, with its human label and its tone.
 *
 * Kept in one file so a status can never be spelled one way on the dashboard
 * and another on the detail page, and so the colour attached to a state is a
 * property of the state rather than a decision each component makes.
 *
 * Four tones, and the distinction that matters most is `attention` vs `danger`:
 * "we need your API key" is not an error, and painting it red teaches people to
 * ignore red. Attention means somebody has to move. Danger means something is
 * actually wrong.
 */

import type {
  BillingStatus,
  BlockerWaitingOn,
  BugSeverity,
  FileCategory,
  MilestoneStatus,
  ProjectStatus,
  RequestPriority,
  RequestStatus,
  RequestType,
} from "@/lib/supabase/types";

export type Tone = "neutral" | "progress" | "attention" | "positive" | "danger";

/** Pill styling per tone. Hairline + tint, matching the marketing site's badges. */
export const toneClass: Record<Tone, string> = {
  neutral: "border-line-2 bg-muted text-ink-2",
  progress: "border-navy-600/25 bg-navy-50 text-navy-800",
  attention: "border-alert-500/40 bg-alert-50 text-alert-700",
  positive: "border-leaf-500/40 bg-leaf-50 text-leaf-700",
  danger: "border-danger-line bg-danger-bg text-danger",
};

/** Solid dot, for timelines and list rows where a full pill is too loud. */
export const toneDot: Record<Tone, string> = {
  neutral: "bg-line-2",
  progress: "bg-navy-600",
  attention: "bg-alert-500",
  positive: "bg-leaf-500",
  danger: "bg-danger",
};

type Entry<T extends string> = Record<T, { label: string; tone: Tone }>;

export const projectStatus: Entry<ProjectStatus> = {
  planning: { label: "Planning", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "progress" },
  testing: { label: "Testing", tone: "progress" },
  waiting_on_client: { label: "Waiting on You", tone: "attention" },
  ready_for_review: { label: "Ready for Review", tone: "attention" },
  launching: { label: "Launching", tone: "progress" },
  complete: { label: "Complete", tone: "positive" },
  on_hold: { label: "On Hold", tone: "neutral" },
};

export const milestoneStatus: Entry<MilestoneStatus> = {
  upcoming: { label: "Upcoming", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "progress" },
  blocked: { label: "Blocked", tone: "attention" },
  complete: { label: "Complete", tone: "positive" },
};

export const requestStatus: Entry<RequestStatus> = {
  submitted: { label: "Submitted", tone: "neutral" },
  reviewing: { label: "Reviewing", tone: "progress" },
  approved: { label: "Approved", tone: "positive" },
  in_progress: { label: "In Progress", tone: "progress" },
  waiting_on_client: { label: "Waiting on You", tone: "attention" },
  done: { label: "Done", tone: "positive" },
  declined: { label: "Declined", tone: "neutral" },
};

export const requestPriority: Entry<RequestPriority> = {
  low: { label: "Low", tone: "neutral" },
  normal: { label: "Normal", tone: "neutral" },
  high: { label: "High", tone: "attention" },
  urgent: { label: "Urgent", tone: "danger" },
};

export const bugSeverity: Entry<BugSeverity> = {
  minor: { label: "Minor", tone: "neutral" },
  moderate: { label: "Moderate", tone: "neutral" },
  major: { label: "Major", tone: "attention" },
  critical: { label: "Critical", tone: "danger" },
};

export const billingStatus: Entry<BillingStatus> = {
  pending: { label: "Pending", tone: "neutral" },
  due: { label: "Due", tone: "attention" },
  paid: { label: "Paid", tone: "positive" },
  overdue: { label: "Overdue", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const waitingOn: Entry<BlockerWaitingOn> = {
  client: { label: "Waiting on you", tone: "attention" },
  operava: { label: "Waiting on Operava", tone: "progress" },
  third_party: { label: "Waiting on a third party", tone: "neutral" },
};

/**
 * Request types, in the order they appear on the "raise a request" screen.
 * `blurb` is what a customer reads when choosing, so it describes the situation
 * they are in rather than defining the noun.
 */
export const requestTypes: {
  value: RequestType;
  label: string;
  blurb: string;
}[] = [
  {
    value: "bug",
    label: "Something is broken",
    blurb: "It used to work, or it does not do what it should.",
  },
  {
    value: "change_request",
    label: "Change request",
    blurb: "The build needs to work differently from what was scoped.",
  },
  {
    value: "question",
    label: "Question",
    blurb: "You need an answer, not a change.",
  },
  {
    value: "support",
    label: "Support",
    blurb: "Help using something we built, or something looks wrong.",
  },
  {
    value: "feature_idea",
    label: "Idea for later",
    blurb: "Worth doing, not necessarily now.",
  },
];

export const requestTypeLabel: Record<RequestType, string> = {
  bug: "Bug",
  change_request: "Change request",
  question: "Question",
  support: "Support",
  feature_idea: "Idea",
};

export const fileCategory: Record<FileCategory, string> = {
  contract: "Contracts",
  specification: "Specifications",
  deliverable: "Deliverables",
  documentation: "Documentation",
  screenshot: "Screenshots",
  other: "Other",
};

/** Order used wherever files are grouped, so the list never reshuffles. */
export const fileCategoryOrder: FileCategory[] = [
  "contract",
  "specification",
  "deliverable",
  "documentation",
  "screenshot",
  "other",
];
