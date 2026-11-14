import { getCollection, type CollectionEntry } from 'astro:content'

export const BLOG_PAGE_SIZE = 5

export type BlogPost = CollectionEntry<'blog'>

export type BlogOrder = 'newest' | 'oldest'

/** All blog posts, newest first. */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog')
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
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
