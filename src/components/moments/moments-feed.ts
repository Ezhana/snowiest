import { initInfiniteList } from '../../lib/infinite-list'
import { applyOrderLinks, readOrder } from '../../lib/order'
import { onPageLoad } from '../../lib/runtime'

/**
 * The server renders the moments newest-first; reversing the list items yields the oldest-first
 * feed. Each moment is one item, so no nested content has to be reordered.
 */
function applyOldestOrder(root: HTMLElement): void {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-infinite-batch]'))
  const container = items[0]?.parentElement
  if (container) container.append(...items.reverse())
}

/** Moment feed: apply `?order` before the infinite list decides which batches to hide. */
export function setupMomentsFeed(): void {
  onPageLoad(() => {
    const root = document.querySelector<HTMLElement>('[data-moments-feed]')
    if (!root) return

    const order = readOrder(window.location.search)

    if (order === 'oldest' && root.dataset.momentsOrder !== 'oldest') {
      applyOldestOrder(root)
      root.dataset.momentsOrder = 'oldest'
    }

    applyOrderLinks(order)
    initInfiniteList(root)
  })
}
