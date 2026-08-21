import type { Metadata } from "next";

import { Cta } from "@/components/ui/button";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/section";
import { builtSystems, clientEntryPromise, clientPortfolio } from "@/content/work";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contractor & Construction Software We've Built",
  description:
    "The software Operava has actually built and still runs: what each system does, what it handles, and what it proves. No invented case studies.",
  path: "/work",
  ogTitle: "Work — Operava",
  ogDescription:
    "What we have built, what it does, and what it proves. Including the parts that are not finished.",
});

/**
 * Status pill. The tone carries meaning, so it is derived from the data rather
 * than passed in per-entry: a "live" badge on something unreleased is exactly
 * the failure this page exists to avoid.
 */
const statusTones = {
  live: "border-leaf-500/40 bg-leaf-50 text-leaf-700",
  internal: "border-navy-600/25 bg-navy-50 text-navy-800",
} as const;

function StatusPill({ label, tone }: { label: string; tone: keyof typeof statusTones }) {
  return (
    <span
      className={`t-mono-sm inline-flex shrink-0 items-center rounded border px-2 py-1 ${statusTones[tone]}`}
    >
      {label}
    </span>
  );
}

/** Small labelled block used for the detail rows inside a system. */
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="t-eyebrow text-ink-3">{label}</h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="t-mono-sm rounded border border-line-2 px-2 py-1 text-ink-3">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function WorkPage() {
  return (
    <>
      {/* ----------------------------------------------------------------- Hero */}
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>Work</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">What we&rsquo;ve actually built.</h1>
            <p className="t-lead mt-6 text-ink-2">
              Two things live on this page, and they are kept apart on purpose: software{" "}
              <strong className="font-semibold text-ink">built by Operava</strong>, and work{" "}
              <strong className="font-semibold text-ink">built for a client</strong>. Mixing
              those two is how a portfolio starts lying.
            </p>
            <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-3">
              There are no logos, quotes, user counts or revenue figures here. We have not
              earned the right to publish any of them yet, and a number nobody can check is
              worth less than nothing.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Built by Operava */}
      <Section tone="surface" id="built-by-operava">
        <SectionHeading
          eyebrow="Built by Operava"
          title="Our own systems."
          lead="Products and internal platforms we designed, built and still run. These are not client projects — they are the reason we do not need to learn this kind of operation, or this kind of system, on your budget."
        />

        <div className="mt-12 flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
          {builtSystems.map((system) => (
            <article key={system.id} id={system.id} className="scroll-mt-24 bg-surface">
              <div className="p-6 lg:p-9">
                {/* Header: name, what kind of thing it is, and its real status. */}
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div>
                    <h3 className="t-h2 text-ink">{system.name}</h3>
                    <p className="t-mono-sm mt-2 text-ink-3">{system.kind}</p>
                  </div>
                  <StatusPill label={system.status.label} tone={system.status.tone} />
                </div>

                <p className="t-lead mt-6 max-w-3xl text-ink-2">{system.summary}</p>

                <div className="mt-9 grid gap-9 lg:grid-cols-12 lg:gap-12">
                  <div className="flex flex-col gap-8 lg:col-span-7">
                    <Detail label="The problem">
                      <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
                        {system.problem}
                      </p>
                    </Detail>

                    <Detail label="What was built">
                      <ul className="flex flex-col gap-2.5">
                        {system.built.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-2"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-[0.55em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Detail>

                    {system.workflows ? (
                      <Detail label="Worth pointing at">
                        <div className="flex flex-col gap-5">
                          {system.workflows.map((workflow) => (
                            <div key={workflow.title}>
                              <h5 className="text-[1rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
                                {workflow.title}
                              </h5>
                              <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
                                {workflow.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Detail>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-8 lg:col-span-5">
                    {system.integrations ? (
                      <Detail label="Connected to">
                        <TagList items={system.integrations} />
                      </Detail>
                    ) : null}

                    {/* "Built to handle", not "Built with". An owner deciding on
                        a $6,000 build is asking whether this can carry their
                        operation, not which framework it is written in. */}
                    {system.handles ? (
                      <Detail label="Built to handle">
                        <ul className="flex flex-col gap-2.5">
                          {system.handles.map((item) => (
                            <li
                              key={item}
                              className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-2"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-[0.55em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500"
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Detail>
                    ) : null}

                    <Detail label="What it proves">
                      <p className="border-l-2 border-leaf-500 pl-4 text-[0.9375rem] leading-relaxed text-ink-2">
                        {system.proves}
                      </p>
                    </Detail>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------- Built for a client */}
      <Section tone="paper" id="client-work">
        <SectionHeading
          eyebrow="Built for a client"
          title="Client projects."
          lead="Custom builds delivered for named companies, published with their permission."
        />

        {clientPortfolio.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-line-2 bg-surface p-7 lg:p-10">
            <p className="t-h3 max-w-2xl text-ink">
              Nothing here yet. Operava is new, and no client project has been delivered and
              cleared for publication.
            </p>
            <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
              We would rather show you an empty section than a borrowed logo or a case study
              about a project that did not happen. If you are weighing us up, the systems above
              are the real evidence — and on a call you can ask about any of them in as much
              detail as you like.
            </p>

            <div className="mt-9">
              <h4 className="t-eyebrow text-ink-3">When there is one, it will say</h4>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {clientEntryPromise.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-2"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.55em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Section>

      {/* ------------------------------------------------------------------ CTA */}
      <section className="on-dark relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 75%)",
          }}
        />
        <div className="container-x section-y relative">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {/* Was "Join our expanding portfolio", which quietly asserts a client
                base the section above says out loud we do not have yet. */}
            <h2 className="t-h2 text-white">
              Your team shouldn&rsquo;t have to work around the software.
            </h2>
            <p className="t-lead mt-5 max-w-2xl text-navy-100">
              Bring the workflow costing you the most time. We will tell you whether software
              fixes it, and roughly what that would take.
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
              <Cta href="/book" size="lg" tone="dark" location="work-footer">
                Walk us through a workflow
              </Cta>
              <Cta
                href="/request-software"
                variant="secondary"
                size="lg"
                tone="dark"
                location="work-footer"
              >
                Tell us what isn&rsquo;t working
              </Cta>
            </div>

            <p className="t-mono-sm mt-7 text-navy-200">
              Custom builds start at {site.startingPrice}. No obligation on the call.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
