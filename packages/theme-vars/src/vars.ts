export interface DesignSystemThemeVars {
  readonly font: {
    readonly family: string
  }
  readonly color: {
    readonly background: string
    readonly surface: string
    readonly foreground: string
    readonly muted: string
    readonly border: string
    readonly primary: string
    readonly 'primary-foreground': string
    readonly accent: string
    readonly 'accent-foreground': string
    readonly link: string
  }
  readonly radius: {
    readonly sm: string
    readonly md: string
    readonly lg: string
    readonly xl: string
  }
  readonly spacing: {
    readonly base: string
  }
}

export const designSystemThemeVarSelectors = {
  font: {
    family: '--ds-font-sans',
  },
  color: {
    background: '--ds-color-background',
    surface: '--ds-color-surface',
    foreground: '--ds-color-foreground',
    muted: '--ds-color-muted',
    border: '--ds-color-border',
    primary: '--ds-color-primary',
    'primary-foreground': '--ds-color-primary-foreground',
    accent: '--ds-color-accent',
    'accent-foreground': '--ds-color-accent-foreground',
    link: '--ds-color-link',
  },
  radius: {
    sm: '--ds-radius-sm',
    md: '--ds-radius-md',
    lg: '--ds-radius-lg',
    xl: '--ds-radius-xl',
  },
  spacing: {
    base: '--ds-spacing',
  },
} as const
