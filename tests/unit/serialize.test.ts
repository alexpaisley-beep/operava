import { describe, expect, it } from "vitest";

import {
  toCustomerBillingRecord,
  toCustomerCompany,
  toCustomerFile,
  toCustomerMilestone,
  toCustomerProject,
  toInternalCompany,
  toInternalProject,
} from "@/lib/portal/serialize";
import type {
  BillingRecordRow,
  CompanyRow,
  MilestoneRow,
  ProjectFileRow,
  ProjectRow,
} from "@/lib/portal/types";

const company: CompanyRow = {
  id: "c1",
  name: "Northgate",
  slug: "northgate",
  status: "active",
  primary_contact_name: "Dana",
  contact_email: "dana@northgate.test",
  contact_phone: "555",
  internal_notes: "Negotiated discount; do not mention margin.",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const project: ProjectRow = {
  id: "p1",
  company_id: "c1",
  name: "Bridge",
  description: "desc",
  summary: "sum",
  status: "in_progress",
  health: "on_track",
  phase: "Build",
  current_work: "Wiring",
  progress_percent: 40,
  start_date: null,
  target_date: null,
  actual_completion_date: null,
  owner_profile_id: "admin-1",
  internal_notes: "Client is jumpy about invoices — flag before billing.",
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("customer serializers never leak internal fields", () => {
  it("company view is id/name/status only", () => {
    expect(toCustomerCompany(company)).toEqual({
      id: "c1",
      name: "Northgate",
      status: "active",
    });
  });

  it("project view has no internal notes anywhere in it", () => {
    const view = toCustomerProject(project, "Alex");
    const json = JSON.stringify(view);
    expect(json).not.toContain("internal_notes");
    expect(json).not.toContain("internalNotes");
    expect(json).not.toContain("jumpy about invoices");
    expect(view.ownerName).toBe("Alex");
  });

  it("billing view excludes internal notes and file view excludes the storage path", () => {
    const billing: BillingRecordRow = {
      id: "b1",
      project_id: "p1",
      label: "Deposit",
      amount: 3000,
      currency: "USD",
      status: "paid",
      due_date: null,
      paid_at: null,
      external_url: "",
      notes: "margin 40%",
      sort_order: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(JSON.stringify(toCustomerBillingRecord(billing))).not.toContain("margin");

    const file: ProjectFileRow = {
      id: "f1",
      project_id: "p1",
      request_id: null,
      uploaded_by: null,
      name: "spec.pdf",
      path: "p1/uuid/spec.pdf",
      category: "specification",
      size_bytes: 100,
      mime_type: "application/pdf",
      visibility: "customer",
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(JSON.stringify(toCustomerFile(file))).not.toContain("p1/uuid");
  });

  it("milestone customer view omits the visibility flag itself", () => {
    const milestone: MilestoneRow = {
      id: "m1",
      project_id: "p1",
      name: "Discovery",
      description: "",
      status: "complete",
      due_date: null,
      completed_at: "2026-01-05T00:00:00Z",
      sort_order: 10,
      visibility: "customer",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(Object.keys(toCustomerMilestone(milestone))).not.toContain("visibility");
  });
});

describe("internal serializers keep the operational fields", () => {
  it("company + project internal views carry notes for staff and MCP", () => {
    expect(toInternalCompany(company).internalNotes).toContain("margin");
    expect(toInternalProject(project).internalNotes).toContain("jumpy");
  });
});
