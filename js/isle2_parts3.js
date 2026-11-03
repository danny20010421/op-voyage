/* v153 劇情道具零件（使用者 11/03：劇情裡出現的東西，場景要做出來）。
   stake（索隆被綁的十字木樁）、barrelbig（魯夫躲的木桶）、cage（鐵籠）、ice（凍結的海面與冰牆）、birdcage（多佛朗明哥的鳥籠，半透明絲線）、
   coatship（包著鍍膜泡泡的千陽號，泡泡是半透明）、noah（巨大方舟諾亞＋鎖鏈）、pod（蛋頭島的逃生艙）、freezer（歐斯的冷凍庫）、robot（沉睡的巨大機器人）、
   factory（SMILE 工廠）、arrowsign（神之騎士團的箭頭標誌）、poneglyph（歷史本文）、kneel（跪著的人形，處刑台上的艾斯）、bomb（時計台的炸彈）、
   rocketman（火箭人號車頭）、grave（乙姬的墓）、rampart 用 isle2 本來的 ramparts。
   零件介面同 isle2_parts*.js：A = { b, x, z, ry, o, Hs, O, fp, flatPad, hd, P, MB（半透明網格） … }。 */
(function (global) {
  const PT = global.ISLE2 && global.ISLE2.parts; if (!PT) return; const { shade, mix } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  const yOf = A => A.o.y != null ? A.o.y : A.Hs(A.x, A.z) + (A.o.dy || 0);
  PT.stake = A => { const { b, x, z, ry, O, o } = A, L = Lf(x, z, ry), y = yOf(A); b.m = 1;
    b.box(x, y - .3, z, .7, 7.2, .7, '#6e4c30', ry); const [ax, az] = L(0, 0); b.box(ax, y + 4.6, az, 5.6, .6, .6, '#6e4c30', ry);
    b.m = 0; b.box(x, y - .2, z, 4.6, .3, 4.6, '#c8b48a', ry); for (const h of [2.2, 3.4, 4.9]) b.box(x, y + h, z, .9, .18, .9, '#c8b48a', ry);
    if (o.man) { /* 被綁住的劍士：綠色頭髮、白衣、黑頭巾 */ const [mx, mz] = L(0, .45); b.box(mx, y + 1.2, mz, 1.1, 2.4, .5, '#2a2a2a', ry); b.box(mx, y + 3.4, mz, 1.3, 1.5, .55, '#f4f2ea', ry); b.sphere(mx, y + 4.9, mz, .5, 8, '#e0b08a'); b.sphere(mx, y + 5.25, mz, .5, 8, '#3a8a3a', .55);
      [-1, 1].forEach(sd => { const [hx, hz] = L(sd * 1.9, .45); b.box(hx, y + 4.3, hz, 1.6, .38, .4, '#e0b08a', ry); }); }
    O.push([x, z, 1.2]); return { y }; };
  PT.barrelbig = A => { const { b, x, z, P, o } = A, y = yOf(A), s = o.s || 1.6; P.barrel(b, x, y, z, s); return { y }; };
  PT.cage = A => { const { b, x, z, ry, O, o } = A, L = Lf(x, z, ry), y = yOf(A), w = o.w || 5, d = o.d || 5, h = o.h || 5; b.m = 3;
    b.box(x, y - .2, z, w + .4, .4, d + .4, '#3a3a40', ry); b.box(x, y + h, z, w + .4, .4, d + .4, '#3a3a40', ry);
    for (const [a, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [px, pz] = L(a * w / 2, e * d / 2); b.box(px, y, pz, .3, h, .3, '#2a2a30', ry); }
    for (let k = 1; k < 6; k++) for (const e of [-1, 1]) { const [px, pz] = L(-w / 2 + k * w / 6, e * d / 2), [qx, qz] = L(e * w / 2, -d / 2 + k * d / 6); b.box(px, y, pz, .12, h, .12, '#4a4a52', ry); b.box(qx, y, qz, .12, h, .12, '#4a4a52', ry); }
    b.m = 0; O.push([x, z, Math.max(w, d) / 2 + .3]); return { y }; };
  PT.ice = A => { const { b, x, z, hd, o, MB } = A, R = o.r || 14, M = MB || b; let s = 17; const rn = () => (s = s * 16807 % 2147483647) / 2147483647;
    b.m = 0; for (let k = 0; k < (hd ? 26 : 14); k++) { const a = rn() * 6.283, d = R * Math.sqrt(rn()), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, w = 3 + rn() * 5; b.box(px, Math.max(-.2, A.Hs(px, pz) - .1), pz, w, .55, w * (.6 + rn() * .6), mix('#dff2fb', '#bfe2f2', rn()), a); }
    for (const [wx, wz, wx2, wz2] of (o.walls || [])) { const n = Math.ceil(Math.hypot(wx2 - wx, wz2 - wz) / 2.4); for (let k = 0; k <= n; k++) { const t = k / n, px = wx + (wx2 - wx) * t, pz = wz + (wz2 - wz) * t, h = 3 + rn() * 5; b.box(px, Math.max(-.3, A.Hs(px, pz) - .2), pz, 1.6 + rn(), h, 1.6 + rn(), mix('#e8f6ff', '#a8d4ec', rn()), rn() * 3, .55); } }
    M.box(x, -.05, z, R * 2.1, .3, R * 2.1, '#d8f0ff', 0); return {}; };
  PT.birdcage = A => { const { b, x, z, Hs, o, MB } = A, M = b, H = o.h || 200, R = o.r || 280, cx = o.cx != null ? o.cx : x, cz = o.cz != null ? o.cz : z, n = o.n || 32, top = Hs(x, z) + H;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283, ex = cx + Math.cos(a) * R, ez = cz + Math.sin(a) * R, ey = Math.max(0, Hs(ex, ez)), L = Math.hypot(ex - x, ez - z, ey - top), seg = Math.ceil(L / 10);
      for (let k = 0; k < seg; k++) { const t0 = k / seg, t1 = (k + 1) / seg, p0 = [x + (ex - x) * t0, top + (ey - top) * t0, z + (ez - z) * t0], p1 = [x + (ex - x) * t1, top + (ey - top) * t1, z + (ez - z) * t1], w = 1;
        const C = [.96, .96, 1]; M.quad([p0[0] - w, p0[1], p0[2]], [p0[0] + w, p0[1], p0[2]], [p1[0] + w, p1[1], p1[2]], [p1[0] - w, p1[1], p1[2]], C); M.quad([p0[0] - w, p0[1], p0[2]], [p1[0] - w, p1[1], p1[2]], [p1[0] + w, p1[1], p1[2]], [p0[0] + w, p0[1], p0[2]], C); M.quad([p0[0], p0[1], p0[2] - w], [p1[0], p1[1], p1[2] - w], [p1[0], p1[1], p1[2] + w], [p0[0], p0[1], p0[2] + w], C); M.quad([p0[0], p0[1], p0[2] - w], [p0[0], p0[1], p0[2] + w], [p1[0], p1[1], p1[2] + w], [p1[0], p1[1], p1[2] - w], C); } }
    M.sphere(x, top, z, 3, 8, '#ffffff'); return {}; };
  PT.coatship = A => { const { b, x, z, ry, P, O, o, MB } = A, s = o.s || .9, y = o.y != null ? o.y : Math.max(.2, A.Hs(x, z) + .3); P.ship2(b, x, y, z, ry, s, { sail: '#f4ecd8', hull: '#d8a84a', head: 'lion', deck: '#6aa84a' });
    (MB || b).sphere(x, y + 4 * s, z, 12 * s, 14, '#cfefff', .9); O.push([x, z, 7 * s]); return {}; };
  PT.noah = A => { const { b, x, z, ry, P, O, o } = A, s = o.s || 3.4, L = Lf(x, z, ry), y0 = Math.max(.1, A.Hs(x, z) + .3); P.ship2(b, x, y0, z, ry, s, { sail: '#e8dcc0', hull: '#7a5a3a', masts: [-.25, 0, .25], len: 16 });
    b.m = 3; for (const sd of [-1, 1]) for (let k = 0; k < 18; k++) { const [px, pz] = L(sd * (3 * s + k * 1.4), -6 * s + k * .9), py = y0 + Math.max(.5, 5 * s - k * .9); b.box(px, py, pz, k % 2 ? .5 : 1.6, 1.1, k % 2 ? 1.6 : .5, '#6a6a74', ry); }
    b.m = 0; O.push([x, z, 7 * s]); return {}; };
  PT.pod = A => { const { b, x, z, ry, O, o } = A, L = Lf(x, z, ry), y = yOf(A), R = o.r || 3.2; b.m = 3; b.box(x, y - .3, z, R * 3, .6, R * 3, '#c8d0dc', ry); for (const sd of [-1, 1]) { const [px, pz] = L(sd * R * 1.1, 0); b.box(px, y, pz, .5, R * 2.2, .8, '#5ad0ff', ry, .7); }
    b.m = 0; b.sphere(x, y + .3 + R * 1.1, z, R, 12, '#f4f6fa', 1.3); b.sphere(x, y + .3 + R * 1.3, z, R * .45, 8, '#5ad0ff', .9); const [fx, fz] = L(0, R * 1.05); b.box(fx, y + R * .8, fz, R * .8, R * .7, .2, '#ff6aa8', ry); O.push([x, z, R * 1.3]); return { y }; };
  PT.freezer = A => { const { b, x, z, ry, O, fp, flatPad, o } = A, L = Lf(x, z, ry), y = A.Hs(x, z), w = o.w || 14, d = o.d || 9, h = o.h || 7; flatPad(x, z, w + 3, d + 3, ry, y);
    b.m = 3; b.box(x, y - .3, z, w, h, d, '#7a8a96', ry); b.box(x, y + h - .3, z, w + .6, .6, d + .6, '#e8f4fa', ry); const [dx, dz] = L(0, d / 2 + .05); b.box(dx, y, dz, w * .45, h * .8, .3, '#5a6670', ry);
    b.m = 0; for (let k = 0; k < 9; k++) { const [ix, iz] = L(-w / 2 + k * w / 8, d / 2 + .2); b.box(ix, y + h - 1.4, iz, .3, 1.2, .3, '#dff4ff', ry, .2); }
    b.m = 3; for (const sd of [-1, 1]) for (let k = 0; k < 7; k++) { const [cx, cz] = L(sd * (w / 2 + .3), -d / 2 + k * d / 6); b.box(cx, y + h * .5, cz, k % 2 ? .3 : 1, .9, k % 2 ? 1 : .3, '#6a6a74', ry); }
    b.m = 0; O.push([x, z, Math.max(w, d) / 2 + .5]); fp(x, z, Math.max(w, d) / 2 + 2); return { door: L(0, d / 2 + 3), y }; };
  PT.robot = A => { const { b, x, z, ry, O, fp, flatPad, o } = A, L = Lf(x, z, ry), y = A.Hs(x, z), S = o.s || 1, c = o.c || '#8a6a5a', c2 = shade(c, .8); flatPad(x, z, 26 * S, 22 * S, ry, y); b.m = 3;
    b.box(x, y - .5, z, 12 * S, 10 * S, 9 * S, c, ry); const [hx, hz] = L(0, -1 * S); b.box(hx, y + 9.5 * S, hz, 7 * S, 6 * S, 7 * S, c2, ry); b.m = 0; for (const sd of [-1, 1]) { const [ex, ez] = L(sd * 1.8 * S, 2.6 * S); b.box(ex, y + 12 * S, ez, 1.4 * S, .8 * S, .3 * S, '#3a2a24', ry); }
    b.m = 3; for (const sd of [-1, 1]) { const [ax, az] = L(sd * 8 * S, 1 * S); b.box(ax, y - .5, az, 4 * S, 9 * S, 4 * S, c2, ry); const [lx, lz] = L(sd * 3.5 * S, 8 * S); b.box(lx, y - .5, lz, 4 * S, 3 * S, 9 * S, c, ry); }
    b.m = 0; for (let k = 0; k < 6; k++) { const [mx, mz] = L(-5 * S + k * 2 * S, 4.6 * S); b.sphere(mx, y + 4 * S + (k % 3) * 1.5 * S, mz, .7 * S, 6, '#5a8a3a', .6); }
    O.push([x, z, 9 * S]); fp(x, z, 13 * S); return { y }; };
  PT.factory = A => { const { b, x, z, ry, O, fp, flatPad, o, CHIMNEYS } = A, L = Lf(x, z, ry), y = A.Hs(x, z), w = o.w || 18, d = o.d || 12; flatPad(x, z, w + 4, d + 4, ry, y); b.m = 3;
    b.box(x, y - .3, z, w, 7, d, '#6a6e78', ry); b.m = 2; for (let k = 0; k < 4; k++) { const [rx, rz] = L(-w / 2 + (k + .5) * w / 4, 0); b.box(rx, y + 6.7, rz, w / 4 - .3, 2.2, d, '#4a4e58', ry, .5); }
    b.m = 3; for (const sd of [-1, 1]) { const [cx, cz] = L(sd * w * .3, -d * .3); b.cyl(cx, y + 6, cz, 1.2, 1, 9, 10, '#5a5e66'); CHIMNEYS.push([cx, y + 15.5, cz]); }
    const [gx, gz] = L(0, d / 2 + .05); b.box(gx, y, gz, 5, 4.6, .3, '#3a3e46', ry); b.m = 0; const [sx, sz] = L(0, d / 2 + .1); b.box(sx, y + 5.2, sz, 4, 1.2, .2, '#ffd23a', ry);
    O.push([x, z, Math.max(w, d) / 2]); fp(x, z, Math.max(w, d) / 2 + 2); return { door: L(0, d / 2 + 3), y }; };
  PT.arrowsign = A => { const { b, x, z, ry, Hs, o, MB } = A, M = MB || b, y = Hs(x, z) + (o.h || 60), L = Lf(x, z, ry), S = o.s || 10, c = [1, .35, .55], P3 = (lx, ly) => { const [px, pz] = L(lx * S, 0); return [px, y + ly * S, pz]; };
    const tri = (a, bb, cc) => { M.tri(P3(...a), P3(...bb), P3(...cc), c); M.tri(P3(...a), P3(...cc), P3(...bb), c); }; tri([-1.6, -.3], [.4, -.3], [.4, .3]); tri([-1.6, -.3], [.4, .3], [-1.6, .3]); tri([.4, -.9], [1.6, 0], [.4, .9]); return {}; };
  PT.poneglyph = A => { const { b, x, z, ry, O, o } = A, L = Lf(x, z, ry), y = yOf(A), s = o.s || 1; b.m = 3; b.box(x, y - .3, z, 3 * s, 3 * s, 3 * s, '#2a2a30', ry); b.m = 0;
    for (let k = 0; k < 6; k++) { const [px, pz] = L(-1 * s + (k % 3) * s, 1.52 * s); b.box(px, y + .6 * s + Math.floor(k / 3) * .9 * s, pz, .6 * s, .12 * s, .05, '#5a5a66', ry); } O.push([x, z, 2 * s]); return { y }; };
  PT.kneel = A => { const { b, x, z, ry, o } = A, L = Lf(x, z, ry), y = yOf(A), skin = o.skin || '#e0b08a'; b.m = 0;
    b.box(x, y, z, 1.2, .9, 1.6, o.bottom || '#2b2b2b', ry); b.box(x, y + .9, z, 1.2, 1.6, .7, skin, ry); b.sphere(x, y + 2.3, z, .55, 8, skin); b.sphere(x, y + 2.55, z, .58, 8, o.hair || '#1b1b1b', .6);
    if (o.hat) { b.cyl(x, y + 2.75, z, .95, .95, .1, 10, o.hat); b.cyl(x, y + 2.8, z, .5, .45, .5, 10, o.hat); }
    const [hx, hz] = L(0, -.6); b.box(hx, y + 1.2, hz, 1, .5, .4, '#6a6a74', ry); return { y }; };
  PT.bomb = A => { const { b, x, z, o } = A, y = yOf(A), R = o.r || 2.4; b.m = 0; b.sphere(x, y + R, z, R, 12, '#1c1c22'); b.cyl(x, y + R * 1.9, z, .25, .2, 1.2, 6, '#c8b48a'); b.sphere(x, y + R * 1.9 + 1.3, z, .35, 6, '#ffb347'); return {}; };
  PT.rocketman = A => { const { b, x, z, ry, O, o } = A, L = Lf(x, z, ry), y = A.Hs(x, z); b.m = 0;
    b.box(x, y, z, 4.2, 4.2, 11, '#c8322b', ry); const [fx, fz] = L(0, 6); b.cyl(fx, y + .4, fz, 2.2, 1.2, 1.6, 12, '#3a3a40'); const [cx, cz] = L(0, 2); b.cyl(cx, y + 4, cz, .8, .9, 3.2, 10, '#3a3a40');
    b.sphere(cx, y + 8, cz, 1.6, 8, '#d8d4cc', .8, .3, 7); O.push([x, z, 5]); return { y }; };
  PT.grave = A => { const { b, x, z, ry, O, o } = A, y = A.Hs(x, z); b.m = 3; b.box(x, y - .2, z, 4, .5, 3, '#e8e4f0', ry); b.box(x, y + .2, z, 2.2, 3, .6, '#f4f2fa', ry); b.m = 0; b.sphere(x, y + 3.4, z, .9, 8, '#fff0f4', .6);
    for (let k = 0; k < 6; k++) b.sphere(x + Math.cos(k) * 1.8, y + .3, z + Math.sin(k) * 1.4 + .6, .4, 6, ['#ff9ab8', '#ffd25a', '#9ad0ff'][k % 3]); O.push([x, z, 2]); return { y }; };
})(typeof window !== 'undefined' ? window : globalThis);
