/**
 * Content collection directories, relative to the project root.
 *
 * Shared by the Astro loaders, the query layer and the content CLI, so the CLI writes to the same
 * places the site reads from.
 */
const CONTENT_DIR = 'src/content'

export const BLOG_CONTENT_DIR = `${CONTENT_DIR}/blog`
export const LINKS_CONTENT_DIR = `${CONTENT_DIR}/links`
export const MOMENTS_CONTENT_DIR = `${CONTENT_DIR}/moments`
