/**
 * Read models for the customer portal. Every query here runs on the
 * cookie-bound client, so RLS enforces tenancy and visibility even if this
 * code is wrong — and these functions additionally never select internal
 * columns (the database would refuse anyway: the API roles have column grants
 * only for the customer-safe lists).
 */

import type { Db } from "../supabase/server";
import {
  toCustomerBillingRecord,
  toCustomerClientRequest,
  toCustomerCompany,
  toCustomerFile,
  toCustomerLink,
  toCustomerMilestone,
  toCustomerProject,
  toCustomerRequest,
  toCustomerRequestComment,
  toCustomerUpdate,
  type CustomerBillingRecord,
  type CustomerClientRequest,
  type CustomerFile,
  type CustomerLink,
  type CustomerMilestone,
  type CustomerProject,
  type CustomerRequest,
  type CustomerUpdate,
} from "../serialize";
import type { CompanyRow, ProjectRow } from "../types";

const PROJECT_COLUMNS =
  "id, company_id, name, description, summary, status, health, phase, current_work, " +
  "progress_percent, start_date, target_date, actual_completion_date, owner_profile_id, " +
  "is_archived, created_at, updated_at";

const COMPANY_COLUMNS =
  "id, name, slug, status, primary_contact_name, contact_email, contact_phone, created_at, updated_at";

const BILLING_COLUMNS =
  "id, project_id, label, amount, currency, status, due_date, paid_at, external_url, sort_order, created_at, updated_at";

type OwnerJoin = { owner: { full_name: string } | null };
type AuthorJoin = { author: { full_name: string } | null };

export type CustomerHome = {
  company: ReturnType<typeof toCustomerCompany>;
  projects: CustomerProject[];
  openRequests: CustomerClientRequest[];
  recentUpdates: (CustomerUpdate & { projectId: string; projectName: string })[];
};

export async function customerHome(db: Db, companyId: string): Promise<CustomerHome | null> {
  const { data: company } = await db
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("id", companyId)
    .maybeSingle();
  if (!company) return null;

  const { data: projectRows } = await db
    .from("projects")
    .select(`${PROJECT_COLUMNS}, owner:profiles!projects_owner_profile_id_fkey(full_name)`)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });
  const projects = (projectRows ?? []).map((row) =>
    toCustomerProject(
      row as unknown as ProjectRow,
      (row as unknown as OwnerJoin).owner?.full_name,
    ),
  );

  const projectNames = new Map(projects.map((p) => [p.id, p.name]));
  const projectIds = [...projectNames.keys()];

  let openRequests: CustomerClientRequest[] = [];
  let recentUpdates: CustomerHome["recentUpdates"] = [];
  if (projectIds.length > 0) {
    const [{ data: requestRows }, { data: updateRows }] = await Promise.all([
      db
        .from("client_requests")
        .select("*")
        .in("project_id", projectIds)
        .in("status", ["open", "acknowledged"])
        .order("created_at", { ascending: true }),
      db
        .from("project_updates")
        .select("*, author:profiles!project_updates_created_by_fkey(full_name)")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    openRequests = (requestRows ?? []).map(toCustomerClientRequest);
    recentUpdates = (updateRows ?? []).map((row) => ({
      ...toCustomerUpdate(row, (row as unknown as AuthorJoin).author?.full_name),
      projectId: row.project_id,
      projectName: projectNames.get(row.project_id) ?? "",
    }));
  }

  return {
    company: toCustomerCompany(company as unknown as CompanyRow),
    projects,
    openRequests,
    recentUpdates,
  };
}

export type CustomerProjectDetail = {
  project: CustomerProject;
  milestones: CustomerMilestone[];
  updates: CustomerUpdate[];
  clientRequests: CustomerClientRequest[];
  links: CustomerLink[];
  files: CustomerFile[];
  billing: CustomerBillingRecord[];
  requests: CustomerRequest[];
};

export async function customerProject(
  db: Db,
  projectId: string,
): Promise<CustomerProjectDetail | null> {
  const { data: projectRow } = await db
    .from("projects")
    .select(`${PROJECT_COLUMNS}, owner:profiles!projects_owner_profile_id_fkey(full_name)`)
    .eq("id", projectId)
    .maybeSingle();
  if (!projectRow) return null;

  const [milestones, updates, clientRequests, links, files, billing, requests] =
    await Promise.all([
      db
        .from("milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      db
        .from("project_updates")
        .select("*, author:profiles!project_updates_created_by_fkey(full_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("client_requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      db
        .from("project_links")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      db
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      db
        .from("billing_records")
        .select(BILLING_COLUMNS)
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      db
        .from("requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    project: toCustomerProject(
      projectRow as unknown as ProjectRow,
      (projectRow as unknown as OwnerJoin).owner?.full_name,
    ),
    milestones: (milestones.data ?? []).map(toCustomerMilestone),
    updates: (updates.data ?? []).map((row) =>
      toCustomerUpdate(row, (row as unknown as AuthorJoin).author?.full_name),
    ),
    clientRequests: (clientRequests.data ?? []).map(toCustomerClientRequest),
    links: (links.data ?? []).map(toCustomerLink),
    files: (files.data ?? []).map(toCustomerFile),
    billing: (billing.data ?? []).map(toCustomerBillingRecord),
    requests: (requests.data ?? []).map(toCustomerRequest),
  };
}

export type CustomerRequestDetail = {
  request: CustomerRequest;
  projectName: string;
  comments: ReturnType<typeof toCustomerRequestComment>[];
};

export async function customerRequestDetail(
  db: Db,
  requestId: string,
): Promise<CustomerRequestDetail | null> {
  const { data: request } = await db
    .from("requests")
    .select("*, project:projects!requests_project_id_fkey(name)")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return null;

  const { data: comments } = await db
    .from("request_comments")
    .select("*, author:profiles!request_comments_created_by_fkey(full_name)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  return {
    request: toCustomerRequest(request),
    projectName:
      (request as unknown as { project: { name: string } | null }).project?.name ?? "",
    comments: (comments ?? []).map((row) =>
      toCustomerRequestComment(row, (row as unknown as AuthorJoin).author?.full_name),
    ),
  };
}
