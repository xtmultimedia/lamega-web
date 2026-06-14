import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// AI search/assistant crawlers we explicitly welcome so La Mega can be cited in
// ChatGPT, Perplexity, Gemini, Claude, etc.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/admin", "/api"] })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
