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
    const I = { id, ext, SC, D };
    let Hg = null, Rg = null, Bg = null, river = [], lakes = [], roads = [], houses = [], occ = [];
    const idx = (x, z) => { const i = Math.round((x + ext) / G), j = Math.round((z + ext) / G); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
    const Hs = (x, z) => { const fx = (x + ext) / G, fz = (z + ext) / G; if (fx < 0 || fz < 0 || fx >= N - 1 || fz >= N - 1) return -4; const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j, k = j * N + i;
      return (Hg[k] * (1 - u) + Hg[k + 1] * u) * (1 - w) + (Hg[k + N] * (1 - u) + Hg[k + N + 1] * u) * w; };
    I.H = Hs;
    /* 原始地形（還沒整平道路） */
    /* v151 D.post2(h,dx,dz)：最後的高度（世界單位）再調整一次，海裡也會套用（司法島四周的大洞） */
    function raw(x, z) { const v = raw0(x, z); return D.post2 ? D.post2(v, x / SC, z / SC) : v; }
    function raw0(x, z) {
      const dx = x / SC, dz = z / SC; let land = -1e9;
      if (D.rawFn) { const v = D.rawFn(dx, dz, { fbm, sm, pip, polyD, s }); if (v !== undefined) return v; }
      for (const [bx, bz, r, j] of D.land) { const a = Math.atan2(dz - bz, dx - bx), rr = r * (1 + (j || .12) * (Math.sin(3 * a + bx * .1) + .6 * Math.sin(7 * a + bz * .07) + .3 * Math.sin(11 * a))); land = Math.max(land, (rr - Math.hypot(dx - bx, dz - bz)) / 12); }
      for (const [bx, bz, k, off] of D.bays || []) land = Math.min(land, Math.hypot(dx - bx, dz - bz) / k - off);
      land += fbm(dx * .03, dz * .03) * 1.2;
      const mask = Math.max(0, Math.min(1, land)); if (mask <= 0) return -4 + Math.max(-6, land);
      let h = D.base || 0;
      for (const t of D.terrain || []) {
        if (t.ramp) { const [x0, z0, x1, z1, h0, h1] = t.ramp, vx = x1 - x0, vz = z1 - z0, tt = Math.max(0, Math.min(1, ((dx - x0) * vx + (dz - z0) * vz) / (vx * vx + vz * vz))); h += h0 + (h1 - h0) * tt; }
        else if (t.g) { const [gx, gz, r, gh] = t.g; h += gh * Math.exp(-((dx - gx) ** 2 + (dz - gz) ** 2) / (2 * r * r)); }
        else if (t.plateau) { const [gx, gz, r, gh, e] = t.plateau, v = gh * (1 - sm(r, r + (e || 4), Math.hypot(dx - gx, dz - gz))); h = t.max ? Math.max(h, v) : h + v; }
        else if (t.ring) { const [gx, gz, r0, r1, gh, e] = t.ring, d0 = Math.hypot(dx - gx, dz - gz), v = gh * (1 - sm(r1, r1 + (e || 3), d0)) * sm(r0 - (e || 3), r0, d0); h = t.max ? Math.max(h, v) : h + v; }
        else if (t.poly) { const [P, gh, e] = t.poly, dd = pip(dx, dz, P) ? 0 : polyD(dx, dz, P.concat([P[0]])), v = gh * (1 - sm(0, e || 4, dd)); h = t.max ? Math.max(h, v) : h + v; }
        else if (t.fn) h += t.fn(dx, dz, sm);
        else if (t.dunes) { const [amp, fq] = t.dunes; h += amp * Math.abs(Math.sin(dx * fq + fbm(dx * .02, dz * .02) * 6 + dz * fq * .4)); }
      }
      h += fbm(dx * .045 + 3, dz * .045 + 5) * (D.rough || 4);
      if (D.post) h = D.post(h, dx, dz, sm);
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
        /* 坡度限制：一邊往下挖、一邊往上填，取平均，讓上台地的路變成可以走的坡道 */
        { const lim = .8, cut = hs.slice(), fill = hs.slice(); for (let k = 1; k < cut.length; k++) { cut[k] = Math.min(cut[k], cut[k - 1] + lim); fill[k] = Math.max(fill[k], fill[k - 1] - lim); }
          for (let k = cut.length - 2; k >= 0; k--) { cut[k] = Math.min(cut[k], cut[k + 1] + lim); fill[k] = Math.max(fill[k], fill[k + 1] - lim); } hs = hs.map((v, k) => (cut[k] + fill[k]) / 2); }
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
    /* v154 浮空島：海面用的高度（浮在空中的島，底下仍是海） */
    I.Hw = (x, z) => { const h = Hs(x, z); return D.waterH ? D.waterH(h, x / SC, z / SC) : h; };
    I.roadDist = (x, z) => { let d = 1e9; for (const R of roads) for (let k = 0; k < R.P.length - 1; k += 2) d = Math.min(d, Math.hypot(x - R.P[k][0], z - R.P[k][1]) - R.w / 2); return d; };

    /* ---------- 建模 ---------- */
    I.build = (b, H, r, O, Dd, api) => {
      const { P, K, ST, CHIMNEYS } = api, hd = !!global.E3_HD, MB = api.mist || b;
      const fp = (x, z, rad) => { occ.push([x, z, rad]); };
      occ.length = 0; houses.length = 0;
      /* v148 極致畫質：大量的小細節（石板路的每一顆石頭、屋瓦、地基石、草叢、花、小石頭、灌木）用「實例」交給渲染器，依距離顯示；地形改用更細的共用頂點網格 */
      const UL = !!(global.E3_ULTRA && hd), UD = {}, put = (k, x, y, z, ry, sx, sy, sz, c, rx) => { const a = UD[k] || (UD[k] = []); c = typeof c === 'string' ? hex(c) : c; a.push(x, y, z, ry, rx || 0, sx, sy, sz, c[0], c[1], c[2]); };
      let us = 9173; const ur = () => (us = us * 16807 % 2147483647) / 2147483647;
      const shrub = (px, py, pz, sz, base) => { const B = hex(base || mix('#4a8f38', '#6aac46', ur())); for (let q = 0; q < 3; q++) { const a3 = ur() * 6.283, d3 = sz * (.25 + ur() * .35), k = .86 + ur() * .22, r3 = sz * (.55 + ur() * .35); put('bush', px + Math.cos(a3) * d3, py - r3 * .25, pz + Math.sin(a3) * d3, ur() * 6, r3 * 1.6, r3 * 1.25, r3 * 1.6, [B[0] * k, B[1] * k, B[2] * k]); } };
      /* 劇情要用到的位置（登陸點、BOSS、NPC、敵人、任務點）先保留，房子和樹不會蓋在上面 */
      { const M = D.story || {}, keep = (p, rad) => p && occ.push([s(p[0]), s(p[1]), rad]); keep(M.spawn, 10); keep(M.boss, 14); Object.values(M.npcs || {}).forEach(p => keep(p, 4.5)); (M.spots || []).forEach(p => keep(p, 6));
        Object.values(M.steps || {}).forEach(m => { (m.points || []).concat(m.spots || []).forEach(p => keep(p, 4)); ['pos', 'goal', 'to', 'start'].forEach(f => keep(m[f], 5)); }); }
      const free = (x, z, rad) => !occ.some(o => Math.hypot(x - o[0], z - o[1]) < o[2] + rad) && I.roadDist(x, z) > rad - .5 && !river.some(R => polyD(x, z, R.P) < R.w / 2 + rad + 2) && !lakes.some(L => Math.hypot((x - L.x) * L.rz / L.rx, z - L.z) < L.rz + rad + 2);
      /* --- 房屋（1～3 層、木骨架、窗框百葉窗、陽台、花箱、門階、瓦屋頂、煙囪、招牌） --- */
      const ROOFS = D.roofs || ['#b5463a', '#3f6fa8', '#5b8a4a', '#c27a34', '#8a4a6a'], WALLS = D.wallCols || ['#f2e6cc', '#efe0c0', '#f6eedb', '#e8d6b4', '#f0e2d0'];
      /* 房屋風格：每座島（或每個城鎮）用自己的建築風格 */
      const SY = {
        euro: { walls: WALLS, roofs: ROOFS, beam: '#5e3e2a', roof: 'gable', shut: 1, flow: 1, glass: '#2c3e58', chim: 1 },
        desert: { walls: ['#ead2a4', '#e4c896', '#f0dcb4', '#dcc08c', '#e8cfa0'], roofs: ['#d2ae78'], beam: null, roof: 'flat', shut: 0, flow: 0, glass: '#3a2a1e', chim: 0, awn: ['#c8322b', '#2c6ab0', '#3a8a5a', '#d8a03a', '#8a4a9a'], dome: ['#f0e6d0', '#3a8ab0', '#d8a03a'] },
        white: { walls: ['#ffffff', '#f4f6fa', '#eef2f8'], roofs: ['#5a9ad8', '#7ab0e0', '#e8b84a', '#9ad0f0'], beam: null, roof: 'dome', shut: 1, flow: 1, glass: '#3a5a8a', chim: 0 },
        japan: { walls: ['#f2e8d4', '#efe2c8', '#e8dcc4'], roofs: ['#3a3e48', '#4a4e58', '#5a3a2a'], beam: '#3a2a1e', roof: 'hip', shut: 0, flow: 0, glass: '#f4e8c8', chim: 0, skirt: 1, lantern: 1 },
        stone: { walls: ['#c8c4bc', '#bcb8b0', '#d4d0c8'], roofs: ['#4a5a6e', '#5a6878', '#6a5a4e'], beam: null, roof: 'gable', shut: 1, flow: 0, glass: '#2c3e58', chim: 1 },
        marine: { walls: ['#f4f6f8', '#e8ecf0'], roofs: ['#2a4a8a', '#3a5a9a'], beam: null, roof: 'hip', shut: 1, flow: 0, glass: '#2c3e58', chim: 0 },
        spooky: { walls: ['#6a6470', '#5a5662', '#74687a', '#625a52'], roofs: ['#3a2e44', '#2e2a36', '#4a3a52'], beam: '#2a2228', roof: 'gable', shut: 1, flow: 0, glass: '#ffcf6a', chim: 1, jit: .18 },
        coral: { walls: ['#f4a8b8', '#f8c890', '#a8d8e8', '#c8b0e8', '#f0e0a0'], roofs: ['#e86a8a', '#ff9a6a', '#5ab0d8', '#9a7ad8'], beam: null, roof: 'dome', shut: 0, flow: 0, glass: '#2a5a7a', chim: 0 },
        candy: { walls: ['#ffe0ec', '#e8f4ff', '#fff4c8', '#e0ffe8', '#f4e0ff'], roofs: ['#ff7aa8', '#8ac8ff', '#ffc85a', '#9ae0a0', '#c89aff'], beam: '#ffffff', roof: 'gable', shut: 1, flow: 1, glass: '#6a3a5a', chim: 0 },
        toy: { walls: ['#fff4e0', '#ffe8c8', '#f8f0e8', '#ffe0d0', '#f4e4f0'], roofs: ['#d8643a', '#c8542e', '#e07a40'], beam: null, roof: 'hip', shut: 1, flow: 1, glass: '#2c3e58', chim: 0 },
        wood: { walls: ['#a07a52', '#8e6a46', '#b08a5e'], roofs: ['#a8875a', '#94744a', '#6e5a3e'], beam: '#4a3220', roof: 'gable', shut: 0, flow: 0, glass: '#2a2018', chim: 1 },
        future: { walls: ['#f4f6fa', '#e8eef6', '#fff0f6'], roofs: ['#ff6aa8', '#6ad0ff', '#ffd24a'], beam: null, roof: 'flat', shut: 0, flow: 0, glass: '#5ad0ff', chim: 0 },
        pirate: { walls: ['#8a7a66', '#7a6a58', '#9a8670', '#6e6052'], roofs: ['#4a3a30', '#5a4232', '#3a3a3e'], beam: '#3a2a1e', roof: 'gable', shut: 1, flow: 0, glass: '#ffb24a', chim: 1, jit: .12 },
        norse: { walls: ['#8e6a46', '#7a5a3a', '#9a7650', '#6e5236'], roofs: ['#5e8a3a', '#6a9a48', '#557e36', '#6e5a3e', '#5a4a3a', '#5a6068'], beam: '#3e2a1a', roof: 'gable', shut: 0, flow: 0, glass: '#ffcf6a', chim: 1, norse: 1, arch: ['longhouse', 'logcabin', 'watchtower', 'stonebase', 'stump', 'workshop'] }
      };
      /* v151 每種風格的屋型（town 會輪流隨機挑，同一側相鄰兩棟不重複）：base 基本、wing 側屋、porch 門廊、dormer 老虎窗、shop 店面、jetty 上層外凸、setback 上層內縮、tower 角樓 */
      const ARCH = { euro: ['base', 'wing', 'porch', 'dormer', 'shop', 'jetty', 'tower'], pirate: ['base', 'wing', 'porch', 'dormer', 'jetty', 'tower', 'shop'], stone: ['base', 'wing', 'tower', 'dormer', 'setback', 'shop'],
        spooky: ['base', 'tower', 'dormer', 'jetty', 'wing'], wood: ['base', 'wing', 'porch', 'dormer'], marine: ['base', 'wing', 'setback', 'tower', 'porch'], toy: ['base', 'tower', 'porch', 'shop', 'dormer', 'wing'],
        candy: ['base', 'tower', 'porch', 'dormer', 'wing', 'shop'], japan: ['base', 'wing', 'setback', 'porch', 'shop'], desert: ['base', 'wing', 'tower', 'setback', 'shop'], white: ['base', 'wing', 'setback', 'porch'],
        coral: ['base', 'wing', 'setback', 'tower'], future: ['base', 'wing', 'setback', 'tower'] };
      Object.keys(SY).forEach(k => { if (!SY[k].arch) SY[k].arch = ARCH[k] || ['base', 'wing', 'porch', 'tower']; });
      const pick = (A, x, z, m) => A[Math.abs(Math.round(x * (m || 3) + z * 7)) % A.length];
      function house(x, z, w, d, fl, ry, o) {
        o = o || {}; const S0 = SY[o.style || D.style || 'euro'] || SY.euro, K = o.k || 1; b.noBot = true; if (S0.jit && !o.exact) ry += (vh(x, z) - .5) * S0.jit;
        const y = o.y != null ? o.y : Hs(x, z), c = Math.cos(ry), sn = Math.sin(ry), L = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c], FH = 3.1 * K, h = fl * FH;
        const wall = o.wall || pick(S0.walls, x, z), roof = o.roof || pick(S0.roofs, z, x), beam = o.beam !== undefined ? o.beam : S0.beam, shut = ['#3f72b8', '#5a8a4a', '#b5543c', '#d8a03a', '#7a5aa0'][Math.abs(Math.round(x + z * 5)) % 5], glass = o.glass || S0.glass, fr = beam || shade(wall, .72);
        let A = o.arch || 'base', WG = null;
        if (S0.norse && !o.wing) return norse(x, z, w, d, fl, ry, o, A, S0, K, y, L, wall, roof);
        if ((A === 'jetty' || A === 'setback') && fl < 2) A = 'porch';
        if (A === 'wing') { const ww = w * .5, dw = d * .72, sw = vh(x, z) < .5 ? -1 : 1, [wx, wz] = L(sw * (w / 2 + ww / 2 - .05), -(d - dw) / 2); if (free(wx, wz, Math.max(ww, dw) / 2)) WG = { wx, wz, ww, dw }; else A = 'porch'; }
        if (o.y == null) flatPad(x, z, w + .6, d + .6, ry, y);
        b.m = 3; b.box(x, y - 1.2, z, w + .5, 1.5, d + .5, S0.roof === 'flat' ? shade(wall, .8) : '#a99d90', ry);
        const w0 = w, d0 = d;
        for (let f = 0; f < fl; f++) { const y0 = y + .3 + f * FH; { const sc = f && A === 'setback' ? Math.pow(.84, f) : f && A === 'jetty' ? 1.08 : 1; w = w0 * sc; d = d0 * sc; }
          b.m = 4; b.box(x, y0, z, w, FH - .05, d, f === 0 && o.wall0 ? o.wall0 : wall, ry); b.m = 1;
          if (f && A === 'jetty' && hd) for (let q = -2; q <= 2; q++) { const [jx, jz] = L(q * w0 / 4.4, d0 / 2 + .02); b.box(jx, y0 - .45, jz, .22 * K, .45, .5, fr, ry); }
          if (beam) { [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, e]) => { const [px, pz] = L(a * w / 2, e * d / 2); b.box(px, y0 - .05, pz, .3 * K, FH + .05, .3 * K, beam, ry); }); b.box(x, y0 + FH - .2 * K, z, w + .14, .24 * K, d + .14, beam, ry); }
          else if (f > 0) { b.m = 4; b.box(x, y0 - .12, z, w + .2, .22, d + .2, shade(wall, .86), ry); }
          if (S0.skirt && f < fl - 1) { b.m = 2; b.box(x, y0 + FH - .3, z, w + 1.8, .22, d + 1.8, shade(roof, .9), ry, .82); }
          if (hd) { const nW = Math.max(1, Math.floor(w / (2.6 * K))), ww = 1.05 * K, wh = 1.2 * K;
            for (const side of [1, -1]) for (let k = 0; k < nW; k++) { const lx = (k - (nW - 1) / 2) * (w / nW); if (f === 0 && side === 1 && (Math.abs(lx) < 1.1 * K || A === 'shop')) continue;
              const [ax, az] = L(lx, side * (d / 2 + .05)), wy = y0 + FH * .32; b.m = 1; b.box(ax, wy, az, ww, wh, .14, fr, ry); const [gx, gz] = L(lx, side * (d / 2 + .1)); b.m = 0; b.box(gx, wy + .14 * K, gz, ww * .7, wh * .77, .08, glass, ry); b.m = 1;
              if (S0.shut) { const [s1x, s1z] = L(lx - .72 * K, side * (d / 2 + .09)), [s2x, s2z] = L(lx + .72 * K, side * (d / 2 + .09)); b.box(s1x, wy, s1z, .38 * K, wh, .07, shut, ry); b.box(s2x, wy, s2z, .38 * K, wh, .07, shut, ry); }
              if (S0.flow && (k + f) % 2 === 0) { const [fx, fz] = L(lx, side * (d / 2 + .3)); b.box(fx, wy - .3, fz, 1.1 * K, .26, .32, '#8a5a38', ry); b.m = 0; const [qx, qz] = L(lx, side * (d / 2 + .32)); b.box(qx, wy - .08, qz, .96 * K, .22, .26, ['#ff6a8a', '#ffd34a', '#ff9a4a', '#f4f0ff'][Math.abs(Math.round(x * 5 + k + f)) % 4], ry); b.m = 1; } }
            const nS = Math.max(1, Math.floor(d / (3 * K))); for (const side of [1, -1]) for (let k = 0; k < nS; k++) { const lz = (k - (nS - 1) / 2) * (d / nS), [ax, az] = L(side * (w / 2 + .05), lz), wy = y0 + FH * .32; b.box(ax, wy, az, .14, 1.15 * K, ww, fr, ry); const [gx, gz] = L(side * (w / 2 + .1), lz); b.m = 0; b.box(gx, wy + .12 * K, gz, .08, .86 * K, ww * .68, glass, ry); b.m = 1; }
            if (f > 0 && (o.balcony || (Math.abs(Math.round(x + z)) % 3 === 0)) && S0.roof !== 'dome') { const bc = beam || shade(wall, .7), [bx, bz] = L(0, d / 2 + .7); b.box(bx, y0 - .12, bz, w * .5, .2, 1.4, bc, ry); for (let q = 0; q <= 4; q++) { const [px, pz] = L(-w * .25 + q * w * .125, d / 2 + 1.32); b.box(px, y0 + .08, pz, .1, .9, .1, bc, ry); } const [hx, hz] = L(0, d / 2 + 1.32); b.box(hx, y0 + .95, hz, w * .5, .1, .12, bc, ry); } } }
        const wT = w, dT = d; w = w0; d = d0;
        /* 門、門框、石階、門燈 */
        if (!o.noDoor) { const [fx, fz] = L(0, d / 2 + .08); b.box(fx, y + .2, fz, 1.6 * K, 2.5 * K, .2, fr, ry); const [ex, ez] = L(0, d / 2 + .16); b.box(ex, y + .25, ez, 1.12 * K, 2.2 * K, .1, o.door || (S0.roof === 'flat' ? '#6a4a2e' : '#7a4a2a'), ry); b.m = 3; const [gx, gz] = L(0, d / 2 + .7); b.box(gx, y - .45, gz, 2.1 * K, .5, 1.1, '#b4a898', ry); b.m = 1;
          if (S0.awn) { const [ax, az] = L(0, d / 2 + .9); b.m = 0; b.box(ax, y + 2.6 * K, az, 2.8 * K, .12, 1.8, pick(S0.awn, x, z, 5), ry, .85); b.m = 1; }
          if (S0.lantern) { const [lx, lz] = L(1.3 * K, d / 2 + .5); b.m = 0; b.sphere(lx, y + 2.3 * K, lz, .32 * K, 6, '#e8402e', 1.2); b.m = 1; }
          else if (hd) { const [lx, lz] = L(1.1 * K, d / 2 + .25); b.m = 0; b.box(lx, y + 2.1 * K, lz, .22, .34, .22, '#ffd27a', ry); b.m = 1; } }
        if (A === 'shop' && !o.noDoor) { /* 店面：門兩側的大櫥窗＋遮雨棚 */ for (const sx of [-1, 1]) { const [gx, gz] = L(sx * w * .29, d / 2 + .1); b.m = 1; b.box(gx, y + .6, gz, w * .3, 1.9 * K, .16, fr, ry); b.m = 0; const [hx, hz] = L(sx * w * .29, d / 2 + .17); b.box(hx, y + .75, hz, w * .26, 1.6 * K, .1, glass, ry); b.m = 1; }
          const [ax, az] = L(0, d / 2 + .9); b.m = 0; b.box(ax, y + 2.7 * K, az, w * .92, .14, 1.6, pick(S0.awn || ['#c8322b', '#2c6ab0', '#3a8a5a', '#d8a03a'], x, z, 5), ry, .85); b.m = 1; if (!o.sign) o.sign = pick(['#c8322b', '#2c6ab0', '#d8a03a', '#3a8a5a'], z, x); }
        if (hd && !o.noDoor && vh(x + 1, z) < .65) { /* 門邊的小東西：木桶、木箱、花盆、柴堆 */ const sx = vh(z, x + 2) < .5 ? -1 : 1, [qx, qz] = L(sx * (w / 2 - .7 * K), d / 2 + .75 * K), kind = Math.floor(vh(x + 3, z + 1) * 4); b.m = 1;
          if (kind === 0) { b.cyl(qx, y - .1, qz, .42 * K, .38 * K, 1 * K, 8, '#8a5a34', '#7a4e2c'); b.box(qx, y + .35 * K, qz, .9 * K, .08, .9 * K, '#5a5650', ry); }
          else if (kind === 1) { b.box(qx, y - .1, qz, .9 * K, .85 * K, .9 * K, '#a8875a', ry + .3); b.box(qx + .3, y + .75 * K, qz - .2, .6 * K, .55 * K, .6 * K, '#9a7a4e', ry - .2); }
          else if (kind === 2) { b.cyl(qx, y - .1, qz, .38 * K, .48 * K, .7 * K, 8, '#b5643c'); b.m = 0; b.sphere(qx, y + .75 * K, qz, .5 * K, 6, pick(['#e85a8a', '#f4c43a', '#8a5ad8', '#ff8a4a'], x, z), .8); }
          else { for (let q = 0; q < 3; q++) b.box(qx, y - .1 + q * .34 * K, qz, 1.4 * K - q * .2, .32 * K, .7 * K, shade('#8a6440', .9 + q * .07), ry); } b.m = 0; }
        if (o.sign) { const [sx, sz] = L(w / 2 + .3, d / 2 - .6); b.box(sx, y + 2.6 * K, sz, .1, .1, 1.4, fr, ry); const [tx, tz] = L(w / 2 + .3, d / 2 - .9); b.m = 0; b.box(tx, y + 1.9 * K, tz, .12, .8, 1.2, o.sign, ry); b.m = 1; }
        /* 屋頂 */
        /* v149 屋頂：真正的斜面（有厚度、屋簷、山牆三角、博風板、屋脊），不再是一階一階的方塊；瓦片沿著斜面一排排鋪 */
        const P3 = (lx, yy, lz) => { const [px, pz] = L(lx, lz); return [px, yy, pz]; }, ctr = [x, 0, z];
        const face = (a, bb, c, dd, col, out) => { const n = [(bb[1] - a[1]) * (c[2] - a[2]) - (bb[2] - a[2]) * (c[1] - a[1]), (bb[2] - a[2]) * (c[0] - a[0]) - (bb[0] - a[0]) * (c[2] - a[2]), (bb[0] - a[0]) * (c[1] - a[1]) - (bb[1] - a[1]) * (c[0] - a[0])];
          if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) { if (dd) b.quad(a, dd, c, bb, col); else b.tri(a, c, bb, col); } else { if (dd) b.quad(a, bb, c, dd, col); else b.tri(a, bb, c, col); } };
        const outOf = (...pts) => { let mx = 0, my = 0, mz = 0; pts.forEach(p => { mx += p[0]; my += p[1]; mz += p[2]; }); const k = pts.length; return [mx / k - ctr[0], .0001, mz / k - ctr[2]]; };
        /* 一片有厚度的斜面：e0,e1 簷口，r0,r1 屋脊（r0===r1 時是三角形），條紋表現瓦片的層次 */
        const slab = (e0, e1, r0, r1, rc) => { const nS = hd ? 6 : 3, th = .26, lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
          for (let i = 0; i < nS; i++) { const t0 = i / nS, t1 = (i + 1) / nS, a = lerp(e0, r0, t0), bb = lerp(e1, r1, t0), c = lerp(e1, r1, t1), dd = lerp(e0, r0, t1), col = shade(rc, (i % 2 ? .93 : 1.02) * (.97 + vh(x + i, z) * .06));
            face(a, bb, c, dd, col, [0, 1, 0]); }
          const dn = p => [p[0], p[1] - th, p[2]], u0 = dn(e0), u1 = dn(e1), v0 = dn(r0), v1 = dn(r1); face(u0, u1, v1, v0, shade(rc, .55), [0, -1, 0]);
          const C0 = [(e0[0] + e1[0] + r0[0] + r1[0]) / 4, 0, (e0[2] + e1[2] + r0[2] + r1[2]) / 4], ow = (p, q) => [(p[0] + q[0]) / 2 - C0[0], .0001, (p[2] + q[2]) / 2 - C0[2]];
          face(e0, e1, u1, u0, shade(rc, .7), ow(e0, e1)); face(e0, r0, v0, u0, shade(rc, .72), ow(e0, r0)); if (r0 !== r1 || e1 !== r1) face(e1, r1, v1, u1, shade(rc, .72), ow(e1, r1)); };
        /* 極致：沿斜面鋪瓦片（每片會依斜面傾斜） */
        const tiles = (e0, e1, r0, r1, rc) => { if (!UL) return; const C = hex(rc), sl = Math.hypot(r0[0] - e0[0], r0[1] - e0[1], r0[2] - e0[2]), nr = Math.max(2, Math.round(sl / .42));
          for (let i = 0; i < nr; i++) { const t = (i + .5) / nr, A = [e0[0] + (r0[0] - e0[0]) * t, e0[1] + (r0[1] - e0[1]) * t + .08, e0[2] + (r0[2] - e0[2]) * t], B = [e1[0] + (r1[0] - e1[0]) * t, e1[1] + (r1[1] - e1[1]) * t + .08, e1[2] + (r1[2] - e1[2]) * t];
            const len = Math.hypot(B[0] - A[0], B[2] - A[2]); if (len < .3) continue; const dx = (B[0] - A[0]) / len, dz = (B[2] - A[2]) / len, yaw = Math.atan2(-dz, dx), mid = [(e0[0] + e1[0]) / 2 - (r0[0] + r1[0]) / 2, (e0[2] + e1[2]) / 2 - (r0[2] + r1[2]) / 2], hz = Math.hypot(mid[0], mid[1]) || 1,
              pitch = Math.atan2(r0[1] - e0[1], hz * 1), sgn = (mid[0] * Math.sin(yaw) + mid[1] * Math.cos(yaw)) > 0 ? 1 : -1, m = Math.max(1, Math.round(len / .5));
            for (let j = 0; j < m; j++) { const s2 = (j + .5 + (i % 2) * .5) / m; if (s2 > 1) continue; const k = .84 + ur() * .24; put('tile', A[0] + (B[0] - A[0]) * s2, A[1] + (B[1] - A[1]) * s2 - .04, A[2] + (B[2] - A[2]) * s2, yaw, len / m * .94, .1, sl / nr * 1.25, [C[0] * k, C[1] * k, C[2] * k], sgn * (pitch + .06)); } } };
        w = wT; d = dT;
        const top = y + .3 + h, RT = o.roofType || S0.roof; let rtop = top;
        if (RT === 'gable') { b.m = 2; const over = .6, hdz = d / 2 + over, hx = w / 2 + over * .8, rh = Math.min(3.6 * K, d * .55), ye = top - over * rh / (d / 2), yr = top + rh;
          for (const sd of [-1, 1]) { const e0 = P3(-hx, ye, sd * hdz), e1 = P3(hx, ye, sd * hdz), r0 = P3(-hx, yr, 0), r1 = P3(hx, yr, 0); slab(e0, e1, r0, r1, roof); tiles(e0, e1, r0, r1, roof); }
          b.m = 4; for (const sx of [-1, 1]) { const a = P3(sx * w / 2, top, -d / 2), bb = P3(sx * w / 2, top, d / 2), c = P3(sx * w / 2, yr - .1, 0), out = P3(sx * 5, 0, 0); face(a, bb, c, null, shade(wall, .97), [out[0] - x, 0, out[2] - z]);
            if (hd && beam) { b.m = 1; const [mx, mz] = L(sx * (w / 2 + .06), 0); b.box(mx, top, mz, .16, rh * .8, .2, beam, ry); b.m = 4; } }
          b.m = 2; b.box(x, yr - .2, z, (hx + .1) * 2, .32, .46, shade(roof, .62), ry); rtop = yr;
          if (A === 'dormer') { /* 老虎窗：從前面的斜面伸出來的小窗屋 */ const nD = w > 7.5 * K ? 2 : 1, t = .4, lz0 = hdz * (1 - t), ys = ye + (yr - ye) * t, dw2 = 1.5 * K, dh = 1.6 * K, lzf = lz0 + 1.05 * K;
            for (let q = 0; q < nD; q++) { const lx = nD === 1 ? 0 : (q - .5) * w * .46, [cx2, cz2] = L(lx, (lz0 + lzf) / 2 - .4); b.m = 4; b.box(cx2, ys - .6, cz2, dw2, dh + .6, lzf - lz0 + .8, wall, ry);
              const [gx, gz] = L(lx, lzf - .35); b.m = 0; b.box(gx, ys + .05, gz, dw2 * .62, dh * .6, .12, glass, ry); b.m = 2;
              const yt = ys + dh, ytr = yt + .75 * K; for (const sx of [-1, 1]) { const e0 = P3(lx + sx * (dw2 / 2 + .25), yt, lz0 - .6), e1 = P3(lx + sx * (dw2 / 2 + .25), yt, lzf + .2), r0 = P3(lx, ytr, lz0 - .6), r1 = P3(lx, ytr, lzf + .2); slab(e1, e0, r1, r0, roof); }
              b.m = 4; face(P3(lx - dw2 / 2, yt, lzf - .3), P3(lx + dw2 / 2, yt, lzf - .3), P3(lx, ytr - .1, lzf - .3), null, shade(wall, 1), (() => { const [ox, oz] = L(lx, lzf + 5); return [ox - cx2, 0, oz - cz2]; })()); } } }
        else if (RT === 'hip') { b.m = 2; const over = S0.skirt ? 1.1 : .6, ex = w / 2 + over, ez = d / 2 + over, mn = Math.min(ex, ez), rh = Math.min(3.2 * K, Math.min(w, d) * .5), ye = top - .2, yr = top + rh, rx = Math.max(0, ex - ez), rz = Math.max(0, ez - ex);
          const R1 = P3(-rx, yr, -rz), R2 = P3(rx, yr, rz), E = [P3(-ex, ye, ez), P3(ex, ye, ez), P3(ex, ye, -ez), P3(-ex, ye, -ez)], Rf = rx ? [R1, R2] : [P3(0, yr, -rz), P3(0, yr, rz)];
          /* 四面：前後（梯形或三角）、左右 */
          const F = rx ? [[E[0], E[1], P3(rx, yr, 0), P3(-rx, yr, 0)], [E[2], E[3], P3(-rx, yr, 0), P3(rx, yr, 0)], [E[1], E[2], P3(rx, yr, 0), P3(rx, yr, 0)], [E[3], E[0], P3(-rx, yr, 0), P3(-rx, yr, 0)]]
            : [[E[0], E[1], P3(0, yr, rz), P3(0, yr, rz)], [E[2], E[3], P3(0, yr, -rz), P3(0, yr, -rz)], [E[1], E[2], P3(0, yr, -rz), P3(0, yr, rz)], [E[3], E[0], P3(0, yr, rz), P3(0, yr, -rz)]];
          for (const [e0, e1, r1, r0] of F) { slab(e0, e1, r0, r1, roof); tiles(e0, e1, r0, r1, roof); }
          if (S0.skirt) { /* 和式：屋簷往外再翹出去一圈 */ const fx = ex + 1, fz = ez + 1, yf = ye - .45, G = [P3(-fx, yf, fz), P3(fx, yf, fz), P3(fx, yf, -fz), P3(-fx, yf, -fz)];
            for (let i = 0; i < 4; i++) { const e0 = G[i], e1 = G[(i + 1) % 4], r0 = E[i], r1 = E[(i + 1) % 4]; slab(e0, e1, r0, r1, shade(roof, .92)); }
            b.box(x, yr - .25, z, rx ? (rx + .4) * 2 : .7, .5, rz ? (rz + .4) * 2 : .7, shade(roof, .6), ry); }
          else b.box(x, yr - .18, z, rx ? (rx + .25) * 2 : .5, .3, rz ? (rz + .25) * 2 : .5, shade(roof, .68), ry);
          b.m = 4; b.box(x, top - .3, z, w + .1, .35, d + .1, shade(wall, .85), ry); b.m = 2; rtop = yr; }
        else if (RT === 'dome') { b.m = 4; b.box(x, top - .05, z, w + .3, .3, d + .3, shade(wall, .9), ry); b.m = 2; const R = Math.min(w, d) * .5; b.sphere(x, top + .2, z, R, hd ? 10 : 7, roof, .7); rtop = top + R * .7; }
        else { b.m = 4; b.box(x, top - .05, z, w + .2, .25, d + .2, shade(wall, .82), ry); [[0, d / 2], [0, -d / 2], [w / 2, 0], [-w / 2, 0]].forEach(([lx, lz]) => { const [px, pz] = L(lx, lz); b.box(px, top + .1, pz, lz ? w + .2 : .3, .7, lz ? .3 : d + .2, shade(wall, .92), ry); });
          if (S0.dome && vh(z, x) < .35) { b.m = 2; b.sphere(x, top + .2, z, Math.min(w, d) * .28, 8, pick(S0.dome, x, z), .8); }
          if (o.style === 'future' || (D.style === 'future' && !o.style)) { b.m = 0; b.box(x, top + .2, z, w * .6, .12, d * .6, '#5ad0ff', ry); } rtop = top + .8; }
        if (A === 'porch' && !o.noDoor) { /* 門廊：兩根柱子＋小斜屋頂＋木平台 */ const pw = Math.min(w0 * .42, 2.6 * K), yB = y + 2.9 * K, yA = yB - .7 * K, pz = d0 / 2 + 1.25 * K; b.m = 1;
          for (const sx of [-1, 1]) { const [px, pz2] = L(sx * pw, pz - .15); b.box(px, y - .1, pz2, .26 * K, yA - y + .1, .26 * K, fr, ry); }
          const [dx2, dz2] = L(0, d0 / 2 + .6 * K); b.box(dx2, y - .3, dz2, pw * 2 + .5, .32, 1.3 * K, shade(beam || '#8a6a46', 1.05), ry); b.m = 2; const P3p = (lx, yy, lz) => { const [qx, qz] = L(lx, lz); return [qx, yy, qz]; };
          slab(P3p(-pw - .3, yA, pz + .25), P3p(pw + .3, yA, pz + .25), P3p(-pw - .3, yB, d0 / 2), P3p(pw + .3, yB, d0 / 2), roof); b.m = 1; }
        if (A === 'tower') { /* 角樓：比房子高一層的方塔，尖頂（平頂風格是女兒牆、圓頂風格是小圓頂） */ const sT = Math.max(2.2 * K, Math.min(w, d) * .42), sg = vh(z, x) < .5 ? -1 : 1, [tx, tz] = L(sg * (w / 2 - sT / 2 + .3), -d / 2 + sT / 2 - .3), th = h + FH * 1.15, yt = y + .3 + th;
          b.m = 4; b.box(tx, y + .3, tz, sT, th, sT, shade(wall, .97), ry); b.m = 0; for (const [ax2, az2] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const [wx2, wz2] = L(sg * (w / 2 - sT / 2 + .3) + ax2 * (sT / 2 + .04), -d / 2 + sT / 2 - .3 + az2 * (sT / 2 + .04)); b.box(wx2, yt - FH * .62, wz2, az2 ? sT * .34 : .1, FH * .38, ax2 ? sT * .34 : .1, glass, ry); }
          if (RT === 'flat') { b.m = 4; b.box(tx, yt, tz, sT + .3, .6, sT + .3, shade(wall, .9), ry); rtop = Math.max(rtop, yt + .6); }
          else if (RT === 'dome') { b.m = 2; b.sphere(tx, yt, tz, sT * .55, hd ? 10 : 7, roof, .8); rtop = Math.max(rtop, yt + sT * .45); }
          else { b.m = 2; b.cyl(tx, yt - .1, tz, sT * .8, 0, sT * (S0.jit ? 1.6 : 1.15), 4, roof, null, ry + Math.PI / 4); rtop = Math.max(rtop, yt + sT); } }
        if (S0.chim && !o.noChimney) { const CPOS = [[.3, -.2], [-.3, -.2], [.32, .12], [-.26, .1]][Math.floor(vh(x * 3, z) * 4) % 4], [cx, cz] = L(w * CPOS[0], d * CPOS[1]); b.m = 3; b.box(cx, top - .2, cz, .8 * K, rtop - top + 1.3, .8 * K, '#9a8e82', ry); b.box(cx, rtop + 1.1, cz, 1 * K, .22, 1 * K, '#8a7e72', ry); CHIMNEYS.push([cx, rtop + 1.4, cz]); }
        if (UL) { const fc = hex(S0.roof === 'flat' ? shade(wall, .78) : '#a99d90'); for (const [ax, az, bx2, bz2] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { const len = Math.abs(bx2 - ax) * w + Math.abs(bz2 - az) * d, nn = Math.max(2, Math.round(len / .95));
            for (let k = 0; k < nn; k++) { const t = (k + .5) / nn, [px, pz] = L((ax + (bx2 - ax) * t) * (w / 2 + .3), (az + (bz2 - az) * t) * (d / 2 + .3)), q = .86 + ur() * .22; put('block', px, y - .62, pz, ry, Math.abs(bx2 - ax) ? len / nn * .92 : .5, .5, Math.abs(bz2 - az) ? len / nn * .92 : .5, [fc[0] * q, fc[1] * q, fc[2] * q]); } } }
        b.m = 0; b.noBot = false; O.push([x, z, Math.max(w, d) / 2 + .2]); fp(x, z, Math.max(w, d) / 2 + .6);
        if (WG) { flatPad(WG.wx, WG.wz, WG.ww + .6, WG.dw + .6, ry, y); house(WG.wx, WG.wz, WG.ww, WG.dw, Math.max(1, fl - 1), ry, { style: o.style, k: K, y, arch: 'base', noDoor: 1, noChimney: 1, roofType: RT === 'flat' || RT === 'dome' ? RT : 'gable', roof, wall, exact: 1, wing: 1 }); }
        return { door: L(0, d / 2 + 2.2 * K), y, top: rtop };
      }
      I.house = house;
      /* v151 艾爾巴夫的北歐巨人風建築：長屋（草皮屋頂、龍頭交叉博風板、盾牌）、圓木屋（疊圓木牆、石煙囪）、瞭望塔（高腳）、石基大宅（下層石造）、樹樁屋、工坊（側屋、鐵鎚招牌、鐵砧）；
         o.theme 是村子的特色擺設：fish 曬網與倒放的小船、hunt 獸皮架與弓靶、craft 鐵砧、west 木桶木箱 */
      function norse(x, z, w, d, fl, ry, o, A, S0, K, y, L, wall, roof) {
        const turf = ['#5e8a3a', '#6a9a48', '#557e36', '#668e40'], shing = ['#6e5a3e', '#5a4a3a', '#7a6446'], FH = 3.1 * K, base = { style: o.style, k: K, exact: 1, wing: 1 }, v = vh(x * 1.7, z * .9);
        const P3 = (lx, yy, lz) => { const [px, pz] = L(lx, lz); return [px, yy, pz]; }, dq = (a, bb, c, dd, col) => { col = hex(col); b.quad(a, bb, c, dd, col); b.quad(a, dd, c, bb, col); };
        const disc = (lx, yy, lz, r, col) => { col = hex(col); const n = hd ? 12 : 8, C = P3(lx, yy, lz + .03); for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832, p0 = P3(lx + Math.cos(a0) * r, yy + Math.sin(a0) * r, lz), p1 = P3(lx + Math.cos(a1) * r, yy + Math.sin(a1) * r, lz); b.tri(C, p0, p1, col); b.tri(C, p1, p0, col); } };
        const beam = S0.beam, logW = pick(['#8a6440', '#7a5634'], x, z); let R;
        if (A === 'stump') { /* 巨大樹樁裡的家 */ const Rr = Math.min(w, d) * .55, Ht = FH * 1.75; if (o.y == null) flatPad(x, z, Rr * 2 + 1, Rr * 2 + 1, ry, y);
          b.m = 5; b.cyl(x, y - .6, z, Rr * 1.1, Rr, Ht + .6, 14, '#6e4e32', '#9a7a54'); b.m = 0; b.cyl(x, y + Ht - .1, z, Rr * 1.08, Rr * .82, .8 * K, 14, turf[0], turf[1]);
          b.m = 5; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832 + v; b.sphere(x + Math.cos(a) * Rr * 1.05, y - .2, z + Math.sin(a) * Rr * 1.05, Rr * .32, 6, '#5e4228', .45); }
          b.m = 1; const [dx, dz] = L(0, Rr * .98); b.box(dx, y - .1, dz, 1.6 * K, 2.4 * K, .5, '#2a2018', ry); b.sphere(dx, y + 2.3 * K, dz, .8 * K, 8, '#2a2018', .5);
          b.m = 0; for (const a of [-1.1, 1.1, 2.6]) { const [wx, wz] = L(Math.sin(a) * Rr * 1.01, Math.cos(a) * Rr * 1.01); b.box(wx, y + FH * .9, wz, .9 * K, .9 * K, .9 * K, S0.glass, ry + a); }
          const [cx, cz] = L(Rr * .4, -Rr * .3); b.m = 3; b.cyl(cx, y + Ht, cz, .45 * K, .4 * K, 1.6 * K, 8, '#8a8478'); CHIMNEYS.push([cx, y + Ht + 1.8 * K, cz]);
          b.m = 0; O.push([x, z, Rr * 1.15]); fp(x, z, Rr * 1.15 + .6); R = { door: L(0, Rr + 2.2 * K), y, top: y + Ht }; }
        else if (A === 'watchtower') { /* 高腳瞭望塔：四根柱子撐起的小木屋＋梯子 */ const sT = Math.min(w, d), Hs2 = 4.6 * K; if (o.y == null) flatPad(x, z, sT + 1, sT + 1, ry, y);
          b.m = 1; for (const [a, e] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const [px, pz] = L(a * sT * .42, e * sT * .42); b.box(px, y - .3, pz, .5 * K, Hs2 + .3, .5 * K, beam, ry); }
          for (const e of [-1, 1]) { const [bx2, bz2] = L(0, e * sT * .42); b.box(bx2, y + Hs2 * .45, bz2, sT * .84, .3 * K, .3 * K, beam, ry); }
          R = house(x, z, sT * .78, sT * .78, 1, ry, { ...base, y: y + Hs2, arch: 'base', roofType: 'hip', roof: pick(shing, x, z), wall, noChimney: 1 });
          b.m = 1; const [rx1, rz1] = L(-.6 * K, sT * .39 + 1.4 * K), [rx2, rz2] = L(.6 * K, sT * .39 + 1.4 * K); b.box(rx1, y - .2, rz1, .2 * K, Hs2 + .3, .2 * K, beam, ry); b.box(rx2, y - .2, rz2, .2 * K, Hs2 + .3, .2 * K, beam, ry);
          for (let q = 1; q < 7; q++) { const [lx, lz] = L(0, sT * .39 + 1.4 * K); b.box(lx, y + q * Hs2 / 7, lz, 1.3 * K, .14 * K, .16 * K, beam, ry); } b.m = 0;
          const [fx, fz] = L(0, 0); b.m = 0; b.box(fx, R.top + .2, fz, .12 * K, 2.4 * K, .12 * K, '#4a3220', ry); b.box(fx + .5 * K, R.top + 1.6 * K, fz, 1 * K, .7 * K, .05, '#c8322b', ry); R.door = L(0, sT * .39 + 2.6 * K); }
        else {
          const opt = A === 'longhouse' ? { arch: 'base', roof: pick(turf, x, z), roofType: 'gable', fl: 1 } : A === 'logcabin' ? { arch: v < .5 ? 'porch' : 'base', roof: pick(shing, x, z), roofType: 'gable', fl: Math.min(fl, 2) }
            : A === 'stonebase' ? { arch: v < .5 ? 'jetty' : 'base', roof: '#5a6068', roofType: v < .7 ? 'gable' : 'hip', fl: Math.max(2, fl), wall0: '#a8a29a' } : { arch: 'wing', roof: pick(shing, z, x), roofType: 'gable', fl: 1 };
          R = house(x, z, w, d, opt.fl, ry, { ...base, y: o.y, arch: opt.arch, roof: opt.roof, roofType: opt.roofType, wall: A === 'logcabin' ? logW : wall, wall0: opt.wall0, noChimney: A === 'workshop' || A === 'logcabin' });
          const yb = R.y, top = yb + .3 + opt.fl * FH;
          if (A === 'longhouse') { /* 交叉的龍頭博風板＋前牆的圓盾 */ const over = .6, hdz = d / 2 + over, hx = w / 2 + over * .8, rh = Math.min(3.6 * K, d * .55), ye = top - over * rh / (d / 2), yr = top + rh;
            for (const sx of [-1, 1]) { const lx = sx * (hx + .06); for (const sz of [-1, 1]) dq(P3(lx, ye, sz * hdz), P3(lx, ye + .45 * K, sz * hdz), P3(lx, yr + 1.35 * K, -sz * .9 * K), P3(lx, yr + .9 * K, -sz * .9 * K), beam);
              b.m = 1; const [hx2, hz2] = L(lx, -.9 * K), [hx3, hz3] = L(lx, .9 * K); b.sphere(hx2, yr + 1.25 * K, hz2, .38 * K, 6, '#3e2a1a'); b.sphere(hx3, yr + 1.25 * K, hz3, .38 * K, 6, '#3e2a1a'); b.m = 0; }
            const SH = ['#c8322b', '#2c6ab0', '#e8c84a', '#e8e0d0'], n = Math.floor(w / (2.6 * K)); for (let q = 0; q < n; q++) { const lx = (q - (n - 1) / 2) * w / n; if (Math.abs(lx) < 1.8 * K) continue; disc(lx, yb + .3 + FH * .55, d / 2 + .1, .62 * K, SH[(q + Math.round(x)) & 3]); disc(lx, yb + .3 + FH * .55, d / 2 + .16, .16 * K, '#8a8478'); } }
          if (A === 'logcabin' && hd) { /* 疊圓木：每 0.45 一層的橫木，四角凸出 */ b.m = 1; for (let yy = yb + .5; yy < top - .3; yy += .5 * K) { const sh = shade(logW, .9 + ((yy * 3) % 2 > 1 ? .1 : 0));
              for (const e of [-1, 1]) { const [ax, az] = L(0, e * (d / 2 + .02)); b.box(ax, yy, az, w + .7 * K, .26 * K, .12, sh, ry); const [bx2, bz2] = L(e * (w / 2 + .02), 0); b.box(bx2, yy + .13 * K, bz2, .12, .26 * K, d + .7 * K, sh, ry); } }
            const [cx, cz] = L(-(w / 2 + .55 * K), 0); b.m = 3; b.box(cx, yb - .2, cz, 1.3 * K, top - yb + 3.6 * K, 1.6 * K, '#8a8478', ry); CHIMNEYS.push([cx, top + 3.6 * K, cz]); b.m = 0; }
          if (A === 'workshop') { /* 熔爐煙囪、門上的鐵鎚招牌、門口的鐵砧 */ const [cx, cz] = L(w * .28, -d * .28); b.m = 3; b.box(cx, yb, cz, 1.8 * K, top - yb + 4 * K, 1.8 * K, '#7a7470', ry); CHIMNEYS.push([cx, top + 4.2 * K, cz]);
            b.m = 1; const [hx, hz] = L(w * .3, d / 2 + .25); b.box(hx, yb + FH * .45, hz, .22 * K, 1.8 * K, .2, '#6a4a2e', ry); b.box(hx, yb + FH * .45 + 1.5 * K, hz, 1.2 * K, .55 * K, .45, '#5a5662', ry);
            const [ax, az] = L(-w * .3, d / 2 + 1.6 * K); b.m = 3; b.box(ax, yb - .1, az, .7 * K, .9 * K, .6 * K, '#4a4650', ry); b.box(ax, yb + .8 * K, az, 1.4 * K, .4 * K, .7 * K, '#3a3640', ry); b.m = 0; } }
        /* 村子特色擺設（在房子側邊，不放在路上） */
        if (hd && o.theme) { const sx = v < .5 ? -1 : 1, [px, pz] = L(sx * (w / 2 + 2.2 * K), d * .1);
          if (!I.roadAt(px, pz) && free(px, pz, 1.2 * K)) { const yy = Hs(px, pz); b.m = 1;
            if (o.theme === 'fish') { for (const e of [-1, 1]) { const [qx, qz] = L(sx * (w / 2 + 2.2 * K), d * .1 + e * 1.4 * K); b.box(qx, yy - .2, qz, .2 * K, 2.6 * K, .2 * K, '#6a4a2e', ry); } b.m = 0; for (let q = 0; q < 5; q++) { const [qx, qz] = L(sx * (w / 2 + 2.2 * K), d * .1 - 1.2 * K + q * .6 * K); b.box(qx, yy + .5 * K, qz, .05, 1.9 * K, .07, '#c8b48a', ry); }
              const [bx2, bz2] = L(sx * (w / 2 + 2.2 * K), d * .1 + 2.8 * K); b.m = 1; b.box(bx2, yy - .1, bz2, 1.4 * K, .8 * K, 3.2 * K, '#5a4a3a', ry, .7); }
            else if (o.theme === 'hunt') { b.box(px, yy - .2, pz, 2.8 * K, .2 * K, .2 * K, '#6a4a2e', ry); for (const e of [-1, 1]) { const [qx, qz] = L(sx * (w / 2 + 2.2 * K) + e * 1.3 * K, d * .1); b.box(qx, yy - .2, qz, .2 * K, 2.4 * K, .2 * K, '#6a4a2e', ry); } b.m = 0; for (const e of [-.6, .6]) { const [qx, qz] = L(sx * (w / 2 + 2.2 * K) + e * K, d * .1); b.box(qx, yy + .7 * K, qz, .9 * K, 1.4 * K, .1, e < 0 ? '#8a6a4a' : '#9a9088', ry); } b.box(px, yy + 2.1 * K, pz, 2.8 * K, .16 * K, .16 * K, '#6a4a2e', ry); }
            else if (o.theme === 'craft') { b.m = 3; b.box(px, yy - .1, pz, .8 * K, .9 * K, .7 * K, '#4a4650', ry); b.box(px, yy + .8 * K, pz, 1.5 * K, .4 * K, .7 * K, '#3a3640', ry); b.m = 1; b.box(px + .9 * K, yy - .1, pz, .3 * K, 1.6 * K, .3 * K, '#6a4a2e', ry); }
            else { b.cyl(px, yy - .1, pz, .55 * K, .5 * K, 1.2 * K, 8, '#8a5a34'); b.cyl(px + 1.2 * K, yy - .1, pz + .3, .5 * K, .45 * K, 1.1 * K, 8, '#7a4e2c'); b.box(px - .4 * K, yy - .1, pz + 1.2 * K, 1 * K, 1 * K, 1 * K, '#a8875a', ry + .4); }
            b.m = 0; } }
        return R;
      }
      /* --- 道路的立體細節：主街路緣石、路燈 --- */
      for (const R of roads) { const hw = R.w / 2;
        if (hd && R.kind === 'promenade') for (let k = 0; k < R.P.length - 1; k += 1) { const [ax, az] = R.P[k], [bx, bz] = R.P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L, nz = (bx - ax) / L, ang = Math.atan2(bx - ax, bz - az);
          for (const sd of [-1, 1]) { const cx = (ax + bx) / 2 + nx * hw * sd, cz = (az + bz) / 2 + nz * hw * sd; if (I.roadAt(cx + nx * sd * 1.2, cz + nz * sd * 1.2)) continue; b.m = 3; b.box(cx, Hs(cx, cz) - .25, cz, .34, .42, L + .05, D.curb || '#9c958a', ang); b.m = 0; } }
        if (R.kind !== 'trail' && R.kind !== 'alley') { const gap = R.kind === 'lane' ? 34 : 18; let acc = 0, side = 1;
          for (let k = 1; k < R.P.length; k++) { acc += Math.hypot(R.P[k][0] - R.P[k - 1][0], R.P[k][1] - R.P[k - 1][1]); if (acc < gap) continue; acc = 0; side = -side;
            const [ax, az] = R.P[k - 1], [bx, bz] = R.P[k], L = Math.hypot(bx - ax, bz - az) || 1, lx = bx - (bz - az) / L * (hw + .9) * side, lz = bz + (bx - ax) / L * (hw + .9) * side;
            if (I.roadAt(lx, lz) || I.waterAt(lx, lz) || Hs(lx, lz) < .6 || occ.some(o => Math.hypot(lx - o[0], lz - o[1]) < o[2])) continue;
            const y = Hs(lx, lz); b.m = 1; b.cyl(lx, y - .2, lz, .14, .1, 3.6, 6, '#3a3430'); b.box(lx, y + 3.4, lz, .5, .5, .5, '#3a3430'); b.m = 0; b.box(lx, y + 3.15, lz, .36, .4, .36, '#ffe2a0'); O.push([lx, lz, .4]); } } }
      /* --- 石橋（跨河，可以走） --- */
      for (const [p0, p1] of D.bridges || []) { const [ax, az] = sp(p0), [bx, bz] = sp(p1), L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az), ya = Hs(ax, az), yb = Hs(bx, bz), n = Math.ceil(L / 1.2);
        for (let k = 0; k < n; k++) { const t = (k + .5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = ya + (yb - ya) * t + Math.sin(Math.PI * t) * 1.2; b.m = 3; b.box(x, y - .6, z, 5.4, .6, L / n + .05, '#b8ae9e', ang); if (hd) { const nx = Math.cos(ang), nz = -Math.sin(ang); [-1, 1].forEach(sd => b.box(x + nx * 2.6 * sd, y, z + nz * 2.6 * sd, .4, .7, L / n + .05, '#a39886', ang)); } b.m = 0;
          ST.plats.push({ x0: x - 2.4, z0: z - 2.4, x1: x + 2.4, z1: z + 2.4, y0: y, y1: y }); } }
      /* --- 碼頭（木棧道，可以走） --- */
      for (const [p0, p1, wd] of D.piers || []) { const [ax, az] = sp(p0), [bx, bz] = sp(p1), L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az), n = Math.ceil(L / 1.4), w = s(wd || 2);
        for (let k = 0; k < n; k++) { const t = (k + .5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = Math.max(1.4, Hs(x, z) + .15); /* 碼頭從岸上平順接過去 */ b.m = 1; b.box(x, y - .3, z, w, .3, L / n - .06, '#9a7048', ang); if (k % 2 === 0) { const nx = Math.cos(ang), nz = -Math.sin(ang); [-1, 1].forEach(sd => b.cyl(x + nx * (w / 2 - .2) * sd, -2.5, z + nz * (w / 2 - .2) * sd, .2, .2, 4.4, 6, '#6e4c30')); } b.m = 0;
          ST.plats.push({ x0: x - w / 2, z0: z - w / 2, x1: x + w / 2, z1: z + w / 2, y0: y, y1: y }); } }
      /* --- 城牆、木柵與城門（擋路，只能從城門進出） --- */
      const markB = (x, z, rad) => { for (let jz = Math.floor((z - rad + ext) / G); jz <= Math.ceil((z + rad + ext) / G); jz++) for (let ix = Math.floor((x - rad + ext) / G); ix <= Math.ceil((x + rad + ext) / G); ix++) { if (ix < 0 || jz < 0 || ix >= N || jz >= N) continue; if (Math.hypot(-ext + ix * G - x, -ext + jz * G - z) <= rad) Bg[jz * N + ix] = 1; } };
      I.markB = markB;
      for (const W of D.ramparts || []) { const P0 = W.pts.map(sp); if (W.closed) P0.push(P0[0]); const hh = W.h || 5, th = W.th || 1.8, col = W.col || '#c4bcac', wood = W.style === 'wood', gates = (W.gates || []).map(g => [s(g[0]), s(g[1]), s(g[2] || 4)]);
        for (let i = 0; i < P0.length - 1; i++) { const [ax, az] = P0[i], [bx, bz] = P0[i + 1], Ls = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(Ls / (W.seg || 2))), ang = Math.atan2(bx - ax, bz - az);
          for (let k = 0; k < n; k++) { const t = (k + .5) / n, px = ax + (bx - ax) * t, pz = az + (bz - az) * t; if (gates.some(g => Math.hypot(px - g[0], pz - g[1]) < g[2] / 2)) continue; const y = W.y != null ? W.y : Hs(px, pz);
            b.m = wood ? 1 : 3; b.box(px, y - 1.2, pz, th, hh + 1.2, Ls / n + .08, wood ? mix(col, '#6e4c30', vh(k, i) * .4) : col, ang);
            if (wood) { if (hd) b.box(px, y + hh, pz, th * .9, .9, Ls / n, shade(col, .9), ang, .15); b.box(px, y + hh * .7, pz, th + .25, .3, Ls / n + .1, '#4a3220', ang); }
            else if (W.crenel !== false && k % 2 === 0) b.box(px, y + hh, pz, th + .2, .9, Ls / n * .5, shade(col, 1.06), ang);
            b.m = 0; if (!W.walk) for (let q = -1; q <= 1; q++) { const f = q / 2 * Ls / n * .9; markB(px + Math.sin(ang) * f, pz + Math.cos(ang) * f, th / 2 + .5); } if (k % 2 === 0) occ.push([px, pz, th / 2 + 1.5]); }
          if (W.towers && i % (W.towerEvery || 1) === 0 && (i > 0 || !W.closed)) { const [vx, vz] = P0[i], y = Hs(vx, vz); b.m = wood ? 1 : 3; b.box(vx, y - 1, vz, th * 2.6, hh + 4, th * 2.6, shade(col, .94), ang); b.box(vx, y + hh + 3, vz, th * 3.1, .8, th * 3.1, shade(col, 1.04), ang); if (W.roof) { b.m = 2; b.box(vx, y + hh + 3.8, vz, th * 3, 2.4, th * 3, W.roof, ang, .1); } b.m = 0; markB(vx, vz, th * 1.5); occ.push([vx, vz, th * 2.5]); } }
        for (const g of gates) { let best = 1e9, ang = 0; for (let i = 0; i < P0.length - 1; i++) { const [dd] = segD(g[0], g[1], P0[i][0], P0[i][1], P0[i + 1][0], P0[i + 1][1]); if (dd < best) { best = dd; ang = Math.atan2(P0[i + 1][0] - P0[i][0], P0[i + 1][1] - P0[i][1]); } }
          const ux = Math.sin(ang), uz = Math.cos(ang), y = Hs(g[0], g[1]), hw = g[2] / 2 + th * .7;
          for (const sd of [-1, 1]) { const px = g[0] + ux * hw * sd, pz = g[1] + uz * hw * sd; b.m = wood ? 1 : 3; b.box(px, y - 1, pz, th * 1.8, hh + 3, th * 1.8, shade(col, .92), ang); b.m = 0; markB(px, pz, th); }
          b.m = wood ? 1 : 3; b.box(g[0], y + hh + .5, g[1], th * 1.6, 2, g[2] + th * 3.4, shade(col, .98), ang); b.m = 0; if (W.banner) b.box(g[0] + Math.cos(ang) * (th * .85), y + hh - 1.6, g[1] - Math.sin(ang) * (th * .85), .08, 2.2, g[2] * .45, W.banner, ang); } }
      /* --- 空中步道：雲之路、木棧橋、繞樹螺旋坡道、長拱橋（可以走的平台） --- */
      for (const S of D.skyways || []) { const P = spline(S.pts.map(sp), 1), acc = [0]; for (let k = 1; k < P.length; k++) acc.push(acc[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1])); const T = acc[acc.length - 1] || 1;
        const y0 = S.y ? S.y[0] : Math.max(1.4, Hs(P[0][0], P[0][1])), y1 = S.y ? S.y[1] : Math.max(1.4, Hs(P[P.length - 1][0], P[P.length - 1][1])), w = S.w || 4, hw = w / 2, st = S.style || 'wood';
        for (let k = 0; k < P.length; k++) { const [x, z] = P[k], t = acc[k] / T, y = y0 + (y1 - y0) * t + (S.arch || 0) * Math.sin(Math.PI * t), nx = P[Math.min(P.length - 1, k + 1)], px = P[Math.max(0, k - 1)], ang = Math.atan2(nx[0] - px[0], nx[1] - px[1]);
          const pw = Math.max(1.6, hw - .35); if (S.ramp && k < P.length - 1) { /* v154 陡的橋：每段用斜坡平台（沿主要方向內插高度），不用一格格的方塊 */ const [x2, z2] = P[k + 1], t2 = acc[k + 1] / T, y2 = y0 + (y1 - y0) * t2 + (S.arch || 0) * Math.sin(Math.PI * t2);
            if (Math.abs(z2 - z) >= Math.abs(x2 - x)) ST.plats.push({ x0: Math.min(x, x2) - pw, x1: Math.max(x, x2) + pw, z0: Math.min(z, z2), z1: Math.max(z, z2), y0: z2 > z ? y : y2, y1: z2 > z ? y2 : y, ax: 'z' });
            else ST.plats.push({ x0: Math.min(x, x2), x1: Math.max(x, x2), z0: Math.min(z, z2) - pw, z1: Math.max(z, z2) + pw, y0: x2 > x ? y : y2, y1: x2 > x ? y2 : y, ax: 'x' }); }
          else if (!S.ramp) ST.plats.push({ x0: x - pw, z0: z - pw, x1: x + pw, z1: z + pw, y0: y, y1: y });
          if (st === 'rainbow') { /* v151 彩虹橋：半透明、像霧氣的七色帶子（畫在 api.mist，world.js 用半透明畫），起點往下延伸到海面，四周有彩虹霧 */ const RC = ['#ff6a5a', '#ffaa4a', '#ffe06a', '#7ad86a', '#6ab0f0', '#8a7ae0', '#c08af0'], seg = (cx, cy, cz, a2, hgt) => { for (let q = 0; q < 7; q++) { const off = -hw + (q + .5) * w / 7, sx = Math.cos(a2) * off, sz = -Math.sin(a2) * off; MB.box(cx + sx, cy - hgt, cz + sz, w / 7 + .03, hgt, 1.18, RC[q], a2); } };
            seg(x, y, z, ang, .5); if (k % 2 === 0) for (const sd of [-1, 1]) { const sx = Math.cos(ang) * (hw + .2) * sd, sz = -Math.sin(ang) * (hw + .2) * sd; MB.sphere(x + sx, y - .2, z + sz, 1.1 + vh(k, sd + 2) * .9, 6, mix('#ffffff', RC[sd < 0 ? 0 : 6], .25), .7, .3, k * 3 + sd); }
            if (k === 0) { const nx2 = P[Math.min(P.length - 1, 2)], ddx = P[0][0] - nx2[0], ddz = P[0][1] - nx2[1], dl = Math.hypot(ddx, ddz) || 1; for (let m = 1; m <= 10; m++) { const ex = x + ddx / dl * m * 1.1, ez = z + ddz / dl * m * 1.1, ey = y - m * (y + 2.5) / 10; seg(ex, ey, ez, ang, .5); }
              for (let m = 0; m < 9; m++) MB.sphere(x + ddx / dl * 9 + (vh(m, 1) - .5) * w * 1.8, -.4, z + ddz / dl * 9 + (vh(1, m) - .5) * w * 1.8, w * (.35 + vh(m, 4) * .35), 7, mix('#ffffff', '#f4eeff', vh(m, 2)), .5, .25, m + 3); }
            if (k % 3 === 1) MB.sphere(x, y - 2.4 - vh(k, 5) * 2, z, w * (.5 + vh(k, 6) * .3), 6, mix('#ffffff', RC[k % 7], .3), .5, .3, k); }
          else if (st === 'rope') { /* v151 繩索吊橋：一片片木板、兩側繩索、每隔一段一根柱子 */ b.m = 1; b.box(x, y - .3, z, w, .22, .82, mix('#8a6a46', '#a07a52', vh(k, 1)), ang + (vh(k, 2) - .5) * .08);
            for (const sd of [-1, 1]) { const sx = Math.cos(ang) * (hw - .1) * sd, sz = -Math.sin(ang) * (hw - .1) * sd; b.box(x + sx, y + .95, z + sz, .1, .1, 1.15, '#c8a878', ang); if (k % 4 === 0) b.box(x + sx, y - .3, z + sz, .24, 1.45, .24, '#5e3e2a', ang); if (k % 2 === 0) b.box(x + sx, y - .1, z + sz, .05, 1.05, .05, '#b89868', ang); } b.m = 0; }
          else if (st === 'cloud') { if (k % 2 === 0) { b.m = 0; b.sphere(x, y - .9, z, hw * 1.25, hd ? 7 : 5, mix('#ffffff', '#eef4ff', vh(k, 3)), .42, .15, k + 1); if (hd && k % 4 === 0) { const sx = Math.cos(ang) * hw * 1.1, sz = -Math.sin(ang) * hw * 1.1; b.sphere(x + sx, y - .5, z + sz, hw * .6, 6, '#ffffff', .6, .2, k + 7); b.sphere(x - sx, y - .5, z - sz, hw * .55, 6, '#f4f8ff', .6, .2, k + 9); } } }
          else { const deck = st === 'stone' ? '#b8ae9e' : st === 'root' ? '#7a5a3a' : st === 'metal' ? '#c8d0dc' : '#9a7048', rail = st === 'red' ? '#c8322b' : st === 'stone' ? '#a39886' : st === 'metal' ? '#5ad0ff' : '#6e4c30';
            b.m = st === 'stone' ? 3 : st === 'metal' ? 0 : st === 'root' ? 5 : 1; b.box(x, y - (st === 'root' ? 1.2 : .45), z, w, st === 'root' ? 1.2 : .45, 1.12, deck, ang);
            if (st !== 'root' && k % 2 === 0) { const sx = Math.cos(ang) * (hw - .15), sz = -Math.sin(ang) * (hw - .15); b.m = st === 'stone' ? 3 : 1; [-1, 1].forEach(sd => { b.box(x + sx * sd, y, z + sz * sd, .22, 1.1, .22, rail, ang); if (hd || st === 'red') b.box(x + sx * sd, y + 1, z + sz * sd, .16, .16, 2.1, rail, ang); }); }
            if (S.posts !== false && k % 6 === 0 && st !== 'root') { const gy = Math.max(-4, Hs(x, z)); if (y - gy > 1.5 && y - gy < 40) { b.m = 1; b.cyl(x, gy - .5, z, .3, .3, y - gy, 6, st === 'red' ? '#8a2a22' : st === 'stone' ? '#a89c8a' : '#6e4c30'); } } }
          b.m = 0; } }
      /* v151 D.abyss：島四周往大洞落下的瀑布（司法島）。{ r 半徑, zMin 北邊不挖的界線 }，水面在洞裡不畫（e3three），洞底一片深色 */
      if (D.abyss) { const R1 = s(D.abyss.r), zc = s(D.abyss.zMin), bot = -84; b.m = 0;
        const fall = (x0, z0, x1, z1, k) => { const col = mix('#e8f4fc', '#9ccbe6', vh(k, 7) * .8), c2 = mix('#cfe6f4', '#7ab4d8', vh(k, 9)), top = [x0, .45, z0], top2 = [x1, .45, z1];
          b.quad(top, top2, [x1, bot, z1], [x0, bot, z0], hex(col)); b.quad(top, [x0, bot, z0], [x1, bot, z1], top2, hex(c2));
          if (hd && k % 2 === 0) b.sphere((x0 + x1) / 2, .2, (z0 + z1) / 2, 2.2, 6, '#ffffff', .5, .25, k); };
        const a0 = Math.asin(Math.max(-1, Math.min(1, zc / R1))), n = Math.ceil(R1 * 2 * Math.PI / 3.2); let k = 0;
        for (let i = 0; i < n; i++) { const t0 = i / n * 6.2832, t1 = (i + 1) / n * 6.2832, x0 = Math.cos(t0) * R1, z0 = Math.sin(t0) * R1, x1 = Math.cos(t1) * R1, z1 = Math.sin(t1) * R1; if (Math.min(z0, z1) < zc) continue; fall(x0, z0, x1, z1, k++); }
        const xe = Math.sqrt(Math.max(0, R1 * R1 - zc * zc)); for (let xx = -xe; xx < xe; xx += 3.2) fall(Math.min(xe, xx + 3.2), zc, xx, zc, k++);
        b.cyl(0, bot - .2, 0, R1 + 4, R1 + 4, .2, 48, '#10202e', '#10202e'); }
      const TS = {}, tk = n => TS[n] = (b.p.length / 9 | 0) - Object.values(TS).reduce((a, v) => a + v, 0); tk('roads');
      /* --- 特色建築 --- */
      const LMK = {};
      for (const L of D.landmarks || []) { const [kind, x0, z0, ry, opt] = L, x = s(x0), z = s(z0), o = opt || {};
        const fn = ISLE2.parts[kind]; if (!fn) continue; const res = fn({ b, x, z, ry: ry || 0, o, Hs, house, O, ST, P, K, fp, flatPad, hd, D: Dd, CHIMNEYS, r, markB, I, MB }); if (o.key) LMK[o.key] = res; }
      I.lm = LMK; tk('landmarks');
      /* --- 沿街房屋 --- */
      const town = (D.town || []).map(t => ({ x: s(t[0]), z: s(t[1]), r: s(t[2]), fl: t[3], style: t[4], k: t[5] || 1, theme: t[6] }));
      let seed = 4242; const rn = () => (seed = seed * 16807 % 2147483647) / 2147483647;
      let seedV = 777; const rv = () => (seedV = seedV * 16807 % 2147483647) / 2147483647; /* v151 屋型變化用另一組亂數，樹、岩石的位置維持和以前一樣 */
      for (const R of roads) { if (!(R.kind in PAVED)) continue; const hw = R.w / 2, lastA = ['', '', ''];
        for (let k = 2; k < R.P.length - 2 && houses.length < (D.maxHouses || 220); k += (D.houseStep || 4)) { const [ax, az] = R.P[k - 1], [bx, bz] = R.P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L, cx = R.P[k][0], cz = R.P[k][1];
          const T = town.find(t => Math.hypot(cx - t.x, cz - t.z) < t.r); if (!T) continue; const core = 1 - Math.hypot(cx - T.x, cz - T.z) / T.r;
          for (const sd of [-1, 1]) { const fl = Math.max(1, Math.min(3, T.fl + (core > .55 ? 1 : 0) - (core < .2 ? 1 : 0) - (rn() < .25 ? 1 : 0))); let w = (fl === 1 ? 6.4 : fl === 2 ? 7.4 : 8.4) * T.k, d = (fl === 1 ? 5.4 : 6 + (fl - 2) * .6) * T.k;
            /* v151 屋型：隨機挑，和同一側上一棟不同；尺寸也有些微差異；斜屋頂風格有 3 成換成另一種屋頂 */
            const SYt = SY[T.style || D.style] || SY.euro, AL = SYt.arch; let ar = AL[(rv() * AL.length) | 0]; if (ar === lastA[sd + 1] && AL.length > 1) ar = AL[(AL.indexOf(ar) + 1 + ((rv() * (AL.length - 1)) | 0)) % AL.length];
            w *= .9 + rv() * .22; d *= .92 + rv() * .16; if (SYt.norse) { if (ar === 'longhouse') { w *= 1.4; d *= .92; } else if (ar === 'watchtower' || ar === 'stump') { w = d = Math.min(w, d) * (ar === 'stump' ? 1.05 : .85); } }
            const rt = !SYt.norse && (SYt.roof === 'gable' || SYt.roof === 'hip') && rv() < .3 ? (SYt.roof === 'gable' ? 'hip' : 'gable') : undefined;
            const off = hw + 1.4 * T.k + d / 2, x = cx - uz * off * sd, z = cz + ux * off * sd, rad = Math.max(w, d) / 2;
            const fx2 = cx - uz * (off + d) * sd, fz2 = cz + ux * (off + d) * sd; /* 靠海那一側不蓋房子，留出海景與沙灘 */
            if (Hs(x, z) < 1.2 || Hs(fx2, fz2) < 1.3 || !free(x, z, rad * .92)) continue; const ry = Math.atan2(-ux * sd, -uz * sd) + Math.PI / 2 * 0; /* 門面向道路 */
            const face = Math.atan2(cx - x, cz - z); house(x, z, w, d, fl, face, { sign: rn() < .18 ? ['#c8322b', '#2c6ab0', '#d8a03a'][(rn() * 3) | 0] : null, style: T.style, k: T.k, arch: ar, roofType: rt, theme: T.theme }); lastA[sd + 1] = ar; houses.push([x, z, fl]); } } }
      tk('houses');
      /* --- 田地、牧場（圍籬） --- */
      for (const F of D.fields || []) { const [fx, fz, fw, fd, fa, fc1, fc2] = F, x = s(fx), z = s(fz), w = s(fw), d = s(fd), c = Math.cos(fa), sn = Math.sin(fa);
        for (let k = -d / 2 + 1; k < d / 2; k += 1.6) for (let q = -w / 2 + 1; q < w / 2; q += hd ? 1.1 : 2) { const px = x + q * c + k * sn, pz = z - q * sn + k * c; if (I.roadAt(px, pz)) continue; const y = Hs(px, pz); b.box(px, y - .1, pz, .9, .7 + vh(q, k) * .3, .5, mix(fc1 || '#e2c060', fc2 || '#c9a040', vh(k, q)), -fa); }
        fence(x, z, w + 2, d + 2, fa); }
      for (const F of D.pastures || []) { const [fx, fz, fw, fd, fa] = F; fence(s(fx), s(fz), s(fw), s(fd), fa); }
      function fence(x, z, w, d, a) { const c = Math.cos(a), sn = Math.sin(a), C = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [x + lx * c + lz * sn, z - lx * sn + lz * c]);
        for (let i = 0; i < 4; i++) { const [ax, az] = C[i], [bx, bz] = C[(i + 1) % 4], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 2.4), ang = Math.atan2(bx - ax, bz - az);
          for (let k = 0; k < n; k++) { const t = k / n, px = ax + (bx - ax) * t, pz = az + (bz - az) * t; if (I.roadAt(px, pz)) continue; b.m = 1; b.box(px, Hs(px, pz) - .2, pz, .22, 1.3, .22, '#8a6a46'); const qx = ax + (bx - ax) * (t + .5 / n), qz = az + (bz - az) * (t + .5 / n); if (!I.roadAt(qx, qz)) b.box(qx, Hs(qx, qz) + .7, qz, .12, .14, L / n, '#9a7a52', ang); b.m = 0; } } }
      /* --- 樹林、松樹、椰子樹、岩石群 --- */
      for (const [gx, gz, gr, gn0, kind] of D.groves || []) { const x0 = s(gx), z0 = s(gz), R0 = s(gr), gn = UL ? Math.round(gn0 * 1.7) : gn0;
        for (let i = 0, tries = 0; i < gn && tries < gn * 6; tries++) { const a = rn() * 6.283, dd = Math.sqrt(rn()) * R0, x = x0 + Math.cos(a) * dd, z = z0 + Math.sin(a) * dd, y = Hs(x, z); if (y < 1.4 || I.waterAt(x, z) || I.roadAt(x, z) || !free(x, z, 1.6)) continue;
          if (kind === 'palm') { P.palm(b, x, y, z, .9 + rn() * .45, r); O.push([x, z, .8]); fp(x, z, 1.2); i++; continue; }
          if (kind === 'candy' && D.homies && rn() < .4) { /* 蛋糕島：會說話的樹（霍米茲）——樹幹上有眼睛和嘴巴 */ const sc = 1.5 + rn() * .8, fa = rn() * 6.283, fx = Math.sin(fa), fz = Math.cos(fa); P.tree(b, x, y, z, sc, r, mix('#6aa848', '#9ac85a', rn()));
            b.m = 0; for (const e of [-1, 1]) { const ex = x + fx * .55 * sc + fz * e * .32 * sc, ez = z + fz * .55 * sc - fx * e * .32 * sc; b.sphere(ex, y + 2.1 * sc, ez, .3 * sc, 7, '#ffffff'); b.sphere(ex + fx * .2 * sc, y + 2.12 * sc, ez + fz * .2 * sc, .14 * sc, 6, '#1a1a1a'); }
            b.box(x + fx * .6 * sc, y + 1.4 * sc, z + fz * .6 * sc, .7 * sc, .2 * sc, .12, '#3a1a1a', fa); O.push([x, z, 1.1 * sc]); fp(x, z, 1.6 * sc); i++; continue; }
          if (kind === 'candy') { const cc = ['#ff6aa8', '#ffd25a', '#6ad0ff', '#9ae07a', '#c89aff'][(rn() * 5) | 0], hh = 3 + rn() * 4; b.m = 0; b.cyl(x, y - .2, z, .18, .16, hh, 6, '#ffffff'); b.sphere(x, y + hh + 1, z, 1.4 + rn(), 9, cc, 1); b.sphere(x, y + hh + 1, z, .7, 6, '#ffffff', 1.05); O.push([x, z, .8]); fp(x, z, 1.6); i++; continue; }
          if (kind === 'sakura') { P.tree(b, x, y, z, 1 + rn() * .8, r, mix('#f4a8c8', '#ffd0e0', rn())); O.push([x, z, 1.1]); fp(x, z, 1.4); i++; continue; }
          if (kind === 'snowpine') { P.pine(b, x, y, z, 1 + rn() * .7, mix('#e8f0f4', '#cfdce4', rn())); O.push([x, z, 1.1]); fp(x, z, 1.4); i++; continue; }
          if (kind === 'coral') { const cc = ['#ff7a8a', '#ffa860', '#c87ae0', '#ffd25a', '#6ad0c8'][(rn() * 5) | 0], sc = .8 + rn() * 1.2; b.m = 0; for (let q = 0; q < 5; q++) { const a3 = rn() * 6.28, t3 = .4 + rn() * .5; b.cyl(x, y - .2, z, .32 * sc, .14 * sc, (2.5 + rn() * 2.5) * sc, 6, cc, null, 0, [Math.cos(a3) * t3 * 2 * sc, Math.sin(a3) * t3 * 2 * sc]); } b.sphere(x, y + .2, z, .9 * sc, 6, shade(cc, .8), .5); O.push([x, z, .8 * sc]); fp(x, z, 1.4 * sc); i++; continue; }
          if (kind === 'kelp') { b.m = 0; const hh = 6 + rn() * 9, a3 = rn() * 6.28; for (let q = 0; q < 3; q++) b.cyl(x + q * .4, y - .3, z + q * .3, .22, .1, hh * (1 - q * .2), 5, mix('#2e7a4a', '#4a9a5a', rn()), null, 0, [Math.cos(a3 + q) * 1.2, Math.sin(a3 + q) * 1.2]); fp(x, z, .8); i++; continue; }
          if (kind === 'dead') { b.m = 5; const a2 = rn() * 6.28; b.cyl(x, y - .2, z, .3, .16, 4 + rn() * 2, 6, '#8a6a44', null, 0, [Math.cos(a2) * .8, Math.sin(a2) * .8]); b.m = 0; O.push([x, z, .6]); fp(x, z, 1); i++; continue; }
          if (kind === 'pine' || (kind !== 'tree' && y > 34 * (D.vScale || .5) * SC / 2 && rn() < .6)) P.pine(b, x, y, z, 1 + rn() * .7, mix('#2f6b3c', '#3f7a44', rn())); else P.tree(b, x, y, z, .9 + rn() * .9, r, mix('#4f9a3c', '#77b84e', rn()));
          O.push([x, z, 1.1]); fp(x, z, 1.4); i++;
          if (UL) { const c = mix(D.grass || '#6faa4a', D.grass2 || '#8cc456', vn(x * .08, z * .08)); for (let q = 0; q < 5; q++) { const a2 = ur() * 6.283, d2 = 1.4 + ur() * 2.6, px = x + Math.cos(a2) * d2, pz = z + Math.sin(a2) * d2, py = Hs(px, pz); if (I.roadAt(px, pz)) continue; if (q < 1) shrub(px, py, pz, .7 + ur() * .6); else put('tuft', px, py - .05, pz, ur() * 6, 1, .9 + ur() * .6, 1, [c[0] * .7, c[1] * .8, c[2] * .62]); } } } }
      for (const [gx, gz, gr, gn] of D.palms || []) { const x0 = s(gx), z0 = s(gz), R0 = s(gr);
        for (let i = 0, tries = 0; i < gn && tries < gn * 8; tries++) { const a = rn() * 6.283, dd = Math.sqrt(rn()) * R0, x = x0 + Math.cos(a) * dd, z = z0 + Math.sin(a) * dd, y = Hs(x, z); if (y < .7 || y > (D.palmMax || 4) || I.roadAt(x, z) || I.waterAt(x, z) || !free(x, z, 1.4)) continue; P.palm(b, x, y, z, .95 + rn() * .4, r); O.push([x, z, .8]); fp(x, z, 1.2); i++; } }
      for (const [gx, gz, gr, gn] of D.rocks || []) { const x0 = s(gx), z0 = s(gz), R0 = s(gr);
        for (let i = 0; i < gn; i++) { const a = rn() * 6.283, dd = Math.sqrt(rn()) * R0, x = x0 + Math.cos(a) * dd, z = z0 + Math.sin(a) * dd, y = Hs(x, z); if (y < -1 || I.roadAt(x, z) || !free(x, z, 1)) continue; const sz = .8 + rn() * 2.6; P.rock(b, x, y - sz * .3, z, sz, r, mix(D.rockA || '#8a8680', D.rockB || '#a8a296', rn())); if (sz > 1.6) O.push([x, z, sz * .8]); } }
      tk('nature');
      /* --- 地形網格（分塊、海面下不建、手機較粗）＋河與湖的水面 --- */
      /* 有鋪石道路的區塊用細網格（石板紋理需要），其他區塊用粗網格，邊緣加裙邊避免接縫裂縫 */
      const TILE = 128, RF = hd ? (MOB ? 2 : (D.fine || 1.34)) : 3.2, RC = hd ? (MOB ? 3.2 : (D.coarse || 2.67)) : 4.3;
      const fineTile = (tx, tz) => { if (river.some(R => R.P.some(([x, z]) => x > tx - 8 && x < tx + TILE + 8 && z > tz - 8 && z < tz + TILE + 8))) return true; for (let z = tz; z <= tz + TILE; z += 3) for (let x = tx; x <= tx + TILE; x += 3) { const rc = I.roadAt(x, z); if (rc && PAVED[Object.keys(RW)[rc - 1]]) return true; } return false; };
      const slope = (x, z) => Math.abs(Hs(x + 1, z) - Hs(x - 1, z)) + Math.abs(Hs(x, z + 1) - Hs(x, z - 1));
      const col = (x, y, z) => { const n = vn(x * .08, z * .08), n2 = vn(x * .5, z * .5), rc = I.roadAt(x, z);
        if (D.colorFn) { const cc = D.colorFn(x, y, z, { n, n2, rc, kind: rc ? Object.keys(RW)[rc - 1] : null, slope: slope(x, z), water: I.waterAt(x, z), mix, vh }); if (cc) return cc; }
        if (rc) { const kind = Object.keys(RW)[rc - 1], base = RCOL[kind]; if (PAVED[kind]) { const bx = Math.floor(x * 1.4 + Math.floor(z * 2.2) * .5), bz = Math.floor(z * 2.2); return mix((D.rcol && D.rcol[kind]) || base, D.cobble || '#9c9488', vh(bx, bz) * .35); } return mix((D.rcol && D.rcol[kind]) || base, D.dirt || '#8e7a58', n2 * .3); }
        if (I.waterAt(x, z)) return mix('#6a8a8a', '#57707a', n2);
        /* v149 自然的地面：大範圍的濕潤／乾燥色塊、窪地較深較綠、坡頂偏乾、坡度漸漸露出岩石、沙灘到草地漸層、路邊被踩出的泥土 */
        const sand = mix(D.sand || '#e8d6a6', D.sand2 || '#f1e2b8', n2), sl = slope(x, z), rock = mix(D.rock || '#8f877c', D.rock2 || '#a39a8c', n2);
        if (y < .95) return mix(sand, shade(sand, .82), sm(.95, .35, y));
        const m1 = vn(x * .011 + 3, z * .011 + 7), m2 = vn(x * .027 + 11, z * .027 + 5), cav = Hs(x, z) - (Hs(x + 3, z) + Hs(x - 3, z) + Hs(x, z + 3) + Hs(x, z - 3)) / 4;
        const G1 = hex(D.grass || '#6faa4a'), G2 = hex(D.grass2 || '#8cc456'), dark = shade(G1, .78), dry = mix(G2, '#c8bf78', .45);
        let g = mix(G1, G2, n * .75 + n2 * .25); g = mix(g, dark, Math.max(0, Math.min(1, -cav * .9 + (m1 - .5) * .9))); g = mix(g, dry, Math.max(0, Math.min(1, cav * .7 + (m2 - .55) * 1.6)) * .6);
        if (y > 30) g = mix(g, '#7a9a5a', Math.min(1, (y - 30) / 30));
        { const q = idx(x, z); let near = 0; if (q >= 0) for (const [ox, oz] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1.4, 1.4], [-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4]]) if (I.roadAt(x + ox, z + oz)) near++;
          if (near) g = mix(g, mix(D.dirt || '#8e7a58', g, .35 + n2 * .3), near / 8 * .75); }
        if (vn(x * .045 + 9, z * .045 + 2) > .74 && sl < 2) g = mix(g, D.dirt || '#8e7a58', (vn(x * .045 + 9, z * .045 + 2) - .74) * 2.2);
        if (y < 2.2) g = mix(sand, g, sm(1.0, 2.2, y + (n2 - .5) * .6));
        return mix(g, rock, sm(1.6, 2.9, sl + (n2 - .5) * .5)); };
      if (UL) { const RU = D.ultraRes || .62, tiles = []; let ttris = 0;
        for (let tz = -ext; tz < ext; tz += TILE) for (let tx = -ext; tx < ext; tx += TILE) {
          let any = false; for (let z = tz; z <= tz + TILE && !any; z += 8) for (let x = tx; x <= tx + TILE; x += 8) if (Hs(x, z) > -2.5) { any = true; break; } if (!any) continue;
          const nr = Math.round(TILE / RU), st = TILE / nr, NV = (nr + 1) * (nr + 1), pos = new Float32Array(NV * 3), cl = new Float32Array(NV * 3), idx = [];
          for (let j = 0, v = 0; j <= nr; j++) for (let i = 0; i <= nr; i++, v++) { const wx = tx + i * st, wz = tz + j * st, wy = Hs(wx, wz), c = hex(col(wx, wy, wz)); pos[v * 3] = wx; pos[v * 3 + 1] = wy; pos[v * 3 + 2] = wz; cl[v * 3] = c[0]; cl[v * 3 + 1] = c[1]; cl[v * 3 + 2] = c[2]; }
          for (let j = 0; j < nr; j++) for (let i = 0; i < nr; i++) { const a0 = j * (nr + 1) + i, a1 = a0 + 1, a2 = a0 + nr + 1, a3 = a2 + 1; if (pos[a0 * 3 + 1] < -3.5 && pos[a1 * 3 + 1] < -3.5 && pos[a2 * 3 + 1] < -3.5 && pos[a3 * 3 + 1] < -3.5) continue; if (D.cutTri) { const ys = [pos[a0 * 3 + 1], pos[a1 * 3 + 1], pos[a2 * 3 + 1], pos[a3 * 3 + 1]]; if (D.cutTri(Math.max(...ys) - Math.min(...ys), pos[a0 * 3] / SC, pos[a0 * 3 + 2] / SC)) continue; } idx.push(a0, a2, a1, a1, a2, a3); }
          ttris += idx.length / 3; tiles.push({ pos, col: cl, idx: idx.length > 65535 * 3 || NV > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx), cx: tx + TILE / 2, cz: tz + TILE / 2 }); }
        /* 地面細節：石板路一顆顆的石頭、草叢、花、小石頭、灌木、坡上的岩塊 */
        const cobC = hex(D.cobble || '#9c9488');
        for (let z = -ext; z < ext; z += .5) for (let x = -ext + ((Math.round(z / .5) % 2) ? .25 : 0); x < ext; x += .5) { const rc = I.roadAt(x, z); if (!rc) continue; const kind = Object.keys(RW)[rc - 1]; if (!PAVED[kind]) continue;
          const jx = x + (ur() - .5) * .12, jz = z + (ur() - .5) * .12, base = hex(col(jx, Hs(jx, jz), jz)), q = .8 + ur() * .3; put('cob', jx, Hs(jx, jz) + .02, jz, ur() * 3.14, .42 + ur() * .08, .14 + ur() * .06, .38 + ur() * .08, [(base[0] * .6 + cobC[0] * .4) * q, (base[1] * .6 + cobC[1] * .4) * q, (base[2] * .6 + cobC[2] * .4) * q]); }
        const FL = ['#ff6a8a', '#ffd34a', '#ffffff', '#b08aff', '#ff9a4a', '#6ad0ff'];
        for (let z = -ext; z < ext; z += 1.6) for (let x = -ext; x < ext; x += 1.6) { const px = x + ur() * 1.6, pz = z + ur() * 1.6, y = Hs(px, pz); if (y < 1.3 || I.roadAt(px, pz) || I.blocked(px, pz) || ur() > (D.clutter || 1) || (D.noGrass && D.noGrass(px / SC, pz / SC))) continue;
          const sl = slope(px, pz), c = hex(col(px, y, pz)), green = c[1] > c[0] * 1.05 && c[1] > c[2], r0 = ur();
          if (sl > 2.4) { if (r0 < .45 && sl < 4.5 && D.slopeRocks !== false) { const k = .8 + ur() * .3; put('peb', px, y - .2, pz, ur() * 6, .6 + ur() * 1.1, .4 + ur() * .7, .6 + ur() * 1.1, [c[0] * k, c[1] * k, c[2] * k]); } continue; }
          if (green) { if (r0 < .6) put('tuft', px, y - .05, pz, ur() * 6, .8 + ur() * .7, .6 + ur() * .9, .8 + ur() * .7, [c[0] * .78, c[1] * .86, c[2] * .7]); else if (r0 < .68 && vn(px * .07, pz * .07) > .56) { const fc = hex(FL[Math.floor(vn(px * .03, pz * .03) * FL.length * 1.6 + ur() * 1.2) % FL.length]); put('flower', px, y + .05, pz, ur() * 6, .9, .9 + ur() * .6, .9, fc); } else if (r0 < .72 && vn(px * .05 + 4, pz * .05 + 8) > .66) shrub(px, y, pz, .8 + ur() * .7); else if (r0 < .78) put('peb', px, y - .05, pz, ur() * 6, .25 + ur() * .35, .18 + ur() * .2, .25 + ur() * .35, [.55 + ur() * .15, .54 + ur() * .12, .5 + ur() * .1]); }
          else if (r0 < .3) put('tuft', px, y - .05, pz, ur() * 6, .7 + ur() * .6, .4 + ur() * .6, .7 + ur() * .6, [c[0] * .72, c[1] * .68, c[2] * .55]);
          else if (r0 < .44 && sl < 1.2) { const k = .78 + ur() * .2; put('peb', px, y - .05, pz, ur() * 6, .22 + ur() * .4, .14 + ur() * .2, .22 + ur() * .4, [c[0] * k, c[1] * k, c[2] * k]); } }
        if (D.planks) for (let z = -ext; z < ext; z += .62) for (let x = -ext; x < ext; x += 3.2) { const px = x + (Math.round(z / .62) % 4) * .8, y = Hs(px, z); if (y < 3 || I.blocked(px, z)) continue; const c = hex(col(px, y, z)), k = .8 + ur() * .3; put('tile', px, y - .02, z, 0, 3.1, .1, .58, [c[0] * k, c[1] * k, c[2] * k]); }
        if (D.ultraExtra) D.ultraExtra({ put, ur, Hs, I, ext, hex, col });
        const KT = { cob: 20, tile: 12, block: 12, peb: 80, bush: 80, tuft: 12, flower: 8 }; let dtris = 0; const det = {}; for (const k in UD) { det[k] = Float32Array.from(UD[k]); dtris += UD[k].length / 11 * (KT[k] || 12); }
        I.ultra = { tiles, det, tris: ttris + dtris, ttris, dtris };
      } else
      for (let tz = -ext; tz < ext; tz += TILE) for (let tx = -ext; tx < ext; tx += TILE) {
        let any = false; for (let z = tz; z <= tz + TILE && !any; z += 8) for (let x = tx; x <= tx + TILE; x += 8) if (Hs(x, z) > -2.5) { any = true; break; } if (!any) continue;
        const res = fineTile(tx, tz) ? RF : RC, nr = Math.round(TILE / res), st = TILE / nr, start = b.p.length / 3, V = [];
        for (let j = 0; j <= nr; j++) { const row = []; for (let i = 0; i <= nr; i++) { const wx = tx + i * st, wz = tz + j * st, wy = Hs(wx, wz); row.push([[wx, wy, wz], hex(col(wx, wy, wz))]); } V.push(row); }
        for (let j = 0; j < nr; j++) for (let i = 0; i < nr; i++) { const a = V[j][i], bb = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i]; if (a[0][1] < -3.5 && bb[0][1] < -3.5 && c[0][1] < -3.5 && d[0][1] < -3.5) continue; if (D.cutTri) { const ys = [a[0][1], bb[0][1], c[0][1], d[0][1]]; if (D.cutTri(Math.max(...ys) - Math.min(...ys), a[0][0] / SC, a[0][2] / SC)) continue; } b.triV(a[0], c[0], bb[0], a[1], c[1], bb[1]); b.triV(a[0], d[0], c[0], a[1], d[1], c[1]); }
        const skirt = (A, B) => { if (A[0][1] < -3.5 && B[0][1] < -3.5) return; if (D.cutTri && D.cutTri(Math.abs(A[0][1] - B[0][1]), A[0][0] / SC, A[0][2] / SC)) return; const a2 = [A[0][0], A[0][1] - 1.6, A[0][2]], b2 = [B[0][0], B[0][1] - 1.6, B[0][2]]; b.triV(A[0], b2, B[0], A[1], B[1], B[1]); b.triV(A[0], a2, b2, A[1], A[1], B[1]); b.triV(A[0], B[0], b2, A[1], B[1], B[1]); b.triV(A[0], b2, a2, A[1], B[1], A[1]); };
        for (let i = 0; i < nr; i++) { skirt(V[0][i], V[0][i + 1]); skirt(V[nr][i], V[nr][i + 1]); skirt(V[i][0], V[i + 1][0]); skirt(V[i][nr], V[i + 1][nr]); }
        b.smooth.push([start, b.p.length / 3]); }
      for (const R of river) for (let k = 0; k < R.P.length - 1; k++) { const [ax, az] = R.P[k], [bx, bz] = R.P[k + 1], L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L * R.w / 2, nz = (bx - ax) / L * R.w / 2, ya = R.hs[k] - .55, yb = R.hs[k + 1] - .55;
        b.m = D.waterCol ? 0 : 7; b.quad([ax - nx, ya, az - nz], [ax + nx, ya, az + nz], [bx + nx, yb, bz + nz], [bx - nx, yb, bz - nz], mix(D.waterCol || '#4aa0c8', D.waterCol2 || '#62b8d8', vh(k, 1))); b.m = 0; }
      for (const L of lakes) { const n = 40; b.m = D.waterCol ? 0 : 7; for (let k = 0; k < n; k++) { const a0 = k / n * 6.283, a1 = (k + 1) / n * 6.283; b.tri([L.x, L.y - .4, L.z], [L.x + Math.cos(a1) * L.rx, L.y - .4, L.z + Math.sin(a1) * L.rz], [L.x + Math.cos(a0) * L.rx, L.y - .4, L.z + Math.sin(a0) * L.rz], hex(D.waterCol || '#4a9cc4')); } b.m = 0; }
      if (D.after) D.after(I, { b, Hs, house, O, ST, P, K, fp, s, sp, hd, r: rn });
      if (!UL) I.ultra = null; tk('terrain'); I.tstat = TS; I.houses = houses.length;
    };
    /* 劇情資料對到新地圖 */
    I.apply = ch => { if (!ch || ch.__isle2) return; ch.__isle2 = true; const M = D.story || {};
      if (M.spawn) { ch.spawn = sp(M.spawn); } if (M.boss) ch.bossPos = sp(M.boss);
      ch.layout = Object.assign({}, ch.layout || {}, { spawn: ch.spawn, boss: ch.bossPos, lobes: [], spots: (M.spots || []).map(sp), path: (M.route || []).map(sp) });
      (ch.npcs || []).forEach(n => { if (M.npcs && M.npcs[n.id]) n.pos = sp(M.npcs[n.id]); });
      (ch.steps || []).forEach((st, k) => { const m = M.steps && M.steps[k]; if (!m) return; ['points', 'spots'].forEach(f => { if (m[f]) st[f] = m[f].map(sp); }); ['pos', 'goal', 'to', 'area', 'start'].forEach(f => { if (m[f]) st[f] = sp(m[f]); }); if (m.r) st.r = m.r; if (m.desc) st.desc = m.desc; if (m.radius) st.radius = s(m.radius); if (m.guards && st.guards) st.guards.forEach((g, i) => { if (m.guards[i]) g.path = m.guards[i].map(sp); }); });
      if (M.env) Object.assign(ch.env, M.env); };
    return I;
  }
  ISLE2.parts = ISLE2.parts || {};
  ISLE2.define = (id, D) => { const I = Island(id, D); ISLE2[id] = I; const ch = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === id); if (ch) I.apply(ch); return I; };
  ISLE2.util = { spline, polyD, vn, vh, fbm, sm, pip };
})(typeof window !== 'undefined' ? window : globalThis);
