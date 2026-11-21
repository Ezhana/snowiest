import type { Lang } from '../i18n/ui'
import { TAG_DEFINITIONS, TAG_IDS, type TagId } from './tags.generated'

export { TAG_DEFINITIONS, TAG_IDS }
export type { TagId }

export type TagDefinition = (typeof TAG_DEFINITIONS)[number]

export function getTagDefinition(id: TagId): TagDefinition {
  const definition = TAG_DEFINITIONS.find((tag) => tag.id === id)
  if (!definition) throw new Error(`Unknown tag "${id}".`)
  return definition
}

export function getTagLabel(id: TagId, lang: Lang): string {
  return getTagDefinition(id).label[lang]
}

export interface TagRouteProps {
  tag: TagId
}

/** `getStaticPaths` data shared by the Chinese and English tag routes. */
export function getTagStaticPaths(): Array<{ params: { tag: TagId }; props: TagRouteProps }> {
  return TAG_DEFINITIONS.map((tag) => ({ params: { tag: tag.id }, props: { tag: tag.id } }))
}
