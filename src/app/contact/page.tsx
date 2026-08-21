import type { Metadata } from "next";

import { Cta } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us About a Custom Software Project",
  description:
    "Get in touch with Operava about custom software and automation for your service business. Book a discovery call, send a request, or email us.",
  path: "/contact",
  ogTitle: "Contact — Operava",
  ogDescription: "Book a discovery call, request custom software, or email Operava directly.",
});

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>Contact</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">Three ways to start a conversation.</h1>
            <p className="t-lead mt-6 text-ink-2">
              All of them reach the same people. Pick whichever suits how you like to work.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-x py-12 lg:py-16">
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-3">
            <div className="flex flex-col bg-surface p-7 lg:p-8">
              <p className="t-eyebrow text-ink-3">Best option</p>
              <h2 className="t-h3 mt-4 text-ink">Talk through a workflow</h2>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-2">
                Thirty to forty-five minutes on how your company runs and where the software
                stops fitting. A few questions first so the call starts at the real problem.
              </p>
              <div className="mt-6">
                <Cta href="/book" location="contact-page">
                  Book a Discovery Call
                </Cta>
              </div>
            </div>

            <div className="flex flex-col bg-surface p-7 lg:p-8">
              <p className="t-eyebrow text-ink-3">Not ready to talk yet</p>
              <h2 className="t-h3 mt-4 text-ink">Request custom software</h2>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-2">
                Write out what is wasting time, breaking, or forcing your team into workarounds.
                We reply by email with a straight answer about whether it is worth building.
              </p>
              <div className="mt-6">
                <Cta href="/request-software" variant="secondary" location="contact-page">
                  Request Custom Software
                </Cta>
              </div>
            </div>

            <div className="flex flex-col bg-surface p-7 lg:p-8">
              <p className="t-eyebrow text-ink-3">Direct</p>
              <h2 className="t-h3 mt-4 text-ink">Email us</h2>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-2">
                Screenshots, a report that shows the problem, or a question you want answered
                before filling anything in. Attachments are welcome here.
              </p>
              <div className="mt-6">
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-surface px-5 py-3 text-[0.9375rem] font-medium text-navy-800 transition-colors hover:border-navy-600 hover:bg-navy-50"
                >
                  {site.contactEmail}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h2 className="t-eyebrow text-ink-3">Company</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink">{site.legalName}</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">
                Custom software and automation for contractors and service businesses.
              </p>
            </div>

            <div>
              <h2 className="t-eyebrow text-ink-3">Commercials</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                Custom builds start at {site.startingPrice}. Hosting, maintenance and support
                from {site.supportPrice}.
              </p>
            </div>

            <div>
              <h2 className="t-eyebrow text-ink-3">Before you write</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                The most useful thing you can tell us is what your team still does manually
                because the software will not do it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
