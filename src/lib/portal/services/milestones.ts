import { assertOperavaActor } from "../authz";
import { diffFields, recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import { decideMilestoneStatusChange } from "../transitions";
import type { MilestoneRow } from "../types";
import type { CreateMilestoneInput, UpdateMilestoneInput } from "../validation";
import { loadProjectForActor, nowIso, type ServiceCtx } from "./context";

export async function createMilestone(
  ctx: ServiceCtx,
  input: CreateMilestoneInput,
): Promise<MilestoneRow> {
  assertOperavaActor(ctx.actor);
  const project = await loadProjectForActor(ctx, input.projectId);

  const sortOrder =
    input.sortOrder ?? (await data.maxMilestoneSortOrder(ctx.db, project.id)) + 10;

  const milestone = await data.insertMilestone(ctx.db, {
    project_id: project.id,
    name: input.name,
    description: input.description,
    status: input.status,
    due_date: input.dueDate ?? null,
    sort_order: sortOrder,
    visibility: input.visibility,
    completed_at: input.status === "complete" ? nowIso() : null,
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "milestone.created",
    description: `Milestone "${milestone.name}" added.`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "milestone",
    entityId: milestone.id,
    visibility: milestone.visibility,
    source: ctx.source,
  });

  return milestone;
}

export async function updateMilestone(
  ctx: ServiceCtx,
  input: UpdateMilestoneInput,
): Promise<MilestoneRow> {
  assertOperavaActor(ctx.actor);

  const before = await data.getMilestone(ctx.db, input.milestoneId);
  if (!before) throw new PortalError("not_found", "Milestone not found.");
  const project = await loadProjectForActor(ctx, before.project_id);

  const patch: Partial<MilestoneRow> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.status !== undefined) {
    const decision = decideMilestoneStatusChange(before, input.status, nowIso());
    if (!decision.ok) throw new PortalError("invalid_transition", decision.reason);
    patch.status = decision.patch.status;
    patch.completed_at = decision.patch.completed_at;
  }

  const milestone = await data.updateMilestone(ctx.db, before.id, patch);

  const diff = diffFields(before, milestone, [
    "name",
    "status",
    "due_date",
    "sort_order",
    "visibility",
  ]);
  await recordAudit(ctx.db, ctx.actor, {
    action:
      milestone.status === "complete" && before.status !== "complete"
        ? "milestone.completed"
        : "milestone.updated",
    description:
      milestone.status === "complete" && before.status !== "complete"
        ? `Milestone "${milestone.name}" completed.`
        : `Milestone "${milestone.name}" updated (${diff.changed.join(", ") || "description"}).`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "milestone",
    entityId: milestone.id,
    visibility: milestone.visibility,
    before: diff.before,
    after: diff.after,
    source: ctx.source,
  });

  return milestone;
}

export async function deleteMilestone(ctx: ServiceCtx, milestoneId: string): Promise<void> {
  assertOperavaActor(ctx.actor);

  const milestone = await data.getMilestone(ctx.db, milestoneId);
  if (!milestone) throw new PortalError("not_found", "Milestone not found.");
  const project = await loadProjectForActor(ctx, milestone.project_id);

  await data.deleteMilestone(ctx.db, milestone.id);

  await recordAudit(ctx.db, ctx.actor, {
    action: "milestone.deleted",
    description: `Milestone "${milestone.name}" removed.`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "milestone",
    entityId: milestone.id,
    visibility: "internal",
    before: { name: milestone.name, status: milestone.status },
    source: ctx.source,
  });
}
