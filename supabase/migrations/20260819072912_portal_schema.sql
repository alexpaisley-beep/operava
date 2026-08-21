-- Baseline export: applied to the live Operava Supabase project on 2026-08-19.
-- Kept verbatim so the repo replays to the exact live schema.

create type portal_role as enum ('admin', 'client');
create type project_status as enum (
  'planning', 'in_progress', 'testing', 'waiting_on_client',
  'ready_for_review', 'launching', 'complete', 'on_hold'
);
create type milestone_status as enum ('upcoming', 'in_progress', 'blocked', 'complete');
create type blocker_status as enum ('open', 'resolved');
create type blocker_waiting_on as enum ('client', 'operava', 'third_party');
create type request_type as enum ('bug', 'change_request', 'question', 'support', 'feature_idea');
create type request_status as enum (
  'submitted', 'reviewing', 'approved', 'in_progress',
  'waiting_on_client', 'done', 'declined'
);
create type request_priority as enum ('low', 'normal', 'high', 'urgent');
create type bug_severity as enum ('minor', 'moderate', 'major', 'critical');
create type file_category as enum (
  'contract', 'specification', 'deliverable', 'documentation', 'screenshot', 'other'
);
create type billing_status as enum ('pending', 'due', 'paid', 'overdue', 'cancelled');
create type visibility as enum ('customer', 'internal');

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  company_id uuid references companies (id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 160),
  email text not null check (length(email) <= 320),
  role portal_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
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
  phase text not null default '' check (length(phase) <= 120),
  current_work text not null default '' check (length(current_work) <= 500),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  start_date date,
  target_date date,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_company_idx on projects (company_id);

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
  severity bug_severity,
  expected_result text not null default '',
  steps_to_reproduce text not null default '',
  estimated_cost numeric(12, 2) check (estimated_cost is null or estimated_cost >= 0),
  estimated_timeline_impact text not null default '',
  approval_status text check (
    approval_status is null or approval_status in ('pending', 'approved', 'declined')
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
  external_url text default '' check (external_url = '' or external_url ~ '^https://'),
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

create or replace function portal_profile_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select p.id from public.profiles p where p.auth_user_id = (select auth.uid());
$$;

create or replace function portal_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_user_id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function portal_company_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select p.company_id from public.profiles p where p.auth_user_id = (select auth.uid());
$$;

create or replace function portal_can_read_project(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select
    public.portal_is_admin()
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

create or replace function portal_touch_updated_at()
returns trigger language plpgsql set search_path = ''
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
