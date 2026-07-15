// Shared footer model: editable from /admin → Configuración, rendered by the
// public Footer. Stored as a JSON string in StationConfig.footer (null = use the
// default content below).

export interface FooterLink {
  label: string;
  url?: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// Fallback content (matches the original hardcoded footer). Used when the DB has
// no footer yet, and as the starting point in the admin editor.
export const DEFAULT_FOOTER: FooterColumn[] = [
  {
    title: "Sobre Nosotros",
    links: [
      { label: "Quiénes somos" },
      { label: "Historia" },
      { label: "Nuestro equipo", url: "/staff" },
      { label: "Trabaja con nosotros" },
      { label: "Prensa" },
    ],
  },
  { title: "Programación", links: ["Mega Click", "Megapolis", "Los de las 6", "Los Cómplices de la Noche", "Parrilla completa"].map((label) => ({ label })) },
  { title: "Legal", links: ["Términos de uso", "Política de privacidad", "Concursos y bases", "Cookies"].map((label) => ({ label })) },
  { title: "Contacto", links: ["Cabina: 096 13 14 999", "megacontacto@yahoo.com", "WhatsApp: 096 13 14 999", "Ibarra, Imbabura"].map((label) => ({ label })) },
];

// Only allow safe link destinations. Rejects javascript:, data:, etc. Empty/absent
// url means "plain text, not a link".
export function isSafeFooterUrl(url: string): boolean {
  const u = url.trim();
  if (u === "") return true;
  if (u.startsWith("/") || u.startsWith("#")) return true; // relative / anchor
  return /^(https?:|mailto:|tel:)/i.test(u);
}

// Parse the JSON column into a clean FooterColumn[]. Returns null on anything
// malformed so callers fall back to DEFAULT_FOOTER.
export function parseFooter(raw: string | null | undefined): FooterColumn[] | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data.map((c: { title?: unknown; links?: unknown }) => ({
      title: String(c?.title ?? ""),
      links: Array.isArray(c?.links)
        ? (c.links as { label?: unknown; url?: unknown }[]).map((l) => ({
            label: String(l?.label ?? ""),
            url: l?.url ? String(l.url) : undefined,
          }))
        : [],
    }));
  } catch {
    return null;
  }
}
