import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";
import { requireRadioKey } from "@/lib/radio-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().optional(),
  cover_url: z.string().optional(),
  duration: z.number().int().positive().optional(),
  started_at: z.string().datetime({ offset: true }).optional(),
});

export async function POST(req: Request) {
  const unauthorized = requireRadioKey(req);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const data = {
    title: d.title,
    artist: d.artist,
    album: d.album ?? null,
    coverUrl: d.cover_url ?? null,
    duration: d.duration ?? null,
    startedAt: d.started_at ? new Date(d.started_at) : new Date(),
  };
  await prisma.nowPlaying.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });

  const payload = {
    title: d.title,
    artist: d.artist,
    album: d.album ?? null,
    cover_url: d.cover_url ?? null,
    duration: d.duration ?? null,
    started_at: data.startedAt.toISOString(),
  };
  emit("now_playing_update", payload);
  return NextResponse.json({ ok: true, now_playing: payload });
}
