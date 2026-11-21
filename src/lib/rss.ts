import rss from '@astrojs/rss'
import {
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_ZH,
  SITE_TITLE,
  SITE_TITLE_ZH,
  withBase,
} from '../consts'
import { localeUrl } from '../i18n/routing'
import type { Lang } from '../i18n/ui'
import { getBlogPosts, postLang, postSlug } from './blog'

/**
 * RSS 2.0 feed for one language, mirroring `lib/atom.ts`: the same posts (including language
 * fallbacks) and article links that point at the language the body is written in, so a fallback
 * item never links to a page whose canonical URL is elsewhere.
 */
export async function buildRssFeed(lang: Lang, site: URL | undefined): Promise<Response> {
  if (!site) {
    throw new Error('`site` must be configured in astro.config.mjs to build the RSS feed.')
  }

  const posts = await getBlogPosts(lang)

  return rss({
    title: lang === 'zh' ? SITE_TITLE_ZH : SITE_TITLE,
    description: lang === 'zh' ? SITE_DESCRIPTION_ZH : SITE_DESCRIPTION,
    site: new URL(withBase(lang === 'zh' ? '/' : '/en/'), site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: localeUrl(postLang(post), `/blog/${postSlug(post)}/`),
    })),
  })
}
