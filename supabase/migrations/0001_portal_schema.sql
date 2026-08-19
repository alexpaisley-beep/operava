-- ===========================================================================
-- Operava client portal — schema
--
-- One portal for the companies Operava builds software for. Two kinds of
-- person exist: Operava staff (`admin`) and a customer's people (`client`).
-- Everything a client can see hangs off exactly one company.
--
-- The security model is deliberately boring: every table has RLS on, and
-- every client-facing policy resolves through the SECURITY DEFINER helpers in
-- section 2 rather than by joining `profiles` inline. Joining inline is what
-- causes the classic "infinite recursion detected in policy" failure, because
-- the policy on `profiles` has to read `profiles` to evaluate itself.
--
-- Read this file top to bottom before changing a policy. Getting one wrong
-- here leaks one customer's project to another, which is the single worst
-- thing this application could do.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
--
-- Postgres enums rather than free text: a typo in a status column silently
-- breaks every filter that depends on it, and these vocabularies are small
-- and stable enough to be worth the migration cost when they change.
-- ---------------------------------------------------------------------------

create type portal_role as enum ('admin', 'client');

create type project_status as enum (
  'planning',
  'in_progress',
  'testing',
  'waiting_on_client',
  'ready_for_review',
  'launching',
  'complete',
  'on_hold'
);

create type milestone_status as enum ('upcoming', 'in_progress', 'blocked', 'complete');

create type blocker_status as enum ('open', 'resolved');

-- Who has to move for a blocker to clear. The whole point of the "Waiting on
-- you" panel is that a client never has to guess whether the ball is in their
-- court, so this is a first-class column rather than a note in the body.
create type blocker_waiting_on as enum ('client', 'operava', 'third_party');

create type request_type as enum (
  'bug',
  'change_request',
  'question',
  'support',
  'feature_idea'
);

create type request_status as enum (
  'submitted',
  'reviewing',
  'approved',
  'in_progress',
  'waiting_on_client',
  'done',
  'declined'
);

create type request_priority as enum ('low', 'normal', 'high', 'urgent');

-- Bug severity is kept separate from request priority on purpose. Priority is
-- Operava's scheduling decision; severity is the customer's description of
-- impact. Collapsing them loses the difference between "this is annoying but
-- urgent to me" and "this took the crew offline".
create type bug_severity as enum ('minor', 'moderate', 'major', 'critical');

create type file_category as enum (
  'contract',
  'specification',
  'deliverable',
  'documentation',
  'screenshot',
  'other'
);

create type billing_status as enum ('pending', 'due', 'paid', 'overdue', 'cancelled');

-- `internal` rows are invisible to clients at the DATABASE level, not by a
-- filter someone might forget to add to a query.
create type visibility as enum ('customer', 'internal');

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per person who can sign in. `auth_user_id` is the join to Supabase
-- Auth; `company_id` is null for admins, which is what makes them global.
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  company_id uuid references companies (id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 160),
  email text not null check (length(email) <= 320),
  role portal_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A client with no company can see nothing and is almost certainly a
  -- provisioning mistake. Reject it here rather than debugging an empty
  -- dashboard later.
  constraint client_requires_company check (role <> 'client' or company_id is not null)
);

create index profiles_company_idx on profiles (company_id);
create index profiles_auth_user_idx on profiles (auth_user_id);

create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200),
  description text not null default '',
  status project_status not null default 'planning',
  -- Free text rather than an enum: the phase label is how Operava talks about
  -- this specific build ("QuickBooks sync", "Crew app beta") and inventing a
  -- fixed vocabulary for it would just get worked around.
  phase text not null default '' check (length(phase) <= 120),
  -- What is on the bench right now. Surfaced on the overview as "Currently
  -- working on", which is the single most asked question a portal can answer.
  current_work text not null default '' check (length(current_work) <= 500),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  start_date date,
  target_date date,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_company_idx on projects (company_id);

-- Optional narrowing. A client with no membership row sees every project
-- belonging to their company; adding rows here restricts them to those
-- projects. Most customers will never need it, and modelling it now costs one
-- table and keeps the door open.
create table project_members (
  project_id uuid not null references projects (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create index project_members_profile_idx on project_members (profile_id);

create table project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  body text not null default '',
  category text not null default '' check (length(category) <= 60),
  visibility visibility not null default 'customer',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_updates_project_idx on project_updates (project_id, created_at desc);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200),
  description text not null default '',
  status milestone_status not null default 'upcoming',
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index milestones_project_idx on milestones (project_id, sort_order);

create table project_blockers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  status blocker_status not null default 'open',
  waiting_on blocker_waiting_on not null default 'operava',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index project_blockers_project_idx on project_blockers (project_id, status);

create table requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  type request_type not null,
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  status request_status not null default 'submitted',
  priority request_priority not null default 'normal',

  -- Bug-only detail. Nullable because a question does not have steps to
  -- reproduce, and forcing every request through one shape is how a simple
  -- form turns into a Jira ticket.
  severity bug_severity,
  expected_result text not null default '',
  steps_to_reproduce text not null default '',

  -- Change-request scaffolding. Populated by Operava when a change is priced.
  -- Deliberately inert for now: there is no billing automation attached to
  -- these columns, they exist so adding it later is not a migration of live
  -- customer data.
  estimated_cost numeric(12, 2) check (estimated_cost is null or estimated_cost >= 0),
  estimated_timeline_impact text not null default '',
  approval_status text check (
    approval_status is null
    or approval_status in ('pending', 'approved', 'declined')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index requests_project_idx on requests (project_id, created_at desc);
create index requests_status_idx on requests (status);

create table request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  body text not null check (length(trim(body)) between 1 and 10000),
  visibility visibility not null default 'customer',
  created_at timestamptz not null default now()
);

create index request_comments_request_idx on request_comments (request_id, created_at);

create table project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  request_id uuid references requests (id) on delete cascade,
  uploaded_by uuid references profiles (id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 255),
  -- Object key inside the private `project-files` bucket. Never a public URL:
  -- downloads go through a short-lived signed URL minted server-side.
  path text not null unique,
  category file_category not null default 'other',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  mime_type text not null default '',
  visibility visibility not null default 'customer',
  created_at timestamptz not null default now()
);

create index project_files_project_idx on project_files (project_id, created_at desc);
create index project_files_request_idx on project_files (request_id);

create table billing_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 200),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD' check (length(currency) = 3),
  status billing_status not null default 'pending',
  due_date date,
  paid_at timestamptz,
  -- Link out to whatever actually collects the money. There is no payment
  -- integration in the portal and this column is the whole reason none is
  -- needed yet.
  external_url text default '' check (
    external_url = '' or external_url ~ '^https://'
  ),
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index billing_records_project_idx on billing_records (project_id, sort_order);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  event_type text not null check (length(event_type) <= 60),
  description text not null check (length(description) <= 500),
  visibility visibility not null default 'customer',
  created_at timestamptz not null default now()
);

create index activity_log_project_idx on activity_log (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Access helpers
--
-- In `portal_private`, NOT `public`. PostgREST exposes `public`, so a helper
-- living there is also an HTTP endpoint at /rest/v1/rpc/<name>. These leak
-- nothing on their own — each returns a fact about the caller themselves — but
-- they exist to be called from inside policies, not over the wire, and
-- Supabase's own security linter flags the exposure. A schema PostgREST does
-- not serve removes the endpoint while policies keep working.
--
-- SECURITY DEFINER so they bypass RLS on the tables they read. Without that, a
-- policy on `profiles` that reads `profiles` recurses forever.
--
-- `set search_path = ''` on every one of them: a definer function that resolves
-- unqualified names through the caller's search_path can be tricked into
-- running an attacker's table, so every reference below is schema qualified.
-- ---------------------------------------------------------------------------

create schema if not exists portal_private;
grant usage on schema portal_private to authenticated;

create or replace function portal_private.profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profiles p where p.auth_user_id = (select auth.uid());
$$;

create or replace function portal_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_user_id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function portal_private.company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.company_id from public.profiles p where p.auth_user_id = (select auth.uid());
$$;

-- The single gate every client-facing policy funnels through.
--
-- Admins get everything. A client gets a project when it belongs to their
-- company AND either they have no membership rows at all (the common case:
-- everyone at the company sees everything) or they were explicitly added to
-- this one.
create or replace function portal_private.can_read_project(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    portal_private.is_admin()
    or exists (
      select 1
      from public.projects pr
      join public.profiles me on me.auth_user_id = (select auth.uid())
      where pr.id = target
        and me.role = 'client'
        and me.company_id is not null
        and pr.company_id = me.company_id
        and (
          not exists (select 1 from public.project_members pm where pm.profile_id = me.id)
          or exists (
            select 1 from public.project_members pm
            where pm.profile_id = me.id and pm.project_id = pr.id
          )
        )
    );
$$;

-- EXECUTE to `authenticated` only. PUBLIC includes `anon`, and an anonymous
-- caller has no business evaluating these even though they would all return
-- false or null.
revoke all on function portal_private.profile_id() from public;
revoke all on function portal_private.is_admin() from public;
revoke all on function portal_private.company_id() from public;
revoke all on function portal_private.can_read_project(uuid) from public;
grant execute on function portal_private.profile_id() to authenticated;
grant execute on function portal_private.is_admin() to authenticated;
grant execute on function portal_private.company_id() to authenticated;
grant execute on function portal_private.can_read_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Triggers
-- ---------------------------------------------------------------------------

create or replace function portal_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_touch before update on companies
  for each row execute function portal_touch_updated_at();
create trigger profiles_touch before update on profiles
  for each row execute function portal_touch_updated_at();
create trigger projects_touch before update on projects
  for each row execute function portal_touch_updated_at();
create trigger milestones_touch before update on milestones
  for each row execute function portal_touch_updated_at();
create trigger requests_touch before update on requests
  for each row execute function portal_touch_updated_at();
create trigger billing_records_touch before update on billing_records
  for each row execute function portal_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
--
-- Every table: enabled, and no permissive fallback. The shape is the same
-- throughout — clients read customer-visible rows for projects they can read,
-- admins do everything. Client writes exist in exactly two places (raising a
-- request, commenting on their own request) and nowhere else.
-- ---------------------------------------------------------------------------

alter table companies enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table project_updates enable row level security;
alter table milestones enable row level security;
alter table project_blockers enable row level security;
alter table requests enable row level security;
alter table request_comments enable row level security;
alter table project_files enable row level security;
alter table billing_records enable row level security;
alter table activity_log enable row level security;

-- companies -----------------------------------------------------------------
create policy companies_admin_all on companies
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy companies_client_read on companies
  for select to authenticated
  using (id = portal_private.company_id());

-- profiles ------------------------------------------------------------------
create policy profiles_admin_all on profiles
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

-- Own row, colleagues at the same company, and Operava staff.
--
-- The narrower "own row only" version reads as safer but is not: every update,
-- comment and uploaded file shows an author, so the server would have to
-- resolve those names with the service-role key on every page render. Trading a
-- routine service-role dependency for a policy that exposes the name of people
-- you already work with is a bad deal.
--
-- What this deliberately does NOT permit is reading a profile at another
-- company, which is what would leak Operava's customer list.
create policy profiles_visible_read on profiles
  for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or role = 'admin'
    or (company_id is not null and company_id = portal_private.company_id())
  );

-- projects ------------------------------------------------------------------
create policy projects_admin_all on projects
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy projects_client_read on projects
  for select to authenticated
  using (portal_private.can_read_project(id));

-- project_members -----------------------------------------------------------
create policy project_members_admin_all on project_members
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy project_members_self_read on project_members
  for select to authenticated
  using (profile_id = portal_private.profile_id());

-- project_updates -----------------------------------------------------------
create policy project_updates_admin_all on project_updates
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy project_updates_client_read on project_updates
  for select to authenticated
  using (visibility = 'customer' and portal_private.can_read_project(project_id));

-- milestones ----------------------------------------------------------------
create policy milestones_admin_all on milestones
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy milestones_client_read on milestones
  for select to authenticated
  using (portal_private.can_read_project(project_id));

-- project_blockers ----------------------------------------------------------
create policy project_blockers_admin_all on project_blockers
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy project_blockers_client_read on project_blockers
  for select to authenticated
  using (portal_private.can_read_project(project_id));

-- requests ------------------------------------------------------------------
create policy requests_admin_all on requests
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy requests_client_read on requests
  for select to authenticated
  using (portal_private.can_read_project(project_id));

-- A client may raise a request on a project they can read, as themselves.
-- `created_by` is pinned to their own profile so a request cannot be attributed
-- to somebody else, and the workflow columns are left at their defaults by the
-- server rather than trusted from the browser.
create policy requests_client_insert on requests
  for insert to authenticated
  with check (
    portal_private.can_read_project(project_id)
    and created_by = portal_private.profile_id()
    and status = 'submitted'
  );

-- request_comments ----------------------------------------------------------
create policy request_comments_admin_all on request_comments
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy request_comments_client_read on request_comments
  for select to authenticated
  using (
    visibility = 'customer'
    and exists (
      select 1 from requests r
      where r.id = request_id and portal_private.can_read_project(r.project_id)
    )
  );

create policy request_comments_client_insert on request_comments
  for insert to authenticated
  with check (
    visibility = 'customer'
    and created_by = portal_private.profile_id()
    and exists (
      select 1 from requests r
      where r.id = request_id and portal_private.can_read_project(r.project_id)
    )
  );

-- project_files -------------------------------------------------------------
create policy project_files_admin_all on project_files
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy project_files_client_read on project_files
  for select to authenticated
  using (visibility = 'customer' and portal_private.can_read_project(project_id));

create policy project_files_client_insert on project_files
  for insert to authenticated
  with check (
    visibility = 'customer'
    and uploaded_by = portal_private.profile_id()
    and portal_private.can_read_project(project_id)
  );

-- billing_records -----------------------------------------------------------
-- Read-only for clients by design. The portal reports what is owed; it does
-- not let the person who owes it edit the record.
create policy billing_records_admin_all on billing_records
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy billing_records_client_read on billing_records
  for select to authenticated
  using (portal_private.can_read_project(project_id));

-- activity_log --------------------------------------------------------------
create policy activity_log_admin_all on activity_log
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());

create policy activity_log_client_read on activity_log
  for select to authenticated
  using (visibility = 'customer' and portal_private.can_read_project(project_id));

-- ---------------------------------------------------------------------------
-- 6. Storage
--
-- One private bucket. The first path segment is the project id, which is what
-- every policy below keys off, so an object's location is itself the
-- authorisation claim.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  26214400, -- 25 MiB
  array[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip'
  ]
)
on conflict (id) do nothing;

create policy project_files_storage_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'project-files' and portal_private.is_admin())
  with check (bucket_id = 'project-files' and portal_private.is_admin());

create policy project_files_storage_client_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-files'
    and portal_private.can_read_project(((storage.foldername(name))[1])::uuid)
  );

create policy project_files_storage_client_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and portal_private.can_read_project(((storage.foldername(name))[1])::uuid)
  );
