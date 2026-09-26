# Lumen

两件可独立运行的浏览器小工具，零构建、零依赖，直接打开 HTML 就能用。

| 工具 | 入口 | 说明 |
|------|------|------|
| **Lumen · SVG 渲染工作台** | `index.html` | 单文件 SVG 在线编辑与预览（Catppuccin 主题、图层面板、CSS 变量解析） |
| **Lumen Player · 音乐播放器** | `music.html` | 本地优先的网页音乐播放器（播放列表、LRC 歌词、均衡器、可视化、全屏模式） |

> **Lumen** —— 拉丁语“光”。

---

# 🎧 Lumen Player（`music.html`）

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🎵 **纯本地播放** | 拖入或选择本地音频，文件不离开浏览器；曲目与歌词存于 IndexedDB |
| 🎨 **封面取色** | 自动提取专辑封面色，作为整页环境光与画布颜色 |
| 📝 **LRC 歌词** | 标准 `[mm:ss.xx]` 与增强 `<mm:ss.xx>` 字词级标签，可编辑 / 导入 / 删除 |
| 🎚️ **五段均衡器** | 60 / 230 / 910 / 3.6k / 14k，内置 7 组预设 |
| 🌀 **三种可视化** | 条形、波形、圆形，随播放实时绘制 |
| 🖥️ **全屏可视化** | 大封面 + 歌词 + 背景模糊，支持 `F` 键与 `Esc` 退出 |
| ❤️ **收藏与筛选** | 收藏曲目、只看收藏、按名称 / 时长 / 添加时间排序 |
| ⏰ **睡眠定时器** | 15–90 分钟倒计时，到点暂停 |
| 🔁 **AB 循环** | 任意设置 A / B 点循环片段 |
| 🐢 **变速播放** | 0.5x – 2.5x |
| 🔤 **自定义字体** | 上传 `.ttf` / `.woff` 作为界面字体；存在浏览器本地，重开自动应用 |
| 🌗 **双主题** | Catppuccin **Mocha** / **Latte**，切换带圆形扩散动画（View Transition） |
| ⌨️ **键盘全覆盖** | 播放、切歌、快进、音量、静音、全屏、歌词、主题 |

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 播放 / 暂停 |
| `←` / `→` | 快退 / 快进 5 秒 |
| `Shift + ←` / `Shift + →` | 上一首 / 下一首 |
| `↑` / `↓` | 音量增减 |
| `M` | 静音切换 |
| `F` | 进入 / 退出全屏可视化 |
| `L` | 切换歌词视图 |
| `Ctrl/Cmd + Shift + L` | 切换主题 (Mocha ↔ Latte) |
| `Esc` | 退出全屏可视化 / 关闭歌词对话框 |

> 全屏可视化有三个退出口：左上「返回」、右上「关闭」、`Esc`。

## 📂 项目结构

```
Lumen/
├── index.html              # SVG 渲染工作台（保持单文件：HTML + CSS + JS 内联）
├── music.html              # 音乐播放器外壳：文档结构 + 模块引用
├── css/                    # 播放器样式，按区域拆分
│   ├── tokens.css          #   设计 token：调色板、语义色、圆角、阴影、动效、字体
│   ├── topbar.css          #   光谱条 + 顶栏
│   ├── layout.css          #   主布局 + 侧栏 + 标签页 + 面板骨架
│   ├── panel-list.css      #   播放列表面板
│   ├── panel-lyric.css     #   歌词面板 + 歌词编辑对话框
│   ├── panel-eq.css        #   均衡器 + 播放速度
│   ├── panel-info-tools.css#   信息 / 工具面板
│   ├── now-playing.css     #   右侧主视觉（封面 / 曲目 / 可视化 / 歌词覆盖层）
│   ├── playbar.css         #   底部播放控制条
│   ├── fullscreen.css      #   全屏可视化
│   ├── overlays.css        #   拖放遮罩 + Toast
│   └── responsive.css      #   响应式 + View Transition + 降低动效
├── js/                     # 播放器脚本，按职责拆分（按文件名顺序载入）
│   ├── 00-core.js          #   常量、DOM 引用表、运行时状态
│   ├── 10-storage.js       #   IndexedDB、设置 / 歌词 / 收藏持久化
│   ├── 20-utils.js         #   工具函数 + LRC 解析器
│   ├── 25-theme.js         #   光谱条 + 收藏读取
│   ├── 30-theme.js         #   主题切换
│   ├── 40-audio-graph.js   #   Web Audio 图（Analyser + EQ）
│   ├── 50-visualizer.js    #   可视化绘制
│   ├── 60-cover.js         #   封面提取与取色
│   ├── 70-files.js         #   文件导入
│   ├── 75-playlist.js      #   排序与播放列表渲染
│   ├── 80-lyrics-ui.js     #   歌词 UI
│   ├── 85-playback.js      #   播放控制 / 进度条 / 音量 / 音频事件
│   ├── 87-panels.js        #   信息面板 / 定时器 / AB 循环 / EQ / 速度
│   ├── 88-fonts.js         #   自定义字体：上传、FontFace 注册、持久化
│   ├── 90-controls.js      #   按钮绑定 / 搜索排序 / 可视化模式 / 视图切换
│   ├── 92-fullscreen.js    #   全屏可视化
│   ├── 95-shell.js         #   标签页 / 全局拖放 / 快捷键 / 尺寸
│   └── 99-init.js          #   数据恢复与初始化
└── README.md
```

**关于拆分**：`index.html` 仍是单文件，未做任何改动。`music.html` 则拆成了
「外壳 + 12 个 CSS + 18 个 JS」。脚本按顺序以经典 `<script>` 载入，顶层
`const` / `let` / `function` 共享同一个全局词法作用域，因此模块之间的调用
关系与拆分前的单个 IIFE 完全一致 —— 只是不再需要在一个几千行的文件里翻找。

> ⚠️ 新增 JS 文件时，务必同步在 `music.html` 底部按顺序插入 `<script>`；
> 有前后依赖的函数必须让定义方排在调用方之前。

## 🛠️ 技术栈

- **原生 Web 技术** —— 无框架、无构建、无依赖
- **Catppuccin** —— 配色方案 (Mocha / Latte)
- **Outfit / JetBrains Mono** —— 通过 jsDelivr 引入的变量字体（仅拉丁字形，中文回落系统字体）
- **Phosphor Icons** —— 通过 CDN 引入的图标库
- **Web Audio API** —— 播放分析 + 均衡器
- **FontFace API** —— 自定义字体注册（`.ttf` / `.woff`）
- **IndexedDB / localStorage** —— 曲目、歌词、设置、自定义字体持久化
- **View Transitions API** —— 主题切换动画（渐进增强）
- **CSS 自定义属性** —— 设计 token 与主题系统

### 设计约定

- **单一强调色**：全站只用 Catppuccin mauve。红色仅用于破坏性操作与错误 Toast，
  绿色仅用于成功 Toast。
- **封面取色只做环境染色**：`--cover-color` 用于背景光晕、封面描边、进度条等
  内容派生区域，不参与 UI 强调色，避免出现第二个抢眼色相。
- **圆角一套规则**：独立按钮 / 下拉 / 搜索框 = 药丸；分段选项与多行输入 = `--r-sm`；
  面板与列表 = `--r-md`；对话框 = `--r-lg`；封面 = `--r-xl`。
- **阴影向背景色相偏移**：不使用纯黑投影，统一走 `--shadow-1/2/3`。
- **动效有理由**：所有动画要么表达层级（面板入场）、要么表达状态（播放中呼吸、
  拖拽反馈），并统一在 `prefers-reduced-motion` 下关闭。
- **颜色要显式声明**：`.play-btn` 本身也是 `.ctrl-btn`，凡是会写 `color` 的
  `.ctrl-btn` 状态都加了 `:not(.play-btn)` 限定，且播放键每个交互态都自己声明
  `color`。同色图标画在同色底上 = 隐形，这类 bug 很容易在重构里复发。

### 自定义字体的实现与边界

- 只接受 **`.ttf` / `.woff`**，并且是**读文件头**判断格式（`wOFF` / `\0\1\0\0`
  等 magic），不是看扩展名；`.woff2` / `.otf` 会被明确拒绝并给出提示。
- 字体二进制写入 **IndexedDB 的 `settings` store**（`key = 'custom-font'`），
  刷新 / 重开浏览器后自动重新注册并应用；IndexedDB 不可用时降级到
  `localStorage`（base64，上限 1 MB），两条路都不可用才提示「仅本次会话生效」。
- 只插到 `--font-sans` 的最前面（通过运行时变量 `--font-user`），
  所以**只影响界面主字体**，等宽区域（时间、标签）仍用 JetBrains Mono。
- 上传时先把新字面 `load()` 成功、再替换旧字面，解析失败不会把可用字体弄丢。

### 已修复

- **全屏模式下的退出按钮点不动**：`.fs-content` 是覆盖整个视口且排在按钮之后的
  定位元素，绘制层级压在 `.fs-close` 上，把点击事件全部吃掉了。现在显式建立
  层级（背景 0 / 内容 1 / 退出控件 3），并让内容层 `pointer-events: none`，
  同时新增左上角「返回」按钮。（详见 `css/fullscreen.css` 的修复记录）
- **播放列表的「正在播放」标记像个坏图标**：原来是一组 2.5px 宽的跳动竖条
  （迷你均衡器），在列表行里太小、容易被误认成损坏的字形。已换成**静态圆角
  三角形 SVG**，尖角指向曲名，圆角由同色描边 + `stroke-linejoin: round` 生成。
- **播放键图标悬停时消失**：`.play-btn` 同时命中 `.ctrl-btn:hover`，后者把
  `color` 设成了 `var(--accent)`，而前者把 `background` 也设成 `var(--accent)`
  —— 强调色图标画在强调色底上就隐形了。已把 `.ctrl-btn` 的着色状态限定为
  `:not(.play-btn)`，并让播放键各状态显式声明 `color: var(--accent-ink)`。

---

# 🖼️ Lumen · SVG 渲染工作台（`index.html`）

一个轻量、单文件、开箱即用的 **SVG 在线编辑与预览工具**，基于 Catppuccin 配色主题构建，支持主题色变量自动解析、语法高亮、图层管理、历史记录、缩放/平移等功能。

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🎨 **双主题切换** | Catppuccin **Mocha** (深色) / **Latte** (浅色)，一键平滑过渡动画 |
| 📥 **拖拽导入 / 粘贴源码** | 支持 `.svg` 文件拖入，或直接在代码编辑器粘贴 SVG 源码 |
| 📤 **一键导出** | 复制源码、下载 `.svg` 文件，保留原始结构 |
| 🧩 **CSS 变量自动解析** | SVG 中使用 `var(--ctp-blue)` 等 Catppuccin 变量，自动按当前主题渲染真实色值 |
| 🔍 **语法高亮编辑器** | 标签、属性、值、注释分色，行号、Tab 缩进、撤销/重做 |
| 🌲 **图层面板** | 列出 SVG 所有元素，支持**隔离显示**、**显示/隐藏切换**、选中高亮 |
| ⏪ **历史记录** | 撤销 / 重做（键盘快捷键 `Ctrl+Z` / `Ctrl+Y`） |
| 🔍 **画布缩放与平移** | 滚轮缩放、按住空格/中键拖拽平移、双击/按钮重置视图 |
| 🎯 **交互细节** | 超频谱配色条、Toast 提示、View Transition 主题切换动画、键盘快捷键全覆盖 |
| 📦 **零依赖部署** | 单个 `index.html`，无构建步骤，直接托管即可运行 |

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Shift + L` | 切换主题 (Mocha ↔ Latte) |
| `Ctrl/Cmd + Shift + S` | 下载 SVG |
| `Ctrl/Cmd + Z` | 撤销 |
| `Ctrl/Cmd + Y` / `Ctrl/Cmd + Shift + Z` | 重做 |
| `Ctrl/Cmd + 0` | 重置画布视图 |
| `Ctrl/Cmd + O` | 打开文件选择器 |
| `Esc` | 取消拖拽 / 关闭覆盖层 |
| `Space + 拖拽` | 画布平移 |
| `滚轮` | 画布缩放 (以鼠标为中心) |
| `双击画布` | 重置视图 |

## 🎨 Catppuccin 变量使用示例

在 SVG 源码中直接使用 Catppuccin 语义色变量，主题切换时自动变色：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <!-- 主题色会随 Mocha/Latte 自动切换 -->
  <rect x="10" y="10" width="80" height="80" fill="var(--ctp-blue)" rx="12"/>
  <circle cx="150" cy="50" r="35" fill="var(--ctp-pink)" opacity="0.9"/>
  <text x="100" y="60" text-anchor="middle"
        font-size="16" fill="var(--ctp-text)" font-family="system-ui">
    Hello Lumen
  </text>
</svg>
```

**可用变量完整列表** (见顶部色谱条)：
- `--ctp-rosewater` `--ctp-flamingo` `--ctp-pink` `--ctp-mauve`
- `--ctp-red` `--ctp-maroon` `--ctp-peach` `--ctp-yellow`
- `--ctp-green` `--ctp-teal` `--ctp-sky` `--ctp-sapphire`
- `--ctp-blue` `--ctp-lavender` `--ctp-text` `--ctp-subtext0/1`
- `--ctp-overlay0/1/2` `--ctp-surface0/1/2` `--ctp-base` `--ctp-mantle` `--ctp-crust`

> 💡 也可直接使用语义别名：`--ctp-primary`、`--ctp-surface` 等，定义在 `:root` 与 `[data-theme="mocha"]` 中。

---

## 🚀 快速开始

直接用浏览器打开即可（推荐 Chrome / Edge / Safari / Firefox 近期版本）：

```bash
open music.html        # macOS
xdg-open music.html    # Linux
start music.html       # Windows
```

也可以起一个静态服务器（从 `file://` 打开时 IndexedDB 与部分浏览器 API
在个别环境下会被限制，用 http 打开体验更一致）：

```bash
npx serve .
python -m http.server 8080
# 然后访问 http://localhost:8080/music.html
```

> 首次打开播放器会把你选择的音频存进 IndexedDB，便于下次自动恢复；
> 音频文件始终留在本机，不会上传。

---

## 🤝 贡献指南

欢迎 Issue 与 PR！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feat/amazing-feature`
5. 发起 Pull Request

**开发建议**：
- `index.html` 保持单文件结构
- `music.html` 遵循 `css/` + `js/` 的模块划分，新增脚本同步更新本文件的「项目结构」
- 样式改动请优先改 `css/tokens.css` 里的 token，不要在组件里硬编码颜色和圆角
- 遵循现有代码风格（ES5 兼容、语义化命名）

---

## 📄 许可证

MIT License © 2025 [FLT18355](https://github.com/FLT18355)

---

## 🙏 致谢

- [Catppuccin](https://github.com/catppuccin/catppuccin) — 绝美的配色主题
- [Phosphor Icons](https://phosphoricons.com/) — 优雅的图标库
- [Outfit](https://github.com/Outfitio/Outfit-Fonts) / [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — 字体
- 所有为开源 SVG / 音频工具贡献灵感的开发者们
