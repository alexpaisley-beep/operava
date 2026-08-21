/**
 * The audit trail. Every mutating service records one entry describing who
 * (and what kind of who) changed what, with before/after snapshots for the
 * fields that changed.
 *
 * Secrets, tokens and credentials never belong in `data` — nothing in the
 * portal domain stores any, and this module additionally drops any key that
 * looks like one as a tripwire.
 */

import { actorProfileId, actorType, type Actor } from "./authz";
import * as data from "./data";
import type { Json } from "./database.types";
import type { Db } from "./supabase/server";
import type { Visibility } from "./types";

export type AuditEntry = {
  /** Machine-readable action, e.g. "project.status_changed". */
  action: string;
  /** Human-readable sentence for timelines, ≤500 chars. */
  description: string;
  projectId?: string | null;
  companyId?: string | null;
  entityType: string;
  entityId?: string | null;
  visibility: Visibility;
  /** Field-level before values for changed fields. */
  before?: Record<string, unknown>;
  /** Field-level after values for changed fields. */
  after?: Record<string, unknown>;
  /** Where the mutation came from, e.g. "admin_ui", "portal", "mcp". */
  source: string;
};

const SECRET_KEY_PATTERN = /(secret|token|password|credential|api[_-]?key)/i;

function scrub(record: Record<string, unknown> | undefined): Record<string, Json> | undefined {
  if (!record) return undefined;
  const out: Record<string, Json> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SECRET_KEY_PATTERN.test(key)) continue;
    if (value === undefined) continue;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = typeof value === "string" ? value.slice(0, 2000) : value;
    } else {
      out[key] = JSON.stringify(value).slice(0, 2000);
    }
  }
  return out;
}

/**
 * Write an audit entry. Runs after the mutation it describes; a failure here
 * must not undo real work, so it is logged loudly (with the full entry, which
 * makes the event recoverable from the log stream) instead of thrown.
 */
export async function recordAudit(db: Db, actor: Actor, entry: AuditEntry): Promise<void> {
  const payload: Record<string, Json> = { source: entry.source };
  const before = scrub(entry.before);
  const after = scrub(entry.after);
  if (before && Object.keys(before).length > 0) payload.before = before;
  if (after && Object.keys(after).length > 0) payload.after = after;

  try {
    await data.insertActivity(db, {
      project_id: entry.projectId ?? null,
      company_id: entry.companyId ?? null,
      actor_id: actorProfileId(actor),
      actor_type: actorType(actor),
      actor_label: actor.label.slice(0, 120),
      event_type: entry.action.slice(0, 60),
      entity_type: entry.entityType.slice(0, 60),
      entity_id: entry.entityId ?? null,
      description: entry.description.slice(0, 500),
      visibility: entry.visibility,
      data: payload,
    });
  } catch (error) {
    console.error(
      "portal.audit.failed",
      JSON.stringify({ entry: { ...entry, actor: actor.label, actorType: actorType(actor) } }),
      error,
    );
  }
}

/** Field-diff helper: returns before/after limited to fields that changed. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: readonly (keyof T & string)[],
): { before: Record<string, unknown>; after: Record<string, unknown>; changed: string[] } {
  const beforeOut: Record<string, unknown> = {};
  const afterOut: Record<string, unknown> = {};
  const changed: string[] = [];
  for (const field of fields) {
    if (before[field] !== after[field]) {
      beforeOut[field] = before[field];
      afterOut[field] = after[field];
      changed.push(field);
    }
  }
  return { before: beforeOut, after: afterOut, changed };
}
