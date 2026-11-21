import { getCollection, type CollectionEntry } from 'astro:content'
import type { Lang } from '../i18n/ui'
import { BLOG_CONTENT_DIR } from './content-paths'
import { siteMonthKey, siteMonthStart } from './site-date'

export const BLOG_PAGE_SIZE = 5

export type BlogPost = CollectionEntry<'blog'>

/** All existing language versions of one slug, keyed by language. */
export type BlogPostTranslations = Partial<Record<Lang, BlogPost>>

/** Publication-date order: `newest` sorts descending, `oldest` ascending. */
export type BlogOrder = 'newest' | 'oldest'

export interface BlogQueryOptions {
  /** Defaults to `newest`. */
  order?: BlogOrder
}

const BLOG_DIR_PREFIX = `${BLOG_CONTENT_DIR}/`

/** A post folder is a URL: lowercase ASCII words joined by single hyphens. */
const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Language declared in the post frontmatter. */
export function postLang(post: BlogPost): Lang {
  return post.data.lang
}

/** Folder of a post relative to the blog collection, without the Markdown filename. */
function postFolder(post: BlogPost): string | undefined {
  const filePath = post.filePath
  if (!filePath?.startsWith(BLOG_DIR_PREFIX)) return undefined

  const relativePath = filePath.slice(BLOG_DIR_PREFIX.length)
  if (!relativePath.includes('/')) return ''
  return relativePath.replace(/\/[^/]+$/, '')
}

/**
 * URL slug and translation key: the post's folder inside `src/content/blog/`. Every language
 * version lives in the same folder (e.g. `hello-astro/zh.md` and `hello-astro/en.md`), so the
 * folder pairs translations and becomes the URL; Markdown filenames carry no meaning.
 */
export function postSlug(post: BlogPost): string {
  return postFolder(post) ?? post.id.split('/').slice(0, -1).join('/')
}

/**
 * Guard the structure the routing relies on: a post lives in its own folder, the folder is a
 * valid URL segment, and each language has at most one post per folder. Violations fail the build
 * instead of silently producing duplicate or unreachable pages.
 */
function assertPostConventions(posts: BlogPost[]): void {
  const seen = new Set<string>()

  for (const post of posts) {
    const slug = postSlug(post)

    if (!slug) {
      throw new Error(
        `Post "${post.filePath ?? post.id}" must live in its own folder, e.g. src/content/blog/hello-astro/zh.md.`,
      )
    }

    for (const segment of slug.split('/')) {
      if (!SLUG_SEGMENT.test(segment)) {
        throw new Error(
          `Post folder "${slug}" contains the invalid URL segment "${segment}". Folder names become URLs: use lowercase ASCII words joined by hyphens.`,
        )
      }
    }

    const lang = postLang(post)
    const key = `${slug}:${lang}`
    if (seen.has(key)) {
      throw new Error(`Duplicate ${lang} post for slug "${slug}": ${post.id}`)
    }
    seen.add(key)
  }
}

function sortByPubDate(posts: BlogPost[], order: BlogOrder): BlogPost[] {
  const direction = order === 'oldest' ? 1 : -1
  return [...posts].sort(
    (a, b) => direction * (a.data.pubDate.valueOf() - b.data.pubDate.valueOf()),
  )
}

/**
 * Visibility is the shared read layer for every query below: development includes drafts and
 * future posts, production excludes both, and convention violations fail the build.
 */
async function readVisibleBlogPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog')
  const visible = import.meta.env.DEV
    ? posts
    : posts.filter((post) => !post.data.draft && post.data.pubDate.valueOf() <= Date.now())

  assertPostConventions(visible)
  return visible
}

/**
 * Raw query layer: every visible post record in every language, one entry per language version.
 * Translations are not paired and no per-language choice is made.
 */
export async function getAllBlogPosts(options: BlogQueryOptions = {}): Promise<BlogPost[]> {
  return sortByPubDate(await readVisibleBlogPosts(), options.order ?? 'newest')
}

/**
 * Language view: one post per slug, the version written in `lang` when it exists and the other
 * language's version otherwise, so a language never shows an empty archive just because
 * translations lag behind. Detect the fallback with `postLang(post) !== lang`.
 */
export async function getBlogPosts(
  lang: Lang,
  options: BlogQueryOptions = {},
): Promise<BlogPost[]> {
  const groups = new Map<string, BlogPost[]>()

  for (const post of await readVisibleBlogPosts()) {
    const slug = postSlug(post)
    const group = groups.get(slug)
    if (group) {
      group.push(post)
    } else {
      groups.set(slug, [post])
    }
  }

  const view = [...groups.values()].map(
    (group) => group.find((post) => postLang(post) === lang) ?? group[0],
  )

  return sortByPubDate(view, options.order ?? 'newest')
}

/** Exact language version of `slug`; `undefined` when that language has no version. */
export async function getBlogPostBySlug(slug: string, lang: Lang): Promise<BlogPost | undefined> {
  const posts = await readVisibleBlogPosts()
  return posts.find((post) => postSlug(post) === slug && postLang(post) === lang)
}

/** Every existing language version of `slug`, keyed by language. Missing languages are absent. */
export async function getBlogPostTranslations(slug: string): Promise<BlogPostTranslations> {
  const posts = (await readVisibleBlogPosts()).filter((post) => postSlug(post) === slug)
  const translations: BlogPostTranslations = {}

  for (const post of posts) translations[postLang(post)] = post
  return translations
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
    // Month boundaries follow the site time zone, matching how the dates are rendered.
    const key = siteMonthKey(date)
    const existing = groups.get(key)

    if (existing) {
      existing.posts.push(post)
    } else {
      groups.set(key, {
        key,
        date: siteMonthStart(date),
        posts: [post],
      })
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
}
