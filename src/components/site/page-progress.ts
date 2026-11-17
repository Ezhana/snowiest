import { prefersReducedMotion } from '../../lib/runtime'

/**
 * Thin top progress bar. The script only writes the next `--progress` target; the stylesheet owns
 * the timing (`320ms` fill, `180ms` fade), so nothing here guesses a duration.
 *
 * The lifecycle follows the browser instead of fixed waits:
 * - `astro:before-preparation` starts a run at 0 and only aims at the first step two frames later,
 *   so the 0 → 12% stretch is a transition instead of a jump;
 * - `astro:after-preparation` fires once the incoming document is fetched and parsed: aim at the
 *   ready step. When it lands before the first frame, the fill simply starts from 0 — it must never
 *   step back to 12% first;
 * - `astro:page-load` does *not* mean the screen has changed: the browser is still playing the view
 *   transition's snapshots. The completion is painted only after `viewTransition.finished`, i.e.
 *   once the live DOM is visible, which is also why the finished 100% can be seen at all;
 * - `transitionend` drives the rest: the completed fill fades out, and the fade's end resets the
 *   fill while the bar is invisible, so nothing ever animates backwards where a reader can see it.
 */

/** First step, aimed at on the second frame after the bar becomes visible. */
const FIRST_STEP = 0.12
/** Aimed at once the incoming document is ready. */
const READY_STEP = 0.65

/** The subset of the browser's ViewTransition this bar needs; Astro's fallback provides it too. */
interface ViewTransitionLike {
  finished: Promise<unknown>
}

export function setupPageProgress(): void {
  const getBar = () => document.querySelector<HTMLElement>('[data-page-progress]')
  const reduceMotion = prefersReducedMotion()

  /** Bumped per navigation, so a stale `finished` cannot complete a newer run. */
  let run = 0
  let phase: 'idle' | 'loading' | 'settling' | 'fading' = 'idle'
  /** Whether the ready step was already aimed at; the first step must not fire after it. */
  let prepared = false
  let frame = 0
  /** The visual transition of the navigation in flight, captured before the swap. */
  let activeTransition: ViewTransitionLike | undefined

  const setProgress = (value: number) => {
    const bar = getBar()
    if (bar) bar.style.setProperty('--progress', String(value))
  }

  const setVisible = (visible: boolean) => {
    const bar = getBar()
    if (!bar) return
    bar.classList.toggle('is-visible', visible)
  }

  /** Reset the fill without animating it: only used while the bar is hidden or about to be shown. */
  const snapToZero = () => {
    const bar = getBar()
    if (!bar) return

    bar.classList.add('is-resetting')
    setProgress(0)
    void bar.offsetWidth // commit the reset before the transition comes back
    bar.classList.remove('is-resetting')
  }

  const start = () => {
    run += 1
    cancelAnimationFrame(frame)
    prepared = false

    // A replaced navigation keeps the bar it already shows.
    if (phase === 'loading') return

    // The previous run is still on screen (its fade has not finished): drop its fill instantly
    // instead of animating a visible step backwards.
    const interrupted = phase === 'settling'
    phase = 'loading'

    if (interrupted) snapToZero()
    else setProgress(0)

    setVisible(true)

    if (reduceMotion) return

    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (!prepared) setProgress(FIRST_STEP)
      })
    })
  }

  const markPrepared = () => {
    if (phase !== 'loading') return
    prepared = true
    cancelAnimationFrame(frame)
    setProgress(READY_STEP)
  }

  const settle = () => {
    phase = 'idle'
    setProgress(0)
  }

  const complete = () => {
    if (phase !== 'loading') return

    phase = 'settling'
    cancelAnimationFrame(frame)
    setProgress(1)

    if (reduceMotion) {
      setVisible(false)
      settle()
    }
  }

  /**
   * `<ClientRouter />` reports `astro:page-load` while its snapshots are still on screen. Complete
   * the bar once the transition itself reports it is finished, so the last stretch lands on the
   * live page.
   */
  const finishAfterTransition = async () => {
    const currentRun = run
    const transition = activeTransition
    activeTransition = undefined

    if (transition) {
      try {
        await transition.finished
      } catch {
        // An aborted transition has no visible end; complete anyway.
      }
    }

    if (currentRun !== run) return // a newer navigation owns the bar now
    complete()
  }

  // The fill lands → fade out; the fade lands → reset the fill while it is invisible. The phase is
  // explicit so the fade-in from `start()` cannot be mistaken for the fade-out finishing.
  document.addEventListener('transitionend', (event) => {
    const bar = getBar()
    if (!bar || event.target !== bar) return

    if (event.propertyName === 'transform' && phase === 'settling') {
      phase = 'fading'
      setVisible(false)
    } else if (event.propertyName === 'opacity' && phase === 'fading') {
      settle()
    }
  })

  start()
  if (document.readyState === 'complete') {
    void finishAfterTransition()
  } else {
    window.addEventListener('load', () => void finishAfterTransition(), { once: true })
  }

  document.addEventListener('astro:before-preparation', () => {
    activeTransition = undefined
    start()
  })
  document.addEventListener('astro:before-swap', (rawEvent) => {
    const event = rawEvent as Event & { viewTransition?: ViewTransitionLike | null }
    activeTransition = event.viewTransition ?? undefined
  })
  document.addEventListener('astro:after-preparation', markPrepared)
  document.addEventListener('astro:page-load', () => void finishAfterTransition())

  // Full navigations (for example RSS/XML) and back-forward cache restores.
  const reset = () => {
    run += 1
    cancelAnimationFrame(frame)
    activeTransition = undefined
    phase = 'idle'
    setVisible(false)
    snapToZero()
  }

  window.addEventListener('pagehide', reset)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) reset()
  })
}
