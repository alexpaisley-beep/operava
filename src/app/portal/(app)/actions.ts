"use server";

import { revalidatePath } from "next/cache";

import { runAction, type ActionState } from "@/lib/portal/action-state";
import { PortalError } from "@/lib/portal/errors";
import * as clientRequestService from "@/lib/portal/services/clientRequests";
import type { ServiceCtx } from "@/lib/portal/services/context";
import * as requestService from "@/lib/portal/services/requests";
import { createServiceClient } from "@/lib/portal/supabase/server";
import { REQUEST_TYPES, type RequestType } from "@/lib/portal/types";
import { submitRequestInput, uuid } from "@/lib/portal/validation";
import { getViewer, viewerActor } from "@/lib/portal/viewer";

/** Build a customer-actor service context for the signed-in viewer. */
async function customerCtx(): Promise<ServiceCtx> {
  const viewer = await getViewer();
  if (!viewer) throw new PortalError("unauthorized", "Sign in to continue.");
  if (viewer.role !== "client") {
    throw new PortalError("forbidden", "This action is for customer accounts.");
  }
  return { db: createServiceClient(), actor: viewerActor(viewer), source: "portal" };
}

function readId(formData: FormData, field: string): string {
  const parsed = uuid.safeParse(String(formData.get(field) ?? ""));
  if (!parsed.success) throw new PortalError("validation_failed", "Missing identifier.");
  return parsed.data;
}

export async function acknowledgeClientRequest(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await customerCtx();
    const request = await clientRequestService.transitionClientRequest(ctx, {
      clientRequestId: readId(formData, "clientRequestId"),
      status: "acknowledged",
    });
    revalidatePath(`/portal/projects/${request.project_id}`);
    revalidatePath("/portal");
    return "Marked as seen — we know you're on it.";
  });
}

export async function completeClientRequest(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await customerCtx();
    const request = await clientRequestService.transitionClientRequest(ctx, {
      clientRequestId: readId(formData, "clientRequestId"),
      status: "completed",
    });
    revalidatePath(`/portal/projects/${request.project_id}`);
    revalidatePath("/portal");
    return "Done — thanks, that unblocks us.";
  });
}

export async function submitCustomerRequest(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await customerCtx();
    const rawType = String(formData.get("type") ?? "");
    const parsed = submitRequestInput.safeParse({
      projectId: String(formData.get("projectId") ?? ""),
      type: (REQUEST_TYPES as readonly string[]).includes(rawType)
        ? (rawType as RequestType)
        : undefined,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
    if (!parsed.success) {
      throw new PortalError(
        "validation_failed",
        "Give the request a type, a short title and enough detail for us to act on.",
      );
    }
    const request = await requestService.submitRequest(ctx, parsed.data);
    revalidatePath(`/portal/projects/${request.project_id}`);
    return "Request sent. We'll pick it up and keep the status here current.";
  });
}

export async function addCustomerRequestComment(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    const ctx = await customerCtx();
    const requestId = readId(formData, "requestId");
    const body = String(formData.get("body") ?? "").trim();
    if (!body) throw new PortalError("validation_failed", "Write a comment first.");
    await requestService.addRequestComment(ctx, {
      requestId,
      body: body.slice(0, 10000),
      visibility: "customer",
    });
    revalidatePath(`/portal/requests/${requestId}`);
    return "Comment added.";
  });
}
