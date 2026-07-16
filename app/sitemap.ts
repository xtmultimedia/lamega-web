import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { getAllPublishedPosts } from "@/lib/posts";

// REQUIRED, same trap as /staff: this reads the DB, and without force-dynamic
// Next would evaluate it at build time — where the CI runner has no database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const stat: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE.url}/pide`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/staff`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/megafono`, lastModified, changeFrequency: "daily", priority: 0.9 },
  ];

  // A DB hiccup must not take the whole sitemap down — serving the static routes
  // beats returning a 500 to a crawler.
  try {
    const posts = await getAllPublishedPosts();
    return [
      ...stat,
      ...posts.map((p) => ({
        url: `${SITE.url}/megafono/${p.slug}`,
        lastModified: p.publishedAt ? new Date(p.publishedAt) : lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return stat;
  }
}
