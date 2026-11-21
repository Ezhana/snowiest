import type { APIRoute } from 'astro'
import { buildRssFeed } from '../../lib/rss'

export const GET: APIRoute = ({ site }) => buildRssFeed('en', site)
