// Reads ICY/Icecast stream metadata to get the current song title in real-time.
// Uses Node.js https.get() for proper stream chunking (web fetch doesn't
// yield chunks fast enough on live audio streams). Results cached 15 s.

import { NextResponse } from "next/server";
import https from "https";
import http from "http";
import { prisma } from "@/lib/prisma";
import { emit } from "@/lib/events";

export const dynamic = "force-dynamic";

interface TrackMeta { title: string; artist: string; cover_url?: string | null }

let cache: (TrackMeta & { ts: number }) | null = null;
const CACHE_MS = 15_000;

const STREAM_ERRORS = /sorry|service not available|offline|no signal|stream.*unavailable/i;

function parseMeta(raw: string): TrackMeta | null {
  const m = raw.match(/StreamTitle='([^']*)'/);
  let full = m?.[1]?.trim() ?? "";
  if (!full) return null;
  // Strip "Now On Air:" prefix common in FastCast4U streams
  full = full.replace(/^now on air:/i, "").trim();
  if (!full || STREAM_ERRORS.test(full)) return null;
  const dash = full.indexOf(" - ");
  if (dash > 0) return { artist: full.slice(0, dash).trim(), title: full.slice(dash + 3).trim() };
  return { title: full, artist: "La Mega 99.9" };
}

async function fetchCover(artist: string, title: string): Promise<string | null> {
  try {
    const term = encodeURIComponent(`${artist} ${title}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`,
      { signal: controller.signal, next: { revalidate: 0 } }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const url: string | undefined = data?.results?.[0]?.artworkUrl100;
    if (!url) return null;
    // Upgrade 100×100 thumbnail to 600×600
    return url.replace("100x100bb", "600x600bb");
  } catch (e) {
    console.error("[nowplaying] fetchCover error:", e);
    return null;
  }
}

function readIcyMeta(streamUrl: string): Promise<TrackMeta | null> {
  return new Promise((resolve) => {
    const lib = streamUrl.startsWith("https") ? https : http;
    let done = false;
    const finish = (v: TrackMeta | null) => {
      if (!done) { done = true; resolve(v); }
    };

    const timer = setTimeout(() => { req.destroy(); finish(null); }, 10_000);

    const req = lib.get(
      streamUrl,
      { headers: { "Icy-MetaData": "1", "User-Agent": "LaMega-Bot/1.0" } },
      (res) => {
        const metaint = parseInt((res.headers["icy-metaint"] as string) ?? "0", 10);
        if (!metaint) { req.destroy(); clearTimeout(timer); return finish(null); }

        const chunks: Buffer[] = [];
        let total = 0;
        const need = metaint + 1 + 255 * 16;

        const tryParse = () => {
          clearTimeout(timer);
          const buf = Buffer.concat(chunks);
          if (buf.length <= metaint) return finish(null);
          const metaLen = buf[metaint] * 16;
          if (metaLen === 0 || buf.length < metaint + 1 + metaLen) return finish(null);
          finish(parseMeta(buf.slice(metaint + 1, metaint + 1 + metaLen).toString("latin1")));
        };

        res.on("data", (chunk: Buffer) => {
          if (done) return;
          chunks.push(chunk);
          total += chunk.length;
          if (total >= need) {
            // Parse immediately — don't wait for close event
            tryParse();
            req.destroy();
          }
        });

        res.on("close", () => { if (!done) tryParse(); });
        res.on("error", () => { clearTimeout(timer); finish(null); });
      }
    );

    req.on("error", () => { clearTimeout(timer); finish(null); });
  });
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.ts < CACHE_MS) {
    return NextResponse.json({ title: cache.title, artist: cache.artist, cover_url: cache.cover_url ?? null, cached: true });
  }

  const url = process.env.NEXT_PUBLIC_STREAM_URL ?? "";
  const meta = await readIcyMeta(url);

  if (meta) {
    const prev = cache;
    cache = { ts: now, ...meta };

    const changed = !prev || prev.title !== meta.title || prev.artist !== meta.artist;
    if (!changed && prev?.cover_url) {
      // Same track — carry over existing cover into both meta and cache
      meta.cover_url = prev.cover_url;
      cache = { ...cache!, cover_url: prev.cover_url };
    }
    if (changed) {
      // Fetch album art from iTunes in parallel with the DB write
      const cover_url = await fetchCover(meta.artist, meta.title);
      meta.cover_url = cover_url;
      cache = { ts: now, ...meta };

      try {
        const row = await prisma.nowPlaying.upsert({
          where: { id: 1 },
          create: { id: 1, title: meta.title, artist: meta.artist, coverUrl: cover_url, startedAt: new Date() },
          update: { title: meta.title, artist: meta.artist, coverUrl: cover_url, startedAt: new Date() },
        });
        emit("now_playing_update", {
          title: row.title,
          artist: row.artist,
          album: row.album ?? null,
          cover_url: row.coverUrl ?? null,
          duration: row.duration ?? null,
          started_at: row.startedAt?.toISOString() ?? null,
        });
      } catch {}
    }

    return NextResponse.json({ title: meta.title, artist: meta.artist, cover_url: meta.cover_url ?? null, cached: false });
  }

  // Fallback: last known track from DB
  try {
    const row = await prisma.nowPlaying.findUnique({ where: { id: 1 } });
    if (row) return NextResponse.json({ title: row.title, artist: row.artist, cached: true });
  } catch {}

  return NextResponse.json({ title: null, artist: null });
}
