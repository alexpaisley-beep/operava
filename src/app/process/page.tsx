import type { Metadata } from "next";

import { CtaBand } from "@/components/cta-band";
import { ProcessSteps } from "@/components/sections/process-steps";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Process",
  description:
    "How Operava scopes and builds custom software: discovery of how you actually operate, a written scope at a fixed price, milestone builds, then launch and support.",
  alternates: { canonical: "/process" },
  openGraph: {
    title: "Process — Operava",
    description:
      "Discovery, scope, build, launch. You know what it costs and what is out of scope before development starts.",
    url: `${site.url}/process`,
  },
};

const principles = [
  {
    title: "Integrate before you replace",
    body: "Working software is an asset. The question is never 'what can we rebuild', it is 'what is genuinely costing you money'.",
  },
  {
    title: "Scope in writing, price before code",
    body: "You approve what gets built, what stays where it is, and what is explicitly excluded — before anyone starts.",
  },
  {
    title: "Milestones, not a black box",
    body: "You see working software along the way, while changing your mind is still cheap.",
  },
  {
    title: "Honest timelines",
    body: "Several weeks for focused systems. Longer for multi-department builds. We would rather lose the deal than win it on a date we cannot hit.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>How we work</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">
              Four steps. You know the price before the third one.
            </h1>
            <p className="t-lead mt-6 text-ink-2">
              Custom software goes wrong in predictable ways: unclear scope, a vendor who does
              not understand the business, and a price that moves after you have committed. The
              process exists to remove all three.
            </p>
          </div>
        </div>
      </section>

      <Section tone="surface">
        <ProcessSteps detailed />
      </Section>

      <Section tone="paper">
        <SectionHeading eyebrow="Principles" title="What we hold to, on every project." />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {principles.map((principle) => (
            <div key={principle.title} className="bg-paper p-6 lg:p-8">
              <h3 className="t-h3 text-ink">{principle.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                {principle.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-line bg-surface p-6 lg:p-8">
          <h3 className="t-eyebrow text-ink-3">Commercially</h3>
          <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-ink-2">
            Projects start at {site.startingPrice}. Payment is 50% to begin and 50% at launch.
            After go-live, hosting, maintenance and support run from {site.supportPrice}.
            Additional features and expanded scope are quoted separately, so the number you
            agreed to is the number you pay.
          </p>
        </div>
      </Section>

      <CtaBand
        location="process-footer"
        title="Discovery is the whole first step. It costs you a call."
        lead="Bring how your company actually runs — including the parts nobody has written down. We will tell you what is worth building and what is not."
      />
    </>
  );
}
