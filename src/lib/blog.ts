import { getCollection, type CollectionEntry } from 'astro:content'
import type { TagId } from './tags'

export const BLOG_PAGE_SIZE = 5

export type BlogPost = CollectionEntry<'blog'>

export type BlogOrder = 'newest' | 'oldest'

interface GetBlogPostsOptions {
  includeUnpublished?: boolean
}

/**
 * Published blog posts, newest first. Drafts and future-dated posts are visible in the dev
 * server for previewing, but excluded from production builds until their date arrives.
 */
export async function getBlogPosts(options: GetBlogPostsOptions = {}): Promise<BlogPost[]> {
  const includeUnpublished = options.includeUnpublished ?? import.meta.env.DEV
  const now = Date.now()
  const posts = await getCollection('blog')

  return posts
    .filter(
      (post) => includeUnpublished || (!post.data.draft && post.data.pubDate.valueOf() <= now),
    )
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
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
