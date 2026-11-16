# 内容管理指南

站点的文章管理完全基于 Git 和 `src/content/blog/`，没有后台或 CMS。推送 `main` 后由 GitHub Actions 构建并发布。

## 目录与语言

- 中文是默认语言：中文页面在 `/`、`/blog/`、`/about/`，英文界面在 `/en` 前缀下。
- 每篇文章一个目录，**目录名就是 slug，也是 URL**：`src/content/blog/hello-astro/` → `/blog/hello-astro/`。
- 目录内的 Markdown 文件名不参与路由和配对，可以任意命名；推荐按语言命名，例如 `zh.md` 和 `en.md`。
- 语言由 frontmatter 的 `lang` 决定：`zh`（默认）或 `en`。文件名不决定语言。
- 英文译文与中文原文放在同一个目录里，共享目录名和 URL：`hello-astro/zh.md` 与 `hello-astro/en.md`。
- 同一个目录在同一种语言下只能有一篇，重复会让构建失败。
- 目录名会直接进入 URL 和 sitemap，必须是 URL 安全的：小写 ASCII，单词之间用 `-` 连接（`^[a-z0-9]+(-[a-z0-9]+)*$`）。
- 没有译文的文章不会从另一种语言的站点消失：英文站会展示中文原文（反之亦然），列表里带语言标记，详情页顶部提示原文语言，canonical 指向原文真正所在的 URL。
- 只要中文文章有对应译文，`/en` 下就会自动换成英文版本，URL 不变。

目录决定 slug，`lang` 决定语言，文件名只是 Markdown 文件的标签。

```text
src/content/blog/
├── hello-astro/
│   ├── zh.md
│   └── en.md
├── notes-september/
│   └── zh.md
└── space-and-rhythm/
    ├── zh.md
    └── en.md
```

## 新建文章

新建 `src/content/blog/<slug>/` 目录，在里面写 `zh.md`（需要组件时用 `.mdx`，文件名任意）：

```yaml
---
title: '把博客迁移到 Astro 之后'
description: '一两句话摘要，会用于列表、SEO description 和 RSS。'
pubDate: '2026-11-12'
updatedDate: '2026-11-15' # 可选
tags:
  - astro
  - engineering
heroImage: './cover.jpg' # 可选，路径相对于当前 Markdown 文件
draft: false # 可选，默认 false
lang: zh # 可选，默认 zh；英文译文写 en
---
## 小节标题

正文从 `##` 开始。
```

字段定义在 `src/content.config.ts`。

## 添加英文译文

1. 在原文所在目录里新建一个文件，推荐按语言命名，例如 `en.md`。
2. frontmatter 写 `lang: en`；`pubDate`、`tags`、`heroImage` 与原文保持一致，标题、摘要、正文写英文。
3. 构建会按目录把两个版本配成一对，`/en/blog/hello-astro/` 自动使用英文版本，`/blog/hello-astro/` 保持中文。
4. 没有译文的文章仍会出现在另一种语言的站点：列表标注原文语言，详情页提示“暂无英文版/中文版”，canonical 指向原文真正所在的 URL。补上 `en.md` 后这些回退行为自动消失。

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
| `lang`        | 否   | `zh`（默认）或 `en`；译文与原文同目录，推荐文件名用语言代码             |

## 标签

当前标签注册表在 `src/lib/tags.ts`：

```ts
;(astro, design, engineering, writing, notes, life, acgn, framework, code, wiki)
```

新增标签需要同时修改注册表；文章 frontmatter 和友链的 `tag` 都必须引用已定义的 id。标签会自动获得：

- `/tag/<tag>/` 标签页（全站命名空间，将来其他内容类型可以并入同一个标签页）；
- 标签页里该标签的全部文章（一次列出，不分页）；
- `src/lib/friends.ts` 中 `tag` 与该标签相同的友链；
- 博客列表的标签链接；
- Footer 的完整标签列表。

## URL 与排序

- 文章列表：`/blog/`，默认时间倒序。
- 分页：`/blog/?page=2`；时间顺序：`/blog/?order=oldest`；两者组合：`/blog/?page=2&order=oldest`。
- 标签：`/tag/design/`，列出该标签下的全部文章，并附带同标签的友链；标签页不参与分页和排序。
- 英文对应路径加 `/en` 前缀：`/en/blog/?page=2`、`/en/tag/design/`。
- 每页 5 篇，由 `src/lib/blog.ts` 的 `BLOG_PAGE_SIZE` 控制。

分页和排序是 querystring，不是独立页面。GitHub Pages 是静态托管，构建时读不到 query，所以列表页会一次性渲染全部文章的元数据（标题、摘要、日期、标签、封面），由脚本按 query 只显示当前页；无 JavaScript 时所有文章都显示，分页控件隐藏。正文仍然只在 `/blog/<slug>/` 渲染。

所有 query 状态的 canonical 都是各自的基础路径（`/blog/`、`/tag/<tag>/`），`?page=2` 不会作为独立页面被索引；文章本身仍通过列表 HTML、标签页、RSS 和 sitemap 被发现。标签页忽略分页和排序参数。

## 正文规则

- 不要写 `#`，文章标题由 `title` 生成；正文从 `##` 开始。
- 右侧目录只收集 `##` / `###`，重要章节不要放在 H4。
- 侧栏里目录贴顶、圆形回到顶部按钮贴底（靠右），按钮在滚动超过阈值后才出现；目录本身超过一屏时限高滚动。两者都用平滑滚动，系统开启“减少动态效果”时改为直接跳转。
- 代码块写语言标记，例如 ` ```ts `。
- 站内链接建议使用相对路径，例如 `../../about/` 或 `../another-post/`，这样在中文和 `/en` 路由下都能保持当前语言；绝对路径需要手动带 `/snowiest`。
- 图片可以放在文章目录里，用相对路径引用（`./cover.jpg`、`./diagram.png`）；正文图片推荐用 `.mdx` + `<Image>` 以获得优化和 alt 控制，封面统一用 `heroImage`。
- 在正文里嵌入组件（卡片、提示框等）时，给组件最外层加 `not-prose`：它会退出文章排版，外观由组件自己的样式负责。

## 草稿与发布

- `draft: true` 的文章在 `pnpm dev` 中可见，在 `pnpm build` 中不会生成任何页面，也不会进入列表、标签、时间轴、RSS 和 sitemap。
- `pubDate` 晚于当前时间的文章同样只在开发服务器中可见。生产构建会过滤未来文章，GitHub Actions 每天 00:00 UTC 定时重建一次，因此文章会在到达日期后的下一次构建中自动上线。
- 删除文章目录等于下线，旧链接会 404；重命名目录也会改变 URL，发布后应尽量保持目录名稳定。文件名可以随时改，不影响路由。

## 本地检查

```sh
pnpm dev
pnpm build
pnpm lint:check
pnpm format:check
```

构建会校验 frontmatter、标签 id、封面图片路径、目录名的 URL 规则，以及同一目录下同一语言只有一篇。发布前建议检查：

- `/blog/`、`/blog/?page=2`、`/blog/?order=oldest`；
- `/tag/<tag>/`（文章列表与关联友链）；
- `/en/blog/` 的英文界面；
- 已翻译文章的 `/en/blog/<slug>/` 是否为英文，未翻译文章是否带原文提示；
- 文章页的 canonical 与 hreflang 是否指向正确语言；
- 首页时间轴；
- `/rss.xml` 与 `/en/rss.xml`；
- 文章详情页右侧目录和移动端布局。
- 长目录：`src/content/blog/long-toc-test/zh.md` 是一篇 `draft: true` 的测试文章，专门检查目录限高、内部滚动和回到顶部，正常发布时保持草稿即可。

## 当前页面入口

- 中文首页：`/`
- 英文首页：`/en/`
- 标签页：`/tag/<tag>/`、`/en/tag/<tag>/`
- 中文文章：`/blog/<slug>/`
- 英文文章：`/en/blog/<slug>/`
- 中文 RSS：`/rss.xml`
- 英文 RSS：`/en/rss.xml`
