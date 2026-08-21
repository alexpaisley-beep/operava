/**
 * The Operava MCP tool surface: a deliberate set of reads and writes over the
 * same service layer the admin UI uses. Every write validates with the
 * canonical zod schema, runs through the domain service (authorization,
 * transitions, audit), supports an idempotency key, and returns the
 * authoritative resulting state.
 */

import { z, type ZodRawShape, type ZodType } from "zod";

import { PortalError } from "../errors";
import * as internalReads from "../reads/internal";
import {
  toInternalBillingRecord,
  toInternalClientRequest,
  toInternalCompany,
  toInternalLink,
  toInternalMilestone,
  toInternalProject,
  toInternalUpdate,
} from "../serialize";
import * as billingService from "../services/billing";
import * as clientRequestService from "../services/clientRequests";
import type { ServiceCtx } from "../services/context";
import * as customerService from "../services/customers";
import * as milestoneService from "../services/milestones";
import * as projectService from "../services/projects";
import * as updateService from "../services/updates";
import * as linkService from "../services/links";
import { CLIENT_REQUEST_STATUSES, COMPANY_STATUSES, PROJECT_STATUSES } from "../types";
import {
  addProjectLinkInput,
  clientRequestTransitionInput,
  createClientRequestInput,
  createCustomerInput,
  createMilestoneInput,
  createProjectInput,
  createProjectUpdateInput,
  idempotencyKey,
  updateMilestoneInput,
  updateProjectProgressInput,
  updateProjectStatusInput,
  updateProjectSummaryInput,
  uuid,
  upsertBillingRecordInput,
} from "../validation";
import { runIdempotent } from "./idempotency";

export type McpToolDef = {
  name: string;
  title: string;
  description: string;
  /** Shape shown to clients in tools/list. Canonical validation happens in the handler. */
  inputShape: ZodRawShape;
  readOnly: boolean;
  handler: (ctx: ServiceCtx, args: Record<string, unknown>) => Promise<unknown>;
};

function parse<Schema extends ZodType>(schema: Schema, args: unknown): z.output<Schema> {
  const result = schema.safeParse(args ?? {});
  if (!result.success) {
    throw new PortalError(
      "validation_failed",
      result.error.issues
        .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
        .join("; "),
      {
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    );
  }
  return result.data;
}

/** Split the idempotency key off the tool arguments before canonical parsing. */
function takeKey(args: Record<string, unknown>): {
  key: string | undefined;
  rest: Record<string, unknown>;
} {
  const { idempotencyKey: rawKey, ...rest } = args;
  const key =
    typeof rawKey === "string" && rawKey.trim() ? rawKey.trim().slice(0, 200) : undefined;
  return { key, rest };
}

const idemShape = {
  idempotencyKey: idempotencyKey.describe(
    "Optional. Repeat a call with the same key and the stored result is returned instead of executing twice.",
  ),
};

export function buildTools(): McpToolDef[] {
  return [
    /* ------------------------------ reads ------------------------------ */
    {
      name: "list_customers",
      title: "List customers",
      description:
        "List Operava's customers (companies) with project and portal-user counts. Optionally filter by lifecycle status.",
      inputShape: { status: z.enum(COMPANY_STATUSES).optional() },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(z.object({ status: z.enum(COMPANY_STATUSES).optional() }), args);
        return { data: await internalReads.listCustomers(ctx.db, input) };
      },
    },
    {
      name: "get_customer",
      title: "Get customer",
      description:
        "Full detail for one customer: contact info, internal notes, portal users, projects (with open action-item counts) and recent company-level activity.",
      inputShape: { customerId: uuid },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(z.object({ customerId: uuid }), args);
        const detail = await internalReads.getCustomerDetail(ctx.db, input.customerId);
        if (!detail) throw new PortalError("not_found", "Customer not found.");
        return { data: detail };
      },
    },
    {
      name: "list_projects",
      title: "List projects",
      description:
        "List projects with status, health, phase, progress and customer name. Filter by customer or status; archived projects are excluded unless requested.",
      inputShape: {
        customerId: uuid.optional(),
        status: z.enum(PROJECT_STATUSES).optional(),
        includeArchived: z.boolean().optional(),
      },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(
          z.object({
            customerId: uuid.optional(),
            status: z.enum(PROJECT_STATUSES).optional(),
            includeArchived: z.boolean().optional(),
          }),
          args,
        );
        return {
          data: await internalReads.listProjects(ctx.db, {
            companyId: input.customerId,
            status: input.status,
            includeArchived: input.includeArchived,
          }),
        };
      },
    },
    {
      name: "get_project",
      title: "Get project",
      description:
        "Everything about one project: status, health, progress, dates, customer-facing summary, internal notes, milestones, recent updates (customer-visible and internal), open action items, links, files, billing state and recent audit activity. Fields marked internal must never be shared with the customer.",
      inputShape: { projectId: uuid },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(z.object({ projectId: uuid }), args);
        const detail = await internalReads.getProjectDetail(ctx.db, input.projectId);
        if (!detail) throw new PortalError("not_found", "Project not found.");
        return { data: detail };
      },
    },
    {
      name: "get_project_timeline",
      title: "Get project timeline",
      description:
        "Chronological timeline of posted updates (newest first), interleaved with completed milestones. By default only customer-visible updates; set includeInternal for the full internal picture.",
      inputShape: {
        projectId: uuid,
        limit: z.number().int().min(1).max(100).optional(),
        includeInternal: z.boolean().optional(),
      },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(
          z.object({
            projectId: uuid,
            limit: z.number().int().min(1).max(100).optional(),
            includeInternal: z.boolean().optional(),
          }),
          args,
        );
        return {
          data: await internalReads.getProjectTimeline(ctx.db, input.projectId, input),
        };
      },
    },
    {
      name: "list_project_milestones",
      title: "List project milestones",
      description:
        "The ordered milestone plan for a project, including internal-only milestones.",
      inputShape: { projectId: uuid },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(z.object({ projectId: uuid }), args);
        return { data: await internalReads.listMilestonesInternal(ctx.db, input.projectId) };
      },
    },
    {
      name: "list_client_requests",
      title: "List client action items",
      description:
        "Action items Operava has asked customers to do (e.g. send credentials, approve a build). Filter by project, customer or status. Open/acknowledged items explain any waiting_on_client project.",
      inputShape: {
        projectId: uuid.optional(),
        customerId: uuid.optional(),
        status: z.enum(CLIENT_REQUEST_STATUSES).optional(),
      },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(
          z.object({
            projectId: uuid.optional(),
            customerId: uuid.optional(),
            status: z.enum(CLIENT_REQUEST_STATUSES).optional(),
          }),
          args,
        );
        return {
          data: await internalReads.listClientRequestsInternal(ctx.db, {
            projectId: input.projectId,
            companyId: input.customerId,
            status: input.status,
          }),
        };
      },
    },
    {
      name: "get_project_activity",
      title: "Get project activity",
      description:
        "The audit trail for a project: who (human, customer, MCP or system) changed what and when, with before/after values, newest first.",
      inputShape: { projectId: uuid, limit: z.number().int().min(1).max(200).optional() },
      readOnly: true,
      handler: async (ctx, args) => {
        const input = parse(
          z.object({ projectId: uuid, limit: z.number().int().min(1).max(200).optional() }),
          args,
        );
        return {
          data: await internalReads.getProjectActivity(ctx.db, input.projectId, input.limit),
        };
      },
    },

    /* ------------------------------ writes ----------------------------- */
    {
      name: "create_customer",
      title: "Create customer",
      description:
        "Create a customer company. Provide the company name and contact details; a unique slug is generated. Use idempotencyKey to make retries safe.",
      inputShape: { ...createCustomerInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(createCustomerInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "create_customer",
          key,
          async () => toInternalCompany(await customerService.createCustomer(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "create_project",
      title: "Create project",
      description:
        "Create a project for a customer. summary is the customer-facing one-paragraph description shown in their portal.",
      inputShape: { ...createProjectInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(createProjectInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "create_project",
          key,
          async () => toInternalProject(await projectService.createProject(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "update_project_status",
      title: "Update project status",
      description:
        "Set a project's status (planning, in_progress, testing, waiting_on_client, blocked, ready_for_review, launching, complete, on_hold). Completing sets progress to 100 and stamps the completion date. Optionally include a short note for the audit trail. Status changes are customer-visible.",
      inputShape: { ...updateProjectStatusInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(updateProjectStatusInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "update_project_status",
          key,
          async () => toInternalProject(await projectService.updateProjectStatus(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "update_project_progress",
      title: "Update project progress",
      description:
        "Update progress percent (0–100), current phase, the one-line description of what is being worked on right now, and/or health (on_track, at_risk, off_track).",
      inputShape: { ...updateProjectProgressInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(updateProjectProgressInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "update_project_progress",
          key,
          async () => toInternalProject(await projectService.updateProjectProgress(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "update_project_summary",
      title: "Update project summary",
      description:
        "Rewrite the customer-facing summary and/or the longer project description shown in the customer portal.",
      inputShape: { ...updateProjectSummaryInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(updateProjectSummaryInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "update_project_summary",
          key,
          async () => toInternalProject(await projectService.updateProjectSummary(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "create_project_update",
      title: "Post project update",
      description:
        "Post a structured update to the project timeline. visibility 'customer' shows it in the customer portal and emails the customer; 'internal' keeps it Operava-only. updateType: progress, milestone, blocker, client_action_required, deployment or general. Optionally associate a milestone.",
      inputShape: { ...createProjectUpdateInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(createProjectUpdateInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "create_project_update",
          key,
          async () => toInternalUpdate(await updateService.createProjectUpdate(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "create_milestone",
      title: "Create milestone",
      description:
        "Add a milestone to a project's plan. sortOrder controls position (defaults to the end); visibility 'internal' hides it from the customer.",
      inputShape: { ...createMilestoneInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(createMilestoneInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "create_milestone",
          key,
          async () => toInternalMilestone(await milestoneService.createMilestone(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "update_milestone",
      title: "Update milestone",
      description:
        "Edit a milestone: rename, describe, reorder, change due date or visibility, or set status (upcoming, in_progress, blocked, complete). Completing stamps the completion time.",
      inputShape: { ...updateMilestoneInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(updateMilestoneInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "update_milestone",
          key,
          async () => toInternalMilestone(await milestoneService.updateMilestone(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "create_client_request",
      title: "Create client action item",
      description:
        "Ask the customer to do something (send assets, approve a build, connect an account). Always customer-visible; the customer is notified and can acknowledge/complete it in their portal.",
      inputShape: { ...createClientRequestInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(createClientRequestInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "create_client_request",
          key,
          async () =>
            toInternalClientRequest(await clientRequestService.createClientRequest(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "complete_client_request",
      title: "Complete client action item",
      description:
        "Mark a client action item completed (e.g. after the customer did the thing out-of-band). Completing an already-completed item is a safe no-op.",
      inputShape: { clientRequestId: uuid, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(clientRequestTransitionInput, {
          ...rest,
          status: "completed",
        });
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "complete_client_request",
          key,
          async () =>
            toInternalClientRequest(
              await clientRequestService.transitionClientRequest(ctx, input),
            ),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "add_project_link",
      title: "Add project link",
      description:
        "Attach an https link to a project (staging, production, repo, docs, design or other). visibility 'customer' shows it in the customer portal.",
      inputShape: { ...addProjectLinkInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(addProjectLinkInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "add_project_link",
          key,
          async () => toInternalLink(await linkService.addProjectLink(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
    {
      name: "record_billing",
      title: "Record billing state",
      description:
        "Create or update a billing line for a project (label, amount, status pending/due/paid/overdue/cancelled, optional due date and hosted-invoice URL). Pass billingRecordId to update an existing line. Customers see billing state (not internal notes) in their portal.",
      inputShape: { ...upsertBillingRecordInput.shape, ...idemShape },
      readOnly: false,
      handler: async (ctx, args) => {
        const { key, rest } = takeKey(args);
        const input = parse(upsertBillingRecordInput, rest);
        const { result, replayed } = await runIdempotent(
          ctx.db,
          "record_billing",
          key,
          async () =>
            toInternalBillingRecord(await billingService.upsertBillingRecord(ctx, input)),
        );
        return { data: result, replayed };
      },
    },
  ];
}
