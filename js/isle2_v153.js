/* v153 劇情道具擺放（零件在 isle2_parts3.js）：在島嶼規格 D 上加道具、移動穿模的沉船、換掉不合原作的模型。
   必須在所有 isle2_<島>.js 之後、進入島嶼之前載入（島嶼是在進入時才建）。座標是設計座標。 */
(function () {
  const I = window.ISLE2; if (!I) return;
  const mod = (id, f) => { const S = I[id] && I[id].D; if (S) f(S, S.landmarks = S.landmarks || []); };
  /* v154：鬼之島浮空、新骷髏頭、歷史本文的洞穴還在製作中（使用者 11/03「3D 場景完成後再說」），先關掉；完成後改成 true */
  const WIP3D = !!window.WIP3D_V154;
  const find = (L, kind, x, z) => L.find(l => l[0] === kind && Math.abs(l[1] - x) < .5 && Math.abs(l[2] - z) < .5);
  const move = (L, kind, x, z, nx, nz) => { const l = find(L, kind, x, z); if (l) { l[1] = nx; l[2] = nz; } return l; };
  /* 東海：魯夫出航的小船、西南岸外海的亞爾麗塔號與棧橋、漂來的木桶、海軍據點中庭綁著索隆的十字木樁 */
  mod('east', (D, L) => {
    L.push(['boat', 53, 127, 0, { key: 'luffyboat', s: .22, masts: [0], mastH: 2.6, flag: '#1b1b1b', barrel: 1 }],
      ['bigship', -134, 112, .6, { key: 'alvida', s: 1, sail: '#f4a8c8', hull: '#7a4a5a', flag: '#e85a8a' }],
      ['barrelbig', -124, 100, 0, { y: .2, s: 1.6 }], ['stake', -97, 13, Math.PI / 2, { key: 'zorostake', man: 1 }]);
    move(L, 'wreck', -114, 80, -152, 56);
    D.piers = (D.piers || []).concat([[[-110, 92], [-128, 106], 1.3]]);
  });
  /* 空島：香迪亞遺跡中央的歷史本文 */
  if (!WIP3D) mod('skypiea', (D, L) => { L.push(['poneglyph', -50, -80, .3, { key: 'poneglyph', s: 1.2 }]); });
  if (WIP3D) mod('skypiea', (D, L) => { L.push(['cave', -78, -108, .9, { key: 'poneglyph', r: 7, inside: ['poneglyph', { s: .55 }] }]); }); /* v154：使用者「藏在森林深處的洞穴裡」——遺跡西南方樹林深處的洞穴，洞口朝東北（遺跡方向） */
  /* 司法島：可可羅搭來的火箭人號車頭（塔前） */
  mod('enies', (D, L) => { L.push(['rocketman', 28, -74, -.4, { key: 'rocketman' }]); });
  /* 恐怖三桅帆船：牆外的布魯克幽靈船、千陽號（獅子船首）、歐斯的冷凍庫；兩艘沉船移出木柵 */
  mod('thriller', (D, L) => {
    const sunny = find(L, 'bigship', 0, 154); if (sunny) Object.assign(sunny[4], { head: 'lion', hull: '#d8a84a', deck: '#6aa84a' });
    move(L, 'wreck', 90, 100, 96, 112); move(L, 'wreck', -100, -70, -110, -80);
    L.push(['wreck', -40, 152, .5, { key: 'brookship' }], ['freezer', -20, -14, 0, { key: 'oars' }]);
  });
  /* 頂上戰爭：處刑台上跪著的艾斯、奧利斯廣場 */
  mod('marineford', (D, L) => { L.push(['kneel', 0, -56.6, 0, { dy: 9.3, hat: '#e8753a', bottom: '#2b2b2b' }], ['plaza', 0, -44, 0, { r: 10 }]); });
  /* 魚人島：包著鍍膜泡泡的千陽號、諾亞方舟、龍宮城前的決戰廣場、硬殼塔、乙姬王妃的墓 */
  mod('fishman', (D, L) => {
    move(L, 'wreck', 10, 150, 40, 156);
    const i = L.findIndex(l => l[0] === 'bigship' && Math.abs(l[1] - 112) < .5); if (i >= 0) L[i] = ['noah', 112, -76, .6, { key: 'noah', s: 3.2 }];
    L.push(['coatship', 18, 140, .3, { key: 'sunny', s: .9 }], ['plaza', 0, -56, 0, { r: 14 }], ['tower', -44, -112, 0, { key: 'hardshell', r: 6, h: 26, roof: '#ff9ab8', c: '#f8e0e8' }], ['grave', 92, 8, 0, { key: 'otohime' }]);
  });
  /* 德雷斯羅薩：鳥籠（王宮上空放射到海岸的半透明絲線）、SMILE 工廠 */
  mod('dressrosa', (D, L) => {
    const i = L.findIndex(l => l[0] === 'hut' && Math.abs(l[1] + 56) < .5 && Math.abs(l[2] + 56) < .5); if (i >= 0) L[i] = ['factory', -56, -56, .4, { key: 'smile' }];
    L.push(['birdcage', 8, -90, 0, { key: 'birdcage', h: 120, r: 300, cx: 20, cz: 20, n: 36 }]);
  });
  /* 蛋糕島：港口的大鏡子、千陽號、太陽海賊團的船、婚禮茶會的長桌 */
  mod('wholecake', (D, L) => {
    const sunny = find(L, 'bigship', 0, 150); if (sunny) Object.assign(sunny[4], { sail: '#f4ecd8', hull: '#d8a84a', head: 'lion', deck: '#6aa84a' });
    L.push(['mirror', -24, 108, -.6, { key: 'portmirror' }], ['bigship', 44, 148, .3, { key: 'sunpirates', s: .8, sail: '#e8753a', hull: '#5a4a3a' }], ['stall', -20, -40, 0, { c: '#ff9ab8' }], ['stall', 20, -40, 0, { c: '#ff9ab8' }]);
  });
  /* 蜂巢島：卡普軍艦的狗頭船首、關克比的鐵籠、青雉凍結的港口 */
  mod('dark', (D, L) => {
    const garp = find(L, 'bigship', 26, 140); if (garp) Object.assign(garp[4], { head: 'dog' });
    L.push(['cage', 10, -62, 0, { key: 'cage' }], ['ice', -38, 116, 0, { key: 'ice', r: 14, walls: [[-56, 104, -48, 126]] }]);
  });
  /* 蛋頭島：南港的逃生艙、沉睡的巨大機器人、包圍的軍艦 */
  mod('egghead', (D, L) => {
    L.push(['pod', 12, 110, Math.PI, { key: 'pod' }], ['robot', 96, -52, -.8, { key: 'robot', s: 1 }],
      ['bigship', 0, -158, Math.PI, { s: .8, sail: '#ffffff', hull: '#8a8e96' }], ['bigship', 150, -40, -1.6, { s: .8, sail: '#ffffff', hull: '#8a8e96' }], ['bigship', -150, 30, 1.6, { s: .8, sail: '#ffffff', hull: '#8a8e96' }]);
  });
  /* v154 阿拉巴斯坦：時計台裡的炸彈（從正面的窗口露出來） */
  mod('alabasta', (D, L) => { const ct = L.find(l => l[0] === 'clocktower'); if (ct) { ct[3] = -Math.PI / 2; ct[4] = Object.assign(ct[4] || {}, { bomb: 1 }); } });
  /* v154 和之國：鬼之島的骷髏頭（參考圖）放大，面向南邊的港口（從南港一路看得到它張開的大嘴） */
  /* v154 鬼之島浮在半空（使用者 11/03 參考圖）：島上的地面整個抬高 LIFT，底下是倒錐形的鋸齒岩塊與環繞的雲帶；海面仍在島的下方；
     花之都的長橋從地面一路斜上去接到島邊（isle2 skyway 的高度取兩端地面）。 */
  if (WIP3D) mod('wano', (D, L) => { const LIFT = 30, OD = (dx, dz) => Math.hypot(dx, dz - 4), RIM = 46;
    D.post2 = (v, dx, dz) => OD(dx, dz) < RIM ? (v > .25 ? v + LIFT : -7) : v;
    D.waterH = (h, dx, dz) => OD(dx, dz) < RIM && h > 2 ? -7 : h;
    D.cutTri = (dy, dx, dz) => dy > 9 && OD(dx, dz) < RIM + 4;
    L.push(['floatbase', 0, 4, 0, { lift: LIFT, rim: RIM }]);
    const BR = (D.skyways || []).find(S => S.pts[0][0] === 0 && S.pts[0][1] === -60); const W = I.wano;
    { const ln = (D.roads || []).find(r => r[0][0][0] === 0 && r[0][0][1] === -31); if (ln) ln[0].unshift([0, -35.5]); } /* 山路往外接到橋頭 */
    if (BR) { BR.arch = 1; BR.ramp = true; BR.pts = [[0, -63], [0, -49], [0, -34.5]]; /* 終點往島內多伸一段，接上抬高的地面（島緣是懸空的） */ Object.defineProperty(BR, 'y', { configurable: true, get: () => [W.H(0, -128) + .15, W.H(0, -67)] }); } });
  if (WIP3D) mod('wano', (D, L) => { const sk = L.find(l => l[0] === 'skull'); if (sk) { sk[2] = 30; sk[3] = 0; sk[4] = Object.assign(sk[4] || {}, { r: 19 }); } });
  /* 巨人篇：漁夫村上空，神之騎士團的巨大箭頭標誌 */
  mod('giant', (D, L) => { L.push(['arrowsign', 100, -10, .5, { key: 'arrow', h: 26, s: 6 }]); });
})();
