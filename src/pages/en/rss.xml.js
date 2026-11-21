import rss from '@astrojs/rss'
import { SITE_DESCRIPTION, SITE_TITLE, withBase } from '../../consts'
import { localeUrl } from '../../i18n/routing'
import { getBlogPosts, postLang, postSlug } from '../../lib/blog'

export async function GET(context) {
  const posts = await getBlogPosts('en')

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: new URL(withBase('/en/'), context.site),
    items: posts.map((post) => ({
      ...post.data,
      // Link to the language the body is written in so fallback entries do not point at a page
      // whose canonical is elsewhere.
      link: localeUrl(postLang(post), `/blog/${postSlug(post)}/`),
    })),
  })
}
