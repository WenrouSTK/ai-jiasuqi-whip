# Neutralinojs 版（极简版）

第二版尝试，Neutralinojs v6.7 + nightly binary。

## 状态
🟡 **已弃用** — 体积最小但框架限制无法解决

## 开发
```bash
npx @neutralinojs/neu update
npx @neutralinojs/neu run    # 开发
npx @neutralinojs/neu build  # 打包
```

## 打包产物
- `dist/AiWhip/AiWhip-win_x64.exe`（1.8MB）
- `dist/AiWhip/resources.neu`（714KB）
- 两个文件放一起 → **2.5MB 即用**

## 为什么弃用

1. **右键菜单无法超出窗口边界**
   - Neutralinojs 没有 `os.showContextMenu` API
   - 只能用 HTML 自绘菜单，但 WebView 限制了菜单只能画在窗口内
   - 300×300 窗口放不下完整菜单

2. **Windows 透明窗口有底部蓝条**
   - WebView2 + `transparent: true` 在 Windows 上有渲染残留
   - 框架级别问题，CSS 解决不了

3. **无法 skipTaskbar**
   - 没有 API 隐藏窗口任务栏图标
   - 窗口会在底部任务栏出现

## 值得保留的经验
- `Neutralino.storage` 数据持久化
- `Neutralino.os.setTray` 托盘图标
- `Neutralino.window.setAlwaysOnTop` 置顶
- CSS 内嵌菜单面板设计（right-top icon toolbar + logo grid）
