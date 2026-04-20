<script setup lang="ts"></script>
<template>
  <footer
    class="border-t border-border flex justify-between px-6 min-h-16 items-center"
  >
    <p>© 2026 Snowiest. Notes on writing, systems, and the web.</p>

    <nav aria-label="Footer">
      <ul class="flex gap-4 items-start">
        <li>
          <NuxtLink to="/about">
            About
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/rss.xml">
            <Icon
              name="mdi:rss"
              style="color: orange"
              size="calc(var(--spacing) * 5)"
            />
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </footer>
</template>
