# Snowiest · 簌雪

[Ezhana](https://github.com/Ezhana) 的个人站点，使用 [Astro](https://astro.build/) 构建。

- 线上站点：<https://ezhana.github.io/snowiest/>
- 源码仓库：<https://github.com/Ezhana/snowiest>
- 托管：GitHub Pages（`main` 分支推送后由 GitHub Actions 自动构建并部署）

## 本地开发

```sh
pnpm install
pnpm dev        # 启动开发服务器，默认 http://localhost:4321
pnpm build      # 构建到 ./dist
pnpm preview    # 预览构建结果
```

其他命令：

| 命令                 | 作用                                    |
| :------------------- | :-------------------------------------- |
| `pnpm content`       | 创建内容、维护标签，见下文              |
| `pnpm tags:generate` | 从 `src/content/tags.json` 生成标签类型 |
| `pnpm lint`          | 运行 ESLint                             |
| `pnpm format`        | 使用 Prettier 格式化                    |
| `pnpm format:check`  | 检查格式                                |

## 项目结构

```text
├── .github/workflows/deploy.yml  # GitHub Pages 部署流水线
├── public/                       # 静态资源
├── scripts/content.mjs           # content CLI（moment / blog / link）
├── src/
│   ├── assets/                   # 参与构建优化的图片
│   ├── components/               # 按 feature 分目录：site/ blog/ moments/ timeline/ tag/ links/
│   ├── content/blog/             # 文章
│   ├── content/links/            # 链接（友链、工具、常逛的站点等）
│   ├── content/moments/          # 动态
│   ├── content/tags.json         # 标签唯一数据源（生成 src/lib/tags.generated.ts）
│   ├── lib/                      # 内容查询、标签数据与跨 feature 客户端工具
│   ├── i18n/                     # 中英文案与路由
│   ├── layouts/                  # 页面与文章布局
│   ├── pages/                    # 路由（中文根路径 + /en 英文路由）
│   ├── styles/                   # 全局样式与文章排版
│   └── consts.ts                 # 站点信息（名称、作者、链接）
├── docs/                         # 写作、内容管理与 CLI 文档
├── astro.config.mjs              # site / base 与集成配置
└── package.json
```

内容新建、frontmatter、标签、草稿和发布规则见 [docs/content-authoring.md](docs/content-authoring.md)，`pnpm content` 的命令与约定见 [docs/content-cli.md](docs/content-cli.md)。

快速开始：

```sh
pnpm content moment add 今天把 content CLI 写完了 --tag engineering
pnpm content blog new
pnpm content blog publish <slug>
pnpm content link add https://astro.build --name Astro --tag engineering
pnpm content tag add seo --zh 搜索 --en SEO
```

## 部署

站点部署在 GitHub Pages 的项目子路径 `/snowiest/` 下，因此 `astro.config.mjs` 同时配置了：

```js
site: 'https://ezhana.github.io',
base: '/snowiest',
```

站内绝对路径统一通过 `withBase()`（`src/consts.ts`）拼接，保证资源与链接带上 `/snowiest` 前缀。

推送到 `main` 分支，或在 GitHub Actions 页面手动触发 **Deploy to GitHub Pages** 工作流即可发布。

## 许可

© Ezhana. All rights reserved.
