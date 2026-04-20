import {
  defaultThemeName,
  defaultThemePreference,
  isThemeName,
  isThemePreference,
  resolveThemeVariant,
  themePreferences,
  themes,
  type ThemeName,
  type ThemePreference,
  type ThemeVariant,
} from '@snowiest/theme';

export const useTheme = () => {
  const preference = useCookie<ThemePreference | string>('theme-preference', {
    default: () => defaultThemePreference,
  });
  const themeName = useCookie<ThemeName | string>('theme-name', {
    default: () => defaultThemeName,
  });
  const systemPrefersDark = useState('theme-system-prefers-dark', () => false);
  const mediaQuery = import.meta.client
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  if (!isThemePreference(preference.value)) {
    preference.value = defaultThemePreference;
  }

  if (!isThemeName(themeName.value)) {
    themeName.value = defaultThemeName;
  }

  const normalizedPreference = computed<ThemePreference>(() =>
    isThemePreference(preference.value)
      ? preference.value
      : defaultThemePreference,
  );
  const normalizedThemeName = computed<ThemeName>(() =>
    isThemeName(themeName.value) ? themeName.value : defaultThemeName,
  );

  const syncSystemPreference = (matches: boolean) => {
    systemPrefersDark.value = matches;
  };

  const updatePreference = (event: MediaQueryListEvent) =>
    syncSystemPreference(event.matches);

  if (mediaQuery) {
    syncSystemPreference(mediaQuery.matches);

    onMounted(() => {
      mediaQuery.addEventListener('change', updatePreference);
    });

    onBeforeUnmount(() => {
      mediaQuery.removeEventListener('change', updatePreference);
    });
  }

  const resolvedTheme = computed<ThemeVariant>(() =>
    resolveThemeVariant(
      normalizedThemeName.value,
      normalizedPreference.value,
      systemPrefersDark.value,
    ),
  );

  const setTheme = (value: ThemePreference) => {
    if (themePreferences.includes(value)) {
      preference.value = value;
    }
  };

  const setThemeName = (value: string) => {
    if (isThemeName(value)) {
      themeName.value = value;
    }
  };

  return {
    preference: normalizedPreference,
    themeName: normalizedThemeName,
    resolvedTheme,
    setTheme,
    setThemeName,
    themeOptions: themePreferences,
    themes,
  };
};
