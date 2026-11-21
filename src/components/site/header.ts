import { theme as cerulean } from '@ezhana/design-theme-cerulean'
import { createThemeManager } from '@ezhana/theme'
import { onPageLoad, onScrollFrame, prefersReducedMotion } from '../../lib/runtime'

/**
 * Morphing site header: expand the floating bar once the document scrolls, and drive the colour
 * mode menu through @ezhana/theme, which persists the preference and writes the Ezhana attributes.
 */

export function setupSiteHeader(): void {
  const reduceMotion = prefersReducedMotion()
  const themeManager = createThemeManager({ themes: [cerulean] })

  const getHeader = () => document.querySelector<HTMLElement>('[data-site-header]')

  /*
   * The header is two rows on phones and one row from `md` up, and it shrinks once the page
   * scrolls. Anchors need the real height, not a hard-coded `6rem`, so publish it as a custom
   * property that `scroll-padding-top` reads. A ResizeObserver keeps it correct across the
   * breakpoint, the scrolled state and late font loading.
   */
  let observedHeader: HTMLElement | null = null
  const headerObserver = new ResizeObserver(() => {
    const header = getHeader()
    if (header) {
      document.documentElement.style.setProperty(
        '--header-height',
        `${header.getBoundingClientRect().height}px`,
      )
    }
  })

  const observeHeader = () => {
    const header = getHeader()
    if (!header) return

    if (observedHeader !== header) {
      if (observedHeader) headerObserver.unobserve(observedHeader)
      headerObserver.observe(header)
      observedHeader = header
    }

    document.documentElement.style.setProperty(
      '--header-height',
      `${header.getBoundingClientRect().height}px`,
    )
  }

  const SCROLL_ENTER_THRESHOLD = 120
  const SCROLL_EXIT_THRESHOLD = 24

  const updateScrolledState = () => {
    const header = getHeader()
    if (!header) return

    // Hysteresis: wait for a real scroll before morphing, but collapse again only near the top.
    // The wide gap between enter/exit prevents the header from flickering around a single pixel.
    const isScrolled = header.dataset.scrolled === 'true'
    const nextState = isScrolled
      ? window.scrollY > SCROLL_EXIT_THRESHOLD
      : window.scrollY > SCROLL_ENTER_THRESHOLD

    header.dataset.scrolled = String(nextState)
  }

  const scrollController = new AbortController()
  observeHeader()
  updateScrolledState()
  onScrollFrame(updateScrolledState, scrollController.signal)

  const closeMenu = (menu: HTMLDetailsElement) => {
    if (!menu.open || menu.classList.contains('is-closing')) return
    menu.classList.add('is-closing')
    window.setTimeout(
      () => {
        menu.open = false
        menu.classList.remove('is-closing')
      },
      reduceMotion ? 0 : 150,
    )
  }

  const syncThemeButtons = () => {
    const { mode } = themeManager.getState()
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.themeMode === mode))
    }
  }

  /**
   * <ClientRouter /> replaces the <html> attributes with the incoming document's attributes
   * (`swapRootAttributes`), which drops the runtime `data-color-mode`. Re-apply the manager state
   * after every swap so an explicit light/dark choice survives client-side navigation.
   */
  const applyThemeToDocument = (doc: Document) => {
    const { theme, mode, resolvedMode } = themeManager.getState()
    const root = doc.documentElement

    root.setAttribute('data-theme', theme)

    if (mode === 'system') {
      root.removeAttribute('data-color-mode')
    } else {
      root.setAttribute('data-color-mode', resolvedMode)
    }
  }

  // Copy the live theme state onto the incoming document before its <html> attributes are swapped
  // in, then re-apply afterwards as a safety net.
  document.addEventListener('astro:before-swap', (event) => {
    applyThemeToDocument(event.newDocument)
  })
  document.addEventListener('astro:after-swap', () => {
    applyThemeToDocument(document)
  })

  /**
   * The header is static HTML, so the current query string is not part of the language links.
   * Copy it on the client so a listing opened as `?page=2&order=oldest` switches to the same slice
   * in the other language; pages without query state are left unchanged.
   */
  const syncLanguageQuery = () => {
    const { search } = window.location
    for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-language-menu] a')) {
      const url = new URL(link.href, window.location.origin)
      if (url.search === search) continue
      url.search = search
      link.href = `${url.pathname}${url.search}${url.hash}`
    }
  }

  themeManager.subscribe(syncThemeButtons)
  syncThemeButtons()
  syncLanguageQuery()

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return

    const summary = event.target.closest('summary')
    const menu = summary?.closest<HTMLDetailsElement>('[data-menu]')

    if (menu && summary) {
      if (menu.open) {
        event.preventDefault()
        closeMenu(menu)
        return
      }

      // Opening a menu closes its sibling immediately: two panels anchored to the same corner would
      // otherwise expand on top of each other.
      for (const openMenu of document.querySelectorAll<HTMLDetailsElement>('[data-menu]')) {
        if (openMenu !== menu && openMenu.open) openMenu.open = false
      }
      return
    }

    const modeButton = event.target.closest<HTMLElement>('[data-theme-mode]')
    if (modeButton) {
      const mode = modeButton.dataset.themeMode
      if (mode === 'system' || mode === 'light' || mode === 'dark') {
        themeManager.setMode(mode)
      }
      const themeMenu = modeButton.closest<HTMLDetailsElement>('[data-theme-menu]')
      if (themeMenu) {
        closeMenu(themeMenu)
        // The panel becomes display:none after the close animation; keep keyboard focus on the
        // menu trigger instead of letting it fall back to <body>.
        themeMenu.querySelector('summary')?.focus({ preventScroll: true })
      }
      return
    }

    for (const openMenu of document.querySelectorAll<HTMLDetailsElement>('[data-menu]')) {
      if (openMenu.open && !openMenu.contains(event.target)) closeMenu(openMenu)
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    for (const menu of document.querySelectorAll<HTMLDetailsElement>('[data-menu]')) {
      if (!menu.open) continue
      closeMenu(menu)
      menu.querySelector('summary')?.focus()
    }
  })

  // <ClientRouter /> keeps the document alive across navigations, so re-query the new header and
  // re-sync the mode buttons after every page load.
  onPageLoad(() => {
    observeHeader()
    updateScrolledState()
    syncThemeButtons()
    syncLanguageQuery()
  })
}
