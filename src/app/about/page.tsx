import type { Metadata } from "next";

import { CtaBand } from "@/components/cta-band";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/section";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  // Absolute: the template would otherwise render "About Operava — Operava".
  title: { absolute: `About ${site.name} — Custom Software for Contractors` },
  description:
    "Operava LLC builds custom software for contractors and service businesses, with real service-operation experience behind the systems we deliver.",
  path: "/about",
  ogTitle: "About — Operava",
  ogDescription:
    "Operava LLC builds software for service businesses with workflows that generic products fail to handle cleanly.",
});

const strengths = [
  {
    title: "Service-operation domain experience",
    body: "Crews and techs in the field, recurring and project work, estimating rules, dispatch, the office in the middle of all of it. We are not learning how this kind of business runs while you pay for it.",
  },
  {
    title: "Production SaaS development",
    body: "Systems that run every day, with real users, real money moving through them, and real consequences when something breaks at 6am on a Monday.",
  },
  {
    title: "API and integration-heavy systems",
    body: "Payments, communications, accounting, third-party platforms. Webhooks, retries, idempotency and reconciliation — the parts where integrations quietly fail.",
  },
  {
    title: "Business-first product thinking",
    body: "The question is never what is technically interesting. It is which part of your operation is costing you money, and whether software is the right answer.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>About</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">
              {site.legalName} exists because good software still leaves people doing the work
              by hand.
            </h1>
            <p className="t-lead mt-6 text-ink-2">
              Generic products handle about 80% of an established operation. Employees handle
              the other 20% — retyping, chasing, reconciling, remembering. That gap is what we
              build for, and most companies do not need us until it gets expensive.
            </p>
          </div>
        </div>
      </section>

      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="What we're good at" title="Four things, done properly." />
          </div>

          <div className="lg:col-span-7">
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {strengths.map((strength) => (
                <li key={strength.title} className="py-6">
                  <h3 className="t-h3 text-ink">{strength.title}</h3>
                  <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
                    {strength.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Background"
              title="Where this comes from, and what it does not include."
            />
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-lg border border-line bg-surface p-6 lg:p-8">
              {/* The strongest honest credential for this ICP, and it was missing
                  from the site entirely. An owner cares far more that the person
                  building their software has run an operation than that he has
                  shipped a SaaS product — it is the difference between "another
                  developer" and "someone who has had this problem".

                  The second paragraph is load-bearing in the other direction:
                  claiming tenure in trades we have not worked in would be the
                  fastest way to lose a contractor on the first call. Saying so
                  plainly costs nothing and buys the rest of the page. */}
              <p className="text-[1.0625rem] leading-relaxed text-ink-2">
                Alex ran a home-service business before building software for one. The
                scheduling, the estimating, the invoice that never went out, the crew that
                showed up to the wrong address — that is where the interest in this problem
                started, and none of it turned out to be specific to that industry.
              </p>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-2">
                We have not run an electrical contracting business or a concrete company, and we
                are not going to pretend the trades are interchangeable. What is consistent is
                the failure: work happens away from the office, several systems each hold part
                of the truth, and people close the gap manually. That pattern is the same in a
                mechanical contractor, a roofing company and a landscaping operation.
              </p>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-2">
                On the engineering side, we have built and shipped operating software before —
                scheduling, estimating, invoicing, payments, payroll, customer portals and AI
                phone answering, all of it running in production. None of it is what we are
                selling you. Custom software is. It is simply why we can come into a first call
                already understanding what a recurring schedule does when a crew goes down, or
                why your estimator keeps rebuilding quotes in a spreadsheet.
              </p>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-3">
                Practically: less of your budget goes to us learning how operations like yours
                work.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="How we operate" title="Small, direct, accountable." />
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-col gap-5 text-[1.0625rem] leading-relaxed text-ink-2">
              <p>
                You talk to the people building your system. There is no account manager
                relaying requirements to a team you never meet, and no offshore handoff after
                the contract is signed.
              </p>
              <p>
                We take on a small number of projects at a time, which is why we are direct
                about fit. If your operation does not warrant custom software yet, saying so on
                the first call costs us a deal and saves you $6,000 and three months.
              </p>
              <p>
                When a project does make sense, the commitment is straightforward: a written
                scope, a fixed price, milestones you can see, and support after launch from the
                same people who built it.
              </p>
            </div>

            <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              {[
                { term: "Company", value: site.legalName },
                { term: "Focus", value: "Custom software & automation" },
                { term: "Projects from", value: site.startingPrice },
              ].map((row) => (
                <div key={row.term} className="bg-surface p-5">
                  <dt className="t-eyebrow text-ink-3">{row.term}</dt>
                  <dd className="mt-2 text-[0.9375rem] font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <CtaBand
        location="about-footer"
        title="The fastest way to find out if this is worth it."
        lead="One call. You describe a workflow that is costing you time, we tell you whether software is the right answer, and nobody has spent anything."
      />
    </>
  );
}
