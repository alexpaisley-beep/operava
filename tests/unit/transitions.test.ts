import { describe, expect, it } from "vitest";

import type { Actor } from "@/lib/portal/authz";
import {
  decideClientRequestChange,
  decideMilestoneStatusChange,
  decideProjectStatusChange,
} from "@/lib/portal/transitions";

const TODAY = "2026-08-21";
const NOW = "2026-08-21T12:00:00.000Z";

const internal: Actor = { kind: "internal", profileId: "p1", label: "Alex" };
const mcp: Actor = { kind: "mcp", label: "ChatGPT" };
const customer: Actor = { kind: "customer", profileId: "p2", companyId: "c1", label: "Dana" };

describe("project status transitions", () => {
  it("completing forces progress to 100 and stamps the completion date", () => {
    const decision = decideProjectStatusChange(
      { status: "in_progress", progress_percent: 60, actual_completion_date: null },
      "complete",
      TODAY,
    );
    expect(decision).toMatchObject({
      ok: true,
      patch: { status: "complete", progress_percent: 100, actual_completion_date: TODAY },
    });
  });

  it("keeps an existing completion date on re-complete", () => {
    const decision = decideProjectStatusChange(
      { status: "on_hold", progress_percent: 100, actual_completion_date: "2026-01-01" },
      "complete",
      TODAY,
    );
    expect(decision.ok && decision.patch.actual_completion_date).toBeUndefined();
  });

  it("reopening clears the completion date", () => {
    const decision = decideProjectStatusChange(
      { status: "complete", progress_percent: 100, actual_completion_date: "2026-01-01" },
      "in_progress",
      TODAY,
    );
    expect(decision.ok && decision.patch.actual_completion_date).toBeNull();
  });

  it("a same-status change is a declared no-op", () => {
    const decision = decideProjectStatusChange(
      { status: "blocked", progress_percent: 10, actual_completion_date: null },
      "blocked",
      TODAY,
    );
    expect(decision.ok && decision.noop).toBe(true);
  });
});

describe("milestone transitions", () => {
  it("completing stamps completed_at once and keeps the original stamp", () => {
    const first = decideMilestoneStatusChange(
      { status: "in_progress", completed_at: null },
      "complete",
      NOW,
    );
    expect(first.ok && first.patch.completed_at).toBe(NOW);

    const again = decideMilestoneStatusChange(
      { status: "blocked", completed_at: "2026-02-02T00:00:00Z" },
      "complete",
      NOW,
    );
    expect(again.ok && again.patch.completed_at).toBe("2026-02-02T00:00:00Z");
  });

  it("leaving complete clears completed_at", () => {
    const decision = decideMilestoneStatusChange(
      { status: "complete", completed_at: NOW },
      "in_progress",
      NOW,
    );
    expect(decision.ok && decision.patch.completed_at).toBeNull();
  });
});

describe("client request transitions", () => {
  it("customers can acknowledge an open request", () => {
    const decision = decideClientRequestChange(
      { status: "open" },
      "acknowledged",
      customer,
      NOW,
    );
    expect(decision).toMatchObject({ ok: true, patch: { acknowledged_at: NOW } });
  });

  it("customers can complete from open or acknowledged", () => {
    for (const from of ["open", "acknowledged"] as const) {
      const decision = decideClientRequestChange({ status: from }, "completed", customer, NOW);
      expect(decision.ok).toBe(true);
    }
  });

  it("re-running a transition is an idempotent no-op, not an error", () => {
    const decision = decideClientRequestChange(
      { status: "completed" },
      "completed",
      customer,
      NOW,
    );
    expect(decision.ok && decision.noop).toBe(true);
  });

  it("customers can never cancel or reopen", () => {
    const cancel = decideClientRequestChange({ status: "open" }, "cancelled", customer, NOW);
    expect(cancel.ok).toBe(false);
    const reopen = decideClientRequestChange({ status: "completed" }, "open", customer, NOW);
    expect(reopen.ok).toBe(false);
  });

  it("Operava (including MCP) can cancel open work and reopen terminal requests", () => {
    for (const actor of [internal, mcp]) {
      expect(decideClientRequestChange({ status: "open" }, "cancelled", actor, NOW).ok).toBe(
        true,
      );
      const reopen = decideClientRequestChange({ status: "cancelled" }, "open", actor, NOW);
      expect(reopen.ok).toBe(true);
      expect(reopen.ok && reopen.patch).toMatchObject({
        acknowledged_at: null,
        completed_at: null,
        completed_by: null,
        cancelled_at: null,
      });
    }
  });

  it("terminal states cannot be acknowledged or completed", () => {
    expect(
      decideClientRequestChange({ status: "cancelled" }, "completed", internal, NOW).ok,
    ).toBe(false);
    expect(
      decideClientRequestChange({ status: "completed" }, "acknowledged", internal, NOW).ok,
    ).toBe(false);
  });
});
