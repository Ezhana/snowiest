/**
 * Raw source inlined into the document (for example the pre-paint theme bootstrap in
 * `BaseLayout.astro`). Vite's own declaration for `*?raw` is not pulled in by
 * `astro/client`, so it is declared here.
 */
declare module '*.js?raw' {
  const content: string
  export default content
}
