import type { Lang } from '../i18n/ui'

export type TagId = 'astro' | 'design' | 'engineering' | 'writing' | 'notes' | 'life'

interface TagDefinition {
  id: TagId
  label: Record<Lang, string>
}

export const TAG_DEFINITIONS: readonly TagDefinition[] = [
  { id: 'astro', label: { zh: 'Astro', en: 'Astro' } },
  { id: 'design', label: { zh: '设计', en: 'Design' } },
  { id: 'engineering', label: { zh: '工程', en: 'Engineering' } },
  { id: 'writing', label: { zh: '写作', en: 'Writing' } },
  { id: 'notes', label: { zh: '随笔', en: 'Notes' } },
  { id: 'life', label: { zh: '生活', en: 'Life' } },
]

export const TAG_IDS = ['astro', 'design', 'engineering', 'writing', 'notes', 'life'] as const

export function getTagDefinition(id: TagId): TagDefinition {
  return TAG_DEFINITIONS.find((tag) => tag.id === id) ?? TAG_DEFINITIONS[0]
}

export function getTagLabel(id: TagId, lang: Lang): string {
  return getTagDefinition(id).label[lang]
}
