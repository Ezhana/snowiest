<script setup lang="ts">
const { resolvedTheme } = useTheme();
const { currentLocale } = useLocale();

useHead({
  htmlAttrs: {
    'data-theme': resolvedTheme,
    lang: currentLocale,
  },
});
useSeoMeta({
  titleTemplate: (title) => (title ? `${title} · Snowiest` : 'Snowiest'),
  ogSiteName: 'Snowiest',
});
</script>

<template>
  <NuxtLoadingIndicator color="var(--color-primary)" />
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
