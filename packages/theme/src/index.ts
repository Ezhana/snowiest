import { ceruleanTheme } from '@snowiest/theme-cerulean'

export {
  ceruleanColorTokens,
  ceruleanRadiusTokens,
  ceruleanSpacingTokens,
  ceruleanTheme,
  ceruleanThemeCss,
  ceruleanTokens,
  createCeruleanThemeCss,
  getCeruleanTokenGroup,
} from '@snowiest/theme-cerulean'
export type {
  CeruleanColorName,
  CeruleanRadiusName,
  CeruleanSpacingStep,
  CeruleanTokens,
} from '@snowiest/theme-cerulean'
export {
  createThemeVarsCss,
  designSystemThemeVarSelectors,
  themeVarsCss,
} from '@snowiest/theme-vars'
export type { DesignSystemThemeVars } from '@snowiest/theme-vars'

export type ThemePreference = 'light' | 'dark' | 'system'

export const themePreferences = ['light', 'dark', 'system'] as const satisfies ReadonlyArray<ThemePreference>

export const defaultThemePreference: ThemePreference = 'system'
export const themes = [ceruleanTheme] as const
export const defaultTheme = themes[0]
export const defaultThemeName = defaultTheme.name
export const defaultThemeVariant = defaultTheme.variants.light
export const themeNames = themes.map(({ name }) => name) as ReadonlyArray<ThemeName>
export const themeVariants = Array.from(
  new Set(themes.flatMap(({ variants }) => [variants.light, variants.dark])),
) as ReadonlyArray<ThemeVariant>

export type ThemeDefinition = (typeof themes)[number]
export type ThemeName = ThemeDefinition['name']
export type ThemeVariant = ThemeDefinition['variants'][keyof ThemeDefinition['variants']]

const themeMap = Object.fromEntries(themes.map((theme) => [theme.name, theme])) as Record<ThemeName, ThemeDefinition>

export const isThemePreference = (value: string): value is ThemePreference =>
  themePreferences.some((themePreference) => themePreference === value)

export const isThemeName = (value: string): value is ThemeName =>
  themeNames.some((themeName) => themeName === value)

export const getThemeDefinition = (themeName: ThemeName): ThemeDefinition => themeMap[themeName]

export const resolveThemeVariant = (
  themeName: ThemeName,
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ThemeVariant => {
  const theme = getThemeDefinition(themeName)

  if (preference === 'system') {
    return systemPrefersDark ? theme.variants.dark : theme.variants.light
  }

  return theme.variants[preference]
}
