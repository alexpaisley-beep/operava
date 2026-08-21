/**
 * Read models for Operava-side surfaces: the admin UI and the MCP. All
 * queries run on the service-role client, so every caller must already be an
 * authenticated Operava principal (admin session or MCP key) — enforced at
 * the route/action/tool boundary, not here.
 */

import type { Db } from "../supabase/server";
import {
  toInternalActivity,
  toInternalBillingRecord,
  toInternalClientRequest,
  toInternalCompany,
  toInternalFile,
  toInternalLink,
  toInternalMilestone,
  toInternalProject,
  toInternalUpdate,
  type InternalActivity,
  type InternalClientRequest,
  type InternalCompany,
  type InternalMilestone,
  type InternalProject,
  type InternalUpdate,
} from "../serialize";
import type { ClientRequestStatus, CompanyStatus, ProjectStatus, RequestRow } from "../types";

type AuthorJoin = { author: { full_name: string } | null };

export type CustomerListItem = InternalCompany & { projectCount: number; userCount: number };

export async function listCustomers(
  db: Db,
  filter: { status?: CompanyStatus } = {},
): Promise<CustomerListItem[]> {
  let query = db
    .from("companies")
    .select("*, projects(count), profiles(count)")
    .order("name", { ascending: true });
  if (filter.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...toInternalCompany(row),
    projectCount: (row.projects as unknown as { count: number }[])[0]?.count ?? 0,
    userCount: (row.profiles as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export type CustomerDetail = {
  company: InternalCompany;
  users: { id: string; fullName: string; email: string; createdAt: string }[];
  projects: (InternalProject & { openClientRequests: number })[];
  activity: InternalActivity[];
};

export async function getCustomerDetail(
  db: Db,
  companyId: string,
): Promise<CustomerDetail | null> {
  const { data: company } = await db
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) return null;

  const [users, projects, activity] = await Promise.all([
    db
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("company_id", companyId)
      .eq("role", "client")
      .order("created_at", { ascending: true }),
    db
      .from("projects")
      .select("*, client_requests(status)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true }),
    db
      .from("activity_log")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    company: toInternalCompany(company),
    users: (users.data ?? []).map((u) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      createdAt: u.created_at,
    })),
    projects: (projects.data ?? []).map((row) => ({
      ...toInternalProject(row),
      openClientRequests: (
        row.client_requests as unknown as { status: ClientRequestStatus }[]
      ).filter((r) => r.status === "open" || r.status === "acknowledged").length,
    })),
    activity: (activity.data ?? []).map(toInternalActivity),
  };
}

export type ProjectListItem = InternalProject & { companyName: string };

export async function listProjects(
  db: Db,
  filter: { companyId?: string; status?: ProjectStatus; includeArchived?: boolean } = {},
): Promise<ProjectListItem[]> {
  let query = db
    .from("projects")
    .select("*, company:companies!projects_company_id_fkey(name)")
    .order("created_at", { ascending: true });
  if (filter.companyId) query = query.eq("company_id", filter.companyId);
  if (filter.status) query = query.eq("status", filter.status);
  if (!filter.includeArchived) query = query.eq("is_archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...toInternalProject(row),
    companyName: (row as unknown as { company: { name: string } | null }).company?.name ?? "",
  }));
}

export type ProjectDetail = {
  project: InternalProject;
  company: InternalCompany;
  ownerName: string | null;
  milestones: InternalMilestone[];
  updates: InternalUpdate[];
  clientRequests: InternalClientRequest[];
  links: ReturnType<typeof toInternalLink>[];
  files: ReturnType<typeof toInternalFile>[];
  billing: ReturnType<typeof toInternalBillingRecord>[];
  requests: RequestRow[];
  activity: InternalActivity[];
};

export async function getProjectDetail(
  db: Db,
  projectId: string,
): Promise<ProjectDetail | null> {
  const { data: project } = await db
    .from("projects")
    .select(
      "*, company:companies!projects_company_id_fkey(*), owner:profiles!projects_owner_profile_id_fkey(full_name)",
    )
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const [milestones, updates, clientRequests, links, files, billing, requests, activity] =
    await Promise.all([
      db.from("milestones").select("*").eq("project_id", projectId).order("sort_order"),
      db
        .from("project_updates")
        .select("*, author:profiles!project_updates_created_by_fkey(full_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30),
      db
        .from("client_requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      db.from("project_links").select("*").eq("project_id", projectId).order("sort_order"),
      db
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      db.from("billing_records").select("*").eq("project_id", projectId).order("sort_order"),
      db
        .from("requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      db
        .from("activity_log")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  const companyRow = (
    project as unknown as { company: Parameters<typeof toInternalCompany>[0] }
  ).company;

  return {
    project: toInternalProject(project),
    company: toInternalCompany(companyRow),
    ownerName:
      (project as unknown as { owner: { full_name: string } | null }).owner?.full_name ?? null,
    milestones: (milestones.data ?? []).map(toInternalMilestone),
    updates: (updates.data ?? []).map((row) =>
      toInternalUpdate(row, (row as unknown as AuthorJoin).author?.full_name),
    ),
    clientRequests: (clientRequests.data ?? []).map(toInternalClientRequest),
    links: (links.data ?? []).map(toInternalLink),
    files: (files.data ?? []).map(toInternalFile),
    billing: (billing.data ?? []).map(toInternalBillingRecord),
    requests: requests.data ?? [],
    activity: (activity.data ?? []).map(toInternalActivity),
  };
}

export type TimelineEntry =
  | ({ kind: "update" } & InternalUpdate)
  | {
      kind: "milestone";
      id: string;
      name: string;
      status: string;
      completedAt: string | null;
      dueDate: string | null;
    };

export async function getProjectTimeline(
  db: Db,
  projectId: string,
  options: { limit?: number; includeInternal?: boolean } = {},
): Promise<TimelineEntry[]> {
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  let updatesQuery = db
    .from("project_updates")
    .select("*, author:profiles!project_updates_created_by_fkey(full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!options.includeInternal) updatesQuery = updatesQuery.eq("visibility", "customer");

  const [updates, milestones] = await Promise.all([
    updatesQuery,
    db
      .from("milestones")
      .select("id, name, status, completed_at, due_date")
      .eq("project_id", projectId)
      .eq("status", "complete")
      .order("completed_at", { ascending: false })
      .limit(limit),
  ]);

  const entries: (TimelineEntry & { sortKey: string })[] = [
    ...(updates.data ?? []).map((row) => ({
      kind: "update" as const,
      ...toInternalUpdate(row, (row as unknown as AuthorJoin).author?.full_name),
      sortKey: row.created_at,
    })),
    ...(milestones.data ?? []).map((m) => ({
      kind: "milestone" as const,
      id: m.id,
      name: m.name,
      status: m.status,
      completedAt: m.completed_at,
      dueDate: m.due_date,
      sortKey: m.completed_at ?? "",
    })),
  ];
  entries.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
  return entries.slice(0, limit).map((entry) => {
    const { sortKey, ...rest } = entry;
    void sortKey;
    return rest;
  });
}

export async function listMilestonesInternal(
  db: Db,
  projectId: string,
): Promise<InternalMilestone[]> {
  const { data, error } = await db
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(toInternalMilestone);
}

export async function listClientRequestsInternal(
  db: Db,
  filter: { projectId?: string; companyId?: string; status?: ClientRequestStatus } = {},
): Promise<(InternalClientRequest & { projectName: string })[]> {
  let query = db
    .from("client_requests")
    .select("*, project:projects!client_requests_project_id_fkey(name, company_id)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter.projectId) query = query.eq("project_id", filter.projectId);
  if (filter.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []).filter((row) => {
    if (!filter.companyId) return true;
    return (
      (row as unknown as { project: { company_id: string } | null }).project?.company_id ===
      filter.companyId
    );
  });
  return rows.map((row) => ({
    ...toInternalClientRequest(row),
    projectName: (row as unknown as { project: { name: string } | null }).project?.name ?? "",
  }));
}

export async function getProjectActivity(
  db: Db,
  projectId: string,
  limit = 50,
): Promise<InternalActivity[]> {
  const { data, error } = await db
    .from("activity_log")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) throw error;
  return (data ?? []).map(toInternalActivity);
}

export type AdminOverview = {
  projects: ProjectListItem[];
  openClientRequests: (InternalClientRequest & { projectName: string })[];
  recentActivity: (InternalActivity & { projectName: string | null })[];
  customerCount: number;
};

export async function adminOverview(db: Db): Promise<AdminOverview> {
  const [projects, openRequests, activity, customers] = await Promise.all([
    listProjects(db, {}),
    listClientRequestsInternal(db, { status: "open" }),
    db
      .from("activity_log")
      .select("*, project:projects!activity_log_project_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(15),
    db.from("companies").select("id", { count: "exact", head: true }),
  ]);

  return {
    projects,
    openClientRequests: openRequests,
    recentActivity: (activity.data ?? []).map((row) => ({
      ...toInternalActivity(row),
      projectName:
        (row as unknown as { project: { name: string } | null }).project?.name ?? null,
    })),
    customerCount: customers.count ?? 0,
  };
}

export async function listAdminProfiles(
  db: Db,
): Promise<{ id: string; fullName: string; email: string }[]> {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, fullName: p.full_name, email: p.email }));
}
