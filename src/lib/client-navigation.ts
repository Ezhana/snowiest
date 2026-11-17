/**
 * Page entrance on `<ClientRouter />` navigations.
 *
 * A fresh document fades the shell up (`.page-enter` + the header's `animate-fade-in`). Client
 * navigations keep the motion but drop the opacity half of it: the router's view transition
 * snapshots the incoming page right after the swap, and a snapshot of `opacity: 0` is a blank page.
 * The cross-fade would then go "old page → blank → fade in" (a flash), and the persisted progress
 * bar would be frozen in it at whatever width it had. Moving only the transform keeps the snapshot
 * opaque, and the view transition's own cross-fade supplies the fade, so the page still rises in.
 *
 * `astro:after-swap` runs inside the view transition's update callback, before the snapshot is
 * taken, which is why the marker is (re)applied there as well as before the navigation starts.
 */

/** Marks the document as reached through the client router, so the CSS can swap the entrance. */
export function setupClientNavigation(): void {
  const markClientNavigation = () => {
    document.documentElement.dataset.clientNav = ''
  }

  document.addEventListener('astro:before-preparation', markClientNavigation)
  document.addEventListener('astro:after-swap', markClientNavigation)
}
