/**
 * Narrow data access for the service layer, all through the service-role
 * client. Each function does exactly one query; services own authorization,
 * validation, audit and composition. Unit tests fake this module.
 *
 * RLS does not apply to the service role, which is why nothing outside
 * `services/` may import this module.
 */

import type { PostgrestError } from "@supabase/supabase-js";

import type { TablesInsert, TablesUpdate } from "./database.types";
import { PortalError } from "./errors";
import type { Db } from "./supabase/server";
import type {
  ActivityRow,
  BillingRecordRow,
  ClientRequestRow,
  CompanyRow,
  MilestoneRow,
  ProfileRow,
  ProjectFileRow,
  ProjectLinkRow,
  ProjectRow,
  ProjectUpdateRow,
  RequestCommentRow,
  RequestRow,
} from "./types";

function dbError(operation: string, error: PostgrestError): PortalError {
  console.error(`portal.db_error ${operation}`, error.code, error.message);
  return new PortalError("db_error", `Database operation failed (${operation}).`, {
    hint: error.code,
  });
}

/* --- Companies ----------------------------------------------------------- */

export async function getCompany(db: Db, id: string): Promise<CompanyRow | null> {
  const { data, error } = await db.from("companies").select("*").eq("id", id).maybeSingle();
  if (error) throw dbError("companies.get", error);
  return data;
}

export async function getCompanyBySlug(db: Db, slug: string): Promise<CompanyRow | null> {
  const { data, error } = await db.from("companies").select("*").eq("slug", slug).maybeSingle();
  if (error) throw dbError("companies.get_by_slug", error);
  return data;
}

export async function insertCompany(
  db: Db,
  row: TablesInsert<"companies">,
): Promise<CompanyRow> {
  const { data, error } = await db.from("companies").insert(row).select("*").single();
  if (error) throw dbError("companies.insert", error);
  return data;
}

export async function updateCompany(
  db: Db,
  id: string,
  patch: TablesUpdate<"companies">,
): Promise<CompanyRow> {
  const { data, error } = await db
    .from("companies")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError("companies.update", error);
  return data;
}

/* --- Profiles ------------------------------------------------------------ */

export async function getProfile(db: Db, id: string): Promise<ProfileRow | null> {
  const { data, error } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw dbError("profiles.get", error);
  return data;
}

export async function getProfileByEmail(db: Db, email: string): Promise<ProfileRow | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw dbError("profiles.get_by_email", error);
  return data;
}

export async function getProfileByAuthUserId(
  db: Db,
  authUserId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw dbError("profiles.get_by_auth_user", error);
  return data;
}

export async function insertProfile(
  db: Db,
  row: TablesInsert<"profiles">,
): Promise<ProfileRow> {
  const { data, error } = await db.from("profiles").insert(row).select("*").single();
  if (error) throw dbError("profiles.insert", error);
  return data;
}

/** The caller's own project_members rows; empty means "no narrowing". */
export async function getMemberProjectIds(db: Db, profileId: string): Promise<string[]> {
  const { data, error } = await db
    .from("project_members")
    .select("project_id")
    .eq("profile_id", profileId);
  if (error) throw dbError("project_members.list", error);
  return (data ?? []).map((row) => row.project_id);
}

/* --- Projects ------------------------------------------------------------ */

export async function getProject(db: Db, id: string): Promise<ProjectRow | null> {
  const { data, error } = await db.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw dbError("projects.get", error);
  return data;
}

export async function insertProject(
  db: Db,
  row: TablesInsert<"projects">,
): Promise<ProjectRow> {
  const { data, error } = await db.from("projects").insert(row).select("*").single();
  if (error) throw dbError("projects.insert", error);
  return data;
}

export async function updateProject(
  db: Db,
  id: string,
  patch: TablesUpdate<"projects">,
): Promise<ProjectRow> {
  const { data, error } = await db
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError("projects.update", error);
  return data;
}

/* --- Milestones ---------------------------------------------------------- */

export async function getMilestone(db: Db, id: string): Promise<MilestoneRow | null> {
  const { data, error } = await db.from("milestones").select("*").eq("id", id).maybeSingle();
  if (error) throw dbError("milestones.get", error);
  return data;
}

export async function insertMilestone(
  db: Db,
  row: TablesInsert<"milestones">,
): Promise<MilestoneRow> {
  const { data, error } = await db.from("milestones").insert(row).select("*").single();
  if (error) throw dbError("milestones.insert", error);
  return data;
}

export async function updateMilestone(
  db: Db,
  id: string,
  patch: TablesUpdate<"milestones">,
): Promise<MilestoneRow> {
  const { data, error } = await db
    .from("milestones")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError("milestones.update", error);
  return data;
}

export async function deleteMilestone(db: Db, id: string): Promise<void> {
  const { error } = await db.from("milestones").delete().eq("id", id);
  if (error) throw dbError("milestones.delete", error);
}

export async function maxMilestoneSortOrder(db: Db, projectId: string): Promise<number> {
  const { data, error } = await db
    .from("milestones")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw dbError("milestones.max_sort", error);
  return data?.sort_order ?? 0;
}

/* --- Project updates ----------------------------------------------------- */

export async function insertProjectUpdate(
  db: Db,
  row: TablesInsert<"project_updates">,
): Promise<ProjectUpdateRow> {
  const { data, error } = await db.from("project_updates").insert(row).select("*").single();
  if (error) throw dbError("project_updates.insert", error);
  return data;
}

/* --- Client requests ----------------------------------------------------- */

export async function getClientRequest(db: Db, id: string): Promise<ClientRequestRow | null> {
  const { data, error } = await db
    .from("client_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw dbError("client_requests.get", error);
  return data;
}

export async function insertClientRequest(
  db: Db,
  row: TablesInsert<"client_requests">,
): Promise<ClientRequestRow> {
  const { data, error } = await db.from("client_requests").insert(row).select("*").single();
  if (error) throw dbError("client_requests.insert", error);
  return data;
}

export async function updateClientRequest(
  db: Db,
  id: string,
  patch: TablesUpdate<"client_requests">,
): Promise<ClientRequestRow> {
  const { data, error } = await db
    .from("client_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError("client_requests.update", error);
  return data;
}

/* --- Customer requests ---------------------------------------------------- */

export async function getRequest(db: Db, id: string): Promise<RequestRow | null> {
  const { data, error } = await db.from("requests").select("*").eq("id", id).maybeSingle();
  if (error) throw dbError("requests.get", error);
  return data;
}

export async function insertRequest(
  db: Db,
  row: TablesInsert<"requests">,
): Promise<RequestRow> {
  const { data, error } = await db.from("requests").insert(row).select("*").single();
  if (error) throw dbError("requests.insert", error);
  return data;
}

export async function updateRequest(
  db: Db,
  id: string,
  patch: TablesUpdate<"requests">,
): Promise<RequestRow> {
  const { data, error } = await db
    .from("requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError("requests.update", error);
  return data;
}

export async function insertRequestComment(
  db: Db,
  row: TablesInsert<"request_comments">,
): Promise<RequestCommentRow> {
  const { data, error } = await db.from("request_comments").insert(row).select("*").single();
  if (error) throw dbError("request_comments.insert", error);
  return data;
}

/* --- Links ---------------------------------------------------------------- */

export async function getProjectLink(db: Db, id: string): Promise<ProjectLinkRow | null> {
  const { data, error } = await db.from("project_links").select("*").eq("id", id).maybeSingle();
  if (error) throw dbError("project_links.get", error);
  return data;
}

export async function insertProjectLink(
  db: Db,
  row: TablesInsert<"project_links">,
): Promise<ProjectLinkRow> {
  const { data, error } = await db.from("project_links").insert(row).select("*").single();
  if (error) throw dbError("project_links.insert", error);
  return data;
}

export async function deleteProjectLink(db: Db, id: string): Promise<void> {
  const { error } = await db.from("project_links").delete().eq("id", id);
  if (error) throw dbError("project_links.delete", error);
}

/* --- Files ----------------------------------------------------------------- */

export async function getProjectFile(db: Db, id: string): Promise<ProjectFileRow | null> {
  const { data, error } = await db.from("project_files").select("*").eq("id", id).maybeSingle();
  if (error) throw dbError("project_files.get", error);
  return data;
}

export async function insertProjectFile(
  db: Db,
  row: TablesInsert<"project_files">,
): Promise<ProjectFileRow> {
  const { data, error } = await db.from("project_files").insert(row).select("*").single();
  if (error) throw dbError("project_files.insert", error);
  return data;
}

export async function deleteProjectFile(db: Db, id: string): Promise<void> {
  const { error } = await db.from("project_files").delete().eq("id", id);
  if (error) throw dbError("project_files.delete", error);
}

/* --- Billing --------------------------------------------------------------- */

export async function getBillingRecord(db: Db, id: string): Promise<BillingRecordRow | null> {
  const { data, error } = await db
    .from("billing_records")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw dbError("billing_records.get", error);
  return data;
}

export async function insertBillingRecord(
  db: Db,
  row: TablesInsert<"billing_records">,
): Promise<BillingRecordRow> {
  const { data, error } = await db.from("billing_records").insert(row).select("*").single();
  if (error) throw dbError("billing_records.insert", error);
  return data;
}

export async function updateBillingRecord(
  db: Db,
  id: string,
  patch: TablesUpdate<"billing_records">,
): Promise<BillingRecordRow> {
  const { data, error } = await db
    .from("billing_records")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError("billing_records.update", error);
  return data;
}

export async function deleteBillingRecord(db: Db, id: string): Promise<void> {
  const { error } = await db.from("billing_records").delete().eq("id", id);
  if (error) throw dbError("billing_records.delete", error);
}

/* --- Activity -------------------------------------------------------------- */

export async function insertActivity(
  db: Db,
  row: TablesInsert<"activity_log">,
): Promise<ActivityRow> {
  const { data, error } = await db.from("activity_log").insert(row).select("*").single();
  if (error) throw dbError("activity_log.insert", error);
  return data;
}

/* --- MCP idempotency ledger ------------------------------------------------ */

export async function getMcpOp(
  db: Db,
  tool: string,
  key: string,
): Promise<{ result: unknown; created_at: string } | null> {
  const { data, error } = await db
    .from("mcp_ops")
    .select("result, created_at")
    .eq("tool", tool)
    .eq("idempotency_key", key)
    .maybeSingle();
  if (error) throw dbError("mcp_ops.get", error);
  return data;
}

/**
 * Claim an idempotency key. Returns true when this call owns the key, false
 * when another execution already claimed it (unique-violation race included).
 */
export async function claimMcpOp(
  db: Db,
  tool: string,
  key: string,
  result: unknown,
): Promise<boolean> {
  const { error } = await db.from("mcp_ops").insert({
    tool,
    idempotency_key: key,
    result: result as never,
  });
  if (!error) return true;
  if (error.code === "23505") return false; // unique_violation: someone else won
  throw dbError("mcp_ops.claim", error);
}

export async function updateMcpOp(
  db: Db,
  tool: string,
  key: string,
  result: unknown,
): Promise<void> {
  const { error } = await db
    .from("mcp_ops")
    .update({ result: result as never })
    .eq("tool", tool)
    .eq("idempotency_key", key);
  if (error) throw dbError("mcp_ops.update", error);
}

export async function deleteMcpOp(db: Db, tool: string, key: string): Promise<void> {
  const { error } = await db
    .from("mcp_ops")
    .delete()
    .eq("tool", tool)
    .eq("idempotency_key", key);
  if (error) throw dbError("mcp_ops.delete", error);
}
