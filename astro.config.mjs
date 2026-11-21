// @ts-check

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import { canonicalFallbackUrls } from './scripts/sitemap-canonical-filter.mjs'

// Fallback post pages declare a canonical URL on the original language page; keep them out of the
// sitemap so it only lists canonical URLs. See scripts/sitemap-canonical-filter.mjs.
const sitemapFilter = canonicalFallbackUrls()

// https://astro.build/config
export default defineConfig({
  // GitHub Pages project site: https://ezhana.github.io/snowiest/
  site: 'https://ezhana.github.io',
  base: '/snowiest',
  integrations: [mdx(), sitemapFilter.integration, sitemap({ filter: sitemapFilter.filter })],
  i18n: {
    defaultLocale: 'zh',
    locales: ['en', 'zh'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // Code blocks emit both syntax palettes as CSS variables; the blog layer
  // (src/styles/blog.css) picks the one that matches the active Ezhana colour mode.
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
})
