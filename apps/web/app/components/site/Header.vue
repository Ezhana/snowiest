<script setup lang="ts">
import { useTheme } from '~/composables/useTheme';

const route = useRoute();

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Posts', to: '/posts' },
  { label: 'Tags', to: '/tags' },
  { label: 'About', to: '/about' },
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
    class="border-b border-border flex justify-between px-4 min-h-16 items-center"
  >
    <NuxtLink to="/"> Snowiest </NuxtLink>
    <nav aria-label="Primary" class="site-nav">
      <ul class="site-nav__list flex gap-4 list-none">
        <li v-for="item in navItems" :key="item.to" class="site-nav__item">
          <NuxtLink
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="site-nav__link relative inline-flex items-center px-1 py-2 text-md text-foreground no-underline transition-colors duration-150 ease-out"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
    <div class="flex gap-4">
      <button @click="setTheme('system')">
        <Icon name="mdi:theme-light-dark" size="calc(var(--spacing) * 5)" />
      </button>
      <a
        ><Icon
          name="mdi:rss"
          style="color: orange"
          size="calc(var(--spacing) * 5)"
      /></a>
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
