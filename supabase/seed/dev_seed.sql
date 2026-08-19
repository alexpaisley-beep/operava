-- ===========================================================================
-- DEVELOPMENT SEED — do not run against production.
--
-- Creates two companies on purpose. Client isolation cannot be tested with
-- one, and the RLS suite in supabase/tests/ asserts that Northgate's client
-- sees none of Ridgeline's data.
--
-- Auth users are inserted directly rather than through the Admin API because
-- this is a SQL file, not the app. `crypt`/`gen_salt('bf')` produce exactly the
-- bcrypt hash GoTrue expects, so these accounts sign in normally. The
-- application NEVER does this — real accounts are provisioned through
-- lib/portal/provisioning.ts, which creates an unusable password and emails a
-- one-time setup link.
--
-- Demo passwords are here because these are throwaway accounts on a
-- development database. Delete them before the first real customer:
--
--   delete from auth.users where email like 'demo.%';
-- ===========================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', v.email,
  crypt(v.password, gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', v.full_name),
  '', '', '', ''
from (values
  ('demo.admin@operavallc.com',  'PortalDevAdmin!2026',  'Alex Paisley'),
  ('demo.client@northgate.test', 'PortalDevClient!2026', 'Dana Whitfield'),
  ('demo.client@ridgeline.test', 'PortalDevOther!2026',  'Marcus Ojo')
) as v(email, password, full_name)
where not exists (select 1 from auth.users u where u.email = v.email);

-- GoTrue requires an identity row per email user or password sign-in fails.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.id::text, now(), now(), now()
from auth.users u
where u.email in (
  'demo.admin@operavallc.com', 'demo.client@northgate.test', 'demo.client@ridgeline.test'
)
and not exists (
  select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
);

insert into companies (name, slug) values
  ('Northgate Mechanical', 'northgate-mechanical'),
  ('Ridgeline Electric', 'ridgeline-electric')
on conflict (slug) do nothing;

insert into profiles (auth_user_id, company_id, full_name, email, role)
select u.id, null, 'Alex Paisley', u.email, 'admin'
from auth.users u where u.email = 'demo.admin@operavallc.com'
on conflict (auth_user_id) do nothing;

insert into profiles (auth_user_id, company_id, full_name, email, role)
select u.id, c.id, 'Dana Whitfield', u.email, 'client'
from auth.users u, companies c
where u.email = 'demo.client@northgate.test' and c.slug = 'northgate-mechanical'
on conflict (auth_user_id) do nothing;

insert into profiles (auth_user_id, company_id, full_name, email, role)
select u.id, c.id, 'Marcus Ojo', u.email, 'client'
from auth.users u, companies c
where u.email = 'demo.client@ridgeline.test' and c.slug = 'ridgeline-electric'
on conflict (auth_user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Projects. Northgate's is fully populated; Ridgeline's exists so that
-- isolation has something to be isolated from.
-- ---------------------------------------------------------------------------

with ng as (select id from companies where slug = 'northgate-mechanical'),
     rl as (select id from companies where slug = 'ridgeline-electric')
insert into projects (
  company_id, name, description, status, phase, current_work,
  progress_percent, start_date, target_date
)
select ng.id, 'Dispatch + QuickBooks bridge',
  'Connects the field app to QuickBooks so job costs, hours and invoices stop being retyped, and gives dispatch one board for install and service work.',
  'in_progress'::project_status, 'Integration build',
  'Wiring the QuickBooks invoice sync so completed jobs post automatically. Testing against your sandbox company file this week.',
  55, current_date - 38, current_date + 26
from ng
where not exists (select 1 from projects p where p.name = 'Dispatch + QuickBooks bridge')
union all
select rl.id, 'Service agreement portal',
  'Customer-facing portal for recurring service agreements, renewals and visit history.',
  'planning'::project_status, 'Discovery',
  'Mapping how renewals are tracked today before any build starts.',
  10, current_date - 6, current_date + 80
from rl
where not exists (select 1 from projects p where p.name = 'Service agreement portal');

with p as (select id from projects where name = 'Dispatch + QuickBooks bridge')
insert into milestones (project_id, name, description, status, due_date, completed_at, sort_order)
select p.id, v.name, v.description, v.status::milestone_status,
       v.due_date::date, v.completed_at::timestamptz, v.sort_order
from p, (values
  ('Discovery and workflow map', 'Walked the current dispatch-to-invoice path and wrote down every manual step.', 'complete', (current_date - 30)::text, (now() - interval '30 days')::text, 0),
  ('Scope and fixed price agreed', 'Written scope, what stays in QuickBooks, what is out of scope for phase one.', 'complete', (current_date - 22)::text, (now() - interval '22 days')::text, 1),
  ('QuickBooks integration', 'Two-way sync for customers, invoices and job costs.', 'in_progress', (current_date + 8)::text, null, 2),
  ('Dispatch board', 'One board for install and service, with recurring work.', 'upcoming', (current_date + 20)::text, null, 3),
  ('Field app updates', 'Status, photos and notes from the truck.', 'blocked', (current_date + 27)::text, null, 4),
  ('Launch and training', 'Data migration, cutover and training for office and field.', 'upcoming', (current_date + 40)::text, null, 5)
) as v(name, description, status, due_date, completed_at, sort_order)
where not exists (select 1 from milestones m where m.project_id = p.id);

with p as (select id from projects where name = 'Dispatch + QuickBooks bridge'),
     admin as (select id from profiles where role = 'admin' limit 1)
insert into project_updates (project_id, title, body, category, visibility, created_by, created_at)
select p.id, v.title, v.body, v.category, v.visibility::visibility, admin.id, v.created_at::timestamptz
from p, admin, (values
  ('Discovery complete — 14 manual steps found', E'We mapped the path from a dispatched job to a paid invoice and counted fourteen places where somebody re-enters or re-checks information.\n\nThe expensive ones are the three that happen on every single job.', 'Discovery', 'customer', (now() - interval '30 days')::text),
  ('Scope agreed and signed', 'Phase one covers the QuickBooks bridge and the dispatch board. A customer portal is explicitly out of scope for now.', 'Scope', 'customer', (now() - interval '22 days')::text),
  ('Customer and invoice sync working end to end', 'Customers now flow both ways, and a completed job creates a QuickBooks invoice without anyone retyping it.', 'Integration', 'customer', (now() - interval '9 days')::text),
  ('Waiting on sandbox credentials for the payments side', 'To finish invoice payments we need read access to the payments account.', 'Integration', 'customer', (now() - interval '3 days')::text),
  ('Internal: rate limit on the QBO sandbox', 'QuickBooks sandbox throttles harder than production. Batching writes.', 'Integration', 'internal', (now() - interval '2 days')::text)
) as v(title, body, category, visibility, created_at)
where not exists (select 1 from project_updates u where u.project_id = p.id);

with p as (select id from projects where name = 'Dispatch + QuickBooks bridge')
insert into project_blockers (project_id, title, description, status, waiting_on, created_at)
select p.id, v.title, v.description, v.status::blocker_status,
       v.waiting_on::blocker_waiting_on, v.created_at::timestamptz
from p, (values
  ('QuickBooks payments credentials', 'We need read access to the payments account so invoice payments reconcile automatically.', 'open', 'client', (now() - interval '3 days')::text),
  ('Sign-off on the dispatch board layout', 'Two layouts went over last week. Whichever you pick, we build.', 'open', 'client', (now() - interval '6 days')::text),
  ('Field app store review', 'Submitted and waiting on review. Nothing needed from anyone.', 'open', 'third_party', (now() - interval '4 days')::text),
  ('Historic job data export', 'Received and imported.', 'resolved', 'client', (now() - interval '18 days')::text)
) as v(title, description, status, waiting_on, created_at)
where not exists (select 1 from project_blockers b where b.project_id = p.id);

with p as (select id from projects where name = 'Dispatch + QuickBooks bridge')
insert into billing_records (project_id, label, amount, status, due_date, paid_at, notes, sort_order)
select p.id, v.label, v.amount, v.status::billing_status,
       v.due_date::date, v.paid_at::timestamptz, v.notes, v.sort_order
from p, (values
  ('Deposit — 50% to begin', 6500.00, 'paid', (current_date - 36)::text, (now() - interval '36 days')::text, 'Received, thank you.', 0),
  ('Balance — 50% at launch', 6500.00, 'pending', null, null, 'Falls due when the system goes live.', 1),
  ('Hosting, maintenance and support', 200.00, 'due', (current_date + 5)::text, null, 'Monthly, starts at go-live.', 2)
) as v(label, amount, status, due_date, paid_at, notes, sort_order)
where not exists (select 1 from billing_records r where r.project_id = p.id);
