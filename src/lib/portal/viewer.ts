import { cache } from "react";

import type { Actor } from "./authz";
import { PortalError } from "./errors";
import { createUserClient } from "./supabase/server";
import type { PortalRole } from "./types";

export type Viewer = {
  authUserId: string;
  profileId: string;
  role: PortalRole;
  companyId: string | null;
  fullName: string;
  email: string;
};

/**
 * Resolve the signed-in person for this request, or null. Uses the
 * cookie-bound client, so the profile read itself runs under RLS. Cached per
 * request — layouts, pages and actions can all call it freely.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, auth_user_id, company_id, full_name, email, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // Authenticated but not provisioned in the portal: treat as signed out.
  if (!profile) return null;

  return {
    authUserId: user.id,
    profileId: profile.id,
    role: profile.role,
    companyId: profile.company_id,
    fullName: profile.full_name,
    email: profile.email,
  };
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new PortalError("unauthorized", "Sign in to continue.");
  return viewer;
}

export async function requireAdminViewer(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") {
    throw new PortalError("forbidden", "This area is for Operava staff.");
  }
  return viewer;
}

/** The service-layer actor for a signed-in person. */
export function viewerActor(viewer: Viewer): Actor {
  if (viewer.role === "admin") {
    return {
      kind: "internal",
      profileId: viewer.profileId,
      label: viewer.fullName || viewer.email,
    };
  }
  if (!viewer.companyId) {
    // The DB check constraint forbids this, but never trust it silently.
    throw new PortalError("forbidden", "Your account is not linked to a company yet.");
  }
  return {
    kind: "customer",
    profileId: viewer.profileId,
    companyId: viewer.companyId,
    label: viewer.fullName || viewer.email,
  };
}
