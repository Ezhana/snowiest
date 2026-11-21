/** Time ordering shared by the blog listing and the moment feed. */
export type Order = 'newest' | 'oldest'

/** Read the `?order` query; anything other than `oldest` means newest-first. */
export function readOrder(search: string): Order {
  return new URLSearchParams(search).get('order') === 'oldest' ? 'oldest' : 'newest'
}

/**
 * Mark one link as the current option. The shared control styles in `styles/interaction.css` key
 * the selected appearance off `aria-current`, so no class swapping is needed. `current` defaults to
 * `page` for pagination; sort options use `true` because they select an ordering, not a page.
 */
export function setCurrentLink(
  link: HTMLElement,
  active: boolean,
  current: 'page' | 'true' = 'page',
): void {
  if (active) {
    link.setAttribute('aria-current', current)
  } else {
    link.removeAttribute('aria-current')
  }
}

/**
 * Reflect `order` on every order control. The server renders newest-first as current; this switches
 * `aria-current` when the page is opened with `?order=oldest`. Sorting only works once this script
 * runs, so the controls are revealed here instead of shipping visible but inert links.
 */
export function applyOrderLinks(order: Order): void {
  for (const link of document.querySelectorAll<HTMLElement>('[data-order-link]')) {
    setCurrentLink(link, link.dataset.orderLink === order, 'true')
  }

  for (const filter of document.querySelectorAll<HTMLElement>('[data-order-filter]')) {
    filter.hidden = false
  }
}
