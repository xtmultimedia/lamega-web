"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui";
import { useRadio } from "@/components/radio/RadioProvider";
import { DEFAULT_FOOTER, isSafeFooterUrl } from "@/lib/footer";
import { APP_VERSION } from "@/lib/version";

function FootLink({ label, url }: { label: string; url?: string }) {
  const [h, setH] = useState(false);
  const isLink = !!url && isSafeFooterUrl(url) && url.trim() !== "";
  const external = isLink && /^https?:/i.test(url!.trim());
  return (
    <a
      href={isLink ? url : "#"}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={isLink ? undefined : (e) => e.preventDefault()}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "block", fontSize: 14, color: h ? "#fff" : "var(--fg-2)", padding: "6px 0",
        transition: "color var(--dur)", paddingLeft: h ? 8 : 0,
      }}
    >
      {label}
    </a>
  );
}

export function Footer() {
  const { config } = useRadio();
  const cols = config.footer && config.footer.length ? config.footer : DEFAULT_FOOTER;
  return (
    <footer
      id="contacto"
      style={{ background: "var(--bg)", borderTop: "2px solid var(--red)", boxShadow: "0 -1px 30px rgba(227,30,36,0.3)", position: "relative", zIndex: 2 }}
    >
      <div className="foot-inner" style={{ maxWidth: 1240, margin: "0 auto", padding: "70px 40px 0" }}>
        {/* logo + tagline */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/mega-logo.png"
            alt="La Mega 99.9 FM — Solo La Mega, Supera a La Mega"
            style={{ height: 56, margin: "0 auto 18px", filter: "drop-shadow(0 6px 22px rgba(227,30,36,0.5))" }}
          />
          <div className="display" style={{ fontSize: 18, color: "var(--fg-2)", letterSpacing: "0.1em" }}>
            Solo La Mega <span style={{ color: "var(--red)" }}>·</span> Supera a La Mega
          </div>
        </div>

        {/* columns */}
        <div
          className="foot-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, paddingBottom: 48, borderBottom: "1px solid var(--line-1)" }}
        >
          {cols.map((c, ci) => (
            <div key={`${c.title}-${ci}`}>
              <div className="display" style={{ fontSize: 16, color: "#fff", marginBottom: 14, letterSpacing: "0.04em" }}>{c.title}</div>
              {c.links.map((l, li) => (
                <FootLink key={`${l.label}-${li}`} label={l.label} url={l.url} />
              ))}
            </div>
          ))}
        </div>

      </div>

      {/* bottom bar */}
      <div style={{ borderTop: "1px solid var(--line-1)", background: "#070707" }}>
        <div
          className="foot-bottom"
          style={{
            maxWidth: 1240, margin: "0 auto", padding: "22px 40px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>
            © 2026 La Mega 99.9 · Ecuador · Todos los derechos reservados · v{APP_VERSION}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-2)" }}>
              <Icon name="radio-tower" size={16} color="var(--red-bright)" />
              <span className="mono" style={{ fontSize: 12 }}>
                SEÑAL · {config.frequency.toUpperCase()} {config.city.toUpperCase()}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em",
                color: "var(--fg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-xs)", padding: "5px 10px",
              }}
            >
              SUPERCOM
            </span>
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
