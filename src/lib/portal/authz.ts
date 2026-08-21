/**
 * The actor model and every authorization decision, as pure functions.
 *
 * Nothing in here touches the database. Callers load whatever facts a
 * decision needs (the project row, the caller's membership rows) and the
 * functions here decide. That keeps the rules unit-testable and keeps the UI,
 * the MCP and future automation on the same rules by construction.
 */

import { PortalError } from "./errors";
import type { ActorType } from "./types";

export type Actor =
  | { kind: "internal"; profileId: string; label: string }
  | { kind: "customer"; profileId: string; companyId: string; label: string }
  /** The MCP key authenticates Operava-side automation: privileged, like internal. */
  | { kind: "mcp"; label: string }
  | { kind: "system"; label: string };

export function actorType(actor: Actor): ActorType {
  return actor.kind;
}

export function actorProfileId(actor: Actor): string | null {
  return actor.kind === "internal" || actor.kind === "customer" ? actor.profileId : null;
}

/** Operava-side actors: full management access. */
export function isOperavaActor(actor: Actor): boolean {
  return actor.kind === "internal" || actor.kind === "mcp" || actor.kind === "system";
}

export function assertOperavaActor(actor: Actor): void {
  if (!isOperavaActor(actor)) {
    throw new PortalError("forbidden", "Only Operava can perform this action.");
  }
}

export function assertCustomerActor(
  actor: Actor,
): asserts actor is Extract<Actor, { kind: "customer" }> {
  if (actor.kind !== "customer") {
    throw new PortalError("forbidden", "Only a customer user can perform this action.");
  }
}

/**
 * Facts needed to decide whether a customer can touch a project. The
 * membership list is the caller's own project_members rows: an empty list
 * means "no narrowing — every project of their company".
 */
export type ProjectAccessFacts = {
  projectCompanyId: string;
  memberProjectIds: readonly string[];
};

export function customerCanAccessProject(
  actor: Extract<Actor, { kind: "customer" }>,
  projectId: string,
  facts: ProjectAccessFacts,
): boolean {
  if (facts.projectCompanyId !== actor.companyId) return false;
  if (facts.memberProjectIds.length === 0) return true;
  return facts.memberProjectIds.includes(projectId);
}

/**
 * The one project-access gate every service uses. Operava-side actors pass;
 * customers pass only for a project of their own company (narrowed by
 * project membership when any exists). Failure is reported as `not_found`,
 * not `forbidden`, so probing IDs across tenants confirms nothing.
 */
export function assertActorCanAccessProject(
  actor: Actor,
  projectId: string,
  facts: ProjectAccessFacts,
): void {
  if (isOperavaActor(actor)) return;
  if (actor.kind === "customer" && customerCanAccessProject(actor, projectId, facts)) return;
  throw new PortalError("not_found", "Project not found.");
}
