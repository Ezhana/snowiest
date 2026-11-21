/**
 * Build-time helper for `@astrojs/sitemap`.
 *
 * An untranslated post is rendered in both locales: the fallback page shows the other language's
 * body and declares its canonical URL on the original language page. Listing that fallback URL in
 * the sitemap would contradict its own canonical, so this integration runs before the sitemap's
 * `astro:build:done` hook, reads the generated HTML, and collects the URLs whose canonical points
 * elsewhere. The sitemap integration's `filter` then drops them.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const CANONICAL = /<link rel="canonical" href="([^"]+)">/

/** Compare canonicals by pathname so trailing slashes and absolute origins do not matter. */
function normalizePathname(url) {
  const { pathname } = new URL(url)
  return pathname.replace(/\/+$/, '') || '/'
}

async function listHtmlFiles(directory) {
  const files = []

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listHtmlFiles(path)))
    else if (entry.name.endsWith('.html')) files.push(path)
  }

  return files
}

/**
 * Collect the URLs that are canonical fallbacks and expose both the integration that fills the set
 * and the sync `filter` callback for `sitemap()`.
 */
export function canonicalFallbackUrls() {
  const fallbackUrls = new Set()
  let site
  let base = '/'

  return {
    integration: {
      name: 'sitemap-canonical-filter',
      hooks: {
        'astro:config:done': ({ config }) => {
          site = config.site
          base = config.base
        },
        'astro:build:done': async ({ dir, logger }) => {
          if (!site) return

          const root = fileURLToPath(dir)
          const baseUrl = new URL(base.endsWith('/') ? base : `${base}/`, site)

          for (const file of await listHtmlFiles(root)) {
            if (!file.endsWith('index.html')) continue

            const relativePage = relative(root, file).replaceAll('\\', '/')
            const html = await readFile(file, 'utf8')
            const canonical = CANONICAL.exec(html)?.[1]
            if (!canonical) continue

            const own = new URL(relativePage.replace(/index\.html$/, ''), baseUrl).href
            if (normalizePathname(canonical) !== normalizePathname(own)) {
              fallbackUrls.add(normalizePathname(own))
            }
          }

          logger.info(`sitemap: excluding ${fallbackUrls.size} canonical fallback page(s)`)
        },
      },
    },
    filter: (page) => !fallbackUrls.has(normalizePathname(page)),
  }
}
