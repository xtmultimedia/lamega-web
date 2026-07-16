"use client";

// EL MEGÁFONO — the blog editor. Backed by /api/admin/posts with real per-row
// CRUD (POST/PATCH/DELETE), unlike the bulk-replace views (Programación,
// Playlists): posts own public URLs and the table grows without bound.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import {
  EXCERPT_MAX, STATUS_LABELS, TITLE_MAX,
  formatPostDate, isValidSlug, slugify,
  type AdminPost, type PostStatus,
} from "@/lib/megafono";
import { AdmButton, Badge, Card, IconBtn, ViewTitle } from "./primitives";
import { uploadFile } from "./station-views";
import { PostEditor } from "./PostEditor";

const INPUT: React.CSSProperties = {
  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)",
  padding: "11px 12px", color: "#fff", fontFamily: "var(--font-body)", fontSize: 14,
};
const LABEL: React.CSSProperties = {
  fontSize: 10, letterSpacing: "0.12em", color: "var(--fg-3)", textTransform: "uppercase", marginBottom: 6,
};

type Note = { ok: boolean; msg: string } | null;

function Notice({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <div
      role="status"
      style={{
        marginBottom: 16, padding: "12px 16px", borderRadius: "var(--r-sm)",
        background: note.ok ? "rgba(29,185,84,0.12)" : "rgba(227,30,36,0.12)",
        border: note.ok ? "1px solid rgba(29,185,84,0.4)" : "1px solid var(--line-red)",
        color: note.ok ? "#5fe08a" : "var(--red-bright)", fontSize: 13.5,
      }}
    >
      {note.msg}
    </div>
  );
}

/** A blank post, used when creating. `id: ""` marks it as not-yet-saved. */
const emptyPost = (): AdminPost => ({
  id: "", slug: "", title: "", excerpt: "", contentHtml: "", coverUrl: null,
  status: "draft", publishedAt: null,
});

export function MegafonoView() {
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  // The author may hand-edit the slug; once they do, stop deriving it from the
  // title or we'd overwrite their choice on the next keystroke.
  const slugTouched = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/posts");
      if (!res.ok) throw new Error("No se pudieron cargar las notas");
      const d = await res.json();
      setPosts(d.posts as AdminPost[]);
    } catch (e) {
      setNote({ ok: false, msg: e instanceof Error ? e.message : "Error al cargar" });
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startNew = () => {
    slugTouched.current = false;
    setNote(null);
    setEditing(emptyPost());
  };

  const startEdit = (p: AdminPost) => {
    slugTouched.current = true; // an existing post's slug is already deliberate
    setNote(null);
    setEditing({ ...p });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setNote({ ok: false, msg: "El título es obligatorio." });
      return;
    }
    if (editing.slug && !isValidSlug(editing.slug)) {
      setNote({ ok: false, msg: "El enlace solo admite minúsculas, números y guiones." });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const isNew = !editing.id;
      const body = {
        title: editing.title.trim(),
        slug: editing.slug || undefined,
        excerpt: editing.excerpt || null,
        contentHtml: editing.contentHtml || null,
        coverUrl: editing.coverUrl || null,
        status: editing.status,
      };
      const res = await fetch(isNew ? "/api/admin/posts" : `/api/admin/posts/${editing.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(d?.error || "No se pudo guardar");
      // Replace local state from the response: the server may have adjusted the
      // slug (uniqueness) and stamps publishedAt on first publish.
      setEditing(null);
      setNote({ ok: true, msg: d.post.status === "published" ? "Nota publicada." : "Borrador guardado." });
      await load();
    } catch (e) {
      setNote({ ok: false, msg: e instanceof Error ? e.message : "Error al guardar" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: AdminPost) => {
    if (!window.confirm(`¿Eliminar “${p.title}”? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setNote({ ok: true, msg: "Nota eliminada." });
      await load();
    } catch (e) {
      setNote({ ok: false, msg: e instanceof Error ? e.message : "Error al eliminar" });
    } finally {
      setBusy(false);
    }
  };

  const setCover = async (file: File) => {
    try {
      const { url, kind } = await uploadFile(file);
      if (kind !== "image") {
        setNote({ ok: false, msg: "La portada debe ser una imagen." });
        return;
      }
      setEditing((e) => (e ? { ...e, coverUrl: url } : e));
    } catch (err) {
      setNote({ ok: false, msg: err instanceof Error ? err.message : "Error al subir la portada" });
    }
  };

  if (editing) {
    return (
      <PostForm
        post={editing}
        busy={busy}
        note={note}
        slugTouched={slugTouched}
        onChange={setEditing}
        onCover={setCover}
        onError={(msg) => setNote({ ok: false, msg })}
        onSave={save}
        onCancel={() => {
          setEditing(null);
          setNote(null);
        }}
      />
    );
  }

  return (
    <>
      <ViewTitle kicker="El Megáfono" title="Noticias">
        <AdmButton icon="plus" onClick={startNew}>Nueva nota</AdmButton>
      </ViewTitle>

      <Notice note={note} />

      {posts === null ? (
        <Card><div style={{ color: "var(--fg-3)", fontSize: 13.5 }}>Cargando…</div></Card>
      ) : posts.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <Icon name="megaphone" size={34} color="var(--fg-3)" />
            <div style={{ color: "var(--fg-2)", fontSize: 15, marginTop: 12, marginBottom: 6 }}>Todavía no hay notas</div>
            <div style={{ color: "var(--fg-3)", fontSize: 13 }}>Creá la primera y aparecerá en la portada y en /megafono.</div>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => (
            <Card key={p.id} pad={16} hover>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 84, height: 54, borderRadius: "var(--r-xs)", flexShrink: 0,
                    background: p.coverUrl ? `url(${p.coverUrl}) center/cover` : "var(--bg-3)",
                    border: "1px solid var(--line-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {!p.coverUrl && <Icon name="image" size={18} color="var(--fg-3)" />}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <span className="display" style={{ fontSize: 16, color: "#fff" }}>{p.title}</span>
                    <Badge kind={p.status === "published" ? "publicada" : "borrador"} />
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 5 }}>
                    {p.publishedAt ? formatPostDate(p.publishedAt) : "Sin publicar"} · /megafono/{p.slug}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                  {p.status === "published" && (
                    <IconBtn
                      icon="external-link"
                      color="#16C8E8"
                      title="Ver la nota publicada"
                      // window.open rather than wrapping IconBtn in an <a>: a
                      // <button> inside an anchor is invalid HTML.
                      onClick={() => window.open(`/megafono/${p.slug}`, "_blank", "noopener,noreferrer")}
                    />
                  )}
                  <IconBtn icon="pencil" color="var(--red-bright)" title="Editar" onClick={() => startEdit(p)} />
                  <IconBtn icon="trash-2" color="#FF2D34" title="Eliminar" onClick={() => void remove(p)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function PostForm({
  post, busy, note, slugTouched, onChange, onCover, onError, onSave, onCancel,
}: {
  post: AdminPost;
  busy: boolean;
  note: Note;
  slugTouched: React.MutableRefObject<boolean>;
  onChange: (p: AdminPost) => void;
  onCover: (f: File) => void;
  onError: (msg: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const coverRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof AdminPost>(k: K, v: AdminPost[K]) => onChange({ ...post, [k]: v });

  return (
    <>
      <ViewTitle kicker="El Megáfono" title={post.id ? "Editar nota" : "Nueva nota"}>
        <div style={{ display: "flex", gap: 10 }}>
          <AdmButton variant="ghost" icon="x" onClick={onCancel}>Cancelar</AdmButton>
          <AdmButton icon="check" onClick={busy ? () => {} : onSave}>
            {busy ? "Guardando…" : post.status === "published" ? "Publicar" : "Guardar borrador"}
          </AdmButton>
        </div>
      </ViewTitle>

      <Notice note={note} />

      <div className="megafono-form" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        <Card>
          <div style={{ marginBottom: 16 }}>
            <div style={LABEL}>Título</div>
            <input
              style={{ ...INPUT, fontSize: 17, fontFamily: "var(--font-display)", fontWeight: 700 }}
              value={post.title}
              maxLength={TITLE_MAX}
              placeholder="El título de la nota"
              onChange={(e) => {
                const title = e.target.value;
                // Derive the slug from the title until the author edits it.
                onChange({ ...post, title, ...(slugTouched.current ? {} : { slug: slugify(title) }) });
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={LABEL}>Enlace (URL)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono" style={{ fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>/megafono/</span>
              <input
                style={{ ...INPUT, fontFamily: "var(--font-mono)", fontSize: 13 }}
                value={post.slug}
                placeholder="se-genera-del-titulo"
                onChange={(e) => {
                  slugTouched.current = true;
                  set("slug", e.target.value);
                }}
              />
            </div>
            {post.status === "published" && (
              <div style={{ fontSize: 11.5, color: "#E0A82E", marginTop: 7, display: "flex", gap: 6 }}>
                <Icon name="triangle-alert" size={13} />
                Esta nota ya está publicada: si cambiás el enlace, la dirección anterior deja de funcionar.
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={LABEL}>Entradilla ({(post.excerpt ?? "").length}/{EXCERPT_MAX})</div>
            <textarea
              style={{ ...INPUT, minHeight: 74, resize: "vertical" }}
              value={post.excerpt ?? ""}
              maxLength={EXCERPT_MAX}
              placeholder="Un resumen corto. Es lo que se ve en la portada, en /megafono y en Google."
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </div>

          <div style={LABEL}>Cuerpo</div>
          <PostEditor
            value={post.contentHtml ?? ""}
            onChange={(html) => set("contentHtml", html)}
            onError={onError}
          />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <div style={LABEL}>Estado</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {(["draft", "published"] as PostStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => set("status", s)}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: "var(--r-sm)", cursor: "pointer",
                    background: post.status === s ? "rgba(227,30,36,0.16)" : "var(--bg-2)",
                    border: `1px solid ${post.status === s ? "var(--line-red)" : "var(--line-2)"}`,
                    color: post.status === s ? "#fff" : "var(--fg-2)",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12.5, textTransform: "uppercase",
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
              {post.status === "published"
                ? "Visible para todos en la web."
                : "Solo la ve el equipo. No aparece en la portada ni en /megafono."}
            </div>
            {post.publishedAt && (
              <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-1)" }}>
                Publicada el {formatPostDate(post.publishedAt)}
              </div>
            )}
          </Card>

          <Card>
            <div style={LABEL}>Imagen destacada</div>
            <div
              style={{
                position: "relative", aspectRatio: "16 / 9", borderRadius: "var(--r-sm)", overflow: "hidden",
                background: post.coverUrl ? `url(${post.coverUrl}) center/cover` : "var(--bg-2)",
                border: "1px solid var(--line-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {!post.coverUrl && <Icon name="image" size={26} color="var(--fg-3)" />}
              <div style={{ position: "absolute", right: 8, bottom: 8, display: "flex", gap: 6 }}>
                <IconBtn icon="camera" color="var(--red-bright)" title="Subir portada" onClick={() => coverRef.current?.click()} />
                {post.coverUrl && (
                  <IconBtn icon="x" color="#FF2D34" title="Quitar portada" onClick={() => set("coverUrl", null)} />
                )}
              </div>
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onCover(f);
                e.target.value = "";
              }}
            />
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 10, lineHeight: 1.5 }}>
              Se usa en la portada, en /megafono y al compartir en redes. Ideal 16:9.
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px){ .megafono-form{ grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
