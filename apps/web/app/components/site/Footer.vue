<script setup lang="ts"></script>
<template>
  <footer
    class="flex min-h-16 items-center justify-between border-t border-border px-6"
  >
    <p>© 2026 Snowiest. Notes on writing, systems, and the web.</p>

    <nav aria-label="Footer">
      <ul class="flex items-start gap-4">
        <li>
          <NuxtLink to="/about"> About </NuxtLink>
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
