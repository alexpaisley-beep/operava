import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PortalShell, type PortalNavItem } from "@/components/portal/shell";
import { signOut } from "@/lib/portal/auth-actions";
import { listProjects, listRequests, openRequests } from "@/lib/portal/data";
import { getViewer } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: { default: "Client Portal", template: "%s — Operava Portal" },
  robots: { index: false, follow: false },
};

/**
 * Portal chrome for every signed-in page.
 *
 * The unauthenticated screens (login, reset, set password, unavailable) render
 * their own full-page shell instead, so this returns `children` bare when there
 * is no viewer rather than wrapping a login form in a navigation rail for an
 * account that does not exist yet.
 */
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) return <>{children}</>;

  const projects = await listProjects();
  const active = projects.find((project) => !project.is_archived) ?? projects[0] ?? null;

  // Badge the Requests tab with what is actually outstanding. Only for clients:
  // an admin's queue spans every project and is counted on their own dashboard.
  let openCount = 0;
  if (!viewer.isAdmin && active) {
    openCount = openRequests(await listRequests(active.id)).length;
  }

  const clientNav: PortalNavItem[] = [
    { href: "/portal", label: "Overview" },
    { href: "/portal/project", label: "Project" },
    { href: "/portal/requests", label: "Requests", badge: openCount },
    { href: "/portal/files", label: "Files" },
    { href: "/portal/billing", label: "Billing" },
    { href: "/portal/support", label: "Support" },
  ];

  const adminNav: PortalNavItem[] = [
    { href: "/portal/admin", label: "Dashboard" },
    { href: "/portal/admin/companies", label: "Companies" },
    { href: "/portal/admin/projects", label: "Projects" },
    { href: "/portal/admin/requests", label: "Requests" },
    { href: "/portal/admin/people", label: "People" },
    // Admins see the client-facing portal through RLS rather than by
    // impersonating anyone, which keeps "what does the customer see" one click
    // away and leaves no ambiguity in the audit trail about who acted.
    { href: "/portal", label: "Client view" },
  ];

  return (
    <PortalShell
      nav={viewer.isAdmin ? adminNav : clientNav}
      viewerName={viewer.profile.full_name || viewer.email}
      viewerEmail={viewer.email}
      roleLabel={viewer.isAdmin ? "Operava staff" : "Client"}
      projects={projects.map((project) => ({ id: project.id, name: project.name }))}
      activeProjectId={active?.id ?? null}
      projectBasePath="/portal"
      signOutAction={signOut}
    >
      {children}
    </PortalShell>
  );
}
