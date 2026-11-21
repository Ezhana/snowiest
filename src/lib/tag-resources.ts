import type { Lang } from '../i18n/ui'
import { getBlogPosts, toBlogPostSummary, type BlogPostSummary } from './blog'
import { getLinkViewsByTag, type LinkView } from './links'
import { getRenderedMoments, type RenderedMoment } from './moments'
import type { TagId } from './tags'

export interface TagResources {
  /** Posts from `lang`'s view that carry the tag, newest first. */
  posts: BlogPostSummary[]
  /** Links that carry the tag, as localized cards. */
  links: LinkView[]
  /** Rendered moments that carry the tag, newest first. */
  moments: RenderedMoment[]
}

/** Everything the tag detail page renders for `tag` in one language. */
export async function getTagResources(tag: TagId, lang: Lang): Promise<TagResources> {
  const posts = (await getBlogPosts(lang))
    .map(toBlogPostSummary)
    .filter((post) => post.tags.includes(tag))

  return {
    posts,
    links: await getLinkViewsByTag(tag, lang),
    moments: await getRenderedMoments(tag),
  }
}
