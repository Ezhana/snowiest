<script setup lang="ts">
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

const { setTheme } = useTheme();
</script>

<template>
  <header
    class="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-6"
  >
    <NuxtLink to="/" class="justify-self-start">
      <p class="text-xl uppercase">Snowiest</p>
      <p class="text-sm">Notes on writing, systems, and the web.</p>
    </NuxtLink>

    <nav aria-label="Primary" class="site-nav">
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

    <div class="flex gap-4 justify-self-end">
      <button @click="setTheme('system')">
        <Icon name="mdi:theme-light-dark" size="calc(var(--spacing) * 5)" />
      </button>
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
</style>
