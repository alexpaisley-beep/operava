import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal/shell";
import { signOut } from "@/lib/portal/auth-actions";
import { supabaseConfigured } from "@/lib/portal/env";
import { getViewer } from "@/lib/portal/viewer";

// Auth-gated: every request depends on the session cookie.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function PortalAppLayout({ children }: { children: ReactNode }) {
  if (!supabaseConfigured()) redirect("/portal/login");

  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  if (viewer.role === "admin") redirect("/admin");
  if (!viewer.companyId) redirect("/portal/login");

  return (
    <PortalShell
      homeHref="/portal"
      areaLabel="Client portal"
      nav={[{ href: "/portal", label: "Overview" }]}
      identity={{ name: viewer.fullName || viewer.email, detail: viewer.email }}
      signOut={signOut}
    >
      {children}
    </PortalShell>
  );
}
