---
title: '当链接需要两个名字'
description: '给链接加上双语名称与 slug，把“缺失回退”抽成全站规则，并承认这份列表不分先后。'
pubDate: '2026-08-18'
tags:
  - engineering
  - design
lang: zh
---

`src/content/links/` 里的每个文件代表一个链接，原本只有一个 `name`：

```yaml
name: '萌娘百科'
url: 'https://zh.moegirl.org.cn/'
```

在中文页面这没有问题，但英文页面会原样显示“萌娘百科”。同一条链接在两种界面语言下应该有两个名字，中文叫萌娘百科，英文叫 Moegirlpedia。需求本身很小，却暴露了一个更早的设计问题：`name` 被当成了“一个字符串”，而不是“一种语言下的名称”。

## 名字本来就不是一个字符串

`description` 早就支持双语了：

```yaml
description:
  zh: '查设定、补梗，偶尔一查就是一下午。'
```

渲染时取当前语言，缺失就换另一种。`name` 却还是单值，于是加英文名最直接的做法是再加一个 `nameEn`。但这样会有两个字段描述同一件事，迟早出现“改了 `name` 忘了 `nameEn`”的情况，也没法表达“这条链接只有英文名”。

所以改成 `names`：

```yaml
slug: moegirl
names:
  zh: 萌娘百科
  en: Moegirlpedia
url: https://zh.moegirl.org.cn/
tag: news
```

`zh` 和 `en` 至少写一种，schema 会拦下两者都为空的条目。展示时按当前语言取，缺失就回退；只有一个名字的链接不会因此在另一种语言里消失。

## 回退不是某个字段的私事

一开始，回退逻辑是复制粘贴的：

```ts
const name = names[lang] ?? names.zh ?? names.en
const description = data.description?.[lang] ?? data.description?.zh ?? data.description?.en
```

当它同时出现在 `names` 和 `description` 里时，就不再是“某个字段的细节”，而是一条全站策略：**当前语言 → 默认语言（中文）→ 任何可用的语言**。这条策略应该只有一个实现。

于是抽出了 `src/i18n/localized.ts`：

```ts
export type Localized<T> = Partial<Record<Lang, T>>

export function localizedValue<T>(value: Localized<T> | undefined, lang: Lang): T | undefined {
  if (!value) return undefined

  const candidates = [lang, defaultLang, ...(Object.keys(languages) as Lang[])]
  for (const candidate of candidates) {
    const resolved = value[candidate]
    if (resolved !== undefined) return resolved
  }

  return undefined
}
```

泛型 `<T>` 是有意的：回退规则不关心值是字符串、标题还是别的可本地化数据，只关心“某种语言有没有值”。链接层只剩下语义明确的辅助函数：

```ts
export function linkName(link: Link, lang: Lang): string {
  const name = localizedValue(link.data.names, lang)
  if (!name) throw new Error(`Link "${link.id}" has no name in any language.`)
  return name
}
```

边界也要说清楚：这条规则处理的是**字段级**的双语值。文章译文是另一回事——没有译文时整篇文章回退到原文，并保留语言标记与 canonical，而不是把标题和正文拆开各回退各的。UI 文案则是完整的语言字典，不需要逐条回退。把三种情况混成一个“国际化工具”反而会失去语义。

## slug 是身份，不是名次

这次还给链接加了 `slug`：必填、URL 安全、全集合唯一。它可以作为链接的稳定标识，比起依赖文件名更明确。

这里有一个容易忽略的细节：Astro 的 glob loader 默认会把 frontmatter 的 `slug` 当作 entry id。两条链接写同一个 slug 时，它只打印一条警告，然后静默丢弃其中一条。对内容集合来说，“悄悄少一条数据”比构建失败更糟。所以 loader 显式用文件路径生成 id，再由查询层检查重复：

```ts
const seen = new Set<string>()
for (const link of links) {
  if (seen.has(link.data.slug)) {
    throw new Error(`Duplicate link slug "${link.data.slug}": ${link.id}`)
  }
  seen.add(link.data.slug)
}
```

重复 slug 现在会直接让构建失败。

至于展示顺序——其实没有设计排序规则。按 slug 排只是为了让构建结果稳定，不代表推荐程度，也不代表友链的先后。所以页面上那句话必须写出来：

> 以下链接不分先后。

这比“假装有一个有意义的顺序”更诚实。将来如果真需要排序，应该新增一个独立的排序字段，而不是继续借用 slug——`slug` 的职责是身份，让它同时承担名次，就会复制“一个字段干三件事”的老问题。

## 收尾

这次改动最后落在四件分开的事上：

- `names` 是数据，描述“这条链接在不同语言下叫什么”；
- `localizedValue` 是策略，描述“缺失时回退到哪里”；
- `slug` 是身份，要求稳定且唯一；
- 展示顺序不是信息，页面明确标注不分先后。

字段各归其位之后，代码没有变多，反而少了几处重复。真正麻烦的从来不是加一个字段，而是让一个字段同时承担身份、名称和排序。把职责拆开，后面的选择才不会互相绑架。
