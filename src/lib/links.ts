import { getCollection, type CollectionEntry } from 'astro:content'
import type { Lang } from '../i18n/ui'
import type { TagId } from './tags'

export type Link = CollectionEntry<'links'>

/** Bilingual description with cross-language fallback; `undefined` when the link has none. */
export function linkDescription(link: Link, lang: Lang): string | undefined {
  const description = link.data.description
  if (!description) return undefined
  return description[lang] ?? description.zh ?? description.en
}

/** All links, ordered by file id so the list is stable and predictable. */
export async function getLinks(): Promise<Link[]> {
  const links = await getCollection('links')
  return [...links].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** Links carrying `tag`, in file-id order. */
export async function getLinksByTag(tag: TagId): Promise<Link[]> {
  return (await getLinks()).filter((link) => link.data.tag === tag)
}
