import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE.url, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE.url}/pide`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    // stays sync on purpose — making this async to enumerate hosts would put a
    // DB call in the build path, which the CI runner can't reach
    { url: `${SITE.url}/staff`, lastModified, changeFrequency: "monthly", priority: 0.7 },
  ];
}
