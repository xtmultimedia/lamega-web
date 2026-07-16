import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HOME_POSTS, type PublicPost } from "@/lib/megafono";
import { type DbPost, toPublicPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

// Public feed of published posts, for the homepage EL MEGÁFONO strip. The
// landing page is a client component, so it fetches this the same way
// useStationData fetches /api/station.
//
// Drafts never appear here: this route filters to status "published" and never
// returns contentHtml.
export async function GET(req: Request) {
  const takeParam = Number(new URL(req.url).searchParams.get("take"));
  const take = Number.isFinite(takeParam) && takeParam > 0 ? Math.min(takeParam, 24) : HOME_POSTS;

  const rows = (await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take,
  })) as unknown as DbPost[];

  const posts: PublicPost[] = toPublicPosts(rows);
  return NextResponse.json({ posts });
}
