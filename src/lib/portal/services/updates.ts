import { actorProfileId, assertOperavaActor } from "../authz";
import { recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import { notify } from "../notify";
import type { ProjectUpdateRow } from "../types";
import type { CreateProjectUpdateInput } from "../validation";
import { loadProjectForActor, type ServiceCtx } from "./context";

export async function createProjectUpdate(
  ctx: ServiceCtx,
  input: CreateProjectUpdateInput,
): Promise<ProjectUpdateRow> {
  assertOperavaActor(ctx.actor);
  const project = await loadProjectForActor(ctx, input.projectId);

  if (input.milestoneId) {
    const milestone = await data.getMilestone(ctx.db, input.milestoneId);
    if (!milestone || milestone.project_id !== project.id) {
      throw new PortalError("validation_failed", "Milestone does not belong to this project.");
    }
  }

  const update = await data.insertProjectUpdate(ctx.db, {
    project_id: project.id,
    title: input.title,
    body: input.body,
    category: input.updateType,
    visibility: input.visibility,
    milestone_id: input.milestoneId ?? null,
    created_by: actorProfileId(ctx.actor),
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "update.posted",
    description: `Update posted: ${update.title}`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "project_update",
    entityId: update.id,
    visibility: update.visibility,
    after: { title: update.title, updateType: update.category, visibility: update.visibility },
    source: ctx.source,
  });

  if (update.visibility === "customer") {
    await notify(ctx.db, {
      type: "update_posted",
      companyId: project.company_id,
      projectId: project.id,
      projectName: project.name,
      title: update.title,
      body: update.body,
    });
  }

  return update;
}
