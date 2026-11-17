import {
  SITE_AUTHOR,
  SITE_GITHUB_PROFILE_URL,
  SITE_GITHUB_URL,
  SITE_TITLE,
  SITE_TITLE_ZH,
  SITE_URL,
} from '../../consts'
import { localeUrl, rssUrl } from '../routing'
import type { Lang } from '../ui'

/**
 * About page copy. Body fields may contain inline markup (links, corrections, the redacted aside);
 * the page component owns the paragraph structure and classes.
 */
interface AboutCopy {
  /** Document title and page heading. */
  title: string
  description: string
  intro: string
  threeWordsPrompt: string
  threeWords: string
  fun: string
  order: string
  design: string
  harmony: string
  closing: string
  siteHeading: string
  siteIntro: string
  updates: string
  findMeHeading: string
  findMe: string
  ps: string
}

const zh: AboutCopy = {
  title: '关于',
  description: `关于${SITE_TITLE_ZH}与它的作者 ${SITE_AUTHOR}。`,
  intro: `我是 <strong>${SITE_AUTHOR}</strong>，<strong>${SITE_TITLE_ZH}</strong>的维护者。平时写代码，也写点别的；喜欢把复杂的东西理顺，<del class="text-fg-muted decoration-danger">然后制造新的复杂</del>，<ins class="text-accent decoration-accent decoration-wavy">然后发现新的麻烦。</ins>`,
  threeWordsPrompt: '如果只能用三个词介绍自己，我会选：',
  threeWords: '有趣、秩序、和谐',
  fun: `<strong>有趣</strong>是入口。喜欢琢磨一件事还能不能更好玩一点，也喜欢在正经的讨论里突然拐个弯。<del class="text-fg-muted decoration-danger">包括这段自我介绍。</del>`,
  order: `<strong>秩序</strong>是底盘。文件夹要分类，标签页要收敛，句子最好一口气读完不用回头。<del class="text-fg-muted decoration-danger">虽然经常做不到</del>，<ins class="text-accent decoration-accent decoration-wavy">但一直在努力。</ins>`,
  design: `如果你也喜欢这一类东西，可能会喜欢<a class="copy-link" href="${localeUrl('zh', '/tag/design/')}">设计分类里的几篇</a>。`,
  harmony: `<strong>和谐</strong>是目标。希望人与人、人与工具、人与自己之间，都少一点摩擦。这也是这个站点看上去比较安静的原因——<span class="ink-redacted" tabindex="0" role="note" aria-label="被涂掉的一句话：其实是因为我懒得吵架。">其实是因为我懒得吵架。</span>`,
  closing: `说到底，这三件事是一件事：让日子<strong>有意思</strong>，也让日子<strong>过得下去</strong>。`,
  siteHeading: '这个站点',
  siteIntro: `它用 <a class="copy-link" href="https://astro.build/">Astro</a> 搭成，代码放在 <a class="copy-link" href="${SITE_GITHUB_URL}">GitHub</a>，通过 <a class="copy-link" href="${SITE_URL}">GitHub Pages</a> 发布。`,
  updates: `这里会发文章，更会发牢骚。会<del>吹牛不带草稿纸</del>谈天说地，论断古今。<del class="text-fg-muted decoration-danger">每周更新</del>，<ins class="text-accent decoration-accent decoration-wavy">不定期更新，但不会消失。</ins>`,
  findMeHeading: '找到我',
  findMe: `最直接的地方是 <a class="copy-link" href="${SITE_GITHUB_PROFILE_URL}">GitHub</a>；想安静地看更新，可以订阅 <a class="copy-link" href="${rssUrl('zh')}">RSS</a>；想从头读起，直接去<a class="copy-link" href="${localeUrl('zh', '/blog/')}">博客</a>。`,
  ps: `<strong>P.S.</strong> 这篇自我介绍<del class="decoration-danger">写于一个很清醒的下午</del>，<ins class="text-accent decoration-accent decoration-wavy">其实改了四遍。</ins>`,
}

const en: AboutCopy = {
  title: 'About',
  description: `About ${SITE_TITLE} and its author, ${SITE_AUTHOR}.`,
  intro: `I'm <strong>${SITE_AUTHOR}</strong>, the person behind <strong>${SITE_TITLE}</strong>. I write code, and I write other things too. I like untangling complicated things, <del class="text-fg-muted decoration-danger">then making them complicated again</del>, <ins class="text-accent decoration-accent decoration-wavy">then finding new trouble in them.</ins>`,
  threeWordsPrompt: "If I had to describe myself in three words, they'd be:",
  threeWords: 'Fun, order, harmony',
  fun: `<strong>Fun</strong> is the doorway. I like asking whether something could be a little more playful, and taking a sudden turn in the middle of a serious conversation. <del class="text-fg-muted decoration-danger">Including this introduction.</del>`,
  order: `<strong>Order</strong> is the floor. Folders should be sorted, tabs should be tamed, and a sentence should read in one breath. <del class="text-fg-muted decoration-danger">I don't always manage it</del>, <ins class="text-accent decoration-accent decoration-wavy">but I keep trying.</ins>`,
  design: `If that sounds like your kind of thing, you might enjoy the <a class="copy-link" href="${localeUrl('en', '/tag/design/')}">design posts</a>.`,
  harmony: `<strong>Harmony</strong> is the goal. Less friction between people, between people and their tools, and between people and themselves. That's also why this site seems quiet — <span class="ink-redacted" tabindex="0" role="note" aria-label="Redacted: I'm just too lazy to argue.">I'm just too lazy to argue.</span>`,
  closing: `In the end, the three are one thing: make life <strong>interesting</strong>, and keep it <strong>livable</strong>.`,
  siteHeading: 'This site',
  siteIntro: `${SITE_TITLE} is the personal site of ${SITE_AUTHOR}. It's built with <a class="copy-link" href="https://astro.build/">Astro</a>, the source lives on <a class="copy-link" href="${SITE_GITHUB_URL}">GitHub</a>, and it's published through <a class="copy-link" href="${SITE_URL}">GitHub Pages</a>.`,
  updates: `Expect tech articles, rants, anecdotes, ACGN news, and reflections. <del class="text-fg-muted decoration-danger">Weekly updates.</del> <ins class="text-accent decoration-accent decoration-wavy">Irregular updates, but it isn't going away.</ins>`,
  findMeHeading: 'Find me',
  findMe: `The most direct place is <a class="copy-link" href="${SITE_GITHUB_PROFILE_URL}">GitHub</a>. If you'd rather read quietly, subscribe to the <a class="copy-link" href="${rssUrl('en')}">RSS feed</a>; if you want to start from the beginning, the <a class="copy-link" href="${localeUrl('en', '/blog/')}">blog</a> is always open.`,
  ps: `<strong>P.S.</strong> This introduction was <del class="decoration-danger">written in one very clear afternoon</del>, actually revised four times.`,
}

export const aboutCopy: Record<Lang, AboutCopy> = { zh, en }
