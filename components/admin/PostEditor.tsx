"use client";

// Rich-text editor for EL MEGÁFONO posts (TipTap).
//
// The toolbar is deliberately limited to what lib/sanitize.ts allows through on
// save. Anything the editor could produce but the sanitizer strips would be a
// WYSIWYG lie — the author would see it, hit save, and watch it vanish. That's
// why codeBlock/code are disabled below rather than just left off the toolbar.

import React, { useCallback, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Icon } from "@/components/ui";
import { uploadFile } from "./station-views";

function ToolBtn({
  icon, title, active, onClick, disabled,
}: {
  icon: string; title: string; active?: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      disabled={disabled}
      // onMouseDown+preventDefault: a plain onClick would blur the editor first,
      // dropping the selection the command needs to act on.
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      style={{
        width: 32, height: 32, borderRadius: "var(--r-xs)", cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "rgba(227,30,36,0.18)" : "transparent",
        border: `1px solid ${active ? "var(--line-red)" : "transparent"}`,
        color: disabled ? "var(--fg-3)" : active ? "var(--red-bright)" : "var(--fg-2)",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "all var(--dur)",
      }}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

export function PostEditor({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (html: string) => void;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // REQUIRED: Next server-renders client components too, and TipTap rendering
    // during SSR produces a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // Not in the sanitizer's allowlist — see the note at the top.
        codeBlock: false,
        code: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      Image.configure({ inline: false }),
      // Supplies the .is-editor-empty class the placeholder CSS below hangs on.
      Placeholder.configure({ placeholder: "Escribí la nota acá…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "post-editor-body",
        // The editor is the note's body; announce it as such for screen readers.
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Cuerpo de la nota",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enlace (https://…). Dejalo vacío para quitarlo.", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url.trim())) {
      onError("El enlace debe empezar con https://, mailto: o tel:");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor, onError]);

  const addImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        const { url, kind } = await uploadFile(file);
        if (kind !== "image") {
          onError("Solo se pueden insertar imágenes en el cuerpo de la nota.");
          return;
        }
        // Images must live under /uploads — that's what the sanitizer enforces on
        // save, and uploadFile always returns such a URL.
        editor.chain().focus().setImage({ src: url, alt: "" }).run();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Error al subir la imagen");
      }
    },
    [editor, onError],
  );

  if (!editor) {
    return (
      <div style={{ border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: 16, color: "var(--fg-3)", fontSize: 13 }}>
        Cargando editor…
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", background: "var(--bg-2)", overflow: "hidden" }}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: 2, padding: 7,
          borderBottom: "1px solid var(--line-2)", background: "var(--bg-1)",
        }}
      >
        <ToolBtn icon="bold" title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolBtn icon="italic" title="Itálica" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolBtn icon="strikethrough" title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <Sep />
        <ToolBtn icon="heading-2" title="Título" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolBtn icon="heading-3" title="Subtítulo" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <Sep />
        <ToolBtn icon="list" title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolBtn icon="list-ordered" title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolBtn icon="quote" title="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <Sep />
        <ToolBtn icon="link" title="Enlace" active={editor.isActive("link")} onClick={addLink} />
        <ToolBtn icon="image" title="Insertar imagen" onClick={() => fileRef.current?.click()} />
        <ToolBtn icon="minus" title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <Sep />
        <ToolBtn icon="undo" title="Deshacer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
        <ToolBtn icon="redo" title="Rehacer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void addImage(f);
          // Reset so picking the same file twice still fires onChange.
          e.target.value = "";
        }}
      />

      <EditorContent editor={editor} />

      <style>{`
        .post-editor-body{
          min-height: 320px; padding: 18px; outline: none;
          font-size: 15px; line-height: 1.7; color: var(--fg-1);
        }
        .post-editor-body p{ margin: 0 0 14px; }
        .post-editor-body h2, .post-editor-body h3, .post-editor-body h4{
          font-family: var(--font-display); color: #fff; margin: 24px 0 10px; line-height: 1.25;
        }
        .post-editor-body h2{ font-size: 24px; }
        .post-editor-body h3{ font-size: 20px; }
        .post-editor-body h4{ font-size: 17px; }
        .post-editor-body ul, .post-editor-body ol{ padding-left: 22px; margin: 0 0 14px; }
        .post-editor-body li{ margin-bottom: 6px; }
        .post-editor-body blockquote{
          margin: 18px 0; padding-left: 16px; border-left: 3px solid var(--red);
          color: var(--fg-2); font-style: italic;
        }
        .post-editor-body a{ color: var(--red-bright); text-decoration: underline; }
        .post-editor-body img{
          max-width: 100%; height: auto; border-radius: var(--r-sm);
          border: 1px solid var(--line-2); margin: 14px 0;
        }
        .post-editor-body img.ProseMirror-selectednode{ outline: 2px solid var(--red-bright); }
        .post-editor-body hr{ border: 0; border-top: 1px solid var(--line-2); margin: 22px 0; }
        /* Placeholder for a brand-new, empty note. The class and the text both
           come from the Placeholder extension configured above. */
        .post-editor-body p.is-editor-empty:first-child::before{
          content: attr(data-placeholder); float: left; height: 0; pointer-events: none; color: var(--fg-3);
        }
      `}</style>
    </div>
  );
}

function Sep() {
  return <span aria-hidden="true" style={{ width: 1, alignSelf: "stretch", background: "var(--line-2)", margin: "4px 5px" }} />;
}
