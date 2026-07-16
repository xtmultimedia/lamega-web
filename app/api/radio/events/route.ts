import { subscribe } from "@/lib/events";
import { getSnapshot } from "@/lib/radio-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// SSE stream consumed by the public site and the admin dashboard.
// Sends a `snapshot` event on connect so clients hydrate immediately,
// then fans out every event emitted by the POST endpoints.

/**
 * Max lifetime of one SSE connection, after which the server closes it and the
 * client reconnects (RadioProvider already retries on error, and re-hydrates
 * from the `snapshot` this route sends on connect — so nothing is lost).
 *
 * WHY THIS EXISTS — it is not a cleanup nicety, it is what keeps the account
 * alive. On deploy we `touch tmp/restart.txt`; Passenger starts a new instance
 * and *gracefully* shuts the old one down, waiting for in-flight requests to
 * finish. An SSE request never finishes, and the heartbeat below actively stops
 * it from ever timing out — so the old instance would live forever, holding
 * ~14 threads against the host's NPROC=80 limit. Four or five deploys and the
 * whole cPanel account locks out (it did, three times, on 2026-07-16).
 *
 * A bounded lifetime lets old workers finally drain and be reaped. It also
 * bounds a real user-facing bug: the event bus (lib/events.ts) is in-process,
 * so a listener still attached to a superseded instance would never receive
 * another now-playing update — their ticker would freeze until they reloaded.
 */
const MAX_STREAM_MS = 10 * 60 * 1000;
// Spread reconnects out: without jitter every client that connected during the
// same page-load burst would come back at the same instant.
const JITTER_MS = 90 * 1000;

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const unsubscribe = subscribe(send);
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 25000);

      // See MAX_STREAM_MS: this is what lets a superseded instance drain.
      // Wrapped in an arrow on purpose — passing `cleanup` directly would read
      // the const below before its initializer runs (TDZ) and throw here.
      const lifetime = setTimeout(() => cleanup(), MAX_STREAM_MS + Math.random() * JITTER_MS);

      let closed = false;
      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(heartbeat);
        clearTimeout(lifetime);
        try {
          controller.close();
        } catch {}
      };

      req.signal.addEventListener("abort", cleanup);
      send("snapshot", await getSnapshot());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
