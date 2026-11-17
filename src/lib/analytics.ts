/**
 * Google Tag Manager wiring.
 *
 * Analytics is a non-critical dependency: the container script is loaded asynchronously and every
 * call here only writes to `window.dataLayer`, so a blocked or unreachable `googletagmanager.com`
 * (for example in mainland China) degrades to nothing instead of affecting the page.
 */
export const GTM_ID = 'GTM-KZNSRQVJ'

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
 * Send one `page_view` per visited URL. The first call covers the initial load; ClientRouter keeps
 * the document alive across navigations, so `astro:page-load` reports every client-side page change.
 * The URL guard turns the initial `astro:page-load` (which fires at `load`) into a no-op and ignores
 * hash-only navigations. GA4 must take page views from this event instead of its own automatic page
 * view, otherwise the first page is counted twice.
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
