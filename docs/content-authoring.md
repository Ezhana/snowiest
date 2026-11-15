# 内容管理指南

站点的文章管理完全基于 Git 和 `src/content/blog/`，没有后台或 CMS。推送 `main` 后由 GitHub Actions 构建并发布。

## 语言约定

- 中文是默认语言：中文页面在 `/`、`/blog/`、`/about/`，英文界面在 `/en` 前缀下。
- 所有文章都放在 `src/content/blog/` 这一个平铺目录里，**语言由 frontmatter 的 `lang` 决定**：`zh`（默认）或 `en`。
- 英文译文与中文原文共享同一个 slug：原文 `hello-astro.md`，译文 `hello-astro-en.md`。英文文件名必须以 `-en` 结尾，构建会校验这一约定。
- 同一个 slug 在同一种语言下只能有一篇，重复会让构建失败。
- 没有译文的文章不会从另一种语言的站点消失：英文站会展示中文原文（反之亦然），列表里带语言标记，详情页顶部提示原文语言，canonical 指向原文真正所在的 URL。
- 只要中文文章有对应译文，`/en` 下就会自动换成英文版本，URL 不变。

## 新建文章

在 `src/content/blog/` 新建 `<slug>.md`（需要组件时用 `.mdx`）：

```yaml
---
title: '把博客迁移到 Astro 之后'
description: '一两句话摘要，会用于列表、SEO description 和 RSS。'
pubDate: '2026-11-12'
updatedDate: '2026-11-15' # 可选
tags:
  - astro
  - engineering
heroImage: '../../assets/blog-placeholder-1.jpg' # 可选
draft: false # 可选，默认 false
lang: zh # 可选，默认 zh；英文译文写 en
---
## 小节标题

正文从 `##` 开始。
```

字段定义在 `src/content.config.ts`。

## 添加英文译文

1. 在原文旁新建文件并加 `-en` 后缀：`hello-astro.md` → `hello-astro-en.md`。
2. frontmatter 写 `lang: en`；`pubDate`、`tags`、`heroImage` 与原文保持一致，标题、摘要、正文写英文。
3. 不需要改路由或查询：构建会按 slug 把两个版本配成一对，`/en/blog/hello-astro/` 自动使用英文版本，`/blog/hello-astro/` 保持中文。
4. 没有译文的文章仍会出现在另一种语言的站点：列表标注原文语言，详情页提示“暂无英文版/中文版”，canonical 指向原文真正所在的 URL。补上 `-en.md` 后这些回退行为自动消失。

## 字段规则

| 字段          | 必填 | 说明                                                                    |
| ------------- | ---- | ----------------------------------------------------------------------- |
| `title`       | 是   | 详情页 h1、列表标题、RSS 标题                                           |
| `description` | 是   | 摘要，列表/SEO/RSS 共用                                                 |
| `pubDate`     | 是   | 排序、时间轴、分页依据；推荐 `YYYY-MM-DD`                               |
| `updatedDate` | 否   | 详情页显示最后更新时间                                                  |
| `tags`        | 否   | 标签 id 数组，必须是 `src/lib/tags.ts` 中已定义的 id                    |
| `heroImage`   | 否   | 本地封面图，路径相对于当前文件；同时用于列表缩略图、详情大图和 OG image |
| `draft`       | 否   | `true` 时只在开发服务器可见，生产构建排除                               |
| `lang`        | 否   | `zh`（默认）或 `en`；英文译文文件还必须以 `-en` 结尾                    |

## 标签

当前标签注册表在 `src/lib/tags.ts`：

```ts
;(astro, design, engineering, writing, notes, life)
```

新增标签需要同时修改注册表和文章 frontmatter，否则 schema 校验失败。标签会自动获得：

- `/blog/tag/<tag>/` 标签页；
- `/blog/tag/<tag>/oldest/` 时间顺序标签页；
- 标签页的 `page/2/` 等分页路径；
- 博客列表的标签链接；
- Footer 的完整标签列表。

## URL 与排序

- 默认时间倒序：`/blog/`、`/blog/page/2/`。
- 时间顺序：`/blog/oldest/`、`/blog/oldest/page/2/`。
- 标签：`/blog/tag/design/`、`/blog/tag/design/oldest/`、`/blog/tag/design/page/2/`。
- 英文对应路径加 `/en` 前缀，slug 与中文相同：`/en/blog/`、`/en/blog/page/2/`、`/en/blog/tag/design/`。
- 每页 5 篇，由 `src/lib/blog.ts` 的 `BLOG_PAGE_SIZE` 控制。

## 正文规则

- 不要写 `#`，文章标题由 `title` 生成；正文从 `##` 开始。
- 右侧目录只收集 `##` / `###`，重要章节不要放在 H4。
- 代码块写语言标记，例如 ` ```ts `。
- 站内链接建议使用相对路径，例如 `../../about/` 或 `../another-post/`，这样在中文和 `/en` 路由下都能保持当前语言；绝对路径需要手动带 `/snowiest`。
- 正文图片推荐用 `.mdx` + `<Image>` 以获得优化和 alt 控制；封面统一用 `heroImage`。

## 草稿与发布

- `draft: true` 的文章在 `pnpm dev` 中可见，在 `pnpm build` 中不会生成任何页面，也不会进入列表、标签、时间轴、RSS 和 sitemap。
- `pubDate` 晚于当前时间的文章同样只在开发服务器中可见。生产构建会过滤未来文章，GitHub Actions 每天 00:00 UTC 定时重建一次，因此文章会在到达日期后的下一次构建中自动上线。
- 删除文章等于下线，旧链接会 404；重命名 slug 也会改变 URL，发布后应尽量保持 slug 稳定。

## 首页与关于页

- 首页开场白与站点介绍：`src/pages/index.astro`、`src/pages/en/index.astro`。
- 关于页自我介绍：`src/pages/about.astro`、`src/pages/en/about.astro`。
- 友链列表：`src/lib/friends.ts`。每条包含 `name`、`url`、`description`（中/英）和 `tag`（中/英），中英文描述都需要填写。

## 本地检查

```sh
pnpm dev
pnpm build
pnpm lint:check
pnpm format:check
```

构建会校验 frontmatter、标签 id、封面图片路径，以及译文文件命名和同语言 slug 唯一性。发布前建议检查：

- `/blog/`、`/blog/oldest/`、`/blog/tag/<tag>/`；
- `/en/blog/` 的英文界面；
- 已翻译文章的 `/en/blog/<slug>/` 是否为英文，未翻译文章是否带原文提示；
- 文章页的 canonical 与 hreflang 是否指向正确语言；
- 首页时间轴；
- `/rss.xml` 与 `/en/rss.xml`；
- 文章详情页右侧目录和移动端布局。

## 当前页面入口

- 中文首页：`/`
- 英文首页：`/en/`
- 中文文章：`/blog/<slug>/`
- 英文文章：`/en/blog/<slug>/`
- 中文 RSS：`/rss.xml`
- 英文 RSS：`/en/rss.xml`
