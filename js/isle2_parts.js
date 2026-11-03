/* v146 新版島嶼的特色建築零件（各島共用）：酒館、工會、村公所、魚市場、小屋、風車、燈塔、海軍據點、山賊小屋、沉船、牧場小屋、廣場（水井／噴水池）、市集攤位、船。
   每個零件收到 { b, x, z, ry, o, Hs, house, O, ST, P, K, fp, flatPad, hd, D, CHIMNEYS } ，回傳門口位置等資訊。 */
(function (global) {
  const ISLE2 = global.ISLE2 = global.ISLE2 || {}; ISLE2.parts = ISLE2.parts || {}; const PT = ISLE2.parts;
  const { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 酒館：兩層、招牌、露天座位、酒桶 */
  PT.tavern = A => { const { b, x, z, ry, house, P, Hs, O, fp } = A, r = house(x, z, 11, 8, 2, ry, { sign: '#c8322b', balcony: true, wall: '#f4e4c4', roof: '#a8432f', noChimney: false }), L = Lf(x, z, ry), y = r.y;
    for (let k = 0; k < 3; k++) { const [tx, tz] = L(-3.5 + k * 3.5, 8); b.m = 1; b.cyl(tx, Hs(tx, tz) - .1, tz, .7, .7, .9, 10, '#8a5a38'); for (let q = 0; q < 2; q++) { const [cx, cz] = L(-3.5 + k * 3.5 + (q ? 1.1 : -1.1), 8); b.box(cx, Hs(cx, cz) - .1, cz, .5, .5, .5, '#6e4426'); } b.m = 0; O.push([tx, tz, 1.4]); }
    [[6.4, 4.8], [6.4, 5.8]].forEach(([lx, lz]) => { const [bx, bz] = L(lx, lz); P.barrel(b, bx, Hs(bx, bz), bz); }); return r; };
  /* 工會：三層、塔樓、旗幟、懸賞告示板 */
  PT.guild = A => { const { b, x, z, ry, house, Hs, O, o } = A, r = house(x, z, 12, 9, 3, ry, { wall: o.wall || '#efe2c8', roof: o.roof || '#2f5f9a', sign: '#d8a03a', balcony: true }), L = Lf(x, z, ry), y = r.y;
    const [tx, tz] = L(-4.6, -3); b.m = 3; b.box(tx, y - .5, tz, 3.4, 13.5, 3.4, '#d8ccb4', ry); b.m = 2; b.cyl(tx, y + 13, tz, 2.6, 0, 3.2, 8, o.roof || '#2f5f9a'); b.m = 0;
    b.cyl(tx, y + 16, tz, .08, .08, 4, 5, '#3a3430'); b.box(tx + .9, y + 19.2, tz, 1.8, 1.1, .06, o.flag || '#d8a03a', ry);
    const [bx, bz] = L(4.2, 6.2); b.m = 1; b.box(bx, Hs(bx, bz) - .2, bz, .2, 2.6, .2, '#5e3e2a', ry); const [cx, cz] = L(5.8, 6.2); b.box(cx, Hs(cx, cz) - .2, cz, .2, 2.6, .2, '#5e3e2a', ry); const [px, pz] = L(5, 6.2); b.box(px, Hs(px, pz) + 1.1, pz, 2.2, 1.4, .12, '#c8a874', ry);
    for (let k = 0; k < 4; k++) { const [qx, qz] = L(4.4 + (k % 2) * .8, 6.12); b.m = 0; b.box(qx, Hs(qx, qz) + 1.3 + (k > 1 ? -.55 : 0), qz, .55, .45, .04, '#f4ecd8', ry); } O.push([bx, bz, .6]); return r; };
  /* 村公所：兩層、鐘塔 */
  PT.hall = A => { const { b, x, z, ry, house, O } = A, r = house(x, z, 12, 9, 2, ry, { wall: '#f4ecd8', roof: '#3f6fa3', balcony: true, noChimney: true }), L = Lf(x, z, ry), y = r.y;
    const [tx, tz] = L(0, -1); b.m = 4; b.box(tx, y + 6.4, tz, 2.6, 4.2, 2.6, '#f4ecd8', ry); b.m = 2; b.cyl(tx, y + 10.5, tz, 2.1, 0, 2.6, 4, '#3f6fa3', null, ry + .785); b.m = 0; const [cx, cz] = L(0, .32); b.cyl(cx, y + 8.2, cz, .8, .8, .12, 14, '#ffffff', null, 0, null); return r; };
  /* 魚市場：開放式木棚＋攤位＋魚箱 */
  PT.fishmarket = A => { const { b, x, z, ry, Hs, O, fp, flatPad, P } = A, L = Lf(x, z, ry), y = Hs(x, z); flatPad(x, z, 14, 7, ry, y);
    for (const [lx, lz] of [[-6.5, -3], [6.5, -3], [-6.5, 3], [6.5, 3], [0, -3], [0, 3]]) { const [px, pz] = L(lx, lz); b.m = 1; b.box(px, y - .2, pz, .35, 3.6, .35, '#6e4c30'); }
    b.m = 2; b.box(x, y + 3.3, z, 15, .3, 8, '#b5463a', ry); b.box(x, y + 3.6, z, 14, .3, 5, '#9a3a30', ry); b.m = 0;
    for (let k = 0; k < 4; k++) { const [sx, sz] = L(-5 + k * 3.3, 0); b.box(sx, y - .1, sz, 2.6, 1, 1.4, '#8a6a46', ry); for (let q = 0; q < 3; q++) { const [fx, fz] = L(-5.8 + k * 3.3 + q * .8, 0); b.box(fx, y + .95, fz, .6, .14, .25, ['#9ac8e0', '#e09a7a', '#c8d0d8'][q], ry); } }
    O.push([x, z, 5]); fp(x, z, 8); return { door: L(0, 5), y }; };
  /* 小屋（漁夫、湖畔、山賊） */
  PT.hut = A => { const { b, x, z, ry, house, P, Hs, o } = A, r = house(x, z, 6.4, 5.4, 1, ry, { wall: o.wall || '#d8c8a8', roof: o.roof || '#7a4b2a' }), L = Lf(x, z, ry);
    if (o.nets) for (let k = 0; k < 3; k++) { const [nx, nz] = L(-4.5 + k * 1.5, 6); b.m = 1; b.box(nx, Hs(nx, nz) - .2, nz, .15, 2.4, .15, '#6e4c30'); } if (o.barrels) { const [bx, bz] = L(4.2, 3.5); P.barrel(b, bx, Hs(bx, bz), bz); } return r; };
  /* 風車（扇葉由遊戲轉動） */
  PT.windmill = A => { const { b, x, z, Hs, O, fp, flatPad, D, hd } = A, y = Hs(x, z); flatPad(x, z, 7, 7, 0, y);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; b.m = 3; b.box(x + Math.cos(a) * 2.8, y - .6, z + Math.sin(a) * 2.8, 1.5, 1, 1, mix('#a99d90', '#c4b8aa', (i % 3) / 3), -a); } b.m = 4;
    b.cyl(x, y - .4, z, 2.7, 1.8, 10.5, 16, '#f4eee0'); b.m = 1; for (let k = 1; k < 4; k++) b.cyl(x, y + k * 2.5, z, 2.7 - k * .25, 2.7 - k * .25, .24, 16, '#6b4a2f'); b.m = 2; b.cyl(x, y + 10, z, 2.3, 0, 3, 16, '#8b3a2e'); b.m = 0;
    b.box(x, y - .3, z + 2.45, 1.3, 2.4, .2, '#8a5a38'); b.box(x, y + 5.6, z + 2.05, .9, .9, .2, '#2c3e58'); O.push([x, z, 3.4]); fp(x, z, 4.5);
    (D.windmills = D.windmills || []).push([x, y + 8.8, z + 2.2]); return { door: [x, z + 5], y }; };
  /* 燈塔 */
  PT.lighthouse = A => { const { b, x, z, Hs, O, fp } = A, y = Math.max(1.4, Hs(x, z)); b.m = 3; b.cyl(x, y - 1, z, 3.2, 3.2, 1.6, 16, '#b4a898'); b.m = 4;
    for (let k = 0; k < 5; k++) b.cyl(x, y + .6 + k * 2.6, z, 2.4 - k * .2, 2.2 - k * .2, 2.6, 16, k % 2 ? '#c8322b' : '#f4f0e8'); b.m = 0; b.cyl(x, y + 13.6, z, 1.6, 1.6, .3, 14, '#3a3430'); b.cyl(x, y + 13.9, z, 1.1, 1.1, 1.6, 12, '#ffe8a0'); b.m = 2; b.cyl(x, y + 15.5, z, 1.5, 0, 1.6, 12, '#3a3430'); b.m = 0; O.push([x, z, 3]); fp(x, z, 4); return { y }; };
  /* 海軍據點：石牆圍起來、正門、瞭望塔、營舍、旗 */
  PT.fort = A => { const { b, x, z, ry, Hs, house, O, ST, fp, flatPad, hd } = A, L = Lf(x, z, ry), y = Hs(x, z), W = 30, Dp = 22; flatPad(x, z, W, Dp, ry, y);
    const wall = (lx0, lz0, lx1, lz1) => { const n = Math.ceil(Math.hypot(lx1 - lx0, lz1 - lz0) / 2); for (let k = 0; k < n; k++) { const t = (k + .5) / n, [px, pz] = L(lx0 + (lx1 - lx0) * t, lz0 + (lz1 - lz0) * t); b.m = 3; b.box(px, y - .5, pz, 2.1, 4.2, 1.2, '#c4bcac', Math.abs(lx1 - lx0) > Math.abs(lz1 - lz0) ? ry : ry + Math.PI / 2); if (k % 2 === 0) b.box(px, y + 3.7, pz, .9, .7, 1.3, '#d0c8b8', ry); O.push([px, pz, 1.2]); } b.m = 0; };
    wall(-W / 2, -Dp / 2, W / 2, -Dp / 2); wall(-W / 2, -Dp / 2, -W / 2, Dp / 2); wall(W / 2, -Dp / 2, W / 2, Dp / 2); wall(-W / 2, Dp / 2, -3, Dp / 2); wall(3, Dp / 2, W / 2, Dp / 2);
    for (const [lx, lz] of [[-W / 2, Dp / 2], [W / 2, Dp / 2], [-W / 2, -Dp / 2], [W / 2, -Dp / 2]]) { const [tx, tz] = L(lx, lz); b.m = 3; b.box(tx, y - .5, tz, 3.4, 8, 3.4, '#b8b0a0', ry); b.box(tx, y + 7.3, tz, 4, .6, 4, '#a8a090', ry); b.m = 0; O.push([tx, tz, 2.2]); }
    const [gx, gz] = L(0, Dp / 2); b.m = 3; b.box(gx, y + 3.6, gz, 7.2, 1.4, 1.6, '#b8b0a0', ry); b.m = 0; b.box(gx, y + 4.4, gz, 3.6, .9, .1, '#2a4a8a', ry);
    house(...L(-6, -3), 10, 7, 2, ry, { wall: '#e8ecf0', roof: '#3a5a8a', noChimney: true }); house(...L(8, -4), 8, 6, 1, ry, { wall: '#e8ecf0', roof: '#3a5a8a', noChimney: true });
    const [fx, fz] = L(4, 4); b.cyl(fx, y, fz, .12, .1, 11, 6, '#e8e4dc'); b.box(fx + 1.2, y + 9.8, fz, 2.4, 1.4, .06, '#2a4a8a', ry); fp(x, z, 17); return { door: L(0, Dp / 2 + 3), y }; };
  /* 沉船（傾斜的船身） */
  PT.wreck = A => { const { b, x, z, ry, Hs, P, O, fp } = A; const y = Math.max(.2, Hs(x, z)) - 1.2; P.ship2(b, x, y, z, ry, .9, { sail: '#d8d0c0', hull: '#5a3e26' }); O.push([x, z, 6]); fp(x, z, 8); return { y }; };
  /* 牧場小屋＋穀倉 */
  PT.barn = A => { const { b, x, z, ry, house, Hs } = A, r = house(x, z, 9, 7, 2, ry, { wall: '#b5543c', roof: '#5e3e2a', beam: '#f4ece0', door: '#f4ece0' }); return r; };
  /* 廣場：鋪石圓形＋水井或噴水池＋長椅＋花圃 */
  PT.plaza = A => { const { b, x, z, Hs, O, fp, o, hd } = A, y = Hs(x, z), R = o.r || 10;
    if (o.fountain) { b.m = 3; b.cyl(x, y - .3, z, 3.4, 3.6, .9, 18, '#c8c0b0'); b.m = 7; b.cyl(x, y + .45, z, 3, 3, .1, 18, '#62b8d8'); b.m = 3; b.cyl(x, y - .2, z, .6, .5, 2.6, 10, '#c8c0b0'); b.cyl(x, y + 2.3, z, 1.4, .3, .5, 12, '#c8c0b0'); b.m = 0; O.push([x, z, 3.8]); }
    else { b.m = 3; b.cyl(x, y - .3, z, 1.5, 1.5, 1.2, 12, '#a8a090'); b.m = 1; b.box(x - 1.2, y, z, .2, 2.6, .2, '#6e4c30'); b.box(x + 1.2, y, z, .2, 2.6, .2, '#6e4c30'); b.box(x, y + 2.5, z, 2.8, .2, .4, '#6e4c30'); b.m = 2; b.box(x, y + 2.8, z, 3, .5, 2.2, '#8b3a2e'); b.m = 0; O.push([x, z, 1.8]); }
    if (hd) for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + .3, bx = x + Math.cos(a) * (R - 2), bz = z + Math.sin(a) * (R - 2); if (k % 2) { b.m = 1; b.box(bx, Hs(bx, bz) - .1, bz, 2, .5, .6, '#8a6a46', -a + Math.PI / 2); b.m = 0; } else { b.m = 3; b.cyl(bx, Hs(bx, bz) - .2, bz, 1, 1, .5, 10, '#b4a898'); b.m = 0; for (let q = 0; q < 5; q++) b.sphere(bx + Math.cos(q) * .5, Hs(bx, bz) + .4, bz + Math.sin(q) * .5, .28, 5, ['#ff6a8a', '#ffd34a', '#ffffff', '#b08aff', '#ff9a4a'][q], 1, .2, q); } }
    fp(x, z, R * .4); return { y }; };
  /* 市集攤位（帆布頂） */
  PT.stall = A => { const { b, x, z, ry, Hs, O, o } = A, y = Hs(x, z), L = Lf(x, z, ry), c = o.c || '#c8322b';
    b.m = 1; for (const [lx, lz] of [[-1.5, -.9], [1.5, -.9], [-1.5, .9], [1.5, .9]]) { const [px, pz] = L(lx, lz); b.box(px, y - .1, pz, .15, 2.6, .15, '#6e4c30'); } b.box(x, y - .1, z, 3.2, 1, 1.8, '#8a6a46', ry); b.m = 0; b.box(x, y + 2.5, z, 3.6, .14, 2.4, c, ry, .8);
    for (let q = 0; q < 4; q++) { const [fx, fz] = L(-1.1 + q * .73, 0); b.sphere(fx, y + 1.05, fz, .26, 6, ['#ff9a4a', '#e8553b', '#ffd26c', '#7ac85a'][q]); } O.push([x, z, 1.8]); return { y }; };
  /* 小船（停在水邊） */
  PT.boat = A => { const { b, x, z, ry, P } = A, o = A.o || {}; P.ship2(b, x, .2, z, ry, o.s || .38, { sail: o.sail || '#f4ecd8', masts: o.masts, mastH: o.mastH, len: o.len, w: o.w, flag: o.flag, head: o.head });
    if (o.barrel) { const c = Math.cos(ry), sn = Math.sin(ry), lz = (o.len || 14) * (o.s || .38) * .15; P.barrel(b, x + lz * sn, .2 + 3 * (o.s || .38) * .55, z + lz * c, .7); } /* v153：魯夫出航的小船（無桅、一個木桶） */ return {}; };
})(typeof window !== 'undefined' ? window : globalThis);
