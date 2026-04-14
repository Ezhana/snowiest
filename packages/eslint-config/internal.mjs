import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importX from 'eslint-plugin-import-x'
import globals from 'globals'

export const sharedRules = {
  ...js.configs.recommended.rules,
  'no-debugger': 'warn',
  'no-undef': 'off',
  'no-unused-vars': 'off',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      fixStyle: 'separate-type-imports',
      prefer: 'type-imports',
    },
  ],
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      ignoreRestSiblings: true,
      varsIgnorePattern: '^_',
    },
  ],
  'import-x/no-duplicates': 'error',
  'import-x/order': [
    'warn',
    {
      alphabetize: {
        caseInsensitive: true,
        order: 'asc',
      },
      'newlines-between': 'always',
      groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object', 'type'],
      pathGroups: [
        {
          group: 'internal',
          pattern: '@popecho/**',
          position: 'before',
        },
        {
          group: 'internal',
          pattern: '@pooder/**',
          position: 'before',
        },
        {
          group: 'internal',
          pattern: '~~/**',
          position: 'after',
        },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
    },
  ],
}

export const sharedPlugins = {
  '@typescript-eslint': tsPlugin,
  'import-x': importX,
}

export const ignoreConfig = {
  name: 'popecho/ignores',
  ignores: [
    '**/.cache/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/coverage/**',
    '**/dist/**',
    '**/node_modules/**',
    '**/storybook-static/**',
    '**/vendor/**',
  ],
}

export const browserGlobals = {
  ...globals.browser,
  ...globals.es2024,
}

export const nodeGlobals = {
  ...globals.es2024,
  ...globals.node,
}

export const createTypeScriptConfig = ({
  extraRules = {},
  files = ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  name = 'popecho/typescript',
  runtimeGlobals = {},
} = {}) => ({
  name,
  files,
  languageOptions: {
    ecmaVersion: 'latest',
    globals: runtimeGlobals,
    parser: tsParser,
    sourceType: 'module',
  },
  plugins: sharedPlugins,
  rules: {
    ...sharedRules,
    ...extraRules,
  },
})
