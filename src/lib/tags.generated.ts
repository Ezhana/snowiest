// Generated from src/content/tags.json by scripts/generate-tags.mjs.
// Do not edit by hand: change the JSON and run `pnpm tags:generate`.

export const TAG_IDS = [
  'design',
  'engineering',
  'writing',
  'notes',
  'life',
  'nonsense',
  'news',
  'olds',
] as const

export type TagId = (typeof TAG_IDS)[number]

export const TAG_DEFINITIONS = [
  { id: 'design', label: { zh: '设计', en: 'Design' } },
  { id: 'engineering', label: { zh: '工程', en: 'Engineering' } },
  { id: 'writing', label: { zh: '写作', en: 'Writing' } },
  { id: 'notes', label: { zh: '随笔', en: 'Notes' } },
  { id: 'life', label: { zh: '日常', en: 'Life' } },
  { id: 'nonsense', label: { zh: '牢骚', en: 'Nonsense' } },
  { id: 'news', label: { zh: '新闻', en: 'News' } },
  { id: 'olds', label: { zh: '旧闻', en: 'Olds' } },
] as const
