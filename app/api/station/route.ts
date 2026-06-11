import { NextResponse } from "next/server";
import { getStationData } from "@/lib/station";

export const dynamic = "force-dynamic";

// Public, read-only station data consumed by the landing page and /pide
// (programs, hosts, playlists, signal config). No auth — same data the
// site displays.
export async function GET() {
  const { shows, hosts, playlists, media, config } = await getStationData();
  return NextResponse.json({
    shows: shows.map((s) => ({
      id: s.id,
      name: s.name,
      host: s.host,
      start_time: s.startTime,
      end_time: s.endTime,
      days: s.days,
      slot: s.slot,
      blurb: s.blurb,
      hue: s.hue,
      is_on: s.isOn,
      featured: s.featured,
    })),
    hosts: hosts.map((h) => ({ id: h.id, name: h.name, alias: h.alias, show: h.show, hue: h.hue, photo_url: h.photoUrl, shows_count: h.showsCount })),
    media: media.map((m) => ({ id: m.id, kind: m.kind, url: m.url, title: m.title })),
    playlists: playlists.map((p) => ({ id: p.id, name: p.name, count: p.count, hue1: p.hue1, hue2: p.hue2, spotify_url: p.spotifyUrl })),
    config: {
      frequency: config?.frequency ?? "99.9 FM",
      city: config?.city ?? "Guayaquil",
      coverage: config?.coverage ?? "Ecuador",
      slogan: config?.slogan ?? "Solo La Mega, supera a La Mega",
    },
  });
}
