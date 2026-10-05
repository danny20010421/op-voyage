/* v106 角色專屬特效（主題式）：還沒有專屬編排的角色，依「能力主題」＋「招式種類」組合出各自的動畫。
   主題決定顏色與造型（岩漿、冰、光、毒、肉球、絲線、影子、愛心……），種類決定動作（單擊、連擊、大招、強化、回復、削弱）。
   已有專屬編排的招式不會被覆蓋。載入順序：fx_v105.js 之後；頁面載入完成才註冊（角色擴充檔較晚載入）。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const P = (x, y, n, cols, o) => X.particles(Object.assign({ x, y, n, spd: [120, 360], life: [.35, .8], size: [3, 7], colors: cols, shape: 'spark', add: true, g: 300 }, o || {}));
  /* ---------- 能力主題：impact＝命中瞬間、aura＝自身氣場、travel＝飛向對手（沒有就衝刺） ---------- */
  const TH = {
    magma: { c: ['#ff3a1a', '#ffb03a'], impact: (A, b) => { X.flames(A.t.x, A.t.y, { n: b ? 90 : 50, jx: b ? 110 : 70, colors: ['#ff3a1a', '#ff8a2a', '#ffd26c'] }); if (b) X.pillar(A.t.x, A.t.y, { w: 140, color: '#ff3a1a', life: .8 }); X.cracks(A.t.x, A.t.y + 50, { n: b ? 10 : 6, len: b ? 260 : 160, color: '#ff6a2a' }); }, travel: async A => { X.wave(A.f.x, A.t.x + A.d * 80, A.t.y + 40, { color: '#ff4a1a', life: .5 }); await wait(300); } },
    ice: { c: ['#9fe6ff', '#3a8ad0'], impact: (A, b) => { X.spikes(A.t.x, A.t.y + 50, { color: '#bfefff', n: b ? 12 : 7 }); P(A.t.x, A.t.y, b ? 40 : 20, ['#ffffff', '#9fe6ff'], { g: 120 }); if (b) X.tint('#0a2a4a', .8, .3); }, travel: async A => { P(A.f.x + A.d * 40, A.f.y - 20, 30, ['#ffffff', '#9fe6ff'], { spd: [300, 600], ang: A.d > 0 ? [-.2, .2] : [2.94, 3.34], g: 0 }); await wait(320); } },
    light: { c: ['#ffe070', '#fffbe0'], impact: (A, b) => { X.rays(A.t.x, A.t.y, { r: b ? 320 : 200, n: b ? 18 : 10, c1: 'rgba(255,240,170,.9)' }); X.glow(A.t.x, A.t.y, { color: '#ffe070', r: b ? 200 : 130, life: .5 }); }, travel: async A => { for (let i = 0; i < 3; i++) X.beam(A.f.x + A.d * 30, A.f.y - 30 + i * 12, A.t.x, A.t.y + R(-20, 20), { w: 8, c1: '#ffffff', c2: '#ffe070', life: .28 }); await wait(200); } },
    poison: { c: ['#b05ad8', '#5a1a7a'], impact: (A, b) => { X.vortex(A.t.x, A.t.y, { r: b ? 170 : 110, color: '#9a3ad8', core: '#1a0020', rim: '#d08aff', arms: 5, spin: 8, life: .6 }); P(A.t.x, A.t.y, 24, ['#c58bff', '#5a1a7a'], { add: false, g: 500 }); }, travel: async A => { X.wave(A.f.x, A.t.x + A.d * 80, A.t.y + 40, { color: '#8a3ab8', life: .5 }); await wait(300); } },
    paw: { c: ['#9ad0ff', '#5a8ad0'], impact: (A, b) => { X.glow(A.t.x, A.t.y, { color: '#c8e8ff', r: b ? 200 : 130, life: .4 }); for (let i = 0; i < (b ? 3 : 2); i++) setTimeout(() => X.ring(A.t.x, A.t.y, { r1: 140 + i * 60, color: '#9ad0ff', w: 6, life: .35 }), i * 90); }, travel: async A => { X.glow(A.f.x + A.d * 70, A.f.y - 20, { color: '#9ad0ff', r: 90, life: .3 }); await wait(200); X.beam(A.f.x + A.d * 70, A.f.y - 20, A.t.x, A.t.y, { w: 14, c1: '#ffffff', c2: '#9ad0ff', life: .25 }); await wait(140); } },
    threads: { c: ['#ff5aa8', '#ffd0e8'], impact: (A, b) => { for (let i = 0; i < (b ? 10 : 5); i++) setTimeout(() => X.beam(A.t.x + R(-200, 200), -10, A.t.x + R(-40, 40), A.t.y + R(-50, 40), { w: 2, c1: '#ffffff', c2: '#ff5aa8', life: .3 }), i * 40); } },
    shadow: { c: ['#7a4ab8', '#1a0a2a'], impact: (A, b) => { X.vortex(A.t.x, A.t.y, { r: b ? 160 : 110, color: '#5a2a8a', core: '#05000a', rim: '#c58bff', arms: 6, spin: 10, life: .6 }); P(A.t.x, A.t.y - 40, b ? 18 : 10, ['#2a1a3a', '#7a4ab8'], { add: false, size: [6, 10], spd: [160, 320], g: -60 }); } },
    love: { c: ['#ff5a9a', '#ffb0d0'], impact: (A, b) => { X.text(A.t.x, A.t.y - 30, '♥', { size: b ? 110 : 70, color: '#ffd0e0', color2: '#ff3a8a', rot: 0, life: .6 }); P(A.t.x, A.t.y, b ? 36 : 18, ['#ff9ac2', '#ffffff'], { shape: 'petal', add: false }); }, travel: async A => { X.beam(A.f.x + A.d * 30, A.f.y - 30, A.t.x, A.t.y, { w: 10, c1: '#ffffff', c2: '#ff5a9a', life: .3 }); await wait(220); } },
    fire: { c: ['#ff7a1a', '#ffd26c'], impact: (A, b) => { X.flames(A.t.x, A.t.y, { n: b ? 80 : 44, jx: b ? 100 : 60, colors: ['#ff7a1a', '#ffb03a', '#fff0b0'] }); X.burst(A.t.x, A.t.y, { r: b ? 180 : 120, color: '#ff8a3a' }); }, travel: async A => { X.flames(A.f.x + A.d * 60, A.f.y - 20, { n: 30, jx: 40, colors: ['#ff7a1a', '#ffd26c'] }); X.beam(A.f.x + A.d * 50, A.f.y - 20, A.t.x, A.t.y, { w: 14, c1: '#fff0b0', c2: '#ff7a1a', life: .3 }); await wait(260); } },
    phoenix: { c: ['#5ad0ff', '#ffd26c'], impact: (A, b) => { X.flames(A.t.x, A.t.y, { n: b ? 70 : 40, jx: 80, colors: ['#5ad0ff', '#9fe6ff', '#ffd26c'] }); if (b) X.wings(A.t.x, A.t.y - 30, { color: '#5ad0ff', life: .7 }); } },
    quake: { c: ['#bfe8ff', '#3a7ac8'], impact: (A, b) => { for (let i = 0; i < (b ? 4 : 2); i++) setTimeout(() => X.ring(A.t.x, A.t.y, { r1: 180 + i * 70, color: i % 2 ? '#ffffff' : '#bfe8ff', w: 10, life: .4 }), i * 80); X.cracks(A.t.x, A.t.y, { n: b ? 12 : 7, len: b ? 300 : 180, color: '#ffffff' }); } },
    soul: { c: ['#ff8a3a', '#ffd26c'], impact: (A, b) => { X.vortex(A.t.x, A.t.y, { r: b ? 160 : 100, color: '#ff8a3a', core: '#3a0a00', rim: '#ffd26c', arms: 4, spin: 6, life: .6 }); X.flames(A.t.x, A.t.y, { n: 30, jx: 60, colors: ['#ff8a3a', '#ffd26c'] }); } },
    mochi: { c: ['#ffffff', '#c8a8e8'], impact: (A, b) => { X.puffs(A.t.x, A.t.y, { n: b ? 18 : 10, rad: b ? 180 : 120, life: .9, color: '#f4eefc' }); X.burst(A.t.x, A.t.y, { r: b ? 170 : 110, color: '#d8c8f0' }); } },
    beast: { c: ['#ffb0d0', '#c03a8a'], impact: (A, b) => { for (let i = 0; i < 3; i++) X.slash(A.t.x + (i - 1) * 26, A.t.y, { a: -2.2, span: 1.2, r: 120, w: 8, color: '#ffb0d0', life: .3 }); } },
    haki: { c: ['#ff3a3a', '#1a0a0a'], impact: (A, b) => { X.ring(A.t.x, A.t.y, { r1: b ? 260 : 170, color: '#1a0a0a', w: 14, life: .4 }); X.bolt(A.t.x - 80, A.t.y - 90, A.t.x + 80, A.t.y + 60, { color: '#ff3a3a', w: 5, life: .25 }); X.bolt(A.t.x + 80, A.t.y - 90, A.t.x - 60, A.t.y + 60, { color: '#ffffff', w: 3, life: .25 }); } },
    party: { c: ['#ff5a5a', '#ffd34a'], impact: (A, b) => { P(A.t.x, A.t.y, b ? 50 : 26, ['#ff5a5a', '#ffd34a', '#5ad0ff', '#9aff6a'], { shape: 'petal', add: false, g: 400 }); X.burst(A.t.x, A.t.y, { r: 120, color: '#ffd34a' }); } },
    wave: { c: ['#5ab0e0', '#e8f6ff'], impact: (A, b) => { X.puffs(A.t.x, A.t.y + 30, { n: b ? 16 : 8, rad: 150, life: .8, color: '#e8f6ff' }); P(A.t.x, A.t.y, 24, ['#ffffff', '#5ab0e0'], { add: false, g: 700 }); }, travel: async A => { X.wave(A.f.x, A.t.x + A.d * 120, A.t.y + 50, { color: '#5ab0e0', life: .6 }); await wait(330); } },
    ghost: { c: ['#e090d0', '#ffffff'], impact: (A, b) => { X.puffs(A.t.x, A.t.y, { n: b ? 14 : 8, rad: 130, life: 1, color: '#f0d8f0' }); X.text(A.t.x + R(-40, 40), A.t.y - 50, '👻', { size: b ? 70 : 50, color: '#ffffff', color2: '#b04a90', rot: 0, life: .6 }); } },
    toy: { c: ['#ff9ae0', '#ffd34a'], impact: (A, b) => { P(A.t.x, A.t.y, b ? 50 : 26, ['#ff9ae0', '#ffd34a', '#ffffff'], { g: 50 }); X.puffs(A.t.x, A.t.y, { n: 8, rad: 110, life: .8, color: '#ffe8f8' }); } },
    magnet: { c: ['#ff7a5a', '#c8322b'], impact: (A, b) => { for (let i = 0; i < (b ? 5 : 3); i++) X.bolt(A.t.x + R(-90, 90), A.t.y + R(-90, -30), A.t.x + R(-20, 20), A.t.y, { color: '#ff7a5a', w: 5, life: .25 }); P(A.t.x, A.t.y, 20, ['#8a8a9a', '#ff7a5a'], { add: false, g: 700, size: [4, 9] }); } },
    tech: { c: ['#ffd34a', '#5ad0ff'], impact: (A, b) => { X.glow(A.t.x, A.t.y, { color: '#5ad0ff', r: 140, life: .4 }); for (let i = 0; i < 3; i++) X.ring(A.t.x, A.t.y, { r1: 80 + i * 50, color: i % 2 ? '#ffd34a' : '#5ad0ff', w: 3, life: .35 }); }, travel: async A => { X.beam(A.f.x + A.d * 30, A.f.y - 30, A.t.x, A.t.y, { w: 12, c1: '#ffffff', c2: '#5ad0ff', life: .3 }); await wait(220); } },
    giant: { c: ['#d8b48a', '#8a6a3a'], impact: (A, b) => { X.cracks(A.t.x, A.t.y + 60, { n: b ? 12 : 8, len: b ? 300 : 200, color: '#8a6a3a' }); X.puffs(A.t.x, A.t.y + 70, { n: b ? 16 : 10, rad: 170, life: 1, color: '#e8dcc8' }); if (b) shake(); } },
    blade: { c: ['#ffffff', '#c9973a'], impact: (A, b) => { for (let i = 0; i < (b ? 3 : 2); i++) X.slash(A.t.x, A.t.y, { a: -2.6 + i * .9, span: 1.8, r: b ? 180 : 130, w: b ? 26 : 16, color: i % 2 ? '#ffffff' : '#c9973a', life: .32 }); } },
    fist: { c: ['#ffffff', '#3a6ab0'], impact: (A, b) => { X.burst(A.t.x, A.t.y, { r: b ? 200 : 130, color: '#ffffff' }); X.ring(A.t.x, A.t.y, { r1: b ? 260 : 170, color: '#3a6ab0', w: 8, life: .35 }); if (b) X.cracks(A.t.x, A.t.y + 40, { n: 8, len: 220 }); } },
    void: { c: ['#3a0a3a', '#ff3a5a'], impact: (A, b) => { X.vortex(A.t.x, A.t.y, { r: b ? 180 : 120, color: '#3a0a3a', core: '#000000', rim: '#ff3a5a', arms: 7, spin: 12, life: .7 }); X.tint('#0a0008', .6, b ? .4 : .25); } },
    heal: { c: ['#9dffb8', '#ffd26c'], impact: (A, b) => { X.glow(A.t.x, A.t.y, { color: '#9dffb8', r: 140, life: .5 }); } }
  };
  /* ---------- 角色 → 主題 ---------- */
  const WHO = { akainu: 'magma', aokiji: 'ice', monet: 'ice', brook: 'ice', kizaru: 'light', magellan: 'poison', kuma: 'paw', kuma_eh: 'paw', doflamingo: 'threads', moria: 'shadow', hancock: 'love', ace: 'fire', kinemon: 'fire', marco: 'phoenix', whitebeard: 'quake', bigmom: 'soul', katakuri: 'mochi', catarina: 'beast', shanks: 'haki', buggy: 'party', morgans: 'party', vivi: 'wave', jinbe: 'wave', lordcoast: 'wave', perona: 'ghost', sugar: 'toy', tama: 'toy', kid: 'magnet', vegapunk: 'tech', york: 'tech', franky: 'tech', dorry: 'giant', brogy: 'giant', imu: 'void', garp_mf: 'fist', garp_hc: 'fist', koby_mf: 'fist', koby_hc: 'fist', coby0: 'fist', morgan: 'blade', marine: 'fist', vergo: 'haki', law: 'blade', koza: 'fist', wiper: 'quake', mayor: 'heal', makino: 'heal' };
  /* ---------- 招式種類 ---------- */
  function kindOf(s) { const e = s.effect || {};
    if (s.type !== 'attack') { if (e.healRatio || e.healRange || e.fullHeal || e.regenTurns) return 'heal'; if (Object.keys(e).some(k => /^enemy|skipAttack|paralyze|fear|freeze|weak|clearBuffs|attackFail|nullify|randomPPDown/.test(k))) return 'hex'; return 'buff'; }
    if (e.multiHitNormal || e.fixedLightHitsRange || e.birdcageHits) return 'multi'; if (e.randomMultiplierRange || e.variableMultipliers || (s.power || 0) >= 150 || e.executeChance) return 'big'; return 'hit'; }
  const say = (A, at, n, th) => X.text(at.x, at.y - 160, n, { size: 52, color: '#ffffff', color2: th.c[1] === '#ffffff' ? th.c[0] : th.c[1] });
  function make(th, s) { const k = kindOf(s), n = s.name;
    return async A => {
      if (k === 'buff' || k === 'heal') { SFX.play(k === 'heal' ? 'heal' : 'buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y, { color: k === 'heal' ? '#9dffb8' : th.c[0], r: 220, life: .9, hold: true });
        P(A.f.x, A.f.y + 70, 26, [k === 'heal' ? '#9dffb8' : th.c[0], '#ffffff'], { spd: [80, 220], ang: [-1.95, -1.2], g: 0 }); X.ring(A.f.x, A.f.y + 60, { r1: 160, color: th.c[0], w: 5, life: .5 });
        if (k === 'buff') { const t = Object.assign({}, A, { t: A.f }); th.impact(t, false); } await wait(560); say(A, A.f, n, th); return; }
      if (k === 'hex') { SFX.play('dark'); X.ring(A.t.x, A.t.y, { r1: 200, color: th.c[0], w: 5, life: .6 }); await wait(160); th.impact(A, false); await wait(380); say(A, A.t, n, th); return; }
      const big = k === 'big';
      X.glow(A.f.x, A.f.y - 10, { color: th.c[0], r: big ? 170 : 110, life: .35 }); await wait(big ? 260 : 140);
      if (th.travel) await th.travel(A); else { moveFighter(A.S, big ? 'lunge' : 'dash'); afterimage(A.S); await wait(240); }
      if (k === 'multi') { for (let i = 0; i < 4; i++) { SFX.play(i % 2 ? 'hit' : 'punch'); const B = Object.assign({}, A, { t: { x: A.t.x + R(-50, 50), y: A.t.y + R(-50, 40) } }); th.impact(B, false); await wait(90); } }
      else { SFX.play(big ? 'explode' : 'punch'); th.impact(A, big); }
      X.flash('#ffffff', big ? .26 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 240 : 160, color: th.c[0], w: big ? 9 : 5, life: .32 }); if (big) shake();
      say(A, A.t, n, th); };
  }
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof CHOREO === 'undefined' || typeof X === 'undefined') return;
    Object.entries(WHO).forEach(([id, t]) => { const c = CHARACTERS[id], th = TH[t]; if (!c || !th) return; CHOREO[id] = CHOREO[id] || []; const last = c.skills.length >= 5 ? 4 : c.skills.length;
      c.skills.forEach((s, i) => { if (i >= last || CHOREO[id][i]) return; const fn = make(th, s); CHOREO[id][i] = async A => { try { FXE.ensure(); await fn(A); } catch (e) { console.warn(e); } }; }); });
  });
  window.FX_THEMES = { TH, WHO, kindOf };
})();
