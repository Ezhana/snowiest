# content CLI

`pnpm content` 用命令创建 `src/content/` 下的内容、维护标签。CLI 只负责文件名和元数据，正文交给编辑器：Moment 尽量零配置，Blog 由 CLI 建好 frontmatter，编辑器负责写作。

入口是 `package.json` 的 `content` 脚本（`node scripts/content.mjs`），所有命令都通过 `pnpm content` 调用。

## 命令

```sh
pnpm content moment add [内容...] [--tag <id>]... [--lang zh|en]
pnpm content blog new [slug] [--slug <id>] [--title <标题>] [--description <摘要>]
                      [--tag <id>]... [--lang zh|en] [--no-edit]
pnpm content blog publish <slug>
pnpm content link add <url> [--name <中文名>] [--name-en <英文名>] [--slug <id>]
                          [--description <中文介绍>] [--description-en <英文介绍>] [--tag <id>]
pnpm content tag add <id> [--zh <中文名>] [--en <英文名>]
pnpm content tag list
pnpm content tag remove <id>
pnpm content --help
```

标签的唯一数据源是 `src/content/tags.json`，用 `pnpm content tag list` 查看当前可用标签。

## Moment

Moment 是零配置短内容：正文直接写在命令后面，CLI 用当前本地时间生成文件名，不写 frontmatter。

```sh
pnpm content moment add 今天终于把 content CLI 写完了
pnpm content moment add 换了一个新的配色方案 --tag design
pnpm content moment add 在终端里直接写 --tag life --lang zh
```

- 文件形如 `src/content/moments/2026-11-17T18-30-00+0800.md`，发布时刻由文件名推导。
- 带 `--tag` 时才写 frontmatter；多个标签可以重复 `--tag`。带标签的动态会聚合到对应标签页的「相关动态」，位置在关联链接之后。
- 不带内容时：
  - 终端中运行会打开 `$VISUAL` / `$EDITOR`（都未设置时用 `vi`，Windows 用 `notepad`），保存关闭后发布；
  - 从管道读取时把标准输入作为正文：`echo '一句话' | pnpm content moment add`。
- 正文为空时命令取消，不创建文件。

## Blog

### 新建

```sh
pnpm content blog new
```

交互流程：标题 → slug（默认从英文标题推导）→ 摘要 → 标签（可留空）。随后创建：

```text
src/content/blog/<slug>/<lang>.md
```

frontmatter 写入 `title`、`description`、`pubDate`（今天）、`tags`、`lang`，并把 `draft` 设为 `true`；正文留空，创建后在编辑器中写作。

非交互或指定全部字段：

```sh
pnpm content blog new content-cli \
  --title '用命令发布内容' \
  --description 'content CLI 的命令与约定。' \
  --tag engineering \
  --tag writing \
  --no-edit
```

- slug 规则：小写英文字母、数字和连字符（`^[a-z0-9]+(-[a-z0-9]+)*$`）。可以用位置参数或 `--slug` 指定，位置参数优先。
- 目录里已有同语言版本时命令报错，不会覆盖；语言按每个文件的 frontmatter `lang` 判断（缺失按 `zh`），并兜底检查 `<lang>.md` / `<lang>.mdx` 是否存在。同一 slug 目录下可以添加另一种语言版本。
- `--no-edit` 跳过创建后的编辑器。
- 语言默认 `zh`，英文版加 `--lang en`；同一篇文章的不同语言版本放在同一目录。

### 发布

```sh
pnpm content blog publish <slug>
```

- 把 `src/content/blog/<slug>/` 下所有 `.md` / `.mdx` 的 `draft` 改为 `false`，多语言版本一起发布。
- 不修改 `pubDate`。如果 `pubDate` 是未来日期，构建仍会等到该日期之后才展示，CLI 会提示。
- 已经是发布状态时只提示，不重复写文件。

## Link

链接不只用于友链：朋友、工具、参考资料、常逛的站点都放在同一个集合里。

```sh
pnpm content link add https://astro.build --name Astro --name-en Astro \
  --description '这个站点的骨架。文档清楚，社区温和。' \
  --tag engineering
```

- URL 可以省略协议，默认补 `https://`；只接受合法的 http(s) 地址。
- `--name` 写中文名称，默认取域名；`--name-en` 写英文名称，可省略，缺少时按全站回退规则显示中文。
- 文件名默认从英文名推导，其次中文名，最后域名，也可以用 `--slug` 指定；文件名是 `<slug>.md`，`slug` 同时写入 frontmatter，作为链接的稳定标识且必须唯一；列表不分先后，展示顺序不代表推荐程度。
- `--description` 写中文介绍，`--description-en` 写英文介绍；都可以省略。
- `disabled` / `disabledReason`（禁用与理由）和 `icon` 一样不由 CLI 询问，需要时手动编辑 frontmatter。
- 链接已存在时命令报错，不会覆盖；文件名或该目录下任意 Markdown 的 frontmatter `slug` 冲突都会拒绝添加。删除链接直接删文件。
- 交互运行时，未提供的名称、介绍、标签会依次询问。

## Tag

标签数据源是 `src/content/tags.json`，CLI 负责修改 JSON 并重新生成 `src/lib/tags.generated.ts`：

```sh
pnpm content tag add seo --zh 搜索 --en SEO
pnpm content tag list
pnpm content tag remove seo
```

- `tag add`：id 只能使用小写英文字母、数字和连字符；id 重复或缺少中英文名称时报错。交互运行且未给 `--zh` / `--en` 时会依次询问。
- `tag list`：按 JSON 中的顺序列出 id、中文名和英文名。
- `tag remove`：删除标签前会扫描文章、链接、动态的 frontmatter；仍被引用时拒绝删除并列出文件，避免构建失败；标签至少需要保留一个，删除最后一个会直接报错。
- 直接手改 JSON 也可以，改完运行 `pnpm tags:generate`（或 `pnpm dev` / `pnpm build`）。

## 通用约定

- **编辑器**：读取 `$VISUAL`，其次 `$EDITOR`，支持带参数的值（例如 `EDITOR="code --wait"`）。
- **非交互环境**：没有 TTY 时不会打开编辑器，也不会提问；此时请用参数提供必需字段，或通过管道给 Moment 提供正文。
- **生成的文件**：全部是可读的 Markdown，可以直接用编辑器修改；CLI 不维护额外状态，删除文件即下线。
- **标签校验**：所有 `--tag` 都必须在 `src/content/tags.json` 中定义，否则命令失败并列出可用标签。
- **时间**：Moment 文件名使用运行 CLI 的机器的本地时间与时区偏移；同一个秒内连续发布时会自动顺延，保证文件名唯一。

## 相关文档

- 内容结构、frontmatter、语言与发布规则：[content-authoring.md](content-authoring.md)
- 标签数据源：`src/content/tags.json`；生成文件：`src/lib/tags.generated.ts`
