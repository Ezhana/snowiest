import { getRelativeLocaleUrl } from 'astro:i18n'
import { BASE_PATH } from '../consts'
import { defaultLang, type Lang } from './ui'

/** Strip the configured base path (e.g. `/snowiest`) from a pathname. */
export function stripBase(pathname: string): string {
  const base = BASE_PATH.replace(/\/+$/, '')
  if (!base) return pathname
  if (pathname === base) return '/'
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length)
  return pathname
}

/**
 * Build a locale-aware URL from a locale-less path.
 *
 * - `localeUrl('zh', '/blog/')` → `/blog/` (default locale)
 * - `localeUrl('en', '/blog/')` → `/en/blog/`
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

/** Locale-aware RSS feed URL (file URL, so no trailing slash). */
export function rssUrl(lang: Lang): string {
  return localeUrl(lang, '/rss.xml').replace(/\/+$/, '')
}
