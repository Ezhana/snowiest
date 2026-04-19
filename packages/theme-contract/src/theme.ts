import { designSystemThemeSelectors } from './contract.js'

const createDeclarationBlock = (entries: ReadonlyArray<readonly [string, string]>): string =>
  entries.map(([name, value]) => `  ${name}: ${value};`).join('\n')

export const createThemeContractCss = (): string => {
  const themeVariables = [
    ['--font-sans', `var(${designSystemThemeSelectors.font.family})`],
    ['--color-background', `var(${designSystemThemeSelectors.color.background})`],
    ['--color-surface', `var(${designSystemThemeSelectors.color.surface})`],
    ['--color-foreground', `var(${designSystemThemeSelectors.color.foreground})`],
    ['--color-muted', `var(${designSystemThemeSelectors.color.muted})`],
    ['--color-border', `var(${designSystemThemeSelectors.color.border})`],
    ['--color-primary', `var(${designSystemThemeSelectors.color.primary})`],
    ['--color-primary-foreground', `var(${designSystemThemeSelectors.color['primary-foreground']})`],
    ['--color-accent', `var(${designSystemThemeSelectors.color.accent})`],
    ['--color-accent-foreground', `var(${designSystemThemeSelectors.color['accent-foreground']})`],
    ['--color-link', `var(${designSystemThemeSelectors.color.link})`],
    ['--radius-sm', `var(${designSystemThemeSelectors.radius.sm})`],
    ['--radius-md', `var(${designSystemThemeSelectors.radius.md})`],
    ['--radius-lg', `var(${designSystemThemeSelectors.radius.lg})`],
    ['--radius-xl', `var(${designSystemThemeSelectors.radius.xl})`],
    ['--spacing', `var(${designSystemThemeSelectors.spacing.base})`],
  ] as const

  return [
    '/* Generated from src/contract.ts via createThemeContractCss(). */',
    '@theme inline static {',
    createDeclarationBlock(themeVariables),
    '}',
  ].join('\n')
}

export const themeContractCss = createThemeContractCss()
