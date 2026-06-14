import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.slogan}`,
    short_name: SITE.shortName,
    description: SITE.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#070707",
    theme_color: "#E31E24",
    lang: "es-EC",
    icons: [
      { src: SITE.logo, sizes: "any", type: "image/png", purpose: "any" },
    ],
  };
}
