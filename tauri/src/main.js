// AiWhip - Tauri 托盘版
const { invoke } = window.__TAURI__.core;
const { getCurrentWindow } = window.__TAURI__.window;
const { listen } = window.__TAURI__.event;

(async function () {
  const appWindow = getCurrentWindow();
  const counterEl = document.getElementById('counter');
  const stageEl = document.getElementById('stage');
  const spriteEl = document.getElementById('sprite');
  const dragHandle = document.getElementById('drag-handle');
  const faceLogoEl = document.getElementById('face-logo');

  let frames = ['assets/frames/01.png', 'assets/frames/02.png'];
  let playing = false;
  let count = 0;
  let danmakuOn = true;
  let currentScale = 99;
  const HOLD_DELAY = 88;

  // ======== 初始化数据 ========
  let data = {};
  try {
    data = JSON.parse(await invoke('read_data'));
  } catch (e) {
    data = { count: 0, logo: '', danmaku: true, onTop: false, scale: 99 };
  }
  count = data.count || 0;
  danmakuOn = data.danmaku !== false;
  currentScale = data.scale || 99;
  counterEl.textContent = count;

  // 应用缩放
  function applyScale(pct) {
    currentScale = pct;
    const factor = pct / 99;
    document.getElementById('app').style.transform = `scale(${factor})`;
    document.getElementById('app').style.transformOrigin = '0 0';
  }
  applyScale(currentScale);

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

  let currentLogo = data.logo || '';
  if (!currentLogo && logos.length > 0) currentLogo = logos[0].path;
  if (currentLogo) {
    faceLogoEl.src = currentLogo;
  } else {
    faceLogoEl.style.display = 'none';
  }

  if (frames.length > 0) spriteEl.src = frames[0];

  let audio = null;
  try { audio = new Audio('assets/sound/whip.mp3'); audio.volume = 0.6; } catch (e) {}

  // ======== 保存数据 ========
  async function saveData() {
    await invoke('write_data', {
      json: JSON.stringify({ count, logo: currentLogo, danmaku: danmakuOn, onTop: data.onTop || false, scale: currentScale })
    });
  }

  // ======== 托盘菜单事件回调 ========
  window.__trayAction = async function (action) {
    if (action === 'reset') {
      count = 0;
      counterEl.textContent = 0;
      await saveData();
    } else if (action.startsWith('danmaku:')) {
      danmakuOn = action === 'danmaku:true';
      await saveData();
    } else if (action.startsWith('onTop:')) {
      data.onTop = action === 'onTop:true';
      await saveData();
    } else if (action.startsWith('logo:')) {
      currentLogo = action.replace('logo:', '');
      faceLogoEl.src = currentLogo;
      faceLogoEl.style.display = '';
      await saveData();
    } else if (action.startsWith('size:')) {
      const pct = parseInt(action.replace('size:', ''), 10);
      applyScale(pct);
      await saveData();
    }
  };

  // 右键禁用默认菜单
  document.addEventListener('contextmenu', (e) => e.preventDefault());

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
    document.getElementById('app').appendChild(el);
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
    document.getElementById('app').appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => {
      const el2 = document.createElement('div');
      el2.className = 'float-text congrats';
      el2.textContent = '恭喜你通过层层试炼，获得五星好Ai';
      el2.style.left = '50%'; el2.style.top = '55%';
      el2.style.transform = 'translate(-50%, -50%)';
      document.getElementById('app').appendChild(el2);
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

  // ======== 全局输入回调（键鼠都触发，只播动画+计数，不弹幕） ========
  let savePending = false;
  function handleGlobalInput() {
    playAnimation();
    count++;
    counterEl.textContent = count;
    checkEasterEgg();
    if (!savePending) {
      savePending = true;
      setTimeout(async () => {
        await saveData();
        savePending = false;
      }, 100);
    }
  }
  window.__globalInput = handleGlobalInput;

  // 监听 Rust 后端的全局输入事件
  await listen('global-input', () => handleGlobalInput());

  // ======== 窗口内点击：额外触发弹幕 ========
  stageEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    showFloatText();
  });

  // ======== 拖拽窗口 ========
  // 关键：不 await、不 preventDefault，fire-and-forget 调用 startDragging
  dragHandle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    appWindow.startDragging();
  });
  counterEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    appWindow.startDragging();
  });

  // 右键禁用默认菜单
  document.addEventListener('contextmenu', (e) => e.preventDefault());
})();
