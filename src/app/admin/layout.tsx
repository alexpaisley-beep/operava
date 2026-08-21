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
  title: "Operava admin",
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!supabaseConfigured()) redirect("/portal/login");

  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  // Customers who guess /admin land back on their own portal.
  if (viewer.role !== "admin") redirect("/portal");

  return (
    <PortalShell
      homeHref="/admin"
      areaLabel="Operava admin"
      nav={[
        { href: "/admin", label: "Projects" },
        { href: "/admin/customers", label: "Customers" },
      ]}
      identity={{ name: viewer.fullName || viewer.email, detail: "Operava staff" }}
      signOut={signOut}
    >
      {children}
    </PortalShell>
  );
}
