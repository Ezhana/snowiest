---
title: '把友链、动态和标签搬进 content 之后'
description: '从一份写死的友链数组开始，把内容类型、标签数据和命令行入口收进同一层，再补上动态页、无限滚动和时间排序。'
pubDate: '2026-11-17'
tags:
  - engineering
  - design
lang: zh
---

关于页的「友情链接」曾经是 `src/lib/friends.ts` 里的一份数组。改一个名字要翻组件，加一个链接要改 TypeScript，想在标签页里复用同一批数据，还要再写一遍按标签过滤的逻辑。友链只是链接的一种使用场景，却被写成了唯一场景。

这次把内容层往前推了一步：链接、动态和标签都进了 `src/content/`，配一个 content CLI；动态有了自己的页面，标签页也能聚合链接和动态。

## Link 不是友链

第一件事是把 `FriendLink` 改名成 `Link`，并把数据从代码搬到内容文件：

```text
src/content/links/
├── astro.md
├── bangumi.md
├── github.md
└── moegirl.md
```

一个链接一个文件，frontmatter 保留名称、地址、标签和中英双语的一句话介绍：

```yaml
---
name: 'Astro'
url: 'https://astro.build/'
description:
  zh: '这个站点的骨架。文档清楚，社区温和。'
  en: 'The skeleton of this site. Clear docs and a gentle community.'
tag: engineering
---
```

文件名就是稳定的 id，展示顺序按 id 排；描述缺一种语言时回退到另一种。`/about/` 和 `/tag/<tag>/` 都从同一个集合读数据，组件里不再有第二份列表。新增链接可以直接写文件，也可以：

```sh
pnpm content link add https://astro.build --name Astro --tag engineering
```

## Moment：零元数据，文件名就是时间

动态的定位是「一两句话，写完就发」。如果还要填 title、date、slug，这个动作就会无限期推迟。于是 Moment 的约定尽量少：

- 正文就是 Markdown 本体，没有必填 frontmatter；
- 发布时间从文件名推导；
- 时区信息写进文件名，换机器也不会产生歧义。

```text
src/content/moments/2026-11-17T18-30-00+0800.md
```

文件名里的时间戳在默认的 content loader 下会被 slug 化：大写 `T` 变 `t`，`+` 被吃掉，时刻就错了。这里给 `moments` 集合换了 `generateId`，保留原始文件名，并在加载时解析校验——文件名写错直接让构建失败，而不是等到某个列表页第一次读时间才炸。

发布命令可以很轻：

```sh
pnpm content moment add 今天终于把 content CLI 写完了 --tag engineering
pnpm content moment add        # 打开 $EDITOR
echo '来自管道的一句话' | pnpm content moment add
```

零元数据时连 frontmatter 都不写；只有 `--tag` 或 `--lang` 才出现 YAML 头。

## 标签也搬进 content

标签注册表原来拆成两个 TypeScript 模块：id 列表和标签名。CLI 要校验 `--tag`，就得从纯数据模块里读 id；再往后如果为了读数据去解析 AST，复杂度会迅速超过收益。

所以标签改成单文件 JSON，作为唯一数据源：

```json
[
  { "id": "design", "label": { "zh": "设计", "en": "Design" } },
  { "id": "engineering", "label": { "zh": "工程", "en": "Engineering" } }
]
```

`scripts/generate-tags.mjs` 把它编译成 `src/lib/tags.generated.ts`：`TAG_IDS` 字面量、`TagId` 联合类型、完整定义。`pnpm dev` 和 `pnpm build` 前都会自动生成，CI 里额外跑一次 `pnpm tags:check`，防止提交的生成文件和 JSON 脱节。

CLI 直接读写 JSON，另外负责两件事：`tag add` 后立即重新生成类型；`tag remove` 前扫描文章、链接、动态的 frontmatter，仍被引用就拒绝删除——删标签比删内容容易，但构建失败时不好找原因。

## 动态页：不要时间轴

第一版动态页沿用了首页的月份时间轴：竖线、圆点、月份标题、按月分批。把数据放上去之后发现不对：动态本身就是一条条独立的短句，时间轴反而把它们切成一段段，读者要先读分组再看内容。

于是改成纯列表：一个页头，下面是一张张卡片；正文在前，时间和标签在后；没有月份标题，也没有竖线。无限滚动保留，但从时间轴里抽成了通用的 `infinite-list.ts`：

- 所有批次服务端渲染，没有 JS 也能看全；
- 默认显示前几批，滚动接近 sentinel 时再显示下一批；
- 首页时间轴和动态页共用同一套逻辑，用 `data-initial-batches` / `data-load-batches` 调整节奏。

排序也接在同一个页面上：默认近期优先，`?order=oldest` 切成最早优先。查询串在静态构建时读不到，所以排序发生在客户端；最早优先不是逐条重排 DOM，而是把「按时间连续切好的批次」整体倒序、再把每批内部倒序，这样无限滚动的批次边界仍然成立。切排序时先排 DOM、再初始化无限列表，否则隐藏状态会跟着旧顺序走。

## 标签页与排序那点复用

标签页原来的结构是文章 + 链接；现在在链接之后补了「相关动态」。动态卡片组件复用了动态页的 `MomentCard`，只是在标签页里关掉标签 pill——当前页面已经按这个标签过滤，卡片上再显示一次是重复信息。

排序控件也顺手从 `BlogFilter` 里抽成了通用的 `OrderFilter` 和 `order.ts`，博客列表和动态页共用同一套「近期/最早」状态与激活样式。

## 这次重构留下的判断

- 数据结构单一来源时，生成代码比运行时解析可靠。生成文件提交进仓库，CI 检查它是否过期。
- CLI 的价值不是「多一个入口」，而是把重复的元数据和命名约定变成一次命令；真正需要摩擦的地方（写作）留给编辑器。
- 复用组件之前先确认复用的是什么。无限滚动的机制值得复用，时间轴的形式不值得。
- 客户端排序要连同分页/分批的边界一起考虑；只重排可见项，滚动之后顺序就会露馅。

站点看起来还是原来的样子，只是内容终于都待在 `content` 里了。
