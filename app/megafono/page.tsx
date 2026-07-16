import type { Metadata } from "next";
import { MegafonoApp } from "@/components/megafono/MegafonoApp";
import { getPublishedPosts } from "@/lib/posts";
import { SITE, megafonoJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "El Megáfono",
  description: `Noticias, novedades y lo que se cuenta en ${SITE.name}: música, artistas y la agenda de ${SITE.city}, ${SITE.region}.`,
  alternates: { canonical: "/megafono" },
};

// REQUIRED: without this Next would prerender at build time, which reads MySQL.
// The CI runner has no database, so the build would break. Same trap as /staff.
export const dynamic = "force-dynamic";

export default async function MegafonoPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  // getPublishedPosts clamps out-of-range pages, so ?page=999 shows the last one
  // instead of an empty grid.
  const requested = Number(searchParams?.page);
  const { posts, pages } = await getPublishedPosts(Number.isFinite(requested) ? requested : 1);
  const page = Math.min(Math.max(1, Math.floor(requested) || 1), pages);

  return (
    <>
      <MegafonoApp posts={posts} page={page} pages={pages} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(megafonoJsonLd(posts)) }}
      />
    </>
  );
}
