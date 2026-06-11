import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().max(30).optional().or(z.literal("")),
  song_title: z.string().min(1).max(120),
  song_artist: z.string().max(120).default(""),
  dedication: z.string().max(160).optional().or(z.literal("")),
  preferred_slot: z.string().max(80).optional().or(z.literal("")),
  is_special: z.boolean().default(false),
  special_for: z.string().max(80).optional().or(z.literal("")),
  occasion: z.string().max(40).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const row = await prisma.songRequest.create({
    data: {
      name: d.name,
      phone: d.phone || null,
      songTitle: d.song_title,
      songArtist: d.song_artist,
      dedication: d.dedication || null,
      preferredSlot: d.preferred_slot || null,
      isSpecial: d.is_special,
      specialFor: d.special_for || null,
      occasion: d.occasion || null,
    },
  });

  emit("new_request", {
    id: row.id,
    name: row.name,
    title: row.songTitle,
    artist: row.songArtist,
    dedication: row.dedication,
    preferred_slot: row.preferredSlot,
    is_special: row.isSpecial,
    status: row.status,
    requested_at: row.createdAt.toISOString(),
  });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
