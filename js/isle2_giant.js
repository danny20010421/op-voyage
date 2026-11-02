/* v151 艾爾巴夫・寶樹亞當：依原作重做（使用者 11/03：從下方搭彩虹橋上到巨人的國度；建築要不一樣；還原原作）
   原作三層：冥界（海平面、樹冠擋住陽光的雪原）→ 陽界（樹枝上的大地，巨人的村子）→ 天界（樹冠）。
   冥界的西岸登陸（伊達的酒館）→ 七色彩虹橋從海面升到陽界的「西邊村」港口（多利）→ 陽界：森林決鬥、繞過四個村子
   （西邊村・巨人墓地、工匠村・鍛造廣場、獵人村、漁夫村・哈吉爾汀）的試煉跑、北邊的奧魯斯特城（巨樹裡的王城）
   → 樹幹螺旋坡道上天界：三座枝頭平台收集寶樹之果、天空神殿的布洛基 → 東邊的繩索吊橋沿谷壁下到樹根旁的冥界：
   黑色的地底湖、羅德的樂高城、鎖住洛基的鎖鏈（BOSS）。
   座標：x 往東、z 往南。 */
(function () {
  if (!window.ISLE2 || !ISLE2.define) return;
  const T = [0, -10], P = (a, r) => [T[0] + Math.cos(a * Math.PI / 180) * r, T[1] + Math.sin(a * Math.PI / 180) * r];
  const ring = (r, c, n) => { const Q = [], C = c || T; for (let i = 0; i <= (n || 36); i++) { const a = (i / (n || 36) * 360 + 5) * Math.PI / 180; Q.push([C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r]); } return Q; };
  const spiral = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = -90 + t * 510, r = t < .08 ? 58 - (58 - 30) * (t / .08) : t > .94 ? 30 - 8 * ((t - .94) / .06) : 30; spiral.push(P(a, r)); }
  const decks = [[0, 'temple'], [120, 'nest'], [240, 'star']].map(([a, k]) => ({ a, k, c: P(a, 48) }));
  /* 陽界的四個村子（村子中心在離樹幹 100 的位置，各有一圈小街） */
  const V = { west: P(180, 100), craft: P(45, 100), hunt: P(225, 100), fish: P(0, 100) };
  const RAIN = [[-166, -34], [-158, -24], [-146, -14], [-134, -9], [-121, -8]];
  ISLE2.define('giant', {
    SC: 2, ext: 340, vScale: .5, rough: 2.4, base: 3, style: 'norse', fine: 1.5, coarse: 3, houseStep: 5, maxHouses: 80, curb: '#8a7a62', slopeRocks: false,
    grass: '#5e9e44', grass2: '#76b052', sand: '#d8d4cc', sand2: '#e6e4e0', rock: '#6e6a70', rock2: '#86828a', dirt: '#8a6e4a', cobble: '#a49478',
    rcol: { main: '#b8a07a', street: '#ae946c', alley: '#a48a62', lane: '#9a7e58', trail: '#8a8e98' },
    land: [[0, 0, 150, .06], [-156, -14, 28, .1]],
    /* 陽界是半徑 126 的高台（四周是陡峭的崖），中間樹根處往下凹到海平面附近（冥界） */
    terrain: [{ plateau: [T[0], T[1], 126, 26, 6], max: true }, { fn: (dx, dz, sm) => -22 * (1 - sm(46, 54, Math.hypot(dx - T[0], dz - T[1]))) }, { g: [-110, -60, 18, 6] }, { g: [60, 110, 16, 5] }],
    lakes: [{ x: P(165, 36)[0], z: P(165, 36)[1], rx: 9, rz: 6 }, { x: P(0, 117)[0], z: P(0, 117)[1], rx: 7, rz: 5 }],
    waterCol: '#2a3a4a',
    roads: [
      [ring(72), 'main'],
      [[P(180, 72), P(180, 86), [-112, -8], [-121, -8]], 'main'], [ring(12, V.west, 20), 'street'],
      [[P(45, 72), P(45, 88)], 'main'], [ring(12, V.craft, 20), 'street'],
      [[P(225, 72), P(225, 88)], 'main'], [ring(12, V.hunt, 20), 'street'],
      [[P(0, 72), P(0, 88)], 'main'], [ring(12, V.fish, 20), 'street'],
      [[P(-90, 72), P(-90, 58)], 'main'], [[P(-90, 72), P(-90, 92)], 'main'],
      [[P(20, 72), P(20, 61)], 'alley'],
      [[[-154, -18], [-150, -2], [-146, 10]], 'trail'],
      [[P(72, 40), P(110, 34), P(140, 30), P(190, 30), P(225, 30)], 'trail'], [[P(225, 30), P(270, 32), P(310, 32), P(325, 26)], 'trail']],
    skyways: [
      { pts: RAIN, w: 7, style: 'rainbow', arch: 5, posts: false },
      { pts: [P(20, 59), P(34, 55), P(48, 50), P(60, 45), P(72, 40)], w: 4.4, style: 'rope', posts: false },
      { pts: spiral, w: 6, style: 'root', y: [26, 96] }, { pts: ring(22), w: 10, style: 'wood', y: [96, 96], posts: false },
      ...decks.map(d => ({ pts: [P(d.a, 25), P(d.a, 31), P(d.a, 37)], w: 6, style: 'wood', y: [96, 96], posts: false }))],
    landmarks: [
      ['bigtree', T[0], T[1], 0, { key: 'tree', r: 32, h: 190 }],
      ...decks.map(d => ['deck', d.c[0], d.c[1], 0, { key: d.k, y: 96, w: 40, d: 40, gap: [P(d.a, 37)] }]),
      /* 冥界：鎖鏈、樂高城、古代遺跡 */
      ['chains', ...P(225, 36), 0, { key: 'chains' }], ['legocastle', ...P(330, 34), -Math.PI / 2 - .5, { key: 'lego', s: .9 }], ['ruin', ...P(290, 38), .4, { c: '#5a5662', w: 12, d: 10, h: 2 }],
      /* 冥界的西岸：伊達的酒館、船 */
      ['tavern', -146, 14, Math.PI / 2, { key: 'ida' }], ['bigship', -184, -26, .5, { s: 1.4, sail: '#e8dcc0', hull: '#6a4a30' }], ['boat', -172, -6, 1.2, {}],
      /* 陽界：西邊村的港口廣場與巨人墓地、工匠村的鍛造廣場、漁夫村與獵人村的井、北邊巨樹裡的奧魯斯特城 */
      ['plaza', -114, -9, 0, { r: 6 }], ['graveyard', -104, -44, 0, { key: 'graves', r: 12 }], ['plaza', ...V.craft, 0, { r: 6, fountain: 0 }], ['well', ...V.fish, 0, {}], ['well', ...V.hunt, 0, {}],
      ['bigtree', 0, -122, 0, { key: 'aurust', r: 10, h: 70 }], ['fort', 0, -102, Math.PI, { key: 'castle' }]],
    town: [[...V.west, 24, 1, 'norse', 2, 'west'], [...V.craft, 24, 1, 'norse', 2, 'craft'], [...V.hunt, 24, 1, 'norse', 2, 'hunt'], [...V.fish, 22, 1, 'norse', 2, 'fish']],
    groves: [[0, 96, 26, 34, 'pine'], [-62, 66, 16, 16], [96, 50, 12, 10, 'pine'], [-40, -112, 16, 14, 'pine'], [56, -96, 18, 20], [-150, 24, 8, 8, 'snowpine'], [-34, 4, 6, 6, 'snowpine'], [10, 34, 6, 5, 'snowpine']],
    rocks: [[-164, 4, 10, 8], [P(260, 40)[0], P(260, 40)[1], 6, 5]],
    colorFn: (x, y, z, c) => { if (c.water) return null; const d = Math.hypot(x / 2 - T[0], z / 2 - T[1]);
      if (y < 15) { if (c.rc) return c.mix('#8a8e98', '#9a9ea8', c.n2); const dark = d < 58 ? .38 : 0; return c.mix(c.mix('#eef2f8', '#d2dae6', c.n2), '#6e7888', Math.min(.8, dark + Math.max(0, (c.slope || 0) - 1.2) * .3)); }
      if (y < 25.5 && (c.slope || 0) > 1.6) return c.mix(c.mix('#7a6a58', '#8e7c66', c.n2), '#5e5048', (Math.sin(y * 1.7 + c.n * 3) * .5 + .5) * .5); /* 陽界的崖：一層層的岩層 */
      return null; },
    story: {
      spawn: [-150, -2], boss: [-18, -28], spots: [[60, 60], [-62, 60], [-96, -62], [70, -70], [20, -100]],
      route: [[-150, -2], [-154, -18], [-158, -24], [-121, -8], [-108, -2], [-72, -10], [0, 82], [-51, 51], [-70, -81], [0, -82], [0, -68], [48, -10], [92, -2], [20, 61], [72, 40], [-18, -28]],
      npcs: { dorry: [-106, 2], brogy: [48, -2], hajrudin: [92, 2] },
      steps: { 0: { desc: '從冥界的海邊走上七色彩虹橋，到陽界西邊村的港口和巨人多利說話。' },
        2: { points: [P(170, 86), P(225, 86), P(270, 80), P(0, 86), P(45, 86)], desc: '艾爾巴夫的戰士要在時間內跑過陽界的四個村子：西邊村、獵人村、北邊的城、漁夫村、工匠村。' },
        3: { spots: decks.map(d => P(d.a, 50)), desc: '天界：從北邊的樹幹螺旋坡道爬上樹冠，在三座枝頭平台（天空神殿、巨鳥之巢、觀星台）收集寶樹之果。' },
        5: { desc: '到天界的天空神殿找布洛基、到陽界東邊的漁夫村找哈吉爾汀，得到巨人們的認可。' },
        6: { pos: [-22, -32], r: 10, desc: '冥界：從東邊的繩索吊橋沿著谷壁往下，走進樹冠下的冥界，找到鎖住王子的鎖鏈。' } },
      env: { fogR: [240, 860] } }
  });
})();
