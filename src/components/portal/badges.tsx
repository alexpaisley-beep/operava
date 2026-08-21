import type {
  BillingStatus,
  ClientRequestStatus,
  MilestoneStatus,
  ProjectHealth,
  ProjectStatus,
  RequestStatus,
} from "@/lib/portal/types";
import {
  BILLING_STATUS_LABELS,
  CLIENT_REQUEST_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  PROJECT_HEALTH_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_LABELS_INTERNAL,
  REQUEST_STATUS_LABELS,
} from "@/lib/portal/types";

/**
 * Status colour language, used identically in the portal and admin:
 * green = done/healthy, blue = moving, amber = needs someone, red = stuck,
 * grey = parked. Dots + text, never colour alone.
 */

type Tone = "green" | "blue" | "amber" | "red" | "slate";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-leaf-50 text-leaf-700 border-leaf-500/30",
  blue: "bg-navy-50 text-navy-700 border-navy-200",
  amber: "bg-[#fdf6e7] text-[#8a5a00] border-[#e8d5a8]",
  red: "bg-danger-bg text-danger border-danger-line",
  slate: "bg-muted text-ink-2 border-line-2",
};

const DOT_CLASSES: Record<Tone, string> = {
  green: "bg-leaf-500",
  blue: "bg-navy-600",
  amber: "bg-[#d99a00]",
  red: "bg-danger",
  slate: "bg-ink-3",
};

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-medium leading-none ${TONE_CLASSES[tone]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />
      {children}
    </span>
  );
}

const PROJECT_STATUS_TONES: Record<ProjectStatus, Tone> = {
  planning: "slate",
  in_progress: "blue",
  testing: "blue",
  waiting_on_client: "amber",
  blocked: "red",
  ready_for_review: "amber",
  launching: "blue",
  complete: "green",
  on_hold: "slate",
};

export function ProjectStatusBadge({
  status,
  audience = "customer",
}: {
  status: ProjectStatus;
  audience?: "customer" | "internal";
}) {
  const labels =
    audience === "internal" ? PROJECT_STATUS_LABELS_INTERNAL : PROJECT_STATUS_LABELS;
  return <Badge tone={PROJECT_STATUS_TONES[status]}>{labels[status]}</Badge>;
}

const HEALTH_TONES: Record<ProjectHealth, Tone> = {
  on_track: "green",
  at_risk: "amber",
  off_track: "red",
};

export function HealthBadge({ health }: { health: ProjectHealth }) {
  return <Badge tone={HEALTH_TONES[health]}>{PROJECT_HEALTH_LABELS[health]}</Badge>;
}

const MILESTONE_TONES: Record<MilestoneStatus, Tone> = {
  upcoming: "slate",
  in_progress: "blue",
  blocked: "red",
  complete: "green",
};

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  return <Badge tone={MILESTONE_TONES[status]}>{MILESTONE_STATUS_LABELS[status]}</Badge>;
}

const CLIENT_REQUEST_TONES: Record<ClientRequestStatus, Tone> = {
  open: "amber",
  acknowledged: "blue",
  completed: "green",
  cancelled: "slate",
};

export function ClientRequestBadge({ status }: { status: ClientRequestStatus }) {
  return (
    <Badge tone={CLIENT_REQUEST_TONES[status]}>{CLIENT_REQUEST_STATUS_LABELS[status]}</Badge>
  );
}

const REQUEST_TONES: Record<RequestStatus, Tone> = {
  submitted: "slate",
  reviewing: "blue",
  approved: "blue",
  in_progress: "blue",
  waiting_on_client: "amber",
  done: "green",
  declined: "slate",
};

export function RequestBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={REQUEST_TONES[status]}>{REQUEST_STATUS_LABELS[status]}</Badge>;
}

const BILLING_TONES: Record<BillingStatus, Tone> = {
  pending: "slate",
  due: "amber",
  paid: "green",
  overdue: "red",
  cancelled: "slate",
};

export function BillingBadge({ status }: { status: BillingStatus }) {
  return <Badge tone={BILLING_TONES[status]}>{BILLING_STATUS_LABELS[status]}</Badge>;
}
