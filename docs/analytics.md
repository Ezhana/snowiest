# 站点分析（Google Tag Manager + GA4）

站点同时加载两个 Google Tag Manager 容器：`GTM-KZNSRQVJ`（GA4 数据流 `G-F916494XVL`）和 `GTM-WCT24CJ4`。容器 ID 维护在 `src/lib/analytics.ts` 的 `GTM_IDS`，两个容器共用默认 `dataLayer`。

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

1. 在 `GTM-KZNSRQVJ` 中新建 GA4 事件代码：Measurement ID 填 `G-F916494XVL`，事件名称 `page_view`，触发器为自定义事件 `page_view`。只在其中一个容器配置，两个容器都配置会重复上报。
2. 在 GA4 后台关闭自动页面浏览（数据流 → 增强测量 → 页面浏览）。它会为首屏和浏览器前进/后退各发一次 page_view，与上面的推送重复；关闭后所有 page_view 都来自这个事件代码。

## 国内网络

`googletagmanager.com` 在部分网络下不可访问。每个加载器只创建 `async` 脚本，页面浏览数据只写入本地 `dataLayer` 数组，因此脚本被拦截或超时不会阻塞渲染、也不会影响页面功能，只是没有数据上报。
