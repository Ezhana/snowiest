import { onPageLoad, prefersReducedMotion } from '../../lib/runtime'
import { scrollToHash } from '../../lib/anchor-scroll'

/**
 * Drawer controller for <dialog data-drawer>.
 *
 * Behaviours owned here:
 * - open/close, including the CSS close transition before `dialog.close()`;
 * - `aria-expanded` on every trigger for the drawer;
 * - body scroll lock with scrollbar compensation;
 * - closing on backdrop click, close button, ESC and ClientRouter navigation;
 * - closing when the viewport crosses into `xl`, where the aside takes over.
 *
 * Native `showModal()` already provides the focus trap, background inertness and focus
 * restoration; this module adds the project's motion and cleanup rules.
 */

const CLOSE_DURATION = 300

interface ActiveDrawer {
  dialog: HTMLDialogElement
  trigger: HTMLElement
  closing: boolean
}

export function setupDrawers(): void {
  let controller: AbortController | null = null

  const setup = () => {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    // A ClientRouter swap can happen while a drawer is open; never leave the old page's lock on
    // the new document.
    document.documentElement.classList.remove('has-drawer-open')
    document.documentElement.style.removeProperty('--drawer-scrollbar-gap')

    const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[data-drawer]'))
    if (dialogs.length === 0) return

    let active: ActiveDrawer | null = null

    const triggersFor = (id: string) =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-drawer-trigger]')).filter(
        (trigger) => trigger.dataset.drawerTrigger === id,
      )

    const setExpanded = (id: string, expanded: boolean) => {
      for (const trigger of triggersFor(id)) trigger.setAttribute('aria-expanded', String(expanded))
    }

    const lockScroll = () => {
      // Replacing the scrollbar with padding keeps the header and the reading column from
      // shifting when the scrollbar is hidden.
      const gap = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.setProperty('--drawer-scrollbar-gap', `${gap}px`)
      document.documentElement.classList.add('has-drawer-open')
    }

    const unlockScroll = () => {
      document.documentElement.classList.remove('has-drawer-open')
      document.documentElement.style.removeProperty('--drawer-scrollbar-gap')
    }

    const finishClose = (state: ActiveDrawer, restoreFocus: boolean) => {
      if (state.dialog.open) state.dialog.close()
      state.dialog.removeAttribute('data-state')
      unlockScroll()
      setExpanded(state.dialog.id, false)
      if (active === state) active = null
      // `preventScroll` matters: the phone trigger lives in a sticky header, and a plain
      // `focus()` would scroll the document back toward the header's static position.
      if (restoreFocus && state.trigger.isConnected) state.trigger.focus({ preventScroll: true })
    }

    const close = (immediate = false) => {
      if (!active || active.closing) return

      const state = active
      state.closing = true

      const duration = immediate || prefersReducedMotion() ? 0 : CLOSE_DURATION
      state.dialog.dataset.state = 'closed'

      if (duration === 0) {
        finishClose(state, true)
        return
      }

      window.setTimeout(() => {
        if (active === state) finishClose(state, true)
      }, duration)
    }

    const open = (dialog: HTMLDialogElement, trigger: HTMLElement) => {
      if (dialog.open || active?.dialog === dialog) return

      if (active) {
        // A second trigger cannot normally be reached while the modal is open, but finish a
        // pending close before starting another drawer so the old dialog cannot stay in the layer.
        if (active.closing) finishClose(active, false)
        else close(true)
      }

      const state: ActiveDrawer = { dialog, trigger, closing: false }
      active = state

      dialog.showModal()
      lockScroll()
      setExpanded(dialog.id, true)

      // Let the closed position paint first so the panel actually transitions in.
      window.requestAnimationFrame(() => {
        if (active === state) dialog.dataset.state = 'open'
      })

      dialog.querySelector<HTMLElement>('[data-drawer-close]')?.focus({ preventScroll: true })
    }

    for (const dialog of dialogs) {
      dialog.addEventListener(
        'cancel',
        (event) => {
          event.preventDefault()
          close()
        },
        { signal },
      )

      dialog.addEventListener(
        'click',
        (event) => {
          if (!(event.target instanceof Element)) return

          if (event.target === dialog) {
            close()
            return
          }

          const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]')
          if (!link || !dialog.contains(link)) return

          event.preventDefault()
          const href = link.getAttribute('href')
          const isBackToTop = href === '#page-top'
          // Close without waiting for the 300ms exit: the destination should feel immediate.
          // Restoring focus first keeps focus in the document; a heading jump then moves it on.
          close(true)
          // Heading jumps stay instant, matching the aside's links; the drawer's "back to top"
          // entry uses the shared smooth behaviour.
          if (href) scrollToHash(href, isBackToTop ? {} : { behavior: 'auto' })
        },
        { signal },
      )

      dialog
        .querySelector<HTMLElement>('[data-drawer-close]')
        ?.addEventListener('click', () => close(), { signal })
    }

    document.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element)) return

        const trigger = event.target.closest<HTMLElement>('[data-drawer-trigger]')
        if (!trigger) return

        const id = trigger.dataset.drawerTrigger
        const dialog = id ? document.getElementById(id) : null
        if (!(dialog instanceof HTMLDialogElement)) return

        event.preventDefault()
        open(dialog, trigger)
      },
      { signal },
    )

    document.addEventListener(
      'astro:before-swap',
      () => {
        if (active) finishClose(active, false)
      },
      { signal },
    )

    const desktop = window.matchMedia('(min-width: 1280px)')
    desktop.addEventListener(
      'change',
      () => {
        if (desktop.matches) close(true)
      },
      { signal },
    )
  }

  onPageLoad(setup)
}
