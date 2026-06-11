/* global React */
// La Mega 99.9 — shared primitives + global player store

const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

/* ---------- Lucide icon ---------- */
function Icon({ name, size = 20, color, strokeWidth = 2, style = {}, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = `<i data-lucide="${name}"></i>`;
      window.lucide.createIcons({ attrs: { 'stroke-width': strokeWidth } });
    }
  }, [name, strokeWidth]);
  return (
    <span ref={ref} className={'ic ' + className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color, ...style }} />
  );
}

/* ---------- Section wrapper + scroll reveal ---------- */
let __revealInit = false;
function __scanReveal() {
  document.querySelectorAll('.reveal:not(.in)').forEach((n) => {
    const r = n.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) n.classList.add('in');
  });
}
function __ensureRevealController() {
  if (__revealInit) return;
  __revealInit = true;
  window.addEventListener('scroll', __scanReveal, { passive: true });
  window.addEventListener('resize', __scanReveal);
}
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    __ensureRevealController();
    requestAnimationFrame(__scanReveal);
    const t = setTimeout(__scanReveal, 160);
    return () => clearTimeout(t);
  }, []);
  return ref;
}

function Section({ id, children, style = {}, max = 1240, pad = '132px 48px' }) {
  const ref = useReveal();
  return (
    <section id={id} ref={ref} style={{ padding: pad, position: 'relative', ...style }}>
      <div style={{ maxWidth: max, margin: '0 auto', position: 'relative', zIndex: 1 }}>{children}</div>
    </section>
  );
}

/* ---------- Unified section header ---------- */
function SectionHead({ index, kicker, title, lead, align = 'left', accent = 'var(--red-bright)', max = 640 }) {
  const center = align === 'center';
  return (
    <div className="reveal" style={{ marginBottom: 64, textAlign: center ? 'center' : 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: center ? 'center' : 'flex-start', marginBottom: 22 }}>
        {index && <span className="sec-index">{index}</span>}
        <span className="kicker" style={{ color: accent }}>{kicker}</span>
        <span style={{ flex: center ? 'none' : 1, height: 1, width: center ? 40 : 'auto', background: 'linear-gradient(90deg, var(--line-red), transparent)' }} />
      </div>
      <h2 className="h2">{title}</h2>
      {lead && <p className="lead" style={{ maxWidth: max, margin: center ? '24px auto 0' : '24px 0 0' }}>{lead}</p>}
    </div>
  );
}

/* ---------- Atmospheric red bloom ---------- */
function Bloom({ x, y, size = 520, color = 'rgba(227,30,36,0.22)', opacity = 1 }) {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', left: x, top: y, width: size, height: size, opacity,
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      pointerEvents: 'none', filter: 'blur(14px)', zIndex: 0,
    }} />
  );
}

/* ---------- Button ---------- */
function Button({ children, variant = 'primary', icon, iconLeft, onClick, href, style = {}, size = 'md' }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const pad = size === 'lg' ? '17px 30px' : size === 'sm' ? '10px 16px' : '14px 24px';
  const base = {
    fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', fontSize: size === 'lg' ? 15 : 13.5, border: 'none',
    borderRadius: 'var(--r-sm)', padding: pad, cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', gap: 9,
    transition: 'all var(--dur) var(--ease-out)', whiteSpace: 'nowrap', textDecoration: 'none',
    transform: press ? 'scale(0.96)' : hover ? 'translateY(-2px)' : 'none',
  };
  const variants = {
    primary: {
      background: 'linear-gradient(180deg, var(--red-bright), var(--red))', color: '#fff',
      boxShadow: hover ? '0 0 38px rgba(255,45,52,0.7)' : 'var(--glow-red)',
    },
    outline: {
      background: hover ? 'rgba(227,30,36,0.10)' : 'transparent', color: 'var(--fg-1)',
      border: '1px solid var(--red)',
      boxShadow: hover ? '0 0 22px rgba(255,45,52,0.35)' : 'none',
    },
    ghost: {
      background: hover ? 'var(--bg-3)' : 'var(--bg-2)', color: 'var(--fg-1)',
      border: '1px solid var(--line-2)',
    },
    spotify: {
      background: hover ? '#1ed760' : 'var(--green)', color: '#06150c',
      boxShadow: hover ? 'var(--glow-green)' : 'none',
    },
  };
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} style={{ ...base, ...variants[variant], ...style }} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}>
      {iconLeft && <Icon name={iconLeft} size={size === 'lg' ? 18 : 16} />}
      {children}
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
    </Tag>
  );
}

/* ---------- Live "EN VIVO" badge ---------- */
function OnAir({ compact = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: compact ? '5px 10px' : '7px 13px', borderRadius: 'var(--r-pill)',
      background: 'rgba(227,30,36,0.12)', border: '1px solid var(--line-red)',
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em',
      color: '#fff', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      <span style={{ position: 'relative', width: 9, height: 9 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--red-bright)', animation: 'pulse-dot 1.4s var(--ease-out) infinite' }} />
        <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '2px solid var(--red-bright)', animation: 'pulse-ring 1.6s var(--ease-out) infinite' }} />
      </span>
      EN VIVO
    </span>
  );
}

/* ---------- social icon definitions (brand glyphs as inline SVG) ---------- */
const SOCIAL = {
  instagram: { label: 'Instagram', color: '#E1306C', path: 'M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.62c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.18.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.42-.35 1.04-.4 2.18C2.4 8.94 2.4 9.3 2.4 12s0 3.06.06 4.3c.05 1.14.24 1.76.4 2.18.22.55.47.94.88 1.35.41.41.8.66 1.35.88.42.16 1.04.35 2.18.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.18-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.42.35-1.04.4-2.18.06-1.24.07-1.59.07-4.3s-.01-3.06-.07-4.3c-.05-1.14-.24-1.76-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.16-1.04-.35-2.18-.4-1.24-.06-1.59-.07-4.74-.07Zm0 2.76a5.42 5.42 0 1 1 0 10.84 5.42 5.42 0 0 1 0-10.84Zm0 1.62a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm5.6-2.9a1.27 1.27 0 1 1 0 2.54 1.27 1.27 0 0 1 0-2.54Z' },
  tiktok: { label: 'TikTok', color: '#fff', path: 'M16.6 5.82a4.28 4.28 0 0 1-1.07-2.82h-3.1v12.3a2.55 2.55 0 0 1-2.55 2.47 2.55 2.55 0 1 1 .73-5l.01-3.16a5.67 5.67 0 0 0-.74-.05 5.67 5.67 0 1 0 5.67 5.67V8.9a7.34 7.34 0 0 0 4.3 1.38V7.17a4.28 4.28 0 0 1-3.25-1.35Z' },
  facebook: { label: 'Facebook', color: '#1877F2', path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z' },
  youtube: { label: 'YouTube', color: '#FF0000', path: 'M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41A2.51 2.51 0 0 0 2.42 7.2 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.78A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.42-4.81ZM10 15V9l5.2 3-5.2 3Z' },
  spotify: { label: 'Spotify', color: '#1DB954', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.43a.62.62 0 0 1-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 1 1-.28-1.21c3.81-.87 7.08-.5 9.72 1.11.3.18.39.57.21.85Zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 1 1-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.25 1.07Zm.11-2.84C14.8 8.96 9.4 8.78 6.3 9.72a.93.93 0 1 1-.54-1.78c3.56-1.08 9.52-.87 13.28 1.36a.93.93 0 1 1-.95 1.6Z' },
};

function SocialIcon({ name, size = 20, glow = false, style = {} }) {
  const s = SOCIAL[name];
  if (!s) return null;
  const [hover, setHover] = useState(false);
  return (
    <a href="#" aria-label={s.label} onClick={(e) => e.preventDefault()}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size + 22, height: size + 22, borderRadius: 'var(--r-sm)',
        border: '1px solid var(--line-2)',
        background: hover ? 'var(--bg-3)' : 'var(--bg-2)',
        transition: 'all var(--dur) var(--ease-out)',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? `0 0 22px ${s.color}66` : 'none', ...style,
      }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
        fill={hover ? s.color : 'var(--fg-2)'} style={{ transition: 'fill var(--dur)' }}>
        <path d={s.path} />
      </svg>
    </a>
  );
}

/* ============================================================
   GLOBAL PLAYER STORE
   ============================================================ */
const PlayerCtx = createContext(null);
const usePlayer = () => useContext(PlayerCtx);

const TRACKS = [
  { title: 'EL GANADO', artist: 'Dayanara', show: 'El Ganado', dur: 213, hue: '#E31E24' },
  { title: 'PROVENZA', artist: 'Karol G', show: 'La Tarde Mega', dur: 211, hue: '#D0307A' },
  { title: 'TQG', artist: 'Karol G, Shakira', show: 'Mega Noche', dur: 199, hue: '#7A1FC4' },
  { title: 'LA BACHATA', artist: 'Manuel Turizo', show: 'Megapolis', dur: 167, hue: '#1683C8' },
];

function PlayerProvider({ children }) {
  const KEY = 'lamega.player.v1';
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const [index, setIndex] = useState(saved.index ?? 0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(saved.progress ?? 0); // seconds
  const [volume, setVolume] = useState(saved.volume ?? 0.8);
  const track = TRACKS[index];

  // tick
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p + 1 >= track.dur) { setIndex((i) => (i + 1) % TRACKS.length); return 0; }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, track.dur]);

  // persist
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ index, progress, volume })); } catch {}
  }, [index, progress, volume]);

  const next = useCallback(() => { setIndex((i) => (i + 1) % TRACKS.length); setProgress(0); }, []);
  const prev = useCallback(() => { setIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length); setProgress(0); }, []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const seek = useCallback((frac) => setProgress(Math.max(0, Math.min(1, frac)) * track.dur), [track.dur]);

  const value = { track, index, playing, progress, volume, setVolume, next, prev, toggle, seek, TRACKS };
  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

function fmt(s) {
  s = Math.floor(s || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

Object.assign(window, {
  Icon, Section, SectionHead, useReveal, Bloom, Button, OnAir, SocialIcon, SOCIAL,
  PlayerProvider, usePlayer, PlayerCtx, TRACKS, fmt,
});
