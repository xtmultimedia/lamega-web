/* global React */
// La Mega 99.9 — content data

const NAV_LINKS = [
  { label: 'INICIO', href: '#inicio' },
  { label: 'PROGRAMACIÓN', href: '#programacion' },
  { label: 'MEGA TV', href: '#megatv' },
  { label: 'MEGA APP', href: '#megaapp' },
  { label: 'CONTACTO', href: '#contacto' },
];

// Featured shows (cards)
const PROGRAMS = [
  { name: 'MEGAPOLIS', time: '06:00 – 10:00', slot: 'MAÑANA', host: 'Andrés "El Búho" Vera',
    blurb: 'Arranca el día con la energía más alta del dial: noticias, humor y los hits que mueven Ecuador.', hue: '#E31E24' },
  { name: 'EL GANADO', time: '10:00 – 14:00', slot: 'MEDIODÍA', host: 'Dayanara Robles',
    blurb: 'El show del mediodía que lo gana todo. Reggaetón, retos al aire y la mejor conversación.', hue: '#FF2D34' },
  { name: 'LA TARDE MEGA', time: '14:00 – 18:00', slot: 'TARDE', host: 'Kevin Mora',
    blurb: 'La banda sonora de tu tarde: pop, dance y los pedidos de toda la nación Mega.', hue: '#D0307A' },
  { name: 'MEGA NOCHE', time: '18:00 – 22:00', slot: 'NOCHE', host: 'Camila Solís',
    blurb: 'Baja revoluciones con flashbacks, rock latino y las historias que solo suenan de noche.', hue: '#7A1FC4' },
];

const DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
// schedule rows: each block spans the week (weekday) with weekend variants
const SCHEDULE = [
  { time: '06:00', name: 'MEGAPOLIS', wk: true, hue: '#E31E24' },
  { time: '10:00', name: 'EL GANADO', wk: true, hue: '#FF2D34' },
  { time: '14:00', name: 'LA TARDE MEGA', wk: true, hue: '#D0307A' },
  { time: '18:00', name: 'MEGA NOCHE', wk: true, hue: '#7A1FC4' },
  { time: '22:00', name: 'MEGA MIX', wk: true, hue: '#1683C8' },
];
const WEEKEND = {
  'SÁB': [{ time: '08:00', name: 'SÁBADO GIGANTE', hue: '#FF2D34' }, { time: '14:00', name: 'LA HORA DEL PERREO', hue: '#D0307A' }, { time: '20:00', name: 'MEGA PARTY', hue: '#7A1FC4' }],
  'DOM': [{ time: '09:00', name: 'DOMINGO RELAX', hue: '#1683C8' }, { time: '14:00', name: 'TOP 9 SEMANAL', hue: '#E31E24' }, { time: '20:00', name: 'FLASHBACK', hue: '#7A1FC4' }],
};

const PLAYLISTS = [
  { name: 'REGGAETON', count: 142, hue1: '#E31E24', hue2: '#7A1FC4' },
  { name: 'POP', count: 98, hue1: '#FF2D34', hue2: '#D0307A' },
  { name: 'ROCK', count: 76, hue1: '#8E0F13', hue2: '#222226' },
  { name: 'DANCE', count: 120, hue1: '#1683C8', hue2: '#7A1FC4' },
  { name: 'ROCK LATINO', count: 64, hue1: '#D0307A', hue2: '#E31E24' },
  { name: 'FLASHBACK', count: 88, hue1: '#7A1FC4', hue2: '#1683C8' },
  { name: 'TOP 9', count: 9, hue1: '#FF2D34', hue2: '#8E0F13' },
];

const APP_FEATURES = [
  { icon: 'radio', title: 'Radio en vivo', desc: 'La señal 99.9 FM en HD, sin cortes, donde estés.' },
  { icon: 'tv', title: 'Mega TV', desc: 'Mira la cabina y los shows en video, en directo.' },
  { icon: 'list-music', title: 'Playlists', desc: 'Todas nuestras listas sincronizadas con Spotify.' },
  { icon: 'bell-ring', title: 'Notificaciones', desc: 'Entérate de concursos y artistas invitados al instante.' },
];

Object.assign(window, { NAV_LINKS, PROGRAMS, DAYS, SCHEDULE, WEEKEND, PLAYLISTS, APP_FEATURES });
