import { prisma } from "./prisma";
import { normalizeName, parseHostIds, splitHostLabel } from "./hosts";

// First-run seed populated from the filled questionnaire (Ibarra, Imbabura).

const SHOW_SEED = [
  // ── Lunes a Viernes ────────────────────────────────────────────────────────
  {
    name: "Mega Noticias",
    host: "Paulina Puga & Tatiana Burbano",
    startTime: "07:00", endTime: "08:00", days: "semana",
    slot: "MAÑANA", blurb: "Arranca el día informado: las noticias de actualidad local, nacional e internacional.",
    hue: "#1683C8", featured: false,
  },
  {
    name: "Mega Click",
    host: "Paulina Puga",
    startTime: "08:00", endTime: "10:00", days: "semana",
    slot: "MAÑANA", blurb: "Los mejores hits del rock latino de los 80s al 2000 para encender la mañana.",
    hue: "#E31E24", featured: true,
  },
  {
    name: "Megapolis",
    host: "Joselyn Hernández & Marcos Cruz",
    startTime: "10:00", endTime: "13:00", days: "semana",
    slot: "MEDIODÍA", blurb: "Radio show con ritmos tropicales, humor y la mejor energía para tu jornada.",
    hue: "#FF2D34", featured: true,
  },
  {
    name: "Conexión 99",
    host: "Liliana Sumba",
    startTime: "13:00", endTime: "16:00", days: "semana",
    slot: "TARDE", blurb: "Covers acústicos y baladas del 80 al 2024 para acompañar tu tarde.",
    hue: "#D0307A", featured: false,
  },
  {
    name: "Urban Beats",
    host: "Automático",
    startTime: "16:00", endTime: "18:00", days: "semana",
    slot: "TARDE", blurb: "Segmento juvenil con las tendencias urbanas y los hits del momento.",
    hue: "#7A1FC4", featured: false,
  },
  {
    name: "Los de las 6",
    host: "Daniel Andrade & Verónica Villegas",
    startTime: "18:00", endTime: "20:00", days: "semana",
    slot: "NOCHE", blurb: "Música selecta de los 80s al 2000 con el mejor equipo para cerrar tu día.",
    hue: "#E31E24", featured: true,
  },
  {
    name: "Los Cómplices de la Noche",
    host: "Stefany Caicedo & Kevin Cevallos",
    startTime: "20:00", endTime: "22:00", days: "semana",
    slot: "NOCHE", blurb: "Radio revista nocturna con música variada y conversación para los trasnochadores.",
    hue: "#7A1FC4", featured: false,
  },
  {
    name: "Q' Noche La de Anoche",
    host: "Automático",
    startTime: "22:00", endTime: "23:00", days: "semana",
    slot: "MADRUGADA", blurb: "Información y placer auditivo para cerrar la noche.",
    hue: "#8E0F13", featured: false,
  },
  {
    name: "Mega DJ",
    host: "Automático",
    startTime: "23:00", endTime: "07:00", days: "semana",
    slot: "", blurb: "Solo éxitos contemporáneos en automático durante toda la madrugada.",
    hue: "#1683C8", featured: false,
  },

  // ── Sábado ─────────────────────────────────────────────────────────────────
  {
    name: "Los Reyes de la Salsa",
    host: "Carlos Andrade, Pablo Congo & Oscar Monteros",
    startTime: "12:00", endTime: "15:00", days: "sabado",
    slot: "SÁBADO", blurb: "Tres horas de salsa pura con los mejores exponentes del género.",
    hue: "#FF2D34", featured: false,
  },
  {
    name: "Mega DJ",
    host: "Automático",
    startTime: "15:00", endTime: "19:00", days: "sabado",
    slot: "", blurb: "Solo éxitos contemporáneos.",
    hue: "#D0307A", featured: false,
  },
  {
    name: "DJ Tatto",
    host: "DJ Tatto",
    startTime: "19:00", endTime: "20:00", days: "sabado",
    slot: "SÁBADO", blurb: "Radio show de house y dance para arrancar la noche del sábado.",
    hue: "#7A1FC4", featured: false,
  },
  {
    name: "Bastian V",
    host: "Bastian V",
    startTime: "20:00", endTime: "21:00", days: "sabado",
    slot: "SÁBADO", blurb: "Radio show de house y dance.",
    hue: "#1683C8", featured: false,
  },
  {
    name: "Top 20",
    host: "Automático",
    startTime: "21:00", endTime: "23:00", days: "sabado",
    slot: "SÁBADO", blurb: "El ranking de los 20 más escuchados de la semana en todos los géneros.",
    hue: "#E31E24", featured: false,
  },

  // ── Domingo ─────────────────────────────────────────────────────────────────
  {
    name: "Bastian V",
    host: "Bastian V",
    startTime: "10:00", endTime: "11:00", days: "domingo",
    slot: "DOMINGO", blurb: "Radio show de house y dance.",
    hue: "#1683C8", featured: false,
  },
  {
    name: "DJ Tatto",
    host: "DJ Tatto",
    startTime: "11:00", endTime: "12:00", days: "domingo",
    slot: "DOMINGO", blurb: "Radio show de house y dance.",
    hue: "#7A1FC4", featured: false,
  },
  {
    name: "Top 20",
    host: "Automático",
    startTime: "12:00", endTime: "14:00", days: "domingo",
    slot: "DOMINGO", blurb: "El ranking de los 20 más escuchados en todos los géneros.",
    hue: "#E31E24", featured: false,
  },
  {
    name: "Mega DJ",
    host: "Automático",
    startTime: "14:00", endTime: "18:00", days: "domingo",
    slot: "", blurb: "Solo éxitos contemporáneos.",
    hue: "#D0307A", featured: false,
  },
  {
    name: "Mega Latin Rock",
    host: "Automático",
    startTime: "18:00", endTime: "20:00", days: "domingo",
    slot: "DOMINGO", blurb: "Solo los éxitos del rock latino en una tarde dominical especial.",
    hue: "#FF2D34", featured: false,
  },
  {
    name: "Mega DJ",
    host: "Automático",
    startTime: "20:00", endTime: "07:00", days: "domingo",
    slot: "", blurb: "Solo éxitos contemporáneos hasta el lunes.",
    hue: "#8E0F13", featured: false,
  },
];

const HOST_SEED = [
  { name: "Paulina Puga",     alias: "Pauly",                  show: "Mega Click / Mega Noticias",        hue: "#E31E24", showsCount: 172 },
  { name: "Tatiana Burbano",  alias: "Tatty",                  show: "Mega Noticias",                     hue: "#FF2D34", showsCount: 86  },
  { name: "Joselyn Hernández",alias: "Joss",                   show: "Megapolis",                         hue: "#D0307A", showsCount: 151 },
  { name: "Marcos Cruz",      alias: "Omega",                  show: "Megapolis",                         hue: "#7A1FC4", showsCount: 365 },
  { name: "Liliana Sumba",    alias: "Lily",                   show: "Conexión 99",                       hue: "#FF2D34", showsCount: 172 },
  { name: "Daniel Andrade",   alias: "Danny Rush",             show: "Los de las 6",                      hue: "#E31E24", showsCount: 624 },
  { name: "Verónica Villegas",alias: "Shisuca",                show: "Los de las 6",                      hue: "#D0307A", showsCount: 172 },
  { name: "Stefany Caicedo",  alias: "La Luz que Alumbra",     show: "Los Cómplices de la Noche",         hue: "#7A1FC4", showsCount: 516 },
  { name: "Kevin Cevallos",   alias: "Tevo",                   show: "Los Cómplices de la Noche",         hue: "#1683C8", showsCount: 172 },
  { name: "Carlos Andrade",   alias: "Viejo Bryan",            show: "Los Reyes de la Salsa",             hue: "#FF2D34", showsCount: 103 },
  { name: "Pablo Congo",      alias: "DJ Pablo",               show: "Los Reyes de la Salsa",             hue: "#E31E24", showsCount: 103 },
  { name: "Oscar Monteros",   alias: "Osito",                  show: "Los Reyes de la Salsa",             hue: "#D0307A", showsCount: 103 },
];

const PLAYLIST_SEED = [
  { name: "Pop Hits",     count: 98,  hue1: "#FF2D34", hue2: "#D0307A", spotifyUrl: "https://l1nk.dev/4cy6bsf"    },
  { name: "Urbano",       count: 124, hue1: "#E31E24", hue2: "#7A1FC4", spotifyUrl: "https://acesse.one/f1j9hqp"  },
  { name: "House & Dance",count: 112, hue1: "#1683C8", hue2: "#7A1FC4", spotifyUrl: "https://acesse.one/76yqhg0"  },
  { name: "Alternativo",  count: 76,  hue1: "#D0307A", hue2: "#8E0F13", spotifyUrl: "https://acesse.one/ftosqkg"  },
];

export async function seedStationIfEmpty() {
  const [shows, hosts, playlists, config] = await Promise.all([
    prisma.show.count(),
    prisma.host.count(),
    prisma.playlist.count(),
    prisma.stationConfig.findUnique({ where: { id: 1 } }),
  ]);

  if (shows === 0) {
    await prisma.show.createMany({ data: SHOW_SEED.map((s, i) => ({ ...s, order: i })) });
  }
  if (hosts === 0) {
    await prisma.host.createMany({ data: HOST_SEED.map((h, i) => ({ ...h, order: i })) });
  }
  if (playlists === 0) {
    await prisma.playlist.createMany({ data: PLAYLIST_SEED.map((p, i) => ({ ...p, order: i })) });
  }
  if (!config) {
    await prisma.stationConfig.create({
      data: {
        id: 1,
        frequency: "99.9 FM",
        city: "Ibarra",
        coverage: "Imbabura",
        slogan: "Solo La Mega",
        streamOn: true,
        tvOn: true,
        pushOn: true,
        autoOn: true,
        maintenance: false,
      },
    });
  }
}

type ShowRowLike = { id: string; host: string; hostIds?: string | null };
type HostRowLike = { id: string; name: string; hue?: string; photoUrl?: string | null };

/**
 * Resolve a show's hosts through the real link (Show.hostIds).
 * Falls back to the free-text Show.host label when nothing is linked — that's
 * how "Automático" and not-yet-linked rows keep working (no photo, just a name).
 * The shim can't join, so callers pass the already-loaded hosts array.
 */
export function resolveShowHosts<H extends HostRowLike>(
  show: ShowRowLike,
  hosts: H[],
): { hosts: H[]; label: string } {
  const ids = parseHostIds(show.hostIds);
  const linked = ids.map((id) => hosts.find((h) => h.id === id)).filter((h): h is H => !!h);
  if (linked.length === 0) return { hosts: [], label: show.host };
  return { hosts: linked, label: linked.map((h) => h.name).join(" & ") };
}

/**
 * One-shot backfill: turn the legacy free-text Show.host ("Joselyn Hernández &
 * Marcos Cruz") into real Host ids. Runs only for rows that were never
 * backfilled, and ALWAYS writes a value (even "[]") so it never retries.
 *
 * NOTE: filtering happens in memory on purpose — the shim compiles
 * `where: { hostIds: null }` to `hostIds = NULL`, which is never true in SQL
 * and would silently match zero rows (lib/prisma.ts compileWhere).
 */
async function backfillShowHosts(shows: ShowRowLike[], hosts: HostRowLike[]) {
  const pending = shows.filter((s) => s.hostIds == null);
  if (pending.length === 0) return; // common case: zero extra queries

  for (const show of pending) {
    const ids = splitHostLabel(show.host)
      .map((token) => hosts.find((h) => normalizeName(h.name) === normalizeName(token))?.id)
      .filter((id): id is string => !!id);
    const json = JSON.stringify(ids);
    show.hostIds = json; // mutate so the very first request already serves resolved data
    await prisma.show.update({ where: { id: show.id }, data: { hostIds: json } }).catch(() => {});
  }
}

export async function getStationData() {
  await seedStationIfEmpty();
  const [shows, hosts, playlists, media, config] = await Promise.all([
    // "semana" > "sabado" > "domingo" alphabetically descending — shows the
    // weekday grid first in the editor
    prisma.show.findMany({ orderBy: [{ days: "desc" }, { order: "asc" }] }),
    prisma.host.findMany({ orderBy: { order: "asc" } }),
    prisma.playlist.findMany({ orderBy: { order: "asc" } }),
    prisma.mediaItem.findMany({ orderBy: { order: "asc" } }),
    prisma.stationConfig.findUnique({ where: { id: 1 } }),
  ]);
  // the shim returns RowDataPacket[]; shape is guaranteed by prisma/schema.prisma
  await backfillShowHosts(shows as unknown as ShowRowLike[], hosts as unknown as HostRowLike[]);
  return { shows, hosts, playlists, media, config };
}
