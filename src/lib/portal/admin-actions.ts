"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BillingStatus,
  BlockerWaitingOn,
  FileCategory,
  MilestoneStatus,
  ProjectStatus,
  RequestPriority,
  RequestStatus,
  Visibility,
} from "@/lib/supabase/types";
import { clean, validate, type Schema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";
import { logActivity } from "./activity";
import { requireAdmin } from "./session";

/**
 * Every mutation Operava staff perform.
 *
 * `requireAdmin()` at the top of each one, and RLS behind that. Both matter:
 * the guard gives a non-admin a clean redirect instead of a database error, and
 * the policy is what actually stops them. Neither is sufficient alone — a guard
 * can be forgotten on a new action, and a policy cannot produce a good redirect.
 */

/* -------------------------------------------------------------------------
   Shared helpers
------------------------------------------------------------------------- */

function pick<T extends string>(
  raw: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = clean(raw, 40);
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** "" for an empty date input, which Postgres rejects for a `date` column. */
function dateOrNull(raw: FormDataEntryValue | null): string | null {
  const value = clean(raw, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function ok(): FormState {
  return { errors: {}, values: {} };
}

function fail(message: string, values: Record<string, string> = {}): FormState {
  return { errors: {}, values, formError: message };
}

const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "in_progress",
  "testing",
  "waiting_on_client",
  "ready_for_review",
  "launching",
  "complete",
  "on_hold",
];

/* -------------------------------------------------------------------------
   Companies
------------------------------------------------------------------------- */

const COMPANY_SCHEMA: Schema = {
  name: { label: "Company name", required: true, min: 2, max: 160 },
};

/** URL-safe slug from a company name. Uniqueness is the database's job. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function createCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const values = { name: clean(formData.get("name"), 160) };
  const result = validate(values, COMPANY_SCHEMA);
  if (!result.ok) return { errors: result.errors, values };

  const slug = slugify(values.name);
  if (!slug) return fail("That name has no usable characters for a URL slug.", values);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("companies").insert({ name: values.name, slug });

  if (error) {
    return fail(
      error.code === "23505"
        ? "A company with that name already exists."
        : "That company could not be created.",
      values,
    );
  }

  revalidatePath("/portal/admin/companies");
  return ok();
}

/* -------------------------------------------------------------------------
   Projects
------------------------------------------------------------------------- */

const PROJECT_SCHEMA: Schema = {
  name: { label: "Project name", required: true, min: 2, max: 200 },
};

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const companyId = clean(formData.get("companyId"), 60);
  const values = {
    name: clean(formData.get("name"), 200),
    description: clean(formData.get("description"), 2000),
  };

  const result = validate(values, PROJECT_SCHEMA);
  if (!result.ok) return { errors: result.errors, values };
  if (!companyId) return fail("Pick a company for this project.", values);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      company_id: companyId,
      name: values.name,
      description: values.description,
      status: "planning",
    })
    .select("id")
    .single();

  if (error || !data) return fail("That project could not be created.", values);

  revalidatePath("/portal/admin/projects");
  redirect(`/portal/admin/projects/${data.id}`);
}

export async function updateProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const projectId = clean(formData.get("projectId"), 60);
  if (!projectId) return fail("Missing project.");

  const values = {
    name: clean(formData.get("name"), 200),
    description: clean(formData.get("description"), 2000),
    phase: clean(formData.get("phase"), 120),
    currentWork: clean(formData.get("currentWork"), 500),
  };

  const result = validate(values, PROJECT_SCHEMA);
  if (!result.ok) return { errors: result.errors, values };

  const status = pick(formData.get("status"), PROJECT_STATUSES, "planning");
  const progressRaw = Number(clean(formData.get("progressPercent"), 5));
  const progress = Number.isFinite(progressRaw)
    ? Math.max(0, Math.min(100, Math.round(progressRaw)))
    : 0;

  const supabase = await createSupabaseServerClient();

  // Read the old status first so the activity line can say what changed.
  // A log entry that only says "status updated" is not worth writing.
  const { data: before } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();

  const { error } = await supabase
    .from("projects")
    .update({
      name: values.name,
      description: values.description,
      phase: values.phase,
      current_work: values.currentWork,
      status,
      progress_percent: progress,
      start_date: dateOrNull(formData.get("startDate")),
      target_date: dateOrNull(formData.get("targetDate")),
      is_archived: clean(formData.get("isArchived"), 10) === "on",
    })
    .eq("id", projectId);

  if (error) return fail("Those changes could not be saved.", values);

  if (before && before.status !== status) {
    await logActivity({
      projectId,
      actorId: admin.profile.id,
      eventType: "project_status_changed",
      description: `Project status changed to ${status.replace(/_/g, " ")}`,
    });
  }

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal");
  return ok();
}

/* -------------------------------------------------------------------------
   Updates
------------------------------------------------------------------------- */

const UPDATE_SCHEMA: Schema = {
  title: { label: "Title", required: true, min: 3, max: 200 },
};

export async function postUpdate(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const projectId = clean(formData.get("projectId"), 60);
  const values = {
    title: clean(formData.get("title"), 200),
    body: clean(formData.get("body"), 5000),
    category: clean(formData.get("category"), 60),
  };

  const result = validate(values, UPDATE_SCHEMA);
  if (!result.ok) return { errors: result.errors, values };
  if (!projectId) return fail("Missing project.", values);

  const visibility: Visibility =
    clean(formData.get("visibility"), 20) === "internal" ? "internal" : "customer";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_updates").insert({
    project_id: projectId,
    title: values.title,
    body: values.body,
    category: values.category,
    visibility,
    created_by: admin.profile.id,
  });

  if (error) return fail("That update could not be posted.", values);

  // Internal updates get an internal activity line, so an admin-only note never
  // announces itself in the customer's feed.
  await logActivity({
    projectId,
    actorId: admin.profile.id,
    eventType: "update_posted",
    description: `Update posted: ${values.title}`,
    visibility,
  });

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal");
  return ok();
}

/* -------------------------------------------------------------------------
   Milestones
------------------------------------------------------------------------- */

const MILESTONE_STATUSES: MilestoneStatus[] = [
  "upcoming",
  "in_progress",
  "blocked",
  "complete",
];

export async function saveMilestone(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const projectId = clean(formData.get("projectId"), 60);
  const milestoneId = clean(formData.get("milestoneId"), 60);
  const values = {
    name: clean(formData.get("name"), 200),
    description: clean(formData.get("description"), 1000),
  };

  const result = validate(values, {
    name: { label: "Name", required: true, min: 2, max: 200 },
  });
  if (!result.ok) return { errors: result.errors, values };
  if (!projectId) return fail("Missing project.", values);

  const status = pick(formData.get("status"), MILESTONE_STATUSES, "upcoming");
  const sortRaw = Number(clean(formData.get("sortOrder"), 5));

  const payload = {
    project_id: projectId,
    name: values.name,
    description: values.description,
    status,
    due_date: dateOrNull(formData.get("dueDate")),
    // Set when it flips to complete, cleared if it moves back — otherwise a
    // milestone reopened after a mistake keeps a completion date that is a lie.
    completed_at: status === "complete" ? new Date().toISOString() : null,
    sort_order: Number.isFinite(sortRaw) ? Math.trunc(sortRaw) : 0,
  };

  const supabase = await createSupabaseServerClient();
  const { error } = milestoneId
    ? await supabase.from("milestones").update(payload).eq("id", milestoneId)
    : await supabase.from("milestones").insert(payload);

  if (error) return fail("That milestone could not be saved.", values);

  if (status === "complete") {
    await logActivity({
      projectId,
      actorId: admin.profile.id,
      eventType: "milestone_completed",
      description: `Milestone completed: ${values.name}`,
    });
  }

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal");
  return ok();
}

export async function deleteMilestone(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = clean(formData.get("milestoneId"), 60);
  const projectId = clean(formData.get("projectId"), 60);
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("milestones").delete().eq("id", id);
  revalidatePath(`/portal/admin/projects/${projectId}`);
}

/* -------------------------------------------------------------------------
   Blockers
------------------------------------------------------------------------- */

const WAITING_ON: BlockerWaitingOn[] = ["client", "operava", "third_party"];

export async function saveBlocker(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const projectId = clean(formData.get("projectId"), 60);
  const values = {
    title: clean(formData.get("title"), 200),
    description: clean(formData.get("description"), 1000),
  };

  const result = validate(values, {
    title: { label: "Title", required: true, min: 3, max: 200 },
  });
  if (!result.ok) return { errors: result.errors, values };
  if (!projectId) return fail("Missing project.", values);

  const waitingOn = pick(formData.get("waitingOn"), WAITING_ON, "operava");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_blockers").insert({
    project_id: projectId,
    title: values.title,
    description: values.description,
    waiting_on: waitingOn,
    status: "open",
  });

  if (error) return fail("That item could not be saved.", values);

  await logActivity({
    projectId,
    actorId: admin.profile.id,
    eventType: "blocker_opened",
    description:
      waitingOn === "client" ? `Waiting on you: ${values.title}` : `Open item: ${values.title}`,
  });

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal");
  return ok();
}

export async function resolveBlocker(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = clean(formData.get("blockerId"), 60);
  const projectId = clean(formData.get("projectId"), 60);
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_blockers")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select("title")
    .maybeSingle();

  if (data && projectId) {
    await logActivity({
      projectId,
      actorId: admin.profile.id,
      eventType: "blocker_resolved",
      description: `Resolved: ${data.title}`,
    });
  }

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal");
}

/* -------------------------------------------------------------------------
   Requests
------------------------------------------------------------------------- */

const REQUEST_STATUSES: RequestStatus[] = [
  "submitted",
  "reviewing",
  "approved",
  "in_progress",
  "waiting_on_client",
  "done",
  "declined",
];
const PRIORITIES: RequestPriority[] = ["low", "normal", "high", "urgent"];

export async function updateRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const requestId = clean(formData.get("requestId"), 60);
  const projectId = clean(formData.get("projectId"), 60);
  if (!requestId) return fail("Missing request.");

  const status = pick(formData.get("status"), REQUEST_STATUSES, "submitted");
  const priority = pick(formData.get("priority"), PRIORITIES, "normal");

  const costRaw = clean(formData.get("estimatedCost"), 20);
  const cost = costRaw ? Number(costRaw.replace(/[^0-9.]/g, "")) : null;

  const approvalRaw = clean(formData.get("approvalStatus"), 20);
  const approval = ["pending", "approved", "declined"].includes(approvalRaw)
    ? approvalRaw
    : null;

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("requests")
    .select("status, title")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase
    .from("requests")
    .update({
      status,
      priority,
      estimated_cost: cost !== null && Number.isFinite(cost) && cost >= 0 ? cost : null,
      estimated_timeline_impact: clean(formData.get("timelineImpact"), 300),
      approval_status: approval as "pending" | "approved" | "declined" | null,
    })
    .eq("id", requestId);

  if (error) return fail("Those changes could not be saved.");

  if (before && before.status !== status && projectId) {
    await logActivity({
      projectId,
      actorId: admin.profile.id,
      eventType: "request_status_changed",
      description: `“${before.title}” is now ${status.replace(/_/g, " ")}`,
    });
  }

  revalidatePath(`/portal/admin/requests/${requestId}`);
  revalidatePath(`/portal/requests/${requestId}`);
  return ok();
}

/* -------------------------------------------------------------------------
   Billing
------------------------------------------------------------------------- */

const BILLING_STATUSES: BillingStatus[] = ["pending", "due", "paid", "overdue", "cancelled"];

export async function saveBillingRecord(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const projectId = clean(formData.get("projectId"), 60);
  const recordId = clean(formData.get("recordId"), 60);
  const values = {
    label: clean(formData.get("label"), 200),
    amount: clean(formData.get("amount"), 20),
    notes: clean(formData.get("notes"), 500),
    externalUrl: clean(formData.get("externalUrl"), 500),
  };

  const result = validate(values, {
    label: { label: "Label", required: true, min: 2, max: 200 },
    amount: { label: "Amount", required: true, max: 20 },
  });
  if (!result.ok) return { errors: result.errors, values };
  if (!projectId) return fail("Missing project.", values);

  const amount = Number(values.amount.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount < 0) {
    return { errors: { amount: "Enter an amount like 3000 or 3000.00." }, values };
  }

  // The column has a `https://` check constraint, so a bare domain would be
  // rejected by the database with an error nobody can read. Reject it here.
  if (values.externalUrl && !/^https:\/\//i.test(values.externalUrl)) {
    return { errors: { externalUrl: "Invoice links must start with https://" }, values };
  }

  const status = pick(formData.get("status"), BILLING_STATUSES, "pending");
  const paidAt = dateOrNull(formData.get("paidAt"));

  const payload = {
    project_id: projectId,
    label: values.label,
    amount,
    status,
    due_date: dateOrNull(formData.get("dueDate")),
    paid_at: status === "paid" ? (paidAt ?? new Date().toISOString()) : null,
    external_url: values.externalUrl,
    notes: values.notes,
  };

  const supabase = await createSupabaseServerClient();
  const { error } = recordId
    ? await supabase.from("billing_records").update(payload).eq("id", recordId)
    : await supabase.from("billing_records").insert(payload);

  if (error) return fail("That billing record could not be saved.", values);

  await logActivity({
    projectId,
    actorId: admin.profile.id,
    eventType: "billing_updated",
    description: `${values.label} marked ${status}`,
  });

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal/billing");
  return ok();
}

/* -------------------------------------------------------------------------
   Files
------------------------------------------------------------------------- */

const FILE_CATEGORIES: FileCategory[] = [
  "contract",
  "specification",
  "deliverable",
  "documentation",
  "screenshot",
  "other",
];

/**
 * Registers a file the admin's browser already uploaded to Storage.
 *
 * Same split as the client-side attachment flow: bytes go browser → Storage,
 * and only the metadata row comes through a server action. The path is checked
 * against the project id rather than trusted.
 */
export async function registerFile(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const projectId = clean(formData.get("projectId"), 60);
  const path = clean(formData.get("path"), 400);
  const name = clean(formData.get("name"), 255);

  if (!projectId || !path || !name) return fail("That upload did not complete. Try again.");
  if (!path.startsWith(`${projectId}/`))
    return fail("That file does not belong to this project.");

  const sizeRaw = Number(clean(formData.get("size"), 20));
  const visibility: Visibility =
    clean(formData.get("visibility"), 20) === "internal" ? "internal" : "customer";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("project_files").insert({
    project_id: projectId,
    uploaded_by: admin.profile.id,
    name,
    path,
    category: pick(formData.get("category"), FILE_CATEGORIES, "other"),
    size_bytes: Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 0,
    mime_type: clean(formData.get("mime"), 120),
    visibility,
  });

  if (error) return fail("That file could not be saved.");

  await logActivity({
    projectId,
    actorId: admin.profile.id,
    eventType: "file_uploaded",
    description: `File added: ${name}`,
    visibility,
  });

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal/files");
  return ok();
}

export async function deleteFile(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = clean(formData.get("fileId"), 60);
  const projectId = clean(formData.get("projectId"), 60);
  if (!id) return;

  const supabase = await createSupabaseServerClient();

  // Remove the object as well as the row. Leaving orphaned bytes in a private
  // bucket is a slow storage leak and, for a deleted contract, a real one.
  const { data } = await supabase
    .from("project_files")
    .select("path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("project_files").delete().eq("id", id);
  if (data?.path) await supabase.storage.from("project-files").remove([data.path]);

  revalidatePath(`/portal/admin/projects/${projectId}`);
  revalidatePath("/portal/files");
}
