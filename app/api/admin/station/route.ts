import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStationData } from "@/lib/station";

export const dynamic = "force-dynamic";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// GET: full editable station data for the dashboard.
export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  const { shows, hosts, playlists } = await getStationData();
  return NextResponse.json({ shows, hosts, playlists });
}

const showSchema = z.object({
  id: z.string().optional(), // absent → new row
  name: z.string().min(1).max(80),
  host: z.string().min(1).max(80),
  startTime: z.string().min(1).max(20),
  endTime: z.string().min(1).max(20),
  days: z.enum(["semana", "sabado", "domingo"]),
  slot: z.string().max(40).nullable().optional(),
  blurb: z.string().max(400).nullable().optional(),
  hue: z.string().max(20),
  isOn: z.boolean(),
  featured: z.boolean(),
});

const hostSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  alias: z.string().max(80),
  show: z.string().max(80),
  hue: z.string().max(20),
  photoUrl: z.string().max(500).nullable().optional(),
  showsCount: z.number().int().min(0),
});

const playlistSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  count: z.number().int().min(0),
  hue1: z.string().max(20),
  hue2: z.string().max(20),
  spotifyUrl: z.string().max(300).nullable().optional(),
});

const putSchema = z.object({
  shows: z.array(showSchema).optional(),
  hosts: z.array(hostSchema).optional(),
  playlists: z.array(playlistSchema).optional(),
});

// PUT: bulk replace of any of the three lists. Each list sent replaces the
// whole table (order = array index), so reorder/add/delete are all covered.
export async function PUT(req: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { shows, hosts, playlists } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (shows) {
      await tx.show.deleteMany({});
      for (let i = 0; i < shows.length; i++) {
        const { id, ...data } = shows[i];
        await tx.show.create({ data: { ...(id ? { id } : {}), ...data, slot: data.slot ?? null, blurb: data.blurb ?? null, order: i } });
      }
    }
    if (hosts) {
      await tx.host.deleteMany({});
      for (let i = 0; i < hosts.length; i++) {
        const { id, ...data } = hosts[i];
        await tx.host.create({ data: { ...(id ? { id } : {}), ...data, photoUrl: data.photoUrl ?? null, order: i } });
      }
    }
    if (playlists) {
      await tx.playlist.deleteMany({});
      for (let i = 0; i < playlists.length; i++) {
        const { id, ...data } = playlists[i];
        await tx.playlist.create({ data: { ...(id ? { id } : {}), ...data, spotifyUrl: data.spotifyUrl ?? null, order: i } });
      }
    }
  });

  const fresh = await getStationData();
  return NextResponse.json({ ok: true, shows: fresh.shows, hosts: fresh.hosts, playlists: fresh.playlists });
}
