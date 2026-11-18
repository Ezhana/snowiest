import type { APIRoute } from 'astro'
import { buildAtomFeed } from '../../lib/atom'

export const GET: APIRoute = async ({ site }) =>
  new Response(await buildAtomFeed('en', site), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  })
