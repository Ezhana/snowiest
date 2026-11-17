import { prefersReducedMotion } from '../../lib/runtime'

/**
 * Thin progress bar for page loads and ClientRouter navigations. The marker is persisted across
 * swaps, so element lookups are repeated instead of cached.
 *
 * Three rules keep the motion honest:
 * - a run owns every timer it schedules: `finish()` cancels the pending growth step, otherwise that
 *   stale step fires a moment later and drags the fill back to 65% right after it completed;
 * - the fill is only reset while the bar is invisible and without animating it, otherwise the
 *   completed bar visibly travels back to zero while it fades out;
 * - the starting state is painted without a transition, because ClientRouter moves the persisted
 *   marker into the incoming document a few dozen ms later — re-attaching a node cancels the
 *   transitions still in flight and snaps them to their target, which flashes a half-faded bar.
 */

/** The root fades over 300ms (`transition-opacity duration-300`); the fill uses the same 300ms. */
const FADE_MS = 300
/** Hold the full bar until the fill transition has landed before fading it out. */
const HOLD_MS = 300
/** A visible-but-still beat for reduced motion, which skips the animated transitions. */
const SHORT_HOLD_MS = 120
/** Safety net for engines that never emit `transitionend` (or skip the fade entirely). */
const FADE_FALLBACK_MS = FADE_MS + 200
const GROWTH_DELAY_MS = 180
const GROWTH_VALUE = 0.65
const INITIAL_VALUE = 0.15
const REDUCED_VALUE = 0.6
/** Client navigations stop at `GROWTH_VALUE`; the fill to it runs before the swap, where it is visible. */
const PEAK_FILL_MS = 140

export function setupPageProgress(): void {
  const getProgressRoot = () => document.querySelector<HTMLElement>('[data-page-progress]')
  const getProgressBar = () => document.querySelector<HTMLElement>('[data-page-progress-bar]')

  const reduceMotion = prefersReducedMotion()
  const timers = new Set<number>()
  /** Whether a run is in flight (started, not finished yet). */
  let running = false
  /** Drops a pending fade: removes its listener and cancels its fallback timer. */
  let cancelFade: (() => void) | null = null
  /** Guards the deferred restore so an older pass cannot re-enable transitions too early. */
  let transitionEpoch = 0

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

  /** Hide the bar and cancel pending progress work (page unload / bfcache restore). */
  const reset = () => {
    stopFade()
    clearTimers()
    running = false
    setOpacity('0')
    dropFill()
  }

  const start = () => {
    stopFade()

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
   * Fill to the peak with a visible transition and resolve once it lands. `<ClientRouter />` awaits
   * the loader before it swaps, so this is the only place where the last stretch can actually be
   * seen: everything after the swap is covered by the view transition's snapshots.
   */
  const fillToPeak = (signal?: AbortSignal) =>
    new Promise<void>((resolve) => {
      if (!running) return resolve()

      if (reduceMotion) {
        withoutTransitions(() => paint(GROWTH_VALUE))
        return resolve()
      }

      const bar = getProgressBar()
      if (!bar) return resolve()

      clearTimers()

      let settled = false
      let timer = 0

      const settle = () => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        bar.removeEventListener('transitionend', onEnd)
        bar.style.transition = ''
        resolve()
      }

      const onEnd = (event: TransitionEvent) => {
        if (event.target === bar && event.propertyName === 'transform') settle()
      }

      bar.style.transition = `transform ${PEAK_FILL_MS}ms cubic-bezier(0.2, 0, 0, 1)`
      paint(GROWTH_VALUE)
      bar.addEventListener('transitionend', onEnd)
      timer = window.setTimeout(settle, PEAK_FILL_MS + 80)
      signal?.addEventListener('abort', settle, { once: true })
    })

  /** Hold the swap until the bar has visibly reached the peak, then let it fade with the old page. */
  const prepare = (raw: Event) => {
    start()

    const event = raw as Event & { loader: () => Promise<void>; signal: AbortSignal }
    const load = event.loader
    if (typeof load !== 'function') return

    event.loader = async () => {
      await load()
      await fillToPeak(event.signal)
    }
  }

  /**
   * Hide the bar before `<ClientRouter />` snapshots the incoming page: a bar captured mid-fade is
   * frozen in that snapshot and reappears when the live layer takes over.
   */
  const clearBeforeSwap = () => {
    if (!running) return

    stopFade()
    clearTimers()
    running = false
    withoutTransitions(() => {
      setOpacity('0')
      paint(0)
    })
  }

  const finish = () => {
    if (!running) return

    running = false
    // The growth step must not survive the completion, or it repaints 65% after the bar hit 100%.
    clearTimers()

    if (reduceMotion) {
      withoutTransitions(() => paint(1))
    } else {
      paint(1)
    }

    schedule(hide, reduceMotion ? SHORT_HOLD_MS : HOLD_MS)
  }

  start()
  if (document.readyState === 'complete') {
    finish()
  } else {
    window.addEventListener('load', finish, { once: true })
  }

  document.addEventListener('astro:before-preparation', prepare)
  document.addEventListener('astro:before-swap', clearBeforeSwap)
  document.addEventListener('astro:page-load', finish)

  // Full navigations (for example RSS/XML) and back-forward cache restores.
  window.addEventListener('pagehide', reset)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) reset()
  })
}
