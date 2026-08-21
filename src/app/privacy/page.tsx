import type { Metadata } from "next";

import { Eyebrow } from "@/components/ui/section";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Privacy Policy",
    description:
      "How Operava LLC handles the information you submit through the discovery call and custom software request forms.",
    path: "/privacy",
    ogTitle: "Privacy — Operava",
  }),
  // Explicit rather than inherited: a privacy policy is the page most likely
  // to be assumed noindex by whoever touches this next.
  robots: { index: true, follow: true },
};

const sections = [
  {
    heading: "What we collect",
    body: [
      "Only what you type into our forms: your name, company, email, phone, website, the size of your operation, what software you currently run, what is not working, and — if you choose to share them — budget and timeline.",
      "Our server also records the page you submitted from, the time, your browser's user agent and referring page. That is standard request metadata, used to tell a real enquiry apart from automated submissions.",
    ],
  },
  {
    heading: "Why we collect it",
    body: [
      "To prepare for and hold a conversation about building software for your company. That is the entire purpose.",
    ],
  },
  {
    heading: "What we don't do with it",
    body: [
      "We do not sell it. We do not rent it. We do not add you to a mailing list you did not ask for, and we do not pass your details to third-party lead brokers.",
    ],
  },
  {
    heading: "Where it goes",
    body: [
      "Submissions are delivered to Operava by email and stored in the systems we use to run the business. If we later route enquiries into a CRM, it will be one we control, under the same terms as this page.",
    ],
  },
  {
    heading: "Cookies and analytics",
    body: [
      "This site sets no advertising cookies and runs no third-party tracking pixels. If we add privacy-respecting analytics later to understand which pages lead to enquiries, this page will say so before it goes live.",
    ],
  },
  {
    heading: "Your information, your call",
    body: [
      "Ask us to delete what you sent and we will. One email is enough — no forms, no retention argument.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x pb-12 pt-12 lg:pb-14 lg:pt-16">
          <div className="max-w-3xl">
            <Eyebrow>Privacy</Eyebrow>
            <h1 className="t-h1 mt-6 text-ink">What we do with what you send us.</h1>
            <p className="t-lead mt-6 text-ink-2">
              Short version: we use it to have a useful conversation with you, and nothing else.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="container-x py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="flex flex-col divide-y divide-line border-y border-line">
              {sections.map((section) => (
                <section key={section.heading} className="py-8">
                  <h2 className="t-h3 text-ink">{section.heading}</h2>
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="mt-3 text-[1rem] leading-relaxed text-ink-2"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            <p className="mt-10 text-[0.9375rem] leading-relaxed text-ink-2">
              Questions about any of this go to{" "}
              <a
                href={`mailto:${site.contactEmail}`}
                className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
              >
                {site.contactEmail}
              </a>
              .
            </p>
            <p className="mt-3 text-[0.875rem] text-ink-3">
              {site.legalName}. This page describes current practice and will be updated if that
              changes.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
