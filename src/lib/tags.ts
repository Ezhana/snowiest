import type { Lang } from '../i18n/ui'

interface TagDefinition {
  id: string
  label: Record<Lang, string>
}

export const TAG_DEFINITIONS = [
  { id: 'design', label: { zh: '设计', en: 'Design' } },
  { id: 'engineering', label: { zh: '工程', en: 'Engineering' } },
  { id: 'writing', label: { zh: '写作', en: 'Writing' } },
  { id: 'notes', label: { zh: '随笔', en: 'Notes' } },
  { id: 'life', label: { zh: '生活', en: 'Life' } },
  { id: 'nonsense', label: { zh: '牢骚', en: 'Nonsense' } },
  { id: 'news', label: { zh: '新闻', en: 'News' } },
  { id: 'olds', label: { zh: '旧闻', en: 'Olds' } },
] as const satisfies readonly TagDefinition[]

export type TagId = (typeof TAG_DEFINITIONS)[number]['id']

export const TAG_IDS = TAG_DEFINITIONS.map((tag) => tag.id)

export function getTagDefinition(id: TagId): TagDefinition {
  return TAG_DEFINITIONS.find((tag) => tag.id === id) ?? TAG_DEFINITIONS[0]
}

export function getTagLabel(id: TagId, lang: Lang): string {
  return getTagDefinition(id).label[lang]
}
