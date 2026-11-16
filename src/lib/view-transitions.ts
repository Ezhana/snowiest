/** View-transition name shared by the title morph between a listing and the article page. */
export function postTitleTransitionName(slug: string): string {
  return `post-title-${slug.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}
