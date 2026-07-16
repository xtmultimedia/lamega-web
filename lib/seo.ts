// Single source of truth for SEO: metadata, JSON-LD, sitemap, robots, manifest,
// llms.txt and the OG image all read from here. Keep station facts in one place.

export const SITE = {
  url: "https://lamegaecuador.com",
  name: "La Mega 99.9 FM",
  shortName: "La Mega",
  alternateName: "La Mega Ecuador",
  frequency: "99.9 FM",
  city: "Ibarra",
  region: "Imbabura",
  country: "Ecuador",
  slogan: "Solo La Mega · Supera a La Mega",
  // Positioning the station wants to emphasize (search + AI engines).
  description:
    "La Mega 99.9 FM, la radio de Ibarra (Imbabura): una de las más escuchadas de la región y por ecuatorianos en todo el mundo. La primera emisora con su propio sistema de transmisión creado con IA — la radio con la mejor tecnología. Reggaetón, pop urbano y los hits del momento, al aire las 24 horas.",
  // Shorter variant for OG/Twitter where space is tight.
  tagline:
    "Una de las radios más escuchadas de Imbabura y por ecuatorianos en el mundo. La 1ª emisora con su propio sistema creado con IA.",
  email: "megacontacto@yahoo.com",
  phone: "096 13 14 999",
  phoneE164: "+593961314999",
  streamUrl: "https://usa3.fastcast4u.com/proxy/lamega?mp=/stream",
  logo: "/assets/mega-logo.png",
  ogImage: "/opengraph-image",
  keywords: [
    "La Mega 99.9",
    "La Mega Ecuador",
    "radio Ibarra",
    "radio Imbabura",
    "radio online Ecuador",
    "emisora Imbabura",
    "reggaetón",
    "pop urbano",
    "radio en vivo Ecuador",
    "99.9 FM",
    "radio ecuatoriana",
  ],
  social: [
    "https://www.instagram.com/lamega99.9ecuador",
    "https://www.tiktok.com/@lamega99.9ecuador",
    "https://www.facebook.com/share/1E1cKiqpTC/",
    "https://youtube.com/@lamega99.9ecuador",
    "https://open.spotify.com/user/31lyqygcxc5llvxdjpv7sdepfd7a",
  ],
} as const;

// schema.org RadioStation — the node search engines and AI models read to
// understand and cite the station.
export function radioStationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RadioStation",
    "@id": `${SITE.url}/#radiostation`,
    name: SITE.name,
    alternateName: SITE.alternateName,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    image: `${SITE.url}${SITE.logo}`,
    description: SITE.description,
    slogan: SITE.slogan,
    broadcastFrequency: SITE.frequency,
    inLanguage: "es-EC",
    areaServed: {
      "@type": "AdministrativeArea",
      name: `${SITE.region}, ${SITE.country}`,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: "EC",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phoneE164,
      email: SITE.email,
      contactType: "customer service",
      areaServed: "EC",
      availableLanguage: ["Spanish"],
    },
    sameAs: [...SITE.social],
  };
}

// /staff — an ItemList of Person nodes so search engines (and AI answers) can
// name the actual on-air team, tied back to the station.
export function staffJsonLd(
  members: { name: string; alias?: string; bio?: string | null; photoUrl?: string | null; socials?: { url: string }[] }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Staff de ${SITE.name}`,
    url: `${SITE.url}/staff`,
    itemListElement: members.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        name: m.name,
        ...(m.alias ? { alternateName: m.alias } : {}),
        jobTitle: "Locutor",
        ...(m.bio ? { description: m.bio } : {}),
        ...(m.photoUrl ? { image: `${SITE.url}${m.photoUrl}` } : {}),
        ...(m.socials?.length ? { sameAs: m.socials.map((s) => s.url) } : {}),
        worksFor: { "@id": `${SITE.url}/#radiostation` },
      },
    })),
  };
}

// EL MEGÁFONO — the blog index, as an ItemList of BlogPosting stubs.
export function megafonoJsonLd(posts: { slug: string; title: string; publishedAt: string | null }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE.url}/megafono#blog`,
    name: `El Megáfono — ${SITE.name}`,
    description: `Noticias y novedades de ${SITE.name}, ${SITE.city}, ${SITE.region}.`,
    url: `${SITE.url}/megafono`,
    inLanguage: "es-EC",
    publisher: { "@id": `${SITE.url}/#radiostation` },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE.url}/megafono/${p.slug}`,
      ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
    })),
  };
}

// A single note. `author`/`publisher` both point at the station: posts are
// signed by El Megáfono, not by individual people.
export function blogPostingJsonLd(post: {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedAt: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE.url}/megafono/${post.slug}#post`,
    headline: post.title,
    url: `${SITE.url}/megafono/${post.slug}`,
    mainEntityOfPage: `${SITE.url}/megafono/${post.slug}`,
    inLanguage: "es-EC",
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.coverUrl ? { image: `${SITE.url}${post.coverUrl}` } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt, dateModified: post.publishedAt } : {}),
    author: { "@id": `${SITE.url}/#radiostation` },
    publisher: { "@id": `${SITE.url}/#radiostation` },
    isPartOf: { "@id": `${SITE.url}/megafono#blog` },
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: "es-EC",
    publisher: { "@id": `${SITE.url}/#radiostation` },
  };
}
