import { SITE_DESCRIPTION, SITE_DESCRIPTION_ZH, SITE_TITLE, SITE_TITLE_ZH } from '../consts'

export const languages = {
  zh: { label: '中文', short: '中' },
  en: { label: 'English', short: 'EN' },
} as const

export type Lang = keyof typeof languages

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
  'post.updated': 'Last updated on',
  'post.toc': 'On this page',
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
  'post.updated': '最后更新于',
  'post.toc': '本页目录',
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
