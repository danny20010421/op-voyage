/* v212（使用者 11/14 02:10）：劇情地圖的名字標籤遮擋。
   NPC、敵人、道具頭上的名字是 HTML 疊在 3D 畫面上，原本永遠浮在最上層——角色走到房子或樹後面，名字還是清楚浮在建築上。
   做法：建場景時把房子、牆、塔、樹冠這類「夠大的方塊／圓柱／球」記成包圍盒（AABB），
   每 0.15 秒用「鏡頭 → 角色身體」的線段檢查有沒有穿過包圍盒；被擋住的名字淡成 30%。任務目標（!）、自己的名字不淡化。 */
(function () {
  if (typeof E3 === 'undefined' || !E3.Builder || typeof SCENES === 'undefined') return;
  let REC = null; const BP = E3.Builder.prototype;
  const push = (x0, y0, z0, x1, y1, z1) => { if (REC) REC.push([x0, y0, z0, x1, y1, z1]); };
  const _box = BP.box; BP.box = function (cx, cy, cz, sx, sy, sz, col, ry, taper) {
    if (REC && sy >= 1.6 && Math.max(sx, sz) >= 1.4) { const r = ry ? Math.hypot(sx, sz) / 2 : 0, hx = ry ? r : sx / 2, hz = ry ? r : sz / 2; push(cx - hx, cy, cz - hz, cx + hx, cy + sy, cz + hz); }
    return _box.apply(this, arguments); };
  const _cyl = BP.cyl; BP.cyl = function (cx, cy, cz, rb, rt, h, seg) {
    if (REC && h >= 2 && Math.max(rb, rt) >= .7) { const r = Math.max(rb, rt) * .85; push(cx - r, cy, cz - r, cx + r, cy + h, cz + r); }
    return _cyl.apply(this, arguments); };
  const _sph = BP.sphere; BP.sphere = function (cx, cy, cz, r, seg, col, sy) {
    if (REC && r >= 1.3) { const k = r * .8, ky = r * (sy || 1) * .8; push(cx - k, cy - ky, cz - k, cx + k, cy + ky, cz + k); }
    return _sph.apply(this, arguments); };
  const _bs = SCENES.buildScene; SCENES.buildScene = function () { REC = []; let S; try { S = _bs.apply(this, arguments); } finally { const L = REC; REC = null; if (S) S.occ = L; } return S; };

  /* 線段（鏡頭 → 目標）是否穿過任一包圍盒；目標點附近 1.2 單位內的盒子不算（角色自己站的平台、身邊的欄杆） */
  function blocked(S, e, x, y, z) {
    const L = S && S.occ; if (!L || !L.length) return false;
    const dx = x - e[0], dy = y - e[1], dz = z - e[2], mnx = Math.min(e[0], x), mxx = Math.max(e[0], x), mnz = Math.min(e[2], z), mxz = Math.max(e[2], z);
    for (let i = 0; i < L.length; i++) { const b = L[i];
      if (b[3] < mnx || b[0] > mxx || b[5] < mnz || b[2] > mxz) continue;
      if (x > b[0] - 1.2 && x < b[3] + 1.2 && z > b[2] - 1.2 && z < b[5] + 1.2 && y > b[1] - .5 && y < b[4] + 1.5) continue;
      let t0 = 0, t1 = .97, ok = true;
      for (const [o, d, lo, hi] of [[e[0], dx, b[0], b[3]], [e[1], dy, b[1], b[4]], [e[2], dz, b[2], b[5]]]) {
        if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) { ok = false; break; } continue; }
        let a = (lo - o) / d, c = (hi - o) / d; if (a > c) [a, c] = [c, a]; if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) { ok = false; break; } }
      if (ok) return true; }
    return false;
  }
  window.OCC212 = { blocked };
})();
