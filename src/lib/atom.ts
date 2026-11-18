import { Feed } from 'feed'
import {
  CONTENT_LICENSE_NAME,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_ZH,
  SITE_GITHUB_PROFILE_URL,
  SITE_TITLE,
  SITE_TITLE_ZH,
  withBase,
} from '../consts'
import { atomUrl, localeUrl, rssUrl } from '../i18n/routing'
import { useTranslations, type Lang } from '../i18n/ui'
import { getBlogPosts, postSlug } from './blog'
import { getTagLabel } from './tags'

/**
 * Atom 1.0 feed for one language, rendered at `/atom.xml` and `/en/atom.xml`.
 *
 * The shape mirrors the RSS feed built by `@astrojs/rss`: same description-only entries and the
 * same language fallback from `getBlogPosts`, so subscribers see the same posts whichever
 * format they choose. `feed` produces Atom, which RSS readers and podcast clients also accept.
 */
export async function buildAtomFeed(lang: Lang, site: URL | undefined): Promise<string> {
  if (!site) {
    throw new Error('`site` must be configured in astro.config.mjs to build the Atom feed.')
  }

  const t = useTranslations(lang)
  const posts = await getBlogPosts(lang)
  const homeUrl = new URL(localeUrl(lang, '/'), site).toString()
  const feedUrl = new URL(atomUrl(lang), site).toString()
  const rssFeedUrl = new URL(rssUrl(lang), site).toString()
  const latestDate = posts.length
    ? (posts[0].data.updatedDate ?? posts[0].data.pubDate)
    : new Date()

  const feed = new Feed({
    id: feedUrl,
    title: lang === 'zh' ? SITE_TITLE_ZH : SITE_TITLE,
    description: lang === 'zh' ? SITE_DESCRIPTION_ZH : SITE_DESCRIPTION,
    link: homeUrl,
    updated: latestDate,
    favicon: new URL(withBase('/favicon.svg'), site).toString(),
    copyright: t('footer.license').replace('{license}', CONTENT_LICENSE_NAME),
    feedLinks: { atom: feedUrl, rss: rssFeedUrl },
    author: { name: SITE_AUTHOR, link: SITE_GITHUB_PROFILE_URL },
  })

  for (const post of posts) {
    const url = new URL(localeUrl(lang, `/blog/${postSlug(post)}/`), site).toString()

    feed.addItem({
      title: post.data.title,
      id: url,
      link: url,
      date: post.data.updatedDate ?? post.data.pubDate,
      published: post.data.pubDate,
      description: post.data.description,
      author: [{ name: SITE_AUTHOR, link: SITE_GITHUB_PROFILE_URL }],
      category: post.data.tags.map((tag) => ({
        term: tag,
        name: getTagLabel(tag, lang),
        scheme: new URL(localeUrl(lang, `/tag/${tag}/`), site).toString(),
      })),
    })
  }

  return feed.atom1()
}
