import { onPageLoad } from '../../lib/runtime'

const setLinkState = (link: HTMLElement, active: boolean) => {
  const classes = (value: string | undefined) => (value ?? '').split(/\s+/).filter(Boolean)
  const activeClasses = classes(link.dataset.stateActive)
  const inactiveClasses = classes(link.dataset.stateInactive)

  link.classList.remove(...(active ? inactiveClasses : activeClasses))
  link.classList.add(...(active ? activeClasses : inactiveClasses))

  if (active) {
    link.setAttribute('aria-current', 'page')
  } else {
    link.removeAttribute('aria-current')
  }
}

function applyOrderState(order: 'newest' | 'oldest'): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-order-link]')) {
    setLinkState(link, link.dataset.orderLink === order)
  }

  // Keep the active ordering when the reader switches tags.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-tag-filter] a')) {
    const href = link.getAttribute('href')
    if (href) link.setAttribute('href', order === 'oldest' ? `${href}?order=oldest` : href)
  }
}

/**
 * Ordering and pagination live in the query string, so the list is fully server-rendered and this
 * script only reorders the posts and reveals the current slice. Listings without a pagination
 * container (the tag page) still get the ordering. Without JavaScript every post stays visible in
 * the server order and the pagination controls stay hidden.
 */
export function setupBlogListing(): void {
  const setup = () => {
    const root = document.querySelector<HTMLElement>('[data-blog-listing]')
    if (!root || root.dataset.blogListingReady === 'true') return

    const list = root.querySelector<HTMLElement>('[data-blog-list]')
    if (!list) return

    root.dataset.blogListingReady = 'true'

    const params = new URLSearchParams(window.location.search)
    const order = params.get('order') === 'oldest' ? 'oldest' : 'newest'
    const posts = Array.from(list.querySelectorAll<HTMLElement>('[data-post]'))
    const orderedPosts =
      order === 'oldest'
        ? [...posts].sort((a, b) => Number(a.dataset.date) - Number(b.dataset.date))
        : posts

    for (const post of orderedPosts) list.append(post)

    applyOrderState(order)

    const pagination = root.querySelector<HTMLElement>('[data-blog-pagination]')
    if (!pagination) return

    const pageSize = Number(root.dataset.pageSize) || 5
    const requestedPage = Number.parseInt(params.get('page') ?? '1', 10)

    const totalPages = Math.max(1, Math.ceil(orderedPosts.length / pageSize))
    const page = Number.isFinite(requestedPage)
      ? Math.min(Math.max(requestedPage, 1), totalPages)
      : 1
    const firstIndex = (page - 1) * pageSize

    orderedPosts.forEach((post, index) => {
      post.hidden = index < firstIndex || index >= firstIndex + pageSize
    })

    const base = pagination.dataset.base ?? '/blog/'
    const pageHref = (target: number) => {
      const search = new URLSearchParams()
      if (target > 1) search.set('page', String(target))
      if (order === 'oldest') search.set('order', 'oldest')

      const query = search.toString()
      return query ? `${base}?${query}` : base
    }

    const pageItems = Array.from(pagination.querySelectorAll<HTMLElement>('[data-pagination-page]'))
    const visiblePages = new Set([1, totalPages, page - 1, page, page + 1])
    pagination.querySelectorAll('[data-pagination-gap]').forEach((gap) => gap.remove())

    let lastVisible = 0
    for (const item of pageItems) {
      const target = Number(item.dataset.page)
      item.hidden = !visiblePages.has(target)

      if (item.hidden) continue

      const link = item.querySelector<HTMLAnchorElement>('a')
      if (link) {
        link.href = pageHref(target)
        setLinkState(link, target === page)
      }

      if (lastVisible > 0 && target - lastVisible > 1) {
        const gap = document.createElement('li')
        gap.dataset.paginationGap = ''
        gap.setAttribute('aria-hidden', 'true')
        gap.className = 'px-1 text-small text-fg-muted'
        gap.textContent = '…'
        item.before(gap)
      }
      lastVisible = target
    }

    const previous = pagination.querySelector<HTMLAnchorElement>('[data-pagination-prev]')
    if (previous) {
      previous.href = pageHref(Math.max(1, page - 1))
      previous.hidden = page <= 1
    }

    const next = pagination.querySelector<HTMLAnchorElement>('[data-pagination-next]')
    if (next) {
      next.href = pageHref(Math.min(totalPages, page + 1))
      next.hidden = page >= totalPages
    }

    pagination.hidden = totalPages <= 1
  }

  onPageLoad(setup)
}
