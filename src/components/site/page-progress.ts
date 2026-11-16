import { prefersReducedMotion } from '../../lib/runtime'

/**
 * Thin progress bar for page loads and ClientRouter navigations. The marker is persisted across
 * swaps, so element lookups are repeated instead of cached.
 */
export function setupPageProgress(): void {
  const getProgressRoot = () => document.querySelector<HTMLElement>('[data-page-progress]')
  const getProgressBar = () => document.querySelector<HTMLElement>('[data-page-progress-bar]')

  const reduceMotion = prefersReducedMotion()
  const timers = new Set<number>()
  let finished = false

  const paint = (value: number) => {
    const bar = getProgressBar()
    if (bar) bar.style.transform = `scaleX(${value})`
  }

  const setOpacity = (value: string) => {
    const root = getProgressRoot()
    if (root) root.style.opacity = value
  }

  const schedule = (callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      callback()
    }, delay)
    timers.add(id)
  }

  const clearTimers = () => {
    for (const id of timers) window.clearTimeout(id)
    timers.clear()
  }

  /** Hide the bar and cancel pending progress work (page unload / bfcache restore). */
  const reset = () => {
    clearTimers()
    const root = getProgressRoot()
    const bar = getProgressBar()

    if (root) {
      root.style.transition = 'none'
      root.style.opacity = '0'
    }
    if (bar) bar.style.transition = 'none'
    paint(0)

    window.requestAnimationFrame(() => {
      const nextRoot = getProgressRoot()
      const nextBar = getProgressBar()
      if (nextRoot) nextRoot.style.transition = ''
      if (nextBar) nextBar.style.transition = ''
    })
  }

  const start = () => {
    finished = false
    clearTimers()
    setOpacity('1')
    paint(reduceMotion ? 0.6 : 0.15)

    if (!reduceMotion) {
      schedule(() => paint(0.65), 180)
    }
  }

  const finish = () => {
    if (finished) return
    finished = true
    paint(1)
    schedule(
      () => {
        setOpacity('0')
        schedule(() => paint(0), reduceMotion ? 0 : 300)
      },
      reduceMotion ? 0 : 200,
    )
  }

  start()
  if (document.readyState === 'complete') {
    finish()
  } else {
    window.addEventListener('load', finish, { once: true })
  }

  document.addEventListener('astro:before-preparation', start)
  document.addEventListener('astro:page-load', finish)

  // Full navigations (for example RSS/XML) and back-forward cache restores.
  window.addEventListener('pagehide', reset)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) reset()
  })
}
