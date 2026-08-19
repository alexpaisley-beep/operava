import type { Metadata } from "next";
import Link from "next/link";

import { TrackEvent } from "@/components/analytics-event";
import { Cta } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Received",
  description: "Your custom software request has been received by Operava.",
  robots: { index: false, follow: false },
};

const next = [
  {
    title: "Someone reads it",
    body: "Not a routing rule. The problem you described is the part we care about, so it gets read properly.",
  },
  {
    title: "We work out whether it's worth building",
    body: "Sometimes the honest answer is a configuration change or an integration, not a custom system. If that's the case, we'll tell you.",
  },
  {
    title: "You get a real reply by email",
    body: "What we would build, what we would leave alone, and roughly what the work involves.",
  },
];

export default async function RequestReceivedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <TrackEvent event="software_request_submitted" />

      <section className="border-b border-line bg-paper">
        <div className="container-x py-14 lg:py-20">
          <div className="max-w-3xl">
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-leaf-50 text-leaf-600"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path
                  d="M5 12.5 10 17.5 19 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <h1 className="t-h1 mt-7 text-ink">Got it.</h1>
            <p className="t-lead mt-6 text-ink-2">
              We&rsquo;ll read through how your company operates and come back with what would
              actually be worth building — including if the answer is &ldquo;less than you
              think.&rdquo;
            </p>

            {ref ? (
              <p className="t-mono-sm mt-7 inline-block rounded border border-line bg-surface px-3 py-2 text-ink-3">
                reference {ref}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-x py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <h2 className="t-eyebrow text-ink-3">What happens next</h2>
              <ol className="mt-6 flex flex-col divide-y divide-line border-y border-line">
                {next.map((item, index) => (
                  <li key={item.title} className="flex gap-5 py-5">
                    <span className="t-mono-sm shrink-0 pt-0.5 text-ink-3">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[1rem] font-semibold tracking-[-0.015em] text-ink">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-lg border border-line bg-paper p-6 lg:p-8">
                <h2 className="t-h3 text-ink">Want to move faster?</h2>
                <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">
                  A discovery call covers far more ground than a form. If you&rsquo;d rather
                  talk it through, book one now and we&rsquo;ll use what you just sent as the
                  starting point.
                </p>
                <div className="mt-6">
                  <Cta href="/book" size="lg" location="request-received">
                    Book a Discovery Call
                  </Cta>
                </div>
              </div>

              <p className="mt-7 text-[0.9375rem] leading-relaxed text-ink-2">
                Have screenshots, a report, or an example of the workaround? Send them to{" "}
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
                >
                  {site.contactEmail}
                </a>
                {ref ? ` and mention reference ${ref}.` : "."}
              </p>

              <p className="mt-8 text-[0.875rem] text-ink-3">
                <Link
                  href="/"
                  className="underline decoration-line-2 underline-offset-4 hover:decoration-navy-600"
                >
                  Back to {site.name}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
