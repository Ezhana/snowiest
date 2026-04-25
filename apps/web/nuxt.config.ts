import { defaultThemeVariant } from '@snowiest/theme';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://snowiest.me';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        'data-theme': defaultThemeVariant,
      },
    },
  },
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/app.css'],
  devtools: { enabled: true },
  experimental: {
    serverAppConfig: false,
  },
  fonts: {
    defaults: {
      styles: ['normal'],
      weights: ['300 800'],
    },
    families: [
      {
        global: true,
        name: 'Public Sans',
        provider: 'google',
      },
    ],
  },
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxtjs/seo', '@nuxt/icon'],
  vite: {
    plugins: [tailwindcss()],
  },
  site: {
    url: siteUrl,
    name: 'Snowiest',
    description:
      'Nostalgia for the rustle of snow, there is plenty of pity to find.',
    defaultLocale: 'zh-CN',
  },
  ogImage: {
    enabled: true,
  },
  seo: {
    treeShakeUseSeoMeta: false,
  },
  icon: {
    serverBundle: {
      collections: ['mdi'],
    },
  },
});
