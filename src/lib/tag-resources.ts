import type { Lang } from '../i18n/ui'
import { getBlogPosts, type BlogPost } from './blog'
import { getFriendLinksByTag, type FriendLink } from './friends'
import type { TagId } from './tags'

export interface TagResources {
  /** Posts from `lang`'s view that carry the tag, newest first. */
  posts: BlogPost[]
  /** Friend links that carry the tag. */
  friends: readonly FriendLink[]
}

/** Everything the tag detail page renders for `tag` in one language. */
export async function getTagResources(tag: TagId, lang: Lang): Promise<TagResources> {
  const posts = (await getBlogPosts(lang)).filter((post) => post.data.tags.includes(tag))

  return { posts, friends: getFriendLinksByTag(tag) }
}
