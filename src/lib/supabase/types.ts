/**
 * Database types for the portal schema.
 *
 * Hand-written to match `supabase/migrations/0001_portal_schema.sql`. Once the
 * project exists these can be regenerated with the Supabase CLI:
 *
 *   supabase gen types typescript --project-id <ref> --schema public
 *
 * Until then this file is the contract, and it is worth keeping accurate — the
 * typed client is what stops a query selecting a column that no longer exists.
 */

export type PortalRole = "admin" | "client";

export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "testing"
  | "waiting_on_client"
  | "ready_for_review"
  | "launching"
  | "complete"
  | "on_hold";

export type MilestoneStatus = "upcoming" | "in_progress" | "blocked" | "complete";
export type BlockerStatus = "open" | "resolved";
export type BlockerWaitingOn = "client" | "operava" | "third_party";

export type RequestType = "bug" | "change_request" | "question" | "support" | "feature_idea";

export type RequestStatus =
  | "submitted"
  | "reviewing"
  | "approved"
  | "in_progress"
  | "waiting_on_client"
  | "done"
  | "declined";

export type RequestPriority = "low" | "normal" | "high" | "urgent";
export type BugSeverity = "minor" | "moderate" | "major" | "critical";

export type FileCategory =
  | "contract"
  | "specification"
  | "deliverable"
  | "documentation"
  | "screenshot"
  | "other";

export type BillingStatus = "pending" | "due" | "paid" | "overdue" | "cancelled";
export type Visibility = "customer" | "internal";
export type ApprovalStatus = "pending" | "approved" | "declined";

export type Company = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  auth_user_id: string;
  company_id: string | null;
  full_name: string;
  email: string;
  role: PortalRole;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  company_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  phase: string;
  current_work: string;
  progress_percent: number;
  start_date: string | null;
  target_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  project_id: string;
  profile_id: string;
  created_at: string;
};

export type ProjectUpdate = {
  id: string;
  project_id: string;
  title: string;
  body: string;
  category: string;
  visibility: Visibility;
  created_by: string | null;
  created_at: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  status: MilestoneStatus;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectBlocker = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: BlockerStatus;
  waiting_on: BlockerWaitingOn;
  created_at: string;
  resolved_at: string | null;
};

export type PortalRequest = {
  id: string;
  project_id: string;
  created_by: string | null;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority;
  severity: BugSeverity | null;
  expected_result: string;
  steps_to_reproduce: string;
  estimated_cost: number | null;
  estimated_timeline_impact: string;
  approval_status: ApprovalStatus | null;
  created_at: string;
  updated_at: string;
};

export type RequestComment = {
  id: string;
  request_id: string;
  created_by: string | null;
  body: string;
  visibility: Visibility;
  created_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  request_id: string | null;
  uploaded_by: string | null;
  name: string;
  path: string;
  category: FileCategory;
  size_bytes: number;
  mime_type: string;
  visibility: Visibility;
  created_at: string;
};

export type BillingRecord = {
  id: string;
  project_id: string;
  label: string;
  amount: number;
  currency: string;
  status: BillingStatus;
  due_date: string | null;
  paid_at: string | null;
  external_url: string | null;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ActivityEntry = {
  id: string;
  project_id: string;
  actor_id: string | null;
  event_type: string;
  description: string;
  visibility: Visibility;
  created_at: string;
};

/**
 * Insert shape: the columns a caller MUST supply, plus everything else as
 * optional.
 *
 * Most columns in this schema have a database default (`status`, `visibility`,
 * `priority`, every timestamp, and a long tail of `not null default ''`), so
 * requiring the full row on insert would force every call site to restate
 * defaults that already live in the migration — and drift from them the first
 * time one changes.
 */
type Insertable<T, Required extends keyof T> = Pick<T, Required> & Partial<Omit<T, Required>>;

/**
 * A foreign key, in the shape supabase-js reads to type embedded selects.
 *
 * `name` must match the actual Postgres constraint name, because that is the
 * disambiguation hint in `profiles!requests_created_by_fkey(...)`. Two tables
 * here point at `profiles` twice over, so the hint is not optional.
 */
type Fk<Name extends string, Column extends string, Relation extends string> = {
  foreignKeyName: Name;
  columns: [Column];
  isOneToOne: false;
  referencedRelation: Relation;
  referencedColumns: ["id"];
};

type Table<Row, Required extends keyof Row, Rel extends readonly unknown[] = []> = {
  Row: Row;
  Insert: Insertable<Row, Required>;
  Update: Partial<Row>;
  Relationships: Rel;
};

export type Database = {
  public: {
    Tables: {
      companies: Table<Company, "name" | "slug">;
      profiles: Table<
        Profile,
        "auth_user_id" | "email",
        [Fk<"profiles_company_id_fkey", "company_id", "companies">]
      >;
      projects: Table<
        Project,
        "company_id" | "name",
        [Fk<"projects_company_id_fkey", "company_id", "companies">]
      >;
      project_members: Table<
        ProjectMember,
        "project_id" | "profile_id",
        [
          Fk<"project_members_project_id_fkey", "project_id", "projects">,
          Fk<"project_members_profile_id_fkey", "profile_id", "profiles">,
        ]
      >;
      project_updates: Table<
        ProjectUpdate,
        "project_id" | "title",
        [
          Fk<"project_updates_project_id_fkey", "project_id", "projects">,
          Fk<"project_updates_created_by_fkey", "created_by", "profiles">,
        ]
      >;
      milestones: Table<
        Milestone,
        "project_id" | "name",
        [Fk<"milestones_project_id_fkey", "project_id", "projects">]
      >;
      project_blockers: Table<
        ProjectBlocker,
        "project_id" | "title",
        [Fk<"project_blockers_project_id_fkey", "project_id", "projects">]
      >;
      requests: Table<
        PortalRequest,
        "project_id" | "type" | "title",
        [
          Fk<"requests_project_id_fkey", "project_id", "projects">,
          Fk<"requests_created_by_fkey", "created_by", "profiles">,
        ]
      >;
      request_comments: Table<
        RequestComment,
        "request_id" | "body",
        [
          Fk<"request_comments_request_id_fkey", "request_id", "requests">,
          Fk<"request_comments_created_by_fkey", "created_by", "profiles">,
        ]
      >;
      project_files: Table<
        ProjectFile,
        "project_id" | "name" | "path",
        [
          Fk<"project_files_project_id_fkey", "project_id", "projects">,
          Fk<"project_files_request_id_fkey", "request_id", "requests">,
          Fk<"project_files_uploaded_by_fkey", "uploaded_by", "profiles">,
        ]
      >;
      billing_records: Table<
        BillingRecord,
        "project_id" | "label" | "amount",
        [Fk<"billing_records_project_id_fkey", "project_id", "projects">]
      >;
      activity_log: Table<
        ActivityEntry,
        "project_id" | "event_type" | "description",
        [
          Fk<"activity_log_project_id_fkey", "project_id", "projects">,
          Fk<"activity_log_actor_id_fkey", "actor_id", "profiles">,
        ]
      >;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      portal_role: PortalRole;
      project_status: ProjectStatus;
      milestone_status: MilestoneStatus;
      blocker_status: BlockerStatus;
      blocker_waiting_on: BlockerWaitingOn;
      request_type: RequestType;
      request_status: RequestStatus;
      request_priority: RequestPriority;
      bug_severity: BugSeverity;
      file_category: FileCategory;
      billing_status: BillingStatus;
      visibility: Visibility;
    };
    CompositeTypes: Record<never, never>;
  };
};
