/**
 * Google Tag Manager wiring.
 *
 * Analytics is a non-critical dependency: the container scripts are loaded asynchronously and every
 * call here only writes to `window.dataLayer`, so a blocked or unreachable `googletagmanager.com`
 * (for example in mainland China) degrades to nothing instead of affecting the page.
 */

/**
 * Containers loaded on every page. They share the default `dataLayer`, so a tag in either container
 * sees the same events; a page view must be configured in exactly one of them to avoid double hits.
 */
export const GTM_IDS = ['GTM-KZNSRQVJ'] as const

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

function pushToDataLayer(payload: Record<string, unknown>): void {
  window.dataLayer ??= []
  window.dataLayer.push(payload)
}

/**
 * Push one `page_view` per visited URL. The first call covers the initial load; ClientRouter keeps
 * the document alive across navigations, so `astro:page-load` reports every client-side page change
 * after that. The URL guard turns the repeated `astro:page-load` (it also fires at `load`) into a
 * no-op and ignores hash-only navigations.
 *
 * The Google tag must not send a page view of its own (see `send_page_view` in `docs/analytics.md`),
 * otherwise the first page is counted twice.
 */
export function setupAnalytics(): void {
  let lastTrackedUrl = ''

  const trackPageView = () => {
    const { href, pathname, search } = window.location
    if (href === lastTrackedUrl) return
    lastTrackedUrl = href

    pushToDataLayer({
      event: 'page_view',
      page_title: document.title,
      page_location: href,
      page_path: pathname + search,
    })
  }

  trackPageView()
  document.addEventListener('astro:page-load', trackPageView)
}
