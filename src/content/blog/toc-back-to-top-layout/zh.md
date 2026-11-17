---
title: '目录、回顶和两套坐标'
description: '右侧目录和回顶按钮原本各用一套坐标定位。把按钮放进 main，再用 Anchor Positioning 锚定正文列之后，布局才回到一个模型里。'
pubDate: '2026-10-16'
tags:
  - engineering
  - design
---

文章页右侧一直有两个东西：目录和回到顶部按钮。看起来它们属于同一个“右侧栏”，但原来的实现里，两者用的是两套坐标。目录挂在正文列的 `left-full` 上，按钮则在一个 `fixed` 容器里，用视口公式重新算正文列的位置。两边都能对齐，但每次调整都要同时改两个地方。

这次把它们收回同一个 `main`，并试着用 Anchor Positioning 替掉视口公式。过程比预想的曲折，记录一下。

## 最初的布局

正文在 `main` 里居中，`max-w-[72rem]`；内层再放一个 45rem 的阅读列：

```text
main (max 72rem, centered)
└─ .post-column (max 45rem, centered)
   └─ article
```

目录是一个绝对定位的 `aside`，贴在内层列的右侧：

```css
aside {
  position: absolute;
  left: 100%;
  margin-inline-start: 2rem;
  width: 13rem;
}
```

它以内层 45rem 列为坐标原点，`left: 100%` 就是正文右缘，`ms-8` 再留 32px。这个表达式很直接，目录的位置和正文列绑定在一起。

回顶按钮则不同。它在 `page-overlays` 插槽里、`main` 之外，`position: fixed`，右侧位置用视口坐标反推正文列：

```css
.post-actions {
  position: fixed;
  right: max(1rem, calc((100% - 45rem) / 2 - 4.5rem));
  bottom: 1rem;
}
```

`(100% - 45rem) / 2` 是正文列到视口右缘的距离，再减去 4.5rem，就是按钮右缘到视口右缘的距离。它和 `aside` 的 `left-full` 本质上在算同一件事，只是一个从正文列出发，一个从视口出发。

两个表达式在常见宽度下能得到想要的结果，但它们是两套坐标。改一处，另一处不会跟着动。

## 为什么要放进 main

把按钮放进 `main` 的理由不是“结构洁癖”，而是坐标。它和目录、正文在同一个容器里，右侧栏才可能真的作为一个整体来布局；否则始终要用视口公式去模拟这个容器。

于是结构变成：

```text
main
└─ .post-column (anchor-name: --post-column)
   ├─ .post-actions (fixed)
   ├─ article
   └─ aside (TOC)
```

`.post-column` 同时是正文列和右侧栏的锚点。`aside` 继续用 `left-full + ms-8`；`.post-actions` 仍然 `fixed`，但不再从视口反推，而是从 `.post-column` 这个锚点取位置。

## Anchor Positioning

给正文列一个锚点名：

```css
.post-column {
  anchor-name: --post-column;
}
```

按钮容器用同一个名字：

```css
@supports (position-anchor: --post-column) {
  .post-actions {
    position-anchor: --post-column;
    right: max(1rem, calc(anchor(right) - 4.5rem));
  }
}
```

这里踩了一个坑：在 `right` 这个 inset 里，`anchor(right)` 不是正文列的绝对 x，而是**锚点右缘到包含块右缘的距离**。我第一版写成了：

```css
/* 错的 */
right: calc(100% - anchor(right) - 4.5rem);
```

在 1280 宽下，正文列右缘是 1000，`anchor(right)` 是 280；第二项再减一次 100%，按钮直接跑到了正文列左边。正确的写法只需要在锚点距离上减掉 4.5rem：

```css
right: max(1rem, calc(anchor(right) - 4.5rem));
```

在 1280 宽下，`280 - 72 = 208`，按钮右缘落在 1072，左缘 1028；目录左缘是 1032，两者差 4px，基本就是同一左基线。

不支持 Anchor Positioning 的浏览器继续走原来的 `(100% - 45rem) / 2 - 4.5rem` 回退。`@supports` 只负责增强，不负责兜底。

## 动画留下的单位矩阵

按钮搬进 `main` 之后，先遇到的是动画问题。页面包装层原来用 `animate-fade-up`，它带 `animation-fill-mode: both`。动画结束后，Chrome 把 `transform` 计算成：

```text
matrix(1, 0, 0, 1, 0, 0)
```

单位矩阵也是 `transform`。它让包装层成为 `position: fixed` 的包含块，而且这个包含块是**永久**的，不是动画那 600ms 的临时状态。按钮会一直待在文档底部，而不是视口底部。

解决方式不是给按钮再加一层定位，而是让包装层的动画不要 fill：

```css
.page-enter {
  animation: fade-up 600ms cubic-bezier(0.2, 0, 0, 1);
}
```

最终关键帧和基础样式一致，所以不 fill 不会改变视觉；动画结束后 `transform` 回到 `none`，fixed 重新以视口为包含块。

剩下的问题是动画进行中的 600ms：`transform` 还在，fixed 仍然被包装层包含。桌面端按钮在页面顶部时是隐藏的，看不到；平板端目录按钮可能在动画期间短暂出现在页面底部。这部分先接受，后面可以用“动画结束后再显示”或者把整个右侧栏改成 sticky rail 来彻底解决。

## 现在的结构

```text
main
└─ .post-column (anchor-name: --post-column)
   ├─ .post-actions (fixed)
   ├─ article
   └─ aside (TOC)
```

- 目录在正文右缘外 32px，`sticky top-24`，最大高度 80dvh，超出时列表内部滚动。
- 回顶按钮在同一个右栏的底部，右缘距正文右缘 4.5rem，左缘距正文右缘 28px；与目录左缘差 4px。
- 两者纵向两端对齐：目录在上、按钮在下，短目录中间留空。
- 768–839px 之间，正文列离视口太近，按钮会用 `max(1rem, ...)` 的 16px 下限，仍然会压到正文右下角；840px 之后开始有间隙，896px 起是完整的 28px 左边距。这是几何限制，不是布局写法能绕开的。

## 取舍

Anchor Positioning 解决的是水平位置，它不能解决 fixed 在 transform 里的包含块问题。后者要靠动画的 fill、sticky rail，或者把 fixed 元素放到变换层之外。

这次保留了 fixed，也保留了 600ms 的短暂错位。原因很简单：桌面端真正可见的回顶按钮在滚动到阈值后才出现，动画早就结束了；平板端的目录按钮会闪一下，但还不值得为它再引入一套 sticky 结构。

如果以后要彻底去掉 fixed，可以把 `.post-actions` 和目录一起放进一个 sticky rail：rail 本身在文档流外，内部 `justify-between`，目录在上、按钮在下。那样连 Anchor Positioning 都可以省掉，但平板和手机还需要另一套入口，结构会比现在大。

## 小结

布局的模型很小：三个区域，正文居中，目录和回顶作为右侧整体，脱离文档流，上下两端对齐。复杂的不是这个模型，而是它落到 DOM 和 CSS 时出现的两套坐标，以及一个由动画 `transform` 造成的 fixed 包含块。

Anchor Positioning 把水平位置收回到了正文列这个锚点上，视口公式只作为回退。剩下的问题都集中在一处：动画期间的包含块，以及窄屏没有足够空间时按钮该压住正文还是离开视口。这两个都是取舍，不是 bug。
