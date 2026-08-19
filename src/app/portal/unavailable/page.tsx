import type { Metadata } from "next";

import { AuthShell } from "@/components/portal/auth-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portal Unavailable",
  robots: { index: false, follow: false },
};

/**
 * Shown when the deployment has no Supabase configuration.
 *
 * The marketing site has always run with zero environment configuration, and a
 * preview deploy without secrets should say so honestly rather than return a
 * 500 that looks like an outage.
 */
export default function PortalUnavailablePage() {
  return (
    <AuthShell
      eyebrow="Client portal"
      title="The portal is not available on this deployment."
      lead="This environment has no portal configuration. Nothing is wrong with your account."
    >
      <p className="text-[0.9375rem] leading-relaxed text-ink-2">
        If you were expecting to sign in, email us and we will send you the right link.
      </p>
      <a
        href={`mailto:${site.contactEmail}`}
        className="mt-5 inline-flex items-center rounded-md border border-line-2 bg-surface px-5 py-3 text-[0.9375rem] font-medium text-navy-800 transition-colors hover:border-navy-600 hover:bg-navy-50"
      >
        {site.contactEmail}
      </a>
    </AuthShell>
  );
}
