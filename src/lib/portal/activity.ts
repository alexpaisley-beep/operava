import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Visibility } from "@/lib/supabase/types";

/**
 * Append to a project's activity log.
 *
 * Deliberately best-effort: a failed log write must never fail the operation it
 * was describing. A customer whose request was saved does not care that the
 * audit line did not land, and throwing here would roll back real work to
 * protect a breadcrumb.
 *
 * Only log things a person would want to read. "Status changed to Testing" is
 * worth a line; "row updated" is noise that buries it.
 */
export async function logActivity({
  projectId,
  actorId,
  eventType,
  description,
  visibility = "customer",
}: {
  projectId: string;
  actorId: string | null;
  eventType: string;
  description: string;
  visibility?: Visibility;
}): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("activity_log").insert({
      project_id: projectId,
      actor_id: actorId,
      event_type: eventType.slice(0, 60),
      description: description.slice(0, 500),
      visibility,
    });
  } catch {
    // Swallowed on purpose — see above.
  }
}
