import type { Lang } from '../ui'

/**
 * Links page copy. The page pairs the whole links collection with a curated friend list, so the
 * wording separates the two sections while staying neutral about what a link is.
 */
interface LinksCopy {
  /** Document title and page heading. */
  title: string
  description: string
  friendHeading: string
  /** Intro for the friend list; the all-links section is self-explanatory. */
  intro: string
  orderNote: string
  copyAriaLabel: string
  exchange: string
  exchangeLink: string
  exchangeTail: string
  selfLabel: string
  selfNote: string
  /** Labels carry their own trailing separator: English needs a space after the colon. */
  selfNameLabel: string
  selfIconLabel: string
  selfLinkLabel: string
  selfDescriptionLabel: string
}

const zh: LinksCopy = {
  title: '链接',
  description: '友情链接、工具与常逛的站点。',
  friendHeading: '友情链接',
  intro: '标记了几处世外桃源。',
  orderNote: '以下链接不分先后。',
  copyAriaLabel: '复制本站信息',
  exchange: '互通有无？来',
  exchangeLink: 'GitHub',
  exchangeTail: '发个 issue，记得带上链接和一句介绍。',
  selfLabel: '本站信息',
  selfNote: '交换友链时可直接引用以下信息。',
  selfNameLabel: '名称：',
  selfIconLabel: '图标：',
  selfLinkLabel: '链接：',
  selfDescriptionLabel: '介绍：',
}

const en: LinksCopy = {
  title: 'Links',
  description: 'Friend links, tools, and sites worth a detour.',
  friendHeading: 'Friend links',
  intro: 'Places I keep coming back to.',
  orderNote: 'Listed below in no particular order.',
  copyAriaLabel: "Copy this site's info",
  exchange: 'Have a place worth listing? Find me on',
  exchangeLink: 'GitHub',
  exchangeTail: 'with a link and a one-line intro.',
  selfLabel: 'This site',
  selfNote: 'These details can be quoted directly when exchanging links.',
  selfNameLabel: 'Name: ',
  selfIconLabel: 'Icon: ',
  selfLinkLabel: 'Link: ',
  selfDescriptionLabel: 'Intro: ',
}

export const linksCopy: Record<Lang, LinksCopy> = { zh, en }
