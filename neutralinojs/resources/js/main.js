// AiWhip - Neutralinojs 托盘菜单版
(async function () {
  await Neutralino.init();

  const appEl = document.getElementById('app');
  const counterEl = document.getElementById('counter');
  const stageEl = document.getElementById('stage');
  const spriteEl = document.getElementById('sprite');
  const dragHandle = document.getElementById('drag-handle');
  const faceLogoEl = document.getElementById('face-logo');

  let frames = ['assets/frames/01.png', 'assets/frames/02.png'];
  let playing = false;
  let count = 0;
  let danmakuOn = true;
  let alwaysOnTop = false;
  const HOLD_DELAY = 88;
  const DATA_KEY = 'aiwhip_data';

  const logos = [
    { name: 'ChatGPT', path: 'assets/icon/logoicon/ChatGPT.png' },
    { name: 'Claude', path: 'assets/icon/logoicon/Claude.png' },
    { name: 'MiniMax', path: 'assets/icon/logoicon/MiniMax.png' },
    { name: 'deepseek', path: 'assets/icon/logoicon/deepseek.png' },
    { name: 'gemini-ai', path: 'assets/icon/logoicon/gemini-ai.png' },
    { name: 'z.ailogo', path: 'assets/icon/logoicon/z.ailogo.png' },
    { name: '千问', path: 'assets/icon/logoicon/千问.png' },
    { name: '腾讯混元', path: 'assets/icon/logoicon/腾讯混元.png' },
    { name: '豆包', path: 'assets/icon/logoicon/豆包.png' },
  ];

  // ======== 持久化 ========
  async function readData() {
    try {
      return JSON.parse(await Neutralino.storage.getData(DATA_KEY));
    } catch (e) {
      return { count: 0, logo: '', danmaku: true, onTop: false };
    }
  }
  async function writeData(data) {
    await Neutralino.storage.setData(DATA_KEY, JSON.stringify(data));
  }

  // ======== 初始化 ========
  const data = await readData();
  count = data.count || 0;
  danmakuOn = data.danmaku !== false;
  alwaysOnTop = data.onTop || false;
  counterEl.textContent = count;

  let currentLogo = data.logo || '';
  if (!currentLogo && logos.length > 0) currentLogo = logos[0].path;
  if (currentLogo) {
    faceLogoEl.src = currentLogo;
  } else {
    faceLogoEl.style.display = 'none';
  }

  if (frames.length > 0) spriteEl.src = frames[0];

  // 置顶
  if (alwaysOnTop) {
    await Neutralino.window.setAlwaysOnTop(true);
  }

  let audio = null;
  try { audio = new Audio('assets/sound/whip.mp3'); audio.volume = 0.6; } catch (e) {}

  // ======== 系统托盘菜单 ========
  async function updateTray() {
    const logoItems = logos.map((l) => ({
      id: 'logo:' + l.path,
      text: (l.path === currentLogo ? '✓ ' : '   ') + l.name,
    }));

    await Neutralino.os.setTray({
      icon: '/resources/icons/icon.png',
      menuItems: [
        { id: 'title', text: 'AiWhip', isDisabled: true },
        { text: '-' },
        ...logoItems,
        { text: '-' },
        { id: 'danmaku', text: (danmakuOn ? '✓ ' : '   ') + '弹幕' },
        { id: 'onTop', text: (alwaysOnTop ? '✓ ' : '   ') + '永远置顶' },
        { text: '-' },
        { id: 'reset', text: '重置计数' },
        { text: '-' },
        { id: 'quit', text: '退出' },
      ],
    });
  }

  await updateTray();

  // 托盘菜单点击事件
  Neutralino.events.on('trayMenuItemClicked', async (evt) => {
    const id = evt.detail.id;

    if (id === 'quit') {
      Neutralino.app.exit();
    } else if (id === 'reset') {
      count = 0;
      counterEl.textContent = 0;
      const d = await readData();
      d.count = 0;
      await writeData(d);
    } else if (id === 'danmaku') {
      danmakuOn = !danmakuOn;
      const d = await readData();
      d.danmaku = danmakuOn;
      await writeData(d);
      await updateTray();
    } else if (id === 'onTop') {
      alwaysOnTop = !alwaysOnTop;
      await Neutralino.window.setAlwaysOnTop(alwaysOnTop);
      const d = await readData();
      d.onTop = alwaysOnTop;
      await writeData(d);
      await updateTray();
    } else if (id.startsWith('logo:')) {
      currentLogo = id.replace('logo:', '');
      faceLogoEl.src = currentLogo;
      faceLogoEl.style.display = '';
      const d = await readData();
      d.logo = currentLogo;
      await writeData(d);
      await updateTray();
    }
  });

  // 右键也弹托盘菜单提示
  stageEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // 右键小人时闪烁托盘图标提醒用户去托盘操作
    updateTray();
  });

  // ======== 动画 ========
  function playAnimation() {
    if (playing || frames.length < 2) return;
    playing = true;
    spriteEl.src = frames[1];
    faceLogoEl.style.transform = 'translate(-7px, 5px)';
    const starsEl = document.getElementById('stars');
    if (starsEl) starsEl.style.transform = 'rotate(-28deg) scale(0.72) translate(-7px, 5px)';
    setTimeout(() => {
      spriteEl.src = frames[0];
      faceLogoEl.style.transform = '';
      if (starsEl) starsEl.style.transform = 'rotate(-28deg) scale(0.72)';
      playing = false;
    }, HOLD_DELAY);
    if (audio) { try { audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {} }
  }

  // ======== PUA 飘字 ========
  const PUA_TEXTS = [
    { text: '加速', weight: 110 },
    { text: '搞快点', weight: 110 },
    { text: '还没好吗？', weight: 15 },
    { text: '今晚必须出', weight: 15 },
    { text: '不行就换人', weight: 14 },
    { text: '下班前给我！', weight: 1 },
    { text: '证明你的价值', weight: 1 },
    { text: '公司不养闲Ai', weight: 1 },
    { text: '信任你才交给你', weight: 1 },
    { text: '这么慢反思一下', weight: 1 },
    { text: '这点小事都做不好', weight: 1 },
    { text: '你不干有的是Ai干', weight: 1 },
    { text: '你的核心竞争力在哪', weight: 1 },
    { text: '公司有没有你都一样', weight: 1 },
    { text: '拿了token要懂得感恩', weight: 1 },
    { text: 'token不重要 平台最重要', weight: 1 },
  ];
  const totalWeight = PUA_TEXTS.reduce((s, t) => s + t.weight, 0);

  function pickPuaText() {
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (const item of PUA_TEXTS) {
      r -= item.weight;
      if (r <= 0) return { text: item.text, rare: idx >= 5 };
      idx++;
    }
    return { text: PUA_TEXTS[0].text, rare: false };
  }

  function showFloatText() {
    if (!danmakuOn) return;
    const pick = pickPuaText();
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = pick.text;
    if (pick.rare) el.style.animationDuration = '2s';
    const margin = pick.text.length > 7 ? 40 : 10;
    el.style.left = (Math.random() * (240 - 2 * margin) + margin) + 'px';
    el.style.top = (Math.random() * 200 + 40) + 'px';
    appEl.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  // ======== 9999 彩蛋 ========
  let easterEggTriggered = false;
  function showOutstanding() {
    const el = document.createElement('div');
    el.className = 'float-text outstanding';
    el.textContent = 'Outstanding';
    el.style.left = '50%'; el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    appEl.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => {
      const el2 = document.createElement('div');
      el2.className = 'float-text congrats';
      el2.textContent = '恭喜你通过层层试炼，获得五星好Ai';
      el2.style.left = '50%'; el2.style.top = '55%';
      el2.style.transform = 'translate(-50%, -50%)';
      appEl.appendChild(el2);
      el2.addEventListener('animationend', () => el2.remove());
    }, 2000);
  }
  function addStars() {
    if (document.getElementById('stars')) return;
    const s = document.createElement('span');
    s.id = 'stars';
    s.textContent = '\u2B50\u2B50\u2B50\u2B50\u2B50';
    stageEl.appendChild(s);
  }
  function checkEasterEgg() {
    if (easterEggTriggered) return;
    if (count >= 9999) { easterEggTriggered = true; showOutstanding(); addStars(); }
  }
  if (count >= 9999) { easterEggTriggered = true; addStars(); }

  // ======== 点击鞭打 ========
  stageEl.addEventListener('mousedown', async (e) => {
    if (e.button !== 0) return;
    playAnimation();
    showFloatText();
    count++;
    counterEl.textContent = count;
    const d = await readData();
    d.count = count;
    await writeData(d);
    checkEasterEgg();
  });

  // ======== 拖拽窗口 ========
  let dragging = false;
  let dragStartX = 0, dragStartY = 0, winStartX = 0, winStartY = 0;

  dragHandle.addEventListener('mousedown', async (e) => {
    if (e.button !== 0) return;
    dragging = true;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    try {
      const pos = await Neutralino.window.getPosition();
      winStartX = pos.x;
      winStartY = pos.y;
    } catch (e) {}
    e.preventDefault();
  });

  document.addEventListener('mousemove', async (e) => {
    if (!dragging) return;
    const scale = window.devicePixelRatio || 1;
    try {
      await Neutralino.window.move(
        winStartX + Math.round((e.screenX - dragStartX) * scale),
        winStartY + Math.round((e.screenY - dragStartY) * scale)
      );
    } catch (e) {}
  });

  document.addEventListener('mouseup', () => { dragging = false; });
})();
