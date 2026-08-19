import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";

/**
 * Chrome for the four unauthenticated portal screens.
 *
 * Same hairline grid, navy and typography as the marketing site, on a narrow
 * centred column. It should be obvious this is Operava and not a generic
 * hosted login page.
 */
export function AuthShell({
  eyebrow,
  title,
  lead,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-paper">
      <div
        aria-hidden="true"
        className="grid-lines pointer-events-none absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, #000 5%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 55% at 50% 0%, #000 5%, transparent 75%)",
        }}
      />

      <div className="container-x relative flex flex-1 flex-col">
        <header className="py-8">
          <Link
            href="/"
            className="-m-2 inline-flex rounded-md p-2 text-ink transition-opacity hover:opacity-80"
            aria-label={`${site.name} — home`}
          >
            <Logo markClassName="h-7 w-7" />
          </Link>
        </header>

        <div className="flex flex-1 items-start justify-center pb-16 pt-4 sm:items-center sm:pb-24 sm:pt-0">
          <div className="w-full max-w-[27rem]">
            <p className="t-eyebrow text-ink-3">{eyebrow}</p>
            <h1 className="t-h2 mt-4 text-ink">{title}</h1>
            {lead ? (
              <div className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">{lead}</div>
            ) : null}

            <div className="mt-8 rounded-lg border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(16,26,43,0.04),0_12px_32px_-16px_rgba(16,26,43,0.12)] sm:p-7">
              {children}
            </div>

            {footer ? (
              <div className="mt-6 text-[0.875rem] leading-relaxed text-ink-3">{footer}</div>
            ) : null}
          </div>
        </div>

        <footer className="border-t border-line py-6 text-[0.8125rem] text-ink-3">
          <p>
            Portal access is provided by Operava. Need an account?{" "}
            <a
              href={`mailto:${site.contactEmail}`}
              className="text-navy-700 underline decoration-navy-200 underline-offset-4 transition-colors hover:decoration-navy-600"
            >
              {site.contactEmail}
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
