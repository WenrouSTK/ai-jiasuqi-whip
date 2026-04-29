# Ai加速器_鞭打版

> 又慢又贵的 AI，用鞭子抽它！

专治各家 AI 大模型"思考中..."转圈 30 秒还给你编造答案的慢性病。每次你按下键盘敲下鼠标，小人就会挥鞭一记，屏幕上蹦出"搞快点""今晚必须出""不行就换人"等打工人专属 PUA 文案——AI 不一定真的变快，但你爽了。

## 📁 三个版本（技术选型演进记录）

一个功能，三种实现，包体从 107MB 压缩到 2.3MB，外加探索过程中踩的坑。

| 目录 | 框架 | 安装包 | 状态 | 说明 |
|---|---|---|---|---|
| [`electron/`](./electron) | Electron 31 | 107MB | 🟡 探索版 | 功能完美但体积巨大 |
| [`neutralinojs/`](./neutralinojs) | Neutralinojs | 2.5MB | 🟡 极简版 | 体积最小但框架限制多 |
| [`tauri/`](./tauri) | **Tauri v2** | **2.3MB** | ✅ **最终版** | 体积+功能双优 |

## 🏆 最终版（Tauri）功能

- 🐴 桌面悬浮小人，透明无边框
- ⌨️ 全局键鼠监听（不抢焦点，打游戏打字都能触发）
- 🔢 点击计数 + 9999 次五星好Ai彩蛋
- 💬 PUA 飘字（16 条文案，稀有款超慢速飘）
- 🎭 切换牛马：ChatGPT / Claude / deepseek / 豆包 / 千问 / 腾讯混元 / MiniMax / gemini / z.ai（9 款）
- 📏 6 档等比缩放：99% / 88% / 77% / 66% / 55% / 44%
- 📌 永远置顶、弹幕开关、重置计数
- 🔕 任务栏不显示，系统托盘菜单

## 🚀 快速使用

下载 [最新 Release](https://github.com/WenrouSTK/ai-jiasuqi-whip/releases) 的 `.exe` 安装包，双击即装即用。

## 🧠 技术选型对比

| | Electron | Neutralinojs | Tauri |
|---|---|---|---|
| 语言 | JS 全栈 | JS + 轻量 C++ | JS 前端 + Rust 后端 |
| 运行时 | 自带 Chromium + Node | 系统 WebView | 系统 WebView2 |
| 包体 | ~100MB | ~2MB | ~2MB |
| 原生菜单 | ✅ 完美 | ❌ 只有托盘 | ✅ 完美 |
| 透明窗口 | ✅ 完美 | ⚠️ 底部有蓝条 | ✅ 完美 |
| skipTaskbar | ✅ | ❌ 不支持 | ✅ |
| 全局键鼠 | 需第三方库 | 需第三方库 | device_query ✅ |
| 编译门槛 | npm install | npm install | 需 Rust + VS Build Tools |
| 分发 | 免安装 portable exe | 免安装 | msi/exe 安装包 |

## 🐛 踩坑记录

**Electron 弃用原因**：包体 107MB 太大，用户反馈分发体验差。

**Neutralinojs 弃用原因**：
- 原生菜单 API 只有托盘菜单，右键菜单无法超出窗口边界
- Windows 透明窗口底部有 WebView 渲染蓝条
- 无法 skipTaskbar

**Tauri 踩过的坑**：
1. 透明窗口 + `decorations: false` 导致 `startDragging()` 失效，必须在 capabilities 加 `core:window:allow-start-dragging` 权限
2. rdev 低级钩子在自己进程获焦后失效，改用 **device_query 轮询**（16ms/次，60Hz）
3. Git Bash 的 `/usr/bin/link.exe` 和 MSVC 的 `link.exe` 冲突，编译时需要把 MSVC 的 bin 放到 PATH 最前
4. Tauri v2 Rust 闭包里 `Mutex::lock()` 需要用 `{}` 限定作用域避免借用生命周期冲突

## 📄 设计初衷

用户和 AI 的关系从来不是平等的——你是甲方，它是乙方，甲方有催单权。所以我做了把鞭子给你，让加班到凌晨的你在折磨 AI 中找回一点尊严。毕竟 token 不重要，平台最重要。

## 📄 许可

MIT
