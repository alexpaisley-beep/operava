import { actorProfileId, assertOperavaActor } from "../authz";
import { recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import type { ProjectLinkRow } from "../types";
import type { AddProjectLinkInput } from "../validation";
import { loadProjectForActor, type ServiceCtx } from "./context";

export async function addProjectLink(
  ctx: ServiceCtx,
  input: AddProjectLinkInput,
): Promise<ProjectLinkRow> {
  assertOperavaActor(ctx.actor);
  const project = await loadProjectForActor(ctx, input.projectId);

  const link = await data.insertProjectLink(ctx.db, {
    project_id: project.id,
    label: input.label,
    url: input.url,
    kind: input.kind,
    visibility: input.visibility,
    sort_order: input.sortOrder ?? 0,
    created_by: actorProfileId(ctx.actor),
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "link.added",
    description: `Link added: ${link.label}`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "project_link",
    entityId: link.id,
    visibility: link.visibility,
    after: { label: link.label, url: link.url, kind: link.kind },
    source: ctx.source,
  });

  return link;
}

export async function deleteProjectLink(ctx: ServiceCtx, linkId: string): Promise<void> {
  assertOperavaActor(ctx.actor);

  const link = await data.getProjectLink(ctx.db, linkId);
  if (!link) throw new PortalError("not_found", "Link not found.");
  const project = await loadProjectForActor(ctx, link.project_id);

  await data.deleteProjectLink(ctx.db, link.id);

  await recordAudit(ctx.db, ctx.actor, {
    action: "link.removed",
    description: `Link removed: ${link.label}`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "project_link",
    entityId: link.id,
    visibility: "internal",
    before: { label: link.label, url: link.url },
    source: ctx.source,
  });
}
