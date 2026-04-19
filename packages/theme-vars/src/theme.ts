import { designSystemThemeVarSelectors } from './vars.js'

const createDeclarationBlock = (entries: ReadonlyArray<readonly [string, string]>): string =>
  entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')

export const createThemeVarsCss = (): string => {
  const themeVariables = [
    ['--font-sans', `var(${designSystemThemeVarSelectors.font.family})`],
    ['--color-background', `var(${designSystemThemeVarSelectors.color.background})`],
    ['--color-surface', `var(${designSystemThemeVarSelectors.color.surface})`],
    ['--color-foreground', `var(${designSystemThemeVarSelectors.color.foreground})`],
    ['--color-muted', `var(${designSystemThemeVarSelectors.color.muted})`],
    ['--color-border', `var(${designSystemThemeVarSelectors.color.border})`],
    ['--color-primary', `var(${designSystemThemeVarSelectors.color.primary})`],
    ['--color-primary-foreground', `var(${designSystemThemeVarSelectors.color['primary-foreground']})`],
    ['--color-accent', `var(${designSystemThemeVarSelectors.color.accent})`],
    ['--color-accent-foreground', `var(${designSystemThemeVarSelectors.color['accent-foreground']})`],
    ['--color-link', `var(${designSystemThemeVarSelectors.color.link})`],
    ['--radius-sm', `var(${designSystemThemeVarSelectors.radius.sm})`],
    ['--radius-md', `var(${designSystemThemeVarSelectors.radius.md})`],
    ['--radius-lg', `var(${designSystemThemeVarSelectors.radius.lg})`],
    ['--radius-xl', `var(${designSystemThemeVarSelectors.radius.xl})`],
    ['--spacing', `var(${designSystemThemeVarSelectors.spacing.base})`],
  ] as const

  return [
    '/* Generated from src/vars.ts via createThemeVarsCss(). */',
    '@theme inline static {',
    createDeclarationBlock(themeVariables),
    '}',
  ].join('\n')
}

export const themeVarsCss = createThemeVarsCss()
