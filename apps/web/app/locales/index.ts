import enUS from './en-US'
import zhCN from './zh-CN'

import type { AppLocale, LeafPaths, MessageValue } from './types'

export type { AppLocale, MessageValue } from './types'

export const localeOptions = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'EN' },
] as const satisfies ReadonlyArray<{ code: AppLocale, label: string }>

export const localeCodes = localeOptions.map(option => option.code)

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const satisfies Record<AppLocale, MessageValue>

export type TranslationSchema = typeof zhCN
export type TranslationKey = LeafPaths<TranslationSchema>
