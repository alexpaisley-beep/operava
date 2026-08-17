import type { Metadata } from "next";

import { CtaBand } from "@/components/cta-band";
import { Faq, FaqSchema } from "@/components/faq";
import { Cta } from "@/components/ui/button";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/section";
import { faqItems } from "@/content/faq";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Custom software projects from Operava start at $6,000, priced on scope rather than sold as packages. 50% to begin, 50% at launch, with hosting, maintenance and support from $200/month.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — Operava",
    description:
      "Custom projects start at $6,000. Fixed scope, fixed price, agreed before development starts.",
    url: `${site.url}/pricing`,
  },
};

const factors = [
  {
    title: "Workflow complexity",
    body: "How many distinct processes the system has to handle, and how much they differ from the norm.",
  },
  {
    title: "Integrations",
    body: "Each external system adds real work — auth, data mapping, webhooks, failure handling.",
  },
  {
    title: "Data migration",
    body: "Moving history out of existing tools cleanly, including the records that were never entered consistently.",
  },
  {
    title: "User roles",
    body: "Office, sales, crew leads, crews, customers. Each role is a different view and a different set of permissions.",
  },
  {
    title: "Automation",
    body: "Every automated sequence has conditions, exceptions and a stop rule. That logic is the work.",
  },
  {
    title: "Custom business logic",
    body: "Your pricing rules, scheduling constraints and approval chains — the reason you are here.",
  },
  {
    title: "Mobile requirements",
    body: "Whether the field workflow needs a responsive web interface or genuinely warrants a native app.",
  },
  {
    title: "Reporting",
    body: "Straightforward operational reporting is quick. Cross-system analytics with reconciled figures is not.",
  },
  {
    title: "External provider work",
    body: "Account setup, merchant approvals and third-party review cycles we do not control the timeline on.",
  },
];

const included = [
  "Hosting and infrastructure",
  "Monitoring and backups",
  "Security patching and dependency updates",
  "Bug fixes on delivered functionality",
  "Support for your team when something looks wrong",
  "Small adjustments as the business changes",
];

const separate = [
  "New features and additional workflows",
  "Additional integrations beyond the agreed scope",
  "Major redesigns or new modules",
  "Third-party service fees you pay directly",
];

/** Kept in one place so the structured data always matches what is on screen. */
const pricingFaq = faqItems.filter((item) =>
  [
    "How much does custom software cost?",
    "Do you replace our current software?",
    "How long does a project take?",
    "Who owns the software?",
    "What happens after launch?",
  ].includes(item.question),
);

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Eyebrow>Pricing</Eyebrow>
              <h1 className="t-h1 mt-6 text-ink">Custom projects start at $6,000.</h1>
              <p className="t-lead mt-6 text-ink-2">
                There are no tiers or packages, because there is no standard version of your
                company. What you get instead is a fixed price against a written scope, agreed
                before anyone writes code.
              </p>
              <div className="mt-9 flex flex-col gap-3 xs:flex-row">
                <Cta href="/book" size="lg" location="pricing-hero">
                  Book a Discovery Call
                </Cta>
                <Cta
                  href="/request-software"
                  variant="secondary"
                  size="lg"
                  location="pricing-hero"
                >
                  Request Custom Software
                </Cta>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-lg border border-line bg-surface">
                <div className="border-b border-line p-6">
                  <p className="t-eyebrow text-ink-3">Commercial structure</p>
                </div>
                <dl className="divide-y divide-line">
                  {[
                    {
                      term: "To begin",
                      value: "50%",
                      note: "On signature, against the agreed scope",
                    },
                    { term: "At launch", value: "50%", note: "When the system goes live" },
                    {
                      term: "Ongoing",
                      value: `From ${site.supportPrice}`,
                      note: "Hosting, maintenance and support",
                    },
                  ].map((row) => (
                    <div
                      key={row.term}
                      className="flex items-baseline justify-between gap-4 p-6"
                    >
                      <div>
                        <dt className="text-[0.9375rem] font-medium text-ink">{row.term}</dt>
                        <p className="mt-1 text-[0.8125rem] leading-snug text-ink-3">
                          {row.note}
                        </p>
                      </div>
                      <dd className="whitespace-nowrap text-[1.25rem] font-semibold tracking-[-0.02em] text-navy-700">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="border-t border-line bg-paper p-6 text-[0.875rem] leading-relaxed text-ink-2">
                  This is not a subscription. It is hosting, maintenance and support for a
                  system you own the deliverables of — and you can see exactly what it covers
                  below.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section tone="surface">
        <SectionHeading
          eyebrow="What moves the number"
          title="Price follows scope. Here is what scope is made of."
          lead="A single-department system with one integration sits near the bottom of the range. A build spanning sales, operations and accounting with data migration sits well above it."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {factors.map((factor) => (
            <div key={factor.title} className="bg-surface p-6">
              <h3 className="text-[1rem] font-semibold tracking-[-0.015em] text-ink">
                {factor.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{factor.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-3xl border-l-2 border-leaf-500 bg-leaf-50/60 py-4 pl-6 pr-5">
          <p className="text-[1.0625rem] leading-relaxed text-ink">
            You&rsquo;ll know what we&rsquo;re building, what it costs, and what is outside
            scope before development starts.
          </p>
        </div>
      </Section>

      <Section tone="paper">
        <SectionHeading
          eyebrow="After launch"
          title="Hosting, maintenance and support."
          lead="From $200/month, depending on the size of the system and what it depends on. Deliberately not called a subscription — you are not renting access to your own software."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="t-h3 text-ink">What the monthly covers</h3>
            <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 py-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.4rem] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-leaf-600"
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="h-2.5 w-2.5">
                      <path
                        d="M3.5 8.5 6.5 11.5 12.5 5"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-[0.9375rem] leading-snug text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="t-h3 text-ink">Quoted separately</h3>
            <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
              {separate.map((item) => (
                <li key={item} className="flex items-start gap-3 py-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.7rem] h-px w-3 shrink-0 bg-line-2"
                  />
                  <span className="text-[0.9375rem] leading-snug text-ink-2">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink-2">
              Nothing gets added to your bill without a quote you approved first. That is the
              whole point of writing scope down.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface" id="faq">
        <SectionHeading
          eyebrow="Questions"
          title="Straight answers about cost and ownership."
        />
        <div className="mt-10">
          <Faq items={pricingFaq} />
        </div>
        <FaqSchema items={pricingFaq} />
      </Section>

      <CtaBand
        location="pricing-footer"
        title="The number depends on your operation. Let's find out what it is."
        lead="Discovery is where scope comes from, and scope is where the price comes from. Nothing is quoted before we understand the work."
      />
    </>
  );
}
