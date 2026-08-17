import type { Metadata } from "next";

import { RequestForm } from "@/components/forms/request-form";
import { Cta } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Custom Software",
  description:
    "Tell us what is wasting time, breaking, or forcing your team into workarounds. Operava builds custom operating software for landscaping companies.",
  alternates: { canonical: "/request-software" },
  openGraph: {
    title: "Request Custom Software — Operava",
    description:
      "You don't need to know exactly what software you need. Tell us what's costing you time.",
    url: `${site.url}/request-software`,
  },
};

const examples = [
  "“Every quote gets rebuilt by hand because our pricing tiers don't fit the software.”",
  "“We run six crews off a whiteboard because the scheduler can't handle recurring work.”",
  "“The office retypes every job into QuickBooks. Twice, if anything changes.”",
  "“Customers call to ask what they were billed for. Nobody can self-serve.”",
];

export default function RequestSoftwarePage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>Request custom software</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">
              You don&rsquo;t need to know exactly what software you need.
            </h1>
            <p className="t-lead mt-6 text-ink-2">
              Tell us what&rsquo;s wasting time, breaking, or forcing your team into
              workarounds. We&rsquo;ll come back with a straight answer about whether something
              is worth building — and what it would take.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-x py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <RequestForm />
            </div>

            <aside className="lg:col-span-5">
              <div className="flex flex-col gap-6 lg:sticky lg:top-28">
                <div className="rounded-lg border border-line bg-paper p-6 lg:p-7">
                  <h2 className="t-eyebrow text-ink-3">This is the level of detail we want</h2>
                  <ul className="mt-5 flex flex-col gap-4">
                    {examples.map((example) => (
                      <li
                        key={example}
                        className="border-l-2 border-line-2 pl-4 text-[0.9375rem] leading-relaxed text-ink-2"
                      >
                        {example}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-[0.875rem] leading-relaxed text-ink-3">
                    Concrete problems get concrete answers. &ldquo;We want to modernise&rdquo;
                    does not.
                  </p>
                </div>

                <div className="rounded-lg border border-navy-100 bg-navy-50 p-6 lg:p-7">
                  <h2 className="t-eyebrow text-navy-600">Ready to talk instead?</h2>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
                    A call covers more ground in thirty minutes than a form does in a week. If
                    you already know you want to explore this properly, book one.
                  </p>
                  <div className="mt-5">
                    <Cta href="/book" location="request-sidebar">
                      Book a Discovery Call
                    </Cta>
                  </div>
                </div>

                <p className="text-[0.875rem] leading-relaxed text-ink-3">
                  Custom builds start at {site.startingPrice}. Hosting, maintenance and support
                  from {site.supportPrice}.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
