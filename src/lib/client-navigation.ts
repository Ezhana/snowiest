/**
 * Page entrance and `<ClientRouter />` navigations.
 *
 * The shell fades up on first paint: `.page-enter` for the content and `animate-fade-in` for the
 * header rows. Client-side navigations must not replay those animations. The router's view
 * transition snapshots the incoming page right after the swap, so anything that starts at
 * `opacity: 0` is captured as a blank page — the cross-fade then reads as "old page → blank → fade
 * in", which shows up as a flash once the view transition runs its full duration. A fresh document
 * keeps the animations, because nothing snapshots it.
 *
 * `astro:after-swap` runs inside the view transition's update callback, before the snapshot is
 * taken, which is why the marker is (re)applied there as well as before the navigation starts.
 */

/** Marks the document as reached through the client router, so the CSS can skip the entrances. */
export function setupClientNavigation(): void {
  const markClientNavigation = () => {
    document.documentElement.dataset.clientNav = ''
  }

  document.addEventListener('astro:before-preparation', markClientNavigation)
  document.addEventListener('astro:after-swap', markClientNavigation)
}
