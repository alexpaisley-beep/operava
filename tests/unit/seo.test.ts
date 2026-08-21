import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig from "../../next.config";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * The site once shipped with every canonical, sitemap entry and JSON-LD id
 * pointing at the retired operavallc.com host, because the site-URL default
 * still named it and the deploy never set NEXT_PUBLIC_SITE_URL. Nothing failed
 * — the pages rendered, returned 200 and were crawlable — the site simply told
 * Google it lived somewhere else. These tests exist so that regression is loud.
 */

const CANONICAL = "https://www.operava-systems.com";
const RETIRED_HOST = "operavallc.com";

/** Every page that should be indexable, and nothing that should not be. */
const PUBLIC_ROUTES = [
  "/",
  "/what-we-build",
  "/work",
  "/process",
  "/pricing",
  "/book",
  "/request-software",
  "/about",
  "/contact",
  "/privacy",
];

/** Re-imports the site module with NEXT_PUBLIC_SITE_URL set to `value`. */
async function siteUrlFromEnv(value: string): Promise<string> {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
  vi.resetModules();
  const fresh = await import("@/lib/site");
  return fresh.site.url;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("canonical origin", () => {
  it("defaults to the www production host", () => {
    expect(site.url).toBe(CANONICAL);
  });

  it("never resolves to the retired domain", () => {
    expect(site.url).not.toContain(RETIRED_HOST);
  });

  it("corrects the hosts that are this same site under another name", async () => {
    for (const wrong of [
      "https://operavallc.com",
      "https://www.operavallc.com",
      "https://operava-systems.com",
      "http://operava-systems.com",
      "operava-systems.com",
    ]) {
      expect(await siteUrlFromEnv(wrong)).toBe(CANONICAL);
    }
  });

  it("honours a genuinely different environment", async () => {
    expect(await siteUrlFromEnv("http://localhost:3000")).toBe("http://localhost:3000");
    expect(await siteUrlFromEnv("https://staging.example.com")).toBe(
      "https://staging.example.com",
    );
  });

  it("reduces to a bare origin and survives a nonsense value", async () => {
    expect(await siteUrlFromEnv("https://www.operava-systems.com/")).toBe(CANONICAL);
    expect(await siteUrlFromEnv("https://www.operava-systems.com/pricing?x=1")).toBe(CANONICAL);
    expect(await siteUrlFromEnv("not a url")).toBe(CANONICAL);
  });
});

describe("sitemap", () => {
  const entries = sitemap();

  it("lists exactly the public routes, each on the canonical origin", () => {
    expect(entries.map((entry) => entry.url).sort()).toEqual(
      PUBLIC_ROUTES.map((path) => `${CANONICAL}${path === "/" ? "/" : path}`).sort(),
    );
  });

  it("excludes noindex confirmations and internal areas", () => {
    const urls = entries.map((entry) => entry.url).join(" ");
    for (const excluded of [
      "/book/confirmed",
      "/request-software/received",
      "/portal",
      "/admin",
      "/api",
    ]) {
      expect(urls).not.toContain(excluded);
    }
  });

  it("contains no duplicates and no retired-domain URLs", () => {
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.join(" ")).not.toContain(RETIRED_HOST);
  });
});

describe("robots", () => {
  const generated = robots();
  const rules = Array.isArray(generated.rules) ? generated.rules : [generated.rules];
  const disallowed = rules.flatMap((rule) =>
    rule.disallow === undefined
      ? []
      : Array.isArray(rule.disallow)
        ? rule.disallow
        : [rule.disallow],
  );

  it("points at the canonical sitemap", () => {
    expect(generated.sitemap).toBe(`${CANONICAL}/sitemap.xml`);
    expect(generated.host).toBe(CANONICAL);
  });

  it("leaves every public route crawlable", () => {
    for (const route of PUBLIC_ROUTES) {
      expect(disallowed.some((rule) => route.startsWith(rule))).toBe(false);
    }
  });

  it("still blocks the private areas", () => {
    for (const blocked of ["/portal", "/admin", "/api/"]) {
      expect(disallowed).toContain(blocked);
    }
  });
});

describe("page metadata", () => {
  const meta = pageMetadata({
    title: "Custom Software Pricing for Contractors",
    description: "Projects start at $6,000.",
    path: "/pricing",
    ogTitle: "Pricing — Operava",
  });

  it("declares the page's own canonical, not the homepage's", () => {
    expect(meta.alternates?.canonical).toBe("/pricing");
    expect(meta.openGraph && "url" in meta.openGraph ? meta.openGraph.url : undefined).toBe(
      "/pricing",
    );
  });

  it("carries the shared Open Graph fields a page-level block would otherwise drop", () => {
    // Next.js replaces openGraph rather than merging it, so every one of these
    // has to be present here or the page ships a bare social card.
    const og = meta.openGraph as Record<string, unknown> | undefined;
    expect(og?.siteName).toBe(site.name);
    expect(og?.type).toBe("website");
    expect(og?.locale).toBe("en_US");
    const images = (og?.images ?? []) as { url: string }[];
    expect(images).toHaveLength(1);
    expect(images[0]?.url).toBe("/opengraph-image");
  });

  it("falls back to the meta description for the social card", () => {
    const og = meta.openGraph as Record<string, unknown> | undefined;
    expect(og?.description).toBe("Projects start at $6,000.");
  });
});

describe("host redirects", () => {
  // next.config.ts cannot import from src/, so it repeats the canonical host.
  // If the two ever disagree the site redirects away from its own canonical.
  const hostPatterns = () => {
    const redirects = nextConfig.redirects;
    if (!redirects) throw new Error("next.config.ts declares no redirects()");
    return redirects();
  };

  it("redirects the retired domain and the apex, permanently, keeping the path", async () => {
    const rules = await hostPatterns();
    const hosts = rules.flatMap((rule) =>
      (rule.has ?? []).filter((item) => item.type === "host").map((item) => item.value),
    );

    expect(hosts).toHaveLength(3);
    for (const host of ["operavallc.com", "www.operavallc.com", "operava-systems.com"]) {
      expect(hosts.some((pattern) => new RegExp(pattern!).test(host))).toBe(true);
    }

    for (const rule of rules) {
      expect(rule.permanent).toBe(true);
      expect(rule.source).toBe("/:path*");
      expect(rule.destination).toBe(`${CANONICAL}/:path*`);
    }
  });

  it("never matches the canonical host itself", async () => {
    const rules = await hostPatterns();
    const canonicalHost = new URL(CANONICAL).host;

    for (const rule of rules) {
      for (const item of rule.has ?? []) {
        if (item.type !== "host") continue;
        // An unanchored apex pattern would match inside "www.operava-systems.com"
        // and redirect the canonical host to itself forever.
        expect(new RegExp(item.value!).test(canonicalHost)).toBe(false);
      }
    }
  });
});
