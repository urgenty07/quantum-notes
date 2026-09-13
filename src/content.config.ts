import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum([
      "Quantum Computing",
      "Tensor Network",
      "Quantum Machine Learning",
      "Paper Reading"
    ]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false)
  })
});

export const collections = { blog };
