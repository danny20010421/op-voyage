/* v105 專屬技能動畫：鷹眼（兩個版本）、羅（七武海）、衛伯、巴基斯、斯巴可的第 1～4 招，黑鬍子（七武海）沿用四皇版編排。
   每個編排在「命中瞬間」結束，之後才結算傷害。載入順序：fx_v104.js 之後；角色擴充檔較晚載入，所以等頁面載入完成再註冊。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const name = (A, at, n, c1, c2, sz) => X.text(at.x, at.y - 160, n, { size: sz || 54, color: c1 || '#ffffff', color2: c2 || '#c9973a' });
  const sparks = (x, y, n, cols, sp) => X.particles({ x, y, n, spd: sp || [160, 420], life: [.3, .7], size: [2, 6], colors: cols, shape: 'spark', add: true, g: 380 });
  const impact = (A, col, big) => { X.flash('#ffffff', big ? .26 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 250 : 170, color: col, w: big ? 9 : 6, life: .34 }); sparks(A.t.x, A.t.y, big ? 30 : 16, ['#ffffff', col]); if (big) shake(); };
  /* ---------- 鷹眼：黑刀「夜」 ---------- */
  const MIHAWK = (dark, crim) => [
    async A => { const n = 3; moveFighter(A.S, 'dash'); afterimage(A.S); await wait(200);
      for (let i = 0; i < n; i++) { SFX.play('slash'); X.slash(A.t.x + R(-20, 20), A.t.y + R(-30, 20), { a: R(-2.8, -1.8), span: 2, r: 150, w: 18, color: i % 2 ? '#ffffff' : crim }); await wait(90); }
      name(A, A.t, '斬擊', '#ffffff', dark); impact(A, crim); },
    async A => { SFX.play('buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y, { color: crim, r: 230, life: 1, hold: true });
      for (let i = 0; i < 6; i++) setTimeout(() => X.slash(A.f.x, A.f.y, { a: i * 1.05, span: .9, r: 170, w: 6, color: crim, life: .4 }), i * 70); await wait(520); name(A, A.f, '劍氣狀態', '#ffffff', dark); },
    async A => { SFX.play('ult'); X.tint('#0a0610', 1, .45); moveFighter(A.S, 'lunge'); await wait(260);
      X.flash('#ffffff', .4, .2); SFX.play('slash'); X.slash(A.t.x, A.t.y, { a: -3.1, span: 3.1, r: 420, w: 40, color: crim, life: .5 }); X.beam(A.t.x - 520, A.t.y + 30, A.t.x + 520, A.t.y - 30, { w: 10, c1: '#ffffff', c2: crim, life: .4 });
      await wait(160); X.cracks(A.t.x, A.t.y + 40, { n: 10, len: 300, color: crim }); name(A, A.t, '黑刀·夜', '#ffffff', dark, 64); impact(A, crim, true); },
    async A => { SFX.play('dark'); X.ring(A.t.x, A.t.y, { r1: 200, color: crim, w: 4, life: .6 }); for (let i = 0; i < 4; i++) setTimeout(() => X.ring(A.t.x, A.t.y, { r1: 60 + i * 30, color: '#ffffff', w: 2, life: .35 }), i * 90);
      await wait(380); X.text(A.t.x, A.t.y - 40, '◎', { size: 80, color: '#ffffff', color2: crim, rot: 0, life: .6 }); name(A, A.t, '洞察弱點', '#ffffff', dark); sparks(A.t.x, A.t.y, 12, ['#ffffff', crim]); }
  ];
  /* ---------- 羅（七武海）：ROOM 與手術 ---------- */
  const LAW = [
    async A => { moveFighter(A.S, 'dash'); afterimage(A.S); await wait(220); SFX.play('slash'); X.slash(A.t.x, A.t.y, { a: -2.6, span: 2.4, r: 170, w: 22, color: '#7ad0ff' }); X.slash(A.t.x, A.t.y, { a: .6, span: 1.6, r: 140, color: '#ffffff', ccw: true }); name(A, A.t, '鬼哭・斬擊', '#e8f6ff', '#1a5ab0'); impact(A, '#7ad0ff'); },
    async A => { SFX.play('buff'); const mx = (A.f.x + A.t.x) / 2, r = Math.abs(A.t.x - A.f.x) * .75 + 140; X.shield(mx, A.f.y, { r, edge: '#7ad0ff', life: 1.2 }); X.ring(mx, A.f.y, { r1: r, color: '#bfe8ff', w: 3, life: .8 });
      await wait(420); name(A, { x: mx, y: A.f.y }, 'ROOM', '#e8f6ff', '#1a5ab0', 70); await wait(240); },
    async A => { SFX.play('slash'); for (let i = 0; i < 5; i++) setTimeout(() => { X.beam(A.t.x - 160, A.t.y + R(-70, 50), A.t.x + 160, A.t.y + R(-70, 50), { w: 4, c1: '#ffffff', c2: '#7ad0ff', life: .22 }); SFX.play('hit'); }, i * 70);
      await wait(380); for (let i = 0; i < 6; i++) X.particles({ x: A.t.x + R(-60, 60), y: A.t.y + R(-60, 40), n: 4, spd: [60, 160], life: [.4, .7], size: [8, 14], colors: ['#bfe8ff', '#ffffff'], shape: 'spark' }); name(A, A.t, '切斷', '#e8f6ff', '#1a5ab0'); impact(A, '#7ad0ff'); },
    async A => { moveFighter(A.S, 'dash'); await wait(240); SFX.play('hit'); X.flash('#e8f6ff', .3, .2); for (let i = 0; i < 4; i++) X.bolt(A.t.x + R(-90, 90), A.t.y - 140, A.t.x + R(-20, 20), A.t.y + R(-20, 30), { color: '#bfe8ff', w: 6, life: .3 });
      X.glow(A.t.x, A.t.y, { color: '#7ad0ff', r: 160, life: .5 }); name(A, A.t, '反擊電擊', '#ffffff', '#1a5ab0'); impact(A, '#bfe8ff', true); }
  ];
  /* ---------- 衛伯：大薙刀 ---------- */
  const WEEVIL = [
    async A => { moveFighter(A.S, 'lunge'); SFX.play('whoosh'); await wait(220); X.slash(A.t.x, A.t.y + 20, { a: -3.1, span: 3, r: 230, w: 30, color: '#ffe070', life: .4 }); X.puffs(A.t.x, A.t.y + 70, { n: 10, rad: 160, life: .8, color: '#ffffff' }); name(A, A.t, '薙刀橫掃', '#ffffff', '#c9973a'); impact(A, '#ffe070'); },
    async A => { SFX.play('buff'); moveFighter(A.S, 'stomp'); X.glow(A.f.x, A.f.y, { color: '#ffcf5a', r: 240, life: 1, hold: true }); X.shield(A.f.x, A.f.y + 10, { r: 170, edge: '#ffe070', life: 1 }); X.text(A.f.x, A.f.y - 40, '咕啦啦！', { size: 40, color: '#ffffff', color2: '#c9973a', life: .8 }); await wait(560); name(A, A.f, '白鬍子的體魄', '#ffffff', '#c9973a'); },
    async A => { SFX.play('buff'); X.text(A.f.x + A.d * 60, A.f.y - 120, '「衛伯！」', { size: 44, color: '#ffe8f0', color2: '#c04a8a', rot: .05, life: .9 }); await wait(380); X.flames(A.f.x, A.f.y, { n: 50, jx: 70, colors: ['#ffe070', '#ff8a3a', '#ffffff'] }); X.ring(A.f.x, A.f.y, { r1: 220, color: '#ffcf5a', w: 8, life: .5 }); await wait(260); name(A, A.f, '老媽的命令', '#ffffff', '#c04a8a'); },
    async A => { SFX.play('ult'); moveFighter(A.S, 'stomp'); X.glow(A.f.x, A.f.y - 60, { color: '#ffe070', r: 180, life: .5 }); await wait(300); moveFighter(A.S, 'dash'); afterimage(A.S); await wait(200);
      SFX.play('heavy'); X.slash(A.t.x, A.t.y, { a: -1.9, span: 1.6, r: 320, w: 46, color: '#ffe070', life: .45 }); X.cracks(A.t.x, A.t.y + 60, { n: 12, len: 300, color: '#c9973a' }); X.puffs(A.t.x, A.t.y + 80, { n: 16, rad: 200, life: 1, color: '#e8dcc8' }); name(A, A.t, '大刀術', '#ffffff', '#c9973a', 66); impact(A, '#ffe070', true); }
  ];
  /* ---------- 巴基斯：冠軍摔角 ---------- */
  const rock = (x, y, tx, ty, d) => X.particles({ x, y, n: 1, spd: [Math.hypot(tx - x, ty - y) * 1.8, Math.hypot(tx - x, ty - y) * 1.9], ang: [Math.atan2(ty - y, tx - x) - .02, Math.atan2(ty - y, tx - x) + .02], life: [.5, .55], size: [18 + d, 26 + d], colors: ['#c8a070', '#8a6a3a'], g: 0 });
  const BURGESS = [
    async A => { const n = 5; moveFighter(A.S, 'stomp'); for (let i = 0; i < n; i++) setTimeout(() => { SFX.play('whoosh'); rock(A.f.x, A.f.y - 120, A.t.x + R(-40, 40), A.t.y + R(-40, 30), i * 2); }, i * 90);
      await wait(n * 90 + 380); SFX.play('heavy'); X.puffs(A.t.x, A.t.y + 60, { n: 14, rad: 170, life: 1, color: '#e8dcc8' }); X.particles({ x: A.t.x, y: A.t.y, n: 22, spd: [180, 420], ang: [-2.9, -.25], life: [.5, .9], size: [4, 10], colors: ['#8a7a6a', '#c8a070'], g: 900 }); name(A, A.t, '強力投擲', '#fff0d8', '#8a4a0a'); impact(A, '#e0a050', true); },
    async A => { SFX.play('buff'); moveFighter(A.S, 'stomp'); X.glow(A.f.x, A.f.y, { color: '#e0a050', r: 230, life: 1, hold: true }); for (let i = 0; i < 3; i++) setTimeout(() => X.ring(A.f.x, A.f.y, { r1: 200 + i * 40, color: '#ffcf5a', w: 6, life: .45 }), i * 140); await wait(520); name(A, A.f, '冠軍的肉體', '#fff0d8', '#8a4a0a'); },
    async A => { SFX.play('buff'); X.rays(A.f.x, A.f.y - 60, { r: 380, n: 18, c1: 'rgba(255,214,90,.9)' }); X.text(A.f.x, A.f.y - 30, '🏆', { size: 70, color: '#ffe070', color2: '#c9973a', rot: 0, life: .9 }); X.particles({ x: A.f.x, y: A.f.y + 60, n: 28, spd: [80, 200], ang: [-2, -1.1], life: [.7, 1.1], size: [3, 7], colors: ['#ffe070', '#ffffff'], shape: 'spark', add: true }); await wait(620); name(A, A.f, '冠軍金腰帶', '#fff0d8', '#c9973a'); },
    async A => { moveFighter(A.S, 'dash'); afterimage(A.S); await wait(260); SFX.play('heavy'); moveFighter(A.T, 'float'); await wait(200); SFX.play('explode'); X.cracks(A.t.x, A.t.y + 70, { n: 12, len: 260, color: '#8a5a2a' }); X.puffs(A.t.x, A.t.y + 80, { n: 18, rad: 200, life: 1.1, color: '#e8dcc8' }); name(A, A.t, '冠軍擒抱', '#fff0d8', '#8a4a0a', 60); impact(A, '#e0a050', true); }
  ];
  /* ---------- 斯巴可：酒與火 ---------- */
  const booze = (A, x, y, n) => X.particles({ x, y, n, spd: [180, 420], ang: A.d > 0 ? [-.5, .2] : [2.9, 3.6], life: [.5, .9], size: [5, 11], colors: ['#ffb030', '#ffe08a', '#fff4d0'], g: 300 });
  const VASCO = [
    async A => { SFX.play('whoosh'); booze(A, A.f.x + A.d * 50, A.f.y - 40, 50); X.puffs(A.t.x, A.t.y, { n: 16, rad: 180, life: 1.2, color: '#c8a070' }); await wait(420); X.ring(A.t.x, A.t.y, { r1: 180, color: '#ffb030', w: 5, life: .6 }); X.text(A.t.x, A.t.y - 60, '@', { size: 60, color: '#ffe08a', color2: '#8a5a2a', rot: 0, life: .7 }); name(A, A.t, '混沌酒水', '#fff4d0', '#8a4a0a'); },
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'float'); X.puffs(A.f.x, A.f.y + 60, { n: 12, rad: 120, life: .9, color: '#fff4d0' }); X.particles({ x: A.f.x, y: A.f.y + 40, n: 30, spd: [60, 180], ang: [-2.2, -.9], life: [.6, 1], size: [4, 9], colors: ['#ffe08a', '#ffffff'], shape: 'spark', add: true }); await wait(520); name(A, A.f, '酒精飛行', '#fff4d0', '#8a4a0a'); },
    async A => { SFX.play('whoosh'); booze(A, A.f.x + A.d * 50, A.f.y - 40, 40); await wait(260); for (let i = 0; i < 4; i++) setTimeout(() => { SFX.play('hit'); X.flames(A.t.x + R(-80, 80), A.t.y + R(-30, 40), { n: 26, jx: 50, colors: ['#ff7a2a', '#ffb030', '#ffe08a'] }); }, i * 110);
      await wait(480); SFX.play('explode'); name(A, A.t, '酒火', '#fff4d0', '#c84a0a'); impact(A, '#ff8a3a', true); },
    async A => { SFX.play('heal'); X.glow(A.f.x, A.f.y - 30, { color: '#ffb030', r: 200, life: 1, hold: true }); X.particles({ x: A.f.x, y: A.f.y - 140, n: 40, spd: [40, 120], ang: [1.2, 1.9], life: [.6, 1], size: [4, 8], colors: ['#ffb030', '#ffe08a'], g: 500 }); X.text(A.f.x + A.d * 70, A.f.y - 110, '咕嚕咕嚕', { size: 36, color: '#ffffff', color2: '#c86a0a', life: .9 }); await wait(620); name(A, A.f, '大口牛飲', '#fff4d0', '#8a4a0a'); }
  ];
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof CHOREO === 'undefined') return;
    const put = (id, arr) => { if (!CHARACTERS[id]) return; CHOREO[id] = CHOREO[id] || []; arr.forEach((fn, i) => { if (!CHOREO[id][i]) CHOREO[id][i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); };
    put('mihawk', MIHAWK('#1a1a2a', '#9ab0d8')); put('mihawk_w', MIHAWK('#6a0a1a', '#ff4a6a'));
    put('law_w', LAW); put('weevil', WEEVIL); put('burgess', BURGESS); put('vasco', VASCO);
    if (CHOREO.blackbeard && CHARACTERS.blackbeard_w) { CHOREO.blackbeard_w = CHOREO.blackbeard_w || []; for (let i = 0; i < 4; i++) if (!CHOREO.blackbeard_w[i] && CHOREO.blackbeard[i]) CHOREO.blackbeard_w[i] = CHOREO.blackbeard[i]; }
  });
})();
