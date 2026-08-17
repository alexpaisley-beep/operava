import type { Metadata } from "next";
import Link from "next/link";

import { TrackEvent } from "@/components/analytics-event";
import { SchedulerEmbed } from "@/components/scheduler-embed";
import { Cta } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Received",
  description: "Your discovery call request has been received by Operava.",
  robots: { index: false, follow: false },
};

const next = [
  {
    title: "We read what you sent",
    body: "Properly, not skimmed. The current software and the frustration are the two answers that matter most.",
  },
  {
    title: "We look at how you operate",
    body: "Your site, your service lines, the shape of the business. It means the call starts at the real question instead of background.",
  },
  {
    title: "We get a time on the calendar",
    body: "Using the contact method you picked. If a specific window works better for you, say so and we'll work around it.",
  },
];

export default async function BookConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <TrackEvent event="booking_submitted" />

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
              We&rsquo;ll review how your company operates and come into the call ready to talk
              about what would actually be worth building.
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
            <div className="lg:col-span-7">
              <SchedulerEmbed />
            </div>

            <div className="lg:col-span-5">
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

              <p className="mt-7 text-[0.9375rem] leading-relaxed text-ink-2">
                Something to add, or a screenshot that shows the problem better than words? Send
                it to{" "}
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
                >
                  {site.contactEmail}
                </a>
                {ref ? ` and mention reference ${ref}.` : "."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="container-x py-12 lg:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="t-h3 text-ink">While you wait</h2>
              <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-2">
                Worth a look before the call — it will make the conversation faster.
              </p>
            </div>
            <div className="flex flex-col gap-3 xs:flex-row">
              <Cta href="/process" variant="secondary" location="book-confirmed">
                How we scope a project
              </Cta>
              <Cta href="/pricing" variant="secondary" location="book-confirmed">
                How pricing works
              </Cta>
            </div>
          </div>

          <p className="mt-10 text-[0.875rem] text-ink-3">
            <Link
              href="/"
              className="underline decoration-line-2 underline-offset-4 hover:decoration-navy-600"
            >
              Back to {site.name}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
