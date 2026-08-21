import { assertOperavaActor } from "../authz";
import { diffFields, recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import { notify } from "../notify";
import { decideProjectStatusChange } from "../transitions";
import { PROJECT_STATUS_LABELS_INTERNAL, type ProjectRow } from "../types";
import type {
  CreateProjectInput,
  UpdateProjectDetailsInput,
  UpdateProjectProgressInput,
  UpdateProjectStatusInput,
  UpdateProjectSummaryInput,
} from "../validation";
import { loadProjectForActor, todayIsoDate, type ServiceCtx } from "./context";

async function assertOwnerIsAdmin(ctx: ServiceCtx, ownerProfileId: string): Promise<void> {
  const owner = await data.getProfile(ctx.db, ownerProfileId);
  if (!owner || owner.role !== "admin") {
    throw new PortalError(
      "validation_failed",
      "Project owner must be an Operava staff profile.",
    );
  }
}

export async function createProject(
  ctx: ServiceCtx,
  input: CreateProjectInput,
): Promise<ProjectRow> {
  assertOperavaActor(ctx.actor);

  const company = await data.getCompany(ctx.db, input.companyId);
  if (!company) throw new PortalError("not_found", "Customer not found.");
  if (input.ownerProfileId) await assertOwnerIsAdmin(ctx, input.ownerProfileId);

  const project = await data.insertProject(ctx.db, {
    company_id: company.id,
    name: input.name,
    description: input.description,
    summary: input.summary,
    status: input.status,
    phase: input.phase,
    start_date: input.startDate ?? null,
    target_date: input.targetDate ?? null,
    owner_profile_id: input.ownerProfileId ?? null,
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "project.created",
    description: `Project "${project.name}" created for ${company.name}.`,
    projectId: project.id,
    companyId: company.id,
    entityType: "project",
    entityId: project.id,
    visibility: "customer",
    source: ctx.source,
  });

  return project;
}

export async function updateProjectStatus(
  ctx: ServiceCtx,
  input: UpdateProjectStatusInput,
): Promise<ProjectRow> {
  assertOperavaActor(ctx.actor);
  const before = await loadProjectForActor(ctx, input.projectId);

  const decision = decideProjectStatusChange(before, input.status, todayIsoDate());
  if (!decision.ok) throw new PortalError("invalid_transition", decision.reason);
  if (decision.noop) return before;

  const project = await data.updateProject(ctx.db, before.id, decision.patch);

  await recordAudit(ctx.db, ctx.actor, {
    action: "project.status_changed",
    description:
      `Status: ${PROJECT_STATUS_LABELS_INTERNAL[before.status]} → ${PROJECT_STATUS_LABELS_INTERNAL[project.status]}.` +
      (input.note ? ` ${input.note}` : ""),
    projectId: project.id,
    companyId: project.company_id,
    entityType: "project",
    entityId: project.id,
    visibility: "customer",
    before: { status: before.status },
    after: { status: project.status, note: input.note || undefined },
    source: ctx.source,
  });

  if (project.status === "complete") {
    await notify(ctx.db, {
      type: "project_completed",
      companyId: project.company_id,
      projectId: project.id,
      projectName: project.name,
    });
  }

  return project;
}

export async function updateProjectProgress(
  ctx: ServiceCtx,
  input: UpdateProjectProgressInput,
): Promise<ProjectRow> {
  assertOperavaActor(ctx.actor);
  const before = await loadProjectForActor(ctx, input.projectId);

  const patch: Partial<ProjectRow> = {};
  if (input.progressPercent !== undefined) patch.progress_percent = input.progressPercent;
  if (input.phase !== undefined) patch.phase = input.phase;
  if (input.currentWork !== undefined) patch.current_work = input.currentWork;
  if (input.health !== undefined) patch.health = input.health;

  const project = await data.updateProject(ctx.db, before.id, patch);

  const diff = diffFields(before, project, [
    "progress_percent",
    "phase",
    "current_work",
    "health",
  ]);
  await recordAudit(ctx.db, ctx.actor, {
    action: "project.progress_updated",
    description:
      diff.changed.length === 0
        ? "Progress reviewed, no change."
        : `Progress updated: ${diff.changed.join(", ")}.`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "project",
    entityId: project.id,
    visibility: "customer",
    before: diff.before,
    after: diff.after,
    source: ctx.source,
  });

  return project;
}

export async function updateProjectSummary(
  ctx: ServiceCtx,
  input: UpdateProjectSummaryInput,
): Promise<ProjectRow> {
  assertOperavaActor(ctx.actor);
  const before = await loadProjectForActor(ctx, input.projectId);

  const patch: Partial<ProjectRow> = {};
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.description !== undefined) patch.description = input.description;

  const project = await data.updateProject(ctx.db, before.id, patch);

  const diff = diffFields(before, project, ["summary", "description"]);
  await recordAudit(ctx.db, ctx.actor, {
    action: "project.summary_updated",
    description: `Customer-facing summary updated (${diff.changed.join(", ") || "no changes"}).`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "project",
    entityId: project.id,
    visibility: "customer",
    before: diff.before,
    after: diff.after,
    source: ctx.source,
  });

  return project;
}

export async function updateProjectDetails(
  ctx: ServiceCtx,
  input: UpdateProjectDetailsInput,
): Promise<ProjectRow> {
  assertOperavaActor(ctx.actor);
  const before = await loadProjectForActor(ctx, input.projectId);
  if (input.ownerProfileId) await assertOwnerIsAdmin(ctx, input.ownerProfileId);

  const patch: Partial<ProjectRow> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.targetDate !== undefined) patch.target_date = input.targetDate;
  if (input.ownerProfileId !== undefined) patch.owner_profile_id = input.ownerProfileId;
  if (input.internalNotes !== undefined) patch.internal_notes = input.internalNotes;
  if (input.isArchived !== undefined) patch.is_archived = input.isArchived;

  const project = await data.updateProject(ctx.db, before.id, patch);

  const diff = diffFields(before, project, [
    "name",
    "start_date",
    "target_date",
    "owner_profile_id",
    "internal_notes",
    "is_archived",
  ]);
  await recordAudit(ctx.db, ctx.actor, {
    action: "project.details_updated",
    description: `Project details updated (${diff.changed.join(", ") || "no changes"}).`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "project",
    entityId: project.id,
    // Details edits can touch internal notes; keep the whole entry internal.
    visibility: "internal",
    before: diff.before,
    after: diff.after,
    source: ctx.source,
  });

  return project;
}
