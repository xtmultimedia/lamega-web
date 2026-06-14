# Fundación SEO (buscadores tradicionales + IA) — Diseño

**Fecha:** 2026-06-14
**Estado:** Aprobado

## Objetivo

Optimizar el SEO de `lamegaecuador.com` para buscadores tradicionales (Google, Bing)
y para buscadores/asistentes de IA (ChatGPT, Perplexity, Gemini, Claude). Hoy el sitio
solo tiene `title` + `description` básicos (y desactualizados: dicen "Guayaquil/Ecuador"
cuando la estación es de **Ibarra, Imbabura**). No hay Open Graph, JSON-LD, robots,
sitemap, manifest ni señales para IA.

## Posicionamiento a recalcar (mensaje de marca)

Estos puntos deben aparecer en la descripción, el JSON-LD, el `llms.txt` y la imagen OG:

- **Una de las radios más escuchadas de Imbabura y por ecuatorianos en todo el mundo.**
- **La primera emisora con su propio sistema de automatización/transmisión creado con
  IA — la radio con la mejor tecnología.**

## Decisiones (confirmadas)

- Alcance: **fundación completa**.
- Crawlers de IA: **permitir todos** (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
  PerplexityBot, Google-Extended, etc.).
- Imagen OG: **generada de marca** por la app.

## Datos reales (fuente de verdad)

- Nombre: **La Mega 99.9 FM** · alternateName "La Mega Ecuador"
- Frecuencia: **99.9 FM** · Ciudad: **Ibarra** · Cobertura: **Imbabura, Ecuador**
- Eslogan: **Solo La Mega · Supera a La Mega**
- Teléfono/WhatsApp: **096 13 14 999** (`+593961314999`)
- Email: **megacontacto@yahoo.com**
- Stream: `https://usa3.fastcast4u.com/proxy/lamega?mp=/stream`
- Dominio: `https://lamegaecuador.com`
- Redes (`sameAs`):
  - Instagram: https://www.instagram.com/lamega99.9ecuador
  - TikTok: https://www.tiktok.com/@lamega99.9ecuador
  - Facebook: https://www.facebook.com/share/1E1cKiqpTC/
  - YouTube: https://youtube.com/@lamega99.9ecuador
  - Spotify: https://open.spotify.com/user/31lyqygcxc5llvxdjpv7sdepfd7a

## Arquitectura

Una sola fuente de verdad en **`lib/seo.ts`** (constantes: SITE_URL, nombre, descripción,
keywords, redes, contacto, programas destacados). La consumen: metadata, JSON-LD, sitemap,
robots, manifest, llms.txt y la imagen OG. Evita duplicar datos.

### 1. `lib/seo.ts`
Exporta `SITE` (objeto con todos los datos de arriba) + helpers:
- `siteMetadata()` → objeto `Metadata` base.
- `radioStationJsonLd()` y `webSiteJsonLd()` → objetos JSON-LD.

### 2. `app/layout.tsx` — metadata rica
- `metadataBase: new URL("https://lamegaecuador.com")`
- `title: { default, template: "%s · La Mega 99.9 FM" }`
- `description` con el posicionamiento (ver arriba).
- `keywords`, `applicationName`, `authors`, `creator`.
- `openGraph`: type `website`, locale `es_EC`, `url`, `siteName`, `title`, `description`,
  `images` (la OG de marca, 1200×630).
- `twitter`: `summary_large_image`, title/description/images.
- `alternates: { canonical: "/" }`
- `robots: { index: true, follow: true, googleBot: { ... max-image-preview:large } }`
- `icons` (favicon + apple-touch).
- JSON-LD inyectado server-side: `<script type="application/ld+json">` con un array
  `[RadioStation, WebSite]` en el `<body>`. `lang="es"` se mantiene.

#### JSON-LD `RadioStation`
`@type: RadioStation`, name, alternateName, url, logo, image, description (posicionamiento),
`broadcastFrequency: "99.9 FM"`, `areaServed: { @type: AdministrativeArea, name: "Imbabura, Ecuador" }`,
`address` (Ibarra, Imbabura, EC), `sameAs: [redes]`, `contactPoint` (telephone, email,
contactType "customer service", areaServed EC, availableLanguage Spanish).

#### JSON-LD `WebSite`
`@type: WebSite`, name, url, inLanguage "es-EC", publisher (ref a la RadioStation).

### 3. Metadata por página
- `/pide`: title propio ("Pide tu canción · Publicita"), description útil, indexable.
- `/admin`, `/admin/login`, `/pide/print`: `robots: { index: false, follow: false }`.

### 4. `app/robots.ts`
Genera `/robots.txt`:
- Regla general `User-agent: *` → `Allow: /`, `Disallow: /admin`, `Disallow: /api`.
- Reglas explícitas `Allow: /` para crawlers de IA: `GPTBot`, `OAI-SearchBot`,
  `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`,
  `Google-Extended`, `Applebot-Extended`, `CCBot`, `Amazonbot`, `Bytespider`.
- `Sitemap: https://lamegaecuador.com/sitemap.xml`.

### 5. `app/sitemap.ts`
Genera `/sitemap.xml` con `/` (priority 1.0) y `/pide` (0.8), `lastModified`, `changeFrequency`.
(Stamp de fecha pasado por constante para no usar `Date.now()` directamente en un punto que
rompa el build determinista — `new Date()` en sitemap es aceptable porque corre en request/build.)

### 6. `app/manifest.ts`
Genera `/manifest.webmanifest`: name, short_name "La Mega", description, `start_url: "/"`,
`display: "standalone"`, `background_color: "#070707"`, `theme_color: "#E31E24"`, icons
(usa `/assets/mega-logo.png` y, si hace falta, tamaños derivados).

### 7. `app/opengraph-image.tsx` (+ reutilizado para twitter)
Imagen 1200×630 vía `next/og` `ImageResponse`: fondo oscuro de marca (`#070707` con glow rojo),
logo, "LA MEGA 99.9 FM", eslogan "Solo La Mega · Supera a La Mega", línea "Ibarra · Imbabura ·
Ecuador" y un sello "La 1ª radio con sistema propio en IA". `size = { width: 1200, height: 630 }`,
`contentType = "image/png"`. Se genera en build → producción sirve estático (sin runtime).
**Fallback** si el standalone no bundlea bien `next/og`/satori: commitear un PNG estático en
`/public/og.png` y referenciarlo en `openGraph.images`. (El runtime de la ruta será `nodejs`,
no edge, por el hosting de FastComet.)

### 8. `public/llms.txt`
Markdown optimizado para modelos de IA, con el posicionamiento al frente:
- Qué es La Mega 99.9 FM (Ibarra, Imbabura; una de las más escuchadas de la región y por
  ecuatorianos en el mundo; primera emisora con sistema propio creado con IA).
- Cómo escuchar (web, app Android/iOS, Alexa, stream).
- Programas y locutores principales.
- Contacto y redes.

### 9. Toques de crawlabilidad (mínimos)
- Asegurar un `<h1>` semántico en la landing (el Hero) si no existe como tal.
- `alt` descriptivos en los logos (`"La Mega 99.9 FM — radio de Ibarra, Imbabura"`).
- No se hacen refactors de layout grandes.

## Fuera de alcance
- Google Search Console / Bing Webmaster / Analytics (requieren la cuenta del usuario; se
  entregan los pasos como guía al final, no se implementan).
- Backlinks, generación de contenido nuevo, blog.

## Verificación
- `npm run build` pasa; standalone incluye robots/sitemap/manifest/OG.
- Local: `/robots.txt` lista los bots de IA + sitemap; `/sitemap.xml` válido;
  `/manifest.webmanifest` válido; la imagen OG carga (1200×630); el JSON-LD parsea y tiene
  `RadioStation` + `WebSite`; `/llms.txt` accesible.
- Páginas admin/print devuelven `noindex` en su `<meta name="robots">`.
- Tras deploy: mismos checks en `https://lamegaecuador.com` + validar el OG con un
  inspector de tarjetas sociales.
