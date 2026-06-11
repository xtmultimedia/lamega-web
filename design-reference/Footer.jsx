/* global React, Icon, SocialIcon */
// La Mega 99.9 — Footer

const FOOT_COLS = [
  { title: 'Sobre Nosotros', links: ['Quiénes somos', 'Historia', 'Nuestro equipo', 'Trabaja con nosotros', 'Prensa'] },
  { title: 'Programación', links: ['Megapolis', 'El Ganado', 'La Tarde Mega', 'Mega Noche', 'Parrilla completa'] },
  { title: 'Legal', links: ['Términos de uso', 'Política de privacidad', 'Concursos y bases', 'Cookies'] },
  { title: 'Contacto', links: ['Cabina: 099 999 99 99', 'Comercial', 'WhatsApp', 'Guayaquil, Ecuador'] },
];

function FootLink({ children }) {
  const { useState } = React;
  const [h, setH] = useState(false);
  return (
    <a href="#" onClick={(e) => e.preventDefault()} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'block', fontSize: 14, color: h ? '#fff' : 'var(--fg-2)', padding: '6px 0', transition: 'color var(--dur)', paddingLeft: h ? 8 : 0 }}>
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer id="contacto" style={{ background: 'var(--bg)', borderTop: '2px solid var(--red)', boxShadow: '0 -1px 30px rgba(227,30,36,0.3)', position: 'relative', zIndex: 2 }}>
      <div className="foot-inner" style={{ maxWidth: 1240, margin: '0 auto', padding: '70px 40px 0' }}>
        {/* logo + tagline */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <img src="assets/mega-logo.png" alt="La Mega 99.9" style={{ height: 56, margin: '0 auto 18px', filter: 'drop-shadow(0 6px 22px rgba(227,30,36,0.5))' }} />
          <div className="display" style={{ fontSize: 18, color: 'var(--fg-2)', letterSpacing: '0.1em' }}>Solo La Mega <span style={{ color: 'var(--red)' }}>·</span> Supera a La Mega</div>
        </div>

        {/* columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, paddingBottom: 48, borderBottom: '1px solid var(--line-1)' }} className="foot-grid">
          {FOOT_COLS.map((c) => (
            <div key={c.title}>
              <div className="display" style={{ fontSize: 16, color: '#fff', marginBottom: 14, letterSpacing: '0.04em' }}>{c.title}</div>
              {c.links.map((l) => <FootLink key={l}>{l}</FootLink>)}
            </div>
          ))}
        </div>

        {/* social row */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '40px 0' }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.2em', color: 'var(--fg-3)' }}>SÍGUENOS</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {['instagram', 'tiktok', 'facebook', 'youtube', 'spotify'].map((n) => (
              <SocialIcon key={n} name={n} size={22} glow />
            ))}
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div style={{ borderTop: '1px solid var(--line-1)', background: '#070707' }}>
        <div className="foot-bottom" style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>© 2026 La Mega 99.9 · Ecuador · Todos los derechos reservados</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-2)' }}>
              <Icon name="radio-tower" size={16} color="var(--red-bright)" />
              <span className="mono" style={{ fontSize: 12 }}>SEÑAL · 99.9 FM GUAYAQUIL</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: 'var(--fg-2)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-xs)', padding: '5px 10px' }}>SUPERCOM</span>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .foot-grid{ grid-template-columns: 1fr 1fr !important; gap: 28px !important; } }
        @media (max-width: 520px){ .foot-grid{ grid-template-columns: 1fr !important; text-align: center; } }
        @media (max-width: 640px){ .foot-bottom{ flex-direction: column !important; text-align: center; justify-content: center; } }
        @media (max-width: 520px){ .foot-inner{ padding-left: 20px !important; padding-right: 20px !important; } .foot-bottom{ padding-left: 20px !important; padding-right: 20px !important; } }
      `}</style>
    </footer>
  );
}

window.Footer = Footer;
