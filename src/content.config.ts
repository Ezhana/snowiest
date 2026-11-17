import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import type { Lang } from './i18n/ui'
import { BLOG_CONTENT_DIR, LINKS_CONTENT_DIR, MOMENTS_CONTENT_DIR } from './lib/content-paths'
import { momentDateFromId } from './lib/moment-id'
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

/** A link slug is a stable identifier, so keep it URL-safe. */
const LINK_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Bilingual text: every language is optional, but at least one must be present. Rendering falls
 * back through `localizedValue`, so a field may carry one or both languages.
 */
const localizedText = z
  .object({
    zh: z.string().optional(),
    en: z.string().optional(),
  } satisfies Record<Lang, z.ZodOptional<z.ZodString>>)
  .refine((text) => Boolean(text.zh || text.en), {
    message: 'must provide zh, en, or both',
  })

const links = defineCollection({
  // One file per link: `src/content/links/<slug>.md`. A link is not necessarily a friend link;
  // the same collection holds friends, tools, references and other places worth listing.
  loader: glob({
    base: `./${LINKS_CONTENT_DIR}`,
    pattern: '**/*.{md,mdx}',
    // The loader otherwise uses the frontmatter `slug` as the entry id and silently drops
    // duplicates after a warning. Keep the file id path-based so the query layer can fail the
    // build on duplicate slugs.
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    slug: z
      .string()
      .regex(LINK_SLUG_PATTERN, 'slug must be lowercase ASCII words joined by hyphens'),
    names: localizedText,
    url: z.url(),
    // One-line introduction per language; optional, because a link without a description is
    // still worth listing.
    description: localizedText.optional(),
    tag: z.enum(TAG_IDS).optional(),
  }),
})

const moments = defineCollection({
  loader: glob({
    base: `./${MOMENTS_CONTENT_DIR}`,
    pattern: '**/*.{md,mdx}',
    // The default id is slugified (lowercased, `+` stripped), which destroys the timestamp.
    // Moments derive their publication time from the filename, so keep it verbatim. Parsing it
    // here also fails the build on a malformed timestamp instead of breaking the first reader.
    generateId: ({ entry }) => {
      const id = entry.replace(/\.(md|mdx)$/, '')
      momentDateFromId(id)
      return id
    },
  }),
  // Moments are zero-configuration: the body carries the content, the filename carries the
  // timestamp, and everything else is optional. See docs/content-authoring.md.
  schema: z.object({
    tags: z.array(z.enum(TAG_IDS)).default([]),
    lang: z.enum(['zh', 'en']).default('zh'),
  }),
})

export const collections = { blog, links, moments }
