---
title: '用 View Transitions 做共享标题'
description: '从列表到详情页时，让标题在位置和字号之间平滑过渡，而不是整页硬切。'
pubDate: '2026-10-22'
tags:
  - astro
  - design
heroImage: '../../assets/blog-placeholder-2.jpg'
---

页面切换动画很容易变成“为了动而动”。共享标题至少解决了一个具体问题：用户点击列表项之后，能明确知道哪一篇文章被打开了。

## 共享元素的本质

View Transitions 并不真的让同一个 DOM 元素移动，而是对旧状态和新状态各拍一张快照，再在两张快照之间插值。要让标题连起来，两个页面上的标题必须声明同一个 `view-transition-name`。

```ts
// 列表和详情页使用同一个名字
const titleTransitionName = (id: string) => `post-title-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
```

## 名字必须唯一

同一页面上不能有两个元素使用同一个名字，否则过渡会失效。文章 id 是天然唯一键，所以直接用 id 生成名字最稳妥。

## 不要过度使用

如果页面上每个元素都参与过渡，页面会变得嘈杂。我的做法是只给标题设置名字，其他内容交给默认的淡入淡出。动画的目标是解释变化，而不是表现技术。
