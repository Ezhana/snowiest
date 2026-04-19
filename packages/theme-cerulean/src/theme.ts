import { ceruleanTokens } from './tokens.js'

const createDeclarationBlock = (entries: ReadonlyArray<readonly [string, string]>): string =>
  entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')

export const ceruleanTheme = {
  name: 'cerulean',
  label: 'Cerulean',
  variants: {
    light: 'cerulean',
    dark: 'cerulean-dark',
  },
} as const

export const createCeruleanThemeCss = (): string => {
  const themeValues = [
    ['--ds-font-sans', ceruleanTokens.font.family],
    ['--ds-color-background', ceruleanTokens.color.background],
    ['--ds-color-surface', ceruleanTokens.color.surface],
    ['--ds-color-foreground', ceruleanTokens.color.foreground],
    ['--ds-color-muted', ceruleanTokens.color.muted],
    ['--ds-color-border', ceruleanTokens.color.border],
    ['--ds-color-primary', ceruleanTokens.color.primary],
    ['--ds-color-primary-foreground', ceruleanTokens.color['primary-foreground']],
    ['--ds-color-accent', ceruleanTokens.color.accent],
    ['--ds-color-accent-foreground', ceruleanTokens.color['accent-foreground']],
    ['--ds-color-link', ceruleanTokens.color.link],
    ['--ds-radius-sm', ceruleanTokens.radius.sm],
    ['--ds-radius-md', ceruleanTokens.radius.md],
    ['--ds-radius-lg', ceruleanTokens.radius.lg],
    ['--ds-radius-xl', ceruleanTokens.radius.xl],
    ['--ds-spacing', ceruleanTokens.spacing.base],
  ] as const

  return [
    '/* Generated from src/tokens.ts via createCeruleanThemeCss(). */',
    `[data-theme="${ceruleanTheme.variants.light}"] {`,
    '  color-scheme: light;',
    createDeclarationBlock(themeValues),
    '}',
    '',
    `[data-theme="${ceruleanTheme.variants.dark}"] {`,
    '  color-scheme: dark;',
    '  --ds-font-sans: "Public Sans", ui-sans-serif, system-ui, sans-serif;',
    '  --ds-color-background: #09111c;',
    '  --ds-color-surface: #111c2a;',
    '  --ds-color-foreground: #edf4ff;',
    '  --ds-color-muted: #91a4bb;',
    '  --ds-color-border: #24364b;',
    '  --ds-color-primary: #5aa7ff;',
    '  --ds-color-primary-foreground: #07111d;',
    '  --ds-color-accent: #14263b;',
    '  --ds-color-accent-foreground: #dbe9ff;',
    '  --ds-color-link: #8fc0ff;',
    '  --ds-radius-sm: 0.375rem;',
    '  --ds-radius-md: 0.625rem;',
    '  --ds-radius-lg: 0.875rem;',
    '  --ds-radius-xl: 1.125rem;',
    '  --ds-spacing: 0.25rem;',
    '}',
  ].join('\n')
}

export const ceruleanThemeCss = createCeruleanThemeCss()
