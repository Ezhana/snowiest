import {
  localeCodes,
  localeOptions,
  messages,
  type AppLocale,
  type MessageValue,
  type TranslationKey,
} from '~/locales';

const getMessage = (locale: AppLocale, path: TranslationKey): string => {
  const segments = path.split('.');
  let current: MessageValue | undefined = messages[locale];

  for (const segment of segments) {
    if (
      typeof current !== 'object' ||
      current === null ||
      !(segment in current)
    ) {
      return path;
    }

    current = current[segment];
  }

  return typeof current === 'string' ? current : path;
};

export const useLocale = () => {
  const currentLocale = useCookie<AppLocale>('app-locale', {
    default: () => 'zh-CN',
  });

  const setLocale = (locale: AppLocale) => {
    if (localeCodes.includes(locale)) {
      currentLocale.value = locale;
    }
  };

  const t = (path: TranslationKey) => getMessage(currentLocale.value, path);

  return {
    currentLocale,
    localeOptions,
    setLocale,
    t,
  };
};
