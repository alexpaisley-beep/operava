/**
 * Vendor-neutral conversion event interface.
 *
 * No analytics provider is wired up yet. Rather than pull in a vendor SDK, we
 * emit events to whatever happens to be on the page: a GTM dataLayer, Plausible,
 * or gtag. Adding a provider later is a script tag — no code changes here.
 */

export type AnalyticsEvent =
  | "cta_clicked"
  | "booking_started"
  | "booking_submitted"
  | "software_request_started"
  | "software_request_submitted";

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

type DataLayerWindow = Window & {
  dataLayer?: unknown[];
  plausible?: (event: string, options?: { props?: AnalyticsProps }) => void;
  gtag?: (command: string, event: string, params?: AnalyticsProps) => void;
};

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;

  const w = window as DataLayerWindow;
  const payload: AnalyticsProps = { ...props };

  try {
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event, ...payload });
    }
    if (typeof w.plausible === "function") {
      w.plausible(event, { props: payload });
    }
    if (typeof w.gtag === "function") {
      w.gtag("event", event, payload);
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", event, payload);
    }
  } catch {
    // Analytics must never break the page.
  }
}
