import { prefersReducedMotion } from '../../lib/runtime'

/**
 * Thin progress bar for page loads and ClientRouter navigations. The marker is persisted across
 * swaps, so element lookups are repeated instead of cached.
 *
 * The lifecycle follows browser state, not guesses:
 * - `astro:before-preparation` starts a run; growing to 65% happens while the page is loading.
 * - `astro:before-swap` hands over the navigation's `ViewTransition`.
 * - `astro:page-load` does *not* mean the screen has changed — the browser is still playing the
 *   snapshot animation. The run only completes after `viewTransition.finished`, i.e. once the live
 *   DOM is actually visible, so the 100% fill and the fade can be seen. Without that wait, the fill
 *   happens behind the snapshots and the bar appears to jump when they are removed.
 * - The fade starts on the bar's own `transitionend`, so the fill duration stays in CSS.
 *
 * Two older rules still hold: a run owns every timer it schedules (a stale growth step would drag
 * the fill back to 65% after completion), and the fill is only reset while invisible (otherwise the
 * completed bar visibly travels back to zero while fading out).
 */

/** The bar fills over 300ms (`transition-transform duration-300` in BaseLayout). */
const FILL_MS = 300
/** Safety net for engines that never emit `transitionend` for the completion. */
const FILL_FALLBACK_MS = FILL_MS + 120
/** The root fades over 300ms (`transition-opacity duration-300`). */
const FADE_MS = 300
/** Safety net for engines that never emit `transitionend` for the fade. */
const FADE_FALLBACK_MS = FADE_MS + 200
const GROWTH_DELAY_MS = 180
const GROWTH_VALUE = 0.65
const INITIAL_VALUE = 0.15
const REDUCED_VALUE = 0.6

/** The subset of the browser's ViewTransition the bar needs. Astro's fallback provides it too. */
interface ViewTransitionLike {
  finished: Promise<unknown>
}

export function setupPageProgress(): void {
  const getProgressRoot = () => document.querySelector<HTMLElement>('[data-page-progress]')
  const getProgressBar = () => document.querySelector<HTMLElement>('[data-page-progress-bar]')

  const reduceMotion = prefersReducedMotion()
  const timers = new Set<number>()
  /** Whether a run is in flight (started, not finished yet). */
  let running = false
  /** Drops a pending fade: removes its listener and cancels its fallback timer. */
  let cancelFade: (() => void) | null = null
  /** Drops a pending completion: the bar reached 100% but has not faded out yet. */
  let cancelCompletion: (() => void) | null = null
  /** Guards the deferred restore so an older pass cannot re-enable transitions too early. */
  let transitionEpoch = 0
  /** The visual transition of the navigation in flight, captured before the swap. */
  let activeTransition: ViewTransitionLike | undefined
  /** Bumped per navigation, so a stale `finished` cannot complete a newer run. */
  let navigation = 0

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
    return id
  }

  const clearTimers = () => {
    for (const id of timers) window.clearTimeout(id)
    timers.clear()
  }

  /** Apply one state change without transitions, then hand the elements back to their CSS rules. */
  const withoutTransitions = (apply: () => void) => {
    const epoch = ++transitionEpoch
    const root = getProgressRoot()
    const bar = getProgressBar()

    if (root) root.style.transition = 'none'
    if (bar) bar.style.transition = 'none'
    apply()

    window.requestAnimationFrame(() => {
      if (epoch !== transitionEpoch) return

      const nextRoot = getProgressRoot()
      const nextBar = getProgressBar()
      if (nextRoot) nextRoot.style.transition = ''
      if (nextBar) nextBar.style.transition = ''
    })
  }

  /**
   * Drop the fill to zero without animating it. Only safe once the bar is invisible: this is what
   * keeps the reset from showing up as the bar "walking back".
   */
  const dropFill = () => withoutTransitions(() => paint(0))

  const stopFade = () => {
    cancelFade?.()
    cancelFade = null
  }

  const stopCompletion = () => {
    cancelCompletion?.()
    cancelCompletion = null
  }

  /** Hide the bar and cancel pending progress work (page unload / bfcache restore). */
  const reset = () => {
    stopFade()
    stopCompletion()
    clearTimers()
    running = false
    setOpacity('0')
    dropFill()
  }

  const start = () => {
    stopFade()
    stopCompletion()

    let startedRun = false

    withoutTransitions(() => {
      setOpacity('1')

      // An aborted navigation is immediately followed by its replacement; keep the fill where it is
      // instead of snapping it back to the beginning.
      if (running) return

      running = true
      startedRun = true
      clearTimers()
      paint(reduceMotion ? REDUCED_VALUE : INITIAL_VALUE)
    })

    if (startedRun && !reduceMotion) {
      schedule(() => paint(GROWTH_VALUE), GROWTH_DELAY_MS)
    }
  }

  /**
   * Fade the completed bar out, then clear the fill once it has actually disappeared. Waiting for
   * the fade (instead of resetting on a fixed delay) keeps a slow or skipped opacity transition from
   * exposing the scaleX(1) → scaleX(0) jump.
   */
  const hide = () => {
    const root = getProgressRoot()
    const bar = getProgressBar()

    setOpacity('0')

    if (reduceMotion || !root || !bar) {
      dropFill()
      return
    }

    let settled = false

    const settle = () => {
      if (settled) return
      settled = true
      stopFade()
      dropFill()
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === root && event.propertyName === 'opacity') settle()
    }

    root.addEventListener('transitionend', onTransitionEnd)

    const fallbackId = schedule(settle, FADE_FALLBACK_MS)
    cancelFade = () => {
      settled = true
      root.removeEventListener('transitionend', onTransitionEnd)
      window.clearTimeout(fallbackId)
      timers.delete(fallbackId)
    }
  }

  /**
   * Paint the full bar and let its own CSS transition decide when the fade starts: the duration
   * belongs to the stylesheet, the trigger to `finish()`.
   */
  const complete = () => {
    clearTimers()

    if (reduceMotion) {
      withoutTransitions(() => paint(1))
      hide()
      return
    }

    paint(1)

    const bar = getProgressBar()
    if (!bar) {
      hide()
      return
    }

    let settled = false
    let fallbackId = 0

    const cleanup = () => {
      window.clearTimeout(fallbackId)
      bar.removeEventListener('transitionend', onTransitionEnd)
      cancelCompletion = null
    }

    const settle = () => {
      if (settled) return
      settled = true
      cleanup()
      hide()
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === bar && event.propertyName === 'transform') settle()
    }

    bar.addEventListener('transitionend', onTransitionEnd)
    fallbackId = window.setTimeout(settle, FILL_FALLBACK_MS)
    cancelCompletion = () => {
      settled = true
      cleanup()
    }
  }

  const finish = () => {
    if (!running) return

    running = false
    // The growth step must not survive the completion, or it repaints 65% after the bar hit 100%.
    clearTimers()
    complete()
  }

  /**
   * `astro:page-load` fires while the view transition is still on screen: the DOM is swapped, but
   * the browser is playing snapshot animations. Completing the bar then would be invisible — and
   * would be exposed as a jump the moment the live layer replaces the snapshots. Waiting for the
   * transition's own `finished` makes the fill land on the live page instead.
   */
  const finishAfterTransition = async () => {
    const epoch = navigation
    const transition = activeTransition
    activeTransition = undefined

    if (transition) {
      try {
        await transition.finished
      } catch {
        // An aborted transition has no visible end; complete anyway.
      }
    }

    if (epoch !== navigation) return // a newer navigation owns the bar now
    finish()
  }

  start()
  if (document.readyState === 'complete') {
    void finishAfterTransition()
  } else {
    window.addEventListener('load', () => void finishAfterTransition(), { once: true })
  }

  document.addEventListener('astro:before-preparation', () => {
    navigation += 1
    activeTransition = undefined
    start()
  })
  document.addEventListener('astro:before-swap', (rawEvent) => {
    const event = rawEvent as Event & { viewTransition?: ViewTransitionLike | null }
    activeTransition = event.viewTransition ?? undefined
  })
  document.addEventListener('astro:page-load', () => void finishAfterTransition())

  // Full navigations (for example RSS/XML) and back-forward cache restores.
  window.addEventListener('pagehide', reset)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) reset()
  })
}
