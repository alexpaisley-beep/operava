"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";

export type PortalNavItem = {
  href: string;
  label: string;
  /** Small count badge, e.g. open requests. Zero and undefined both hide it. */
  badge?: number;
};

export type PortalProjectOption = { id: string; name: string };

function isActive(pathname: string, href: string): boolean {
  const [base] = href.split("?");
  if (!base) return false;
  if (base === "/portal" || base === "/portal/admin") return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Portal chrome.
 *
 * A left rail on desktop, a sticky bar with a drop-down on mobile — the same
 * pattern as the marketing site's header, and for the same reason: a contractor
 * opening this from a truck gets full-width content and 44px tap targets, not a
 * squeezed sidebar.
 */
export function PortalShell({
  nav,
  viewerName,
  viewerEmail,
  roleLabel,
  projects,
  activeProjectId,
  projectBasePath,
  signOutAction,
  children,
}: {
  nav: PortalNavItem[];
  viewerName: string;
  viewerEmail: string;
  roleLabel: string;
  projects: PortalProjectOption[];
  activeProjectId: string | null;
  /** Where the project switcher points. Client pages keep the visitor in place. */
  projectBasePath: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Navigation closes the panel. Adjusted during render so the menu is never
  // painted over the page it just navigated to.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const navLinks = (
    <ul className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-[0.9375rem] transition-colors lg:py-2 ${
                active
                  ? "bg-navy-50 font-medium text-navy-800"
                  : "text-ink-2 hover:bg-navy-50/60 hover:text-navy-800"
              }`}
            >
              {item.label}
              {item.badge ? (
                <span className="t-mono-sm rounded-full bg-navy-700 px-2 py-0.5 text-[0.6875rem] leading-none text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const projectSwitcher =
    projects.length > 1 ? (
      <form action={projectBasePath} method="get" className="px-3">
        <label htmlFor="project-switch" className="t-eyebrow text-ink-3">
          Project
        </label>
        <select
          id="project-switch"
          name="project"
          defaultValue={activeProjectId ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="mt-2 w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-[0.875rem] text-ink transition-colors hover:border-navy-200 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {/* Submits without scripting too, so the switcher is never a dead control. */}
        <noscript>
          <button
            type="submit"
            className="mt-2 w-full rounded-md border border-line-2 px-3 py-2 text-[0.8125rem] text-navy-800"
          >
            Switch
          </button>
        </noscript>
      </form>
    ) : null;

  const account = (
    <div className="border-t border-line px-3 pt-4">
      <p className="truncate text-[0.875rem] font-medium text-ink">{viewerName}</p>
      <p className="truncate text-[0.8125rem] text-ink-3">{viewerEmail}</p>
      <p className="t-mono-sm mt-1.5 text-ink-3">{roleLabel}</p>
      <form action={signOutAction} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-md border border-line-2 px-3 py-2 text-[0.875rem] font-medium text-ink-2 transition-colors hover:border-navy-200 hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-paper lg:flex-row">
      {/* ------------------------------------------------------ Mobile bar */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md lg:hidden">
        <div className="flex h-16 items-center justify-between gap-4 px-5">
          <Link
            href="/portal"
            className="-m-2 flex items-center gap-2.5 rounded-md p-2 text-ink"
            aria-label="Operava portal"
          >
            <Logo markClassName="h-7 w-7" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="portal-menu"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-navy-50"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3.5 7h17M3.5 12h17M3.5 17h17"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Sibling of <header>, not a child: the header carries a backdrop-filter,
          which would otherwise become the containing block for this fixed panel
          and collapse it to the header's own height. */}
      <div
        id="portal-menu"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto overscroll-contain border-t border-line bg-paper px-2 py-4 lg:hidden"
      >
        <nav aria-label="Portal">{navLinks}</nav>
        {projectSwitcher ? <div className="mt-6">{projectSwitcher}</div> : null}
        <div className="mt-6">{account}</div>
      </div>

      {/* --------------------------------------------------- Desktop rail */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <Link
            href="/portal"
            className="-m-2 inline-flex rounded-md p-2 text-ink transition-opacity hover:opacity-80"
            aria-label="Operava portal"
          >
            <Logo markClassName="h-7 w-7" />
          </Link>
        </div>

        <nav aria-label="Portal" className="flex-1 px-2">
          {navLinks}
          {projectSwitcher ? <div className="mt-6">{projectSwitcher}</div> : null}
        </nav>

        <div className="px-2 pb-6 pt-4">{account}</div>
      </aside>

      {/* -------------------------------------------------------- Content */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
