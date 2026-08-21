/**
 * Scratch-Postgres harness for RLS tests.
 *
 * Provisions a throwaway cluster (or uses PORTAL_TEST_DB_URL if set), applies
 * a minimal Supabase-compatible shim (auth/storage schemas, API roles,
 * default grants) and then the *actual* migration files from
 * supabase/migrations — so what these tests exercise is the same SQL that
 * runs in production.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { Client } from "pg";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

function findPgBin(): string | null {
  const candidates = [
    process.env.PORTAL_TEST_PG_BIN,
    "/usr/lib/postgresql/16/bin",
    "/usr/lib/postgresql/17/bin",
    "/usr/lib/postgresql/15/bin",
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "initdb"))) return dir;
  }
  try {
    const found = execFileSync("which", ["initdb"], { encoding: "utf8" }).trim();
    if (found) return path.dirname(found);
  } catch {
    /* not on PATH */
  }
  return null;
}

export type Cluster = {
  url: string;
  stop: () => void;
};

/** Run a shell command, optionally demoted to a non-root user (postgres refuses root). */
function run(bin: string, args: string[], asUser: string | null): void {
  if (asUser) {
    execFileSync("runuser", ["-u", asUser, "--", bin, ...args], { stdio: "pipe" });
  } else {
    execFileSync(bin, args, { stdio: "pipe" });
  }
}

export function provisionCluster(): Cluster | null {
  if (process.env.PORTAL_TEST_DB_URL) {
    return { url: process.env.PORTAL_TEST_DB_URL, stop: () => {} };
  }

  const pgBin = findPgBin();
  if (!pgBin) return null;

  const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
  let asUser: string | null = null;
  if (isRoot) {
    asUser = "pgrls";
    try {
      execFileSync("id", ["-u", asUser], { stdio: "pipe" });
    } catch {
      execFileSync("useradd", ["-r", "-M", asUser], { stdio: "pipe" });
    }
  }

  const dataDir = mkdtempSync(path.join(tmpdir(), "operava-rls-"));
  const port = 54_000 + Math.floor(Math.random() * 1000);
  if (asUser) execFileSync("chown", ["-R", asUser, dataDir]);

  try {
    run(
      path.join(pgBin, "initdb"),
      ["-D", dataDir, "-U", "postgres", "-A", "trust", "-E", "UTF8"],
      asUser,
    );
    run(
      path.join(pgBin, "pg_ctl"),
      [
        "-D",
        dataDir,
        "-w",
        "-o",
        `-p ${port} -c listen_addresses=127.0.0.1 -c unix_socket_directories='${dataDir}' -c fsync=off`,
        "-l",
        path.join(dataDir, "pg.log"),
        "start",
      ],
      asUser,
    );
  } catch (error) {
    rmSync(dataDir, { recursive: true, force: true });
    console.error("rls-harness: could not start scratch postgres", error);
    return null;
  }

  return {
    url: `postgresql://postgres@127.0.0.1:${port}/postgres`,
    stop: () => {
      try {
        run(path.join(pgBin, "pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"], asUser);
      } catch {
        /* already down */
      }
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

/**
 * The pieces of a Supabase project the migrations assume already exist.
 * Default privileges mirror Supabase: API roles get table grants at creation
 * time, which the migrations then narrow with revokes/column grants.
 */
const SHIM_SQL = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key,
  email text unique,
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;
grant all on storage.buckets to anon, authenticated, service_role;
grant all on storage.objects to anon, authenticated, service_role;
create function storage.foldername(name text) returns text[]
language sql immutable as $$
  select (string_to_array(name, '/'))[1 : cardinality(string_to_array(name, '/')) - 1]
$$;
`;

export async function applySchema(client: Client): Promise<void> {
  await client.query(SHIM_SQL);
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  if (files.length < 5) {
    throw new Error(
      `Expected the 5 portal migrations in ${MIGRATIONS_DIR}, found ${files.length}`,
    );
  }
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    try {
      await client.query(sql);
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
}

/* --------------------------------- seed ---------------------------------- */

export const IDS = {
  companyA: "aaaaaaaa-0000-4000-8000-000000000001",
  companyB: "bbbbbbbb-0000-4000-8000-000000000001",
  adminUser: "11111111-0000-4000-8000-00000000000a",
  userA1: "11111111-0000-4000-8000-0000000000a1",
  userA2: "11111111-0000-4000-8000-0000000000a2",
  userB1: "11111111-0000-4000-8000-0000000000b1",
  adminProfile: "22222222-0000-4000-8000-00000000000a",
  profileA1: "22222222-0000-4000-8000-0000000000a1",
  profileA2: "22222222-0000-4000-8000-0000000000a2",
  profileB1: "22222222-0000-4000-8000-0000000000b1",
  projectA1: "33333333-0000-4000-8000-0000000000a1",
  projectA2: "33333333-0000-4000-8000-0000000000a2",
  projectB1: "33333333-0000-4000-8000-0000000000b1",
  requestA1: "44444444-0000-4000-8000-0000000000a1",
  clientRequestA1: "55555555-0000-4000-8000-0000000000a1",
} as const;

export async function seed(client: Client): Promise<void> {
  // Multi-statement scripts cannot be parameterized in pg; every value below
  // is a fixed test constant, so inlining is safe.
  await client.query(`
    insert into auth.users (id, email) values
      ('${IDS.adminUser}', 'admin@operava.test'),
      ('${IDS.userA1}', 'a1@a.test'),
      ('${IDS.userA2}', 'a2@a.test'),
      ('${IDS.userB1}', 'b1@b.test');

    insert into companies (id, name, slug, internal_notes) values
      ('${IDS.companyA}', 'Tenant A', 'tenant-a', 'A-INTERNAL-NOTE'),
      ('${IDS.companyB}', 'Tenant B', 'tenant-b', 'B-INTERNAL-NOTE');

    insert into profiles (id, auth_user_id, company_id, full_name, email, role) values
      ('${IDS.adminProfile}', '${IDS.adminUser}', null, 'Alex Admin', 'admin@operava.test', 'admin'),
      ('${IDS.profileA1}', '${IDS.userA1}', '${IDS.companyA}', 'Client A1', 'a1@a.test', 'client'),
      ('${IDS.profileA2}', '${IDS.userA2}', '${IDS.companyA}', 'Client A2', 'a2@a.test', 'client'),
      ('${IDS.profileB1}', '${IDS.userB1}', '${IDS.companyB}', 'Client B1', 'b1@b.test', 'client');

    insert into projects (id, company_id, name, internal_notes, summary) values
      ('${IDS.projectA1}', '${IDS.companyA}', 'A Project One', 'A1-PROJECT-SECRET', 'Visible summary'),
      ('${IDS.projectA2}', '${IDS.companyA}', 'A Project Two', 'A2-PROJECT-SECRET', ''),
      ('${IDS.projectB1}', '${IDS.companyB}', 'B Project One', 'B1-PROJECT-SECRET', '');

    -- A2 is narrowed to project one only.
    insert into project_members (project_id, profile_id) values
      ('${IDS.projectA1}', '${IDS.profileA2}');

    insert into milestones (project_id, name, visibility, sort_order) values
      ('${IDS.projectA1}', 'Customer milestone', 'customer', 10),
      ('${IDS.projectA1}', 'Internal milestone', 'internal', 20);

    insert into project_updates (project_id, title, body, visibility) values
      ('${IDS.projectA1}', 'Customer update', 'All good', 'customer'),
      ('${IDS.projectA1}', 'INTERNAL-UPDATE-TITLE', 'Margin talk', 'internal'),
      ('${IDS.projectB1}', 'B customer update', '', 'customer');

    insert into client_requests (id, project_id, title, description) values
      ('${IDS.clientRequestA1}', '${IDS.projectA1}', 'Send credentials', 'Use the vault please');

    insert into project_links (project_id, label, url, visibility) values
      ('${IDS.projectA1}', 'Staging', 'https://staging.a.test', 'customer'),
      ('${IDS.projectA1}', 'INTERNAL-RUNBOOK', 'https://runbook.a.test', 'internal');

    insert into project_files (project_id, name, path, visibility) values
      ('${IDS.projectA1}', 'spec.pdf', '${IDS.projectA1}/x/spec.pdf', 'customer'),
      ('${IDS.projectA1}', 'internal.pdf', '${IDS.projectA1}/y/internal.pdf', 'internal');

    insert into billing_records (project_id, label, amount, notes) values
      ('${IDS.projectA1}', 'Deposit', 3000, 'BILLING-INTERNAL-NOTE');

    insert into activity_log (project_id, company_id, event_type, description, visibility, data) values
      ('${IDS.projectA1}', '${IDS.companyA}', 'project.status_changed', 'Customer-visible event', 'customer', '{"before":{"x":1}}'),
      ('${IDS.projectA1}', '${IDS.companyA}', 'project.details_updated', 'INTERNAL-EVENT', 'internal', '{}'),
      (null, '${IDS.companyA}', 'customer.created', 'Company-scoped customer event', 'customer', '{}');

    insert into requests (id, project_id, created_by, type, title) values
      ('${IDS.requestA1}', '${IDS.projectA1}', '${IDS.profileA1}', 'bug', 'Totals look wrong');

    insert into request_comments (request_id, created_by, body, visibility) values
      ('${IDS.requestA1}', '${IDS.adminProfile}', 'We are on it', 'customer'),
      ('${IDS.requestA1}', '${IDS.adminProfile}', 'INTERNAL-COMMENT', 'internal');

    insert into storage.objects (bucket_id, name) values
      ('project-files', '${IDS.projectA1}/x/spec.pdf'),
      ('project-files', '${IDS.projectB1}/z/b-file.pdf');

    insert into mcp_ops (tool, idempotency_key, result) values
      ('create_customer', 'k1', '{"status":"done"}');
  `);
}

/** Run `work` inside a transaction impersonating an API role + JWT subject. */
export async function asUser<T>(
  client: Client,
  role: "authenticated" | "anon" | "service_role",
  authUserId: string | null,
  work: () => Promise<T>,
): Promise<T> {
  await client.query("begin");
  try {
    await client.query(`set local role ${role}`);
    if (authUserId) {
      await client.query("select set_config('request.jwt.claim.sub', $1, true)", [authUserId]);
    }
    return await work();
  } finally {
    await client.query("rollback");
  }
}
