-- ===========================================================================
-- Client write-path verification
--
-- The read tests in rls.sql prove a client cannot SEE another customer's data.
-- These prove the other half: what a client may WRITE, and everything they
-- must not — forging authorship, opening a pre-closed ticket, filing against
-- somebody else's project, posting an internal comment, or closing their own
-- request to skip triage.
--
-- Wrapped in a transaction that rolls back, so it is re-runnable and leaves no
-- rows behind:
--
--   psql "$DATABASE_URL" -f supabase/tests/write_paths.sql
-- ===========================================================================

begin;

create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
end $$;

do $$
declare
  ng_uid uuid; rl_uid uuid; ng_profile uuid; rl_profile uuid;
  ng_project uuid; rl_project uuid; new_request uuid;
  n int; failures text[] := '{}';
begin
  select id into ng_uid from auth.users where email = 'demo.client@northgate.test';
  select id into rl_uid from auth.users where email = 'demo.client@ridgeline.test';
  select id into ng_profile from profiles where email = 'demo.client@northgate.test';
  select id into rl_profile from profiles where email = 'demo.client@ridgeline.test';
  select id into ng_project from projects where name = 'Dispatch + QuickBooks bridge';
  select id into rl_project from projects where name = 'Service agreement portal';

  perform pg_temp.as_user(ng_uid);

  -- The happy path the request form takes.
  begin
    insert into requests (project_id, created_by, type, title, description, status, priority)
    values (ng_project, ng_profile, 'bug', 'RLS test request', 'body', 'submitted', 'normal')
    returning id into new_request;
  exception when others then
    failures := failures || format('client could NOT raise a request: %s', sqlerrm);
  end;

  begin
    insert into requests (project_id, created_by, type, title, status)
    values (ng_project, rl_profile, 'bug', 'forged author', 'submitted');
    failures := failures || 'client could file a request as ANOTHER user';
  exception when others then null;
  end;

  begin
    insert into requests (project_id, created_by, type, title, status)
    values (ng_project, ng_profile, 'bug', 'pre-closed', 'done');
    failures := failures || 'client could insert a request with status=done';
  exception when others then null;
  end;

  begin
    insert into requests (project_id, created_by, type, title, status)
    values (rl_project, ng_profile, 'bug', 'cross-tenant', 'submitted');
    failures := failures || 'client could file against ANOTHER company project';
  exception when others then null;
  end;

  if new_request is not null then
    begin
      insert into request_comments (request_id, created_by, body, visibility)
      values (new_request, ng_profile, 'a reply', 'customer');
    exception when others then
      failures := failures || format('client could NOT reply: %s', sqlerrm);
    end;

    begin
      insert into request_comments (request_id, created_by, body, visibility)
      values (new_request, ng_profile, 'sneaky internal note', 'internal');
      failures := failures || 'client could post an INTERNAL comment';
    exception when others then null;
    end;

    begin
      update requests set status = 'done', priority = 'urgent' where id = new_request;
      get diagnostics n = row_count;
      if n > 0 then failures := failures || 'client could UPDATE request status'; end if;
    exception when insufficient_privilege then null;
    end;
  end if;

  perform pg_temp.as_user(rl_uid);
  select count(*) into n from requests where id = new_request;
  if n <> 0 then failures := failures || 'client B can read client A''s request'; end if;
  select count(*) into n from request_comments;
  if n <> 0 then failures := failures || format('client B sees %s comments, expected 0', n); end if;

  perform set_config('role', 'postgres', true);

  if array_length(failures, 1) is null then
    raise notice 'WRITE PATHS: ALL CHECKS PASSED';
  else
    raise exception 'WRITE PATH FAILURES: %', array_to_string(failures, ' | ');
  end if;
end $$;

rollback;
