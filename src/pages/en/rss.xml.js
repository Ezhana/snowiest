import rss from '@astrojs/rss'
import { SITE_DESCRIPTION, SITE_TITLE, withBase } from '../../consts'
import { getBlogPosts, postSlug } from '../../lib/blog'

export async function GET(context) {
  const posts = await getBlogPosts('en')

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: new URL(withBase('/en/'), context.site),
    items: posts.map((post) => ({
      ...post.data,
      link: withBase(`/en/blog/${postSlug(post)}/`),
    })),
  })
}
