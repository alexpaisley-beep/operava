import type { Metadata } from "next";

import { CtaBand } from "@/components/cta-band";
import { CapabilityGrid } from "@/components/sections/capability-grid";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/section";
import { capabilities } from "@/content/capabilities";
import { systemsBuilt } from "@/content/systems";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "What We Build",
  description:
    "Custom CRM, scheduling, estimating, customer portals, QuickBooks and Stripe integrations, automation and reporting, built around how your company operates.",
  alternates: { canonical: "/what-we-build" },
  openGraph: {
    title: "What We Build — Operava",
    description:
      "The systems a growing landscaping company runs on, built around your workflows rather than a vendor's.",
    url: `${site.url}/what-we-build`,
  },
};

const boundaries = [
  {
    title: "We don't rebuild your accounting",
    body: "QuickBooks is good at accounting. We integrate with it so your books stay correct without anyone retyping invoices.",
  },
  {
    title: "We don't replace payments that work",
    body: "If Stripe is already processing your cards, it stays. We connect it to the rest of the system properly.",
  },
  {
    title: "We don't build features to raise the invoice",
    body: "Every item in scope has to earn its place by removing real work. If it doesn't, we cut it before you pay for it.",
  },
  {
    title: "We don't ship and disappear",
    body: "Hosting, monitoring, fixes and support continue after launch. Software you cannot maintain is a liability.",
  },
];

export default function WhatWeBuildPage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>Capabilities</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">
              The systems a growing landscaping company actually runs on.
            </h1>
            <p className="t-lead mt-6 text-ink-2">
              This page is capability, not a menu. Most projects use two or three of these,
              wired into the tools you already keep. Which ones are worth building is exactly
              what discovery is for.
            </p>
          </div>

          <nav aria-label="Capabilities" className="mt-10">
            <ul className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <li key={capability.id}>
                  <a
                    href={`#${capability.id}`}
                    className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-surface px-3.5 py-2 text-[0.875rem] text-ink-2 transition-colors hover:border-navy-600 hover:text-navy-800"
                  >
                    <span className="t-mono-sm text-ink-3">{capability.index}</span>
                    {capability.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <Section tone="surface">
        <CapabilityGrid detailed />
        <p className="mt-8 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-3">
          No project includes all eight. Scope is written down and priced before development
          starts, and anything added later is quoted separately.
        </p>
      </Section>

      <Section tone="paper" id="systems">
        <SectionHeading
          eyebrow="Platform experience"
          title="Systems we have already shipped."
          lead="Production work, listed as capability rather than dressed up as client case studies. When we have client results worth publishing, they will appear here with the client's name on them."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2">
          {systemsBuilt.map((system) => (
            <article key={system.title} className="flex flex-col bg-paper p-6 lg:p-7">
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
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow="Boundaries"
          title="Just as important: what we won't build."
          lead="Scope discipline is the difference between a system that pays for itself and a project that quietly doubles."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {boundaries.map((item) => (
            <div key={item.title} className="bg-surface p-6 lg:p-7">
              <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand
        location="what-we-build-footer"
        title="Which of these would actually move the needle for you?"
        lead="That is the first question on the call. Bring the parts of your operation your software has never handled properly."
      />
    </>
  );
}
