import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdminDb } from "@/lib/portal/admin-guard";
import * as viewerModule from "@/lib/portal/viewer";

// redirect() throws in Next; model that so we can assert the destination and
// prove control flow stops before any privileged read.
class RedirectError extends Error {
  constructor(public to: string) {
    super(`REDIRECT:${to}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectError(to);
  },
}));

const SERVICE_CLIENT = { marker: "service" };
vi.mock("@/lib/portal/supabase/server", () => ({
  createServiceClient: () => SERVICE_CLIENT,
}));

vi.mock("@/lib/portal/viewer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/portal/viewer")>();
  return { ...actual, getViewer: vi.fn() };
});

const admin = {
  authUserId: "u1",
  profileId: "p1",
  role: "admin" as const,
  companyId: null,
  fullName: "Alex",
  email: "admin@operava.test",
};
const client = { ...admin, role: "client" as const, companyId: "c1", email: "c@a.test" };

beforeEach(() => {
  vi.mocked(viewerModule.getViewer).mockReset();
});

describe("requireAdminDb", () => {
  it("returns the service client only for an admin viewer", async () => {
    vi.mocked(viewerModule.getViewer).mockResolvedValue(admin);
    const { db, viewer } = await requireAdminDb();
    expect(db).toBe(SERVICE_CLIENT);
    expect(viewer.role).toBe("admin");
  });

  it("redirects an unauthenticated visitor to login before any read", async () => {
    vi.mocked(viewerModule.getViewer).mockResolvedValue(null);
    await expect(requireAdminDb()).rejects.toMatchObject({ to: "/portal/login" });
  });

  it("redirects a signed-in customer away from admin — the service client is never returned", async () => {
    vi.mocked(viewerModule.getViewer).mockResolvedValue(client);
    await expect(requireAdminDb()).rejects.toMatchObject({ to: "/portal" });
  });
});
