/**
 * Single source of truth for company facts, contact details and navigation.
 * Anything that could change (domain, inbox, scheduler link) is env-overridable
 * so nothing real has to be hardcoded in a component.
 */

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

/**
 * The canonical production origin.
 *
 * Every canonical link, sitemap entry, robots directive, Open Graph URL and
 * JSON-LD `@id` on the site is derived from this one value, so a wrong value
 * here does not degrade gracefully — it tells Google the entire site lives on
 * another domain. That is exactly what happened while this defaulted to the
 * retired operavallc.com host: the deploy never set NEXT_PUBLIC_SITE_URL, the
 * fallback took over, and every indexable page self-canonicalised away from
 * the host Search Console was actually crawling.
 *
 * `www` is deliberate. The apex and the www host serve the same site, so only
 * one of them can be canonical, and www is the one that is indexed.
 */
const PRODUCTION_URL = "https://www.operava-systems.com";

/**
 * Hosts that are this same site under a name that must never appear in
 * metadata: the retired company domain, and the apex that redirects to www.
 * A deploy configured with any of them is a misconfiguration rather than a
 * different environment, so it is corrected here instead of being propagated
 * into a few hundred canonical tags. Anything not listed — localhost, a
 * preview URL, a staging host — is honoured exactly as given.
 */
const HOST_ALIASES: Record<string, string> = {
  "operava-systems.com": "www.operava-systems.com",
  "operavallc.com": "www.operava-systems.com",
  "www.operavallc.com": "www.operava-systems.com",
};

/** Normalises a configured site URL to a bare origin: scheme + host, no path. */
function canonicalOrigin(raw: string): string {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return PRODUCTION_URL;
  }

  const alias = HOST_ALIASES[parsed.hostname.toLowerCase()];
  if (alias) {
    parsed.hostname = alias;
    parsed.protocol = "https:";
  }

  // `host` rather than `hostname` so a dev port survives; any path, query or
  // fragment someone pasted in is dropped.
  return `${parsed.protocol}//${parsed.host}`;
}

const rawUrl = env("NEXT_PUBLIC_SITE_URL", PRODUCTION_URL);

export const site = {
  name: "Operava",
  legalName: "Operava LLC",
  /** Absolute canonical site origin, no trailing slash. */
  url: canonicalOrigin(rawUrl),
  contactEmail: env("NEXT_PUBLIC_CONTACT_EMAIL", "alexpaisley@operavallc.com"),
  tagline: "Software built around how your business actually works.",
  description:
    "Custom software and automation for contractors and service businesses — connecting the systems you already run and removing the manual work between them.",
  /**
   * Scheduler URL — the real Operava Discovery Call.
   *
   * This DEFAULTS to the live Calendly link rather than to "". An empty default
   * meant that any deploy without NEXT_PUBLIC_BOOKING_URL set silently degraded
   * every booking CTA on the site into "we'll email you to arrange a time" —
   * the qualification flow still worked, but nobody could actually pick a slot,
   * and nothing anywhere said so. A booking link is not optional configuration
   * for a business whose primary CTA is "book a call".
   *
   * The env var still overrides, so a staging deploy can point somewhere else.
   */
  bookingUrl: env(
    "NEXT_PUBLIC_BOOKING_URL",
    "https://calendly.com/alexpaisley-operavallc/30min",
  ),
  startingPrice: "$6,000",
  supportPrice: "$200/month",
} as const;

export type NavItem = { href: string; label: string };

export const primaryNav: NavItem[] = [
  { href: "/what-we-build", label: "What We Build" },
  // "Work" rather than "What We've Built": one character away from the item
  // above it in the same nav is not a distinction anyone parses at a glance.
  { href: "/work", label: "Work" },
  { href: "/process", label: "Process" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/request-software", label: "Request Software" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Company",
    items: [
      { href: "/about", label: "About Operava" },
      { href: "/process", label: "How we work" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Capabilities",
    items: [
      { href: "/what-we-build", label: "What we build" },
      { href: "/work", label: "Work we've shipped" },
      { href: "/#faq", label: "Questions" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
  {
    title: "Start here",
    items: [
      { href: "/book", label: "Book a discovery call" },
      { href: "/request-software", label: "Request custom software" },
      { href: "/portal", label: "Client portal" },
    ],
  },
];
