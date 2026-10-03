import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { isSafeTvEmbedUrl, isTvLiveFresh } from "@/lib/tv-embed";

export const dynamic = "force-dynamic";

// Manual Mega TV on-air switch for the panel. Same effect as the automation /
// OBS script calling POST /api/radio/tv, but authenticated with the admin session
// — the fallback when OBS or its script fails and someone has to flip the section
// by hand. Content roles only (same as the emergency banner), not locutores.
const schema = z.object({ live: z.boolean() });

export async function GET() {
  const denied = await requireRole(["admin", "editor"]);
  if (denied) return denied;
  const [state, config] = await Promise.all([
    prisma.stationState.findUnique({ where: { id: 1 } }),
    prisma.stationConfig.findUnique({ where: { id: 1 } }),
  ]);
  return NextResponse.json({
    live: isTvLiveFresh(state?.tvLive, state?.tvLiveAt),
    embedConfigured: isSafeTvEmbedUrl(config?.tvEmbedUrl),
  });
}

export async function POST(req: Request) {
  const denied = await requireRole(["admin", "editor"]);
  if (denied) return denied;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const { live } = parsed.data;

  await prisma.stationState.upsert({
    where: { id: 1 },
    create: { id: 1, tvLive: live, tvLiveAt: live ? new Date() : null },
    update: { tvLive: live, tvLiveAt: live ? new Date() : null },
  });

  emit("tv_status", { live });
  return NextResponse.json({ ok: true, live });
}
