-- ===========================================================================
-- RLS verification suite
--
-- Run against a database seeded with supabase/seed/dev_seed.sql. Raises an
-- exception listing every failure, so it is safe to wire into CI:
--
--   psql "$DATABASE_URL" -f supabase/tests/rls.sql
--
-- These assertions run as role `authenticated` with a JWT claim set, which is
-- exactly how PostgREST evaluates a request. That matters: testing isolation
-- through the application would only prove the application's filters work, and
-- the filters are not the security boundary — these policies are.
-- ===========================================================================

create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
end $$;

do $$
declare
  northgate_uid uuid; ridgeline_uid uuid; admin_uid uuid;
  ng_project uuid; rl_project uuid;
  n int;
  failures text[] := '{}';
begin
  select id into northgate_uid from auth.users where email = 'demo.client@northgate.test';
  select id into ridgeline_uid from auth.users where email = 'demo.client@ridgeline.test';
  select id into admin_uid     from auth.users where email = 'demo.admin@operavallc.com';
  select id into ng_project from projects where name = 'Dispatch + QuickBooks bridge';
  select id into rl_project from projects where name = 'Service agreement portal';

  -- ------------------------------------------------------ client, company A
  perform pg_temp.as_user(northgate_uid);

  select count(*) into n from projects;
  if n <> 1 then failures := failures || format('A sees %s projects, expected 1', n); end if;

  select count(*) into n from projects where id = rl_project;
  if n <> 0 then failures := failures || 'A can read another company''s project'; end if;

  select count(*) into n from companies;
  if n <> 1 then failures := failures || format('A sees %s companies, expected 1', n); end if;

  -- The internal/customer split is the one most likely to regress silently.
  select count(*) into n from project_updates;
  if n <> 4 then failures := failures || format('A sees %s updates, expected 4', n); end if;

  select count(*) into n from project_updates where visibility = 'internal';
  if n <> 0 then failures := failures || 'A can read an internal update'; end if;

  select count(*) into n from billing_records;
  if n <> 3 then failures := failures || format('A sees %s billing rows, expected 3', n); end if;

  select count(*) into n from milestones;
  if n <> 6 then failures := failures || format('A sees %s milestones, expected 6', n); end if;

  select count(*) into n from profiles where email = 'demo.client@ridgeline.test';
  if n <> 0 then failures := failures || 'A can read another company''s profile'; end if;

  select count(*) into n from profiles;
  if n <> 2 then failures := failures || format('A sees %s profiles, expected 2', n); end if;

  -- Writes a client must never have.
  begin
    update projects set progress_percent = 99 where id = ng_project;
    get diagnostics n = row_count;
    if n > 0 then failures := failures || 'A could UPDATE their own project'; end if;
  exception when insufficient_privilege then null;
  end;

  begin
    update billing_records set status = 'paid';
    get diagnostics n = row_count;
    if n > 0 then failures := failures || 'A could mark their own invoice paid'; end if;
  exception when insufficient_privilege then null;
  end;

  begin
    insert into project_updates (project_id, title) values (ng_project, 'forged');
    failures := failures || 'A could INSERT a project update';
  exception when others then null;
  end;

  -- ------------------------------------------------------ client, company B
  perform pg_temp.as_user(ridgeline_uid);

  select count(*) into n from projects;
  if n <> 1 then failures := failures || format('B sees %s projects, expected 1', n); end if;
  select count(*) into n from projects where id = ng_project;
  if n <> 0 then failures := failures || 'B can read company A''s project'; end if;
  select count(*) into n from billing_records;
  if n <> 0 then failures := failures || format('B sees %s billing rows, expected 0', n); end if;
  select count(*) into n from project_updates;
  if n <> 0 then failures := failures || format('B sees %s updates, expected 0', n); end if;

  -- ------------------------------------------------------------------ admin
  perform pg_temp.as_user(admin_uid);

  select count(*) into n from projects;
  if n <> 2 then failures := failures || format('Admin sees %s projects, expected 2', n); end if;
  select count(*) into n from project_updates;
  if n <> 5 then failures := failures || format('Admin sees %s updates, expected 5', n); end if;
  select count(*) into n from profiles;
  if n <> 3 then failures := failures || format('Admin sees %s profiles, expected 3', n); end if;

  -- ------------------------------------------------------------------- anon
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', null, true);

  select count(*) into n from projects;
  if n <> 0 then failures := failures || format('anon sees %s projects, expected 0', n); end if;
  select count(*) into n from companies;
  if n <> 0 then failures := failures || format('anon sees %s companies, expected 0', n); end if;
  select count(*) into n from profiles;
  if n <> 0 then failures := failures || format('anon sees %s profiles, expected 0', n); end if;

  perform set_config('role', 'postgres', true);

  if array_length(failures, 1) is null then
    raise notice 'RLS: ALL CHECKS PASSED';
  else
    raise exception 'RLS FAILURES: %', array_to_string(failures, ' | ');
  end if;
end $$;
