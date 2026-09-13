import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL("https://example.com");
  const sitemapPath = `${import.meta.env.BASE_URL}/sitemap-index.xml`.replace(/\/+/g, "/");
  const sitemap = new URL(sitemapPath, origin);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};
