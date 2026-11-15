import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { TAG_IDS } from './lib/tags'

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
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
      // Language of the post body. English translations live beside the Chinese original as
      // `<slug>-en.md` and share its slug; see docs/content-authoring.md.
      lang: z.enum(['zh', 'en']).default('zh'),
    }),
})

export const collections = { blog }
