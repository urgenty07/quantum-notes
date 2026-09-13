import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { siteConfig } from "./src/config";

export default defineConfig({
  site: siteConfig.site,
  base: siteConfig.base,
  trailingSlash: "never",
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex]
    }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark"
      },
      wrap: false
    }
  }
});
