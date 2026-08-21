import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { isPortalError } from "@/lib/portal/errors";
import { createFileDownloadUrl } from "@/lib/portal/services/files";
import { createServiceClient } from "@/lib/portal/supabase/server";
import { uuid } from "@/lib/portal/validation";
import { getViewer, viewerActor } from "@/lib/portal/viewer";

/**
 * File downloads: authorize the viewer against the file's project (service
 * layer checks tenancy and visibility), then bounce to a 2-minute signed URL.
 * The bucket itself is private; nothing is ever publicly addressable.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ fileId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");

  const { fileId } = await context.params;
  const parsed = uuid.safeParse(fileId);
  if (!parsed.success) return new Response("Not found", { status: 404 });

  try {
    const url = await createFileDownloadUrl(
      { db: createServiceClient(), actor: viewerActor(viewer), source: "portal" },
      parsed.data,
    );
    return Response.redirect(url, 302);
  } catch (error) {
    if (isPortalError(error) && error.code === "not_found") {
      return new Response("Not found", { status: 404 });
    }
    console.error("portal.file_download_failed", error);
    return new Response("Download unavailable", { status: 500 });
  }
}
