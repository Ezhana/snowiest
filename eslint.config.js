import config from '@ezhana/eslint-config-astro'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  config,
  {
    files: ['scripts/**/*.{js,mjs}'],
    rules: {
      // CLI scripts report through stdout/stderr by design.
      'no-console': 'off',
    },
  },
])
