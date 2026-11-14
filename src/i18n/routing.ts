import { getRelativeLocaleUrl } from 'astro:i18n'
import { defaultLang, type Lang } from './ui'

/**
 * Build a locale-aware URL from a locale-less path.
 *
 * - `localeUrl('en', '/blog/')` → `/blog/`
 * - `localeUrl('zh', '/blog/')` → `/zh/blog/`
 */
export function localeUrl(lang: Lang, path = '/'): string {
  if (path === '/' || path === '') return getRelativeLocaleUrl(lang)
  return getRelativeLocaleUrl(lang, path.replace(/^\/+/, ''))
}

/** Strip the active locale prefix (if any) from a pathname. */
export function stripLocale(pathname: string, lang: Lang): string {
  if (lang === defaultLang) return pathname

  const prefix = `/${lang}`
  if (pathname === prefix || pathname === `${prefix}/`) return '/'
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length)

  return pathname
}
