import { getCollection, type CollectionEntry } from 'astro:content'
import { localizedValue } from '../i18n/localized'
import type { Lang } from '../i18n/ui'
import type { TagId } from './tags'

export type Link = CollectionEntry<'links'>

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
 * meaning; the About page labels the list as unordered.
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
