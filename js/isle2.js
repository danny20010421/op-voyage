/* v146 新版島嶼系統：依關卡設計資料產生地形（陸地形狀、山、河、湖、懸崖、港灣）、道路網（主街、街道、巷弄樓梯、鄉間小路、山徑、懸崖步道）、
   1～3 層的精細房屋、工會與各島特色建築、樹林、田地、碼頭與橋，並把劇情動線（出生點、NPC、任務地點、BOSS）對到新地圖上。
   - 地形先算在 1 單位的高度網格上，道路與房屋地基會整平，之後 H(x,z) 用雙線性內插讀網格（很快，走路與擺設都用它）。
   - 地形網格切成多塊，每塊各自做視錐剔除；海面下的塊不建；手機用較粗的網格。
   - 資料以設計座標寫（設計圖 ±160），載入時乘上 SC 放大。
   R:scenes.js（buildScene 遇到 ISLE2[章節 id] 時改用這裡）、e3three.js（scene.ext、葉片、椰葉）、world.js（scene.ext 小地圖、scene.maxStep 懸崖不能爬） */
(function (global) {
  if (!global.E3) return;
  const { hex, shade, mix } = E3;
  const ISLE2 = global.ISLE2 = global.ISLE2 || {};
  const MOB = (() => { try { return matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700; } catch (e) { return false; } })();
  /* ---------- 小工具 ---------- */
  const vh = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz); return (vh(i, j) * (1 - u) + vh(i + 1, j) * u) * (1 - w) + (vh(i, j + 1) * (1 - u) + vh(i + 1, j + 1) * u) * w; };
  const fbm = (x, z) => (vn(x, z) - .5) * .55 + (vn(x * 2.1 + 7, z * 2.1 + 3) - .5) * .3 + (vn(x * 4.3 + 1, z * 4.3 + 9) - .5) * .15;
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return [Math.hypot(px - ax - dx * t, pz - az - dz * t), t]; };
  const polyD = (px, pz, P) => { let d = 1e9; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, segD(px, pz, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1])[0]); return d; };
  function spline(P, step) { /* Catmull-Rom，大約每 step 單位一個點 */
    const Q = [P[0], ...P, P[P.length - 1]], out = [];
    for (let i = 1; i < Q.length - 2; i++) { const [p0, p1, p2, p3] = [Q[i - 1], Q[i], Q[i + 1], Q[i + 2]], n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); } }
    out.push(P[P.length - 1].slice()); return out; }
  const pip = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const RW = { promenade: 6.5, main: 5.5, street: 4.4, alley: 2.6, lane: 3.6, trail: 2.4, cliff: 2.6 };
  const RCOL = { promenade: '#cfc4b0', main: '#c9bfac', street: '#c8ae84', alley: '#bea27a', lane: '#c4a674', trail: '#a88e66', cliff: '#b49e7e' };
  const PAVED = { promenade: 1, main: 1, street: 1, alley: 1 };

  /* ---------- 島嶼 ---------- */
  function Island(id, D) {
    const SC = D.SC || 2, ext = D.ext || 170 * SC, G = D.grid || 1, N = Math.round(ext * 2 / G) + 1;
    const s = v => v * SC, sp = p => [p[0] * SC, p[1] * SC];
    const I = { id, ext, SC };
    let Hg = null, Rg = null, Bg = null, river = [], lakes = [], roads = [], houses = [], occ = [];
    const idx = (x, z) => { const i = Math.round((x + ext) / G), j = Math.round((z + ext) / G); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
    const Hs = (x, z) => { const fx = (x + ext) / G, fz = (z + ext) / G; if (fx < 0 || fz < 0 || fx >= N - 1 || fz >= N - 1) return -4; const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j, k = j * N + i;
      return (Hg[k] * (1 - u) + Hg[k + 1] * u) * (1 - w) + (Hg[k + N] * (1 - u) + Hg[k + N + 1] * u) * w; };
    I.H = Hs;
    /* 原始地形（還沒整平道路） */
    function raw(x, z) {
      const dx = x / SC, dz = z / SC; let land = -1e9;
      for (const [bx, bz, r, j] of D.land) { const a = Math.atan2(dz - bz, dx - bx), rr = r * (1 + (j || .12) * (Math.sin(3 * a + bx * .1) + .6 * Math.sin(7 * a + bz * .07) + .3 * Math.sin(11 * a))); land = Math.max(land, (rr - Math.hypot(dx - bx, dz - bz)) / 12); }
      for (const [bx, bz, k, off] of D.bays || []) land = Math.min(land, Math.hypot(dx - bx, dz - bz) / k - off);
      land += fbm(dx * .03, dz * .03) * 1.2;
      const mask = Math.max(0, Math.min(1, land)); if (mask <= 0) return -4 + Math.max(-6, land);
      let h = 0;
      for (const t of D.terrain) {
        if (t.ramp) { const [x0, z0, x1, z1, h0, h1] = t.ramp, vx = x1 - x0, vz = z1 - z0, tt = Math.max(0, Math.min(1, ((dx - x0) * vx + (dz - z0) * vz) / (vx * vx + vz * vz))); h += h0 + (h1 - h0) * tt; }
        else if (t.g) { const [gx, gz, r, gh] = t.g; h += gh * Math.exp(-((dx - gx) ** 2 + (dz - gz) ** 2) / (2 * r * r)); }
      }
      h += fbm(dx * .045 + 3, dz * .045 + 5) * (D.rough || 4);
      for (const R of D.rivers || []) { const d = polyD(dx, dz, R.pts); h -= Math.pow(Math.max(0, 1 - d / (R.valley || 16)), 1.5) * (R.depth || 6); }
      for (const L of D.lakes || []) { const d = Math.hypot((dx - L.x) / (L.rx / L.rz), dz - L.z); if (d < L.rz + 4) h = Math.min(h, h * .4 + (d - L.rz - 4) * .5); }
      h *= Math.min(1, mask * 1.6);
      for (const c of D.cliffs || []) if (Math.hypot(dx - c[0], dz - c[1]) < c[2]) { const coast = Math.max(0, land * 12); if (coast < 8) h *= Math.pow(Math.min(1, coast / 8), .35); }
      return s(h) * (D.vScale || .5) + (h > 0 ? .4 : 0);
    }
    I.prepare = () => {
      if (Hg) return Hs;
      const t0 = performance.now(); Hg = new Float32Array(N * N); Rg = new Uint8Array(N * N); Bg = new Uint8Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) Hg[j * N + i] = raw(-ext + i * G, -ext + j * G);
      /* 河、湖（水面高度） */
      river = (D.rivers || []).map(R => { const P = spline(R.pts.map(sp), 2), hs = P.map(p => Hs(p[0], p[1])); for (let k = 1; k < hs.length; k++) hs[k] = Math.min(hs[k], hs[k - 1]); return { P, hs, w: s(R.w || 3.2) }; });
      lakes = (D.lakes || []).map(L => ({ x: s(L.x), z: s(L.z), rx: s(L.rx), rz: s(L.rz), y: Hs(s(L.x), s(L.z)) + .6 }));
      /* 道路：沿線高度平滑、坡度限制後整平兩側 */
      roads = D.roads.map(([pts, kind]) => { const P = spline(pts.map(sp), 1.5); let hs = P.map(p => Math.max(.9, Hs(p[0], p[1])));
        for (let it = 0; it < 6; it++) hs = hs.map((v, k) => (hs[Math.max(0, k - 2)] + hs[Math.max(0, k - 1)] + v + hs[Math.min(hs.length - 1, k + 1)] + hs[Math.min(hs.length - 1, k + 2)]) / 5);
        return { P, hs, kind, w: RW[kind] * (D.roadScale || 1.15) }; });
      for (const R of roads) { const hw = R.w / 2, reach = hw + 3.5, code = Object.keys(RW).indexOf(R.kind) + 1;
        for (let k = 0; k < R.P.length; k++) { const [x, z] = R.P[k], y = R.hs[k];
          for (let jz = Math.floor((z - reach + ext) / G); jz <= Math.ceil((z + reach + ext) / G); jz++) for (let ix = Math.floor((x - reach + ext) / G); ix <= Math.ceil((x + reach + ext) / G); ix++) {
            if (ix < 0 || jz < 0 || ix >= N || jz >= N) continue; const wx = -ext + ix * G, wz = -ext + jz * G, d = Math.hypot(wx - x, wz - z); if (d > reach) continue; const q = jz * N + ix;
            if (Hg[q] < -1) continue; const f = 1 - sm(hw, reach, d); if (f > 0) Hg[q] = Hg[q] * (1 - f) + y * f; if (d < hw && (!Rg[q] || code < Rg[q])) Rg[q] = code; } } }
      /* 河道與湖面：河床往下挖 */
      for (const R of river) for (let k = 0; k < R.P.length; k++) { const [x, z] = R.P[k], y = R.hs[k], reach = R.w / 2 + 2.5;
        for (let jz = Math.floor((z - reach + ext) / G); jz <= Math.ceil((z + reach + ext) / G); jz++) for (let ix = Math.floor((x - reach + ext) / G); ix <= Math.ceil((x + reach + ext) / G); ix++) {
          if (ix < 0 || jz < 0 || ix >= N || jz >= N) continue; const d = Math.hypot(-ext + ix * G - x, -ext + jz * G - z); if (d > reach) continue; const q = jz * N + ix; if (Rg[q] && Rg[q] !== 9) continue;
          const bed = y - 1.6 * (1 - d / reach); Hg[q] = Math.min(Hg[q], d < R.w / 2 ? bed : Hg[q] * (d - R.w / 2) / 2.5 + bed * (1 - (d - R.w / 2) / 2.5)); Bg[q] = 2; } }
      for (const L of lakes) for (let jz = 0; jz < N; jz++) { const wz = -ext + jz * G; if (Math.abs(wz - L.z) > L.rz + 3) continue; for (let ix = 0; ix < N; ix++) { const wx = -ext + ix * G, d = Math.hypot((wx - L.x) * L.rz / L.rx, wz - L.z); if (d < L.rz) { const q = jz * N + ix; Hg[q] = Math.min(Hg[q], L.y - 2.2 * (1 - d / L.rz) - .4); Bg[q] = 2; } } }
      I.ms = performance.now() - t0; return Hs;
    };
    const flatPad = (x, z, w, d, ry, y) => { const c = Math.cos(ry), sn = Math.sin(ry), R = Math.hypot(w, d) / 2 + 2.5;
      for (let jz = Math.floor((z - R + ext) / G); jz <= Math.ceil((z + R + ext) / G); jz++) for (let ix = Math.floor((x - R + ext) / G); ix <= Math.ceil((x + R + ext) / G); ix++) {
        if (ix < 0 || jz < 0 || ix >= N || jz >= N) continue; const wx = -ext + ix * G - x, wz = -ext + jz * G - z, lx = wx * c - wz * sn, lz = wx * sn + wz * c, ex = Math.max(0, Math.abs(lx) - w / 2), ez = Math.max(0, Math.abs(lz) - d / 2), e = Math.hypot(ex, ez), q = jz * N + ix;
        if (e < 2.5 && !Rg[q]) { const f = 1 - sm(0, 2.5, e); Hg[q] = Hg[q] * (1 - f) + y * f; if (e === 0) Bg[q] = 1; } } };
    I.blocked = (x, z) => { const q = idx(x, z); return q < 0 || Bg[q] === 1 || Bg[q] === 2; };
    I.roadAt = (x, z) => { const q = idx(x, z); return q < 0 ? 0 : Rg[q]; };
    I.waterAt = (x, z) => { const q = idx(x, z); return q >= 0 && Bg[q] === 2; };
    I.roadDist = (x, z) => { let d = 1e9; for (const R of roads) for (let k = 0; k < R.P.length - 1; k += 2) d = Math.min(d, Math.hypot(x - R.P[k][0], z - R.P[k][1]) - R.w / 2); return d; };

    /* ---------- 建模 ---------- */
    I.build = (b, H, r, O, Dd, api) => {
      const { P, K, ST, CHIMNEYS } = api, hd = !!global.E3_HD;
      const fp = (x, z, rad) => { occ.push([x, z, rad]); };
      occ.length = 0; houses.length = 0;
      /* 劇情要用到的位置（登陸點、BOSS、NPC、敵人、任務點）先保留，房子和樹不會蓋在上面 */
      { const M = D.story || {}, keep = (p, rad) => p && occ.push([s(p[0]), s(p[1]), rad]); keep(M.spawn, 10); keep(M.boss, 14); Object.values(M.npcs || {}).forEach(p => keep(p, 4.5)); (M.spots || []).forEach(p => keep(p, 6));
        Object.values(M.steps || {}).forEach(m => { (m.points || []).concat(m.spots || []).forEach(p => keep(p, 4)); ['pos', 'goal', 'to', 'start'].forEach(f => keep(m[f], 5)); }); }
      const free = (x, z, rad) => !occ.some(o => Math.hypot(x - o[0], z - o[1]) < o[2] + rad) && I.roadDist(x, z) > rad - .5 && !river.some(R => polyD(x, z, R.P) < R.w / 2 + rad + 2) && !lakes.some(L => Math.hypot((x - L.x) * L.rz / L.rx, z - L.z) < L.rz + rad + 2);
      /* --- 房屋（1～3 層、木骨架、窗框百葉窗、陽台、花箱、門階、瓦屋頂、煙囪、招牌） --- */
      const ROOFS = D.roofs || ['#b5463a', '#3f6fa8', '#5b8a4a', '#c27a34', '#8a4a6a'], WALLS = D.walls || ['#f2e6cc', '#efe0c0', '#f6eedb', '#e8d6b4', '#f0e2d0'];
      function house(x, z, w, d, fl, ry, o) {
        o = o || {}; b.noBot = true; const y = Hs(x, z), c = Math.cos(ry), sn = Math.sin(ry), L = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c], FH = 3.1, h = fl * FH;
        const wall = o.wall || WALLS[Math.abs(Math.round(x * 3 + z * 7)) % WALLS.length], roof = o.roof || ROOFS[Math.abs(Math.round(x * 7 + z * 3)) % ROOFS.length], beam = o.beam || '#5e3e2a', shut = ['#3f72b8', '#5a8a4a', '#b5543c', '#d8a03a', '#7a5aa0'][Math.abs(Math.round(x + z * 5)) % 5];
        flatPad(x, z, w + .6, d + .6, ry, y);
        b.m = 3; b.box(x, y - 1.2, z, w + .5, 1.5, d + .5, '#a99d90', ry);
        for (let f = 0; f < fl; f++) { const y0 = y + .3 + f * FH, inset = f > 0 && o.jetty ? -.15 : 0;
          b.m = 4; b.box(x, y0, z, w + inset * 2, FH - .05, d + inset * 2, wall, ry); b.m = 1;
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, e]) => { const [px, pz] = L(a * (w / 2 + inset), e * (d / 2 + inset)); b.box(px, y0 - .05, pz, .3, FH + .05, .3, beam, ry); });
          b.box(x, y0 + FH - .2, z, w + .14 + inset * 2, .24, d + .14 + inset * 2, beam, ry);
          if (hd) { const nW = Math.max(1, Math.floor(w / 2.6));
            for (const side of [1, -1]) for (let k = 0; k < nW; k++) { const lx = (k - (nW - 1) / 2) * (w / nW); if (f === 0 && side === 1 && Math.abs(lx) < 1.1) continue;
              const [ax, az] = L(lx, side * (d / 2 + .05)), wy = y0 + FH * .32; b.box(ax, wy, az, 1.05, 1.2, .14, beam, ry); const [gx, gz] = L(lx, side * (d / 2 + .1)); b.m = 0; b.box(gx, wy + .14, gz, .74, .92, .08, '#2c3e58', ry); b.m = 1;
              const [s1x, s1z] = L(lx - .72, side * (d / 2 + .09)), [s2x, s2z] = L(lx + .72, side * (d / 2 + .09)); b.box(s1x, wy, s1z, .38, 1.2, .07, shut, ry); b.box(s2x, wy, s2z, .38, 1.2, .07, shut, ry);
              if ((k + f) % 2 === 0) { const [fx, fz] = L(lx, side * (d / 2 + .3)); b.box(fx, wy - .3, fz, 1.1, .26, .32, '#8a5a38', ry); b.m = 0; const [qx, qz] = L(lx, side * (d / 2 + .32)); b.box(qx, wy - .08, qz, .96, .22, .26, ['#ff6a8a', '#ffd34a', '#ff9a4a', '#f4f0ff'][Math.abs(Math.round(x * 5 + k + f)) % 4], ry); b.m = 1; } }
            const nS = Math.max(1, Math.floor(d / 3)); for (const side of [1, -1]) for (let k = 0; k < nS; k++) { const lz = (k - (nS - 1) / 2) * (d / nS), [ax, az] = L(side * (w / 2 + .05), lz), wy = y0 + FH * .32; b.box(ax, wy, az, .14, 1.15, 1, beam, ry); const [gx, gz] = L(side * (w / 2 + .1), lz); b.m = 0; b.box(gx, wy + .12, gz, .08, .86, .7, '#2c3e58', ry); b.m = 1; }
            if (f > 0 && (o.balcony || (Math.abs(Math.round(x + z)) % 3 === 0))) { const [bx, bz] = L(0, d / 2 + .7); b.box(bx, y0 - .12, bz, w * .5, .2, 1.4, beam, ry); for (let q = 0; q <= 4; q++) { const [px, pz] = L(-w * .25 + q * w * .125, d / 2 + 1.32); b.box(px, y0 + .08, pz, .1, .9, .1, beam, ry); } const [hx, hz] = L(0, d / 2 + 1.32); b.box(hx, y0 + .95, hz, w * .5, .1, .12, beam, ry); } } }
        /* 門、門框、石階、門燈 */
        { const [fx, fz] = L(0, d / 2 + .08); b.box(fx, y + .2, fz, 1.6, 2.5, .2, beam, ry); const [ex, ez] = L(0, d / 2 + .16); b.box(ex, y + .25, ez, 1.12, 2.2, .1, o.door || '#7a4a2a', ry); b.m = 3; const [gx, gz] = L(0, d / 2 + .7); b.box(gx, y - .45, gz, 2.1, .5, 1.1, '#b4a898', ry); b.m = 1;
          if (hd) { const [lx, lz] = L(1.1, d / 2 + .25); b.m = 0; b.box(lx, y + 2.1, lz, .22, .34, .22, '#ffd27a', ry); b.m = 1; } }
        /* 招牌 */
        if (o.sign) { const [sx, sz] = L(w / 2 + .3, d / 2 - .6); b.box(sx, y + 2.6, sz, .1, .1, 1.4, beam, ry); const [tx, tz] = L(w / 2 + .3, d / 2 - .9); b.m = 0; b.box(tx, y + 1.9, tz, .12, .8, 1.2, o.sign, ry); b.m = 1; }
        /* 屋頂：階梯狀瓦片、屋脊、山牆 */
        b.m = 2; const top = y + .3 + h, over = .55, rh = Math.min(3.4, w * .42), n = hd ? 5 : 3, hdz = d / 2 + over;
        [-1, 1].forEach(sd => { for (let i = 0; i < n; i++) { const [rx, rz] = L(0, sd * hdz * (1 - (i + .5) / n)); b.box(rx, top + rh * i / n - .05, rz, w + over * 2, rh / n + .16, hdz / n * 1.2, shade(roof, .84 + (i % 2) * .12), ry); } });
        b.m = 4; for (let i = 0; i < n - 1; i++) b.box(x, top + rh * i / n, z, w - .06, rh / n, d * (1 - (i + 1) / n) + .02, wall, ry); b.m = 2;
        b.box(x, top + rh - .05, z, w + over * 2 + .14, .28, .52, shade(roof, .68), ry);
        if (!o.noChimney) { const [cx, cz] = L(w * .3, -d * .2); b.m = 3; b.box(cx, top - .2, cz, .8, rh + 1.3, .8, '#9a8e82', ry); b.box(cx, top + rh + 1.1, cz, 1, .22, 1, '#8a7e72', ry); CHIMNEYS.push([cx, top + rh + 1.4, cz]); }
        b.m = 0; b.noBot = false; O.push([x, z, Math.max(w, d) / 2 + .2]); fp(x, z, Math.max(w, d) / 2 + .6);
        return { door: L(0, d / 2 + 2.2), y };
      }
      I.house = house;
      /* --- 道路的立體細節：主街路緣石、路燈 --- */
      for (const R of roads) { const hw = R.w / 2;
        if (hd && (R.kind === 'promenade' || R.kind === 'main')) for (let k = 0; k < R.P.length - 1; k += 1) { const [ax, az] = R.P[k], [bx, bz] = R.P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L, nz = (bx - ax) / L, ang = Math.atan2(bx - ax, bz - az);
          for (const sd of [-1, 1]) { const cx = (ax + bx) / 2 + nx * hw * sd, cz = (az + bz) / 2 + nz * hw * sd; if (I.roadAt(cx + nx * sd * 1.2, cz + nz * sd * 1.2)) continue; b.m = 3; b.box(cx, Hs(cx, cz) - .25, cz, .34, .42, L + .05, '#9c958a', ang); b.m = 0; } }
        if (R.kind !== 'trail' && R.kind !== 'alley') { const gap = R.kind === 'lane' ? 34 : 18; let acc = 0, side = 1;
          for (let k = 1; k < R.P.length; k++) { acc += Math.hypot(R.P[k][0] - R.P[k - 1][0], R.P[k][1] - R.P[k - 1][1]); if (acc < gap) continue; acc = 0; side = -side;
            const [ax, az] = R.P[k - 1], [bx, bz] = R.P[k], L = Math.hypot(bx - ax, bz - az) || 1, lx = bx - (bz - az) / L * (hw + .9) * side, lz = bz + (bx - ax) / L * (hw + .9) * side;
            if (I.roadAt(lx, lz) || I.waterAt(lx, lz) || Hs(lx, lz) < .6 || occ.some(o => Math.hypot(lx - o[0], lz - o[1]) < o[2])) continue;
            const y = Hs(lx, lz); b.m = 1; b.cyl(lx, y - .2, lz, .14, .1, 3.6, 6, '#3a3430'); b.box(lx, y + 3.4, lz, .5, .5, .5, '#3a3430'); b.m = 0; b.box(lx, y + 3.15, lz, .36, .4, .36, '#ffe2a0'); O.push([lx, lz, .4]); } } }
      /* --- 石橋（跨河，可以走） --- */
      for (const [p0, p1] of D.bridges || []) { const [ax, az] = sp(p0), [bx, bz] = sp(p1), L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az), ya = Hs(ax, az), yb = Hs(bx, bz), n = Math.ceil(L / 1.2);
        for (let k = 0; k < n; k++) { const t = (k + .5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ya + (yb - ya) * t + Math.sin(Math.PI * t) * 1.2; b.m = 3; b.box(x, y - .6, z, 4.6, .6, L / n + .05, '#b8ae9e', ang); if (hd) { const nx = Math.cos(ang), nz = -Math.sin(ang); [-1, 1].forEach(sd => b.box(x + nx * 2.2 * sd, y, z + nz * 2.2 * sd, .4, .7, L / n + .05, '#a39886', ang)); } b.m = 0;
          ST.plats.push({ x0: x - 1.8, z0: z - 1.8, x1: x + 1.8, z1: z + 1.8, y0: y, y1: y }); } }
      /* --- 碼頭（木棧道，可以走） --- */
      for (const [p0, p1, wd] of D.piers || []) { const [ax, az] = sp(p0), [bx, bz] = sp(p1), L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az), n = Math.ceil(L / 1.4), w = s(wd || 2), y = 1.4;
        for (let k = 0; k < n; k++) { const t = (k + .5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t; b.m = 1; b.box(x, y - .3, z, w, .3, L / n - .06, '#9a7048', ang); if (k % 2 === 0) { const nx = Math.cos(ang), nz = -Math.sin(ang); [-1, 1].forEach(sd => b.cyl(x + nx * (w / 2 - .2) * sd, -2.5, z + nz * (w / 2 - .2) * sd, .2, .2, 4.4, 6, '#6e4c30')); } b.m = 0;
          ST.plats.push({ x0: x - w / 2, z0: z - w / 2, x1: x + w / 2, z1: z + w / 2, y0: y, y1: y }); } }
      const TS = {}, tk = n => TS[n] = (b.p.length / 9 | 0) - Object.values(TS).reduce((a, v) => a + v, 0); tk('roads');
      /* --- 特色建築 --- */
      const LMK = {};
      for (const L of D.landmarks || []) { const [kind, x0, z0, ry, opt] = L, x = s(x0), z = s(z0), o = opt || {};
        const fn = ISLE2.parts[kind]; if (!fn) continue; const res = fn({ b, x, z, ry: ry || 0, o, Hs, house, O, ST, P, K, fp, flatPad, hd, D: Dd, CHIMNEYS, r }); if (o.key) LMK[o.key] = res; }
      I.lm = LMK; tk('landmarks');
      /* --- 沿街房屋 --- */
      const town = (D.town || []).map(t => ({ x: s(t[0]), z: s(t[1]), r: s(t[2]), fl: t[3] }));
      let seed = 4242; const rn = () => (seed = seed * 16807 % 2147483647) / 2147483647;
      for (const R of roads) { if (!(R.kind in PAVED)) continue; const hw = R.w / 2;
        for (let k = 2; k < R.P.length - 2; k += 4) { const [ax, az] = R.P[k - 1], [bx, bz] = R.P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L, cx = R.P[k][0], cz = R.P[k][1];
          const T = town.find(t => Math.hypot(cx - t.x, cz - t.z) < t.r); if (!T) continue; const core = 1 - Math.hypot(cx - T.x, cz - T.z) / T.r;
          for (const sd of [-1, 1]) { const fl = Math.max(1, Math.min(3, T.fl + (core > .55 ? 1 : 0) - (core < .2 ? 1 : 0) - (rn() < .25 ? 1 : 0))), w = fl === 1 ? 6.4 : fl === 2 ? 7.4 : 8.4, d = fl === 1 ? 5.4 : 6 + (fl - 2) * .6;
            const off = hw + 1.4 + d / 2, x = cx - uz * off * sd, z = cz + ux * off * sd, rad = Math.max(w, d) / 2;
            const fx2 = cx - uz * (off + d) * sd, fz2 = cz + ux * (off + d) * sd; /* 靠海那一側不蓋房子，留出海景與沙灘 */
            if (Hs(x, z) < 1.2 || Hs(fx2, fz2) < 1.3 || !free(x, z, rad * .92)) continue; const ry = Math.atan2(-ux * sd, -uz * sd) + Math.PI / 2 * 0; /* 門面向道路 */
            const face = Math.atan2(cx - x, cz - z); house(x, z, w, d, fl, face, { sign: rn() < .18 ? ['#c8322b', '#2c6ab0', '#d8a03a'][(rn() * 3) | 0] : null }); houses.push([x, z, fl]); } } }
      tk('houses');
      /* --- 田地、牧場（圍籬） --- */
      for (const F of D.fields || []) { const [fx, fz, fw, fd, fa] = F, x = s(fx), z = s(fz), w = s(fw), d = s(fd), c = Math.cos(fa), sn = Math.sin(fa);
        for (let k = -d / 2 + 1; k < d / 2; k += 1.6) for (let q = -w / 2 + 1; q < w / 2; q += hd ? 1.1 : 2) { const px = x + q * c + k * sn, pz = z - q * sn + k * c; if (I.roadAt(px, pz)) continue; const y = Hs(px, pz); b.box(px, y - .1, pz, .9, .7 + vh(q, k) * .3, .5, mix('#e2c060', '#c9a040', vh(k, q)), -fa); }
        fence(x, z, w + 2, d + 2, fa); }
      for (const F of D.pastures || []) { const [fx, fz, fw, fd, fa] = F; fence(s(fx), s(fz), s(fw), s(fd), fa); }
      function fence(x, z, w, d, a) { const c = Math.cos(a), sn = Math.sin(a), C = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [x + lx * c + lz * sn, z - lx * sn + lz * c]);
        for (let i = 0; i < 4; i++) { const [ax, az] = C[i], [bx, bz] = C[(i + 1) % 4], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 2.4), ang = Math.atan2(bx - ax, bz - az);
          for (let k = 0; k < n; k++) { const t = k / n, px = ax + (bx - ax) * t, pz = az + (bz - az) * t; if (I.roadAt(px, pz)) continue; b.m = 1; b.box(px, Hs(px, pz) - .2, pz, .22, 1.3, .22, '#8a6a46'); const qx = ax + (bx - ax) * (t + .5 / n), qz = az + (bz - az) * (t + .5 / n); if (!I.roadAt(qx, qz)) b.box(qx, Hs(qx, qz) + .7, qz, .12, .14, L / n, '#9a7a52', ang); b.m = 0; } } }
      /* --- 樹林、松樹、椰子樹、岩石群 --- */
      for (const [gx, gz, gr, gn, kind] of D.groves || []) { const x0 = s(gx), z0 = s(gz), R0 = s(gr);
        for (let i = 0, tries = 0; i < gn && tries < gn * 6; tries++) { const a = rn() * 6.283, dd = Math.sqrt(rn()) * R0, x = x0 + Math.cos(a) * dd, z = z0 + Math.sin(a) * dd, y = Hs(x, z); if (y < 1.4 || I.waterAt(x, z) || I.roadAt(x, z) || !free(x, z, 1.6)) continue;
          if (kind === 'pine' || (kind !== 'tree' && y > 34 * (D.vScale || .5) * SC / 2 && rn() < .6)) P.pine(b, x, y, z, 1 + rn() * .7, mix('#2f6b3c', '#3f7a44', rn())); else P.tree(b, x, y, z, .9 + rn() * .9, r, mix('#4f9a3c', '#77b84e', rn()));
          O.push([x, z, 1.1]); fp(x, z, 1.4); i++; } }
      for (const [gx, gz, gr, gn] of D.palms || []) { const x0 = s(gx), z0 = s(gz), R0 = s(gr);
        for (let i = 0, tries = 0; i < gn && tries < gn * 8; tries++) { const a = rn() * 6.283, dd = Math.sqrt(rn()) * R0, x = x0 + Math.cos(a) * dd, z = z0 + Math.sin(a) * dd, y = Hs(x, z); if (y < .7 || y > 4 || I.roadAt(x, z) || !free(x, z, 1.4)) continue; P.palm(b, x, y, z, .95 + rn() * .4, r); O.push([x, z, .8]); fp(x, z, 1.2); i++; } }
      for (const [gx, gz, gr, gn] of D.rocks || []) { const x0 = s(gx), z0 = s(gz), R0 = s(gr);
        for (let i = 0; i < gn; i++) { const a = rn() * 6.283, dd = Math.sqrt(rn()) * R0, x = x0 + Math.cos(a) * dd, z = z0 + Math.sin(a) * dd, y = Hs(x, z); if (y < -1 || I.roadAt(x, z) || !free(x, z, 1)) continue; const sz = .8 + rn() * 2.6; P.rock(b, x, y - sz * .3, z, sz, r, mix('#8a8680', '#a8a296', rn())); if (sz > 1.6) O.push([x, z, sz * .8]); } }
      tk('nature');
      /* --- 地形網格（分塊、海面下不建、手機較粗）＋河與湖的水面 --- */
      /* 有鋪石道路的區塊用細網格（石板紋理需要），其他區塊用粗網格，邊緣加裙邊避免接縫裂縫 */
      const TILE = 128, RF = hd ? (MOB ? 2 : 1.34) : 3.2, RC = hd ? (MOB ? 3.2 : 2.67) : 4.3;
      const fineTile = (tx, tz) => { if (river.some(R => R.P.some(([x, z]) => x > tx - 8 && x < tx + TILE + 8 && z > tz - 8 && z < tz + TILE + 8))) return true; for (let z = tz; z <= tz + TILE; z += 3) for (let x = tx; x <= tx + TILE; x += 3) { const rc = I.roadAt(x, z); if (rc && PAVED[Object.keys(RW)[rc - 1]]) return true; } return false; };
      const slope = (x, z) => Math.abs(Hs(x + 1, z) - Hs(x - 1, z)) + Math.abs(Hs(x, z + 1) - Hs(x, z - 1));
      const col = (x, y, z) => { const n = vn(x * .08, z * .08), n2 = vn(x * .5, z * .5), rc = I.roadAt(x, z);
        if (rc) { const kind = Object.keys(RW)[rc - 1], base = RCOL[kind]; if (PAVED[kind]) { const bx = Math.floor(x * 1.4 + Math.floor(z * 2.2) * .5), bz = Math.floor(z * 2.2); return mix(base, '#9c9488', vh(bx, bz) * .35); } return mix(base, '#8e7a58', n2 * .3); }
        if (I.waterAt(x, z)) return mix('#6a8a8a', '#57707a', n2);
        if (y < 1.25) return mix('#e8d6a6', '#f1e2b8', n2);
        const sl = slope(x, z); if (sl > 2.6) return mix('#8f877c', '#a39a8c', n2);
        const g = mix(D.grass || '#6faa4a', D.grass2 || '#8cc456', n * .9 + n2 * .1); return y > 30 ? mix(g, '#7a9a5a', Math.min(1, (y - 30) / 30)) : g; };
      for (let tz = -ext; tz < ext; tz += TILE) for (let tx = -ext; tx < ext; tx += TILE) {
        let any = false; for (let z = tz; z <= tz + TILE && !any; z += 8) for (let x = tx; x <= tx + TILE; x += 8) if (Hs(x, z) > -2.5) { any = true; break; } if (!any) continue;
        const res = fineTile(tx, tz) ? RF : RC, nr = Math.round(TILE / res), st = TILE / nr, start = b.p.length / 3, V = [];
        for (let j = 0; j <= nr; j++) { const row = []; for (let i = 0; i <= nr; i++) { const wx = tx + i * st, wz = tz + j * st, wy = Hs(wx, wz); row.push([[wx, wy, wz], hex(col(wx, wy, wz))]); } V.push(row); }
        for (let j = 0; j < nr; j++) for (let i = 0; i < nr; i++) { const a = V[j][i], bb = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i]; if (a[0][1] < -3.5 && bb[0][1] < -3.5 && c[0][1] < -3.5 && d[0][1] < -3.5) continue; b.triV(a[0], c[0], bb[0], a[1], c[1], bb[1]); b.triV(a[0], d[0], c[0], a[1], d[1], c[1]); }
        const skirt = (A, B) => { if (A[0][1] < -3.5 && B[0][1] < -3.5) return; const a2 = [A[0][0], A[0][1] - 1.6, A[0][2]], b2 = [B[0][0], B[0][1] - 1.6, B[0][2]]; b.triV(A[0], b2, B[0], A[1], B[1], B[1]); b.triV(A[0], a2, b2, A[1], A[1], B[1]); b.triV(A[0], B[0], b2, A[1], B[1], B[1]); b.triV(A[0], b2, a2, A[1], B[1], A[1]); };
        for (let i = 0; i < nr; i++) { skirt(V[0][i], V[0][i + 1]); skirt(V[nr][i], V[nr][i + 1]); skirt(V[i][0], V[i + 1][0]); skirt(V[i][nr], V[i + 1][nr]); }
        b.smooth.push([start, b.p.length / 3]); }
      for (const R of river) for (let k = 0; k < R.P.length - 1; k++) { const [ax, az] = R.P[k], [bx, bz] = R.P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L * R.w / 2, nz = (bx - ax) / L * R.w / 2, ya = R.hs[k] - .55, yb = R.hs[k + 1] - .55;
        b.m = 7; b.quad([ax - nx, ya, az - nz], [ax + nx, ya, az + nz], [bx + nx, yb, bz + nz], [bx - nx, yb, bz - nz], mix('#4aa0c8', '#62b8d8', vh(k, 1))); b.m = 0; }
      for (const L of lakes) { const n = 40; b.m = 7; for (let k = 0; k < n; k++) { const a0 = k / n * 6.283, a1 = (k + 1) / n * 6.283; b.tri([L.x, L.y - .4, L.z], [L.x + Math.cos(a1) * L.rx, L.y - .4, L.z + Math.sin(a1) * L.rz], [L.x + Math.cos(a0) * L.rx, L.y - .4, L.z + Math.sin(a0) * L.rz], hex('#4a9cc4')); } b.m = 0; }
      if (D.after) D.after(I, { b, Hs, house, O, ST, P, K, fp, s, sp, hd, r: rn });
      tk('terrain'); I.tstat = TS; I.houses = houses.length;
    };
    /* 劇情資料對到新地圖 */
    I.apply = ch => { if (!ch || ch.__isle2) return; ch.__isle2 = true; const M = D.story || {};
      if (M.spawn) { ch.spawn = sp(M.spawn); } if (M.boss) ch.bossPos = sp(M.boss);
      ch.layout = Object.assign({}, ch.layout || {}, { spawn: ch.spawn, boss: ch.bossPos, lobes: [], spots: (M.spots || []).map(sp), path: (M.route || []).map(sp) });
      (ch.npcs || []).forEach(n => { if (M.npcs && M.npcs[n.id]) n.pos = sp(M.npcs[n.id]); });
      (ch.steps || []).forEach((st, k) => { const m = M.steps && M.steps[k]; if (!m) return; ['points', 'spots'].forEach(f => { if (m[f]) st[f] = m[f].map(sp); }); ['pos', 'goal', 'to', 'area', 'start'].forEach(f => { if (m[f]) st[f] = sp(m[f]); }); if (m.r) st.r = m.r; if (m.radius) st.radius = s(m.radius); if (m.guards && st.guards) st.guards.forEach((g, i) => { if (m.guards[i]) g.path = m.guards[i].map(sp); }); });
      if (M.env) Object.assign(ch.env, M.env); };
    return I;
  }
  ISLE2.parts = ISLE2.parts || {};
  ISLE2.define = (id, D) => { const I = Island(id, D); ISLE2[id] = I; const ch = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === id); if (ch) I.apply(ch); return I; };
  ISLE2.util = { spline, polyD, vn, vh, fbm, sm, pip };
})(typeof window !== 'undefined' ? window : globalThis);
