"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z, type ZodType } from "zod";

import { runAction, type ActionState } from "@/lib/portal/action-state";
import { PortalError } from "@/lib/portal/errors";
import * as billingService from "@/lib/portal/services/billing";
import * as clientRequestService from "@/lib/portal/services/clientRequests";
import type { ServiceCtx } from "@/lib/portal/services/context";
import * as customerService from "@/lib/portal/services/customers";
import * as fileService from "@/lib/portal/services/files";
import * as inviteService from "@/lib/portal/services/invites";
import * as linkService from "@/lib/portal/services/links";
import * as milestoneService from "@/lib/portal/services/milestones";
import * as projectService from "@/lib/portal/services/projects";
import * as requestService from "@/lib/portal/services/requests";
import * as updateService from "@/lib/portal/services/updates";
import { createServiceClient } from "@/lib/portal/supabase/server";
import {
  addProjectLinkInput,
  addRequestCommentInput,
  clientRequestTransitionInput,
  createClientRequestInput,
  createCustomerInput,
  createMilestoneInput,
  createProjectInput,
  createProjectUpdateInput,
  inviteCustomerUserInput,
  registerFileInput,
  setRequestStatusInput,
  updateCustomerInput,
  updateMilestoneInput,
  updateProjectDetailsInput,
  updateProjectProgressInput,
  updateProjectStatusInput,
  updateProjectSummaryInput,
  upsertBillingRecordInput,
  uuid,
} from "@/lib/portal/validation";
import { getViewer, viewerActor } from "@/lib/portal/viewer";

async function adminCtx(): Promise<ServiceCtx> {
  const viewer = await getViewer();
  if (!viewer) throw new PortalError("unauthorized", "Sign in to continue.");
  if (viewer.role !== "admin") throw new PortalError("forbidden", "Operava staff only.");
  return { db: createServiceClient(), actor: viewerActor(viewer), source: "admin_ui" };
}

/** FormData → plain object; empty strings become undefined so zod optionals work. */
function fields(formData: FormData, names: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of names) {
    const raw = formData.get(name);
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (value !== "") out[name] = value;
  }
  return out;
}

function parseWith<Schema extends ZodType>(schema: Schema, value: unknown): z.output<Schema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new PortalError(
      "validation_failed",
      result.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join(" "),
    );
  }
  return result.data;
}

function revalidateProject(projectId: string): void {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/admin");
}

/* ------------------------------ customers ------------------------------- */

export async function createCustomerAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await adminCtx().catch(() => null);
  if (!ctx) return { status: "error", message: "Operava staff only." };
  let companyId: string | null = null;
  const state = await runAction(async () => {
    const input = parseWith(
      createCustomerInput,
      fields(formData, [
        "name",
        "primaryContactName",
        "contactEmail",
        "contactPhone",
        "status",
        "internalNotes",
      ]),
    );
    const company = await customerService.createCustomer(ctx, input);
    companyId = company.id;
  });
  if (state.status === "ok" && companyId) {
    revalidatePath("/admin/customers");
    redirect(`/admin/customers/${companyId}`);
  }
  return state;
}

export async function updateCustomerAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const values = fields(formData, [
      "customerId",
      "name",
      "primaryContactName",
      "contactEmail",
      "contactPhone",
      "status",
    ]);
    // Notes may legitimately be cleared, so keep empty strings for these.
    values.internalNotes = String(formData.get("internalNotes") ?? "");
    values.primaryContactName = String(formData.get("primaryContactName") ?? "");
    values.contactEmail = String(formData.get("contactEmail") ?? "").trim();
    values.contactPhone = String(formData.get("contactPhone") ?? "");
    const input = parseWith(updateCustomerInput, values);
    await customerService.updateCustomer(ctx, input);
    revalidatePath(`/admin/customers/${input.customerId}`);
    revalidatePath("/admin/customers");
  });
}

export type InviteState = ActionState & { inviteUrl?: string };

export async function inviteCustomerUserAction(
  _state: InviteState,
  formData: FormData,
): Promise<InviteState> {
  let inviteUrl: string | undefined;
  const state = await runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      inviteCustomerUserInput,
      fields(formData, ["companyId", "email", "fullName"]),
    );
    const result = await inviteService.inviteCustomerUser(ctx, input);
    inviteUrl = result.inviteUrl;
    revalidatePath(`/admin/customers/${input.companyId}`);
    return result.emailAttempted
      ? "Invite created and emailed. The link below also works if the email goes missing."
      : "Invite created. Email delivery isn't configured, so send them the link below.";
  });
  return { ...state, inviteUrl };
}

/* ------------------------------ projects -------------------------------- */

export async function createProjectAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await adminCtx().catch(() => null);
  if (!ctx) return { status: "error", message: "Operava staff only." };
  let projectId: string | null = null;
  const state = await runAction(async () => {
    const input = parseWith(
      createProjectInput,
      fields(formData, [
        "companyId",
        "name",
        "description",
        "summary",
        "status",
        "phase",
        "startDate",
        "targetDate",
        "ownerProfileId",
      ]),
    );
    const project = await projectService.createProject(ctx, input);
    projectId = project.id;
  });
  if (state.status === "ok" && projectId) {
    revalidatePath("/admin");
    redirect(`/admin/projects/${projectId}`);
  }
  return state;
}

export async function updateProjectStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      updateProjectStatusInput,
      fields(formData, ["projectId", "status", "note"]),
    );
    const project = await projectService.updateProjectStatus(ctx, input);
    revalidateProject(project.id);
    return "Status updated.";
  });
}

export async function updateProjectProgressAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const values = fields(formData, ["projectId", "phase", "currentWork", "health"]);
    const rawPercent = String(formData.get("progressPercent") ?? "").trim();
    if (rawPercent !== "") {
      const parsedPercent = Number(rawPercent);
      if (!Number.isFinite(parsedPercent)) {
        throw new PortalError("validation_failed", "Progress must be a number from 0 to 100.");
      }
      values.progressPercent = parsedPercent;
    }
    // Allow explicitly clearing phase/current work.
    if (formData.get("phase") !== null)
      values.phase = String(formData.get("phase") ?? "").trim();
    if (formData.get("currentWork") !== null) {
      values.currentWork = String(formData.get("currentWork") ?? "").trim();
    }
    const input = parseWith(updateProjectProgressInput, values);
    const project = await projectService.updateProjectProgress(ctx, input);
    revalidateProject(project.id);
    return "Progress updated.";
  });
}

export async function updateProjectSummaryAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(updateProjectSummaryInput, {
      projectId: String(formData.get("projectId") ?? ""),
      summary: formData.get("summary") === null ? undefined : String(formData.get("summary")),
      description:
        formData.get("description") === null ? undefined : String(formData.get("description")),
    });
    const project = await projectService.updateProjectSummary(ctx, input);
    revalidateProject(project.id);
    return "Customer-facing copy updated.";
  });
}

export async function updateProjectDetailsAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const values: Record<string, unknown> = {
      projectId: String(formData.get("projectId") ?? ""),
    };
    const name = String(formData.get("name") ?? "").trim();
    if (name) values.name = name;
    for (const dateField of ["startDate", "targetDate"] as const) {
      if (formData.get(dateField) !== null) {
        const raw = String(formData.get(dateField)).trim();
        values[dateField] = raw === "" ? null : raw;
      }
    }
    if (formData.get("ownerProfileId") !== null) {
      const raw = String(formData.get("ownerProfileId")).trim();
      values.ownerProfileId = raw === "" ? null : raw;
    }
    if (formData.get("internalNotes") !== null) {
      values.internalNotes = String(formData.get("internalNotes"));
    }
    if (formData.get("isArchived") !== null) {
      values.isArchived = String(formData.get("isArchived")) === "true";
    }
    const input = parseWith(updateProjectDetailsInput, values);
    const project = await projectService.updateProjectDetails(ctx, input);
    revalidateProject(project.id);
    return "Project details saved.";
  });
}

/* ------------------------------- updates -------------------------------- */

export async function postUpdateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      createProjectUpdateInput,
      fields(formData, [
        "projectId",
        "title",
        "body",
        "updateType",
        "visibility",
        "milestoneId",
      ]),
    );
    const update = await updateService.createProjectUpdate(ctx, input);
    revalidateProject(update.project_id);
    return input.visibility === "customer"
      ? "Posted — the customer can see this now."
      : "Posted as an internal note.";
  });
}

/* ------------------------------ milestones ------------------------------ */

export async function createMilestoneAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      createMilestoneInput,
      fields(formData, ["projectId", "name", "description", "status", "dueDate", "visibility"]),
    );
    const milestone = await milestoneService.createMilestone(ctx, input);
    revalidateProject(milestone.project_id);
    return "Milestone added.";
  });
}

export async function updateMilestoneAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const values = fields(formData, [
      "milestoneId",
      "name",
      "description",
      "status",
      "visibility",
    ]);
    if (formData.get("dueDate") !== null) {
      const raw = String(formData.get("dueDate")).trim();
      values.dueDate = raw === "" ? null : raw;
    }
    const rawSort = String(formData.get("sortOrder") ?? "").trim();
    if (rawSort !== "") values.sortOrder = Number(rawSort);
    const input = parseWith(updateMilestoneInput, values);
    const milestone = await milestoneService.updateMilestone(ctx, input);
    revalidateProject(milestone.project_id);
    return "Milestone updated.";
  });
}

export async function deleteMilestoneAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const milestoneId = parseWith(uuid, String(formData.get("milestoneId") ?? ""));
    const projectId = parseWith(uuid, String(formData.get("projectId") ?? ""));
    await milestoneService.deleteMilestone(ctx, milestoneId);
    revalidateProject(projectId);
    return "Milestone removed.";
  });
}

/* ---------------------------- client requests --------------------------- */

export async function createClientRequestAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      createClientRequestInput,
      fields(formData, ["projectId", "title", "description", "dueDate"]),
    );
    const request = await clientRequestService.createClientRequest(ctx, input);
    revalidateProject(request.project_id);
    return "Action item created — the customer sees it now.";
  });
}

export async function transitionClientRequestAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      clientRequestTransitionInput,
      fields(formData, ["clientRequestId", "status"]),
    );
    const request = await clientRequestService.transitionClientRequest(ctx, input);
    revalidateProject(request.project_id);
    return "Updated.";
  });
}

/* -------------------------------- links --------------------------------- */

export async function addLinkAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      addProjectLinkInput,
      fields(formData, ["projectId", "label", "url", "kind", "visibility"]),
    );
    const link = await linkService.addProjectLink(ctx, input);
    revalidateProject(link.project_id);
    return "Link added.";
  });
}

export async function deleteLinkAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const linkId = parseWith(uuid, String(formData.get("linkId") ?? ""));
    const projectId = parseWith(uuid, String(formData.get("projectId") ?? ""));
    await linkService.deleteProjectLink(ctx, linkId);
    revalidateProject(projectId);
    return "Link removed.";
  });
}

/* -------------------------------- files --------------------------------- */

export async function uploadFileAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new PortalError("validation_failed", "Choose a file first.");
    }
    const input = parseWith(registerFileInput, {
      ...fields(formData, ["projectId", "category", "visibility"]),
      name: file.name,
    });
    const row = await fileService.uploadProjectFile(ctx, input, file);
    revalidateProject(row.project_id);
    return `Uploaded ${row.name}.`;
  });
}

export async function deleteFileAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const fileId = parseWith(uuid, String(formData.get("fileId") ?? ""));
    const projectId = parseWith(uuid, String(formData.get("projectId") ?? ""));
    await fileService.deleteProjectFile(ctx, fileId);
    revalidateProject(projectId);
    return "File removed.";
  });
}

/* ------------------------------- billing --------------------------------- */

export async function upsertBillingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const values = fields(formData, [
      "billingRecordId",
      "projectId",
      "label",
      "currency",
      "status",
      "dueDate",
      "externalUrl",
      "notes",
    ]);
    const rawAmount = String(formData.get("amount") ?? "").trim();
    const amount = Number(rawAmount);
    if (rawAmount === "" || !Number.isFinite(amount)) {
      throw new PortalError("validation_failed", "Enter the amount as a number.");
    }
    values.amount = amount;
    const input = parseWith(upsertBillingRecordInput, values);
    const record = await billingService.upsertBillingRecord(ctx, input);
    revalidateProject(record.project_id);
    return "Billing saved.";
  });
}

export async function deleteBillingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const billingRecordId = parseWith(uuid, String(formData.get("billingRecordId") ?? ""));
    const projectId = parseWith(uuid, String(formData.get("projectId") ?? ""));
    await billingService.deleteBillingRecord(ctx, billingRecordId);
    revalidateProject(projectId);
    return "Billing record removed.";
  });
}

/* --------------------------- customer requests --------------------------- */

export async function setRequestStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(setRequestStatusInput, fields(formData, ["requestId", "status"]));
    const request = await requestService.setRequestStatus(ctx, input);
    revalidateProject(request.project_id);
    return "Request status updated.";
  });
}

export async function addRequestCommentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await adminCtx();
    const input = parseWith(
      addRequestCommentInput,
      fields(formData, ["requestId", "body", "visibility"]),
    );
    const comment = await requestService.addRequestComment(ctx, input);
    const request = await ctx.db
      .from("requests")
      .select("project_id")
      .eq("id", comment.request_id)
      .maybeSingle();
    if (request.data) revalidateProject(request.data.project_id);
    return input.visibility === "customer"
      ? "Reply sent to the customer."
      : "Internal note added.";
  });
}
