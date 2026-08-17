import { processSteps } from "@/content/process";

export function ProcessSteps({ detailed = false }: { detailed?: boolean }) {
  if (!detailed) {
    return (
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step) => (
          <article key={step.index} className="flex flex-col bg-paper p-6 lg:p-7">
            <p className="t-eyebrow text-ink-3">Step {step.index}</p>
            <h3 className="t-h3 mt-4 text-ink">{step.title}</h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{step.summary}</p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {processSteps.map((step, index) => (
        <article
          key={step.index}
          id={`step-${step.index}`}
          className={`grid scroll-mt-28 gap-6 border-t border-line py-10 lg:grid-cols-12 lg:gap-12 lg:py-14 ${
            index === processSteps.length - 1 ? "border-b" : ""
          }`}
        >
          <header className="lg:col-span-4">
            <p className="t-eyebrow text-ink-3">Step {step.index}</p>
            <h3 className="t-h2 mt-4 text-ink">{step.title}</h3>
            <p className="t-lead mt-3 text-ink-2">{step.summary}</p>
          </header>

          <div className="lg:col-span-8">
            <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-ink-2">
              {step.detail}
            </p>

            <ul className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {step.points.map((point) => (
                <li key={point} className="flex gap-3 text-[0.9375rem] leading-snug text-ink">
                  <span
                    aria-hidden="true"
                    className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-leaf-500"
                  />
                  {point}
                </li>
              ))}
            </ul>

            {step.note ? (
              <p className="mt-7 border-l-2 border-leaf-500 bg-leaf-50/60 py-3 pl-5 pr-4 text-[0.9375rem] leading-relaxed text-ink-2">
                {step.note}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
