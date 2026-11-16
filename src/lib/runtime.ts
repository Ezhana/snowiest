/** Whether the reader asked for reduced motion. Queried on demand: the preference can change. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Run `setup` immediately and again after every ClientRouter navigation; `astro:page-load` also
 * fires on the initial load. `setup` must be idempotent: it runs twice on first paint.
 */
export function onPageLoad(setup: () => void): void {
  setup()
  document.addEventListener('astro:page-load', setup)
}

/** rAF-throttled scroll and resize notifications, removed through `signal`. */
export function onScrollFrame(callback: () => void, signal: AbortSignal): void {
  let frame = 0

  const schedule = () => {
    if (frame) return
    frame = window.requestAnimationFrame(() => {
      frame = 0
      callback()
    })
  }

  window.addEventListener('scroll', schedule, { passive: true, signal })
  window.addEventListener('resize', schedule, { passive: true, signal })
}
