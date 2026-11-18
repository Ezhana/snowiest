// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Snowiest'
export const SITE_TITLE_ZH = '簌雪'
export const SITE_DESCRIPTION = 'Snowiest (簌雪) — the personal site of Ezhana.'
export const SITE_DESCRIPTION_ZH = '簌雪（Snowiest）—— Ezhana 的个人站点。'
export const SITE_AUTHOR = 'Ezhana'
export const SITE_GITHUB_PROFILE_URL = 'https://github.com/Ezhana'
export const SITE_GITHUB_URL = 'https://github.com/Ezhana/snowiest'
/** Where link exchanges are requested; the Links page points its exchange note here. */
export const SITE_LINK_EXCHANGE_URL = 'https://github.com/Ezhana/snowiest/issues/1'
export const SITE_URL = 'https://ezhana.github.io/snowiest/'

/** Content licence shown in the footer and in the feed metadata. See LICENSE-CONTENT. */
export const CONTENT_LICENSE_NAME = 'CC BY-NC-SA 4.0'
export const CONTENT_LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0/'

// GitHub Pages serves this project site from the `/snowiest/` sub-path. Astro exposes the
// configured `base` here, always with a trailing slash.
export const BASE_PATH = import.meta.env.BASE_URL

/** Prefix a site-absolute path with the configured base path. */
export function withBase(path: string): string {
  const base = BASE_PATH.replace(/\/+$/, '')
  return `${base}/${path.replace(/^\/+/, '')}`
}
