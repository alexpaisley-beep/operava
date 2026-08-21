import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Actor } from "@/lib/portal/authz";
import * as data from "@/lib/portal/data";
import { PortalError } from "@/lib/portal/errors";
import { notify } from "@/lib/portal/notify";
import * as clientRequestService from "@/lib/portal/services/clientRequests";
import type { ServiceCtx } from "@/lib/portal/services/context";
import * as customerService from "@/lib/portal/services/customers";
import * as projectService from "@/lib/portal/services/projects";
import * as updateService from "@/lib/portal/services/updates";
import type { Db } from "@/lib/portal/supabase/server";
import type {
  ClientRequestRow,
  CompanyRow,
  MilestoneRow,
  ProjectRow,
} from "@/lib/portal/types";

vi.mock("@/lib/portal/data");
vi.mock("@/lib/portal/notify", () => ({ notify: vi.fn().mockResolvedValue(undefined) }));

const db = {} as Db;
const internal: Actor = { kind: "internal", profileId: "admin-1", label: "Alex" };
const mcp: Actor = { kind: "mcp", label: "ChatGPT" };
const customerA: Actor = {
  kind: "customer",
  profileId: "cust-a",
  companyId: "company-a",
  label: "Dana",
};
const customerB: Actor = {
  kind: "customer",
  profileId: "cust-b",
  companyId: "company-b",
  label: "Marcus",
};

const ctxFor = (actor: Actor): ServiceCtx => ({
  db,
  actor,
  source: actor.kind === "mcp" ? "mcp" : "admin_ui",
});

const company: CompanyRow = {
  id: "company-a",
  name: "Northgate",
  slug: "northgate",
  status: "active",
  primary_contact_name: "",
  contact_email: "",
  contact_phone: "",
  internal_notes: "",
  created_at: "",
  updated_at: "",
};

const project: ProjectRow = {
  id: "project-1",
  company_id: "company-a",
  name: "Bridge",
  description: "",
  summary: "",
  status: "in_progress",
  health: "on_track",
  phase: "",
  current_work: "",
  progress_percent: 55,
  start_date: null,
  target_date: null,
  actual_completion_date: null,
  owner_profile_id: null,
  internal_notes: "",
  is_archived: false,
  created_at: "",
  updated_at: "",
};

beforeEach(() => {
  vi.mocked(data.insertActivity)
    .mockReset()
    .mockResolvedValue({} as never);
  vi.mocked(data.getProject).mockReset().mockResolvedValue(project);
  vi.mocked(data.getMemberProjectIds).mockReset().mockResolvedValue([]);
  vi.mocked(notify).mockClear();
});

describe("createCustomer", () => {
  beforeEach(() => {
    vi.mocked(data.getCompanyBySlug).mockReset().mockResolvedValue(null);
    vi.mocked(data.insertCompany)
      .mockReset()
      .mockImplementation(
        async (_db, row) =>
          ({
            ...company,
            ...row,
            id: "new-co",
          }) as CompanyRow,
      );
  });

  it("refuses customer actors outright", async () => {
    await expect(
      customerService.createCustomer(ctxFor(customerA), { name: "Evil Co" } as never),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(data.insertCompany).not.toHaveBeenCalled();
  });

  it("slugifies the name and dodges collisions", async () => {
    vi.mocked(data.getCompanyBySlug)
      .mockResolvedValueOnce(company) // "ridgeline-electric" taken
      .mockResolvedValueOnce(null);
    const created = await customerService.createCustomer(ctxFor(mcp), {
      name: "Ridgeline Electric",
      primaryContactName: "",
      contactEmail: "",
      contactPhone: "",
      status: "active",
      internalNotes: "",
    });
    expect(created.slug).toBe("ridgeline-electric-2");
  });

  it("records a company-scoped audit entry", async () => {
    await customerService.createCustomer(ctxFor(internal), {
      name: "Acme",
      primaryContactName: "",
      contactEmail: "",
      contactPhone: "",
      status: "active",
      internalNotes: "",
    });
    const entry = vi.mocked(data.insertActivity).mock.calls[0]![1];
    expect(entry).toMatchObject({
      event_type: "customer.created",
      company_id: "new-co",
      actor_type: "internal",
      visibility: "internal",
    });
  });
});

describe("updateProjectStatus", () => {
  beforeEach(() => {
    vi.mocked(data.updateProject)
      .mockReset()
      .mockImplementation(
        async (_db, _id, patch) =>
          ({
            ...project,
            ...patch,
          }) as ProjectRow,
      );
  });

  it("customer actors cannot change status", async () => {
    await expect(
      projectService.updateProjectStatus(ctxFor(customerA), {
        projectId: project.id,
        status: "complete",
        note: "",
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("completing sets progress 100, stamps the date, audits before/after and notifies", async () => {
    const updated = await projectService.updateProjectStatus(ctxFor(mcp), {
      projectId: project.id,
      status: "complete",
      note: "Shipped.",
    });
    expect(updated.status).toBe("complete");
    const patch = vi.mocked(data.updateProject).mock.calls[0]![2];
    expect(patch.progress_percent).toBe(100);
    expect(patch.actual_completion_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const audit = vi.mocked(data.insertActivity).mock.calls[0]![1];
    expect(audit.actor_type).toBe("mcp");
    expect(audit.event_type).toBe("project.status_changed");
    const payload = audit.data as { before: { status: string }; after: { status: string } };
    expect(payload.before.status).toBe("in_progress");
    expect(payload.after.status).toBe("complete");

    expect(notify).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ type: "project_completed" }),
    );
  });

  it("a same-status call is a no-op: no write, no audit", async () => {
    await projectService.updateProjectStatus(ctxFor(internal), {
      projectId: project.id,
      status: "in_progress",
      note: "",
    });
    expect(data.updateProject).not.toHaveBeenCalled();
    expect(data.insertActivity).not.toHaveBeenCalled();
  });
});

describe("createProjectUpdate", () => {
  beforeEach(() => {
    vi.mocked(data.insertProjectUpdate)
      .mockReset()
      .mockImplementation(async (_db, row) => ({
        id: "u1",
        created_at: "",
        created_by: row.created_by ?? null,
        milestone_id: row.milestone_id ?? null,
        body: row.body ?? "",
        category: row.category ?? "",
        visibility: row.visibility ?? "customer",
        project_id: row.project_id,
        title: row.title,
      }));
    vi.mocked(data.getMilestone).mockReset();
  });

  it("rejects a milestone from a different project", async () => {
    vi.mocked(data.getMilestone).mockResolvedValue({
      id: "m-other",
      project_id: "someone-elses-project",
    } as MilestoneRow);
    await expect(
      updateService.createProjectUpdate(ctxFor(internal), {
        projectId: project.id,
        title: "T",
        body: "",
        updateType: "progress",
        visibility: "customer",
        milestoneId: "m-other",
      }),
    ).rejects.toMatchObject({ code: "validation_failed" });
  });

  it("notifies customers only for customer-visible updates", async () => {
    await updateService.createProjectUpdate(ctxFor(internal), {
      projectId: project.id,
      title: "Internal only",
      body: "",
      updateType: "general",
      visibility: "internal",
    });
    expect(notify).not.toHaveBeenCalled();

    await updateService.createProjectUpdate(ctxFor(internal), {
      projectId: project.id,
      title: "Customer visible",
      body: "",
      updateType: "progress",
      visibility: "customer",
    });
    expect(notify).toHaveBeenCalledWith(db, expect.objectContaining({ type: "update_posted" }));
  });
});

describe("transitionClientRequest tenancy + state machine", () => {
  const request: ClientRequestRow = {
    id: "cr1",
    project_id: project.id,
    title: "Send logo",
    description: "",
    status: "open",
    due_date: null,
    created_by: "admin-1",
    acknowledged_at: null,
    completed_at: null,
    completed_by: null,
    cancelled_at: null,
    created_at: "",
    updated_at: "",
  };

  beforeEach(() => {
    vi.mocked(data.getClientRequest).mockReset().mockResolvedValue(request);
    vi.mocked(data.updateClientRequest)
      .mockReset()
      .mockImplementation(
        async (_db, _id, patch) =>
          ({
            ...request,
            ...patch,
          }) as ClientRequestRow,
      );
  });

  it("a customer from another company gets not_found, not forbidden", async () => {
    await expect(
      clientRequestService.transitionClientRequest(ctxFor(customerB), {
        clientRequestId: "cr1",
        status: "completed",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    expect(data.updateClientRequest).not.toHaveBeenCalled();
  });

  it("the owning customer can complete, and completed_by is their profile", async () => {
    const result = await clientRequestService.transitionClientRequest(ctxFor(customerA), {
      clientRequestId: "cr1",
      status: "completed",
    });
    expect(result.status).toBe("completed");
    const patch = vi.mocked(data.updateClientRequest).mock.calls[0]![2];
    expect(patch.completed_by).toBe("cust-a");
    const audit = vi.mocked(data.insertActivity).mock.calls[0]![1];
    expect(audit.actor_type).toBe("customer");
    expect(audit.event_type).toBe("client_request.completed");
  });

  it("project-membership narrowing blocks non-members of the same company", async () => {
    vi.mocked(data.getMemberProjectIds).mockResolvedValue(["some-other-project"]);
    await expect(
      clientRequestService.transitionClientRequest(ctxFor(customerA), {
        clientRequestId: "cr1",
        status: "acknowledged",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("customers cannot cancel — the state machine refuses", async () => {
    await expect(
      clientRequestService.transitionClientRequest(ctxFor(customerA), {
        clientRequestId: "cr1",
        status: "cancelled",
      }),
    ).rejects.toMatchObject({ code: "invalid_transition" });
  });

  it("re-completing an already-completed request is a quiet no-op", async () => {
    vi.mocked(data.getClientRequest).mockResolvedValue({ ...request, status: "completed" });
    const result = await clientRequestService.transitionClientRequest(ctxFor(customerA), {
      clientRequestId: "cr1",
      status: "completed",
    });
    expect(result.status).toBe("completed");
    expect(data.updateClientRequest).not.toHaveBeenCalled();
  });
});

describe("createClientRequest", () => {
  beforeEach(() => {
    vi.mocked(data.insertClientRequest)
      .mockReset()
      .mockImplementation(async (_db, row) => ({
        id: "cr-new",
        project_id: row.project_id,
        title: row.title,
        description: row.description ?? "",
        status: "open",
        due_date: row.due_date ?? null,
        created_by: row.created_by ?? null,
        acknowledged_at: null,
        completed_at: null,
        completed_by: null,
        cancelled_at: null,
        created_at: "",
        updated_at: "",
      }));
  });

  it("customers cannot create action items for themselves", async () => {
    await expect(
      clientRequestService.createClientRequest(ctxFor(customerA), {
        projectId: project.id,
        title: "Pay us less",
        description: "",
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("creating notifies the customer and audits as customer-visible", async () => {
    await clientRequestService.createClientRequest(ctxFor(mcp), {
      projectId: project.id,
      title: "Connect Stripe",
      description: "In the dashboard, click connect.",
      dueDate: "2026-09-01",
    });
    expect(notify).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ type: "client_request_created", projectId: project.id }),
    );
    const audit = vi.mocked(data.insertActivity).mock.calls[0]![1];
    expect(audit).toMatchObject({
      event_type: "client_request.created",
      visibility: "customer",
    });
  });
});

describe("PortalError propagation", () => {
  it("missing project surfaces as not_found for everyone", async () => {
    vi.mocked(data.getProject).mockResolvedValue(null);
    await expect(
      projectService.updateProjectProgress(ctxFor(internal), {
        projectId: "3b5c8a0e-1d2f-4e5a-9b6c-7d8e9f0a1b2c",
        progressPercent: 10,
      }),
    ).rejects.toBeInstanceOf(PortalError);
  });
});
