"use client";

// Home: "Mandanos tu saludo" — el oyente escribe, la IA de XT Radio lo revisa y
// el locutor lo lee al aire con la canción que pidió. Sin buzón configurado
// (lib/saludos.ts) la sección no aparece: mejor nada que un formulario muerto.

import React from "react";
import { Bloom, Section, SectionHead } from "@/components/ui";
import { SaludosWidget } from "@/components/saludos/SaludosWidget";
import { saludosActivo } from "@/lib/saludos";

export function Saludos() {
  if (!saludosActivo()) return null;
  return (
    <Section id="saludos">
      <Bloom x="12%" y="30%" size={460} color="rgba(227,30,36,0.18)" />
      <div className="saludos-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
        <SectionHead
          kicker="Saludos al aire"
          title={<>Mandanos tu <span style={{ color: "var(--red)" }}>saludo</span></>}
          lead="Escribí tu dedicatoria y elegí una canción de nuestra música. El locutor la lee al aire y te avisamos acá cuando suene."
        />
        <SaludosWidget ancho="100%" />
      </div>
      <style>{`@media (max-width: 860px){ .saludos-grid{ grid-template-columns: 1fr !important; gap: 28px !important; } }`}</style>
    </Section>
  );
}
