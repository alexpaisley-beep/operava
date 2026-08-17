import { faqItems } from "@/content/faq";

/**
 * Native `<details>` — full keyboard support, works without JavaScript, and
 * the content stays in the DOM for search engines.
 */
export function Faq({ items = faqItems }: { items?: typeof faqItems }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="t-h3 text-ink transition-colors group-hover:text-navy-700">
              {item.question}
            </h3>
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-2 text-ink-2 transition-all duration-200 group-hover:border-navy-600 group-hover:text-navy-700 group-open:rotate-45"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M8 3.5v9M3.5 8h9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </summary>
          <p className="max-w-3xl pb-7 pr-10 text-[1rem] leading-relaxed text-ink-2">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

/** FAQPage structured data, generated from the same source as the visible copy. */
export function FaqSchema({ items = faqItems }: { items?: typeof faqItems }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
