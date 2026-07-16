// EL MEGÁFONO (blog) — shared model. PURE: zero imports, so both client
// components (the admin editor) and server code (API routes, public pages) can
// import it. Never add next-auth/mysql2/sanitize-html here — the sanitizer is
// server-only and lives in lib/sanitize.ts.

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export function isPostStatus(v: unknown): v is PostStatus {
  return typeof v === "string" && (POST_STATUSES as readonly string[]).includes(v);
}

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
};

export const TITLE_MAX = 200;
export const EXCERPT_MAX = 300;
export const SLUG_MAX = 80;
// Post.contentHtml is MEDIUMTEXT (16 MB). This cap is about sane payloads, not
// the column limit. Enforced in BYTES on the server (lib/sanitize.ts) — MySQL
// counts bytes, and one emoji costs 4 of them.
export const CONTENT_MAX_BYTES = 400_000;
export const POSTS_PER_PAGE = 9;
export const HOME_POSTS = 3; // the homepage strip

// Posts are signed by the station, not by individuals (product decision).
export const POST_BYLINE = "El Megáfono";

/** A published post as exposed to the public site. */
export interface PublicPost {
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null; // ISO
}

/** A post as seen inside the admin panel (adds draft-only fields). */
export interface AdminPost extends PublicPost {
  id: string;
  status: PostStatus;
  contentHtml: string | null;
}

/**
 * Title → URL slug. Strips diacritics (NFD + combining-mark removal, same
 * approach as normalizeName in lib/hosts.ts), lowercases, and collapses every
 * other run of characters into single hyphens.
 *
 * Returns "" for input with no usable characters — callers must handle that
 * (the API falls back to a generated slug) rather than writing an empty slug,
 * which would collide on the UNIQUE index.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, ""); // slice() can leave a trailing hyphen
}

/** Slugs are the public URL key: lowercase alphanumerics and hyphens only. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= SLUG_MAX;
}

/**
 * Images (the cover AND anything inside the body) must be our own uploads. An
 * external URL would let a post embed a third-party tracker on the public site,
 * and would break if that host disappears. Mirrors isSafeHostPhoto.
 */
export function isSafeUploadUrl(url: string): boolean {
  return /^\/uploads\/[\w.-]+$/.test(url);
}

/** es-EC long date ("15 de julio de 2026"). Returns "" for null/invalid. */
export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Machine-readable date for <time dateTime>. Returns "" for null/invalid. */
export function postDateAttr(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/**
 * Best-effort excerpt from rendered HTML, for when an editor leaves it blank.
 * Strips tags and decodes only the entities our sanitizer can emit.
 */
export function excerptFromHtml(html: string, max = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  // Cut on a word boundary so the ellipsis doesn't land mid-word.
  return text.slice(0, text.lastIndexOf(" ", max) > 0 ? text.lastIndexOf(" ", max) : max).trimEnd() + "…";
}
