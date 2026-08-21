import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";

import { PendingSubmit } from "./pending-submit";

export type ShellNavItem = { href: string; label: string };

/**
 * Chrome for the signed-in surfaces. Deliberately quieter than the marketing
 * site: one slim header, the project is the hero.
 */
export function PortalShell({
  homeHref,
  areaLabel,
  nav,
  identity,
  signOut,
  children,
}: {
  homeHref: string;
  areaLabel: string;
  nav: ShellNavItem[];
  identity: { name: string; detail: string };
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#portal-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3.5">
            <Link href={homeHref} aria-label="Portal home" className="shrink-0">
              <Logo markClassName="h-7 w-7" wordClassName="text-[1.15rem]" />
            </Link>
            <span aria-hidden="true" className="h-5 w-px bg-line-2" />
            <span className="t-eyebrow truncate text-ink-3">{areaLabel}</span>
          </div>
          <nav aria-label="Portal" className="hidden items-center gap-1 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-[0.875rem] font-medium text-ink-2 transition-colors hover:bg-navy-50 hover:text-navy-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[14rem] truncate text-[0.8125rem] font-medium text-ink">
                {identity.name}
              </p>
              <p className="max-w-[14rem] truncate text-[0.72rem] text-ink-3">
                {identity.detail}
              </p>
            </div>
            <form action={signOut}>
              <PendingSubmit variant="quiet" pendingLabel="Signing out…">
                Sign out
              </PendingSubmit>
            </form>
          </div>
        </div>
        {nav.length > 0 ? (
          <nav
            aria-label="Portal sections"
            className="container-x flex gap-1 overflow-x-auto pb-2 sm:hidden"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-[0.8125rem] font-medium text-ink-2 hover:bg-navy-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main id="portal-content" className="flex-1 pb-20 pt-8 sm:pt-10">
        <div className="container-x">{children}</div>
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-[0.78rem] text-ink-3">
          <span>Operava LLC</span>
          <span>
            Questions? Email{" "}
            <a
              className="underline decoration-line-2 hover:text-navy-700"
              href={`mailto:${site.contactEmail}`}
            >
              {site.contactEmail}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
