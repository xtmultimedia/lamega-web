// Locutor profile model: bio, social links, and the Show↔Host link.
//
// PURE — no server-only imports. Client components (PerfilView, StaffApp,
// Programacion) import this, so pulling next-auth/bcrypt/mysql2 in here would
// drag server code into the browser bundle. Mirrors lib/footer.ts.

export const HOST_NETWORKS = [
  "instagram",
  "tiktok",
  "facebook",
  "youtube",
  "spotify",
  "x",
  "web",
] as const;

export type HostNetwork = (typeof HOST_NETWORKS)[number];

export interface HostSocial {
  network: HostNetwork;
  url: string;
}

export const BIO_MAX = 280;
export const SOCIALS_MAX = 6;

export const NETWORK_LABELS: Record<HostNetwork, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
  spotify: "Spotify",
  x: "X (Twitter)",
  web: "Sitio web",
};

// Stricter than isSafeFooterUrl on purpose: a social profile is always an
// absolute http(s) URL, and this field is filled by the least-privileged role.
// No mailto:, tel:, relative paths or javascript:.
export function isSafeHostUrl(url: string): boolean {
  return /^https?:\/\/\S+$/i.test(url.trim());
}

// Uploaded photos only — never an arbitrary remote/tracking URL.
export function isSafeHostPhoto(url: string): boolean {
  return /^\/uploads\/[\w.-]+$/.test(url);
}

/** Tolerant parser for Host.socials (JSON). Returns [] on anything malformed. */
export function parseHostSocials(raw: string | null | undefined): HostSocial[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (s: unknown): s is HostSocial =>
          !!s &&
          typeof s === "object" &&
          (HOST_NETWORKS as readonly string[]).includes((s as HostSocial).network) &&
          typeof (s as HostSocial).url === "string" &&
          isSafeHostUrl((s as HostSocial).url),
      )
      .slice(0, SOCIALS_MAX);
  } catch {
    return [];
  }
}

/** Tolerant parser for Show.hostIds (JSON array). Returns [] on anything malformed. */
export function parseHostIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((v: unknown): v is string => typeof v === "string" && v.length > 0);
  } catch {
    return [];
  }
}

/** Normalize a name for matching: lowercase, no accents, no quotes. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/["“”']/g, "")
    .toLowerCase()
    .trim();
}

/** Split a free-text host label ("A & B", "A, B y C") into individual names. */
export function splitHostLabel(label: string): string[] {
  return label
    .split(/\s*(?:&|,|\by\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}
