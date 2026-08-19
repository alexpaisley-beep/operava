import type { Metadata } from "next";

import { Cta } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { primaryNav, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="bg-paper">
      <div className="container-x py-20 lg:py-28">
        <div className="max-w-2xl">
          <Eyebrow>404</Eyebrow>
          <h1 className="t-h1 mt-6 text-ink">This page doesn&rsquo;t exist.</h1>
          <p className="t-lead mt-6 text-ink-2">
            Which is annoying, but fixable. Everything worth reading is one of these:
          </p>

          <ul className="mt-9 flex flex-col divide-y divide-line border-y border-line">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="flex items-center justify-between py-4 text-[1.0625rem] text-ink transition-colors hover:text-navy-700"
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
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Cta href="/" variant="secondary" location="404">
              Back to home
            </Cta>
            <Cta href="/book" location="404">
              Book a Discovery Call
            </Cta>
          </div>

          <p className="mt-9 text-[0.9375rem] text-ink-3">
            Or email us at{" "}
            <a
              href={`mailto:${site.contactEmail}`}
              className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
            >
              {site.contactEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
