/* global React, ReactDOM */
// La Mega 99.9 — Admin Dashboard: shell, primitives, shared data

const { useState, useEffect, useRef } = React;

/* ---------- Icon ---------- */
function Icon({ name, size = 20, color, strokeWidth = 2, style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = `<i data-lucide="${name}"></i>`;
      window.lucide.createIcons({ attrs: { 'stroke-width': strokeWidth } });
    }
  }, [name, strokeWidth]);
  return <span ref={ref} style={{ display: 'inline-flex', width: size, height: size, color, ...style }} />;
}

/* ---------- Card ---------- */
function Card({ children, style = {}, pad = 22, hover = false }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => hover && setH(true)} onMouseLeave={() => setH(false)} style={{
      background: 'var(--bg-1)', border: `1px solid ${h ? 'var(--line-red)' : 'var(--line-1)'}`,
      borderRadius: 'var(--r-md)', padding: pad, boxShadow: 'var(--shadow-md)',
      transition: 'all var(--dur) var(--ease-out)', ...style,
    }}>{children}</div>
  );
}

/* ---------- Badge ---------- */
const BADGE = {
  pendiente: { c: '#E0A82E', label: 'Pendiente' },
  alaire: { c: '#FF2D34', label: 'Al aire', pulse: true },
  rechazada: { c: '#6B6B72', label: 'Rechazada' },
  dedicatoria: { c: '#A855F7', label: 'Dedicatoria' },
  solicitud: { c: '#16C8E8', label: 'Solicitud' },
  activa: { c: '#1DB954', label: 'Activa' },
  pausada: { c: '#6B6B72', label: 'Pausada' },
};
function Badge({ kind, children }) {
  const b = BADGE[kind] || { c: 'var(--fg-3)', label: children };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 'var(--r-pill)',
      background: `${b.c}1f`, border: `1px solid ${b.c}55`, color: b.c,
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {b.pulse && <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.c, animation: 'pulse-dot 1.3s infinite' }} />}
      {children || b.label}
    </span>
  );
}

/* ---------- Toggle ---------- */
function Toggle({ on, onChange, color = 'var(--red)' }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} style={{
      position: 'relative', width: 44, height: 25, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0,
      background: on ? color : 'var(--bg-4)', boxShadow: on ? '0 0 16px ' + (color === 'var(--red)' ? 'rgba(255,45,52,0.5)' : 'rgba(29,185,84,0.4)') : 'none',
      transition: 'background var(--dur), box-shadow var(--dur)',
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left var(--dur) var(--ease-out)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

/* ---------- Button ---------- */
function AdmButton({ children, variant = 'primary', icon, onClick, style = {}, full = false }) {
  const [h, setH] = useState(false);
  const V = {
    primary: { background: 'linear-gradient(180deg, var(--red-bright), var(--red))', color: '#fff', boxShadow: h ? '0 0 26px rgba(255,45,52,0.6)' : 'var(--glow-red)' },
    ghost: { background: h ? 'var(--bg-3)' : 'var(--bg-2)', color: '#fff', border: '1px solid var(--line-2)' },
    danger: { background: h ? '#ff1a22' : 'transparent', color: h ? '#fff' : '#FF2D34', border: '1px solid #FF2D34', boxShadow: h ? '0 0 26px rgba(255,45,52,0.55)' : 'none' },
  };
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: full ? '100%' : 'auto',
      padding: '12px 18px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: '0.04em',
      transition: 'all var(--dur)', ...V[variant], ...style,
    }}>
      {icon && <Icon name={icon} size={16} />}{children}
    </button>
  );
}

/* ---------- View title ---------- */
function ViewTitle({ kicker, title, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 26 }}>
      <div>
        {kicker && <div className="mono" style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--red-bright)', textTransform: 'uppercase', marginBottom: 10 }}>{kicker}</div>}
        <h1 className="display" style={{ fontSize: 'clamp(26px, 3vw, 34px)', color: '#fff', margin: 0 }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   DATA
   ============================================================ */
const ADM_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'programacion', label: 'Programación', icon: 'calendar-days' },
  { id: 'locutores', label: 'Locutores', icon: 'mic' },
  { id: 'playlists', label: 'Playlists', icon: 'list-music' },
  { id: 'publicidad', label: 'Publicidad', icon: 'megaphone' },
  { id: 'solicitudes', label: 'Solicitudes', icon: 'inbox', badge: 47 },
  { id: 'configuracion', label: 'Configuración', icon: 'settings' },
];

const STATS = [
  { label: 'Oyentes en vivo', value: '4,821', icon: 'radio', hue: '#FF2D34', live: true, delta: '+312 hoy' },
  { label: 'Solicitudes hoy', value: '47', icon: 'inbox', hue: '#16C8E8', delta: '12 pendientes' },
  { label: 'Campañas activas', value: '12', icon: 'megaphone', hue: '#A855F7', delta: '3 nuevas' },
  { label: 'Canciones en cola', value: '8', icon: 'list-music', hue: '#1DB954', delta: '~26 min' },
];

const SOLICITUDES = [
  { hora: '14:32', oyente: 'Mariana C.', cancion: 'Provenza', artista: 'Karol G', tipo: 'dedicatoria', estado: 'alaire' },
  { hora: '14:28', oyente: 'Josué V.', cancion: 'La Bachata', artista: 'Manuel Turizo', tipo: 'solicitud', estado: 'pendiente' },
  { hora: '14:21', oyente: 'Andrea L.', cancion: 'TQG', artista: 'Karol G, Shakira', tipo: 'dedicatoria', estado: 'pendiente' },
  { hora: '14:15', oyente: 'Carlos M.', cancion: 'Despechá', artista: 'Rosalía', tipo: 'solicitud', estado: 'rechazada' },
  { hora: '14:09', oyente: 'Valentina R.', cancion: 'El Ganado', artista: 'Dayanara', tipo: 'solicitud', estado: 'alaire' },
  { hora: '13:58', oyente: 'Diego P.', cancion: 'Ojitos Lindos', artista: 'Bad Bunny', tipo: 'dedicatoria', estado: 'pendiente' },
  { hora: '13:47', oyente: 'Sofía G.', cancion: 'Monotonía', artista: 'Shakira, Ozuna', tipo: 'solicitud', estado: 'pendiente' },
  { hora: '13:39', oyente: 'Luis T.', cancion: 'Me Porto Bonito', artista: 'Bad Bunny', tipo: 'solicitud', estado: 'rechazada' },
];

const SHOWS = [
  { time: '06:00', name: 'Megapolis', host: 'Andrés Vera', on: true, hue: '#E31E24' },
  { time: '10:00', name: 'El Ganado', host: 'Dayanara Robles', on: true, hue: '#FF2D34' },
  { time: '14:00', name: 'La Tarde Mega', host: 'Kevin Mora', on: true, hue: '#D0307A' },
  { time: '18:00', name: 'Mega Noche', host: 'Camila Solís', on: true, hue: '#7A1FC4' },
  { time: '22:00', name: 'Mega Mix', host: 'Automático', on: false, hue: '#16C8E8' },
];
const HOSTS = ['Andrés Vera', 'Dayanara Robles', 'Kevin Mora', 'Camila Solís', 'Automático'];

const CAMPANAS = [
  { adv: 'Banco Pichincha', name: 'Crédito Verano 2026', range: '01 Jun – 30 Jun', spots: 8, on: true },
  { adv: 'Claro Ecuador', name: 'Plan Ilimitado 5G', range: '10 Jun – 10 Jul', spots: 12, on: true },
  { adv: 'KFC', name: 'Bucket Familiar', range: '05 Jun – 20 Jun', spots: 6, on: true },
  { adv: 'Movistar', name: 'Recarga y Gana', range: '15 May – 15 Jun', spots: 5, on: false },
  { adv: 'Pilsener', name: 'Conexión Mundial', range: '01 Jun – 15 Jul', spots: 10, on: true },
];

const LOCUTORES = [
  { name: 'Andrés Vera', alias: 'El Búho', show: 'Megapolis', hue: '#E31E24', shows: 312 },
  { name: 'Dayanara Robles', alias: 'Daya', show: 'El Ganado', hue: '#FF2D34', shows: 287 },
  { name: 'Kevin Mora', alias: 'Kevo', show: 'La Tarde Mega', hue: '#D0307A', shows: 198 },
  { name: 'Camila Solís', alias: 'Cami', show: 'Mega Noche', hue: '#7A1FC4', shows: 241 },
];

const ADM_PLAYLISTS = [
  { name: 'Reggaeton', count: 142, hue: '#E31E24' },
  { name: 'Pop', count: 98, hue: '#FF2D34' },
  { name: 'Rock', count: 76, hue: '#8E0F13' },
  { name: 'Dance', count: 120, hue: '#16C8E8' },
  { name: 'Rock Latino', count: 64, hue: '#D0307A' },
  { name: 'Flashback', count: 88, hue: '#7A1FC4' },
  { name: 'Top 9', count: 9, hue: '#1DB954' },
];

/* ============================================================
   SHELL: Sidebar + Topbar + App
   ============================================================ */
function Sidebar({ active, onSelect, open, onClose }) {
  return (
    <>
      <div onClick={onClose} className="adm-backdrop" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity var(--dur)',
      }} />
      <aside className="adm-sidebar" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 256, zIndex: 50,
        background: '#0c0c0e', borderRight: '1px solid var(--line-1)',
        display: 'flex', flexDirection: 'column', padding: '22px 16px',
        transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform var(--dur) var(--ease-out)',
      }}>
        <a href="La Mega 99.9.html" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 22px' }}>
          <img src="assets/mega-logo.png" alt="La Mega" style={{ height: 30, filter: 'drop-shadow(0 3px 10px rgba(227,30,36,0.45))' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#fff', background: 'linear-gradient(180deg, var(--red-bright), var(--red))', padding: '3px 7px', borderRadius: 4, letterSpacing: '0.06em' }}>99.9 FM</span>
        </a>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--fg-3)', padding: '0 8px 12px', textTransform: 'uppercase' }}>Panel de control</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {ADM_NAV.map((n) => {
            const on = active === n.id;
            return (
              <button key={n.id} onClick={() => { onSelect(n.id); onClose(); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 'var(--r-sm)',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                background: on ? 'linear-gradient(90deg, rgba(227,30,36,0.18), rgba(227,30,36,0.02))' : 'transparent',
                color: on ? '#fff' : 'var(--fg-2)', position: 'relative',
                fontFamily: 'var(--font-body)', fontWeight: on ? 600 : 500, fontSize: 14, transition: 'all var(--dur)',
              }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--bg-2)'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                {on && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 999, background: 'var(--red-bright)', boxShadow: 'var(--glow-red)' }} />}
                <Icon name={n.icon} size={19} color={on ? 'var(--red-bright)' : 'var(--fg-3)'} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--red)', padding: '2px 7px', borderRadius: 999 }}>{n.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: '1px solid var(--line-1)', paddingTop: 14, marginTop: 8 }}>
          <a href="Formulario.html" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 'var(--r-sm)', color: 'var(--fg-2)', fontSize: 13, marginBottom: 6 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-2)'; }}>
            <Icon name="external-link" size={16} color="var(--red-bright)" /> Formulario público
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 8px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--red), var(--red-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: 14 }}>MR</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>María Reyes</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>Productora</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu, title }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30, height: 68, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 clamp(16px, 3vw, 32px)', background: 'rgba(10,10,10,0.8)',
      WebkitBackdropFilter: 'blur(18px)', backdropFilter: 'blur(18px)', borderBottom: '1px solid var(--line-1)',
    }}>
      <button onClick={onMenu} className="adm-burger" aria-label="Menú" style={{ display: 'none', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', width: 42, height: 42, color: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="menu" size={20} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>La Mega <span style={{ color: 'var(--red)' }}>99.9</span></span>
        <span className="adm-live" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 999, background: 'rgba(227,30,36,0.12)', border: '1px solid var(--line-red)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red-bright)', animation: 'pulse-dot 1.3s infinite' }} />
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#fff' }}>EN VIVO</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button aria-label="Notificaciones" style={{ position: 'relative', width: 42, height: 42, borderRadius: 'var(--r-sm)', background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--fg-1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={18} />
          <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: '50%', background: 'var(--red-bright)', boxShadow: '0 0 8px var(--red-bright)' }} />
        </button>
        <div className="adm-avatar" style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--red), var(--red-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: 14 }}>MR</div>
        <a href="La Mega 99.9.html" aria-label="Salir" title="Cerrar sesión" style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--fg-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="log-out" size={18} />
        </a>
      </div>
    </header>
  );
}

function AdminApp() {
  const [active, setActive] = useState('dashboard');
  const [sidebar, setSidebar] = useState(false);
  const View = (window.ADM_VIEWS && window.ADM_VIEWS[active]) || (() => null);

  // open sidebar by default on desktop
  useEffect(() => {
    const apply = () => setSidebar(window.innerWidth > 1024);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  return (
    <div style={{ minHeight: '100vh', color: 'var(--fg-1)' }}>
      <Sidebar active={active} onSelect={setActive} open={sidebar} onClose={() => { if (window.innerWidth <= 1024) setSidebar(false); }} />
      <div className="adm-main" style={{ marginLeft: 256, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Topbar onMenu={() => setSidebar(true)} />
        <main className="adm-scroll" style={{ flex: 1, padding: 'clamp(20px, 3vw, 36px)', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          <View />
        </main>
      </div>
      <style>{`
        @media (max-width: 1024px){
          .adm-main{ margin-left: 0 !important; }
          .adm-burger{ display: inline-flex !important; }
        }
        @media (min-width: 1025px){ .adm-backdrop{ display:none !important; } }
        @media (max-width: 560px){ .adm-live{ display:none !important; } }
      `}</style>
    </div>
  );
}

Object.assign(window, { Icon, Card, Badge, Toggle, AdmButton, ViewTitle, AdminApp,
  STATS, SOLICITUDES, SHOWS, HOSTS, CAMPANAS, LOCUTORES, ADM_PLAYLISTS });
