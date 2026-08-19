import "server-only";

import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActivityEntry,
  BillingRecord,
  Company,
  Milestone,
  PortalRequest,
  Profile,
  Project,
  ProjectBlocker,
  ProjectFile,
  ProjectUpdate,
  RequestComment,
} from "@/lib/supabase/types";
import type { Viewer } from "./session";

/**
 * Every read the portal performs.
 *
 * These all use the request-scoped client, so RLS is what decides what comes
 * back. That is the point: a missing `.eq("project_id", …)` in here is a bug,
 * not a breach, because the database refuses rows the viewer cannot see either
 * way. Nothing in this file reaches for the service-role client.
 */

/* -------------------------------------------------------------------------
   Projects
------------------------------------------------------------------------- */

export type ProjectWithCompany = Project & { company: Pick<Company, "id" | "name"> | null };

/** Projects the viewer can see, active first, newest first within each group. */
export async function listProjects(): Promise<ProjectWithCompany[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("*, company:companies(id, name)")
    .order("is_archived", { ascending: true })
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Resolve which project a portal page is about.
 *
 * `?project=<id>` when given, otherwise the first non-archived one. Returning
 * null rather than throwing lets the overview render a real "no project yet"
 * state, which is what a customer sees between signing and kickoff.
 */
export async function resolveProject(
  requested: string | undefined,
  projects: ProjectWithCompany[],
): Promise<ProjectWithCompany | null> {
  if (requested) {
    const match = projects.find((project) => project.id === requested);
    // A project id that is not in the viewer's own list is either a typo or
    // somebody probing for another customer's data. Both get a 404; confirming
    // that an id exists but is forbidden is itself a disclosure.
    if (!match) notFound();
    return match;
  }
  return projects.find((project) => !project.is_archived) ?? projects[0] ?? null;
}

/** Single project by id, 404 if the viewer cannot see it. */
export async function getProjectOr404(projectId: string): Promise<ProjectWithCompany> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("*, company:companies(id, name)")
    .eq("id", projectId)
    .maybeSingle();

  if (!data) notFound();
  return data;
}

/* -------------------------------------------------------------------------
   Overview pieces
------------------------------------------------------------------------- */

export async function listMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  return data ?? [];
}

/** The milestone a customer should be looking at next. */
export function nextMilestone(milestones: Milestone[]): Milestone | null {
  return (
    milestones.find((m) => m.status === "in_progress") ??
    milestones.find((m) => m.status === "blocked") ??
    milestones.find((m) => m.status === "upcoming") ??
    null
  );
}

export async function listOpenBlockers(projectId: string): Promise<ProjectBlocker[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_blockers")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "open")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listAllBlockers(projectId: string): Promise<ProjectBlocker[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_blockers")
    .select("*")
    .eq("project_id", projectId)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type UpdateWithAuthor = ProjectUpdate & { author: Pick<Profile, "full_name"> | null };

export async function listUpdates(
  projectId: string,
  limit?: number,
): Promise<UpdateWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("project_updates")
    .select("*, author:profiles!project_updates_created_by_fkey(full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  return data ?? [];
}

export async function listActivity(projectId: string, limit = 12): Promise<ActivityEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/* -------------------------------------------------------------------------
   Requests
------------------------------------------------------------------------- */

export type RequestWithAuthor = PortalRequest & {
  author: Pick<Profile, "full_name"> | null;
};

export async function listRequests(projectId: string): Promise<RequestWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("requests")
    .select("*, author:profiles!requests_created_by_fkey(full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Requests still needing something from somebody. Drives the overview count.
 *
 * Generic so the caller keeps whatever it joined on — the admin queue embeds
 * the project, and a non-generic signature would quietly strip it back to a
 * bare row.
 */
export function openRequests<T extends Pick<PortalRequest, "status">>(requests: T[]): T[] {
  return requests.filter((r) => r.status !== "done" && r.status !== "declined");
}

export async function getRequestOr404(requestId: string): Promise<RequestWithAuthor> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("requests")
    .select("*, author:profiles!requests_created_by_fkey(full_name)")
    .eq("id", requestId)
    .maybeSingle();

  if (!data) notFound();
  return data;
}

export type CommentWithAuthor = RequestComment & {
  author: Pick<Profile, "full_name" | "role"> | null;
};

export async function listComments(requestId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("request_comments")
    .select("*, author:profiles!request_comments_created_by_fkey(full_name, role)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/* -------------------------------------------------------------------------
   Files and billing
------------------------------------------------------------------------- */

export type FileWithUploader = ProjectFile & {
  uploader: Pick<Profile, "full_name"> | null;
};

export async function listFiles(projectId: string): Promise<FileWithUploader[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_files")
    .select("*, uploader:profiles!project_files_uploaded_by_fkey(full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listRequestFiles(requestId: string): Promise<ProjectFile[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_files")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listBilling(projectId: string): Promise<BillingRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("billing_records")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  return data ?? [];
}

/** Records the customer still owes something on. */
export function outstandingBilling(records: BillingRecord[]): BillingRecord[] {
  return records.filter((r) => r.status === "due" || r.status === "overdue");
}

/* -------------------------------------------------------------------------
   Admin reads
------------------------------------------------------------------------- */

export async function listCompanies(): Promise<(Company & { projects: { id: string }[] })[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("companies")
    .select("*, projects(id)")
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getCompanyOr404(companyId: string): Promise<Company> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();
  if (!data) notFound();
  return data;
}

export async function listProfiles(companyId?: string): Promise<Profile[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: true });
  if (companyId) query = query.eq("company_id", companyId);
  const { data } = await query;
  return data ?? [];
}

/**
 * Every request across every project, for the admin queue. Open work first,
 * because the queue exists to be worked through rather than browsed.
 */
export async function listAllRequests(): Promise<
  (RequestWithAuthor & { project: Pick<Project, "id" | "name"> | null })[]
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("requests")
    .select(
      "*, author:profiles!requests_created_by_fkey(full_name), project:projects(id, name)",
    )
    .order("created_at", { ascending: false });

  return data ?? [];
}

/* -------------------------------------------------------------------------
   Composed reads
------------------------------------------------------------------------- */

export type OverviewData = {
  project: ProjectWithCompany;
  milestones: Milestone[];
  blockers: ProjectBlocker[];
  updates: UpdateWithAuthor[];
  requests: RequestWithAuthor[];
  activity: ActivityEntry[];
  billing: BillingRecord[];
};

/**
 * Everything the overview needs, fetched concurrently.
 *
 * Seven sequential round trips to the same region is a visibly slower page for
 * no reason — none of these depend on each other.
 */
export async function getOverview(project: ProjectWithCompany): Promise<OverviewData> {
  const [milestones, blockers, updates, requests, activity, billing] = await Promise.all([
    listMilestones(project.id),
    listOpenBlockers(project.id),
    listUpdates(project.id, 4),
    listRequests(project.id),
    listActivity(project.id, 10),
    listBilling(project.id),
  ]);

  return { project, milestones, blockers, updates, requests, activity, billing };
}

/** Convenience for pages that need the viewer and their project in one step. */
export async function loadProjectContext(
  viewer: Viewer,
  requestedProjectId: string | undefined,
): Promise<{ projects: ProjectWithCompany[]; project: ProjectWithCompany | null }> {
  void viewer;
  const projects = await listProjects();
  const project = await resolveProject(requestedProjectId, projects);
  return { projects, project };
}
