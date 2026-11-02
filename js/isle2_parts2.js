/* v147 新版島嶼的特色建築零件（第二批）：阿拉巴斯坦（王宮、鐘樓、雨宴賭場、金字塔、帳篷、沙埋遺跡、方尖碑、井架）、
   空島（雲之家、黃金鐘、遺跡、巨大豆藤、神之社、雲朵）、司法島（法院、正義之塔、監獄塔、海軍營舍）等共用。
   每個零件收到 { b, x, z, ry, o, Hs, house, O, ST, P, K, fp, flatPad, hd, D, CHIMNEYS, r, markB } ，回傳門口位置等資訊。 */
(function (global) {
  const ISLE2 = global.ISLE2 = global.ISLE2 || {}; ISLE2.parts = ISLE2.parts || {}; const PT = ISLE2.parts;
  const { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  const ring = (n, f) => { for (let i = 0; i < n; i++) f(i / n * 6.2832, i); };

  /* ---------- 阿拉巴斯坦 ---------- */
  /* 王宮：沙岩主殿＋中央大圓頂＋四角塔與洋蔥頂＋列柱門廊 */
  PT.palace = A => { const { b, x, z, ry, Hs, O, fp, flatPad, hd, o } = A, L = Lf(x, z, ry), y = Hs(x, z), W = o.w || 34, Dp = o.d || 22, c1 = o.c || '#ecd8b0', c2 = shade(c1, .86), dome = o.dome || '#f4ead8';
    flatPad(x, z, W + 4, Dp + 4, ry, y); b.m = 3; b.box(x, y - 1.2, z, W + 3, 2, Dp + 3, '#cdb48a', ry); b.m = 4;
    b.box(x, y + .7, z, W, 11, Dp, c1, ry); b.box(x, y + 11.6, z, W + .8, .8, Dp + .8, c2, ry); b.box(x, y + 12.3, z, W * .55, 6, Dp * .6, c1, ry); b.m = 2;
    b.sphere(x, y + 18.2, z, Dp * .32, hd ? 14 : 9, dome, .9); b.m = 0; b.cyl(x, y + 23.8, z, .25, .1, 3, 6, '#d8a03a'); b.sphere(x, y + 26.8, z, .5, 6, '#ffd24a');
    for (const [a, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [tx, tz] = L(a * W / 2, e * Dp / 2); b.m = 4; b.cyl(tx, y - .5, tz, 3, 2.7, 18, 12, c2); b.box(tx, y + 17.4, tz, 6.6, .7, 6.6, c1, ry); b.m = 2; b.sphere(tx, y + 20, tz, 2.6, 9, dome, 1.15); b.m = 0; b.cyl(tx, y + 22.6, tz, .14, .05, 2, 5, '#d8a03a'); O.push([tx, tz, 3.4]); }
    /* 列柱門廊 */
    for (let k = 0; k < 8; k++) { const [cx, cz] = L(-10.5 + k * 3, Dp / 2 + 3.2); b.m = 3; b.cyl(cx, y - .2, cz, .7, .6, 9, 10, '#f4e8d0'); b.box(cx, y + 8.7, cz, 1.6, .5, 1.6, '#e8d8b8', ry); O.push([cx, cz, .9]); }
    { const [px, pz] = L(0, Dp / 2 + 3.2); b.m = 4; b.box(px, y + 9.1, pz, 25, 1.4, 4, c1, ry); b.m = 2; b.box(px, y + 10.4, pz, 26, 1.8, 4.6, c2, ry, .4); b.m = 0;
      const [dx, dz] = L(0, Dp / 2 + .1); b.box(dx, y + .2, dz, 4.6, 7.4, .3, '#6a4426', ry); b.box(dx, y + 6, dz, 5.4, .5, .4, '#d8a03a', ry); }
    if (hd) for (let k = 0; k < 6; k++) { const [wx, wz] = L(-13 + k * 5.2, Dp / 2 + .1); if (Math.abs(-13 + k * 5.2) < 4) continue; b.box(wx, y + 5.2, wz, 1.6, 3.2, .2, '#3a2a1e', ry); b.box(wx, y + 8.3, wz, 1.9, .5, .3, '#d8a03a', ry); }
    /* 旗幟 */
    for (const sd of [-1, 1]) { const [fx, fz] = L(sd * 6, -Dp / 2 + 2); b.cyl(fx, y + 18, fz, .12, .1, 9, 5, '#e8e0d0'); b.box(fx + 1.4, y + 25.2, fz, 2.8, 1.8, .08, '#c8a03a', ry); }
    O.push([x, z, Math.max(W, Dp) / 2]); A.markB && A.markB(x, z, Math.min(W, Dp) / 2 + 1); fp(x, z, Math.max(W, Dp) / 2 + 4); return { door: L(0, Dp / 2 + 8), y }; };
  /* 鐘樓（阿爾巴那的時計台） */
  PT.clocktower = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o } = A, y = Hs(x, z), c = o.c || '#ead6ae'; flatPad(x, z, 8, 8, ry, y);
    b.m = 3; b.box(x, y - 1, z, 8, 2, 8, '#cdb48a', ry); b.m = 4; b.box(x, y + .8, z, 6, 22, 6, c, ry); b.box(x, y + 22.6, z, 7.2, 1, 7.2, shade(c, .86), ry); b.box(x, y + 23.4, z, 5, 4.6, 5, c, ry);
    const L = Lf(x, z, ry); for (let k = 0; k < 4; k++) { const a = ry + k * Math.PI / 2, cx = x + Math.sin(a) * 2.56, cz = z + Math.cos(a) * 2.56; b.m = 0; b.box(cx, y + 24.2, cz, 3, 3, .2, '#fff8e8', a); b.box(cx + Math.sin(a) * .12, y + 25.6, cz + Math.cos(a) * .12, .18, 1.2, .1, '#3a2a1e', a); b.box(cx + Math.sin(a) * .12, y + 25.6, cz + Math.cos(a) * .12, .9, .16, .1, '#3a2a1e', a); }
    b.m = 2; b.sphere(x, y + 28.8, z, 3, 10, '#f4ead8', 1.1); b.m = 0; b.cyl(x, y + 31.8, z, .14, .05, 2.2, 5, '#d8a03a');
    for (let k = 0; k < 3; k++) { const [wx, wz] = L(0, 3.05); b.box(wx, y + 4 + k * 6, wz, 1.4, 2.6, .14, '#3a2a1e', ry); }
    O.push([x, z, 4.4]); fp(x, z, 6); return { door: L(0, 6), y }; };
  /* 雨宴：階梯金字塔造型的賭場＋屋頂上的金色鱷魚＋前方鱷魚池 */
  PT.casino = A => { const { b, x, z, ry, Hs, O, fp, flatPad, hd, o } = A, L = Lf(x, z, ry), y = Hs(x, z); flatPad(x, z, 28, 28, ry, y);
    b.m = 3; for (let k = 0; k < 5; k++) b.box(x, y - .5 + k * 3.4, z, 28 - k * 5, 3.5, 28 - k * 5, k % 2 ? '#e8c47a' : '#d8b068', ry); b.m = 0;
    /* 金色鱷魚 */
    const gy = y + 16.4, g = '#e8b830'; b.box(x, gy, z, 3.2, 2, 9, g, ry); const [hx, hz] = L(0, 5.6); b.box(hx, gy + .2, hz, 2.4, 1.4, 4, g, ry, .9); const [tx, tz] = L(0, -6.4); b.box(tx, gy + .2, tz, 1.4, 1.2, 5, g, ry, .4);
    for (const [lx, lz] of [[-1.8, 2.6], [1.8, 2.6], [-1.8, -2.6], [1.8, -2.6]]) { const [px, pz] = L(lx, lz); b.box(px, gy - 1.2, pz, .9, 1.4, 1.2, shade(g, .85), ry); }
    for (const sd of [-1, 1]) { const [ex, ez] = L(sd * .7, 6.6); b.sphere(ex, gy + 1.8, ez, .32, 6, '#ffffff'); }
    /* 入口 */
    const [dx, dz] = L(0, 14.1); b.box(dx, y + .1, dz, 6, 6, .4, '#6a3e22', ry); b.box(dx, y + 6, dz, 8, 1.4, .6, '#c8322b', ry);
    for (let k = 0; k < (hd ? 10 : 5); k++) { const [lx, lz] = L(-6 + k * 1.33 * (hd ? 1 : 2), 14.3); b.sphere(lx, y + 7.2, lz, .22, 5, ['#ff5a5a', '#ffd24a', '#5ad0ff'][k % 3]); }
    O.push([x, z, 13.5]); A.markB && A.markB(x, z, 13); fp(x, z, 18); return { door: L(0, 18), y }; };
  /* 金字塔（王家之墓） */
  PT.pyramid = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o } = A, y = Hs(x, z), S = o.s || 30, n = 10; flatPad(x, z, S, S, ry, y); b.m = 3;
    for (let k = 0; k < n; k++) b.box(x, y - .6 + k * S * .07, z, S * (1 - k / n), S * .07 + .05, S * (1 - k / n), mix('#d8b878', '#c8a468', (k % 2) * .6), ry); b.m = 0;
    const L = Lf(x, z, ry), [dx, dz] = L(0, S / 2 - S * .2); b.box(dx, y - .2, dz, 3.6, 5, .5, '#3a2a1e', ry, .7); O.push([x, z, S * .48]); A.markB && A.markB(x, z, S * .45); fp(x, z, S * .62); return { y }; };
  /* 方尖碑 */
  PT.obelisk = A => { const { b, x, z, Hs, O } = A, y = Hs(x, z); b.m = 3; b.box(x, y - .4, z, 2.4, 1.2, 2.4, '#cdb48a'); b.box(x, y + .8, z, 1.4, 11, 1.4, '#e4cc98', 0, .55); b.box(x, y + 11.8, z, .8, 1.2, .8, '#e8b830', 0, .1); b.m = 0; O.push([x, z, 1.6]); return { y }; };
  /* 帳篷（叛亂軍營地、商隊） */
  PT.tent = A => { const { b, x, z, ry, Hs, O, o } = A, y = Hs(x, z), R = o.r || 3.2, c = o.c || '#e8dcc0'; b.m = 0; b.cyl(x, y - .2, z, R, .2, R * 1.3, 10, c, null, ry); b.box(x + Math.sin(ry) * R * .7, y - .1, z + Math.cos(ry) * R * .7, 1.2, 1.8, .2, '#5a3e26', ry, .5);
    b.cyl(x, y + R * 1.2, z, .08, .06, 1.6, 4, '#6e4c30'); b.box(x + .5, y + R * 1.2 + 1.2, z, 1, .6, .05, o.flag || '#c8322b', ry); O.push([x, z, R * .9]); A.fp(x, z, R + 1); return { y }; };
  /* 沙埋的遺跡（尤巴）：半埋的屋子與斷柱 */
  PT.ruin = A => { const { b, x, z, ry, Hs, O, fp, o } = A, y = Hs(x, z), L = Lf(x, z, ry), w = o.w || 7, d = o.d || 6, c = o.c || '#dcc08c';
    b.m = 4; b.box(x, y - 2, z, w, 3.4 + (o.h || 0), d, c, ry); const [ax, az] = L(-w / 2 + .6, 0); b.box(ax, y + 1.2, az, 1.2, 1.6 + (o.h || 0), d, shade(c, .92), ry); b.m = 2; b.sphere(...L(w * .15, -d * .1).slice(0, 1), y + 1.2, L(w * .15, -d * .1)[1], Math.min(w, d) * .35, 8, shade(c, 1.04), .55); b.m = 0;
    for (let k = 0; k < 3; k++) { const [cx, cz] = L(w / 2 + 1.6, -d / 2 + k * d / 2); b.m = 3; b.cyl(cx, y - .4, cz, .5, .45, 1.2 + (k * 1.7) % 3, 8, '#e8d4a8'); b.m = 0; }
    O.push([x, z, Math.max(w, d) / 2]); fp(x, z, Math.max(w, d) / 2 + 2); return { door: L(0, d / 2 + 2), y }; };
  /* 井架（托托挖井的地方） */
  PT.well = A => { const { b, x, z, Hs, O, fp } = A, y = Hs(x, z); b.m = 3; b.cyl(x, y - .6, z, 1.8, 1.9, 1.1, 14, '#a99070', '#3a2a1e'); b.m = 1; [-1.4, 1.4].forEach(k => b.box(x + k, y - .1, z, .2, 3.2, .2, '#6b4a2f')); b.box(x, y + 3, z, 3.2, .22, .22, '#6b4a2f'); b.cyl(x, y + 1.8, z, .05, .05, 1.2, 4, '#c8b088');
    b.cyl(x + 2.6, y - .1, z + .6, .5, .45, .9, 8, '#8a5a32'); b.box(x - 2.4, y - .1, z - .8, .4, .2, 2.2, '#8a6a46', .6); b.m = 0; O.push([x, z, 2.2]); fp(x, z, 3.5); return { y }; };
  /* 碼頭邊的大帆船 */
  PT.bigship = A => { const { b, x, z, ry, P, o } = A; P.ship2(b, x, .1, z, ry, o.s || .7, { sail: o.sail || '#f4ecd8', hull: o.hull }); A.O.push([x, z, 5 * (o.s || .7) / .7]); return {}; };

  /* ---------- 空島 ---------- */
  /* 雲之家：白色圓屋＋圓頂（天使島的房子） */
  PT.cloudhut = A => { const { b, x, z, ry, Hs, O, fp, o, hd } = A, y = o.y != null ? o.y : Hs(x, z), R = o.r || 3.4, c = o.c || '#ffffff', rc = o.roof || '#7ab0e0';
    b.m = 4; b.cyl(x, y - .6, z, R, R * .96, 4.2 + (o.fl > 1 ? 3.6 : 0), hd ? 16 : 10, c); b.m = 2; b.sphere(x, y + 3.6 + (o.fl > 1 ? 3.6 : 0), z, R * 1.04, hd ? 12 : 8, rc, .62); b.m = 0;
    const dx = x + Math.sin(ry) * R, dz = z + Math.cos(ry) * R; b.box(dx, y - .1, dz, 1.4, 2.4, .3, '#a8c8e8', ry); b.sphere(dx, y + 2.4, dz, .7, 6, '#a8c8e8', .5);
    if (hd) ring(4, a => { if (Math.abs(((a - ry + 9.42) % 6.283) - 3.14) < .6) return; b.box(x + Math.sin(a) * R, y + 1.6, z + Math.cos(a) * R, 1, 1, .2, '#3a5a8a', a); });
    O.push([x, z, R + .2]); fp(x, z, R + 1.4); return { door: [x + Math.sin(ry) * (R + 2.2), z + Math.cos(ry) * (R + 2.2)], y }; };
  /* 黃金鐘（香朵拉的大鐘）：鐘架＋金色大鐘 */
  PT.goldbell = A => { const { b, x, z, Hs, O, fp, o } = A, y = o.y != null ? o.y : Hs(x, z); b.m = 3; b.box(x, y - .5, z, 12, 1.2, 12, '#a89c80'); for (const [a, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(x + a * 4.6, y, z + e * 4.6, 1.4, 13, 1.4, '#b8a888');
    b.box(x, y + 13, z, 11.4, 1.4, 11.4, '#a89c80'); b.m = 0; b.cyl(x, y + 5.4, z, 3.8, 2.2, 6.4, 18, '#f0c030', '#f8d860'); b.sphere(x, y + 11.8, z, 2.3, 10, '#f0c030', .6); b.cyl(x, y + 4.6, z, 3.9, 3.9, .8, 18, '#e0a820');
    O.push([x, z, 7]); fp(x, z, 9); return { y }; };
  /* 香迪亞遺跡：斷柱、石台、倒下的石塊 */
  PT.shandoraRuin = A => { const { b, x, z, ry, Hs, O, fp, o, hd } = A, R = o.r || 14; let s = 7; const rn = () => (s = s * 16807 % 2147483647) / 2147483647;
    for (let k = 0; k < (hd ? 16 : 9); k++) { const a = rn() * 6.283, d = R * (.3 + rn() * .7), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, py = Hs(px, pz), h = 2 + rn() * 7; b.m = 3;
      if (rn() < .6) { b.cyl(px, py - .5, pz, .9, .8, h, 10, mix('#c8b890', '#b0a078', rn())); if (h > 6) b.box(px, py + h - .5, pz, 2.2, .6, 2.2, '#c0b088'); O.push([px, pz, 1.1]); } else { b.box(px, py - .3, pz, 3 + rn() * 3, 1.2, 1.6, mix('#c8b890', '#a89870', rn()), a); } }
    b.m = 3; const y = Hs(x, z); b.box(x, y - .6, z, 9, 1.4, 9, '#b8a880', ry); b.box(x, y + .8, z, 6, 1, 6, '#c8b890', ry); b.m = 0; fp(x, z, R * .5); return { y }; };
  /* 巨大豆藤（通往上層的地標，不能爬，坡道另做） */
  PT.beanstalk = A => { const { b, x, z, Hs, O, fp, o, hd } = A, y = Hs(x, z), H = o.h || 60; b.m = 5;
    for (let k = 0; k < (hd ? 28 : 16); k++) { const t = k / (hd ? 28 : 16), a = t * 9, r = 3.2 * (1 - t * .5); b.cyl(x + Math.cos(a) * 1.4, y - 1 + t * H, z + Math.sin(a) * 1.4, r, r * .92, H / (hd ? 28 : 16) + .4, 10, mix('#4a8a3a', '#6aa84a', (k % 3) / 3), null, 0, null);
      if (k % 3 === 0) { b.m = 0; b.sphere(x + Math.cos(a + 1.6) * 5, y + t * H, z + Math.sin(a + 1.6) * 5, 2.4, 6, '#7ac85a', .35, .2, k + 1); b.m = 5; } }
    b.m = 0; O.push([x, z, 4]); fp(x, z, 6); return { y }; };
  /* 神之社（艾尼路的神殿） */
  PT.shrine = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o } = A, L = Lf(x, z, ry), y = Hs(x, z); flatPad(x, z, 18, 14, ry, y);
    b.m = 3; for (let k = 0; k < 3; k++) b.box(x, y - .6 + k * .7, z, 18 - k * 2, .8, 14 - k * 2, '#d8d4c8', ry); b.m = 4; b.box(x, y + 1.4, z, 11, 6, 8, '#f4f0e8', ry);
    for (let k = 0; k < 6; k++) { const [cx, cz] = L(-6 + k * 2.4, 5); b.m = 3; b.cyl(cx, y + 1.2, cz, .5, .45, 6.4, 10, '#ffffff'); O.push([cx, cz, .6]); }
    b.m = 2; b.box(x, y + 7.4, z, 15, 1, 12, '#c8a040', ry); b.box(x, y + 8.4, z, 12, 1.6, 9, '#e8c050', ry, .3); b.m = 0; const [dx, dz] = L(0, 4.1); b.box(dx, y + 1.4, dz, 2.4, 3.6, .2, '#3a2a1e', ry);
    O.push([x, z, 7]); fp(x, z, 10); return { door: L(0, 9), y }; };
  /* 雲朵堆（雲海上的裝飾，不能走） */
  PT.cloudpuff = A => { const { b, x, z, o } = A, y = o.y != null ? o.y : 0, R = o.r || 6; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + x, d = R * (.2 + (k % 3) * .25); b.sphere(x + Math.cos(a) * d, y + (k % 2) * R * .2, z + Math.sin(a) * d, R * (.5 + (k % 3) * .15), 7, mix('#ffffff', '#eef4ff', (k % 2) * .6), .55, .2, k + 3); } return { y }; };

  /* ---------- 司法島／海軍 ---------- */
  /* 法院（司法島本館）：白色大樓、前廊列柱、三角楣、旗 */
  PT.court = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o, hd } = A, L = Lf(x, z, ry), y = Hs(x, z), W = o.w || 30, Dp = o.d || 18; flatPad(x, z, W + 6, Dp + 8, ry, y);
    b.m = 3; for (let k = 0; k < 3; k++) { const [sx, sz] = L(0, Dp / 2 + 3 - k * .8); b.box(sx, y - .6 + k * .5, sz, W * .6, .6, 2.4, '#d8d8d8', ry); } b.m = 4; b.box(x, y, z, W, 14, Dp, '#f4f4f0', ry); b.box(x, y + 14, z, W + 1, 1, Dp + 1, '#d8d8d4', ry);
    b.box(x, y + 15, z, W * .5, 6, Dp * .6, '#f4f4f0', ry); b.m = 2; b.box(x, y + 21, z, W * .54, 1.4, Dp * .64, '#5a6a80', ry, .6);
    for (let k = 0; k < 8; k++) { const [cx, cz] = L(-W * .3 + k * W * .6 / 7, Dp / 2 + 1.6); b.m = 3; b.cyl(cx, y - .2, cz, .7, .6, 12, 10, '#ffffff'); O.push([cx, cz, .8]); }
    { const [px, pz] = L(0, Dp / 2 + 1.6); b.m = 4; b.box(px, y + 11.8, pz, W * .66, 1.6, 3.6, '#f0f0ec', ry); b.box(px, y + 13.4, pz, W * .66, 2.4, 3.6, '#e8e8e4', ry, .1); b.m = 0; b.box(px, y + 9, pz + .1, 4.4, 1.6, .2, '#1a2a4a', ry); }
    if (hd) for (let f = 0; f < 3; f++) for (let k = 0; k < 8; k++) { const lx = -W / 2 + 2 + k * (W - 4) / 7; for (const sd of [-1, 1]) { const [wx, wz] = L(lx, sd * (Dp / 2 + .05)); b.box(wx, y + 2 + f * 4, wz, 1.4, 2.2, .14, '#2c3e58', ry); } }
    const [fx, fz] = L(0, -2); b.cyl(fx, y + 22, fz, .15, .12, 9, 6, '#e8e4dc'); b.box(fx + 1.6, y + 29.4, fz, 3.2, 2, .06, '#ffffff', ry); b.m = 0;
    O.push([x, z, Math.max(W, Dp) / 2]); A.markB && A.markB(x, z, Math.min(W, Dp) / 2 + 1); fp(x, z, W / 2 + 4); return { door: L(0, Dp / 2 + 6), y }; };
  /* 塔（正義之塔、監獄塔、瞭望塔） */
  PT.tower = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o } = A, y = Hs(x, z), R = o.r || 5, H = o.h || 30, c = o.c || '#d8d8dc', rc = o.roof || '#4a5a7a'; flatPad(x, z, R * 2 + 2, R * 2 + 2, 0, y);
    b.m = 3; b.cyl(x, y - 1, z, R + .8, R + .6, 2, 16, shade(c, .85)); b.m = 4; b.cyl(x, y + .8, z, R, R * .9, H, 16, c); b.m = 3; b.cyl(x, y + H + .6, z, R * 1.15, R * 1.15, 1.6, 16, shade(c, .9));
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; if (k % 2) b.box(x + Math.cos(a) * R * 1.05, y + H + 2.1, z + Math.sin(a) * R * 1.05, 1.2, 1, 1.2, shade(c, .95), -a); }
    if (rc) { b.m = 2; b.cyl(x, y + H + 2.2, z, R * .9, 0, R * 1.4, 16, rc); } b.m = 0;
    for (let k = 0; k < Math.floor(H / 6); k++) { const a = ry + k * 1.3; b.box(x + Math.sin(a) * R * .93, y + 4 + k * 6, z + Math.cos(a) * R * .93, 1.1, 2, .3, o.win || '#2c3e58', a); }
    if (o.flag) { b.cyl(x, y + H + 2 + R * 1.4, z, .1, .08, 5, 5, '#e8e4dc'); b.box(x + 1.2, y + H + 5.6 + R * 1.4, z, 2.4, 1.4, .06, o.flag, ry); }
    const dx = x + Math.sin(ry) * R, dz = z + Math.cos(ry) * R; b.box(dx, y - .1, dz, 2.4, 3.6, .4, '#3a3430', ry);
    O.push([x, z, R + .6]); A.markB && A.markB(x, z, R); fp(x, z, R + 3); return { door: [x + Math.sin(ry) * (R + 3), z + Math.cos(ry) * (R + 3)], y }; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 正義之門：海上兩根巨柱＋巨大的門扉 */
  PT.justiceGate = A => { const { b, x, z, ry, o } = A, L = Lf(x, z, ry), W = o.w || 60, H = o.h || 70; b.m = 3;
    for (const sd of [-1, 1]) { const [px, pz] = L(sd * W / 2, 0); b.box(px, -6, pz, 12, H + 6, 14, '#9aa0aa', ry); b.box(px, H, pz, 14, 3, 16, '#b8bec8', ry); }
    for (const sd of [-1, 1]) { const [dx, dz] = L(sd * W / 4, 1); b.box(dx, -4, dz, W / 2 - 1, H - 6, 3, '#7a8290', ry); b.m = 0; b.box(dx, H * .5, dz + .1, W / 2 - 6, 3, 3.4, '#c8a040', ry); b.m = 3; }
    const [tx, tz] = L(0, 0); b.box(tx, H - 4, tz, W + 8, 6, 12, '#a8aeb8', ry); b.m = 0; b.box(tx, H - 2, tz + 6.2, 16, 4, .3, '#1a2a4a', ry); return {}; };
  /* 海列車（月台、鐵軌、火車頭） */
  PT.seatrain = A => { const { b, x, z, ry, Hs, ST, o, O } = A, L = Lf(x, z, ry), n = o.n || 40; b.m = 1;
    for (let k = 0; k < n; k++) { const [rx, rz] = L(0, k * 2); b.box(rx, -.5, rz, 3.6, .3, .5, '#6e4c30', ry); for (const sd of [-1, 1]) { const [qx, qz] = L(sd * 1.1, k * 2); b.box(qx, -.2, qz, .2, .2, 2.1, '#5a5a62', ry); } }
    b.m = 0; const [cx, cz] = L(0, 10); b.box(cx, 0, cz, 3.4, 3.2, 9, '#3a3a44', ry); b.cyl(...L(0, 7).slice(0, 1), 3.2, L(0, 7)[1], .6, .7, 2.4, 8, '#2a2a30'); b.box(...L(0, 13).slice(0, 1), 0, L(0, 13)[1], 3.6, 5, 3.4, '#8a2a22', ry); b.box(...L(0, 13).slice(0, 1), 5, L(0, 13)[1], 4, .6, 3.8, '#3a3a44', ry);
    O.push([cx, cz, 4]); return {}; };
  /* 月台（可以走） */
  PT.platform = A => { const { b, x, z, ry, Hs, ST, o } = A, w = o.w || 14, d = o.d || 30, y = o.y || 2.2; b.m = 3; b.box(x, -4, z, w, y + 4, d, '#b8b4ac', ry); b.box(x, y - .05, z, w + .3, .2, d + .3, '#d8d4cc', ry); b.m = 0;
    ST.plats.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2, y0: y, y1: y }); for (let k = 0; k < 3; k++) { b.cyl(x - w / 2 + 1, y, z - d / 2 + 4 + k * 10, .14, .12, 4, 6, '#3a3430'); b.box(x - w / 2 + 1, y + 4, z - d / 2 + 4 + k * 10, .5, .5, .5, '#ffe2a0'); } return { y }; };
  /* 訓練場（海軍）：圍欄沙地＋靶子 */
  PT.yard = A => { const { b, x, z, Hs, O, fp, o } = A, y = Hs(x, z), R = o.r || 10; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283, px = x + Math.cos(a) * R * .6, pz = z + Math.sin(a) * R * .6; b.m = 1; b.cyl(px, Hs(px, pz) - .2, pz, .15, .15, 2.4, 6, '#6e4c30'); b.m = 0; b.cyl(px, Hs(px, pz) + 1.6, pz, .7, .7, .2, 12, '#e8e4dc', '#c8322b'); O.push([px, pz, .6]); } fp(x, z, R * .7); return { y }; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 巨大船身：沿著船殼多邊形蓋木板側壁、砲門、船首像、船尾窗 */
  PT.hull = A => { const { b, o, Hs, hd, I } = A, SC = I.SC, P = o.poly.map(p => [p[0] * SC, p[1] * SC]); P.push(P[0]);
    for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 3), ang = Math.atan2(bx - ax, bz - az);
      for (let k = 0; k < n; k++) { const t = (k + .5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, cx = (x + 0) * .985, cz = z * .992, top = Hs(cx, cz);
        for (let s = 0; s < 4; s++) { b.m = 1; b.box(x, -6 + s * (top + 6.4) / 4, z, 1.4, (top + 6.4) / 4 + .05, L / n + .1, mix(o.c || '#5a4232', '#4a3626', (s + k) % 2 * .7), ang); }
        if (hd && k % 2 === 0) { b.m = 0; b.box(x, top - 4, z, 1.6, 1.2, 1.4, '#1a1418', ang); } } }
    b.m = 0; const [fx, fz] = P.reduce((m, p) => p[1] < m[1] ? p : m, P[0]); b.cyl(fx, 6, fz - 4, 2.4, .6, 10, 8, '#6a5a6a', null, 0, [0, -6]); b.sphere(fx, 17, fz - 9, 3, 8, '#7a6a7a');
    const [sx, sz] = P.reduce((m, p) => p[1] > m[1] ? p : m, P[0]); for (let k = 0; k < 5; k++) b.box(sx - 12 + k * 6, Hs(sx, sz - 6) - 5, sz + .6, 3, 3, .3, '#ffcf6a'); return {}; };
  /* 桅杆：粗柱、橫桁、破帆、瞭望台 */
  PT.mast = A => { const { b, x, z, Hs, O, fp, o, hd } = A, y = Hs(x, z), H = o.h || 64; b.m = 3; b.cyl(x, y - .5, z, 4.2, 4.6, 1.4, 14, '#6a6058'); b.m = 1; b.cyl(x, y, z, 2.2, 1.4, H, 12, '#4a3626');
    for (const [hy, w] of [[.35, 34], [.6, 28], [.82, 20]]) { b.box(x, y + H * hy, z, w, .9, .9, '#3a2a1e'); b.m = 0; for (let k = 0; k < 3; k++) b.box(x - w / 3 + k * w / 3, y + H * hy - H * .2, z + .2, w / 3 - .6, H * .19, .2, mix('#8a8278', '#6a645c', (k % 2) * .6), 0, .9); b.m = 1; }
    b.cyl(x, y + H * .9, z, 3, 3.2, 1.6, 12, '#3a2a1e'); b.m = 0; b.box(x + 1.6, y + H + 1, z, 3.4, 2, .08, '#1a1a1e'); O.push([x, z, 3]); A.markB && A.markB(x, z, 2.6); fp(x, z, 6); return { y }; };
  /* 莫利亞的城堡：暗色石牆、四座紫色尖塔、中央主堡 */
  PT.darkcastle = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o, hd } = A, L = Lf(x, z, ry), y = Hs(x, z), W = o.w || 36, Dp = o.d || 26, c = '#5a5662', r = '#4a2e5a';
    b.m = 3; b.box(x, y - 1, z, W, 14, Dp, c, ry); for (let k = 0; k < Math.floor(W / 3); k++) { const [px, pz] = L(-W / 2 + 1.5 + k * 3, Dp / 2); b.box(px, y + 13, pz, 1.4, 1.4, 1.4, shade(c, 1.1), ry); }
    b.box(x, y + 13, z, W * .5, 14, Dp * .55, shade(c, .92), ry); b.m = 2; b.cyl(x, y + 27, z, W * .3, 0, 16, 4, r, null, ry + .785); b.m = 0;
    for (const [a, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [tx, tz] = L(a * W / 2, e * Dp / 2); b.m = 3; b.cyl(tx, y - 1, tz, 4, 3.6, 24, 12, shade(c, .95)); b.m = 2; b.cyl(tx, y + 23, tz, 4.8, 0, 11, 12, r); b.m = 0; O.push([tx, tz, 4.4]); }
    if (hd) for (let f = 0; f < 2; f++) for (let k = 0; k < 6; k++) { const [wx, wz] = L(-W / 2 + 4 + k * (W - 8) / 5, Dp / 2 + .1); b.box(wx, y + 3 + f * 5.5, wz, 1.4, 2.6, .2, '#ffcf6a', ry); }
    const [dx, dz] = L(0, Dp / 2 + .1); b.box(dx, y, dz, 5, 8, .4, '#2a1e18', ry); b.cyl(...[L(0, Dp / 2 + .2)[0]], y + 8, L(0, Dp / 2 + .2)[1], 2.5, 2.5, .4, 12, '#2a1e18');
    O.push([x, z, Math.min(W, Dp) / 2]); A.markB && A.markB(x, z, Math.min(W, Dp) / 2); fp(x, z, W / 2 + 4); return { door: L(0, Dp / 2 + 6), y }; };
  /* 墓園：墓碑、十字架、鐵柵 */
  PT.graveyard = A => { const { b, x, z, Hs, O, fp, o, hd } = A, R = o.r || 14; let s = 11; const rn = () => (s = s * 16807 % 2147483647) / 2147483647;
    for (let k = 0; k < (hd ? 34 : 18); k++) { const a = rn() * 6.283, d = Math.sqrt(rn()) * R, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, py = Hs(px, pz); if (A.I.roadAt(px, pz)) continue; b.m = 3;
      if (rn() < .7) { b.box(px, py - .3, pz, 1.1, 1.6 + rn() * .6, .35, mix('#8a8690', '#6a6670', rn()), rn() - .5); } else { b.box(px, py - .3, pz, .25, 2.4, .25, '#7a7680'); b.box(px, py + 1.3, pz, 1.2, .25, .25, '#7a7680'); } b.m = 0; }
    fp(x, z, R * .3); return { y: Hs(x, z) }; };
  /* 豪宅（霍古巴克的宅邸）：三層＋兩座角塔 */
  PT.mansion = A => { const { b, x, z, ry, house, O, o } = A, L = Lf(x, z, ry), r = house(x, z, o.w || 20, o.d || 13, 3, ry, { style: 'spooky', exact: true, balcony: true, roof: o.roof || '#3a2e44', wall: o.wall || '#6a6470' });
    for (const sd of [-1, 1]) { const [tx, tz] = L(sd * (o.w || 20) / 2, (o.d || 13) / 2); b.m = 3; b.cyl(tx, r.y - .5, tz, 2.4, 2.2, 14, 12, '#5a5662'); b.m = 2; b.cyl(tx, r.y + 13.5, tz, 3, 0, 6, 12, '#4a2e5a'); b.m = 0; O.push([tx, tz, 2.6]); } return r; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 海軍本部：白色多層天守造型＋「海軍」看板＋旗 */
  PT.marineHQ = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o, hd } = A, L = Lf(x, z, ry), y = Hs(x, z), W = o.w || 46, Dp = o.d || 30; flatPad(x, z, W + 6, Dp + 6, ry, y);
    b.m = 3; b.box(x, y - 1.5, z, W + 6, 3, Dp + 6, '#b8b8bc', ry); let yy = y + 1.5, w = W, d = Dp;
    for (let t = 0; t < 4; t++) { const h = t === 0 ? 14 : 9; b.m = 4; b.box(x, yy, z, w, h, d, '#f4f6f8', ry); b.m = 2; b.box(x, yy + h, z, w + 3, 1.2, d + 3, '#2a4a8a', ry, .86);
      if (hd) for (let k = 0; k < Math.floor(w / 4); k++) { const [wx, wz] = L(-w / 2 + 2 + k * 4, d / 2 + .05); b.m = 0; b.box(wx, yy + 3, wz, 1.6, h - 6, .14, '#2c3e58', ry); }
      yy += h + 1.2; w *= .74; d *= .74; }
    b.m = 2; b.cyl(x, yy, z, w * .6, 0, 8, 4, '#2a4a8a', null, ry + .785); b.m = 0;
    const [sx, sz] = L(0, Dp / 2 + .2); b.box(sx, y + 22, sz, 16, 9, .4, '#ffffff', ry); b.box(sx, y + 23, sz + .05, 12, 7, .45, '#1a3a7a', ry);
    const [fx, fz] = L(0, 0); b.cyl(fx, yy + 7, fz, .2, .15, 14, 6, '#e8e4dc'); b.box(fx + 2.6, yy + 18, fz, 5.2, 3, .08, '#ffffff', ry);
    const [dx, dz] = L(0, Dp / 2 + .1); b.box(dx, y + 1.5, dz, 8, 9, .4, '#3a3430', ry);
    O.push([x, z, Math.min(W, Dp) / 2]); A.markB && A.markB(x, z, Math.min(W, Dp) / 2 + 1); fp(x, z, W / 2 + 5); return { door: L(0, Dp / 2 + 6), y }; };
  /* 處刑台：石造台座上的木架 */
  PT.scaffold = A => { const { b, x, z, Hs, O, o } = A, y = Hs(x, z); b.m = 1; for (const [a, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.box(x + a * 4, y - .2, z - 3 + e * 2, .6, 9, .6, '#5e3e2a');
    b.box(x, y + 8.6, z - 3, 9.4, .7, 5, '#6e4c30'); b.box(x, y + 9.3, z - 3, 7, 4, .5, '#4a3220'); b.m = 0; O.push([x - 4, z - 5, .6], [x + 4, z - 5, .6], [x - 4, z - 1, .6], [x + 4, z - 1, .6]); return { y }; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 龍宮城：珊瑚粉紅的宮殿、貝殼圓頂、兩側尖塔、正面大階梯 */
  PT.ryugu = A => { const { b, x, z, ry, Hs, O, fp, flatPad, hd, o } = A, L = Lf(x, z, ry), y = Hs(x, z), W = 40, Dp = 26; flatPad(x, z, W + 4, Dp + 4, ry, y);
    b.m = 4; b.box(x, y, z, W, 12, Dp, '#f8d8e4', ry); b.box(x, y + 12, z, W * .7, 10, Dp * .7, '#fbe4ec', ry); b.m = 2; b.sphere(x, y + 22, z, Dp * .32, hd ? 14 : 9, '#ff9ab8', 1); b.m = 0; b.sphere(x, y + 30.5, z, 1.2, 8, '#ffe070');
    for (const sd of [-1, 1]) { const [tx, tz] = L(sd * (W / 2 + 2), 0); b.m = 4; b.cyl(tx, y - .5, tz, 3.4, 2.6, 26, 12, '#fff0f4'); b.m = 2; b.cyl(tx, y + 25.4, tz, 3.8, 0, 9, 12, '#ff7aa0'); b.m = 0; O.push([tx, tz, 3.6]);
      const [ux, uz] = L(sd * (W / 2 - 6), Dp / 2); b.m = 2; b.sphere(ux, y + 12, uz, 3.4, 9, '#9ad8f0', .8); b.m = 0; }
    if (hd) for (let k = 0; k < 8; k++) { const [wx, wz] = L(-W / 2 + 3 + k * (W - 6) / 7, Dp / 2 + .1); b.box(wx, y + 3, wz, 1.6, 4, .2, '#5ab0d8', ry); }
    const [dx, dz] = L(0, Dp / 2 + .1); b.box(dx, y, dz, 6, 8, .3, '#ffd25a', ry); b.cyl(...[L(0, Dp / 2 + .2)[0]], y + 8, L(0, Dp / 2 + .2)[1], 3, 3, .4, 14, '#ffd25a');
    O.push([x, z, Math.min(W, Dp) / 2]); A.markB && A.markB(x, z, Math.min(W, Dp) / 2 + 1); fp(x, z, W / 2 + 5); return { door: L(0, Dp / 2 + 6), y }; };
  /* 陽光樹伊布：從上方垂下的巨大樹根＋光柱 */
  PT.evetree = A => { const { b, x, z, Hs, O, fp, hd } = A, y = Hs(x, z); b.m = 5;
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283, r0 = 9; b.cyl(x + Math.cos(a) * r0, y - 1, z + Math.sin(a) * r0, 1.6, 2.4, 90, 8, '#8a6a46', null, 0, [-Math.cos(a) * 7, -Math.sin(a) * 7]); }
    b.cyl(x, y + 20, z, 5, 8, 90, 14, '#7a5a3a'); b.m = 0; b.cyl(x, y - .2, z, 6, 6, .3, 18, '#fff6b0', '#fffbd8'); for (let k = 0; k < (hd ? 14 : 7); k++) { const a = k * 2.4, d = 3 + (k % 4) * 3; b.sphere(x + Math.cos(a) * d, y + 2 + (k % 5) * 3, z + Math.sin(a) * d, .5, 5, '#fff2a0'); }
    O.push([x, z, 7]); A.markB && A.markB(x, z, 5.5); fp(x, z, 12); return { y }; };
  /* 泡泡珊瑚（裝飾） */
  PT.bubbles = A => { const { b, x, z, Hs, o } = A, y = Hs(x, z); for (let k = 0; k < (o.n || 8); k++) { const a = k * 2.1, d = (k % 3) * 1.6; b.m = 0; b.sphere(x + Math.cos(a) * d, y + 1 + k * 1.3, z + Math.sin(a) * d, .5 + (k % 3) * .3, 6, '#cfefff', 1); } return { y }; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 競技場（科里達）：三層拱廊的圓形外牆、沙地、旗；一個入口 */
  PT.colosseum = A => { const { b, x, z, ry, Hs, O, fp, flatPad, hd, o, markB } = A, y = Hs(x, z), R = o.r || 26, c = o.c || '#e0c49a', n = hd ? 48 : 28; flatPad(x, z, R * 2 + 4, R * 2 + 4, 0, y);
    for (let i = 0; i < n; i++) { const a = i / n * 6.2832, gate = Math.abs(((a - (ry + Math.PI / 2) + 9.42) % 6.283) - 3.14) < .16; const px = x + Math.cos(a) * R, pz = z + Math.sin(a) * R, w = 6.2832 * R / n + .1;
      if (!gate) { b.m = 3; b.box(px, y - .5, pz, 2.2, 7, w, c, Math.PI / 2 - a); b.box(px, y + 6.5, pz, 2.2, 5.5, w, shade(c, .94), Math.PI / 2 - a); b.box(px, y + 12, pz, 2.2, 4, w, shade(c, 1.04), Math.PI / 2 - a);
        if (hd) { b.m = 0; for (const yy of [2.2, 8.4]) b.box(x + Math.cos(a) * (R + 1.15), y + yy, z + Math.sin(a) * (R + 1.15), .1, 2.6, w * .55, '#3a2a1e', Math.PI / 2 - a); } markB(px, pz, 1.6); }
      if (i % 6 === 0 && !gate) { b.m = 0; b.cyl(px, y + 16, pz, .1, .08, 4, 5, '#e8e4dc'); b.box(px + .8, y + 19, pz, 1.6, 1, .05, ['#d8323a', '#ffd25a'][i % 2], ry); } }
    b.m = 0; b.cyl(x, y - .4, z, R - 1.4, R - 1.4, .5, 28, '#e8d4a0', '#e4cc94'); for (let k = 0; k < 3; k++) { b.m = 3; b.cyl(x, y + .1 + k * 1.6, z, R - 1.4 - k * 0, R - 1.4 - k * 0, .01, 2, c); } b.m = 0;
    fp(x, z, R + 3); return { door: [x + Math.cos(ry + Math.PI / 2) * (R + 4), z + Math.sin(ry + Math.PI / 2) * (R + 4)], y }; };
  /* 玩具之家：彩色大屋、屋頂上的大玩具 */
  PT.toyhouse = A => { const { b, x, z, ry, house, O, o } = A, L = Lf(x, z, ry), r = house(x, z, 22, 15, 3, ry, { style: 'candy', exact: true, wall: '#ffe0ec', roof: '#ff7aa8', balcony: true, sign: '#ffd25a' });
    b.m = 0; const [tx, tz] = L(0, 0); b.sphere(tx, r.top + 2.4, tz, 2.6, 10, '#ffd25a'); b.sphere(tx - 4, r.top + 1.4, tz, 1.6, 8, '#5ab0f0'); b.sphere(tx + 4, r.top + 1.4, tz, 1.6, 8, '#7ad07a');
    for (const sd of [-1, 1]) { const [px, pz] = L(sd * 12.4, 7.6); b.m = 3; b.cyl(px, r.y - .3, pz, 1.4, 1.2, 12, 10, '#ffffff'); b.m = 2; b.cyl(px, r.y + 11.6, pz, 2, 0, 4, 10, sd > 0 ? '#5ab0f0' : '#ffd25a'); b.m = 0; O.push([px, pz, 1.6]); } return r; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 和式城（天守）：斜面石垣、白壁、多層黑瓦屋簷、金鯱 */
  PT.jcastle = A => { const { b, x, z, ry, Hs, O, fp, flatPad, o, hd } = A, L = Lf(x, z, ry), y = Hs(x, z), W = o.w || 26, Dp = o.d || 20, tiers = o.tiers || 4, roof = o.roof || '#2e3440', wall = o.wall || '#f4f0e8'; flatPad(x, z, W + 8, Dp + 8, ry, y);
    b.m = 3; b.box(x, y - 1, z, W + 8, 7, Dp + 8, '#8a8478', ry, .82); let yy = y + 6, w = W, d = Dp;
    for (let t = 0; t < tiers; t++) { const h = 5.2; b.m = 4; b.box(x, yy, z, w, h, d, wall, ry); if (hd) for (let k = 0; k < Math.max(2, Math.floor(w / 4)); k++) { const [wx, wz] = L(-w / 2 + 2 + k * (w - 4) / Math.max(1, Math.floor(w / 4) - 1), d / 2 + .05); b.m = 1; b.box(wx, yy + 1.6, wz, 1.2, 1.6, .14, '#3a2a1e', ry); }
      b.m = 2; b.box(x, yy + h - .2, z, w + 4, .9, d + 4, roof, ry, .7); b.box(x, yy + h + .5, z, w * .9, 1.2, d * .9, shade(roof, 1.1), ry, .6); yy += h + 1.4; w *= .76; d *= .76; }
    b.m = 2; b.box(x, yy, z, w + 2, 3, d + 2, roof, ry, .25); b.m = 0; for (const sd of [-1, 1]) { const [gx, gz] = L(sd * (w / 2 + .6), 0); b.box(gx, yy + 2.6, gz, .6, 1.4, .8, '#e8c040', ry); }
    const [dx, dz] = L(0, Dp / 2 + 4.1); b.box(dx, y + 6, dz, 3.6, 4, .3, '#3a2a1e', ry);
    O.push([x, z, Math.min(W, Dp) / 2 + 3]); A.markB && A.markB(x, z, Math.min(W, Dp) / 2 + 3); fp(x, z, W / 2 + 6); return { door: L(0, Dp / 2 + 9), y }; };
  /* 鳥居 */
  PT.torii = A => { const { b, x, z, ry, Hs, O, o } = A, L = Lf(x, z, ry), y = Hs(x, z), W = o.w || 7, c = o.c || '#d0302a'; b.m = 1;
    for (const sd of [-1, 1]) { const [px, pz] = L(sd * W / 2, 0); b.cyl(px, y - .3, pz, .45, .38, 7.4, 10, c); O.push([px, pz, .6]); } b.box(x, y + 7, z, W + 3, .7, .9, '#2a2a2e', ry, 1); b.box(x, y + 5.6, z, W + .8, .5, .6, c, ry); b.m = 0; return { y }; };
  /* 骷髏頭（鬼之島） */
  PT.skull = A => { const { b, x, z, ry, Hs, O, fp, o } = A, L = Lf(x, z, ry), y = o.y != null ? o.y : Hs(x, z), R = o.r || 16; b.m = 3;
    b.sphere(x, y + R * .7, z, R, 14, '#e8e0cc', .95); const [jx, jz] = L(0, R * .5); b.box(jx, y - R * .1, jz, R * 1.1, R * .5, R * .8, '#ddd4c0', ry); b.m = 0;
    for (const sd of [-1, 1]) { const [ex, ez] = L(sd * R * .38, R * .86); b.sphere(ex, y + R * .78, ez, R * .24, 9, '#1a1414', 1.1); const [hx, hz] = L(sd * R * .7, 0); b.m = 3; b.cyl(hx, y + R * 1.2, hz, R * .18, .2, R * .9, 8, '#c8b89c', null, 0, [sd * R * .5, 0]); b.m = 0; }
    const [nx, nz] = L(0, R * .95); b.box(nx, y + R * .45, nz, R * .2, R * .25, .4, '#1a1414', ry, .3); for (let k = 0; k < 6; k++) { const [tx, tz] = L(-R * .4 + k * R * .16, R * .9); b.box(tx, y + R * .02, tz, R * .1, R * .18, .4, '#f4ecd8', ry); }
    O.push([x, z, R * .9]); A.markB && A.markB(x, z, R * .85); fp(x, z, R + 2); return { y }; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  /* 寶樹亞當：從冥界谷底長出的巨大樹幹、板根、樹冠雲團 */
  PT.bigtree = A => { const { b, x, z, Hs, O, fp, o, hd, markB } = A, y0 = Hs(x, z), R = o.r || 32, H = o.h || 180; b.m = 5;
    b.cyl(x, y0 - 2, z, R * 1.25, R, 20, hd ? 28 : 18, '#6a4a30'); b.cyl(x, y0 + 18, z, R, R * .8, H * .55, hd ? 28 : 18, '#7a5638'); b.cyl(x, y0 + 18 + H * .55, z, R * .8, R * .4, H * .45, hd ? 24 : 14, '#6e4e32');
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832 + .2; b.cyl(x + Math.cos(a) * R * .9, y0 - 1, z + Math.sin(a) * R * .9, R * .22, R * .1, 26, 8, '#5e4028', null, 0, [Math.cos(a) * R * .55, Math.sin(a) * R * .55]); }
    b.m = 0; const top = y0 + 18 + H * .55; for (let k = 0; k < (hd ? 22 : 12); k++) { const a = k * 2.399, d = R * (.6 + (k % 4) * .55), hy = top + 10 + (k % 5) * 9;
      b.sphere(x + Math.cos(a) * d, hy, z + Math.sin(a) * d, R * (.75 + (k % 3) * .2), hd ? 9 : 7, mix('#3e8a3a', '#5aa648', (k % 4) / 4), .55, .2, k + 3); }
    O.push([x, z, R]); markB(x, z, R - 1); fp(x, z, R + 4); return { y: y0 }; };
  /* 天界的木平台（可以走；上面的人物、道具站在平台上） */
  PT.deck = A => { const { b, x, z, ST, o, hd } = A, y = o.y, w = o.w || 40, d = o.d || 40; b.m = 1;
    b.box(x, y - 1.4, z, w, 1.4, d, '#8a6a46'); if (hd) for (let k = 0; k < Math.floor(w / 3); k++) b.box(x - w / 2 + 1.5 + k * 3, y - .02, z, 2.8, .06, d - .4, mix('#9a7a52', '#8a6a46', k % 2));
    for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { const n = Math.ceil(Math.max(Math.abs(bx - ax) * w, Math.abs(bz - az) * d) / 2 / 3);
      for (let k = 0; k <= n; k++) { const t = k / n, px = x + (ax + (bx - ax) * t) * w / 2, pz = z + (az + (bz - az) * t) * d / 2; b.box(px, y, pz, .3, 1.2, .3, '#5e3e2a'); } }
    b.cyl(x, y - 40, z, 1.6, 2.4, 39, 8, '#6e4e32'); b.m = 0;
    const g = o.gap || [], rail = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2); for (let k = 0; k < n; k++) { const px = x0 + (x1 - x0) * (k + .5) / n, pz = z0 + (z1 - z0) * (k + .5) / n; if (g.some(q => Math.hypot(px - q[0] * A.I.SC, pz - q[1] * A.I.SC) < 4)) continue; ST.walls.push({ x0: px - 1, z0: pz - 1, x1: px + 1, z1: pz + 1, y0: y - .2, y1: y + 1.4 }); } };
    rail(x - w / 2, z - d / 2, x + w / 2, z - d / 2); rail(x + w / 2, z - d / 2, x + w / 2, z + d / 2); rail(x + w / 2, z + d / 2, x - w / 2, z + d / 2); rail(x - w / 2, z + d / 2, x - w / 2, z - d / 2);
    ST.plats.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2, y0: y, y1: y, obj: true }); return { y }; };
  /* 冥界的鎖鏈：巨大鎖環從樹根垂下、鎖住的平台 */
  PT.chains = A => { const { b, x, z, Hs, O, o } = A, y = Hs(x, z); b.m = 3; b.box(x, y - .5, z, 10, 1.4, 10, '#4a4652'); b.m = 0;
    for (let s = 0; s < 4; s++) { const a = s / 4 * 6.283 + .4, ex = x + Math.cos(a) * 30, ez = z + Math.sin(a) * 30; for (let k = 0; k < 14; k++) { const t = k / 14, px = x + (ex - x) * t, pz = z + (ez - z) * t, py = y + 2 + t * 34 - Math.sin(t * Math.PI) * 6; b.box(px, py, pz, k % 2 ? .5 : 2.2, 1.4, k % 2 ? 2.2 : .5, '#6a6a74', a); } }
    O.push([x, z, 5]); return { y }; };
})(typeof window !== 'undefined' ? window : globalThis);
(function (global) {
  const PT = global.ISLE2.parts, { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  /* 蛋糕城：多層圓形蛋糕、奶油滴、草莓、蠟燭 */
  PT.cakecastle = A => { const { b, x, z, ry, Hs, O, fp, flatPad, hd, o } = A, L = Lf(x, z, ry), y = Hs(x, z), R = o.r || 26, cols = ['#f8e0c8', '#ffd0e0', '#fff4e0', '#e8c8f0', '#ffe8b0']; flatPad(x, z, R * 2, R * 2, 0, y);
    let yy = y - .5, r = R; for (let t = 0; t < 5; t++) { const h = 9 - t; b.m = 4; b.cyl(x, yy, z, r, r, h, hd ? 32 : 20, cols[t]); b.m = 0; b.cyl(x, yy + h - .4, z, r + .3, r + .3, .9, hd ? 32 : 20, '#ffffff', '#fff8f0');
      for (let k = 0; k < (hd ? 14 : 8); k++) { const a = k / (hd ? 14 : 8) * 6.283 + t; b.sphere(x + Math.cos(a) * (r + .2), yy + h - 1, z + Math.sin(a) * (r + .2), .9, 6, '#ffffff', 1.6); if (t < 4 && k % 2 === 0) b.sphere(x + Math.cos(a + .2) * (r - 1.2), yy + h + .9, z + Math.sin(a + .2) * (r - 1.2), 1, 6, '#e8304a'); }
      if (hd) for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + t * .5; b.box(x + Math.cos(a) * (r + .05), yy + h * .35, z + Math.sin(a) * (r + .05), 1.2, 2, .2, '#6a3a5a', Math.PI / 2 - a); }
      yy += h; r *= .78; }
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; b.cyl(x + Math.cos(a) * r * .5, yy, z + Math.sin(a) * r * .5, .5, .5, 5, 8, ['#ff6aa8', '#6ad0ff', '#ffd25a'][k % 3]); b.sphere(x + Math.cos(a) * r * .5, yy + 5.6, z + Math.sin(a) * r * .5, .5, 6, '#ffb030', 1.6); }
    const [dx, dz] = L(0, R + .1); b.box(dx, y, dz, 6, 8, .4, '#8a4a2a', ry); O.push([x, z, R]); A.markB && A.markB(x, z, R - .5); fp(x, z, R + 4); return { door: L(0, R + 6), y }; };
  /* 鏡子（鏡世界的入口） */
  PT.mirror = A => { const { b, x, z, ry, Hs, O } = A, y = Hs(x, z), L = Lf(x, z, ry); b.m = 0; b.box(x, y - .2, z, 6, 9, .8, '#d8a840', ry); b.box(...[L(0, .45)[0]], y + .6, L(0, .45)[1], 4.8, 7.6, .1, '#cfe8ff', ry); b.sphere(x, y + 9.2, z, 1, 7, '#ffd25a'); O.push([x, z, 2.4]); return { y }; };
  /* 蛋頭島：蛋形研究所（白色蛋殼＋彩色環＋窗帶） */
  PT.labegg = A => { const { b, x, z, Hs, O, fp, flatPad, hd, o } = A, y = Hs(x, z), R = o.r || 20; flatPad(x, z, R * 2, R * 2, 0, y);
    b.m = 3; b.cyl(x, y - 1, z, R * .8, R * .7, 4, 24, '#c8d0dc'); b.m = 4; b.sphere(x, y + R * 1.1, z, R, hd ? 18 : 12, '#f8f8fc', 1.3); b.m = 0; b.cyl(x, y + R * .9, z, R * 1.02, R * 1.02, 2.2, hd ? 28 : 18, '#ff6aa8', '#ff6aa8'); b.cyl(x, y + R * 1.5, z, R * .86, R * .86, 1.4, hd ? 28 : 18, '#5ad0ff', '#5ad0ff');
    b.cyl(x, y + R * 2.4, z, .3, .2, 8, 6, '#c8d0dc'); b.sphere(x, y + R * 2.4 + 8.4, z, 1, 8, '#ff6aa8'); O.push([x, z, R]); A.markB && A.markB(x, z, R - 1); fp(x, z, R + 4); return { door: [x, z + R + 4], y }; };
  /* 未來塔 */
  PT.futuretower = A => { const { b, x, z, Hs, O, fp, o } = A, y = Hs(x, z), H = o.h || 40, c = o.c || '#5ad0ff'; b.m = 3; b.cyl(x, y - 1, z, 5, 5, 3, 16, '#c8d0dc'); b.m = 4; b.cyl(x, y + 2, z, 3.4, 2.4, H, 16, '#f4f6fa'); b.m = 0;
    for (let k = 1; k < 6; k++) b.cyl(x, y + 2 + k * H / 6, z, 3.8 - k * .2, 3.8 - k * .2, .8, 16, c, c); b.sphere(x, y + H + 3, z, 3, 10, c, 1); O.push([x, z, 5]); A.markB && A.markB(x, z, 4.5); fp(x, z, 7); return { y }; };
  /* 火山口（冒煙的暗紅坑） */
  PT.crater = A => { const { b, x, z, Hs, o } = A, y = Hs(x, z), R = o.r || 8; b.m = 0; b.cyl(x, y - .3, z, R, R * .7, .5, 18, '#e8501a', '#ff7a2a'); return { y }; };
  /* v151 冥界：羅德的樂高城（彩色積木疊成的城牆、四座角塔、中央主堡，積木上有凸點） */
  PT.legocastle = A => { const { b, x, z, ry, Hs, O, fp, flatPad, hd, o } = A, L = Lf(x, z, ry), y = Hs(x, z), S = o.s || 1, C = ['#d8352a', '#2a62c8', '#f4c430', '#3a9a4a', '#f4f4f0'];
    flatPad(x, z, 34 * S, 28 * S, ry, y); let ci = 0;
    const brick = (lx, ly, lz, w, h, d, col) => { const [bx, bz] = L(lx, lz); b.m = 0; b.box(bx, y + ly, bz, w, h, d, col, ry);
      if (hd) { const nx = Math.max(1, Math.round(w / (1.6 * S))), nz = Math.max(1, Math.round(d / (1.6 * S))); if (nx * nz <= 12) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const [sx, sz] = L(lx - w / 2 + (i + .5) * w / nx, lz - d / 2 + (j + .5) * d / nz); b.cyl(sx, y + ly + h, sz, .42 * S, .42 * S, .32 * S, 8, col); } } };
    const wall = (x0, z0, x1, z1, gap) => { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / (4 * S)), ux = (x1 - x0) / len, uz = (z1 - z0) / len;
      for (let r = 0; r < 3; r++) for (let k = 0; k < n; k++) { const t = (k + (r % 2 ? .5 : 0)) * 4 * S; if (t > len - 2 * S) continue; const cx = x0 + ux * (t + 2 * S), cz = z0 + uz * (t + 2 * S);
        if (gap && Math.abs(cx - gap[0]) < 4 * S && Math.abs(cz - gap[1]) < 4 * S && r < 2) continue; if (r === 2 && k % 2) continue;
        brick(cx, r * 2.2 * S - .2, cz, Math.abs(ux) > .5 ? 4 * S : 2.4 * S, 2.2 * S, Math.abs(ux) > .5 ? 2.4 * S : 4 * S, C[(ci++) % 5]); }
      for (let k = 0; k <= n; k++) { const lx = x0 + ux * k * 4 * S, lz = z0 + uz * k * 4 * S; if (gap && Math.hypot(lx - gap[0], lz - gap[1]) < 4.5 * S) continue; const [px, pz] = L(lx, lz); O.push([px, pz, 2 * S]); } };
    const W = 15 * S, D2 = 12 * S; wall(-W, D2, W, D2, [0, D2]); wall(W, -D2, -W, -D2); wall(-W, -D2, -W, D2); wall(W, D2, W, -D2);
    for (const [a, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { for (let r = 0; r < 6; r++) brick(a * W, r * 2.2 * S - .2, e * D2, 5 * S, 2.2 * S, 5 * S, C[(r + (a + 2) + (e + 2) * 2) % 5]); const [tx, tz] = L(a * W, e * D2); O.push([tx, tz, 3.4 * S]); }
    for (let r = 0; r < 7; r++) { const sh = r > 4 ? (r - 4) * 1.6 * S : 0; brick(0, r * 2.4 * S - .2, -2 * S, 12 * S - sh * 2, 2.4 * S, 9 * S - sh * 1.4, C[(r * 2 + 1) % 5]); }
    { const [kx, kz] = L(0, -2 * S), [fx, fz] = L(1.6 * S, -2 * S); O.push([kx, kz, 6.5 * S]); b.m = 0; b.box(kx, y + 16.6 * S, kz, .3 * S, 6 * S, .3 * S, '#4a3a2a', ry); b.box(fx, y + 20.6 * S, fz, 3 * S, 1.8 * S, .12, '#d8352a', ry); }
    fp(x, z, Math.hypot(W, D2) + 4); return { door: L(0, D2 + 4 * S), y }; };
  /* ---------- v151 原作補強 ---------- */
  /* 東海：哥亞王國的城牆（石牆、雉堞、兩座圓塔、城門，牆後露出高町的白色高樓） */
  PT.goawall = A => { const { b, x, z, ry, Hs, O, fp, flatPad, house, hd, o } = A, L = Lf(x, z, ry), y = Hs(x, z), len = o.len || 80, h = o.h || 14; flatPad(x, z, len + 8, 10, ry, y);
    b.m = 3; b.box(x, y - 1, z, len, h + 1, 3.4, '#b8b2a6', ry); for (let k = 0; k < len / 2.4; k++) { if (k % 2) continue; const [cx, cz] = L(-len / 2 + 1.2 + k * 2.4, 0); b.box(cx, y + h, cz, 1.3, 1.2, 3.6, '#aaa498', ry); }
    for (const e of [-1, 1]) { const [tx, tz] = L(e * len / 2, 0); b.cyl(tx, y - 1, tz, 4.6, 4.2, h + 7, 16, '#c4beb2'); b.m = 2; b.cyl(tx, y + h + 6, tz, 5.2, 0, 6, 16, '#3a5a9a'); b.m = 3; O.push([tx, tz, 4.8]); }
    { const [gx, gz] = L(0, 1.8); b.box(gx, y - .2, gz, 7, 8.6, .4, '#5a4632', ry); b.m = 3; for (const e of [-1, 1]) { const [px, pz] = L(e * 5.2, 0); b.box(px, y - 1, pz, 3.2, h + 4, 4.2, '#c4beb2', ry); } b.box(gx, y + 8.4, gz, 10.6, 1.4, 1, '#a49e92', ry); }
    for (let k = 0; k <= len / 3; k++) { const [px, pz] = L(-len / 2 + k * 3, 0); O.push([px, pz, 2]); }
    if (house) for (let k = 0; k < 4; k++) { const [hx, hz] = L(-len * .3 + k * len * .2, -9 - (k % 2) * 3); house(hx, hz, 7, 6, 3 + (k % 2), ry, { style: 'stone', wall: '#f4f0e8', roof: '#3a5a9a', arch: k % 2 ? 'tower' : 'base', noDoor: 1, exact: 1, wing: 1 }); }
    b.m = 0; fp(x, z, len / 2 + 4); return { door: L(0, 6), y }; };
  /* 東海：灰色終點站（城牆外的垃圾山：一座座垃圾堆、木板、木桶、廢鐵、拼湊的小屋、悶燒的煙） */
  PT.trashheap = A => { const { b, x, z, Hs, O, fp, hd, o, CHIMNEYS } = A, R = o.r || 22; let s = 31; const rn = () => (s = s * 16807 % 2147483647) / 2147483647;
    for (let k = 0; k < (hd ? 9 : 6); k++) { const a = rn() * 6.283, d = R * Math.sqrt(rn()) * .8, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, py = Hs(px, pz), r = 3 + rn() * 4; b.m = 0; b.sphere(px, py - r * .3, pz, r, hd ? 9 : 6, mix('#6e665a', '#8a7a62', rn()), .55, .3, k + 5); O.push([px, pz, r * .8]);
      for (let q = 0; q < (hd ? 7 : 3); q++) { const a2 = rn() * 6.283, d2 = r * (.3 + rn() * .6), qx = px + Math.cos(a2) * d2, qz = pz + Math.sin(a2) * d2, qy = py + r * .15 * (1 - d2 / r) + .2, t = rn();
        if (t < .35) { b.m = 1; b.box(qx, qy, qz, .3, .25, 2.4 + rn() * 2, mix('#7a5a3a', '#9a7a52', rn()), a2); } else if (t < .6) { b.m = 1; b.cyl(qx, qy - .2, qz, .45, .4, 1, 8, mix('#6a4a2e', '#4a5a6a', rn())); } else if (t < .8) { b.m = 3; b.box(qx, qy - .1, qz, 1 + rn(), .7 + rn() * .6, .8 + rn(), mix('#5a5e66', '#8a6a4a', rn()), a2); } else { b.m = 0; b.box(qx, qy, qz, 1.6, .12, .9, mix('#8a8a90', '#6a7a8a', rn()), a2); } } }
    { const a = rn() * 6.283, px = x + Math.cos(a) * R * .55, pz = z + Math.sin(a) * R * .55, py = Hs(px, pz); b.m = 1; b.box(px, py - .3, pz, 5, 3.4, 4, '#7a6a56', a); b.m = 3; b.box(px, py + 3.1, pz, 5.8, .3, 4.8, '#6a7078', a + .1); O.push([px, pz, 3]); }
    for (let k = 0; k < 3; k++) { const a = rn() * 6.283, d = R * .5 * rn(), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; CHIMNEYS.push([px, Hs(px, pz) + 3, pz]); }
    b.m = 0; fp(x, z, R); return { y: Hs(x, z) }; };
  /* 空島：天國之門（白海上的雲柱與拱門、登記處的小屋） */
  PT.heavengate = A => { const { b, x, z, ry, o, hd } = A, L = Lf(x, z, ry), W = o.w || 26, H = o.h || 26, y = .4; b.m = 0;
    for (const e of [-1, 1]) { const [px, pz] = L(e * W / 2, 0); for (let k = 0; k < 7; k++) b.sphere(px + Math.sin(k * 1.7) * .8, y + k * H / 7, pz + Math.cos(k * 2.3) * .8, 4.2 - k * .2, hd ? 9 : 6, mix('#ffffff', '#eef4ff', (k % 3) / 3), .8, .12, k + e * 9); }
    const [ax, az] = L(0, 0); b.box(ax, y + H - 1, az, W + 4, 3, 3.4, '#ffffff', ry); b.box(ax, y + H + 2, az, W * .6, 2.4, .5, '#e8c048', ry); for (let k = 0; k < 9; k++) { const [cx, cz] = L(-W / 2 - 2 + k * (W + 4) / 8, 0); b.sphere(cx, y + H + .5, cz, 2.6, hd ? 8 : 6, '#ffffff', .6, .15, k + 30); }
    const [bx, bz] = L(W / 2 + 7, 3); b.sphere(bx, y, bz, 5, hd ? 9 : 6, '#ffffff', .4, .1, 41); b.m = 4; b.cyl(bx, y + 1.4, bz, 2.4, 2.2, 3, 12, '#f4f6fa'); b.m = 2; b.sphere(bx, y + 4.4, bz, 2.6, 8, '#8ac0e8', .6); b.m = 0; return {}; };
  /* 空島：巨大豆藤頂端的雲上香迪亞（雲朵島、斷柱、黃金鐘） */
  PT.skybell = A => { const { b, x, z, Hs, o, hd } = A, yc = Hs(x, z) + (o.h || 90); b.m = 0;
    for (let k = 0; k < (hd ? 14 : 8); k++) { const a = k * 2.399, d = 4 + (k % 4) * 3.4; b.sphere(x + Math.cos(a) * d, yc - 2 - (k % 3), z + Math.sin(a) * d, 6 + (k % 3) * 1.6, hd ? 9 : 6, mix('#ffffff', '#f0f4ff', (k % 4) / 4), .45, .15, k + 50); }
    b.m = 3; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + .4, px = x + Math.cos(a) * 11, pz = z + Math.sin(a) * 11; b.cyl(px, yc - 1, pz, .8, .7, 3 + (k * 1.9) % 5, 10, '#d8c8a0'); }
    PT.goldbell({ ...A, o: { y: yc }, O: [], fp: () => {} }); b.m = 0; return { y: yc }; };
  /* 空島：艾尼路的方舟「馬克西姆」（浮在空中的黃金大船、兩側的螺旋槳） */
  PT.ark = A => { const { b, x, z, ry, Hs, P, o } = A, L = Lf(x, z, ry), y = Hs(x, z) + (o.y || 40), s = o.s || 2.2;
    P.ship2(b, x, y, z, ry, s, { len: 16, w: 6, sail: '#f8f0d0', hull: '#e8b830', deck: '#c8962a', trim: '#fff0b0', masts: [0], mastH: 9 });
    b.m = 0; for (const e of [-1, 1]) for (const f of [-.25, .25]) { const [px, pz] = L(e * 6 * s * .6, f * 16 * s); b.cyl(px, y + 2 * s, pz, .5 * s, .5 * s, 3 * s, 10, '#c8962a'); for (let q = 0; q < 4; q++) b.box(px, y + 5 * s, pz, 6 * s, .15 * s, .7 * s, '#f0d060', ry + q * Math.PI / 4); }
    return { y }; };
  /* 頂上戰爭：白鬍子的莫比迪克號（鯨魚頭的大船，凍在冰面上） */
  PT.mobydick = A => { const { b, x, z, ry, P, O, o } = A, sc = o.s || 1.7;
    const sh = P.ship2(b, x, .7, z, ry, sc, { len: 15, w: 5.2, head: 'whale', masts: [-.16, .16], mastH: 10, sail: '#f4f2ea', hull: '#e8e4dc', deck: '#a87a50', trim: '#3a5a9a', flag: '#1c1c22' });
    b.m = 0; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, px = x + Math.cos(a) * 12 * sc / 1.7, pz = z + Math.sin(a) * 18 * sc / 1.7; b.box(px, .1, pz, 2 + (k % 3), 1 + (k % 2) * .6, 1.6, '#cfe8f4', a); }
    O.push([x, z, 6 * sc]); return { y: .7, sh }; };
  /* 阿拉巴斯坦：葬祭殿（王宮旁、羅賓看歷史本文的大陵墓：階梯基座、列柱、厚重的石頂） */
  PT.tomb = A => { const { b, x, z, ry, Hs, O, fp, flatPad, hd, o } = A, L = Lf(x, z, ry), y = Hs(x, z), W = o.w || 22, D2 = o.d || 16, c = o.c || '#e4cfa0'; flatPad(x, z, W + 8, D2 + 8, ry, y);
    b.m = 3; for (let k = 0; k < 4; k++) b.box(x, y - .6 + k * .9, z, W + 6 - k * 1.6, .9, D2 + 6 - k * 1.6, shade(c, .9 + k * .03), ry);
    const yb = y + 3; for (let k = 0; k < 6; k++) for (const e of [-1, 1]) { const [px, pz] = L(-W / 2 + 1.4 + k * (W - 2.8) / 5, e * (D2 / 2 - 1.2)); b.cyl(px, yb, pz, .9, .8, 8, hd ? 12 : 8, shade(c, 1.04)); }
    b.m = 4; b.box(x, yb, z, W - 5, 8, D2 - 5, shade(c, .82), ry); b.m = 3; b.box(x, yb + 8, z, W + 1, 1.6, D2 + 1, c, ry); b.box(x, yb + 9.6, z, W - 3, 1.4, D2 - 3, shade(c, .95), ry);
    { const [dx, dz] = L(0, D2 / 2 - 2.4); b.m = 0; b.box(dx, yb, dz, 3, 5, .3, '#3a2a1e', ry); } O.push([x, z, Math.min(W, D2) / 2 + 2]); fp(x, z, Math.max(W, D2) / 2 + 3); b.m = 0; return { door: L(0, D2 / 2 + 5), y }; };
  /* 蛋頭島：龐克紀錄（研究層上空的大腦形狀的雲，用一條光柱連到研究所） */
  PT.punkrecords = A => { const { b, x, z, Hs, o, hd } = A, yc = Hs(x, z) + (o.h || 60), R = o.r || 16; b.m = 0;
    for (let k = 0; k < (hd ? 26 : 14); k++) { const a = k * 2.399, side = k % 2 ? 1 : -1, d = R * (.25 + (k % 5) * .12), px = x + side * (R * .32 + Math.abs(Math.cos(a)) * d * .5), pz = z + Math.sin(a) * d, py = yc + Math.cos(a * 1.3) * R * .25;
      b.sphere(px, py, pz, R * (.28 + (k % 3) * .06), hd ? 9 : 6, mix('#ffc8dc', '#f4e0f8', (k % 4) / 4), .8, .12, k + 70); }
    b.box(x, yc - R * .1, z, .9, R * .7, R * 1.4, '#e8b0c8'); b.cyl(x, Hs(x, z) + 12, z, .8, .8, yc - Hs(x, z) - 12 - R * .3, 10, '#7ae0ff'); return { y: yc }; };
})(typeof window !== 'undefined' ? window : globalThis);
