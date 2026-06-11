/* global React, Icon, Section, Bloom, DAYS, SCHEDULE, WEEKEND, PROGRAMS */
// La Mega 99.9 — Programación (schedule grid + featured cards)

function ScheduleGrid() {
  const { useState } = React;
  const liveDay = new Date().getDay(); // 0 Sun .. 6 Sat
  const dayIndex = (liveDay + 6) % 7;  // 0 Mon .. 6 Sun
  const [openDay, setOpenDay] = useState(dayIndex);
  const blocksFor = (d) => (d === 'SÁB' || d === 'DOM') ? WEEKEND[d] : SCHEDULE;

  return (
    <>
      {/* desktop / tablet grid */}
      <div className="reveal glass sched-desktop" style={{ padding: 18, borderRadius: 'var(--r-lg)', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(118px, 1fr))', gap: 10, minWidth: 840 }}>
          {DAYS.map((d, i) => {
            const blocks = blocksFor(d);
            const isToday = i === dayIndex;
            return (
              <div key={d}>
                <div style={{
                  textAlign: 'center', padding: '9px 0', marginBottom: 10, borderRadius: 'var(--r-sm)',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em',
                  color: isToday ? '#fff' : 'var(--fg-2)',
                  background: isToday ? 'linear-gradient(180deg, var(--red-bright), var(--red))' : 'var(--bg-2)',
                  boxShadow: isToday ? 'var(--glow-red)' : 'none',
                  border: isToday ? 'none' : '1px solid var(--line-1)',
                }}>{d}{isToday && <span style={{ display: 'block', fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.85, letterSpacing: '0.15em' }}>HOY</span>}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {blocks.map((b, j) => (
                    <div key={j} style={{
                      padding: '11px 11px', borderRadius: 'var(--r-sm)', background: 'var(--bg-2)',
                      border: '1px solid var(--line-1)', borderLeft: `3px solid ${b.hue}`,
                      transition: 'all var(--dur)', cursor: 'default',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.transform = 'none'; }}>
                      <div className="mono" style={{ fontSize: 11, color: b.hue, marginBottom: 4 }}>{b.time}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: '#fff', lineHeight: 1.1, textTransform: 'uppercase' }}>{b.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* mobile accordion */}
      <div className="reveal sched-mobile" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
        {DAYS.map((d, i) => {
          const blocks = blocksFor(d);
          const isToday = i === dayIndex;
          const isOpen = openDay === i;
          return (
            <div key={d} className="glass" style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: isToday ? '1px solid var(--line-red)' : '1px solid var(--glass-border)' }}>
              <button onClick={() => setOpenDay(isOpen ? -1 : i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="display" style={{ fontSize: 18, color: isToday ? 'var(--red-bright)' : '#fff' }}>{d}</span>
                  {isToday && <span className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: '#fff', background: 'var(--red)', padding: '3px 7px', borderRadius: 999 }}>HOY</span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{blocks.length} shows</span>
                  <Icon name="chevron-down" size={20} color="var(--fg-2)" style={{ transition: 'transform var(--dur)', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                </span>
              </button>
              <div style={{ maxHeight: isOpen ? 600 : 0, overflow: 'hidden', transition: 'max-height var(--dur-slow) var(--ease-out)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px 14px' }}>
                  {blocks.map((b, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 'var(--r-sm)', background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderLeft: `3px solid ${b.hue}` }}>
                      <span className="mono" style={{ fontSize: 12, color: b.hue, minWidth: 48 }}>{b.time}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px){
          .sched-desktop{ display:none !important; }
          .sched-mobile{ display:flex !important; }
        }
      `}</style>
    </>
  );
}

function ProgramCard({ p, i }) {
  const { useState } = React;
  const [h, setH] = useState(false);
  return (
    <div className="reveal glass" style={{
      borderRadius: 'var(--r-md)', overflow: 'hidden', transition: 'all var(--dur) var(--ease-out)',
      transform: h ? 'translateY(-6px)' : 'none',
      border: h ? '1px solid var(--line-red)' : '1px solid var(--glass-border)',
      boxShadow: h ? `0 0 30px ${p.hue}33, var(--shadow-lg)` : 'var(--shadow-md)',
    }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {/* gradient header */}
      <div style={{ position: 'relative', padding: '20px 20px 16px', background: `linear-gradient(135deg, ${p.hue}, ${p.hue}22 90%)`, overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,0.08) 6px 7px)', opacity: 0.6 }} />
        <div className="mono" style={{ position: 'relative', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>{p.slot}</div>
        <div className="display" style={{ position: 'relative', fontSize: 26, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{p.name}</div>
        <div className="mono" style={{ position: 'relative', fontSize: 12, color: '#fff', marginTop: 6, opacity: 0.95 }}>{p.time}</div>
      </div>
      {/* body */}
      <div style={{ padding: '18px 20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: `radial-gradient(circle at 35% 30%, ${p.hue}, #150708)`, border: '2px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="mic" size={20} color="rgba(255,255,255,0.85)" />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--fg-3)', textTransform: 'uppercase' }}>Conduce</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{p.host}</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0 }}>{p.blurb}</p>
      </div>
    </div>
  );
}

function Programacion() {
  return (
    <Section id="programacion">
      <Bloom x="-6%" y="10%" size={520} color="rgba(122,31,196,0.10)" />
      <SectionHead align="left" index="02" kicker="LUNES A DOMINGO · 24/7"
        title={<>Nuestra <span style={{ color: 'var(--red)' }}>Programación</span></>}
        lead="Cuatro shows insignia que marcan el ritmo del día, más la parrilla completa de toda la semana." />

      {/* featured cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 44 }}>
        {PROGRAMS.map((p, i) => <ProgramCard key={p.name} p={p} i={i} />)}
      </div>

      {/* weekly grid */}
      <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Icon name="calendar-days" size={18} color="var(--red-bright)" />
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--fg-2)', textTransform: 'uppercase' }}>Parrilla semanal completa</span>
      </div>
      <ScheduleGrid />
    </Section>
  );
}

window.Programacion = Programacion;
