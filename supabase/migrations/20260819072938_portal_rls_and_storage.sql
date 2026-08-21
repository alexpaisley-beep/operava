-- Baseline export: applied to the live Operava Supabase project on 2026-08-19.
-- Kept verbatim so the repo replays to the exact live schema.

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

create policy companies_admin_all on companies
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy companies_client_read on companies
  for select to authenticated
  using (id = portal_company_id());

create policy profiles_admin_all on profiles
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy profiles_visible_read on profiles
  for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or role = 'admin'
    or (company_id is not null and company_id = portal_company_id())
  );

create policy projects_admin_all on projects
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy projects_client_read on projects
  for select to authenticated
  using (portal_can_read_project(id));

create policy project_members_admin_all on project_members
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy project_members_self_read on project_members
  for select to authenticated
  using (profile_id = portal_profile_id());

create policy project_updates_admin_all on project_updates
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy project_updates_client_read on project_updates
  for select to authenticated
  using (visibility = 'customer' and portal_can_read_project(project_id));

create policy milestones_admin_all on milestones
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy milestones_client_read on milestones
  for select to authenticated
  using (portal_can_read_project(project_id));

create policy project_blockers_admin_all on project_blockers
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy project_blockers_client_read on project_blockers
  for select to authenticated
  using (portal_can_read_project(project_id));

create policy requests_admin_all on requests
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy requests_client_read on requests
  for select to authenticated
  using (portal_can_read_project(project_id));
create policy requests_client_insert on requests
  for insert to authenticated
  with check (
    portal_can_read_project(project_id)
    and created_by = portal_profile_id()
    and status = 'submitted'
  );

create policy request_comments_admin_all on request_comments
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy request_comments_client_read on request_comments
  for select to authenticated
  using (
    visibility = 'customer'
    and exists (
      select 1 from requests r
      where r.id = request_id and portal_can_read_project(r.project_id)
    )
  );
create policy request_comments_client_insert on request_comments
  for insert to authenticated
  with check (
    visibility = 'customer'
    and created_by = portal_profile_id()
    and exists (
      select 1 from requests r
      where r.id = request_id and portal_can_read_project(r.project_id)
    )
  );

create policy project_files_admin_all on project_files
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy project_files_client_read on project_files
  for select to authenticated
  using (visibility = 'customer' and portal_can_read_project(project_id));
create policy project_files_client_insert on project_files
  for insert to authenticated
  with check (
    visibility = 'customer'
    and uploaded_by = portal_profile_id()
    and portal_can_read_project(project_id)
  );

create policy billing_records_admin_all on billing_records
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy billing_records_client_read on billing_records
  for select to authenticated
  using (portal_can_read_project(project_id));

create policy activity_log_admin_all on activity_log
  for all to authenticated
  using (portal_is_admin()) with check (portal_is_admin());
create policy activity_log_client_read on activity_log
  for select to authenticated
  using (visibility = 'customer' and portal_can_read_project(project_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files', 'project-files', false, 26214400,
  array[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic',
    'application/pdf', 'text/plain', 'text/csv',
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
  using (bucket_id = 'project-files' and portal_is_admin())
  with check (bucket_id = 'project-files' and portal_is_admin());
create policy project_files_storage_client_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-files'
    and portal_can_read_project(((storage.foldername(name))[1])::uuid)
  );
create policy project_files_storage_client_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-files'
    and portal_can_read_project(((storage.foldername(name))[1])::uuid)
  );
