// SERVER-ONLY HTML sanitizer for EL MEGÁFONO post bodies.
//
// WHY THIS EXISTS: post bodies are authored as HTML in a rich-text editor and
// rendered with dangerouslySetInnerHTML on the public site. Without sanitizing,
// anyone who can write a post could inject <script> — and the public reader,
// not the author, pays for it. Editors are trusted-ish, but "trusted" is not a
// security boundary: an editor account can be phished, and the editor's own
// paste buffer can carry markup they never inspected.
//
// WHERE IT RUNS: on WRITE (the admin POST/PATCH routes), so the database only
// ever holds clean HTML. Sanitizing on read instead would mean every render
// pays the cost, and any code path that forgot to call it would be a hole.
// Keep `import "server-only"` — sanitize-html must never reach the browser
// bundle (it would be both dead weight and trivially bypassable there).

import "server-only";
import sanitizeHtml from "sanitize-html";
import { CONTENT_MAX_BYTES, isSafeUploadUrl } from "./megafono";

// A deliberately small allowlist: exactly what the editor's toolbar can produce.
// Anything not named here is dropped. Notably absent, on purpose:
//   script/style/iframe/object/embed — code execution
//   class/id/style attributes        — CSS injection + layout escapes
//   on* handlers                     — never allowed by sanitize-html anyway
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "em", "u", "s",
    "ul", "ol", "li",
    "blockquote",
    "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  // No "data:" — a data: URI can carry an SVG with a <script> inside it.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Blocks "//evil.com", which inherits the page's scheme and reads as relative.
  allowProtocolRelative: false,
  transformTags: {
    // Outbound links open in a new tab, and MUST carry noopener: without it the
    // opened page gets window.opener and can navigate this tab elsewhere.
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:/i.test(href);
      return {
        tagName: "a",
        attribs: external
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      };
    },
  },
  exclusiveFilter: (frame) => {
    // Images may only come from our own /uploads. sanitize-html's scheme check
    // passes any relative URL, so this is what actually enforces it.
    if (frame.tag === "img") return !isSafeUploadUrl(frame.attribs.src ?? "");
    // Drop empty links — a bare <a> with no text is invisible but clickable.
    if (frame.tag === "a") return !frame.text.trim() && !frame.mediaChildren?.length;
    return false;
  },
};

/**
 * Clean untrusted post HTML. Returns the sanitized markup.
 *
 * Throws RangeError when the result exceeds CONTENT_MAX_BYTES so callers can
 * answer 400 instead of letting MySQL truncate mid-tag. The check is on the
 * SANITIZED bytes: measuring the input would let a payload of junk tags pass a
 * limit the stored value never approaches, and it's the stored value that has
 * to fit the column.
 */
export function sanitizePostHtml(dirty: string): string {
  const clean = sanitizeHtml(dirty, OPTIONS);
  if (Buffer.byteLength(clean, "utf8") > CONTENT_MAX_BYTES) {
    throw new RangeError("content too large");
  }
  return clean;
}
