import type { Metadata } from "next";

import { site } from "@/lib/site";

/**
 * Per-page metadata, in one place.
 *
 * Two Next.js behaviours make hand-rolling this per page a trap:
 *
 * 1. `openGraph` is REPLACED by a child segment, not merged into. A page that
 *    declared only an og:title and og:url silently dropped the social image,
 *    site name, type and locale that the root layout had set — so most pages
 *    were sharing as a bare card.
 * 2. `alternates` is inherited. A canonical declared on the layout is applied
 *    to every page that does not override it, which quietly points whole
 *    routes at the homepage. The layout therefore declares none, and every
 *    indexable page states its own path here instead.
 *
 * Paths stay relative: `metadataBase` (set from `site.url` in the root layout)
 * makes them absolute, so the canonical host is configured exactly once.
 */

/**
 * The social card is referenced by route path rather than left to the
 * app/opengraph-image file convention, because that convention only attaches
 * to segments that do not override `openGraph` — which is every page below.
 */
const openGraphImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.tagline}`,
};

type PageSeo = {
  /** Rendered through the layout's "%s — Operava" template unless absolute. */
  title: string | { absolute: string };
  /** Meta description. Aim for ~140–160 characters to avoid truncation. */
  description: string;
  /** Canonical path, root-relative and without a trailing slash. */
  path: string;
  /** Social-card title. Defaults to the page description's framing. */
  ogTitle: string;
  /** Social-card description. Defaults to the meta description. */
  ogDescription?: string;
};

export function pageMetadata({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
}: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url: path,
      title: ogTitle,
      description: ogDescription ?? description,
      images: [openGraphImage],
    },
  };
}
