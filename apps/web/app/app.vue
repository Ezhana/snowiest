<script setup lang="ts">
import {
  ceruleanColorTokens,
  ceruleanRadiusTokens,
  ceruleanSpacingTokens,
  ceruleanTokens,
} from '@snowiest/theme-cerulean'

const featuredSpacingSteps = ceruleanSpacingTokens.filter(({ step }) => ['1', '2', '4', '8', '12'].includes(step))
</script>

<template>
  <div class="min-h-screen bg-background font-sans text-foreground">
    <NuxtRouteAnnouncer />

    <main class="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
      <section class="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Snowiest / Cerulean</p>
            <h1 class="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              A framework-agnostic theme contract with a concrete Cerulean theme.
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-muted md:text-lg">
              This page imports a stable Tailwind contract from
              <code class="rounded-sm bg-accent px-2 py-1 text-sm text-accent-foreground">@snowiest/theme-contract/theme.css</code>
              and concrete values from
              <code class="rounded-sm bg-accent px-2 py-1 text-sm text-accent-foreground">@snowiest/theme-cerulean/theme.css</code>
              while still reading typed tokens from
              <code class="rounded-sm bg-accent px-2 py-1 text-sm text-accent-foreground">@snowiest/theme-cerulean</code>.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              class="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              type="button"
            >
              Primary action
            </button>
            <button
              class="rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-link transition hover:bg-accent hover:text-accent-foreground"
              type="button"
            >
              Secondary action
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <article class="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Color roles</p>
              <h2 class="mt-2 text-2xl font-semibold">Semantic palette</h2>
            </div>
            <span class="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {{ ceruleanColorTokens.length }} tokens
            </span>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div
              v-for="token in ceruleanColorTokens"
              :key="token.name"
              class="rounded-lg border border-border p-4"
              :style="{ backgroundColor: token.value }"
            >
              <div
                class="flex min-h-24 flex-col justify-between rounded-md border border-black/5 bg-black/5 p-4"
                :style="{
                  color: token.name === 'accent-foreground' ? '#ffffff' : '#0f172a',
                }"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.18em]">{{ token.name }}</p>
                <p class="text-sm">{{ token.value }}</p>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Token contract</p>
          <h2 class="mt-2 text-2xl font-semibold">Core values</h2>

          <dl class="mt-6 space-y-4">
            <div class="rounded-lg border border-border bg-background p-4">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Font stack</dt>
              <dd class="mt-2 text-sm leading-6">{{ ceruleanTokens.font.family }}</dd>
            </div>
            <div class="rounded-lg border border-border bg-background p-4">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Primary color</dt>
              <dd class="mt-2 text-sm leading-6">{{ ceruleanTokens.color.primary }}</dd>
            </div>
            <div class="rounded-lg border border-border bg-background p-4">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Base spacing</dt>
              <dd class="mt-2 text-sm leading-6">{{ ceruleanTokens.spacing.base }}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <article class="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Roundedness</p>
          <h2 class="mt-2 text-2xl font-semibold">Level 2 geometry</h2>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div
              v-for="token in ceruleanRadiusTokens"
              :key="token.name"
              class="border border-border bg-background p-5"
              :class="{
                'rounded-sm': token.name === 'sm',
                'rounded-md': token.name === 'md',
                'rounded-lg': token.name === 'lg',
                'rounded-xl': token.name === 'xl',
              }"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{{ token.name }}</p>
              <p class="mt-3 text-lg font-semibold">{{ token.value }}</p>
              <p class="mt-2 text-sm text-muted">Mapped directly to Tailwind radius utilities.</p>
            </div>
          </div>
        </article>

        <article class="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Spacing scale</p>
          <h2 class="mt-2 text-2xl font-semibold">4px base rhythm</h2>

          <div class="mt-6 space-y-4">
            <div v-for="token in featuredSpacingSteps" :key="token.step" class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium text-foreground">step {{ token.step }}</span>
                <span class="text-muted">{{ token.value }}</span>
              </div>
              <div class="rounded-full bg-accent p-1">
                <div class="h-3 rounded-full bg-primary" :style="{ width: token.value }" />
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>
