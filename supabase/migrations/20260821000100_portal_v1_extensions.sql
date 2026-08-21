-- Portal v1 extensions.
--
-- Everything here is additive on the 2026-08-19 baseline: new columns get safe
-- defaults, new tables get RLS before they can hold data, and no existing row
-- is rewritten. The one policy change (milestones gain a visibility flag) is a
-- strict narrowing of what clients can see.

-- ---------------------------------------------------------------------------
-- Customers: contact identity, lifecycle status, internal notes
-- ---------------------------------------------------------------------------

create type company_status as enum ('prospect', 'active', 'paused', 'archived');

alter table companies
  add column status company_status not null default 'active',
  add column primary_contact_name text not null default '' check (length(primary_contact_name) <= 160),
  add column contact_email text not null default '' check (length(contact_email) <= 320),
  add column contact_phone text not null default '' check (length(contact_phone) <= 40),
  add column internal_notes text not null default '';

-- ---------------------------------------------------------------------------
-- Projects: customer-facing summary, health, owner, completion, internal notes
-- ---------------------------------------------------------------------------

-- `blocked` completes the machine-operable vocabulary; `on_hold` already
-- covers "paused" and `ready_for_review` covers "review".
alter type project_status add value if not exists 'blocked' after 'waiting_on_client';

create type project_health as enum ('on_track', 'at_risk', 'off_track');

alter table projects
  add column summary text not null default '' check (length(summary) <= 1000),
  add column health project_health not null default 'on_track',
  add column owner_profile_id uuid references profiles (id) on delete set null,
  add column actual_completion_date date,
  add column internal_notes text not null default '';

create index projects_owner_idx on projects (owner_profile_id);

-- ---------------------------------------------------------------------------
-- Milestones: customer-visible flag (existing rows stay visible)
-- ---------------------------------------------------------------------------

alter table milestones
  add column visibility visibility not null default 'customer';

drop policy milestones_client_read on milestones;
create policy milestones_client_read on milestones
  for select to authenticated
  using (visibility = 'customer' and portal_private.can_read_project(project_id));

-- ---------------------------------------------------------------------------
-- Client requests: action items Operava -> customer
-- (distinct from `requests`, which is customer -> Operava)
-- ---------------------------------------------------------------------------

create type client_request_status as enum ('open', 'acknowledged', 'completed', 'cancelled');

create table client_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  status client_request_status not null default 'open',
  due_date date,
  created_by uuid references profiles (id) on delete set null,
  acknowledged_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references profiles (id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_requests_project_idx on client_requests (project_id, status, created_at desc);

create trigger client_requests_touch before update on client_requests
  for each row execute function portal_touch_updated_at();

alter table client_requests enable row level security;

create policy client_requests_admin_all on client_requests
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
-- Action items are addressed to the customer, so every row is customer-visible.
-- Clients read directly; their transitions (acknowledge/complete) go through
-- the application's service layer, which validates the transition — so there is
-- deliberately no client UPDATE policy.
create policy client_requests_client_read on client_requests
  for select to authenticated
  using (portal_private.can_read_project(project_id));

-- ---------------------------------------------------------------------------
-- Project links: staging/production/repo/docs URLs
-- ---------------------------------------------------------------------------

create type link_kind as enum ('staging', 'production', 'repo', 'docs', 'design', 'other');

create table project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 120),
  url text not null check (url ~ '^https://' and length(url) <= 2048),
  kind link_kind not null default 'other',
  visibility visibility not null default 'customer',
  sort_order integer not null default 0,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_links_project_idx on project_links (project_id, sort_order);

create trigger project_links_touch before update on project_links
  for each row execute function portal_touch_updated_at();

alter table project_links enable row level security;

create policy project_links_admin_all on project_links
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy project_links_client_read on project_links
  for select to authenticated
  using (visibility = 'customer' and portal_private.can_read_project(project_id));

-- ---------------------------------------------------------------------------
-- Audit trail: who (and what kind of who) did what, with state snapshots
-- ---------------------------------------------------------------------------

create type actor_type as enum ('internal', 'customer', 'mcp', 'system');

alter table activity_log
  alter column project_id drop not null,
  add column company_id uuid references companies (id) on delete cascade,
  add column actor_type actor_type not null default 'internal',
  add column actor_label text not null default '' check (length(actor_label) <= 120),
  add column entity_type text not null default '' check (length(entity_type) <= 60),
  add column entity_id uuid,
  add column data jsonb not null default '{}'::jsonb,
  add constraint activity_log_scope check (project_id is not null or company_id is not null);

create index activity_log_company_idx on activity_log (company_id, created_at desc);

drop policy activity_log_client_read on activity_log;
create policy activity_log_client_read on activity_log
  for select to authenticated
  using (
    visibility = 'customer'
    and (
      (project_id is not null and portal_private.can_read_project(project_id))
      or (
        project_id is null
        and company_id is not null
        and company_id = portal_private.company_id()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- MCP idempotency ledger: duplicate mutations replay their stored result
-- ---------------------------------------------------------------------------

create table mcp_ops (
  id uuid primary key default gen_random_uuid(),
  tool text not null check (length(tool) <= 80),
  idempotency_key text not null check (length(idempotency_key) between 1 and 200),
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (tool, idempotency_key)
);

-- Service-role only: RLS on with no policies denies every API role.
alter table mcp_ops enable row level security;

-- ---------------------------------------------------------------------------
-- Column-level privileges: internal fields never cross PostgREST
--
-- RLS is row-level, so a client hitting /rest/v1 directly could otherwise
-- select internal_notes off their own company/project rows. Revoking table
-- SELECT and granting an explicit customer-safe column list closes that at the
-- database. Admin and MCP paths read through the service role, which is
-- unaffected. (App code must name columns for these tables — `select=*` will
-- be rejected for API roles, which is the point.)
-- ---------------------------------------------------------------------------

revoke select on companies from authenticated, anon;
grant select (
  id, name, slug, status, primary_contact_name, contact_email, contact_phone,
  created_at, updated_at
) on companies to authenticated;

revoke select on projects from authenticated, anon;
grant select (
  id, company_id, name, description, summary, status, health, phase,
  current_work, progress_percent, start_date, target_date,
  actual_completion_date, owner_profile_id, is_archived, created_at, updated_at
) on projects to authenticated;

-- billing_records.notes is Operava-internal
revoke select on billing_records from authenticated, anon;
grant select (
  id, project_id, label, amount, currency, status, due_date, paid_at,
  external_url, sort_order, created_at, updated_at
) on billing_records to authenticated;

-- activity_log.data carries before/after snapshots for forensics; the customer
-- timeline only ever needs the descriptive columns.
revoke select on activity_log from authenticated, anon;
grant select (
  id, project_id, company_id, actor_id, actor_type, actor_label, event_type,
  entity_type, entity_id, description, visibility, created_at
) on activity_log to authenticated;

-- The idempotency ledger is infrastructure: no API role reads it.
revoke all on mcp_ops from authenticated, anon;
