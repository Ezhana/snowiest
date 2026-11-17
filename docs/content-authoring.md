# 内容管理指南

站点的内容都在 `src/content/` 下，按资源类型分为三个集合，完全基于 Git，没有后台或 CMS：

| 集合      | 目录                   | 用途                           |
| :-------- | :--------------------- | :----------------------------- |
| `blog`    | `src/content/blog/`    | 文章                           |
| `links`   | `src/content/links/`   | 链接：友链、工具、常逛的站点等 |
| `moments` | `src/content/moments/` | 动态：一两句话的短内容         |

日常新建内容推荐用 [content CLI](content-cli.md)（`pnpm content ...`），它负责生成元数据和文件名；也可以用编辑器直接建文件，规则见下文。推送 `main` 后由 GitHub Actions 构建并发布。

## 双语字段与回退

带语言的字段写成 `{ zh, en }`，至少提供一种。渲染时按「当前语言 → 默认语言（中文）→ 其他可用语言」回退，缺失翻译不会显示为空。规则集中在 `src/i18n/localized.ts`；链接的 `names` 与 `description` 都遵循它。

## 文章（Blog）

### 目录与语言

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

### 新建文章

推荐用 CLI：

```sh
pnpm content blog new                 # 交互询问标题、slug、摘要、标签，随后打开编辑器
pnpm content blog new <slug> --title '标题' --description '摘要' --no-edit
```

CLI 会创建 `src/content/blog/<slug>/<lang>.md`，写入 `title`、`description`、`pubDate`、`tags`、`lang`，并把 `draft` 设为 `true`。写完后用 `pnpm content blog publish <slug>` 发布。

手动创建时新建 `src/content/blog/<slug>/` 目录，在里面写 `zh.md`（需要组件时用 `.mdx`，文件名任意）：

```yaml
---
title: '把博客迁移到 Astro 之后'
description: '一两句话摘要，会用于列表、SEO description 和 RSS。'
pubDate: '2026-11-12'
updatedDate: '2026-11-15' # 可选
tags:
  - engineering
heroImage: './cover.jpg' # 可选，路径相对于当前 Markdown 文件
draft: false # 可选，默认 false
lang: zh # 可选，默认 zh；英文译文写 en
---
## 小节标题

正文从 `##` 开始。
```

字段定义在 `src/content.config.ts`。

### 添加英文译文

1. 在原文所在目录里新建一个文件，推荐按语言命名，例如 `en.md`。
2. frontmatter 写 `lang: en`；`pubDate`、`tags`、`heroImage` 与原文保持一致，标题、摘要、正文写英文。
3. 构建会按目录把两个版本配成一对，`/en/blog/hello-astro/` 自动使用英文版本，`/blog/hello-astro/` 保持中文。
4. 没有译文的文章仍会出现在另一种语言的站点：列表标注原文语言，详情页提示“暂无英文版/中文版”，canonical 指向原文真正所在的 URL。补上 `en.md` 后这些回退行为自动消失。

### 字段规则

| 字段          | 必填 | 说明                                                                    |
| ------------- | ---- | ----------------------------------------------------------------------- |
| `title`       | 是   | 详情页 h1、列表标题、RSS 标题                                           |
| `description` | 是   | 摘要，列表/SEO/RSS 共用                                                 |
| `pubDate`     | 是   | 排序、时间轴、分页依据；推荐 `YYYY-MM-DD`                               |
| `updatedDate` | 否   | 详情页显示最后更新时间                                                  |
| `tags`        | 否   | 标签 id 数组，必须是 `src/content/tags.json` 中已定义的 id              |
| `heroImage`   | 否   | 本地封面图，路径相对于当前文件；同时用于列表缩略图、详情大图和 OG image |
| `draft`       | 否   | `true` 时只在开发服务器可见，生产构建排除                               |
| `lang`        | 否   | `zh`（默认）或 `en`；译文与原文同目录，推荐文件名用语言代码             |

## 链接（Link）

链接不只用于友链：朋友、工具、参考资料、常逛的站点都放在同一个集合里。一个链接一个文件：

```text
src/content/links/
├── astro.md
├── bangumi.md
├── github.md
└── moegirl.md
```

文件名（去掉扩展名）建议与 `slug` 一致；`slug` 是链接的稳定标识，必须独一无二，发布后尽量保持稳定。文件内容：

```yaml
---
slug: 'astro'
names:
  zh: 'Astro'
  en: 'Astro'
url: 'https://astro.build/'
description:
  zh: '这个站点的骨架。文档清楚，社区温和。'
  en: 'The skeleton of this site. Clear docs and a gentle community.'
tag: engineering
icon: 'https://astro.build/favicon.svg'
---
```

| 字段          | 必填 | 说明                                                                         |
| ------------- | ---- | ---------------------------------------------------------------------------- |
| `slug`        | 是   | 稳定标识；小写英文字母、数字和连字符（`^[a-z0-9]+(-[a-z0-9]+)*$`），不可重复 |
| `names`       | 是   | 双语名称，至少写 `zh`、`en` 其中一种；缺失语言按统一规则回退                 |
| `url`         | 是   | 链接地址，必须是合法的 http(s) URL                                           |
| `description` | 否   | 一句话介绍，按语言写；至少提供 `zh`、`en` 其中一种，缺失语言会回退           |
| `tag`         | 否   | 标签 id；标签页会列出同标签的链接                                            |
| `icon`        | 否   | 方形图标的外部 URL；缺失时回退为名称首字母方块                               |

- 展示位置：`/about/` 的「友情链接」主列表只展示 `src/components/links/FriendLinks.astro` 里 `FRIEND_LINK_SLUGS` 列出的 slug，并按列表顺序排列；本站（`SELF_LINK_SLUG`，当前是 `snowiest`）单独放在小节末尾，以「本站信息」为标题，按名称、图标、链接、介绍列出。`/tag/<tag>/` 展示该标签下的全部链接，不受这些列表限制。
- 新增友链时除了创建链接文件，还要把 `slug` 加进 `FRIEND_LINK_SLUGS`；列表里写了不存在的 slug 会让构建失败，避免友链悄悄消失。工具、参考资料等只给标签页用的链接不需要加进去。本站链接由 `SELF_LINK_SLUG` 指定，不放进友链主列表。
- `icon` 只在编辑器中手动写入 frontmatter（content CLI 暂不询问），建议使用站点 favicon 或方形图标；图标在 About、标签页和本站信息中都生效。本站的 `icon` 指向部署后的 `/snowiest/favicon.ico`。
- 链接列表不分先后：标签页按 `slug` 稳定排序，About 按 `FRIEND_LINK_SLUGS` 的顺序展示，都不代表推荐程度。将来若需要真正的排序，应新增独立的排序字段，而不是复用 `slug`。
- 新增推荐用 CLI：`pnpm content link add <url> --name <中文名> --name-en <英文名> --description <介绍> --tag <id>`。
- 删除链接就是删除对应文件；修改名称、地址、介绍直接编辑文件。
- 链接正文（`---` 之后的部分）目前不展示，可留空。

## 动态（Moment）

动态是零配置的短内容：正文就是 Markdown 本体，发布时间来自文件名，默认不需要任何 frontmatter。

```text
src/content/moments/
└── 2026-11-17T18-30-00+0800.md
```

```md
今天终于把 content CLI 写完了，发一条动态测试一下。
```

- 文件名是本地时间加数字时区偏移：`YYYY-MM-DDTHH-mm-ss+HHMM.md`。发布时刻由文件名推导，因此**不要随意改名**。
- 零元数据即可发布；可选 `tags`（标签 id 数组）和 `lang`（`zh` 默认 / `en`）。
- 动态展示在 `/moment/` 与 `/en/moment/`：纯列表，不分月、不画时间轴；沿用通用无限滚动（先渲染全部，脚本按滚动分批显示）。默认近期优先，`?order=oldest` 切换为最早优先；动态保持写作时的语言，页面会给非当前语言的条目加语言标记。
- 发布推荐用 CLI，它会自动生成时间戳文件名：

```sh
pnpm content moment add 今天终于把 content CLI 写完了 --tag engineering
pnpm content moment add        # 打开 $EDITOR 写正文
echo '来自管道的一句话' | pnpm content moment add
```

- 动态的 `tag` 会显示在动态卡片上，并聚合到对应标签页的「相关动态」，位置在「相关链接」之后；标签 id 仍会校验。

## 标签

标签的唯一数据源是 `src/content/tags.json`，一个文件描述全部标签：

```json
[
  { "id": "design", "label": { "zh": "设计", "en": "Design" } },
  { "id": "engineering", "label": { "zh": "工程", "en": "Engineering" } }
]
```

- `id` 只能使用小写英文字母、数字和连字符，且不能重复；`label.zh` / `label.en` 都必须填写。
- 修改 JSON 后运行 `pnpm tags:generate` 生成 `src/lib/tags.generated.ts`；`pnpm dev` 和 `pnpm build` 会自动执行这一步。如果绕过 pnpm 直接运行 `astro dev` / `astro build`，需要先手动生成。**不要直接修改生成文件。**
- 推荐用 CLI 维护：`pnpm content tag add <id> --zh <中文名> --en <英文名>`、`pnpm content tag list`、`pnpm content tag remove <id>`。仍被文章、链接或动态引用的标签不允许删除。
- 文章 frontmatter、链接和动态的 `tag` 都必须引用已定义的 id；否则构建失败。

标签会自动获得：

- `/tag/<tag>/` 标签页（全站命名空间，其他内容类型可以并入同一个标签页）；
- 标签页里该标签的全部文章（一次列出，不分页）；
- 同标签的链接；
- 同标签的动态（以「相关动态」区块展示在链接之后）；
- 博客列表的标签链接；
- Footer 的完整标签列表。

## URL 与排序

- 文章列表：`/blog/`，默认时间倒序。
- 分页：`/blog/?page=2`；时间顺序：`/blog/?order=oldest`；两者组合：`/blog/?page=2&order=oldest`。
- 标签：`/tag/design/`，列出该标签下的全部文章，并附带同标签的链接和动态；标签页不分页，但和列表页一样支持 `?order=oldest` 时间排序。
- 动态：`/moment/`，默认近期优先，`?order=oldest` 切换为最早优先；排序与无限滚动都是客户端行为，服务端始终按近期优先输出完整列表。
- 英文对应路径加 `/en` 前缀：`/en/blog/?page=2`、`/en/tag/design/`。
- 每页 5 篇，由 `src/lib/blog.ts` 的 `BLOG_PAGE_SIZE` 控制。

分页和排序是 querystring，不是独立页面。GitHub Pages 是静态托管，构建时读不到 query，所以列表页会一次性渲染全部文章的元数据（标题、摘要、日期、标签、封面），由脚本按 query 只显示当前页；无 JavaScript 时所有文章都显示，分页控件隐藏。正文仍然只在 `/blog/<slug>/` 渲染。

所有 query 状态的 canonical 都是各自的基础路径（`/blog/`、`/tag/<tag>/`），`?page=2` 不会作为独立页面被索引；文章本身仍通过列表 HTML、标签页、RSS 和 sitemap 被发现。标签页忽略分页参数，`?order=oldest` 与列表页一样由脚本按时间顺序重排。

## 正文规则

- 不要写 `#`，文章标题由 `title` 生成；正文从 `##` 开始。
- 右侧目录只收集 `##` / `###`，重要章节不要放在 H4。
- 桌面端目录在正文右缘外侧（aside 保留 `ms`），圆形回顶在右栏底部；按钮右缘距正文右缘 4.5rem，与目录左缘大致对齐。目录在上（最大 80dvh，超出时列表内部滚动），按钮固定在下；短目录中间留空。
- 手机端在 header 第二行左右放目录和回到顶部；平板端把目录/回顶两个圆形按钮浮在正文右侧；到 `xl` 后目录按钮隐藏，圆形回顶保留，目录交给右侧栏。
- 点击目录按钮从左侧打开抽屉；抽屉内目录独立滚动，底部固定回到顶部。手机和平板共用同一个抽屉，桌面 aside 不需要抽屉。
- 无 JavaScript 时按钮入口隐藏，改为文章开头的 `<details>` 内联目录（`xl` 以下）和桌面 aside；两种形态都能直接跳转。
- 目录标题跳转保持瞬时（与浏览器锚点一致）；所有“回到顶部”入口平滑滚动，`prefers-reduced-motion` 时改为瞬时。锚点定位由脚本按真实 header 高度写入 `scroll-padding-top`。
- 代码块写语言标记，例如 ` ```ts `。
- 站内链接建议使用相对路径，例如 `../../about/` 或 `../another-post/`，这样在中文和 `/en` 路由下都能保持当前语言；绝对路径需要手动带 `/snowiest`。
- 图片可以放在文章目录里，用相对路径引用（`./cover.jpg`、`./diagram.png`）；正文图片推荐用 `.mdx` + `<Image>` 以获得优化和 alt 控制，封面统一用 `heroImage`。
- 在正文里嵌入组件（卡片、提示框等）时，给组件最外层加 `not-prose`：它会退出文章排版，外观由组件自己的样式负责。

## 草稿与发布

- `draft: true` 的文章在 `pnpm dev` 中可见，在 `pnpm build` 中不会生成任何页面，也不会进入列表、标签、时间轴、RSS 和 sitemap。
- `pnpm content blog publish <slug>` 会把该文章目录下所有语言版本的 `draft` 改成 `false`；它不修改 `pubDate`。
- `pubDate` 晚于当前时间的文章同样只在开发服务器中可见。生产构建会过滤未来文章，GitHub Actions 每天 00:00 UTC 定时重建一次，因此文章会在到达日期后的下一次构建中自动上线。CLI 发布未来日期的文章时会提示这一点。
- 删除文章目录等于下线，旧链接会 404；重命名目录也会改变 URL，发布后应尽量保持目录名稳定。文件名可以随时改，不影响路由。

## 本地检查

```sh
pnpm dev
pnpm build
pnpm tags:check
pnpm lint:check
pnpm format:check
```

构建前会由 `pnpm tags:generate` 把 `tags.json` 编译成类型；构建会校验 frontmatter、标签 id、封面图片路径、链接的 slug/名称/URL/描述、动态文件名的时间戳格式、文章目录名的 URL 规则，以及同一目录下同一语言只有一篇。发布前建议检查：

- `/blog/`、`/blog/?page=2`、`/blog/?order=oldest`；
- `/tag/<tag>/`（文章列表、关联链接、相关动态与时间排序）；
- `/about/` 的链接区块；
- `/moment/` 与 `/en/moment/` 的动态列表、近期/最早排序和滚动加载；
- `/en/blog/` 的英文界面；
- 已翻译文章的 `/en/blog/<slug>/` 是否为英文，未翻译文章是否带原文提示；
- 文章页的 canonical 与 hreflang 是否指向正确语言；
- 首页时间轴；
- `/rss.xml` 与 `/en/rss.xml`；
- 文章详情页的目录：桌面侧栏、手机 header、平板浮动按钮、抽屉、无 JS 兜底和回到顶部。
- 长目录：`src/content/blog/long-toc-test/zh.md` 是一篇 `draft: true` 的测试文章，专门检查目录限高、内部滚动和回到顶部，正常发布时保持草稿即可。

## 当前页面入口

- 中文首页：`/`
- 英文首页：`/en/`
- 标签页：`/tag/<tag>/`、`/en/tag/<tag>/`
- 中文文章：`/blog/<slug>/`
- 英文文章：`/en/blog/<slug>/`
- 中文 RSS：`/rss.xml`
- 英文 RSS：`/en/rss.xml`
- 中文动态：`/moment/`
- 英文动态：`/en/moment/`
