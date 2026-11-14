/* v214 合併、v216 依原本的載入順序拆開：技能特效・前期（fx_ult～fx_v111，在 ext.js 之後、roster.js 之前）。檔案邊界以「==== 原 檔名 ====」標記。
   注意：這些檔案會一層層包住 playChoreo 等函式，載入順序必須維持 index.html 現在的排列，否則角色專屬特效會被通用特效蓋掉。 */

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

