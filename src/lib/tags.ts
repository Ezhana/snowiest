import type { Lang } from '../i18n/ui'
import { TAG_DEFINITIONS, TAG_IDS, type TagId } from './tags.generated'

export { TAG_DEFINITIONS, TAG_IDS }
export type { TagId }

export type TagDefinition = (typeof TAG_DEFINITIONS)[number]

export function getTagDefinition(id: TagId): TagDefinition {
  return TAG_DEFINITIONS.find((tag) => tag.id === id) ?? TAG_DEFINITIONS[0]
}

export function getTagLabel(id: TagId, lang: Lang): string {
  return getTagDefinition(id).label[lang]
}
