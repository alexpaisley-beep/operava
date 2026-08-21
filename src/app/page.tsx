import type { Metadata } from "next";
import Link from "next/link";

import { CtaBand } from "@/components/cta-band";
import { Faq, FaqSchema } from "@/components/faq";
import { HeroSpine } from "@/components/hero-spine";
import { CapabilityGrid } from "@/components/sections/capability-grid";
import { ProcessSteps } from "@/components/sections/process-steps";
import { Cta } from "@/components/ui/button";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/section";
import { goodFit, notFit } from "@/content/fit";
import { industries, industryNote } from "@/content/industries";
import { painPoints } from "@/content/pain";
import { systemsBuilt } from "@/content/systems";
import { site } from "@/lib/site";

// Title and description are inherited from the root layout — this IS the page
// that layout's defaults describe, so restating them here would be two copies
// of one string. The canonical is declared because the layout deliberately
// sets none.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// "Fits alongside" rather than "Connects", and named platforms rather than a
// category. The most common objection from an established operator is "we
// already run on ServiceTitan / Procore / QuickBooks and we are not ripping it
// out"; answering it in the first screenful is worth more than any adjective.
// The verb is deliberately careful — we build against these APIs, we do not
// claim a shelf of finished connectors. See content/capabilities.ts.
const signals = [
  { label: "Built for", value: "Contractors and service operations" },
  { label: "Fits alongside", value: "QuickBooks, ServiceTitan, Procore, Jobber" },
  { label: "Scope", value: "Fixed price, defined upfront" },
  { label: "After launch", value: "We host, monitor and support it" },
];

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div
          aria-hidden="true"
          className="grid-lines pointer-events-none absolute inset-0"
          style={{
            maskImage: "radial-gradient(ellipse 75% 65% at 15% 0%, #000 5%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 65% at 15% 0%, #000 5%, transparent 70%)",
          }}
        />

        <div className="container-x relative pb-14 pt-12 lg:pb-20 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <div className="rise-in">
                <Eyebrow>
                  {site.legalName} &middot; Custom software &amp; automation for service
                  businesses
                </Eyebrow>
              </div>

              <h1
                className="t-display rise-in mt-6 text-ink"
                style={{ animationDelay: "60ms" }}
              >
                Software built around how your business{" "}
                <span className="underline decoration-leaf-400 decoration-[0.055em] underline-offset-[0.11em] [text-decoration-skip-ink:none]">
                  actually
                </span>{" "}
                works.
              </h1>

              <p
                className="t-lead rise-in mt-7 max-w-2xl text-ink-2"
                style={{ animationDelay: "120ms" }}
              >
                Estimating, scheduling, the field, accounting and your customers all need the
                same information — and somebody on your staff is still moving it between systems
                by hand. We build the software and automation that closes those gaps, without
                replacing everything you already run.
              </p>

              <div
                className="rise-in mt-9 flex flex-col gap-3 sm:flex-row"
                style={{ animationDelay: "180ms" }}
              >
                <Cta href="/book" size="lg" location="hero">
                  Walk us through a workflow
                </Cta>
                <Cta href="/request-software" variant="secondary" size="lg" location="hero">
                  Tell us what isn&rsquo;t working
                </Cta>
              </div>

              <p
                className="t-mono-sm rise-in mt-8 text-ink-3"
                style={{ animationDelay: "240ms" }}
              >
                Custom builds starting at {site.startingPrice}. Hosting, maintenance and support
                from {site.supportPrice}.
              </p>
            </div>

            <div className="rise-in lg:col-span-5" style={{ animationDelay: "220ms" }}>
              <HeroSpine />
            </div>
          </div>
        </div>

        {/* Signal strip */}
        <div className="relative border-t border-line bg-surface/60">
          <div className="container-x">
            <dl className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
              {signals.map((signal) => (
                <div key={signal.label} className="bg-paper px-1 py-5 sm:px-2">
                  <dt className="t-eyebrow text-ink-3">{signal.label}</dt>
                  <dd className="mt-2 text-[0.9375rem] font-medium leading-snug text-ink">
                    {signal.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Pain */}
      <Section tone="surface" id="problem">
        <SectionHeading
          eyebrow="The problem"
          title="You already have software. The work still happens around it."
          lead="Nobody outgrows their systems all at once. It happens one workaround at a time, until the important parts of the job run on spreadsheets, text messages and people who just know. Most operations recognise three or four of these, not all eight."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2">
          {painPoints.map((pain) => (
            <div key={pain.title} className="bg-surface p-6 lg:p-7">
              <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
                {pain.title}
              </h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{pain.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-[1.0625rem] leading-relaxed text-ink-2">
          If your crews, office staff, project managers and accounting all need the same
          information, and somebody still has to move it between systems by hand, that is the
          kind of problem we fix. Generic software handles about 80% of an operation. The other
          20% is where your people go.
        </p>
      </Section>

      {/* ------------------------------------------------------- Positioning */}
      <section className="on-dark relative overflow-hidden bg-navy-950 text-white">
        <div className="container-x section-y">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Eyebrow className="text-navy-200">The approach</Eyebrow>
              <h2 className="t-h1 mt-6 text-white">
                Keep the software that works. Fix the workflows that don&rsquo;t.
              </h2>
            </div>

            <div className="lg:col-span-6 lg:pt-4">
              <p className="t-lead text-navy-100">
                You do not need to replace QuickBooks, your field software or your estimating
                package. You need the layer between them — the handoffs, the missing tools, the
                steps a person is doing manually because no product covers them.
              </p>

              <div className="mt-9 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
                {[
                  {
                    title: "Not a template",
                    body: "Real development against your actual workflows.",
                  },
                  {
                    title: "Not a migration",
                    body: "The systems that work stay. We build what is missing.",
                  },
                  {
                    title: "Not open-ended",
                    body: "Fixed scope and fixed price before we start.",
                  },
                ].map((pillar) => (
                  <div key={pillar.title} className="bg-navy-950 p-5">
                    <h3 className="text-[0.9375rem] font-semibold text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-[0.875rem] leading-relaxed text-navy-200">
                      {pillar.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- What we build */}
      <Section tone="paper" id="what-we-build">
        <SectionHeading
          eyebrow="What we build"
          title="The parts of the operation your software leaves to your staff."
          lead="This is capability, not a package. Most projects use two or three of these. The first call is where we work out which ones are worth your money."
        />

        <div className="mt-12">
          <CapabilityGrid />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Cta href="/what-we-build" variant="secondary" location="home-capabilities">
            See what each system includes
          </Cta>
          <p className="text-[0.9375rem] text-ink-3">
            No project includes all eight. Scope is decided before development starts.
          </p>
        </div>
      </Section>

      {/* ---------------------------------------------------------- Industries */}
      <Section tone="muted" id="industries">
        <SectionHeading
          eyebrow="Who we build for"
          title="Built for businesses where the work happens in the real world."
          lead="The trade changes. The shape of the problem does not: people working away from the office, an office coordinating them, money that has to be costed and billed accurately, and several systems that each hold part of the truth."
        />

        {/* Five markets plus the "not on the list" cell — six items, so the
            hairline grid stays square at every breakpoint instead of leaving a
            bare cell showing the divider colour through the gap. */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <div key={industry.title} className="bg-paper p-6 lg:p-7">
              <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
                {industry.title}
              </h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
                {industry.body}
              </p>
            </div>
          ))}

          <div className="bg-surface p-6 lg:p-7">
            <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.015em] text-ink-2">
              {industryNote.title}
            </h3>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-3">
              {industryNote.body}
            </p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------ Who it's for */}
      <Section tone="surface" id="fit">
        <SectionHeading
          eyebrow="Whether it's worth it"
          title="Worth doing at a specific stage. Not before."
          lead="Custom software earns its money when your operation has become specific enough that generic products cost you more in workarounds than they save in licence fees."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="t-h3 flex items-center gap-3 text-ink">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf-50 text-leaf-600"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Usually a strong fit
            </h3>
            <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
              {goodFit.map((item) => (
                <li key={item} className="py-3.5 text-[0.9375rem] leading-snug text-ink">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="t-h3 flex items-center gap-3 text-ink">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-ink-3"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M4 8h8"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Usually not worth it yet
            </h3>
            <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
              {notFit.map((entry) => (
                <li key={entry.item} className="py-3.5">
                  <p className="text-[0.9375rem] font-medium leading-snug text-ink">
                    {entry.item}
                  </p>
                  <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-3">
                    {entry.because}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink-2">
              We would rather tell you on the call than six weeks into a project.
            </p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- Process */}
      <Section tone="muted" id="process">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, and you know the price before the third one."
          lead="Discovery is not a sales call with a different name. It is the part where we learn how your company runs, because that determines whether there is anything worth building."
        />

        <div className="mt-12">
          <ProcessSteps />
        </div>

        <div className="mt-8">
          <Cta href="/process" variant="secondary" location="home-process">
            See how we scope a project
          </Cta>
        </div>
      </Section>

      {/* -------------------------------------------------------------- Systems */}
      <Section tone="surface" id="systems">
        <SectionHeading
          eyebrow="Platform experience"
          title="What we’ve already built."
          lead="Systems and platform work we have shipped and run in production. These are capabilities, not client case studies — we are not going to show you logos and quotes we have not earned."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2">
          {systemsBuilt.map((system) => (
            <article key={system.title} className="flex flex-col bg-surface p-6 lg:p-7">
              <h3 className="t-h3 text-ink">{system.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{system.body}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {system.tags.map((tag) => (
                  <li
                    key={tag}
                    className="t-mono-sm rounded border border-line-2 px-2 py-1 text-ink-3"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Credibility, in the order this ICP actually weighs it: ran the
            operation first, built the software second. Deliberately claims
            experience with THIS SHAPE OF BUSINESS, never tenure in a trade we
            have not worked in. */}
        <p className="mt-8 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-3">
          Alex ran a home-service business before building software for one. We have since built
          and shipped scheduling, estimating, payments, payroll, customer portals and AI phone
          answering — production systems, running every day. None of that is what we are selling
          you. It is why we do not need to be taught how an operation with people in the field
          and an office behind them actually breaks.
        </p>

        {/* Quiet on purpose: the people who want evidence go looking for it,
            and the ones who don't should not have the page shouted at them. */}
        <p className="mt-6">
          <Link
            href="/work"
            className="group inline-flex items-center gap-2 text-[0.9375rem] text-navy-700 underline decoration-line-2 underline-offset-4 transition-colors hover:text-navy-800 hover:decoration-navy-600"
          >
            See what we&rsquo;ve built
            <span
              aria-hidden="true"
              className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Link>
        </p>
      </Section>

      {/* ------------------------------------------------------------- Pricing */}
      <Section tone="paper" id="pricing">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Pricing"
              title="Custom projects start at $6,000."
              lead="There are no packages, because there is no such thing as a standard version of your company. What there is: a fixed price for a scope you approved before anyone wrote code."
            />

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Cta href="/book" location="home-pricing">
                Walk us through a workflow
              </Cta>
              <Cta href="/pricing" variant="secondary" location="home-pricing">
                See how pricing works
              </Cta>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-lg border border-line bg-surface">
              <div className="border-b border-line p-6 lg:p-8">
                <h3 className="t-eyebrow text-ink-3">What moves the number</h3>
                <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {[
                    "Workflow complexity",
                    "Integrations",
                    "Data migration",
                    "Number of user roles",
                    "Automation",
                    "Custom business logic",
                    "Mobile requirements",
                    "Reporting depth",
                    "External provider work",
                  ].map((factor) => (
                    <li key={factor} className="flex gap-3 text-[0.9375rem] text-ink">
                      <span
                        aria-hidden="true"
                        className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-leaf-500"
                      />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="grid gap-px bg-line sm:grid-cols-3">
                {[
                  { term: "To begin", value: "50%" },
                  { term: "At launch", value: "50%" },
                  { term: "Ongoing support", value: `From ${site.supportPrice}` },
                ].map((row) => (
                  <div key={row.term} className="bg-surface p-6">
                    <dt className="t-eyebrow text-ink-3">{row.term}</dt>
                    <dd className="mt-2 text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="border-t border-line p-6 text-[0.9375rem] leading-relaxed text-ink-2 lg:px-8">
                You&rsquo;ll know what we&rsquo;re building, what it costs, and what is outside
                scope before development starts. Additional features are quoted separately — the
                number does not quietly grow.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- Why Operava */}
      <Section tone="surface" id="why">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Why Operava"
              title="We build software that has to survive a Monday morning."
            />
          </div>

          <div className="lg:col-span-7">
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {[
                {
                  title: "We understand how service operations run",
                  body: "Crews and techs in the field, recurring and project work, estimating rules, the office in the middle of all of it. We are not learning how this kind of business works on your budget.",
                },
                {
                  title: "We have built complex operational software before",
                  body: "Scheduling engines, portals, payment infrastructure, AI phone intake. Shipped and running, not slideware.",
                },
                {
                  title: "We work with real APIs, payments and business logic",
                  body: "Webhooks, retries, reconciliation, edge cases. The unglamorous parts where most integrations quietly fail.",
                },
                {
                  title: "We care whether it works in production",
                  body: "Software that demos well and breaks in week three is not a delivery. It is a liability with your name on it.",
                },
                {
                  title: "We do not sell features to inflate a project",
                  body: "If something should stay in QuickBooks, we will say so. Scope discipline is what keeps the price honest.",
                },
              ].map((reason) => (
                <li key={reason.title} className="py-5">
                  <h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink">
                    {reason.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
                    {reason.body}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-7 text-[0.9375rem] leading-relaxed text-ink-3">
              More on the company and how we work is on the{" "}
              <Link
                href="/about"
                className="text-navy-700 underline decoration-navy-200 underline-offset-4 transition-colors hover:decoration-navy-600"
              >
                about page
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- FAQ */}
      <Section tone="paper" id="faq">
        <SectionHeading eyebrow="Questions" title="The things people ask before booking." />
        <div className="mt-10">
          <Faq />
        </div>
        <FaqSchema />
      </Section>

      <CtaBand location="home-footer" />
    </>
  );
}
