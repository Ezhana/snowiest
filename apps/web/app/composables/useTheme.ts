import { themeOptions, themeVariants, type ResolvedTheme, type ThemePreference } from '~/config/themes'

export const useTheme = () => {
  const preference = useCookie<ThemePreference>('theme-preference', {
    default: () => 'system',
  })
  const systemPrefersDark = useState('theme-system-prefers-dark', () => false)
  const mediaQuery = import.meta.client ? window.matchMedia('(prefers-color-scheme: dark)') : null

  const syncSystemPreference = (matches: boolean) => {
    systemPrefersDark.value = matches
  }

  const updatePreference = (event: MediaQueryListEvent) => syncSystemPreference(event.matches)

  if (mediaQuery) {
    syncSystemPreference(mediaQuery.matches)

    onMounted(() => {
      mediaQuery.addEventListener('change', updatePreference)
    })

    onBeforeUnmount(() => {
      mediaQuery.removeEventListener('change', updatePreference)
    })
  }

  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (preference.value === 'system') {
      return systemPrefersDark.value ? themeVariants.dark : themeVariants.light
    }

    return themeVariants[preference.value]
  })

  const setTheme = (value: ThemePreference) => {
    if (themeOptions.includes(value)) {
      preference.value = value
    }
  }

  return {
    preference,
    resolvedTheme,
    setTheme,
    themeOptions,
  }
}
