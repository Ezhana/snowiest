import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_ZH,
  SITE_GITHUB_PROFILE_URL,
  SITE_TITLE,
  SITE_TITLE_ZH,
} from '../../consts'
import { localeUrl, rssUrl } from '../routing'
import type { Lang } from '../ui'

/**
 * Home page copy. Body fields may contain inline markup because the prose interleaves links and
 * emphasis with the text; the page component owns the surrounding structure and classes.
 */
interface HomeCopy {
  /** Document title and page heading. */
  title: string
  description: string
  eyebrow: string
  lead: string
  intro: string
  contact: string
  about: string
}

const zh: HomeCopy = {
  title: SITE_TITLE_ZH,
  description: SITE_DESCRIPTION_ZH,
  eyebrow: 'Snowiest · 簌雪',
  lead: '白雪又簌簌，飘飘似何如？',
  intro: `我是 <strong>${SITE_AUTHOR}</strong>。这个站点会分享文章，堆砌日常，也会收留一些牢骚、趣闻、资讯和没头没尾的感想。`,
  contact: `偶尔有趣，偶尔荒唐。欢迎交流，或只是闲逛？订阅 <a class="copy-link" href="${rssUrl('zh')}">RSS</a>，安静捧场；想上强度，来 <a class="copy-link" href="${SITE_GITHUB_PROFILE_URL}">GitHub</a> 找我，互诉衷肠！`,
  about: `加深印象？你是否在找：<a class="copy-link" href="${localeUrl('zh', '/about/')}">站点家访</a>。`,
}

const en: HomeCopy = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  eyebrow: 'Snowiest · 簌雪',
  lead: 'Snowflakes fall, then rise and roam—what might they be likened to?',
  intro: `I'm <strong>${SITE_AUTHOR}</strong>. This site is where I share articles, collect little moments of everyday life, and make room for the occasional rant, amusing anecdote, interesting find, or half-formed thought.`,
  contact: `Sometimes amusing, sometimes absurd. You're welcome to get in touch—or simply wander around. Subscribe to <a class="copy-link" href="${rssUrl('zh')}">RSS</a> and quietly cheer me on; or, if you'd like to talk, find me on <a class="copy-link" href="${SITE_GITHUB_PROFILE_URL}">GitHub</a> and let's share what's on our minds!`,
  about: `Want to get to know me a little better? Looking for the <a class="copy-link" href="${localeUrl('zh', '/about/')}">About page</a>?`,
}

export const homeCopy: Record<Lang, HomeCopy> = { zh, en }
