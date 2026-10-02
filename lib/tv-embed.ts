// Mega TV player embed — validation helpers. PURE: no server-only imports, so the
// public MegaTV component (client) and the admin config route (server) share them.
//
// The embed URL comes from OneStream Live → Stream Players → Copy Embed Code.
// It is an admin-editable setting (StationConfig.tvEmbedUrl), never hardcoded:
// the token is account-specific and changes if the player is recreated.
//
// Security: we only ever render an <iframe> whose src passed isSafeTvEmbedUrl —
// https, the exact OneStream player host, the /embed path and a real token.

export const TV_EMBED_HOST = "player.onestream.live";

// A `tvLive=true` that was never switched off (OBS crashed, network dropped)
// must not keep the section "on air" forever. The OBS script re-posts live:true
// every ~30 min while streaming (heartbeat); past this age the flag is treated
// as off. Generous on purpose: events can run long.
export const TV_LIVE_TTL_MS = 8 * 60 * 60 * 1000;

// Accepts either a bare URL or the full `<iframe … src="…">` snippet that OneStream
// hands out, and returns just the URL (trimmed). Never throws.
export function extractTvEmbedUrl(input: string | null | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : raw).trim();
}

// True only for https://player.onestream.live/embed?...token=<real token>...
// Rejects the "Upgrade your plan to embed this player" placeholder that OneStream
// puts in the code when the plan does not include embedding.
export function isSafeTvEmbedUrl(url: string | null | undefined): boolean {
  const u = (url ?? "").trim();
  if (!u || u.length > 500) return false;
  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.hostname !== TV_EMBED_HOST) return false;
  if (parsed.username || parsed.password || parsed.port) return false;
  if (!/^\/embed\/?$/.test(parsed.pathname)) return false;
  const token = (parsed.searchParams.get("token") ?? "").trim();
  if (token.length < 4) return false;
  if (/upgrade|your plan/i.test(token)) return false;
  return true;
}

// Pure freshness check used when reading the on-air flag.
export function isTvLiveFresh(
  tvLive: boolean | null | undefined,
  tvLiveAt: Date | string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!tvLive) return false;
  // Rows written before this column existed have no timestamp: trust the flag
  // (backwards compatible) rather than hiding a legitimately live show.
  if (!tvLiveAt) return true;
  const t = tvLiveAt instanceof Date ? tvLiveAt.getTime() : Date.parse(String(tvLiveAt));
  if (Number.isNaN(t)) return true;
  return now - t <= TV_LIVE_TTL_MS;
}
