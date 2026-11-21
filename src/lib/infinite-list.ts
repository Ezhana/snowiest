import { onPageLoad, onScrollFrame } from './runtime'

const DEFAULT_INITIAL_BATCHES = 3
const DEFAULT_LOAD_BATCHES = 2
const SENTINEL_MARGIN = 0

let controller: AbortController | null = null
let releaseInstalled = false

/** Stop the active list's listeners; a detached sentinel would otherwise keep "loading". */
function releaseActiveList(): void {
  controller?.abort()
  controller = null
}

/** Leaving the page must release the listeners; nothing on the next page owns them. */
function installRelease(): void {
  if (releaseInstalled) return
  releaseInstalled = true
  document.addEventListener('astro:before-swap', releaseActiveList)
}

function readCount(value: string | undefined, fallback: number): number {
  const count = Number(value)
  return Number.isInteger(count) && count > 0 ? count : fallback
}

/**
 * Turn one server-rendered batch list into an infinite list: expose the sentinel, hide the batches
 * beyond the initial slice, and reveal them on scroll or button activation. Every batch is rendered
 * on the server, so the list is complete without JavaScript.
 *
 * The caller owns which element to initialize, because the homepage timeline and the moment feed
 * must not initialize each other after a client-side navigation. `data-initial-batches` and
 * `data-load-batches` tune the counts.
 */
export function initInfiniteList(list: HTMLElement): void {
  if (list.dataset.infiniteListReady === 'true') return
  list.dataset.infiniteListReady = 'true'

  installRelease()
  releaseActiveList()
  const activeController = new AbortController()
  controller = activeController

  // A back/forward navigation restores the scroll position while the server-rendered document is
  // still tall enough. Hide the extra batches first, then reveal as many as this position needs.
  const restoredScroll = window.scrollY

  const batches = Array.from(list.querySelectorAll<HTMLElement>('[data-infinite-batch]'))
  const sentinel = list.querySelector<HTMLButtonElement>('[data-infinite-sentinel]')
  if (!sentinel) return

  const initialBatches = readCount(list.dataset.initialBatches, DEFAULT_INITIAL_BATCHES)
  const loadBatches = readCount(list.dataset.loadBatches, DEFAULT_LOAD_BATCHES)

  if (batches.length <= initialBatches) {
    sentinel.hidden = true
    return
  }

  sentinel.hidden = false
  for (const batch of batches.slice(initialBatches)) batch.hidden = true

  let visibleBatches = initialBatches

  if (restoredScroll > 0) {
    while (
      visibleBatches < batches.length &&
      document.documentElement.scrollHeight < restoredScroll + window.innerHeight
    ) {
      batches[visibleBatches].hidden = false
      visibleBatches += 1
    }

    sentinel.hidden = visibleBatches >= batches.length

    // Hiding the batches can clamp the scroll position before the document is tall again; put it
    // back after the reveal.
    if (window.scrollY < restoredScroll) {
      window.scrollTo({ top: restoredScroll, behavior: 'auto' })
    }
  }

  let loading = false

  const hasMore = () => visibleBatches < batches.length
  const nearSentinel = () =>
    sentinel.getBoundingClientRect().top < window.innerHeight + SENTINEL_MARGIN

  const loadMore = () => {
    if (loading || !hasMore()) return
    loading = true

    window.setTimeout(() => {
      // The reader may have navigated away while the batch was "loading".
      if (activeController.signal.aborted) return

      const nextBatches = batches.slice(visibleBatches, visibleBatches + loadBatches)
      visibleBatches += nextBatches.length

      for (const batch of nextBatches) {
        batch.hidden = false
        batch.classList.add('animate-fade-up', 'motion-reduce:animate-none')
      }

      loading = false

      if (!hasMore()) {
        sentinel.hidden = true
      } else {
        maybeLoad()
      }
    }, 220)
  }

  const maybeLoad = () => {
    if (!loading && hasMore() && nearSentinel()) loadMore()
  }

  sentinel.addEventListener('click', loadMore, { signal: activeController.signal })
  onScrollFrame(maybeLoad, activeController.signal)
}

/** Setup helper for pages where the infinite list is the only one and needs no DOM reordering. */
export function setupInfiniteList(selector: string): void {
  onPageLoad(() => {
    const list = document.querySelector<HTMLElement>(selector)
    if (list) initInfiniteList(list)
  })
}
