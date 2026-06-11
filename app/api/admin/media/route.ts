import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  const items = await prisma.mediaItem.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ items });
}

const itemSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["image", "video", "youtube"]),
  url: z.string().min(1).max(500),
  title: z.string().max(160).default(""),
});

// Bulk replace (order = array index), same pattern as /api/admin/station.
export async function PUT(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = z.object({ items: z.array(itemSchema) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.mediaItem.deleteMany({});
    for (let i = 0; i < parsed.data.items.length; i++) {
      const { id, ...data } = parsed.data.items[i];
      await tx.mediaItem.create({ data: { ...(id ? { id } : {}), ...data, order: i } });
    }
  });

  const items = await prisma.mediaItem.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ ok: true, items });
}
