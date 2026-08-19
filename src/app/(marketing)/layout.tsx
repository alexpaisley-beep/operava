import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Public marketing chrome.
 *
 * Split out of the root layout when the portal was added. The two surfaces
 * share a design system and nothing else: a signed-in client looking at their
 * project has no use for the site nav, a "Book a Call" button or the marketing
 * footer, and the login screen was rendering two Operava logos because it sat
 * inside this header.
 *
 * Route groups do not appear in URLs, so every public path is unchanged.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-navy-700 focus:px-4 focus:py-2.5 focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
