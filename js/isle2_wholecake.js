/* v147 蛋糕島（托特蘭）：新版關卡
   南邊港口登陸（甚平）→ 糖果屋的甜點之城 → 東邊鏡子廣場（鏡中的世界）→ 西邊會說話的誘惑森林（棒棒糖樹）→ 巧克力河與糖霜橋
   → 中央山丘上的多層蛋糕城（布琳、婚禮會場）→ 逃離托特蘭（往南跑回港口）→ 蛋糕城前（BIG MOM）。座標：x 往東、z 往南。 */
(function () {
  if (!window.ISLE2 || !ISLE2.define) return;
  const ring = (cx, cz, r, n) => { const P = []; for (let i = 0; i <= n; i++) { const a = i / n * 6.2832 + .2; P.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return P; };
  ISLE2.define('wholecake', {
    SC: 2, ext: 340, vScale: .5, rough: 2.4, base: 5, style: 'candy', fine: 1.45, houseStep: 4, maxHouses: 140, curb: '#ffffff', waterCol: '#7a4a2a', waterCol2: '#8e5a34',
    grass: '#9ad87a', grass2: '#b4e48c', sand: '#fff0d8', sand2: '#fff8e8', rock: '#c89a7a', rock2: '#dcae8e', dirt: '#c8946a', cobble: '#f0c8d8', rockA: '#f8c8d8', rockB: '#fff0f4',
    rcol: { promenade: '#ffe8f0', main: '#ffe0ec', street: '#fff0d8', alley: '#f8e4cc', lane: '#e8c8a0', trail: '#dcb890' },
    land: [[0, 6, 140, .08], [120, -110, 24, .12]],
    terrain: [{ plateau: [0, -64, 40, 14, 4], max: true }, { g: [-90, 20, 30, 6] }, { g: [90, -40, 24, 6] }],
    rivers: [{ pts: [[-150, 40], [-100, 50], [-60, 44], [-30, 30], [0, 26], [30, 32], [70, 46], [150, 60]], w: 5, valley: 10, depth: 2.5 }],
    roads: [
      [[[-60, 118], [-30, 122], [0, 124], [30, 122], [60, 116]], 'promenade'], [[[0, 124], [0, 112], [0, 90], [0, 60], [0, 30], [0, 0], [0, -26], [0, -44]], 'main'],
      [ring(0, 92, 26, 24), 'street'], [[[-60, 92], [-26, 92]], 'street'], [[[26, 92], [60, 88], [88, 70]], 'street'],
      [[[0, 30], [-40, 0], [-80, 0], [-100, 14]], 'lane'], [[[0, 30], [40, 4], [80, 0], [96, -14]], 'lane'], [[[0, -26], [-30, -40], [-36, -64], [-20, -96], [0, -104]], 'street'], [[[0, -26], [30, -40], [36, -64], [20, -96], [0, -104]], 'street']],
    bridges: [[[0, 20], [0, 34]], [[-40, 26], [-40, 40]], [[44, 30], [44, 44]]],
    landmarks: [
      ['plaza', 0, 92, 0, { r: 9, fountain: 1 }], ['guild', 20, 108, -.4, { key: 'guild', roof: '#ff7aa8', wall: '#fff4e0' }],
      ['cakecastle', 0, -68, 0, { key: 'chateau', r: 28 }], ['plaza', 0, -104, 0, { r: 10, fountain: 1 }],
      ['mirror', 96, -18, -Math.PI / 2, { key: 'mirror' }], ['mirror', 90, -30, -Math.PI / 2], ['mirror', 102, -6, -Math.PI / 2],
      ['bigship', 0, 150, 0, { s: .9, sail: '#ffd0e0', hull: '#c87a9a' }], ['boat', -40, 150, .3, { sail: '#fff4e0' }]],
    town: [[0, 92, 44, 2, 'candy'], [0, -86, 40, 2, 'candy']],
    groves: [[-96, 10, 34, 70, 'candy'], [100, 70, 24, 20, 'candy'], [-60, -90, 24, 26, 'candy'], [120, -110, 18, 16, 'candy'], [60, -100, 18, 14]],
    rocks: [[120, -110, 18, 10], [-120, -70, 16, 8]],
    story: {
      spawn: [0, 118], boss: [0, -36], spots: [[-80, 60], [70, 70], [-90, -40], [60, -80], [-20, 10]],
      route: [[0, 118], [0, 92], [60, 88], [88, 70], [96, -14], [40, 4], [0, 30], [-10, -24], [0, -104], [0, -44], [-40, 0], [0, 90], [0, -36]],
      npcs: { jinbe: [-12, 116], pudding: [-12, -28] },
      steps: { 1: { pos: [90, -18], r: 9 }, 4: { points: [[0, -20], [-40, 0], [0, 40], [0, 100]] } },
      env: { fogR: [220, 820] } }
  });
})();
