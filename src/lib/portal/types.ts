/**
 * Domain vocabulary and row aliases.
 *
 * The enums mirror the Postgres types exactly (see database.types.ts, which is
 * generated from the live schema). App code imports from here so nothing
 * outside this module spells a status string by hand.
 */

import type { Database, Tables } from "./database.types";

type Enums = Database["public"]["Enums"];

export type ProjectStatus = Enums["project_status"];
export type ProjectHealth = Enums["project_health"];
export type MilestoneStatus = Enums["milestone_status"];
export type ClientRequestStatus = Enums["client_request_status"];
export type CompanyStatus = Enums["company_status"];
export type RequestType = Enums["request_type"];
export type RequestStatus = Enums["request_status"];
export type RequestPriority = Enums["request_priority"];
export type BillingStatus = Enums["billing_status"];
export type FileCategory = Enums["file_category"];
export type LinkKind = Enums["link_kind"];
export type Visibility = Enums["visibility"];
export type PortalRole = Enums["portal_role"];
export type ActorType = Enums["actor_type"];

export const PROJECT_STATUSES = [
  "planning",
  "in_progress",
  "testing",
  "waiting_on_client",
  "blocked",
  "ready_for_review",
  "launching",
  "complete",
  "on_hold",
] as const satisfies readonly ProjectStatus[];

export const PROJECT_HEALTHS = [
  "on_track",
  "at_risk",
  "off_track",
] as const satisfies readonly ProjectHealth[];

export const MILESTONE_STATUSES = [
  "upcoming",
  "in_progress",
  "blocked",
  "complete",
] as const satisfies readonly MilestoneStatus[];

export const CLIENT_REQUEST_STATUSES = [
  "open",
  "acknowledged",
  "completed",
  "cancelled",
] as const satisfies readonly ClientRequestStatus[];

export const COMPANY_STATUSES = [
  "prospect",
  "active",
  "paused",
  "archived",
] as const satisfies readonly CompanyStatus[];

export const REQUEST_TYPES = [
  "bug",
  "change_request",
  "question",
  "support",
  "feature_idea",
] as const satisfies readonly RequestType[];

export const REQUEST_STATUSES = [
  "submitted",
  "reviewing",
  "approved",
  "in_progress",
  "waiting_on_client",
  "done",
  "declined",
] as const satisfies readonly RequestStatus[];

export const BILLING_STATUSES = [
  "pending",
  "due",
  "paid",
  "overdue",
  "cancelled",
] as const satisfies readonly BillingStatus[];

export const FILE_CATEGORIES = [
  "contract",
  "specification",
  "deliverable",
  "documentation",
  "screenshot",
  "other",
] as const satisfies readonly FileCategory[];

export const LINK_KINDS = [
  "staging",
  "production",
  "repo",
  "docs",
  "design",
  "other",
] as const satisfies readonly LinkKind[];

/**
 * Update types are an application vocabulary stored in project_updates.category
 * (the column predates this build). Anything outside this list is rejected at
 * validation, so the column behaves like an enum without a migration.
 */
export const UPDATE_TYPES = [
  "progress",
  "milestone",
  "blocker",
  "client_action_required",
  "deployment",
  "general",
] as const;
export type UpdateType = (typeof UPDATE_TYPES)[number];

/* Row aliases — the shapes the service layer passes around. */
export type CompanyRow = Tables<"companies">;
export type ProfileRow = Tables<"profiles">;
export type ProjectRow = Tables<"projects">;
export type MilestoneRow = Tables<"milestones">;
export type ProjectUpdateRow = Tables<"project_updates">;
export type ClientRequestRow = Tables<"client_requests">;
export type RequestRow = Tables<"requests">;
export type RequestCommentRow = Tables<"request_comments">;
export type ProjectFileRow = Tables<"project_files">;
export type ProjectLinkRow = Tables<"project_links">;
export type BillingRecordRow = Tables<"billing_records">;
export type ActivityRow = Tables<"activity_log">;

/** Human labels for the UI. Keys are exhaustive — adding an enum value breaks the build here. */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In progress",
  testing: "Testing",
  waiting_on_client: "Waiting on you",
  blocked: "Blocked",
  ready_for_review: "Ready for review",
  launching: "Launching",
  complete: "Complete",
  on_hold: "On hold",
};

/** Same statuses, phrased for Operava's side of the desk. */
export const PROJECT_STATUS_LABELS_INTERNAL: Record<ProjectStatus, string> = {
  ...PROJECT_STATUS_LABELS,
  waiting_on_client: "Waiting on client",
};

export const PROJECT_HEALTH_LABELS: Record<ProjectHealth, string> = {
  on_track: "On track",
  at_risk: "At risk",
  off_track: "Off track",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In progress",
  blocked: "Blocked",
  complete: "Complete",
};

export const CLIENT_REQUEST_STATUS_LABELS: Record<ClientRequestStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  progress: "Progress",
  milestone: "Milestone",
  blocker: "Blocker",
  client_action_required: "Action required",
  deployment: "Deployment",
  general: "Update",
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  bug: "Bug report",
  change_request: "Change request",
  question: "Question",
  support: "Support",
  feature_idea: "Feature idea",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  approved: "Approved",
  in_progress: "In progress",
  waiting_on_client: "Waiting on you",
  done: "Done",
  declined: "Declined",
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  pending: "Pending",
  due: "Due",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  staging: "Staging",
  production: "Production",
  repo: "Repository",
  docs: "Documentation",
  design: "Design",
  other: "Link",
};

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  contract: "Contract",
  specification: "Specification",
  deliverable: "Deliverable",
  documentation: "Documentation",
  screenshot: "Screenshot",
  other: "File",
};
