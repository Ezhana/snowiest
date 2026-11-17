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

## 第四个：页面自己在闪，而进度条已经无关了

条子的行为终于对了，但真机上又冒出一个问题：切到「动态」「关于」时，**整页会白一下**，首页和博客没有。也就是说，问题已经不在进度条里了。

这时能用的线索只剩“哪些页面不一样”。把四个页面的 DOM 骨架、脚本、样式表拉出来比对，完全一致：同一个 `BaseLayout`，同一份 CSS，页头页脚都在，唯一的差别是内容量和页面脚本。这不像是一个“页面类型”的问题。

换个办法测：同样的 iPhone 视口、同样在 WebKit 里录屏，逐帧算整屏的平均亮度。如果只是页面切换，亮度应该单调地从旧页面过渡到新页面；如果中间出现了比首尾都亮的帧，那就是白屏。

```text
导航到博客（修复前）: 235.0 → 236.3 → 239.8 → 237.3 → 235.6 → 232.4
                                    ↑ 比首尾都亮，白了一帧
```

再看那一帧的截图，除了页头，正文全是白的。原因很朴素：**`<ClientRouter />` 的视图过渡在新文档 swap 完成后立刻给新页面拍快照，而 `.page-enter` 的入场动画是从 `opacity: 0` 开始的**——快照拍到的是一条空白页。于是 cross-fade 实际是“旧页面淡出 → 空白 → 内容淡入”，比没有过渡还糟。

那为什么只有动态/关于会露出来？把视图过渡的生命周期打点，结论很意外：

```text
目标 = 首页 / 博客:  ready 后约 20–40ms  vt.finished 就 resolve 了（过渡被提前结束）
目标 = 动态 / 关于:  ready 后约 250–300ms 才 resolve（完整跑完 cross-fade）
```

目标页是首页或博客时，浏览器很快就结束了这次过渡，空白阶段被跳过；目标页是动态或关于时，cross-fade 完整播放，空白帧就露出来了。首页和博客上那 17 个带 `view-transition-name` 的标题很可能是浏览器提前收敛过渡的原因，这一点还没查实，但它不影响结论：**只要快照里不是空白，两条路径都不会闪**。

第一版修法是「client 导航干脆不放入场动画，交给视图过渡」。这确实不闪了，但入场动画也没了——而在快照里消失的不只它：**进度条也在快照里**。条子是在 `before-swap` 之后、快照之前还在长的，浏览器把那一刻的宽度冻进新页面快照，过渡期间显示的是它，过渡结束才换回实时层，于是又出现一次“回退”。

所以真正的规则是两条：

1. **快照里必须是「最终画面」。** 入场动画如果从 `opacity: 0` 开始，快照就是空白页；条子如果还在长，快照就是半截。
2. **能让视图过渡承担的部分，就不要再叠一层。** 淡入交给 cross-fade，页面只负责位移。

落地是：

```ts
/** 标记这是 client 导航，CSS 据此换一套入场。 */
export function setupClientNavigation(): void {
  const mark = () => {
    document.documentElement.dataset.clientNav = ''
  }
  document.addEventListener('astro:before-preparation', mark)
  // 关键：after-swap 在视图过渡的 update 回调里、快照之前执行。
  document.addEventListener('astro:after-swap', mark)
}
```

```css
/* 只位移、不改透明度：快照里有内容，淡入由 cross-fade 完成。层外是因为 utility 层在 components 之后。 */
html[data-client-nav] .page-enter {
  animation: rise 600ms cubic-bezier(0.2, 0, 0, 1);
}

html[data-client-nav] [data-site-header] .animate-fade-in {
  animation: none;
}

@keyframes rise {
  from {
    transform: translateY(14px);
  }
  to {
    transform: none;
  }
}
```

```ts
/** 填充到峰值并等它落地：loader 在 swap 之前被 await，这是最后一段唯一能被看到的地方。 */
const fillToPeak = (signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    // ……把 transform 过渡调快到 140ms，paint(0.65)，
    //    等 transitionend（带超时兜底和 abort）落定后 resolve
  })

/** 包一层 loader：页面就绪后先让条子走完，再放行 swap。 */
document.addEventListener('astro:before-preparation', (raw) => {
  const event = raw as Event & { loader: () => Promise<void>; signal: AbortSignal }
  const load = event.loader
  event.loader = async () => {
    await load()
    await fillToPeak(event.signal)
  }
})

/** 新页面快照之前把条子收掉：半透明的条子被拍进快照，换回实时层时会再冒一次。 */
document.addEventListener('astro:before-swap', clearBeforeSwap)
```

首屏仍然走完整的 `fade-up`（新文档不会被快照）；client 导航则是「旧页面淡出 + 新页面升起」的 cross-fade。条子填到 65% 就停，然后随旧页面一起淡出——100% 只出现在首屏，那里没有快照可以骗，也没必要骗。

这段等待卡在 loader 里，所以**被延后的是整次跳转**（本地约 140ms），不是条子自己。它是纯为条子付的钱：没有条子就完全不会有这段延迟。慢网络下反而不亏——HTML 本来就要等那么久，条子早就到 65% 了。

## 现在的行为

首屏：点击/加载 → 15% 立刻出现 → 180ms 后到 65% → 加载完 → 100% → 300ms 后淡出 → 淡出结束瞬时归零。

站内跳转：15% 立刻出现 → 180ms 后到 65%（慢加载时）→ 页面就绪后由 loader 等条子平滑填到 65%（快加载时约 140ms）→ swap → 随旧页面一起淡出。峰值 65%，宽度全程只增不减。开启「减弱动态效果」时全程没有动画：直接出现、直接到峰值、直接消失。

## 验证

动效问题看截图不可靠，最后一律用逐帧采样加判定条件：

- `partialAppear`：有没有出现 `0.005 < x < 0.145` 且不透明度 > 0.02 的帧——有就说明起点又被切了；
- `retreat`：宽度在到达峰值之后下降超过 0.08 且此时不透明度仍 > 0.05——有就说明归零可见；
- `peak`：是否真的到过 1；
- 条子元素数量是否始终为 1。

在 dev 和构建产物上各跑一遍「首页 + 连续五次切页签」，再单独跑一遍减弱动态效果：全部 `peak=1.000`、`partialAppear=no`、`retreat=no`、`roots=1`，无 console 报错。

页面闪烁则不靠肉眼：录屏 → 逐帧算整屏平均亮度，检查有没有“比导航前后都亮”的帧。修复后四次导航的亮度曲线都是单调的，例如切到动态 `238.3 → 243.5 → 245.3`、切到关于 `245.2 → 234.1 → 234.7`，不再出现中途的白峰。

## 留下的东西

- **想让用户看见，就得在 swap 之前做完。** 视图过渡期间只有快照。要平滑就得让 loader 先等一等，而这段等待的代价落在整次跳转上——这是这个方案唯一诚实的做法。
- **视图过渡的快照就是最终画面。** 任何在快照时还在动画中的东西都会被冻住：从 `opacity: 0` 开始的入场动画会让快照变成空白页，还在长的进度条会被冻在半截，过渡结束换回实时层时就会“跳一下”。入场动画只保留视图过渡能承担的部分（位移），条子在 swap 前画满。
- **跨 DOM 搬迁的过渡不可靠。** 被 `transition:persist` 保留的元素会在导航中被搬走，任何还在飞的过渡都会被取消、落到目标值。起点、终点这类“必须准确”的状态，用落定值画。
- **一个 run 拥有它排的所有定时器。** 进度条这种“开始—进行—结束”的状态机，最容易死在上一轮的定时器上。
- **判断动效要看帧，不要看截图。** 截图只采样一个瞬间，而且不一定包含视图过渡的合成结果；`getComputedStyle` 的逐帧采样能看到“跳变点”，正好指向真正的触发时机；整屏平均亮度能一眼看出“白了一下”。
- **层叠顺序也会咬人。** `@layer components` 里的覆盖打不过 utility 层，哪怕选择器更具体；要把覆盖写在层外。
- **同一个引擎能省很多猜。** 用 Playwright 的 WebKit 复刻 Safari 的帧序，比对着代码猜快得多；反过来，Chrome 里“看起来正常”不能证明代码没问题，只能说明时序没撞上。
