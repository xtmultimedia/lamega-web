import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostApp } from "@/components/megafono/PostApp";
import { getPublishedPost, getPublishedPosts } from "@/lib/posts";
import { HOME_POSTS, excerptFromHtml } from "@/lib/megafono";
import { SITE, blogPostingJsonLd } from "@/lib/seo";

// REQUIRED: without this Next would prerender at build time, which reads MySQL.
// The CI runner has no database, so the build would break. Same trap as /staff.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);
  // Drafts and unknown slugs share this branch — an unpublished URL must not be
  // distinguishable from a nonexistent one.
  if (!post) return { title: "Nota no encontrada", robots: { index: false, follow: false } };

  const description = post.excerpt || (post.contentHtml ? excerptFromHtml(post.contentHtml) : SITE.tagline);
  const image = post.coverUrl ? `${SITE.url}${post.coverUrl}` : SITE.ogImage;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/megafono/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `${SITE.url}/megafono/${post.slug}`,
      images: [image],
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: [image] },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();

  // "Más de El Megáfono" — newest few, minus the one being read.
  const { posts } = await getPublishedPosts(1);
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, HOME_POSTS);

  return (
    <>
      <PostApp post={post} more={more} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd(post)) }}
      />
    </>
  );
}
