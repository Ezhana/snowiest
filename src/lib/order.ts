/** Time ordering shared by the blog listing and the moment feed. */
export type Order = 'newest' | 'oldest'

/** Read the `?order` query; anything other than `oldest` means newest-first. */
export function readOrder(search: string): Order {
  return new URLSearchParams(search).get('order') === 'oldest' ? 'oldest' : 'newest'
}

function classes(value: string | undefined): string[] {
  return (value ?? '').split(/\s+/).filter(Boolean)
}

export function setLinkState(link: HTMLElement, active: boolean): void {
  const activeClasses = classes(link.dataset.stateActive)
  const inactiveClasses = classes(link.dataset.stateInactive)

  link.classList.remove(...(active ? inactiveClasses : activeClasses))
  link.classList.add(...(active ? activeClasses : inactiveClasses))

  if (active) {
    link.setAttribute('aria-current', 'page')
  } else {
    link.removeAttribute('aria-current')
  }
}

/**
 * Reflect `order` on every order control. The server renders newest-first as active; this switches
 * the styling when the page is opened with `?order=oldest`.
 */
export function applyOrderLinks(order: Order): void {
  for (const link of document.querySelectorAll<HTMLElement>('[data-order-link]')) {
    setLinkState(link, link.dataset.orderLink === order)
  }
}
