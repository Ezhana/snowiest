import { getCollection, render, type CollectionEntry } from 'astro:content'
import type { Lang } from '../i18n/ui'
import { momentDateFromId } from './moment-id'
import type { TagId } from './tags'

/** Content record behind a moment; pages and components consume `MomentView` instead. */
export type Moment = CollectionEntry<'moments'>

/** What a moment card needs, with the timestamp derived from the filename. */
export interface MomentView {
  date: Date
  lang: Lang
  tags: TagId[]
}

/** Server-rendered moment body paired with its card model. */
export interface RenderedMoment {
  moment: MomentView
  Content: Awaited<ReturnType<typeof render>>['Content']
}

/** Publication time derived from the filename. The loader rejects malformed names. */
function momentDate(moment: Moment): Date {
  return momentDateFromId(moment.id)
}

/** All moments, newest first. */
async function getMoments(): Promise<Moment[]> {
  const moments = await getCollection('moments')
  return [...moments].sort((a, b) => momentDate(b).getTime() - momentDate(a).getTime())
}

/** Map a content record to the card model. */
function toMomentView(moment: Moment): MomentView {
  return { date: momentDate(moment), lang: moment.data.lang, tags: moment.data.tags }
}

/**
 * Render moment bodies for server-side output, newest first. Pass `tag` to scope the feed to the
 * moments carrying that tag, which is what the tag detail page shows.
 */
export async function getRenderedMoments(tag?: TagId): Promise<RenderedMoment[]> {
  const moments = await getMoments()
  const filtered = tag ? moments.filter((moment) => moment.data.tags.includes(tag)) : moments

  return Promise.all(
    filtered.map(async (moment) => ({
      moment: toMomentView(moment),
      Content: (await render(moment)).Content,
    })),
  )
}
