import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { footerNav, site } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark border-t border-white/10 bg-navy-950 text-navy-100">
      <div className="container-x py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              className="-m-2 inline-flex rounded-md p-2 text-white transition-opacity hover:opacity-80"
              aria-label={`${site.name} — home`}
            >
              <Logo markClassName="h-8 w-8" />
            </Link>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-navy-200">
              Custom operating software for landscaping companies that have outgrown
              off-the-shelf tools.
            </p>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-5 inline-block text-[0.95rem] text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-leaf-400"
            >
              {site.contactEmail}
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="t-eyebrow text-navy-200">{group.title}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={`${group.title}-${item.href}`}>
                      <Link
                        href={item.href}
                        className="text-[0.95rem] text-navy-100 transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-[0.8125rem] text-navy-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {site.legalName}. All rights reserved.
          </p>
          <p className="t-mono-sm text-navy-200/80">
            Custom builds from {site.startingPrice} &middot; hosting, maintenance and support
            from {site.supportPrice}
          </p>
        </div>
      </div>
    </footer>
  );
}
