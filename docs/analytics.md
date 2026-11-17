# 站点分析（Google Tag Manager + GA4）

站点加载 Google Tag Manager 容器 `GTM-KZNSRQVJ`，对应 GA4 数据流 `G-F916494XVL`。容器 ID 维护在 `src/lib/analytics.ts` 的 `GTM_IDS`（数组，支持多个容器共用默认 `dataLayer`）。

## 代码位置

| 文件                                         | 作用                                                            |
| :------------------------------------------- | :-------------------------------------------------------------- |
| `src/components/site/GoogleTagManager.astro` | GTM 加载器（官方片段），每个容器渲染一份，`async` 注入 `gtm.js` |
| `src/layouts/BaseLayout.astro`               | `<head>` 中的加载器、`<body>` 开头的 `<noscript>` 兜底          |
| `src/lib/analytics.ts`                       | 向 `dataLayer` 推送 `page_view`，`BaseLayout` 的脚本中启动      |

只在生产构建中启用（`import.meta.env.PROD`），`astro dev` 不上报，避免污染数据。

## 页面浏览

站点使用 `<ClientRouter />`，站内跳转不重新加载文档，GA4 内置的自动页面浏览无法覆盖这些跳转（实测 `pushState` 跳转不会产生 page_view）。因此页面浏览统一由代码推送：

```js
window.dataLayer.push({ event: 'page_view', page_title, page_location, page_path })
```

首次加载和每次站内跳转各推一次，同一 URL 不重复推送。GTM 侧需要配合：

1. 在 `GTM-KZNSRQVJ` 中新建 GA4 事件代码：Measurement ID 填 `G-F916494XVL`，事件名称 `page_view`，触发器为自定义事件 `page_view`。多个容器共用 `dataLayer`，只在其中一个容器配置，重复配置会重复上报。
2. 关闭自动页面浏览，让所有 page_view 都来自这个事件代码：
   - GTM 的 Google 代码（`G-F916494XVL`）→「配置设置」→ 添加参数 `send_page_view` = `false`。Google 代码没有对应的复选框，只能加配置参数；不加的话它加载时会自己发一次 page_view，首屏就算两次。
   - Google 代码本身必须保持启用：GA4 事件代码要靠它初始化目标（`gtag/destination`），只留事件代码时不会创建目标，一条命中都发不出去。
   - GA4 后台 → 数据流 → 增强测量 → 关闭「页面浏览」及其中的「基于浏览器历史记录事件的页面更改」，避免增强测量再发一份。

## 国内网络

`googletagmanager.com` 在部分网络下不可访问。每个加载器只创建 `async` 脚本，页面浏览数据只写入本地 `dataLayer` 数组，因此脚本被拦截或超时不会阻塞渲染、也不会影响页面功能，只是没有数据上报。
