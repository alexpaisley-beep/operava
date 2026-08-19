"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Cta } from "@/components/ui/button";
import { primaryNav, site } from "@/lib/site";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close whenever navigation happens. Adjusted during render so the panel is
  // never painted over the new page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Escape closes, and the page behind must not scroll while the panel is up.
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
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      {/* Near-opaque rather than glassy: at lower opacity the dark sections
          bleed through and the bar reads as dingy grey. */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="container-x">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
            <Link
              href="/"
              className="-m-2 flex items-center rounded-md p-2 text-ink transition-opacity hover:opacity-80"
              aria-label={`${site.name} — home`}
            >
              <Logo markClassName="h-7 w-7 lg:h-8 lg:w-8" />
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-[0.9rem] transition-colors duration-150 hover:bg-navy-50 hover:text-navy-800 ${
                    isActive(pathname, item.href) ? "text-navy-800 font-medium" : "text-ink-2"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Cta
                href="/book"
                size="sm"
                location="header"
                arrow={false}
                className="hidden sm:inline-flex"
              >
                Book a Call
              </Cta>

              <button
                ref={toggleRef}
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-navy-50 lg:hidden"
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
          </div>
        </div>
      </header>

      {/*
        Deliberately a sibling of <header>, not a child: the header carries a
        backdrop-filter, which would make it the containing block for any
        position:fixed descendant and collapse this panel to the header's own
        height.
      */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto overscroll-contain border-t border-line bg-paper lg:hidden"
      >
        <nav aria-label="Mobile" className="container-x flex flex-col py-2">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`flex items-center justify-between border-b border-line py-4 text-[1.15rem] tracking-[-0.02em] transition-colors ${
                isActive(pathname, item.href) ? "text-navy-800 font-medium" : "text-ink"
              }`}
            >
              {item.label}
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="h-4 w-4 text-ink-3"
              >
                <path
                  d="M6 3.5 10.5 8 6 12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}

          <div className="flex flex-col gap-3 py-7">
            <Cta href="/book" size="lg" location="mobile-menu" className="w-full">
              Walk us through a workflow
            </Cta>
            <Cta
              href="/request-software"
              variant="secondary"
              size="lg"
              location="mobile-menu"
              className="w-full"
            >
              Tell us what isn&rsquo;t working
            </Cta>
            <p className="pt-2 text-center text-[0.875rem] text-ink-3">
              Custom builds start at {site.startingPrice}.
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
