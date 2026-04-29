(async function () {
  const counterEl = document.getElementById('counter');
  const stageEl = document.getElementById('stage');
  const spriteEl = document.getElementById('sprite');
  const dragHandle = document.getElementById('drag-handle');
  const faceLogoEl = document.getElementById('face-logo');

  let frames = [];
  let playing = false;
  let count = 0;

  // 挥鞭后停留时间（毫秒），然后恢复第一帧
  const HOLD_DELAY = 88;

  // 初始化
  const init = await window.aiwhip.getInitData();
  count = init.count || 0;
  frames = init.frames || [];
  counterEl.textContent = count;
  let danmakuOn = init.danmaku !== false;

  // 面部 logo
  const logos = init.logos || [];
  let currentLogo = init.currentLogo || '';
  if (!currentLogo && logos.length > 0) {
    currentLogo = logos[0].path;
  }
  if (currentLogo) {
    faceLogoEl.src = currentLogo;
  } else {
    faceLogoEl.style.display = 'none';
  }

  // 处理素材为空的情况（占位）
  if (frames.length === 0) {
    spriteEl.classList.add('empty');
    spriteEl.removeAttribute('src');
  } else {
    // 默认显示第一帧作为待机状态
    spriteEl.src = frames[0];
  }

  // 可选：自动播放音效
  let audio = null;
  try {
    audio = new Audio('assets/sound/whip.mp3');
    audio.volume = 0.6;
  } catch (e) {}

  function playAnimation() {
    if (playing) return;
    if (frames.length < 2) return;
    playing = true;

    // 立刻切到第二帧（挥鞭）
    spriteEl.src = frames[1];

    // logo 跟着被打往左下偏移
    faceLogoEl.style.transform = 'translate(-7px, 5px)';
    // 星星也跟着偏移
    const starsEl = document.getElementById('stars');
    if (starsEl) starsEl.style.transform = 'rotate(-28deg) scale(0.72) translate(-7px, 5px)';

    // 停留 HOLD_DELAY 后回到第一帧
    setTimeout(() => {
      spriteEl.src = frames[0];
      faceLogoEl.style.transform = '';
      if (starsEl) starsEl.style.transform = 'rotate(-28deg) scale(0.72)';
      playing = false;
    }, HOLD_DELAY);

    // 音效
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }

  // ======== PUA 飘字 ========
  // 权重从高到低，前面的出现概率更高
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
    // #6-16 稀有句显示时间翻倍
    if (pick.rare) {
      el.style.animationDuration = '2s';
    }
    // 窗口内随机位置（长句收缩30px）
    const margin = pick.text.length > 7 ? 40 : 10;
    const rx = Math.random() * (240 - 2 * margin) + margin;
    const ry = Math.random() * 200 + 40;
    el.style.left = rx + 'px';
    el.style.top = ry + 'px';
    document.getElementById('app').appendChild(el);

    // 动画结束后移除
    el.addEventListener('animationend', () => el.remove());
  }

  // ======== 9999 彩蛋 ========
  let easterEggTriggered = false;

  function showOutstanding() {
    const el = document.createElement('div');
    el.className = 'float-text outstanding';
    el.textContent = 'Outstanding';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    document.getElementById('app').appendChild(el);
    el.addEventListener('animationend', () => el.remove());

    // Outstanding 动画 3 秒后弹出第二行
    setTimeout(() => {
      const el2 = document.createElement('div');
      el2.className = 'float-text congrats';
      el2.textContent = '恭喜你通过层层试炼，获得五星好Ai';
      el2.style.left = '50%';
      el2.style.top = '55%';
      el2.style.transform = 'translate(-50%, -50%)';
      document.getElementById('app').appendChild(el2);
      el2.addEventListener('animationend', () => el2.remove());
    }, 2000);
  }

  function addStars() {
    const starsEl = document.getElementById('stars');
    if (starsEl) return; // 已经有了
    const stars = document.createElement('span');
    stars.id = 'stars';
    stars.textContent = '\u2B50\u2B50\u2B50\u2B50\u2B50';
    document.getElementById('stage').appendChild(stars);
  }

  function checkEasterEgg() {
    if (easterEggTriggered) return;
    if (count >= 9999) {
      easterEggTriggered = true;
      showOutstanding();
      addStars();
    }
  }

  // 启动时也检查（之前已经到 9999 的情况）
  if (count >= 9999) {
    easterEggTriggered = true;
    addStars();
  }

  // 左键按下瞬间：开鞭 + 计数 + 飘字
  stageEl.addEventListener('mousedown', async (e) => {
    if (e.button !== 0) return;
    playAnimation();
    showFloatText();
    count = await window.aiwhip.increment();
    counterEl.textContent = count;
    checkEasterEgg();
  });

  // 右键：弹出菜单
  stageEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    window.aiwhip.showContextMenu();
  });

  // 主进程通知计数变更（重置）
  window.aiwhip.onCounterUpdated((v) => {
    count = v;
    counterEl.textContent = count;
  });

  // 主进程通知 logo 切换
  window.aiwhip.onLogoUpdated((logoPath) => {
    currentLogo = logoPath;
    faceLogoEl.src = logoPath;
    faceLogoEl.style.display = '';
  });

  // 弹幕开关切换
  window.aiwhip.onDanmakuUpdated((val) => {
    danmakuOn = val;
  });

  // ======== 拖拽把手：JS 实现窗口拖动（绝对坐标） ========
  let dragging = false;

  dragHandle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    window.aiwhip.startDrag(e.screenX, e.screenY);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    window.aiwhip.dragTo(e.screenX, e.screenY);
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });
})();
