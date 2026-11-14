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
