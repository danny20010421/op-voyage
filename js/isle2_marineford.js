/* v147 頂上戰爭・海軍本部：新版關卡
   南邊被青雉凍結的海灣（冰面可以走，凍住的海賊船）登陸 → 冰上找甚平 → 包圍牆（中間被撞開的缺口）找克比 → 半月形的奧利斯廣場
   → 斜坡衝上處刑台 → 廣場兩側的海軍家眷街（黑鬍子在西側廢墟）→ 處刑台下（卡普）→ 廣場岩漿坑（赤犬，BOSS）→ 後方的海軍本部。
   座標：x 往東、z 往南。 */
(function () {
  if (!window.ISLE2 || !ISLE2.define) return;
  const BAY = [0, 54], BR = 76, arc = (r, a0, a1, n) => { const P = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; P.push([BAY[0] + Math.cos(a) * r, BAY[1] + Math.sin(a) * r]); } return P; };
  const CR = [[-26, -42, 7], [22, -46, 6], [-6, -38, 4]];
  ISLE2.define('marineford', {
    SC: 2, ext: 340, base: 2.5, vScale: .5, rough: 1.8, style: 'marine', fine: 1.5, houseStep: 4, maxHouses: 120, curb: '#c8c8cc', rockA: '#cfe8f8', rockB: '#e8f6ff',
    grass: '#86a868', grass2: '#98b874', sand: '#e0dccc', sand2: '#ece8d8', rock: '#8a8c94', rock2: '#a0a2aa', dirt: '#8e8678', cobble: '#b0b0b4',
    rcol: { promenade: '#d8d8dc', main: '#d4d4d8', street: '#c8c8cc', alley: '#c0c0c4', lane: '#b4ac9c' },
    land: [[0, -70, 120, .06], [-108, 34, 40, .1], [108, 34, 40, .1], [0, 60, 82, .04]],
    post: (h, dx, dz, sm) => { const d = Math.hypot(dx - BAY[0], dz - BAY[1]), f = (1 - sm(BR - 16, BR - 3, d)) * sm(-14, 2, dz); return h + (.6 - h) * f + Math.sin(dx * .3) * Math.sin(dz * .27) * .04 * f; },
    terrain: [{ g: [0, -110, 50, 8] }, { plateau: [0, -58, 8, 10, 1.2], max: true }, { g: [-110, 40, 20, 6] }, { g: [110, 40, 20, 6] }],
    colorFn: (x, y, z, c) => { const dx = x / 2, dz = z / 2, d = Math.hypot(dx - BAY[0], dz - BAY[1]); if (d < BR - 3 && dz > -4 && !c.rc) { const crack = Math.abs(Math.sin(dx * .21 + Math.sin(dz * .13) * 2)) < .04 || Math.abs(Math.sin(dz * .19 + dx * .05)) < .03; return crack ? '#6aa8cc' : c.mix('#bfe2f6', '#a4d2ee', c.n * .7 + c.n2 * .3); }
      for (const [cx, cz, r] of CR) { const e = Math.hypot(dx - cx, dz - cz); if (e < r) return c.mix('#e85a1a', '#3a2a24', Math.min(1, e / r * 1.2)); } return null; },
    roads: [
      [[[-74, -20], [-40, -32], [0, -34], [40, -32], [74, -20]], 'promenade'],
      [[[0, -34], [0, -44], [0, -54]], 'main'], [[[0, -34], [0, -14], [0, 2]], 'main'],
      [[[-62, -36], [-30, -60], [0, -74], [30, -60], [62, -36]], 'street'], [[[0, -74], [0, -90]], 'main'],
      [[[-74, -20], [-100, -6], [-112, 20], [-108, 50]], 'street'], [[[74, -20], [100, -6], [112, 20], [108, 50]], 'street'],
      [[[-84, -40], [-100, -6]], 'alley'], [[[84, -40], [100, -6]], 'alley'], [[[-62, -36], [-84, -40], [-96, -70]], 'street'], [[[62, -36], [84, -40], [96, -70]], 'street'],
      [[[-96, -70], [-50, -96], [0, -100], [50, -96], [96, -70]], 'street']],
    ramparts: [{ pts: arc(BR + 3, 196, 344, 30), closed: false, h: 9, th: 2.6, col: '#a8acb4', towers: true, towerEvery: 5, roof: null, gates: [[0, -25, 18], [-58, 6, 7], [58, 6, 7]], crenel: true }],
    landmarks: [
      ['marineHQ', 0, -110, 0, { key: 'hq' }], ['scaffold', 0, -56, 0, { key: 'scaffold' }],
      ['bigship', -24, 84, .4, { s: 1.4, sail: '#f4ecd8', hull: '#e8e0d0' }], ['bigship', 36, 100, -.6, { s: .9, sail: '#f4ecd8' }], ['bigship', -50, 112, 1.2, { s: .8, sail: '#f4ecd8' }], ['bigship', 56, 60, 2.4, { s: .7, sail: '#f4ecd8' }],
      ['bigship', -140, 90, .2, { s: .9, sail: '#ffffff', hull: '#e8ecf0' }], ['bigship', 140, 90, -.2, { s: .9, sail: '#ffffff', hull: '#e8ecf0' }],
      ['tower', -70, -60, 0, { r: 5, h: 26, c: '#e8e8ec', roof: '#2a4a8a', flag: '#ffffff' }], ['tower', 70, -60, 0, { r: 5, h: 26, c: '#e8e8ec', roof: '#2a4a8a', flag: '#ffffff' }],
      ['ruin', -52, -48, .3, { c: '#c8c8cc', w: 8 }], ['ruin', 48, -52, -.4, { c: '#c8c8cc', w: 7 }]],
    town: [[-96, -20, 44, 2, 'marine'], [96, -20, 44, 2, 'marine'], [0, -92, 50, 2, 'marine']],
    groves: [[-120, -40, 12, 10, 'pine'], [120, -40, 12, 10, 'pine']],
    rocks: [[-30, 60, 40, 18], [30, 40, 40, 14], [0, 110, 30, 10]],
    story: {
      spawn: [0, 118], boss: [0, -42], spots: [[-30, 70], [30, 50], [-40, -14], [40, -12], [0, 30]],
      route: [[0, 118], [-10, 96], [0, 60], [0, 10], [0, -14], [0, -34], [0, -54], [-44, -34], [14, -68], [0, -42]],
      npcs: { jinbe: [-12, 104], koby: [14, 4], aokiji_n: [40, 74], blackbeard_n: [-44, -34], garp: [14, -68] },
      steps: { 3: { points: [[0, -18], [-22, -36], [20, -40], [0, -57]] } },
      env: { fogR: [220, 820] } }
  });
})();
