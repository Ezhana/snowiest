// Mirror @ezhana/theme's persistence contract before the stylesheet paints. This file is inlined
// into the document head through `?raw`, so it must stay plain browser JavaScript.
try {
  const stored = JSON.parse(localStorage.getItem('ezhana-theme') || 'null')
  const legacyMode = localStorage.getItem('color-mode')

  if (!stored && (legacyMode === 'light' || legacyMode === 'dark')) {
    localStorage.setItem('ezhana-theme', JSON.stringify({ theme: 'cerulean', mode: legacyMode }))
    localStorage.removeItem('color-mode')
    document.documentElement.dataset.colorMode = legacyMode
  } else if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    if (stored.mode === 'light' || stored.mode === 'dark') {
      document.documentElement.dataset.colorMode = stored.mode
    }
  }
} catch {
  // localStorage can be unavailable (private mode, blocked storage): follow the OS.
}
