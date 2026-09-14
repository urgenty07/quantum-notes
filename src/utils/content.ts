import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export const categoryMap = {
  "tech-stack": "Tech Stack",
  competitions: "Competitions",
  research: "Research",
  projects: "Projects",
  engineering: "Engineering",
  programming: "Programming",
  "learning-notes": "Learning Notes",
  "quantum-computing": "Quantum Computing",
  "tensor-network": "Tensor Network",
  qml: "Quantum Machine Learning",
  "paper-reading": "Paper Reading"
} as const;

export type CategorySlug = keyof typeof categoryMap;

export function sortPosts(posts: BlogPost[]) {
  return [...posts].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

export function publishedPosts(posts: BlogPost[]) {
  return sortPosts(posts.filter((post) => !post.data.draft));
}

export function readingTime(body: string) {
  const latinWords = body.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const chineseChars = body.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  return Math.max(1, Math.ceil(latinWords / 220 + chineseChars / 400));
}

export function slugifyTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-");
}

export function withBase(path = "/") {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}` || "/";
}

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
