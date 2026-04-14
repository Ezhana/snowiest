import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'

import {
  browserGlobals,
  createTypeScriptConfig,
  ignoreConfig,
  sharedPlugins,
  sharedRules,
} from './internal.mjs'

export default [
  ignoreConfig,
  createTypeScriptConfig({
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    name: 'popecho/vue/typescript',
    runtimeGlobals: browserGlobals,
  }),
  ...vue.configs['flat/recommended'],
  {
    name: 'popecho/vue/sfc',
    files: ['**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: browserGlobals,
      parser: vueParser,
      parserOptions: {
        extraFileExtensions: ['.vue'],
        parser: tsParser,
        sourceType: 'module',
      },
    },
    plugins: sharedPlugins,
    rules: {
      ...sharedRules,
      'vue/multi-word-component-names': 'off',
    },
  },
]
