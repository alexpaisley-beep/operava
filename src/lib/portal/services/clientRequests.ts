import { actorProfileId, assertOperavaActor } from "../authz";
import { recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import { notify } from "../notify";
import { decideClientRequestChange } from "../transitions";
import { CLIENT_REQUEST_STATUS_LABELS, type ClientRequestRow } from "../types";
import type { ClientRequestTransitionInput, CreateClientRequestInput } from "../validation";
import { loadProjectForActor, nowIso, type ServiceCtx } from "./context";

export async function createClientRequest(
  ctx: ServiceCtx,
  input: CreateClientRequestInput,
): Promise<ClientRequestRow> {
  assertOperavaActor(ctx.actor);
  const project = await loadProjectForActor(ctx, input.projectId);

  const request = await data.insertClientRequest(ctx.db, {
    project_id: project.id,
    title: input.title,
    description: input.description,
    due_date: input.dueDate ?? null,
    created_by: actorProfileId(ctx.actor),
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "client_request.created",
    description: `Action requested from customer: ${request.title}`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "client_request",
    entityId: request.id,
    visibility: "customer",
    after: { title: request.title, dueDate: request.due_date },
    source: ctx.source,
  });

  await notify(ctx.db, {
    type: "client_request_created",
    companyId: project.company_id,
    projectId: project.id,
    projectName: project.name,
    title: request.title,
    description: request.description,
    dueDate: request.due_date,
  });

  return request;
}

/**
 * All four transitions (acknowledge / complete / cancel / reopen) run through
 * here; the state machine in transitions.ts decides who may do what. Customer
 * access is tenant-checked against the request's project before anything else.
 */
export async function transitionClientRequest(
  ctx: ServiceCtx,
  input: ClientRequestTransitionInput,
): Promise<ClientRequestRow> {
  const before = await data.getClientRequest(ctx.db, input.clientRequestId);
  if (!before) throw new PortalError("not_found", "Request not found.");
  const project = await loadProjectForActor(ctx, before.project_id);

  const decision = decideClientRequestChange(before, input.status, ctx.actor, nowIso());
  if (!decision.ok) throw new PortalError("invalid_transition", decision.reason);
  if (decision.noop) return before;

  const patch = { ...decision.patch } as Partial<ClientRequestRow>;
  if (input.status === "completed") patch.completed_by = actorProfileId(ctx.actor);

  const request = await data.updateClientRequest(ctx.db, before.id, patch);

  await recordAudit(ctx.db, ctx.actor, {
    action: `client_request.${request.status}`,
    description: `"${request.title}" ${CLIENT_REQUEST_STATUS_LABELS[request.status].toLowerCase()}.`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "client_request",
    entityId: request.id,
    visibility: "customer",
    before: { status: before.status },
    after: { status: request.status },
    source: ctx.source,
  });

  return request;
}
