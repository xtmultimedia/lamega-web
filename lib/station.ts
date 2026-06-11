import { prisma } from "./prisma";

// First-run seed: populates the editable tables with the design's demo
// content so the dashboard starts with something to edit.

const SHOW_SEED = [
  { name: "Megapolis", host: 'Andrés "El Búho" Vera', startTime: "06:00", endTime: "10:00", days: "semana", slot: "MAÑANA", blurb: "Arranca el día con la energía más alta del dial: noticias, humor y los hits que mueven Ecuador.", hue: "#E31E24", featured: true },
  { name: "El Ganado", host: "Dayanara Robles", startTime: "10:00", endTime: "14:00", days: "semana", slot: "MEDIODÍA", blurb: "El show del mediodía que lo gana todo. Reggaetón, retos al aire y la mejor conversación.", hue: "#FF2D34", featured: true },
  { name: "La Tarde Mega", host: "Kevin Mora", startTime: "14:00", endTime: "18:00", days: "semana", slot: "TARDE", blurb: "La banda sonora de tu tarde: pop, dance y los pedidos de toda la nación Mega.", hue: "#D0307A", featured: true },
  { name: "Mega Noche", host: "Camila Solís", startTime: "18:00", endTime: "22:00", days: "semana", slot: "NOCHE", blurb: "Baja revoluciones con flashbacks, rock latino y las historias que solo suenan de noche.", hue: "#7A1FC4", featured: true },
  { name: "Mega Mix", host: "Automático", startTime: "22:00", endTime: "06:00", days: "semana", hue: "#1683C8", featured: false },
  { name: "Sábado Gigante", host: "Automático", startTime: "08:00", endTime: "14:00", days: "sabado", hue: "#FF2D34", featured: false },
  { name: "La Hora del Perreo", host: "Automático", startTime: "14:00", endTime: "20:00", days: "sabado", hue: "#D0307A", featured: false },
  { name: "Mega Party", host: "Automático", startTime: "20:00", endTime: "02:00", days: "sabado", hue: "#7A1FC4", featured: false },
  { name: "Domingo Relax", host: "Automático", startTime: "09:00", endTime: "14:00", days: "domingo", hue: "#1683C8", featured: false },
  { name: "Top 9 Semanal", host: "Automático", startTime: "14:00", endTime: "20:00", days: "domingo", hue: "#E31E24", featured: false },
  { name: "Flashback", host: "Automático", startTime: "20:00", endTime: "00:00", days: "domingo", hue: "#7A1FC4", featured: false },
];

const HOST_SEED = [
  { name: "Andrés Vera", alias: "El Búho", show: "Megapolis", hue: "#E31E24", showsCount: 312 },
  { name: "Dayanara Robles", alias: "Daya", show: "El Ganado", hue: "#FF2D34", showsCount: 287 },
  { name: "Kevin Mora", alias: "Kevo", show: "La Tarde Mega", hue: "#D0307A", showsCount: 198 },
  { name: "Camila Solís", alias: "Cami", show: "Mega Noche", hue: "#7A1FC4", showsCount: 241 },
];

const PLAYLIST_SEED = [
  { name: "Reggaeton", count: 142, hue1: "#E31E24", hue2: "#7A1FC4" },
  { name: "Pop", count: 98, hue1: "#FF2D34", hue2: "#D0307A" },
  { name: "Rock", count: 76, hue1: "#8E0F13", hue2: "#222226" },
  { name: "Dance", count: 120, hue1: "#1683C8", hue2: "#7A1FC4" },
  { name: "Rock Latino", count: 64, hue1: "#D0307A", hue2: "#E31E24" },
  { name: "Flashback", count: 88, hue1: "#7A1FC4", hue2: "#1683C8" },
  { name: "Top 9", count: 9, hue1: "#FF2D34", hue2: "#8E0F13" },
];

export async function seedStationIfEmpty() {
  const [shows, hosts, playlists] = await Promise.all([
    prisma.show.count(),
    prisma.host.count(),
    prisma.playlist.count(),
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
  return { shows, hosts, playlists, media, config };
}
