import { initInfiniteList } from '../../lib/infinite-list'
import { applyOrderLinks, readOrder } from '../../lib/order'
import { onPageLoad } from '../../lib/runtime'

function reverseChildren(element: HTMLElement): void {
  for (const child of Array.from(element.children).reverse()) element.append(child)
}

/**
 * Reorder whole batches and their items. The server renders batches as contiguous newest-first
 * chunks, so reversing the batch order and every batch's contents yields the oldest-first list.
 */
function applyOldestOrder(root: HTMLElement): void {
  const batches = Array.from(root.querySelectorAll<HTMLElement>('[data-infinite-batch]'))
  for (const batch of batches) reverseChildren(batch)

  const container = batches[0]?.parentElement
  if (container) container.append(...batches.reverse())
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
