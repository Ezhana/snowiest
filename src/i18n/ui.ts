import { SITE_DESCRIPTION, SITE_DESCRIPTION_ZH, SITE_TITLE, SITE_TITLE_ZH } from '../consts'

export const languages = {
  zh: { label: '中文', short: '中' },
  en: { label: 'English', short: 'EN' },
} as const

export type Lang = keyof typeof languages

/**
 * Language names written in each UI language, for labels that describe the language of a piece of
 * content (e.g. a Chinese page tagging an English-only post with "英文"). `languages[code].label` is
 * the language's own name and is only correct where the reader picks a language, such as the
 * switcher. Typing this as `Record<Lang, Record<Lang, string>>` makes a new language fail the build
 * until its name is supplied in every UI language.
 */
const languageNames: Record<Lang, Record<Lang, string>> = {
  en: { en: 'English', zh: 'Chinese' },
  zh: { en: '英文', zh: '中文' },
}

/** Name of language `code` written in `lang`, e.g. `languageName('en', 'zh') === '英文'`. */
export function languageName(code: Lang, lang: Lang): string {
  return languageNames[lang][code]
}

export const defaultLang: Lang = 'zh'

export function isLang(value: string | undefined): value is Lang {
  return value === 'en' || value === 'zh'
}

/** Resolve Astro's `currentLocale` (which can be undefined) to a supported language. */
export function getLang(locale: string | undefined): Lang {
  return isLang(locale) ? locale : defaultLang
}

const en = {
  'site.title': SITE_TITLE,
  'site.description': SITE_DESCRIPTION,
  'nav.primary': 'Primary navigation',
  'nav.home': 'Home',
  'nav.blog': 'Blog',
  'nav.about': 'About',
  'language.label': 'Change language',
  'theme.label': 'Color mode',
  'theme.system': 'Follow system',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'rss.label': 'RSS feed',
  'blog.title': 'Blog',
  'blog.notice': '',
  'blog.sortLabel': 'Sort by date',
  'blog.sortNewest': 'Newest first',
  'blog.sortOldest': 'Oldest first',
  'blog.tagsLabel': 'Filter by tag',
  'blog.allTags': 'All',
  'blog.tagPrefix': 'Tag: ',
  'blog.originalLanguage': 'Original language',
  'tag.friendsHeading': 'Related friends',
  'tag.noPosts': 'No posts with this tag yet.',
  'post.updated': 'Last updated on',
  'post.toc': 'On this page',
  'post.backToTop': 'Back to top',
  'post.fallbackFromZh':
    'This post is not available in English yet. Showing the original Chinese version.',
  'post.fallbackFromEn':
    'This post is not available in Chinese yet. Showing the original English version.',
  'pagination.label': 'Pagination',
  'pagination.previous': 'Previous',
  'pagination.next': 'Next',
  'pagination.page': 'Page',
  'timeline.label': 'Writing timeline',
  'timeline.loadMore': 'Load more',
  'footer.copyright': 'Ezhana. All rights reserved.',
  'footer.source': 'Source on GitHub',
  'footer.hosted': 'Hosted on GitHub Pages',
} as const

export type UiKey = keyof typeof en

const zh: Record<UiKey, string> = {
  'site.title': SITE_TITLE_ZH,
  'site.description': SITE_DESCRIPTION_ZH,
  'nav.primary': '主导航',
  'nav.home': '首页',
  'nav.blog': '博客',
  'nav.about': '关于',
  'language.label': '切换语言',
  'theme.label': '颜色模式',
  'theme.system': '跟随系统',
  'theme.light': '浅色',
  'theme.dark': '深色',
  'rss.label': 'RSS 订阅',
  'blog.title': '博客',
  'blog.notice': '',
  'blog.sortLabel': '按时间排序',
  'blog.sortNewest': '时间倒序',
  'blog.sortOldest': '时间顺序',
  'blog.tagsLabel': '按标签筛选',
  'blog.allTags': '全部',
  'blog.tagPrefix': '标签：',
  'blog.originalLanguage': '原文语言',
  'tag.friendsHeading': '相关友链',
  'tag.noPosts': '这个标签下还没有文章。',
  'post.updated': '最后更新于',
  'post.toc': '本页目录',
  'post.backToTop': '回到顶部',
  'post.fallbackFromZh': '本文暂无英文版，以下为中文原文。',
  'post.fallbackFromEn': '本文暂无中文版，以下为英文原文。',
  'pagination.label': '分页导航',
  'pagination.previous': '上一页',
  'pagination.next': '下一页',
  'pagination.page': '页码',
  'timeline.label': '文章时间轴',
  'timeline.loadMore': '加载更多',
  'footer.copyright': 'Ezhana，保留所有权利。',
  'footer.source': 'GitHub 源码',
  'footer.hosted': '托管于 GitHub Pages',
}

const dictionaries: Record<Lang, Record<UiKey, string>> = { en, zh }

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return dictionaries[lang][key] ?? dictionaries[defaultLang][key]
  }
}
