"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon, Section, SectionHead, Bloom, SOCIAL } from "@/components/ui";

const IG_COLOR  = "#E1306C";
const TT_COLOR  = "#ffffff";
const FB_COLOR  = "#1877F2";

// Shared card shell with hover glow
function SocialCard({ color, children }: { color: string; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <div
      className="reveal glass"
      style={{
        borderRadius: "var(--r-md)", overflow: "hidden", display: "flex", flexDirection: "column",
        transition: "all var(--dur) var(--ease-out)", transform: h ? "translateY(-5px)" : "none",
        boxShadow: h ? `0 0 32px ${color}44, var(--shadow-lg)` : "var(--shadow-md)",
        border: h ? `1px solid ${color}66` : "1px solid var(--glass-border)",
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {children}
    </div>
  );
}

// Reusable card header row
function CardHeader({ color, icon, handle, followers, url }: {
  color: string; icon: React.ReactNode; handle: string; followers: string; url: string;
}) {
  const [h, setH] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--line-1)" }}>
      <span style={{ width: 40, height: 40, borderRadius: "50%", background: `${color}22`, border: `1px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{handle}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{followers} seguidores</div>
      </div>
      <a
        href={url} target="_blank" rel="noopener noreferrer"
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase",
          letterSpacing: "0.04em", padding: "8px 16px", borderRadius: "var(--r-pill)", color: "#fff",
          whiteSpace: "nowrap", background: h ? color : "transparent", border: `1px solid ${color}`,
          transition: "all var(--dur)", textDecoration: "none",
        }}
      >
        Seguir
      </a>
    </div>
  );
}

// Instagram — mosaic placeholder linking to real profile
function InstagramCard() {
  const tiles = [
    ["#E31E24","#7A1FC4"], ["#FF6B6B","#E31E24"], ["#D0307A","#FF2D34"],
    ["#FF2D34","#8E0F13"], ["#7A1FC4","#1683C8"], ["#E31E24","#D0307A"],
  ];
  return (
    <SocialCard color={IG_COLOR}>
      <CardHeader
        color={IG_COLOR}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IG_COLOR} strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill={IG_COLOR} stroke="none"/></svg>}
        handle="@lamega99.9ecuador"
        followers="15.6K"
        url="https://www.instagram.com/lamega99.9ecuador"
      />
      <a href="https://www.instagram.com/lamega99.9ecuador" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, padding: 3 }}>
          {tiles.map((g, i) => (
            <div
              key={i}
              style={{ aspectRatio: "1", background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`, position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 25%, rgba(255,255,255,0.18), transparent 55%)" }} />
              {i === 0 && <span style={{ position: "absolute", top: 6, right: 6 }}><Icon name="play" size={14} color="#fff" /></span>}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 14px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="external-link" size={14} color={IG_COLOR} />
          <span className="mono" style={{ fontSize: 11, color: IG_COLOR }}>Ver perfil en Instagram</span>
        </div>
      </a>
    </SocialCard>
  );
}

// TikTok — featured video placeholder linking to real profile
function TikTokCard() {
  return (
    <SocialCard color={TT_COLOR}>
      <CardHeader
        color={TT_COLOR}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.78 1.53V7.14a4.85 4.85 0 0 1-1.01-.45Z"/>
          </svg>
        }
        handle="@lamega99.9"
        followers="12.3K"
        url="https://www.tiktok.com/@lamega99.9"
      />
      <a href="https://www.tiktok.com/@lamega99.9" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <div
          style={{
            position: "relative", aspectRatio: "9/14", margin: 3, borderRadius: "var(--r-sm)", overflow: "hidden",
            background: "linear-gradient(160deg, #25F4EE18, #FE2C5518 60%, #0d0d0d)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* TikTok noise texture */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 20%, rgba(37,244,238,0.12), transparent 40%), radial-gradient(circle at 70% 70%, rgba(254,44,85,0.12), transparent 40%)" }} />
          {/* TikTok logo watermark */}
          <svg style={{ position: "absolute", top: 12, right: 12, opacity: 0.15 }} width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.78 1.53V7.14a4.85 4.85 0 0 1-1.01-.45Z"/>
          </svg>
          {/* play button */}
          <span
            style={{
              width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="play" size={28} color="#fff" strokeWidth={2.2} style={{ marginLeft: 3 }} />
          </span>
          {/* engagement pills */}
          <div style={{ position: "absolute", right: 12, bottom: 44, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
            {[["heart","48K"],["message-circle","1.2K"],["share-2","3.4K"]].map(([icon, count]) => (
              <span key={icon} style={{ textAlign: "center" }}>
                <Icon name={icon} size={22} color="#fff" />
                <span className="mono" style={{ display: "block", fontSize: 10, color: "#fff" }}>{count}</span>
              </span>
            ))}
          </div>
          <div className="mono" style={{ position: "absolute", left: 12, bottom: 12, right: 52, fontSize: 11, color: "#fff" }}>
            ♪ Últimos momentos on air
          </div>
        </div>
        <div style={{ padding: "8px 14px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="external-link" size={14} color="rgba(255,255,255,0.6)" />
          <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Ver perfil en TikTok</span>
        </div>
      </a>
    </SocialCard>
  );
}

// Facebook — real Page Plugin iframe
function FacebookCard() {
  const iframeRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setLoaded(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pageUrl = encodeURIComponent("https://www.facebook.com/lamegaecuador");
  const src = `https://www.facebook.com/plugins/page.php?href=${pageUrl}&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appid`;

  return (
    <SocialCard color={FB_COLOR}>
      <CardHeader
        color={FB_COLOR}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill={FB_COLOR}>
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        }
        handle="La Mega 99.9 Ecuador"
        followers="7.5K"
        url="https://www.facebook.com/lamegaecuador"
      />
      <div ref={iframeRef} style={{ flex: 1, minHeight: 500, position: "relative", overflow: "hidden" }}>
        {!loaded && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(0,0,0,0.3)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill={FB_COLOR} opacity={0.5}>
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Cargando feed...</span>
          </div>
        )}
        {loaded && (
          <iframe
            src={src}
            width="100%"
            height="500"
            style={{ border: "none", display: "block", colorScheme: "light" }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="La Mega 99.9 Ecuador — Facebook"
          />
        )}
      </div>
    </SocialCard>
  );
}

export function Social() {
  return (
    <Section id="social" style={{ background: "var(--bg-1)", borderTop: "1px solid var(--line-1)" }}>
      <Bloom x="40%" y="-10%" size={520} color="rgba(227,30,36,0.10)" />
      <SectionHead
        align="center"
        index="05"
        kicker="NACIÓN MEGA"
        title={<>Síguenos en <span style={{ color: "var(--red)" }}>Redes</span></>}
        lead="Más de 35 mil seguidores viven La Mega cada día en Imbabura y el mundo. Únete a la conversación."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "start" }} className="social-grid">
        <InstagramCard />
        <TikTokCard />
        <FacebookCard />
      </div>
      <style>{`@media (max-width: 880px){ .social-grid{ grid-template-columns: 1fr !important; max-width: 440px; margin: 0 auto; } }`}</style>
    </Section>
  );
}
