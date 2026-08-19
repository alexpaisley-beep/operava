import Link from "next/link";
import type { ReactNode } from "react";

import { toneClass, toneDot, type Tone } from "@/lib/portal/vocabulary";

/* -------------------------------------------------------------------------
   Surfaces

   Same vocabulary as the marketing site: hairline borders, a 1px grid gap
   instead of per-cell borders, generous padding, no shadows except where
   something genuinely floats.
------------------------------------------------------------------------- */

export function Panel({
  children,
  className = "",
  id,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "article" | "div";
}) {
  return (
    <Tag id={id} className={`rounded-lg border border-line bg-surface ${className}`}>
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  action,
  className = "",
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4 lg:px-6 ${className}`}
    >
      <h2 className="t-eyebrow text-ink-3">{title}</h2>
      {action}
    </div>
  );
}

/** Page title block. Mirrors SectionHeading without the marketing-site lead sizing. */
export function PageHeading({
  eyebrow,
  title,
  lead,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="t-eyebrow text-ink-3">{eyebrow}</p> : null}
        <h1 className="t-h2 mt-3 text-ink">{title}</h1>
        {lead ? (
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{lead}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Status
------------------------------------------------------------------------- */

export function StatusPill({
  label,
  tone,
  className = "",
}: {
  label: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[0.75rem] font-medium leading-none ${toneClass[tone]} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} />
      {label}
    </span>
  );
}

/** Label above a value. Used for the small fact rows that carry most of the portal. */
export function Stat({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="t-eyebrow text-ink-3">{label}</dt>
      <dd className="mt-2 text-[0.9375rem] font-medium leading-snug text-ink">{children}</dd>
    </div>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project progress"
      >
        <div
          className="h-full rounded-full bg-navy-700 transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="t-mono-sm shrink-0 tabular-nums text-ink-2">{clamped}%</span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Empty states

   An empty portal section is the normal state early in a project, so these
   have to read as "nothing here yet, and that is fine" rather than as an
   error. Never a bare "No data".
------------------------------------------------------------------------- */

export function Empty({
  title,
  body,
  action,
  className = "",
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-dashed border-line-2 bg-paper px-5 py-8 text-center lg:px-8 ${className}`}
    >
      <p className="text-[0.9375rem] font-medium text-ink">{title}</p>
      {body ? (
        <p className="mx-auto mt-2 max-w-md text-[0.875rem] leading-relaxed text-ink-3">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Callout

   The "Waiting on you" panel. Deliberately the loudest thing the portal can
   render, because a customer must never have to wonder whether Operava is
   blocked on them.
------------------------------------------------------------------------- */

export function Callout({
  tone = "attention",
  title,
  children,
}: {
  tone?: Tone;
  title: ReactNode;
  children?: ReactNode;
}) {
  const accents: Record<Tone, string> = {
    neutral: "border-line-2 bg-muted",
    progress: "border-navy-600/30 bg-navy-50",
    attention: "border-alert-500/40 bg-alert-50",
    positive: "border-leaf-500/40 bg-leaf-50",
    danger: "border-danger-line bg-danger-bg",
  };

  return (
    <section className={`rounded-lg border border-l-4 p-5 lg:p-6 ${accents[tone]}`}>
      <h2 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
        {title}
      </h2>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

/* -------------------------------------------------------------------------
   Row link

   The list primitive. Full-width tap target with the chevron affordance the
   marketing site's 404 and nav already use — a table would be unusable on the
   phone this gets opened on.
------------------------------------------------------------------------- */

export function RowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-paper lg:px-6 ${className}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="mt-1 h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
      >
        <path
          d="M6 3.5 10.5 8 6 12.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

/** Hairline-separated list. `divide-y` on the container, so rows need no borders. */
export function List({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`divide-y divide-line ${className}`}>{children}</div>;
}
