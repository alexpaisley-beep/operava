import type { Metadata } from "next";

import { AuthShell } from "@/components/portal/auth-shell";
import { LoginForm } from "@/components/portal/auth-forms";

export const metadata: Metadata = {
  title: "Client Login",
  description: "Sign in to the Operava client portal.",
  // The portal is private. Nothing under /portal should ever appear in a
  // search result, and robots.ts disallows the whole tree as well.
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/portal") ? params.next : "/portal";

  return (
    <AuthShell
      eyebrow="Client portal"
      title="Sign in to your project."
      lead="Accounts are set up by Operava. If you do not have one yet, tell us who on your team needs access."
    >
      <LoginForm next={next} linkError={params.error === "link"} />
    </AuthShell>
  );
}
