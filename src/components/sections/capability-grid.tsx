import { capabilities } from "@/content/capabilities";

/**
 * Capability grid. Hairlines come from a 1px grid gap rather than per-cell
 * borders, so the whole block reads as one spec sheet.
 */
export function CapabilityGrid({ detailed = false }: { detailed?: boolean }) {
  return (
    <div
      className={`grid gap-px overflow-hidden rounded-lg border border-line bg-line ${
        detailed ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {capabilities.map((capability) => (
        <article
          key={capability.id}
          id={detailed ? capability.id : undefined}
          className={`group relative flex flex-col bg-paper transition-colors duration-200 hover:bg-surface ${
            detailed ? "p-7 lg:p-8 scroll-mt-28" : "p-6"
          }`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px scale-x-0 bg-leaf-500 transition-transform duration-300 ease-out group-hover:scale-x-100"
          />
          <p className="t-eyebrow text-ink-3">{capability.index}</p>
          <h3 className="t-h3 mt-4 text-ink">{capability.title}</h3>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
            {capability.summary}
          </p>

          {detailed ? (
            <ul className="mt-6 flex flex-col gap-2.5 border-t border-line pt-6">
              {capability.points.map((point) => (
                <li key={point} className="flex gap-3 text-[0.9375rem] leading-snug text-ink-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-leaf-500"
                  />
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}
