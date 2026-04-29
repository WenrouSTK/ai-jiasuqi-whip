# Tauri 版（最终版）

当前生产版本。Tauri v2 + Rust 后端 + 原生 HTML/CSS/JS 前端。

## 状态
✅ **最终版** — 2.3MB 安装包，功能完整

## 前置要求
- Rust 1.95+
- Visual Studio Build Tools 2022（C++ 桌面开发工作负载）
- Node.js 20+

## 开发
```bash
npm install
npx tauri dev    # 开发模式
npx tauri build  # 打包 NSIS 安装包
```

## 打包产物
- `src-tauri/target/release/bundle/nsis/Ai加速器_鞭打版_1.0.0_x64-setup.exe`（2.3MB）

## 架构

```
tauri/
├── src/                    # 前端（原生 HTML/CSS/JS）
│   ├── index.html
│   ├── main.js             # 动画、飘字、彩蛋、托盘事件监听
│   ├── style.css
│   └── assets/             # 动画帧、logo、图标、音效
└── src-tauri/              # Rust 后端
    ├── src/lib.rs          # 数据持久化、托盘菜单、全局输入监听
    ├── Cargo.toml
    ├── tauri.conf.json     # 窗口配置（透明、无边框、skipTaskbar）
    └── capabilities/       # Tauri v2 权限配置
```

## 核心实现

### 全局键鼠监听（device_query 轮询）
```rust
// 60Hz 轮询硬件状态，不受窗口焦点影响
let device_state = DeviceState::new();
loop {
    let keys = device_state.get_keys();
    // diff 前一帧，emit 事件给前端
    sleep(Duration::from_millis(16));
}
```

为什么不用 rdev？因为 rdev 的 `WH_KEYBOARD_LL` 钩子在自己进程获焦后会失效（Bongo Cat issue #858 同款问题）。

### 系统托盘菜单
Tauri v2 `MenuBuilder` + `CheckMenuItemBuilder`，原生菜单，不受窗口大小限制。

### 窗口拖拽
JS 里 `appWindow.startDragging()`，不要 await、不要 preventDefault，fire-and-forget。
需要在 `capabilities/default.json` 加 `core:window:allow-start-dragging` 权限。

### 等比缩放
CSS `transform: scale()` 缩内容 + Rust `set_size` 改窗口外框尺寸，6 档（99%/88%/77%/66%/55%/44%）。

## 编译坑
Git Bash 环境下编译需要把 MSVC `link.exe` 放在 PATH 最前：
```bash
export PATH="$HOME/.cargo/bin:/c/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Tools/MSVC/14.44.35207/bin/Hostx64/x64:$PATH"
```
否则会和 Git Bash 的 `/usr/bin/link.exe` 冲突报 "extra operand" 错误。
