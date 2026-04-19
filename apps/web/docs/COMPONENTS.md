# Component Conventions

## Directories

- `app/components/base`: reusable primitives
- `app/components/site`: shared site chrome
- `app/components/content`: reusable content patterns
- `app/components/feature`: shared feature-level components

## Styling

- Use semantic variables from `@snowiest/theme`, such as `var(--color-background)`, `var(--color-foreground)`, `var(--radius-md)`, and `var(--spacing)`.
- Do not import or depend on a concrete theme implementation in app components.
- Do not encode theme names in component names, props, or class names.
- Keep structural styles in the component and page-specific layout styles at the call site.

## Component API

- Prefer consistent prop names: `variant`, `size`, `tone`, `disabled`, `loading`.
- Use semantic variants, for example `tone="accent"`, not theme names.
- Prefer slots over narrowly scoped text props.
- Express component state with `aria-*` and `data-*` attributes.

## Accessibility

- Use native elements first: `button`, `a`, `input`, `select`, `textarea`.
- Add ARIA only when native semantics are insufficient.
- Treat keyboard and focus behavior as part of the component contract.
