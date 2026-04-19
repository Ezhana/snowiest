export type ThemePreference = 'light' | 'dark' | 'system'

export const themeOptions = ['light', 'dark', 'system'] as const satisfies ReadonlyArray<ThemePreference>

export const themeVariants = {
  light: 'cerulean',
  dark: 'cerulean-dark',
} as const

export type ThemeVariant = keyof typeof themeVariants
export type ResolvedTheme = (typeof themeVariants)[ThemeVariant]
