import { getCollection, type CollectionEntry } from 'astro:content'

export const BLOG_PAGE_SIZE = 4

export type BlogPost = CollectionEntry<'blog'>

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

/** Slice the collection for a 1-based page number. */
export function getBlogPage(posts: BlogPost[], page: number): BlogPage {
  const totalPages = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * BLOG_PAGE_SIZE

  return {
    posts: posts.slice(start, start + BLOG_PAGE_SIZE),
    currentPage,
    totalPages,
  }
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
