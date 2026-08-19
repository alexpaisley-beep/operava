import type { Metadata } from "next";

import { BookingForm } from "@/components/forms/booking-form";
import { Eyebrow } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Discovery Call",
  description:
    "Walk us through a workflow that is costing your business time. We map how your operation runs today and what is genuinely worth building. Custom projects start at $6,000.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a Discovery Call — Operava",
    description:
      "Tell us how your company runs and where the software stops. Custom builds start at $6,000.",
    url: `${site.url}/book`,
  },
};

const covered = [
  "How work moves from request to paid today",
  "Where your current systems stop talking to each other",
  "The workarounds and spreadsheets your team has quietly built",
  "Which parts are worth building and which are not",
  "What a realistic scope and price look like",
];

const notCovered = [
  "A pitch for a platform subscription",
  "A number quoted before we understand the work",
  "Advice to replace software that already works",
];

export default function BookPage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>Discovery call</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">
              Walk us through a workflow. We&rsquo;ll tell you what&rsquo;s worth building.
            </h1>
            <p className="t-lead mt-6 text-ink-2">
              Thirty to forty-five minutes, no pitch deck. The questions below take a few
              minutes and mean we come into the call already understanding your operation
              instead of spending it on background.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-x py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <BookingForm />
            </div>

            <aside className="lg:col-span-5">
              <div className="flex flex-col gap-6 lg:sticky lg:top-28">
                <div className="rounded-lg border border-line bg-paper p-6 lg:p-7">
                  <h2 className="t-eyebrow text-ink-3">What we cover</h2>
                  <ul className="mt-5 flex flex-col gap-3">
                    {covered.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-[0.9375rem] leading-snug text-ink"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-leaf-500"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-line bg-paper p-6 lg:p-7">
                  <h2 className="t-eyebrow text-ink-3">What we don&rsquo;t do</h2>
                  <ul className="mt-5 flex flex-col gap-3">
                    {notCovered.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-[0.9375rem] leading-snug text-ink-2"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[0.45rem] h-px w-3 shrink-0 bg-line-2"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-navy-100 bg-navy-50 p-6 lg:p-7">
                  <h2 className="t-eyebrow text-navy-600">Before you ask</h2>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                    <strong className="font-semibold text-ink">
                      Most custom builds start around {site.startingPrice}.
                    </strong>{" "}
                    Larger systems are scoped on complexity. Hosting, maintenance and support
                    runs from {site.supportPrice} once you&rsquo;re live.
                  </p>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                    If that&rsquo;s not the right range for where your company is right now, the
                    call is still free and we&rsquo;ll tell you what we&rsquo;d do instead.
                  </p>
                </div>

                <p className="text-[0.875rem] leading-relaxed text-ink-3">
                  Prefer to write it out first?{" "}
                  <a
                    href="/request-software"
                    className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
                  >
                    Request custom software
                  </a>{" "}
                  instead and we&rsquo;ll reply by email.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
