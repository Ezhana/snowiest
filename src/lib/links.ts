import { getCollection, type CollectionEntry } from 'astro:content'
import { localizedValue } from '../i18n/localized'
import type { Lang } from '../i18n/ui'
import type { TagId } from './tags'

export type Link = CollectionEntry<'links'>

/**
 * Curated friend links, in display order. The Links page lists every other entry in its
 * "all links" section first, so a friend never appears twice on the page.
 */
export const FRIEND_LINK_SLUGS = [
  'bangumi',
  'moegirl',
  'umb-ink',
  'shiyu-dev',
  'imaegoo-s-blog',
  'pinpe',
  'blog-rainiar-top',
  'canxin',
  'notbigcake-net',
  'blog-askrabbit-net',
  'dongyue-org',
  'dkrain-com',
  'snowiest',
  'peter267',
]

/** The site's own link, featured as a reference card instead of a regular listing. */
export const SELF_LINK_SLUG = 'snowiest'

/** Display name in `lang`, falling back to the other language; the schema guarantees one exists. */
export function linkName(link: Link, lang: Lang): string {
  const name = localizedValue(link.data.names, lang)
  if (!name) throw new Error(`Link "${link.id}" has no name in any language.`)
  return name
}

/** Bilingual description with cross-language fallback; `undefined` when the link has none. */
export function linkDescription(link: Link, lang: Lang): string | undefined {
  return localizedValue(link.data.description, lang)
}

/** A slug is the link's stable identity, so duplicates would make the order ambiguous. */
function assertLinkConventions(links: Link[]): void {
  const seen = new Set<string>()

  for (const link of links) {
    const { slug } = link.data
    if (seen.has(slug)) {
      throw new Error(`Duplicate link slug "${slug}": ${link.id}`)
    }
    seen.add(slug)
  }
}

/**
 * All links in a stable display order. The order is deterministic (by slug) but carries no
 * meaning; the Links page labels the list as unordered.
 */
export async function getLinks(): Promise<Link[]> {
  const links = await getCollection('links')
  assertLinkConventions(links)
  return [...links].sort((a, b) =>
    a.data.slug < b.data.slug ? -1 : a.data.slug > b.data.slug ? 1 : 0,
  )
}

/** Links carrying `tag`, in the same stable display order. */
export async function getLinksByTag(tag: TagId): Promise<Link[]> {
  return (await getLinks()).filter((link) => link.data.tag === tag)
}

/**
 * The curated friend links in `FRIEND_LINK_SLUGS` order. A slug with no matching entry fails the
 * build instead of silently dropping a friend.
 */
export async function getFriendLinks(): Promise<Link[]> {
  const links = await getLinks()
  return FRIEND_LINK_SLUGS.map((slug) => {
    const link = links.find((candidate) => candidate.data.slug === slug)
    if (!link) throw new Error(`Friend link "${slug}" is not defined in the links collection.`)
    return link
  })
}
