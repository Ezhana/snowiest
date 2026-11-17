---
title: '让每条 page_view 只发一次'
description: '给站点接上 GTM、GA4 和 Search Console：单页跳转要自己上报，首屏却多算了一次，验证的时候还得先保证不污染数据。'
pubDate: '2026-09-15'
tags:
  - engineering
lang: zh
---

这个站点一直没有任何统计。倒不是反对，只是没到需要看数据的时候；等到想看看哪些文章真的有人在读，才发现连「有没有人打开过」都不知道。

于是把 Google Tag Manager、GA4 和 Search Console 一起接上。看起来是贴两段脚本的事，实际大部分时间花在同一个问题上：为什么一次页面浏览会上报两次。

## 先让统计脚本别挡路

用 GTM 后台给的官方片段，而不是 `src` 直连 `gtm.js` 的简化写法。官方片段只创建一个 `async` 脚本，会先把 `gtm.start` 和 `gtm.js` 推给 `dataLayer` 再去加载容器；直连版本省掉的正是这一步，容器的启动时机也跟着不对了。

片段用 `is:inline` 放在 `<head>`，容器排在打包后的脚本之前启动。ClientRouter 换 head 时，内容相同的内联脚本不会二次执行，所以整站只有一个容器。

剩下的事交给浏览器：`async` 不阻塞解析，统计只往本地 `dataLayer` 数组里写。`googletagmanager.com` 被拦或超时，页面照常渲染，只是没有数据。国内网络下这个差别很实际。

统计只在生产构建里输出（`import.meta.env.PROD`），`astro dev` 的访问不会进容器；`<noscript>` 的 iframe 也一起带上，给不开 JS 的读者。

## 单页应用里，page_view 得自己发

站点用了 `<ClientRouter />`，站内跳转不重新加载文档。GA4 自带的页面浏览吃的是浏览器历史记录，实测在这套跳转里并没有稳定触发——`pushState` 之后没有产生 page_view，后退偶尔有，但不可靠。

所以自己推：

```js
window.dataLayer.push({
  event: 'page_view',
  page_title: document.title,
  page_location: window.location.href,
  page_path: window.location.pathname + window.location.search,
})
```

时机选 `astro:page-load`：新页面的 `title` 已经换好，路由也走完了。初始加载也会触发同一次事件，所以用一个 URL 变量去重——同一个 URL 不重复推，等号只在前进或后退到别的页面时才成立。

GTM 里配一条 GA4 事件代码，事件名 `page_view`，触发器选「自定义事件 `page_view`」。这样每次推事件才会真的产生一条命中。

## 一次浏览，两次命中

上线之后看验证结果：首屏 2 条，站内跳转 1 条。

一条是自己推的，另一条来自 Google 代码——它在加载时会把 `gtag('config', ...)` 跑一遍，而 `send_page_view` 默认是 `true`，所以自己先发了一次。

中间试过两条歪路。先是把那条 `page_view` 事件代码暂停：首屏降到 1 条，站内跳转也跟着没了。再是把 Google 代码整个删掉：一条都发不出去——GA4 事件代码要靠它初始化目标，单独留着事件代码没有意义。

正确的做法是在 **Google 代码的「配置设置」里加参数**：`send_page_view` = `false`。这里有两个容易走错的地方：

- Google 代码没有对应的复选框，只能加配置参数。我一开始把参数加到了 `page_view` 事件代码的「事件参数」里，那只是让每次事件多带一个没人读的字段，自动的 page_view 照发。
- 容器公开配置能看出区别：配置参数落在 destination 的 `vtp_configSettingsTable` 上，事件参数落在 `vtp_eventSettingsTable` 上。拉一次 `gtm.js` 就知道自己加对没有。

## 验证：别在正式数据上试错

统计调试最怕的是「验证本身在污染数据」。本站的每一条访问都会进真实的媒体资源，所以验证放在本地：`pnpm build` 之后起 preview，再用 headless Chrome 通过 CDP 连上去。

关键只有一条：**拦收集请求，不拦容器脚本**。让 `gtm.js` 真的加载、标签真的执行，只把 `google-analytics.com` 的请求挡在本地；然后从 `Network.requestWillBeSent` 里读请求的 URL 和 body，看四个字段——`en`、`dl`、`dt`，以及 `_s`。

`_s` 是页面浏览的序号，会随着每次上报递增。每个页面状态只对应一个 `_s`，就说明只发了一条；同一个页面出现两个不同的 `_s`，就是多算。

这里也踩过一个坑：最早用 `Fetch` 域拦截并返回 204（或直接 abort），gtag 会重试一次，看起来像重复上报。以 Network 层的请求数为准，别被拦截方式制造的假象骗了。

## robots.txt 与 Search Console

`public/` 里加了 `robots.txt`：全站 `Allow`，`Sitemap` 指向 `sitemap-index.xml`。

但这份文件对 Google 其实不生效：站点是 GitHub Pages 的项目站点，部署在 `/snowiest/` 下，而爬虫只读域名根的 `robots.txt`。现在根目录是 404，等于不限制，所以收录不受影响；这份文件的作用主要是给其他工具看，以及声明 sitemap 的位置。

Search Console 里用「网址前缀」添加 `https://ezhana.github.io/snowiest/`，再提交 sitemap。所有权验证用 HTML 标记：在 `<head>` 里放一个 meta 就够了，比容器片段的方式省事——尤其我们的 GTM 片段是拼出来的，页面源码里并没有一段标准的脚本可以给验证器去找。

## 留下的判断

- 统计的默认值通常偏向「多算」。接入时先把「一次浏览等于几条命中」弄清楚，再去看报表。
- 界面上的开关不可信，容器配置才是事实。要确认一项设置生效没有，拉一次 `gtm.js` 的公开配置，看参数落在哪个代码上。
- 多个 GTM 容器共用 `dataLayer`：同一个事件会被每个容器各处理一次，page_view 只能在一处配置。
- 排查统计要能拦住上报，否则每次验证都在破坏自己的数据。
- 统计脚本永远按非关键依赖处理，尤其是国内网络。

现在每条浏览只有一条 page_view，看报表时终于不用先心算除以二。
