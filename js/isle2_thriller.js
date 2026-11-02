/* v147 恐怖三桅帆船：新版關卡（使用者 11/02：還原原作，海面上用木頭外牆圍起來，中間漂浮一艘巨大的三桅帆船，人物在裡面的走道冒險）
   南邊外牆的碼頭登陸（千陽號停在牆外）→ 木頭外牆上的環形走道（內外兩側木柵）→ 四座木棧橋跨過內側的海 → 巨船：
   船尾甲板（布魯克、失去影子的船員）→ 主甲板的幽靈小鎮與墓園森林、三根巨桅 → 霍古巴克的宅邸（潛入）→ 佩羅娜的塔
   → 船首高甲板（天亮前的甲板）→ 莫利亞的城堡（BOSS）。座標：x 往東、z 往南。 */
(function () {
  if (!window.ISLE2 || !ISLE2.define) return;
  const HULL = [[0, -120], [16, -106], [28, -82], [34, -52], [36, 0], [34, 50], [30, 88], [22, 106], [0, 112], [-22, 106], [-30, 88], [-34, 50], [-36, 0], [-34, -52], [-28, -82], [-16, -106]];
  const RR = 130, U = ISLE2.util, circle = (r, n) => { const P = []; for (let i = 0; i <= n; i++) { const a = i / n * 6.2832; P.push([Math.cos(a) * r, Math.sin(a) * r]); } return P; };
  const RAIL = HULL.map(([x, z]) => [x * .955, z * .975]); RAIL.push(RAIL[0]);
  ISLE2.define('thriller', {
    SC: 2, ext: 340, ultraRes: .4, planks: true, ultraExtra: U => { for (let z = -U.ext; z < U.ext; z += 7) for (let x = -U.ext; x < U.ext; x += 7) { const px = x + U.ur() * 7, pz = z + U.ur() * 7; if (U.Hs(px, pz) > -3 || U.ur() < .3) continue; const r = .8 + U.ur() * 2.4, k = .22 + U.ur() * .12; U.put('peb', px, -2.2 + U.ur(), pz, U.ur() * 6, r * 1.4, r * 2.2, r * 1.4, [k, k * 1.05, k * 1.15]); } }, style: 'spooky', fine: 1.5, houseStep: 4, maxHouses: 70,
    grass: '#4a5a48', grass2: '#56664e', rock: '#5a5660', rock2: '#6a6670', dirt: '#5a4a3a', cobble: '#5a5662',
    rcol: { promenade: '#6a5a4a', main: '#6e6258', street: '#666058', alley: '#5e5650', lane: '#5a4a3a', trail: '#54463a' },
    land: [], terrain: [],
    rawFn: (dx, dz, u) => { const d = Math.hypot(dx, dz); if (Math.abs(d - RR) < 5) return 6;
      if (u.pip(dx, dz, HULL)) return 10 + 4 * u.sm(-58, -63, dz) + 4 * u.sm(62, 67, dz) + 1.6 * Math.exp(-((dx + 16) ** 2 + (dz - 30) ** 2) / 200) + u.fbm(dx * .05, dz * .05) * .3;
      return -5; },
    colorFn: (x, y, z, c) => { if (y < 3) return null; const dx = x / 2, dz = z / 2, onRing = Math.abs(Math.hypot(dx, dz) - RR) < 6;
      if (!onRing && Math.hypot(dx + 16, dz - 30) < 15 && !c.rc) return c.mix('#3e4a3a', '#4a5644', c.n2);
      const plank = onRing ? Math.floor(Math.atan2(dz, dx) * 160) : Math.floor(x * .55); return c.mix(c.rc ? '#6e5a44' : '#7a6248', c.rc ? '#5e4c3a' : '#5a4632', c.vh(plank, Math.floor((onRing ? Math.hypot(x, z) : z) * .1)) * .8); },
    roads: [
      [[[0, 66], [0, 40], [0, 10], [0, -30], [0, -62], [0, -74]], 'main'], [[[0, 104], [0, 84], [0, 66]], 'main'],
      [[[-30, 30], [0, 30], [30, 30]], 'street'], [[[-30, -24], [0, -24], [30, -24]], 'street'], [[[-36, 0], [0, 0]], 'street'], [[[36, 0], [0, 0]], 'street'],
      [[[-22, 90], [0, 84], [22, 90]], 'alley'], [[[-16, -84], [0, -78], [16, -84]], 'alley']],
    skyways: [{ pts: [[0, 125], [0, 118], [0, 111]], w: 6, style: 'wood', y: [6, 14] }, { pts: [[125, 0], [80, 0], [36, 0]], w: 5, style: 'wood', y: [6, 10], arch: 3 },
      { pts: [[-125, 0], [-80, 0], [-36, 0]], w: 5, style: 'wood', y: [6, 10], arch: 3 }, { pts: [[0, -125], [0, -122], [0, -118]], w: 6, style: 'wood', y: [6, 14] }],
    ramparts: [{ pts: circle(RR + 4.6, 64), closed: false, h: 4, th: 1.2, col: '#6e4c30', style: 'wood', seg: 4, gates: [[0, RR + 4.6, 8]] },
      { pts: circle(RR - 4.6, 64), closed: false, h: 3, th: 1.2, col: '#6e4c30', style: 'wood', seg: 4, gates: [[0, RR - 4.6, 7], [RR - 4.6, 0, 6], [-(RR - 4.6), 0, 6], [0, -(RR - 4.6), 7]] },
      { pts: RAIL, closed: false, h: 2.2, th: .9, col: '#4a3626', style: 'wood', crenel: false, gates: [[0, 107, 7], [34.4, 0, 6], [-34.4, 0, 6], [0, -114, 6]] }],
    landmarks: [
      ['hull', 0, 0, 0, { poly: HULL }], ['mast', 0, -42, 0, { h: 58 }], ['mast', 0, 2, 0, { h: 70 }], ['mast', 0, 48, 0, { h: 54 }],
      ['mansion', 16, -10, -Math.PI / 2, { key: 'mansion' }], ['graveyard', -16, 30, 0, { r: 13 }], ['tower', -22, -38, .6, { key: 'perona', r: 4.5, h: 22, c: '#6a6470', roof: '#c86aa8', win: '#ffcf6a' }],
      ['darkcastle', 0, -98, 0, { key: 'castle', w: 34, d: 22 }],
      ['bigship', 0, 154, 0, { s: .75, sail: '#f4ecd8' }], ['wreck', 90, 100, .8], ['wreck', -100, -70, 2.2]],
    town: [[0, 40, 40, 2, 'spooky'], [0, -40, 30, 2, 'spooky'], [0, 92, 18, 1, 'spooky']],
    groves: [[-16, 30, 14, 26, 'dead'], [20, 54, 8, 8, 'dead'], [-24, -62, 8, 8, 'dead']],
    story: {
      spawn: [0, 132], boss: [0, -76], spots: [[-80, 101], [90, -92], [-20, 52], [22, -36], [-22, 6]],
      route: [[0, 132], [0, 118], [0, 104], [0, 84], [0, 66], [0, 40], [14, 4], [0, -24], [0, -62], [0, -76]],
      npcs: { lola: [-10, 129], brook: [14, 92], victim: [-18, 84], perona_n: [-18, -30], kuma_n: [-128, -14] },
      steps: { 2: { start: [0, 66], goal: [7, -6], guards: [[[-4, 22], [-4, 4], [-4, -12], [-4, 4]], [[2, 14], [26, 14], [26, 8], [2, 8]]] }, 3: { spots: [[-26, 22], [24, 40], [-24, -16]] }, 6: { pos: [0, -64], r: 9 } },
      env: { fogR: [180, 700] } }
  });
})();
