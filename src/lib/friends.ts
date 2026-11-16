import type { Lang } from '../i18n/ui'
import { SITE_GITHUB_URL } from '../consts'
import type { TagId } from './tags.ts'

type AtLeastOneKeyRecord<K extends PropertyKey, V> = {
  [P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, V>>
}[K]

export interface FriendLink {
  name: string
  url: string
  /** One-line introduction shown under the name. */
  description: AtLeastOneKeyRecord<Lang, string>
  /** Short label, used as a quiet category marker on the card. */
  tag?: TagId
}

/**
 * The friend-link list.
 *
 * Edit this array to change the About page: names, URLs, descriptions and tags all live here.
 * The current entries are places worth keeping close — swap them for real friends' sites whenever
 * the list grows up.
 */
export const FRIEND_LINKS: readonly FriendLink[] = [
  {
    name: 'Astro',
    url: 'https://astro.build/',
    description: {
      en: 'The skeleton of this site. Clear docs and a gentle community.',
    },
    tag: 'engineering',
  },
  {
    name: 'GitHub',
    url: SITE_GITHUB_URL,
    description: {
      zh: '代码、版本，以及这个站点的老家。',
      en: 'Code, versions, and the home of this site.',
    },
    tag: 'engineering',
  },
  {
    name: 'Bangumi',
    url: 'https://bgm.tv/',
    description: {
      zh: '追番记录和 ACGN 资讯的落脚点。',
      en: 'Where the watchlist and ACGN news live.',
    },
    tag: 'news',
  },
  {
    name: '萌娘百科',
    url: 'https://zh.moegirl.org.cn/',
    description: {
      zh: '查设定、补梗，偶尔一查就是一下午。',
    },
    tag: 'news',
  },
]

/** Friend links carrying `tag`, in list order. */
export function getFriendLinksByTag(tag: TagId): readonly FriendLink[] {
  return FRIEND_LINKS.filter((friend) => friend.tag === tag)
}
