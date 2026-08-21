import { actorProfileId, assertOperavaActor, isOperavaActor } from "../authz";
import { recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import { REQUEST_STATUS_LABELS, type RequestCommentRow, type RequestRow } from "../types";
import type {
  AddRequestCommentInput,
  SetRequestStatusInput,
  SubmitRequestInput,
} from "../validation";
import { loadProjectForActor, type ServiceCtx } from "./context";

/** Customer → Operava: bug reports, change requests, questions. */
export async function submitRequest(
  ctx: ServiceCtx,
  input: SubmitRequestInput,
): Promise<RequestRow> {
  // Customers submit for their own projects; Operava can file on a customer's
  // behalf. Tenancy is enforced by loadProjectForActor either way.
  const project = await loadProjectForActor(ctx, input.projectId);

  const request = await data.insertRequest(ctx.db, {
    project_id: project.id,
    created_by: actorProfileId(ctx.actor),
    type: input.type,
    title: input.title,
    description: input.description,
    steps_to_reproduce: input.stepsToReproduce,
    expected_result: input.expectedResult,
    status: "submitted",
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "request.submitted",
    description: `Request submitted: ${request.title}`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "request",
    entityId: request.id,
    visibility: "customer",
    after: { type: request.type, title: request.title },
    source: ctx.source,
  });

  return request;
}

export async function setRequestStatus(
  ctx: ServiceCtx,
  input: SetRequestStatusInput,
): Promise<RequestRow> {
  assertOperavaActor(ctx.actor);

  const before = await data.getRequest(ctx.db, input.requestId);
  if (!before) throw new PortalError("not_found", "Request not found.");
  const project = await loadProjectForActor(ctx, before.project_id);

  if (before.status === input.status) return before;
  const request = await data.updateRequest(ctx.db, before.id, { status: input.status });

  await recordAudit(ctx.db, ctx.actor, {
    action: "request.status_changed",
    description: `Request "${request.title}": ${REQUEST_STATUS_LABELS[before.status]} → ${REQUEST_STATUS_LABELS[request.status]}.`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "request",
    entityId: request.id,
    visibility: "customer",
    before: { status: before.status },
    after: { status: request.status },
    source: ctx.source,
  });

  return request;
}

export async function addRequestComment(
  ctx: ServiceCtx,
  input: AddRequestCommentInput,
): Promise<RequestCommentRow> {
  const request = await data.getRequest(ctx.db, input.requestId);
  if (!request) throw new PortalError("not_found", "Request not found.");
  const project = await loadProjectForActor(ctx, request.project_id);

  // A customer can never write an internal comment.
  const visibility = isOperavaActor(ctx.actor) ? input.visibility : "customer";

  const comment = await data.insertRequestComment(ctx.db, {
    request_id: request.id,
    created_by: actorProfileId(ctx.actor),
    body: input.body,
    visibility,
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "request.comment_added",
    description: `Comment added on "${request.title}".`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "request_comment",
    entityId: comment.id,
    visibility: comment.visibility,
    source: ctx.source,
  });

  return comment;
}
