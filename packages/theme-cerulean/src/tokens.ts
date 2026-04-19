import type { DesignSystemThemeVars } from '@snowiest/theme-vars'

export interface CeruleanTokens extends DesignSystemThemeVars {
  readonly font: DesignSystemThemeVars['font'] & {
    readonly sans: readonly string[]
  }
  readonly spacing: DesignSystemThemeVars['spacing'] & {
    readonly scale: Readonly<Record<string, string>>
  }
}

const fontSans = ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] as const

const spacingBase = '0.25rem'

export const ceruleanTokens = {
  font: {
    family: fontSans.join(', '),
    sans: fontSans,
  },
  color: {
    background: '#f5f9ff',
    surface: '#ffffff',
    foreground: '#1f3142',
    muted: '#718096',
    border: '#cad5e1',
    primary: '#007bff',
    'primary-foreground': '#ffffff',
    accent: '#e7f1ff',
    'accent-foreground': '#0f4f9e',
    link: '#005fcc',
  },
  radius: {
    sm: '0.375rem',
    md: '0.625rem',
    lg: '0.875rem',
    xl: '1.125rem',
  },
  spacing: {
    base: spacingBase,
    scale: {
      '0': '0rem',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '6': '1.5rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
    },
  },
} as const satisfies CeruleanTokens

export type CeruleanColorName = keyof typeof ceruleanTokens.color
export type CeruleanRadiusName = keyof typeof ceruleanTokens.radius
export type CeruleanSpacingStep = keyof typeof ceruleanTokens.spacing.scale

export const ceruleanColorTokens = Object.entries(ceruleanTokens.color).map(([name, value]) => ({
  name: name as CeruleanColorName,
  value,
}))

export const ceruleanRadiusTokens = Object.entries(ceruleanTokens.radius).map(([name, value]) => ({
  name: name as CeruleanRadiusName,
  value,
}))

export const ceruleanSpacingTokens = Object.entries(ceruleanTokens.spacing.scale).map(([step, value]) => ({
  step: step as CeruleanSpacingStep,
  value,
}))

export const getCeruleanTokenGroup = <K extends keyof CeruleanTokens>(key: K): CeruleanTokens[K] =>
  ceruleanTokens[key]
