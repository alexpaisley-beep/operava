"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BugSeverity, RequestPriority, RequestType } from "@/lib/supabase/types";
import { clean, validate, type Schema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";
import { requireViewer } from "./session";
import { logActivity } from "./activity";

const TYPES: RequestType[] = ["bug", "change_request", "question", "support", "feature_idea"];
const PRIORITIES: RequestPriority[] = ["low", "normal", "high", "urgent"];
const SEVERITIES: BugSeverity[] = ["minor", "moderate", "major", "critical"];

const BASE_SCHEMA: Schema = {
  title: { label: "Summary", required: true, min: 4, max: 200 },
  description: { label: "Details", required: true, min: 10, max: 5000 },
};

/**
 * Raise a request.
 *
 * The client supplies content only. Status, ownership and workflow columns are
 * set here — `created_by` from the session and `status` to 'submitted' — and
 * the RLS insert policy independently requires both to match, so a forged form
 * field cannot file a request as somebody else or open one already marked done.
 */
export async function createRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();

  const projectId = clean(formData.get("projectId"), 60);
  const rawType = clean(formData.get("type"), 40);
  const type = (TYPES as string[]).includes(rawType) ? (rawType as RequestType) : "support";

  const rawPriority = clean(formData.get("priority"), 20);
  const priority = (PRIORITIES as string[]).includes(rawPriority)
    ? (rawPriority as RequestPriority)
    : "normal";

  const rawSeverity = clean(formData.get("severity"), 20);
  const severity =
    type === "bug" && (SEVERITIES as string[]).includes(rawSeverity)
      ? (rawSeverity as BugSeverity)
      : null;

  const values = {
    title: clean(formData.get("title"), 200),
    description: clean(formData.get("description"), 5000),
    expectedResult: clean(formData.get("expectedResult"), 2000),
    stepsToReproduce: clean(formData.get("stepsToReproduce"), 2000),
  };

  const result = validate(values, BASE_SCHEMA);
  if (!result.ok) {
    return {
      errors: result.errors,
      values: { ...values, type, priority, severity: severity ?? "" },
    };
  }

  if (!projectId) {
    return {
      errors: {},
      values,
      formError:
        "We could not tell which project this is about. Reload the page and try again.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .insert({
      project_id: projectId,
      created_by: viewer.profile.id,
      type,
      title: values.title,
      description: values.description,
      status: "submitted",
      priority,
      severity,
      expected_result: type === "bug" ? values.expectedResult : "",
      steps_to_reproduce: type === "bug" ? values.stepsToReproduce : "",
      estimated_timeline_impact: "",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      errors: {},
      values,
      // The most likely cause is the RLS insert policy refusing a project the
      // viewer cannot reach, which is the system working. Say something a human
      // can act on rather than surfacing a Postgres error code.
      formError:
        "That request could not be saved. Refresh and try again, or email us directly.",
    };
  }

  await logActivity({
    projectId,
    actorId: viewer.profile.id,
    eventType: "request_created",
    description: `${viewer.profile.full_name || "A client"} raised “${values.title}”`,
  });

  // Attach any files the browser uploaded to storage before submitting.
  const uploaded = formData
    .getAll("uploadedFiles")
    .filter((v): v is string => typeof v === "string");
  if (uploaded.length > 0) {
    await attachUploads(projectId, data.id, viewer.profile.id, uploaded);
  }

  revalidatePath("/portal/requests");
  redirect(`/portal/requests/${data.id}`);
}

/**
 * Records rows for files the browser already put in Storage.
 *
 * Uploads go straight from the browser to Supabase Storage so a 25 MiB
 * attachment never travels through a server action, which has a much smaller
 * body limit. Each entry is `path|name|size|mime`; the path is re-derived
 * against the project id rather than trusted, so a tampered field cannot
 * register a row pointing at another project's folder.
 */
async function attachUploads(
  projectId: string,
  requestId: string,
  profileId: string,
  entries: string[],
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const rows = entries
    .slice(0, 5)
    .map((entry) => {
      const [path, name, size, mime] = entry.split("|");
      if (!path || !name) return null;
      if (!path.startsWith(`${projectId}/`)) return null;
      return {
        project_id: projectId,
        request_id: requestId,
        uploaded_by: profileId,
        name: name.slice(0, 255),
        path,
        category: "screenshot" as const,
        size_bytes: Number(size) > 0 ? Number(size) : 0,
        mime_type: (mime ?? "").slice(0, 120),
        visibility: "customer" as const,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length > 0) await supabase.from("project_files").insert(rows);
}

/* -------------------------------------------------------------------------
   Comments
------------------------------------------------------------------------- */

const COMMENT_SCHEMA: Schema = {
  body: { label: "Reply", required: true, min: 1, max: 10000 },
};

/**
 * Reply on a request thread.
 *
 * A client may only post `customer` visibility — enforced in the RLS insert
 * policy, not just here. Admins choose, and `internal` is invisible to clients
 * at the database level.
 */
export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();

  const requestId = clean(formData.get("requestId"), 60);
  const values = { body: clean(formData.get("body"), 10000) };

  const result = validate(values, COMMENT_SCHEMA);
  if (!result.ok) return { errors: result.errors, values };

  if (!requestId) {
    return { errors: {}, values, formError: "That thread could not be found." };
  }

  const internal = viewer.isAdmin && clean(formData.get("visibility"), 20) === "internal";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("request_comments").insert({
    request_id: requestId,
    created_by: viewer.profile.id,
    body: values.body,
    visibility: internal ? "internal" : "customer",
  });

  if (error) {
    return { errors: {}, values, formError: "That reply could not be posted. Try again." };
  }

  // Touch the parent so "Updated 2 minutes ago" in the list means what it says.
  // Clients have no UPDATE policy on `requests`, so this is a no-op for them —
  // deliberately: a customer reply must not be able to reorder Operava's queue.
  if (viewer.isAdmin) {
    await supabase
      .from("requests")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", requestId);
  }

  revalidatePath(`/portal/requests/${requestId}`);
  revalidatePath(`/portal/admin/requests/${requestId}`);
  return { errors: {}, values: {} };
}
