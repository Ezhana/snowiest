import type { Lang } from '../i18n/ui'
import { getBlogPosts, type BlogPost } from './blog'
import { getLinksByTag, type Link } from './links'
import { getMoments, type Moment } from './moments'
import type { TagId } from './tags'

export interface TagResources {
  /** Posts from `lang`'s view that carry the tag, newest first. */
  posts: BlogPost[]
  /** Links that carry the tag. */
  links: Link[]
  /** Moments that carry the tag, newest first. */
  moments: Moment[]
}

/** Everything the tag detail page renders for `tag` in one language. */
export async function getTagResources(tag: TagId, lang: Lang): Promise<TagResources> {
  const posts = (await getBlogPosts(lang)).filter((post) => post.data.tags.includes(tag))
  const moments = (await getMoments()).filter((moment) => moment.data.tags.includes(tag))

  return { posts, links: await getLinksByTag(tag), moments }
}
