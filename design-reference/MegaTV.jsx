/* global React, Icon, Section, Bloom, OnAir, Button */
// La Mega 99.9 — Mega TV section

function LivePill({ name, color, icon }) {
  const { useState } = React;
  const [h, setH] = useState(false);
  return (
    <a href="#" onClick={(e) => e.preventDefault()} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderRadius: 'var(--r-pill)',
        background: h ? 'var(--bg-3)' : 'var(--bg-2)', border: '1px solid var(--line-2)',
        transition: 'all var(--dur) var(--ease-out)', transform: h ? 'translateY(-2px)' : 'none',
        boxShadow: h ? `0 0 22px ${color}55` : 'none', fontWeight: 600, fontSize: 14,
      }}>
      <span style={{ width: 22, height: 22, display: 'inline-flex' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d={icon} /></svg>
      </span>
      {name}
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red-bright)', animation: 'pulse-dot 1.3s infinite' }} />
    </a>
  );
}

function MegaTV() {
  const { useState } = React;
  const [playing, setPlaying] = useState(false);
  const fb = window.SOCIAL.facebook, tt = window.SOCIAL.tiktok, yt = window.SOCIAL.youtube;
  return (
    <Section id="megatv" style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--line-1)', borderBottom: '1px solid var(--line-1)' }}>
      <Bloom x="70%" y="-10%" size={520} color="rgba(227,30,36,0.12)" />
      <SectionHead align="center" index="01" kicker="SEÑAL EN VIDEO"
        title={<>Mega TV <span style={{ color: 'var(--red)' }}>99.9</span></>}
        lead="Entra a la cabina. Transmitimos los shows en vivo y a todo color, directo desde el estudio." />

      {/* video player */}
      <div className="reveal" style={{
        position: 'relative', aspectRatio: '16 / 9', borderRadius: 'var(--r-lg)', overflow: 'hidden',
        border: '1px solid var(--line-red)', boxShadow: '0 0 0 1px rgba(227,30,36,0.12), var(--glow-red-soft), var(--shadow-lg)',
        background: 'radial-gradient(120% 120% at 50% 0%, #1c0a0c, #0a0a0a 70%)',
      }}>
        {/* faux scanlines / glow grid */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, transparent 0 3px, rgba(0,0,0,0.18) 3px 4px)', opacity: 0.5 }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, rgba(227,30,36,0.18), transparent 55%)' }} />

        {/* live badge */}
        <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <OnAir compact />
          <span className="mono" style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 11px', borderRadius: 'var(--r-pill)', fontSize: 11, color: '#fff', backdropFilter: 'blur(6px)' }}>● 1.243 viendo</span>
        </div>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)' }}>MEGA<span style={{ color: 'var(--red)' }}>TV</span></span>
        </div>

        {/* play button */}
        <button onClick={() => setPlaying((p) => !p)} aria-label="Reproducir Mega TV" style={{
          position: 'absolute', inset: 0, margin: 'auto', width: 96, height: 96, borderRadius: '50%',
          border: 'none', cursor: 'pointer', background: 'linear-gradient(180deg, var(--red-bright), var(--red))',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--glow-red), 0 10px 40px rgba(0,0,0,0.5)', transition: 'transform var(--dur)',
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <Icon name={playing ? 'pause' : 'play'} size={38} strokeWidth={2.2} style={{ marginLeft: playing ? 0 : 5 }} />
        </button>

        {/* bottom now-on bar */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '40px 24px 18px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--red-bright)', marginBottom: 4 }}>AHORA EN CABINA</div>
            <div className="display" style={{ fontSize: 22, color: '#fff' }}>El Ganado · Mediodía</div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}>
            <Icon name="volume-2" size={20} /><Icon name="maximize" size={20} />
          </div>
        </div>
      </div>

      {/* follow elsewhere */}
      <div className="reveal" style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
        <span style={{ color: 'var(--fg-3)', fontWeight: 600, marginRight: 4 }}>Síguenos también en:</span>
        <LivePill name="Facebook Live" color={fb.color} icon={fb.path} />
        <LivePill name="TikTok Live" color="#25F4EE" icon={tt.path} />
        <LivePill name="YouTube Live" color={yt.color} icon={yt.path} />
      </div>
    </Section>
  );
}

window.MegaTV = MegaTV;
