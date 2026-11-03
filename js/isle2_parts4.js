/* v154 原作道具（使用者 11/03 給參考圖）：歷史本文（紅色方塊、四面刻滿文字、底部長青苔）、阿拉巴斯坦時計台的炸彈（黑色圓球＋時鐘＋兩個洞和笑嘴）、
   和之國鬼之島的骷髏頭（岩漿照亮的骷髏、發光的眼睛、往上彎的巨角、張開的大嘴、右邊插著一把刀）。
   零件介面同 isle2_parts*.js；載入順序：isle2_parts3.js 之後（同名零件覆蓋舊版）。 */
(function (global) {
  const PT = global.ISLE2 && global.ISLE2.parts; if (!PT) return; const { shade, mix, hex } = global.E3 || {};
  const Lf = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
  const H3 = c => typeof c === 'string' ? hex(c) : c;
  /* 面向 ry 方向的圓片（中心 cx,cy,cz，半徑 r；sx 往側邊壓扁） */
  const disc = (b, cx, cy, cz, r, ry, col, n, sx) => { const c = H3(col), dx = Math.cos(ry) * (sx || 1), dz = -Math.sin(ry) * (sx || 1), nx = Math.sin(ry), nz = Math.cos(ry); n = n || 16;
    for (let k = 0; k < n; k++) { const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832, P = a => [cx + Math.cos(a) * r * dx + nx * .02, cy + Math.sin(a) * r, cz + Math.cos(a) * r * dz + nz * .02];
      b.tri([cx + nx * .02, cy, cz + nz * .02], P(a0), P(a1), c); b.tri([cx + nx * .02, cy, cz + nz * .02], P(a1), P(a0), c); } };

  /* 歷史本文：紅色立方體，四面刻 7×7 的文字格，底部一圈青苔 */
  PT.poneglyph = A => { const { b, x, z, ry, O, o } = A, s = (o.s || 1) * 1.6, W = 3 * s, y = (o.y != null ? o.y : A.Hs(x, z)) - (o.hidden ? W * .3 : 0), L = Lf(x, z, ry); b.m = 3;
    b.box(x, y - .3, z, W, W + .3, W, '#b3182c', ry); b.m = 0;
    const n = 7, cell = W / (n + 1);
    for (let f = 0; f < 4; f++) { const a = ry + f * Math.PI / 2, fx = Math.sin(a), fz = Math.cos(a), sx = Math.cos(a), sz = -Math.sin(a);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const lx = (i - (n - 1) / 2) * cell, ly = y + cell * .9 + j * cell, w = cell * (.5 + ((i * 7 + j * 3 + f) % 4) * .08);
        b.box(x + fx * (W / 2 + .01) + sx * lx, ly, z + fz * (W / 2 + .01) + sz * lx, w, cell * .55, .06, ((i + j + f) % 3) ? '#6e0a18' : '#7e1220', a); } }
    b.m = 0; for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832, r = W * .62, [mx, mz] = L(Math.cos(a) * r, Math.sin(a) * r); b.sphere(mx, y - .1, mz, W * (.12 + (k % 3) * .04), 6, k % 2 ? '#3e6a2e' : '#4e7a36', .45); }
    if (o.hidden) { /* v154：使用者「歷史本文都在很隱密的地方」——半埋進土裡、藤蔓爬滿、兩面斷牆和一根倒下的石柱擋住，只從縫隙看得到紅色 */
      b.m = 0; for (let k = 0; k < 18; k++) { const f = k % 4, a = ry + f * Math.PI / 2, fx = Math.sin(a), fz = Math.cos(a), sx = Math.cos(a), sz = -Math.sin(a), lx = ((k * 37) % 9 / 8 - .5) * W * .9, hh = W * (.35 + ((k * 13) % 5) * .12);
        b.box(x + fx * (W / 2 + .05) + sx * lx, y + W - hh, z + fz * (W / 2 + .05) + sz * lx, .22, hh + .1, .08, k % 2 ? '#3e6a2e' : '#2e5a24', a); }
      for (let k = 0; k < 8; k++) { const [vx, vz] = L(((k % 4) - 1.5) * W * .26, (Math.floor(k / 4) - .5) * W * .4); b.box(vx, y + W - .05, vz, W * .3, .14, W * .22, k % 2 ? '#3e6a2e' : '#4e7a36', ry + k * .7); }
      b.m = 3; [[-1, 0], [0, -1]].forEach(([dx, dz]) => { const [wx, wz] = L(dx * W * .95, dz * W * .95); b.box(wx, y - .2, wz, dz ? W * 1.6 : .9, W * 1.25, dx ? W * 1.6 : .9, '#b8a880', ry, .15); });
      const [cx, cz] = L(W * .2, W * .1); b.cyl(cx - Math.cos(ry) * W, y + W * .3, cz + Math.sin(ry) * W, .8, .75, W * 2.1, 10, '#c0b088', null, 0, [Math.cos(ry) * W * 1.9, -Math.sin(ry) * W * 1.9 + W * .2]); b.m = 0; }
    O.push([x, z, W * .8]); return { y }; };

  /* 時計台：o.bomb 時，正面的時鐘換成從窗口露出來的炸彈 */
  const _ct = PT.clocktower;
  if (_ct) PT.clocktower = A => { const r = _ct(A), { b, x, z, ry, o } = A; if (!o.bomb) return r; const y = r.y != null ? r.y : A.Hs(x, z), L = Lf(x, z, ry), nx = Math.sin(ry), nz = Math.cos(ry); b.m = 0;
    const [wx, wz] = L(0, 2.6); b.box(wx, y + 23.4, wz, 3.8, 4.2, .14, '#c8a878', ry); b.box(wx + nx * .03, y + 23.6, wz + nz * .03, 3.4, 3.8, .14, '#8a6a46', ry); /* 木頭窗框蓋住原本的鐘面，黑色炸彈才看得清楚 */
    const [bx, bz] = L(0, 2.3), R = 1.55, cy = y + 25.4; b.sphere(bx, cy, bz, R, 14, '#18181e');
    const fx = bx + nx * R * .96, fz = bz + nz * R * .96; disc(b, fx, cy + .45, fz, .62, ry, '#f4f2ea', 18); disc(b, fx + nx * .02, cy + .45, fz + nz * .02, .5, ry, '#dcdad2', 18);
    b.box(fx + nx * .05, cy + .45, fz + nz * .05, .06, .42, .03, '#1c1c22', ry); b.box(fx + nx * .05 + Math.cos(ry) * .14, cy + .45, fz + nz * .05 - Math.sin(ry) * .14, .3, .05, .03, '#1c1c22', ry);
    for (const sd of [-1, 1]) { const ex = bx + nx * R * .9 + Math.cos(ry) * sd * .52, ez = bz + nz * R * .9 - Math.sin(ry) * sd * .52; disc(b, ex, cy - .55, ez, .2, ry, '#050507', 10); }
    for (let k = 0; k < 5; k++) { const t = (k - 2) / 2, mx = bx + nx * R * .86 + Math.cos(ry) * t * .55, mz = bz + nz * R * .86 - Math.sin(ry) * t * .55; b.box(mx, cy - 1 + (k % 2) * .1, mz, .26, .06, .04, '#3a3a44', ry + (k % 2 ? .5 : -.5)); }
    [-1, 1].forEach(sd => { const [rx, rz] = L(sd * 1.1, 2.4); b.box(rx, y + 23.4, rz, .12, 4.2, .12, '#8a6a42', ry); }); /* 綁住炸彈的繩子 */
    return r; };

  /* 鬼之島的骷髏頭（v154 第三版：使用者「重新設計」）——不再用球堆，改成一整顆雕出來的骷髏岩：
     以球面網格為底，依方向雕出頭蓋、壓平的臉、深陷的眼窩、三角鼻孔、突出的顴骨與眉骨、往內收的下顎與張開的嘴；
     表面加岩石起伏。顏色依深度：凸出處是被火映紅的黑岩、凹處更暗、裂縫燒得通紅；另外加大方石牙、發光的眼睛、兩支往上彎的牛角形岩角、刀與底部亂石。 */
  if (global.WIP3D_V154) PT.skull = A => { const { b, x, z, ry, Hs, O, fp, o } = A, L = Lf(x, z, ry), y0 = o.y != null ? o.y : Hs(x, z), R = o.r || 16, cy = y0 + R * .95, nx = Math.sin(ry), nz = Math.cos(ry);
    const P = (lx, ly, lz) => { const [px, pz] = L(lx * R, lz * R); return [px, cy + ly * R, pz]; };
    const nz3 = (X, Y, Z) => { const h = (a, b, c) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); }; const fx = Math.floor(X), fy = Math.floor(Y), fz = Math.floor(Z), tx = X - fx, ty = Y - fy, tz = Z - fz, sm = t => t * t * (3 - 2 * t);
      let r = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) r += h(fx + i, fy + j, fz + k) * (i ? sm(tx) : 1 - sm(tx)) * (j ? sm(ty) : 1 - sm(ty)) * (k ? sm(tz) : 1 - sm(tz)); return r; };
    const g = (d, c, w) => { const dot = d[0] * c[0] + d[1] * c[1] + d[2] * c[2]; const ang = Math.acos(Math.max(-1, Math.min(1, dot))); return Math.exp(-(ang / w) * (ang / w)); };
    const N = v => { const l = Math.hypot(...v); return v.map(t => t / l); };
    const EYE = [N([-.4, .14, .9]), N([.4, .14, .9])], NOSE = N([0, -.14, .99]), CHEEK = [N([-.62, -.1, .78]), N([.62, -.1, .78])], BROW = [N([-.4, .36, .84]), N([.4, .36, .84])];
    /* 方向 d → 半徑與「凹陷量」 */
    const shape = d => { let r = 1, dent = 0; const [dx, dy, dz] = d;
      if (dz > .45) r *= 1 - (dz - .45) * .22;                                   /* 臉部壓平 */
      if (dy < -.15) { const t = (-dy - .15) / .85; r *= 1 - t * .32 * (1 - Math.max(0, dz) * .3); }   /* 下顎往內收 */
      if (dy > .2 && dz < .4) r *= 1 + (dy - .2) * .1;                           /* 頭蓋 */
      for (const e of EYE) { const k = g(d, e, .27); r -= .3 * k; dent = Math.max(dent, k); }
      { const k = g(d, NOSE, .13) * (dy < -.05 ? 1 : .4); r -= .2 * k; dent = Math.max(dent, k * .9); }
      for (const c of CHEEK) r += .07 * g(d, c, .25);
      for (const c of BROW) r += .06 * g(d, c, .22);
      if (dz > .55 && dy < -.28 && dy > -.62 && Math.abs(dx) < .5) { const k = Math.min(1, (dz - .55) * 4) * (1 - Math.abs(dx) / .5); r -= .16 * k; dent = Math.max(dent, k * .8); }  /* 張開的嘴 */
      r += (nz3(dx * 4, dy * 4, dz * 4) - .5) * .09 + (nz3(dx * 11 + 7, dy * 11, dz * 11) - .5) * .035;   /* 岩石起伏 */
      return [r, dent]; };
    const col = (d, dent, rr) => { const n1 = nz3(d[0] * 9 + 3, d[1] * 9, d[2] * 9), n2 = nz3(d[0] * 8, d[1] * 8 + 9, d[2] * 8), n3 = nz3(d[0] * 15 + 2, d[1] * 15, d[2] * 15 + 5), crack = false;
      if (crack) return [1, .32 + n1 * .25, .06];
      const lit = Math.max(0, .55 - d[1] * .6) * (1 - dent) ; /* 下方被岩漿映紅 */
      const base = .1 + n1 * .1 - dent * .08; return [Math.max(.02, base + lit * .18), Math.max(.015, base * .7 + lit * .03), Math.max(.015, base * .62)]; };
    const LAT = 30, LON = 56, V = [];
    for (let i = 0; i <= LAT; i++) { const th = i / LAT * Math.PI, row = []; for (let j = 0; j <= LON; j++) { const ph = j / LON * Math.PI * 2, d = [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)], [r, dent] = shape(d);
        row.push({ p: P(d[0] * r * 1.0, d[1] * r * 1.02, d[2] * r * .94), c: col(d, dent, r) }); } V.push(row); }
    const C = [x, cy, z], T = (a, bb, c) => { const ux = bb.p[0] - a.p[0], uy = bb.p[1] - a.p[1], uz = bb.p[2] - a.p[2], vx = c.p[0] - a.p[0], vy = c.p[1] - a.p[1], vz = c.p[2] - a.p[2], n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], m = [(a.p[0] + bb.p[0] + c.p[0]) / 3 - C[0], (a.p[1] + bb.p[1] + c.p[1]) / 3 - C[1], (a.p[2] + bb.p[2] + c.p[2]) / 3 - C[2]];
      if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0) b.triV(a.p, bb.p, c.p, a.c, bb.c, c.c); else b.triV(a.p, c.p, bb.p, a.c, c.c, bb.c); };
    b.m = 3; for (let i = 0; i < LAT; i++) for (let j = 0; j < LON; j++) { const a = V[i][j], bb = V[i][j + 1], c = V[i + 1][j + 1], d = V[i + 1][j]; if (i) T(a, bb, c); if (i < LAT - 1) T(a, c, d); }
    b.m = 0;
    /* 嘴裡的岩漿光 */ { const [px, py, pz] = P(0, -.5, .5); b.box(px, py, pz, R * .62, R * .22, R * .2, '#ff4a12', ry); const [qx, qy, qz] = P(0, -.46, .52); b.box(qx, qy, qz, R * .4, R * .12, R * .2, '#ffb03a', ry); }
    /* 大方石牙：上排 6 顆、下排 6 顆，參差不齊 */
    for (let k = 0; k < 6; k++) { const t = (k - 2.5) / 2.5, w = R * .11, curve = .8 - Math.abs(t) * .1;
      { const [tx, ty, tz] = P(t * .34, -.36, curve); b.m = 3; b.box(tx, ty - R * (.1 + (k % 2) * .03), tz, w, R * (.13 + (k % 3) * .03), R * .12, k % 2 ? '#4a3c36' : '#3c302a', ry, .15); }
      { const [tx, ty, tz] = P(t * .3, -.62, curve - .04); b.box(tx, ty, tz, w * .92, R * (.1 + (k % 2) * .03), R * .11, k % 2 ? '#3c302a' : '#4a3c36', ry, .15); b.m = 0; } }
    /* 眼睛：眼窩深處發光 */
    for (const e of EYE) { const [ex, ey, ez] = P(e[0] * .66, e[1] * .66, e[2] * .62); b.sphere(ex, ey, ez, R * .15, 12, '#ff8a10', .85); const [fx, fy, fz] = P(e[0] * .72, e[1] * .72, e[2] * .7); b.sphere(fx, fy, fz, R * .085, 10, '#fff2a8', .85); }
    /* 牛角形岩角：從太陽穴往外伸、再往上彎，一節節變細，尖端燒紅 */
    for (const s2 of [-1, 1]) { b.m = 3; let [hx, hy, hz] = P(s2 * .78, .5, -.05), hr = R * .24;
      for (let k = 0; k < 10; k++) { const t = k / 10, dxl = s2 * R * (.26 - t * .22), dyl = R * (.02 + t * .26), dzl = R * .02 * Math.sin(t * 3), [qx, qz] = [hx + Math.cos(ry) * dxl + nx * dzl, hz - Math.sin(ry) * dxl + nz * dzl];
        b.cyl(hx, hy, hz, hr, hr * .86, Math.max(.5, dyl + .05), 9, k > 7 ? '#6a1e10' : (k % 2 ? '#2a1c18' : '#34241e'), null, 0, [qx - hx, qz - hz]); hx = qx; hz = qz; hy += dyl; hr *= .86; }
      b.m = 0; b.sphere(hx, hy, hz, hr * 1.4, 8, '#ff4a14', 1.4); }
    /* 燒紅的裂縫：沿著骷髏表面蜿蜒的細亮線（另外畫，網格太粗不能用頂點顏色） */
    { let q = 7; const rq = () => (q = q * 16807 % 2147483647) / 2147483647;
      for (let c = 0; c < 22; c++) { let th = .35 + rq() * 1.6, ph = (rq() - .5) * 4.2, dth = (rq() - .5) * .12, dph = (rq() - .5) * .12; const n = 5 + Math.floor(rq() * 7);
        for (let k = 0; k < n; k++) { const d = [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)], [r, dent] = shape(d); if (dent > .25) break;
          const t2 = th + dth, p2 = ph + dph, d2 = [Math.sin(t2) * Math.sin(p2), Math.cos(t2), Math.sin(t2) * Math.cos(p2)], [r2] = shape(d2);
          const A1 = P(d[0] * r * 1.012, d[1] * r * 1.032, d[2] * r * .952), A2 = P(d2[0] * r2 * 1.012, d2[1] * r2 * 1.032, d2[2] * r2 * .952), w = R * .022;
          const mx = (A1[0] + A2[0]) / 2, mz = (A1[2] + A2[2]) / 2, len = Math.hypot(A2[0] - A1[0], A2[1] - A1[1], A2[2] - A1[2]), cl = k % 3 ? '#ff5a1a' : '#ffa03a';
          b.cyl(A1[0], A1[1], A1[2], w, w * .8, Math.max(.2, A2[1] - A1[1]), 4, cl, null, 0, [A2[0] - A1[0], A2[2] - A1[2]]);
          th = t2; ph = p2; dth += (rq() - .5) * .08; dph += (rq() - .5) * .08; } } }
    /* 右側插著一把刀 */ { const [kx, ky, kz] = P(.66, .62, .52); b.cyl(kx, ky, kz, .4, .32, R * .6, 6, '#141418', null, 0, [Math.cos(ry) * R * .34, -Math.sin(ry) * R * .34]); b.box(kx + Math.cos(ry) * R * .37, ky + R * .58, kz - Math.sin(ry) * R * .37, 1, .3, 1, '#c8a040', ry); }
    /* 底部亂石＋岩漿光 */
    let sd0 = 91; const rn = () => (sd0 = sd0 * 16807 % 2147483647) / 2147483647;
    b.m = 3; for (let k = 0; k < 18; k++) { const a = k / 18 * 6.2832 + rn() * .3, [lx, ly, lz] = P(Math.cos(a) * 1.0, -.95, Math.sin(a) * .9); b.sphere(lx, ly, lz, R * (.13 + rn() * .1), 7, ['#2a1c18', '#34221c', '#24181a'][k % 3], .6, .35, k + 51); } b.m = 0;
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832, [lx, ly, lz] = P(Math.cos(a) * 1.08, -1.0, Math.sin(a) * .95); b.sphere(lx, ly, lz, R * .08, 6, ['#ff4a14', '#ff6a1a', '#ff8a2a'][k % 3], .35); }
    O.push([x, z, R * .95]); A.markB && A.markB(x, z, R * .9); fp(x, z, R + 2); return { y: y0 }; };

  /* 浮空島的底部（v154 鬼之島）：沿著島緣找出每個方向的邊界，往下做倒錐形的鋸齒岩塊、垂下的尖石，四周三圈雲帶 */
  PT.floatbase = A => { const { b, x, z, Hs, o, MB } = A, SC = (A.I && A.I.SC) || 2, lift = o.lift || 30, rimMax = (o.rim || 46) * SC, top = lift + .2, DEPTH = lift * .78, M = 80, ROWS = 12;
    const h3 = (a, c) => { const v = Math.sin(a * 91.7 + c * 37.3) * 43758.5453; return v - Math.floor(v); };
    const rimR = []; for (let k = 0; k < M; k++) { const a = k / M * 6.2832; let r = 4; while (r < rimMax && Hs(x + Math.cos(a) * r, z + Math.sin(a) * r) > lift * .5) r += .8; rimR.push(r + .6); }
    const C = [x, top - DEPTH * .35, z], V = [];
    for (let i = 0; i <= ROWS; i++) { const t = i / ROWS, row = []; for (let k = 0; k <= M; k++) { const kk = k % M, a = kk / M * 6.2832, jag = 1 + (h3(kk, i) - .5) * .4 + Math.sin(a * 9 + i) * .08 + (kk % 3 === 0 ? .12 : 0);
        const r = (i === 0 ? rimR[kk] + .8 : rimR[kk] * Math.pow(1 - t, 1.25) * jag), y = top - .4 - t * DEPTH * (1 + (h3(i, kk) - .5) * .25) - (i === 0 ? 0 : (h3(kk + 7, i) * 1.6));
        const dk = .85 + h3(kk * 3, i) * .3, c = t < .15 ? [.36 * dk, .28 * dk, .22 * dk] : [.22 * dk * (1 - t * .3), .17 * dk * (1 - t * .3), .15 * dk];
        row.push({ p: [x + Math.cos(a) * r, y, z + Math.sin(a) * r], c }); } V.push(row); }
    const T = (p, q, r) => { const ux = q.p[0] - p.p[0], uy = q.p[1] - p.p[1], uz = q.p[2] - p.p[2], vx = r.p[0] - p.p[0], vy = r.p[1] - p.p[1], vz = r.p[2] - p.p[2], n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], m = [(p.p[0] + q.p[0] + r.p[0]) / 3 - C[0], (p.p[1] + q.p[1] + r.p[1]) / 3 - C[1], (p.p[2] + q.p[2] + r.p[2]) / 3 - C[2]];
      if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0) b.triV(p.p, q.p, r.p, p.c, q.c, r.c); else b.triV(p.p, r.p, q.p, p.c, r.c, q.c); };
    b.m = 3; for (let i = 0; i < ROWS; i++) for (let k = 0; k < M; k++) { T(V[i][k], V[i][k + 1], V[i + 1][k + 1]); T(V[i][k], V[i + 1][k + 1], V[i + 1][k]); }
    /* 島緣的岩唇：從地面邊緣往外蓋住切掉的懸崖 */
    for (let k = 0; k < M; k++) { const a0 = k / M * 6.2832, a1 = (k + 1) / M * 6.2832, r0 = rimR[k], r1 = rimR[(k + 1) % M];
      const P = (a, r, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r], gy0 = Hs(x + Math.cos(a0) * (r0 - 3), z + Math.sin(a0) * (r0 - 3)), gy1 = Hs(x + Math.cos(a1) * (r1 - 3), z + Math.sin(a1) * (r1 - 3)), cc = [.4, .32, .25];
      const q = [P(a0, r0 - 3, Math.min(gy0, top + 1) - .25), P(a1, r1 - 3, Math.min(gy1, top + 1) - .25), P(a1, r1 + .8, top - .4), P(a0, r0 + .8, top - .4)];
      b.triV(q[0], q[2], q[1], cc, cc, cc); b.triV(q[0], q[3], q[2], cc, cc, cc); b.triV(q[0], q[1], q[2], cc, cc, cc); b.triV(q[0], q[2], q[3], cc, cc, cc); }
    /* 垂下的尖石 */
    for (let k = 0; k < 48; k++) { const a = h3(k, 1) * 6.2832, rr = .15 + h3(k, 2) * .75, kk = Math.floor(a / 6.2832 * M) % M, rad = rimR[kk] * rr, t = rad / rimR[kk], yb = top - .4 - (1 - Math.pow(Math.max(.01, t), .8)) * DEPTH * .9, hh = 5 + h3(k, 3) * 12;
      b.cyl(x + Math.cos(a) * rad, yb - hh, z + Math.sin(a) * rad, .15, 1.2 + h3(k, 4) * 2.2, hh + 1, 6, '#2a201c'); }
    { b.cyl(x, top - DEPTH - 10, z, .3, 5, 12, 8, '#221a18'); } /* 最底下的尖端 */
    b.m = 0;
    /* 雲帶：三圈白色的霧，斜斜地繞著島 */
    const MM = MB || b; for (let ring = 0; ring < 3; ring++) { const yr = top - 4 - ring * DEPTH * .3, n = 72, tilt = .06 + ring * .03;
      for (let k = 0; k < n; k++) { const a = k / n * 6.2832 + ring, kk = Math.floor(((a % 6.2832) + 6.2832) % 6.2832 / 6.2832 * M) % M, r = rimR[kk] * (1.02 - ring * .18) + 3;
        MM.sphere(x + Math.cos(a) * r, yr + Math.sin(a + ring) * r * tilt, z + Math.sin(a) * r, 5.5 + h3(k, ring) * 3.5, 8, '#f4f6ff', .32, .2, k + ring * 50); } }
    return {}; };

  /* 森林深處的洞穴（v154：使用者「歷史本文藏在森林深處的洞穴裡」）：亂石堆成的拱頂，前方一個洞口（面向 ry），洞裡放 o.inside 指定的零件 */
  PT.cave = A => { const { b, x, z, ry, O, o } = A, y = A.Hs(x, z), R = o.r || 9, L = Lf(x, z, ry); let sd0 = 17; const rn = () => (sd0 = sd0 * 16807 % 2147483647) / 2147483647;
    const RK = ['#6e6a62', '#5e5a54', '#7a766c', '#56524c']; b.m = 3;
    for (let ring = 0; ring < 4; ring++) { const e = ring / 4 * 1.25, rr = R * Math.cos(e), yy = y + R * Math.sin(e) * .9, n = Math.max(5, Math.round(14 * Math.cos(e)));
      for (let k = 0; k < n; k++) { const a = k / n * 6.2832 + ring * .4; const front = Math.cos(a) > .72 && ring < 3; if (front) continue; /* 洞口 */
        const [px, pz] = L(Math.sin(a) * rr, Math.cos(a) * rr); b.sphere(px, yy, pz, R * (.32 + rn() * .14), 8, RK[(k + ring) % 4], .8, .3, k * 5 + ring); } }
    { b.sphere(x, y + R * .95, z, R * .55, 9, RK[0], .6, .3, 77); } /* 拱頂 */
    for (let k = 0; k < 8; k++) { const a = rn() * 6.283, [px, pz] = L(Math.sin(a) * R * 1.2, Math.cos(a) * R * 1.2); b.sphere(px, y + R * .3, pz, R * .22, 6, k % 2 ? '#3e6a2e' : '#4e7a36', .7, .3, k); } /* 洞外的青苔與灌木 */
    b.m = 0; b.box(x, y - .25, z, R * 1.3, .3, R * 1.3, '#2e2a26', ry); /* 洞內的暗色地面 */
    for (let k = 0; k < 6; k++) { const [vx, vz] = L((k - 2.5) * R * .14, R * .78); b.box(vx, y + R * (.55 + (k % 3) * .08), vz, .16, R * (.25 + (k % 2) * .15), .1, k % 2 ? '#3e6a2e' : '#2e5a24', ry); } /* 洞口垂下的藤蔓 */
    if (o.inside && PT[o.inside[0]]) { const [ix, iz] = L(0, -R * .25); PT[o.inside[0]](Object.assign({}, A, { x: ix, z: iz, o: o.inside[1] || {} })); }
    A.fp && A.fp(x, z, R * 1.3); O.push([x, z, 1]); return { y }; };
  /* 不參與幾何碰撞的零件（scenes.js 的 GB 會跳過 b.ncr 記下的頂點範圍）：鳥籠的絲線從天上拉到地面，只是視覺 */
  ['birdcage', 'arrowsign'].forEach(k => { const f = PT[k]; if (!f) return; PT[k] = A => { const s0 = A.b.p.length, r = f(A); (A.b.ncr || (A.b.ncr = [])).push([s0, A.b.p.length]); return r; }; });
})(typeof window !== 'undefined' ? window : globalThis);
