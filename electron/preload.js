const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aiwhip', {
  getInitData: () => ipcRenderer.invoke('get-init-data'),
  increment: () => ipcRenderer.invoke('increment-counter'),
  reset: () => ipcRenderer.invoke('reset-counter'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  startDrag: (screenX, screenY) => ipcRenderer.send('start-drag', screenX, screenY),
  dragTo: (screenX, screenY) => ipcRenderer.send('drag-to', screenX, screenY),
  onCounterUpdated: (cb) =>
    ipcRenderer.on('counter-updated', (_e, v) => cb(v)),
  onLogoUpdated: (cb) =>
    ipcRenderer.on('logo-updated', (_e, v) => cb(v)),
  onDanmakuUpdated: (cb) =>
    ipcRenderer.on('danmaku-updated', (_e, v) => cb(v)),
});
