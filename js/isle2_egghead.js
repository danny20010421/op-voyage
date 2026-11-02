/* v147 蛋頭島（未來島）：新版關卡
   南邊港口登陸（貝加龐克）→ 下層「未來城」：白色未來建築、發光道路 → 東邊工廠區（約克）→ 金屬螺旋坡道
   → 上層台地「研究層」：蛋形研究所與高塔（夏卡）→ 收集撤離資料（上下兩層都有）→ 護送貝加龐克回港口的逃生艙 → CP0 → 研究所前廣場（黃猿 BOSS）。
   座標：x 往東、z 往南。 */
(function () {
  if (!window.ISLE2 || !ISLE2.define) return;
  const LAB = [0, -70], sp = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = (90 + t * 300) * Math.PI / 180, r = 56 + 6 * Math.sin(t * 3.14); sp.push([LAB[0] + Math.cos(a) * r, LAB[1] + Math.sin(a) * r]); }
  ISLE2.define('egghead', {
    SC: 2, ext: 340, vScale: .5, rough: 2, base: 3, style: 'future', fine: 1.5, houseStep: 4, maxHouses: 120, curb: '#5ad0ff',
    grass: '#9ad06a', grass2: '#b0dc7c', sand: '#f0e8d4', sand2: '#f8f2e4', rock: '#a8b0bc', rock2: '#c0c8d4', dirt: '#b8a888', cobble: '#e8eef6', rockA: '#b8c0cc', rockB: '#d0d8e4',
    rcol: { promenade: '#f4f6fa', main: '#eef2f8', street: '#e8eef6', alley: '#e0e8f0', lane: '#c8d0dc' },
    land: [[0, 0, 132, .08], [LAB[0], LAB[1], 54, .06]],
    terrain: [{ plateau: [LAB[0], LAB[1], 46, 34, 3], max: true }],
    roads: [
      [[[-50, 112], [-20, 116], [10, 118], [40, 114]], 'promenade'], [[[10, 118], [8, 100], [0, 70], [0, 40], [0, 14]], 'main'],
      [[[-60, 70], [-30, 70], [0, 70], [40, 66], [80, 50]], 'street'], [[[-70, 30], [-30, 34], [0, 40], [40, 36], [80, 20]], 'street'],
      [[[-30, 112], [-30, 70], [-30, 34]], 'alley'], [[[40, 100], [40, 66], [40, 36]], 'alley'], [[[80, 50], [80, 20], [86, -10]], 'street'],
      [[[0, 14], [0, -14]], 'main'], [[[0, -60], [0, -36], [-24, -60], [0, -84], [24, -60], [0, -36]], 'street']],
    skyways: [{ pts: [[0, -14]].concat(sp.slice(2)).concat([[LAB[0] + 40, LAB[1] + 10]]), w: 6, style: 'metal', y: [3.4, 34] }],
    piers: [[[10, 116], [10, 144], 1.4], [[-30, 114], [-34, 140], 1.2]],
    landmarks: [
      ['labegg', 0, -86, 0, { key: 'lab', r: 20 }], ['punkrecords', 0, -86, 0, { key: 'punk', h: 74, r: 18 }], ['futuretower', -30, -84, 0, { h: 46, c: '#ff6aa8' }], ['futuretower', 30, -84, 0, { h: 46, c: '#5ad0ff' }],
      ['plaza', 0, 70, 0, { r: 9, fountain: 1 }], ['guild', -18, 84, .3, { key: 'guild', roof: '#ff6aa8', wall: '#f4f6fa' }],
      ['futuretower', 96, 10, 0, { h: 30, c: '#ffd24a' }], ['futuretower', 100, -24, 0, { h: 24, c: '#ffd24a' }], ['labegg', 70, -14, 0, { r: 9 }],
      ['bigship', 40, 150, 0, { s: .9, sail: '#ffffff', hull: '#e8ecf0' }], ['boat', 14, 154, 0, { sail: '#ff6aa8' }]],
    town: [[0, 60, 60, 2, 'future']],
    groves: [[-90, 40, 24, 26], [-80, -20, 20, 20, 'pine'], [90, 80, 20, 16]],
    rocks: [[-110, -60, 20, 12], [110, 60, 14, 8]],
    story: {
      spawn: [10, 110], boss: [0, -48], spots: [[-60, 90], [60, 90], [-70, 10], [90, 40], [0, -100]],
      route: [[10, 110], [8, 100], [0, 70], [0, 40], [80, 20], [86, -10], [0, -14], [56, -40], [0, -60], [0, -48], [10, 126], [0, -48]],
      npcs: { vegapunk_n: [-2, 108], shaka: [12, -62], lilith: [-60, 30], york_n: [76, 28], bonney: [-40, 70] },
      steps: { 2: { spots: [[-30, 100], [86, -6], [-20, -64]] }, 4: { to: [12, 104] }, 6: { pos: [0, -44], r: 9 } },
      env: { fogR: [220, 820] } }
  });
})();
