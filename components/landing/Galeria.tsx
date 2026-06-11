"use client";

// "La Mega en acción" — photo/video gallery fed from /admin → Galería.
// Images and uploaded videos open in a lightbox; YouTube links embed.

import React, { useEffect, useState } from "react";
import { Icon, Section, SectionHead, Bloom } from "@/components/ui";
import { useStationData, type PublicMedia } from "@/components/useStationData";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

function Thumb({ item, onOpen }: { item: PublicMedia; onOpen: () => void }) {
  const [h, setH] = useState(false);
  const yt = item.kind === "youtube" ? youtubeId(item.url) : null;
  const isVideo = item.kind !== "image";
  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative", border: "none", padding: 0, cursor: "pointer", overflow: "hidden",
        borderRadius: "var(--r-md)", aspectRatio: "4 / 3", background: "var(--bg-2)",
        outline: h ? "1px solid var(--line-red)" : "1px solid var(--line-1)",
        boxShadow: h ? "0 0 28px rgba(227,30,36,0.3), var(--shadow-lg)" : "var(--shadow-md)",
        transform: h ? "translateY(-5px)" : "none",
        transition: "all var(--dur) var(--ease-out)",
      }}
    >
      {item.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transform: h ? "scale(1.05)" : "scale(1)", transition: "transform var(--dur-slow) var(--ease-out)" }} />
      )}
      {item.kind === "video" && (
        <video src={item.url} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {item.kind === "youtube" && yt && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transform: h ? "scale(1.05)" : "scale(1)", transition: "transform var(--dur-slow) var(--ease-out)" }} />
      )}

      {isVideo && (
        <span
          style={{
            position: "absolute", inset: 0, margin: "auto", width: 54, height: 54, borderRadius: "50%",
            background: "linear-gradient(180deg, var(--red-bright), var(--red))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--glow-red), 0 8px 24px rgba(0,0,0,0.5)",
            transform: h ? "scale(1.1)" : "scale(1)", transition: "transform var(--dur)",
          }}
        >
          <Icon name="play" size={22} color="#fff" strokeWidth={2.4} style={{ marginLeft: 3 }} />
        </span>
      )}

      {item.title && (
        <span
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, padding: "26px 14px 12px", textAlign: "left",
            background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#fff",
            textTransform: "uppercase", letterSpacing: "0.03em",
          }}
        >
          {item.title}
        </span>
      )}
    </button>
  );
}

function Lightbox({ item, onClose }: { item: PublicMedia; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const yt = item.kind === "youtube" ? youtubeId(item.url) : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500, background: "rgba(5,5,5,0.92)",
        WebkitBackdropFilter: "blur(10px)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "5vh 4vw",
        animation: "rise var(--dur) var(--ease-out)",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          position: "absolute", top: 22, right: 22, width: 46, height: 46, borderRadius: "50%",
          background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "#fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
        }}
      >
        <Icon name="x" size={22} />
      </button>
      <figure onClick={(e) => e.stopPropagation()} style={{ margin: 0, maxWidth: "min(1100px, 92vw)", width: "100%", textAlign: "center" }}>
        {item.kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.title} style={{ maxWidth: "100%", maxHeight: "78vh", margin: "0 auto", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-lg)" }} />
        )}
        {item.kind === "video" && (
          <video src={item.url} controls autoPlay playsInline style={{ maxWidth: "100%", maxHeight: "78vh", margin: "0 auto", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-lg)" }} />
        )}
        {item.kind === "youtube" && yt && (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--r-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
            <iframe
              src={`https://www.youtube.com/embed/${yt}?autoplay=1`}
              title={item.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>
        )}
        {item.title && (
          <figcaption className="display" style={{ marginTop: 16, fontSize: 18, color: "#fff" }}>{item.title}</figcaption>
        )}
      </figure>
    </div>
  );
}

export function Galeria() {
  const station = useStationData();
  const [open, setOpen] = useState<PublicMedia | null>(null);
  const items = station?.media ?? [];

  if (items.length === 0) return null; // hidden until content is added in /admin

  return (
    <Section id="galeria">
      <Bloom x="65%" y="-6%" size={520} color="rgba(227,30,36,0.12)" />
      <SectionHead
        align="center"
        index="06"
        kicker="LA NACIÓN MEGA EN VIVO"
        title={<>La Mega en <span style={{ color: "var(--red)" }}>Acción</span></>}
        lead="Eventos, conciertos, la cabina y la gente que hace La Mega todos los días."
      />
      <div
        className="gal-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}
      >
        {items.map((m) => (
          <Thumb key={m.id} item={m} onOpen={() => setOpen(m)} />
        ))}
      </div>
      {open && <Lightbox item={open} onClose={() => setOpen(null)} />}
    </Section>
  );
}
