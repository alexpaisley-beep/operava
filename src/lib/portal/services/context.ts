import type { Actor } from "../authz";
import { assertActorCanAccessProject, isOperavaActor } from "../authz";
import * as data from "../data";
import { PortalError } from "../errors";
import type { Db } from "../supabase/server";
import type { ProjectRow } from "../types";

/**
 * Everything a service call needs: the service-role client, the acting
 * principal, and where the call physically came from (for the audit trail).
 */
export type ServiceCtx = {
  db: Db;
  actor: Actor;
  source: "admin_ui" | "portal" | "mcp" | "system";
};

/**
 * Load a project and prove this actor may touch it. The single tenant gate
 * for every project-scoped mutation: Operava-side actors pass on existence;
 * customers pass only inside their own company (and project membership, when
 * any is configured). Missing and forbidden are both `not_found`.
 */
export async function loadProjectForActor(
  ctx: ServiceCtx,
  projectId: string,
): Promise<ProjectRow> {
  const project = await data.getProject(ctx.db, projectId);
  if (!project) throw new PortalError("not_found", "Project not found.");
  if (!isOperavaActor(ctx.actor) && ctx.actor.kind === "customer") {
    const memberProjectIds = await data.getMemberProjectIds(ctx.db, ctx.actor.profileId);
    assertActorCanAccessProject(ctx.actor, project.id, {
      projectCompanyId: project.company_id,
      memberProjectIds,
    });
  }
  return project;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}
