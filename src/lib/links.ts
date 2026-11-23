import { getCollection, type CollectionEntry } from 'astro:content'
import { localizedValue } from '../i18n/localized'
import type { Lang } from '../i18n/ui'
import type { TagId } from './tags'

/** Content record behind a link; pages and components consume `LinkView` instead. */
export type Link = CollectionEntry<'links'>

/** What a link card needs, with its localized text already resolved. */
export interface LinkView {
  slug: string
  url: string
  name: string
  description?: string
  tag?: TagId
  icon?: string
}

/**
 * Curated friend links, in display order. The Links page lists every other entry in its
 * "all links" section first, so a friend never appears twice on the page.
 *
 * The site's own link (`SELF_LINK_SLUG`) stays in this list on purpose: its card is styled by the
 * same listing, and a fork can keep the original site as a friend without editing the page. The
 * "this site" reference panel below the list is a separate, copyable summary for link exchanges.
 */
export const FRIEND_LINK_SLUGS = [
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
  'mashirl',
  'removeif',
  'churk-s-blog',
  'zeora-s-blog',
  'fishcpy',
  'kioshiroi-s-cs-learning-road',
  'yutong-s-site',
  'vullfin-s-blog',
]

/**
 * Friend links whose site does not link back to this site. They remain in the friend list as a
 * record, but render dimmed and non-interactive so the list does not imply a reciprocal link.
 * Slugs must also be listed in `FRIEND_LINK_SLUGS`.
 */
export const ONE_WAY_FRIEND_LINK_SLUGS = [
  'umb-ink',
  'dkrain-com',
  'notbigcake-net',
  'removeif',
] as const

/** The site's own link, also featured in the "this site" reference panel. */
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

/** Map a content record to the localized card model. */
export function toLinkView(link: Link, lang: Lang): LinkView {
  return {
    slug: link.data.slug,
    url: link.data.url,
    name: linkName(link, lang),
    description: linkDescription(link, lang),
    tag: link.data.tag,
    icon: link.data.icon,
  }
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

/** All links as localized cards, in the same stable display order as `getLinks`. */
export async function getLinkViews(lang: Lang): Promise<LinkView[]> {
  return (await getLinks()).map((link) => toLinkView(link, lang))
}

/** Links carrying `tag` as localized cards. */
export async function getLinkViewsByTag(tag: TagId, lang: Lang): Promise<LinkView[]> {
  return (await getLinksByTag(tag)).map((link) => toLinkView(link, lang))
}

/** Curated friend links as localized cards, in `FRIEND_LINK_SLUGS` order. */
export async function getFriendLinkViews(lang: Lang): Promise<LinkView[]> {
  return (await getFriendLinks()).map((link) => toLinkView(link, lang))
}
