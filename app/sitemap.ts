import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE.url, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE.url}/pide`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];
}
