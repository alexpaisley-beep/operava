import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/** Public, indexable pages only — confirmation pages are noindex by design. */
const routes: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/what-we-build", priority: 0.9, changeFrequency: "monthly" },
  { path: "/process", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/book", priority: 0.9, changeFrequency: "monthly" },
  { path: "/request-software", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
