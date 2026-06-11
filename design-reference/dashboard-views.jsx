/* global React, Icon, Card, Badge, Toggle, AdmButton, ViewTitle, STATS, SOLICITUDES, SHOWS, HOSTS, CAMPANAS, LOCUTORES, ADM_PLAYLISTS */
// La Mega 99.9 — Admin Dashboard views

const { useState } = React;

/* ---------- Stat card ---------- */
function StatCard({ s }) {
  return (
    <Card hover pad={20} style={{ position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${s.hue}33, transparent 70%)` }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', background: `${s.hue}1f`, border: `1px solid ${s.hue}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={s.icon} size={20} color={s.hue} />
        </span>
        {s.live && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.hue, animation: 'pulse-dot 1.3s infinite', boxShadow: `0 0 10px ${s.hue}` }} />
          <span className="mono" style={{ fontSize: 10, color: s.hue, fontWeight: 700 }}>LIVE</span>
        </span>}
      </div>
      <div className="display" style={{ fontSize: 36, color: '#fff', lineHeight: 1 }}>{s.value}</div>
      <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 6 }}>{s.label}</div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 10 }}>{s.delta}</div>
    </Card>
  );
}

function StatsRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 26 }}>
      {STATS.map((s) => <StatCard key={s.label} s={s} />)}
    </div>
  );
}

/* ---------- Quick actions ---------- */
function QuickActions() {
  const [toast, setToast] = useState(null);
  const fire = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };
  return (
    <Card style={{ marginBottom: 26 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 16 }}>Acciones rápidas</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <AdmButton icon="play" onClick={() => fire('Canción enviada a cabina · al aire en segundos')}>Poner canción al aire</AdmButton>
        <AdmButton variant="ghost" icon="megaphone" onClick={() => fire('Anuncio urgente programado')}>Anuncio urgente</AdmButton>
        <AdmButton variant="danger" icon="triangle-alert" onClick={() => fire('⚠ Modo emergencia ACTIVADO')}>Modo emergencia</AdmButton>
      </div>
      {toast && (
        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--r-sm)', background: 'rgba(29,185,84,0.12)', border: '1px solid rgba(29,185,84,0.4)', color: '#5fe08a', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
          <Icon name="check-circle" size={17} color="#1DB954" />{toast}
        </div>
      )}
    </Card>
  );
}

/* ---------- Solicitudes table ---------- */
function SolicitudesTable({ limit }) {
  const [rows, setRows] = useState(SOLICITUDES);
  const setEstado = (i, estado) => setRows((r) => r.map((x, j) => j === i ? { ...x, estado } : x));
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)' }}>
              {['Hora', 'Oyente', 'Canción / Artista', 'Tipo', 'Estado', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--line-1)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td className="mono" style={{ padding: '13px 18px', fontSize: 13, color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>{r.hora}</td>
                <td style={{ padding: '13px 18px', fontSize: 14, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.oyente}</td>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ fontSize: 14, color: '#fff' }}>{r.cancion}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>{r.artista}</div>
                </td>
                <td style={{ padding: '13px 18px' }}><Badge kind={r.tipo} /></td>
                <td style={{ padding: '13px 18px' }}><Badge kind={r.estado} /></td>
                <td style={{ padding: '13px 14px' }}>
                  {r.estado === 'pendiente' ? (
                    <div style={{ display: 'flex', gap: 7 }}>
                      <IconBtn icon="check" color="#1DB954" title="Poner al aire" onClick={() => setEstado(i, 'alaire')} />
                      <IconBtn icon="x" color="#FF2D34" title="Rechazar" onClick={() => setEstado(i, 'rechazada')} />
                    </div>
                  ) : <Icon name="more-horizontal" size={18} color="var(--fg-3)" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
function IconBtn({ icon, color, title, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      width: 32, height: 32, borderRadius: 'var(--r-xs)', cursor: 'pointer',
      background: h ? `${color}22` : 'var(--bg-3)', border: `1px solid ${h ? color : 'var(--line-2)'}`,
      color: h ? color : 'var(--fg-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--dur)',
    }}><Icon name={icon} size={16} /></button>
  );
}

/* ============================================================
   VIEWS
   ============================================================ */
function DashboardView() {
  return (
    <>
      <ViewTitle kicker="Resumen en vivo" title="Dashboard" />
      <StatsRow />
      <QuickActions />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 20, color: '#fff', margin: 0 }}>Solicitudes recientes</h2>
        <span className="mono" style={{ fontSize: 12, color: 'var(--red-bright)', cursor: 'pointer' }}>Ver todas →</span>
      </div>
      <SolicitudesTable limit={6} />
    </>
  );
}

function SolicitudesView() {
  const [filter, setFilter] = useState('todas');
  const chips = ['todas', 'pendiente', 'alaire', 'rechazada'];
  const label = { todas: 'Todas', pendiente: 'Pendientes', alaire: 'Al aire', rechazada: 'Rechazadas' };
  return (
    <>
      <ViewTitle kicker="Bandeja de entrada" title="Solicitudes" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {chips.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '9px 16px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
            border: `1px solid ${filter === c ? 'var(--red)' : 'var(--line-2)'}`,
            background: filter === c ? 'rgba(227,30,36,0.14)' : 'var(--bg-2)',
            color: filter === c ? '#fff' : 'var(--fg-2)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.03em',
          }}>{label[c]}</button>
        ))}
      </div>
      <FilteredSolicitudes filter={filter} />
    </>
  );
}
function FilteredSolicitudes({ filter }) {
  const [rows, setRows] = useState(SOLICITUDES);
  const setEstado = (idx, estado) => setRows((r) => r.map((x, j) => j === idx ? { ...x, estado } : x));
  const view = filter === 'todas' ? rows : rows.filter((r) => r.estado === filter);
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead><tr style={{ background: 'var(--bg-2)' }}>
            {['Hora', 'Oyente', 'Canción / Artista', 'Tipo', 'Estado', ''].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {view.map((r) => {
              const idx = rows.indexOf(r);
              return (
                <tr key={idx} style={{ borderTop: '1px solid var(--line-1)' }}>
                  <td className="mono" style={{ padding: '13px 18px', fontSize: 13, color: 'var(--fg-2)' }}>{r.hora}</td>
                  <td style={{ padding: '13px 18px', fontSize: 14, color: '#fff', fontWeight: 600 }}>{r.oyente}</td>
                  <td style={{ padding: '13px 18px' }}><div style={{ fontSize: 14, color: '#fff' }}>{r.cancion}</div><div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>{r.artista}</div></td>
                  <td style={{ padding: '13px 18px' }}><Badge kind={r.tipo} /></td>
                  <td style={{ padding: '13px 18px' }}><Badge kind={r.estado} /></td>
                  <td style={{ padding: '13px 14px' }}>
                    {r.estado === 'pendiente' ? (
                      <div style={{ display: 'flex', gap: 7 }}>
                        <IconBtn icon="check" color="#1DB954" title="Al aire" onClick={() => setEstado(idx, 'alaire')} />
                        <IconBtn icon="x" color="#FF2D34" title="Rechazar" onClick={() => setEstado(idx, 'rechazada')} />
                      </div>
                    ) : <Icon name="more-horizontal" size={18} color="var(--fg-3)" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- Programación editor ---------- */
function ProgramacionView() {
  const [shows, setShows] = useState(SHOWS);
  const [drag, setDrag] = useState(null);
  const onDrop = (i) => {
    if (drag === null || drag === i) return;
    setShows((s) => { const c = [...s]; const [m] = c.splice(drag, 1); c.splice(i, 0, m); return c; });
    setDrag(null);
  };
  const setHost = (i, host) => setShows((s) => s.map((x, j) => j === i ? { ...x, host } : x));
  const toggle = (i) => setShows((s) => s.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  return (
    <>
      <ViewTitle kicker="Parrilla editable" title="Programación">
        <AdmButton icon="plus">Nuevo programa</AdmButton>
      </ViewTitle>
      <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="grip-vertical" size={15} /> Arrastra los bloques para reordenar la parrilla
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shows.map((s, i) => (
          <div key={s.name} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 'var(--r-md)',
              background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderLeft: `4px solid ${s.hue}`,
              opacity: drag === i ? 0.4 : 1, cursor: 'grab', transition: 'opacity var(--dur)', flexWrap: 'wrap',
            }}>
            <Icon name="grip-vertical" size={18} color="var(--fg-3)" style={{ flexShrink: 0 }} />
            <span className="mono" style={{ fontSize: 15, color: s.hue, minWidth: 56, fontWeight: 700 }}>{s.time}</span>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div className="display" style={{ fontSize: 18, color: '#fff' }}>{s.name}</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="mic" size={15} color="var(--fg-3)" />
              <select value={s.host} onChange={(e) => setHost(i, e.target.value)} style={{
                background: 'var(--bg-3)', border: '1px solid var(--line-2)', color: '#fff', borderRadius: 'var(--r-sm)',
                padding: '8px 10px', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
              }}>
                {HOSTS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className="mono" style={{ fontSize: 11, color: s.on ? '#1DB954' : 'var(--fg-3)', minWidth: 30 }}>{s.on ? 'ON' : 'OFF'}</span>
              <Toggle on={s.on} onChange={() => toggle(i)} color="var(--green)" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Publicidad ---------- */
function PublicidadView() {
  const [list, setList] = useState(CAMPANAS);
  const toggle = (i) => setList((l) => l.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  const del = (i) => setList((l) => l.filter((_, j) => j !== i));
  return (
    <>
      <ViewTitle kicker="Campañas publicitarias" title="Publicidad">
        <AdmButton icon="plus">Nueva campaña</AdmButton>
      </ViewTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((c, i) => (
          <Card key={c.adv + c.name} pad={18} hover>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ width: 46, height: 46, borderRadius: 'var(--r-sm)', background: 'var(--bg-3)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="building-2" size={20} color="var(--fg-2)" />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{c.adv}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{c.name}</div>
              </div>
              <div style={{ minWidth: 130 }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{c.range}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 3 }}>{c.spots} spots/día</div>
              </div>
              <Badge kind={c.on ? 'activa' : 'pausada'} />
              <Toggle on={c.on} onChange={() => toggle(i)} color="var(--green)" />
              <div style={{ display: 'flex', gap: 7 }}>
                <IconBtn icon="pencil" color="#16C8E8" title="Editar" onClick={() => {}} />
                <IconBtn icon="trash-2" color="#FF2D34" title="Eliminar" onClick={() => del(i)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ---------- Locutores ---------- */
function LocutoresView() {
  return (
    <>
      <ViewTitle kicker="Equipo al aire" title="Locutores">
        <AdmButton icon="user-plus">Añadir locutor</AdmButton>
      </ViewTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {LOCUTORES.map((l) => (
          <Card key={l.name} hover style={{ textAlign: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 14px', background: `radial-gradient(circle at 35% 30%, ${l.hue}, #150708)`, border: '2px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="mic" size={30} color="#fff" />
            </div>
            <div className="display" style={{ fontSize: 19, color: '#fff' }}>{l.name}</div>
            <div className="mono" style={{ fontSize: 12, color: l.hue, margin: '4px 0 12px' }}>"{l.alias}"</div>
            <div style={{ display: 'inline-flex', padding: '5px 12px', borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--line-1)', fontSize: 12, color: 'var(--fg-2)' }}>{l.show}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 12 }}>{l.shows} programas al aire</div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ---------- Playlists ---------- */
function PlaylistsView() {
  return (
    <>
      <ViewTitle kicker="Listas en rotación" title="Playlists">
        <AdmButton icon="plus">Nueva playlist</AdmButton>
      </ViewTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ADM_PLAYLISTS.map((p) => (
          <Card key={p.name} pad={16} hover>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', background: `linear-gradient(135deg, ${p.hue}, #150708)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="music" size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="display" style={{ fontSize: 17, color: '#fff' }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{p.count} canciones</div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <IconBtn icon="pencil" color="#16C8E8" title="Editar" onClick={() => {}} />
                <IconBtn icon="external-link" color="#1DB954" title="Abrir en Spotify" onClick={() => {}} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ---------- Configuración ---------- */
function ConfiguracionView() {
  const [cfg, setCfg] = useState({ stream: true, push: true, tv: true, mant: false, auto: true });
  const set = (k) => (v) => setCfg((c) => ({ ...c, [k]: v }));
  const rows = [
    { k: 'stream', label: 'Stream en vivo', desc: 'Transmisión 99.9 FM activa en la web y la app.' },
    { k: 'tv', label: 'Mega TV', desc: 'Señal de video en directo desde la cabina.' },
    { k: 'push', label: 'Notificaciones push', desc: 'Alertas de concursos y artistas invitados.' },
    { k: 'auto', label: 'Programación automática', desc: 'Reproduce Mega Mix fuera del horario en vivo.' },
    { k: 'mant', label: 'Modo mantenimiento', desc: 'Muestra una página de espera al público.', danger: true },
  ];
  return (
    <>
      <ViewTitle kicker="Ajustes de la estación" title="Configuración" />
      <Card style={{ marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 6 }}>Datos de la señal</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 14 }}>
          {[['Frecuencia', '99.9 FM'], ['Ciudad', 'Guayaquil'], ['Cobertura', 'Ecuador'], ['Eslogan', 'Solo La Mega, supera a La Mega']].map(([k, v]) => (
            <div key={k}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 6 }}>{k}</div>
              <input defaultValue={v} style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '11px 12px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14 }} />
            </div>
          ))}
        </div>
      </Card>
      <Card pad={0}>
        {rows.map((r, i) => (
          <div key={r.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 22px', borderTop: i ? '1px solid var(--line-1)' : 'none' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: r.danger ? '#FF2D34' : '#fff' }}>{r.label}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 3 }}>{r.desc}</div>
            </div>
            <Toggle on={cfg[r.k]} onChange={set(r.k)} color={r.danger ? 'var(--red)' : 'var(--green)'} />
          </div>
        ))}
      </Card>
    </>
  );
}

window.ADM_VIEWS = {
  dashboard: DashboardView,
  solicitudes: SolicitudesView,
  programacion: ProgramacionView,
  publicidad: PublicidadView,
  locutores: LocutoresView,
  playlists: PlaylistsView,
  configuracion: ConfiguracionView,
};
