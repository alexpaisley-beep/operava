import type { ReactNode } from "react";

/** Determinate progress, labelled for screen readers. */
export function ProgressBar({
  percent,
  className = "",
}: {
  percent: number;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project progress"
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100"
      >
        <div
          className="h-full rounded-full bg-navy-700 transition-[width] duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="t-mono-sm shrink-0 text-ink-2">{value}%</span>
    </div>
  );
}

/** A quiet card — the portal's one container. No cards inside cards. */
export function Panel({
  children,
  className = "",
  as: Tag = "div",
  id,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      className={`rounded-lg border border-line bg-surface ${className}`}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  aside,
  className = "",
}: {
  title: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5 sm:px-6 ${className}`}
    >
      <h2 className="t-eyebrow text-ink-3">{title}</h2>
      {aside}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-[0.9rem] text-ink-3 sm:px-6">{children}</p>;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Render a Postgres `date` (no timezone shifting) or timestamp. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = Date.parse(value.includes("T") ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return "—";
  return dateFormat.format(parsed);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "—";
  return dateTimeFormat.format(parsed);
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Label/value pair for meta grids. */
export function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="t-eyebrow text-ink-3">{label}</dt>
      <dd className="text-[0.95rem] text-ink">{children}</dd>
    </div>
  );
}
