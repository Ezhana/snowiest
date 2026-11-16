---
title: '把约定从文件名里搬走'
description: '从 `-en` 后缀到目录即 slug，再到把分页和标签移出路径：一次清理隐含规则的记录。'
pubDate: '2026-11-16'
tags:
  - astro
  - engineering
lang: zh
---

## 一条没人写下来的规则

`content/blog` 里曾有一条规则：英文文章必须以 `-en` 结尾。它不在 schema 里，只在 `postSlug()` 的一行正则和 `assertPostConventions()` 里：中文文件带 `-en` 会被拦下，英文文件不带也会被拦下。构建会失败，所以你迟早会知道——但顺序是先取名字，再被构建教育。

更麻烦的是这个后缀同时承担了三件事：文件名是 URL，后缀是语言，后缀还是译文配对键。改名等于改链接；中文标题的文件名会被 github-slugger 悄悄转成小写、空格变连字符；而 `-en` 算不算名字的一部分，取决于你从哪个角度看。

顺带确认了几个事实：中文文件名本身能用，`中文-测试 标题.md` 会得到 `/blog/中文-测试-标题/`；canonical 和 sitemap 里是百分号编码，浏览器和 Google 都能处理，没有排名惩罚，但复制分享出来是一串 `%E4%B8%AD`。技术上可用，不代表适合当地址。

## 把 slug 交给目录

改法是让目录承担 slug，让文件恢复成普通文件：每篇文章一个目录，目录名就是 URL；目录里的 Markdown 叫什么都行，推荐 `zh.md` / `en.md`；语言仍由 frontmatter 的 `lang` 决定。

```text
src/content/blog/hello-astro/
├── zh.md
└── en.md
```

`postSlug()` 也从“去掉后缀”变成“取文件所在目录”：

```ts
const BLOG_DIR_PREFIX = `${BLOG_CONTENT_DIR}/`

function postFolder(post: BlogPost): string | undefined {
  const filePath = post.filePath
  if (!filePath?.startsWith(BLOG_DIR_PREFIX)) return undefined

  const relativePath = filePath.slice(BLOG_DIR_PREFIX.length)
  if (!relativePath.includes('/')) return ''
  return relativePath.replace(/\/[^/]+$/, '')
}
```

目录名会直接进 URL，所以校验也名正言顺：必须是 ASCII 小写、单词之间用连字符；同一目录同一语言只能有一篇。文件名不再参与任何判断，`zh.md` 只是推荐，不是规则。

## 一个差点踩进去的坑

中途考虑过更“元数据”的做法：在 frontmatter 里写 `slug`。看起来更干净，但 Astro 的 glob loader 会先读原始 frontmatter，如果存在 `slug` 字段就把它当作 entry id——比 schema 解析更早。于是中英两个版本写同一个 slug 时，两个 entry 会得到同一个 id，互相覆盖；构建甚至不会报重复，因为你自己的校验还没轮到，条目已经少了一个。

如果以后还要走 `slug` 元数据这条路，就必须显式覆盖默认行为：

```ts
glob({
  base: './src/content/blog',
  pattern: '**/*.{md,mdx}',
  // 条目 ID 必须来自文件，而不是 frontmatter 的 slug。
  generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
})
```

最终没有用它：目录已经是 slug，再叠一层元数据只会多一个需要保持同步的地方。但这个坑记下来了。

## 保留名是下一条隐含规则

目录方案落地后，还剩三个名字不能用：`page`、`oldest`、`tag`，因为博客自己的路由占着 `/blog/page/2/`、`/blog/oldest/`、`/blog/tag/design/`。这又变成了“取名之前先记住”的规则。

要让 slug 彻底自由，只能把这三个词从路径里移走：

- `page` / `oldest` → query：`/blog/?page=2`、`/blog/?order=oldest`；
- `tag` → 全站命名空间：`/tag/design/`，以后别的类型的内容也能进同一个标签页。

## 静态站没有 query 页面

这是整次改动里唯一的硬约束。GitHub Pages 是静态托管，构建时读不到 query，`getStaticPaths` 也生成不出 `?page=2` 的独立 HTML。分页只能变成：列表页一次渲染全部文章的元数据，脚本读取 query，只显示当前页。

这里只渲染标题、摘要、日期、标签、封面，不渲染正文——列表页本来也只有这些。代价是列表 HTML 随文章数增长；十几篇无所谓，上百篇再考虑数据接口。

其他取舍：

- 无 JavaScript 时全部文章可见，分页控件隐藏，和首页时间线“先服务端渲染、再由脚本接管”的做法一致；
- 所有 query 状态 canonical 回 `/blog/`、`/tag/<tag>/`，`?page=2` 不再是一张独立可索引的页面；文章仍从列表 HTML、标签页、RSS 和 sitemap 被发现；
- 旧的分页和标签 URL 直接 404，没有生成重定向页——否则 `/blog/page/2/` 又被占住，等于把刚删掉的保留名请回来。

## 验证

静态检查（tsc、build、lint、Prettier）只能证明生成成功，分页逻辑要靠浏览器。用无头 Chrome 实测了：第 2 页只显示 5 篇、`order=oldest` 从最旧开始、`page=99` 收敛到最后一页、标签页分页、标签切换保留排序、后退恢复状态；也在禁用脚本的情况下确认了全部文章可见、分页隐藏。页面内点击分页会走 ClientRouter，脚本必须在 `astro:page-load` 之后重新接管，这一条单独验证过。

## 留下的东西

文件名从协议退化成标签；slug 由目录承担；分页和排序变成显式的 query；标签不再属于博客，而属于站点。规则少了，但每条都写在代码或文档里，能被构建校验，也能被搜索到。

还有两处有意保留：文件名推荐用语言代码，但不强制，语言仍由 `lang` 决定；列表页在文章变多之前不引入额外数据层。它们都是以后可以再改的决定，不是隐藏条件。
