import { prefersReducedMotion } from './runtime'

/**
 * Same-page anchor handling for the reading UI.
 *
 * Markup opts in with `data-scroll-to`; the handler runs in the capture phase so it wins over
 * <ClientRouter />'s fragment navigation (which jumps instantly). Heading jumps stay instant by
 * design — they are targeted jumps, not a return to the start — while every "back to top" entry
 * shares this handler and therefore scrolls smoothly.
 *
 * `scroll-padding-top` on <html> keeps the target heading clear of the sticky header; the header
 * script measures the real header height for it.
 */

let installed = false

function focusTarget(target: HTMLElement): void {
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

export interface ScrollToHashOptions {
  /** Move focus to the target. Disable for decorative jumps. */
  focus?: boolean
  /**
   * Override the motion. Heading jumps from the drawer pass `auto` so they match the aside's
   * instant heading links; "back to top" entries use the default smooth behaviour.
   */
  behavior?: ScrollBehavior
}

/** Scroll to a `#fragment`, updating the URL and (optionally) the focus. */
export function scrollToHash(hash: string, options: ScrollToHashOptions = {}): void {
  const id = hash.replace(/^#/, '')
  if (!id) return

  const behavior = options.behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth')

  // `#page-top` is <main>, which starts below the header. Returning to the top of the document
  // means scrollY = 0, not "align <main> with the scroll padding".
  if (id === 'page-top') {
    window.scrollTo({ top: 0, behavior })
    history.replaceState(null, '', `${location.pathname}${location.search}`)
    return
  }

  const target = document.getElementById(id)
  if (!(target instanceof HTMLElement)) return

  target.scrollIntoView({ behavior, block: 'start' })

  const nextHash = `#${id}`
  if (location.hash !== nextHash) history.pushState(null, '', nextHash)

  if (options.focus !== false) focusTarget(target)
}

export function setupAnchorScroll(): void {
  if (installed) return
  installed = true

  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      // An open drawer owns its own anchors: it closes first, then calls `scrollToHash`, so focus
      // lands on the heading instead of being trapped by the modal dialog.
      if (target.closest('dialog[open]')) return

      const link = target.closest<HTMLAnchorElement>('a[data-scroll-to]')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href?.startsWith('#')) return

      event.preventDefault()
      scrollToHash(href)
    },
    { capture: true },
  )
}
