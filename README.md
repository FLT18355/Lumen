# Lumen · SVG 渲染工作台

一个轻量、单文件、开箱即用的 **SVG 在线编辑与预览工具**，基于 Catppuccin 配色主题构建，支持主题色变量自动解析、语法高亮、图层管理、历史记录、缩放/平移等功能。

> **Lumen** —— 拉丁语“光”，寓意让 SVG 创作在光影中流动。

---

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

---

## 🚀 快速开始

### 在线体验
👉 **GitHub Pages**: `https://FLT18355.github.io/Lumen/` （部署后生效）

### 本地运行
```bash
# 直接用浏览器打开
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```
或使用任意静态服务器：
```bash
npx serve .
python -m http.server 8080
# 然后访问 http://localhost:8080
```

---

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

---

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

## 📂 项目结构

```
Lumen/
├── index.html    # 单文件应用 (HTML + CSS + JS)
└── README.md     # 本文件
```

---

## 🛠️ 技术栈

- **原生 Web 技术** — 无框架、无构建、无依赖
- **Catppuccin** — 优雅的配色方案 (Mocha / Latte)
- **Phosphor Icons** — 通过 CDN 引入的轻量图标库
- **CSS 自定义属性** — 主题系统核心
- **View Transitions API** — 主题切换动画 (渐进增强)

---

## 📸 界面预览

| Mocha (深色) | Latte (浅色) |
|-------------|--------------|
| ![Mocha](https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/palette/mocha.png) | ![Latte](https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/palette/latte.png) |

> 截图待补充，部署后可自行替换为实际界面截图。

---

## 🤝 贡献指南

欢迎 Issue 与 PR！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feat/amazing-feature`
5. 发起 Pull Request

**开发建议**：
- 保持单文件 `index.html` 结构
- 遵循现有代码风格 (ES5 兼容、语义化命名)
- 新增功能请同步更新 README

---

## 📄 许可证

MIT License © 2025 [FLT18355](https://github.com/FLT18355)

---

## 🙏 致谢

- [Catppuccin](https://github.com/catppuccin/catppuccin) — 绝美的配色主题
- [Phosphor Icons](https://phosphoricons.com/) — 优雅的图标库
- 所有为开源 SVG 工具贡献灵感的开发者们