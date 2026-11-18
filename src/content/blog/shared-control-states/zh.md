---
title: '交互态只写一遍'
description: '同一个 hover、按下和选中态在四个组件里各写一遍，最后一定会长出四种样子。这次把它们收进一套控件样式，并让 ARIA 成为选中态的唯一来源。'
pubDate: '2026-11-18T09:45:00+08:00'
tags:
  - engineering
  - design
draft: false
lang: zh
---

站内的可点击控件本来就不多：顶部导航、标签筛选、排序切换、分页，再加上菜单、复制、目录和回到顶部。数量不多，状态却各写各的，最后长出了四种“当前项”。

## 症状：四种当前项

同样是“我现在在这里”，四个组件的写法是：

- HeaderLink：中性淡底 + 更重的 fg-strong 文字；
- tag pill：accent 淡底 + accent 文字 + 更重的字重；
- OrderFilter：accent 淡底 + accent 文字 + 更重的字重，但圆角是另一套；
- BlogPagination：accent 淡底 + accent 文字 + 更重的字重。

hover 也重复：`hover:bg-bg-subtle`、`hover:text-fg-strong` 在十几个地方各写一遍。按下态更随意，HeaderLink 用 `active:font-semibold`，其他控件用 `active:text-accent`。

比视觉更麻烦的是状态来源有两套。服务端渲染的 `aria-current` 负责一部分当前项，客户端脚本又用 `data-state-active` / `data-state-inactive` 换类负责另一部分。同一个“当前”，一半是语义，一半是字符串。

## 让 ARIA 成为唯一的状态

先统一状态来源：脚本只维护 `aria-current`，不再碰 class。

```ts
function setCurrentLink(link, active) {
  if (active) link.setAttribute('aria-current', 'page')
  else link.removeAttribute('aria-current')
}
```

样式跟着语义走：

```css
.control[aria-current='page'],
.control[aria-current='true'],
.control[aria-pressed='true'] {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}
```

`data-state-active` / `data-state-inactive` 和那套换类函数一起删掉了。脚本在 `?order=oldest`、`?page=2` 和客户端跳转时只改属性，样式自己会跟上。服务端和客户端也不再各说各话。

## 一套控件，三种角色

新增一个 `interaction.css`，只负责交互态，不负责尺寸和形状：

| 状态    | 表现                                |
| :------ | :---------------------------------- |
| normal  | `fg-muted`                          |
| hover   | `bg-subtle` + `fg-strong`           |
| pressed | `accent` 文字                       |
| current | `accent-subtle` 底 + `accent` 文字  |
| focus   | 全局 `:focus-visible` 的 2px 焦点环 |

角色只有三个：

- `.control`：普通控件，导航、分页、菜单项、图标按钮都用它；
- `.chip`：带描边的选项，目前是标签筛选；
- `.control-raised`：带 surface 和 shadow 的浮动按钮，目录和回到顶部各一个。

形状仍然归组件决定。tag pill 用 `rounded-pill`，菜单行用 `rounded-small`，排序控件内嵌在带边框的壳里，所以单独用 8px 圆角。统一的是状态反馈，不是把所有东西压成同一个样子。

## 两个容易忽略的细节

第一，hover 只在真的能 hover 的设备上生效：

```css
@media (hover: hover) {
  .control:hover {
    background-color: var(--color-bg-subtle);
    color: var(--color-fg-strong);
  }
}
```

触屏设备没有“悬停”，只保留按下反馈，也避免了点完之后 hover 背景粘在屏幕上。

第二，状态变化不能动布局。原来当前项会加粗，HeaderLink 在切换页面时字宽会变，整排导航跟着抖一下。现在 normal 和 current 都是 56px 宽，只靠底色和文字颜色区分。主题文档也明确要求交互过渡只动颜色和背景，不动布局。

焦点态本来就是全局的：`global.css` 里一条 `:focus-visible` 给所有控件 2px 焦点环、2px offset。这次没有在组件里重复声明，只把它写进状态文档。焦点是最容易被复制到每个组件里的东西，也是最适合只写一次的东西。

## 顺手收掉的

除了四个主角，这次也把同类控件接了进来：Header 的语言和主题菜单、Drawer 的关闭按钮、复制按钮、目录触发器、回到顶部，以及两个“加载更多”。

没有动的是正文链接、目录文字链接和卡片。它们不是控件：文字链接不需要一整块 hover 背景，卡片也不该有“按下”的感觉。统一不等于全都一样，交互层级仍然要跟着元素在页面里的角色走。

## 验证

用无头浏览器读了一遍计算样式，而不是只看截图：

- HeaderLink 的 normal、hover、current、current:hover 四种颜色都落在预期 token 上，宽度始终是 56px；
- tag pill 的选中项边框从 `border` 切到 `accent-border`，focus 时拿到 2px solid accent、offset 2px 的焦点环；
- `?page=2&order=oldest` 下 `aria-current` 正确落在 oldest 和 page 2，点击 page 3 做客户端跳转后仍然保持 order；
- 页面里 `[data-state-active]` 和 `[data-state-inactive]` 的数量是 0；
- 浅色、深色以及移动端 header 都截了一遍。

`pnpm build` 和 `pnpm lint` 都通过。

## 最后

这次改动的净行数其实是增加的：新增的状态文件比删掉的重复还长一点。收益不在行数，而在下次调整交互态时只需要改一个地方。

记下三件事：

1. 能用 ARIA 表达的状态，就不要再造一个 class 状态。
2. 状态变化只动颜色，不动布局；hover 只给能 hover 的设备。
3. 焦点环只写一次。统一的是机制，不必统一所有外观。
