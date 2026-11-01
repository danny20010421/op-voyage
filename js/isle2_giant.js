/* v147 艾爾巴夫・寶樹亞當：新版關卡（使用者 11/02：以巨樹樹幹為中心，冥界／中間生活／天界三層，每層有故事背景，玩家透過每層的任務了解劇情）
   人界（中層台地）：南邊港口登陸 → 坡道上台地 → 巨人戰士的競技場（多利）→ 環樹大道上的巨人村落、長老會堂（哈吉爾汀）→ 戰士的試煉跑（環繞台地）
   天界（樹冠）：北邊的樹幹螺旋坡道爬一圈半到天界 → 環樹平台 → 三座枝頭平台（天空神殿・布洛基、巨鳥之巢、觀星台）收集寶樹之果
   冥界（樹根之下的谷底）：東邊沿谷壁往下的坡道 → 谷底的冥界：黑色的地底湖、古代墓所、樹根間垂下的鎖鏈 → 被鎖住的王子（BOSS）。
   座標：x 往東、z 往南。 */
(function () {
  if (!window.ISLE2 || !ISLE2.define) return;
  const T = [0, -10], P = (a, r) => [T[0] + Math.cos(a * Math.PI / 180) * r, T[1] + Math.sin(a * Math.PI / 180) * r];
  const ring = r => { const Q = []; for (let i = 0; i <= 36; i++) Q.push(P(i * 10 + 5, r)); return Q; };
  const spiral = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = -90 + t * 510, r = t < .08 ? 58 - (58 - 30) * (t / .08) : t > .94 ? 30 - 8 * ((t - .94) / .06) : 30; spiral.push(P(a, r)); }
  const decks = [[0, 'temple'], [120, 'nest'], [240, 'star']].map(([a, k]) => ({ a, k, c: P(a, 48) }));
  ISLE2.define('giant', {
    SC: 2, ext: 340, vScale: .5, rough: 3, base: 26, style: 'wood', fine: 1.5, coarse: 3, houseStep: 6, maxHouses: 60, curb: '#8a7a62',
    grass: '#5e9e44', grass2: '#76b052', sand: '#d8cca4', sand2: '#e4d8b4', rock: '#7a6e60', rock2: '#8e8270', dirt: '#8a6e4a', cobble: '#a49478',
    rcol: { main: '#b8a07a', street: '#ae946c', alley: '#a48a62', lane: '#9a7e58', trail: '#8e7450' },
    land: [[0, 0, 150, .07]],
    terrain: [{ fn: (dx, dz, sm) => -22 * (1 - sm(46, 54, Math.hypot(dx - T[0], dz - T[1]))) }, { g: [0, 146, 22, -14] }, { g: [-110, -60, 22, 10] }, { g: [100, 60, 20, 8] }],
    lakes: [{ x: P(150, 34)[0], z: P(150, 34)[1], rx: 9, rz: 6 }],
    roads: [
      [[[0, 140], [0, 120], [0, 100], [0, 76], [0, 62]], 'main'], [ring(72), 'main'],
      [[P(180, 72), P(180, 92), [-92, -10]], 'street'], [[P(0, 72), P(0, 100), P(0, 120)], 'street'], [[P(-90, 72), P(-90, 58)], 'main'],
      [[P(45, 72), P(45, 100)], 'alley'], [[P(135, 72), P(135, 100)], 'alley'], [[P(-45, 72), P(-45, 100)], 'alley'], [[P(-135, 72), P(-135, 100)], 'alley'],
      [[P(30, 72), P(30, 56), P(50, 48), P(80, 42), P(105, 38), P(120, 34)], 'lane'],
      [[P(120, 34), P(150, 30), P(190, 30), P(225, 30)], 'trail'], [[P(225, 30), P(270, 32), P(310, 32)], 'trail']],
    skyways: [{ pts: spiral, w: 6, style: 'root', y: [26, 96] }, { pts: ring(22), w: 10, style: 'wood', y: [96, 96], posts: false },
      ...decks.map(d => ({ pts: [P(d.a, 25), P(d.a, 31), P(d.a, 37)], w: 6, style: 'wood', y: [96, 96], posts: false }))],
    landmarks: [
      ['bigtree', T[0], T[1], 0, { key: 'tree', r: 32, h: 190 }],
      ...decks.map(d => ['deck', d.c[0], d.c[1], 0, { key: d.k, y: 96, w: 40, d: 40, gap: [P(d.a, 37)] }]),
      ['chains', ...P(225, 36), 0, { key: 'chains' }], ['ruin', ...P(300, 36), .4, { c: '#5a5662', w: 12, d: 10, h: 2 }], ['ruin', ...P(330, 38), -.3, { c: '#5a5662', w: 9 }],
      ['colosseum', 36, 96, Math.PI / 2, { key: 'arena', r: 24, c: '#a8906c' }], ['palace', -100, -10, Math.PI / 2, { key: 'hall', c: '#a07a52', dome: '#6e8a4a', w: 30, d: 20 }],
      ['plaza', 0, 112, 0, { r: 8, fountain: 1 }], ['bigship', 0, 158, 0, { s: 1.4, sail: '#e8dcc0', hull: '#6a4a30' }], ['bigship', -30, 150, .4, { s: 1.1, sail: '#e8dcc0' }]],
    town: [[T[0], T[1], 128, 1, 'wood', 2]],
    groves: [[90, -80, 30, 40, 'pine'], [-90, 80, 30, 30], [100, 60, 24, 24], [-110, -60, 26, 30, 'pine'], [60, 120, 18, 12]],
    rocks: [[-130, 40, 16, 10], [130, -20, 16, 10]],
    colorFn: (x, y, z, c) => { const d = Math.hypot(x / 2 - T[0], z / 2 - T[1]); if (d < 50 && !c.rc) return c.mix(c.mix('#3e3a46', '#4e4856', c.n2), '#5a4a6a', c.n * .4); if (d < 50) return c.mix('#5a5262', '#6a6070', c.n2); return null; },
    story: {
      spawn: [0, 126], boss: [-18, -28], spots: [[60, 60], [-70, 60], [-90, -60], [70, -70], [20, -100]],
      route: [[0, 126], [0, 100], [16, 96], [0, 62], [-51, 41], [-68, -35], [-25, -78], [36, -72], [68, 15], [0, -68], [48, -10], [-24, 32], [-24, -52], [26, 26], [-18, -28]],
      npcs: { dorry: [16, 96], brogy: [48, -2], hajrudin: [-82, -6] },
      steps: { 2: { points: [P(135, 72), P(200, 72), P(250, 72), P(300, 72), P(20, 72)] },
        3: { spots: decks.map(d => P(d.a, 50)), desc: '天界：從北邊的樹幹螺旋坡道爬上樹冠，在三座枝頭平台（天空神殿、巨鳥之巢、觀星台）收集寶樹之果。' },
        5: { desc: '天界與人界：到天空神殿的平台找布洛基、到長老會堂找哈吉爾汀，得到巨人們的認可。' },
        6: { pos: [-22, -32], r: 10, desc: '冥界：從東邊沿著谷壁往下的坡道走進樹根之下的冥界，找到鎖住王子的鎖鏈。' } },
      env: { fogR: [240, 860] } }
  });
})();
