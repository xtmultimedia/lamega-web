// In-process SSE event bus. Subscribers are the open /api/radio/events
// connections; emit() fans out to all of them. Cached on globalThis so the
// dev server's module reloads don't drop live connections.

export type RadioEvent =
  | "now_playing_update"
  | "program_update"
  | "listener_count"
  | "queue_update"
  | "emergency"
  | "new_request"
  | "config_update"
  | "snapshot";

type Subscriber = (event: RadioEvent, data: unknown) => void;

const globalForBus = globalThis as unknown as { radioBus?: Set<Subscriber> };

const subscribers: Set<Subscriber> = globalForBus.radioBus ?? new Set();
globalForBus.radioBus = subscribers;

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function emit(event: RadioEvent, data: unknown): void {
  for (const fn of subscribers) {
    try {
      fn(event, data);
    } catch {
      subscribers.delete(fn);
    }
  }
}
