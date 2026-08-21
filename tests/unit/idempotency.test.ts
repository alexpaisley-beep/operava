import { beforeEach, describe, expect, it, vi } from "vitest";

import * as data from "@/lib/portal/data";
import { PortalError } from "@/lib/portal/errors";
import { runIdempotent } from "@/lib/portal/mcp/idempotency";
import type { Db } from "@/lib/portal/supabase/server";

vi.mock("@/lib/portal/data");

const db = {} as Db;

beforeEach(() => {
  vi.mocked(data.getMcpOp).mockReset().mockResolvedValue(null);
  vi.mocked(data.claimMcpOp).mockReset().mockResolvedValue(true);
  vi.mocked(data.updateMcpOp).mockReset().mockResolvedValue();
  vi.mocked(data.deleteMcpOp).mockReset().mockResolvedValue();
});

describe("runIdempotent", () => {
  it("executes directly when no key is supplied", async () => {
    const execute = vi.fn().mockResolvedValue({ id: 1 });
    const outcome = await runIdempotent(db, "create_customer", undefined, execute);
    expect(outcome).toEqual({ result: { id: 1 }, replayed: false });
    expect(data.claimMcpOp).not.toHaveBeenCalled();
  });

  it("claims, executes once and stores the result", async () => {
    const execute = vi.fn().mockResolvedValue({ id: 42 });
    const outcome = await runIdempotent(db, "create_customer", "k1", execute);
    expect(outcome.replayed).toBe(false);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(data.claimMcpOp).toHaveBeenCalledWith(db, "create_customer", "k1", {
      status: "pending",
    });
    expect(data.updateMcpOp).toHaveBeenCalledWith(db, "create_customer", "k1", {
      status: "done",
      payload: { id: 42 },
    });
  });

  it("replays a stored result without executing again", async () => {
    vi.mocked(data.getMcpOp).mockResolvedValue({
      result: { status: "done", payload: { id: 7 } },
      created_at: new Date().toISOString(),
    });
    const execute = vi.fn();
    const outcome = await runIdempotent(db, "create_customer", "k1", execute);
    expect(outcome).toEqual({ result: { id: 7 }, replayed: true });
    expect(execute).not.toHaveBeenCalled();
  });

  it("reports a fresh in-flight duplicate as a conflict", async () => {
    vi.mocked(data.getMcpOp).mockResolvedValue({
      result: { status: "pending" },
      created_at: new Date().toISOString(),
    });
    await expect(runIdempotent(db, "t", "k1", vi.fn())).rejects.toMatchObject({
      code: "conflict",
    });
  });

  it("takes over a stale pending claim from a dead execution", async () => {
    vi.mocked(data.getMcpOp)
      .mockResolvedValueOnce({
        result: { status: "pending" },
        created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
      })
      .mockResolvedValue(null);
    const execute = vi.fn().mockResolvedValue("ok");
    const outcome = await runIdempotent(db, "t", "k1", execute);
    expect(data.deleteMcpOp).toHaveBeenCalled();
    expect(outcome).toEqual({ result: "ok", replayed: false });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("a lost claim race re-reads and replays the winner's result", async () => {
    vi.mocked(data.getMcpOp)
      .mockResolvedValueOnce(null) // first read: nothing there yet
      .mockResolvedValueOnce({
        result: { status: "done", payload: "winner" },
        created_at: new Date().toISOString(),
      });
    vi.mocked(data.claimMcpOp).mockResolvedValueOnce(false); // we lose the insert race
    const execute = vi.fn();
    const outcome = await runIdempotent(db, "t", "k1", execute);
    expect(outcome).toEqual({ result: "winner", replayed: true });
    expect(execute).not.toHaveBeenCalled();
  });

  it("releases the claim when execution fails so a retry can run", async () => {
    const failure = new PortalError("db_error", "nope");
    await expect(runIdempotent(db, "t", "k1", vi.fn().mockRejectedValue(failure))).rejects.toBe(
      failure,
    );
    expect(data.deleteMcpOp).toHaveBeenCalledWith(db, "t", "k1");
    expect(data.updateMcpOp).not.toHaveBeenCalled();
  });
});
