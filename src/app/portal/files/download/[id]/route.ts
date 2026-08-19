import { NextResponse, type NextRequest } from "next/server";

import { getViewer } from "@/lib/portal/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Download a project file.
 *
 * The bucket is private, so nothing here is a public URL. The flow is:
 *
 *   1. Confirm a session exists at all.
 *   2. Read the `project_files` row through the request-scoped client, so RLS
 *      decides whether this viewer may see it. A client at another company gets
 *      no row and therefore a 404 — the same response as an id that does not
 *      exist, which is deliberate.
 *   3. Mint a 60-second signed URL and redirect to it.
 *
 * The signed URL is short-lived because it is the one artefact that works
 * without a session; a minute is long enough for a browser to follow a redirect
 * and short enough that a leaked link in a referrer header is worthless.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  const { data: file } = await supabase
    .from("project_files")
    .select("id, path, name")
    .eq("id", id)
    .maybeSingle();

  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: signed, error } = await supabase.storage
    .from("project-files")
    .createSignedUrl(file.path, 60, { download: file.name });

  if (error || !signed) {
    return NextResponse.json({ error: "Could not prepare that download" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
