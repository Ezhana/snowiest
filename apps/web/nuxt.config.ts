import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'cerulean',
      },
    },
  },
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/app.css'],
  devtools: { enabled: true },
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
  modules: ['@nuxt/eslint', '@nuxt/fonts'],
  vite: {
    plugins: [tailwindcss()],
  },
})
