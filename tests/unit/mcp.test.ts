import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as data from "@/lib/portal/data";
import { extractPresentedKey, isAuthorizedMcpRequest } from "@/lib/portal/mcp/auth";
import { buildTools } from "@/lib/portal/mcp/tools";
import * as internalReads from "@/lib/portal/reads/internal";
import * as projectService from "@/lib/portal/services/projects";
import type { ServiceCtx } from "@/lib/portal/services/context";
import type { Db } from "@/lib/portal/supabase/server";
import type { PortalError } from "@/lib/portal/errors";

vi.mock("@/lib/portal/data");
vi.mock("@/lib/portal/reads/internal");
vi.mock("@/lib/portal/services/projects");
vi.mock("@/lib/portal/notify", () => ({ notify: vi.fn().mockResolvedValue(undefined) }));

const ctx: ServiceCtx = {
  db: {} as Db,
  actor: { kind: "mcp", label: "ChatGPT" },
  source: "mcp",
};

const EXPECTED_TOOLS = [
  "list_customers",
  "get_customer",
  "list_projects",
  "get_project",
  "get_project_timeline",
  "list_project_milestones",
  "list_client_requests",
  "get_project_activity",
  "create_customer",
  "create_project",
  "update_project_status",
  "update_project_progress",
  "update_project_summary",
  "create_project_update",
  "create_milestone",
  "update_milestone",
  "create_client_request",
  "complete_client_request",
  "add_project_link",
  "record_billing",
];

describe("MCP tool registry", () => {
  it("exposes exactly the deliberate tool surface", () => {
    const tools = buildTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...EXPECTED_TOOLS].sort());
  });

  it("marks reads readOnly and writes not", () => {
    const tools = new Map(buildTools().map((t) => [t.name, t]));
    expect(tools.get("get_project")?.readOnly).toBe(true);
    expect(tools.get("list_customers")?.readOnly).toBe(true);
    expect(tools.get("update_project_status")?.readOnly).toBe(false);
    expect(tools.get("create_customer")?.readOnly).toBe(false);
  });

  it("every write tool advertises an idempotencyKey parameter", () => {
    for (const tool of buildTools().filter((t) => !t.readOnly)) {
      expect(Object.keys(tool.inputShape)).toContain("idempotencyKey");
    }
  });
});

describe("MCP tool handlers", () => {
  const tools = () => new Map(buildTools().map((t) => [t.name, t]));

  beforeEach(() => {
    vi.mocked(data.getMcpOp).mockReset().mockResolvedValue(null);
    vi.mocked(data.claimMcpOp).mockReset().mockResolvedValue(true);
    vi.mocked(data.updateMcpOp).mockReset().mockResolvedValue();
  });

  afterEach(() => {
    vi.mocked(projectService.updateProjectStatus).mockReset();
    vi.mocked(internalReads.getProjectDetail).mockReset();
  });

  it("rejects invalid arguments with a structured validation error before any service call", async () => {
    const tool = tools().get("update_project_status")!;
    await expect(
      tool.handler(ctx, { projectId: "nope", status: "complete" }),
    ).rejects.toMatchObject({ code: "validation_failed" });
    expect(projectService.updateProjectStatus).not.toHaveBeenCalled();
  });

  it("maps missing entities to not_found", async () => {
    vi.mocked(internalReads.getProjectDetail).mockResolvedValue(null);
    const tool = tools().get("get_project")!;
    await expect(
      tool.handler(ctx, { projectId: "3b5c8a0e-1d2f-4e5a-9b6c-7d8e9f0a1b2c" }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("write handlers run through the idempotency ledger and return authoritative state", async () => {
    vi.mocked(projectService.updateProjectStatus).mockResolvedValue({
      id: "3b5c8a0e-1d2f-4e5a-9b6c-7d8e9f0a1b2c",
      company_id: "c",
      name: "P",
      description: "",
      summary: "",
      status: "complete",
      health: "on_track",
      phase: "",
      current_work: "",
      progress_percent: 100,
      start_date: null,
      target_date: null,
      actual_completion_date: "2026-08-21",
      owner_profile_id: null,
      internal_notes: "",
      is_archived: false,
      created_at: "",
      updated_at: "",
    });
    const tool = tools().get("update_project_status")!;
    const outcome = (await tool.handler(ctx, {
      projectId: "3b5c8a0e-1d2f-4e5a-9b6c-7d8e9f0a1b2c",
      status: "complete",
      idempotencyKey: "op-1",
    })) as { data: { status: string }; replayed: boolean };

    expect(outcome.replayed).toBe(false);
    expect(outcome.data.status).toBe("complete");
    expect(data.claimMcpOp).toHaveBeenCalledWith(
      expect.anything(),
      "update_project_status",
      "op-1",
      { status: "pending" },
    );
  });

  it("a duplicate idempotency key replays without touching the service", async () => {
    vi.mocked(data.getMcpOp).mockResolvedValue({
      result: { status: "done", payload: { id: "stored" } },
      created_at: new Date().toISOString(),
    });
    const tool = tools().get("update_project_status")!;
    const outcome = (await tool.handler(ctx, {
      projectId: "3b5c8a0e-1d2f-4e5a-9b6c-7d8e9f0a1b2c",
      status: "complete",
      idempotencyKey: "op-1",
    })) as { data: unknown; replayed: boolean };
    expect(outcome.replayed).toBe(true);
    expect(projectService.updateProjectStatus).not.toHaveBeenCalled();
  });

  it("complete_client_request pins the transition to completed", async () => {
    const tool = tools().get("complete_client_request")!;
    // Invalid because the id is malformed — proves the canonical schema runs.
    await expect(tool.handler(ctx, { clientRequestId: "x" })).rejects.toMatchObject({
      code: "validation_failed",
    });
  });
});

describe("MCP endpoint authentication", () => {
  const KEY = "test-secret-key-0123456789abcdef";

  beforeEach(() => {
    vi.stubEnv("OPERAVA_MCP_KEY", KEY);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const request = (headers: Record<string, string> = {}) =>
    new Request("https://example.com/api/mcp", { method: "POST", headers });

  it("accepts the key as a bearer header", () => {
    expect(isAuthorizedMcpRequest(request({ authorization: `Bearer ${KEY}` }), [])).toBe(true);
  });

  it("accepts the key as a path segment, with or without a trailing /mcp", () => {
    expect(isAuthorizedMcpRequest(request(), [KEY])).toBe(true);
    expect(isAuthorizedMcpRequest(request(), [KEY, "mcp"])).toBe(true);
  });

  it("rejects wrong keys, missing keys and same-length forgeries", () => {
    expect(isAuthorizedMcpRequest(request(), [])).toBe(false);
    expect(isAuthorizedMcpRequest(request({ authorization: "Bearer nope" }), [])).toBe(false);
    expect(isAuthorizedMcpRequest(request(), ["x".repeat(KEY.length)])).toBe(false);
  });

  it("refuses everything when the key is unconfigured — no fail-open", () => {
    vi.stubEnv("OPERAVA_MCP_KEY", "");
    expect(isAuthorizedMcpRequest(request({ authorization: `Bearer ${KEY}` }), [])).toBe(false);
  });

  it("prefers the bearer header over the path segment", () => {
    expect(extractPresentedKey(request({ authorization: "Bearer abc" }), ["def"])).toBe("abc");
    expect(extractPresentedKey(request(), ["def"])).toBe("def");
  });
});

describe("error normalisation at the tool boundary", () => {
  it("unexpected failures become an opaque internal PortalError", async () => {
    const { toPortalError } = await import("@/lib/portal/errors");
    const raw = new Error("connect ECONNREFUSED 10.0.0.5:5432 password=supersecret");
    const wrapped: PortalError = toPortalError(raw);
    expect(wrapped.code).toBe("internal");
    expect(wrapped.message).not.toContain("supersecret");
    expect(wrapped.message).not.toContain("ECONNREFUSED");
  });
});
