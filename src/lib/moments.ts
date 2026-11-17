import { getCollection, render, type CollectionEntry } from 'astro:content'
import { momentDateFromId } from './moment-id'

export type Moment = CollectionEntry<'moments'>

/**
 * Publication time derived from the filename. The loader already rejects malformed names, so a
 * failure here means an entry bypassed the collection.
 */
export function momentDate(moment: Moment): Date {
  return momentDateFromId(moment.id)
}

/** All moments, newest first. */
export async function getMoments(): Promise<Moment[]> {
  const moments = await getCollection('moments')
  return [...moments].sort((a, b) => momentDate(b).getTime() - momentDate(a).getTime())
}

export interface RenderedMoment {
  moment: Moment
  Content: Awaited<ReturnType<typeof render>>['Content']
}

/** Render moment bodies for server-side output, preserving the input order. */
export async function renderMoments(moments: readonly Moment[]): Promise<RenderedMoment[]> {
  return Promise.all(
    moments.map(async (moment) => ({ moment, Content: (await render(moment)).Content })),
  )
}
