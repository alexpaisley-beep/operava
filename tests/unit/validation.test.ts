import { describe, expect, it } from "vitest";

import {
  addProjectLinkInput,
  clientRequestTransitionInput,
  createCustomerInput,
  createProjectInput,
  createProjectUpdateInput,
  updateProjectProgressInput,
  updateProjectStatusInput,
  updateProjectSummaryInput,
  isoDate,
  uuid,
} from "@/lib/portal/validation";

const PROJECT_ID = "3b5c8a0e-1d2f-4e5a-9b6c-7d8e9f0a1b2c";

describe("primitives", () => {
  it("uuid rejects lookalikes", () => {
    expect(uuid.safeParse(PROJECT_ID).success).toBe(true);
    expect(uuid.safeParse("not-a-uuid").success).toBe(false);
    expect(uuid.safeParse(`${PROJECT_ID}'; drop table projects;--`).success).toBe(false);
  });

  it("isoDate accepts real dates only", () => {
    expect(isoDate.safeParse("2026-08-21").success).toBe(true);
    expect(isoDate.safeParse("2026-13-99").success).toBe(false);
    expect(isoDate.safeParse("21/08/2026").success).toBe(false);
  });
});

describe("customer inputs", () => {
  it("requires a non-empty name and tolerates an empty email", () => {
    expect(createCustomerInput.safeParse({ name: "  " }).success).toBe(false);
    const parsed = createCustomerInput.parse({ name: "Northgate Mechanical" });
    expect(parsed.contactEmail).toBe("");
    expect(parsed.status).toBe("active");
  });

  it("rejects a malformed contact email", () => {
    expect(
      createCustomerInput.safeParse({ name: "Acme", contactEmail: "not-an-email" }).success,
    ).toBe(false);
  });
});

describe("project inputs", () => {
  it("createProject requires a company and name and validates enum status", () => {
    expect(createProjectInput.safeParse({ companyId: PROJECT_ID, name: "X" }).success).toBe(
      true,
    );
    expect(
      createProjectInput.safeParse({ companyId: PROJECT_ID, name: "X", status: "vibing" })
        .success,
    ).toBe(false);
  });

  it("status change accepts exactly the machine vocabulary", () => {
    expect(
      updateProjectStatusInput.safeParse({ projectId: PROJECT_ID, status: "waiting_on_client" })
        .success,
    ).toBe(true);
    expect(
      updateProjectStatusInput.safeParse({ projectId: PROJECT_ID, status: "WAITING_ON_CLIENT" })
        .success,
    ).toBe(false);
  });

  it("progress update needs at least one field and bounds the percent", () => {
    expect(updateProjectProgressInput.safeParse({ projectId: PROJECT_ID }).success).toBe(false);
    expect(
      updateProjectProgressInput.safeParse({ projectId: PROJECT_ID, progressPercent: 101 })
        .success,
    ).toBe(false);
    expect(
      updateProjectProgressInput.safeParse({ projectId: PROJECT_ID, progressPercent: 55 })
        .success,
    ).toBe(true);
  });

  it("summary update needs summary or description", () => {
    expect(updateProjectSummaryInput.safeParse({ projectId: PROJECT_ID }).success).toBe(false);
    expect(
      updateProjectSummaryInput.safeParse({ projectId: PROJECT_ID, summary: "New" }).success,
    ).toBe(true);
  });
});

describe("update + link inputs", () => {
  it("updates carry a bounded title and a typed vocabulary", () => {
    expect(
      createProjectUpdateInput.safeParse({
        projectId: PROJECT_ID,
        title: "Done",
        updateType: "vibes",
      }).success,
    ).toBe(false);
    const parsed = createProjectUpdateInput.parse({ projectId: PROJECT_ID, title: "Done" });
    expect(parsed.updateType).toBe("general");
    expect(parsed.visibility).toBe("customer");
  });

  it("links must be https", () => {
    expect(
      addProjectLinkInput.safeParse({
        projectId: PROJECT_ID,
        label: "Staging",
        url: "http://insecure.example.com",
      }).success,
    ).toBe(false);
    expect(
      addProjectLinkInput.safeParse({
        projectId: PROJECT_ID,
        label: "Staging",
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      addProjectLinkInput.safeParse({
        projectId: PROJECT_ID,
        label: "Staging",
        url: "https://staging.example.com",
      }).success,
    ).toBe(true);
  });

  it("client request transitions only accept the four statuses", () => {
    expect(
      clientRequestTransitionInput.safeParse({ clientRequestId: PROJECT_ID, status: "done" })
        .success,
    ).toBe(false);
    expect(
      clientRequestTransitionInput.safeParse({
        clientRequestId: PROJECT_ID,
        status: "completed",
      }).success,
    ).toBe(true);
  });
});
