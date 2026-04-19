import { ceruleanTokens } from './tokens.js'

const createDeclarationBlock = (entries: ReadonlyArray<readonly [string, string]>): string =>
  entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')

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
    '[data-theme="cerulean"] {',
    '  color-scheme: light;',
    createDeclarationBlock(themeValues),
    '}',
  ].join('\n')
}

export const ceruleanThemeCss = createCeruleanThemeCss()
