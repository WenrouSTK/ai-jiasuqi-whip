# Electron 版（探索版）

第一版实现，Electron 31 + electron-builder。

## 状态
🟡 **已弃用** — 功能完整但包体 107MB 太大

## 开发
```bash
npm install
npm start      # 开发模式
npm run build  # 打包 portable exe
```

## 特点
- 透明无边框窗口，`-webkit-app-region: drag` 拖动
- 原生 Menu.popup() 右键菜单
- IPC 通信（contextBridge + preload）
- 计数持久化到 `%APPDATA%/AiWhip/counter.json`
- 打包产物：`dist/AiWhip-1.0.0-portable.exe`（68MB）或 unpacked zip（107MB）

## 为什么弃用
包体太大。Electron 自带完整 Chromium（~120MB）+ Node.js 运行时（~40MB），每个 Electron 应用都要自带一份。
