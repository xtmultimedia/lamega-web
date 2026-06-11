import { subscribe } from "@/lib/events";
import { getSnapshot } from "@/lib/radio-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// SSE stream consumed by the public site and the admin dashboard.
// Sends a `snapshot` event on connect so clients hydrate immediately,
// then fans out every event emitted by the POST endpoints.
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

      let closed = false;
      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(heartbeat);
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
