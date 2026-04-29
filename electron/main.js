const { app, BrowserWindow, ipcMain, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// 持久化存储路径
const userDataPath = app.getPath('userData');
const dataFile = path.join(userDataPath, 'counter.json');

function readData() {
  try {
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
  } catch (e) {}
  return { count: 0, logo: '', danmaku: true };
}

function writeData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data), 'utf8');
  } catch (e) {
    console.error('save data failed', e);
  }
}

function readCounter() {
  return readData().count || 0;
}

function writeCounter(count) {
  const data = readData();
  data.count = count;
  writeData(data);
}

function readLogo() {
  return readData().logo || '';
}

function writeLogo(logo) {
  const data = readData();
  data.logo = logo;
  writeData(data);
}

function readDanmaku() {
  const data = readData();
  return data.danmaku !== false; // 默认开启
}

function writeDanmaku(val) {
  const data = readData();
  data.danmaku = val;
  writeData(data);
}

// 扫描动画帧目录
function listFrames() {
  const framesDir = path.join(__dirname, 'assets', 'frames');
  try {
    if (!fs.existsSync(framesDir)) return [];
    return fs
      .readdirSync(framesDir)
      .filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f))
      .sort()
      .map((f) => path.join('assets', 'frames', f).replace(/\\/g, '/'));
  } catch (e) {
    return [];
  }
}

// 扫描面部 logo 目录
function listLogos() {
  const logosDir = path.join(__dirname, 'assets', 'icon', 'logoicon');
  try {
    if (!fs.existsSync(logosDir)) return [];
    return fs
      .readdirSync(logosDir)
      .filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f))
      .sort()
      .map((f) => ({
        name: f.replace(/\.[^.]+$/, ''),
        path: path.join('assets', 'icon', 'logoicon', f).replace(/\\/g, '/'),
      }));
  } catch (e) {
    return [];
  }
}

let win;

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  win = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    resizable: false,
    skipTaskbar: false,
    hasShadow: false,
    icon: icon,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

// ======== IPC ========

let dragStartX = 0;
let dragStartY = 0;
let winStartX = 0;
let winStartY = 0;

ipcMain.on('start-drag', (event, screenX, screenY) => {
  const bw = BrowserWindow.fromWebContents(event.sender);
  if (!bw) return;
  dragStartX = screenX;
  dragStartY = screenY;
  const bounds = bw.getBounds();
  winStartX = bounds.x;
  winStartY = bounds.y;
});

ipcMain.on('drag-to', (event, screenX, screenY) => {
  const bw = BrowserWindow.fromWebContents(event.sender);
  if (!bw) return;
  bw.setBounds({
    x: winStartX + (screenX - dragStartX),
    y: winStartY + (screenY - dragStartY),
    width: 300,
    height: 300,
  });
});

ipcMain.handle('get-init-data', () => {
  const logos = listLogos();
  const savedLogo = readLogo();
  return {
    count: readCounter(),
    frames: listFrames(),
    logos: logos,
    currentLogo: savedLogo,
    danmaku: readDanmaku(),
  };
});

ipcMain.handle('increment-counter', () => {
  const next = readCounter() + 1;
  writeCounter(next);
  return next;
});

ipcMain.handle('reset-counter', () => {
  writeCounter(0);
  return 0;
});

ipcMain.on('show-context-menu', (event) => {
  const logos = listLogos();
  const currentLogo = readLogo();

  const logoSubmenu = logos.map((l) => ({
    label: l.name,
    type: 'radio',
    checked: l.path === currentLogo,
    click: () => {
      writeLogo(l.path);
      event.sender.send('logo-updated', l.path);
    },
  }));

  const template = [
    {
      label: '切换牛马',
      submenu: logoSubmenu,
    },
    { type: 'separator' },
    {
      label: '弹幕',
      type: 'checkbox',
      checked: readDanmaku(),
      click: (menuItem) => {
        writeDanmaku(menuItem.checked);
        event.sender.send('danmaku-updated', menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: '重置计数',
      click: () => {
        writeCounter(0);
        event.sender.send('counter-updated', 0);
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit(),
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});
