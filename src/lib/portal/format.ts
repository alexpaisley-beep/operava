/**
 * Formatting helpers.
 *
 * All of these run on the server and are pinned to a fixed locale and time
 * zone. Left to the runtime default, a date rendered during static generation
 * and the same date rendered in the browser can disagree, which React reports
 * as a hydration mismatch — and a project's target date visibly shifting by a
 * day is the kind of thing a customer notices and stops trusting.
 */

const LOCALE = "en-US";

/**
 * Date-only columns (`due_date`, `target_date`) come back as "2026-04-20" with
 * no zone. `new Date()` on that string parses it as midnight UTC, which prints
 * as the previous day anywhere west of Greenwich. Splitting the parts and
 * building a UTC date, then formatting in UTC, keeps the day as typed.
 */
function fromDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/** "20 Apr 2026" for a date-only column. Returns "" for null, never "Invalid Date". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = fromDateOnly(value) ?? new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "20 Apr 2026, 3:42 PM" for a timestamptz. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

/**
 * "3 days ago". Relative time is what an update feed actually wants, and it is
 * computed from a timestamp the server already has rather than in the browser,
 * so it does not shift between render and hydration.
 */
export function formatRelative(value: string | null | undefined, now = Date.now()): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.round((date.getTime() - now) / 1000);
  const absolute = Math.abs(seconds);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (absolute >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/** "$6,000.00". Amounts are numeric(12,2) and arrive as a number. */
export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

/** "2.4 MB". Decimal units, because that is what a file manager shows. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/**
 * Days until a date. Negative means overdue. Used for the billing and target
 * date nudges, where "in 3 days" is more useful than a date.
 */
export function daysUntil(value: string | null | undefined, now = Date.now()): number | null {
  if (!value) return null;
  const date = fromDateOnly(value) ?? new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const startOfToday = new Date(now);
  const todayUtc = Date.UTC(
    startOfToday.getUTCFullYear(),
    startOfToday.getUTCMonth(),
    startOfToday.getUTCDate(),
  );
  return Math.round((date.getTime() - todayUtc) / 86400000);
}

/** First letters of a name, for the authorship avatars. "Alex Paisley" → "AP". */
export function initials(name: string, fallback = "?"): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || fallback;
}
