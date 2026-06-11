"use client";

// Live song-request data for the admin dashboard: initial fetch +
// real-time prepend via the SSE `new_request` event.

import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { useRadio } from "@/components/radio/RadioProvider";
import { Badge, Card, IconBtn } from "./primitives";

export interface RequestRow {
  id: string;
  name: string;
  songTitle: string;
  songArtist: string;
  dedication: string | null;
  isSpecial: boolean;
  status: string; // pending | approved | on_air | rejected
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "pendiente",
  approved: "aprobada",
  on_air: "alaire",
  rejected: "rechazada",
};

export function useRequests() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { onEvent } = useRadio();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/requests");
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.requests);
      setLoaded(true);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () =>
      onEvent((event, data) => {
        if (event === "new_request") {
          setRows((r) => [
            {
              id: data.id,
              name: data.name,
              songTitle: data.title,
              songArtist: data.artist,
              dedication: data.dedication,
              isSpecial: data.is_special,
              status: data.status,
              createdAt: data.requested_at,
            },
            ...r.filter((x) => x.id !== data.id),
          ]);
        }
      }),
    [onEvent]
  );

  const act = useCallback(async (id: string, action: "approve" | "reject") => {
    // optimistic update
    setRows((r) =>
      r.map((x) => (x.id === id ? { ...x, status: action === "approve" ? "approved" : "rejected" } : x))
    );
    const res = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) load(); // revert on failure
  }, [load]);

  return { rows, loaded, act };
}

function hora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "—";
  }
}

const TH: React.CSSProperties = {
  textAlign: "left", padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
  letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap",
};

export function SolicitudesTable({
  rows, act, limit,
}: {
  rows: RequestRow[];
  act: (id: string, action: "approve" | "reject") => void;
  limit?: number;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <Card pad={0} style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ background: "var(--bg-2)" }}>
              {["Hora", "Oyente", "Canción / Artista", "Tipo", "Estado", ""].map((h) => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "28px 18px", textAlign: "center", color: "var(--fg-3)", fontSize: 14 }}>
                  Sin solicitudes todavía — llegarán aquí en tiempo real desde /pide.
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr
                key={r.id}
                style={{ borderTop: "1px solid var(--line-1)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="mono" style={{ padding: "13px 18px", fontSize: 13, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
                  {hora(r.createdAt)}
                </td>
                <td style={{ padding: "13px 18px", fontSize: 14, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{r.name}</td>
                <td style={{ padding: "13px 18px" }}>
                  <div style={{ fontSize: 14, color: "#fff" }}>{r.songTitle}</div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>{r.songArtist || "—"}</div>
                  {r.dedication && (
                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3, fontStyle: "italic" }}>“{r.dedication}”</div>
                  )}
                </td>
                <td style={{ padding: "13px 18px" }}>
                  <Badge kind={r.isSpecial ? "dedicatoria" : "solicitud"} />
                </td>
                <td style={{ padding: "13px 18px" }}>
                  <Badge kind={STATUS_BADGE[r.status] || r.status} />
                </td>
                <td style={{ padding: "13px 14px" }}>
                  {r.status === "pending" ? (
                    <div style={{ display: "flex", gap: 7 }}>
                      <IconBtn icon="check" color="#1DB954" title="Aprobar (a la cola)" onClick={() => act(r.id, "approve")} />
                      <IconBtn icon="x" color="#FF2D34" title="Rechazar" onClick={() => act(r.id, "reject")} />
                    </div>
                  ) : (
                    <Icon name="more-horizontal" size={18} color="var(--fg-3)" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
