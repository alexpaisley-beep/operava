const stages = [
  { name: "Lead or request", detail: "Phone, web, referral" },
  { name: "Estimate", detail: "Your pricing rules" },
  { name: "Schedule", detail: "Crews, techs, recurring" },
  { name: "Field work", detail: "Status, photos, notes" },
  { name: "Change orders", detail: "Priced and approved" },
  { name: "Invoice & job cost", detail: "QuickBooks, Stripe" },
];

/**
 * The operational spine. Not decoration — it is the argument: information
 * moving down this path without a person carrying it, which is exactly what a
 * fragmented stack cannot do. Deliberately trade-neutral: an electrician, a
 * roofer and a landscaper all recognise every row.
 */
export function HeroSpine() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(16,26,43,0.04),0_12px_32px_-16px_rgba(16,26,43,0.12)] sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <p className="t-eyebrow text-ink-3">Request to paid</p>
        <p className="t-mono-sm text-ink-3">no retyping</p>
      </div>

      <ol className="relative mt-5 flex flex-col gap-0">
        <span
          aria-hidden="true"
          className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-navy-700 via-navy-600 to-leaf-500"
        />
        {stages.map((stage) => (
          <li key={stage.name} className="relative flex items-baseline gap-4 py-2.5 pl-6">
            <span
              aria-hidden="true"
              className="absolute left-0 top-[0.6rem] h-[11px] w-[11px] rounded-full border-2 border-surface bg-navy-700 ring-1 ring-navy-200"
            />
            <span className="text-[0.95rem] font-medium text-ink">{stage.name}</span>
            <span className="ml-auto text-right text-[0.8125rem] text-ink-3">
              {stage.detail}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 border-t border-line pt-4 text-[0.875rem] leading-relaxed text-ink-2">
        Usually it is only the two or three handoffs actually costing you hours — connected
        properly to the software you keep.
      </p>
    </div>
  );
}
