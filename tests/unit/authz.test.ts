import { describe, expect, it } from "vitest";

import {
  actorProfileId,
  actorType,
  assertActorCanAccessProject,
  assertCustomerActor,
  assertOperavaActor,
  customerCanAccessProject,
  isOperavaActor,
  type Actor,
} from "@/lib/portal/authz";
import { PortalError } from "@/lib/portal/errors";

const internal: Actor = { kind: "internal", profileId: "p-admin", label: "Alex" };
const mcp: Actor = { kind: "mcp", label: "ChatGPT" };
const system: Actor = { kind: "system", label: "cron" };
const customerA: Actor = {
  kind: "customer",
  profileId: "p-a",
  companyId: "company-a",
  label: "Dana",
};

describe("actor basics", () => {
  it("maps actor kinds onto the audit actor_type verbatim", () => {
    expect(actorType(internal)).toBe("internal");
    expect(actorType(customerA)).toBe("customer");
    expect(actorType(mcp)).toBe("mcp");
    expect(actorType(system)).toBe("system");
  });

  it("only human actors carry a profile id", () => {
    expect(actorProfileId(internal)).toBe("p-admin");
    expect(actorProfileId(customerA)).toBe("p-a");
    expect(actorProfileId(mcp)).toBeNull();
    expect(actorProfileId(system)).toBeNull();
  });

  it("treats internal, mcp and system as Operava-side", () => {
    expect(isOperavaActor(internal)).toBe(true);
    expect(isOperavaActor(mcp)).toBe(true);
    expect(isOperavaActor(system)).toBe(true);
    expect(isOperavaActor(customerA)).toBe(false);
  });

  it("assertOperavaActor rejects customers with forbidden", () => {
    expect(() => assertOperavaActor(customerA)).toThrowError(PortalError);
    try {
      assertOperavaActor(customerA);
    } catch (error) {
      expect((error as PortalError).code).toBe("forbidden");
    }
    expect(() => assertOperavaActor(mcp)).not.toThrow();
  });

  it("assertCustomerActor rejects every Operava-side actor", () => {
    for (const actor of [internal, mcp, system]) {
      expect(() => assertCustomerActor(actor)).toThrowError(PortalError);
    }
    expect(() => assertCustomerActor(customerA)).not.toThrow();
  });
});

describe("customer project access", () => {
  const facts = (companyId: string, memberProjectIds: string[] = []) => ({
    projectCompanyId: companyId,
    memberProjectIds,
  });

  it("allows a customer into their own company's projects", () => {
    expect(customerCanAccessProject(customerA as never, "proj-1", facts("company-a"))).toBe(
      true,
    );
  });

  it("never allows a customer into another company's project", () => {
    expect(customerCanAccessProject(customerA as never, "proj-1", facts("company-b"))).toBe(
      false,
    );
  });

  it("narrows to explicit memberships when any exist", () => {
    expect(
      customerCanAccessProject(customerA as never, "proj-1", facts("company-a", ["proj-1"])),
    ).toBe(true);
    expect(
      customerCanAccessProject(customerA as never, "proj-2", facts("company-a", ["proj-1"])),
    ).toBe(false);
  });

  it("membership in another company's project still cannot cross tenants", () => {
    expect(
      customerCanAccessProject(customerA as never, "proj-b", facts("company-b", ["proj-b"])),
    ).toBe(false);
  });

  it("reports cross-tenant denial as not_found, indistinguishable from missing", () => {
    try {
      assertActorCanAccessProject(customerA, "proj-1", facts("company-b"));
      expect.unreachable();
    } catch (error) {
      expect((error as PortalError).code).toBe("not_found");
    }
  });

  it("lets every Operava-side actor through", () => {
    for (const actor of [internal, mcp, system]) {
      expect(() =>
        assertActorCanAccessProject(actor, "proj-1", facts("company-b")),
      ).not.toThrow();
    }
  });
});
