import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export type Viewer = {
  authUserId: string;
  email: string;
  profile: Profile;
  isAdmin: boolean;
};

/**
 * The signed-in person, or null.
 *
 * `cache()` so a page that checks the viewer, renders a nav that checks the
 * viewer, and loads data that checks the viewer makes one round trip rather
 * than three within the same request.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Self-read policy covers this; no elevated client needed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // An auth user with no profile row is a half-finished provisioning job. They
  // are authenticated but have no company, no role and no data, so the portal
  // treats them as signed out rather than rendering an empty shell.
  if (!profile) return null;

  return {
    authUserId: user.id,
    email: user.email ?? profile.email,
    profile,
    isAdmin: profile.role === "admin",
  };
});

/** Portal pages call this first. Middleware already redirected, so this is belt and braces. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  return viewer;
}

/**
 * Admin-only pages and actions.
 *
 * Sends non-admins to their own overview rather than to an error: a client who
 * finds /portal/admin should land somewhere useful, not somewhere that confirms
 * an admin area exists at that address.
 */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.isAdmin) redirect("/portal");
  return viewer;
}
