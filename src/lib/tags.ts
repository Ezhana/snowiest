import type { Lang } from '../i18n/ui'

interface TagDefinition {
  id: string
  label: Record<Lang, string>
}

export const TAG_DEFINITIONS = [
  { id: 'astro', label: { zh: 'Astro', en: 'Astro' } },
  { id: 'design', label: { zh: '设计', en: 'Design' } },
  { id: 'engineering', label: { zh: '工程', en: 'Engineering' } },
  { id: 'writing', label: { zh: '写作', en: 'Writing' } },
  { id: 'notes', label: { zh: '随笔', en: 'Notes' } },
  { id: 'life', label: { zh: '生活', en: 'Life' } },
  { id: 'acgn', label: { zh: 'ACGN', en: 'ACGN' } },
  { id: 'framework', label: { zh: '框架', en: 'Framework' } },
  { id: 'code', label: { zh: '代码', en: 'Code' } },
  { id: 'wiki', label: { zh: '百科', en: 'Wiki' } },
] as const satisfies readonly TagDefinition[]

export type TagId = (typeof TAG_DEFINITIONS)[number]['id']

export const TAG_IDS = TAG_DEFINITIONS.map((tag) => tag.id)

export function getTagDefinition(id: TagId): TagDefinition {
  return TAG_DEFINITIONS.find((tag) => tag.id === id) ?? TAG_DEFINITIONS[0]
}

export function getTagLabel(id: TagId, lang: Lang): string {
  return getTagDefinition(id).label[lang]
}
