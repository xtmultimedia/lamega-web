# La Mega 99.9 — API para la app de automatización de radio

Base URL (dev): `http://localhost:3000`

## Autenticación

Todos los endpoints `/api/radio/*` (excepto el stream SSE `/api/radio/events`)
requieren el header:

```
X-Radio-API-Key: <RADIO_API_KEY del .env>
```

Si el header falta o es incorrecto, la respuesta es `401`:

```json
{ "error": "Unauthorized" }
```

Cuerpos inválidos devuelven `400` con `details` de validación (zod).

---

## POST /api/radio/now-playing

Actualiza la canción que suena. Se propaga al instante al mini-player,
al player card del Hero y al ticker vía SSE.

**Request**

```json
{
  "title": "El Ganado",
  "artist": "Dayanara",
  "album": "string (opcional)",
  "cover_url": "string (opcional)",
  "duration": 213,
  "started_at": "2026-06-11T14:32:00Z"
}
```

`title` y `artist` son obligatorios. Si `started_at` se omite se usa la hora
del servidor. `duration` en segundos.

**Response** — `200`

```json
{ "ok": true, "now_playing": { "title": "El Ganado", "artist": "Dayanara", "album": null, "cover_url": null, "duration": 213, "started_at": "2026-06-11T14:32:00.000Z" } }
```

**SSE emitido:** `now_playing_update`

```bash
curl -X POST http://localhost:3000/api/radio/now-playing \
  -H "X-Radio-API-Key: $RADIO_API_KEY" -H "Content-Type: application/json" \
  -d '{"title":"El Ganado","artist":"Dayanara","duration":213}'
```

---

## POST /api/radio/program

Actualiza el programa en curso (sitio + dashboard).

**Request**

```json
{
  "program_name": "Megapolis",
  "host": "Andrés El Búho Vera",
  "start_time": "06:00",
  "end_time": "10:00",
  "is_live": true
}
```

**Response** — `200` `{ "ok": true, "program": { ... } }`

**SSE emitido:** `program_update`

---

## GET /api/radio/queue

Cola de solicitudes **aprobadas** por el dashboard, pendientes de poner al
aire, ordenadas por fecha de aprobación.

**Response** — `200`

```json
{
  "queue": [
    {
      "id": "uuid",
      "title": "Provenza",
      "artist": "Karol G",
      "requested_by": "Mariana C.",
      "dedication": "Para mi mamá con amor",
      "requested_at": "2026-06-11T14:32:00.000Z"
    }
  ],
  "count": 8
}
```

```bash
curl http://localhost:3000/api/radio/queue -H "X-Radio-API-Key: $RADIO_API_KEY"
```

---

## POST /api/radio/queue/dequeue

Marca una solicitud como puesta al aire (`status: on_air`) y la retira de la cola.

**Request**

```json
{ "song_request_id": "uuid" }
```

**Response** — `200` `{ "ok": true, "queue": [...], "count": 7 }`
(la cola restante) · `404` si el id no está en la cola.

**SSE emitido:** `queue_update` (con la cola restante)

---

## GET /api/radio/stats

Estadísticas en vivo para el dashboard.

**Response** — `200`

```json
{
  "listeners": 4821,
  "requests_today": 47,
  "requests_pending": 12,
  "queue_length": 8,
  "active_campaigns": 12
}
```

`listeners` es el último valor publicado por la app Python; el resto se
calcula en vivo desde la base de datos.

---

## POST /api/radio/stats/listeners

Actualiza el contador de oyentes en vivo.

**Request**

```json
{ "count": 4821 }
```

**Response** — `200` `{ "ok": true, "listeners": 4821 }`

**SSE emitido:** `listener_count` → `{ "count": 4821 }`

---

## POST /api/radio/emergency

Activa o desactiva el modo emergencia (banner en el sitio + aviso en dashboard).

**Request**

```json
{ "active": true, "message": "Mensaje de emergencia opcional para el staff" }
```

**Response** — `200` `{ "ok": true, "active": true, "message": "..." }`

**SSE emitido:** `emergency` → `{ "active": true, "message": "..." }`

---

## POST /api/radio/tv

Muestra u oculta la sección **Mega TV** en el sitio. Llamar con `true` al
**iniciar** la transmisión en OneStream y con `false` al **detenerla**. El sitio
muestra Mega TV solo mientras `live === true` (auto mostrar/ocultar).

**Request**

```json
{ "live": true }
```

**Response** — `200` `{ "ok": true, "live": true }`

**SSE emitido:** `tv_status` → `{ "live": true }`

---

## GET /api/radio/events — Server-Sent Events

Stream SSE consumido por el sitio público y el dashboard (no requiere API
key: lo abre el navegador). La app Python también puede suscribirse.

Al conectar se envía un evento `snapshot` con el estado completo:

```
event: snapshot
data: { "now_playing": {...}, "program": {...}, "emergency": {...}, "tv_live": false, "stats": {...} }
```

Luego, cada cambio se propaga inmediatamente:

| Evento | Trigger |
|---|---|
| `now_playing_update` | POST /api/radio/now-playing |
| `program_update` | POST /api/radio/program |
| `listener_count` | POST /api/radio/stats/listeners |
| `queue_update` | POST /api/radio/queue/dequeue · aprobar/rechazar en el dashboard |
| `emergency` | POST /api/radio/emergency · acción rápida del dashboard |
| `tv_status` | POST /api/radio/tv (mostrar/ocultar Mega TV) |
| `new_request` | Nueva solicitud enviada desde /pide |

Se envía un comentario heartbeat (`: heartbeat`) cada 25 s para mantener viva
la conexión.

### ⚠️ El servidor cierra la conexión cada ~10 minutos — tu cliente debe reconectar

**Esto es intencional y no es un error.** Cada conexión vive ~10 min (más hasta 90 s de azar) y
después el servidor la **cierra limpiamente**. Al reconectar recibís de nuevo el `snapshot`
completo, así que **no se pierde estado**.

Existe porque el sitio corre en hosting compartido con Passenger: al desplegar, Passenger apaga
la instancia vieja **esperando a que terminen las peticiones en curso**, y un SSE que no termina
nunca la dejaba viva para siempre hasta agotar el límite de procesos de la cuenta y tumbar el
sitio. Detalle en [ARCHITECTURE.md](ARCHITECTURE.md) y [DEPLOYMENT.md](DEPLOYMENT.md).

**Qué significa para tu cliente:** envolvé la lectura del stream en un bucle que reconecte
cuando termine. `radio_client_example.py` ya lo hace — cuando el servidor cierra, el generador
de `sseclient` simplemente termina (sin excepción), el `for` sale y el `while` externo vuelve a
conectar. Si escribís tu propio cliente, **no trates el cierre como un fallo**.

`EventSource` del navegador reconecta solo por especificación, así que el sitio no necesita nada.

```bash
# -N para no bufferear; la conexión va a cerrarse sola a los ~10 min
curl -N http://localhost:3000/api/radio/events
```

---

## Endpoints del sitio (referencia)

No son parte de la API de automatización, pero emiten los eventos anteriores:

- `POST /api/requests` — formulario público “Pide tu canción” → crea
  `SongRequest` (status `pending`) y emite `new_request`.
- `POST /api/campaigns` — formulario “Publicita en La Mega” → crea
  `AdCampaign` y envía email al equipo comercial (Resend).
- `PATCH /api/admin/requests` *(sesión admin)* — aprobar (`approved`, entra a
  la cola) o rechazar (`rejected`) una solicitud; emite `queue_update`.
- `GET /api/station` — público. Programación, locutores, playlists y galería que
  consume la web.
- `GET /api/posts?take=N` — público. Notas **publicadas** de El Megáfono (nunca
  borradores, y sin el cuerpo). Alimenta la franja de la portada. `take` va de 1
  a 24, por defecto 3.
- `/api/admin/*` *(sesión NextAuth + rol)* — el resto del panel: `posts` (blog),
  `me` (perfil propio), `users` (altas, roles, restablecer contraseña), `station`,
  `config`, `upload`. Todas aplican el rol **en el servidor** (401/403); ver
  [ARCHITECTURE.md](ARCHITECTURE.md#autenticación).

## Ciclo de vida de una solicitud

```
/pide (oyente) → pending → [dashboard aprueba] → approved (en cola)
              → [app Python: dequeue]          → on_air
              → [dashboard rechaza]            → rejected
```

Ver `radio_client_example.py` para un cliente Python 3 completo
(`requests` + `sseclient-py`).
