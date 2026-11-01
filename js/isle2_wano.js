/* v147 和之國：新版關卡（使用者 11/02：很多島嶼組成，中央的核心島嶼作為決戰地）
   六大地區各是一座島，用紅色拱橋一座接一座連成一圈；中央是鬼之島（骷髏頭、山頂的城）：
   九里（荒地、光月御田的城跡、阿玉的小屋，登陸）→ 兔丼（採石場監獄、河松）→ 希望（果園港町）→ 白舞（鳥居、稻田）→ 鈴後（雪原、刀的墓場）
   → 花之都（城下町、歐羅契城、日和、傳次郎）→ 花之都南岸的「鬼之島渡口」長橋 → 鬼之島（大和、燼、山頂決戰 BOSS）。
   座標：x 往東、z 往南。 */
(function () {
  if (!window.ISLE2 || !ISLE2.define) return;
  const R0 = 100, RG = [['flower', -90, 46], ['ringo', -30, 32], ['hakumai', 30, 32], ['kibi', 90, 32], ['udon', 150, 32], ['kuri', 210, 34]].map(([id, a, r]) => ({ id, a: a * Math.PI / 180, r, c: [Math.cos(a * Math.PI / 180) * R0, Math.sin(a * Math.PI / 180) * R0] }));
  const G = id => RG.find(g => g.id === id), roads = [], skyways = [], land = [[0, 4, 34, .1]], towns = [];
  RG.forEach((g, i) => { const n = RG[(i + 1) % 6], dx = n.c[0] - g.c[0], dz = n.c[1] - g.c[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
    g.out = [g.c[0] + ux * (g.r - 7), g.c[1] + uz * (g.r - 7)]; n.inn = [n.c[0] - ux * (n.r - 7), n.c[1] - uz * (n.r - 7)];
    skyways.push({ pts: [g.out, [(g.out[0] + n.inn[0]) / 2, (g.out[1] + n.inn[1]) / 2], n.inn], w: 5, style: 'red', arch: 5 });
    land.push([g.c[0], g.c[1], g.r, .14]); });
  RG.forEach(g => { roads.push([[g.inn, [g.c[0] + (g.inn[0] - g.c[0]) * .35, g.c[1] + (g.inn[1] - g.c[1]) * .35], g.c, [g.c[0] + (g.out[0] - g.c[0]) * .35, g.c[1] + (g.out[1] - g.c[1]) * .35], g.out], 'main']);
    const rr = g.r * .45, P = []; for (let k = 0; k <= 20; k++) { const a = k / 20 * 6.2832; P.push([g.c[0] + Math.cos(a) * rr, g.c[1] + Math.sin(a) * rr]); } roads.push([P, 'street']);
    const ox = Math.cos(g.a), oz = Math.sin(g.a); roads.push([[[g.c[0] + ox * rr, g.c[1] + oz * rr], [g.c[0] + ox * (g.r - 6), g.c[1] + oz * (g.r - 6)]], 'alley']); });
  /* 花之都：多一條往北到城、往南到渡口的大道，東西兩條街 */
  roads.push([[[0, -100], [0, -114], [0, -122]], 'main'], [[[0, -100], [0, -78], [0, -60]], 'main'], [[[-30, -86], [0, -84], [30, -86]], 'street'], [[[-30, -114], [-14, -112], [14, -112], [30, -114]], 'street'], [[[-16, -112], [-20, -86]], 'alley'], [[[16, -112], [20, -86]], 'alley']);
  skyways.push({ pts: [[0, -60], [0, -46], [0, -31]], w: 6, style: 'red', arch: 3 });
  /* 鬼之島：北坡之字形山路到山頂 */
  roads.push([[[0, -31], [-12, -24], [8, -17], [-6, -11], [0, -6]], 'lane']);
  ISLE2.define('wano', {
    SC: 2, ext: 340, base: 4, vScale: .5, rough: 3.2, style: 'japan', fine: 1.45, houseStep: 4, maxHouses: 170, curb: '#8a8478',
    grass: '#6aa64a', grass2: '#84b85a', sand: '#e4d8b4', sand2: '#ece2c4', rock: '#6e6a66', rock2: '#86807a', dirt: '#9a7e58', cobble: '#9a948a',
    rcol: { main: '#c8bca4', street: '#bcae94', alley: '#b0a088', lane: '#a08a64' },
    land, roads, skyways,
    terrain: [{ g: [0, 6, 16, 22] }, { g: [0, -130, 14, 8] }, { g: [G('ringo').c[0] + 10, G('ringo').c[1] - 6, 12, 8] }, { g: [G('kuri').c[0] - 8, G('kuri').c[1] - 10, 12, 6] }, { g: [G('udon').c[0] - 10, G('udon').c[1] + 6, 10, 7] }],
    piers: [[[0, 128], [0, 142], 1.2], [[14, 124], [24, 138], 1]],
    landmarks: [
      ['jcastle', 0, -132, 0, { key: 'orochi', w: 28, d: 22, tiers: 4 }], ['plaza', 0, -100, 0, { r: 8, fountain: 1 }], ['guild', -16, -92, .5, { key: 'guild', style: 'japan' }],
      ['torii', 0, -70, 0, { w: 8 }], ['torii', 87, 36, Math.PI / 6, { w: 7 }], ['torii', 87, 64, Math.PI / 6, { w: 7 }], ['shrine', 100, 54, -Math.PI / 3, { key: 'shrine' }],
      ['ruin', -100, -64, .4, { c: '#9a948a', w: 10, d: 8, h: 2 }], ['ruin', -86, -70, -.2, { c: '#9a948a', w: 8 }], ['hut', -78, -36, 2.6, { key: 'tama', wall: '#c8b088', roof: '#6e5a3e' }],
      ['graveyard', 96, -56, 0, { r: 12 }], ['tower', -100, 58, 0, { r: 5, h: 16, c: '#5a5650', roof: '#2e3440', win: '#ffb24a' }], ['ruin', -96, 40, .5, { c: '#6e6a66', w: 9 }],
      ['skull', 0, 28, 0, { key: 'skull', r: 15 }], ['jcastle', 0, 12, Math.PI, { key: 'kaido', w: 18, d: 14, tiers: 3, roof: '#5a1e1e' }],
      ['boat', 0, 146, 0, {}], ['boat', 30, 140, .4, {}], ['bigship', -150, -70, 1.2, { s: .8, sail: '#f4ecd8' }]],
    town: [[0, -100, 40, 2, 'japan'], [0, 100, 24, 2, 'japan'], [87, 50, 22, 1, 'japan'], [-87, -50, 20, 1, 'japan'], [87, -50, 18, 1, 'japan']],
    fields: [[78, 62, 14, 10, .5, '#7ac85a', '#5aa848'], [100, 36, 12, 8, .5, '#7ac85a', '#5aa848'], [-14, 112, 12, 8, 0, '#9ad06a', '#7ab84e']],
    groves: [[87, -50, 26, 34, 'snowpine'], [0, -100, 40, 26, 'sakura'], [12, 100, 22, 22], [87, 50, 26, 14, 'sakura'], [-87, -50, 26, 18, 'dead'], [-87, 50, 26, 10, 'pine'], [0, 0, 26, 18, 'dead']],
    rocks: [[-87, 50, 28, 18], [0, 0, 30, 16], [-87, -50, 28, 12]],
    colorFn: (x, y, z, c) => { if (c.rc || c.water || y < 1.25) return null; const dx = x / 2, dz = z / 2, d = (id, r) => Math.hypot(dx - G(id).c[0], dz - G(id).c[1]) < r;
      if (d('ringo', 36)) return c.mix('#eef2f6', '#dce4ec', c.n2); if (d('udon', 36)) return c.mix('#6e6a66', '#86807a', c.n2); if (d('kuri', 38)) return c.mix(c.mix('#9a8a5e', '#b0a070', c.n2), '#6aa64a', c.n * .5);
      if (Math.hypot(dx, dz - 4) < 34) return c.mix('#5a5650', '#6e6a62', c.n2); return null; },
    story: {
      spawn: [-80, -30], boss: [0, -2], spots: [[-70, -42], [88, -42], [92, 58], [8, 92], [-22, -110]],
      route: [[-80, -30], [-84, -38], [-96, -60], [-87, 50], [0, 100], [87, 50], [87, -50], [0, -100], [0, -60], [0, -31], [-6, -11], [0, -2]],
      npcs: { tama: [-82, -34], kinemon: [-94, -56], hiyori: [-10, -96], denjiro: [14, -106], kawamatsu: [-80, 44], yamato: [10, -22], king_n: [-12, -18] },
      steps: { 1: { spots: [[-74, -62], [-92, 66], [-12, 106]] }, 9: { to: [0, -60] } },
      env: { fogR: [220, 820] } }
  });
})();
