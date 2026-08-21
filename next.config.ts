import type { NextConfig } from "next";

/**
 * The one host search engines should ever see. Kept in step with
 * `site.url` in src/lib/site.ts — this file cannot import from `src/`
 * without pulling the app graph into the config, so the host (not the
 * whole URL) is repeated here and asserted equal in tests/unit/seo.test.ts.
 */
const CANONICAL_HOST = "www.operava-systems.com";

/**
 * Hosts that must not serve the site under their own name: the retired
 * company domain and the bare apex. Both are permanent (308) redirects that
 * keep the path, so /pricing on an old link lands on /pricing rather than
 * dumping every inbound link onto the homepage. Next.js carries the query
 * string across on its own.
 *
 * These only fire for requests that actually reach this app. Whether
 * operavallc.com resolves here at all is a DNS/hosting question — see the
 * deployment notes in README.md.
 */
const LEGACY_HOSTS = ["operavallc.com", "www.operavallc.com", "operava-systems.com"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Admin deliverable uploads go through a server action; the storage
      // bucket caps files at 25 MB, this must clear that plus form overhead.
      bodySizeLimit: "26mb",
    },
  },
  async redirects() {
    return LEGACY_HOSTS.map((host) => ({
      // Anchored so the apex rule cannot also match www.operava-systems.com
      // and redirect the canonical host to itself forever.
      source: "/:path*",
      has: [{ type: "host" as const, value: `^${host.replace(/\./g, "\\.")}$` }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
