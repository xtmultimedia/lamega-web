// La Mega 99.9 — content data (ported from design-reference/data.jsx)

// Root-relative anchors ("/#x", not "#x") so they also work from sub-pages
// like /staff, where a bare fragment would resolve to nothing.
export const NAV_LINKS = [
  { label: "INICIO", href: "/#inicio" },
  { label: "PROGRAMACIÓN", href: "/#programacion" },
  { label: "MEGÁFONO", href: "/megafono" },
  { label: "STAFF", href: "/staff" },
  { label: "MEGA TV", href: "/#megatv" },
  { label: "GALERÍA", href: "/#galeria" },
  { label: "CONTACTO", href: "/#contacto" },
];

export const PROGRAMS = [
  {
    name: "MEGA CLICK", time: "08:00 – 10:00", slot: "MAÑANA", host: "Paulina Puga",
    blurb: "Los mejores hits del rock latino de los 80s al 2000 para encender la mañana.", hue: "#E31E24",
  },
  {
    name: "MEGAPOLIS", time: "10:00 – 13:00", slot: "MEDIODÍA", host: "Joselyn Hernández & Marcos Cruz",
    blurb: "Radio show con ritmos tropicales, humor y la mejor energía para tu jornada.", hue: "#FF2D34",
  },
  {
    name: "LOS DE LAS 6", time: "18:00 – 20:00", slot: "NOCHE", host: "Daniel Andrade & Verónica Villegas",
    blurb: "Música selecta de los 80s al 2000 con el mejor equipo para cerrar tu día.", hue: "#E31E24",
  },
];

export const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export const SCHEDULE = [
  { time: "07:00", name: "MEGA NOTICIAS",               hue: "#1683C8" },
  { time: "08:00", name: "MEGA CLICK",                  hue: "#E31E24" },
  { time: "10:00", name: "MEGAPOLIS",                   hue: "#FF2D34" },
  { time: "13:00", name: "CONEXIÓN 99",                 hue: "#D0307A" },
  { time: "16:00", name: "URBAN BEATS",                 hue: "#7A1FC4" },
  { time: "18:00", name: "LOS DE LAS 6",                hue: "#E31E24" },
  { time: "20:00", name: "LOS CÓMPLICES DE LA NOCHE",   hue: "#7A1FC4" },
  { time: "22:00", name: "Q' NOCHE LA DE ANOCHE",       hue: "#8E0F13" },
  { time: "23:00", name: "MEGA DJ",                     hue: "#1683C8" },
];

export const WEEKEND: Record<string, { time: string; name: string; hue: string }[]> = {
  "SÁB": [
    { time: "12:00", name: "LOS REYES DE LA SALSA", hue: "#FF2D34" },
    { time: "15:00", name: "MEGA DJ",               hue: "#D0307A" },
    { time: "19:00", name: "DJ TATTO",              hue: "#7A1FC4" },
    { time: "20:00", name: "BASTIAN V",             hue: "#1683C8" },
    { time: "21:00", name: "TOP 20",                hue: "#E31E24" },
  ],
  "DOM": [
    { time: "10:00", name: "BASTIAN V",         hue: "#1683C8" },
    { time: "11:00", name: "DJ TATTO",          hue: "#7A1FC4" },
    { time: "12:00", name: "TOP 20",            hue: "#E31E24" },
    { time: "14:00", name: "MEGA DJ",           hue: "#D0307A" },
    { time: "18:00", name: "MEGA LATIN ROCK",   hue: "#FF2D34" },
    { time: "20:00", name: "MEGA DJ",           hue: "#8E0F13" },
  ],
};

export const PLAYLISTS = [
  { name: "POP HITS",      count: 98,  hue1: "#FF2D34", hue2: "#D0307A", spotifyUrl: "https://l1nk.dev/4cy6bsf"    },
  { name: "URBANO",        count: 124, hue1: "#E31E24", hue2: "#7A1FC4", spotifyUrl: "https://acesse.one/f1j9hqp"  },
  { name: "HOUSE & DANCE", count: 112, hue1: "#1683C8", hue2: "#7A1FC4", spotifyUrl: "https://acesse.one/76yqhg0"  },
  { name: "ALTERNATIVO",   count: 76,  hue1: "#D0307A", hue2: "#8E0F13", spotifyUrl: "https://acesse.one/ftosqkg"  },
];

export const APP_FEATURES = [
  { icon: "radio", title: "Radio en vivo", desc: "La señal 99.9 FM en HD, sin cortes, donde estés." },
  { icon: "tv", title: "Mega TV", desc: "Mira la cabina y los shows en video, en directo." },
  { icon: "list-music", title: "Playlists", desc: "Todas nuestras listas sincronizadas con Spotify." },
  { icon: "bell-ring", title: "Notificaciones", desc: "Entérate de concursos y artistas invitados al instante." },
];
