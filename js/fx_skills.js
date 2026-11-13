/* v214：技能特效（原 fx_v*.js 等依載入順序合併；fx.js 為特效引擎本體）。合併前的檔案邊界以「==== 原 檔名 ====」標記。 */

/* ==== 原 js/fx_ult.js ==== */
/* 奧義（第 5 招）動畫補齊：還沒有專屬編排的角色，依能力類型套用主題動畫，並喊出招式名。
   載入順序：fx_choreo.js 之後。已經有專屬編排的角色不會被覆蓋。 */
(function () {
  const R = FXE.R;
  const say = (A, at, name, c1, c2, size) => X.text(at.x, at.y - 170, name, { size: size || 64, color: c1 || '#ffffff', color2: c2 || '#c9973a' });
  /* 主題動畫：A＝雙方座標，o＝顏色設定，n＝招式名 */
  const T = {
    /* 巨大化／變身：光柱、光環、煙霧 */
    giant: async (A, o, n) => { SFX.play('ult'); X.tint(o.bg || '#2a1a0a', 1.2, .35); moveFighter(A.S, 'float'); X.rays(A.f.x, A.f.y - 40, { r: 460, n: 22, c1: o.c1 }); X.puffs(A.f.x, A.f.y + 40, { n: 18, rad: 200, life: 1.3, color: o.smoke || '#ffffff' }); for (let i = 0; i < 3; i++) setTimeout(() => X.ring(A.f.x, A.f.y, { r1: 280, color: o.c1, w: 8, life: .7 }), i * 220); await sleep(650); say(A, A.f, n, o.t1, o.t2, 60); await sleep(350); if (o.hit) { moveFighter(A.S, 'dash'); await sleep(260); SFX.play('explode'); shake(); X.burst(A.t.x, A.t.y, { r: 200, color: o.c1 }); X.cracks(A.t.x, A.t.y + 40, { n: 10, len: 260, color: o.c2 }); } },
    /* 黑暗、影子、毒：漩渦吞噬 */
    dark: async (A, o, n) => { SFX.play('dark'); X.tint(o.bg || '#1a0820', 1.3, .45); X.vortex(A.t.x, A.t.y, { r: 170, color: o.c1, core: '#0a0010', rim: o.c2, arms: 6, spin: 10, life: 1 }); X.particles({ x: A.t.x, y: A.t.y, n: 50, spd: [60, 240], life: [.8, 1.3], size: [5, 10], colors: [o.c1, o.c2], shape: 'smoke', toward: { x: A.t.x, y: A.t.y }, pull: 5 }); await sleep(700); SFX.play('heavy'); shake(); X.flash(o.c2, .25, .6); X.ring(A.t.x, A.t.y, { r1: 300, color: o.c2, w: 12, life: .6 }); say(A, A.t, n, o.t1 || '#f0e0ff', o.t2 || o.c1); await sleep(250); },
    /* 踢擊／愛心：一道光束貫穿 */
    kick: async (A, o, n) => { SFX.play('ult'); X.tint(o.bg || '#3a0a20', 1, .3); X.particles({ x: A.f.x, y: A.f.y, n: 36, spd: [40, 160], life: [.8, 1.2], size: [8, 14], colors: [o.c1, o.c2, '#ffffff'], shape: 'petal' }); moveFighter(A.S, 'dash'); afterimage(A.S); await sleep(300); SFX.play('heavy'); X.beam(A.f.x, A.t.y - 10, A.t.x + A.d * 160, A.t.y - 10, { w: 30, c1: '#ffffff', c2: o.c1, life: .45 }); X.burst(A.t.x, A.t.y, { r: 170, color: o.c1 }); shake(); say(A, A.t, n, o.t1 || '#ffe8f2', o.t2 || o.c1); await sleep(300); },
    /* 領域：大圓頂＋連斬 */
    room: async (A, o, n) => { SFX.play('ult'); X.shield((A.f.x + A.t.x) / 2, A.f.y, { r: Math.abs(A.t.x - A.f.x) * .75 + 120, edge: o.c1, life: 1.4 }); await sleep(450); for (let i = 0; i < 6; i++) setTimeout(() => { SFX.play('slash'); X.slash(A.t.x + R(-40, 40), A.t.y + R(-50, 40), { a: R(-3, 3), span: 1.4, r: 120, color: o.c2, life: .25 }); }, i * 90); await sleep(560); say(A, A.t, n, o.t1 || '#e8f6ff', o.t2 || o.c1); },
    /* 劍豪：橫跨畫面的巨大斬擊 */
    sword: async (A, o, n) => { SFX.play('ult'); X.flash('#ffffff', .4, .9); X.tint(o.bg || '#0a0a14', 1, .4); moveFighter(A.S, 'dash'); afterimage(A.S); X.speedLines(A.t.x, A.t.y, { life: .6 }); await sleep(320); SFX.play('slash'); X.slash(A.t.x, A.t.y, { a: -.3, span: .7, r: 420, w: 60, color: o.c1, flat: .12, life: .6 }); X.slash(A.t.x, A.t.y, { a: -.3, span: .7, r: 380, w: 22, color: '#ffffff', flat: .12, life: .5 }); await sleep(160); X.cracks(A.t.x, A.t.y + 40, { n: 12, len: 320, color: o.c2 }); shake(); say(A, A.t, n, o.t1, o.t2 || o.c2, 66); await sleep(300); },
    /* 絲線：從天而降的線 */
    threads: async (A, o, n) => { SFX.play('ult'); X.tint('#2a0a2a', 1.2, .35); for (let i = 0; i < 14; i++) setTimeout(() => { X.beam(A.t.x + R(-260, 260), -20, A.t.x + R(-60, 60), A.t.y + R(-60, 40), { w: 3, c1: '#ffffff', c2: o.c1, life: .5 }); if (i % 3 === 0) SFX.play('slash'); }, i * 50); await sleep(720); X.ring(A.t.x, A.t.y, { r0: 320, r1: 40, color: o.c1, w: 6, life: .6 }); SFX.play('heavy'); shake(); say(A, A.t, n, '#ffe8f6', o.c1); await sleep(300); },
    /* 肉球：壓縮氣團後爆開 */
    paw: async (A, o, n) => { SFX.play('ult'); moveFighter(A.S, 'float'); X.glow(A.f.x + A.d * 60, A.f.y - 30, { color: o.c1, r: 160, life: .9, hold: true }); for (let i = 0; i < 3; i++) setTimeout(() => X.ring(A.f.x + A.d * 60, A.f.y - 30, { r0: 200, r1: 30, color: o.c1, w: 8, life: .4 }), i * 160); await sleep(650); SFX.play('explode'); X.flash('#ffffff', .3, .8); X.burst(A.t.x, A.t.y, { r: 240, color: o.c1 }); X.ring(A.t.x, A.t.y, { r1: 380, color: o.c2, w: 18, life: .7 }); shake(); say(A, A.t, n, o.t1 || '#e8f0ff', o.t2 || o.c2); await sleep(300); },
    /* 岩漿／火焰 */
    fire: async (A, o, n) => { SFX.play('ult'); X.tint(o.bg || '#3a0a00', 1.2, .4); X.flames(A.f.x, A.f.y, { n: 80, jx: 80, colors: [o.c1, o.c2, '#ffe0a0'] }); await sleep(380); moveFighter(A.S, 'lunge'); X.pillar(A.t.x, A.t.y, { w: 150, color: o.c1, life: .9 }); X.flames(A.t.x, A.t.y, { n: 90, jx: 110, colors: [o.c1, o.c2, '#ffd26c'] }); SFX.play('explode'); shake(); X.cracks(A.t.x, A.t.y + 50, { n: 10, len: 240, color: o.c2 }); say(A, A.t, n, o.t1 || '#fff0d8', o.t2 || o.c2); await sleep(450); },
    /* 光：無數光束射向對手 */
    light: async (A, o, n) => { SFX.play('ult'); X.flash('#fffbe0', .5, .9); X.rays(A.f.x, A.f.y - 40, { r: 520, n: 28, c1: 'rgba(255,240,170,.95)' }); await sleep(300); for (let i = 0; i < 12; i++) setTimeout(() => { X.beam(A.f.x + A.d * 30, A.f.y - 40 + R(-40, 40), A.t.x + R(-40, 40), A.t.y + R(-60, 50), { w: 8, c1: '#ffffff', c2: o.c1, life: .25 }); if (i % 3 === 0) SFX.play('hit'); }, i * 50); await sleep(650); X.burst(A.t.x, A.t.y, { r: 200, color: o.c1 }); shake(); say(A, A.t, n, '#fffbe8', o.c2 || '#c9973a'); await sleep(250); },
    /* 冰：整片結凍 */
    ice: async (A, o, n) => { SFX.play('ult'); X.tint('#0a2a4a', 1.3, .45); X.particles({ x: (A.f.x + A.t.x) / 2, y: A.t.y, n: 70, spd: [80, 260], life: [.9, 1.4], size: [4, 9], colors: ['#ffffff', o.c1, o.c2], shape: 'spark', add: true }); X.wave(A.f.x, A.t.x + A.d * 200, A.t.y + 60, { color: o.c1, life: .9 }); await sleep(500); X.spikes(A.t.x, A.t.y + 60, { color: o.c1, n: 9, life: 1 }); X.pillar(A.t.x, A.t.y, { w: 140, color: o.c2, life: .9 }); SFX.play('heavy'); shake(); say(A, A.t, n, '#e8faff', o.c2); await sleep(450); },
    /* 拳頭：霸氣重拳 */
    fist: async (A, o, n) => { SFX.play('ult'); moveFighter(A.S, 'dash'); afterimage(A.S); X.speedLines(A.t.x, A.t.y, { life: .5 }); await sleep(300); SFX.play('explode'); X.flash('#ffffff', .3, .8); X.arm(A.t.x - A.d * 160, A.t.y - 20, A.t.x, A.t.y - 10, { life: .3, skin: o.skin || '#2a2a3a', sleeve: o.c2, fist: 34 }); X.burst(A.t.x, A.t.y, { r: 230, color: o.c1 }); X.ring(A.t.x, A.t.y, { r1: 360, color: o.c1, w: 16, life: .6 }); X.cracks(A.t.x, A.t.y + 40, { n: 12, len: 300 }); shake(); say(A, A.t, n, '#ffffff', o.c2, 60); await sleep(350); },
    /* 震動：空氣裂開 */
    quake: async (A, o, n) => { SFX.play('ult'); X.flash('#ffffff', .45, .9); moveFighter(A.S, 'stomp'); for (let i = 0; i < 4; i++) setTimeout(() => { SFX.play('heavy'); X.ring(A.f.x + A.d * 80, A.f.y, { r1: 420, color: i % 2 ? '#ffffff' : o.c1, w: 12, life: .6 }); X.cracks((A.f.x + A.t.x) / 2 + R(-80, 80), A.f.y + R(-80, 40), { n: 10, len: 300, color: '#ffffff' }); shake(); }, i * 200); await sleep(900); say(A, A.f, n, '#ffffff', o.c2 || '#3a7ac8', 70); await sleep(300); },
    /* 鳥／獸：翅膀與火焰 */
    beast: async (A, o, n) => { SFX.play('ult'); X.tint(o.bg || '#0a1a3a', 1.1, .35); X.wings(A.f.x, A.f.y - 30, { color: o.c1, life: 1.2 }); X.flames(A.f.x, A.f.y, { n: 70, jx: 90, colors: [o.c1, o.c2, '#ffffff'] }); for (let i = 0; i < 3; i++) setTimeout(() => X.ring(A.f.x, A.f.y, { r1: 260, color: o.c1, life: .6 }), i * 200); await sleep(900); say(A, A.f, n, '#ffffff', o.c2); if (o.hit) { moveFighter(A.S, 'dash'); await sleep(260); SFX.play('explode'); X.claws(A.t.x, A.t.y, { color: o.c1 }); shake(); } await sleep(200); },
    /* 嘉年華：彩色紙花 */
    party: async (A, o, n) => { SFX.play('ult'); X.particles({ x: A.f.x, y: A.f.y - 60, n: 90, spd: [120, 360], ang: [-2.8, -.3], life: [1, 1.6], size: [6, 11], colors: ['#ff5a5a', '#ffd34a', '#5ad0ff', '#9aff6a', '#ff9ae0'], shape: 'petal', g: 260 }); for (let i = 0; i < 3; i++) setTimeout(() => { SFX.play('drum'); X.ring(A.f.x, A.f.y, { r1: 240, color: ['#ff5a5a', '#ffd34a', '#5ad0ff'][i], life: .6 }); }, i * 220); await sleep(700); say(A, A.f, n, '#ffffff', '#c8322b'); await sleep(300); },
    /* 治癒／守護 */
    heal: async (A, o, n) => { SFX.play('heal'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y, { color: o.c1, r: 260, life: 1.2, hold: true }); X.particles({ x: A.f.x, y: A.f.y + 60, n: 46, spd: [40, 150], ang: [-2.5, -.6], life: [.9, 1.3], size: [4, 9], colors: [o.c1, '#ffffff'], add: true }); for (let i = 0; i < 3; i++) setTimeout(() => X.ring(A.f.x, A.f.y, { r1: 220, color: o.c1, life: .6 }), i * 200); X.shield(A.f.x, A.f.y, { r: 170, edge: o.c2, life: 1.1 }); say(A, A.f, n, '#eafff0', o.c2); await sleep(1000); },
    /* 雷：落雷 */
    thunder: async (A, o, n) => { SFX.play('ult'); X.tint('#0a0a2a', 1.1, .45); for (let i = 0; i < 6; i++) setTimeout(() => { SFX.play('hit'); X.bolt(A.t.x + R(-80, 80), -20, A.t.x + R(-20, 20), A.t.y, { color: o.c1, w: 10, amp: 30, life: .3 }); }, i * 90); await sleep(620); X.flash('#ffffff', .4, .8); X.burst(A.t.x, A.t.y, { r: 200, color: o.c1 }); shake(); say(A, A.t, n, '#fffbe0', o.c2); await sleep(300); },
    /* 玩具化：粉紅光點包圍對手 */
    toy: async (A, o, n) => { SFX.play('buff'); X.particles({ x: A.t.x, y: A.t.y, n: 60, spd: [20, 120], life: [.9, 1.4], size: [4, 8], colors: ['#ff9ae0', '#ffd34a', '#ffffff'], shape: 'spark', add: true }); X.puffs(A.t.x, A.t.y, { n: 14, rad: 140, life: 1, color: '#ffd0f0' }); for (let i = 0; i < 3; i++) setTimeout(() => X.ring(A.t.x, A.t.y, { r0: 220, r1: 40, color: '#ff9ae0', life: .5 }), i * 200); await sleep(800); say(A, A.t, n, '#fff0fa', '#e05aa8'); await sleep(250); },
    /* 召喚：援軍登場 */
    call: async (A, o, n) => { SFX.play('buff'); [-1, 1].forEach(k => X.puffs(A.f.x + k * 120, A.f.y + 40, { n: 10, rad: 90, life: .9, color: '#ffffff' })); for (let i = 0; i < 2; i++) setTimeout(() => X.ring(A.f.x, A.f.y, { r1: 200, color: o.c1, life: .5 }), i * 200); await sleep(600); say(A, A.f, n, '#ffffff', o.c2); await sleep(250); }
  };
  /* 角色 → 主題與配色 */
  const ULT = {
    franky: ['giant', { c1: '#7ad0ff', c2: '#3a7ac8', t1: '#e8f6ff', t2: '#2a6ab0', hit: true }],
    moria: ['dark', { c1: '#7a4ab8', c2: '#c58bff' }], perona: ['dark', { c1: '#e090d0', c2: '#ffffff', t1: '#ffe8fa', t2: '#b04a90' }], imu: ['dark', { c1: '#3a0a3a', c2: '#ff3a5a', bg: '#0a0008', t1: '#ffe0e0', t2: '#8a0a1a' }], magellan: ['dark', { c1: '#8a1a3a', c2: '#c03a8a', t1: '#ffe0f0', t2: '#6a0a2a' }],
    hancock: ['kick', { c1: '#ff5a9a', c2: '#ffb0d0' }],
    law: ['room', { c1: '#7ad0ff', c2: '#e8f6ff', t2: '#2a6ab0' }],
    mihawk: ['sword', { c1: '#2a2a3a', c2: '#5a6a8a', t1: '#ffffff', t2: '#1a1a2a' }], shanks: ['sword', { c1: '#c8322b', c2: '#ff7a5a', t1: '#fff0e8', t2: '#8a0a0a' }],
    doflamingo: ['threads', { c1: '#ff5aa8', c2: '#c03a8a' }],
    kuma: ['paw', { c1: '#9ad0ff', c2: '#5a8ad0' }], kuma_eh: ['paw', { c1: '#c8e8ff', c2: '#ff5a5a', t2: '#8a0a0a' }],
    akainu: ['fire', { c1: '#ff3a1a', c2: '#ff8a2a', bg: '#3a0800' }], ace: ['fire', { c1: '#ff7a1a', c2: '#ffb03a' }], vegapunk: ['fire', { c1: '#ff9a3a', c2: '#ffd26c', bg: '#2a1a00', t2: '#c86a0a' }], bigmom: ['fire', { c1: '#ff4a3a', c2: '#ffd26c', bg: '#3a0a14', t2: '#c8322b' }],
    kizaru: ['light', { c1: '#ffe070', c2: '#c9973a' }],
    aokiji: ['ice', { c1: '#9fe6ff', c2: '#3a8ad0' }], monet: ['ice', { c1: '#e8f6ff', c2: '#7ab8e0' }],
    garp_mf: ['fist', { c1: '#ffffff', c2: '#3a6ab0' }], garp_hc: ['fist', { c1: '#9ad0ff', c2: '#2a4a8a' }], vergo: ['fist', { c1: '#3a3a5a', c2: '#5a3a8a' }], morgan: ['fist', { c1: '#c8c8d8', c2: '#3a6ab0', skin: '#8a8a9a' }], morgans: ['fist', { c1: '#ffe0a0', c2: '#8a6a3a', skin: '#f0d8a0' }], katakuri: ['fist', { c1: '#ffe8f0', c2: '#c03a6a', skin: '#e8d0c0' }],
    whitebeard: ['quake', { c1: '#bfe8ff', c2: '#3a7ac8' }],
    catarina: ['beast', { c1: '#ffb0d0', c2: '#c03a8a', bg: '#2a0a20', hit: true }], marco: ['beast', { c1: '#5ad0ff', c2: '#ffd26c' }], lordcoast: ['beast', { c1: '#3a8ab0', c2: '#9fe6ff', bg: '#04182a', hit: true }],
    buggy: ['party', {}],
    vivi: ['heal', { c1: '#7ad0ff', c2: '#2a8ab0' }], mayor: ['heal', { c1: '#ffd26c', c2: '#c9973a' }],
    kid: ['thunder', { c1: '#ff7a5a', c2: '#c8322b' }], york: ['thunder', { c1: '#ffd34a', c2: '#c9973a' }],
    sugar: ['toy', {}], marine: ['call', { c1: '#7ad0ff', c2: '#2a6ab0' }]
  };
  Object.entries(ULT).forEach(([id, [k, o]]) => {
    const c = CHARACTERS[id]; if (!c || !T[k]) return; const i = c.skills.length >= 5 ? 4 : c.skills.length - 1; CHOREO[id] = CHOREO[id] || [];
    if (CHOREO[id][i]) return; const name = c.skills[i].name;
    CHOREO[id][i] = async A => { try { await T[k](A, o, name); } catch (e) { console.warn(e); } };
  });
  window.ULT_FX = { T, ULT };

  /* ---------- 一般招式（第 1～4 招）：沒有專屬編排的角色，依招式動作（anima）播放對應特效並喊出招式名 ---------- */
  const TYPE_COL = { '火': ['#ff7a2a', '#ffd26c'], '冰': ['#9fe6ff', '#3a8ad0'], '雷電': ['#ffe070', '#c9973a'], '闇': ['#a05ad8', '#3a0a4a'], '水': ['#5ab0e0', '#e8f6ff'], '獸': ['#e0a060', '#8a5a2a'], '超能': ['#ff7ad9', '#7a3ab8'], '格鬥': ['#ffffff', '#c9973a'] };
  const colOf = id => { const c = CHARACTERS[id]; return (c && TYPE_COL[c.types[0]]) || ['#ffffff', '#c9973a']; };
  const tag = (A, at, n, c, sz) => X.text(at.x, at.y - 150, n, { size: sz || 50, color: '#ffffff', color2: c[1] });
  const hitFx = (A, c) => { X.burst(A.t.x, A.t.y, { r: 120, color: c[0] }); X.particles({ x: A.t.x, y: A.t.y, n: 14, spd: [120, 320], life: [.2, .45], size: [3, 6], colors: ['#ffffff', c[0]], shape: 'spark', add: true }); };
  const G = {
    punch: async (A, c, n) => { moveFighter(A.S, 'dash'); SFX.play('whoosh'); await sleep(260); SFX.play('punch'); hitFx(A, c); tag(A, A.t, n, c); },
    barrage: async (A, c, n) => { moveFighter(A.S, 'dash'); await sleep(240); for (let i = 0; i < 6; i++) setTimeout(() => { SFX.play(i % 2 ? 'hit' : 'punch'); X.burst(A.t.x + R(-40, 40), A.t.y + R(-50, 40), { r: 70, color: c[0], life: .2 }); }, i * 60); tag(A, A.t, n, c); await sleep(400); },
    shigan: async (A, c, n) => { moveFighter(A.S, 'dash'); afterimage(A.S); await sleep(240); for (let i = 0; i < 5; i++) setTimeout(() => { SFX.play('hit'); X.beam(A.t.x - A.d * 90, A.t.y + R(-50, 40), A.t.x + R(-20, 20), A.t.y + R(-50, 40), { w: 5, c1: '#ffffff', c2: c[0], life: .18 }); }, i * 55); tag(A, A.t, n, c); await sleep(330); },
    slash: async (A, c, n) => { moveFighter(A.S, 'dash'); SFX.play('whoosh'); await sleep(260); SFX.play('slash'); X.slash(A.t.x, A.t.y, { a: -2.4, span: 1.8, r: 130, color: c[0] }); X.slash(A.t.x, A.t.y, { a: .7, span: 1.8, r: 120, color: '#ffffff', ccw: true }); tag(A, A.t, n, c); },
    whip: async (A, c, n) => { moveFighter(A.S, 'stretch'); SFX.play('whoosh'); X.slash(A.t.x, A.t.y + 20, { r: 160, a: A.d > 0 ? -2.6 : -.6, span: 2.2, color: c[0], w: 14, life: .35 }); await sleep(220); SFX.play('hit'); hitFx(A, c); tag(A, A.t, n, c); },
    haki: async (A, c, n, sp) => { SFX.play(sp ? 'buff' : 'dark'); moveFighter(A.S, sp ? 'float' : 'lunge'); X.ring(A.f.x, A.f.y, { r1: 230, color: '#1a1a2a', w: 14, life: .5 }); X.ring(A.f.x, A.f.y, { r1: 200, color: c[0], w: 6, life: .5 }); if (!sp) { await sleep(260); X.flash('#000000', .25, .4); hitFx(A, c); tag(A, A.t, n, c); } else { tag(A, A.f, n, c); await sleep(600); } },
    dash: async (A, c, n) => { moveFighter(A.S, 'dash'); afterimage(A.S); X.speedLines(A.t.x, A.t.y, { life: .45 }); await sleep(260); SFX.play('heavy'); hitFx(A, c); tag(A, A.t, n, c); },
    bolt: async (A, c, n) => { SFX.play('hit'); for (let i = 0; i < 3; i++) setTimeout(() => X.bolt(A.f.x, A.f.y - 60, A.t.x + R(-30, 30), A.t.y + R(-40, 30), { color: c[0], w: 8, life: .25 }), i * 80); await sleep(300); hitFx(A, c); tag(A, A.t, n, c); },
    wave: async (A, c, n) => { SFX.play('whoosh'); X.wave(A.f.x, A.t.x + A.d * 120, A.t.y + 50, { color: c[0], life: .7 }); await sleep(380); SFX.play('heavy'); hitFx(A, c); tag(A, A.t, n, c); },
    dark: async (A, c, n) => { SFX.play('dark'); X.vortex(A.t.x, A.t.y, { r: 110, color: c[0], core: '#0a0010', rim: c[1], arms: 5, spin: 10, life: .6 }); await sleep(420); hitFx(A, c); tag(A, A.t, n, c); },
    voice: async (A, c, n) => { SFX.play('buff'); for (let i = 0; i < 3; i++) setTimeout(() => X.ring(A.f.x + A.d * 40, A.f.y - 20, { r1: 300, color: c[0], w: 6, life: .5 }), i * 120); await sleep(400); tag(A, A.t, n, c); },
    heal: async (A, c, n) => { SFX.play('heal'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y, { color: '#9dffb8', r: 200, life: .9, hold: true }); X.particles({ x: A.f.x, y: A.f.y + 50, n: 26, spd: [40, 130], ang: [-2.4, -.7], life: [.7, 1.1], size: [4, 8], colors: ['#9dffb8', '#ffffff'], add: true }); tag(A, A.f, n, ['#fff', '#2fae5a']); await sleep(750); },
    guard: async (A, c, n) => { SFX.play('buff'); moveFighter(A.S, 'float'); X.shield(A.f.x, A.f.y + 10, { r: 150, edge: c[0], life: 1 }); tag(A, A.f, n, c); await sleep(700); },
    quake: async (A, c, n) => { SFX.play('heavy'); moveFighter(A.S, 'stomp'); X.ring(A.f.x + A.d * 60, A.f.y, { r1: 320, color: '#ffffff', w: 10, life: .5 }); await sleep(260); X.cracks(A.t.x, A.t.y + 30, { n: 8, len: 220 }); shake(); hitFx(A, c); tag(A, A.t, n, c); },
    wings: async (A, c, n, sp) => { SFX.play('whoosh'); X.wings(A.f.x, A.f.y - 30, { color: c[0], life: .8 }); X.puffs(A.f.x, A.f.y + 30, { n: 10, rad: 120, life: .8, color: '#ffffff' }); if (!sp) { moveFighter(A.S, 'dash'); await sleep(280); hitFx(A, c); tag(A, A.t, n, c); } else { tag(A, A.f, n, c); await sleep(600); } },
    fire: async (A, c, n) => { SFX.play('whoosh'); X.flames(A.t.x, A.t.y, { n: 50, jx: 70, colors: ['#ff7a2a', '#ffd26c', c[0]] }); await sleep(380); SFX.play('explode'); X.burst(A.t.x, A.t.y, { r: 140, color: '#ff8a3a' }); tag(A, A.t, n, ['#fff', '#c84a0a']); },
    light: async (A, c, n) => { X.flash('#fffbe0', .25, .5); X.beam(A.f.x + A.d * 30, A.f.y - 30, A.t.x, A.t.y, { w: 12, c1: '#ffffff', c2: '#ffe070', life: .3 }); await sleep(220); SFX.play('hit'); hitFx(A, ['#ffe070', '#c9973a']); tag(A, A.t, n, ['#fff', '#c9973a']); },
    ice: async (A, c, n) => { SFX.play('whoosh'); X.particles({ x: A.t.x, y: A.t.y, n: 30, spd: [60, 200], life: [.6, 1], size: [4, 8], colors: ['#ffffff', '#9fe6ff'], shape: 'spark', add: true }); await sleep(300); X.spikes(A.t.x, A.t.y + 50, { color: '#9fe6ff', n: 6, life: .7 }); SFX.play('heavy'); tag(A, A.t, n, ['#fff', '#3a8ad0']); },
    storm: async (A, c, n) => { SFX.play('whoosh'); X.tornado(A.t.x, A.t.y, { color: c[0], life: .8 }); await sleep(450); hitFx(A, c); tag(A, A.t, n, c); },
    petals: async (A, c, n) => { SFX.play('buff'); X.particles({ x: A.t.x, y: A.t.y, n: 36, spd: [40, 160], life: [.7, 1.1], size: [6, 10], colors: ['#ff9ac2', '#ffffff', c[0]], shape: 'petal' }); await sleep(420); hitFx(A, c); tag(A, A.t, n, c); }
  };
  const ANIMA_FX = { punch: 'punch', barrage: 'barrage', shigan: 'shigan', onigiri: 'slash', sanzen: 'slash', shishi: 'slash', sandslash: 'slash', whip: 'whip', haki: 'haki', skywalk: 'dash', raimei: 'bolt', lightning: 'bolt', kaifu: 'wave', poseidon: 'wave', summonsea: 'wave', naraku: 'dark', darkpull: 'dark', darkcopy: 'dark', voice: 'voice', cook: 'heal', heal: 'heal', kagamiyama: 'guard', balloon: 'guard', quake: 'quake', wings: 'wings', karyu: 'fire', ifrit: 'fire', flash: 'light', icefang: 'ice', okuchi: 'ice', vortex: 'storm', shuryu: 'storm', petals: 'petals' };
  const _pc = playChoreo;
  window.playChoreo = async function (side, actor, idx, skill) {
    const src = skill && skill.copiedFrom ? skill.copiedFrom : { id: actor.id, idx };
    if ((src.idx >= 0 && CHOREO[src.id] && CHOREO[src.id][src.idx]) || !skill) return _pc.apply(this, arguments);
    const k = ANIMA_FX[skill.anima] || (skill.type === 'support' ? 'guard' : 'punch'), fn = G[k];
    FXE.ensure(); const S = side === 'P' ? 'L' : 'R', T2 = side === 'P' ? 'R' : 'L', A = { S, T: T2, f: fighterPoint(S), t: fighterPoint(T2), d: S === 'L' ? 1 : -1 };
    try { await fn(A, colOf(actor.id), skill.name, skill.type === 'support'); } catch (e) { console.warn(e); }
  };
  window.ANIMA_FX = ANIMA_FX;
})();

/* ==== 原 js/fx_v104.js ==== */
/* v104 技能動畫精緻化：
   1) 沒有專屬編排的招式：加上「蓄力 → 命中瞬間的衝擊幀 → 衝擊波與碎屑」三段，輔助招式加上上升光柱。
   2) 補上新角色與缺少的招式動作（巨人重擊、斬擊、燒傷、解放……）及奧義主題。
   3) 會換立繪的第 5 招（不死鳥、尼德霍格；之後有變身立繪的角色會自動套用）不播技能動畫，直接以變身演出切換立繪（在 battle.js 判斷）。
   載入順序：fx_ult.js 之後。 */
(function () {
  if (typeof window.playChoreo !== 'function' || !window.ANIMA_FX) return;
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const TYPE_COL = { '火': ['#ff7a2a', '#ffd26c'], '冰': ['#9fe6ff', '#3a8ad0'], '雷電': ['#ffe070', '#c9973a'], '闇': ['#a05ad8', '#3a0a4a'], '水': ['#5ab0e0', '#e8f6ff'], '獸': ['#e0a060', '#8a5a2a'], '超能': ['#ff7ad9', '#7a3ab8'], '格鬥': ['#ffffff', '#c9973a'], '自然': ['#8ad86a', '#3a8a2a'], '龍': ['#7a9aff', '#2a3aa8'], '魚人': ['#4fd6c8', '#1a6a8a'], '巨人': ['#d8b48a', '#8a6a3a'] };
  const colOf = id => { const c = CHARACTERS[id]; return (c && TYPE_COL[c.types[0]]) || ['#ffffff', '#c9973a']; };
  /* 缺少的招式動作對應 */
  Object.assign(ANIMA_FX, { release: 'dark', slash: 'slash', burn: 'fire', ashura: 'slash', judgment: 'bolt', beam: 'light', hammer: 'quake', world: 'quake', thunderfive: 'bolt', rokushiki: 'dash', tobishigan: 'shigan', snake: 'whip', limbs: 'barrage', gear2: 'dash', collier: 'punch', diable: 'fire', hakke: 'punch', narukabura: 'bolt', seaking: 'wave', dry: 'storm', sandtrap: 'storm', sandtriple: 'slash', sandstorm: 'storm', transform: 'haki', awaken: 'haki', revive: 'heal', demonflower: 'petals' });
  /* 新的專用動作：巨人重擊（從上方砸下） */
  const CUSTOM = {
    gigante: async (A, c, n) => { SFX.play('whoosh'); moveFighter(A.S, 'stomp'); X.glow(A.f.x, A.f.y - 40, { color: c[0], r: 150, life: .4 }); await wait(260);
      SFX.play('heavy'); X.flash('#ffffff', .22, .2); shake(); X.burst(A.t.x, A.t.y + 20, { r: 210, color: c[0] }); X.cracks(A.t.x, A.t.y + 60, { n: 9, len: 240, color: c[1] });
      X.puffs(A.t.x, A.t.y + 70, { n: 14, rad: 170, life: 1, color: '#e8dcc8' }); X.particles({ x: A.t.x, y: A.t.y + 40, n: 26, spd: [180, 460], ang: [-2.9, -.25], life: [.5, .9], size: [4, 9], colors: ['#8a7a6a', '#c8b89a', c[0]], g: 900 });
      X.text(A.t.x, A.t.y - 150, n, { size: 52, color: '#ffffff', color2: c[1] }); }
  };
  /* 精緻化外層 */
  const charge = async (A, c) => { X.glow(A.f.x, A.f.y - 10, { color: c[0], r: 120, life: .32 }); X.ring(A.f.x, A.f.y, { r1: 150, color: c[0], w: 4, life: .28 }); X.particles({ x: A.f.x, y: A.f.y + 40, n: 12, spd: [60, 160], ang: [-2.2, -.9], life: [.25, .45], size: [2, 5], colors: ['#ffffff', c[0]], shape: 'spark', add: true }); await wait(150); };
  const impact = (A, c, big) => { X.flash('#ffffff', big ? .24 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 240 : 170, color: c[0], w: big ? 9 : 6, life: .34 }); X.ring(A.t.x, A.t.y, { r1: big ? 150 : 110, color: '#ffffff', w: 3, life: .22 });
    X.particles({ x: A.t.x, y: A.t.y, n: big ? 26 : 16, spd: [180, 460], ang: [-3.1, .1], life: [.3, .7], size: [2, 6], colors: ['#ffffff', c[0], c[1]], shape: 'spark', add: true, g: 420 }); if (big) shake(); };
  const rise = (A, c) => { X.particles({ x: A.f.x, y: A.f.y + 70, n: 22, spd: [80, 200], ang: [-1.9, -1.25], life: [.6, 1], size: [3, 7], colors: ['#ffffff', c[0]], shape: 'spark', add: true }); X.ring(A.f.x, A.f.y + 60, { r1: 130, color: c[0], w: 4, life: .5 }); };
  const _pc = window.playChoreo;
  window.playChoreo = async function (side, actor, idx, skill) {
    const src = skill && skill.copiedFrom ? skill.copiedFrom : { id: actor.id, idx };
    const own = typeof CHOREO !== 'undefined' && src.idx >= 0 && CHOREO[src.id] && CHOREO[src.id][src.idx];
    if (own || !skill || skill.ultimate || typeof X === 'undefined' || typeof FXE === 'undefined') return _pc.apply(this, arguments);
    FXE.ensure(); const S = side === 'P' ? 'L' : 'R', T2 = side === 'P' ? 'R' : 'L', A = { S, T: T2, f: fighterPoint(S), t: fighterPoint(T2), d: S === 'L' ? 1 : -1 }, c = colOf(actor.id);
    const atk = skill.type === 'attack', big = atk && (skill.power >= 140 || (skill.effect && (skill.effect.randomMultiplierRange || skill.effect.multiHitNormal)));
    try {
      if (atk) await charge(A, c);
      if (CUSTOM[skill.anima]) await CUSTOM[skill.anima](A, c, skill.name); else await _pc.apply(this, arguments);
      if (atk) impact(A, c, big); else rise(A, c);
    } catch (e) { console.warn(e); }
  };
  /* 新角色與缺少的奧義主題（已有專屬編排的不覆蓋） */
  /* 角色擴充檔（roster_v89～v103）在這個檔案之後才載入，所以等頁面載入完成再套用 */
  window.addEventListener('DOMContentLoaded', () => { const U = window.ULT_FX; if (U) {
    const MORE = { law_w: ['room', { c1: '#4fb4ff', c2: '#e8f6ff', t2: '#1a5ab0' }], weevil: ['quake', { c1: '#ffe070', c2: '#c9973a' }], blackbeard_w: ['dark', { c1: '#7a3ab8', c2: '#c58bff', bg: '#0a0012' }],
      mihawk_w: ['sword', { c1: '#c8322b', c2: '#ff7a9a', t1: '#ffffff', t2: '#6a0a1a' }], burgess: ['giant', { c1: '#e0a050', c2: '#8a5a2a', t1: '#fff0d8', t2: '#8a4a0a', hit: true }], vasco: ['fire', { c1: '#ffb030', c2: '#ffe08a', bg: '#2a1400' }],
      dorry: ['giant', { c1: '#5a8aff', c2: '#c9973a', hit: true }], brogy: ['giant', { c1: '#ffcf5a', c2: '#c84a2a', hit: true }], brook: ['ice', { c1: '#c8e8ff', c2: '#5a8ad0' }], jinbe: ['fist', { c1: '#5ab0e0', c2: '#1a4a8a' }],
      coby0: ['fist', { c1: '#ffe070', c2: '#3a6ab0' }], koby_mf: ['fist', { c1: '#ffffff', c2: '#3a6ab0' }], koby_hc: ['fist', { c1: '#9ad0ff', c2: '#2a4a8a' }], makino: ['heal', { c1: '#ffd26c', c2: '#c9973a' }],
      koza: ['fist', { c1: '#e0a060', c2: '#8a5a2a' }], wiper: ['quake', { c1: '#ffe0a0', c2: '#c86a0a' }], kinemon: ['sword', { c1: '#ff7a2a', c2: '#ffd26c', t2: '#8a2a0a' }], tama: ['toy', {}], king: ['fire', { c1: '#ff5a1a', c2: '#ffe08a', bg: '#2a0800' }], luffy_nika: ['quake', { c1: '#ffffff', c2: '#ffe98a' }] };
    [U.ULT, MORE].forEach(MAP => Object.entries(MAP).forEach(([id, [k, o]]) => { const ch = CHARACTERS[id]; if (!ch || !U.T[k] || !ch.skills.length) return; const i = ch.skills.length >= 5 ? 4 : ch.skills.length - 1; CHOREO[id] = CHOREO[id] || [];
      if (CHOREO[id][i]) return; const name = ch.skills[i].name; CHOREO[id][i] = async A => { try { await U.T[k](A, o, name); } catch (e) { console.warn(e); } }; }));
  } });
  /* 變身招式判斷（battle.js 使用）：第 5 招本身會換立繪的，不播奧義過場與技能動畫 */
  window.isTransformSkill = s => !!(s && s.ultimate && s.effect && (s.effect.formImage || (s.effect.phoenixForm && s.effect.phoenixForm.image))); /* 只有真的會換立繪的才算（目前：洛基尼德霍格、馬爾科不死鳥）；尼卡覺醒沒有換立繪，維持奧義動畫 */
  /* 變身演出：光芒收束 → 立繪切換瞬間白光 → 光環擴散 */
  window.transformFx = async function (side, actor, skill, phase) {
    if (typeof X === 'undefined' || typeof FXE === 'undefined') return; FXE.ensure(); const S = side === 'P' ? 'L' : 'R', p = fighterPoint(S), c = colOf(actor.id);
    if (phase === 'before') { SFX.play('buff'); X.particles({ x: p.x, y: p.y, n: 40, spd: [-260, -90], life: [.5, .8], size: [3, 7], colors: ['#ffffff', c[0]], shape: 'spark', add: true }); X.glow(p.x, p.y - 20, { color: c[0], r: 220, life: .7, hold: true }); await wait(520); }
    else { SFX.play('ult'); X.flash('#ffffff', .55, .35); X.ring(p.x, p.y, { r1: 360, color: c[0], w: 10, life: .6 }); X.ring(p.x, p.y, { r1: 240, color: '#ffffff', w: 4, life: .45 }); X.particles({ x: p.x, y: p.y, n: 50, spd: [160, 420], life: [.5, 1], size: [3, 8], colors: ['#ffffff', c[0], c[1]], shape: 'spark', add: true }); await wait(420); }
  };
})();

/* ==== 原 js/fx_v105.js ==== */
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

/* ==== 原 js/fx_v115.js ==== */
/* v115 專屬技能動畫：燼（第 1～4 招）。奧義「火龍皇」用 fx_v104 的火焰奧義主題＋fx_v111 的標題字。
   載入順序：fx_v105.js 之後；角色擴充檔較晚載入，所以等頁面載入完成再註冊（會覆蓋主題式的預設編排）。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const FIRE = ['#ff4a1a', '#ff9a2a', '#ffe08a', '#ffffff'];
  const name = (at, n, sz) => X.text(at.x, at.y - 160, n, { size: sz || 54, color: '#fff4d0', color2: '#c8320a' });
  const sparks = (x, y, n) => X.particles({ x, y, n, spd: [160, 440], life: [.3, .7], size: [2, 6], colors: FIRE, shape: 'spark', add: true, g: 380 });
  const impact = (A, big) => { X.flash('#ffd8a0', big ? .28 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 260 : 170, color: '#ff7a2a', w: big ? 10 : 6, life: .34 }); sparks(A.t.x, A.t.y, big ? 34 : 18); if (big) shake(); };
  const KING = [
    /* 刃里双皇：燃燒的刀刃連斬 */
    async A => { moveFighter(A.S, 'dash'); afterimage(A.S); await wait(180);
      for (let i = 0; i < 6; i++) { SFX.play(i % 2 ? 'hit' : 'slash'); X.slash(A.t.x + R(-30, 30), A.t.y + R(-40, 30), { a: R(-3, -1.6), span: 2, r: 160, w: 16, color: i % 2 ? '#ffe08a' : '#ff5a1a', life: .3 });
        X.flames(A.t.x + R(-60, 60), A.t.y + R(-20, 40), { n: 16, jx: 40, colors: FIRE }); await wait(80); }
      name(A.t, '刃里双皇'); impact(A); },
    /* 丹弓皇：翼龍般的高速突進，火焰吸回自身 */
    async A => { SFX.play('whoosh'); X.wings(A.f.x, A.f.y - 30, { color: '#ff7a2a', life: .7 }); moveFighter(A.S, 'lunge'); afterimage(A.S); await wait(240);
      X.beam(A.f.x + A.d * 40, A.f.y - 30, A.t.x, A.t.y, { w: 22, c1: '#fff0c0', c2: '#ff5a1a', life: .35 }); SFX.play('heavy'); await wait(140);
      X.flames(A.t.x, A.t.y, { n: 50, jx: 70, colors: FIRE }); impact(A, true);
      X.particles({ x: A.t.x, y: A.t.y, n: 26, spd: [200, 420], ang: A.d > 0 ? [2.6, 3.7] : [-.5, .5], life: [.5, .8], size: [3, 6], colors: ['#9dffb8', '#ffe08a'], g: 0 });
      name(A.t, '丹弓皇'); },
    /* 貂自尊皇：火焰護身後引爆 */
    async A => { SFX.play('buff'); X.glow(A.f.x, A.f.y, { color: '#ff7a2a', r: 220, life: .7, hold: true }); X.flames(A.f.x, A.f.y + 40, { n: 40, jx: 70, colors: FIRE }); await wait(320);
      moveFighter(A.S, 'stomp'); X.beam(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y, { w: 12, c1: '#ffffff', c2: '#ff7a2a', life: .25 }); await wait(160);
      SFX.play('explode'); X.burst(A.t.x, A.t.y, { r: 240, color: '#ff8a3a' }); X.flames(A.t.x, A.t.y, { n: 80, jx: 110, colors: FIRE }); X.puffs(A.t.x, A.t.y + 40, { n: 14, rad: 200, life: 1, color: '#5a3a2a' });
      X.cracks(A.t.x, A.t.y + 50, { n: 9, len: 240, color: '#ff5a1a' }); name(A.t, '貂自尊皇', 60); impact(A, true); },
    /* 露娜莉亞族的驕傲：背上點燃白焰、火焰從身上流過 */
    async A => { SFX.play('heal'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 20, { color: '#ffb03a', r: 240, life: 1, hold: true });
      X.wings(A.f.x, A.f.y - 30, { color: '#ffd26c', life: 1 }); X.ring(A.f.x, A.f.y + 60, { r1: 170, color: '#ffe08a', w: 5, life: .6 });
      X.particles({ x: A.f.x, y: A.f.y + 80, n: 44, spd: [80, 220], ang: [-1.95, -1.2], life: [.6, 1], size: [3, 7], colors: ['#ffffff', '#ffe08a', '#9dffb8'], g: -60 });
      await wait(620); name(A.f, '露娜莉亞族的驕傲', 48); }
  ];
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof CHOREO === 'undefined' || !CHARACTERS.king) return;
    CHOREO.king = CHOREO.king || [];
    KING.forEach((fn, i) => { CHOREO.king[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; });
  });
})();

/* ==== 原 js/fx_v118.js ==== */
/* v118 專屬技能動畫：尼卡魯夫第 1～4 招（第 4 招「巨人」施放時立繪放大 3 倍）。奧義用 fx_v104 主題＋fx_v111 標題字。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const WH = ['#ffffff', '#f4ecff', '#ffe98a'];
  const name = (at, n, sz) => X.text(at.x, at.y - 160, n, { size: sz || 54, color: '#ffffff', color2: '#b58cff' });
  const impact = (A, big) => { X.flash('#ffffff', big ? .3 : .15, .16); X.ring(A.t.x, A.t.y, { r1: big ? 260 : 170, color: '#fff2a8', w: big ? 10 : 6, life: .34 }); X.particles({ x: A.t.x, y: A.t.y, n: big ? 36 : 18, spd: [160, 440], life: [.3, .7], size: [2, 6], colors: WH, shape: 'spark', add: true, g: 380 }); if (big) shake(); };
  const fighter = S => (typeof battle !== 'undefined' && battle) ? (S === 'L' ? battle.player : battle.enemy) : null;
  const NIKA = [
    async A => { moveFighter(A.S, 'dash'); for (let i = 0; i < 9; i++) { SFX.play(i % 2 ? 'hit' : 'whoosh'); X.burst(A.t.x + R(-70, 70), A.t.y + R(-60, 40), { r: R(50, 90), color: '#ffffff' }); X.puffs(A.t.x + R(-50, 50), A.t.y + R(-30, 30), { n: 6, rad: 80, life: .5, color: '#efe6ff' }); await wait(55); } name(A.t, '橡膠橡膠·火箭砲'); impact(A); },
    async A => { SFX.play('buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 60, { color: '#ffe04a', r: 200, life: .6, hold: true }); await wait(260);
      for (let i = 0; i < 3; i++) { X.bolt && X.bolt(A.t.x + R(-60, 60), A.t.y - 420, A.t.x + R(-20, 20), A.t.y, { color: '#fff7a0', w: 6, life: .35 }); SFX.play('hit'); await wait(90); } name(A.t, '橡膠橡膠·雷電'); impact(A, true); },
    async A => { SFX.play('heal'); for (let i = 0; i < 4; i++) { X.ring(A.f.x, A.f.y, { r1: 120 + i * 50, color: i % 2 ? '#ffe98a' : '#ffffff', w: 5, life: .5 }); SFX.play('hit'); await wait(130); }
      X.glow(A.f.x, A.f.y, { color: '#fff7c0', r: 240, life: .8, hold: true }); X.text(A.f.x + A.d * 80, A.f.y - 110, '咚咚咚咚', { size: 38, color: '#ffffff', color2: '#b58cff', life: .9 }); await wait(360); name(A.f, '解放之鼓', 52); },
    async A => { const f = fighter(A.S); const old = f ? (f.visMul || 1) : 1; SFX.play('ult');
      if (f && typeof applyVisual === 'function') { f.visMul = old * 3; applyVisual(f); }
      X.tint('#fff8e0', .25, .35); await wait(520); moveFighter(A.S, 'stomp'); SFX.play('heavy'); X.cracks(A.t.x, A.t.y + 60, { n: 12, len: 320, color: '#ffffff' }); X.puffs(A.t.x, A.t.y + 70, { n: 18, rad: 200, life: 1, color: '#f4ecff' }); name(A.t, '橡膠橡膠·巨人', 62); impact(A, true);
      await wait(520); if (f && typeof applyVisual === 'function') { f.visMul = old; applyVisual(f); } }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.luffy_nika) return; CHOREO.luffy_nika = CHOREO.luffy_nika || []; NIKA.forEach((fn, i) => { CHOREO.luffy_nika[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();

/* ==== 原 js/fx_v121.js ==== */
/* v121 專屬技能動畫：美音第 1～4 招（音符、五線譜、歌聲光環）。第 5 招「召喚魔王」是變身招式，由 fx_v104 的 transformFx 演出並換成魔王立繪。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const PK = ['#ff8ae0', '#ffd0f2', '#8fe8ff', '#ffe98a', '#ffffff'], NOTES = ['♪', '♫', '♬', '♩'];
  const name = (at, n, sz) => X.text(at.x, at.y - 160, n, { size: sz || 52, color: '#ffffff', color2: '#ff6ad5' });
  const note = (x, y, big) => X.text(x, y, NOTES[Math.floor(Math.random() * NOTES.length)], { size: big ? 54 : R(30, 44), color: PK[Math.floor(Math.random() * PK.length)], color2: '#7a2a8a', life: R(.5, .9) });
  const hit = (A, big) => { X.flash('#ffd0f2', big ? .28 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 240 : 160, color: '#ff8ae0', w: big ? 9 : 5, life: .34 }); X.particles({ x: A.t.x, y: A.t.y, n: big ? 34 : 16, spd: [150, 420], life: [.3, .7], size: [2, 6], colors: PK, shape: 'spark', add: true, g: 300 }); if (big && typeof shake === 'function') shake(); };
  const UTA = [
    /* 1 歌聲催眠：一圈圈粉紅歌聲波紋＋飄向對手的音符 */
    async A => { SFX.play('buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 60, { color: '#ff8ae0', r: 200, life: .7, hold: true });
      for (let i = 0; i < 5; i++) { X.ring(A.f.x + A.d * 40, A.f.y - 40, { r1: 120 + i * 60, color: i % 2 ? '#ff8ae0' : '#ffffff', w: 4, life: .6 }); note(A.f.x + A.d * R(40, 160), A.f.y - R(60, 160)); await wait(110); }
      for (let i = 0; i < 6; i++) { note(A.t.x + R(-90, 90), A.t.y - R(40, 180)); await wait(60); }
      X.tint && X.tint('#5a1a6a', .22, .4); X.text(A.t.x, A.t.y - 110, 'zzZ', { size: 44, color: '#ffd0f2', color2: '#7a2a8a', life: 1 }); name(A.t, '歌聲催眠'); },
    /* 2 五線譜束縛：五條譜線纏住對手，音符連續砸下並爆炸 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'dash');
      for (let i = 0; i < 5; i++) X.ring(A.t.x, A.t.y - 40 + i * 16, { r1: 150 - i * 6, color: '#ff8ae0', w: 3, life: .9 });
      await wait(220);
      for (let i = 0; i < 12; i++) { SFX.play(i % 3 ? 'hit' : 'whoosh'); const x = A.t.x + R(-80, 80), y = A.t.y + R(-80, 30); note(x, y - 40); X.burst(x, y, { r: R(40, 70), color: PK[i % PK.length] }); if (i % 4 === 3) X.puffs(x, y, { n: 8, rad: 90, life: .5, color: '#ffb0e8' }); await wait(50); }
      name(A.t, '五線譜束縛'); hit(A, true); },
    /* 3 具現化攻擊：音符化為實體連續攻擊 */
    async A => { SFX.play('buff'); X.glow(A.f.x, A.f.y, { color: '#8fe8ff', r: 160, life: .5, hold: true }); await wait(160);
      for (let i = 0; i < 8; i++) { SFX.play('hit'); const x = A.t.x + R(-70, 70), y = A.t.y + R(-70, 40); note(x, y, i === 7); X.burst(x, y, { r: R(36, 60), color: PK[i % PK.length] }); await wait(70); }
      name(A.t, '具現化攻擊'); hit(A); },
    /* 4 歌之世界：舞台光芒籠罩整個畫面，對手被拉進夢境 */
    async A => { SFX.play('ult'); X.tint && X.tint('#ffd0f2', .3, .5); X.glow(A.t.x, A.t.y - 40, { color: '#ff8ae0', r: 260, life: .9, hold: true });
      for (let i = 0; i < 14; i++) { note(R(A.t.x - 260, A.t.x + 260), R(A.t.y - 260, A.t.y + 40)); if (i % 3 === 0) X.ring(A.t.x, A.t.y - 40, { r1: 120 + i * 18, color: '#ffffff', w: 3, life: .5 }); await wait(55); }
      name(A.t, '歌之世界', 56); hit(A, true); }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.uta) return; CHOREO.uta = CHOREO.uta || []; UTA.forEach((fn, i) => { CHOREO.uta[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();

/* ==== 原 js/fx_v128.js ==== */
/* v128 凱多龍人型態的變身演出（ext_v128.js 在第 5 招演出結束後呼叫）：
   畫面暗下 → 紫、紅、藍的雷光連續劈在凱多身上 → 最後一道巨雷落下的瞬間換成龍人型態立繪 → 青色光環擴散。
   閃光強度保持適中（只在換圖那一下明顯）。swap() 負責真正換圖（kaidoDragonOn）。 */
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms)), R = (a, b) => a + Math.random() * (b - a);
  const COL = ['#c58bff', '#ff3a4a', '#8fd8ff', '#ffffff'];
  /* 全畫面圖層（見 css/v128.css）：放在 #battleScreen，不受戰場鏡頭縮放影響 */
  const layer = cls => { const scr = document.getElementById('battleScreen'); if (!scr) return null; let d = scr.querySelector('.' + cls); if (!d) { d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); scr.appendChild(d); } return d; };
  const flash = (a, d, c) => { const el = layer('kd-flash'); if (!el) return; el.style.setProperty('--a', a); el.style.setProperty('--d', d + 's'); el.style.setProperty('--c', c || '#fff'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
  window.kaidoDragonFx = async function (S, actor, swap) {
    const el = document.getElementById('bF' + S);
    if (typeof X === 'undefined' || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') { swap(); return; }
    let dim = null, swapped = false; const doSwap = () => { if (!swapped) { swapped = true; swap(); } };
    try {
    FXE.ensure(); const p = fighterPoint(S), top = p.y - 150;
    if (typeof SFX !== 'undefined') SFX.play('thunder');
    dim = layer('kd-dim'); if (dim) { void dim.offsetWidth; dim.classList.add('on'); }
    if (el) el.classList.add('morph-out');
    for (let i = 0; i < 7; i++) {
      const x = p.x + R(-120, 120);
      X.bolt(x + R(-60, 60), -20, p.x + R(-40, 40), top + R(-30, 80), { color: COL[i % 3], w: R(6, 11), life: .26, amp: 34 });
      if (i % 2 === 0) { flash(.12, .14, '#e8dcff'); if (typeof SFX !== 'undefined') SFX.play('zap'); }
      await wait(110);
    }
    if (typeof SFX !== 'undefined') SFX.play('thunder');
    X.bolt(p.x, -20, p.x, p.y, { color: '#ffffff', w: 16, life: .4, amp: 24 });
    X.bolt(p.x - 30, -20, p.x + 10, p.y - 40, { color: '#8fd8ff', w: 10, life: .4 });
    flash(.4, .35);
    if (typeof shake === 'function') shake();
    doSwap();
    if (el) { el.classList.remove('morph-out'); el.classList.add('morph-in'); setTimeout(() => el.classList.remove('morph-in'), 800); }
    X.ring(p.x, p.y, { r1: 380, color: '#8fd8ff', w: 10, life: .65 });
    X.ring(p.x, p.y, { r1: 250, color: '#c58bff', w: 5, life: .5 });
    X.particles({ x: p.x, y: p.y - 40, n: 46, spd: [160, 440], life: [.5, 1], size: [3, 8], colors: COL, shape: 'spark', add: true });
    X.text(p.x, p.y - 220, '龍人型態', { size: 62, color: '#e8f6ff', color2: '#3a5aff' });
    for (let i = 0; i < 3; i++) setTimeout(() => X.bolt(p.x + R(-20, 20), p.y - 80, p.x + R(-200, 200), p.y + R(-160, 40), { color: COL[i], w: 6, life: .22 }), 120 + i * 120);
    await wait(700);
    } finally { /* v130：演出中途出錯也一定恢復畫面亮度與立繪，並完成變身 */
      if (dim) dim.classList.remove('on'); if (el) el.classList.remove('morph-out'); doSwap();
    }
  };
})();

/* ==== 原 js/fx_v129.js ==== */
/* v129 洛克斯專屬技能動畫（深紅與黑色的霸氣雷光，配合立繪）。第 5 招是奧義：先播奧義過場，再由這裡演出。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const RED = ['#ff2a3a', '#ff6a5a', '#1a0006', '#ffffff', '#c8102a'];
  const name = (at, n, sz) => X.text(at.x, at.y - 170, n, { size: sz || 60, color: '#ffe8e8', color2: '#8a0010' });
  const bolts = (x, y, n, spread, life) => { for (let i = 0; i < n; i++) setTimeout(() => X.bolt(x + R(-spread, spread), y - R(120, 260), x + R(-30, 30), y + R(-40, 30), { color: i % 3 ? '#ff2a3a' : '#ffffff', w: R(5, 10), life: life || .22, amp: 26 }), i * 60); };
  const ROCKS = [
    /* 1 蝕：黑紅色的侵蝕直線貫穿一切 */
    async A => { SFX.play('dark'); X.tint && X.tint('#16000a', .9, .45); X.glow(A.f.x, A.f.y - 40, { color: '#ff2a3a', r: 180, life: .5, hold: true }); await wait(220);
      moveFighter(A.S, 'dash'); SFX.play('explode'); X.beam && X.beam(A.f.x + A.d * 40, A.f.y - 60, A.t.x, A.t.y - 20, { w: 36, c2: '#ff2a3a', life: .45 });
      X.bolt(A.f.x, A.f.y - 60, A.t.x, A.t.y, { color: '#ff2a3a', w: 12, amp: 18 }); X.cracks && X.cracks(A.t.x, A.t.y, { n: 8, color: '#ffb0b0' });
      X.particles({ x: A.t.x, y: A.t.y, n: 26, spd: [160, 420], life: [.3, .7], size: [2, 6], colors: RED, shape: 'spark', add: true }); name(A.t, '蝕'); await wait(260); },
    /* 2 瞬：身影一閃，殘影與黑紅雷光 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'float'); for (let i = 0; i < 4; i++) { X.ring(A.f.x, A.f.y - 40, { r1: 90 + i * 50, color: i % 2 ? '#ff2a3a' : '#ffffff', w: 4, life: .4 }); await wait(70); }
      bolts(A.f.x, A.f.y, 5, 90, .2); X.glow(A.f.x, A.f.y - 40, { color: '#ffffff', r: 160, life: .4 }); name(A.f, '瞬'); await wait(320); },
    /* 3 殺：畫面一黑，一道紅色斬擊 */
    async A => { SFX.play('ult'); X.tint && X.tint('#000000', 1.1, .7); await wait(260); moveFighter(A.S, 'dash'); SFX.play('slash');
      X.slash && X.slash(A.t.x, A.t.y, { a: -.6, span: 2.8, r: 170, w: 40, color: '#ff2a3a', life: .45 });
      bolts(A.t.x, A.t.y, 6, 120, .24); X.flash('#ff2a3a', .2, .25); if (typeof shake === 'function') shake(); name(A.t, '殺', 84); await wait(360); },
    /* 4 蓄：黑色漩渦把傷害吸進身體 */
    async A => { SFX.play('dark'); X.vortex && X.vortex(A.f.x, A.f.y - 30, { r: 150, color: '#3a0010', core: '#000', rim: '#ff2a3a', arms: 6, spin: 4, life: .9 });
      for (let i = 0; i < 10; i++) { X.particles({ x: A.f.x + R(-160, 160), y: A.f.y + R(-180, 40), n: 2, spd: [40, 120], life: [.4, .7], size: [2, 5], colors: RED, shape: 'spark', add: true }); await wait(40); }
      name(A.f, '蓄'); await wait(240); },
    /* 5 戴維的秘密：雷光從天而降，全身纏繞霸氣 */
    async A => { SFX.play('thunder'); X.tint && X.tint('#12000a', 1.6, .6); bolts(A.f.x, A.f.y, 10, 160, .26); await wait(420);
      SFX.play('ult'); X.ring(A.f.x, A.f.y, { r1: 360, color: '#ff2a3a', w: 10, life: .6 }); X.ring(A.f.x, A.f.y, { r1: 220, color: '#ffffff', w: 4, life: .45 });
      X.particles({ x: A.f.x, y: A.f.y - 40, n: 50, spd: [160, 440], life: [.5, 1], size: [3, 8], colors: RED, shape: 'spark', add: true }); name(A.f, '戴維的秘密', 56); await wait(420); }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.rocks) return; CHOREO.rocks = CHOREO.rocks || []; ROCKS.forEach((fn, i) => { CHOREO.rocks[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();

/* ==== 原 js/fx_v130.js ==== */
/* v130 補上缺少的第 5 招奧義動畫（巡檢時發現沒有專屬動畫的奧義）：
   荷帝·瓊斯「ES 能量鋼彈」——吞下禁藥 ES，血管暴起、紅色的鯊魚之氣捲上全身。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const ADD = {
    /* 哥爾·D·羅傑「神避」（洛克斯挑戰的敵人）：霸王色的紅黑斬擊劈開天地 */
    roger: [, , , , async A => {
      SFX.play('ult'); X.tint && X.tint('#14000a', 1.4, .55); X.glow(A.f.x, A.f.y - 40, { color: '#ff3a3a', r: 220, life: .7, hold: true }); await wait(320);
      moveFighter(A.S, 'dash'); SFX.play('slash');
      for (let i = 0; i < 3; i++) { X.slash && X.slash(A.t.x, A.t.y, { a: -1 + i * .5, span: 3, r: 160 + i * 30, w: 36 - i * 8, color: i % 2 ? '#ffffff' : '#ff2a3a', life: .45 }); await wait(90); }
      for (let i = 0; i < 6; i++) setTimeout(() => X.bolt(A.t.x + R(-160, 160), A.t.y - R(160, 280), A.t.x + R(-30, 30), A.t.y + R(-30, 30), { color: i % 2 ? '#ff2a3a' : '#1a0006', w: 8, life: .22 }), i * 60);
      X.flash('#ff2a3a', .2, .2); if (typeof shake === 'function') shake(); X.text(A.t.x, A.t.y - 170, '神避', { size: 72, color: '#fff0f0', color2: '#8a0010' }); await wait(460);
    }],
    hody: [, , , , async A => {
      SFX.play('buff'); X.tint && X.tint('#2a0008', 1.5, .5); moveFighter(A.S, 'float');
      for (let i = 0; i < 6; i++) { X.particles({ x: A.f.x + R(-30, 30), y: A.f.y - R(60, 140), n: 3, spd: [40, 120], life: [.4, .7], size: [4, 8], colors: ['#ff3a5a', '#ffd0d8', '#ffffff'], shape: 'spark', add: true }); await wait(70); }
      X.text(A.f.x, A.f.y - 180, 'E S', { size: 54, color: '#ffffff', color2: '#c8102a', life: .8 });
      SFX.play('ult'); for (let i = 0; i < 5; i++) { X.ring(A.f.x, A.f.y - 30, { r1: 120 + i * 55, color: i % 2 ? '#ff3a5a' : '#3f8fe8', w: 6, life: .5 }); await wait(80); }
      X.serpent && X.serpent(A.f.x - A.d * 200, A.f.y + 60, A.f.x + A.d * 160, A.f.y - 120, { body: '#3f6fa8', belly: '#e8f2f8', eye: '#ff3a3a', life: 1 });
      X.glow(A.f.x, A.f.y - 30, { color: '#ff3a5a', r: 240, life: 1, hold: true });
      X.particles({ x: A.f.x, y: A.f.y - 30, n: 44, spd: [160, 420], life: [.5, 1], size: [3, 8], colors: ['#ff3a5a', '#3f8fe8', '#ffffff'], shape: 'spark', add: true });
      if (typeof shake === 'function') shake(); X.text(A.f.x, A.f.y - 210, 'ES 能量鋼彈', { size: 56, color: '#ffe8ec', color2: '#8a0a1a' }); await wait(520);
    }]
  };
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined') return;
    Object.entries(ADD).forEach(([id, L]) => { if (!CHARACTERS[id]) return; CHOREO[id] = CHOREO[id] || []; L.forEach((fn, i) => { if (fn && !CHOREO[id][i]) CHOREO[id][i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); }); });
})();

/* ==== 原 js/fx_v142.js ==== */
/* v142 娜美五招專屬動畫：天候棒的雷雲、蜃氣樓分身、小貓竊賊、雷光槍、雷雲「宙斯」。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), wait = ms => new Promise(r => setTimeout(r, ms));
  const Y = ['#ffffff', '#fff3a0', '#ffd23a', '#8fd8ff'], B = ['#ffffff', '#cfefff', '#7fc8ff', '#3a7ad8'];
  const name = (at, n, sz) => X.text(at.x, at.y - 170, n, { size: sz || 52, color: '#ffffff', color2: '#e8781a' });
  const cloud = (x, y, big) => { X.puffs && X.puffs(x, y, { n: big ? 14 : 8, rad: big ? 150 : 90, life: big ? 1.1 : .8, color: '#e8f0ff' }); X.puffs && X.puffs(x, y + 10, { n: big ? 8 : 4, rad: big ? 110 : 60, life: big ? 1 : .7, color: '#9aa8c0' }); };
  const zap = (x, y, ty, w, col) => X.bolt(x, y, x + R(-30, 30), ty, { color: col || '#fff3a0', w: w || 6, life: .26 });
  const hit = (A, big) => { X.flash('#fffbd0', big ? .3 : .14, .16); X.ring(A.t.x, A.t.y, { r1: big ? 260 : 160, color: '#ffd23a', w: big ? 10 : 5, life: .34 }); X.particles({ x: A.t.x, y: A.t.y, n: big ? 40 : 18, spd: [150, 460], life: [.3, .7], size: [2, 6], colors: Y, shape: 'spark', add: true, g: 260 }); if (big && typeof shake === 'function') shake(); };
  const NAMI = [
    /* 1 雷擊節奏：天候棒點出小雷雲，落雷劈下 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'dash'); cloud(A.t.x, A.t.y - 200); await wait(260);
      for (let i = 0; i < 3; i++) { SFX.play('hit'); zap(A.t.x + R(-40, 40), A.t.y - 200, A.t.y, i === 2 ? 9 : 6); await wait(90); }
      name(A.t, '雷擊節奏'); hit(A); X.text(A.f.x, A.f.y - 150, '速度 ↑', { size: 30, color: '#fff3a0', color2: '#2a6ad8', life: .7 }); },
    /* 2 蜃氣樓節奏：熱氣與冷氣扭曲空氣，出現好幾個分身 */
    async A => { SFX.play('buff'); moveFighter(A.S, 'float'); X.glow(A.f.x, A.f.y - 50, { color: '#ffb0d8', r: 200, life: .8, hold: true });
      for (let i = 0; i < 5; i++) { X.ring(A.f.x, A.f.y - 40, { r1: 90 + i * 50, color: i % 2 ? '#ff9ac0' : '#8fd8ff', w: 3, life: .55 }); await wait(80); }
      for (let i = 0; i < 4; i++) X.text(A.f.x + (i - 1.5) * 90, A.f.y - R(20, 90), '✦', { size: 46, color: '#ffffff', color2: '#ff7ab0', life: .8 });
      X.text(A.f.x, A.f.y - 190, '蜃氣樓節奏', { size: 48, color: '#ffffff', color2: '#d8509a' }); await wait(380); },
    /* 3 小貓竊賊：一閃而過，從對手身上摸走東西 */
    async A => { SFX.play('whoosh'); moveFighter(A.S, 'dash'); X.particles({ x: A.f.x, y: A.f.y - 30, n: 18, spd: [200, 420], life: [.2, .4], size: [2, 4], colors: ['#ffb24a', '#ffffff'], shape: 'spark', add: true }); await wait(160);
      X.burst(A.t.x, A.t.y - 30, { r: 70, color: '#ffb24a' }); SFX.play('hit');
      for (let i = 0; i < 6; i++) { X.text(A.t.x + R(-50, 50), A.t.y - R(40, 120), i % 2 ? '฿' : '★', { size: R(26, 40), color: '#ffe27a', color2: '#8a5a00', life: .7 }); await wait(45); }
      name(A.t, '小貓竊賊'); X.text(A.f.x, A.f.y - 150, '偷到了！', { size: 34, color: '#ffe27a', color2: '#8a3a00', life: .9 }); },
    /* 4 雷光槍節奏：雷電凝成長槍直直刺穿 */
    async A => { SFX.play('buff'); X.glow(A.f.x + A.d * 40, A.f.y - 40, { color: '#fff3a0', r: 140, life: .4, hold: true }); await wait(200);
      SFX.play('slash'); for (let i = 0; i < 3; i++) X.bolt(A.f.x + A.d * 40, A.f.y - 40 + i * 6, A.t.x + A.d * 40, A.t.y - 30 + i * 6, { color: i === 1 ? '#ffffff' : '#ffd23a', w: 12 - i * 3, life: .3 });
      await wait(120); name(A.t, '雷光槍節奏'); hit(A, true); },
    /* 5 宙斯・微風節奏：巨大雷雲「宙斯」籠罩戰場，整片雷電砸下 */
    async A => {
      SFX.play('ult'); X.tint && X.tint('#0a1028', 1.3, .6); moveFighter(A.S, 'float');
      cloud(A.t.x, A.t.y - 230, true); cloud(A.t.x - 180, A.t.y - 210, true); cloud(A.t.x + 180, A.t.y - 210, true);
      X.text(A.t.x, A.t.y - 300, '宙斯！', { size: 44, color: '#ffffff', color2: '#2a4a8a', life: .9 }); await wait(520);
      for (let i = 0; i < 14; i++) { SFX.play(i % 3 ? 'hit' : 'slash'); zap(A.t.x + R(-200, 200), A.t.y - 230, A.t.y + R(-20, 20), R(6, 12), i % 4 ? '#fff3a0' : '#8fd8ff'); if (i % 4 === 0) X.flash('#fffbd0', .18, .1); await wait(55); }
      X.bolt(A.t.x, -40, A.t.x, A.t.y, { color: '#ffffff', w: 26, life: .5 }); X.bolt(A.t.x, -40, A.t.x, A.t.y, { color: '#ffd23a', w: 44, life: .5 });
      hit(A, true); X.glow(A.t.x, A.t.y, { color: '#ffd23a', r: 320, life: .8, hold: true });
      X.text(A.t.x, A.t.y - 200, '宙斯・微風節奏', { size: 62, color: '#fffbe0', color2: '#c8700a' }); await wait(560);
    }
  ];
  window.addEventListener('DOMContentLoaded', () => { if (typeof CHOREO === 'undefined' || !CHARACTERS.nami) return; CHOREO.nami = CHOREO.nami || []; NAMI.forEach((fn, i) => { CHOREO.nami[i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; }); });
})();

/* ==== 原 js/fx_v106.js ==== */
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

/* ==== 原 js/fx_v171.js ==== */
/* v171 招式差異化（使用者 11/07 13:48「變化可能有點太少，要再添加一些差異性」）：
   v106 主題式編排讓 45 位角色的四招幾乎長一樣（同主題同衝擊，只差招式名）。這裡改寫這些「主題式」招式（不動專屬編排）：
   ① 出手方式：依招式名稱關鍵字（斬、拳、砲、腳、雷、龍、雨……）決定，沒有關鍵字就依「角色＋招式序號」輪替
      衝刺、飛彈、躍擊、地面衝擊波、天降、瞬移六種，同一角色的四招不會重複。
   ② 命中排列：單點、三連錯位、十字交叉、縱向貫穿輪替。
   ③ 招牌元素：關鍵字對應的額外元素（斬痕、拳風環、光束、新月踢、落雷、火柱、冰刺、龍捲、龍、花瓣、羽翼、流星雨、浪、地裂、影渦、光芒、鎖環……）。
   ④ 主色：單數招與雙數招互換主題的主色／副色，同角色的招式一眼就分得出來。
   ⑤ 輔助／削弱：光柱、法陣、環繞光點、護盾四種輪替；削弱有鎖環、落下的印記、黑渦三種。
   ‧ 等待全部用 sleep（跟倍速）。粒子數在手機乘 0.6。不改傷害結算時機（編排結束＝命中）。
   ‧ 載入順序：fx_v106.js 之後（同樣在 DOMContentLoaded 註冊，排在後面所以會覆蓋 v106 產生的編排）。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const wait = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(r => setTimeout(r, ms)));
  const LOW = typeof LOWFX !== 'undefined' && LOWFX, N = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const KW = [[/斬|刀|劍|剣|居合|一閃|太刀|鬼/, 'slash'], [/砲|炮|光線|射擊|彈|弾|銃|槍|ガン|加農/, 'shot'], [/腳|脚|蹴|踢|腿|ジャンブ/, 'kick'], [/雷|電|鳴|霆/, 'bolt'],
    [/炎|火|焰|焼|燒|熱|爆/, 'fire'], [/冰|凍|雪|氷|霜/, 'ice'], [/風|嵐|旋|竜巻|龍捲|颶/, 'wind'], [/龍|竜|蛇|大蛇/, 'dragon'], [/花|櫻|桜|薔薇|蓮/, 'petal'], [/鳥|翼|羽|鷹|鳳/, 'wing'],
    [/雨|流星|星|隕/, 'rain'], [/波|浪|海|水|潮/, 'wave'], [/地|震|岩|山|碎|崩|裂|大地/, 'quake'], [/影|闇|黑|暗|夜/, 'shadow'], [/光|輝|陽|日/, 'light'], [/毒|腐/, 'poison'],
    [/指|突|刺|針|穿/, 'pierce'], [/連|亂|千|百|萬|無數|機關/, 'multi'], [/鎖|縛|絲|線|網|鏈/, 'bind'], [/拳|打|撃|擊|鐵|錘|掌|頭/, 'fist']];
  const kwOf = n => { for (const [re, k] of KW) if (re.test(n || '')) return k; return null; };
  const APPROACH = ['dash', 'shot', 'leap', 'ground', 'sky', 'blink'];
  const BY_KW = { shot: 'shot', pierce: 'shot', bolt: 'sky', rain: 'sky', kick: 'leap', quake: 'ground', wave: 'ground', dragon: 'shot', wind: 'ground', slash: 'blink', light: 'sky' };
  const LAYOUT = ['single', 'triple', 'cross', 'pierce'];
  const X = () => FXE.P;
  const groundY = A => A.t.y + 70;

  /* ---------- 小型自製元素（不用 shadowBlur，便宜） ---------- */
  function orb(x1, y1, x2, y2, col, life, size) { const s = size || 26; return FXE.add({ add: true, life: life || .32, draw(c, k) { const e = k < 1 ? 1 - Math.pow(1 - k, 2) : 1;
    for (let j = 4; j >= 0; j--) { const q = Math.max(0, e - j * .06), x = x1 + (x2 - x1) * q, y = y1 + (y2 - y1) * q - Math.sin(q * Math.PI) * 30, r = s * (1 - j * .16), g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.35, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = j ? .35 : 1; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } } }); }
  function rune(x, y, col, r, life, flat) { const n = 12, f = flat || .32; return FXE.add({ add: true, life: life || .9, draw(c, k, dt, t) { const a = Math.min(1, k * 4) * (1 - Math.max(0, k - .7) / .3), rr = r * (0.6 + .4 * Math.min(1, k * 3));
    c.translate(x, y); c.scale(1, f); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, rr * .72, 0, TAU); c.stroke();
    c.rotate(t * 1.8); for (let i = 0; i < n; i++) { const q = i / n * TAU; c.save(); c.rotate(q); c.fillStyle = i % 3 ? col : '#ffffff'; c.fillRect(rr * .76, -3, rr * .2, 6); c.restore(); }
    c.rotate(-t * 3.2); c.beginPath(); for (let i = 0; i < 6; i++) { const q = i / 6 * TAU; c.lineTo(Math.cos(q) * rr * .62, Math.sin(q) * rr * .62); } c.closePath(); c.stroke(); } }); }
  function orbit(x, y, col, life) { const ps = []; for (let i = 0; i < N(10); i++) ps.push({ a: i / 10 * TAU, r: R(90, 140), s: R(4, 8), h: R(-60, 40) });
    return FXE.add({ add: true, life: life || 1, draw(c, k, dt, t) { ps.forEach(p => { const a = p.a + t * 5, px = x + Math.cos(a) * p.r, py = y + p.h + Math.sin(a) * p.r * .3, front = Math.sin(a) > 0; c.globalAlpha = (front ? 1 : .45) * (1 - k * .8);
      const g = c.createRadialGradient(px, py, 0, px, py, p.s * 2.4); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, py, p.s * 2.4, 0, TAU); c.fill(); }); } }); }
  function dome(x, y, col, life) { return FXE.add({ add: true, life: life || .9, draw(c, k) { const e = 1 - Math.pow(1 - Math.min(1, k * 2.5), 3), r = 150 * e; c.globalAlpha = (1 - Math.max(0, k - .6) / .4) * .8;
    const g = c.createRadialGradient(x, y, r * .6, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.85, col); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.ellipse(x, y, r, r * .3, 0, 0, Math.PI); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.globalAlpha *= .7; for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(x, y, r, r * i / 4, 0, Math.PI, 0); c.stroke(); } } }); }
  function sigil(x, y, col) { return FXE.add({ add: true, life: .7, draw(c, k) { const yy = y - 220 + 220 * Math.min(1, k * 2.2), a = k < .45 ? 1 : 1 - (k - .45) / .55; c.globalAlpha = a; c.translate(x, yy); c.scale(1, .5); c.strokeStyle = col; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.stroke(); c.beginPath(); for (let i = 0; i < 5; i++) { const q = -Math.PI / 2 + i * 4 * Math.PI / 5; c.lineTo(Math.cos(q) * 64, Math.sin(q) * 64); } c.closePath(); c.stroke(); } }); }
  function chains(x, y, col) { return FXE.add({ life: .8, draw(c, k) { const a = k < .7 ? 1 : (1 - k) / .3; c.globalAlpha = a; c.lineWidth = 3; for (let j = 0; j < 3; j++) { const ang = j * TAU / 3 + k * 1.2; c.save(); c.translate(x, y); c.scale(1, .45); c.rotate(ang);
    for (let i = 0; i < 14; i++) { const q = i / 14 * Math.PI * 1.2 * Math.min(1, k * 3); c.strokeStyle = i % 2 ? '#d8d8e8' : col; c.beginPath(); c.ellipse(Math.cos(q) * 120, Math.sin(q) * 120, 10, 6, q + Math.PI / 2, 0, TAU); c.stroke(); } c.restore(); } } }); }

  /* ---------- 招牌元素 ---------- */
  const SIG = {
    slash: (A, c, b) => { for (let i = 0; i < (b ? 3 : 2); i++) X().slash(A.t.x, A.t.y, { a: -2.5 + i * 1.1, span: 1.9, r: b ? 190 : 140, w: b ? 22 : 14, color: i % 2 ? '#ffffff' : c[0], life: .3 }); },
    shot: (A, c, b) => X().beam(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y - 10, { w: b ? 34 : 20, c1: '#ffffff', c2: c[0], life: .35 }),
    pierce: (A, c) => { for (let i = 0; i < 3; i++) X().beam(A.t.x - A.d * 200, A.t.y - 30 + i * 30, A.t.x + A.d * 60, A.t.y - 20 + i * 24, { w: 6, c1: '#ffffff', c2: c[0], life: .22 }); },
    kick: (A, c) => X().crescent(A.f.x + A.d * 40, A.f.y + 20, A.t.x, A.t.y - 30, { color: c[0], size: 80, life: .38 }),
    bolt: (A, c, b) => { for (let i = 0; i < (b ? 4 : 2); i++) setTimeout(() => X().bolt(A.t.x + R(-60, 60), -20, A.t.x + R(-20, 20), A.t.y, { color: i % 2 ? '#ffffff' : c[0], w: 6, life: .25 }), i * 70); },
    fire: (A, c, b) => X().pillar(A.t.x, A.t.y, { w: b ? 120 : 80, color: c[0], life: .6 }),
    ice: (A, c, b) => X().spikes(A.t.x, groundY(A) - 20, { color: '#dff6ff', n: b ? 11 : 7 }),
    wind: (A, c) => X().tornado(A.t.x, groundY(A), { smoke: c[1] === '#ffffff' ? '#e8f0ff' : c[1], h: 260, w: 110, life: .9 }),
    dragon: (A, c, b) => X().serpent(A.f.x, A.f.y + 30, A.t.x + A.d * 60, A.t.y - 30, { body: c[0], belly: '#ffffff', eye: '#ffef5a', horn: true, life: b ? 1 : .75, len: b ? 460 : 340, w: b ? 54 : 40 }),
    petal: (A, c, b) => X().particles({ x: A.t.x, y: A.t.y - 60, n: N(b ? 40 : 24), spd: [80, 260], life: [.7, 1.2], size: [6, 12], colors: ['#ffd0e8', '#ffffff', c[0]], shape: 'petal', g: 60, add: false }),
    wing: (A, c) => X().wings(A.t.x, A.t.y - 30, { color: c[0], life: .6 }),
    rain: (A, c, b) => { for (let i = 0; i < N(b ? 10 : 6); i++) setTimeout(() => X().beam(A.t.x + R(-160, 160) - A.d * 120, -30, A.t.x + R(-80, 80), A.t.y + R(-30, 50), { w: 5, c1: '#ffffff', c2: c[0], life: .22 }), i * 45); },
    wave: (A, c) => X().wave(A.f.x, A.t.x + A.d * 40, groundY(A), { color: c[0], h: 150, life: .6 }),
    quake: (A, c, b) => { X().cracks(A.t.x, groundY(A) - 10, { n: b ? 12 : 8, len: b ? 280 : 190, color: c[1] }); X().puffs(A.t.x, groundY(A), { n: N(10), rad: 150, life: .8, color: '#e8dcc8' }); },
    shadow: (A, c) => X().vortex(A.t.x, A.t.y, { r: 120, color: c[1], core: '#05000a', rim: c[0], arms: 5, spin: 9, life: .55 }),
    light: (A, c, b) => X().rays(A.t.x, A.t.y, { r: b ? 300 : 210, n: b ? 16 : 10, c1: 'rgba(255,245,200,.9)' }),
    poison: (A, c) => X().puffs(A.t.x, A.t.y, { n: N(12), rad: 130, life: .9, color: '#c88aff' }),
    multi: (A, c) => { for (let i = 0; i < 5; i++) setTimeout(() => X().burst(A.t.x + R(-60, 60), A.t.y + R(-60, 40), { r: 60, color: i % 2 ? '#ffffff' : c[0] }), i * 55); },
    bind: (A, c) => chains(A.t.x, A.t.y, c[0]),
    fist: (A, c, b) => { X().ring(A.t.x, A.t.y, { r1: b ? 260 : 180, color: '#ffffff', w: 6, life: .3 }); X().speedLines(A.t.x, A.t.y, { life: .25, a: .5, n: 30 }); }
  };

  /* ---------- 出手方式 ---------- */
  const GO = {
    dash: async (A, c, th) => { moveFighter(A.S, 'dash'); await wait(260); },
    shot: async (A, c, th) => { moveFighter(A.S, 'recoil'); orb(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y - 10, c[0], .3, 28); await wait(280); },
    leap: async (A, c, th) => { moveFighter(A.S, 'leap'); await wait(380); },
    ground: async (A, c, th) => { moveFighter(A.S, 'stomp'); await wait(160); const n = 5; for (let i = 0; i < n; i++) { const q = (i + 1) / n, x = A.f.x + (A.t.x - A.f.x) * q;
      setTimeout(() => { X().burst(x, groundY(A) - 10, { r: 50 + q * 40, color: c[i % 2] }); X().cracks && i === n - 1 && X().cracks(x, groundY(A) - 10, { n: 5, len: 120, color: c[1] }); }, i * 55); } await wait(n * 55 + 40); },
    sky: async (A, c, th) => { moveFighter(A.S, 'float'); X().glow(A.t.x, A.t.y - 220, { color: c[0], r: 110, life: .45 }); await wait(240); X().beam(A.t.x, -40, A.t.x, A.t.y + 20, { w: 30, c1: '#ffffff', c2: c[0], life: .3 }); await wait(80); },
    blink: async (A, c, th) => { X().glow(A.f.x, A.f.y, { color: c[0], r: 120, life: .25 }); moveFighter(A.S, 'dash'); await wait(120); X().speedLines(A.t.x, A.t.y, { life: .22, a: .6, n: 36 }); await wait(140); }
  };
  async function layout(kind, A, th, big) { const at = (dx, dy) => Object.assign({}, A, { t: { x: A.t.x + dx, y: A.t.y + dy } });
    if (kind === 'triple') { for (let i = 0; i < 3; i++) { SFX.play(i === 2 ? 'explode' : 'hit'); th.impact(at((i - 1) * 46, (i % 2 ? -36 : 24)), big && i === 2); await wait(85); } }
    else if (kind === 'cross') { th.impact(A, big); X().slash(A.t.x, A.t.y, { a: -2.36, span: .1, r: 170, w: 10, color: '#ffffff', life: .26 }); X().slash(A.t.x, A.t.y, { a: -.78, span: .1, r: 170, w: 10, color: th.c[0], life: .26 }); }
    else if (kind === 'pierce') { th.impact(A, big); X().beam(A.t.x - A.d * 160, A.t.y, A.t.x + A.d * 220, A.t.y, { w: big ? 26 : 16, c1: '#ffffff', c2: th.c[0], life: .26 }); }
    else th.impact(A, big); }

  const say = (A, at, n, c) => X().text(at.x, at.y - 160, n, { size: 52, color: '#ffffff', color2: c[1] === '#ffffff' ? c[0] : c[1] });

  function make(id, i, th, s, kindOf) {
    const k = kindOf(s), n = s.name, kw = kwOf(n), h = hash(id), sw = i % 2 === 1, c = sw ? [th.c[1], th.c[0]] : th.c.slice();
    if (c[0] === '#ffffff' || c[0] === '#fffbe0') c.reverse();
    const T = Object.assign({}, th, { c });
    const ap = (kw && BY_KW[kw]) || APPROACH[(i + h) % APPROACH.length], lay = LAYOUT[(i + (h >> 3)) % LAYOUT.length], sig = SIG[kw] || null;
    return async A => {
      FXE.ensure();
      if (k === 'buff' || k === 'heal') { const col = k === 'heal' ? '#9dffb8' : c[0], v = (i + h) % 4; SFX.play(k === 'heal' ? 'heal' : 'buff'); moveFighter(A.S, 'float');
        if (v === 0) X().pillar(A.f.x, A.f.y, { w: 90, color: col, life: .8 }); else if (v === 1) rune(A.f.x, A.f.y + 60, col, 150, .9); else if (v === 2) orbit(A.f.x, A.f.y, col, 1); else dome(A.f.x, A.f.y + 60, col, .9);
        X().particles({ x: A.f.x, y: A.f.y + 70, n: N(18), spd: [80, 220], ang: [-1.95, -1.2], life: [.5, .9], size: [3, 7], colors: [col, '#ffffff'], shape: 'spark', add: true, g: 0 });
        if (k === 'buff') { th.impact(Object.assign({}, A, { t: A.f }), false); if (sig) try { sig(Object.assign({}, A, { t: A.f }), c, false); } catch (e) { } }
        await wait(520); say(A, A.f, n, c); return; }
      if (k === 'hex') { SFX.play('dark'); const v = (i + h) % 3; if (v === 0) chains(A.t.x, A.t.y, c[0]); else if (v === 1) sigil(A.t.x, A.t.y, c[0]); else X().vortex(A.t.x, A.t.y, { r: 130, color: c[1], core: '#05000a', rim: c[0], arms: 5, spin: 8, life: .6 });
        await wait(200); th.impact(A, false); if (sig) try { sig(A, c, false); } catch (e) { } await wait(320); say(A, A.t, n, c); return; }
      const big = k === 'big';
      X().glow(A.f.x, A.f.y - 10, { color: c[0], r: big ? 170 : 110, life: .35 }); if (big) rune(A.f.x, A.f.y + 60, c[0], 130, .6); await wait(big ? 240 : 120);
      await GO[ap](A, c, T);
      if (k === 'multi') { for (let j = 0; j < 4; j++) { SFX.play(j % 2 ? 'hit' : 'punch'); const B = Object.assign({}, A, { t: { x: A.t.x + R(-50, 50), y: A.t.y + R(-50, 40) } }); th.impact(B, false); await wait(80); } }
      else { SFX.play(big ? 'explode' : 'punch'); await layout(lay, A, T, big); }
      if (sig) try { sig(A, c, big); } catch (e) { }
      X().flash('#ffffff', big ? .22 : .12, .14); X().ring(A.t.x, A.t.y, { r1: big ? 240 : 160, color: c[0], w: big ? 9 : 5, life: .32 }); if (big && typeof shake === 'function') shake();
      say(A, A.t, n, c); };
  }

  window.addEventListener('DOMContentLoaded', () => {
    const T = window.FX_THEMES; if (!T || typeof CHOREO === 'undefined') return; let cnt = 0;
    Object.entries(T.WHO).forEach(([id, t]) => { const ch = CHARACTERS[id], th = T.TH[t]; if (!ch || !th || !CHOREO[id]) return;
      ch.skills.forEach((s, i) => { const f = CHOREO[id][i]; if (!f || s.ultimate || !/FXE\.ensure\(\); await fn\(A\)/.test(f.toString())) return; const fn = make(id, i, th, s, T.kindOf);
        CHOREO[id][i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; CHOREO[id][i].__v171 = 1; cnt++; }); });
    window.FX171 = { count: cnt, kwOf, make };
  });
})();

/* v171 自動畫質：技能特效播放中實際量測幀率，連續偏低就自動降級（不跳提示）：
   第 1 級 3D 特效解析度降到手機 0.75／電腦 1；第 2 級關閉 3D 特效層（泛光與 2D 特效保留）。
   降級記在 sessionStorage，本次開遊戲有效；重新開啟會重新判斷（設定頁的「技能特效／畫質」仍是使用者的選擇，不會被改）。 */
(function () {
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  let tier = 0; try { tier = +sessionStorage.getItem('op_fxauto') || 0; } catch (e) { }
  function apply() { window.__fx3dDpr = tier >= 1 ? (MOB ? .75 : 1) : 0; window.__fxAuto3DOff = tier >= 2; }
  apply();
  let active = 0, raf = 0, last = 0, buf = [];
  function loop(t) { raf = 0; const dt = t - last; last = t; if (dt > 0 && dt < 1000) buf.push(dt);
    if (buf.length >= 40) { const s = buf.slice().sort((a, b) => a - b), med = s[s.length >> 1]; buf = [];
      if (med > 42 && tier < 2) { tier++; apply(); try { sessionStorage.setItem('op_fxauto', tier); } catch (e) { } window.dispatchEvent(new CustomEvent('fxauto', { detail: tier })); } }
    if (performance.now() - active < 400) raf = requestAnimationFrame(loop); else buf = []; }
  function kick() { active = performance.now(); if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  window.addEventListener('DOMContentLoaded', () => { if (!window.FXE) return; const _a = FXE.add; FXE.add = function () { kick(); return _a.apply(this, arguments); }; });
  window.FXAUTO = { get tier() { return tier; }, reset() { tier = 0; apply(); try { sessionStorage.removeItem('op_fxauto'); } catch (e) { } } };
})();

/* ==== 原 js/fx_v111.js ==== */
/* v111 奧義過場：不顯示立繪，改為「標題字＋副標」的特效字（參考遊戲招式標題設計）。
   每位角色有自己的配色風格（PRESET）與副標（SUB）；沒有設定的依屬性自動挑選。
   會換立繪的奧義（不死鳥、尼德霍格）在變身演出時也顯示同樣的標題字。載入順序：fx_v105／v106 之後。 */
(function () {
  const PRESET = { /* 字的漸層 f1→f3、三層描邊（外→內）、光暈、背景特效 */
    blaze:     { f: ['#ffffff', '#ffe14a', '#ff8a00'], s: ['#2a0000', '#d40000', '#ffd0a0'], g: '#ff6a00', fx: ['orb', 'flare', 'embers'] },
    crimson:   { f: ['#7a0000', '#3a0000', '#120000'], s: ['#000000', '#ff2a2a', '#ffffff'], g: '#ff1a1a', fx: ['ring', 'flare'] },
    goldflame: { f: ['#fffbd0', '#ffc400', '#ff6a00'], s: ['#000000', '#b31200', '#ffe9a0'], g: '#ff8a00', fx: ['swirl', 'embers'] },
    prism:     { f: ['#ff7ad9', '#7a8aff', '#5af0ff'], s: ['#14002a', '#ffffff', '#ffd0ff'], g: '#5aa0ff', fx: ['xflare', 'sparks'] },
    magma:     { f: ['#fff6a0', '#ffb000', '#ff4a00'], s: ['#2a0030', '#c42d00', '#ffe0a0'], g: '#ff3a00', fx: ['orb', 'cracks', 'embers'] },
    scorch:    { f: ['#ffe9a0', '#ff8a2a', '#c42000'], s: ['#000000', '#6a0000', '#ffb070'], g: '#ff5a1a', fx: ['embers', 'flare'] },
    abyss:     { f: ['#f0ffd8', '#4bff2a', '#0a8a00'], s: ['#000000', '#0a3a00', '#c8ffb0'], g: '#3aff3a', fx: ['ring', 'sparks'] },
    chroma:    { f: ['#fff04a', '#3aff8a', '#ff3ad0'], s: ['#000000', '#ffffff', '#1a0030'], g: '#ffffff', fx: ['bolts', 'sparks'] },
    void:      { f: ['#3a1a5a', '#14001f', '#05000a'], s: ['#000000', '#ffd34a', '#fff0b0'], g: '#b03aff', fx: ['swirl', 'flare'] },
    taboo:     { f: ['#ffffff', '#f0e8ff', '#c8b8ff'], s: ['#12002a', '#4a1a8a', '#ffffff'], g: '#c8a8ff', fx: ['bolts', 'xflare'] },
    frost:     { f: ['#ffffff', '#c8f4ff', '#5ac8ff'], s: ['#001a3a', '#1a6ad0', '#ffffff'], g: '#5ad0ff', fx: ['xflare', 'sparks'] },
    ocean:     { f: ['#f0fdff', '#5ad0ff', '#1a7ad0'], s: ['#001030', '#0a3a8a', '#d0f4ff'], g: '#3ab0ff', fx: ['ring', 'sparks'] },
    thunder:   { f: ['#fffbe0', '#ffe04a', '#ffaa00'], s: ['#0a0020', '#3a2a8a', '#fff7c0'], g: '#ffe04a', fx: ['bolts', 'flare'] },
    love:      { f: ['#ffffff', '#ffb0d8', '#ff4aa0'], s: ['#2a0018', '#c4206a', '#ffe0f0'], g: '#ff5ab0', fx: ['orb', 'sparks'] }
  };
  /* 角色 → [風格, 副標] */
  const SUB = {
    luffy0: ['blaze', '橡膠的身體，燃燒起來吧！'], nami: ['thunder', '天氣，由我來決定！'], zoro: ['void', '鬼氣纏身，九刀齊出'], sanji: ['goldflame', '燃燒的右腳，踢碎一切'],
    robin: ['prism', '千萬朵花，綻放成巨人'], franky: ['thunder', 'SUPER！鋼鐵將軍出擊'], brook: ['frost', '來自黃泉的冰冷靈魂'],
    jinbe: ['ocean', '順著海流，摔向深淵'], luffy: ['prism', '解放的鼓聲，響徹世界'], koby_mf: ['taboo', '一個新兵拚命的吶喊'],
    garp_mf: ['blaze', '海軍英雄的拳頭'], akainu: ['magma', '徹底的正義，燒盡一切'], aokiji: ['frost', '連大海都要凍結'],
    kizaru: ['thunder', '以光速，降下神罰'], magellan: ['abyss', '地獄之毒，審判一切'], lucci: ['crimson', '暗殺之豹，回歸本能'],
    garp_hc: ['blaze', '貫穿銀河的拳骨'], koby_hc: ['thunder', '以正義之名，筆直揮出'], mihawk: ['crimson', '這一刀，斬斷一切'],
    crocodile: ['scorch', '吞沒一切的沙漠風暴'], doflamingo: ['love', '無處可逃的絲線牢籠'], kuma: ['taboo', '所有痛苦，由我承受'],
    moria: ['void', '千百道影子，歸於一身'], law: ['ocean', '手術室裡，我說了算'], hancock: ['love', '美麗，就是一切的理由'],
    kuma_eh: ['prism', '為了女兒，跨越天際'], law_w: ['ocean', 'ROOM 之中，一刺貫心'], weevil: ['goldflame', '老爹的力量，在我手中'],
    blackbeard_w: ['void', '黑暗，吞噬一切'], mihawk_w: ['crimson', '頂點之劍，無人能及'], ace: ['blaze', '燃燒吧，火拳的意志'], king: ['blaze', '露娜莉亞之火，焚盡天空'], luffy_nika: ['prism', '解放的鼓聲，響徹世界'],
    marco: ['ocean', '青藍之炎，永不熄滅'], katakuri: ['chroma', '我已看見你的未來'], catarina: ['abyss', '九尾狐火，變幻無常'],
    burgess: ['scorch', '冠軍的力量，粉碎大地'], vasco: ['goldflame', '一口烈酒，化為火柱'], shanks: ['crimson', '霸王之氣，斬開天地'],
    blackbeard: ['void', '黑暗的野心，永無止境'], buggy: ['chroma', '盛大的表演，開始了！'], whitebeard: ['taboo', '世界最強的男人'],
    bigmom: ['magma', '靈魂與火焰，吞沒大海'], kaido: ['scorch', '百獸之王，升龍而起'], vivi: ['ocean', '為了這個國家，我不會逃'],
    koza: ['scorch', '為了沙漠中的綠洲'], enel: ['thunder', '神，降下雷霆'], wiper: ['blaze', '以生命為代價的一擊'],
    perona: ['love', '巨大幽靈，降臨'], hody: ['abyss', '新魚人的憤怒'], shirahoshi: ['ocean', '海王類，回應我的呼喚'],
    monet: ['frost', '白色的世界，靜靜凍結'], sugar: ['love', '變成玩具，忘掉一切'], kid: ['crimson', '磁力的極致，粉碎一切'],
    kinemon: ['goldflame', '狐火流，斬斷火焰'], yamato: ['frost', '繼承御田之名'], vegapunk: ['thunder', '人類最後的希望之火'],
    york: ['chroma', '天龍人的命令'], loki: ['taboo', '詛咒的王子，覺醒了'], dorry: ['blaze', '艾爾巴夫戰士的驕傲'],
    brogy: ['scorch', '百年決鬥的終結一擊'], imu: ['void', '世界之王，降臨'], rocks: ['crimson', '神之谷的傳說，再臨'], uta: ['love', '新時代的歌聲'], roger: ['crimson', '海賊王的一刀']
  };
  const BY_TYPE = { '火': 'blaze', '冰': 'frost', '雷電': 'thunder', '闇': 'void', '水': 'ocean', '魚人': 'ocean', '自然': 'scorch', '獸': 'abyss', '龍': 'scorch', '巨人': 'blaze', '超能': 'prism', '格鬥': 'crimson' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function host() { let el = document.getElementById('bUlt'); if (!el) { el = document.createElement('div'); el.id = 'bUlt'; el.className = 'ut'; el.setAttribute('aria-live', 'polite'); const bs = document.getElementById('battleScreen') || document.body; bs.appendChild(el); } return el; }
  const layers = (t, n) => Array.from({ length: n }, (_, i) => `<span class="l l${i + 1}">${t}</span>`).join('');
  const BOLT = '<svg class="ut-bolts" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M80 40 L230 210 L180 230 L330 420 L290 430 L420 590"/><path d="M930 20 L800 190 L850 205 L700 380 L745 395 L610 580"/><path d="M500 0 L470 120 L520 130 L440 260"/></svg>';
  function render(actor, skill, side, dur) {
    const [pk, sub] = SUB[actor.id] || [BY_TYPE[(CHARACTERS[actor.id] || {}).types ? CHARACTERS[actor.id].types[0] : ''] || 'blaze', ''], P = PRESET[pk] || PRESET.blaze;
    const name = esc(skill.name), len = Array.from(skill.name).length, fs = Math.max(42, Math.min(150, 980 / Math.max(3.2, len)));
    const el = host();
    el.style.cssText = `--f1:${P.f[0]};--f2:${P.f[1]};--f3:${P.f[2]};--o:${P.s[0]};--s2:${P.s[1]};--s3:${P.s[2]};--g:${P.g};--fs:min(${fs}px,${(fs / 9.6).toFixed(2)}vw);--dur:${dur}ms`;
    const fx = P.fx.map(k => k === 'bolts' ? BOLT : k === 'embers' || k === 'sparks' ? `<div class="ut-${k}">${'<i></i>'.repeat(16)}</div>` : `<div class="ut-${k}"></div>`).join('');
    el.innerHTML = `<div class="ut-dim"></div>${fx}<div class="ut-title"><div class="ut-sub">${sub ? layers(esc(sub), 3) : ''}</div><div class="ut-main">${layers(name, 4)}</div><div class="ut-who">${esc(actor.name)}</div></div>`;
    el.className = `ut ut-p-${pk} ${side === 'P' ? 'me' : 'foe'}`; void el.offsetWidth; el.classList.add('show');
    el.querySelectorAll('.ut-embers i,.ut-sparks i').forEach((d, i) => { const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 45; d.style.cssText = `--dx:${(Math.cos(a) * r).toFixed(1)}vw;--dy:${(Math.sin(a) * r * .6).toFixed(1)}vh;--dl:${(Math.random() * .25).toFixed(2)}s;--sz:${(3 + Math.random() * 6).toFixed(1)}px`; });
    return el;
  }
  window.ultTitle = function (actor, skill, side, dur) { const el = render(actor, skill, side, dur || 1400); clearTimeout(el.__t); el.__t = setTimeout(() => el.classList.remove('show'), dur || 1400); };
  cutIn = function (actor, skill, side) { return new Promise(res => { const D = 1450; render(actor, skill, side, D); const el = host(); if (typeof shake === 'function') setTimeout(shake, 180); clearTimeout(el.__t); el.__t = setTimeout(() => { el.classList.remove('show'); res(); }, D); }); };
  window.cutIn = cutIn;
  /* 變身奧義：在變身演出時也顯示標題字 */
  if (typeof window.transformFx === 'function') { const _tf = window.transformFx; window.transformFx = async function (side, actor, skill, phase) { if (phase === 'before') window.ultTitle(actor, skill, side, 1300); return _tf.apply(this, arguments); }; }
  window.ULT_TITLE = { PRESET, SUB };
})();

/* ==== 原 js/fx_v165.js ==== */
/* v165 伊姆型態：① 晉升演出 imuFormFx（ext_v165.js 在「最初20人」演出結束後呼叫，swap() 才真正換立繪／名牌／頭像）
   畫面壓暗 → 深紅與紫色的黑雷劈在伊姆身上 → 最後一道巨雷落下的瞬間換成新型態 → 深淵光環擴散、顯示型態名稱。
   ② 角色背包「我的船員」與圖鑑詳細頁：伊姆加上「初始型態／第一～第三型態」切換（v169 起 4 個），換立繪與該型態的技能一覽（樣式見 css/v165.css）。
   不改 crew.js：以 MutationObserver 在畫面更新後補上切換列。 */
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms)), R = (a, b) => a + Math.random() * (b - a);
  const COL = ['#ff2a5a', '#b04aff', '#ffffff', '#ff8ab0'];
  const layer = cls => { const scr = document.getElementById('battleScreen'); if (!scr) return null; let d = scr.querySelector('.' + cls); if (!d) { d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); scr.appendChild(d); } return d; };
  const flash = (a, d, c) => { const el = layer('kd-flash'); if (!el) return; el.style.setProperty('--a', a); el.style.setProperty('--d', d + 's'); el.style.setProperty('--c', c || '#fff'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
  window.imuFormFx = async function (S, actor, form, swap) {
    const el = document.getElementById('bF' + S), F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[form] || {};
    if (typeof X === 'undefined' || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') { swap(); return; }
    let dim = null, swapped = false; const doSwap = () => { if (!swapped) { swapped = true; swap(); } };
    try {
      FXE.ensure(); const p = fighterPoint(S), top = p.y - 160;
      if (typeof SFX !== 'undefined') SFX.play('thunder');
      dim = layer('kd-dim'); if (dim) { void dim.offsetWidth; dim.classList.add('on'); }
      if (el) el.classList.add('morph-out');
      X.glow(p.x, p.y - 20, { color: '#c8003a', r: 240, life: 1.1 });
      for (let i = 0; i < 6; i++) {
        X.bolt(p.x + R(-160, 160), -20, p.x + R(-40, 40), top + R(-30, 80), { color: COL[i % 2], w: R(6, 11), life: .26, amp: 34 });
        if (i % 2 === 0) { flash(.12, .14, '#ffd0dc'); if (typeof SFX !== 'undefined') SFX.play('zap'); }
        await wait(110);
      }
      if (typeof SFX !== 'undefined') SFX.play('thunder');
      X.bolt(p.x, -20, p.x, p.y, { color: '#ffffff', w: 16, life: .4, amp: 24 });
      X.bolt(p.x + 30, -20, p.x - 10, p.y - 40, { color: '#ff2a5a', w: 10, life: .4 });
      flash(.4, .35, form >= 2 ? (form === 3 ? '#f0d0ff' : '#ffd0e0') : '#ffffff');
      if (form === 3) { X.ring(p.x, p.y - 60, { r1: 560, color: '#b04aff', w: 14, life: .9 }); X.glow(p.x, p.y - 80, { color: '#ff2a5a', r: 320, life: 1.2 }); } /* v169：第三型態展翼的大光環 */
      if (typeof shake === 'function') shake();
      doSwap();
      if (el) { el.classList.remove('morph-out'); el.classList.add('morph-in'); setTimeout(() => el.classList.remove('morph-in'), 800); }
      X.ring(p.x, p.y, { r1: 400, color: '#ff2a5a', w: 10, life: .7 });
      X.ring(p.x, p.y, { r1: 260, color: '#b04aff', w: 5, life: .55 });
      X.particles({ x: p.x, y: p.y - 40, n: 50, spd: [160, 460], life: [.5, 1.1], size: [3, 8], colors: COL, shape: 'spark', add: true });
      X.text(p.x, p.y - 230, F.label || '型態', { size: 40, color: '#ffe0e8', color2: '#8a0a2a' });
      X.text(p.x, p.y - 180, F.name || '', { size: 56, color: '#ffffff', color2: '#c8003a' });
      for (let i = 0; i < 3; i++) setTimeout(() => X.bolt(p.x + R(-20, 20), p.y - 80, p.x + R(-220, 220), p.y + R(-160, 40), { color: COL[i], w: 6, life: .22 }), 120 + i * 120);
      await wait(900);
    } finally { if (dim) dim.classList.remove('on'); if (el) el.classList.remove('morph-out'); doSwap(); }
  };

  /* ---------- 角色詳細頁：型態切換 ---------- */
  let pick = 0;
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kindOf = s => s.ultimate ? '奧義' : s.type === 'attack' ? '攻擊' : '輔助';
  function formSkills(form) { const C = CHARACTERS[CID]; if (CID === 'loki') return (form === 0 ? C.skills : (C['form' + (form + 1) + 'Skills'] || []).concat([C.skills[4]])).map((s, i) => ({ s, i, lock: false })); if (form < 2) return C.skills.map((s, i) => ({ s, i, lock: form === 0 && s.formNeed })); return (C['form' + form + 'Skills'] || C.form2Skills).concat([C.skills[4]]).map((s, i) => ({ s, i, lock: false })); } /* v169：第三型態 form3Skills */
  function bar(cur) { const F = CHARACTERS[CID].forms; return `<div class="imu-forms" role="tablist" aria-label="型態">${F.map((f, i) => `<button type="button" role="tab" data-imuf="${i}" aria-selected="${i === cur}" class="${i === cur ? 'on' : ''}"><img src="${f.avatar}" alt=""><span><b>${f.label}</b><small>${f.name}</small></span></button>`).join('')}</div>`; }
  function cxList(form) {
    return `<ol class="cx-skills imu-fsk">${formSkills(form).map(({ s, i, lock }) => `<li class="sk ${lock ? 'lock' : ''} ${s.ultimate ? 'ult' : ''}"><div class="sk-top"><span class="sk-no">${i + 1}</span><b>${s.name}</b><em class="sk-type ${s.type}">${kindOf(s)}</em></div>
      <div class="sk-meta"><span>威力 <b>${s.power || '—'}</b></span><span>命中 <b>${s.accuracy}</b></span><span>次數 <b>${s.maxPP}/${s.maxPP}</b></span></div><p>${s.desc}</p>${(s.tags || []).length ? `<div class="sk-tags">${s.tags.map(([t, cl]) => `<span class="tag ${cl}">${t}</span>`).join('')}</div>` : ''}${lock ? '<div class="sk-lock">🔒 晉升第一型態後開啟</div>' : ''}</li>`).join('')}</ol>`;
  }
  function sbList(form) {
    return formSkills(form).map(({ s, i, lock }) => `<div class="sb-sk ${lock ? 'lock' : ''} ${s.ultimate ? 'ult' : ''} ${s.type === 'support' ? 'sup' : 'atk'}" title="${esc2(s.desc)}"><span class="sb-sk-n">${i + 1}</span><b>${s.ultimate ? '★ ' : ''}${s.name}</b><span>威力 ${s.power || '—'}</span><span>次數 ${s.maxPP}</span>${lock ? '<i>第一型態開啟</i>' : ''}<p>${s.desc}</p></div>`).join('');
  }
  const formImg = (form, skinImg) => form === 0 ? skinImg : CHARACTERS[CID].forms[form].image;
  function enhance(root, kind) {
    if (!root || !CHARACTERS[CID] || !CHARACTERS[CID].forms) return;
    const isImuView = kind === 'cx' ? !!root.querySelector('.cx-hero') && root.__imuId === CID : true; if (!isImuView) return;
    const list = kind === 'cx' ? root.querySelector('.cx-skills') : root.querySelector('.sb-skills'); if (!list || list.dataset.imu) return;
    const art = kind === 'cx' ? root.querySelector('.cx-art img') : root.querySelector('.sb-stage > img'); const base = art ? art.getAttribute('src') : CHARACTERS[CID].image;
    list.dataset.imu = '1';
    const host = document.createElement('div'); host.className = 'imu-forms-host'; host.innerHTML = bar(pick); list.parentNode.insertBefore(host, list);
    const paint = () => { if (art) art.src = formImg(pick, base); if (kind === 'cx') { list.outerHTML; const tmp = document.createElement('div'); tmp.innerHTML = cxList(pick); list.innerHTML = tmp.firstElementChild.innerHTML; } else list.innerHTML = sbList(pick);
      host.innerHTML = bar(pick); host.querySelectorAll('[data-imuf]').forEach(b => b.onclick = () => { pick = +b.dataset.imuf; paint(); }); };
    paint();
  }
  function watch(id, kind, isImu) {
    const el = document.getElementById(id); if (!el || el.__imuObs) return; el.__imuObs = true;
    new MutationObserver(() => { const id = isImu(el); if (!id) return; if (CID !== id) pick = 0; CID = id; if (kind === 'cx') el.__imuId = id; enhance(el, kind); }).observe(el, { childList: true, subtree: false });
  }
  /* v172：洛基也有型態切換（CID＝目前顯示的角色） */
  let CID = 'imu'; const FORM_IDS = ['imu', 'loki'];
  const nameHit = t => FORM_IDS.find(id => CHARACTERS[id] && CHARACTERS[id].forms && (t === CHARACTERS[id].name || t === CHARACTERS[id].forms[0].name)) || null;
  function hook() {
    watch('cxCodexDetail', 'cx', el => { const h = el.querySelector('.cx-head h3'); return h && h.firstChild && el.querySelector('.cx-art:not(.sil)') && !el.querySelector('.reserved') ? nameHit(h.firstChild.textContent.trim()) : null; });
    watch('cxPane_crew', 'sb', el => { const h = el.querySelector('.sb-head h3'); return h && h.firstChild ? nameHit(h.firstChild.textContent.trim()) : null; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
  setTimeout(hook, 1500);
})();

/* ==== 原 js/fx_v138.js ==== */
/* v138 特效質感升級（全角色通用的一層，不改各招式的編排）：
   ① 泛光（Bloom）：特效畫布每幀縮小複製到 #bBloom，用 GPU 模糊後以「濾色」疊回去——所有光、火、雷、斬擊都會發光暈開。
      取代手機上把 shadowBlur 降到三成的作法（手機原本幾乎沒有光暈，是看起來廉價的主因）。
   ② 命中：頓幀（hit-stop 約 70ms）、目標色差殘影（紅／青錯位）、拖尾火花、雙層衝擊波、餘燼。
   ③ 出招：背景壓暗＋暗角，讓特效成為焦點；施放者描上招式顏色的輪廓光。奧義另加電影黑邊。
   設定：設定頁「戰鬥 → 技能特效」高／低（localStorage op_fxpro，'0'＝低：回到原本的特效）。「減少動態效果」開啟時不震動畫面。 */
(function () {
  const on = () => { try { return localStorage.getItem('op_fxpro') !== '0'; } catch (e) { return true; } }; /* 使用者已同意：預設開啟；設定「技能特效：低」＝ op_fxpro '0' */
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const COL = { blue: '#78d2ff', gold: '#ffd26e', red: '#ff7850', purple: '#b07cff', green: '#78ffaa' };

  /* ---------- ① 泛光 ---------- */
  let bloom = null, bctx = null, braf = 0, idle = 0;
  function ensureBloom() { const cv = $('bCanvas'); if (!cv) return null; if (!bloom) { bloom = document.createElement('canvas'); bloom.id = 'bBloom'; bloom.className = 'b-canvas b-bloom'; bloom.setAttribute('aria-hidden', 'true'); cv.insertAdjacentElement('afterend', bloom); bctx = bloom.getContext('2d'); } return cv; }
  function bloomLoop() { braf = 0; const cv = ensureBloom(); if (!cv || !on()) return; const w = Math.max(1, Math.round(cv.width / 4)), h = Math.max(1, Math.round(cv.height / 4));
    if (bloom.width !== w || bloom.height !== h) { bloom.width = w; bloom.height = h; }
    const s = cv.style, b = bloom.style; if (b.left !== s.left || b.top !== s.top || b.width !== s.width || b.height !== s.height) { b.left = s.left; b.top = s.top; b.width = s.width; b.height = s.height; b.right = b.bottom = 'auto'; }
    bctx.clearRect(0, 0, w, h); const full = window.__fxFullUntil && performance.now() < __fxFullUntil(); b.opacity = full ? '.12' : ''; bctx.drawImage(cv, 0, 0, w, h);
    const vis = typeof currentScreen === 'undefined' || currentScreen === 'battleScreen';
    if (vis && performance.now() - idle < 2500) braf = requestAnimationFrame(bloomLoop); else { bctx.clearRect(0, 0, w, h); bloom.style.visibility = 'hidden'; /* v194：閒置時整層隱藏（這層有模糊＋濾色混合，空著也要合成） */ } }
  function kick() { idle = performance.now(); if (bloom && bloom.style.visibility) bloom.style.visibility = ''; if (!braf) braf = requestAnimationFrame(bloomLoop); }

  /* ---------- ② 命中 ---------- */
  let stopUntil = 0;
  function hitStop(ms) { const t = performance.now(); if (t < stopUntil) return; stopUntil = t + ms; const el = [$('bFL'), $('bFR'), $('bArena')].filter(Boolean); const anims = []; el.forEach(e => e.getAnimations({ subtree: true }).forEach(a => { if (a.playState === 'running') { a.pause(); anims.push(a); } })); setTimeout(() => anims.forEach(a => { try { a.play(); } catch (e) { } }), ms); }
  function chroma(side) { const img = $('bImg' + side); if (!img) return; img.animate([{ filter: 'drop-shadow(-7px 0 0 rgba(255,40,80,.85)) drop-shadow(7px 0 0 rgba(40,220,255,.85)) brightness(1.8)' }, { filter: 'drop-shadow(-3px 0 0 rgba(255,40,80,.5)) drop-shadow(3px 0 0 rgba(40,220,255,.5)) brightness(1.2)', offset: .4 }, { filter: 'none' }], { duration: 260, easing: 'ease-out' }); }
  function streaks(x, y, col, n, big) { const ps = []; const N = Math.round(n * (LOWFX ? .7 : 1)); for (let i = 0; i < N; i++) { const a = R(0, TAU), v = R(260, big ? 900 : 650); ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - R(0, 120), l: R(.25, .55), w: R(1.5, 3.5) }); }
    FXE.add({ add: true, life: .6, draw(c, k, dt) { ps.forEach(p => { if (p.dead) return; p.vx *= .9; p.vy = p.vy * .9 + 900 * dt; const ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt; const a = Math.max(0, 1 - k / p.l); if (!a) { p.dead = 1; return; }
      const tx = p.x - p.vx * .045, ty = p.y - p.vy * .045, g = c.createLinearGradient(tx, ty, p.x, p.y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.6, col); g.addColorStop(1, '#fff');
      c.globalAlpha = a; c.strokeStyle = g; c.lineWidth = p.w; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(p.x, p.y); c.stroke(); }); } }); }
  function shock(x, y, col, big) { const r1 = big ? 260 : 170; FXE.add({ add: true, life: big ? .55 : .42, draw(c, k) { const e = 1 - Math.pow(1 - k, 3), r = 20 + r1 * e;
      [[1, 18, .9], [.82, 8, .55]].forEach(([m, w, a]) => { const rr = r * m, g = c.createRadialGradient(x, y, Math.max(0, rr - w * 2), x, y, rr + w); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.6, col); g.addColorStop(.8, '#ffffff'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = a * (1 - k); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rr + w, (rr + w) * .62, 0, 0, TAU); c.fill(); }); } });
    FXE.add({ add: true, life: .14, draw(c, k) { const r = (big ? 80 : 55) * (1 + k * .5), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(.3, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = .6 * (1 - k); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } }); }
  function embers(x, y, col, n) { const ps = []; for (let i = 0; i < n; i++) ps.push({ x: x + R(-60, 60), y: y + R(-50, 40), vx: R(-60, 60), vy: R(-140, -30), s: R(2, 5), ph: R(0, TAU), l: R(.6, 1) });
    FXE.add({ add: true, life: 1.3, draw(c, k, dt, t) { ps.forEach(p => { p.x += (p.vx + Math.sin(t * 4 + p.ph) * 30) * dt; p.y += p.vy * dt; p.vy *= .99; const a = Math.max(0, 1 - k / p.l); c.globalAlpha = a; c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, p.s * .5, 0, TAU); c.fill(); c.globalAlpha = a * .6; c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, p.s * 1.6, 0, TAU); c.fill(); }); } }); }

  /* ---------- ③ 出招焦點 ---------- */
  let focusN = 0;
  function focus(onoff, ult) { const scr = $('battleScreen'); if (!scr) return; if (!scr.querySelector('.fxp-bars')) scr.insertAdjacentHTML('beforeend', '<i class="fxp-bars top" aria-hidden="true"></i><i class="fxp-bars bot" aria-hidden="true"></i>'); focusN = Math.max(0, focusN + (onoff ? 1 : -1)); scr.classList.toggle('fxp-focus', focusN > 0); if (ult !== undefined) scr.classList.toggle('fxp-ult', !!ult && focusN > 0); }
  function rim(side, col) { const img = $('bImg' + side); if (!img) return; img.animate([{ filter: 'none' }, { filter: `drop-shadow(0 0 2px #fff) drop-shadow(0 0 14px ${col}) drop-shadow(0 0 28px ${col})`, offset: .25 }, { filter: `drop-shadow(0 0 2px #fff) drop-shadow(0 0 14px ${col}) drop-shadow(0 0 28px ${col})`, offset: .75 }, { filter: 'none' }], { duration: 1100, easing: 'ease-in-out' }); }
  const skillCol = s => { const t = (s && (s.anima || '')) + ''; const th = typeof BATTLE_ANIM !== 'undefined' && BATTLE_ANIM[s && s.anima]; return COL[th] || (s && s.type === 'support' ? COL.green : s && s.ultimate ? COL.gold : COL.red); };

  window.addEventListener('DOMContentLoaded', () => {
    if (window.FXE && FXE.add) { const _a = FXE.add; FXE.add = function () { const r = _a.apply(this, arguments); if (on()) kick(); return r; }; }
    /* 全畫面閃光／染色時暫時降低泛光，避免整個畫面被洗白 */
    let fullUntil = 0; ['flash', 'tint'].forEach(k => { const f = FXE.P[k]; if (!f) return; FXE.P[k] = function (col, life) { fullUntil = Math.max(fullUntil, performance.now() + (life || .3) * 1000 / (window.BSPEED || 1)); return f.apply(this, arguments); }; });
    window.__fxFullUntil = () => fullUntil;
    /* 衝擊環：原本是一條細線，加一層柔和的光帶，看起來比較有厚度 */
    if (window.FXE && FXE.P && FXE.P.ring) { const _r = FXE.P.ring; FXE.P.ring = function (x, y, o) { const r = _r.apply(this, arguments); if (!on()) return r; o = o || {}; const col = o.color || '#ffffff', r0 = o.r0 || 10, r1 = o.r1 || 150, life = (o.life || .45) * 1.15, flat = o.flat || 1, bw = Math.max(18, (o.w || 14) * 2.2);
      FXE.add({ add: true, life, draw(c, k) { const e = 1 - Math.pow(1 - k, 3), rr = r0 + (r1 - r0) * e, g = c.createRadialGradient(0, 0, Math.max(0, rr - bw), 0, 0, rr + bw * .5); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, col); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = .55 * (1 - k); c.translate(x, y); c.scale(1, flat); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr + bw * .5, 0, Math.PI * 2); c.fill(); } }); return r; }; }
    if (typeof hitFX === 'function') { const _h = hitFX; hitFX = function (side, theme, big) { const r = _h.apply(this, arguments); if (!on()) return r; try { const p = fighterPoint(side), col = COL[theme] || COL.red; hitStop(big ? 90 : 60); chroma(side); shock(p.x, p.y, col, big); streaks(p.x, p.y, col, big ? 26 : 16, big); embers(p.x, p.y, col, big ? 14 : 8); } catch (e) { } return r; }; }
    if (typeof playChoreo === 'function') { const _p = playChoreo; window.playChoreo = playChoreo = async function (side, actor, idx, skill) { if (!on()) return _p.apply(this, arguments); const S = side === 'P' ? 'L' : 'R', ult = !!(skill && skill.ultimate);
      focus(true, ult); try { rim(S, skillCol(skill)); } catch (e) { } try { return await _p.apply(this, arguments); } finally { setTimeout(() => focus(false), 650 / (window.BSPEED || 1)); } }; }
  });
  window.FXPRO = { on, hitStop, chroma, shock, streaks, embers, focus, kick };
})();

/* v138 第二層「更帥」：屬性氣場、蓄力集氣、魔法陣、命中屬性爆發（火焰綻放、冰晶碎裂、落雷、水花、黑焰）、
   光芒放射、碎石與煙塵、畫面震動；奧義另有天色變暗、雙層魔法陣、集中線、結尾白光衝擊與光雨；輔助招式有光柱。
   與第一層共用開關 op_fxpro。 */
(function () {
  const on = () => window.FXPRO && FXPRO.on();
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2, LOW = typeof LOWFX !== 'undefined' && LOWFX;
  const n = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  /* 屬性 → 主題 */
  const THEME = { '火': 'fire', '冰': 'ice', '雷電': 'bolt', '水': 'water', '魚人': 'water', '闇': 'dark', '超能': 'psy', '龍': 'psy', '自然': 'nature', '格鬥': 'fist', '獸': 'fist', '巨人': 'fist' };
  const PAL = { fire: ['#fff3c0', '#ffb02e', '#ff4a1a', '#7a1200'], ice: ['#ffffff', '#c8f4ff', '#6fd3ff', '#1a5aa8'], bolt: ['#ffffff', '#fff27a', '#ffd23b', '#6a8aff'], water: ['#ffffff', '#bfeaff', '#3fa8ff', '#0a3a8a'],
    dark: ['#f0d0ff', '#b05aff', '#5a1a9a', '#120018'], psy: ['#ffffff', '#ffb0f0', '#d86fd0', '#4a1a6a'], nature: ['#ffffff', '#c8ffb0', '#5adf6f', '#1a5a2a'], fist: ['#ffffff', '#ffe0a0', '#ff8a3a', '#5a2a0a'], sword: ['#ffffff', '#e0f0ff', '#8fc8ff', '#0a1a3a'], sand: ['#fff8e0', '#ffd890', '#d8a040', '#4a2a0a'], light: ['#ffffff', '#fff6b0', '#ffd23b', '#6a5a00'],
    haki: ['#ffffff', '#ff8a9a', '#e0102a', '#000000'], poison: ['#f0ffe0', '#c88aff', '#7a3ad8', '#1a0a2a'], shadow: ['#f0e0ff', '#a87aff', '#4a1a8a', '#05000a'], thread: ['#ffffff', '#ffc8f0', '#ff5ad0', '#3a0a2a'], quake: ['#ffffff', '#e8f4ff', '#a8d8ff', '#1a2a4a'] };
  window.__FXPAL = PAL;
  const themeOf = f => { const C = f && typeof CHAR_FX !== 'undefined' && CHAR_FX[f.id]; if (C) return C[0]; const t = (f && f.types) || []; for (const x of t) if (THEME[x]) return THEME[x]; return 'fist'; };
  const palOf = (f, th) => { const C = f && typeof CHAR_FX !== 'undefined' && CHAR_FX[f.id]; return (C && C[2]) || PAL[th] || PAL.fist; };
  function geo(side) { const f = $('bF' + side), img = $('bImg' + side); if (!f || !img) return null; const p = fighterPoint(side), sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, h = img.offsetHeight * sc;
    return { x: p.x, y: p.y, g: f.offsetTop + img.offsetTop + img.offsetHeight, h, w: img.offsetWidth * sc }; }
  const add = o => FXE.add(o);

  /* ---------- 共用圖形 ---------- */
  function rays(x, y, col, o) { o = o || {}; const N = o.n || 18, L = o.len || 420, rs = []; for (let i = 0; i < N; i++) rs.push({ a: R(0, TAU), w: R(.02, .07), l: R(.6, 1) });
    add({ add: true, life: o.life || .5, draw(c, k) { const e = 1 - Math.pow(1 - k, 2); c.translate(x, y); c.rotate(k * .3); rs.forEach(r => { const len = L * r.l * (.3 + e * .7), g = c.createLinearGradient(0, 0, Math.cos(r.a) * len, Math.sin(r.a) * len); g.addColorStop(0, '#ffffff'); g.addColorStop(.25, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = (o.a || .8) * (1 - k); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, len, r.a - r.w, r.a + r.w); c.closePath(); c.fill(); }); } }); }
  function circle(x, y, P, o) { o = o || {}; const r = o.r || 120, life = o.life || 1.2, flat = o.flat || .32, runes = '☉☽✦✧❖✶⚔⚓★✪'.split('');
    add({ add: true, life, draw(c, k, dt, t) { const a = k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1, s = k < .15 ? .6 + .4 * (k / .15) : 1; c.translate(x, y); c.scale(s, s * flat); c.globalAlpha = a;
      c.shadowColor = P[2]; c.shadowBlur = 20; c.strokeStyle = P[1]; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r * .82, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, r * .45, 0, TAU); c.stroke();
      c.save(); c.rotate(t * (o.spin || 1.2)); c.lineWidth = 2; c.strokeStyle = P[2]; c.beginPath(); for (let i = 0; i <= 6; i++) { const q = i * TAU / 6 * 2; const px = Math.cos(q) * r * .82, py = Math.sin(q) * r * .82; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
      c.fillStyle = P[0]; c.font = `${Math.round(r * .16)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < 10; i++) { const q = i * TAU / 10; c.fillText(runes[i], Math.cos(q) * r * .91, Math.sin(q) * r * .91); } c.restore();
      c.save(); c.rotate(-t * (o.spin || 1.2) * 1.6); c.strokeStyle = P[0]; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { c.rotate(TAU / 4); c.strokeRect(-r * .32, -r * .32, r * .64, r * .64); } c.restore();
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a * .35; c.shadowBlur = 0; c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); } }); }
  function gather(x, y, P, o) { o = o || {}; const ps = [], N = n(o.n || 36); for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(120, o.rad || 260); ps.push({ a, d, s: R(1.5, 4), sp: R(.8, 1.3), c: P[R(0, 3) | 0] }); }
    add({ add: true, life: o.life || .55, draw(c, k) { ps.forEach(p => { const kk = Math.min(1, k * p.sp), d = p.d * (1 - kk * kk), px = x + Math.cos(p.a) * d, py = y + Math.sin(p.a) * d, tx = x + Math.cos(p.a) * (d + 26), ty = y + Math.sin(p.a) * (d + 26);
      c.globalAlpha = kk < 1 ? .9 : 0; c.strokeStyle = p.c; c.lineWidth = p.s; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(px, py); c.stroke(); }); const g = c.createRadialGradient(x, y, 0, x, y, 60 * k + 10); g.addColorStop(0, '#fff'); g.addColorStop(.4, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = .8 * k; c.fillStyle = g; c.fillRect(x - 80, y - 80, 160, 160); } }); }
  function aura(G, P, th, life) { const ps = [], N = n(th === 'bolt' ? 10 : 34); for (let i = 0; i < N; i++) ps.push({ x: R(-G.w * .45, G.w * .45), y: R(-G.h * .1, 0), vy: R(-260, -90), s: R(3, 9), ph: R(0, TAU), c: P[R(0, 3) | 0], t0: R(0, life * .7) });
    add({ add: true, life, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .8 ? (1 - k) / .2 : 1;
      const g = c.createRadialGradient(G.x, G.g, 0, G.x, G.g, G.w * .7); g.addColorStop(0, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = .45 * fa; c.fillStyle = g; c.save(); c.translate(G.x, G.g); c.scale(1, .25); c.translate(-G.x, -G.g); c.beginPath(); c.arc(G.x, G.g, G.w * .7, 0, TAU); c.fill(); c.restore();
      ps.forEach(p => { const lt = t - p.t0; if (lt < 0) return; const ly = (lt * -p.vy) % (G.h * 1.1), px = G.x + p.x + Math.sin(lt * 5 + p.ph) * 12, py = G.g + p.y - ly, a = fa * Math.max(0, 1 - ly / (G.h * 1.1));
        c.globalAlpha = a; if (th === 'bolt') { c.strokeStyle = p.c; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 4; j++) c.lineTo(px + R(-14, 14), py - j * 12); c.stroke(); }
        else if (th === 'ice') { c.fillStyle = p.c; c.save(); c.translate(px, py); c.rotate(lt * 2 + p.ph); c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * .5, 0); c.lineTo(0, p.s); c.lineTo(-p.s * .5, 0); c.closePath(); c.fill(); c.restore(); }
        else { const rg = c.createRadialGradient(px, py, 0, px, py, p.s * 2.2); rg.addColorStop(0, '#fff'); rg.addColorStop(.35, p.c); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.beginPath(); c.arc(px, py, p.s * 2.2, 0, TAU); c.fill(); } }); } }); }
  function debris(G, P, big) { const ps = [], N = n(big ? 22 : 12); for (let i = 0; i < N; i++) ps.push({ x: G.x + R(-40, 40), y: G.g - R(0, 20), vx: R(-320, 320), vy: R(-620, -220), r: R(0, TAU), vr: R(-10, 10), s: R(4, big ? 13 : 9) });
    add({ life: 1, draw(c, k, dt) { ps.forEach(p => { p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > G.g + 10) { p.y = G.g + 10; p.vy *= -.3; p.vx *= .6; } c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = '#5a4a3a'; c.beginPath(); c.moveTo(-p.s, -p.s * .4); c.lineTo(p.s * .2, -p.s); c.lineTo(p.s, p.s * .3); c.lineTo(-p.s * .3, p.s * .8); c.closePath(); c.fill(); c.fillStyle = P[2]; c.globalAlpha = (1 - k) * .5; c.fill(); c.restore(); }); } });
    const ds = []; for (let i = 0; i < n(10); i++) ds.push({ x: G.x + R(-30, 30), vx: R(-180, 180), r: R(30, 60) });
    add({ life: 1.1, draw(c, k, dt) { ds.forEach(d => { d.x += d.vx * dt; d.vx *= .95; const r = d.r * (1 + k * 1.5), g = c.createRadialGradient(d.x, G.g - r * .3, 0, d.x, G.g - r * .3, r); g.addColorStop(0, 'rgba(200,180,150,.5)'); g.addColorStop(1, 'rgba(200,180,150,0)'); c.globalAlpha = (1 - k) * .8; c.fillStyle = g; c.beginPath(); c.arc(d.x, G.g - r * .3, r, 0, TAU); c.fill(); }); } }); }
  function shake(px, ms) { const a = $('bArena'); if (!a) return; try { if (localStorage.getItem('op_motion') === '1') return; } catch (e) { } const k = []; for (let i = 0; i < 6; i++) k.push({ translate: `${R(-px, px)}px ${R(-px, px)}px` }); k.push({ translate: '0 0' }); a.animate(k, { duration: ms, composite: 'add' }); }
  /* ---------- 屬性命中 ---------- */
  function element(th, x, y, G, P, big) {
    const m = big ? 1.4 : 1;
    if (th === 'fire') { for (let i = 0; i < n(7); i++) setTimeout(() => FXE.P.glow(x + R(-60, 60) * m, y + R(-60, 40) * m, { color: P[2], r: R(70, 120) * m, life: .5 }), i * 40); const fl = []; for (let i = 0; i < n(26); i++) { const a = R(-Math.PI, 0), v = R(150, 480) * m; fl.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(6, 14) }); } add({ add: true, life: .7, draw(c, k, dt) { fl.forEach(p => { p.vx *= .94; p.vy = p.vy * .94 - 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; const r = p.s * (1 - k * .6), g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, P[0]); g.addColorStop(.4, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 1 - k; c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill(); }); } }); }
    else if (th === 'ice') { const sh = []; for (let i = 0; i < n(16); i++) { const a = R(0, TAU), v = R(200, 520) * m; sh.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, r: R(0, TAU), s: R(8, 20) }); }
      add({ add: true, life: .8, draw(c, k, dt) { sh.forEach(p => { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 8 * dt; c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = P[1]; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * .35, 0); c.lineTo(0, p.s * .6); c.lineTo(-p.s * .35, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }); } }); }
    else if (th === 'bolt') { for (let i = 0; i < (big ? 3 : 2); i++) setTimeout(() => { FXE.P.bolt(x + R(-50, 50), -40, x + R(-20, 20), y, { color: P[2], w: big ? 6 : 4, life: .35 }); FXE.P.flash('#fff6c0', .12, .35); }, i * 90); }
    else if (th === 'water') { const dr = []; for (let i = 0; i < n(30); i++) { const a = R(-Math.PI, 0), v = R(200, 600) * m; dr.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(3, 7) }); }
      add({ add: true, life: .8, draw(c, k, dt) { dr.forEach(p => { p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = 1 - k; c.fillStyle = P[1]; c.beginPath(); c.ellipse(p.x, p.y, p.s * .6, p.s * 1.3, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, TAU); c.fill(); }); } }); }
    else if (th === 'dark' || th === 'psy') { add({ add: true, life: .6, draw(c, k) { const r = (50 + 170 * (1 - Math.pow(1 - k, 3))) * m, w = 26 * (1 - k) + 4; c.globalAlpha = .85 * (1 - k); const g = c.createRadialGradient(x, y, Math.max(0, r - w), x, y, r + w * .4); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, P[2]); g.addColorStop(.8, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); for (let q = 0; q <= 24; q++) { const a = q / 24 * TAU, rr = (r + w * .4) * (.9 + .1 * Math.sin(q * 3 + k * 9)); q ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } }); }
    else if (th === 'nature') { const lv = []; for (let i = 0; i < n(18); i++) { const a = R(0, TAU), v = R(150, 420) * m; lv.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: R(0, TAU), s: R(6, 12) }); }
      add({ add: true, life: 1, draw(c, k, dt) { lv.forEach(p => { p.vx *= .95; p.vy = p.vy * .95 + 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 4 * dt; c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = P[2]; c.beginPath(); c.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); c.fill(); c.restore(); }); } }); }
    else if (th === 'sword') { [[-.7, 0], [.7, 60], [0, 120]].forEach(([ang, d]) => setTimeout(() => add({ add: true, life: .35, draw(c, k) { const L = 340 * m * (1 - Math.pow(1 - Math.min(1, k * 2.5), 3)); c.translate(x, y); c.rotate(ang); const g = c.createLinearGradient(-L / 2, 0, L / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, '#fff'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 1 - k; c.fillStyle = g; c.fillRect(-L / 2, -4 * (1 - k) - 1, L, 8 * (1 - k) + 2); c.fillStyle = P[2]; c.globalAlpha = (1 - k) * .6; c.fillRect(-L / 2, -12 * (1 - k), L, 24 * (1 - k)); } }), d)); }
    else if (th === 'sand') { const sd = []; for (let i = 0; i < n(60); i++) { const a = R(-Math.PI, 0), v = R(150, 560) * m; sd.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(1.5, 4) }); } add({ life: 1, draw(c, k, dt) { sd.forEach(p => { p.vy += 900 * dt; p.vx *= .97; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = 1 - k; c.fillStyle = P[2]; c.fillRect(p.x, p.y, p.s, p.s); }); } }); }
    else if (th === 'light') { FXE.P.flash('#fffbe0', .14, .4); FXE.P.glow(x, y, { color: P[1], r: 200 * m, life: .5 }); }
    else if (th === 'haki') { for (let i = 0; i < (big ? 5 : 3); i++) setTimeout(() => { const a = R(0, TAU), L = R(80, 200) * m; FXE.P.bolt(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, { color: Math.random() < .5 ? '#1a0005' : P[2], w: 4, life: .3 }); }, i * 50); }
    else if (th === 'poison') { for (let i = 0; i < n(10); i++) setTimeout(() => FXE.P.glow(x + R(-70, 70) * m, y + R(-60, 50) * m, { color: P[2], r: R(50, 90) * m, life: .7 }), i * 40); }
    else if (th === 'shadow') { element('dark', x, y, null, P, big); }
    else if (th === 'thread') { for (let i = 0; i < 8; i++) { const a = R(0, TAU), L = R(140, 260) * m; add({ add: true, life: .5, draw(c, k) { const e = Math.min(1, k * 3); c.globalAlpha = 1 - k; c.strokeStyle = P[1]; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - Math.cos(a) * L * e, y - Math.sin(a) * L * e); c.lineTo(x + Math.cos(a) * L * e, y + Math.sin(a) * L * e); c.stroke(); } }); } }
    else if (th === 'quake') { FXE.P.ring(x, y, { r1: 260 * m, color: P[1], w: 18, life: .5 }); setTimeout(() => FXE.P.ring(x, y, { r1: 360 * m, color: '#ffffff', w: 10, life: .5 }), 100); }
    if (G) debris(G, P, big);
  }

  window.addEventListener('DOMContentLoaded', () => {
    let cur = null; /* 目前出招的角色與主題（命中時使用） */
    if (typeof playChoreo === 'function') { const _p = playChoreo; window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      if (!on()) return _p.apply(this, arguments); const S = side === 'P' ? 'L' : 'R', G = geo(S), th = themeOf(actor), P = palOf(actor, th), ult = !!(skill && skill.ultimate), sup = skill && skill.type === 'support';
      cur = { th, P, ult };
      try { if (G) {
        circle(G.x, G.g, P, { r: Math.max(90, G.w * .55), life: ult ? 2.4 : 1.3, spin: ult ? 2 : 1.2 }); aura(G, P, th, ult ? 2.4 : 1.2);
        if (ult) { circle(G.x, G.g - G.h * .02, P, { r: Math.max(150, G.w * .9), life: 2.4, spin: -.8, flat: .28 }); gather(G.x, G.y, P, { n: 70, rad: 420, life: .9 }); FXE.P.speedLines(G.x, G.y, { life: .9, n: 70, a: .55 }); shake(4, 600); }
        else if (sup) { add({ add: true, life: 1.2, draw(c, k) { const a = k < .2 ? k / .2 : (1 - k) / .8, w = G.w * .5 * (1 - k * .3), g = c.createLinearGradient(G.x - w, 0, G.x + w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a * .6; c.fillStyle = g; c.fillRect(G.x - w, -50, w * 2, G.g + 50); } }); }
        else gather(G.x + (S === 'L' ? 1 : -1) * G.w * .25, G.y, P, { n: 30, rad: 220, life: .45 });
      } } catch (e) { }
      try { return await _p.apply(this, arguments); } finally {
        if (ult) try { const T = geo(S === 'L' ? 'R' : 'L'); if (T) { rays(T.x, T.y, P[1], { n: 28, len: 700, life: .9 }); FXPRO.shock(T.x, T.y, P[2], true); } const rain = []; for (let i = 0; i < n(50); i++) rain.push({ x: R(0, FXE.W), y: R(-200, 0), v: R(200, 500), s: R(1.5, 3.5) }); add({ add: true, life: 1.6, draw(c, k, dt) { rain.forEach(p => { p.y += p.v * dt; c.globalAlpha = (1 - k) * .9; c.fillStyle = P[0]; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill(); c.globalAlpha = (1 - k) * .4; c.fillStyle = P[1]; c.beginPath(); c.arc(p.x, p.y, p.s * 3, 0, TAU); c.fill(); }); } }); shake(9, 500); } catch (e) { }
        setTimeout(() => { cur = null; }, 400); } }; }
    if (typeof hitFX === 'function') { const _h = hitFX; hitFX = function (side, theme, big) { const r = _h.apply(this, arguments); if (!on()) return r; try { const p = fighterPoint(side), G = geo(side), C = cur || { th: 'fist', P: PAL.fist }; const b = big || (cur && cur.ult);
      rays(p.x, p.y, C.P[1], { n: b ? 22 : 14, len: b ? 520 : 340, life: b ? .55 : .4, a: .7 }); element(C.th, p.x, p.y, G, C.P, b); shake(b ? 10 : 5, b ? 320 : 220); } catch (e) { } return r; }; }
  });
})();

/* v138 第三層「每位角色」：CHAR_FX[id] = [命中主題, 奧義全畫面轉場, 自訂配色?]
   主題決定氣場與命中爆發；轉場在奧義開始時鋪滿畫面（火海、冰封、雷暴、海嘯、深淵、沙暴、聖光、霸王色、花雨、震裂、劍閃、毒霧、影、絲線）。 */
const CHAR_FX = {
  luffy0: ['fist', 'quake'], zoro: ['sword', 'sword', ['#ffffff', '#c8ffd8', '#3adf8a', '#0a3a1a']], sanji: ['fire', 'inferno', ['#ffffff', '#bfe8ff', '#3a7fff', '#0a1a5a']],
  robin: ['psy', 'blossom', ['#ffffff', '#ffd0f0', '#c86fd8', '#3a1a4a']], franky: ['bolt', 'radiance', ['#ffffff', '#bfefff', '#3fd0ff', '#0a3a6a']], brook: ['ice', 'blizzard', ['#ffffff', '#d8e8ff', '#8fa8ff', '#1a1a4a']],
  nami: ['bolt', 'storm', ['#ffffff', '#fff3b0', '#8fd8ff', '#1a2a5a']], jinbe: ['water', 'tsunami'], luffy: ['psy', 'radiance', ['#ffffff', '#fff6d8', '#ffd86f', '#6a4a1a']], coby0: ['fist', 'radiance'], morgan: ['sword', 'quake'], marine: ['fist', 'quake'],
  koby_mf: ['fist', 'radiance'], garp_mf: ['haki', 'quake'], akainu: ['fire', 'inferno', ['#fff0c0', '#ff8a2e', '#d01a00', '#3a0500']], aokiji: ['ice', 'blizzard'], kizaru: ['light', 'radiance', ['#ffffff', '#fff6b0', '#ffd23b', '#8a6a00']],
  magellan: ['poison', 'poison'], lucci: ['fist', 'haki'], vergo: ['haki', 'haki'], garp_hc: ['haki', 'quake'], koby_hc: ['fist', 'radiance'],
  mihawk: ['sword', 'sword', ['#ffffff', '#c8fff0', '#5affc8', '#003a2a']], crocodile: ['sand', 'sandstorm'], doflamingo: ['thread', 'thread', ['#ffffff', '#ffc8f0', '#ff5ad0', '#4a0a3a']],
  kuma: ['psy', 'quake', ['#ffffff', '#ffe0c0', '#ffa86f', '#4a2a0a']], moria: ['shadow', 'abyss'], law: ['psy', 'sword', ['#ffffff', '#c8f0ff', '#5ad0ff', '#0a2a4a']], hancock: ['psy', 'blossom', ['#ffffff', '#ffd0e8', '#ff5aa8', '#4a0a2a']],
  kuma_eh: ['psy', 'quake', ['#ffffff', '#ffe0c0', '#ffa86f', '#4a2a0a']], law_w: ['psy', 'sword', ['#ffffff', '#c8f0ff', '#5ad0ff', '#0a2a4a']], weevil: ['haki', 'quake'], blackbeard_w: ['dark', 'abyss'], mihawk_w: ['sword', 'sword', ['#ffffff', '#c8fff0', '#5affc8', '#003a2a']],
  ace: ['fire', 'inferno'], marco: ['fire', 'inferno', ['#ffffff', '#bff8ff', '#3ad8ff', '#0a2a5a']], uta: ['psy', 'blossom', ['#ffffff', '#ffd8e8', '#ff6fa8', '#3a0a3a']], king: ['fire', 'inferno', ['#fff0d0', '#ffb05a', '#ff3a1a', '#2a0505']],
  katakuri: ['psy', 'haki', ['#ffffff', '#ffe8f8', '#d88fd0', '#3a1a3a']], catarina: ['fire', 'blossom', ['#ffffff', '#c8b0ff', '#8a5aff', '#1a0a3a']], burgess: ['fist', 'quake'], vasco: ['fire', 'inferno'],
  shanks: ['haki', 'haki'], blackbeard: ['dark', 'abyss'], buggy: ['psy', 'radiance', ['#ffffff', '#ffe0b0', '#ff6a3a', '#3a0a0a']], luffy_nika: ['light', 'radiance', ['#ffffff', '#fffbe8', '#ffe8a0', '#8a6a3a']],
  whitebeard: ['quake', 'quake', ['#ffffff', '#e8f4ff', '#a8d8ff', '#1a2a4a']], bigmom: ['fire', 'storm', ['#ffffff', '#ffe08a', '#ff8a3a', '#3a1a0a']], kaido: ['bolt', 'storm', ['#ffffff', '#d8c8ff', '#8a5aff', '#1a0a3a']],
  makino: ['fist', 'blossom'], mayor: ['fist', 'quake'], lordcoast: ['water', 'tsunami'], vivi: ['water', 'tsunami'], koza: ['sword', 'sandstorm'], enel: ['bolt', 'storm'], wiper: ['fire', 'quake'],
  perona: ['shadow', 'abyss', ['#ffffff', '#ffd0f0', '#d88fff', '#2a0a3a']], hody: ['water', 'tsunami'], shirahoshi: ['water', 'tsunami', ['#ffffff', '#d8f4ff', '#8fd8ff', '#1a4a6a']], monet: ['ice', 'blizzard'],
  sugar: ['psy', 'blossom'], kid: ['bolt', 'storm', ['#ffffff', '#ffd0c0', '#ff5a3a', '#3a0a0a']], kinemon: ['fire', 'sword'], tama: ['nature', 'blossom'], yamato: ['ice', 'blizzard'],
  vegapunk: ['light', 'radiance', ['#ffffff', '#d8f8ff', '#5ae0ff', '#0a2a3a']], york: ['light', 'radiance'], morgans: ['fist', 'quake'], loki: ['bolt', 'storm'], dorry: ['sword', 'quake'], brogy: ['sword', 'quake'],
  rocks: ['haki', 'abyss', ['#ffffff', '#ffb0b0', '#ff2a3a', '#1a0005']], imu: ['dark', 'abyss', ['#ffffff', '#ffb0c8', '#c8003a', '#05000a']], roger: ['haki', 'haki']
};
(function () {
  const on = () => window.FXPRO && FXPRO.on();
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2, LOW = typeof LOWFX !== 'undefined' && LOWFX;
  const n = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  const add = o => FXE.add(o);
  const W = () => FXE.W || 400, H = () => FXE.H || 600;
  const motionOK = () => { try { return localStorage.getItem('op_motion') !== '1'; } catch (e) { return true; } };
  /* ---------- 奧義全畫面轉場 ---------- */
  function wash(col, a, life) { add({ life, draw(c, k) { c.globalAlpha = a * (k < .15 ? k / .15 : k > .7 ? (1 - k) / .3 : 1); c.fillStyle = col; c.fillRect(-W(), -H(), W() * 3, H() * 3); } }); }
  const TR = {
    inferno(P) { wash(P[3], .35, 2.2); const fl = []; for (let i = 0; i < n(60); i++) fl.push({ x: R(-.1, 1.1), s: R(30, 90), v: R(.3, .8), ph: R(0, TAU) });
      add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; fl.forEach(f => { const y = H() * (1.1 - ((t * f.v + f.ph / TAU) % 1) * 1.3), x = W() * f.x + Math.sin(t * 3 + f.ph) * 20, r = f.s * (.6 + .4 * Math.sin(t * 6 + f.ph)); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, P[0]); g.addColorStop(.3, P[1]); g.addColorStop(.7, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .7; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }); } }); },
    blizzard(P) { wash(P[3], .3, 2.2); const sn = []; for (let i = 0; i < n(140); i++) sn.push({ x: R(-.2, 1.2), y: R(-.2, 1.2), v: R(.4, 1.2), s: R(1, 3.5) });
      add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; c.strokeStyle = P[0]; c.lineCap = 'round'; sn.forEach(p => { const x = W() * (((p.x - t * p.v * .6) % 1.4 + 1.4) % 1.4 - .2), y = H() * (((p.y + t * p.v) % 1.4) - .2); c.globalAlpha = fa * .9; c.lineWidth = p.s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10 * p.v, y - 16 * p.v); c.stroke(); });
        const g = c.createRadialGradient(W() / 2, H() / 2, Math.min(W(), H()) * .3, W() / 2, H() / 2, Math.max(W(), H()) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, P[1]); c.globalAlpha = fa * .55; c.fillStyle = g; c.fillRect(0, 0, W(), H()); } }); },
    storm(P) { wash('#05050f', .45, 2.2); for (let i = 0; i < n(7); i++) setTimeout(() => { const x = R(.05, .95) * W(); FXE.P.bolt(x, -60, x + R(-80, 80), H() * R(.55, .9), { color: P[2], w: R(3, 7), life: .3 }); FXE.P.flash(P[1], .1, .25); if (window.SFX) try { SFX.play('hit'); } catch (e) { } }, 150 + i * R(150, 260)); },
    tsunami(P) { wash(P[3], .3, 2); add({ add: true, life: 1.8, draw(c, k, dt, t) { const x = W() * (-1.2 + k * 2.6), fa = k > .8 ? (1 - k) / .2 : 1; for (let j = 0; j < 3; j++) { c.globalAlpha = fa * (.55 - j * .15); c.fillStyle = P[2 - j > 0 ? 2 - j : 1]; c.beginPath(); c.moveTo(x - W(), H()); for (let i = 0; i <= 40; i++) { const xx = x - W() + i / 40 * W() * 1.4, yy = H() * (.35 + j * .12) + Math.sin(i * .5 + t * 6 + j) * 24; c.lineTo(xx, yy); } c.lineTo(x + W() * .4, H()); c.closePath(); c.fill(); } } }); },
    abyss(P) { add({ life: 2.2, draw(c, k, dt, t) { const fa = k < .2 ? k / .2 : k > .75 ? (1 - k) / .25 : 1, cx = W() / 2, cy = H() * .45, r = Math.max(W(), H()) * (.3 + k * .6); const g = c.createRadialGradient(cx, cy, r * .2, cx, cy, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.6, P[3]); g.addColorStop(.85, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .75; c.fillStyle = g; c.fillRect(-W(), -H(), W() * 3, H() * 3);
      c.translate(cx, cy); c.rotate(t * 1.5); c.strokeStyle = P[1]; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.globalAlpha = fa * .5; c.beginPath(); for (let j = 0; j < 30; j++) { const rr = j * r / 30, a = j * .22; j ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(0, 0); } c.stroke(); } } }); },
    sandstorm(P) { wash('#5a3a10', .35, 2.2); const ps = []; for (let i = 0; i < n(160); i++) ps.push({ x: R(0, 1), y: R(0, 1), v: R(.6, 1.6), s: R(1, 3) });
      add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; c.fillStyle = '#ffd890'; ps.forEach(p => { const x = W() * (((p.x + t * p.v) % 1.2) - .1), y = H() * p.y + Math.sin(t * 4 + p.x * 20) * 10; c.globalAlpha = fa * .8; c.fillRect(x, y, p.s * 8, p.s); }); } }); },
    radiance(P) { wash('#ffffff', .12, 2); for (let i = 0; i < n(6); i++) setTimeout(() => { const x = R(.1, .9) * W(); add({ add: true, life: .9, draw(c, k) { const w = 60 * (1 - k * .5), g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = (1 - k) * .8; c.fillStyle = g; c.fillRect(x - w, -H(), w * 2, H() * 3); } }); }, i * 180);
      add({ add: true, life: 2, draw(c, k, dt, t) { const fa = k < .2 ? k / .2 : (1 - k) / .8; c.translate(W() / 2, -H() * .1); c.rotate(t * .2); for (let i = 0; i < 16; i++) { c.rotate(TAU / 16); const g = c.createLinearGradient(0, 0, 0, H() * 1.4); g.addColorStop(0, P[0]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .25; c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, H() * 1.4); c.lineTo(40, H() * 1.4); c.closePath(); c.fill(); } } }); },
    haki(P) { wash('#000000', .55, 2.2); add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; if (Math.random() < .5) { for (let i = 0; i < 3; i++) { let x = R(0, W()), y = R(0, H()); c.globalAlpha = fa; c.strokeStyle = Math.random() < .5 ? '#000' : P[2]; c.shadowColor = P[2]; c.shadowBlur = 16; c.lineWidth = R(2, 5); c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 8; j++) { x += R(-60, 60); y += R(-60, 60); c.lineTo(x, y); } c.stroke(); } }
      const r = (t * 900) % (Math.max(W(), H()) * 1.2); c.shadowBlur = 0; c.globalAlpha = fa * .6 * (1 - r / (Math.max(W(), H()) * 1.2)); c.strokeStyle = P[2]; c.lineWidth = 10; c.beginPath(); c.arc(W() / 2, H() * .5, r, 0, TAU); c.stroke(); } }); },
    blossom(P) { wash(P[3], .25, 2.2); const pt = []; for (let i = 0; i < n(80); i++) pt.push({ x: R(-.1, 1.1), y: R(-.6, 0), v: R(.25, .6), r: R(0, TAU), vr: R(-3, 3), s: R(5, 11), sw: R(0, TAU) });
      add({ add: true, life: 2.4, draw(c, k, dt, t) { const fa = k > .8 ? (1 - k) / .2 : 1; pt.forEach(p => { const x = W() * p.x + Math.sin(t * 2 + p.sw) * 30, y = H() * (p.y + t * p.v); c.globalAlpha = fa; c.save(); c.translate(x, y); c.rotate(p.r + t * p.vr); c.fillStyle = P[2]; c.beginPath(); c.moveTo(0, -p.s); c.bezierCurveTo(p.s, -p.s, p.s, p.s * .3, 0, p.s); c.bezierCurveTo(-p.s, p.s * .3, -p.s, -p.s, 0, -p.s); c.fill(); c.fillStyle = P[1]; c.globalAlpha = fa * .6; c.beginPath(); c.arc(0, -p.s * .2, p.s * .35, 0, TAU); c.fill(); c.restore(); }); } }); },
    quake(P) { wash('#000000', .3, 1.8); const cr = []; for (let i = 0; i < 9; i++) { const pts = []; let x = W() * .5 + R(-40, 40), y = H() * .55; const a = R(0, TAU); for (let j = 0; j < 12; j++) { x += Math.cos(a + R(-.6, .6)) * R(30, 60); y += Math.sin(a + R(-.6, .6)) * R(30, 60); pts.push([x, y]); } cr.push(pts); }
      add({ add: true, life: 2, draw(c, k) { const grow = Math.min(1, k * 3), fa = k > .7 ? (1 - k) / .3 : 1; c.lineCap = 'round'; cr.forEach(pts => { const m = Math.ceil(pts.length * grow); [[10, P[2], .5], [3, P[0], 1]].forEach(([w, col, a]) => { c.globalAlpha = fa * a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(W() * .5, H() * .55); for (let j = 0; j < m; j++) c.lineTo(pts[j][0], pts[j][1]); c.stroke(); }); }); } });
      [0, 300, 600].forEach(d => setTimeout(() => { FXE.P.ring(W() / 2, H() * .55, { r1: Math.max(W(), H()) * .7, color: P[1], w: 20, life: .6 }); }, d)); },
    sword(P) { wash('#000000', .4, 1.8); for (let i = 0; i < n(9); i++) setTimeout(() => { const y = R(.15, .85) * H(), a = R(-.5, .5); add({ add: true, life: .45, draw(c, k) { const e = 1 - Math.pow(1 - k, 3), L = W() * 1.6; c.translate(W() / 2, y); c.rotate(a); const g = c.createLinearGradient(-L / 2, 0, L / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(Math.max(0, e - .2), P[2]); g.addColorStop(e, '#ffffff'); g.addColorStop(Math.min(1, e + .02), 'rgba(0,0,0,0)'); c.globalAlpha = 1 - k * .7; c.fillStyle = g; c.fillRect(-L / 2, -3 - (1 - k) * 4, L, 6 + (1 - k) * 8); } }); if (window.SFX) try { SFX.play('whoosh'); } catch (e) { } }, i * 110); },
    poison(P) { wash('#1a0a2a', .4, 2.2); const bb = []; for (let i = 0; i < n(40); i++) bb.push({ x: R(0, 1), y: R(.5, 1.1), v: R(.1, .35), s: R(14, 46), ph: R(0, TAU) });
      add({ life: 2.2, draw(c, k, dt, t) { const fa = k < .15 ? k / .15 : k > .75 ? (1 - k) / .25 : 1; bb.forEach(b => { const x = W() * b.x + Math.sin(t * 2 + b.ph) * 16, y = H() * (b.y - t * b.v), g = c.createRadialGradient(x, y, 0, x, y, b.s); g.addColorStop(0, P[1]); g.addColorStop(.6, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .55; c.fillStyle = g; c.beginPath(); c.arc(x, y, b.s, 0, TAU); c.fill(); }); } }); },
    thread(P) { wash('#000000', .35, 2.2); const th = []; for (let i = 0; i < n(26); i++) { const a = R(0, TAU); th.push({ x1: W() / 2 + Math.cos(a) * W(), y1: H() * .45 + Math.sin(a) * H(), x2: W() / 2 + Math.cos(a + Math.PI + R(-.4, .4)) * W(), y2: H() * .45 + Math.sin(a + Math.PI + R(-.4, .4)) * H(), d: R(0, .4) }); }
      add({ add: true, life: 2.2, draw(c, k) { const fa = k > .8 ? (1 - k) / .2 : 1; th.forEach(l => { const e = Math.max(0, Math.min(1, (k - l.d) * 3)); if (!e) return; c.globalAlpha = fa; c.strokeStyle = P[1]; c.shadowColor = P[2]; c.shadowBlur = 10; c.lineWidth = 1.6; c.beginPath(); c.moveTo(l.x1, l.y1); c.lineTo(l.x1 + (l.x2 - l.x1) * e, l.y1 + (l.y2 - l.y1) * e); c.stroke(); }); } }); }
  };
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof playChoreo !== 'function') return; const _p = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      if (!on() || !actor) return _p.apply(this, arguments); const C = CHAR_FX[actor.id] || CHAR_FX[(actor.id || '').replace(/_.*/, '')];
      if (C && skill && skill.ultimate && TR[C[1]]) { try { TR[C[1]](C[2] || (window.__FXPAL && __FXPAL[C[0]]) || ['#ffffff', '#ffe0a0', '#ff8a3a', '#2a0a0a']); } catch (e) { } }
      return _p.apply(this, arguments); };
  });
  window.__FXTR = TR;
})();

/* ==== 原 js/fx_v140.js ==== */
/* v140 每位角色的招牌動畫（MOTIF）：每次出招都會出現該角色的招牌元素，奧義時規模更大。
   例：路飛橡膠拳影、索隆阿修羅鬼影、艾斯火拳、青雉冰原、艾涅爾雷鼓、羅的 ROOM、漢庫克愛心、多佛朗明哥鳥籠、
   馬爾科不死鳥、凱多青龍、美音音符、莫莉亞蝙蝠、卡塔庫栗年糕、黃猿光束、赤犬岩漿拳、BIG MOM 太陽雲……
   與技能特效共用開關 op_fxpro（低＝不顯示）。 */
const MOTIF = {
  luffy0: 'rubber', nami: 'clima', luffy: 'rubber', luffy_nika: 'nika', zoro: 'asura', sanji: 'kick', robin: 'hands', franky: 'robo', brook: 'notes', jinbe: 'waterfist',
  coby0: 'fist', morgan: 'axe', marine: 'fist', koby_mf: 'fist', garp_mf: 'meteor', garp_hc: 'meteor', koby_hc: 'fist', akainu: 'magma', aokiji: 'icefield', kizaru: 'beams',
  magellan: 'hydra', lucci: 'claws', vergo: 'bamboo', mihawk: 'greenslash', mihawk_w: 'greenslash', crocodile: 'sandspiral', doflamingo: 'birdcage', kuma: 'paws', kuma_eh: 'paws',
  moria: 'bats', law: 'room', law_w: 'room', hancock: 'hearts', weevil: 'axe', blackbeard_w: 'blackhole', blackbeard: 'blackhole', ace: 'firefist', marco: 'phoenix',
  uta: 'notes', king: 'pteranodon', katakuri: 'mochi', catarina: 'foxfire', burgess: 'meteor', vasco: 'firefist', shanks: 'kingsaura', roger: 'kingsaura', buggy: 'parts',
  whitebeard: 'crack', bigmom: 'homies', kaido: 'dragon', makino: 'notes', mayor: 'fist', lordcoast: 'hydra', vivi: 'waterfist', koza: 'fist', enel: 'drums', wiper: 'meteor',
  perona: 'ghosts', hody: 'sharks', shirahoshi: 'seakings', monet: 'snow', sugar: 'toys', kid: 'magnet', kinemon: 'foxfire', tama: 'fist', yamato: 'icefield', vegapunk: 'beams',
  york: 'beams', morgans: 'claws', loki: 'drums', dorry: 'giantblade', brogy: 'giantblade', rocks: 'kingsaura', imu: 'blackhole'
};
(function () {
  const on = () => window.FXPRO && FXPRO.on();
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2, LOW = typeof LOWFX !== 'undefined' && LOWFX;
  const n = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  const add = o => FXE.add(o), P = () => FXE.P;
  const later = (ms, f) => setTimeout(() => { try { f(); } catch (e) { } }, ms / (window.BSPEED || 1));
  const fade = (k, a, b) => k < a ? k / a : k > b ? Math.max(0, (1 - k) / (1 - b)) : 1;
  function heart(c, s) { c.beginPath(); c.moveTo(0, s * .3); c.bezierCurveTo(-s, -s * .4, -s * .4, -s * 1.1, 0, -s * .45); c.bezierCurveTo(s * .4, -s * 1.1, s, -s * .4, 0, s * .3); c.fill(); }
  function fist(c, s, col) { c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, s, s * .8, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(s * .55, -s * .5 + i * s * .34, s * .2, s * .14, 0, 0, TAU); c.fill(); } }
  /* 投射物：從施放者飛到目標 */
  function fly(A, draw, o) { o = o || {}; const life = o.life || .45; add({ add: o.add !== false, life, draw(c, k) { const e = o.ease ? o.ease(k) : 1 - Math.pow(1 - k, 2), x = A.f.x + (A.t.x - A.f.x) * e, y = A.f.y + (A.t.y - A.f.y) * e - Math.sin(k * Math.PI) * (o.arc || 0); c.globalAlpha = fade(k, .05, .9); c.translate(x, y); if (A.d < 0) c.scale(-1, 1); draw(c, k); } }); }
  function fwings(x, y, cols, life, sc) { add({ add: true, life, draw(c, k, dt, t) { c.globalAlpha = fade(k, .12, .75); const flap = Math.sin(t * 10) * .3; [-1, 1].forEach(sd => { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + sd * (.5 + i * .17 + flap), L = (110 + i * 22) * sc, g = c.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L); g.addColorStop(0, cols[0]); g.addColorStop(.5, cols[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.strokeStyle = g; c.lineWidth = (18 - i * 1.5) * sc; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a - sd * .3) * L * .6, y + Math.sin(a - sd * .3) * L * .6, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); } }); } }); }
  const M = {
    rubber(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 70, () => fly({ ...A, t: { x: A.t.x, y: A.t.y + R(-50, 40) } }, (c, k) => { c.save(); c.scale(1 + k * .6, 1 + k * .6); fist(c, big ? 34 : 24, '#f0b98a'); c.restore(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(-40 - j * 14, -12 + j * 12); c.lineTo(-90 - j * 14, -12 + j * 12); c.stroke(); } }, { life: .3, add: false })); },
    nika(A, big) { P().rays(A.f.x, A.f.y - 40, { r: big ? 520 : 320, life: 1.2 }); for (let i = 0; i < n(big ? 30 : 14); i++) later(i * 30, () => P().text(A.f.x + R(-140, 140), A.f.y + R(-160, 40), '咚', { size: R(26, 44), life: .7, color: '#ffffff', color2: '#ffe08a', rot: R(-.4, .4) })); },
    asura(A, big) { const ghosts = big ? 3 : 1; for (let g = 0; g < ghosts; g++) add({ life: 1.1, draw(c, k) { c.globalAlpha = fade(k, .15, .6) * .55; c.translate(A.f.x + A.d * (g - 1) * 50, A.f.y - 30 - g * 10); c.scale(1.4 + g * .1, 1.4 + g * .1); c.fillStyle = '#1a3a2a'; c.shadowColor = '#3adf8a'; c.shadowBlur = 30; c.beginPath(); c.ellipse(0, -60, 34, 42, 0, 0, TAU); c.fill(); c.fillStyle = '#ff3a3a'; c.beginPath(); c.arc(-12, -66, 5, 0, TAU); c.arc(12, -66, 5, 0, TAU); c.fill(); } });
      for (let i = 0; i < (big ? 9 : 3); i++) later(200 + i * 80, () => P().slash(A.t.x + R(-30, 30), A.t.y + R(-40, 30), { r: 150, a: R(-3, 0), span: 2, color: '#c8ffd8', w: 14, life: .3 })); },
    kick(A, big) { for (let i = 0; i < (big ? 6 : 3); i++) later(i * 90, () => P().crescent(A.f.x, A.f.y + 20, A.t.x, A.t.y + R(-40, 40), { color: big ? '#8fd8ff' : '#ffb04a', life: .35 })); },
    hands(A, big) { P().hands(A.t.x, A.t.y, { n: big ? 24 : 10 }); P().particles({ x: A.t.x, y: A.t.y, n: big ? 40 : 18, spd: [80, 260], life: [.6, 1], size: [4, 8], colors: ['#ff8ad8', '#ffd0f0', '#ffffff'], drag: 2 }); },
    robo(A, big) { P().beam(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y, { c2: '#5ad8ff', w: big ? 50 : 26, life: .6 }); },
    notes(A, big) { const s = '♪♫♬♩'; for (let i = 0; i < n(big ? 26 : 10); i++) later(i * 45, () => { const x0 = A.f.x + R(-40, 40), y0 = A.f.y + R(-80, 20), tx = A.t.x + R(-60, 60), ty = A.t.y + R(-80, 40), ch = s[(Math.random() * 4) | 0], col = ['#ff8ad8', '#8fd8ff', '#ffe08a'][(Math.random() * 3) | 0];
      add({ add: true, life: .9, draw(c, k) { const x = x0 + (tx - x0) * k, y = y0 + (ty - y0) * k - Math.sin(k * Math.PI) * 60; c.globalAlpha = fade(k, .1, .8); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.font = '900 34px serif'; c.textAlign = 'center'; c.fillText(ch, x, y); } }); }); },
    waterfist(A, big) { P().wave(A.f.x, A.t.x, A.t.y + 40, { h: big ? 220 : 130, life: .7 }); fly(A, (c) => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 50); g.addColorStop(0, '#fff'); g.addColorStop(.4, '#8fd8ff'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, big ? 70 : 46, 0, TAU); c.fill(); }, { life: .4 }); },
    fist(A, big) { fly(A, (c, k) => { c.save(); c.scale(1 + k, 1 + k); fist(c, big ? 30 : 20, '#e8b88a'); c.restore(); }, { life: .3, add: false }); },
    axe(A, big) { P().slash(A.t.x, A.t.y, { r: big ? 220 : 150, a: -2.8, span: 2.6, color: '#d0d8e8', w: 30, life: .4 }); },
    meteor(A, big) { for (let i = 0; i < (big ? 9 : 3); i++) later(i * 110, () => { const x = A.t.x + R(-90, 90); add({ add: true, life: .45, draw(c, k) { const y = -120 + (A.t.y + 120) * k * k, xx = x + (A.t.x - x) * k; c.globalAlpha = 1; const g = c.createLinearGradient(xx, y - 120, xx, y); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, '#ffd08a'); c.strokeStyle = g; c.lineWidth = 14; c.beginPath(); c.moveTo(xx - 30, y - 120); c.lineTo(xx, y); c.stroke(); c.fillStyle = '#5a4030'; c.beginPath(); c.arc(xx, y, 22, 0, TAU); c.fill(); } }); later(430, () => P().burst(x, A.t.y, { color: '#ffaa5a', r: 90 })); }); },
    magma(A, big) { fly(A, (c, k) => { const s = (big ? 90 : 50) * (1 + k * .5); const g = c.createRadialGradient(0, 0, 0, 0, 0, s); g.addColorStop(0, '#fff2a0'); g.addColorStop(.4, '#ff6a1a'); g.addColorStop(.8, '#8a1000'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); }, { life: .5 }); later(450, () => P().flames(A.t.x, A.t.y, { n: big ? 70 : 30 })); },
    icefield(A, big) { add({ add: true, life: 1.2, draw(c, k) { const w = 900 * Math.min(1, k * 2.5); c.globalAlpha = fade(k, .05, .7) * .55; const g = c.createLinearGradient(A.f.x, 0, A.f.x + A.d * w, 0); g.addColorStop(0, '#e8fbff'); g.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = g; c.save(); c.translate(0, A.f.y + 120); c.scale(1, .18); c.fillRect(Math.min(A.f.x, A.f.x + A.d * w), -200, w, 400); c.restore(); } });
      P().spikes && later(250, () => P().spikes(A.t.x, A.t.y + 80, { n: big ? 18 : 8, color: '#bff4ff' })); },
    beams(A, big) { for (let i = 0; i < (big ? 12 : 4); i++) later(i * 60, () => P().beam(A.f.x, A.f.y - R(10, 60), A.t.x + R(-40, 40), A.t.y + R(-60, 40), { c2: '#ffe86f', w: 10, life: .28 })); },
    hydra(A, big) { for (let i = 0; i < (big ? 3 : 1); i++) later(i * 160, () => P().serpent(A.f.x, A.f.y + 40 - i * 40, A.t.x, A.t.y - 20 + i * 30, { body: '#7a3ad8', belly: '#c88aff', eye: '#ffef5a', life: .9, len: 420, w: 40 })); },
    claws(A, big) { P().claws(A.t.x, A.t.y, { color: '#ffe0a0' }); if (big) later(200, () => P().claws(A.t.x, A.t.y, { color: '#ffffff' })); },
    bamboo(A, big) { for (let i = 0; i < (big ? 6 : 3); i++) later(i * 70, () => P().slash(A.t.x + R(-30, 30), A.t.y, { r: 140, a: -1.6, span: .3, color: '#5aff8a', w: 12, life: .25 })); },
    greenslash(A, big) { add({ add: true, life: .6, draw(c, k) { const x = A.f.x + (A.t.x - A.f.x + A.d * 300) * k, h = big ? 520 : 300; c.globalAlpha = fade(k, .05, .7); c.translate(x, A.t.y); c.rotate(.15 * A.d); const g = c.createLinearGradient(-40, 0, 20, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, '#3affb0'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -h / 2); c.quadraticCurveTo(40 * A.d, 0, 0, h / 2); c.quadraticCurveTo(10 * A.d, 0, 0, -h / 2); c.fill(); } }); },
    sandspiral(A, big) { P().tornado(A.t.x, A.t.y + 40, { life: big ? 1.4 : .9, smoke: '#d9b064' }); },
    birdcage(A, big) { add({ add: true, life: big ? 1.6 : .9, draw(c, k) { const e = Math.min(1, k * 2), r = big ? 260 : 150; c.globalAlpha = fade(k, .05, .75); c.strokeStyle = '#ffd0f0'; c.shadowColor = '#ff5ad0'; c.shadowBlur = 10; c.lineWidth = 1.5; const cx = A.t.x, cy = A.t.y; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI; c.beginPath(); c.ellipse(cx, cy - r * .2, r * Math.abs(Math.cos(a)) + 2, r * e, 0, 0, TAU); c.stroke(); } } }); },
    paws(A, big) { for (let i = 0; i < (big ? 7 : 3); i++) later(i * 90, () => fly({ ...A, t: { x: A.t.x + R(-40, 40), y: A.t.y + R(-50, 40) } }, (c, k) => { c.fillStyle = 'rgba(255,190,120,.9)'; c.beginPath(); c.arc(0, 8, 26, 0, TAU); c.fill(); [[-22, -20], [-8, -30], [8, -30], [22, -20]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); }); }, { life: .35 })); },
    bats(A, big) { for (let i = 0; i < n(big ? 30 : 12); i++) later(i * 25, () => { const y0 = A.f.y + R(-100, 40), y1 = A.t.y + R(-80, 60); add({ life: .8, draw(c, k) { const x = A.f.x + (A.t.x - A.f.x) * k, y = y0 + (y1 - y0) * k + Math.sin(k * 20) * 10, f = Math.sin(k * 40) * 10; c.globalAlpha = fade(k, .1, .8); c.fillStyle = '#1a0a2a'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 18, y - 6 + f); c.lineTo(x - 8, y + 2); c.lineTo(x, y + 6); c.lineTo(x + 8, y + 2); c.lineTo(x + 18, y - 6 + f); c.closePath(); c.fill(); } }); }); },
    room(A, big) { add({ add: true, life: big ? 1.6 : 1, draw(c, k) { const r = (big ? 360 : 240) * Math.min(1, k * 3); c.globalAlpha = fade(k, .05, .8) * .5; c.strokeStyle = '#8fe0ff'; c.lineWidth = 3; c.beginPath(); c.arc((A.f.x + A.t.x) / 2, (A.f.y + A.t.y) / 2, r, 0, TAU); c.stroke(); const g = c.createRadialGradient((A.f.x + A.t.x) / 2, (A.f.y + A.t.y) / 2, r * .7, (A.f.x + A.t.x) / 2, (A.f.y + A.t.y) / 2, r); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(1, 'rgba(120,200,255,.35)'); c.fillStyle = g; c.fill(); } });
      later(300, () => P().slash(A.t.x, A.t.y, { r: 200, a: A.d > 0 ? -.3 : -2.8, span: .5, color: '#bff0ff', w: 10, life: .3 })); },
    hearts(A, big) { for (let i = 0; i < n(big ? 34 : 14); i++) later(i * 30, () => { const x0 = A.f.x + R(-30, 30), y0 = A.f.y + R(-60, 20), tx = A.t.x + R(-60, 60), ty = A.t.y + R(-80, 50), s = R(10, 20); add({ add: true, life: .8, draw(c, k) { c.globalAlpha = fade(k, .1, .8); c.translate(x0 + (tx - x0) * k, y0 + (ty - y0) * k); c.rotate(Math.sin(k * 10) * .3); c.fillStyle = '#ff5aa8'; c.shadowColor = '#ff8ad8'; c.shadowBlur = 12; heart(c, s); } }); }); },
    blackhole(A, big) { P().vortex(A.t.x, A.t.y, { r: big ? 200 : 110, color: '#2a0a3a', core: '#000000', rim: '#8a5aff', arms: 6, spin: 10, life: big ? 1.4 : .8 }); },
    firefist(A, big) { fly(A, (c, k) => { const s = big ? 110 : 60; c.save(); c.scale(1 + k * .4, 1 + k * .4); const g = c.createRadialGradient(0, 0, 0, 0, 0, s); g.addColorStop(0, '#fff4c0'); g.addColorStop(.35, '#ffa02e'); g.addColorStop(.8, '#ff3a0a'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); fist(c, s * .35, 'rgba(255,240,200,.9)'); c.restore(); }, { life: .5 }); },
    phoenix(A, big) { fwings(A.f.x, A.f.y - 30, ['#e8fbff', '#3ad8ff'], big ? 1.4 : .9, big ? 1.4 : 1); P().flames(A.f.x, A.f.y, { n: big ? 60 : 24, colors: ['#e8fbff', '#5ae0ff', '#2a8aff'] }); },
    pteranodon(A, big) { P().flames(A.f.x, A.f.y, { n: big ? 60 : 24 }); fwings(A.f.x, A.f.y - 30, ['#fff0c0', '#ff6a2a'], .9, big ? 1.3 : 1); },
    mochi(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 80, () => fly({ ...A, t: { x: A.t.x, y: A.t.y + R(-50, 40) } }, (c, k) => { c.fillStyle = '#f4e8f0'; c.strokeStyle = '#c8a8c0'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 34, 28, 0, 0, TAU); c.fill(); c.stroke(); }, { life: .35, add: false })); },
    foxfire(A, big) { for (let i = 0; i < (big ? 9 : 4); i++) later(i * 60, () => fly({ ...A, t: { x: A.t.x + R(-50, 50), y: A.t.y + R(-60, 40) } }, (c) => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 28); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, '#8a5aff'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 28, 0, TAU); c.fill(); }, { life: .5, arc: R(-80, 80) })); },
    kingsaura(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 60, () => { const a = R(0, TAU), L = R(120, 300); P().bolt(A.f.x, A.f.y, A.f.x + Math.cos(a) * L, A.f.y + Math.sin(a) * L, { color: Math.random() < .5 ? '#140000' : '#ff2a3a', w: 5, life: .3 }); }); if (big) P().ring(A.f.x, A.f.y, { r1: 600, color: '#ff2a3a', w: 24, life: .7 }); },
    parts(A, big) { for (let i = 0; i < (big ? 10 : 4); i++) later(i * 60, () => fly({ ...A, t: { x: A.t.x + R(-60, 60), y: A.t.y + R(-60, 50) } }, (c, k) => { c.rotate(k * 12); c.fillStyle = '#e8c0a0'; c.fillRect(-14, -6, 28, 12); }, { life: .45, arc: 100, add: false })); },
    crack(A, big) { P().cracks && P().cracks(A.t.x, A.t.y, { n: big ? 18 : 10 }); add({ add: true, life: .7, draw(c, k) { const r = 60 + 300 * k; c.globalAlpha = (1 - k) * .8; c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.arc(A.t.x, A.t.y, r, 0, TAU); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(A.t.x, A.t.y, r * .8, 0, TAU); c.stroke(); } }); },
    homies(A, big) { fly(A, (c, k) => { const s = big ? 70 : 44; const g = c.createRadialGradient(0, 0, 0, 0, 0, s); g.addColorStop(0, '#fff7c0'); g.addColorStop(.6, '#ff9a2e'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); c.fillStyle = '#3a1a0a'; c.beginPath(); c.arc(-12, -8, 5, 0, TAU); c.arc(12, -8, 5, 0, TAU); c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a1a0a'; c.beginPath(); c.arc(0, 4, 12, 0, Math.PI); c.stroke(); }, { life: .55, arc: 60 }); },
    dragon(A, big) { P().serpent(A.f.x - A.d * 160, A.f.y + 40, A.t.x + A.d * 80, A.t.y - 40, { body: '#3f7fe8', belly: '#bfe8ff', eye: '#ff5a5a', horn: true, fins: true, fin: '#e8c170', life: big ? 1.2 : .8, len: big ? 520 : 360, w: big ? 60 : 44 }); },
    clima(A, big) { P().puffs && P().puffs(A.t.x, A.t.y - 190, { n: big ? 12 : 6, rad: big ? 140 : 80, life: .9, color: '#e8f0ff' }); for (let i = 0; i < (big ? 6 : 2); i++) later(160 + i * 110, () => { P().bolt(A.t.x + R(-60, 60), A.t.y - 190, A.t.x + R(-20, 20), A.t.y, { color: i % 2 ? '#8fd8ff' : '#fff3a0', w: 6, life: .28 }); }); },
    drums(A, big) { P().drums && P().drums(A.f.x, A.f.y - 40, { life: 1 }); for (let i = 0; i < (big ? 6 : 2); i++) later(150 + i * 120, () => { P().bolt(A.t.x + R(-60, 60), -40, A.t.x + R(-20, 20), A.t.y, { color: '#ffe86f', w: 6, life: .3 }); P().flash('#fffbd0', .08, .2); }); },
    ghosts(A, big) { for (let i = 0; i < n(big ? 14 : 6); i++) later(i * 60, () => fly({ ...A, t: { x: A.t.x + R(-60, 60), y: A.t.y + R(-80, 40) } }, (c, k) => { c.fillStyle = 'rgba(255,240,255,.85)'; c.beginPath(); c.arc(0, -6, 16, Math.PI, 0); c.lineTo(16, 12); for (let j = 0; j < 4; j++) c.lineTo(12 - j * 8, 6 + (j % 2) * 6); c.closePath(); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(-5, -6, 2.5, 0, TAU); c.arc(5, -6, 2.5, 0, TAU); c.fill(); }, { life: .7, arc: R(-60, 60), add: false })); },
    sharks(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 80, () => P().serpent(A.f.x, A.f.y + R(-60, 40), A.t.x, A.t.y + R(-40, 40), { body: '#6f8fa8', belly: '#e8f2f8', eye: '#ffd23b', fins: true, fin: '#8fb0c8', life: .45, len: 220, w: 34 })); },
    seakings(A, big) { for (let i = 0; i < (big ? 3 : 1); i++) later(i * 200, () => P().serpent(A.f.x - A.d * 220, A.f.y + 60 - i * 50, A.t.x, A.t.y - 40 + i * 40, { body: '#2f9f8a', belly: '#c9f5e6', eye: '#ffef5a', fins: true, life: 1, len: 520, w: 56 })); },
    snow(A, big) { P().particles({ x: A.t.x, y: A.t.y - 120, n: big ? 70 : 30, spd: [40, 160], ang: [1.2, 1.9], life: [.8, 1.3], size: [3, 6], colors: ['#ffffff', '#e8fbff'], drag: 1 }); },
    toys(A, big) { for (let i = 0; i < (big ? 6 : 3); i++) later(i * 80, () => P().text(A.t.x + R(-60, 60), A.t.y + R(-60, 30), ['🧸', '🎈', '🪀'][i % 3], { size: 40, life: .7 })); },
    magnet(A, big) { for (let i = 0; i < n(big ? 30 : 12); i++) later(i * 25, () => fly({ ...A, f: { x: A.f.x + R(-120, 120), y: A.f.y + R(-160, 40) } }, (c, k) => { c.rotate(k * 10); c.fillStyle = '#9aa8b8'; c.fillRect(-10, -4, 20, 8); }, { life: .4, add: false })); },
    giantblade(A, big) { add({ add: true, life: .55, draw(c, k) { const a = -2.4 + k * 2.4; c.globalAlpha = fade(k, .05, .7); c.translate(A.t.x - A.d * 60, A.t.y - 200); c.rotate(A.d > 0 ? a : -a); c.fillStyle = '#d8e0f0'; c.shadowColor = '#ffffff'; c.shadowBlur = 20; c.fillRect(-14, 0, 28, big ? 420 : 300); } }); }
  };
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof playChoreo !== 'function') return; const _p = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      /* v171：招牌元素不再每招都出現（同一個鳥籠／拳影每招都蓋滿畫面，招式看起來都一樣）：奧義一定有，一般招只有第 1、3 招 */
      const f = on() && actor && MOTIF[actor.id] && (!skill || skill.ultimate || idx % 2 === 0) && M[MOTIF[actor.id]];
      if (f) { try { const S = side === 'P' ? 'L' : 'R', T = S === 'L' ? 'R' : 'L', A = { S, T, f: fighterPoint(S), t: fighterPoint(T), d: S === 'L' ? 1 : -1 }; const big = !!(skill && skill.ultimate), sup = skill && skill.type === 'support';
        if (sup && !['nika', 'phoenix', 'pteranodon', 'asura', 'kingsaura', 'drums', 'room', 'notes'].includes(MOTIF[actor.id])) { /* 輔助招式：招牌元素繞著自己 */ later(200, () => f({ ...A, t: { x: A.f.x + A.d * 10, y: A.f.y - 60 } }, big)); }
        else later(big ? 900 : 220, () => f(A, big)); } catch (e) { } }
      return _p.apply(this, arguments); };
  });
  window.__MOTIF = M;
})();

/* ==== 原 js/fx3d_v145.js ==== */
/* v145 戰鬥特效 3D 層（Three.js / WebGL2）：
   ① 背景層 #bGL：戰鬥背景改用 GPU 繪製——命中時衝擊波扭曲背景（含色差）、奧義時鏡頭推近＋放射模糊、依招式屬性打光、火系熱浪。
   ② 粒子層 #bPGL：GPU 粒子（一次最多數千顆），依屬性有火星與火焰、冰晶、電火花、水珠與氣泡、暗黑煙霧、光點、花瓣、碎石與煙塵、斬擊光痕。
   ③ 奧義最後一擊的「衝擊格」（黑白反轉兩格）、出招殘影、受擊全身閃白。
   原本的 2D 特效（fx.js、fx_v138.js、各角色編排）照常播放，這一層疊加在上面。
   開關：技能特效「高」（op_fxpro）且畫質不是「省電」（op_gfx）才開；不支援 WebGL2 時自動不開。Three.js 在第一次進戰鬥時才載入。 */
(function () {
  const ok = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })();
  const enabled = () => { try { return ok && localStorage.getItem('op_fxpro') !== '0' && localStorage.getItem('op_gfx') !== 'low' && !window.__fxAuto3DOff; } catch (e) { return ok; } }; /* v171：__fxAuto3DOff＝實際掉幀時自動關閉（fx_v171.js） */
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const THEME = { '火': 'fire', '冰': 'ice', '雷電': 'bolt', '水': 'water', '魚人': 'water', '闇': 'dark', '超能': 'psy', '龍': 'psy', '自然': 'nature', '格鬥': 'fist', '獸': 'fist', '巨人': 'fist' };
  const COLT = { blue: 'ice', gold: 'light', red: 'fire', purple: 'dark', green: 'nature' };
  const PAL0 = { fire: ['#fff3c0', '#ffb02e', '#ff4a1a', '#7a1200'], ice: ['#ffffff', '#c8f4ff', '#6fd3ff', '#1a5aa8'], bolt: ['#ffffff', '#fff27a', '#ffd23b', '#6a8aff'], water: ['#ffffff', '#bfeaff', '#3fa8ff', '#0a3a8a'], dark: ['#f0d0ff', '#b05aff', '#5a1a9a', '#120018'], light: ['#ffffff', '#fff6c8', '#ffd86a', '#8a6a1a'], fist: ['#ffffff', '#ffe0a0', '#ff8a3a', '#5a2a0a'] };
  const pal = th => (window.__FXPAL && __FXPAL[th]) || PAL0[th] || PAL0.fist;
  const themeOf = f => { const C = f && typeof CHAR_FX !== 'undefined' && CHAR_FX[f.id]; if (C) return C[0]; for (const x of (f && f.types) || []) if (THEME[x]) return THEME[x]; return 'fist'; };
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  let T = null, loading = null, rd = null, prd = null, bgM = null, bgS = null, cam = null, pS = null, pCam = null, ADD = null, NRM = null;
  const MAXP = MOB ? 1400 : 3200;
  /* ---------- 載入 ---------- */
  function load() { if (T || loading || !enabled()) return loading; loading = import('three').then(m => { T = m; init(); }).catch(e => { console.warn('戰鬥 3D 特效載入失敗', e); }); return loading; }

  /* ---------- ① 背景層 ---------- */
  const BG_FS = `uniform sampler2D tBg; uniform vec2 uRes, uImg, uZC; uniform float uTime, uDim, uSat, uZoom, uRad, uTintK, uHaze, uReady; uniform vec3 uTint; uniform vec4 uW[4]; varying vec2 vUv;
    vec2 cover(vec2 uv){ float sa = uRes.x/uRes.y, ia = uImg.x/uImg.y; vec2 s = sa > ia ? vec2(1., ia/sa) : vec2(sa/ia, 1.); return (uv - .5)*s + .5; }
    float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float ns(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
    void main(){ vec2 asp = vec2(uRes.x/uRes.y, 1.); vec2 uv = vUv; vec2 off = vec2(0.); float ca = 0.;
      for (int i = 0; i < 4; i++) { vec4 w = uW[i]; float age = uTime - w.z; if (w.w <= 0. || age < 0. || age > .9) continue; float r = age*1.35, d = length((uv - w.xy)*asp), k = exp(-pow((d - r)/.07, 2.)) * w.w * (1. - age/.9); off += normalize((uv - w.xy)*asp + 1e-5) * k * .035; ca += k; }
      if (uHaze > 0.) off += vec2(ns(uv*8. + vec2(0., -uTime*2.)) - .5, ns(uv*7. + vec2(uTime, -uTime*1.6)) - .5) * .012 * uHaze;
      uv = uZC + (uv + off - uZC) / uZoom;
      vec3 col = vec3(0.); float n = uRad > .001 ? 8. : 1.;
      for (int i = 0; i < 8; i++) { if (float(i) >= n) break; vec2 su = uZC + (uv - uZC) * (1. - uRad*float(i)/8.*.12); vec2 cu = cover(su);
        col += vec3(texture2D(tBg, cover(su + vec2(ca*.006, 0.))).r, texture2D(tBg, cu).g, texture2D(tBg, cover(su - vec2(ca*.006, 0.))).b); }
      col /= n; float l = dot(col, vec3(.299,.587,.114)); col = mix(vec3(l), col, uSat) * uDim;
      col = mix(col, col*(.55 + uTint*.75), uTintK); vec2 q = vUv - .5; col *= 1. - dot(q, q)*.5;
      gl_FragColor = vec4(col * uReady, uReady); }`;
  const BU = {};
  function initBg() {
    const scr = $('battleScreen'), cv = document.createElement('canvas'); cv.id = 'bGL'; cv.className = 'b-gl'; cv.setAttribute('aria-hidden', 'true'); $('bBg').insertAdjacentElement('afterend', cv);
    rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); rd.setClearColor(0x000000, 0);
    Object.assign(BU, { tBg: { value: null }, uRes: { value: new T.Vector2(1, 1) }, uImg: { value: new T.Vector2(16, 9) }, uZC: { value: new T.Vector2(.5, .5) }, uTime: { value: 0 }, uDim: { value: .66 }, uSat: { value: 1.1 }, uZoom: { value: 1 }, uRad: { value: 0 }, uTintK: { value: 0 }, uHaze: { value: 0 }, uReady: { value: 0 }, uTint: { value: new T.Color(1, 1, 1) }, uW: { value: [0, 1, 2, 3].map(() => new T.Vector4(0, 0, -9, 0)) } });
    bgM = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ uniforms: BU, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: BG_FS, transparent: true, depthTest: false }));
    bgS = new T.Scene(); bgS.add(bgM); cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    /* 背景圖換了就重新載入（battle.js 設定 #bBg 的 background-image） */
    const sync = () => { const m = /url\(["']?([^"')]+)["']?\)/.exec($('bBg').style.backgroundImage || ''); const url = m && m[1]; if (!url || url === BS.url) return; BS.url = url; BU.uReady.value = 0; $('battleScreen').classList.remove('gl-bg');
      new T.TextureLoader().load(url, t => { if (BS.url !== url) return; t.colorSpace = T.SRGBColorSpace; t.minFilter = T.LinearFilter; t.generateMipmaps = false; if (BU.tBg.value) BU.tBg.value.dispose(); BU.tBg.value = t; BU.uImg.value.set(t.image.width, t.image.height); BU.uReady.value = 1; $('battleScreen').classList.add('gl-bg'); wake(); }); };
    new MutationObserver(sync).observe($('bBg'), { attributes: true, attributeFilter: ['style'] }); sync();
    new MutationObserver(() => wake()).observe(scr, { attributes: true, attributeFilter: ['class'] });
  }
  const BS = { url: '', zoom: 1, zT: 1, rad: 0, rT: 0, tint: [1, 1, 1], tK: 0, tT: 0, haze: 0, hT: 0, zc: [.5, .5], waves: 0 };

  /* ---------- ② 粒子層：每顆粒子是一個面片（可拉長成光痕、旋轉、換形狀） ---------- */
  const P_VS = `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; varying vec2 vUv; varying vec4 vCol; varying float vShape;
    void main(){ vUv = uv; vCol = vec4(iC.rgb, iB.w); vShape = iC.w; vec2 p = position.xy; p.x *= iB.y; float c = cos(iB.z), s = sin(iB.z); p = mat2(c, s, -s, c) * p * iB.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(iA.xy + p, 0., 1.); }`;
  const P_FS = `varying vec2 vUv; varying vec4 vCol; varying float vShape; void main(){ vec2 q = vUv*2. - 1.; float r = length(q); float a;
      if (vShape < .5) { a = exp(-r*r*4.5) + smoothstep(.22, 0., r)*.9; }                                   /* 光點 */
      else if (vShape < 1.5) { a = exp(-q.y*q.y*18.) * smoothstep(1., .2, abs(q.x)) * (1. + smoothstep(.5, 1., q.x)); }   /* 光痕（往前方較亮） */
      else if (vShape < 2.5) { a = smoothstep(1., .9, abs(q.x) + abs(q.y)) * (.55 + .45*(1. - abs(q.x))) ; }       /* 冰晶 */
      else if (vShape < 3.5) { a = smoothstep(.12, 0., abs(r - .8)) + smoothstep(.95, .0, r)*.12; }           /* 圓環（衝擊波、氣泡） */
      else if (vShape < 4.5) { a = smoothstep(1., .1, r) * .55; }                                               /* 煙霧 */
      else if (vShape < 5.5) { vec2 k = q*vec2(1., 2.); a = smoothstep(1., .75, length(k)); }                  /* 花瓣、葉片 */
      else if (vShape < 6.5) { a = smoothstep(1., .85, max(abs(q.x), abs(q.y))) ; }                             /* 碎石 */
      else { float st = max(exp(-q.x*q.x*60.)*smoothstep(1., 0., abs(q.y)), exp(-q.y*q.y*60.)*smoothstep(1., 0., abs(q.x))); a = st + exp(-r*r*8.)*.6; }  /* 十字星光 */
      gl_FragColor = vec4(vCol.rgb * a * vCol.a, a * vCol.a); if (gl_FragColor.a < .003) discard; }`;
  const PS = { list: [], free: [] };
  function mkLayer(blend) {
    const g = new T.InstancedBufferGeometry(); g.copy(new T.PlaneGeometry(1, 1)); g.instanceCount = 0;
    const A = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4), B = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4), C = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4);
    [A, B, C].forEach(x => x.setUsage(T.DynamicDrawUsage)); g.setAttribute('iA', A); g.setAttribute('iB', B); g.setAttribute('iC', C);
    const m = new T.Mesh(g, new T.ShaderMaterial({ vertexShader: P_VS, fragmentShader: P_FS, transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true,
      blending: blend === 'add' ? T.CustomBlending : T.NormalBlending, blendSrc: T.OneFactor, blendDst: blend === 'add' ? T.OneFactor : T.OneMinusSrcAlphaFactor }));
    m.frustumCulled = false; pS.add(m); return { m, g, A, B, C };
  }
  function initP() {
    const cv = document.createElement('canvas'); cv.id = 'bPGL'; cv.className = 'b-canvas b-pgl'; cv.setAttribute('aria-hidden', 'true');
    const ref = $('bBloom') || $('bCanvas'); ref.insertAdjacentElement('afterend', cv);
    prd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true }); prd.setClearColor(0x000000, 0);
    pS = new T.Scene(); pCam = new T.OrthographicCamera(0, 1, 0, 1, -1, 1); NRM = mkLayer('normal'); ADD = mkLayer('add');
  }
  function init() { try { initBg(); initP(); window.FX3D.ready = true; } catch (e) { console.warn('戰鬥 3D 特效初始化失敗', e); window.FX3D.ready = false; } }

  /* 座標：特效以「畫面座標」（#battleScreen 內的像素）計算 */
  let geo = { S: 1, OX: 0, OY: 0, SW: 1, SH: 1 };
  function measure() { const A = $('bArena'), scr = $('battleScreen'); if (!A || !scr) return; const aR = A.getBoundingClientRect(), sR = scr.getBoundingClientRect(); geo = { S: aR.width / (A.offsetWidth || 1), OX: aR.left - sR.left, OY: aR.top - sR.top, SW: sR.width, SH: sR.height }; }
  const toScr = p => [p.x * geo.S + geo.OX, p.y * geo.S + geo.OY];
  const pt = side => { measure(); try { return toScr(fighterPoint(side)); } catch (e) { return [geo.SW * (side === 'L' ? .3 : .7), geo.SH * .5]; } };

  /* 粒子：x y vx vy 大小 長寬比 角度 角速度 顏色 透明度 形狀 壽命 阻力 重力 長大 加法混合 */
  function emit(o) { if (PS.list.length >= MAXP * 2 - 10) return; PS.list.push(Object.assign({ t: 0, vx: 0, vy: 0, s: 20, g: 0, drag: 0, grow: 0, rot: 0, vr: 0, st: 1, a: 1, shape: 0, add: true, life: .5, flick: 0, stretch: 0 }, o)); }
  function spark(x, y, c, n, sp, o) { for (let i = 0; i < n; i++) { const a = R(0, TAU), v = R(sp[0], sp[1]); emit(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - R(0, 150), s: R(10, 22), shape: 1, stretch: .022, col: c, life: R(.25, .6), drag: 3.2, g: 900 }, o)); } }
  function glow(x, y, c, s, life, o) { emit(Object.assign({ x, y, s, col: c, life, shape: 0, grow: -.2 }, o)); }
  function ring(x, y, c, s0, s1, life, o) { emit(Object.assign({ x, y, s: s0, s1, col: c, life, shape: 3, ring: true }, o)); }

  /* ---------- 屬性爆發 ---------- */
  function impact(x, y, th, big, side) {
    const P = pal(th).map(hex), W = [1, 1, 1], k = big ? 1.15 : .9, n = v => Math.round(v * k * (MOB ? .65 : 1));
    glow(x, y, W, big ? 170 : 120, .16, { a: .8 }); glow(x, y, P[2], big ? 300 : 210, .3, { grow: .4, a: .55 }); ring(x, y, mix(P[1], W, .3), 40, big ? 480 : 320, big ? .5 : .4, { a: .75 }); if (big) ring(x, y, P[2], 30, 760, .65, { a: .45 });
    spark(x, y, mix(P[1], W, .25), n(50), [380, big ? 1400 : 950]);
    const fx = {
      fire() { for (let i = 0; i < n(36); i++) emit({ x: x + R(-60, 60), y: y + R(-40, 40), vx: R(-90, 90), vy: R(-320, -90), s: R(14, 30), col: mix(P[1], P[2], Math.random()), life: R(.6, 1.2), shape: 0, flick: 1, drag: 1, g: -60 });
        for (let i = 0; i < n(14); i++) emit({ x: x + R(-50, 50), y: y + R(-30, 30), vx: R(-60, 60), vy: R(-220, -60), s: R(60, 120), grow: 1.4, col: mix(P[2], P[3], .3), life: R(.5, .9), shape: 4, drag: 1.4 }); },
      ice() { for (let i = 0; i < n(34); i++) { const a = R(0, TAU), v = R(240, 820); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, s: R(14, 34), st: R(.45, .7), rot: R(0, TAU), vr: R(-12, 12), col: mix(P[1], W, .5), life: R(.6, 1.1), shape: 2, drag: 2, g: 1100 }); }
        for (let i = 0; i < n(8); i++) emit({ x: x + R(-60, 60), y: y + R(-40, 40), vx: R(-40, 40), vy: R(-50, 10), s: R(90, 160), grow: 1, col: P[1], a: .45, life: R(.7, 1.1), shape: 4, add: false }); },
      bolt() { for (let b = 0; b < (big ? 4 : 2); b++) { let px = x, py = y; const a0 = R(0, TAU), L = R(160, 380); for (let i = 0; i < 18; i++) { const t = i / 17; px = x + Math.cos(a0) * L * t + R(-26, 26); py = y + Math.sin(a0) * L * t + R(-26, 26); glow(px, py, i % 3 ? P[2] : W, R(16, 30), R(.12, .22), { flick: 1 }); } }
        spark(x, y, mix(P[1], W, .5), n(60), [700, 1800], { life: R(.15, .3), stretch: .03 }); },
      water() { for (let i = 0; i < n(60); i++) { const a = R(-Math.PI, 0), v = R(300, 900); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(8, 18), st: .7, col: mix(P[1], W, .4), life: R(.6, 1), shape: 0, drag: .8, g: 1500 }); }
        for (let i = 0; i < n(14); i++) emit({ x: x + R(-80, 80), y: y + R(-50, 50), vx: R(-30, 30), vy: R(-160, -60), s: R(14, 36), col: P[1], life: R(.8, 1.4), shape: 3, flick: 0 }); ring(x, y, P[2], 60, 520, .6, { st: .45 }); },
      dark() { for (let i = 0; i < n(16); i++) emit({ x: x + R(-60, 60), y: y + R(-50, 50), vx: R(-80, 80), vy: R(-140, -20), s: R(80, 170), grow: 1.2, col: [.06, .0, .1], a: .75, life: R(.6, 1.1), shape: 4, add: false, drag: 1.5 });
        for (let i = 0; i < n(40); i++) { const a = R(0, TAU), v = R(80, 420); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, s: R(16, 34), col: mix(P[1], P[2], Math.random()), life: R(.6, 1.2), shape: 0, drag: 2.2, g: -120, flick: 1 }); } },
      light() { for (let i = 0; i < n(36); i++) { const a = R(0, TAU), v = R(120, 600); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(20, 48), rot: R(0, 1), vr: R(-3, 3), col: mix(P[1], W, .5), life: R(.5, 1), shape: 7, drag: 2.6 }); } },
      nature() { for (let i = 0; i < n(32); i++) { const a = R(0, TAU), v = R(160, 620); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, s: R(14, 26), rot: R(0, TAU), vr: R(-9, 9), col: mix(P[1], P[2], Math.random()), life: R(.9, 1.5), shape: 5, drag: 2.4, g: 260, add: false }); } },
      fist() { const gy = y + R(60, 110); for (let i = 0; i < n(28); i++) { const a = R(-Math.PI * .95, -Math.PI * .05), v = R(300, 950); emit({ x, y: gy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(8, 22), rot: R(0, TAU), vr: R(-10, 10), col: mix(P[3], [.55, .45, .35], .5), life: R(.6, 1.1), shape: 6, g: 2000, drag: .4, add: false }); }
        for (let i = 0; i < n(12); i++) emit({ x: x + R(-90, 90), y: gy + R(-10, 20), vx: R(-160, 160), vy: R(-80, -10), s: R(90, 170), grow: 1.3, col: [.62, .56, .5], a: .5, life: R(.8, 1.3), shape: 4, add: false, drag: 2 }); },
      sword() { const a = R(-.7, .7); for (let i = 0; i < 3; i++) { emit({ x: x + R(-30, 30), y: y + (i - 1) * 46, s: big ? 820 : 640, st: .05, rot: a + (i - 1) * .14, col: mix(P[2], W, .5), life: .32, shape: 1 }); emit({ x: x + R(-30, 30), y: y + (i - 1) * 46, s: big ? 900 : 700, st: .12, rot: a + (i - 1) * .14, col: P[2], a: .45, life: .38, shape: 1 }); }
        spark(x, y, W, n(70), [600, 1600], { life: R(.15, .35) }); this.fist(); },
      haki() { this.dark(); this.bolt(); },
    };
    const alias = { psy: 'light', sand: 'fist', quake: 'fist', poison: 'dark', shadow: 'dark', thread: 'sword', haki: 'haki' };
    try { (fx[th] || fx[alias[th]] || fx.fist).call(fx); } catch (e) { }
    /* 背景：衝擊波扭曲＋屬性閃光 */
    if (BU.uW && !RM) { const w = BU.uW.value[BS.waves++ % 4]; w.set(x / geo.SW, 1 - y / geo.SH, BU.uTime.value, big ? 1.25 : .85); BS.punch = Math.max(BS.punch || 0, big ? .07 : .045); BS.pc = [x / geo.SW, 1 - y / geo.SH]; }   /* 背景震推 */
    BS.tint = pal(th).map(hex)[2]; BS.tK = Math.max(BS.tK, big ? .5 : .3); BS.tT = 0;
    if (side) silhouette(side);
    wake();
  }

  /* 受擊閃白：用立繪當遮罩的白色剪影，不動到原本立繪的濾鏡動畫 */
  function silhouette(side) { const f = $('bF' + side), img = $('bImg' + side); if (!f || !img || !img.src) return; let s = f.querySelector('.fx3-sil');
    if (!s) { s = document.createElement('i'); s.className = 'fx3-sil'; f.appendChild(s); }
    Object.assign(s.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', webkitMaskImage: `url("${img.src}")`, maskImage: `url("${img.src}")`, transform: getComputedStyle(img).transform === 'none' ? '' : getComputedStyle(img).transform });
    s.getAnimations().forEach(a => a.cancel()); s.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 170, easing: 'ease-out' }); }

  /* 出招殘影 */
  function ghosts(side, col) { if (RM) return; const img = $('bImg' + side), scr = $('battleScreen'); if (!img || !scr) return; const sR = scr.getBoundingClientRect(); let k = 0;
    const tick = () => { if (k++ > 8) return; const r = img.getBoundingClientRect(); if (r.width > 4) { const g = img.cloneNode(); g.removeAttribute('id'); g.className = 'fx3-ghost'; Object.assign(g.style, { left: r.left - sR.left + 'px', top: r.top - sR.top + 'px', width: r.width + 'px', height: r.height + 'px', filter: `brightness(1.7) drop-shadow(0 0 10px ${col})` });
      scr.appendChild(g); g.animate([{ opacity: .42 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' }).onfinish = () => g.remove(); } setTimeout(tick, 48 / (window.BSPEED || 1)); }; tick(); }

  /* 奧義最後一擊：黑白衝擊格 */
  function impactFrame() { if (RM) return; const s = $('battleScreen'); s.classList.add('fx3-if1'); setTimeout(() => { s.classList.remove('fx3-if1'); s.classList.add('fx3-if2'); }, 70); setTimeout(() => s.classList.remove('fx3-if2'), 150); }

  /* 奧義蓄力：粒子往施放者聚集、鏡頭推近、背景染色 */
  function charge(side, th, ult) { const [x, y] = pt(side), P = pal(th).map(hex), N = (ult ? 90 : 30) * (MOB ? .6 : 1);
    for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(180, ult ? 520 : 300), life = R(.45, .8); emit({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d / life, vy: -Math.sin(a) * d / life, s: R(12, 26), shape: 1, stretch: .012, col: mix(P[1], [1, 1, 1], .4), life, t: -R(0, ult ? .35 : .15) }); }
    glow(x, y, P[2], ult ? 300 : 180, ult ? 1 : .5, { grow: .3, a: .5 }); if (ult) { ring(x, y, P[2], 700, 60, .8, { a: .6 }); BS.zT = 1.09; BS.rT = 1; BS.zc = [x / geo.SW, 1 - y / geo.SH]; BS.hT = th === 'fire' ? 1 : 0; }
    BS.tint = P[2]; BS.tK = Math.max(BS.tK, ult ? .45 : .2); BS.tT = 0; wake(); }



  /* ---------- v145 第二輪：鏡頭推近、命中停格、奧義氣場、地面焦痕、畫面邊緣屬性光 ---------- */
  let dolly = null;
  /* 疊加在原本的鏡頭縮放（--cam、--camY）之上，以角色位置為中心推近 */
  let dollyT = '';
  function camPush(side, s, ms) { if (RM) return; const a = $('bArena'); if (!a) return; let p; try { p = fighterPoint(side); } catch (e) { p = null; } if (!p) return;
    const cs = getComputedStyle(a), ox = parseFloat(cs.transformOrigin) || a.offsetWidth / 2, oy = parseFloat(cs.transformOrigin.split(' ')[1]) || a.offsetHeight, dx = p.x - ox, dy = p.y - oy;
    const to = `translate(${dx}px, ${dy}px) scale(${s}) translate(${-dx}px, ${-dy}px)`, from = dollyT || 'translate(0px, 0px) scale(1) translate(0px, 0px)';
    if (dolly) dolly.cancel(); dollyT = to; dolly = a.animate([{ transform: from }, { transform: to }], { duration: ms, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards', composite: 'add' }); }
  function camRelease(ms) { if (!dolly) return; const a = $('bArena'), from = dollyT; dolly.cancel(); dolly = null; dollyT = '';
    a.animate([{ transform: from }, { transform: 'translate(0px, 0px) scale(1) translate(0px, 0px)' }], { duration: ms || 420, easing: 'cubic-bezier(.3,0,.2,1)', composite: 'add' }); }
  function hitStop(ms) { if (RM) return; const s = $('battleScreen'); s.classList.add('fx3-stop'); stopUntil = performance.now() + ms; setTimeout(() => s.classList.remove('fx3-stop'), ms); }
  let stopUntil = 0;
  function aura2(side, th) { if (RM) return; const f = $('bF' + side), img = $('bImg' + side); if (!f || !img || !img.src) return; const col = toHex(pal(th).map(hex)[2]); let a = f.querySelector('.fx3-aura');
    if (!a) { a = document.createElement('i'); a.className = 'fx3-aura'; f.insertBefore(a, img); }
    Object.assign(a.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', background: col, webkitMaskImage: `url("${img.src}")`, maskImage: `url("${img.src}")`, transform: (getComputedStyle(img).transform === 'none' ? '' : getComputedStyle(img).transform) });
    a.getAnimations().forEach(x => x.cancel()); a.animate([{ opacity: 0, scale: '1' }, { opacity: .9, scale: '1.05', offset: .25 }, { opacity: .55, scale: '1.08', offset: .6 }, { opacity: .85, scale: '1.06', offset: .8 }, { opacity: 0, scale: '1.12' }], { duration: 1500 / (window.BSPEED || 1), easing: 'ease-out' }); }
  function scorch(x, y, th) { const P = pal(th).map(hex), gy = y + 105; emit({ x, y: gy, s: 340, st: .26, col: [.04, .03, .03], a: .55, life: 1.8, shape: 4, add: false });
    emit({ x, y: gy, s: 260, st: .22, col: mix(P[2], [1, 1, 1], .2), a: .7, life: .9, shape: 0, grow: .3 });
    for (let i = 0; i < 10; i++) { const a = R(-Math.PI, Math.PI); emit({ x: x + Math.cos(a) * 50, y: gy + Math.sin(a) * 12, s: R(70, 150), st: .05, rot: Math.atan2(Math.sin(a) * .26, Math.cos(a)), col: [.05, .04, .04], a: .6, life: 1.6, shape: 1, add: false }); } }
  function edge(th) { const P = pal(th).map(hex), D = Math.hypot(geo.SW, geo.SH); ring(geo.SW / 2, geo.SH / 2, P[2], D * .62, D * .52, .7, { a: .65 }); ring(geo.SW / 2, geo.SH / 2, mix(P[1], [1, 1, 1], .3), D * .58, D * .5, .5, { a: .5 }); }

  /* ---------- v145 奧義強化 ---------- */
  const toHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
  /* 蓄力：腳下光圈＋屬性能量往上竄（約 1 秒） */
  function aura(side, th) { if (RM) return; const [x, y] = pt(side), P = pal(th).map(hex), W = [1, 1, 1], n = MOB ? 4 : 8; let k = 0;
    const tick = () => { if (k++ > 18 || !cur) return; const fy = y + 110;
      for (let i = 0; i < n; i++) emit({ x: x + R(-80, 80), y: fy + R(-10, 10), vx: R(-25, 25), vy: R(-760, -360), s: R(12, 24), shape: 1, stretch: .016, col: mix(P[i % 2 ? 1 : 2], W, .3), life: R(.35, .6), drag: .6 });
      if (k % 3 === 1) { glow(x, fy, P[2], 340, .3, { st: .3, a: .55 }); ring(x, fy, mix(P[1], W, .3), 60, 300, .45, { st: .3, a: .6 }); }
      wake(); setTimeout(tick, 50 / (window.BSPEED || 1)); }; tick(); }
  /* 終結一擊：集中線＋三重衝擊波＋光柱＋屬性風暴＋餘燼 */
  function finisher(x, y, th) { const P = pal(th).map(hex), W = [1, 1, 1], D = Math.hypot(geo.SW, geo.SH), N = MOB ? 40 : 72;
    for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(.22, .42) * D; emit({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, s: R(.25, .5) * D, st: R(.012, .03), rot: a, col: i % 3 ? W : mix(P[1], W, .4), a: R(.5, .9), life: R(.22, .38), shape: 1 }); }
    glow(x, y, W, 460, .22, { a: .95 }); glow(x, y, P[2], 900, .5, { grow: .3, a: .5 });
    [0, 90, 180].forEach((t, i) => setTimeout(() => { ring(x, y, i === 1 ? W : mix(P[1 + (i > 1)], W, .25), 60, D * (.55 + i * .18), .55 + i * .1, { a: .8 - i * .15 }); wake(); }, t / (window.BSPEED || 1)));
    emit({ x, y: y - geo.SH * .1, s: geo.SH * 1.6, st: .06, rot: Math.PI / 2, col: mix(P[2], W, .5), a: .85, life: .42, shape: 1 }); emit({ x, y: y - geo.SH * .1, s: geo.SH * 1.7, st: .16, rot: Math.PI / 2, col: P[2], a: .45, life: .55, shape: 1 });
    scorch(x, y, th); edge(th); hitStop(90);
    impact(x, y, th, true); setTimeout(() => impact(x + R(-90, 90), y + R(-60, 40), th, true), 120 / (window.BSPEED || 1)); setTimeout(() => impact(x + R(-120, 120), y + R(-80, 60), th, true), 260 / (window.BSPEED || 1));
    let k = 0; const ember = () => { if (k++ > 26) return; for (let i = 0; i < (MOB ? 3 : 5); i++) emit({ x: x + R(-.35, .35) * geo.SW, y: y + R(-.2, .3) * geo.SH, vx: R(-30, 30), vy: R(-90, -30), s: R(8, 18), col: mix(P[1], P[2], Math.random()), life: R(.8, 1.5), flick: 1, drag: .5 }); wake(); setTimeout(ember, 55); }; setTimeout(ember, 200);
    if (BU.uW && !RM) { BS.punch = .11; BS.pc = [x / geo.SW, 1 - y / geo.SH]; BS.rad = Math.max(BS.rad, 1.4); }
    BS.tint = P[2]; BS.tK = .7; BS.tT = 0; wake(); }

  /* ---------- 迴圈：有東西在動才畫 ---------- */
  let raf = 0, last = 0, t0 = performance.now();
  function wake() { if (!raf && window.FX3D.ready) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; const dt = now < stopUntil ? 0 : Math.min(.05, (now - last) / 1000) * (window.BSPEED || 1); last = now; BU.uTime.value = (now - t0) / 1000;
    const scr = $('battleScreen'); if (!scr || scr.classList.contains('hidden')) { PS.list.length = 0; return; }
    measure(); const dpr = Math.min(window.__fx3dDpr || (MOB ? 1 : 1.75), devicePixelRatio || 1) /* v171：手機 1.25 → 1，掉幀時再降 */, W = Math.max(1, Math.round(geo.SW)), H = Math.max(1, Math.round(geo.SH));
    /* 背景 */
    const foc = scr.classList.contains('fxp-focus'); BS.zoom += (BS.zT - BS.zoom) * Math.min(1, dt * 5); BS.rad += (BS.rT - BS.rad) * Math.min(1, dt * 6); BS.tT += dt; BS.tK *= Math.pow(.18, dt); BS.haze += (BS.hT - BS.haze) * Math.min(1, dt * 3);
    if (rd.domElement.width !== Math.round(W * dpr)) { rd.setPixelRatio(dpr); rd.setSize(W, H, false); } BU.uRes.value.set(W, H); BU.uDim.value = foc ? .5 : .66; BU.uSat.value = foc ? .8 : 1.1; BS.punch = (BS.punch || 0) * Math.pow(.004, dt); const pz = BS.punch || 0, zc = BS.zT > 1.01 ? BS.zc : (BS.pc || BS.zc); BU.uZoom.value = BS.zoom + pz; BU.uRad.value = Math.max(BS.rad, pz * 8); BU.uZC.value.set(zc[0], zc[1]); BU.uTint.value.setRGB(...BS.tint); BU.uTintK.value = BS.tK; BU.uHaze.value = BS.haze;
    rd.render(bgS, cam);
    /* 粒子 */
    const pc = prd.domElement; if (pc.width !== Math.round(W * dpr) || pc.height !== Math.round(H * dpr)) { prd.setPixelRatio(dpr); prd.setSize(W, H, false); }
    { const st = pc.style, px = v => v.toFixed(2) + 'px', key = [geo.OX, geo.OY, geo.S, W, H].map(v => v.toFixed(2)).join(); if (pc.__k !== key) { pc.__k = key; st.right = st.bottom = 'auto'; st.left = px(-geo.OX / geo.S); st.top = px(-geo.OY / geo.S); st.width = px(W / geo.S); st.height = px(H / geo.S); } }   /* 跟 fx.js 一樣：畫布反向放大蓋滿畫面 */
    pCam.right = W; pCam.bottom = H; pCam.updateProjectionMatrix();
    let na = 0, nn = 0; const live = [];
    for (const p of PS.list) { p.t += dt; if (p.t < 0) { live.push(p); continue; } if (p.t > p.life) continue; live.push(p);
      const k = p.t / p.life; p.vx *= Math.exp(-p.drag * dt); p.vy = p.vy * Math.exp(-p.drag * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      let s = p.ring ? p.s + (p.s1 - p.s) * (1 - Math.pow(1 - k, 3)) : p.s * (1 + p.grow * k), st = p.st, rot = p.rot;
      if (p.shape === 1 && p.stretch) { const v = Math.hypot(p.vx, p.vy); st = Math.max(.08, 1 / (1 + v * p.stretch)); s = p.s / st * .5; rot = Math.atan2(p.vy, p.vx); }
      let a = p.a * (p.add ? .82 : 1) * (p.ring ? 1 - k : Math.min(1, k * 8) * (1 - k * k)); if (p.flick) a *= .6 + .4 * Math.sin(p.t * 40 + p.x);
      const L = p.add ? ADD : NRM, i = p.add ? na++ : nn++; if (i >= MAXP) continue;
      L.A.array.set([p.x, p.y, 0, 0], i * 4); L.B.array.set([s, st, rot, a], i * 4); L.C.array.set([p.col[0], p.col[1], p.col[2], p.shape], i * 4); }
    PS.list = live;
    [[ADD, na], [NRM, nn]].forEach(([L, c]) => { L.g.instanceCount = Math.min(c, MAXP); L.A.needsUpdate = L.B.needsUpdate = L.C.needsUpdate = true; });
    prd.render(pS, pCam);
    { const hv = PS.list.length ? '' : 'hidden'; if (pc.style.visibility !== hv) pc.style.visibility = hv; } /* v194：沒有粒子時隱藏粒子層 */
    const busy = PS.list.length || (BS.punch || 0) > .001 || Math.abs(BS.zoom - BS.zT) > .002 || BS.rad > .01 || BS.tK > .01 || BS.haze > .01 || BU.uW.value.some(w => w.w > 0 && BU.uTime.value - w.z < .9) || foc !== BS.foc;
    BS.foc = foc; if (busy) raf = requestAnimationFrame(loop);
  }

  /* ---------- 掛到原本的戰鬥流程 ---------- */
  let cur = null;   /* 目前出招：{ side, theme, ult, hitDone } */
  function hook() {
    /* 命中：以「傷害數字跳出」為準（奧義編排不一定會呼叫 hitFX）；多段攻擊每 0.11 秒最多一次，奧義第一下加衝擊格 */
    if (typeof window.showDamage === 'function' && !window.showDamage.__fx3) { const _d = window.showDamage; let lastT = 0; window.showDamage = function (side, amount) { const r = _d.apply(this, arguments);
        if (window.FX3D.ready && enabled() && cur && cur.side !== side) try { const now = performance.now(), F = side === 'L' ? battle.player : battle.enemy, big = cur.ult || amount > (F ? F.maxHp * .12 : 1e9);
          if (big && cur.ult && !cur.hitDone) { cur.hitDone = true; impactFrame(); lastT = now; const [fx0, fy0] = pt(side); finisher(fx0, fy0, cur.theme); camPush(side, 1.1, 90); setTimeout(() => camRelease(520), 260 / (window.BSPEED || 1)); }
          else if (big && !cur.ult && now - lastT > 110) hitStop(55);
          if (now - lastT > 110 / (window.BSPEED || 1)) { lastT = now; const [x, y] = pt(side); if (!(window.VFX00 && VFX00.hit(side, cur, big, x, y))) impact(x, y, cur.theme, big, side); } } catch (e) { } /* v155：00GameDevs 特效載入後由它接手命中爆發 */
        return r; }; window.showDamage.__fx3 = true; }
    if (typeof window.playChoreo === 'function' && !window.playChoreo.__fx3) { const _p = window.playChoreo; window.playChoreo = async function (side, actor, idx, skill) {
        if (!window.FX3D.ready || !enabled()) { load(); return _p.apply(this, arguments); }
        const S = side === 'P' ? 'L' : 'R', ult = !!(skill && skill.ultimate), th = themeOf(actor), col = pal(th)[2]; cur = { side: S, theme: th, ult, hitDone: false, skill, actor };
        try { charge(S, th, ult); if (!(skill && skill.type === 'support')) ghosts(S, col); if (ult) { aura(S, th); aura2(S, th); camPush(S, 1.06, 650 / (window.BSPEED || 1)); setTimeout(() => { if (cur && !cur.hitDone) camRelease(600); }, 1300 / (window.BSPEED || 1)); } } catch (e) { }
        /* 奧義期間：全白閃光改成屬性色、強度壓低，避免畫面整片白、看不到特效 */
        const XX = typeof X !== 'undefined' ? X : null, _fl = XX && XX.flash, tf = toHex(mix(pal(th).map(hex)[1], [1, 1, 1], .35));
        if (ult && _fl && !RM) XX.flash = function (c, life, a) { let w = false; if (typeof c === 'string' && /^#?[0-9a-f]{3,6}$/i.test(c)) { const h = c.replace('#', ''), f = h.length === 3 ? h.split('').map(v => v + v).join('') : h; const v = hex('#' + f); w = Math.min(...v) > .82; } else if (c === 'white') w = true;
          return _fl.call(this, w ? tf : c, life, w ? Math.min(a || .7, .42) : a); };
        try { return await _p.apply(this, arguments); } finally { if (ult && _fl) XX.flash = _fl; camRelease(360); cur = null; BS.zT = 1; BS.rT = 0; BS.hT = 0; wake(); } }; window.playChoreo.__fx3 = true; }
  }
  window.FX3D = { ready: false, load, pt, pal, themeOf, geo: () => geo, impact: (s, th, big) => { const [x, y] = pt(s); impact(x, y, th, big, s); }, charge, impactFrame, enabled };
  window.addEventListener('load', () => { setTimeout(hook, 0); });
  /* 第一次進戰鬥時載入 Three.js（之後一直保留） */
  if (typeof window.startBattle === 'function') { const _sb = window.startBattle; window.startBattle = function () { load(); const r = _sb.apply(this, arguments); setTimeout(wake, 0); return r; }; }
})();

/* ==== 原 js/fx_vfx_v155.js ==== */
/* v155 戰鬥特效升級：使用 00GameDevs（https://00gamedevs.com/，MIT 授權）的 Three.js 特效，取代 fx3d_v145 的命中粒子爆發。
   使用者 11/04：「把裡面不錯的素材拿出來優化我們的技能特效；先從相關的開始升級替換」。
   ‧ 素材：vendor/vfx00/vfx00.js（各款共用的執行期＋預設，第一次進戰鬥才載入；SHA-256 與版本記在 vfx00.meta.json）。
   ‧ 畫布 #bVFX 疊在 #bPGL 上方，透視鏡頭對著 z=0 平面：畫面像素 ↔ 世界座標的比例依角色立繪高度換算，特效大小跟著角色走。
   ‧ 對應（依角色的命中主題 CHAR_FX／屬性）：劍＝蒼刃迴斬（奧義加裂空迴斬）、拳／霸氣／震動＝揚塵震波＋雷弧綻爆、火＝白熱炎爆（奧義加翻湧炎潮）、
     冰＝裂晶霜爆（奧義霜矛落陣）、雷＝渦雷落擊、水＝翻浪衝潮、闇／影＝雷弧綻爆（奧義渦光黑洞）、砂＝飛砂風旋、光／超能＝雷弧綻爆；
     輔助技：回復＝療光法陣、閃避／護盾＝稜晶護壁。沒對應到的主題照舊用 fx3d_v145 的粒子。
   ‧ 開關跟 fx3d_v145 相同（技能特效「高」且畫質不是「省電」）；同時最多 6 個（手機 4 個）特效，超過就先收掉最舊的。 */
(function () {
  const $ = id => document.getElementById(id);
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAP = MOB ? 4 : 6, R = (a, b) => a + Math.random() * (b - a);
  let T = null, V = null, loading = null, rd = null, sc = null, cam = null, cv = null, raf = 0, last = 0;
  const live = [];
  const enabled = () => !!(window.FX3D && FX3D.enabled && FX3D.enabled()) && !RM;
  /* 和之國篇三位：自訂命中主題與配色 */
  if (typeof CHAR_FX !== 'undefined') Object.assign(CHAR_FX, {
    zoro_wano: CHAR_FX.zoro_wano || ['sword', 'sword', ['#ffffff', '#e8c8ff', '#9a4aff', '#1a0a3a']],
    luffy_wano: CHAR_FX.luffy_wano || ['haki', 'haki', ['#ffffff', '#ffd8d0', '#ff3a4a', '#2a0508']],
    sanji_wano: CHAR_FX.sanji_wano || ['fire', 'inferno', ['#ffffff', '#bfe8ff', '#3a7fff', '#0a1a5a']] });

  /* 主題 → [一般命中, 奧義命中] 的特效清單。每項：[素材 id, 選項, 擺法]；擺法 g=從腳下往上長、s=斬擊（立起來的刀光圈）、c=中心 */
  const MAP = {
    sword: [[['azure-sweep', {}, 's']], [['spatial-sweep', { size: 1.25 }, 's'], ['azure-sweep', { size: 1.1 }, 's']]],
    fist: [[['energy-burst', { size: 1.2, color: '#ffb46a' }, 'g'], ['shockwave', { size: .8 }, 'g']], [['energy-burst', { size: 1.7, color: '#ffb46a' }, 'g'], ['shockwave', { size: 1.3 }, 'g']]],
    haki: [[['energy-burst', { size: 1.3 }, 'g']], [['energy-burst', { size: 1.8 }, 'g'], ['shockwave', { size: 1.3 }, 'g']]],
    quake: [[['shockwave', { size: 1.15 }, 'g']], [['shockwave', { size: 1.5 }, 'g'], ['magma-fissure', { color: '#ffd0a0' }, 'g']]],
    fire: [[['fire-explosion', { size: 1 }, 'g']], [['fire-explosion', { size: 1.35 }, 'g'], ['flame-surge', { size: 1.7 }, 'g']]],
    ice: [[['ice-shatter', { size: 2 }, 'g']], [['frost-lance-rain', {}, 'g'], ['ice-shatter', { size: 2.4 }, 'g']]],
    bolt: [[['thunder-strike', { size: 1.2 }, 'g']], [['thunder-strike', { size: 1.6 }, 'g'], ['energy-burst', { size: 1.5 }, 'g']]],
    water: [[['tidal-surge', { size: 1.1 }, 'g']], [['tidal-surge', { size: 1.5 }, 'g']]],
    dark: [[['energy-burst', {}, 'g']], [['black-hole', { size: .8 }, 'c', 1.4]]],
    shadow: [[['energy-burst', {}, 'g']], [['black-hole', { size: .8 }, 'c', 1.4]]],
    sand: [[['dust-devil', { size: .8 }, 'g', .9]], [['dust-devil', { size: 1.1 }, 'g', 1.3], ['shockwave', {}, 'g']]],
    light: [[['energy-burst', {}, 'g']], [['energy-burst', { size: 1.35 }, 'g'], ['shockwave', { size: 1.2, color: '#fff2b0' }, 'g']]],
    psy: [[['energy-burst', {}, 'g']], [['energy-burst', { size: 1.35 }, 'g'], ['shockwave', { size: 1.1 }, 'g']]]
  };
  /* 這些主題的原色比較好看，不套角色配色（火、冰、雷、水、砂、震動的塵土） */
  const KEEP = { fire: 1, ice: 1, water: 1, sand: 1, quake: 1 };

  function load() {
    if (V || loading || !enabled()) return loading;
    loading = Promise.all([import('three'), import(new URL('vendor/vfx00/vfx00.js?v=155', document.baseURI).href)]).then(([t, v]) => { T = t; V = v; init(); }).catch(e => { console.warn('00GameDevs 特效載入失敗', e); V = null; });
    return loading;
  }
  function init() {
    cv = document.createElement('canvas'); cv.id = 'bVFX'; cv.className = 'b-canvas b-pgl b-vfx'; cv.setAttribute('aria-hidden', 'true'); cv.style.visibility = 'hidden'; /* v194：有特效（wake）才顯示 */
    const ref = $('bPGL') || $('bBloom') || $('bCanvas'); ref.insertAdjacentElement('afterend', cv);
    rd = new T.WebGLRenderer({ canvas: cv, antialias: !MOB, alpha: true, premultipliedAlpha: true }); rd.setClearColor(0x000000, 0);
    rd.outputColorSpace = T.SRGBColorSpace; rd.toneMapping = T.NoToneMapping;
    sc = new T.Scene(); cam = new T.PerspectiveCamera(30, 1, .1, 400);
    /* 預先編譯著色器：第一次命中時才編譯會卡一下，所以載入後趁空檔先把會用到的款式各建一次、編譯完就釋放 */
    setTimeout(() => { try { const ids = [...new Set(Object.values(MAP).flatMap(m => m.flat().map(x => x[0])).concat(['healing-field', 'prism-guard']))], tmp = new T.Scene(), made = [];
      ids.forEach(id => { try { const f = V.make(id, {}); f.update(.016); tmp.add(f.group); made.push(f); } catch (e) { } });
      cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); (rd.compileAsync ? rd.compileAsync(tmp, cam) : Promise.resolve(rd.compile(tmp, cam))).catch(() => { }).finally(() => made.forEach(f => { try { tmp.remove(f.group); f.dispose(); } catch (e) { } }));
      cam.userData.W = 0; } catch (e) { } }, 400);
  }
  /* 換算：每公尺幾個畫面像素＝角色立繪高度 / 5.5（特效素材以公尺為單位，命中爆發約 1.5～4 公尺寬） */
  function unit(side) { try { const img = $('bImg' + side), f = $('bF' + side); const s = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, g = FX3D.geo(); return Math.max(14, img.offsetHeight * s * g.S / 5.5); } catch (e) { return 40; } }
  function size(W, H) {
    const dpr = Math.min(window.__fx3dDpr || (MOB ? 1 : 1.75), devicePixelRatio || 1); /* v171 */
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { rd.setPixelRatio(dpr); rd.setSize(W, H, false); }
    const g = FX3D.geo(), st = cv.style, px = v => v.toFixed(2) + 'px', key = [g.OX, g.OY, g.S, W, H].map(v => v.toFixed(2)).join();
    if (cv.__k !== key) { cv.__k = key; st.right = st.bottom = 'auto'; st.left = px(-g.OX / g.S); st.top = px(-g.OY / g.S); st.width = px(W / g.S); st.height = px(H / g.S); }
  }
  /* 鏡頭：z=0 平面上 1 公尺＝U 像素；畫面左上角是 (0,0) */
  function setCam(W, H, U) { const f = T.MathUtils.degToRad(cam.fov), D = H / (U * 2 * Math.tan(f / 2)); cam.aspect = W / H; cam.position.set(W / 2 / U, -H / 2 / U, D); cam.lookAt(W / 2 / U, -H / 2 / U, 0); cam.updateProjectionMatrix(); cam.userData.U = U; }
  function spawn(id, opt, mode, x, y, U, life) {
    if (!V.PRESETS[id]) return;
    while (live.length >= CAP) { const o = live.shift(); try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } }
    const fx = V.make(id, opt), gr = fx.group, k = U / cam.userData.U;
    let X = x / cam.userData.U, Y = -y / cam.userData.U;
    if (mode === 'g') { Y -= 1.5 * k; gr.rotation.x = .32; }               /* 從角色腳邊往上長，稍微俯看 */
    else if (mode === 's') { gr.rotation.x = 1.18; gr.rotation.z = R(-.5, .5); gr.rotation.y = R(-.3, .3); }  /* 刀光圈立起來，斜斜劃過 */
    else gr.rotation.x = .9;
    gr.position.set(X, Y, 0); gr.scale.setScalar(k);
    sc.add(gr); live.push({ fx, t: 0, stopAt: life || 0, stopped: false });
    wake();
  }
  function wake() { if (!raf) { last = performance.now(); if (cv && cv.style.visibility) cv.style.visibility = ''; raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000) * (window.BSPEED || 1); last = now;
    const scr = $('battleScreen'); if (!scr || !rd) return;
    const g = FX3D.geo(), W = Math.max(1, Math.round(g.SW)), H = Math.max(1, Math.round(g.SH)); size(W, H);
    if (Math.abs(cam.aspect - W / H) > .001 || !cam.userData.W || cam.userData.W !== W) { setCam(W, H, cam.userData.U || 40); cam.userData.W = W; }
    for (let i = live.length - 1; i >= 0; i--) { const o = live[i]; o.t += dt; try { if (o.stopAt && !o.stopped && o.t > o.stopAt) { o.stopped = true; o.fx.stop(); } o.fx.update(dt); } catch (e) { o.dead = true; }
      if (o.dead || o.fx.finished || o.t > 8) { try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } live.splice(i, 1); } }
    rd.render(sc, cam);
    if (live.length) raf = requestAnimationFrame(loop); else { rd.clear(); cv.style.visibility = 'hidden'; } /* v194：閒置時隱藏 */
  }
  const themeOf = cur => cur.theme || 'fist';
  const colorOf = (actor, th) => { try { const C = typeof CHAR_FX !== 'undefined' && actor && CHAR_FX[actor.id]; const P = (C && C[2]) || (FX3D.pal ? FX3D.pal(th) : null); return P ? P[2] : null; } catch (e) { return null; } };
  /* 命中：fx3d_v145 的 showDamage 掛勾呼叫；回傳 true 表示由這一層接手（fx3d 就不放原本的粒子爆發） */
  function hit(side, cur, big, x, y) {
    if (!V || !rd || !enabled() || !cur) return false;
    const th = themeOf(cur), M = MAP[th]; if (!M) return false;
    const U = unit(side); if (!cam.userData.W) { const g = FX3D.geo(); setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); }
    if (!cam.userData.U) cam.userData.U = U;
    const ult = cur.ult && !cur.vfxUlt; if (ult) cur.vfxUlt = true;
    const list = ult ? M[1] : M[0], col = KEEP[th] ? null : colorOf(cur.actor, th);
    list.forEach(([id, o, mode, life], i) => setTimeout(() => spawn(id, Object.assign(col ? { color: col } : {}, o, big && !ult ? { size: (o.size || 1) * 1.15 } : {}), mode, x + (i ? R(-12, 12) : 0), y, U, life), i * 70));
    return true;
  }
  /* 輔助技：回復放療光法陣，閃避／護盾放稜晶護壁（在施放者身上） */
  function cast(side, skill) {
    if (!V || !rd || !enabled() || !skill || skill.type !== 'support') return;
    const e = skill.effect || {}, heal = e.healRatio || e.heal || e.regen, guard = e.dodgeTurns || e.shield || e.shieldRatio || e.selfBuffDef > 0;
    const id = heal ? 'healing-field' : guard ? 'prism-guard' : null; if (!id) return;
    try { const [x, y] = FX3D.pt(side), U = unit(side), g = FX3D.geo(); if (!cam.userData.W) { setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); }
      spawn(id, { size: heal ? .9 : .8 }, heal ? 'c' : 'g', x, heal ? y + U * .9 : y, U, heal ? 1.4 : 1.1); } catch (e) { }
  }
  function hook() {
    if (typeof window.playChoreo === 'function' && !window.playChoreo.__vfx) { const _p = window.playChoreo; window.playChoreo = function (side, actor, idx, skill) { if (!V) load(); else try { cast(side === 'P' ? 'L' : 'R', skill); } catch (e) { } return _p.apply(this, arguments); }; window.playChoreo.__vfx = true; }
  }
  /* v170：指定素材放在某個角色身上（伊姆專屬特效 js/fx_imu_v170.js 用）；ox／oy 以「公尺」為單位偏移，回傳是否有放出來 */
  function fx(id, opt, mode, side, life, ox, oy) {
    if (!V || !rd || !enabled() || !V.PRESETS[id]) return false;
    try { const [x, y] = FX3D.pt(side), U = unit(side), g = FX3D.geo(); if (!cam.userData.W) { setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); } if (!cam.userData.U) cam.userData.U = U;
      spawn(id, opt || {}, mode || 'c', x + (ox || 0) * U, y + (oy || 0) * U, U, life); return true; } catch (e) { return false; }
  }
  window.VFX00 = { load, hit, cast, fx, get ready() { return !!(V && rd); }, live: () => live.length };
  window.addEventListener('load', () => setTimeout(hook, 30));
  if (typeof window.startBattle === 'function') { const _sb = window.startBattle; window.startBattle = function () { load(); if (live.length) { live.splice(0).forEach(o => { try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } }); if (rd) rd.clear(); } return _sb.apply(this, arguments); }; /* 新的一場戰鬥：清掉殘留特效 */ }
})();

/* ==== 原 js/fx_imu_v170.js ==== */
/* v170 伊姆技能特效精緻化（使用者 11/07 01:26「幫我把伊姆的每一個技能特效動畫都做的更精緻」）。
   ‧ 每一招都有自己的編排（同一招不同型態也不一樣）：預備（蓄力）→ 命中（爆發、震屏、適度閃光）→ 餘韻。
     初始／第一型態：不死之身（深紅繭）、黑轉支配（鎖鏈＋契約紋）、虛空威壓（化影、深淵裂縫）、黑焰・凶兆（黑焰彈＋凶兆之眼）、最初20人（二十道紅光聚集）
     第二型態：永劫不滅（深紅日冕）、萬物逆轉（世界反轉、四面鎖鏈、奪走強化）、世界之王（空白王座＋霸王色黑雷）、毀滅之力（黑焰巨刃劈下）
     第三型態：千眼天啟（八隻紅眼睜開、凝視線）、終焉契約（地面巨大契約陣、鎖鏈連到後排）、虛空王座・天翼（遮天雙翼＋王座＋羽毛風暴）、終焉之翼（雙翼羽刃交叉橫掃、波及後排）、天罰（天空裂開、八眼、審判雷柱、強化碎裂）
     晉升演出 imuFormFx（覆寫 fx_v165.js 的版本）：第一型態（黑轉之繭破殼）、第二型態（王座升起＋霸王色雷暴）、第三型態（天空裂縫、八眼、雙翼展開、羽毛爆散）
     事件：看穿迴避（八眼一閃＋凝視線）、深淵迴避、霸王色震懾（每回合）、契約每回合扣血、契約連鎖／翅膀掃擊對後排（鎖鏈／羽刃飛向後排頭像＋頭像閃紅）
     狀態持續中的場上氛圍（css/fx_imu_v170.css）：世界之王／虛空王座領域、看穿的八隻眼、對手腳下的契約紋、存在抹除、不滅光環。
   ‧ 畫法：戰場畫布（fx.js 的 FXE，requestAnimationFrame、結束自動清掉）＋ 立繪後方的 DOM 背景（王座、雙翼 SVG，演完移除）＋ 00GameDevs 3D 素材（VFX00.fx，只在「技能特效 高」且畫質不是省電時）。
   ‧ 降級：系統「減少動態」或設定「減少動態效果」→ 只留短暫光暈與文字（不閃光、不震屏）；技能特效「低」或畫質「省電」→ 粒子 35%、不用 3D；手機 → 粒子 60%。
   ‧ 倍速：所有等待用 BSPEED 換算（FXE 的動畫時間本來就乘 BSPEED）。連續施放時先收掉上一招還沒演完的特效，不會疊爆；粒子總數有上限。
   ‧ 包住 playChoreo（最外層，伊姆的招式不再跑一般角色的通用特效層）、triggerImpact（伊姆攻擊命中時不再疊通用 hitFX）、log（辨識回合結束事件）、IMU165.preAct/postAct、onEvaded、applySkillEffects、endTurnStatus、renderHUD、startBattle、finishBattle。
   ‧ 3D 素材只用 healing-field／flame-surge／energy-burst／thunder-strike（black-hole、spatial-sweep、dimensional-rend 在遊戲畫面上是大片灰白，不用）。window.__NO_FX170＝量測用，改回 v169 演出。
   ‧ 載入順序：ext_v169.js 之後、loader.js 之前。 */
(function () {
  'use strict';
  if (typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return;
  const X = FXE.P, TAU = Math.PI * 2, R = (a, b) => a + Math.random() * (b - a);
  const $ = id => document.getElementById(id);
  const ls = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const RMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const MOB = typeof LOWFX !== 'undefined' ? !!LOWFX : false;
  /* 0＝減少動態｜1＝技能特效低／省電｜2＝手機｜3＝電腦 */
  const tierNow = () => (RMQ.matches || ls('op_motion') === '1') ? 0 : (ls('op_fxpro') === '0' || ls('op_gfx') === 'low') ? 1 : MOB ? 2 : 3;
  let T = tierNow();
  const NMUL = [0, .35, .6, 1], CAPS = [0, 70, 150, 280];
  const N = n => Math.max(1, Math.round(n * NMUL[T]));
  const spd = () => window.BSPEED || 1;
  const nap = ms => new Promise(r => setTimeout(r, ms / spd()));
  let gen = 0;
  const later = (ms, fn) => { const g = gen; setTimeout(() => { if (g === gen) try { fn(); } catch (e) { } }, ms / spd()); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => 1 - Math.pow(1 - k, 3), easeIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const fade = (k, a, b) => k < a ? k / a : k > b ? Math.max(0, (1 - k) / (1 - b)) : 1;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  const C = { crim: '#ff2a5a', blood: '#a0002a', pink: '#ff5ab4', mag: '#d04aff', pur: '#8a3aff', lav: '#e8c8ff', deep: '#14020e', ink: '#07000a', white: '#fff2f6', gold: '#ffd27a' };

  /* ---------- 畫布：自己的特效都經過 add()，可以一次收掉 ---------- */
  const mine = new Set(); let liveP = 0;
  function add(e) { mine.forEach(x => { if (x.t >= x.life) mine.delete(x); }); mine.add(e); return FXE.add(e); }
  function cancelOld() { mine.forEach(e => { if (e.t < e.life) e.life = Math.min(e.life, e.t + .12); }); mine.clear(); }
  const SPR = {};
  function glowS(hex) { const k = 'g' + hex; if (!SPR[k]) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.22, rgba(hex, 1)); r.addColorStop(.55, rgba(hex, .3)); r.addColorStop(1, rgba(hex, 0)); g.fillStyle = r; g.fillRect(0, 0, 64, 64); SPR[k] = c; } return SPR[k]; }
  function smokeS(hex) { const k = 's' + hex; if (!SPR[k]) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); for (let i = 0; i < 6; i++) { const x = 32 + R(-9, 9), y = 32 + R(-9, 9), r = R(14, 26), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(hex, .85)); rg.addColorStop(1, rgba(hex, 0)); g.globalAlpha = .55; g.fillStyle = rg; g.fillRect(0, 0, 64, 64); } SPR[k] = c; } return SPR[k]; }
  const spr = (c, img, x, y, s) => c.drawImage(img, x - s, y - s, s * 2, s * 2);
  function jag(x1, y1, x2, y2, seg, amp) { const p = [[x1, y1]], nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1; for (let i = 1; i < seg; i++) { const t = i / seg, o = R(-amp, amp) * Math.sin(t * Math.PI); p.push([x1 + (x2 - x1) * t + nx / l * o, y1 + (y2 - y1) * t + ny / l * o]); } p.push([x2, y2]); return p; }
  const pathOf = (c, p) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); };

  /* 粒子：feather 黑羽｜tongue 黑焰舌｜mote 光點｜shard 碎片｜streak 火花線｜smoke 煙 */
  function parts(o) {
    let n = N(o.n); const cap = CAPS[T]; if (liveP + n > cap) n = Math.max(0, cap - liveP); if (!n) return;
    const ps = []; let life = 0;
    for (let i = 0; i < n; i++) { const a = R(o.ang ? o.ang[0] : 0, o.ang ? o.ang[1] : TAU), s = R(o.spd[0], o.spd[1]), l = R(o.life[0], o.life[1]), d = R(0, o.delay || 0);
      ps.push({ x: o.x + R(-(o.jx || 0), o.jx || 0), y: o.y + R(-(o.jy || 0), o.jy || 0), vx: Math.cos(a) * s, vy: Math.sin(a) * s, l, d, s: R(o.size[0], o.size[1]), c: o.colors[i % o.colors.length], r: R(0, TAU), vr: R(-4, 4), w: R(0, TAU) }); life = Math.max(life, l + d); }
    liveP += n; setTimeout(() => { liveP = Math.max(0, liveP - n); }, (life * 1000 + 200) / spd());
    const shp = o.shape || 'mote', g = o.g || 0, drag = o.drag || 0, to = o.to, pull = o.pull || 0, rim = o.rim || C.pink;
    return add({ add: !!o.add, life, draw(c, k, dt, t) {
      for (const p of ps) { const lt = t - p.d; if (lt < 0 || lt > p.l) continue; const q = lt / p.l;
        if (to) { const dx = to.x - p.x, dy = to.y - p.y, dd = Math.hypot(dx, dy) || 1; p.vx += dx / dd * pull * 60 * dt; p.vy += dy / dd * pull * 60 * dt; if (dd < 14) { p.l = lt; continue; } }
        p.vx *= 1 - drag * dt; p.vy = p.vy * (1 - drag * dt) + g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        const al = (o.alpha || 1) * (q < .15 ? q / .15 : 1 - Math.pow(q, 2)); if (al <= .01) continue; c.globalAlpha = al;
        if (shp === 'mote') spr(c, glowS(p.c), p.x, p.y, p.s * (1 - q * .5));
        else if (shp === 'smoke') spr(c, smokeS(p.c), p.x, p.y, p.s * (.6 + q * .9));
        else if (shp === 'streak') { const v = Math.hypot(p.vx, p.vy) || 1, L = Math.min(40, v * .05) * (1 - q); c.strokeStyle = p.c; c.lineWidth = p.s; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx / v * L, p.y - p.vy / v * L); c.stroke(); }
        else { c.save(); c.translate(p.x, p.y);
          if (shp === 'feather') { p.x += Math.sin(t * 2.2 + p.w) * 28 * dt; c.rotate(p.r * .3 + Math.sin(t * 3 + p.w) * .6); const s = p.s / 20; c.scale(s, s);
            c.beginPath(); c.moveTo(0, -22); c.quadraticCurveTo(8, -6, 2, 20); c.lineTo(-2, 20); c.quadraticCurveTo(-8, -6, 0, -22); c.closePath(); c.fillStyle = p.c; c.fill();
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = rim; c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.moveTo(0, -18); c.lineTo(0, 22); c.stroke(); }
          else if (shp === 'tongue') { const s = p.s * (1 - q * .6); c.rotate(Math.sin(t * 9 + p.w) * .25); c.beginPath(); c.moveTo(0, -s * 1.8); c.quadraticCurveTo(s, -s * .1, 0, s); c.quadraticCurveTo(-s, -s * .1, 0, -s * 1.8); c.fillStyle = p.c; c.fill();
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = rim; c.globalAlpha = al * .7; c.lineWidth = 1.5; c.stroke(); }
          else { c.rotate(p.r); const s = p.s; c.beginPath(); c.moveTo(0, -s); c.lineTo(s * .55, s * .5); c.lineTo(-s * .4, s * .7); c.closePath(); c.fillStyle = p.c; c.fill(); }
          c.restore(); } } } });
  }
  /* 黑霸王色雷：外圈黑、內圈色、中心白，每 0.05 秒重新抖動 */
  function hbolt(x1, y1, x2, y2, o) { o = o || {}; let p, fk, acc = 1; const w = o.w || 7, col = o.color || C.crim;
    const mk = () => { p = jag(x1, y1, x2, y2, 12, o.amp || 26); fk = [4, 8].map(i => jag(p[i][0], p[i][1], p[i][0] + R(-70, 70), p[i][1] + R(-40, 70), 5, 12)); }; mk();
    return add({ life: o.life || .32, draw(c, k, dt) { acc += dt; if (acc > .05) { acc = 0; mk(); } const a = 1 - k * k; c.lineJoin = 'round'; c.lineCap = 'round';
      c.globalAlpha = a * .85; c.strokeStyle = C.ink; c.lineWidth = w * 1.9; pathOf(c, p); c.stroke(); c.lineWidth = w; fk.forEach(f => { pathOf(c, f); c.stroke(); });
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w * .75; pathOf(c, p); c.stroke(); c.lineWidth = w * .4; fk.forEach(f => { pathOf(c, f); c.stroke(); });
      c.strokeStyle = '#fff0f4'; c.lineWidth = w * .25; pathOf(c, p); c.stroke(); } }); }
  /* 不用 shadowBlur 的發光環／裂痕／光柱／弧斬（shadowBlur 在低階手機很吃效能，改用預畫的光暈貼圖） */
  function ring(x, y, o) { o = o || {}; const col = o.color || '#ffffff'; return add({ add: true, life: o.life || .45, draw(c, k) { const r = (o.r0 || 10) + ((o.r1 || 150) - (o.r0 || 10)) * ease(k), w = (o.w || 12) * (1 - k) + 1; c.translate(x, y); c.scale(1, o.flat || 1);
    c.globalAlpha = (1 - k) * .45; c.strokeStyle = col; c.lineWidth = w * 2.6; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.globalAlpha = 1 - k; c.lineWidth = w; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, w * .3); c.stroke(); } }); }
  function cracks(x, y, o) { const L = []; for (let i = 0; i < (o.n || 10); i++) { const a = R(-Math.PI, 0) * (Math.random() < .5 ? 1 : -1), d = R(.4, 1) * (o.len || 200); L.push(jag(x, y, x + Math.cos(a) * d, y + Math.sin(a) * d * .35, 7, 12)); }
    return add({ life: o.life || .9, draw(c, k) { c.globalAlpha = 1 - k * k * k; c.lineJoin = 'miter'; L.forEach((l, i) => { const sub = l.slice(0, Math.max(2, Math.ceil(l.length * Math.min(1, k * 7)))); c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = 5 - (i % 3); pathOf(c, sub); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = o.color || C.pink; c.lineWidth = 2 - (i % 3) * .5; c.stroke(); }); } }); }
  function pillar(x, y, o) { const col = o.color || C.crim; ring(x, y, { r1: o.w * 2.2, flat: .25, color: col, life: .6 }); return add({ add: true, life: o.life || .7, draw(c, k) { const w = o.w * Math.sin(Math.min(1, k * 1.3) * Math.PI); if (w < 1) return; const g = glowS(col);
    c.globalAlpha = .9; c.drawImage(g, x - w * 1.4, -60, w * 2.8, y + 80); c.drawImage(glowS('#ffffff'), x - w * .45, -60, w * .9, y + 80); spr(c, g, x, y, w * 2.2); } }); }
  function slash(x, y, o) { const a0 = o.a, span = o.span || 1.8, r = o.r, w = o.w || 26, col = o.color || C.crim, N = 20;
    return add({ add: true, life: o.life || .32, draw(c, k) { const head = ease(Math.min(1, k * 2.2)), tail = Math.max(0, (k - .25) / .75), s0 = a0 + span * tail, s1 = a0 + span * head; if (s1 - s0 < .01) return; c.translate(x, y); c.scale(1, .7);
      const band = (ww, cl, al) => { c.globalAlpha = al; c.fillStyle = cl; c.beginPath(); for (let i = 0; i <= N; i++) { const q = i / N, a = s0 + (s1 - s0) * q, th = Math.sin(q * Math.PI) * ww * (.3 + q * .7); c.lineTo(Math.cos(a) * (r + th), Math.sin(a) * (r + th)); } for (let i = N; i >= 0; i--) { const a = s0 + (s1 - s0) * i / N; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); };
      band(w * 2.2, col, .35 * (1 - k * .6)); band(w * 1.4, col, .6 * (1 - k * .6)); band(w * .5, '#ffffff', 1 - k * .5); } }); }
  /* 深色衝擊環（不發光的黑環＋細細的發光邊） */
  function dring(x, y, o) { o = o || {}; return add({ life: o.life || .55, draw(c, k) { const r = (o.r0 || 10) + ((o.r1 || 200) - (o.r0 || 10)) * ease(k), w = (o.w || 18) * (1 - k) + 2; c.translate(x, y); c.scale(1, o.flat || 1);
    c.globalAlpha = (1 - k) * .85; c.strokeStyle = C.ink; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.strokeStyle = o.color || C.crim; c.lineWidth = Math.max(1.2, w * .22); c.beginPath(); c.arc(0, 0, r + w * .4, 0, TAU); c.stroke(); } }); }
  /* 魔法陣／契約紋：雙圈、星形、符文刻度，可平放在地上（flat） */
  function sigil(x, y, o) { const n = o.n || 5, runes = o.runes || 18, col = o.col || C.pink;
    return add({ add: true, life: o.life || 1.2, draw(c, k, dt, t) { const a = fade(k, .1, .72) * (o.a || 1), r = o.r * (.7 + .3 * ease(Math.min(1, k * 3))), dp = Math.min(1, k * 3.4);
      c.translate(x, y); c.scale(1, o.flat || 1); c.rotate(t * (o.spin == null ? .7 : o.spin)); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = o.lw || 2.4; c.lineJoin = 'round';
      c.beginPath(); c.arc(0, 0, r, 0, TAU * dp); c.stroke(); c.beginPath(); c.arc(0, 0, r * .8, 0, -TAU * dp, true); c.stroke();
      c.globalAlpha = a * clamp((k - .06) * 5, 0, 1); c.beginPath();
      if (n === 6) { for (let s = 0; s < 2; s++) for (let i = 0; i <= 3; i++) { const g = -Math.PI / 2 + s * Math.PI / 3 + i * TAU / 3, px = Math.cos(g) * r * .78, py = Math.sin(g) * r * .78; i ? c.lineTo(px, py) : c.moveTo(px, py); } }
      else for (let i = 0; i <= n; i++) { const g = -Math.PI / 2 + i * 2 * TAU / n, px = Math.cos(g) * r * .78, py = Math.sin(g) * r * .78; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke(); c.lineWidth = 1.5;
      for (let i = 0; i < runes; i++) { const g = i / runes * TAU, cs = Math.cos(g), sn = Math.sin(g); c.beginPath(); c.moveTo(cs * r * .83, sn * r * .83); c.lineTo(cs * r * .95, sn * r * .95); if (i % 3 === 0) { c.moveTo(cs * r * .89 - sn * 5, sn * r * .89 + cs * 5); c.lineTo(cs * r * .89 + sn * 5, sn * r * .89 - cs * 5); } c.stroke(); }
      if (o.eye) { const e = r * .34; c.rotate(-t * (o.spin == null ? .7 : o.spin)); c.lineWidth = 2; c.beginPath(); c.moveTo(-e, 0); c.quadraticCurveTo(0, -e * .9, e, 0); c.quadraticCurveTo(0, e * .9, -e, 0); c.stroke(); c.beginPath(); c.arc(0, 0, e * .3, 0, TAU); c.stroke(); }
      c.globalAlpha = a * .35; spr(c, glowS(col), 0, 0, r * .9); } }); }
  /* 鎖鏈：沿著下垂的曲線一節一節伸出去，伸到後拉緊，再有一道光沿鏈子跑過 */
  function chain(x1, y1, x2, y2, o) { o = o || {}; const K = o.k || 1, L = 13 * K, rim = o.rim || C.pink, grow = o.grow || .32, sag0 = o.sag == null ? 60 : o.sag;
    return add({ life: o.life || 1, draw(c, k, dt, t) { const g = clamp(t / grow, 0, 1), tight = clamp((t - grow) / .14, 0, 1), sag = sag0 * (1 - tight * .85) + Math.sin(t * 9) * 3 * (1 - tight), out = k > .78 ? (1 - k) / .22 : 1;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, cx = mx - dy / len * sag, cy = my + dx / len * sag, cnt = Math.ceil(len * 1.04 / L);
      const P = q => { const u = 1 - q; return [u * u * x1 + 2 * u * q * cx + q * q * x2, u * u * y1 + 2 * u * q * cy + q * q * y2, Math.atan2(2 * u * (cy - y1) + 2 * q * (y2 - cy), 2 * u * (cx - x1) + 2 * q * (x2 - cx))]; };
      c.globalAlpha = out; const lim = Math.floor(cnt * g);
      for (let i = 0; i < lim; i++) { const [px, py, a] = P((i + .5) / cnt); c.save(); c.translate(px, py); c.rotate(a); c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#1c1424'; c.lineWidth = 3.2 * K; c.beginPath();
        if (i % 2 === 0) c.ellipse(0, 0, L * .62, L * .3, 0, 0, TAU); else { c.moveTo(-L * .62, 0); c.lineTo(L * .62, 0); } c.stroke();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = rim; c.lineWidth = 1.2 * K; c.stroke(); c.restore(); }
      c.globalCompositeOperation = 'lighter';
      if (g < 1) { const [hx, hy] = P(g); c.globalAlpha = out; spr(c, glowS(rim), hx, hy, 18 * K); }
      else { const q = clamp((t - grow - .1) / .35, 0, 1); if (q > 0 && q < 1) { const [hx, hy] = P(q); spr(c, glowS('#ffffff'), hx, hy, 14 * K); spr(c, glowS(rim), hx, hy, 30 * K); } } } }); }
  /* 眼睛：杏仁形眼眶、紅色虹膜、直立瞳孔；依序睜開，結尾閉上；gaze 讓瞳孔看向某點，beam 從每隻眼拉出凝視線 */
  function eyes(cx, cy, o) {
    const n = o.n || 8, pts = [], a0 = o.a0 == null ? -2.7 : o.a0, a1 = o.a1 == null ? -.44 : o.a1, mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) { const a = n === 1 ? -Math.PI / 2 : a0 + (a1 - a0) * i / (n - 1), x = n === 1 ? cx : cx + Math.cos(a) * o.rx, y = n === 1 ? cy : cy + Math.sin(a) * o.ry;
      const s = o.size * (n === 1 ? 1 : .82 + .3 * (1 - Math.abs(i - mid) / (mid || 1))); let gx = 0, gy = 0; if (o.gaze) { const dx = o.gaze.x - x, dy = o.gaze.y - y, dd = Math.hypot(dx, dy) || 1; gx = dx / dd * s * .22; gy = dy / dd * s * .12; }
      pts.push({ x, y, s, d: (o.stag == null ? .06 : o.stag) * Math.abs(i - mid), tilt: n === 1 ? 0 : (a + Math.PI / 2) * .35, gx, gy }); }
    const life = o.life || 1.2, closeAt = o.closeAt || .8, op = (p, t, k) => ease(clamp((t - p.d) / .16, 0, 1)) * (k > closeAt ? clamp((1 - k) / (1 - closeAt), 0, 1) : 1);
    add({ add: true, life, draw(c, k, dt, t) { const glare = o.glareAt != null && t > o.glareAt ? Math.max(0, 1 - (t - o.glareAt) / .3) : 0;
      for (const p of pts) { const e = op(p, t, k); if (e < .02) continue; c.globalAlpha = e * (.55 + glare * .45); spr(c, glowS(o.col || C.crim), p.x, p.y, p.s * (2 + glare * 1.6));
        if (o.beam && t > o.beam.at && t < o.beam.at + .45) { const q = (t - o.beam.at) / .45; c.globalAlpha = e * (1 - q) * .9; c.strokeStyle = o.col || C.crim; c.lineWidth = 2.2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + (o.beam.x - p.x) * Math.min(1, q * 3), p.y + (o.beam.y - p.y) * Math.min(1, q * 3)); c.stroke(); } } } });
    return add({ life, draw(c, k, dt, t) { for (const p of pts) { const e = op(p, t, k); if (e < .02) continue; const w = p.s, h = w * .46 * e;
      c.save(); c.translate(p.x, p.y); c.rotate(p.tilt); c.globalAlpha = Math.min(1, e * 1.3);
      c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(0, -h * 2, w, 0); c.quadraticCurveTo(0, h * 2, -w, 0); c.closePath();
      const g = c.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, '#ff7a8a'); g.addColorStop(.5, '#b8002a'); g.addColorStop(1, '#2a0008'); c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.fillStyle = '#ffc0ca'; c.beginPath(); c.arc(p.gx, p.gy, w * .42, 0, TAU); c.fill(); c.fillStyle = '#ff1438'; c.beginPath(); c.arc(p.gx, p.gy, w * .34, 0, TAU); c.fill();
      c.fillStyle = '#0a0004'; c.beginPath(); c.ellipse(p.gx, p.gy, w * .065, w * .3, 0, 0, TAU); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(p.gx - w * .13, p.gy - w * .1, w * .06, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = '#12000a'; c.lineWidth = Math.max(1.5, w * .09); c.beginPath(); c.moveTo(-w * 1.1, 0); c.quadraticCurveTo(0, -h * 2.15, w * 1.1, 0); c.stroke(); c.restore(); } } });
  }
  /* 空間裂縫：直立的杏仁形裂口，裡面是深淵與星點，邊緣粉紫發光 */
  function rift(x, y, o) { const st = []; for (let i = 0; i < 14; i++) st.push([R(-.35, .35), R(-.42, .42), R(.6, 1.6), R(0, TAU)]);
    add({ life: o.life || 1.2, draw(c, k) { const e = ease(clamp(k / .25, 0, 1)) * (k > .8 ? (1 - k) / .2 : 1), ww = o.w * e, h = o.h * (.6 + .4 * e); if (ww < 1) return;
      c.beginPath(); c.moveTo(x, y - h / 2); c.quadraticCurveTo(x + ww, y, x, y + h / 2); c.quadraticCurveTo(x - ww, y, x, y - h / 2); const g = c.createRadialGradient(x, y, 0, x, y, h * .5); g.addColorStop(0, '#000000'); g.addColorStop(.7, '#12001e'); g.addColorStop(1, '#3a0640'); c.fillStyle = g; c.globalAlpha = .95; c.fill(); } });
    return add({ add: true, life: o.life || 1.2, draw(c, k, dt, t) { const e = ease(clamp(k / .25, 0, 1)) * (k > .8 ? (1 - k) / .2 : 1), ww = o.w * e, h = o.h * (.6 + .4 * e); if (ww < 1) return;
      c.globalAlpha = e; c.lineWidth = 4; c.strokeStyle = o.col || C.pink; c.beginPath(); c.moveTo(x, y - h / 2); c.quadraticCurveTo(x + ww, y, x, y + h / 2); c.quadraticCurveTo(x - ww, y, x, y - h / 2); c.stroke(); c.lineWidth = 1.4; c.strokeStyle = '#ffffff'; c.stroke();
      st.forEach(s => { c.globalAlpha = e * (.5 + .5 * Math.sin(t * 6 + s[3])); spr(c, glowS(C.lav), x + s[0] * ww, y + s[1] * h, s[2] * 3); });
      c.globalAlpha = e * .8; spr(c, glowS(o.col || C.pink), x, y - h / 2, 26); spr(c, glowS(o.col || C.pink), x, y + h / 2, 26); } }); }
  /* 羽刃橫掃：沿著圓弧一片片長出黑羽，前端粉白發光，尾巴追上前端後消失 */
  function sweep(cx, cy, o) { const M = T >= 3 ? 20 : 13, col = o.col || C.pink;
    return add({ life: o.life || .6, draw(c, k) { const head = ease(clamp(k / .55, 0, 1)), tail = ease(clamp((k - .22) / .7, 0, 1)); if (head <= tail) return;
      for (let j = 0; j <= M; j++) { const q = tail + (head - tail) * j / M, a = o.a0 + (o.a1 - o.a0) * q, px = cx + Math.cos(a) * o.r, py = cy + Math.sin(a) * o.r * (o.flat || 1), fq = j / M, L = o.w * (.55 + .45 * fq);
        c.save(); c.translate(px, py); c.rotate(a + (o.a1 > o.a0 ? Math.PI / 2 : -Math.PI / 2) + .5); c.globalCompositeOperation = 'source-over'; c.globalAlpha = .35 + .6 * fq;
        c.beginPath(); c.moveTo(0, -L); c.quadraticCurveTo(L * .22, 0, 0, L * .35); c.quadraticCurveTo(-L * .22, 0, 0, -L); c.fillStyle = C.deep; c.fill();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = fq > .85 ? '#ffffff' : col; c.lineWidth = 1.6 + fq * 1.6; c.stroke(); c.restore(); }
      const a = o.a0 + (o.a1 - o.a0) * head; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k * .5; spr(c, glowS(col), cx + Math.cos(a) * o.r, cy + Math.sin(a) * o.r * (o.flat || 1), o.w * 1.1); } }); }
  /* 深紅日冕（永劫不滅）：旋轉的光環與放射細刺 */
  function corona(x, y, o) { const sp = []; for (let i = 0; i < 30; i++) sp.push([i / 30 * TAU, R(1.12, 1.45)]);
    return add({ add: true, life: o.life || 1.2, draw(c, k, dt, t) { const a = fade(k, .15, .7), r = o.r * (.8 + .2 * ease(Math.min(1, k * 2))); c.translate(x, y); c.rotate(t * .5); c.globalAlpha = a; c.strokeStyle = o.col || C.crim; c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.lineWidth = 1.6; c.beginPath(); sp.forEach(s => { c.moveTo(Math.cos(s[0]) * r * 1.04, Math.sin(s[0]) * r * 1.04); c.lineTo(Math.cos(s[0]) * r * s[1], Math.sin(s[0]) * r * s[1]); }); c.stroke();
      c.globalAlpha = a * .6; spr(c, glowS(o.col || C.crim), 0, 0, r * 1.3); } }); }
  /* 黑焰巨刃（毀滅之力）：在目標上方成形，從後上方劈到前下方 */
  function blade(px, py, L, d, o) { const th0 = Math.PI - .6 * d, th1 = Math.PI + d * (Math.PI - .3), wb = L * .1;
    return add({ life: o.life || 1, draw(c, k, dt, t) { const form = ease(clamp(k / .42, 0, 1)), sw = easeIO(clamp((k - .42) / .14, 0, 1)), out = k > .7 ? (1 - k) / .3 : 1, th = th0 + (th1 - th0) * sw, len = L * (.3 + .7 * form);
      c.translate(px, py); c.rotate(th); c.globalAlpha = out;
      c.beginPath(); c.moveTo(-wb * .5, 0); c.lineTo(wb * .5, 0); c.lineTo(wb * .35, len * .85); c.lineTo(0, len); c.lineTo(-wb * .35, len * .85); c.closePath();
      const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, '#1a0010'); g.addColorStop(.6, '#07000a'); g.addColorStop(1, '#3a0018'); c.fillStyle = g; c.fill();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = o.col || C.crim; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#ffe0e8'; c.lineWidth = 1; c.stroke();
      for (let i = 0; i < 7; i++) { const yy = R(.05, .9) * len, xx = (Math.random() < .5 ? -1 : 1) * wb * .45; c.globalAlpha = out * .7; spr(c, glowS(o.col || C.crim), xx, yy, R(6, 14)); }
      if (sw > 0 && sw < 1) { c.globalAlpha = .5 * out; c.rotate(-(th1 - th0) * .08 * Math.sign(th1 - th0)); c.strokeStyle = o.col || C.crim; c.lineWidth = wb * .8; c.beginPath(); c.moveTo(0, len * .3); c.lineTo(0, len); c.stroke(); } } }); }
  /* 黑焰彈：從施放者飛向目標，拖著黑焰 */
  function orb(x1, y1, x2, y2, o) { return add({ life: o.life || .3, draw(c, k) { const e = easeIO(k), x = x1 + (x2 - x1) * e, y = y1 + (y2 - y1) * e - Math.sin(k * Math.PI) * (o.arc || 60), r = o.r || 26;
    c.globalAlpha = 1; spr(c, smokeS('#12000c'), x, y, r * 1.6); c.globalCompositeOperation = 'lighter'; spr(c, glowS(o.col || C.mag), x, y, r * 1.3); c.globalCompositeOperation = 'source-over'; c.fillStyle = C.ink; c.beginPath(); c.arc(x, y, r * .5, 0, TAU); c.fill(); } }); }
  /* 全畫面：四周壓暗（戰場畫布會跟著鏡頭換算，所以畫一個大方塊蓋住） */
  function vigS(hex) { const k = 'v' + hex; if (!SPR[k]) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 35, 9, 32, 35, 46); r.addColorStop(0, rgba(hex, 0)); r.addColorStop(1, rgba(hex, 1)); g.fillStyle = r; g.fillRect(0, 0, 64, 64); SPR[k] = c; } return SPR[k]; }
  /* 四周壓暗：預先畫好的小張漸層放大貼上（每幀不重建漸層，低階手機也省）；技能特效低／省電時不畫（背景暗幕已經夠） */
  function vig(hex, a, life) { if (T < 2) return; const img = vigS(hex); return add({ life, draw(c, k) { const W = FXE.W || 400, H = FXE.H || 400; c.globalAlpha = fade(k, .15, .72) * a; c.drawImage(img, -W * .3, -H * .7, W * 1.6, H * 2.4); } }); }
  const flash = (col, a, life) => { if (T >= 1) X.flash(col, life || .3, Math.min(.35, a) * (T === 1 ? .7 : 1)); };
  const quake = () => { if (T >= 1 && typeof shake === 'function') shake(); };
  const stop = ms => { if (T >= 2 && window.FXPRO && FXPRO.hitStop) try { FXPRO.hitStop(ms); } catch (e) { } };
  const sfx = n => { try { SFX.play(n); } catch (e) { } };
  const say = (x, y, s, o) => X.text(x, y, s, Object.assign({ size: 52, color: '#ffd0dc', color2: '#a0002a', stroke: '#14000a' }, o || {}));
  /* 背景暗幕：只壓暗背景（.kd-dim 在背景與戰場之間），角色維持明亮 */
  function dim(ms) { const scr = $('battleScreen'); if (!scr) return; let d = scr.querySelector('.kd-dim'); if (!d) { d = document.createElement('div'); d.className = 'kd-dim'; d.setAttribute('aria-hidden', 'true'); scr.appendChild(d); }
    d.classList.add('on', 'imu-dim'); clearTimeout(d.__imuT); d.__imuT = setTimeout(() => d.classList.remove('on', 'imu-dim'), ms / spd()); }
  /* 00GameDevs 3D 素材（只在高特效時） */
  const vfx = (id, opt, mode, S, life, ox, oy) => { if (T < 2 || !window.VFX00 || !VFX00.fx) return false; try { return VFX00.fx(id, opt, mode, S, life, ox, oy); } catch (e) { return false; } };

  /* ---------- 位置 ---------- */
  function geo(S) { const p = fighterPoint(S), img = $('bImg' + S), f = $('bF' + S); const sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1;
    const h = clamp((img.offsetHeight || 220) * sc, 120, (p.h || 500) * .92), k = clamp(h / 320, .6, 1.6); return { x: p.x, y: p.y, h, k, head: p.y - h * .28, feet: p.y + h * .46, W: p.w, H: p.h }; }
  function iconPt(i) { const b = document.querySelector(`#bTeam .tm[data-i="${i}"]`), A = $('bArena'); if (!b || !A || !b.offsetWidth) return null; const r = b.getBoundingClientRect(), aR = A.getBoundingClientRect(), s = aR.width / (A.offsetWidth || 1) || 1;
    return { x: (r.left + r.width / 2 - aR.left) / s, y: (r.top + r.height / 2 - aR.top) / s, i }; }
  function benchOf(t) { const b = typeof battle !== 'undefined' && battle; if (!b || !t || !Array.isArray(b.team)) return []; if (!(t === b.player || b.team.includes(t))) return [];
    return b.team.map((x, i) => ({ x, i })).filter(o => o.x && o.x !== b.player && o.x !== t && o.x.hp > 0 && !o.x.voidImmune); }
  function pulseIcon(i, kind) { const b = document.querySelector(`#bTeam .tm[data-i="${i}"]`); if (!b) return; b.classList.remove('imu-bh', 'imu-bh-c', 'imu-bh-w'); void b.offsetWidth; b.classList.add('imu-bh', kind === 'chain' ? 'imu-bh-c' : 'imu-bh-w'); setTimeout(() => b.classList.remove('imu-bh', 'imu-bh-c', 'imu-bh-w'), 1000); }
  const onBattle = () => { const s = $('battleScreen'); return !!(s && !s.classList.contains('hidden') && typeof battle !== 'undefined' && battle); };

  /* ---------- DOM 背景：王座、雙翼（在立繪後方，演完移除） ---------- */
  const f1 = v => v.toFixed(1);
  let WING = {};
  /* 翅膀：前緣的「骨」從肩膀往上往外彎，飛羽從骨上往外下方垂（越外側越長），三層羽毛 */
  function wingSVG(tip, mirror) { const key = tip + mirror; if (WING[key]) return WING[key]; let s = ''; const id = tip.slice(1);
    const P = u => { const v = 1 - u; return [v * v * 10 + 2 * v * u * 70 + u * u * 220, v * v * 250 + 2 * v * u * 30 + u * u * 30]; };
    const layer = (n, a0, a1, L0, L1, wf, fill, stroke, op, u0) => { for (let i = 0; i < n; i++) { const u = (u0 || 0) + (1 - (u0 || 0)) * i / (n - 1), a = a0 + (a1 - a0) * u, L = L0 + (L1 - L0) * u, [bx, by] = P(u), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, tx = bx + dx * L, ty = by + dy * L, mx = bx + dx * L * .55, my = by + dy * L * .55;
      s += `<path d="M${f1(bx)} ${f1(by)}Q${f1(mx + nx * wf)} ${f1(my + ny * wf)} ${f1(tx)} ${f1(ty)}Q${f1(mx - nx * wf * .5)} ${f1(my - ny * wf * .5)} ${f1(bx)} ${f1(by)}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6" opacity="${op}"/>`; } };
    layer(13, 1.62, .32, 110, 330, 22, `url(#iwA${id})`, tip, .97); layer(11, 1.5, .5, 70, 190, 18, `url(#iwB${id})`, '#c070ff', .97, .05); layer(9, 1.4, .7, 34, 90, 13, '#1c0414', C.crim, .97, .1);
    s += `<path d="M10 250Q70 30 220 30" fill="none" stroke="#12000a" stroke-width="9" stroke-linecap="round"/><path d="M10 250Q70 30 220 30" fill="none" stroke="${tip}" stroke-width="2.6" stroke-linecap="round"/>`;
    const g = `<defs><linearGradient id="iwA${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07000a"/><stop offset=".6" stop-color="#2e0420"/><stop offset="1" stop-color="${tip}"/></linearGradient><linearGradient id="iwB${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a0008"/><stop offset="1" stop-color="#4a0a3a"/></linearGradient></defs>`;
    return (WING[key] = `<svg viewBox="-10 0 560 370" preserveAspectRatio="none">${g}<g${mirror ? ' transform="translate(540 0) scale(-1 1)"' : ''}>${s}</g></svg>`); }
  const THRONE = `<svg viewBox="0 0 200 260" preserveAspectRatio="none"><defs><linearGradient id="itG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0418"/><stop offset=".6" stop-color="#0a0008"/><stop offset="1" stop-color="#000"/></linearGradient></defs>
    <path d="M100 4L112 42L127 20L133 64L151 38L152 122L162 132L162 198L176 200L180 256L20 256L24 200L38 198L38 132L48 122L49 38L67 64L73 20L88 42Z" fill="url(#itG)" stroke="#ff2a5a" stroke-width="2.4" opacity=".92"/>
    <path d="M100 30L108 60L100 92L92 60Z M62 96L138 96 M56 150L144 150" fill="none" stroke="#ff5ab4" stroke-width="1.6" opacity=".8"/><rect x="40" y="170" width="120" height="22" rx="4" fill="#120008" stroke="#ff2a5a" stroke-width="1.6"/></svg>`;
  /* v174：背景元素（王座、雙翼）照立繪高度放大，伊姆第三型態 5.5 倍時會變成好幾千像素的圖層，iPhone 記憶體不足閃退；
     限制在畫面看得到的大小約 1.5 倍以內（換回戰場座標：÷ 鏡頭倍率），保持底部置中。 */
  function capBox(A, o) { const cam = parseFloat(A.style.getPropertyValue('--cam')) || 1, mw = innerWidth * 1.5 / cam, mh = innerHeight * 1.3 / cam, k = Math.min(1, mw / Math.max(1, o.w), mh / Math.max(1, o.h));
    if (k < 1) { const w = o.w * k, h = o.h * k; o = Object.assign({}, o, { x: o.x + (o.w - w) / 2, y: o.y + (o.h - h), w, h }); } return o; }
  function back(S, html, o) { const A = $('bArena'); if (!A || T === 0) return null; o = capBox(A, o); const d = document.createElement('div'); d.className = 'imu-bk ' + (o.cls || ''); d.setAttribute('aria-hidden', 'true'); d.innerHTML = html;
    d.style.cssText = `left:${f1(o.x)}px;top:${f1(o.y)}px;width:${f1(o.w)}px;height:${f1(o.h)}px;transform-origin:${o.origin || '50% 100%'}`;
    let wr = A.querySelector(':scope > .imu-bkwrap'); if (!wr) { wr = document.createElement('div'); wr.className = 'imu-bkwrap'; wr.setAttribute('aria-hidden', 'true'); A.insertBefore(wr, A.querySelector('.fighter') || A.firstChild); } wr.appendChild(d); const ms = o.ms / spd(); let an = null;
    try { an = d.animate(o.kf, { duration: ms, easing: o.ease || 'ease-out', fill: 'forwards' }); an.onfinish = () => d.remove(); } catch (e) { }
    setTimeout(() => d.remove(), ms + 300); return d; }
  function throneBack(S, g, ms, sc) { const h = g.h * (sc || 1.3), w = h * .74; return back(S, THRONE, { x: g.x - w / 2, y: g.feet - h + g.h * .04, w, h, ms, cls: 'imu-throne',
    kf: [{ opacity: 0, transform: 'translateY(14%) scale(.92)' }, { opacity: 1, transform: 'translateY(0) scale(1)', offset: .3 }, { opacity: .9, transform: 'translateY(0) scale(1.03)', offset: .8 }, { opacity: 0, transform: 'translateY(-2%) scale(1.05)' }] }); }
  function wingsBack(S, g, ms, sc, tip, hold) { const w = clamp(g.h * (sc || 1.2) * .62, 110, (FXE.W || 400) * .62), h = w * 370 / 560, sy = g.y - g.h * .16, gap = g.h * .05, tp = tip || C.pink, op = hold || 1;
    const kf = s => [{ opacity: 0, transform: `rotate(${s * 55}deg) scale(.35)` }, { opacity: op, transform: `rotate(${s * -5}deg) scale(1.03)`, offset: .3 }, { opacity: op * .92, transform: 'rotate(0deg) scale(1)', offset: .78 }, { opacity: 0, transform: `rotate(${s * 10}deg) scale(1.05)` }];
    back(S, wingSVG(tp, false), { x: g.x + gap - .036 * w, y: sy - .676 * h, w, h, ms, kf: kf(1), origin: '3.6% 67.6%', cls: 'imu-wing', ease: 'cubic-bezier(.2,.8,.2,1)' });
    back(S, wingSVG(tp, true), { x: g.x - gap - .964 * w, y: sy - .676 * h, w, h, ms, kf: kf(-1), origin: '96.4% 67.6%', cls: 'imu-wing', ease: 'cubic-bezier(.2,.8,.2,1)' }); }

  /* ---------- 各招編排（回傳＝命中瞬間；之後的餘韻用 later） ---------- */
  const CH = {};
  /* 初始型態 不死之身：深紅黑繭包住伊姆，破繭後血色光點上升 */
  CH.und0 = async A => { const f = A.f; sfx('dark'); dim(1300); vig(C.blood, .45, 1.3);
    sigil(f.x, f.feet, { r: f.h * .5, flat: .3, col: C.crim, n: 5, life: 1.3, spin: .5 });
    parts({ x: f.x, y: f.y, n: 34, spd: [10, 40], life: [.5, .8], size: [14, 28], colors: ['#1a0010', '#2a0018'], shape: 'smoke', jx: f.h * .55, jy: f.h * .5, to: { x: f.x, y: f.y }, pull: 5 });
    parts({ x: f.x, y: f.y, n: 24, spd: [20, 60], life: [.5, .8], size: [5, 10], colors: ['#2a0010', '#3a0018'], shape: 'shard', jx: f.h * .45, jy: f.h * .45, to: { x: f.x, y: f.y }, pull: 6, delay: .15 });
    await nap(520); sfx('heal'); X.glow(f.x, f.y, { color: C.crim, r: f.h * .7, life: .6 }); ring(f.x, f.y, { r1: f.h * .75, color: C.crim, w: 8, life: .55 });
    parts({ x: f.x, y: f.y, n: 30, spd: [180, 420], life: [.3, .6], size: [4, 8], colors: ['#3a0018', '#1a0010'], shape: 'shard', g: 300 });
    vfx('healing-field', { color: C.crim, size: .9 }, 'c', A.S, 1.2, 0, .9);
    later(80, () => parts({ x: f.x, y: f.feet - 20, n: 34, spd: [40, 110], ang: [-2.2, -.9], life: [.8, 1.3], size: [6, 12], colors: [C.crim, C.pink, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .3, g: -40 }));
    say(f.x, f.head - f.h * .2, '不死', { size: 50 }); await nap(180); };
  /* 第一型態 不死之身：加上黑轉之環與向上的深紅雷 */
  CH.und1 = async A => { const f = A.f; sfx('dark'); dim(1400); vig(C.blood, .5, 1.4);
    sigil(f.x, f.feet, { r: f.h * .58, flat: .3, col: C.crim, n: 6, life: 1.4, spin: .6 }); sigil(f.x, f.feet, { r: f.h * .4, flat: .3, col: C.mag, n: 5, life: 1.3, spin: -.9 });
    parts({ x: f.x, y: f.y, n: 40, spd: [10, 40], life: [.5, .8], size: [14, 28], colors: ['#1a0010', '#22001a'], shape: 'smoke', jx: f.h * .6, jy: f.h * .55, to: { x: f.x, y: f.y }, pull: 6 });
    for (let i = 0; i < 3; i++) later(120 + i * 110, () => hbolt(f.x + R(-.25, .25) * f.h, f.feet, f.x + R(-.1, .1) * f.h, f.head - f.h * .3, { color: C.crim, w: 5 * f.k, life: .25 }));
    await nap(560); sfx('heal'); dring(f.x, f.y, { r1: f.h * .85, w: 20, life: .55 }); X.glow(f.x, f.y, { color: C.crim, r: f.h * .75, life: .6 });
    vfx('healing-field', { color: C.crim, size: 1 }, 'c', A.S, 1.3, 0, .9);
    later(60, () => parts({ x: f.x, y: f.feet - 20, n: 40, spd: [50, 130], ang: [-2.2, -.9], life: [.8, 1.3], size: [6, 12], colors: [C.crim, C.pink, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .32, g: -40 }));
    say(f.x, f.head - f.h * .2, '不死之身', { size: 48 }); await nap(180); };
  /* 黑轉支配：黑粉霧旋繞，三條鎖鏈纏上對手，契約紋烙在對手身上 */
  CH.pact1 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1400);
    parts({ x: f.x, y: f.y, n: 30, spd: [60, 160], life: [.6, 1], size: [16, 26], colors: ['#2a0420', '#3a0a3a'], shape: 'smoke', jx: f.h * .3, jy: f.h * .3, drag: 2 });
    sigil(f.x + A.d * f.h * .2, f.head, { r: f.h * .16, col: C.mag, n: 5, life: 1, spin: 2 });
    await nap(220); sfx('crank');
    for (let i = 0; i < 3; i++) chain(f.x + A.d * f.h * .2, f.head + i * 14, t.x + R(-.1, .1) * t.h, t.y + (i - 1) * t.h * .18, { sag: (i - 1) * 70 + 30, k: f.k * .85, rim: i === 1 ? C.mag : C.pink, life: 1.15, grow: .32 });
    await nap(420); sfx('buff'); sigil(t.x, t.y, { r: t.h * .32, col: C.pink, n: 5, life: 1, spin: -1.2, eye: true }); flash('#3a0030', .22, .3);
    try { impactFrame(A.T); } catch (e) { } say(t.x, t.head - t.h * .18, '惡魔契約', { size: 44, color: '#ffc0e8', color2: '#7a0a5a' });
    later(120, () => parts({ x: t.x, y: t.y, n: 26, spd: [40, 140], life: [.5, .9], size: [4, 8], colors: [C.pink, C.mag, '#ffffff'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3 })); await nap(120); };
  /* 虛空威壓：伊姆化成影子，壓迫波一圈圈擴散，對手腳下裂開深淵 */
  CH.void1 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1300); vig(C.ink, .55, 1.3);
    const img = $('bImg' + A.S); try { img.animate([{ opacity: 1 }, { opacity: .25, offset: .35 }, { opacity: .25, offset: .7 }, { opacity: 1 }], { duration: 1200 / spd() }); } catch (e) { }
    parts({ x: f.x, y: f.y, n: 30, spd: [80, 200], life: [.5, .9], size: [14, 26], colors: ['#07000a', '#14001a'], shape: 'smoke', jx: f.h * .25, jy: f.h * .35, drag: 1.5 });
    for (let i = 0; i < 3; i++) later(i * 150, () => dring(f.x, f.y, { r1: f.h * (1 + i * .3), w: 24, life: .6, color: C.mag }));
    await nap(450); sfx('heavy'); rift(t.x, t.feet - t.h * .05, { w: t.h * .18, h: t.h * .5, life: .9, col: C.mag }); cracks(t.x, t.feet, { n: 9, len: t.h * .6, color: C.pink });
    for (let i = 0; i < 3; i++) later(60 + i * 60, () => hbolt(t.x + R(-.08, .08) * t.h, t.feet, t.x + R(-.15, .15) * t.h, t.y - t.h * .2, { color: C.mag, w: 5 * t.k, life: .22 }));
    await nap(200); quake(); say(t.x, t.head - t.h * .2, '深淵', { size: 46, color: '#e8c8ff', color2: '#5a0a7a' }); };
  /* 黑焰・凶兆：黑焰聚成火球擲出，炸開黑色火舌，凶兆之眼在對手頭上睜開 */
  CH.flame1 = async A => { const f = A.f, t = A.t, hx = f.x + A.d * f.h * .28, hy = f.y - f.h * .1; sfx('dark');
    parts({ x: hx, y: hy, n: 30, spd: [20, 60], life: [.35, .6], size: [8, 14], colors: ['#0a0006', '#1a0010'], shape: 'tongue', rim: C.mag, jx: f.h * .35, jy: f.h * .35, to: { x: hx, y: hy }, pull: 8 });
    X.glow(hx, hy, { color: C.mag, r: f.h * .3, life: .5, hold: true });
    await nap(420); sfx('whoosh'); orb(hx, hy, t.x, t.y, { r: 24 * f.k, life: .28, col: C.mag });
    await nap(270); sfx('explode'); quake(); stop(70); flash('#2a0030', .25, .3);
    parts({ x: t.x, y: t.y + t.h * .1, n: 46, spd: [100, 300], ang: [-2.6, -.5], life: [.5, .9], size: [10, 18], colors: ['#07000a', '#14000e'], shape: 'tongue', rim: C.pink, jx: t.h * .2, g: -160 });
    parts({ x: t.x, y: t.y, n: 26, spd: [220, 520], life: [.25, .5], size: [1.5, 3], colors: [C.mag, C.pink, '#ffffff'], shape: 'streak', add: true, drag: 3 });
    dring(t.x, t.y, { r1: t.h * .7, w: 22, life: .5, color: C.mag }); X.glow(t.x, t.y, { color: C.pur, r: t.h * .6, life: .5 });
    vfx('flame-surge', { color: C.pur, size: 1.1 }, 'g', A.T, 1.1);
    eyes(t.x, t.head - t.h * .22, { n: 1, size: t.h * .09, life: 1.1, closeAt: .75 }); say(t.x, t.head - t.h * .42, '凶兆', { size: 44, color: '#e8c8ff', color2: '#6a0a8a' }); };
  /* 最初20人（晉升前的蓄力）：二十道紅光繞著伊姆收攏 */
  CH.asc = async A => { const f = A.f; sfx('dark'); dim(1600); vig(C.blood, .5, 1);
    const pts = []; for (let i = 0; i < 20; i++) pts.push(i / 20 * TAU);
    add({ add: true, life: .7, draw(c, k, dt, t) { const r = f.h * (.85 - .7 * ease(k)); c.globalAlpha = fade(k, .15, .85); pts.forEach(a => { const aa = a + t * 3; spr(c, glowS(C.crim), f.x + Math.cos(aa) * r, f.y + Math.sin(aa) * r * .55, 12 * f.k); }); } });
    sigil(f.x, f.feet, { r: f.h * .6, flat: .3, col: C.crim, n: 5, runes: 20, life: 1.6, spin: 1.4 }); await nap(420); X.glow(f.x, f.y, { color: C.crim, r: f.h * .5, life: .4 });
    /* 結算與晉升之間（約 0.6 秒）：二十道紅光化成血色光柱維持住，不出現空檔 */
    X.glow(f.x, f.y, { color: C.blood, r: f.h * .8, life: 1.1, hold: true }); parts({ x: f.x, y: f.feet, n: 26, spd: [80, 200], ang: [-1.8, -1.35], life: [.6, 1], size: [5, 10], colors: [C.crim, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .25, delay: .5 }); };
  /* 最初20人（已是最終型態，例如勇者之塔第 200 層停在第二型態）：力量再次湧現 */
  CH.resurge = async A => { const f = A.f; await CH.asc(A); sfx('thunder'); quake(); X.rays(f.x, f.head, { r: f.h * 1.1, n: 20, c1: 'rgba(255,60,100,.85)', life: .9 }); dring(f.x, f.y, { r1: f.h, w: 24, life: .6 });
    for (let i = 0; i < 4; i++) later(i * 70, () => hbolt(f.x, f.y, f.x + R(-1, 1) * f.h, f.y + R(-.8, .4) * f.h, { w: 5 * f.k, life: .22 })); say(f.x, f.head - f.h * .25, '最初20人', { size: 48 }); await nap(200); };
  /* 第二型態 永劫不滅：深紅日冕在頭後展開，血光柱與上升光點 */
  CH.eternal2 = async A => { const f = A.f; sfx('buff'); dim(1500); vig(C.blood, .45, 1.4);
    corona(f.x, f.head, { r: f.h * .32, life: 1.4 }); sigil(f.x, f.feet, { r: f.h * .62, flat: .3, col: C.crim, n: 6, life: 1.4, spin: .4 });
    later(200, () => pillar(f.x, f.feet - 10, { w: f.h * .22, color: C.crim, life: .8 }));
    await nap(560); sfx('heal'); ring(f.x, f.y, { r1: f.h * .9, color: C.crim, w: 10, life: .6 }); X.glow(f.x, f.head, { color: '#ff7a9a', r: f.h * .5, life: .6 });
    vfx('healing-field', { color: C.crim, size: 1.2 }, 'c', A.S, 1.4, 0, .9);
    parts({ x: f.x, y: f.feet - 20, n: 44, spd: [60, 150], ang: [-2.1, -1], life: [.8, 1.4], size: [6, 13], colors: [C.crim, '#ffd0dc', C.gold], shape: 'mote', add: true, jx: f.h * .35, g: -50 });
    say(f.x, f.head - f.h * .3, '永劫不滅', { size: 50 }); await nap(220); };
  /* 第二型態 萬物逆轉：世界瞬間反轉，四面八方的鎖鏈纏住對手，對手的強化化作光流被吸走 */
  CH.pact2 = async A => { const f = A.f, t = A.t, ar = $('bArena'); sfx('dark'); dim(1600);
    if (T >= 2 && ar) try { ar.animate([{ filter: 'none' }, { filter: 'invert(1) hue-rotate(180deg)', offset: .2 }, { filter: 'invert(1) hue-rotate(180deg)', offset: .5 }, { filter: 'none' }], { duration: 260 / spd() }); } catch (e) { }
    sfx('crank'); const W = FXE.W, H = FXE.H, srcs = [[f.x + A.d * f.h * .2, f.head], [t.x - A.d * W * .25, -20], [t.x + A.d * W * .2, -20], [t.x + A.d * W * .4, t.y], [t.x - A.d * W * .3, H * .95]];
    srcs.slice(0, T >= 2 ? 5 : 3).forEach(([sx, sy], i) => later(i * 60, () => chain(sx, sy, t.x + R(-.08, .08) * t.h, t.y + R(-.2, .2) * t.h, { sag: R(-50, 50), k: f.k * .9, rim: i % 2 ? C.crim : C.pink, life: 1.2, grow: .3 })));
    await nap(480); sfx('buff'); sigil(t.x, t.y, { r: t.h * .4, col: C.crim, n: 6, life: 1.1, spin: -1.4, eye: true }); flash('#3a0018', .25, .3); try { impactFrame(A.T); } catch (e) { }
    parts({ x: t.x, y: t.y, n: 30, spd: [30, 80], life: [.7, 1], size: [6, 11], colors: [C.gold, '#8fd8ff', '#9dffb8'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3, to: { x: f.x, y: f.y }, pull: 9, delay: .2 });
    say(t.x, t.head - t.h * .2, '萬物逆轉', { size: 46, color: '#ffd0dc', color2: '#8a0a2a' }); await nap(300); };
  /* 第二型態 世界之王：空白王座在背後升起，深淵擴散到整個戰場，霸王色黑雷 */
  CH.domain2 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1800); vig(C.ink, .6, 1.6); throneBack(A.S, f, 1700, 1.7);
    sigil(f.x, f.feet, { r: Math.min(FXE.W * .5, f.h * 1.2), flat: .24, col: C.crim, n: 6, runes: 24, life: 1.6, spin: .3, lw: 3 });
    await nap(420); sfx('thunder'); quake();
    for (let i = 0; i < 5; i++) later(i * 70, () => hbolt(f.x, f.head, i < 2 ? t.x + R(-.1, .1) * t.h : f.x + R(-1.2, 1.2) * f.h, i < 2 ? t.y : f.y + R(-.9, .3) * f.h, { w: 6 * f.k, life: .26 }));
    dring(f.x, f.feet, { r1: FXE.W * .7, w: 30, flat: .35, life: .8 }); flash('#3a0010', .25, .3);
    await nap(380); say(f.x, f.head - f.h * .35, '世界之王', { size: 56 }); await nap(150); };
  /* 第二型態 毀滅之力：黑焰巨刃在對手上方成形、纏著黑雷，一刀劈下 */
  CH.ruin2 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1600); vig(C.ink, .5, 1.5);
    const L = t.h * 1.15, px = t.x - A.d * t.h * .35, py = t.y - t.h * .78; blade(px, py, L, A.d, { life: 1.3 });
    for (let i = 0; i < 4; i++) later(80 + i * 90, () => hbolt(px + R(-.3, .3) * L, py + R(-.5, .1) * L, px + R(-.3, .3) * L, py + R(-.6, 0) * L, { w: 4 * t.k, life: .2 }));
    parts({ x: f.x, y: f.y, n: 20, spd: [40, 120], ang: [-2.4, -.7], life: [.5, .8], size: [8, 14], colors: ['#07000a'], shape: 'tongue', rim: C.crim, jx: f.h * .3, g: -120 });
    await nap(560); sfx('slash'); await nap(170); sfx('explode'); quake(); stop(90); flash('#ffd0dc', .3, .25);
    slash(t.x, t.y, { a: A.d > 0 ? -2.2 : -.9, span: 1.6, r: t.h * .55, w: 30, color: C.crim, life: .35 });
    dring(t.x, t.y, { r1: t.h * .9, w: 26, life: .55 }); cracks(t.x, t.feet, { n: 12, len: t.h * .7, color: '#ff8aa0' });
    for (let i = 0; i < 3; i++) later(i * 60, () => hbolt(t.x, t.y, t.x + R(-1, 1) * t.h * .8, t.y + R(-.6, .5) * t.h, { w: 5 * t.k, life: .22 }));
    parts({ x: t.x, y: t.y + t.h * .1, n: 40, spd: [120, 320], ang: [-2.7, -.4], life: [.5, .9], size: [10, 18], colors: ['#07000a', '#14000e'], shape: 'tongue', rim: C.crim, jx: t.h * .25, g: -150 });
    vfx('energy-burst', { color: C.crim, size: 1.5 }, 'g', A.T, 1); vfx('thunder-strike', { color: C.crim, size: 1.3 }, 'g', A.T, 1);
    say(t.x, t.head - t.h * .55, '毀滅', { size: 60 }); };
  /* 第三型態 千眼天啟：八隻紅眼在伊姆周圍依序睜開，凝視線看穿對手 */
  CH.eyes3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1700); vig('#12001e', .6, 1.6); wingsBack(A.S, f, 1600, 1.05, C.mag, .55);
    eyes(f.x, f.head + f.h * .05, { n: 8, rx: f.h * .62, ry: f.h * .5, size: f.h * .075, life: 1.6, stag: .07, gaze: { x: t.x, y: t.y }, beam: { x: t.x, y: t.y - t.h * .05, at: .62 }, glareAt: .6, closeAt: .82 });
    parts({ x: f.x, y: f.head - f.h * .4, n: 18, spd: [20, 60], ang: [.5, 2.6], life: [1, 1.5], size: [14, 22], colors: ['#14020e', '#1e0418'], shape: 'feather', rim: C.mag, jx: f.h * .6, g: 30 });
    await nap(620); sfx('zap'); flash('#3a0030', .2, .25); sigil(t.x, t.y, { r: t.h * .22, col: C.crim, n: 5, life: .8, spin: 2, eye: true });
    parts({ x: f.x, y: f.feet - 20, n: 34, spd: [60, 140], ang: [-2.1, -1], life: [.8, 1.3], size: [6, 12], colors: [C.crim, C.mag, '#ffd0dc'], shape: 'mote', add: true, jx: f.h * .35, g: -50 });
    vfx('healing-field', { color: C.mag, size: 1.1 }, 'c', A.S, 1.3, 0, .9);
    say(f.x, f.head - f.h * .42, '千眼天啟', { size: 52, color: '#ffd0e8', color2: '#8a0a5a' }); await nap(260); };
  /* 第三型態 終焉契約：對手腳下展開巨大契約陣，天上與陣緣射出鎖鏈，契約連鎖到後排 */
  CH.pact3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1800); vig('#12001e', .55, 1.7);
    sigil(t.x, t.feet, { r: t.h * .75, flat: .3, col: C.pink, n: 6, runes: 24, life: 1.7, spin: .8, lw: 3 }); sigil(t.x, t.feet, { r: t.h * .5, flat: .3, col: C.crim, n: 5, life: 1.6, spin: -1.2 });
    parts({ x: t.x, y: -10, n: 16, spd: [20, 60], ang: [1.2, 1.9], life: [1.1, 1.6], size: [14, 22], colors: ['#14020e'], shape: 'feather', rim: C.mag, jx: t.h * .8, g: 40 });
    await nap(260); sfx('crank'); const n = T >= 2 ? 6 : 4;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, sx = i < 2 ? (i ? f.x + A.d * f.h * .2 : t.x + R(-.3, .3) * t.h) : t.x + Math.cos(a) * t.h * .75, sy = i < 2 ? (i ? f.head : -20) : t.feet + Math.sin(a) * t.h * .22;
      later(i * 55, () => chain(sx, sy, t.x + R(-.08, .08) * t.h, t.y + R(-.15, .2) * t.h, { sag: i < 2 ? 50 : R(-30, 30), k: f.k * .9, rim: i % 2 ? C.crim : C.pink, life: 1.25, grow: .3 })); }
    await nap(460); sfx('buff'); flash('#3a0030', .25, .3); try { impactFrame(A.T); } catch (e) { }
    sigil(t.x, t.y, { r: t.h * .36, col: C.pink, n: 6, life: 1, spin: -1.6, eye: true });
    parts({ x: t.x, y: t.y, n: 24, spd: [30, 80], life: [.7, 1], size: [6, 10], colors: [C.gold, '#8fd8ff'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3, to: { x: f.x, y: f.y }, pull: 9, delay: .15 });
    say(t.x, t.head - t.h * .25, '終焉契約', { size: 48, color: '#ffd0e8', color2: '#7a0a5a' }); await nap(200); };
  /* 第三型態 虛空王座・天翼：遮天雙翼完全展開、王座浮現、羽毛風暴橫掃戰場 */
  CH.domain3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(2000); vig('#0e0018', .65, 1.9);
    throneBack(A.S, f, 1900, 1.6); wingsBack(A.S, f, 1900, 1.55, C.mag, 1);
    sigil(f.x, f.feet, { r: Math.min(FXE.W * .55, f.h * 1.3), flat: .22, col: C.mag, n: 6, runes: 28, life: 1.8, spin: .3, lw: 3 }); sigil(f.x, f.feet, { r: f.h * .7, flat: .22, col: C.crim, n: 5, life: 1.7, spin: -.6 });
    await nap(380); sfx('whoosh'); X.glow(f.x, f.head, { color: C.mag, r: f.h * .8, life: 1, hold: true });
    parts({ x: f.x, y: f.head, n: 70, spd: [220, 560], ang: [-Math.PI, 0], life: [.9, 1.5], size: [14, 26], colors: ['#14020e', '#1e0418', '#2a0624'], shape: 'feather', rim: C.mag, drag: 1.4, g: 90, jx: f.h * .35, jy: f.h * .2 });
    await nap(380); sfx('thunder'); quake(); flash('#2a0040', .25, .3); dring(f.x, f.feet, { r1: FXE.W * .75, w: 30, flat: .35, life: .8, color: C.mag });
    for (let i = 0; i < 3; i++) later(i * 80, () => hbolt(f.x, f.head, t.x + R(-.15, .15) * t.h, t.y + R(-.3, .2) * t.h, { w: 6 * f.k, color: C.mag, life: .25 }));
    say(f.x, f.head - f.h * .45, '虛空王座・天翼', { size: 50, color: '#f0d8ff', color2: '#6a0a8a' }); await nap(260); };
  /* 第三型態 終焉之翼：雙翼揚起、羽毛收攏，兩道黑焰羽刃交叉橫掃 */
  CH.wing3 = async A => { const f = A.f, t = A.t; sfx('dark'); dim(1800); vig('#0e0018', .55, 1.7); wingsBack(A.S, f, 1500, 1.4, C.pink, .9);
    parts({ x: f.x, y: f.y, n: 30, spd: [10, 40], life: [.4, .6], size: [12, 20], colors: ['#14020e', '#1e0418'], shape: 'feather', rim: C.pink, jx: f.h * .9, jy: f.h * .6, to: { x: f.x, y: f.head }, pull: 7 });
    X.glow(f.x, f.head, { color: C.mag, r: f.h * .45, life: .6, hold: true });
    await nap(430); sfx('slash'); const r = t.h * .72;
    sweep(t.x + A.d * r * .2, t.y - r * .1, { r, a0: A.d > 0 ? -2.6 : -.55, a1: A.d > 0 ? .5 : -3.65, w: t.h * .17, life: .55, col: C.pink });
    await nap(170); sfx('slash');
    sweep(t.x - A.d * r * .2, t.y + r * .05, { r: r * .9, a0: A.d > 0 ? 2.5 : .65, a1: A.d > 0 ? -.6 : 3.8, w: t.h * .15, life: .5, col: C.mag });
    await nap(150); sfx('explode'); quake(); stop(90); flash('#ffd0f0', .28, .25);
    dring(t.x, t.y, { r1: t.h * .95, w: 26, life: .55, color: C.pink }); X.glow(t.x, t.y, { color: C.mag, r: t.h * .7, life: .5 });
    parts({ x: t.x, y: t.y, n: 46, spd: [200, 520], life: [.5, .9], size: [12, 22], colors: ['#14020e', '#2a0624'], shape: 'feather', rim: C.pink, drag: 2, g: 80 });
    parts({ x: t.x, y: t.y, n: 26, spd: [260, 600], life: [.25, .5], size: [1.5, 3], colors: [C.pink, '#ffffff', C.mag], shape: 'streak', add: true, drag: 3 });
    say(t.x, t.head - t.h * .55, '終焉之翼', { size: 54, color: '#ffe0f4', color2: '#8a0a6a' }); };
  /* 第三型態 天罰：天空裂開、八眼環繞，對手的強化碎裂，審判雷柱直劈而下 */
  CH.judge = async A => { const f = A.f, t = A.t, ry = Math.max(40, t.head - t.h * .55); sfx('thunder'); dim(2000); vig(C.ink, .7, 1.9);
    rift(t.x, ry, { w: t.h * .16, h: t.h * .55, life: 1.6, col: C.pink });
    eyes(t.x, ry, { n: 8, rx: t.h * .55, ry: t.h * .28, a0: -Math.PI + .25, a1: -.25, size: t.h * .06, life: 1.5, stag: .05, gaze: { x: t.x, y: t.y }, glareAt: .75, closeAt: .85 });
    await nap(420); sfx('pop'); parts({ x: t.x, y: t.y, n: 34, spd: [160, 420], life: [.4, .8], size: [5, 10], colors: [C.gold, '#ffffff', '#8fd8ff'], shape: 'shard', g: 380 }); ring(t.x, t.y, { r1: t.h * .6, color: C.gold, w: 6, life: .4 });
    say(t.x + A.d * t.h * .35, t.y - t.h * .05, '強化粉碎', { size: 34, color: '#fff4c8', color2: '#a07a1a', life: .8 });
    await nap(380); sfx('explode'); quake(); later(160, quake); stop(110); flash('#ffe0ea', .35, .3);
    pillar(t.x, t.feet, { w: t.h * .26, color: C.crim, life: .8 }); hbolt(t.x, ry, t.x, t.feet, { w: 14 * t.k, color: '#ff6a8a', amp: 18, life: .4 });
    for (let i = 0; i < 4; i++) later(i * 50, () => hbolt(t.x + R(-.4, .4) * t.h, ry, t.x + R(-.15, .15) * t.h, t.y + R(-.2, .3) * t.h, { w: 6 * t.k, life: .25 }));
    dring(t.x, t.feet, { r1: t.h * 1.2, w: 30, flat: .35, life: .7 }); cracks(t.x, t.feet, { n: 14, len: t.h * .8, color: '#ffb0c0' });
    vfx('thunder-strike', { color: C.crim, size: 1.7 }, 'g', A.T, 1.1);
    say(t.x, t.head - t.h * .4, '天罰', { size: 76, color: '#ffe0ea', color2: '#b0002a' }); await nap(120); };

  /* 減少動態：只留光暈與文字 */
  const NAME = { und0: '不死', und1: '不死之身', pact1: '惡魔契約', void1: '深淵', flame1: '凶兆', asc: '', resurge: '最初20人', eternal2: '永劫不滅', pact2: '萬物逆轉', domain2: '世界之王', ruin2: '毀滅', eyes3: '千眼天啟', pact3: '終焉契約', domain3: '虛空王座・天翼', wing3: '終焉之翼', judge: '天罰' };
  const SELF = { und0: 1, und1: 1, asc: 1, resurge: 1, eternal2: 1, domain2: 1, eyes3: 1, domain3: 1 };
  async function calm(key, A) { const p = SELF[key] ? A.f : A.t; X.glow(p.x, p.y, { color: key.endsWith('3') || key === 'judge' ? C.mag : C.crim, r: p.h * .5, life: .6 }); if (NAME[key]) say(p.x, p.head - p.h * .2, NAME[key], { size: 44, life: .7 }); await nap(380); }

  /* ---------- 招式辨識 ---------- */
  const BYNAME = { '不死之身': 'und', '黑轉支配': 'pact1', '虛空威壓': 'void1', '黑焰・凶兆': 'flame1', '最初20人': 'asc', '永劫不滅': 'eternal2', '黑轉支配・萬物逆轉': 'pact2', '世界之王': 'domain2', '毀滅之力': 'ruin2',
    '千眼天啟': 'eyes3', '黑轉支配・終焉契約': 'pact3', '虛空王座・天翼': 'domain3', '終焉之翼': 'wing3' };
  function keyOf(actor, skill) {
    if (!actor || !skill || (typeof STRUGGLE !== 'undefined' && skill === STRUGGLE)) return null;
    const isImu = actor.id === 'imu' || !!actor.__imu || (skill.copiedFrom && skill.copiedFrom.id === 'imu'); if (!isImu) return null;
    let k = BYNAME[skill.name]; if (!k) return null; const I = actor.__imu;
    if (k === 'und') return I && I.form >= 1 ? 'und1' : 'und0';
    if (k === 'asc') { if (!I) return 'resurge'; const max = window.IMU165 && IMU165.maxFormOf ? IMU165.maxFormOf(actor) : 3; if (I.form < max) return 'asc'; return I.form >= 3 ? 'judge' : 'resurge'; }
    return k;
  }
  function mk(side) { const S = side === 'P' ? 'L' : 'R', Tt = S === 'L' ? 'R' : 'L'; return { S, T: Tt, f: geo(S), t: geo(Tt), d: S === 'L' ? 1 : -1 }; }
  /* 伊姆攻擊招的命中爆發已在編排裡畫好：結算後 battle.js 的 triggerImpact 只保留受擊動作與音效，不再疊一般角色的 hitFX（避免疊爆、低階手機掉幀） */
  let own = null; const ATK = { flame1: 1, ruin2: 1, wing3: 1 };
  if (typeof triggerImpact === 'function') { const _ti = triggerImpact; triggerImpact = function (side, theme, big) {
    if (own && own.side === side && performance.now() < own.until) { own = null; try { sfx(big ? 'heavy' : 'hit'); const w = $('bF' + side); w.classList.remove('hit'); void w.offsetWidth; w.classList.add('hit'); setTimeout(() => w.classList.remove('hit'), 520); } catch (e) { } return; }
    return _ti.apply(this, arguments); }; }
  async function run(key, side) { T = tierNow(); gen++; cancelOld(); FXE.ensure(); const A = mk(side); own = ATK[key] && T > 0 ? { side: A.T, until: performance.now() + 2500 / spd() } : null; if (T === 0) return calm(key, A); return CH[key](A); }

  /* ---------- 晉升演出（覆寫 fx_v165.js 的 imuFormFx；ext_v165 在「最初20人」結算後呼叫，swap() 換立繪） ---------- */
  const _oldFormFx = window.imuFormFx; /* window.__NO_FX170＝量測用：改回 v169 的演出 */
  window.imuFormFx = async function (S, actor, form, swap) {
    if (window.__NO_FX170 && _oldFormFx) return _oldFormFx.apply(this, arguments);
    const el = $('bF' + S), F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[form] || {}; let done = false; const doSwap = () => { if (!done) { done = true; swap(); } };
    try {
      T = tierNow(); gen++; FXE.ensure(); const g = geo(S), d = S === 'L' ? 1 : -1, tg = geo(S === 'L' ? 'R' : 'L');
      const title = (g2) => { say(g2.x, g2.head - g2.h * .5, F.label || '型態', { size: 34, color: '#ffe0e8', color2: '#8a0a2a', life: 1.2 }); say(g2.x, g2.head - g2.h * .3, F.name || '', { size: form === 3 ? 58 : 52, color: '#ffffff', color2: form === 3 ? '#8a1aaa' : '#c8003a', life: 1.2 }); };
      if (T === 0) { doSwap(); const g2 = geo(S); X.glow(g2.x, g2.y, { color: form === 3 ? C.mag : C.crim, r: g2.h * .6, life: .7 }); title(g2); await nap(700); return; }
      if (el) el.classList.add('morph-out'); sfx('thunder');
      if (form === 1) { /* 第一型態：黑轉之繭收攏 → 破殼 → 紅眼 */
        dim(1600); vig(C.blood, .55, 1.5);
        parts({ x: g.x, y: g.y, n: 46, spd: [10, 40], life: [.6, .9], size: [16, 30], colors: ['#14000c', '#22001a'], shape: 'smoke', jx: g.h * .7, jy: g.h * .6, to: { x: g.x, y: g.y }, pull: 6 });
        for (let i = 0; i < 4; i++) later(i * 120, () => { hbolt(g.x + R(-.6, .6) * g.h, -20, g.x + R(-.1, .1) * g.h, g.head + R(0, .3) * g.h, { w: R(5, 8) * g.k, life: .26 }); if (i % 2 === 0) sfx('zap'); });
        await nap(560); sfx('explode'); flash('#ffe0e8', .32, .3); quake(); doSwap(); const g2 = geo(S);
        parts({ x: g2.x, y: g2.y, n: 40, spd: [220, 560], life: [.4, .8], size: [6, 12], colors: ['#2a0010', '#14000a', C.crim], shape: 'shard', g: 320 });
        ring(g2.x, g2.y, { r1: g2.h * .9, color: C.crim, w: 10, life: .6 }); dring(g2.x, g2.y, { r1: g2.h * 1.1, w: 26, life: .7 });
        eyes(g2.x, g2.head, { n: 2, rx: g2.h * .06, ry: 1, a0: -Math.PI, a1: 0, size: g2.h * .04, life: .9, stag: 0 }); title(g2); await nap(680);
      } else if (form === 2) { /* 第二型態：空白王座升起 → 霸王色雷暴 → 冠冕光芒 */
        dim(2000); vig(C.ink, .65, 1.9); throneBack(S, g, 2000, 1.75);
        sigil(g.x, g.feet, { r: g.h * .9, flat: .26, col: C.crim, n: 6, runes: 24, life: 1.8, spin: .5, lw: 3 });
        for (let i = 0; i < 6; i++) later(i * 100, () => { hbolt(g.x, g.y - g.h * .1, g.x + R(-1.4, 1.4) * g.h, g.y + R(-1, .4) * g.h, { w: R(5, 9) * g.k, life: .26 }); if (i % 2 === 0) { sfx('zap'); flash('#ffd0dc', .12, .14); } });
        await nap(660); sfx('thunder'); flash('#ffd0e0', .35, .32); quake(); stop(100); doSwap(); const g2 = geo(S);
        X.rays(g2.x, g2.head, { r: g2.h * 1.2, n: 22, c1: 'rgba(255,60,100,.9)', life: 1, spin: .6 }); dring(g2.x, g2.y, { r1: Math.max(g2.h * 1.3, FXE.W * .5), w: 32, life: .8 });
        ring(g2.x, g2.y, { r1: g2.h, color: C.crim, w: 12, life: .7 }); vfx('energy-burst', { color: C.crim, size: 1.6 }, 'g', S, 1);
        for (let i = 0; i < 3; i++) later(140 + i * 120, () => hbolt(g2.x, g2.y - g2.h * .2, tg.x + R(-.2, .2) * tg.h, tg.y + R(-.3, .3) * tg.h, { w: 5 * g2.k, life: .22 }));
        title(g2); await nap(780);
      } else { /* 第三型態：天空裂開 → 八眼睜開 → 雙翼展開、羽毛爆散 */
        dim(2600); vig('#0e0018', .7, 2.4); const ry = Math.max(40, g.head - g.h * .45);
        rift(g.x, ry, { w: g.h * .14, h: g.h * .6, life: 1.3, col: C.mag });
        eyes(g.x, ry + g.h * .1, { n: 8, rx: g.h * .7, ry: g.h * .34, a0: -Math.PI + .2, a1: -.2, size: g.h * .07, life: 1.3, stag: .06, gaze: { x: g.x, y: g.y }, beam: { x: g.x, y: g.y, at: .7 }, glareAt: .7, closeAt: .85 });
        sigil(g.x, g.feet, { r: g.h * 1, flat: .24, col: C.mag, n: 6, runes: 28, life: 2.2, spin: .4, lw: 3 });
        for (let i = 0; i < 4; i++) later(200 + i * 120, () => hbolt(g.x + R(-.5, .5) * g.h, ry, g.x + R(-.1, .1) * g.h, g.y - g.h * .1, { w: R(5, 8) * g.k, color: i % 2 ? C.mag : C.crim, life: .24 }));
        await nap(900); sfx('thunder'); flash('#f0d8ff', .35, .34); quake(); later(200, quake); stop(110); doSwap(); const g2 = geo(S);
        wingsBack(S, g2, 1500, 1.7, C.mag, 1);
        ring(g2.x, g2.y, { r1: Math.max(g2.h * 1.2, FXE.W * .55), color: C.mag, w: 14, life: .9 }); ring(g2.x, g2.y, { r1: g2.h * .9, color: C.pink, w: 8, life: .7 });
        X.glow(g2.x, g2.head, { color: C.crim, r: g2.h * .7, life: 1 });
        parts({ x: g2.x, y: g2.head, n: 80, spd: [220, 600], life: [1, 1.6], size: [14, 26], colors: ['#14020e', '#1e0418', '#2a0624'], shape: 'feather', rim: C.mag, drag: 1.3, g: 70 });
        parts({ x: g2.x, y: g2.y, n: 30, spd: [200, 500], life: [.3, .6], size: [1.5, 3], colors: [C.pink, C.lav, '#ffffff'], shape: 'streak', add: true, drag: 3 }); title(g2); await nap(880);
      }
      if (el) { el.classList.remove('morph-out'); el.classList.add('morph-in'); setTimeout(() => el.classList.remove('morph-in'), 800); }
    } catch (e) { console.warn('v170 晉升演出', e); }
    finally { if (el) el.classList.remove('morph-out'); doSwap(); }
  };

  /* ---------- 事件特效 ---------- */
  function fsFx(imu, atk) { if (!onBattle()) return; T = tierNow(); const b = battle, S = imu === b.enemy ? 'R' : imu === b.player ? 'L' : null; if (!S) return; const g = geo(S), o = geo(S === 'L' ? 'R' : 'L');
    if (T === 0) { X.glow(g.x, g.head, { color: C.crim, r: g.h * .3, life: .4 }); return; }
    eyes(g.x, g.head + g.h * .05, { n: 8, rx: g.h * .58, ry: g.h * .44, size: g.h * .07, life: .8, stag: .02, gaze: { x: o.x, y: o.y }, beam: { x: o.x, y: o.y, at: .12 }, glareAt: .1, closeAt: .7 });
    const img = $('bImg' + S); try { img.animate([{ opacity: 1 }, { opacity: .35, offset: .3 }, { opacity: 1 }], { duration: 420 / spd() }); } catch (e) { }
    parts({ x: g.x, y: g.y, n: 16, spd: [200, 420], ang: S === 'R' ? [-.3, .3] : [Math.PI - .3, Math.PI + .3], life: [.2, .4], size: [1.5, 3], colors: [C.crim, C.pink], shape: 'streak', add: true, jy: g.h * .3 });
    say(g.x, g.head - g.h * .25, '看穿', { size: 46, color: '#ffd0dc', color2: '#a0002a', life: .7 }); sfx('zap'); }
  function voidEvFx(imu) { if (!onBattle() || tierNow() === 0) return; T = tierNow(); const b = battle, S = imu === b.enemy ? 'R' : 'L', g = geo(S); dring(g.x, g.y, { r1: g.h * .6, w: 18, life: .45, color: C.mag }); rift(g.x - (S === 'R' ? -1 : 1) * g.h * .25, g.y, { w: g.h * .06, h: g.h * .4, life: .5 }); }
  function shockFx(owner, foe) { if (!onBattle()) return; T = tierNow(); const b = battle, S = owner === b.enemy ? 'R' : owner === b.player ? 'L' : null, Tt = foe === b.enemy ? 'R' : foe === b.player ? 'L' : null; if (!S || !Tt) return;
    const g = geo(S), t = geo(Tt), f3 = owner.__imu && owner.__imu.form >= 3, col = f3 ? C.mag : C.crim; if (T === 0) { X.glow(t.x, t.y, { color: col, r: t.h * .4, life: .4 }); return; }
    for (let i = 0; i < (T >= 2 ? 3 : 2); i++) later(i * 70, () => hbolt(g.x, g.head, t.x + R(-.15, .15) * t.h, t.y + R(-.3, .2) * t.h, { w: 6 * g.k, color: col, life: .26 }));
    later(120, () => { dring(t.x, t.y, { r1: t.h * .7, w: 20, life: .45, color: col }); quake(); }); say(t.x, t.head - t.h * .2, '霸王色', { size: 40, color: '#ffd0dc', color2: f3 ? '#6a0a8a' : '#a0002a', life: .7 }); }
  function stealFx(imu, foe) { if (!onBattle() || tierNow() === 0) return; T = tierNow(); const b = battle, S = imu === b.enemy ? 'R' : imu === b.player ? 'L' : null, Tt = foe === b.enemy ? 'R' : foe === b.player ? 'L' : null; if (!S || !Tt) return; const g = geo(S), t = geo(Tt);
    parts({ x: t.x, y: t.y, n: 22, spd: [30, 90], life: [.6, .9], size: [6, 11], colors: [C.crim, C.pink, '#ffd0dc'], shape: 'mote', add: true, jx: t.h * .2, jy: t.h * .3, to: { x: g.x, y: g.y }, pull: 10 }); }
  function pactTickFx(f) { if (!onBattle() || tierNow() === 0) return; T = tierNow(); const b = battle, S = f === b.enemy ? 'R' : f === b.player ? 'L' : null; if (!S) return; const g = geo(S); sigil(g.x, g.y, { r: g.h * .26, col: C.pink, n: 5, life: .6, spin: 2, eye: true }); }
  function benchFx(kind, from, list) { if (!onBattle() || !list.length) return; T = tierNow(); const b = battle, S = from === b.enemy ? 'R' : from === b.player ? 'L' : null; if (!S) return; const g = geo(S);
    list.forEach((o, j) => { const p = iconPt(o.i); if (!p) return;
      if (T >= 1) { if (kind === 'chain') later(j * 70, () => chain(g.x, g.y, p.x, p.y, { sag: 40, k: .7, rim: C.pink, life: .75, grow: .26 }));
        else later(j * 60, () => parts({ x: g.x, y: g.y, n: 8, spd: [200, 380], life: [.45, .6], size: [12, 18], colors: ['#14020e', '#2a0624'], shape: 'feather', rim: C.pink, to: { x: p.x, y: p.y }, pull: 22 })); }
      later((T >= 1 ? 280 : 0) + j * 70, () => { pulseIcon(o.i, kind); X.glow(p.x, p.y, { color: kind === 'chain' ? C.pink : C.mag, r: 46, life: .45 }); }); }); }

  /* ---------- 場上氛圍（狀態持續中；樣式在 css/fx_imu_v170.css） ---------- */
  const EYES = '<svg viewBox="0 0 40 18"><path d="M1 9Q20-6 39 9Q20 24 1 9Z" fill="#2a0008"/><circle cx="20" cy="9" r="6" fill="#ff1a3a"/><ellipse cx="20" cy="9" rx="1.2" ry="5" fill="#0a0004"/></svg>';
  const MARK = '<svg viewBox="-50 -50 100 100"><g fill="none" stroke-width="1.6"><circle r="46"/><circle r="38" stroke-dasharray="4 3"/><path d="M0-36L21 29L-34-11L34-11L-21 29Z"/></g></svg>';
  let ambT = 0;
  function ambEl(cls, parent, before) { let d = parent.querySelector(':scope > .' + cls); if (!d) { d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); if (before) parent.insertBefore(d, before); else parent.appendChild(d); } return d; }
  function ambClear() { document.querySelectorAll('.imu-amb,.imu-eyes,.imu-mark,.imu-halo,.imu-bk').forEach(e => e.remove()); }
  function amb() {
    ambT = 0; const b = typeof battle !== 'undefined' && battle, scr = $('battleScreen'), A = $('bArena'); if (!scr || !A) return;
    if (!b || b.gameOver || scr.classList.contains('hidden')) { ambClear(); return; }
    const L = b.player, Rr = b.enemy, imu = Rr && Rr.__imu ? Rr : L && L.__imu ? L : null, S = imu === Rr ? 'R' : 'L', tier = tierNow();
    scr.classList.toggle('imu-lo', tier <= 1);
    /* 領域 */
    const D = b.__imuDom && b.__imuDom.t > 0 ? b.__imuDom : null, own = D && (D.owner || (D.side === 'E' ? Rr : L)), onS = own && own.hp > 0 && (own === Rr ? 'R' : own === L ? 'L' : null);
    const am = ambEl('imu-amb', scr, scr.querySelector('.b-arena')); const f3 = !!(D && /天翼/.test(D.name || ''));
    if (D && own && own.hp > 0) { if (!am.firstChild) am.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i>'; am.classList.add('on'); am.classList.toggle('f3', f3); am.style.setProperty('--ox', (own === Rr ? 74 : 26) + '%'); } else am.classList.remove('on', 'f3');
    void onS;
    if (!imu) { ['imu-eyes', 'imu-halo'].forEach(c => { const e = A.querySelector('.' + c); if (e) e.remove(); }); }
    else { const g = geo(S), st = imu.status || {};
      /* 看穿：頭上八隻眼 */
      const F = st.__foresee && st.__foresee.t > 0 ? st.__foresee : null; let ey = A.querySelector(':scope > .imu-eyes');
      if (F && imu.hp > 0) { if (!ey) { ey = ambEl('imu-eyes', A); ey.innerHTML = Array.from({ length: 8 }, (_, i) => { const a = -2.7 + 2.26 * i / 7; return `<b style="left:${f1(50 + Math.cos(a) * 44)}%;top:${f1(60 + Math.sin(a) * 52)}%;animation-delay:${(i * .37).toFixed(2)}s">${EYES}</b>`; }).join(''); }
        const w = g.h * .95; ey.style.cssText = `left:${f1(g.x - w / 2)}px;top:${f1(g.head - w * .42)}px;width:${f1(w)}px;height:${f1(w * .5)}px`; ey.classList.toggle('used', F.r === (b.round || 0)); }
      else if (ey) ey.remove();
      /* 不滅光環（不死之身、永劫不滅、千眼天啟） */
      const und = st.__imuUnd && st.__imuUnd.t > 0, et = st.__imuEt && st.__imuEt.t > 0; let ha = A.querySelector(':scope > .imu-halo');
      if ((und || et) && imu.hp > 0) { if (!ha) ha = ambEl('imu-halo', A, A.querySelector('.fighter')); const w = g.h * .62; ha.style.cssText = `left:${f1(g.x - w / 2)}px;top:${f1(g.head - w / 2)}px;width:${f1(w)}px;height:${f1(w)}px`; ha.classList.toggle('f3', imu.__imu.form >= 3); }
      else if (ha) ha.remove(); }
    /* 對手腳下：契約紋、存在抹除 */
    ['L', 'R'].forEach(s => { const f = s === 'L' ? L : Rr, st = f && f.status; let mk2 = A.querySelector(`:scope > .imu-mark.${s}`); const pact = st && st.__pact && st.__pact.t > 0, er = st && st.__erase && st.__erase.t > 0;
      if (f && f.hp > 0 && (pact || er)) { if (!mk2) { mk2 = document.createElement('div'); mk2.className = 'imu-mark ' + s; mk2.setAttribute('aria-hidden', 'true'); mk2.innerHTML = MARK; A.insertBefore(mk2, A.querySelector('.fighter')); }
        const g = geo(s), w = g.h * .78; mk2.style.cssText = `left:${f1(g.x - w / 2)}px;top:${f1(g.feet - w / 2)}px;width:${f1(w)}px;height:${f1(w)}px`;
        mk2.classList.toggle('pact', !!pact); mk2.classList.toggle('full', !!(pact && st.__pact.full)); mk2.classList.toggle('erase', !!er); }
      else if (mk2) mk2.remove(); });
  }
  const ambSoon = () => { if (!ambT) ambT = requestAnimationFrame(amb); };

  /* ---------- 掛鉤 ---------- */
  function install() {
    const cur = window.playChoreo; if (typeof cur !== 'function' || cur.__imu170) return;
    const w = async function (side, actor, idx, skill) { const key = window.__NO_FX170 ? null : keyOf(actor, skill); if (!key) return cur.apply(this, arguments); try { await run(key, side); } catch (e) { console.warn('v170 伊姆特效', e); } };
    w.__imu170 = true; w.__fx3 = cur.__fx3; w.__vfx = cur.__vfx; window.playChoreo = w; try { playChoreo = w; } catch (e) { }
  }
  window.addEventListener('load', () => setTimeout(install, 120));
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { install(); gen++; cancelOld(); ambClear(); const r = _sb.apply(this, arguments); ambSoon(); return r; }; window.startBattle = startBattle; }
  if (typeof renderHUD === 'function') { const _rh = renderHUD; renderHUD = function () { const r = _rh.apply(this, arguments); ambSoon(); return r; }; }
  if (typeof finishBattle === 'function') { const _fb = finishBattle; finishBattle = function () { const r = _fb.apply(this, arguments); setTimeout(ambClear, 0); return r; }; }
  window.addEventListener('resize', ambSoon);
  /* 看穿／深淵迴避：記下 ext_v169 給的看穿目標，閃避發生時（battle.js 呼叫 onEvaded）放特效 */
  let fsT = null;
  const hookImu = () => { const I = window.IMU165; if (!I || I.__fx170) return; I.__fx170 = true; const _pre = I.preAct, _post = I.postAct;
    I.preAct = function () { const o = _pre.apply(this, arguments); fsT = o && o.fsT || null; return o; };
    I.postAct = function () { try { return _post.apply(this, arguments); } finally { fsT = null; } }; };
  hookImu();
  { const _oe = window.onEvaded; window.onEvaded = function (actor, target) { let r; try { if (_oe) r = _oe.apply(this, arguments); } finally { try { if (target && target === fsT) fsFx(target, actor); else if (target && target.__imu) voidEvFx(target); } catch (e) { } } return r; }; }
  /* 契約連鎖（施放時）、翅膀掃擊：後排頭像 */
  if (typeof applySkillEffects === 'function') { const _ase = applySkillEffects; applySkillEffects = function (actor, target, skill, result) {
    const ef = (skill && skill.effect) || {}, want = (ef.splash && result && result.damage > 0) || (ef.imuPact && ef.imuPact.chain), list = want && typeof document !== 'undefined' ? benchOf(target) : [];
    const r = _ase.apply(this, arguments);
    try { if (list.length) setTimeout(() => benchFx(ef.splash ? 'wing' : 'chain', target, list), 60); } catch (e) { } return r; }; }
  /* 回合結束：霸王色震懾、契約扣血、契約連鎖、最初20人奪血（以 ext_v165 寫進戰報的訊息判斷是哪一種，避免把其他扣血誤認） */
  let ev = null;
  if (typeof log === 'function') { const _lg = log; log = function (t) { if (ev && typeof t === 'string') { if (t.includes('霸王色震懾！')) ev.shock = 1; else if (/(完全支配|惡魔契約)：.+失去/.test(t)) ev.pact = 1; else if (t.includes('最初20人奪走')) ev.steal = 1; } return _lg.apply(this, arguments); }; }
  if (typeof endTurnStatus === 'function') { const _ets = endTurnStatus; endTurnStatus = function (c) {
    const b = typeof battle !== 'undefined' && battle; if (!b || !c || !c.status || typeof document === 'undefined') return _ets.apply(this, arguments);
    const foe = c === b.enemy ? b.player : c === b.player ? b.enemy : null, P = c.status.__pact, bl = P && P.t > 0 && P.chain > 0 ? benchOf(c) : [], bh = bl.map(o => o.x.hp);
    const prev = ev; ev = {}; let r, e;
    try { r = _ets.apply(this, arguments); } finally { e = ev; ev = prev; }
    try { if (e.shock && foe) shockFx(c, foe); if (e.pact) pactTickFx(c); if (e.steal && foe) stealFx(c, foe); const hit = bl.filter((o, i) => o.x.hp < bh[i]); if (hit.length) benchFx('chain', c, hit); } catch (x) { }
    return r; }; }
  window.IMU_FX170 = { keyOf, run, CH, amb, tier: tierNow, live: () => [...mine].filter(e => e.t < e.life).length, parts: () => liveP };
})();

/* ==== 原 js/fx_v196.js ==== */
/* v196 技能特效（使用者 11/10 12:46 提供 8 張素材，「請根據角色站位與發動方向造型調整」）
   圖1 凱多第 5 招「升龍·火焰八卦」＝火龍；圖2 凱多第 2 招「酒龍八卦」＝紅紫氣焰（必須在凱多立繪後方）；
   圖3 女帝「虜之箭」＝大愛心先出現、愛心箭隨後射出；圖4 尼卡魯夫「解放之鼓」＝金色鼓聲光環（必須在立繪後方）；
   圖5 四皇黑鬍子「引發震動」＝空間碎裂；圖6 佩羅娜「鬼魂網域」＝幽靈群；圖7 佩羅娜第 5 招「特大幽靈」；圖8 基德「電磁砲」。
   素材：assets/fx/v196/*.webp（原圖是棋盤格假透明的 JPG，已去背成真正的透明圖，寬 840～1000px，iPhone 畫布安全）。
   做法與 viona_v187.js 相同：包住 playChoreo（最外層），用戰場畫布 FXE 畫素材；「立繪後方」的兩張用 DOM 插在角色圖之前。
   方向：素材有固定朝向（火龍、幽靈群、電磁砲朝左；愛心箭、特大幽靈朝右），依施放者在左或右自動鏡像；
        位置與大小全部用雙方立繪的實際範圍（pt：中線、頭頂、腳底、身高）與兩人距離計算，不寫死像素。
   黑鬍子「闇穴道」複製到這些招式時（skill.copiedFrom）也會用同一套特效。
   載入順序：viona_v187.js、battle_v195.js 之後。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || typeof playChoreo !== 'function') return;
  const V = 203, $ = id => document.getElementById(id);
  /* 招式 → 素材 */
  const MAP = { kaido: { '升龍·火焰八卦': 'dragon', '酒龍八卦': 'burst' }, hancock: { '虜之箭': 'heart' }, luffy_nika: { '解放之鼓': 'drum' }, blackbeard: { '引發震動': 'quake' }, perona: { '鬼魂網域': 'ghosts', '特大幽靈': 'ghost' }, kid: { '電磁砲': 'rail' },
    /* v203 使用者 11/12 20:49 提供 13 張素材 */
    luffy0: { '橡膠手槍': 'luffy_pistol', '二檔': 'luffy_gear2' }, luffy: { '橡膠火箭砲': 'luffy_rocket' }, kizaru: { '八尺瓊勾玉': 'kizaru_jewel', '天叢雲劍': 'kizaru_sword' },
    ace: { '火拳': 'ace_fist', '火槍': 'ace_gun' }, burgess: { '冠軍・巨岩粉碎': 'burgess_rock' }, enel: { '放電': 'enel_discharge', '電光': 'enel_flash' },
    rocks: { '蝕': 'rocks_eclipse', '殺': 'rocks_kill', '戴維的秘密': 'rocks_secret' },
    crocodile: { '沙嵐（沙塵暴）': 'croc_storm', '沙漠寶刀': 'croc_sabre' }, aokiji: { '冰河時期': 'aokiji_age', '暴雉嘴': 'aokiji_pheasant', '冰刀': 'aokiji_blade' },
    kuma: { '肉球砲': 'kuma_paw', '痛苦泡泡': 'kuma_bubble', '毀滅光炮': 'kuma_implode' }, mihawk_w: { '斬擊': 'mihawk_slash', '劍氣狀態': 'mihawk_aura', '洞察弱點': 'mihawk_eye' },
    mihawk: { '普攻': 'mihawk_slash', '劍氣狀態': 'mihawk_aura', '洞察弱點': 'mihawk_eye' } };
  MAP.luffy['解放的鼓動'] = 'luffy_drum';
  /* 素材上的定位點（佔圖寬、圖高的比例） */
  const AN = { dragon: { head: [.106, .592] }, burst: { base: [.491, .873] }, heart: { c: [.207, .557], tip: .979 }, drum: { c: [.525, .492] }, quake: { c: [.489, .514] }, ghosts: { c: [.502, .518] }, ghost: { c: [.569, .502] }, rail: { ring: [.923, .515], hit: [.148, .521] },
    luffy_pistol: { fist: [.8, .52] }, luffy_rocket: { fist: [.84, .5] }, kizaru_jewel: { o: [.19, .4] }, kizaru_sword: { o: [.27, .47], tip: [.986, .676] }, ace_fist: { fist: [.88, .55] }, ace_gun: { head: [.96, .57] },
    burgess_rock: { head: [.84, .6] }, enel_discharge: { o: [.12, .53], end: [.98, .52] }, enel_flash: { base: [.5, .96] }, rocks_eclipse: { head: [.92, .55] }, rocks_kill: { o: [.02, .34], hit: [.86, .6] }, rocks_secret: { c: [.5, .52] },
    croc_storm: { base: [.5, .93] }, croc_sabre: { c: [.72, .5] }, luffy_drum: { base: [.5, .97] }, aokiji_age: { base: [.5, .92] }, aokiji_pheasant: { c: [.5, .5] }, aokiji_blade: { c: [.55, .52] },
    kuma_paw: { paw: [.73, .5] }, kuma_bubble: { c: [.5, .55] }, mihawk_slash: { c: [.5, .6] }, mihawk_aura: { base: [.5, .97] }, mihawk_eye: { c: [.5, .5] } };
  const IMG = {};
  const get = k => { if (!IMG[k]) { const i = new Image(); i.decoding = 'async'; i.src = `assets/fx/v196/${k}.webp?v=${V}`; IMG[k] = i; } return IMG[k]; };
  const ready = i => i && i.complete && i.naturalWidth > 0;
  /* 等素材載入（最多 0.6 秒；沒載到就退回原本的動畫） */
  const need = k => new Promise(res => { const i = get(k); if (ready(i)) return res(true); let done = false; const ok = v => { if (!done) { done = true; res(v); } };
    i.addEventListener('load', () => ok(true), { once: true }); i.addEventListener('error', () => ok(false), { once: true }); setTimeout(() => ok(ready(i)), 600); });
  const PI = Math.PI, TAU = PI * 2, lerp = (a, b, q) => a + (b - a) * q, cl = q => Math.max(0, Math.min(1, q));
  const eOut = q => 1 - Math.pow(1 - cl(q), 3), eIn = q => Math.pow(cl(q), 2.2), eIO = q => { q = cl(q); return q * q * (3 - 2 * q); };
  const back3 = q => { q = cl(q); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2); }; /* 略為彈過頭再回來 */
  const X = () => FXE.P, sl = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(r => setTimeout(r, ms)));
  const wait = ms => sl(ms / (window.BSPEED || 1));
  /* 用特效畫布的時間等待（掉幀時特效與等待同步）；分頁在背景時最多等 3 倍＋1 秒 */
  const fw = ms => typeof FXE === 'undefined' ? wait(ms) : new Promise(res => { let done = false; const ok = () => { if (!done) { done = true; res(); } };
    const e = FXE.add({ life: 99, draw(c, q, dt, t) { if (t * 1000 >= ms) { e.t = 99; ok(); } } }); setTimeout(ok, ms * 3 / (window.BSPEED || 1) + 1000); });
  /* 角色在戰場上的實際範圍（戰場座標）：x 中線、top 頭頂、bot 腳底、h 身高、y 身體中心 */
  function pt(side) { const f = $('bF' + side), img = $('bImg' + side);
    const sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, h = Math.max(60, img.offsetHeight * sc), bot = f.offsetTop + img.offsetTop + img.offsetHeight;
    return { x: f.offsetLeft + img.offsetLeft + img.offsetWidth / 2 + (window.__camTx ? __camTx(side) : 0), bot, top: bot - h, h, y: bot - h * .5 }; }
  /* sp(圖, 參數)：畫在戰場畫布。x、y、w、s、sy、a、r 可以是數字或 (進度 q, 秒 t) => 值；ax/ay＝錨點（佔圖寬高比例）；fx＝水平鏡像；add＝加亮；
     clip(c, x0, y0, w, h, q, t)＝在圖片座標裡建立裁切路徑（x0,y0 是圖左上角） */
  function sp(k, o) { const img = get(k);
    return FXE.add({ add: !!o.add, life: o.life || .8, draw(c, q, dt, t) { if (!ready(img)) return; const v = f => typeof f === 'function' ? f(q, t) : f;
      const s = v(o.s == null ? 1 : o.s), w = v(o.w || 300) * s, h = w * img.naturalHeight / img.naturalWidth, a = v(o.a == null ? 1 : o.a);
      if (a <= 0 || w <= 1) return; c.globalAlpha = Math.min(1, a); c.translate(v(o.x), v(o.y)); c.rotate(v(o.r || 0)); if (o.fx) c.scale(-1, 1); if (o.sy != null) c.scale(1, v(o.sy));
      const x0 = -w * (o.ax == null ? .5 : o.ax), y0 = -h * (o.ay == null ? .5 : o.ay);
      if (o.clip) { c.beginPath(); o.clip(c, x0, y0, w, h, q, t); c.clip(); }
      c.drawImage(img, x0, y0, w, h); } }); }
  /* back(角色, 圖, 參數)：畫在角色「身後」的素材（DOM，插在角色圖之前），跟著角色一起移動。kf＝Web Animations 關鍵影格 */
  function back(side, k, o) { const f = $('bF' + side), img = $('bImg' + side), I = get(k); if (!f || !img || !ready(I)) return null;
    const w = o.w, h = w * I.naturalHeight / I.naturalWidth, ax = o.ax == null ? .5 : o.ax, ay = o.ay == null ? .5 : o.ay, el = document.createElement('div');
    el.className = 'fx196-back';
    el.style.cssText = `position:absolute;left:${o.x - (window.__camTx ? __camTx(side) : 0) - f.offsetLeft - w * ax}px;top:${o.y - f.offsetTop - h * ay}px;width:${w}px;height:${h}px;background:url("${I.src}") center/100% 100% no-repeat;pointer-events:none;transform-origin:${ax * 100}% ${ay * 100}%;opacity:0`;
    f.insertBefore(el, img); const dur = o.dur / (window.BSPEED || 1);
    try { el.animate(o.kf, { duration: dur, easing: o.ease || 'linear', fill: 'forwards' }); } catch (e) { }
    setTimeout(() => el.remove(), dur + 80); return el; }
  /* 畫面上方資訊列的下緣，換算成戰場座標（特效不要飛到資訊列後面） */
  function visTop() { try { const A = $('bArena'), r = A.getBoundingClientRect(), k = r.height / (A.offsetHeight || 1), tb = document.querySelector('#battleScreen .b-top'); return ((tb ? tb.getBoundingClientRect().bottom : r.top) - r.top) / (k || 1); } catch (e) { return 0; } }
  /* 畫面可見寬度，換算成戰場座標（大型素材不要超過畫面） */
  function visW() { try { const A = $('bArena'), r = A.getBoundingClientRect(), k = r.width / (A.offsetWidth || 1); return ($('battleScreen').clientWidth || innerWidth) / (k || 1); } catch (e) { return 9999; } }
  const hit = (A, kind) => { try { moveFighter(A.T, kind || 'recoil'); } catch (e) { } try { shake(); } catch (e) { } };
  const mv = (side, kind) => { try { moveFighter(side, kind); } catch (e) { } };
  const sfx = n => { try { SFX.play(n); } catch (e) { } };

  const VFX = {
    /* ── 凱多「升龍·火焰八卦」：身上竄出火焰 → 火龍從凱多身上昇空 → 弧線俯衝咬向對手 → 爆炸、火柱 ── */
    dragon: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, dist = Math.abs(e.x - f.x), M = Math.max(u, E);
      sfx('ult'); X().tint('#3a0a00', 1.7, .5); mv(A.S, 'float');
      X().glow(f.x, f.y, { color: '#ff7a2a', r: u * .42, life: .5, hold: true }); X().flames(f.x, f.bot - u * .1, { n: 46, jx: u * .28, dy: 0, colors: ['#ff5a2a', '#ffb347', '#ffd26c', '#fff3c4'] });
      X().ring(f.x, f.bot - 4, { r1: u * .6, flat: .25, color: '#ff9a3a', w: 8, life: .6 });
      await fw(240); sfx('whoosh');
      const W = Math.max(dist * 1.05, M * 1.2);
      const P0 = { x: f.x + d * u * .05, y: f.y - u * .1 }, P2 = { x: e.x - d * E * .05, y: e.y - E * .08 }, P1 = { x: (P0.x + P2.x) / 2 - d * dist * .12, y: Math.min(f.top, e.top) - M * .32 };
      /* 最高點不要飛出畫面上方的資訊列：龍身上緣（錨點以上約 0.59 個圖高）留在資訊列下面 */
      { const top = visTop(), minApex = top + W * .479 * AN.dragon.head[1] * .8 + 6, apex = .25 * P0.y + .5 * P1.y + .25 * P2.y; if (apex < minApex) P1.y = Math.min(2 * (minApex - .25 * (P0.y + P2.y)), Math.min(P0.y, P2.y) - M * .05); }
      const T0 = .06, T1 = .5, T2 = .8, LIFE = 1.12; /* 現形 → 昇空到最高點 → 俯衝命中 → 穿過去消散 */
      const prog = t => t < T1 ? .5 * eOut((t - T0) / (T1 - T0)) : .5 + .5 * eIn((t - T1) / (T2 - T1)) + Math.max(0, t - T2) * .9;
      const bz = p => { const k = 1 - p; return { x: k * k * P0.x + 2 * k * p * P1.x + p * p * P2.x, y: k * k * P0.y + 2 * k * p * P1.y + p * p * P2.y }; };
      const tan = p => { p = Math.min(p, 1); const k = 1 - p; return Math.atan2(2 * k * (P1.y - P0.y) + 2 * p * (P2.y - P1.y), 2 * k * (P1.x - P0.x) + 2 * p * (P2.x - P1.x)); };
      const rot = (q, t) => { let th = tan(prog(t)); if (d < 0) { th -= PI; if (th < -PI) th += TAU; } return Math.max(-.95, Math.min(.95, th)); };
      const o = { life: LIFE, w: W, ax: AN.dragon.head[0], ay: AN.dragon.head[1], fx: d > 0, x: (q, t) => bz(prog(t)).x, y: (q, t) => bz(prog(t)).y, r: rot,
        s: (q, t) => .35 + .65 * eOut((t - T0) / (T1 - T0)), a: (q, t) => t < T0 ? 0 : t < T0 + .14 ? (t - T0) / .14 : t > T2 + .06 ? Math.max(0, (LIFE - t) / (LIFE - T2 - .06)) : 1 };
      sp('dragon', o); sp('dragon', Object.assign({}, o, { add: true, a: (q, t) => .28 * o.a(q, t) }));
      /* 龍身經過的火星 */
      for (let i = 1; i <= 4; i++) { await fw(i === 1 ? 150 : 130); const p = bz(prog(.15 + (i - 1) * .13));
        X().particles({ x: p.x, y: p.y, jx: M * .12, jy: M * .08, n: 12, spd: [M * .2, M * .7], life: [.3, .6], size: [3, 7], colors: ['#ff5a2a', '#ffb347', '#ffd26c'], shape: 'spark', add: true, g: -80 }); }
      await fw(250); sfx('explode');
      X().burst(e.x, e.y, { r: E * .55, color: '#ff7828' }); X().flames(e.x, e.bot - E * .15, { n: 90, jx: E * .4, dy: 0, colors: ['#ff5a2a', '#ffb347', '#ffd26c', '#ffffff'] });
      X().ring(e.x, e.bot - 4, { r1: E * 1.2, flat: .25, color: '#ffb347', w: 12, life: .6 }); X().ring(e.x, e.y, { r1: E * .9, color: '#ffd26c', w: 8, life: .45 });
      X().particles({ x: e.x, y: e.y, n: 30, spd: [E * .8, E * 2.4], life: [.35, .8], size: [3, 8], colors: ['#ff5a2a', '#ffb347', '#ffd26c', '#ffffff'], shape: 'spark', add: true, g: 220 });
      X().flash('#ffd9a8', .22, .35); hit(A);
      await fw(180); sfx('heavy'); X().burst(e.x + d * E * .12, e.y - E * .12, { r: E * .4, color: '#ffaa3c' }); try { shake(); } catch (e2) { }
      await fw(320); },

    /* ── 凱多「酒龍八卦」：紅紫氣焰從腳下炸開，在凱多身後燃燒（素材在立繪後方） ── */
    burst: async A => { const f = A.f, u = f.h; sfx('buff'); X().tint('#2a0410', 1.3, .4); mv(A.S, 'float');
      const b = AN.burst.base;
      back(A.S, 'burst', { x: f.x, y: f.bot - u * .02, w: u * 2.7, ax: b[0], ay: b[1], dur: 1350,
        kf: [{ opacity: 0, transform: 'scale(.45,.12)', easing: 'cubic-bezier(.2,.9,.3,1.25)' }, { opacity: 1, transform: 'scale(1.06,1.1)', offset: .2 }, { opacity: 1, transform: 'scale(1,1)', offset: .3 },
          { opacity: 1, transform: 'scale(1.05,1.07)', offset: .46 }, { opacity: 1, transform: 'scale(.99,1)', offset: .6 }, { opacity: 1, transform: 'scale(1.04,1.06)', offset: .76 }, { opacity: 0, transform: 'scale(1.12,1.22)' }] });
      X().ring(f.x, f.bot - 4, { r1: u * .8, flat: .25, color: '#ff3a5a', w: 10, life: .55 });
      X().particles({ x: f.x, y: f.bot - u * .05, jx: u * .45, n: 26, ang: [-PI / 2 - .5, -PI / 2 + .5], spd: [u * .5, u * 1.5], life: [.5, 1], size: [3, 7], colors: ['#ff3a5a', '#c0306a', '#7a2ad0', '#ffd0d8'], shape: 'spark', add: true, g: -60 });
      await fw(300); sfx('dark'); try { shake(); } catch (e) { }
      X().ring(f.x, f.bot - 4, { r1: u * 1.15, flat: .25, color: '#b03aff', w: 8, life: .5 });
      await fw(380); X().ring(f.x, f.bot - 4, { r1: u * .95, flat: .25, color: '#ff6a7a', w: 6, life: .5 });
      X().particles({ x: f.x, y: f.bot - u * .05, jx: u * .5, n: 16, ang: [-PI / 2 - .4, -PI / 2 + .4], spd: [u * .4, u * 1.2], life: [.5, .9], size: [2, 6], colors: ['#ff3a5a', '#7a2ad0', '#ffd0d8'], shape: 'spark', add: true, g: -60 });
      await fw(560); },

    /* ── 女帝「虜之箭」：身前先浮現大愛心（彈出）→ 愛心箭從愛心向對手射出（由內往外現形）→ 命中、粉紅光爆開 ── */
    heart: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.heart.c;
      sfx('buff'); X().tint('#3a0a2a', 1.5, .35); mv(A.S, 'float');
      const C = { x: f.x + d * u * .46, y: f.y - u * .12 };                 /* 愛心中心：女帝身前 */
      const reach = Math.abs(e.x - C.x) + E * .3;                          /* 箭尖要超過對手 */
      const W = Math.max(reach / (AN.heart.tip - c0[0]), u * 1.7), T1 = .5, T2 = .8, LIFE = 1.2;
      const R0 = .2, R1 = .86;                                             /* 裁切圓半徑（佔圖寬）：只露出愛心 → 整張 */
      const rad = t => t < T1 ? R0 : lerp(R0, R1, eOut((t - T1) / (T2 - T1)));
      const o = { life: LIFE, w: W, ax: c0[0], ay: c0[1], fx: d < 0, x: C.x, y: (q, t) => C.y - Math.sin(Math.min(t, T1) / T1 * PI) * u * .03,
        s: (q, t) => t < .3 ? .15 + .85 * back3(t / .3) : t < T1 ? 1 + .04 * Math.sin((t - .3) / (T1 - .3) * PI * 2) : 1,
        a: (q, t) => t < .1 ? t / .1 : t > T2 + .12 ? Math.max(0, (LIFE - t) / (LIFE - T2 - .12)) : 1,
        clip: (c, x0, y0, w, h, q, t) => c.arc(x0 + c0[0] * w, y0 + c0[1] * h, rad(t) * w, 0, TAU) };
      sp('heart', o); sp('heart', Object.assign({}, o, { add: true, a: (q, t) => .35 * o.a(q, t) }));
      X().ring(C.x, C.y, { r1: u * .55, color: '#ff7ad8', w: 6, life: .45 });
      X().particles({ x: C.x, y: C.y, n: 14, spd: [u * .2, u * .7], life: [.4, .8], size: [3, 6], colors: ['#ff7ad8', '#ffc0ec', '#ffffff'], shape: 'spark', add: true, g: -40 });
      await fw(T1 * 1000); sfx('whoosh'); sfx('petals');
      X().particles({ x: C.x + d * u * .2, y: C.y, jy: u * .3, n: 22, ang: d > 0 ? [-.35, .35] : [PI - .35, PI + .35], spd: [reach * 1.6, reach * 2.6], life: [.25, .4], size: [2, 5], colors: ['#ff7ad8', '#ffc0ec', '#ffffff'], shape: 'spark', add: true });
      await fw((T2 - T1) * 1000 - 60); sfx('hit');
      X().burst(e.x, e.y - E * .05, { r: E * .45, color: '#ff6ec8' }); X().ring(e.x, e.y, { r1: E * .9, color: '#ff7ad8', w: 8, life: .45 });
      X().particles({ x: e.x, y: e.y - E * .05, n: 26, spd: [E * .5, E * 1.6], life: [.45, .9], size: [5, 9], colors: ['#ff7ad8', '#ffc0ec', '#ff4fb0'], shape: 'petal', g: 120 });
      X().flash('#ffd0f0', .18, .2); hit(A);
      await fw(420); },

    /* ── 尼卡魯夫「解放之鼓」：金色鼓聲光環在身後展開，隨鼓聲「咚咚、咚咚」脈動（素材在立繪後方） ── */
    drum: async A => { const f = A.f, u = f.h, c0 = AN.drum.c; sfx('drum'); X().tint('#3a2a00', 1.6, .3); mv(A.S, 'float');
      const cy = f.top + u * .46;
      back(A.S, 'drum', { x: f.x, y: cy, w: u * 2.5, ax: c0[0], ay: c0[1], dur: 1650,
        kf: [{ opacity: 0, transform: 'scale(.2) rotate(-14deg)', easing: 'cubic-bezier(.2,.9,.3,1.3)' }, { opacity: 1, transform: 'scale(1.08) rotate(0deg)', offset: .16 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: .24 },
          { opacity: 1, transform: 'scale(1.12) rotate(1deg)', offset: .32 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: .42 },
          { opacity: 1, transform: 'scale(1.12) rotate(-1deg)', offset: .54 }, { opacity: 1, transform: 'scale(1) rotate(0deg)', offset: .64 },
          { opacity: 1, transform: 'scale(1.14) rotate(1deg)', offset: .76 }, { opacity: 1, transform: 'scale(1.02) rotate(0deg)', offset: .86 }, { opacity: 0, transform: 'scale(1.3) rotate(3deg)' }] });
      const beat = () => { sfx('drum'); X().ring(f.x, cy, { r1: u * 1.15, color: '#ffe680', w: 8, life: .45 });
        X().particles({ x: f.x, y: cy, n: 10, spd: [u * .6, u * 1.4], life: [.35, .7], size: [3, 6], colors: ['#fff3a8', '#ffd24a', '#ffffff'], shape: 'spark', add: true }); };
      await fw(400); beat(); try { X().text(f.x + A.d * u * .28, f.top - u * .08, '咚咚咚咚', { size: 38, color: '#ffffff', color2: '#e8a400' }); } catch (e) { }
      await fw(360); beat(); await fw(360); beat(); X().flash('#fff3c4', .2, .18);
      X().particles({ x: f.x, y: f.bot, jx: u * .4, n: 20, ang: [-PI / 2 - .4, -PI / 2 + .4], spd: [u * .4, u * 1.1], life: [.6, 1], size: [3, 6], colors: ['#fff3a8', '#ffd24a', '#ffffff'], shape: 'spark', add: true, g: -50 });
      await fw(520); },

    /* ── 四皇黑鬍子「引發震動」：出拳 → 對手面前的空間像玻璃一樣碎裂（素材瞬間炸開、持續震顫）→ 衝擊波 ── */
    quake: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.quake.c;
      sfx('whoosh'); X().tint('#0a0618', 1.2, .45); mv(A.S, 'lunge');
      await fw(200); sfx('heavy'); sfx('explode');
      const C = { x: e.x - d * E * .16, y: e.y - E * .06 }, W = Math.max(E * 2.4, u * 1.6), LIFE = 1.05;
      const o = { life: LIFE, w: W, ax: c0[0], ay: c0[1], fx: d < 0, x: (q, t) => C.x + (t < .5 ? Math.sin(t * 95) * W * .006 * (1 - t / .5) : 0), y: (q, t) => C.y + (t < .5 ? Math.cos(t * 83) * W * .005 * (1 - t / .5) : 0),
        s: (q, t) => t < .09 ? .25 + .83 * (t / .09) : t < .16 ? lerp(1.08, 1, (t - .09) / .07) : 1 + .04 * eOut((t - .16) / .8),
        a: (q, t) => t < .03 ? t / .03 : t > .72 ? Math.max(0, (LIFE - t) / (LIFE - .72)) : 1 };
      sp('quake', o); sp('quake', Object.assign({}, o, { add: true, a: (q, t) => (t < .25 ? .6 * (1 - t / .25) : 0) }));
      X().flash('#ffffff', .16, .3); X().ring(C.x, C.y, { r1: W * .6, color: '#ffffff', w: 5, life: .35 }); X().ring(C.x, C.y, { r1: W * .85, color: '#b08cff', w: 6, life: .5 });
      X().particles({ x: C.x, y: C.y, n: 26, spd: [W * .5, W * 1.5], life: [.3, .7], size: [3, 7], colors: ['#ffffff', '#cfe6ff', '#b08cff'], shape: 'spark', add: true, g: 200 });
      try { X().cracks(e.x, e.bot - E * .05, { n: 8, len: E * .9 }); } catch (e2) { }
      hit(A);
      await fw(230); sfx('heavy'); try { shake(); } catch (e2) { } X().ring(C.x, C.y, { r1: W * 1.05, color: '#ff5a6a', w: 5, life: .5 });
      await fw(520); },

    /* ── 佩羅娜「鬼魂網域」：幽靈群從佩羅娜身邊湧出 → 飄向對手 → 繞著對手打轉、穿過身體 ── */
    ghosts: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.ghosts.c;
      sfx('dark'); X().tint('#120a2a', 1.7, .4); mv(A.S, 'float');
      const VW = visW(), W1 = Math.min(Math.max(E * 1.8, u * 1.6), VW * .62), W0 = Math.min(u * 1.3, W1 * .8), P0 = { x: f.x + d * u * .15, y: f.y - u * .15 }, P1 = { x: e.x, y: e.y - E * .05 }, T1 = .55, LIFE = 1.5;
      const o = { life: LIFE, ax: c0[0], ay: c0[1], fx: d > 0, w: (q, t) => lerp(W0, W1, eOut(t / T1)),
        x: (q, t) => t < T1 ? lerp(P0.x, P1.x, eIO(t / T1)) : P1.x + Math.sin((t - T1) * 5) * E * .1 * d,
        y: (q, t) => (t < T1 ? lerp(P0.y, P1.y, eIO(t / T1)) - Math.sin(cl(t / T1) * PI) * u * .18 : P1.y) + Math.sin(t * 7) * E * .04,
        r: (q, t) => Math.sin(t * 4.2) * .09, s: (q, t) => t < T1 ? .5 + .5 * eOut(t / T1) : 1 + .05 * Math.sin((t - T1) * 9),
        a: (q, t) => t < .15 ? t / .15 * .95 : t > LIFE - .3 ? Math.max(0, (LIFE - t) / .3) : .95 };
      sp('ghosts', o); sp('ghosts', Object.assign({}, o, { add: true, a: (q, t) => .22 * o.a(q, t) }));
      X().ring(f.x, f.bot - 4, { r1: u * .6, flat: .25, color: '#bfe0ff', w: 6, life: .5 });
      X().particles({ x: P0.x, y: P0.y, jx: u * .3, jy: u * .3, n: 14, spd: [u * .1, u * .5], life: [.5, .9], size: [2, 5], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: -30 });
      await fw(T1 * 1000); sfx('whoosh');
      for (let i = 0; i < 3; i++) { sfx(i % 2 ? 'hit' : 'dark'); X().ring(e.x, e.y, { r1: E * (.7 + i * .2), color: i % 2 ? '#ffc8ec' : '#bfe0ff', w: 6, life: .4 });
        X().particles({ x: e.x, y: e.y, jx: E * .3, jy: E * .3, n: 12, spd: [E * .3, E * 1], life: [.3, .7], size: [2, 6], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: -40 });
        hit(A); await fw(210); }
      await fw(300); },

    /* ── 佩羅娜「特大幽靈」：頭頂浮現巨大幽靈 → 朝對手飄去、越來越大 → 罩住對手後膨脹 → 爆炸 ── */
    ghost: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, c0 = AN.ghost.c;
      sfx('ult'); X().tint('#0a0a2a', 1.9, .5); mv(A.S, 'float');
      const VW = visW(), W1 = Math.min(Math.max(E * 2.4, u * 2), VW * .7), W0 = Math.min(u * 1.1, W1 * .6), P0 = { x: f.x + d * u * .1, y: Math.max(f.top - u * .1, visTop() + W0 * .3) }, P1 = { x: e.x - d * E * .1, y: e.y - E * .12 }, T0 = .4, T1 = 1.0, T2 = 1.22, LIFE = 1.42;
      const o = { life: LIFE, ax: c0[0], ay: c0[1], fx: d < 0,
        w: (q, t) => t < T0 ? W0 : t < T1 ? lerp(W0, W1, eIO((t - T0) / (T1 - T0))) : W1,
        x: (q, t) => t < T0 ? P0.x : lerp(P0.x, P1.x, eIO((t - T0) / (T1 - T0))), y: (q, t) => (t < T0 ? P0.y : lerp(P0.y, P1.y, eIO((t - T0) / (T1 - T0)))) + Math.sin(t * 6) * u * .025,
        r: (q, t) => Math.sin(t * 5) * .05 * (d > 0 ? 1 : -1),
        s: (q, t) => t < T0 ? .2 + .8 * back3(t / T0) : t < T1 ? 1 : t < T2 ? 1 + .22 * eIn((t - T1) / (T2 - T1)) + Math.sin(t * 70) * .012 : 1.22 + .7 * eOut((t - T2) / (LIFE - T2)),
        a: (q, t) => t < .12 ? t / .12 : t > T2 ? Math.max(0, 1 - (t - T2) / (LIFE - T2)) : 1 };
      sp('ghost', o); sp('ghost', Object.assign({}, o, { add: true, a: (q, t) => (t > T1 ? .2 + .5 * cl((t - T1) / (T2 - T1)) : .18) * o.a(q, t) }));
      X().ring(P0.x, P0.y, { r1: u * .7, color: '#bfe0ff', w: 6, life: .5 });
      X().particles({ x: P0.x, y: P0.y, jx: u * .3, jy: u * .2, n: 16, spd: [u * .1, u * .5], life: [.5, .9], size: [2, 5], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: -30 });
      await fw(T0 * 1000); sfx('whoosh'); await fw((T2 - T0) * 1000); sfx('explode');
      X().burst(P1.x, P1.y, { r: E * .7, color: '#bee1ff' }); X().ring(P1.x, P1.y, { r1: E * 1.5, color: '#ffffff', w: 12, life: .5 }); X().ring(P1.x, P1.y, { r1: E * 1.1, color: '#ffc8ec', w: 8, life: .6 });
      X().particles({ x: P1.x, y: P1.y, n: 34, spd: [E * .7, E * 2.4], life: [.4, .9], size: [3, 8], colors: ['#ffffff', '#bfe0ff', '#ffc8ec'], shape: 'spark', add: true, g: 120 });
      X().flash('#e8f4ff', .22, .45); hit(A);
      await fw(160); sfx('heavy'); try { shake(); } catch (e2) { } await fw(380); },

    /* ── 基德「電磁砲」：砲口聚集磁力光環 → 電磁砲從砲口射向對手（從砲口往對手現形）→ 命中處爆開、光束收細消散 ── */
    rail: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, rg = AN.rail.ring, ht = AN.rail.hit;
      sfx('zap'); X().tint('#2a0418', 1.5, .45); mv(A.S, 'float');
      const M = { x: f.x + d * u * .3, y: f.y - u * .1 }, G = { x: e.x, y: e.y - E * .05 };   /* 砲口、命中點 */
      const len = Math.hypot(G.x - M.x, G.y - M.y), W = len / (rg[0] - ht[0]), ang = Math.atan2(G.y - M.y, G.x - M.x);
      const img = get('rail'), ratio = ready(img) ? img.naturalHeight / img.naturalWidth : .436, SY = Math.max(1, Math.min(2.6, Math.max(E * 1.15, u * .9) / (W * ratio)));
      /* 蓄力：砲口光環＋往砲口吸的電光 */
      X().ring(M.x, M.y, { r0: u * .5, r1: u * .08, color: '#ff4f9a', w: 5, life: .32 }); X().glow(M.x, M.y, { color: '#ff4f9a', r: u * .26, life: .45, hold: true });
      for (let i = 0; i < 5; i++) { const a = Math.random() * TAU, r = u * (.35 + Math.random() * .25); try { X().bolt(M.x + Math.cos(a) * r, M.y + Math.sin(a) * r, M.x, M.y, { color: '#ff7ab8', life: .2 + i * .03, amp: u * .05 }); } catch (e2) { } }
      await fw(210); X().ring(M.x, M.y, { r0: u * .4, r1: u * .06, color: '#ffd0e8', w: 4, life: .22 });
      await fw(170); sfx('thunder'); sfx('explode');
      const T1 = .1, T2 = .52, LIFE = .85;
      const o = { life: LIFE, w: W, ax: rg[0], ay: rg[1], fx: d > 0, x: M.x, y: (q, t) => M.y + (t < T2 ? Math.sin(t * 110) * E * .008 : 0), r: d > 0 ? ang : ang - PI,
        sy: (q, t) => t < T1 ? SY * (.5 + .6 * t / T1) : t < T2 ? SY * (1.1 - .1 * (t - T1) / (T2 - T1)) : SY * lerp(1, .18, eIn((t - T2) / (LIFE - T2))),
        a: (q, t) => t > T2 ? Math.max(0, 1 - (t - T2) / (LIFE - T2)) : 1,
        clip: (c, x0, y0, w, h, q, t) => { const p = eOut(t / T1); c.rect(x0 + w * (1 - p), y0 - h, w * p + 2, h * 3); } };
      sp('rail', o); sp('rail', Object.assign({}, o, { add: true, a: (q, t) => .45 * o.a(q, t) }));
      mv(A.S, 'recoil'); X().flash('#ffd0e8', .16, .4);
      await fw(T1 * 1000);
      X().burst(G.x, G.y, { r: E * .6, color: '#ff4696' }); X().ring(G.x, G.y, { r1: E * 1.3, color: '#ff7ab8', w: 12, life: .5 });
      X().particles({ x: G.x, y: G.y, n: 30, spd: [E * .8, E * 2.6], life: [.3, .8], size: [3, 7], colors: ['#ffffff', '#ff7ab8', '#ff2a6a', '#c01a5a'], shape: 'spark', add: true, g: 160 });
      hit(A);
      await fw(190); sfx('heavy'); try { shake(); } catch (e2) { } X().ring(G.x, G.y, { r1: E * .9, color: '#ffffff', w: 6, life: .4 });
      await fw(470); },

    /* ═════ v203 ═════ 共用：proj＝素材從施放者飛向對手（錨點對準目標），flick＝閃爍 */
    luffy_pistol: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.luffy_pistol.fist, S0 = { x: f.x + d * u * .25, y: f.y - u * .08 }, T = { x: e.x - d * E * .12, y: e.y - E * .05 }, dist = Math.abs(T.x - S0.x);
      sfx('whoosh'); mv(A.S, 'stretch');
      const W = Math.max(u * .9, dist / an[0] * 1.02), o = { life: .62, ax: an[0], ay: an[1], fx: d < 0, w: (q, t) => lerp(u * .5, W, eOut(Math.min(1, t / .16))), x: (q, t) => lerp(S0.x, T.x, eOut(Math.min(1, t / .16))), y: (q, t) => lerp(S0.y, T.y, eOut(Math.min(1, t / .16))), a: (q, t) => t > .42 ? Math.max(0, 1 - (t - .42) / .2) : 1 };
      sp('luffy_pistol', o); await fw(160); sfx('punch'); sfx('hit');
      X().burst(T.x, T.y, { r: E * .45, color: '#ff5a32' }); X().ring(T.x, T.y, { r1: E * .9, color: '#ffd26c', w: 9, life: .35 });
      X().particles({ x: T.x, y: T.y, n: 22, spd: [E * .8, E * 2.2], life: [.25, .5], size: [3, 6], colors: ['#ffffff', '#ffd26c', '#ff5a2a'], shape: 'spark', add: true }); X().flash('#fff0d0', .12, .14); hit(A); await fw(420); },
    luffy_rocket: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.luffy_rocket.fist, S0 = { x: f.x + d * u * .3, y: f.y - u * .05 }, T = { x: e.x - d * E * .1, y: e.y - E * .05 }, dist = Math.abs(T.x - S0.x);
      sfx('whoosh'); mv(A.S, 'lunge'); const W = Math.max(u * 1.4, dist / an[0] * 1.05);
      const o = { life: 1.05, ax: an[0], ay: an[1], fx: d < 0, w: (q, t) => lerp(u * .6, W, eOut(Math.min(1, t / .2))), x: (q, t) => lerp(S0.x, T.x, eOut(Math.min(1, t / .2))) + (t > .2 ? Math.sin(t * 90) * E * .03 : 0), y: (q, t) => lerp(S0.y, T.y, eOut(Math.min(1, t / .2))) + (t > .2 ? Math.cos(t * 77) * E * .03 : 0), a: (q, t) => t > .82 ? Math.max(0, 1 - (t - .82) / .23) : 1 };
      sp('luffy_rocket', o); sp('luffy_rocket', Object.assign({}, o, { add: true, a: (q, t) => .25 * o.a(q, t) })); await fw(200);
      for (let k = 0; k < 5; k++) { sfx(k % 2 ? 'hit' : 'punch'); const x = T.x + (Math.random() - .5) * E * .5, y = T.y + (Math.random() - .5) * E * .5; X().burst(x, y, { r: E * .28, color: '#ff3c3c' }); X().ring(x, y, { r1: E * .55, color: '#ffffff', w: 6, life: .25 }); hit(A); await fw(115); }
      X().flash('#ffd0d0', .14, .16); await fw(320); },
    luffy_gear2: async A => { const f = A.f, u = f.h; sfx('buff'); X().tint('#2a0410', 1.1, .3);
      back(A.S, 'luffy_gear2', { x: f.x, y: f.y - u * .12, w: u * 2.9, dur: 1700, ease: 'ease-out', kf: [{ opacity: 0, transform: 'translateY(12%) scale(.5)' }, { opacity: 1, transform: 'translateY(0) scale(1.02)', offset: .25 }, { opacity: .95, transform: 'translateY(-4%) scale(1.06)', offset: .65 }, { opacity: 0, transform: 'translateY(-12%) scale(1.16)' }] });
      mv(A.S, 'float'); X().ring(f.x, f.bot - 4, { r1: u * .7, flat: .25, color: '#ff8aa8', w: 7, life: .5 });
      for (let k = 0; k < 3; k++) { X().particles({ x: f.x, y: f.y, jx: u * .3, jy: u * .35, n: 10, ang: [-PI / 2 - .5, -PI / 2 + .5], spd: [u * .3, u * .8], life: [.5, .9], size: [6, 12], colors: ['#ffebf0', '#ffaabe'], shape: 'smoke', g: -40 }); await fw(260); }
      sfx('whoosh'); await fw(500); },
    kizaru_jewel: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.kizaru_jewel.o;
      sfx('zap'); X().tint('#2a2000', 1.3, .3); mv(A.S, 'float');
      const O = { x: e.x - d * E * .55, y: Math.max(visTop() + 10, e.top - E * .75) }, T = { x: e.x + d * E * .05, y: e.y + E * .08 }, ang = Math.atan2(T.y - O.y, (T.x - O.x)), L = Math.hypot(T.x - O.x, T.y - O.y) * 1.15, W = L / (1 - an[0]);
      X().glow(O.x, O.y, { color: '#ffe680', r: E * .5, life: .5, hold: true }); X().ring(O.x, O.y, { r0: E * .6, r1: E * .1, color: '#fff3a8', w: 5, life: .3 });
      await fw(260); sfx('thunder');
      const o = { life: 1.1, w: W, ax: an[0], ay: an[1], x: O.x, y: O.y, r: ang, a: (q, t) => t > .85 ? Math.max(0, 1 - (t - .85) / .25) : 1, clip: (c, x0, y0, w, h, q, t) => { const k = eOut(Math.min(1, t / .18)); c.rect(x0, y0 - h, w * (an[0] + (1 - an[0]) * k) + 2, h * 3); } };
      sp('kizaru_jewel', o); sp('kizaru_jewel', Object.assign({}, o, { add: true, a: (q, t) => .35 * o.a(q, t) })); await fw(180);
      for (let k = 0; k < 6; k++) { sfx('hit'); const x = T.x + (Math.random() - .5) * E * .55, y = T.y - E * .1 + (Math.random() - .5) * E * .6; X().burst(x, y, { r: E * .22, color: '#ffeb78' }); X().particles({ x, y, n: 8, spd: [E * .4, E * 1.2], life: [.2, .4], size: [2, 5], colors: ['#ffffff', '#fff3a8', '#ffd24a'], shape: 'spark', add: true }); hit(A); await fw(95); }
      X().flash('#fff6c8', .14, .2); await fw(330); },
    kizaru_sword: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.kizaru_sword;
      sfx('zap'); X().tint('#2a2000', 1.2, .3); const O = { x: f.x + d * u * .22, y: f.y - u * .12 }, T = { x: e.x + d * E * .05, y: e.y - E * .05 };
      const img = get('kizaru_sword'), ra = ready(img) ? img.naturalHeight / img.naturalWidth : .5, dx = an.tip[0] - an.o[0], dy = (an.tip[1] - an.o[1]) * ra, imgAng = Math.atan2(dy, dx), L = Math.hypot(T.x - O.x, T.y - O.y) * 1.08, W = L / Math.hypot(dx, dy), ta = Math.atan2(T.y - O.y, T.x - O.x);
      X().glow(O.x, O.y, { color: '#ffe680', r: u * .35, life: .35, hold: true }); await fw(200); sfx('slash');
      const o = { life: .85, w: W, ax: an.o[0], ay: an.o[1], fx: d < 0, x: O.x, y: O.y, r: d > 0 ? ta - imgAng : ta - PI + imgAng, a: (q, t) => t > .55 ? Math.max(0, 1 - (t - .55) / .3) : 1, clip: (c, x0, y0, w, h, q, t) => { const k = eOut(Math.min(1, t / .14)); c.rect(x0, y0 - h, w * (an.o[0] + (1 - an.o[0]) * k) + 2, h * 3); } };
      sp('kizaru_sword', o); sp('kizaru_sword', Object.assign({}, o, { add: true, a: (q, t) => .4 * o.a(q, t) })); mv(A.S, 'lunge'); await fw(140); sfx('explode');
      X().burst(T.x, T.y, { r: E * .5, color: '#ffeb78' }); X().ring(T.x, T.y, { r1: E * 1.1, color: '#fff3a8', w: 10, life: .4 }); X().flash('#fffbe0', .16, .3); hit(A); await fw(480); },
    ace_fist: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.ace_fist.fist, S0 = { x: f.x + d * u * .25, y: f.y - u * .1 }, T = { x: e.x - d * E * .1, y: e.y - E * .05 }, dist = Math.abs(T.x - S0.x);
      sfx('whoosh'); X().tint('#2a0800', 1.2, .3); mv(A.S, 'lunge'); X().flames(f.x, f.bot - u * .1, { n: 26, jx: u * .25, dy: 0, colors: ['#ff5a2a', '#ffb347', '#ffd26c'] });
      const W0 = Math.max(u * 1.2, E * 1.3), o = { life: .8, ax: an[0], ay: an[1], fx: d < 0, w: (q, t) => lerp(W0 * .55, Math.max(W0, dist * .9), eOut(Math.min(1, t / .26))), x: (q, t) => lerp(S0.x, T.x, eIn(Math.min(1, t / .26))), y: (q, t) => lerp(S0.y, T.y, eIn(Math.min(1, t / .26))), a: (q, t) => t > .5 ? Math.max(0, 1 - (t - .5) / .3) : 1 };
      sp('ace_fist', o); sp('ace_fist', Object.assign({}, o, { add: true, a: (q, t) => .3 * o.a(q, t) })); await fw(260); sfx('explode');
      X().burst(T.x, T.y, { r: E * .6, color: '#ff7828' }); X().flames(e.x, e.bot - E * .15, { n: 70, jx: E * .4, dy: 0, colors: ['#ff5a2a', '#ffb347', '#ffd26c', '#ffffff'] });
      X().ring(e.x, e.bot - 4, { r1: E * 1.2, flat: .25, color: '#ffb347', w: 12, life: .5 }); X().flash('#ffd9a8', .18, .3); hit(A); await fw(460); },
    ace_gun: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.ace_gun.head; sfx('whoosh'); mv(A.S, 'float');
      const S0 = { x: f.x + d * u * .28, y: f.y - u * .1 }, W = Math.max(u * 1.1, E * 1.5);
      for (let v = 0; v < 3; v++) { const T = { x: e.x - d * E * (.05 + v * .06), y: e.y - E * (.15 - v * .13) };
        const o = { life: .42, ax: an[0], ay: an[1], fx: d < 0, w: W * (.8 + v * .12), x: (q, t) => lerp(S0.x, T.x, eIn(Math.min(1, t / .2))), y: (q, t) => lerp(S0.y, T.y, eIn(Math.min(1, t / .2))), a: (q, t) => t > .22 ? Math.max(0, 1 - (t - .22) / .2) : 1 };
        sp('ace_gun', o); sp('ace_gun', Object.assign({}, o, { add: true, a: (q, t) => .3 * o.a(q, t) }));
        setTimeout(() => { for (let k = 0; k < 4; k++) setTimeout(() => { sfx('hit'); const x = T.x + (Math.random() - .5) * E * .45, y = T.y + (Math.random() - .5) * E * .35; X().burst(x, y, { r: E * .18, color: '#ff8228' }); X().particles({ x, y, n: 8, spd: [E * .3, E * 1], life: [.2, .45], size: [2, 5], colors: ['#ffd26c', '#ff7a2a', '#ffffff'], shape: 'ember', add: true, g: -60 }); hit(A); }, k * 55 / (window.BSPEED || 1)); }, 200 / (window.BSPEED || 1));
        await fw(260); }
      X().flames(e.x, e.bot - E * .1, { n: 30, jx: E * .3, dy: 0, colors: ['#ff5a2a', '#ffb347', '#ffd26c'] }); await fw(420); },
    burgess_rock: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.burgess_rock.head; sfx('heavy'); mv(A.S, 'stomp');
      const S0 = { x: f.x + d * u * .3, y: f.y - u * .2 }, T = { x: e.x - d * E * .05, y: e.y - E * .02 }, W = Math.max(u * 1.4, E * 1.9);
      try { X().cracks(f.x, f.bot - 2, { n: 6, len: u * .5 }); } catch (er) { } await fw(200); sfx('whoosh');
      const o = { life: .9, ax: an[0], ay: an[1], fx: d < 0, w: W, x: (q, t) => lerp(S0.x, T.x, eIn(Math.min(1, t / .3))), y: (q, t) => lerp(S0.y, T.y, eIn(Math.min(1, t / .3))) - Math.sin(Math.min(1, t / .3) * PI) * u * .25, r: (q, t) => d * Math.sin(Math.min(1, t / .3) * PI) * -.15, a: (q, t) => t > .45 ? Math.max(0, 1 - (t - .45) / .3) : 1 };
      sp('burgess_rock', o); await fw(300); sfx('explode'); sfx('heavy');
      X().burst(T.x, T.y, { r: E * .55, color: '#dcc8aa' }); X().ring(e.x, e.bot - 4, { r1: E * 1.4, flat: .25, color: '#e8dcc0', w: 12, life: .55 });
      X().particles({ x: e.x, y: e.y, jx: E * .2, n: 26, spd: [E * .8, E * 2.4], life: [.5, .9], size: [5, 11], colors: ['#8a8070', '#5a544a', '#b0a894'], shape: 'shard', g: 900 });
      X().particles({ x: e.x, y: e.bot - 6, jx: E * .5, n: 14, ang: [-PI / 2 - .9, -PI / 2 + .9], spd: [E * .2, E * .6], life: [.6, 1], size: [10, 18], colors: ['#e6dcc8'], shape: 'smoke', g: -30 });
      try { X().cracks(e.x, e.bot - 2, { n: 10, len: E * .9 }); } catch (er) { } shake(); hit(A); await fw(200); shake(); await fw(380); },
    enel_discharge: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.enel_discharge;
      sfx('zap'); X().tint('#000a2a', 1.3, .35); mv(A.S, 'float'); const O = { x: f.x + d * u * .28, y: f.y - u * .12 }, T = { x: e.x, y: e.y - E * .05 };
      const L = Math.hypot(T.x - O.x, T.y - O.y), W = L / (an.end[0] - an.o[0]) * 1.02, ta = Math.atan2(T.y - O.y, T.x - O.x);
      X().glow(O.x, O.y, { color: '#7ad0ff', r: u * .35, life: .4, hold: true }); for (let k = 0; k < 4; k++) { const a2 = Math.random() * TAU, r = u * .35; try { X().bolt(O.x + Math.cos(a2) * r, O.y + Math.sin(a2) * r, O.x, O.y, { color: '#bfe8ff', life: .18, amp: u * .05 }); } catch (er) { } }
      await fw(220); sfx('thunder');
      const o = { life: .95, add: true, w: W, ax: an.o[0], ay: an.o[1], fx: d < 0, x: O.x, y: O.y, r: d > 0 ? ta : ta - PI, sy: (q, t) => .85 + Math.random() * .3, a: (q, t) => (t > .7 ? Math.max(0, 1 - (t - .7) / .25) : 1) * (.65 + Math.random() * .35), clip: (c, x0, y0, w, h, q, t) => { const k = eOut(Math.min(1, t / .1)); c.rect(x0, y0 - h, w * (an.o[0] + (1 - an.o[0]) * k) + 2, h * 3); } };
      sp('enel_discharge', o); sp('enel_discharge', Object.assign({}, o, { add: false, a: (q, t) => (t > .7 ? Math.max(0, 1 - (t - .7) / .25) : 1) * .55 }));
      for (let k = 0; k < 4; k++) { await fw(k ? 150 : 100); sfx(k % 2 ? 'zap' : 'thunder'); X().burst(T.x, T.y, { r: E * .35, color: '#96d2ff' }); X().ring(T.x, T.y, { r1: E * .8, color: '#bfe8ff', w: 6, life: .3 }); if (!k) X().flash('#e0f4ff', .14, .25); hit(A); }
      await fw(380); },
    enel_flash: async A => { const f = A.f, e = A.t, u = f.h, E = e.h, an = AN.enel_flash.base; sfx('zap'); X().tint('#000a2a', 1.1, .4);
      X().glow(f.x, f.top + u * .1, { color: '#7ad0ff', r: u * .4, life: .35, hold: true }); await fw(260); sfx('thunder'); sfx('explode');
      const H = Math.max(E * 1.7, (e.bot - visTop()) * .95), img = get('enel_flash'), W = H * (ready(img) ? img.naturalWidth / img.naturalHeight : .5);
      const o = { life: .9, add: true, w: W, ax: an[0], ay: an[1], x: e.x, y: e.bot + E * .02, sy: (q, t) => Math.min(1, t / .07) * (.95 + Math.random() * .1), a: (q, t) => (t > .55 ? Math.max(0, 1 - (t - .55) / .35) : 1) * (.75 + Math.random() * .25) };
      sp('enel_flash', o); sp('enel_flash', Object.assign({}, o, { add: false, a: (q, t) => (t > .55 ? Math.max(0, 1 - (t - .55) / .35) : 1) * .5 }));
      X().flash('#ffffff', .2, .45); X().ring(e.x, e.bot - 4, { r1: E * 1.3, flat: .25, color: '#bfe8ff', w: 12, life: .5 }); X().particles({ x: e.x, y: e.bot - 4, jx: E * .2, n: 26, ang: [PI + .2, TAU - .2], spd: [E * .8, E * 2.2], life: [.3, .7], size: [2, 5], colors: ['#ffffff', '#bfe8ff', '#5ab0ff'], shape: 'spark', add: true, g: 400 });
      hit(A); await fw(260); hit(A); await fw(420); },
    rocks_eclipse: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.rocks_eclipse.head; sfx('dark'); X().tint('#1a0008', 1.3, .4); mv(A.S, 'lunge');
      const S0 = { x: f.x + d * u * .1, y: f.y - u * .05 }, T = { x: e.x + d * E * .1, y: e.y - E * .02 }, W = Math.max(u * 1.6, Math.abs(T.x - S0.x) * 1.1);
      const o = { life: .75, ax: an[0], ay: an[1], fx: d < 0, w: W, x: (q, t) => lerp(S0.x, T.x, eOut(Math.min(1, t / .2))), y: (q, t) => lerp(S0.y, T.y, eOut(Math.min(1, t / .2))), a: (q, t) => t > .45 ? Math.max(0, 1 - (t - .45) / .3) : 1 };
      sp('rocks_eclipse', o); sp('rocks_eclipse', Object.assign({}, o, { add: true, a: (q, t) => .3 * o.a(q, t) })); sfx('slash'); await fw(200); sfx('explode');
      X().burst(T.x, T.y, { r: E * .5, color: '#e62846' }); X().ring(T.x, T.y, { r1: E * 1.1, color: '#ff4a6a', w: 9, life: .4 }); X().particles({ x: T.x, y: T.y, n: 22, spd: [E * .8, E * 2.2], life: [.3, .6], size: [3, 7], colors: ['#ff4a6a', '#ffffff', '#5a0a1a'], shape: 'spark', add: true });
      X().flash('#ffd0d8', .12, .2); hit(A); await fw(430); },
    rocks_kill: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.rocks_kill; sfx('dark'); X().tint('#10001a', 1.5, .45);
      const T = { x: e.x, y: e.y - E * .02 }, W = Math.max(u * 1.8, (Math.abs(T.x - f.x) + E * .5) / (an.hit[0] - an.o[0]));
      X().glow(f.x, f.y, { color: '#a63cff', r: u * .5, life: .45, hold: true }); mv(A.S, 'lunge'); await fw(200); sfx('slash');
      const o = { life: 1.0, ax: an.hit[0], ay: an.hit[1], fx: d < 0, w: W, x: T.x, y: T.y, a: (q, t) => t > .7 ? Math.max(0, 1 - (t - .7) / .3) : 1, clip: (c, x0, y0, w, h, q, t) => { const k = eOut(Math.min(1, t / .14)); c.rect(x0, y0 - h, w * k + 2, h * 3); } };
      sp('rocks_kill', o); sp('rocks_kill', Object.assign({}, o, { add: true, a: (q, t) => .3 * o.a(q, t) })); await fw(140); sfx('explode'); sfx('heavy');
      X().burst(T.x, T.y, { r: E * .6, color: '#aa3cff' }); X().ring(T.x, T.y, { r1: E * 1.3, color: '#e04cff', w: 10, life: .45 }); X().ring(T.x, T.y, { r1: E * .9, color: '#ff3a5a', w: 6, life: .5 });
      X().flash('#e8d0ff', .16, .3); hit(A); await fw(220); hit(A); await fw(420); },
    rocks_secret: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; sfx('dark'); X().tint('#10001a', 1.8, .5);
      X().glow(f.x, f.y, { color: '#a63cff', r: u * .6, life: .5, hold: true }); X().ring(f.x, f.bot - 4, { r1: u * .7, flat: .25, color: '#e04cff', w: 8, life: .4 });
      await fw(260); sfx('whoosh'); mv(A.S, 'dash'); X().particles({ x: f.x, y: f.y, jx: u * .2, jy: u * .3, n: 18, ang: d > 0 ? [PI - .3, PI + .3] : [-.3, .3], spd: [u * 1, u * 2.4], life: [.2, .4], size: [2, 5], colors: ['#e04cff', '#ff3a5a', '#ffffff'], shape: 'spark', add: true });
      await fw(240); sfx('explode'); sfx('heavy');
      const W = Math.min(Math.max(E * 2.6, u * 2), visW() * .9), o = { life: 1.1, w: W, ax: .5, ay: .55, x: e.x, y: e.y, s: (q, t) => t < .12 ? .3 + .8 * (t / .12) : 1.1 + .1 * eOut((t - .12) / 1), a: (q, t) => t > .7 ? Math.max(0, 1 - (t - .7) / .4) : 1, r: (q, t) => t * .3 * d };
      sp('rocks_secret', o); sp('rocks_secret', Object.assign({}, o, { add: true, a: (q, t) => (t < .3 ? .6 * (1 - t / .3) : 0) }));
      X().flash('#ffffff', .2, .45); X().ring(e.x, e.y, { r1: W * .55, color: '#ffffff', w: 10, life: .35 }); X().ring(e.x, e.bot - 4, { r1: E * 1.6, flat: .25, color: '#e04cff', w: 14, life: .6 });
      X().particles({ x: e.x, y: e.y, n: 30, spd: [E * .9, E * 2.8], life: [.4, .9], size: [4, 10], colors: ['#3a1a30', '#5a2a4a', '#1a0a14'], shape: 'shard', g: 800 }); shake(); hit(A); await fw(200); shake(); hit(A); await fw(500); },

    /* ═════ v205 ═════ 克洛克達爾、巨人篇魯夫、青雉、大熊、密佛格（七武海） */
    /* 克洛克達爾「沙嵐（沙塵暴）」v206：天色轉為黃沙 → 沙塵被吸進克洛克達爾高舉的手 → 主沙暴＋兩道小沙暴貼地平移 → 吞沒對手、沙流螺旋上升連打 → 沙暴炸散 */
    croc_storm: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.croc_storm.base, FW = FXE.W, FH = FXE.H; sfx('sand'); X().tint('#3a2200', 3.4, .55); mv(A.S, 'float');
      /* 全畫面沙塵：斜向飄動的沙線，強度隨時間升降 */
      const SL = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), l: .03 + Math.random() * .08, v: .25 + Math.random() * .5, w: 1 + Math.random() * 2.5 }));
      FXE.add({ life: 3.3, draw(c, q, dt, t) { const k = Math.min(1, t / .5) * Math.min(1, (3.3 - t) / .6); if (k <= 0) return; c.lineCap = 'round';
        SL.forEach(s => { const x = ((s.x + d * s.v * t) % 1 + 1) % 1 * FW, y = s.y * FH + Math.sin(t * 3 + s.x * 9) * 8; c.strokeStyle = `rgba(232,196,128,${.32 * k})`; c.lineWidth = s.w; c.beginPath(); c.moveTo(x, y); c.lineTo(x - d * s.l * FW, y + s.l * FW * .18); c.stroke(); }); } });
      try { X().cracks(f.x, f.bot - 2, { n: 6, len: u * .45 }); } catch (er) { }
      const hand = { x: f.x + d * u * .12, y: f.top + u * .18 };
      for (let k = 0; k < 4; k++) { const a0 = Math.random() * TAU;
        X().particles({ x: hand.x + Math.cos(a0) * u * .7, y: hand.y + Math.sin(a0) * u * .5, jx: u * .3, jy: u * .3, n: 12, spd: [-u * 1.4, -u * .6], life: [.3, .5], size: [2, 5], colors: ['#f0d8a0', '#d0a060', '#fff0c8'], shape: 'sand' }); await fw(90); }
      X().glow(hand.x, hand.y, { color: '#ffd890', r: u * .3, life: .45, hold: true }); X().ring(f.x, f.bot - 4, { r1: u * 1.1, flat: .25, color: '#e8c080', w: 10, life: .55 }); sfx('whoosh'); await fw(160);
      const H = Math.min(Math.max(E * 2, u * 1.7), (Math.min(e.bot, f.bot) - visTop()) * 1.02), img = get('croc_storm'), W = Math.min(H * (ready(img) ? img.naturalWidth / img.naturalHeight : 1), visW() * .9);
      const X0 = f.x + d * (u * .25 + W * .3), Y0 = f.bot + u * .03, X1 = e.x, Y1 = e.bot + E * .03, TR = .85, mvq = t => eIO(Math.min(1, t / TR)), END = 2.25;
      const o = { life: END + .25, w: W, ax: an[0], ay: an[1], fx: d < 0, x: (q, t) => lerp(X0, X1, mvq(t)) + Math.sin(t * 11) * E * .04, y: (q, t) => lerp(Y0, Y1, mvq(t)), sy: (q, t) => Math.min(1, eOut(t / .22)),
        s: (q, t) => (t < TR ? .8 + .2 * mvq(t) : t < END - .2 ? 1 + .18 * eOut((t - TR) / .4) : 1.18 + .5 * eOut((t - END + .2) / .45)) * (.95 + .05 * Math.sin(t * 16)), r: (q, t) => Math.sin(t * 8) * .045 - d * .06 * Math.sin(Math.min(1, t / TR) * PI),
        a: (q, t) => t > END - .2 ? Math.max(0, 1 - (t - END + .2) / .45) : Math.min(1, t / .1) };
      sp('croc_storm', o); sp('croc_storm', Object.assign({}, o, { add: true, a: (q, t) => (.2 + (t > END - .3 && t < END ? .5 : 0)) * o.a(q, t) }));
      /* 兩道小沙暴跟在主沙暴兩側 */
      [[-.32, .55, .15], [.28, .48, .3]].forEach(([dx, sc, dl]) => { const o2 = Object.assign({}, o, { life: END, w: W * sc, fx: d > 0, x: (q, t) => lerp(X0, X1, mvq(Math.max(0, t - dl))) + d * dx * W + Math.sin(t * 13 + dl) * E * .05,
        a: (q, t) => (t < dl ? 0 : Math.min(.8, (t - dl) / .15)) * (t > END - .45 ? Math.max(0, 1 - (t - END + .45) / .4) : 1), s: (q, t) => .9 + .1 * Math.sin(t * 18 + dl * 9) }); sp('croc_storm', o2); });
      for (let k = 0; k < 5; k++) { await fw(160); const q = mvq(.16 * (k + 1)); X().particles({ x: lerp(X0, X1, q), y: lerp(Y0, Y1, q) - 6, jx: W * .25, n: 14, ang: [-PI / 2 - .9, -PI / 2 + .9], spd: [u * .3, u * 1], life: [.4, .8], size: [3, 8], colors: ['#e8c890', '#b8884a', '#7a5428'], shape: 'sand', g: 200 }); if (k % 2) sfx('sand'); }
      sfx('heavy'); X().ring(e.x, e.bot - 4, { r1: E * 1.6, flat: .25, color: '#ffe0a0', w: 12, life: .5 }); shake();
      for (let k = 0; k < 8; k++) { await fw(k ? 120 : 40); sfx(k % 2 ? 'sand' : 'hit'); const y = e.bot - E * (.1 + .8 * Math.random()), sgn = k % 2 ? 1 : -1;
        X().particles({ x: e.x + sgn * E * .35, y, jx: E * .1, n: 10, ang: [-PI / 2 - .3 + sgn * .6, -PI / 2 + .3 + sgn * .6], spd: [E * .8, E * 1.8], life: [.3, .6], size: [3, 7], colors: ['#f0d8a0', '#b8884a', '#7a5428'], shape: 'sand', g: -60 });
        X().burst(e.x + (Math.random() - .5) * E * .4, y, { r: E * .16, color: '#ffdc96' }); if (k % 2 === 0) hit(A); }
      await fw(120); sfx('explode'); sfx('heavy');
      X().burst(e.x, e.y, { r: E * .9, color: '#ffd68c' }); X().ring(e.x, e.y, { r1: W * .6, color: '#fff0c8', w: 14, life: .5 }); X().ring(e.x, e.bot - 4, { r1: E * 2, flat: .25, color: '#e8c080', w: 16, life: .6 });
      X().particles({ x: e.x, y: e.y, n: 50, spd: [E * 1, E * 3.2], life: [.5, 1], size: [3, 9], colors: ['#f0d8a0', '#b8884a', '#7a5428', '#fff0c8'], shape: 'sand', g: 300 });
      try { X().cracks(e.x, e.bot - 2, { n: 10, len: E * 1 }); } catch (er) { } X().flash('#ffe8c0', .26, .4); shake(); hit(A); await fw(200); shake(); await fw(520); },
    /* 克洛克達爾「沙漠寶刀」：沙之刃由左到右劃開對手（裁切展開）→ 沙塵爆散 */
    croc_sabre: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.croc_sabre.c; sfx('sand'); mv(A.S, 'lunge');
      const dist = Math.abs(e.x - f.x), W = Math.min(Math.max(E * 2.4, dist * 1.05), visW() * .95), T = { x: e.x, y: e.y - E * .02 };
      X().particles({ x: f.x + d * u * .2, y: f.y, jx: u * .2, jy: u * .2, n: 12, spd: [u * .3, u * .8], life: [.3, .6], size: [2, 5], colors: ['#f0d8a0', '#d0a060'], shape: 'sand', g: 40 }); await fw(140); sfx('slash');
      const o = { life: .9, w: W, ax: an[0], ay: an[1], fx: d < 0, x: T.x, y: T.y, a: (q, t) => t > .55 ? Math.max(0, 1 - (t - .55) / .35) : 1, clip: (c, x0, y0, w, h, q, t) => { const k = eOut(Math.min(1, t / .2)); c.rect(x0, y0 - h, w * k + 2, h * 3); } };
      sp('croc_sabre', o); sp('croc_sabre', Object.assign({}, o, { add: true, a: (q, t) => .35 * o.a(q, t) })); await fw(170); sfx('hit'); sfx('sand');
      X().burst(T.x, T.y, { r: E * .5, color: '#ffd278' }); X().ring(T.x, T.y, { r1: E * 1, color: '#ffe0a0', w: 8, life: .4 });
      X().particles({ x: T.x, y: T.y, n: 26, spd: [E * .7, E * 2], life: [.4, .8], size: [3, 7], colors: ['#e8c890', '#b8884a', '#fff0c8'], shape: 'sand', g: 200 }); X().flash('#fff0d0', .12, .2); hit(A); await fw(450); },
    /* 巨人篇魯夫「解放的鼓動」：雲霧龍捲在魯夫身後升起、頂端的太陽與尼卡剪影隨鼓聲脈動 */
    luffy_drum: async A => { const f = A.f, u = f.h, an = AN.luffy_drum.base; sfx('drum'); X().tint('#2a2200', 1.9, .3); mv(A.S, 'float');
      const H = Math.min(u * 2.1, (f.bot - visTop()) * 1.02), img = get('luffy_drum'), W = H * (ready(img) ? img.naturalWidth / img.naturalHeight : .73);
      back(A.S, 'luffy_drum', { x: f.x, y: f.bot + u * .03, w: W, ax: an[0], ay: an[1], dur: 1900,
        kf: [{ opacity: 0, transform: 'scale(.6,.2)', easing: 'cubic-bezier(.2,.9,.3,1.2)' }, { opacity: 1, transform: 'scale(1,1.02)', offset: .22 }, { opacity: 1, transform: 'scale(1.03,1.05)', offset: .4 }, { opacity: 1, transform: 'scale(1,1)', offset: .55 },
          { opacity: 1, transform: 'scale(1.03,1.05)', offset: .72 }, { opacity: 0, transform: 'scale(1.08,1.14)' }] });
      X().ring(f.x, f.bot - 4, { r1: u * .9, flat: .25, color: '#fff2b0', w: 9, life: .55 });
      const sun = { x: f.x, y: f.bot - H * .86 };
      for (let k = 0; k < 4; k++) { await fw(k ? 330 : 380); sfx('drum'); X().ring(sun.x, sun.y, { r1: u * .55, color: '#ffe680', w: 7, life: .45 }); X().glow(sun.x, sun.y, { color: '#fff2b0', r: u * .25, life: .35 });
        X().particles({ x: f.x, y: f.y, jx: u * .35, jy: u * .4, n: 10, ang: [-PI / 2 - .6, -PI / 2 + .6], spd: [u * .3, u * .8], life: [.5, .9], size: [6, 12], colors: ['#ffffff', '#fff0c8'], shape: 'smoke', g: -40 }); }
      X().flash('#fffbe0', .14, .3); await fw(420); },
    /* 青雉「冰河時期」：寒氣從青雉腳下沿地面衝出 → 冰山群在對手腳下拔地而起 → 整片冰原閃光凍結 */
    aokiji_age: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.aokiji_age.base; sfx('ice'); X().tint('#001a2a', 2.1, .5); mv(A.S, 'stomp');
      X().ring(f.x, f.bot - 4, { r1: u * .9, flat: .25, color: '#bfeaff', w: 10, life: .5 });
      for (let k = 0; k < 5; k++) { const x = lerp(f.x, e.x, (k + 1) / 6); X().particles({ x, y: e.bot - 6, jx: E * .1, n: 8, ang: [-PI / 2 - .5, -PI / 2 + .5], spd: [E * .4, E * 1], life: [.3, .6], size: [3, 7], colors: ['#ffffff', '#bfeaff', '#6ac0ff'], shape: 'shard', g: 500 }); await fw(60); }
      sfx('ice'); sfx('heavy'); const W = Math.min(Math.max(E * 3.2, u * 2.6), visW() * .98, (e.bot - visTop()) * 2 * .92);
      const o = { life: 1.7, w: W, ax: an[0], ay: an[1], fx: d < 0, x: e.x, y: e.bot + E * .04, sy: (q, t) => back3(Math.min(1, t / .3)), a: (q, t) => t > 1.25 ? Math.max(0, 1 - (t - 1.25) / .45) : 1 };
      sp('aokiji_age', o); sp('aokiji_age', Object.assign({}, o, { add: true, a: (q, t) => (t < .45 ? .55 * (1 - t / .45) : 0) + (t > .7 && t < .9 ? .4 : 0) }));
      X().ring(e.x, e.bot - 4, { r1: E * 1.7, flat: .25, color: '#ffffff', w: 14, life: .6 }); X().particles({ x: e.x, y: e.bot - E * .3, jx: E * .5, n: 36, spd: [E * .6, E * 2.2], life: [.5, 1], size: [3, 8], colors: ['#ffffff', '#bfeaff', '#6ac0ff'], shape: 'shard', g: 700 });
      shake(); hit(A); await fw(300); X().particles({ x: e.x, y: e.top, jx: W * .4, jy: E * .4, n: 40, spd: [E * .05, E * .25], life: [.8, 1.4], size: [2, 5], colors: ['#ffffff', '#dff4ff'], shape: 'snow', g: 60 });
      await fw(330); sfx('ice'); X().flash('#e8f8ff', .2, .35); hit(A); await fw(600); },
    /* 青雉「暴雉嘴」：冰之雉從青雉身前展翅、低空衝向對手 → 冰晶炸開凍結 */
    aokiji_pheasant: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.aokiji_pheasant.c; sfx('ice'); X().tint('#001a2a', 1.5, .4);
      /* 冰雉在青雉身前展翅 → 水平平移穿過對手 → 冰晶炸開 */
      const W = Math.min(Math.max(E * 2.4, u * 2), visW() * .85), Y = e.y - E * .08, X0 = f.x + d * W * .2, X1 = e.x + d * W * .22, TR = .62;
      X().glow(f.x + d * u * .3, Y, { color: '#9adcff', r: u * .4, life: .4, hold: true }); await fw(200); sfx('whoosh'); mv(A.S, 'lunge');
      const px = t => lerp(X0, X1, eIO(Math.min(1, t / TR)));
      const o = { life: 1.0, w: W, ax: an[0], ay: an[1], fx: d < 0, x: (q, t) => px(t), y: (q, t) => Y + Math.sin(t * 16) * E * .015, a: (q, t) => t > TR + .05 ? Math.max(0, 1 - (t - TR - .05) / .4) : Math.min(1, t / .08) };
      sp('aokiji_pheasant', o); sp('aokiji_pheasant', Object.assign({}, o, { add: true, a: (q, t) => .28 * o.a(q, t) }));
      for (let i = 1; i <= 3; i++) { await fw(125); X().particles({ x: px(i * .095) - d * W * .3, y: Y, jx: E * .15, jy: E * .25, n: 12, spd: [E * .1, E * .4], life: [.4, .8], size: [2, 5], colors: ['#ffffff', '#bfeaff'], shape: 'snow', g: 40 }); }
      await fw(60); sfx('ice'); sfx('explode');
      X().burst(e.x, e.y, { r: E * .6, color: '#aae1ff' }); X().ring(e.x, e.y, { r1: E * 1.2, color: '#ffffff', w: 10, life: .45 }); X().ring(e.x, e.bot - 4, { r1: E * 1.3, flat: .25, color: '#9adcff', w: 10, life: .55 });
      X().particles({ x: e.x, y: e.y, n: 30, ang: d > 0 ? [-1, 1] : [PI - 1, PI + 1], spd: [E * .8, E * 2.4], life: [.4, .8], size: [3, 8], colors: ['#ffffff', '#bfeaff', '#6ac0ff'], shape: 'shard', g: 500 }); X().flash('#e8f8ff', .16, .3); hit(A); await fw(520); },
    /* 青雉「冰刀」：冰刃一閃劃過對手（裁切展開）→ 連續冰晶斬擊 */
    aokiji_blade: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.aokiji_blade.c; sfx('ice'); mv(A.S, 'dash');
      const W = Math.min(Math.max(E * 2, u * 1.7), visW() * .8), T = { x: e.x, y: e.y - E * .04 }; await fw(140); sfx('slash');
      const o = { life: .95, w: W, ax: an[0], ay: an[1], fx: d < 0, x: T.x, y: T.y, a: (q, t) => t > .6 ? Math.max(0, 1 - (t - .6) / .35) : 1, clip: (c, x0, y0, w, h, q, t) => { const k = eOut(Math.min(1, t / .16)); c.rect(x0, y0 - h, w * k + 2, h * 3); } };
      sp('aokiji_blade', o); sp('aokiji_blade', Object.assign({}, o, { add: true, a: (q, t) => .35 * o.a(q, t) }));
      for (let k = 0; k < 3; k++) { await fw(k ? 130 : 150); sfx(k ? 'hit' : 'ice'); const x = T.x + (Math.random() - .5) * E * .5, y = T.y + (Math.random() - .5) * E * .5;
        X().burst(x, y, { r: E * .25, color: '#beebff' }); X().particles({ x, y, n: 12, spd: [E * .5, E * 1.6], life: [.3, .6], size: [2, 6], colors: ['#ffffff', '#bfeaff', '#6ac0ff'], shape: 'shard', g: 400 }); hit(A); }
      X().flash('#e8f8ff', .1, .2); await fw(420); },
    /* 大熊「肉球砲」：肉球形的壓縮空氣連續射出 → 一顆顆打在對手身上 */
    kuma_paw: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.kuma_paw.paw, S0 = { x: f.x + d * u * .3, y: f.y - u * .05 };
      sfx('pop'); mv(A.S, 'stretch'); const W = Math.min(Math.max(E * 1.9, u * 1.5), visW() * .8);
      for (let v = 0; v < 3; v++) { const T = { x: e.x - d * E * .05, y: e.y - E * (.12 - v * .12) };
        const o = { life: .55, w: W * (.75 + v * .12), ax: an[0], ay: an[1], fx: d < 0, x: (q, t) => lerp(S0.x, T.x, eOut(Math.min(1, t / .2))), y: (q, t) => lerp(S0.y, T.y, eOut(Math.min(1, t / .2))), s: (q, t) => .5 + .5 * eOut(Math.min(1, t / .2)), a: (q, t) => t > .25 ? Math.max(0, 1 - (t - .25) / .28) : 1 };
        sp('kuma_paw', o); sp('kuma_paw', Object.assign({}, o, { add: true, a: (q, t) => .3 * o.a(q, t) })); sfx('whoosh');
        setTimeout(() => { sfx('punch'); X().burst(T.x, T.y, { r: E * .35, color: '#96d2ff' }); X().ring(T.x, T.y, { r1: E * .8, color: '#ffffff', w: 7, life: .3 }); X().particles({ x: T.x, y: T.y, n: 10, spd: [E * .4, E * 1.2], life: [.3, .6], size: [6, 12], colors: ['#e6f5ff'], shape: 'smoke', g: -20 }); hit(A); }, 200 / (window.BSPEED || 1));
        await fw(230); }
      X().flash('#e8f4ff', .1, .2); await fw(450); },
    /* 大熊「痛苦泡泡」：痛苦泡泡直接在對手身上鼓起、晃動 → 炸開 */
    kuma_bubble: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.kuma_bubble.c; sfx('dark'); X().tint('#0a0a2a', 1.6, .4); mv(A.S, 'float');
      X().glow(f.x, f.y, { color: '#9ac8ff', r: u * .4, life: .4, hold: true }); await fw(240); sfx('pop');
      const W = Math.min(Math.max(E * 2, u * 1.6), visW() * .85, (e.y - visTop()) / .55 / .6 * 1.65 / 1.35), T = { x: e.x, y: e.y - E * .02 };
      const o = { life: 1.25, w: W, ax: an[0], ay: an[1], fx: d < 0, x: T.x, y: T.y, s: (q, t) => t < .25 ? back3(t / .25) * (1 + Math.sin(t * 40) * .02) : t < .8 ? 1 + Math.sin(t * 22) * .035 : 1 + eOut((t - .8) / .45) * .35, a: (q, t) => t > .8 ? Math.max(0, 1 - (t - .8) / .4) : 1 };
      sp('kuma_bubble', o); sp('kuma_bubble', Object.assign({}, o, { add: true, a: (q, t) => (t > .78 && t < 1 ? .6 : .12) * o.a(q, t) }));
      await fw(780); sfx('explode'); sfx('heavy');
      X().burst(T.x, T.y, { r: E * .7, color: '#aad2ff' }); X().ring(T.x, T.y, { r1: E * 1.4, color: '#ffffff', w: 12, life: .45 }); X().ring(T.x, T.y, { r1: E * 1, color: '#6a8aff', w: 7, life: .5 });
      X().particles({ x: T.x, y: T.y, n: 30, spd: [E * .8, E * 2.4], life: [.4, .8], size: [4, 10], colors: ['#ffffff', '#cfe4ff', '#8aaaff'], shape: 'glow', add: true, g: 80 }); X().flash('#eef4ff', .18, .3); shake(); hit(A); await fw(480); },
    /* 大熊「毀滅光炮」v207：負面狀態化成黑霧被彈飛、回復光與護盾 → 巨大熊掌在對手身上展開 → 旋轉著向內塌縮成一點（周圍的光與空氣被吸進去）→ 大爆炸 */
    kuma_implode: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; sfx('ult'); X().tint('#000a24', 3.6, .62);
      const C = { x: e.x, y: e.y - E * .05 }, W = Math.min(Math.max(E * 2.6, u * 2), visW() * .9, (C.y - visTop()) * 2 / 1.25);
      const paw = (c, x, y, r, rot) => { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.ellipse(0, r * .2, r * .52, r * .42, 0, 0, TAU);
        [-.9, -.3, .3, .9].forEach(a => { const px = r * .9 * Math.sin(a), py = r * .2 - r * .9 * Math.cos(a), rr = r * (Math.abs(a) > .5 ? .19 : .22); c.moveTo(px + rr, py); c.arc(px, py, rr, 0, TAU); }); c.restore(); };
      /* 1 淨化 */
      X().particles({ x: f.x, y: f.y, jx: u * .2, jy: u * .3, n: 26, spd: [u * .7, u * 1.6], life: [.4, .7], size: [8, 16], colors: ['#28143c', '#46285a'], shape: 'smoke', g: -30 }); sfx('pop');
      X().particles({ x: f.x, y: f.bot - u * .1, jx: u * .35, n: 18, ang: [-PI / 2 - .3, -PI / 2 + .3], spd: [u * .3, u * .8], life: [.6, 1], size: [3, 6], colors: ['#9affc8', '#d0ffe8', '#ffffff'], shape: 'glow', add: true, g: -40 });
      FXE.add({ add: true, life: .9, draw(c, q, dt, t) { const a = Math.sin(Math.min(1, t / .9) * PI) * .55; c.strokeStyle = `rgba(170,215,255,${a})`; c.lineWidth = 3; c.beginPath(); c.ellipse(f.x, f.y, u * .42, u * .55, 0, 0, TAU); c.stroke(); c.fillStyle = `rgba(120,180,255,${a * .12})`; c.fill(); } });
      sfx('buff'); await fw(380);
      /* 2 熊掌在對手身上展開 → 向內塌縮 */
      mv(A.S, 'lunge'); X().glow(f.x + d * u * .3, f.y - u * .05, { color: '#bfe0ff', r: u * .25, life: .4 }); sfx('whoosh');
      const T0 = .35, T1 = 1.25, LIFE = T1 + .08;
      const sc = t => t < T0 ? .6 + .65 * eOut(t / T0) : 1.25 - 1.15 * eIn((t - T0) / (T1 - T0));
      const o = { life: LIFE, w: W, x: C.x, y: C.y, s: sc, r: (q, t) => d * (t < T0 ? .1 * t : .035 + 4.2 * Math.pow((t - T0) / (T1 - T0), 2.2)), a: (q, t) => Math.min(1, t / .15) };
      sp('kuma_implode', o); sp('kuma_implode', Object.assign({}, o, { add: true, a: (q, t) => t < T0 ? .12 : .12 + .3 * (t - T0) / (T1 - T0) }));
      /* 被吸進去的光線與粒子 */
      const SR = Array.from({ length: 36 }, () => ({ a: Math.random() * TAU, r: .6 + Math.random() * .6, l: .15 + Math.random() * .25, w: 1.5 + Math.random() * 3 }));
      FXE.add({ add: true, life: T1, draw(c, q, dt, t) { if (t < T0 * .6) return; const k = (t - T0 * .6) / (T1 - T0 * .6); c.lineCap = 'round';
        SR.forEach(s => { const rr = W * .6 * s.r * (1 - ((k * 1.6 + s.r) % 1)), a = s.a + k * 2 * d; const x1 = C.x + Math.cos(a) * rr, y1 = C.y + Math.sin(a) * rr, x2 = C.x + Math.cos(a) * rr * (1 + s.l), y2 = C.y + Math.sin(a) * rr * (1 + s.l);
          c.strokeStyle = `rgba(200,235,255,${.75 * Math.min(1, k * 3)})`; c.lineWidth = s.w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }); } });
      for (let k = 0; k < 4; k++) { await fw(k ? 220 : T0 * 1000); sfx(k % 2 ? 'zap' : 'dark'); const a0 = Math.random() * TAU;
        X().particles({ x: C.x + Math.cos(a0) * W * .5, y: C.y + Math.sin(a0) * W * .4, jx: W * .35, jy: W * .3, n: 18, spd: [-W * 1.1, -W * .5], life: [.25, .4], size: [2, 5], colors: ['#ffffff', '#bfe0ff', '#6aa8ff'], shape: 'spark', add: true }); }
      await fw(Math.max(0, (T1 - T0) * 1000 - 660)); X().glow(C.x, C.y, { color: '#ffffff', r: E * .22, life: .2 }); await fw(110);
      /* 3 大爆炸 */
      sfx('explode'); sfx('heavy'); sfx('thunder'); X().flash('#ffffff', .4, .5); shake();
      const B = { life: .9, add: true, w: W, x: C.x, y: C.y, s: (q, t) => .25 + 1.45 * eOut(t / .5), r: (q, t) => d * (.6 + t * .8), a: (q, t) => t < .1 ? 1 : Math.max(0, 1 - (t - .1) / .8) };
      sp('kuma_implode', Object.assign({}, B, { add: false, a: (q, t) => .85 * B.a(q, t) })); sp('kuma_implode', Object.assign({}, B, { a: (q, t) => .35 * B.a(q, t) }));
      FXE.add({ add: true, life: .8, draw(c, q, dt, t) { const p = eOut(t / .8), r = E * (.3 + 1.3 * p), a = 1 - p; c.lineWidth = Math.max(2, 14 * a); c.strokeStyle = `rgba(220,240,255,${a})`; c.shadowColor = '#6aa8ff'; c.shadowBlur = 30; paw(c, C.x, C.y, r, 0); c.stroke(); c.shadowBlur = 0; } });
      X().burst(C.x, C.y, { r: E * 1.1, color: '#c8e6ff' }); X().ring(C.x, C.y, { r1: W * .75, color: '#ffffff', w: 16, life: .55 }); X().ring(C.x, C.y, { r1: W * .5, color: '#6aa8ff', w: 10, life: .65 });
      X().ring(e.x, e.bot - 4, { r1: E * 2.2, flat: .25, color: '#bfe0ff', w: 16, life: .7 });
      X().particles({ x: C.x, y: C.y, n: 60, spd: [E * 1, E * 3.4], life: [.5, 1.1], size: [3, 9], colors: ['#ffffff', '#cfe4ff', '#6aa8ff'], shape: 'spark', add: true, g: 160 });
      X().particles({ x: C.x, y: C.y, n: 20, spd: [E * .4, E * 1.2], life: [.7, 1.2], size: [12, 22], colors: ['#dcebff', '#aac8ff'], shape: 'smoke', g: -20 });
      try { X().cracks(e.x, e.bot - 2, { n: 12, len: E * 1.1 }); } catch (er) { } hit(A);
      for (let k = 0; k < 5; k++) { await fw(110); sfx(k % 2 ? 'hit' : 'explode'); X().burst(C.x + (Math.random() - .5) * E * .7, C.y + (Math.random() - .5) * E * .7, { r: E * .3, color: '#bee1ff' }); hit(A); if (k % 2 === 0) shake(); }
      X().flash('#eef6ff', .16, .3); await fw(600); },
    /* 密佛格（七武海）「斬擊」：紫黑色新月斬直接劈在對手身上（裁切展開）→ 斬痕炸裂 */
    mihawk_slash: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.mihawk_slash.c; sfx('dark'); mv(A.S, 'dash');
      const W = Math.min(Math.max(E * 2.1, u * 1.8), visW() * .85), T = { x: e.x, y: e.y - E * .05 }; await fw(130); sfx('slash');
      const o = { life: .95, w: W, ax: an[0], ay: an[1], fx: d < 0, x: T.x, y: T.y, a: (q, t) => t > .55 ? Math.max(0, 1 - (t - .55) / .4) : 1, clip: (c, x0, y0, w, h, q, t) => { const k = eOut(Math.min(1, t / .14)); c.rect(x0, y0 - h, w * k + 2, h * 3); } };
      sp('mihawk_slash', o); sp('mihawk_slash', Object.assign({}, o, { add: true, a: (q, t) => .35 * o.a(q, t) }));
      for (let k = 0; k < 3; k++) { await fw(k ? 120 : 140); sfx(k ? 'hit' : 'slash'); const x = T.x + (Math.random() - .5) * E * .45, y = T.y + (Math.random() - .5) * E * .45;
        X().slash(x, y, { a: -2.6 + Math.random() * .8, span: 1.6, r: E * .45, w: 12, color: '#e0a0ff', life: .28 }); X().burst(x, y, { r: E * .25, color: '#aa46ff' }); hit(A); }
      X().flash('#efd8ff', .12, .2); await fw(420); },
    /* 密佛格（七武海）「劍氣狀態」：紫色劍氣在背後直衝而上、纏繞 */
    mihawk_aura: async A => { const f = A.f, u = f.h, an = AN.mihawk_aura.base; sfx('buff'); X().tint('#14002a', 1.5, .35); mv(A.S, 'float');
      const H = Math.min(u * 1.75, (f.bot - visTop()) * 1.02), img = get('mihawk_aura'), W = H * (ready(img) ? img.naturalWidth / img.naturalHeight : .66);
      back(A.S, 'mihawk_aura', { x: f.x, y: f.bot + u * .03, w: W, ax: an[0], ay: an[1], dur: 1700,
        kf: [{ opacity: 0, transform: 'scale(.7,.15)', easing: 'cubic-bezier(.2,.9,.3,1.25)' }, { opacity: 1, transform: 'scale(1.04,1.06)', offset: .22 }, { opacity: 1, transform: 'scale(1,1)', offset: .34 }, { opacity: 1, transform: 'scale(1.03,1.04)', offset: .62 }, { opacity: 0, transform: 'scale(1.08,1.16)' }] });
      X().ring(f.x, f.bot - 4, { r1: u * .8, flat: .25, color: '#c080ff', w: 9, life: .5 });
      for (let k = 0; k < 3; k++) { X().particles({ x: f.x, y: f.bot - u * .05, jx: u * .4, n: 14, ang: [-PI / 2 - .4, -PI / 2 + .4], spd: [u * .5, u * 1.4], life: [.5, .9], size: [2, 6], colors: ['#e0a0ff', '#9a3aff', '#ffffff'], shape: 'spark', add: true, g: -60 }); await fw(300); }
      sfx('dark'); await fw(560); },
    /* 密佛格（七武海）「洞察弱點」：紅色瞄準鷹眼鎖定在對手身上、閃一下後收縮消失 */
    mihawk_eye: async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h, an = AN.mihawk_eye.c; sfx('zap'); X().tint('#1a0000', 1.3, .4);
      X().glow(f.x, f.top + u * .12, { color: '#ff3a3a', r: u * .18, life: .3 }); await fw(200); sfx('rare');
      const W = Math.min(Math.max(E * 1.5, u * 1.2), visW() * .7), T = { x: e.x, y: e.y - E * .08 };
      const blink = t => (t > .32 && t < .4) || (t > .5 && t < .56) ? .35 : 1;
      const o = { life: 1.15, w: W, ax: an[0], ay: an[1], x: T.x, y: T.y, s: (q, t) => t < .22 ? 1.5 - .5 * eOut(t / .22) : t > .85 ? 1 - .5 * eIn((t - .85) / .3) : 1, r: (q, t) => (1 - eOut(Math.min(1, t / .3))) * .6 * d, a: (q, t) => (t < .1 ? t / .1 : t > .85 ? Math.max(0, 1 - (t - .85) / .3) : 1) * blink(t) };
      sp('mihawk_eye', o); sp('mihawk_eye', Object.assign({}, o, { add: true, a: (q, t) => (t > .22 && t < .34 ? .8 : .15) * o.a(q, t) }));
      await fw(240); sfx('hit'); X().ring(T.x, T.y, { r0: W * .6, r1: W * .1, color: '#ff4a4a', w: 5, life: .3 }); X().flash('#ffd0d0', .1, .15); hit(A, 'shake');
      await fw(300); sfx('zap'); await fw(460); },
  };

  const NOIMG = new Set([]); /* v206：全部用程式畫、不需要素材圖的招式 */
  const keyOf = (actor, skill) => { if (!actor || !skill) return null; const id = skill.copiedFrom && skill.copiedFrom.id ? skill.copiedFrom.id : actor.id; return (MAP[id] && MAP[id][skill.name]) || null; };
  /* 掛在最外層（做法同 fx_imu_v170.js）：其他特效層有些在 DOMContentLoaded 才包上去（fx_v138 主題光環、fx_v140 招牌動畫——凱多的藍色青龍、佩羅娜的小幽靈、
     尼卡的「咚」字——會跟這 8 招的新素材疊在一起），所以這 8 招直接由這裡接手，不再跑通用特效層；其他招式原樣交給內層。 */
  function install() { const cur = window.playChoreo; if (typeof cur !== 'function' || cur.__fx196) return;
    const w = async function (side, actor, idx, skill) { const k = keyOf(actor, skill);
      if (!k || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return cur.apply(this, arguments);
      try { if (!NOIMG.has(k) && !(await need(k))) return cur.apply(this, arguments);
        FXE.ensure(); const S = side === 'P' ? 'L' : 'R', T = S === 'L' ? 'R' : 'L'; await VFX[k]({ S, T, f: pt(S), t: pt(T), d: S === 'L' ? 1 : -1 });
      } catch (e) { console.warn('fx196', e); return cur.apply(this, arguments); } };
    w.__fx196 = true; w.__fx3 = cur.__fx3; w.__vfx = cur.__vfx; w.__imu170 = cur.__imu170; window.playChoreo = w; try { playChoreo = w; } catch (e) { } }
  install(); addEventListener('DOMContentLoaded', () => setTimeout(install, 0)); addEventListener('load', () => setTimeout(install, 0));
  /* 開戰時先把出場角色會用到的素材載好、解碼好（不在場的角色不下載） */
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments);
    try { install(); const b = typeof battle !== 'undefined' && battle; if (b) { const ids = new Set(); (b.team || []).forEach(f => ids.add(f.id)); (b.enemies || []).forEach(f => ids.add(f.id)); if (b.enemy) ids.add(b.enemy.id); if (b.player) ids.add(b.player.id);
        ids.forEach(id => { if (MAP[id]) Object.values(MAP[id]).forEach(k => { if (NOIMG.has(k)) return; const i = get(k); try { if (i.decode) i.decode().catch(() => { }); } catch (e) { } }); }); } } catch (e) { } return r; };
    try { window.startBattle = startBattle; } catch (e) { } }
  window.__fx196 = { VFX, MAP, pt, keyOf };
})();
