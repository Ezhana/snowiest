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

| 命令                | 作用                 |
| :------------------ | :------------------- |
| `pnpm lint`         | 运行 ESLint          |
| `pnpm format`       | 使用 Prettier 格式化 |
| `pnpm format:check` | 检查格式             |

## 项目结构

```text
├── .github/workflows/deploy.yml  # GitHub Pages 部署流水线
├── public/                       # 静态资源
├── src/
│   ├── assets/                   # 参与构建优化的图片
│   ├── components/               # 页头、页脚、文章列表等组件
│   ├── content/blog/             # Markdown / MDX 文章
│   ├── lib/                      # 文章查询、标签与分页逻辑
│   ├── i18n/                     # 中英文案与路由
│   ├── layouts/                  # 页面与文章布局
│   ├── pages/                    # 路由（中文根路径 + /en 英文路由）
│   ├── styles/                   # 全局样式与文章排版
│   └── consts.ts                 # 站点信息（名称、作者、链接）
├── docs/                         # 写作与内容管理文档
├── astro.config.mjs              # site / base 与集成配置
└── package.json
```

文章新建、frontmatter、标签、草稿和发布规则见 [docs/content-authoring.md](docs/content-authoring.md)。

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
