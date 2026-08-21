-- Baseline export: applied to the live Operava Supabase project on 2026-08-19.
-- Kept verbatim so the repo replays to the exact live schema.

-- Move the RLS helpers out of the PostgREST-exposed schema.
--
-- They leak nothing (each returns a fact about the caller themselves), but they
-- exist to be called from inside policies, not over HTTP. PostgREST only exposes
-- `public`, so a schema move takes them off /rest/v1/rpc entirely while policies
-- keep working.
create schema if not exists portal_private;
grant usage on schema portal_private to authenticated;

create or replace function portal_private.profile_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select p.id from public.profiles p where p.auth_user_id = (select auth.uid());
$$;

create or replace function portal_private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_user_id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function portal_private.company_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select p.company_id from public.profiles p where p.auth_user_id = (select auth.uid());
$$;

create or replace function portal_private.can_read_project(target uuid)
returns boolean language sql stable security definer set search_path = ''
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

revoke all on function portal_private.profile_id() from public;
revoke all on function portal_private.is_admin() from public;
revoke all on function portal_private.company_id() from public;
revoke all on function portal_private.can_read_project(uuid) from public;
grant execute on function portal_private.profile_id() to authenticated;
grant execute on function portal_private.is_admin() to authenticated;
grant execute on function portal_private.company_id() to authenticated;
grant execute on function portal_private.can_read_project(uuid) to authenticated;

-- Policies hold a parsed reference to the old functions, so each has to be
-- recreated rather than altered in place.
drop policy companies_admin_all on companies;
drop policy companies_client_read on companies;
drop policy profiles_admin_all on profiles;
drop policy profiles_visible_read on profiles;
drop policy projects_admin_all on projects;
drop policy projects_client_read on projects;
drop policy project_members_admin_all on project_members;
drop policy project_members_self_read on project_members;
drop policy project_updates_admin_all on project_updates;
drop policy project_updates_client_read on project_updates;
drop policy milestones_admin_all on milestones;
drop policy milestones_client_read on milestones;
drop policy project_blockers_admin_all on project_blockers;
drop policy project_blockers_client_read on project_blockers;
drop policy requests_admin_all on requests;
drop policy requests_client_read on requests;
drop policy requests_client_insert on requests;
drop policy request_comments_admin_all on request_comments;
drop policy request_comments_client_read on request_comments;
drop policy request_comments_client_insert on request_comments;
drop policy project_files_admin_all on project_files;
drop policy project_files_client_read on project_files;
drop policy project_files_client_insert on project_files;
drop policy billing_records_admin_all on billing_records;
drop policy billing_records_client_read on billing_records;
drop policy activity_log_admin_all on activity_log;
drop policy activity_log_client_read on activity_log;
drop policy project_files_storage_admin on storage.objects;
drop policy project_files_storage_client_read on storage.objects;
drop policy project_files_storage_client_insert on storage.objects;

drop function public.portal_profile_id();
drop function public.portal_is_admin();
drop function public.portal_company_id();
drop function public.portal_can_read_project(uuid);

create policy companies_admin_all on companies
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy companies_client_read on companies
  for select to authenticated
  using (id = portal_private.company_id());

create policy profiles_admin_all on profiles
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy profiles_visible_read on profiles
  for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or role = 'admin'
    or (company_id is not null and company_id = portal_private.company_id())
  );

create policy projects_admin_all on projects
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy projects_client_read on projects
  for select to authenticated
  using (portal_private.can_read_project(id));

create policy project_members_admin_all on project_members
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy project_members_self_read on project_members
  for select to authenticated
  using (profile_id = portal_private.profile_id());

create policy project_updates_admin_all on project_updates
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy project_updates_client_read on project_updates
  for select to authenticated
  using (visibility = 'customer' and portal_private.can_read_project(project_id));

create policy milestones_admin_all on milestones
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy milestones_client_read on milestones
  for select to authenticated
  using (portal_private.can_read_project(project_id));

create policy project_blockers_admin_all on project_blockers
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy project_blockers_client_read on project_blockers
  for select to authenticated
  using (portal_private.can_read_project(project_id));

create policy requests_admin_all on requests
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy requests_client_read on requests
  for select to authenticated
  using (portal_private.can_read_project(project_id));
create policy requests_client_insert on requests
  for insert to authenticated
  with check (
    portal_private.can_read_project(project_id)
    and created_by = portal_private.profile_id()
    and status = 'submitted'
  );

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

create policy billing_records_admin_all on billing_records
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy billing_records_client_read on billing_records
  for select to authenticated
  using (portal_private.can_read_project(project_id));

create policy activity_log_admin_all on activity_log
  for all to authenticated
  using (portal_private.is_admin()) with check (portal_private.is_admin());
create policy activity_log_client_read on activity_log
  for select to authenticated
  using (visibility = 'customer' and portal_private.can_read_project(project_id));

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
