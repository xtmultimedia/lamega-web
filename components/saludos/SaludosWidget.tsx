"use client";

// Monta el widget de XT Saludos (un <script> servido por el buzón) dentro de
// un contenedor propio. El widget vive en un Shadow DOM: los estilos del sitio
// no lo tocan y los suyos no se escapan.

import React, { useEffect, useId, useRef } from "react";
import { SALUDOS, saludosActivo } from "@/lib/saludos";

export function SaludosWidget({ ancho = "100%", plano = false }: { ancho?: string; plano?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `xt-saludos-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const cont = ref.current;
    if (!cont || !saludosActivo()) return;
    // StrictMode monta dos veces en desarrollo: un solo widget por contenedor.
    if (cont.querySelector("[data-xt-saludos]") || cont.dataset.montado) return;
    cont.dataset.montado = "1";
    const s = document.createElement("script");
    s.src = `${SALUDOS.url}/w.js`;
    s.async = true;
    s.dataset.estacion = SALUDOS.estacion;
    s.dataset.modo = "inline";
    s.dataset.destino = `#${id}`;
    s.dataset.ancho = ancho;
    if (plano) s.dataset.plano = "1";
    cont.appendChild(s);
  }, [id, ancho, plano]);

  if (!saludosActivo()) return null;
  // --xt-saludos-font: el widget toma la tipografía del sitio (Sora).
  return <div id={id} ref={ref} style={{ minHeight: 420, ["--xt-saludos-font" as string]: "var(--font-sora), system-ui, sans-serif" }} />;
}
