---
title: '自称与他称：语言徽章上的名字'
description: '同一种语言，在切换器里应该用自称，在文章列表里应该用当前界面语言的名字。把这两件事分开，是这次修 bug 最大的收获。'
pubDate: '2026-08-09'
tags:
  - engineering
---

英文站的文章列表里，一篇还没有英文译文的中文文章，标签上写着「中文」。

乍看没错——那确实是中文。但读者正站在英文界面上，这一行里其他文字全是英文，只有这个徽章突然换了语言。

## 症状与根因

徽章的写法很直接：

```astro
{languages[postLang(post)].label}
```

`languages` 当时长这样：

```ts
export const languages = {
  zh: { label: '中文', short: '中' },
  en: { label: 'English', short: 'EN' },
} as const
```

`label` 是语言的自称。语言切换器用它是对的：读者要在一堆语言里找到自己的母语，`中文`、`English` 这种自称最好认。但列表徽章不是在让读者挑语言，而是在当前语言的语境里**描述另一篇内容的语言**，这时应该跟着界面语言变：英文站写 `Chinese`，中文站写 `英文`。

自称和他称，是两件事，而 `languages` 只提供了其中一件。

## 一处在写，两处在读

顺手搜了一下 `languages[...].label`，时间轴组件里也有同样的写法。所以问题不在某个组件写错了一行，而是数据结构本身在两种语义之间含糊。改的时候一起改：模板里各换一行，切换器保持原样。

## 三种做法

把翻译直接塞进 `languages` 是最顺手的选择：

```ts
zh: { label: '中文', names: { en: 'Chinese', zh: '中文' } }
```

能跑，但 `languages` 从此同时存着自称和他称，下次写新组件时还是得先想一遍该用哪个字段。

`Intl.DisplayNames` 更省事，一个语言名都不用维护：

```ts
new Intl.DisplayNames(['zh'], { type: 'language' }).of('en') // 英语
```

代价是措辞交给 ICU：中文语境下它给「英语」，而徽章旁边写「英文」更贴；而且输出会随构建机上 Node 的 ICU 版本变化。对一个只有两种语言的博客来说，这点不可控不值得。

所以选了第三种：单独一张按界面语言索引的表。

```ts
const languageNames: Record<Lang, Record<Lang, string>> = {
  en: { en: 'English', zh: 'Chinese' },
  zh: { en: '英文', zh: '中文' },
}

/** Name of language `code` written in `lang`. */
export function languageName(code: Lang, lang: Lang): string {
  return languageNames[lang][code]
}
```

`Record<Lang, Record<Lang, string>>` 这个类型是关键：将来加一门语言，编译器会逼着你在每一格补上名字，不会漏掉「法语站上日语叫什么」这种边角。

## 组件里的调用

```astro
{postLang(post) !== lang && (
  <span title={t('blog.originalLanguage')}>{languageName(postLang(post), lang)}</span>
)}
```

提示文案仍然走 `t('blog.originalLanguage')`，它本来就是界面语言的一部分；只有语言名从自称换成了他称。时间轴那边的写法也一样，多了一个 `·` 分隔符。

## 验证

构建后检查产物，英文站列表里的徽章从 `中文` 变成了 `Chinese`。中文站反而一个徽章都没有——现有文章都有中文版，回退分支根本没走到，所以这个 bug 只在英文站显形。

类型检查和 lint 都过。

## 回过头看

这类 bug 的根源很少是某行模板写错，而是一个数据结构承担了两个语义。语言名的「自称」和「他称」看起来只差一次翻译，实际差的是——读者站在哪一边。
