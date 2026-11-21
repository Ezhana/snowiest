/**
 * giscus comments.
 *
 * giscus renders a cross-origin iframe, so it cannot read the page's Ezhana tokens: the widget
 * theme has to be passed in and updated through `postMessage`. The `client.js` tag is created here
 * instead of being rendered in the component so that:
 *
 * - the colour mode is resolved before the iframe loads (no light/dark flash for explicit modes),
 * - each ClientRouter navigation mounts a fresh widget for the incoming `[data-giscus]` container,
 * - the interface language follows the page locale instead of a fixed value.
 *
 * giscus reads its configuration from the `data-*` attributes of `client.js`. The component renders
 * those options on the container and this module forwards them to the script element. The component
 * also renders a loading line and a GitHub Discussions fallback; this module owns their visibility,
 * so a blocked or unreachable giscus.app never leaves an unexplained empty section.
 */

const GISCUS_ORIGIN = 'https://giscus.app'

/** How long a visible comment section may stay without a loaded iframe before showing the fallback. */
const LOAD_TIMEOUT_MS = 12_000

/** Options forwarded from the component's container to the giscus script. */
const GISCUS_OPTIONS = [
  'repo',
  'repoId',
  'category',
  'categoryId',
  'mapping',
  'term',
  'strict',
  'reactionsEnabled',
  'emitMetadata',
  'inputPosition',
  'lang',
  'loading',
] as const

/** Resolve the mode the stylesheet is actually showing: explicit preference first, then the OS. */
function resolvedTheme(): 'light' | 'dark' {
  const mode = document.documentElement.dataset.colorMode
  if (mode === 'light' || mode === 'dark') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Iframes whose document has loaded; only they can receive live `postMessage` updates. */
const loadedIframes = new WeakSet<HTMLIFrameElement>()

function syncTheme(container: HTMLElement): void {
  const theme = resolvedTheme()
  const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (!iframe) return

  if (loadedIframes.has(iframe)) {
    iframe.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN)
    return
  }

  // Below the fold, the lazily loaded iframe document has not started yet: a postMessage would be
  // lost and the widget would boot with the theme captured when it was mounted. The theme is part
  // of the iframe URL, so update it there; the widget reads it when it eventually loads.
  const url = new URL(iframe.src)
  if (url.searchParams.get('theme') === theme) return
  url.searchParams.set('theme', theme)
  iframe.src = url.toString()
}

function syncAllThemes(): void {
  for (const container of document.querySelectorAll<HTMLElement>('[data-giscus]')) {
    syncTheme(container)
  }
}

function statusElement(container: HTMLElement): HTMLElement | null {
  const section = container.closest('[data-giscus-section]')
  return section?.querySelector<HTMLElement>('[data-giscus-status]') ?? null
}

function fallbackElement(container: HTMLElement): HTMLElement | null {
  const section = container.closest('[data-giscus-section]')
  return section?.querySelector<HTMLElement>('[data-giscus-fallback]') ?? null
}

/**
 * giscus creates the iframe asynchronously after `client.js` runs, and again if it clears a stale
 * session. Track each iframe so a lazily loaded one picks up the latest theme before it starts.
 */
function watchIframes(container: HTMLElement, onReady: () => void): void {
  const watched = new WeakSet<HTMLIFrameElement>()
  const observer = new MutationObserver(() => {
    const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
    if (!iframe || watched.has(iframe)) return
    watched.add(iframe)

    iframe.addEventListener(
      'load',
      () => {
        loadedIframes.add(iframe)
        onReady()
        syncTheme(container)
      },
      { once: true },
    )

    syncTheme(container)
  })

  observer.observe(container, { childList: true, subtree: true })
}

function mount(container: HTMLElement): void {
  if (container.dataset.giscusMounted !== undefined) return
  container.dataset.giscusMounted = ''

  const status = statusElement(container)
  const fallback = fallbackElement(container)
  let settled = false
  let timeoutId = 0

  const markReady = () => {
    settled = true
    window.clearTimeout(timeoutId)
    if (status) status.hidden = true
    if (fallback) fallback.hidden = true
  }

  const markFailed = () => {
    if (settled) return
    settled = true
    window.clearTimeout(timeoutId)
    if (status) status.hidden = true
    if (fallback) fallback.hidden = false
  }

  if (status) status.hidden = false
  if (fallback) fallback.hidden = true

  const script = document.createElement('script')
  script.src = `${GISCUS_ORIGIN}/client.js`
  script.async = true
  script.crossOrigin = 'anonymous'
  script.dataset.theme = resolvedTheme()

  for (const option of GISCUS_OPTIONS) {
    const value = container.dataset[option]
    if (value !== undefined) script.dataset[option] = value
  }

  script.addEventListener('error', markFailed, { once: true })
  container.append(script)
  watchIframes(container, markReady)

  // Lazily loaded widgets below the fold do not start before they are visible, so the timeout only
  // begins when the section approaches the viewport and a working-but-slow load is not reported.
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      if (settled) return

      timeoutId = window.setTimeout(() => {
        const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
        if (!iframe || !loadedIframes.has(iframe)) markFailed()
      }, LOAD_TIMEOUT_MS)
    },
    { rootMargin: '200px' },
  )
  observer.observe(container)
}

let themeWatchersInstalled = false

function installThemeWatchers(): void {
  if (themeWatchersInstalled) return
  themeWatchersInstalled = true

  // The header's theme manager writes `data-color-mode` (or removes it for "system"); observing the
  // root keeps the iframe in sync without importing the manager and duplicating its state.
  new MutationObserver(syncAllThemes).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-mode'],
  })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncAllThemes)
}

/** Mount one widget per `[data-giscus]` container and keep its theme in sync. Idempotent. */
export function setupGiscus(): void {
  installThemeWatchers()

  for (const container of document.querySelectorAll<HTMLElement>('[data-giscus]')) {
    mount(container)
    syncTheme(container)
  }
}
