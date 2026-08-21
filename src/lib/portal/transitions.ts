/**
 * State machines, as pure functions returning what the transition entails.
 * Services apply the returned patch; nothing else decides transitions.
 */

import type { Actor } from "./authz";
import { isOperavaActor } from "./authz";
import type { ClientRequestStatus, MilestoneStatus, ProjectStatus } from "./types";

export type TransitionDecision<Patch> =
  | { ok: true; patch: Patch; noop?: boolean }
  | { ok: false; reason: string };

/* ---------------------------------------------------------------------------
   Projects. Every status can move to every other status — Operava runs real
   projects and reality is messier than a lattice — but the side effects are
   fixed here so "complete" always means completed.
--------------------------------------------------------------------------- */

export type ProjectStatusPatch = {
  status: ProjectStatus;
  progress_percent?: number;
  actual_completion_date?: string | null;
};

export function decideProjectStatusChange(
  current: {
    status: ProjectStatus;
    progress_percent: number;
    actual_completion_date: string | null;
  },
  next: ProjectStatus,
  today: string,
): TransitionDecision<ProjectStatusPatch> {
  if (current.status === next) {
    return { ok: true, noop: true, patch: { status: next } };
  }
  const patch: ProjectStatusPatch = { status: next };
  if (next === "complete") {
    patch.progress_percent = 100;
    if (!current.actual_completion_date) patch.actual_completion_date = today;
  }
  if (current.status === "complete" && next !== "complete") {
    // Reopening: the completion date no longer describes reality.
    patch.actual_completion_date = null;
  }
  return { ok: true, patch };
}

/* ---------------------------------------------------------------------------
   Milestones. completed_at tracks the status, never the other way round.
--------------------------------------------------------------------------- */

export type MilestonePatch = {
  status: MilestoneStatus;
  completed_at: string | null;
};

export function decideMilestoneStatusChange(
  current: { status: MilestoneStatus; completed_at: string | null },
  next: MilestoneStatus,
  now: string,
): TransitionDecision<MilestonePatch> {
  if (current.status === next) {
    return {
      ok: true,
      noop: true,
      patch: { status: next, completed_at: current.completed_at },
    };
  }
  return {
    ok: true,
    patch: {
      status: next,
      completed_at: next === "complete" ? (current.completed_at ?? now) : null,
    },
  };
}

/* ---------------------------------------------------------------------------
   Client requests (Operava → customer action items). This one is strict:
   customers may acknowledge and complete; only Operava may cancel or reopen;
   nothing leaves a terminal state except an Operava reopen.
--------------------------------------------------------------------------- */

export type ClientRequestPatch = {
  status: ClientRequestStatus;
  acknowledged_at?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  cancelled_at?: string | null;
};

export function decideClientRequestChange(
  current: { status: ClientRequestStatus },
  next: ClientRequestStatus,
  actor: Actor,
  now: string,
): TransitionDecision<ClientRequestPatch> {
  const from = current.status;

  if (from === next) {
    // Re-running "complete" or "acknowledge" is harmless by design.
    return { ok: true, noop: true, patch: { status: next } };
  }

  switch (next) {
    case "acknowledged":
      if (from !== "open")
        return { ok: false, reason: `Cannot acknowledge a ${from} request.` };
      return { ok: true, patch: { status: next, acknowledged_at: now } };

    case "completed":
      if (from !== "open" && from !== "acknowledged") {
        return { ok: false, reason: `Cannot complete a ${from} request.` };
      }
      return { ok: true, patch: { status: next, completed_at: now } };

    case "cancelled":
      if (!isOperavaActor(actor))
        return { ok: false, reason: "Only Operava can cancel a request." };
      if (from !== "open" && from !== "acknowledged") {
        return { ok: false, reason: `Cannot cancel a ${from} request.` };
      }
      return { ok: true, patch: { status: next, cancelled_at: now } };

    case "open":
      if (!isOperavaActor(actor))
        return { ok: false, reason: "Only Operava can reopen a request." };
      return {
        ok: true,
        patch: {
          status: next,
          acknowledged_at: null,
          completed_at: null,
          completed_by: null,
          cancelled_at: null,
        },
      };
  }
}
