import type { Metadata } from "next";

import { CtaBand } from "@/components/cta-band";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Operava LLC builds custom operating software for businesses whose workflows generic products handle badly — home-service domain experience, production SaaS development, and integration-heavy systems.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Operava",
    description:
      "Operava LLC builds software for businesses with workflows that generic software fails to handle cleanly.",
    url: `${site.url}/about`,
  },
};

const strengths = [
  {
    title: "Home-service domain experience",
    body: "Crews, recurring work, routes, estimating rules, dispatch, the office in the middle of all of it. We are not learning how service businesses run while you pay for it.",
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
              {site.legalName} builds software for businesses that generic products stopped
              fitting.
            </h1>
            <p className="t-lead mt-6 text-ink-2">
              Most companies do not need custom software. The ones that do have usually reached
              a specific point: the operation has become specific enough that off-the-shelf
              tools cost more in workarounds than they save in licence fees.
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
            <SectionHeading eyebrow="Operon" title="Where the domain knowledge comes from." />
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-lg border border-line bg-surface p-6 lg:p-8">
              <p className="text-[1.0625rem] leading-relaxed text-ink-2">
                Operava is the company behind <strong className="text-ink">Operon</strong>, a
                software platform built for home-service operations. Building and running it is
                where the scheduling, estimating, payments and crew workflow experience comes
                from.
              </p>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-2">
                It is not what we are selling you. Custom software is. Operon is simply the
                reason we can walk into a discovery call already understanding what a recurring
                maintenance schedule does when a crew goes down, or why your estimator keeps
                rebuilding quotes in a spreadsheet.
              </p>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-3">
                Practically: it means less of your budget goes to us learning your industry.
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
                { term: "Focus", value: "Custom operating software" },
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
        lead="One call. We ask how your company runs, you find out whether custom software is the right answer, and nobody has spent anything."
      />
    </>
  );
}
