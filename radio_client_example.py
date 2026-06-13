#!/usr/bin/env python3
"""
La Mega 99.9 — Ejemplo de cliente para la app de automatización de radio.

Muestra cómo la app Python se comunica con el sitio web:
  - POST /api/radio/now-playing      → actualizar canción sonando
  - POST /api/radio/program          → actualizar programa en curso
  - POST /api/radio/stats/listeners  → actualizar contador de oyentes
  - GET  /api/radio/queue            → leer cola de canciones aprobadas
  - POST /api/radio/queue/dequeue    → marcar canción como puesta al aire
  - GET  /api/radio/stats            → estadísticas en vivo
  - POST /api/radio/emergency        → activar/desactivar modo emergencia
  - POST /api/radio/tv               → mostrar/ocultar Mega TV (al aire / fuera)
  - GET  /api/radio/events (SSE)     → escuchar eventos en tiempo real

Dependencias:
    pip install requests sseclient-py

Uso:
    export LAMEGA_BASE_URL=http://localhost:3000
    export LAMEGA_API_KEY=dev_radio_key_lamega999
    python3 radio_client_example.py
"""

import json
import os
import threading
import time
from datetime import datetime, timezone

import requests

BASE_URL = os.environ.get("LAMEGA_BASE_URL", "http://localhost:3000")
API_KEY = os.environ.get("LAMEGA_API_KEY", "dev_radio_key_lamega999")


class LaMegaClient:
    """Cliente HTTP para la API de automatización de La Mega 99.9."""

    def __init__(self, base_url: str = BASE_URL, api_key: str = API_KEY):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "X-Radio-API-Key": api_key,
            "Content-Type": "application/json",
        })

    def _post(self, path: str, payload: dict) -> dict:
        r = self.session.post(f"{self.base_url}{path}", json=payload, timeout=10)
        r.raise_for_status()
        return r.json()

    def _get(self, path: str) -> dict:
        r = self.session.get(f"{self.base_url}{path}", timeout=10)
        r.raise_for_status()
        return r.json()

    # ---- escritura ----

    def set_now_playing(self, title: str, artist: str, duration: int | None = None,
                        album: str | None = None, cover_url: str | None = None,
                        started_at: str | None = None) -> dict:
        """Actualiza la canción que suena (mini-player + hero, en tiempo real)."""
        payload = {"title": title, "artist": artist}
        if album:
            payload["album"] = album
        if cover_url:
            payload["cover_url"] = cover_url
        if duration:
            payload["duration"] = duration
        payload["started_at"] = started_at or datetime.now(timezone.utc).isoformat()
        return self._post("/api/radio/now-playing", payload)

    def set_program(self, program_name: str, host: str, start_time: str,
                    end_time: str, is_live: bool = True) -> dict:
        """Actualiza el programa en curso."""
        return self._post("/api/radio/program", {
            "program_name": program_name,
            "host": host,
            "start_time": start_time,
            "end_time": end_time,
            "is_live": is_live,
        })

    def set_listeners(self, count: int) -> dict:
        """Actualiza el contador de oyentes en vivo del dashboard."""
        return self._post("/api/radio/stats/listeners", {"count": count})

    def set_emergency(self, active: bool, message: str | None = None) -> dict:
        """Activa/desactiva el modo emergencia en sitio y dashboard."""
        payload = {"active": active}
        if message:
            payload["message"] = message
        return self._post("/api/radio/emergency", payload)

    def set_tv_live(self, live: bool) -> dict:
        """Muestra/oculta la sección Mega TV en el sitio.

        Llamar con True al INICIAR la transmisión en OneStream y con False al
        DETENERLA. La web muestra Mega TV solo mientras live == True.
        """
        return self._post("/api/radio/tv", {"live": live})

    # ---- lectura ----

    def get_queue(self) -> dict:
        """Cola de solicitudes aprobadas pendientes de poner al aire."""
        return self._get("/api/radio/queue")

    def dequeue(self, song_request_id: str) -> dict:
        """Marca una solicitud como puesta al aire y la retira de la cola."""
        return self._post("/api/radio/queue/dequeue", {"song_request_id": song_request_id})

    def get_stats(self) -> dict:
        """Estadísticas en vivo (oyentes, solicitudes, cola, campañas)."""
        return self._get("/api/radio/stats")

    # ---- tiempo real (SSE) ----

    def listen_events(self, on_event, stop: threading.Event | None = None) -> None:
        """
        Se suscribe a /api/radio/events y llama on_event(nombre, datos)
        por cada evento (now_playing_update, new_request, queue_update,
        listener_count, program_update, emergency, snapshot).

        Requiere: pip install sseclient-py
        """
        import sseclient  # sseclient-py

        url = f"{self.base_url}/api/radio/events"
        while stop is None or not stop.is_set():
            try:
                r = requests.get(url, stream=True, timeout=(10, None),
                                 headers={"Accept": "text/event-stream"})
                r.raise_for_status()
                client = sseclient.SSEClient(r)
                for event in client.events():
                    if stop is not None and stop.is_set():
                        return
                    try:
                        data = json.loads(event.data)
                    except json.JSONDecodeError:
                        continue
                    on_event(event.event, data)
            except (requests.RequestException, ConnectionError) as exc:
                print(f"[sse] conexión perdida ({exc}); reintentando en 4 s…")
                time.sleep(4)


def demo() -> None:
    client = LaMegaClient()

    print("== Estadísticas actuales ==")
    print(json.dumps(client.get_stats(), indent=2))

    print("\n== Actualizando programa en curso ==")
    client.set_program("Megapolis", "Andrés El Búho Vera", "06:00", "10:00", is_live=True)

    print("== Actualizando canción sonando ==")
    client.set_now_playing("El Ganado", "Dayanara", duration=213)

    print("== Actualizando oyentes ==")
    client.set_listeners(4821)

    print("\n== Cola de solicitudes aprobadas ==")
    queue = client.get_queue()
    print(json.dumps(queue, indent=2, ensure_ascii=False))

    # Poner al aire la primera canción de la cola (si hay)
    if queue["count"] > 0:
        first = queue["queue"][0]
        print(f"\n== Poniendo al aire: {first['title']} · {first['artist']} ==")
        client.dequeue(first["id"])

    # Escuchar eventos en tiempo real durante 30 segundos
    print("\n== Escuchando eventos SSE (30 s)… pide una canción en /pide ==")
    stop = threading.Event()
    t = threading.Thread(
        target=client.listen_events,
        args=(lambda name, data: print(f"[evento] {name}: {json.dumps(data, ensure_ascii=False)}"), stop),
        daemon=True,
    )
    t.start()
    time.sleep(30)
    stop.set()
    print("Listo.")


if __name__ == "__main__":
    demo()
