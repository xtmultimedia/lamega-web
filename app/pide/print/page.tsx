"use client";

// Print version of /pide (port of Formulario-print.html): same form,
// animations jumped to their end state, then window.print() once fonts
// and the React tree have settled.

import { useEffect } from "react";
import { FormApp } from "@/components/form/FormApp";

export default function PidePrintPage() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // freeze animations at their end state so print never captures
      // an element mid-entrance
      const st = document.createElement("style");
      st.textContent =
        "*,*::before,*::after{animation-delay:-99s !important;animation-duration:.001s !important;animation-iteration-count:1 !important;animation-fill-mode:both !important;animation-play-state:running !important;transition-duration:0s !important}";
      document.head.appendChild(st);

      try {
        await document.fonts.ready;
      } catch {}

      try {
        const sweep = () => {
          for (const a of document.getAnimations()) {
            try {
              a.finish();
            } catch {
              try {
                a.pause();
              } catch {}
            }
          }
        };
        sweep();
        await new Promise((r) => requestAnimationFrame(r));
        sweep();
        await new Promise((r) => requestAnimationFrame(r));
      } catch {}

      setTimeout(() => {
        if (!cancelled) {
          try {
            window.print();
          } catch {}
        }
      }, 300);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <FormApp />;
}
