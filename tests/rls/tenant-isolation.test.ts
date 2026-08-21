/**
 * Tenant isolation and visibility, asserted against the real migrations in a
 * real Postgres. Every check runs as the API roles PostgREST would use, so
 * these are the exact walls a hostile customer would hit.
 */

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applySchema, asUser, IDS, provisionCluster, seed, type Cluster } from "./harness";

let cluster: Cluster | null = null;
let db: Client;

beforeAll(async () => {
  cluster = provisionCluster();
  if (!cluster) {
    console.warn(
      "rls tests skipped: no postgres available (set PORTAL_TEST_DB_URL or install postgresql)",
    );
    return;
  }
  db = new Client({ connectionString: cluster.url });
  await db.connect();
  await applySchema(db);
  await seed(db);
});

afterAll(async () => {
  if (db) await db.end().catch(() => {});
  cluster?.stop();
});

const A1 = IDS.userA1;
const A2 = IDS.userA2;
const B1 = IDS.userB1;
const ADMIN = IDS.adminUser;

function skipIfNoCluster() {
  if (!cluster) {
    console.warn("skipped: no cluster");
    return true;
  }
  return false;
}

describe("companies", () => {
  it("a client sees exactly their own company", async () => {
    if (skipIfNoCluster()) return;
    const rows = await asUser(db, "authenticated", A1, async () => {
      const result = await db.query("select id, name from companies");
      return result.rows;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(IDS.companyA);
  });

  it("internal_notes is not even selectable by the API role", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      await expect(db.query("select internal_notes from companies")).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("select * on companies is denied outright (column privileges)", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      await expect(db.query("select * from companies")).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("anon reads nothing", async () => {
    if (skipIfNoCluster()) return;
    // Separate transactions: a denied query aborts the surrounding transaction.
    // companies/projects: hard permission denial (select revoked from anon,
    // column re-grants went to authenticated only).
    await asUser(db, "anon", null, async () => {
      await expect(db.query("select id from companies")).rejects.toMatchObject({
        code: "42501",
      });
    });
    await asUser(db, "anon", null, async () => {
      await expect(db.query("select id from projects")).rejects.toMatchObject({
        code: "42501",
      });
    });
    // Tables anon can still address return zero rows via RLS.
    await asUser(db, "anon", null, async () => {
      const milestones = await db.query("select id from milestones");
      expect(milestones.rows).toHaveLength(0);
    });
  });
});

describe("projects", () => {
  it("tenant A cannot see tenant B's project even by exact id", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      const own = await db.query("select id from projects order by name");
      expect(own.rows.map((r) => r.id)).toEqual([IDS.projectA1, IDS.projectA2]);
      const foreign = await db.query("select id from projects where id = $1", [IDS.projectB1]);
      expect(foreign.rows).toHaveLength(0);
    });
  });

  it("project_members narrows a client to their assigned projects", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A2, async () => {
      const rows = await db.query("select id from projects");
      expect(rows.rows.map((r) => r.id)).toEqual([IDS.projectA1]);
    });
  });

  it("projects.internal_notes is unreadable through the API role", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      await expect(db.query("select internal_notes from projects")).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("clients cannot write projects at all", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      const update = await db.query("update projects set progress_percent = 99 where id = $1", [
        IDS.projectA1,
      ]);
      expect(update.rowCount).toBe(0);
      await expect(
        db.query("insert into projects (company_id, name) values ($1, 'sneaky')", [
          IDS.companyA,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("visibility walls", () => {
  it("internal milestones are invisible to clients, visible to admins", async () => {
    if (skipIfNoCluster()) return;
    const clientRows = await asUser(
      db,
      "authenticated",
      A1,
      async () =>
        (await db.query("select name from milestones where project_id = $1", [IDS.projectA1]))
          .rows,
    );
    expect(clientRows.map((r) => r.name)).toEqual(["Customer milestone"]);

    const adminRows = await asUser(
      db,
      "authenticated",
      ADMIN,
      async () =>
        (await db.query("select name from milestones where project_id = $1", [IDS.projectA1]))
          .rows,
    );
    expect(adminRows).toHaveLength(2);
  });

  it("internal updates never reach a client result set", async () => {
    if (skipIfNoCluster()) return;
    const rows = await asUser(
      db,
      "authenticated",
      A1,
      async () => (await db.query("select title from project_updates")).rows,
    );
    expect(JSON.stringify(rows)).not.toContain("INTERNAL-UPDATE-TITLE");
    expect(rows.map((r) => r.title)).toEqual(["Customer update"]);
  });

  it("internal links and files are hidden from clients", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      const links = await db.query("select label from project_links");
      expect(JSON.stringify(links.rows)).not.toContain("INTERNAL-RUNBOOK");
      const files = await db.query("select name from project_files");
      expect(files.rows.map((r) => r.name)).toEqual(["spec.pdf"]);
    });
  });

  it("billing rows are visible but the internal notes column is not", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      const rows = await db.query("select label, amount from billing_records");
      expect(rows.rows).toHaveLength(1);
      await expect(db.query("select notes from billing_records")).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("activity: clients see customer-visible entries (project- and company-scoped), never internal ones, and never the data column", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      const rows = await db.query("select description from activity_log");
      const text = JSON.stringify(rows.rows);
      expect(text).toContain("Customer-visible event");
      expect(text).toContain("Company-scoped customer event");
      expect(text).not.toContain("INTERNAL-EVENT");
      await expect(db.query("select data from activity_log")).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("internal request comments stay internal", async () => {
    if (skipIfNoCluster()) return;
    const rows = await asUser(
      db,
      "authenticated",
      A1,
      async () => (await db.query("select body from request_comments")).rows,
    );
    expect(JSON.stringify(rows)).not.toContain("INTERNAL-COMMENT");
  });
});

describe("client requests (action items)", () => {
  it("visible to the owning tenant only, and never writable by clients", async () => {
    if (skipIfNoCluster()) return;
    const own = await asUser(
      db,
      "authenticated",
      A1,
      async () => (await db.query("select id from client_requests")).rows,
    );
    expect(own).toHaveLength(1);

    const foreign = await asUser(
      db,
      "authenticated",
      B1,
      async () => (await db.query("select id from client_requests")).rows,
    );
    expect(foreign).toHaveLength(0);

    await asUser(db, "authenticated", A1, async () => {
      const attempt = await db.query(
        "update client_requests set status = 'completed' where id = $1",
        [IDS.clientRequestA1],
      );
      expect(attempt.rowCount).toBe(0);
    });
  });
});

describe("customer request submission (the one client write)", () => {
  it("accepts a request with the client's own profile and submitted status", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      const inserted = await db.query(
        `insert into requests (project_id, created_by, type, title)
         values ($1, $2, 'question', 'When do we launch?') returning id`,
        [IDS.projectA1, IDS.profileA1],
      );
      expect(inserted.rowCount).toBe(1);
    });
  });

  it("rejects a spoofed created_by", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      await expect(
        db.query(
          `insert into requests (project_id, created_by, type, title)
           values ($1, $2, 'question', 'spoof')`,
          [IDS.projectA1, IDS.adminProfile],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("rejects submissions into another tenant's project", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      await expect(
        db.query(
          `insert into requests (project_id, created_by, type, title)
           values ($1, $2, 'question', 'cross-tenant')`,
          [IDS.projectB1, IDS.profileA1],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("rejects a non-submitted initial status", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      await expect(
        db.query(
          `insert into requests (project_id, created_by, type, title, status)
           values ($1, $2, 'question', 'pre-approved', 'approved')`,
          [IDS.projectA1, IDS.profileA1],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("storage objects", () => {
  it("clients read only their own project's folder", async () => {
    if (skipIfNoCluster()) return;
    const rows = await asUser(
      db,
      "authenticated",
      A1,
      async () => (await db.query("select name from storage.objects")).rows,
    );
    expect(rows.map((r) => r.name)).toEqual([`${IDS.projectA1}/x/spec.pdf`]);
  });

  it("clients cannot write into another tenant's folder", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", A1, async () => {
      await expect(
        db.query("insert into storage.objects (bucket_id, name) values ('project-files', $1)", [
          `${IDS.projectB1}/evil.pdf`,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("infrastructure tables", () => {
  it("the MCP idempotency ledger is invisible to API roles", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", ADMIN, async () => {
      await expect(db.query("select * from mcp_ops")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("service_role sees everything, including internal columns", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "service_role", null, async () => {
      const companies = await db.query("select internal_notes from companies order by name");
      expect(companies.rows.map((r) => r.internal_notes)).toEqual([
        "A-INTERNAL-NOTE",
        "B-INTERNAL-NOTE",
      ]);
      const ops = await db.query("select tool from mcp_ops");
      expect(ops.rows).toHaveLength(1);
    });
  });
});

describe("admin scope", () => {
  it("admins see all tenants' rows (via RLS), but internal columns still require the service role", async () => {
    if (skipIfNoCluster()) return;
    await asUser(db, "authenticated", ADMIN, async () => {
      const projects = await db.query("select id from projects");
      expect(projects.rows).toHaveLength(3);
      // Column grants are role-wide: even an admin *session* cannot read
      // internal_notes through PostgREST — the admin UI reads via service role.
      await expect(db.query("select internal_notes from projects")).rejects.toMatchObject({
        code: "42501",
      });
    });
  });
});
