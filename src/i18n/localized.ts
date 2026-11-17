import { defaultLang, languages, type Lang } from './ui'

/** A value written in one or more supported languages. */
export type Localized<T> = Partial<Record<Lang, T>>

/**
 * Resolve a localized value for `lang`.
 *
 * Fallback policy for the whole site: the requested language first, then the default language,
 * then any other language that has a value. A partial translation degrades to another language
 * instead of rendering empty.
 */
export function localizedValue<T>(value: Localized<T> | undefined, lang: Lang): T | undefined {
  if (!value) return undefined

  const candidates = [lang, defaultLang, ...(Object.keys(languages) as Lang[])]
  for (const candidate of candidates) {
    const resolved = value[candidate]
    if (resolved !== undefined) return resolved
  }

  return undefined
}
