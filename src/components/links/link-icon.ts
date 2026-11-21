import { onPageLoad } from '../../lib/runtime'

/**
 * External link icons are third-party URLs that can 404 or be blocked. When one fails, reveal the
 * server-rendered initial-letter fallback instead of leaving a broken image. Setup is idempotent:
 * images are marked once, and a cached failure is detected without waiting for an event.
 */
export function setupLinkIcons(): void {
  onPageLoad(() => {
    for (const image of document.querySelectorAll<HTMLImageElement>('[data-link-icon]')) {
      if (image.dataset.linkIconReady === 'true') continue
      image.dataset.linkIconReady = 'true'

      const showFallback = () => {
        image.hidden = true
        const fallback = image.parentElement?.querySelector<HTMLElement>(
          '[data-link-icon-fallback]',
        )
        if (fallback) fallback.hidden = false
      }

      if (image.complete && image.naturalWidth === 0) {
        showFallback()
        continue
      }

      image.addEventListener('error', showFallback, { once: true })
    }
  })
}
