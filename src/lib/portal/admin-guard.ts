import { redirect } from "next/navigation";

import { createServiceClient, type Db } from "./supabase/server";
import { getViewer, type Viewer } from "./viewer";

/**
 * The gate every admin *page* uses before reading through the RLS-bypassing
 * service client.
 *
 * Why a page-level gate and not just the admin layout: in the App Router a
 * layout and its pages render concurrently, so a layout `redirect()` does not
 * *precede* a page's data fetch — it races it. If an admin page called
 * `createServiceClient()` directly, that cross-tenant, internal-field read
 * would execute for an unauthorized principal even though the response body is
 * later suppressed by the redirect. Coupling the check to obtaining the client
 * makes the authorization the first await in the page, so the privileged read
 * is sequenced strictly after it — and cannot be reached at all without
 * passing it.
 */
export async function requireAdminDb(): Promise<{ viewer: Viewer; db: Db }> {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  if (viewer.role !== "admin") redirect("/portal");
  return { viewer, db: createServiceClient() };
}
