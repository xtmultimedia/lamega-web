/* global React, Icon, Section, Bloom, Button, APP_FEATURES, SOCIAL */
// La Mega 99.9 — La Mega App section

function StoreButton({ store }) {
  const { useState } = React;
  const [h, setH] = useState(false);
  const isPlay = store === 'play';
  return (
    <a href="#" onClick={(e) => e.preventDefault()} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderRadius: 'var(--r-sm)',
        background: h ? '#1c1c1f' : '#000', border: '1px solid var(--line-2)',
        transition: 'all var(--dur)', transform: h ? 'translateY(-2px)' : 'none',
        boxShadow: h ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
      }}>
      {isPlay ? (
        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M3.6 2.3 13 12l-9.4 9.7c-.3-.2-.6-.6-.6-1.2V3.5c0-.6.3-1 .6-1.2Z" fill="#00D9FF"/><path d="m13 12 3.1-3.2 4.6 2.6c.9.5.9 1.7 0 2.2l-4.6 2.6L13 12Z" fill="#FFCE00"/><path d="M4.7 2 13 12l-9.4 9.7c.3.2.7.2 1.2-.1L16.1 15 4.7 2Z" fill="#00F076"/><path d="M16.1 9 4.9 2c-.5-.3-.9-.3-1.2-.1L13 12l3.1-3Z" fill="#FF3A44"/></svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M16.4 1.5c.1 1-.3 2-1 2.8-.7.8-1.8 1.4-2.8 1.3-.1-1 .4-2 1-2.7.8-.8 2-1.4 2.8-1.4ZM19 17c-.5 1.2-.8 1.7-1.4 2.7-.9 1.4-2.1 3.1-3.7 3.1-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.8-1.6-3.7-3C-.1 16-.5 9.8 2.5 8c1-.6 2.2-.9 3.2-.6 1.1.3 1.8.9 2.7.9.9 0 1.4-.6 2.8-.9 1.7-.4 3.4.2 4.4 1.6-3.9 2.1-3.2 7.6 1.4 8Z"/></svg>
      )}
      <span style={{ textAlign: 'left', lineHeight: 1.1 }}>
        <span className="mono" style={{ display: 'block', fontSize: 9, letterSpacing: '0.1em', color: 'var(--fg-3)' }}>{isPlay ? 'DISPONIBLE EN' : 'DESCARGA EN'}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>{isPlay ? 'Google Play' : 'App Store'}</span>
      </span>
    </a>
  );
}

function PhoneMock() {
  return (
    <div className="reveal" style={{ position: 'relative', justifySelf: 'center' }}>
      {/* glow behind */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: '-12% -8%', background: 'radial-gradient(circle at 50% 40%, rgba(227,30,36,0.30), transparent 65%)', filter: 'blur(20px)' }} />
      <div style={{
        position: 'relative', width: 286, height: 588, borderRadius: 44, padding: 12,
        background: 'linear-gradient(160deg, #2a2a2e, #0c0c0e)', border: '1px solid var(--line-2)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.15)',
      }}>
        {/* screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: 33, overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 0%, #1c0809, #0a0a0a 60%)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* notch */}
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 96, height: 24, background: '#000', borderRadius: 999, zIndex: 3 }} />
          {/* status */}
          <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 22px 0', fontSize: 11, color: '#fff', zIndex: 2 }}>
            <span>9:41</span><span style={{ display: 'flex', gap: 5 }}><Icon name="signal" size={13} /><Icon name="wifi" size={13} /><Icon name="battery-full" size={13} /></span>
          </div>
          {/* app header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 14px' }}>
            <img src="assets/mega-logo.png" alt="" style={{ height: 22 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', background: 'rgba(227,30,36,0.18)', border: '1px solid var(--line-red)', padding: '4px 8px', borderRadius: 999 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red-bright)', animation: 'pulse-dot 1.4s infinite' }} />EN VIVO
            </span>
          </div>
          {/* big album */}
          <div style={{ padding: '6px 20px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ aspectRatio: '1', borderRadius: 18, background: 'radial-gradient(circle at 35% 30%, #E31E24, #150708)', position: 'relative', boxShadow: '0 16px 36px rgba(227,30,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="radio" size={26} color="#fff" />
              </span>
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--red-bright)', marginBottom: 4 }}>SONANDO AHORA</div>
            <div className="display" style={{ fontSize: 22, color: '#fff' }}>El Ganado</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 14 }}>Dayanara</div>
            {/* progress */}
            <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.12)', marginBottom: 16 }}>
              <div style={{ width: '46%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--red), var(--red-bright))' }} />
            </div>
            {/* controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, marginBottom: 18 }}>
              <Icon name="skip-back" size={22} color="var(--fg-2)" />
              <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(180deg, var(--red-bright), var(--red))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-red)' }}>
                <Icon name="play" size={24} color="#fff" strokeWidth={2.4} style={{ marginLeft: 2 }} />
              </span>
              <Icon name="skip-forward" size={22} color="var(--fg-2)" />
            </div>
          </div>
          {/* tab bar */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0 18px', borderTop: '1px solid var(--line-1)', background: 'rgba(0,0,0,0.4)' }}>
            {['radio', 'tv', 'list-music', 'user'].map((n, i) => (
              <Icon key={n} name={n} size={20} color={i === 0 ? 'var(--red-bright)' : 'var(--fg-3)'} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MegaApp() {
  return (
    <Section id="megaapp">
      <Bloom x="-4%" y="6%" size={560} color="rgba(227,30,36,0.14)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="app-grid">
        <div>
          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <span className="sec-index">04</span>
            <span className="kicker">LLÉVALA EN EL BOLSILLO</span>
          </div>
          <h2 className="h2 reveal" style={{ marginBottom: 22 }}>La Mega <span style={{ color: 'var(--red)' }}>App</span></h2>
          <p className="reveal" style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 440, marginBottom: 32 }}>
            La 99.9 contigo a donde vayas. Radio en vivo, Mega TV, playlists y alertas — todo en una sola app, gratis.
          </p>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 460, marginBottom: 34 }}>
            {APP_FEATURES.map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 'var(--r-sm)', background: 'var(--bg-2)', border: '1px solid var(--line-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(227,30,36,0.18)' }}>
                  <Icon name={f.icon} size={20} color="var(--red-bright)" />
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{f.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.45, marginTop: 3 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <StoreButton store="play" />
            <StoreButton store="apple" />
          </div>
        </div>
        <PhoneMock />
      </div>
      <style>{`@media (max-width: 900px){ .app-grid{ grid-template-columns: 1fr !important; gap: 48px !important; } }`}</style>
    </Section>
  );
}

window.MegaApp = MegaApp;
