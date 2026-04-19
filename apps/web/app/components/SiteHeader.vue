<script setup lang="ts">
const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Posts', to: '/posts' },
  { label: 'Tags', to: '/tags' },
  { label: 'About', to: '/about' },
];
</script>
<template>
  <header class="border-b border-border">
    <div>
      <NuxtLink to="/">
        Snowiest
      </NuxtLink>
      <nav aria-label="Primary">
        <ul>
          <li
            v-for="item in navItems"
            :key="item.to"
          >
            <NuxtLink :to="item.to">
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>
