import rss from '@astrojs/rss'
import { SITE_DESCRIPTION_ZH, SITE_TITLE_ZH, withBase } from '../consts'
import { getBlogPosts, postSlug } from '../lib/blog'

export async function GET(context) {
  const posts = await getBlogPosts('zh')

  return rss({
    title: SITE_TITLE_ZH,
    description: SITE_DESCRIPTION_ZH,
    site: new URL(withBase('/'), context.site),
    items: posts.map((post) => ({
      ...post.data,
      link: withBase(`/blog/${postSlug(post)}/`),
    })),
  })
}
