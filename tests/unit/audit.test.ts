import { beforeEach, describe, expect, it, vi } from "vitest";

import { diffFields, recordAudit } from "@/lib/portal/audit";
import * as data from "@/lib/portal/data";
import type { Db } from "@/lib/portal/supabase/server";

vi.mock("@/lib/portal/data");

const db = {} as Db;

describe("diffFields", () => {
  it("captures only changed fields, before and after", () => {
    const diff = diffFields(
      { status: "planning", phase: "A", name: "X" },
      { status: "in_progress", phase: "A", name: "X" },
      ["status", "phase", "name"],
    );
    expect(diff.changed).toEqual(["status"]);
    expect(diff.before).toEqual({ status: "planning" });
    expect(diff.after).toEqual({ status: "in_progress" });
  });
});

describe("recordAudit", () => {
  beforeEach(() => {
    vi.mocked(data.insertActivity).mockReset();
    vi.mocked(data.insertActivity).mockResolvedValue({} as never);
  });

  it("writes actor, actor_type, action, entity and scrubbed data", async () => {
    await recordAudit(
      db,
      { kind: "mcp", label: "ChatGPT (Alex)" },
      {
        action: "project.status_changed",
        description: "Status changed.",
        projectId: "p1",
        companyId: "c1",
        entityType: "project",
        entityId: "p1",
        visibility: "customer",
        before: { status: "planning" },
        after: { status: "in_progress", api_key: "sk-should-never-appear", note: undefined },
        source: "mcp",
      },
    );

    expect(data.insertActivity).toHaveBeenCalledTimes(1);
    const row = vi.mocked(data.insertActivity).mock.calls[0]![1];
    expect(row).toMatchObject({
      project_id: "p1",
      company_id: "c1",
      actor_id: null,
      actor_type: "mcp",
      actor_label: "ChatGPT (Alex)",
      event_type: "project.status_changed",
      entity_type: "project",
      visibility: "customer",
    });
    const payload = row.data as Record<string, unknown>;
    expect(payload.source).toBe("mcp");
    expect(JSON.stringify(payload)).not.toContain("sk-should-never-appear");
    expect((payload.after as Record<string, unknown>).status).toBe("in_progress");
  });

  it("drops secret-looking keys as a tripwire", async () => {
    await recordAudit(
      db,
      { kind: "internal", profileId: "p", label: "Alex" },
      {
        action: "x",
        description: "y",
        projectId: "p1",
        entityType: "project",
        visibility: "internal",
        after: { password: "hunter2", token: "t", credential_id: "c", safe: "keep" },
        source: "admin_ui",
      },
    );
    const payload = vi.mocked(data.insertActivity).mock.calls[0]![1].data as Record<
      string,
      unknown
    >;
    expect(JSON.stringify(payload)).not.toMatch(/hunter2|"token"|credential/);
    expect((payload.after as Record<string, unknown>).safe).toBe("keep");
  });

  it("never throws when the insert fails — the mutation already happened", async () => {
    vi.mocked(data.insertActivity).mockRejectedValueOnce(new Error("boom"));
    await expect(
      recordAudit(
        db,
        { kind: "system", label: "sys" },
        {
          action: "x",
          description: "y",
          projectId: "p1",
          entityType: "project",
          visibility: "internal",
          source: "system",
        },
      ),
    ).resolves.toBeUndefined();
  });
});
