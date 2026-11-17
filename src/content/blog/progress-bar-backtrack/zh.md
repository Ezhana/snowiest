---
title: '进度条为什么先满格再倒退'
description: '一次进度条闪烁的排查：残留定时器、动画归零，以及被 swap 取消的 CSS 过渡。'
pubDate: '2026-11-17'
tags:
  - engineering
  - design
lang: zh
---

顶部那条 3px 的进度条是我自己写的，逻辑很短：`astro:before-preparation` 时出现并涨到 65%，`astro:page-load` 时画满、淡出、归零。某天发现切到「动态」和「关于」时它会**先冲满、再明显退回一截、然后消失**，而首页和博客看起来正常。Safari 里稳定复现。

顺着这条现象查下去，其实是三个叠在一起的 bug，最后一个跟进度条代码的关系最远。

## 先证明不是“导航了两次”

第一反应是 ClientRouter 触发了两次导航，条子跑了两遍。于是先记录事实：在页面上挂事件日志，用 `requestAnimationFrame` 采样进度条的真实计算样式，只在值变化时打印。

```js
let last = ''
const tick = () => {
  const bar = document.querySelector('[data-page-progress-bar]')
  const root = document.querySelector('[data-page-progress]')
  const s = `${getComputedStyle(bar).transform} / ${getComputedStyle(root).opacity}`
  if (s !== last) ((last = s), console.log(performance.now().toFixed(0), s))
  requestAnimationFrame(tick)
}
tick()
```

结果：每次点击只有一个 `astro:before-preparation`、一个 `astro:after-swap`、一个 `astro:page-load`，DOM 里自始至终只有一个 `[data-page-progress]`。所以不是两次导航，是同一个条子的动画出了问题。

这一步很值：它把“加锁防重复”这类错误方向直接排掉了。

## 第一个：一个没人取消的定时器

`start()` 会排一个 180ms 的定时器把填充从 15% 推到 65%；`finish()` 画满 100% 并安排淡出，但没有取消那个定时器：

```ts
const start = () => {
  paint(0.15)
  schedule(() => paint(0.65), 180) // 谁负责取消？
}

const finish = () => {
  paint(1) // 条子冲满
  // ……但 180ms 后 paint(0.65) 还是会执行
}
```

本地导航几十毫秒就完成，`finish()` 跑在定时器之前，于是条子刚满格就被打回 65%。修改很简单：`finish()` 先 `clearTimers()` 再画满，一个 run 拥有它排过的所有定时器。

顺手把淡出的起始延迟从 200ms 改成 300ms——条子的 `transform` 过渡本身就是 300ms，延迟短于过渡意味着它**从来没被画满过**就淡出了。

## 第二个：收尾本身也是一段动画

原来的收尾是“淡出后归零”，归零走的是 `transform` 的 300ms 过渡：

```ts
paint(1)
schedule(() => {
  setOpacity('0')
  schedule(() => paint(0), 300) // 这里会从 1 动画回 0
}, 200)
```

只要淡出慢一帧、或者干脆没跑，这条 `1 → 0` 的回退就露在明处，看起来就是“满格后往回缩”。

改法是不再用固定延迟猜淡出结束，而是等根节点的 `transitionend`（过滤掉子元素冒泡上来的 transform），并留一个超时兜底；归零时临时 `transition: none`，**瞬时**落回 0：

```ts
const withoutTransitions = (apply: () => void) => {
  const epoch = ++transitionEpoch
  root.style.transition = 'none'
  bar.style.transition = 'none'
  apply()
  requestAnimationFrame(() => {
    if (epoch !== transitionEpoch) return
    root.style.transition = ''
    bar.style.transition = ''
  })
}
```

`epoch` 是给两次抑制挨得很近的情况兜底的：旧的 rAF 不能提前把过渡恢复回来。

## 第三个，也是最顽固的：swap 会取消正在跑的过渡

修完前两个，条子能完整画满了，但 Safari 里还剩一下“闪”：出现在**点击后、页面还没切过去**的那几十毫秒里。

一开始我以为是浏览器差异，直到看到一份 Safari 的帧采样日志：

```text
50185 – "matrix(0.027638, …) / 0.006613"
50201 – "matrix(0.047868, …) / 0.029903"
50226 – "matrix(0.072462, …) / 0.117713"
50263 – "matrix(0.15, …) / 1"        ← 啪
```

条子正在淡入（不透明度 12%、宽度 7%），然后在 `start()` 之后约 50ms **直接跳到** `0.15` 和 `opacity: 1`。

这个时间点正好是 ClientRouter 把 `transition:persist` 的进度条从旧文档搬到新文档。节点被摘下、再挂到新文档上，浏览器会**取消所有还在飞的 CSS 过渡**，属性直接落到目标值。也就是说：起点那 300ms 的淡入根本跨不过这次搬迁，它注定会被切成一个突兀的亮相。

用 Playwright 的 WebKit 复刻，帧序和那份 Safari 日志几乎一模一样，确认这不是 Safari 独有，只是它的时间点更稳定。

结论是：**起点必须用落定值画，不能依赖一段还在跑着的过渡**。`start()` 里也用 `withoutTransitions`：临时关掉过渡，直接写 `opacity: 1` 和 `scaleX(0.15)`，下一帧再交还给 CSS。

```ts
const start = () => {
  stopFade()
  withoutTransitions(() => {
    setOpacity('1')
    if (running) return // 被中断的导航接着当前的进度，不回跳
    running = true
    clearTimers()
    paint(reduceMotion ? 0.6 : 0.15)
  })
  if (!reduceMotion) schedule(() => paint(0.65), 180)
}
```

代价是条子不再淡入，而是直接出现在 15%。对 3px 的进度条来说这反而是标准做法（nprogress 就是这样），反正淡入活不过那次节点搬迁。

## 现在的行为

点击 → 15% 立刻出现 → 180ms 后到 65% → 页面加载完 → 100% → 300ms 后淡出 → 淡出结束瞬时归零。开启「减弱动态效果」时全程没有动画：直接出现、直接满格、停一小会儿、直接消失。

## 验证

动效问题看截图不可靠，最后一律用逐帧采样加判定条件：

- `partialAppear`：有没有出现 `0.005 < x < 0.145` 且不透明度 > 0.02 的帧——有就说明起点又被切了；
- `retreat`：宽度在到达峰值之后下降超过 0.08 且此时不透明度仍 > 0.05——有就说明归零可见；
- `peak`：是否真的到过 1；
- 条子元素数量是否始终为 1。

在 dev 和构建产物上各跑一遍「首页 + 连续五次切页签」，再单独跑一遍减弱动态效果：全部 `peak=1.000`、`partialAppear=no`、`retreat=no`、`roots=1`，无 console 报错。

## 留下的东西

- **跨 DOM 搬迁的过渡不可靠。** 被 `transition:persist` 保留的元素会在导航中被搬走，任何还在飞的过渡都会被取消、落到目标值。起点、终点这类“必须准确”的状态，用落定值画。
- **一个 run 拥有它排的所有定时器。** 进度条这种“开始—进行—结束”的状态机，最容易死在上一轮的定时器上。
- **判断动效要看帧，不要看截图。** 截图只采样一个瞬间，而且不一定包含视图过渡的合成结果；`getComputedStyle` 的逐帧采样能看到“跳变点”，正好指向真正的触发时机。
- **同一个引擎能省很多猜。** 用 Playwright 的 WebKit 复刻 Safari 的帧序，比对着代码猜快得多；反过来，Chrome 里“看起来正常”不能证明代码没问题，只能说明时序没撞上。
