<script setup lang="ts">
export type PillSwitchOption = {
  value: string;
  label: string;
  icon?: string;
  ariaLabel?: string;
  compactLabel?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: PillSwitchOption[];
    groupLabel: string;
    collapseLabels?: boolean;
  }>(),
  {
    collapseLabels: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const updateValue = (value: string) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <div
    class="pill-switch"
    :class="{ 'pill-switch--collapsible': collapseLabels }"
    role="group"
    :aria-label="groupLabel"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="pill-switch__item"
      :class="{ 'pill-switch__item--active': modelValue === option.value }"
      :aria-pressed="modelValue === option.value"
      :aria-label="option.ariaLabel ?? option.label"
      :title="option.label"
      @click="updateValue(option.value)"
    >
      <Icon
        v-if="option.icon"
        :name="option.icon"
        size="calc(var(--spacing) * 4)"
      />
      <span
        v-if="option.compactLabel"
        class="pill-switch__compact-label"
        aria-hidden="true"
      >
        {{ option.compactLabel }}
      </span>
      <span class="pill-switch__label">
        {{ option.label }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.pill-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  border-radius: 999px;
  background-color: color-mix(
    in srgb,
    var(--color-accent) 58%,
    var(--color-surface) 42%
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 35%, transparent),
    0 14px 28px -24px
      color-mix(in srgb, var(--color-foreground) 20%, transparent);
  transition:
    border-color 320ms ease,
    background-color 320ms ease,
    box-shadow 320ms ease,
    transform 320ms ease;
}

.pill-switch:hover,
.pill-switch:focus-within {
  border-color: color-mix(
    in srgb,
    var(--color-primary) 22%,
    var(--color-border)
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 35%, transparent),
    0 18px 30px -24px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.pill-switch__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.25rem;
  min-width: 2.25rem;
  padding: 0.45rem 0.8rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 260ms ease,
    color 260ms ease,
    background-color 260ms ease,
    box-shadow 260ms ease,
    padding 320ms ease;
}

.pill-switch__item:hover {
  color: var(--color-primary);
  transform: translateY(-1px);
}

.pill-switch__item:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--color-primary) 70%, white 30%);
  outline-offset: 2px;
}

.pill-switch__item--active {
  color: var(--color-foreground);
  background-color: color-mix(
    in srgb,
    var(--color-surface) 78%,
    var(--color-accent) 22%
  );
  box-shadow: inset 0 1px 0 color-mix(in srgb, white 24%, transparent);
}

.pill-switch:is(:hover, :focus-within) .pill-switch__item--active {
  color: var(--color-primary-foreground);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 84%, white 16%),
    var(--color-primary)
  );
  box-shadow:
    0 10px 20px -14px color-mix(in srgb, var(--color-primary) 90%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 28%, transparent);
}

.pill-switch__label {
  display: inline-block;
  max-width: 10ch;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transform: translateX(0);
  transition:
    max-width 320ms ease,
    opacity 260ms ease,
    transform 320ms ease;
}

.pill-switch__compact-label {
  display: inline-block;
  max-width: 3ch;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition:
    max-width 320ms ease,
    opacity 260ms ease,
    margin 320ms ease;
}

.pill-switch--collapsible .pill-switch__item {
  padding-inline: 0.65rem;
}

.pill-switch--collapsible .pill-switch__label {
  max-width: 0;
  opacity: 0;
  transform: translateX(-0.2rem);
}

.pill-switch--collapsible:hover .pill-switch__label,
.pill-switch--collapsible:focus-within .pill-switch__label {
  max-width: 10ch;
  opacity: 1;
  transform: translateX(0);
}

.pill-switch--collapsible:hover .pill-switch__item,
.pill-switch--collapsible:focus-within .pill-switch__item {
  padding-inline: 0.8rem;
}

.pill-switch--collapsible:hover .pill-switch__compact-label,
.pill-switch--collapsible:focus-within .pill-switch__compact-label {
  max-width: 0;
  margin-inline: 0;
  opacity: 0;
}
</style>
