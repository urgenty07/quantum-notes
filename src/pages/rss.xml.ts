import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../config";
import { publishedPosts } from "../utils/content";

export async function GET(context: { site?: URL }) {
  const posts = publishedPosts(await getCollection("blog"));
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? new URL(siteConfig.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${import.meta.env.BASE_URL}/blog/${post.id}/`.replace(/\/+/g, "/")
    })),
    customData: "<language>zh-CN</language>"
  });
}
