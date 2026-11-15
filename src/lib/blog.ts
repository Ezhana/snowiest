import { getCollection, type CollectionEntry } from 'astro:content'
import type { Lang } from '../i18n/ui'
import type { TagId } from './tags'

export const BLOG_PAGE_SIZE = 5

export type BlogPost = CollectionEntry<'blog'>

export type BlogOrder = 'newest' | 'oldest'

interface GetBlogPostsOptions {
  includeUnpublished?: boolean
}

/** Language declared in the post frontmatter. */
export function postLang(post: BlogPost): Lang {
  return post.data.lang
}

/**
 * URL slug and translation key. Posts are stored as `<slug>.md` / `<slug>-en.md`, so the language
 * suffix is stripped here and both versions of a post share one slug.
 */
export function postSlug(post: BlogPost): string {
  return post.id.replace(/-en$/, '')
}

/**
 * Guard the naming rules the routing relies on: English posts use the `-en` suffix, Chinese posts
 * must not (it would be stripped from their URL), and no slug has two posts in one language.
 * Violations fail the build instead of silently producing duplicate or unreachable pages.
 */
function assertPostConventions(posts: BlogPost[]): void {
  const seen = new Set<string>()

  for (const post of posts) {
    const lang = postLang(post)
    const hasEnglishSuffix = post.id.endsWith('-en')

    if (lang === 'en' && !hasEnglishSuffix) {
      throw new Error(`English post "${post.id}" must use the "-en" filename suffix.`)
    }

    if (lang !== 'en' && hasEnglishSuffix) {
      throw new Error(
        `Post "${post.id}" ends with "-en" but its lang is "${lang}". Rename it or set lang: en.`,
      )
    }

    const key = `${postSlug(post)}:${lang}`
    if (seen.has(key)) {
      throw new Error(`Duplicate ${lang} post for slug "${postSlug(post)}": ${post.id}`)
    }
    seen.add(key)
  }
}

/** Posts that pass the draft / publish-date rules, in no particular order. */
async function getVisiblePosts(options: GetBlogPostsOptions = {}): Promise<BlogPost[]> {
  const includeUnpublished = options.includeUnpublished ?? import.meta.env.DEV
  const now = Date.now()
  const posts = await getCollection('blog')

  const visible = posts.filter(
    (post) => includeUnpublished || (!post.data.draft && post.data.pubDate.valueOf() <= now),
  )
  assertPostConventions(visible)
  return visible
}

/**
 * Posts for one language, newest first. Each slug yields exactly one post: its translation in
 * `lang` when one exists, otherwise the version in the other language, so a language never shows
 * an empty archive just because translations lag behind. Detect the fallback with
 * `postLang(post) !== lang`.
 */
export async function getBlogPosts(
  lang: Lang,
  options: GetBlogPostsOptions = {},
): Promise<BlogPost[]> {
  const visible = await getVisiblePosts(options)
  const groups = new Map<string, BlogPost[]>()

  for (const post of visible) {
    const slug = postSlug(post)
    const group = groups.get(slug)
    if (group) {
      group.push(post)
    } else {
      groups.set(slug, [post])
    }
  }

  return [...groups.values()]
    .map((group) => group.find((post) => postLang(post) === lang) ?? group[0])
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
}

/** All language versions of one slug, keyed by language. Missing languages are absent. */
export async function getPostVariants(
  slug: string,
  options: GetBlogPostsOptions = {},
): Promise<Partial<Record<Lang, BlogPost>>> {
  const posts = (await getVisiblePosts(options)).filter((post) => postSlug(post) === slug)
  const variants: Partial<Record<Lang, BlogPost>> = {}

  for (const post of posts) variants[postLang(post)] = post
  return variants
}

export interface BlogPage {
  posts: BlogPost[]
  currentPage: number
  totalPages: number
}

/** Slice a date-ordered collection for a 1-based page number. */
export function getBlogPage(posts: BlogPost[], page: number, pageSize = BLOG_PAGE_SIZE): BlogPage {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    posts: posts.slice(start, start + pageSize),
    currentPage,
    totalPages,
  }
}

/** Static paths for pages 2..N of the blog index (page 1 is the route entry itself). */
export function getBlogPagePaths(postCount: number, pageSize = BLOG_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(postCount / pageSize))

  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => {
    const page = index + 2
    return { params: { page: String(page) }, props: { page } }
  })
}

export interface TagPagePath {
  params: { tag: TagId; parts?: string }
  props: { tag: TagId; order: BlogOrder; page: number }
}

/** Static paths for a tag archive: both orders and every page of each order. */
export function getTagPagePaths(
  tag: TagId,
  postCount: number,
  pageSize = BLOG_PAGE_SIZE,
): TagPagePath[] {
  const totalPages = Math.max(1, Math.ceil(postCount / pageSize))
  const paths: TagPagePath[] = []

  for (const order of ['newest', 'oldest'] as const) {
    for (let page = 1; page <= totalPages; page += 1) {
      const segments = [
        order === 'oldest' ? 'oldest' : null,
        page > 1 ? 'page' : null,
        page > 1 ? String(page) : null,
      ].filter(Boolean)

      paths.push({
        params: {
          tag,
          parts: segments.length > 0 ? segments.join('/') : undefined,
        },
        props: { tag, order, page },
      })
    }
  }

  return paths
}

export interface BlogMonthGroup {
  key: string
  /** First day of the month, used for the localized month label. */
  date: Date
  posts: BlogPost[]
}

/** Group posts (already newest-first) by calendar month, newest month first. */
export function groupBlogPostsByMonth(posts: BlogPost[]): BlogMonthGroup[] {
  const groups = new Map<string, BlogMonthGroup>()

  for (const post of posts) {
    const date = post.data.pubDate
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = groups.get(key)

    if (existing) {
      existing.posts.push(post)
    } else {
      groups.set(key, {
        key,
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        posts: [post],
      })
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
}
