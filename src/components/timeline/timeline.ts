import { onPageLoad, onScrollFrame } from '../../lib/runtime'

const INITIAL_GROUPS = 3
const BATCH_GROUPS = 2
const SENTINEL_MARGIN = 0

/**
 * Homepage timeline: reveal month groups as the bottom sentinel approaches the viewport. All
 * groups are server-rendered (so the page works without JavaScript); extra groups are hidden once
 * this script runs and revealed in batches on scroll or button activation.
 */
export function setupTimeline(): void {
  let controller: AbortController | null = null

  const setup = () => {
    const timeline = document.querySelector<HTMLElement>('[data-timeline]')

    if (!timeline) {
      controller?.abort()
      controller = null
      return
    }

    if (timeline.dataset.timelineReady === 'true') return

    controller?.abort()
    const activeController = new AbortController()
    controller = activeController
    timeline.dataset.timelineReady = 'true'

    const groups = Array.from(timeline.querySelectorAll<HTMLElement>('[data-timeline-group]'))
    const sentinel = timeline.querySelector<HTMLButtonElement>('[data-timeline-sentinel]')
    if (!sentinel) return

    if (groups.length <= INITIAL_GROUPS) {
      sentinel.hidden = true
      return
    }

    sentinel.hidden = false
    for (const group of groups.slice(INITIAL_GROUPS)) group.hidden = true

    let visibleGroups = INITIAL_GROUPS
    let loading = false

    const hasMore = () => visibleGroups < groups.length
    const nearSentinel = () =>
      sentinel.getBoundingClientRect().top < window.innerHeight + SENTINEL_MARGIN

    const loadMore = () => {
      if (loading || !hasMore()) return
      loading = true

      window.setTimeout(() => {
        const nextGroups = groups.slice(visibleGroups, visibleGroups + BATCH_GROUPS)
        visibleGroups += nextGroups.length

        for (const group of nextGroups) {
          group.hidden = false
          group.classList.add('animate-fade-up', 'motion-reduce:animate-none')
        }

        loading = false

        if (!hasMore()) {
          sentinel.hidden = true
        } else {
          maybeLoad()
        }
      }, 220)
    }

    const maybeLoad = () => {
      if (!loading && hasMore() && nearSentinel()) loadMore()
    }

    sentinel.addEventListener('click', loadMore, { signal: activeController.signal })
    onScrollFrame(maybeLoad, activeController.signal)
  }

  onPageLoad(setup)
}
