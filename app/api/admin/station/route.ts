import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getStationData } from "@/lib/station";
import { BIO_MAX, HOST_NETWORKS, isSafeHostUrl, parseHostIds, parseHostSocials, SOCIALS_MAX } from "@/lib/hosts";

export const dynamic = "force-dynamic";

// Programación / Locutores / Playlists: content roles.
const requireSession = () => requireRole(["admin", "editor"]);

// GET: full editable station data for the dashboard. hostIds/socials are stored
// as JSON text but handed to the client as arrays, matching what PUT expects.
export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  const { shows, hosts, playlists } = await getStationData();
  return NextResponse.json({
    shows: shows.map((s) => ({ ...s, hostIds: parseHostIds(s.hostIds) })),
    hosts: hosts.map((h) => ({ ...h, socials: parseHostSocials(h.socials) })),
    playlists,
  });
}

const showSchema = z.object({
  id: z.string().optional(), // absent → new row
  name: z.string().min(1).max(80),
  // display label derived from hostIds — three joined names blow past 80
  host: z.string().min(1).max(200),
  hostIds: z.array(z.string().max(191)).max(8).optional(),
  startTime: z.string().min(1).max(20),
  endTime: z.string().min(1).max(20),
  days: z.enum(["semana", "sabado", "domingo"]),
  slot: z.string().max(40).nullable().optional(),
  blurb: z.string().max(400).nullable().optional(),
  hue: z.string().max(20),
  isOn: z.boolean(),
  featured: z.boolean(),
});

// bio/socials MUST round-trip here: the client sends the whole host list back,
// so a field missing from this schema would be wiped on every editor save.
const hostSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  alias: z.string().max(80),
  show: z.string().max(80),
  hue: z.string().max(20),
  photoUrl: z.string().max(500).nullable().optional(),
  bio: z.string().max(BIO_MAX).nullable().optional(),
  socials: z
    .array(
      z.object({
        network: z.enum(HOST_NETWORKS),
        url: z.string().max(300).refine(isSafeHostUrl, "URL no permitida"),
      }),
    )
    .max(SOCIALS_MAX)
    .nullable()
    .optional(),
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

// PUT: bulk replace of shows/playlists (order = array index). Hosts are synced
// incrementally instead — see below.
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
        const { id, hostIds, ...data } = shows[i];
        await tx.show.create({
          data: {
            ...(id ? { id } : {}),
            ...data,
            hostIds: JSON.stringify(hostIds ?? []),
            slot: data.slot ?? null,
            blurb: data.blurb ?? null,
            order: i,
          },
        });
      }
    }
    if (hosts) {
      // NON-destructive: Host.id is referenced by AdminUser.hostId and
      // Show.hostIds, so delete-all + recreate would break those links (and
      // would drop any column the client didn't echo back, e.g. a locutor's bio).
      const existing = (await tx.host.findMany({})) as unknown as { id: string }[];
      const keep = new Set(hosts.map((h) => h.id).filter(Boolean) as string[]);
      const removed = existing.map((h) => h.id).filter((id) => !keep.has(id));
      // `in: []` compiles to `1 = 0` in the shim → deletes nothing. Safe.
      await tx.host.deleteMany({ where: { id: { in: removed } } });

      const existingIds = new Set(existing.map((h) => h.id));
      for (let i = 0; i < hosts.length; i++) {
        const { id, socials, ...data } = hosts[i];
        const row = {
          ...data,
          photoUrl: data.photoUrl ?? null,
          bio: data.bio ?? null,
          socials: socials && socials.length ? JSON.stringify(socials) : null,
          order: i,
        };
        if (id && existingIds.has(id)) await tx.host.update({ where: { id }, data: row });
        else await tx.host.create({ data: { ...(id ? { id } : {}), ...row } });
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

  // Same shape as GET — the client replaces its state from this response, so
  // hostIds/socials must come back as arrays or the next save would 400.
  const fresh = await getStationData();
  return NextResponse.json({
    ok: true,
    shows: fresh.shows.map((s) => ({ ...s, hostIds: parseHostIds(s.hostIds) })),
    hosts: fresh.hosts.map((h) => ({ ...h, socials: parseHostSocials(h.socials) })),
    playlists: fresh.playlists,
  });
}
