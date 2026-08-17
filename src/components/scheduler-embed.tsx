import { site } from "@/lib/site";

/**
 * Calendar handoff.
 *
 * We never render invented availability. When NEXT_PUBLIC_BOOKING_URL points
 * at a real scheduler (Cal.com, Calendly, Google), the picker is embedded and
 * also linked for anyone the iframe fails. With no scheduler configured, we
 * say plainly that a human will reach out — which is what actually happens.
 */
export function SchedulerEmbed({ preferredContact }: { preferredContact?: string }) {
  if (!site.bookingUrl) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6 lg:p-8">
        <h2 className="t-h3 text-ink">Picking a time</h2>
        <p className="mt-3 text-[1rem] leading-relaxed text-ink-2">
          We&rsquo;ll reach out{preferredContact ? ` by ${preferredContact.toLowerCase()}` : ""}{" "}
          to lock in a time that works around your schedule — not ours. If it&rsquo;s easier to
          just send us a couple of windows that suit you, reply to{" "}
          <a
            href={`mailto:${site.contactEmail}`}
            className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
          >
            {site.contactEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="t-h3 text-ink">Pick your time</h2>
        <a
          href={site.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.875rem] text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
        >
          Open in a new tab
        </a>
      </div>
      <iframe
        src={site.bookingUrl}
        title="Schedule a discovery call with Operava"
        loading="lazy"
        className="h-[42rem] w-full border-0"
      />
    </div>
  );
}
