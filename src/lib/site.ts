/**
 * Single source of truth for company facts, contact details and navigation.
 * Anything that could change (domain, inbox, scheduler link) is env-overridable
 * so nothing real has to be hardcoded in a component.
 */

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

const rawUrl = env("NEXT_PUBLIC_SITE_URL", "https://operavallc.com");

export const site = {
  name: "Operava",
  legalName: "Operava LLC",
  /** Absolute site origin, no trailing slash. */
  url: rawUrl.replace(/\/+$/, ""),
  contactEmail: env("NEXT_PUBLIC_CONTACT_EMAIL", "alexpaisley@operavallc.com"),
  tagline: "Custom software for landscaping companies that have outgrown generic tools.",
  description:
    "Custom operating software for established landscaping companies — CRM, scheduling, estimating, crew workflows and integrations built around how you actually run.",
  /**
   * Scheduler URL (Cal.com / Calendly / Google). When set, the confirmation
   * page offers a real time picker. When empty, we tell people we'll follow up
   * by email instead of faking availability.
   */
  bookingUrl: env("NEXT_PUBLIC_BOOKING_URL", ""),
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
    ],
  },
];
