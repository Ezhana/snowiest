<script setup lang="ts">
import type { ThemePreference } from '@snowiest/theme';
import type { PillSwitchOption } from '~/components/ui/PillSwitch.vue';
import type { AppLocale } from '~/locales';

import { useTheme } from '~/composables/useTheme';

const route = useRoute();

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Posts', to: '/posts' },
  { label: 'Tags', to: '/tags' },
];

const isActive = (to: string) => {
  if (to === '/') {
    return route.path === '/';
  }

  return route.path === to || route.path.startsWith(`${to}/`);
};

const { currentLocale, localeOptions, setLocale, t } = useLocale();
const { preference, setTheme } = useTheme();

const localeControlOptions = computed<PillSwitchOption[]>(() =>
  localeOptions.map((option) => {
    const label = option.code === 'en-US' ? 'English' : option.label;
    const compactLabel = option.code === 'zh-CN' ? '中' : 'EN';

    return {
      value: option.code,
      label,
      compactLabel,
      ariaLabel: `${t('controls.locale.label')}: ${label}`,
    };
  }),
);

const themeControlOptions = computed<PillSwitchOption[]>(() => [
  {
    value: 'light',
    label: t('controls.theme.light'),
    icon: 'mdi:white-balance-sunny',
  },
  {
    value: 'dark',
    label: t('controls.theme.dark'),
    icon: 'mdi:moon-waning-crescent',
  },
  {
    value: 'system',
    label: t('controls.theme.system'),
    icon: 'mdi:laptop',
  },
]);

const updateLocale = (locale: string) => {
  setLocale(locale as AppLocale);
};

const updateTheme = (value: string) => {
  setTheme(value as ThemePreference);
};
</script>

<template>
  <header
    class="grid gap-4 border-b border-border px-4 py-4 md:min-h-16 md:grid-cols-[1fr_auto_1fr] md:items-center md:px-6"
  >
    <NuxtLink to="/" class="justify-self-start">
      <p class="text-xl uppercase">Snowiest</p>
      <p class="text-sm">Notes on writing, systems, and the web.</p>
    </NuxtLink>

    <nav aria-label="Primary" class="site-nav md:justify-self-center">
      <ul class="site-nav__list flex list-none gap-4">
        <li v-for="item in navItems" :key="item.to" class="site-nav__item">
          <NuxtLink
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="site-nav__link text-md relative inline-flex items-center px-1 py-2 text-foreground no-underline transition-colors duration-150 ease-out"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="header-controls justify-self-start md:justify-self-end">
      <UiPillSwitch
        :model-value="currentLocale"
        :options="localeControlOptions"
        :group-label="t('controls.locale.label')"
        :collapse-labels="true"
        @update:model-value="updateLocale"
      />
      <UiPillSwitch
        :model-value="preference"
        :options="themeControlOptions"
        :group-label="t('controls.theme.label')"
        :collapse-labels="true"
        @update:model-value="updateTheme"
      />
    </div>
  </header>
</template>

<style scoped>
.site-nav__link::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 200ms ease-out;
}

.site-nav__link:hover,
.site-nav__link[aria-current='page'] {
  color: var(--color-primary);
}

.site-nav__link:hover::after,
.site-nav__link[aria-current='page']::after {
  transform: scaleX(1);
}

.header-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 767px) {
  .header-controls {
    justify-content: space-between;
  }
}
</style>
