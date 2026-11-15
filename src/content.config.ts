import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { BLOG_CONTENT_DIR } from './lib/content-paths'
import { TAG_IDS } from './lib/tags'

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: `./${BLOG_CONTENT_DIR}`, pattern: '**/*.{md,mdx}' }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.optional(image()),
      tags: z.array(z.enum(TAG_IDS)).default([]),
      draft: z.boolean().default(false),
      // Language of the post body. Every language version lives in the post's folder, e.g.
      // `hello-astro/zh.md` and `hello-astro/en.md`; see docs/content-authoring.md.
      lang: z.enum(['zh', 'en']).default('zh'),
    }),
})

export const collections = { blog }
