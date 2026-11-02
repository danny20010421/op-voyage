/* 3D 探索：移動、鏡頭、NPC 互動、拾取、小地圖 */
(function (global) {
  'use strict';
  const { M } = E3;
  const TALK_R = 5.5, FIGHT_R = 6.5, PICK_R = 2.8, SPEED = 15;

  class World {
    constructor(opts) {
      this.canvas = opts.canvas; this.labels = opts.labels; this.cb = opts.callbacks; this.mini = opts.minimap;
      this.r = new E3.Renderer(this.canvas);
      this.keys = {}; this.joy = { x: 0, y: 0 }; this.running = false; this.paused = false;
      this.cam = { yaw: 0, pitch: .42, dist: 20, tYaw: 0 };
      this.npcMeshes = {}; this.itemMeshes = {}; this.labelEls = new Map();
      this._bind();
    }
    /* ---------- 載入篇章 ---------- */
    load(chapter, playerId, state) {
      if (this.scene) { this.r.free(this.scene.staticMesh); this.r.free(this.scene.water); (this.scene.roofs || []).forEach(R => this.r.free(R.mesh)); }
      this.chapter = chapter; this.playerId = playerId;
      this.scene = SCENES.buildScene(this.r, chapter.id, (state && state.clear) || [], chapter.layout);
      const env = chapter.env; this.r.env = { sky: E3.hex(env.sky), ground: E3.hex(env.ground), fog: E3.hex(env.fog), fogR: env.fogR, sun: env.sun };
      const [sx, sz] = chapter.spawn; this.p = { x: sx, z: sz, y: (this.scene.Ho || this.scene.H)(sx, sz), flip: false, moving: false, t: 0, target: null };
      this.cam.yaw = this.cam.tYaw = 0;
      this.npcs = chapter.npcs.map(n => { if (!this.npcMeshes[n.look]) this.npcMeshes[n.look] = SCENES.npcMesh(this.r, n.look); return { ...n, x: n.pos[0], z: n.pos[1], face: Math.PI, kind: 'npc' }; });
      this.items = []; this.enemies = [];
      this.barrier = this.barrier || SCENES.barrierMesh(this.r, '#8fd8ff');
      this.setState(state);
      this.labels.innerHTML = ''; this.labelEls.clear();
      this._miniBase = null; this.r.flash = 0;
      this.r.texture(CHARACTERS[playerId].image);
    }
    /* 由 App 傳入目前任務狀態：可撿道具、敵人、BOSS 是否解鎖、任務目標 */
    setState(st) {
      this.st = st;
      this.items = (st.items || []).map(it => ({ ...it, y: (this.scene.Ho || this.scene.H)(it.x, it.z) }));
      this.items.forEach(it => { if (!this.itemMeshes[it.icon]) this.itemMeshes[it.icon] = SCENES.itemMesh(this.r, it.icon); });
      this.enemies = (st.enemies || []).map(e => ({ ...e, y: (this.scene.Ho || this.scene.H)(e.x, e.z), kind: 'enemy' }));
      this.enemies.forEach(e => this.r.texture(CHARACTERS[e.id].image));
      this.bossUnlocked = !!st.bossUnlocked; this.target = st.target || null; this.beacon = st.beacon || null; this._reached = false;
      if (this.beacon) { this.beacon.y = (this.scene.Ho || this.scene.H)(this.beacon.x, this.beacon.z); if (!this.beaconMesh) this.beaconMesh = SCENES.beaconMesh(this.r); }
      if (!this.coneMesh) { this.coneMesh = SCENES.coneMesh(this.r); this.moundMesh = SCENES.moundMesh(this.r); }
      this.chests = (st.chests || []).map(c => ({ ...c, kind: 'chest', name: '寶箱' }));
      if (!this.chestMesh) { const B = new E3.Builder(); B.box(0, 0, 0, 1.6, .9, 1.1, '#8a5a2e'); B.box(0, 0, 0, 1.66, .16, 1.16, '#e8c170'); B.box(0, .45, 0, 1.66, .12, 1.16, '#e8c170'); this.chestBase = this.r.mesh(B); const Lb = new E3.Builder(); Lb.box(0, 0, 0, 1.64, .45, 1.14, '#9a6a36', 0, .7); Lb.box(0, .1, .58, .3, .3, .06, '#ffd26c'); this.chestLid = this.r.mesh(Lb); this.chestMesh = true; }
      this.escort = st.escort || null; this._escDone = false; this._trail = null; this._path = null; if (this._nav && this._nav.S !== this.scene) this._nav = null; if (!this._nav) { const S0 = this.scene; (window.requestIdleCallback || (f => setTimeout(f, 300)))(() => { if (this.scene === S0) this._navGrid(); }, { timeout: 2500 }); } this.canDig = !!st.canDig; this.digMarks = st.digMarks || [];
      this.guards = (st.guards || []).map(g => ({ ...g, x: g.path[0][0], z: g.path[0][1], seg: 0, face: 0 }));
      this.guards.forEach(g => { if (!this.npcMeshes[g.look]) this.npcMeshes[g.look] = SCENES.npcMesh(this.r, g.look); });
      if (st.escortPos && this.npcs) { const n = this.npcs.find(n => n.id === st.escortPos.id); if (n) { n.x = st.escortPos.x; n.z = st.escortPos.z; } }
      if (this.labelEls) { this.labels.innerHTML = ''; this.labelEls.clear(); }
    }
    start() { if (this.running) return; this.running = true; this.last = performance.now(); const loop = (t) => { if (!this.running) return; this._raf = requestAnimationFrame(loop); this.frame(t); }; this._raf = requestAnimationFrame(loop); }
    stop() { this.running = false; cancelAnimationFrame(this._raf); this.keys = {}; this.joy = { x: 0, y: 0 }; }

    /* ---------- 輸入 ---------- */
    _bind() {
      const c = this.canvas;
      const typing = (e) => /input|textarea|select/i.test(e.target.tagName);
      window.addEventListener('keydown', e => { if (!this.running || typing(e)) return; const k = e.key.toLowerCase(); this.keys[k] = true; if ((k === 'e' || k === 'enter') && !this.paused) { e.preventDefault(); this.interact(); } if (k === ' ' && !this.paused) { e.preventDefault(); this._jumpReq = true; } if (k === 'q') this.cam.tYaw += .5; if (k === 'r') this.cam.tYaw -= .5; if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault(); if (/^[wasd]$|^arrow/.test(k)) this.p.target = null; });
      window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
      window.addEventListener('blur', () => { this.keys = {}; });
      let down = null;
      c.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: this.cam.tYaw, pitch: this.cam.pitch, drag: false, id: e.pointerId }; c.setPointerCapture(e.pointerId); });
      c.addEventListener('pointermove', e => { if (!down || down.id !== e.pointerId) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 6) down.drag = true; if (down.drag) { this.cam.tYaw = down.yaw - dx * .006; this.cam.pitch = Math.max(.18, Math.min(1.1, down.pitch + dy * .004)); } });
      c.addEventListener('pointerup', e => { if (down && !down.drag && !this.paused) this._clickMove(e); down = null; });
      c.addEventListener('pointercancel', () => { down = null; });
      const touches = new Map(); let pinch0 = 0, dist0 = 0;
      c.addEventListener('touchstart', e => { if (e.touches.length === 2) { const [a, b] = e.touches; pinch0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); dist0 = this.cam.dist; down = null; } }, { passive: true });
      c.addEventListener('touchmove', e => { if (e.touches.length === 2 && pinch0) { const [a, b] = e.touches; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); this.cam.dist = Math.max(10, Math.min(38, dist0 * pinch0 / d)); } }, { passive: true });
      c.addEventListener('touchend', e => { if (e.touches.length < 2) pinch0 = 0; }, { passive: true });
      c.addEventListener('wheel', e => { e.preventDefault(); this.cam.dist = Math.max(10, Math.min(38, this.cam.dist + e.deltaY * .02)); }, { passive: false });
    }
    setJoystick(x, y) { this.joy.x = x; this.joy.y = y; if (x || y) { this.p.target = null; this.autoGo = false; this._path = null; } }
    _clickMove(e) {
      const rect = this.canvas.getBoundingClientRect(), nx = (e.clientX - rect.left) / rect.width * 2 - 1, ny = 1 - (e.clientY - rect.top) / rect.height * 2;
      const eye = this.r.eye, tg = this.r.target; let fx = tg[0] - eye[0], fy = tg[1] - eye[1], fz = tg[2] - eye[2]; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
      const R = this.r.right; const ux = R[1] * fz - R[2] * fy, uy = R[2] * fx - R[0] * fz, uz = R[0] * fy - R[1] * fx;
      const t = Math.tan(.45), a = this.r.aspect; const dx = fx + R[0] * nx * t * a + ux * ny * t, dy = fy + R[1] * nx * t * a + uy * ny * t, dz = fz + R[2] * nx * t * a + uz * ny * t;
      let x = eye[0], y = eye[1], z = eye[2];
      for (let i = 0; i < 400; i++) { x += dx * .6; y += dy * .6; z += dz * .6; if (y <= this.scene.H(x, z)) { if (this.scene.H(x, z) > .3) { this.autoGo = false; this.navTo(x, z, 1.2); this.cb.onMoveMarker && this.cb.onMoveMarker(); this._marker = { x, z, t: 0 }; } return; } }
    }

    /* ---------- 互動 ---------- */
    nearest() {
      let best = null, bd = 1e9;
      for (const n of this.npcs) { const d = Math.hypot(n.x - this.p.x, n.z - this.p.z); if (d < TALK_R && d < bd) { bd = d; best = n; } }
      for (const e of this.enemies) { if (e.boss && !this.bossUnlocked) continue; const d = Math.hypot(e.x - this.p.x, e.z - this.p.z); if (d < FIGHT_R && d < bd) { bd = d; best = e; } }
      for (const c of this.chests || []) { if (c.opened) continue; const d = Math.hypot(c.x - this.p.x, c.z - this.p.z); if (d < 3.2 && d < bd) { bd = d; best = c; } }
      return best;
    }
    interact() { const n = this.nearest(); if (!n) { if (this.canDig && this.cb.onDig) this.cb.onDig(this.p.x, this.p.z); return; } if (n.kind === 'npc') n.face = Math.atan2(this.p.x - n.x, this.p.z - n.z); this.cb.onInteract(n); }
    /* 任務指引：目前目標的位置（光柱、任務 NPC、BOSS、收集物） */
    guidePoint() {
      const p = this.p, t = this.target;
      if (this.beacon) return { x: this.beacon.x, z: this.beacon.z, label: this.beacon.label };
      if (t && t.type === 'npc') { let best = null, bd = 1e9; for (const n of this.npcs) if (t.ids.includes(n.id)) { const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < bd) { bd = d; best = n; } } if (best) return { x: best.x, z: best.z, label: best.name, npc: best }; }
      if (t && t.type === 'boss') { const e = this.enemies.find(e => e.boss); if (e) return { x: e.x, z: e.z, label: 'BOSS・' + CHARACTERS[e.id].name }; }
      const its = this.items.filter(i => !i.taken); if (its.length) { let best = its[0], bd = 1e9; for (const i of its) { const d = Math.hypot(i.x - p.x, i.z - p.z); if (d < bd) { bd = d; best = i; } } return { x: best.x, z: best.z, label: best.label || '任務道具' }; }
      return null;
    }
    /* 目標在畫面外時，於螢幕邊緣顯示方向箭頭與距離 */
    updateGuide() {
      const el = document.getElementById('guideArrow'); if (!el) return; const g = this._guide;
      if (!g || this.paused) { el.classList.remove('show'); return; }
      const p = this.p, W = this.canvas.clientWidth, Hh = this.canvas.clientHeight, dist = Math.hypot(g.x - p.x, g.z - p.z);
      const pr = this.r.project(g.x, (this.scene.Ho || this.scene.H)(g.x, g.z) + 2, g.z);
      if (pr && pr.x > 50 && pr.x < W - 50 && pr.y > 110 && pr.y < Hh - 80) { el.classList.remove('show'); return; }
      const e = this.r.eye, tg = this.r.target, fx = tg[0] - e[0], fz = tg[2] - e[2], fl = Math.hypot(fx, fz) || 1, R = this.r.right;
      const dx = g.x - p.x, dz = g.z - p.z, sx = dx * R[0] + dz * R[2], sy = (dx * fx + dz * fz) / fl, a = Math.atan2(-sy, sx);
      const rx = W / 2 - 104, ry = Hh / 2 - 128, cy = Hh / 2 - 6; /* 避開上方任務卡、下方功能列、右側按鈕 */ el.style.transform = `translate(${W / 2 + Math.cos(a) * rx}px, ${cy + Math.sin(a) * ry}px)`;
      el.querySelector('i').style.transform = `rotate(${a}rad)`; el.querySelector('b').textContent = Math.round(dist) + 'm';
      el.classList.add('show');
    }
    autoGuide(on) { this.autoGo = on; this._navGoal = null; if (!on) { this.p.target = null; this._path = null; } }
    goTo(obj) { this.navTo(obj.x, obj.z, 2.4, obj); }
    /* ---------- v149 自動導航：可行走網格上的 A*（含橋、平台、坡道的高度），拉直成轉折點後沿路走 ---------- */
    _navGrid() { const S = this.scene; if (this._nav && this._nav.S === S) return this._nav; const E = Math.ceil(S.ext || 100), N = 2 * E + 1, ob = new Uint8Array(N * N);
      const OB = S.obstacles.concat(this.npcs.filter(n => !n.walking).map(n => [n.x, n.z, SCENES.lookScale(n.look) * 1.1]));
      for (const o of OB) { const r = o[2] + 1.4; for (let j = Math.max(0, Math.floor(o[1] - r + E)); j <= Math.min(N - 1, Math.ceil(o[1] + r + E)); j++) for (let i = Math.max(0, Math.floor(o[0] - r + E)); i <= Math.min(N - 1, Math.ceil(o[0] + r + E)); i++) if (Math.hypot(i - E - o[0], j - E - o[1]) <= r) ob[j * N + i] = 1; }
      const ok = new Uint8Array(N * N), hg = new Float32Array(N * N), pl = new Uint8Array(N * N), wl = new Uint8Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const q = j * N + i, x = i - E, z = j - E, g = S.H(x, z); hg[q] = g; ok[q] = g > .35 && !(S.blocked && S.blocked(x, z)) && !ob[q] ? 1 : 0; }
      const mark = (A, x0, z0, x1, z1) => { for (let j = Math.max(0, Math.floor(z0 + E) - 1); j <= Math.min(N - 1, Math.ceil(z1 + E) + 1); j++) for (let i = Math.max(0, Math.floor(x0 + E) - 1); i <= Math.min(N - 1, Math.ceil(x1 + E) + 1); i++) A[j * N + i] = 1; };
      (S.plats || []).forEach(P => mark(pl, P.x0, P.z0, P.x1, P.z1)); (S.walls || []).forEach(w => mark(wl, w.x0, w.z0, w.x1, w.z1));
      return this._nav = { S, E, N, ob, ok, hg, pl, wl, sx: 1e9, sz: 1e9 }; }
    /* 網格點之間的快速版本：附近沒有平台、牆時直接查表 */
    _stepC(i0, j0, y0, i1, j1) { const nav = this._nav, N = nav.N, q = j1 * N + i1; if (nav.pl[q] || nav.wl[q] || nav.pl[j0 * N + i0] || y0 - nav.hg[j0 * N + i0] > 1.2) return this._step(i0 - nav.E, j0 - nav.E, y0, i1 - nav.E, j1 - nav.E);
      if (!nav.ok[q] && !(nav.ob[q] && Math.hypot(i1 - nav.E - nav.sx, j1 - nav.E - nav.sz) < 2.5 && nav.hg[q] > .35)) return NaN; const g = nav.hg[q], S = this.scene; /* 角色身邊 2.5 以內不算障礙物的外圍（避免一開始就被自己旁邊的樹困住） */ if (S.maxStep && Math.abs(g - nav.hg[j0 * N + i0]) / ((i1 !== i0 && j1 !== j0) ? 1.4142 : 1) > nav.slope) return NaN; /* 網格比實際移動粗：導航只走坡度 0.8 以內的路（實際可以走到 1.5），留安全餘裕 */
      if (nav.en) for (const e of nav.en) if (Math.abs(i1 - nav.E - e[0]) < e[2] && Math.abs(j1 - nav.E - e[1]) < e[2] && Math.hypot(i1 - nav.E - e[0], j1 - nav.E - e[1]) < e[2]) return NaN; return g; }
    /* 從 (x0,z0,高度 y0) 走一步到 (x1,z1)：可以走就回傳新的高度，不能走回傳 NaN（規則和實際移動一樣） */
    _step(x0, z0, y0, x1, z1) { const S = this.scene, nav = this._nav, g = S.H(x1, z1), len = Math.hypot(x1 - x0, z1 - z0) || 1, onP = S.onPlat && S.onPlat(x1, z1, y0) && S.G(x1, z1, y0) > y0 - .85;
      const gOK = g > .35 && !(S.blocked && S.blocked(x1, z1)) && !(S.maxStep && (y0 - S.H(x0, z0) > .5 ? (g - y0 > .8) : Math.abs(g - S.H(x0, z0)) / len > 1.1)) /* 從平台走下來：上下高度差都不能超過 0.85（走得下去就走得回來，不會掉進回不去的地方） */;
      if (!onP && y0 - g > .85 && S.maxStep) return NaN; /* 不會從橋、平台邊緣掉下去 */
      if (!gOK && !onP) return NaN; const ny = S.G ? S.G(x1, z1, y0) : g; if (onP && ny - y0 > .7) return NaN; /* 導航只走一步高度差小的平台（實際可跨 0.8），留餘裕 */
      if (!onP || ny - g < .5) { const i = Math.round(x1 + nav.E), j = Math.round(z1 + nav.E); if (i < 0 || j < 0 || i >= nav.N || j >= nav.N || (nav.ob[j * nav.N + i] && Math.hypot(x1 - nav.sx, z1 - nav.sz) > 2.5)) return NaN; }
      const W2 = S.walls; if (W2 && W2.length) for (const w of W2) { if (ny + 1.7 <= w.y0 || ny + .3 >= w.y1) continue; if (x1 > w.x0 - .5 && x1 < w.x1 + .5 && z1 > w.z0 - .5 && z1 < w.z1 + .5) return NaN; }
      for (const e of (nav.en || [])) if (Math.hypot(x1 - e[0], z1 - e[1]) < e[2]) return NaN;
      return ny; }
    findPath(sx, sz, sy, gx, gz, near) { const nav = this._navGrid(), S = this.scene, E = nav.E, N = nav.N, NL = 6; near = near || 2; nav.en = this.enemies.map(e => [e.x, e.z, e.boss && !this.bossUnlocked ? 14.7 : 3]); nav.sx = sx; nav.sz = sz; nav.slope = this._relax ? 1.35 : .8;
      if (!nav.yS) { const M = N * N * NL; nav.yS = new Float32Array(M); nav.pa = new Int32Array(M); nav.st = new Uint16Array(M); nav.stamp = 0; } /* 第一次自動導航時才配置 */
      if (nav.stamp >= 65000) { nav.st.fill(0); nav.stamp = 0; } const yS = nav.yS, pa = nav.pa, st = nav.st, stamp = ++nav.stamp;
      const K = (i, j, y) => { const c = j * N + i; const d = y - nav.hg[c]; return c * NL + (d < .4 ? 0 : 1 + (Math.floor(y / 6) % (NL - 1) + NL - 1) % (NL - 1)); }; /* 同一格分層：地面一層，平台依高度每 6 單位輪流分到 5 層（橋下有坡道、螺旋坡道上下兩圈都不會混在一起） */
      const si = Math.round(sx + E), sj = Math.round(sz + E); if (si < 0 || sj < 0 || si >= N || sj >= N) return null;
      /* 目標在 NPC、房子或障礙物裡面時，改成最近的可走格子，避免整張圖都搜一遍 */
      { const gi = Math.round(gx + E), gj = Math.round(gz + E), okC = (i, j) => i >= 0 && j >= 0 && i < N && j < N && (nav.ok[j * N + i] || nav.pl[j * N + i]);
        if (!okC(gi, gj)) { let bd = 1e9, bi = -1, bj = -1; for (let r = 1; r <= 8 && bi < 0; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r || !okC(gi + di, gj + dj)) continue; const d = Math.hypot(di, dj); if (d < bd) { bd = d; bi = gi + di; bj = gj + dj; } }
          if (bi >= 0) { gx = bi - E; gz = bj - E; near = Math.min(near, 1.5); } } }
      /* 廣度優先搜尋（從角色往外一圈圈擴散，碰到目標就停）：整張圖約 20 萬格也只要幾十毫秒，坡道、天界、冥界繞多遠都找得到 */
      const gy = (S.Ho || S.H)(gx, gz), Q = nav.Q || (nav.Q = new Int32Array(N * N * NL)), k0 = K(si, sj, sy); st[k0] = stamp; yS[k0] = sy; pa[k0] = -1; Q[0] = k0; let qh = 0, qt = 1;
      const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1]]; let best = k0, bh = Math.hypot(si - E - gx, sj - E - gz) + Math.abs(sy - gy) * .3, found = null, n = 0; /* 四方向擴散最快，最後再拉直成斜線 */
      while (qh < qt) { const k = Q[qh++], cell = (k / NL) | 0, i = cell % N, j = (cell / N) | 0, y0 = yS[k]; n++;
        const h0 = Math.hypot(i - E - gx, j - E - gz); if (h0 + Math.abs(y0 - gy) * .3 < bh) { bh = h0 + Math.abs(y0 - gy) * .3; best = k; } if (h0 < near && Math.abs(y0 - gy) < 4) { found = k; break; }
        const esc = k === k0 && Math.abs(y0 - nav.hg[j * N + i]) < .3;
        for (const [di, dj] of D8) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
          let y1 = this._stepC(i, j, y0, ni, nj); if (y1 !== y1 && esc && nav.ok[nj * N + ni] && Math.abs(nav.hg[nj * N + ni] - y0) < 2.2) y1 = nav.hg[nj * N + ni]; /* 已經卡在坑裡時，第一步放寬坡度讓人走得出來 */ if (y1 !== y1) continue;
          if (di && dj && !esc) { const ya = this._stepC(i, j, y0, ni, j), yb = this._stepC(i, j, y0, i, nj); if (ya !== ya || yb !== yb) continue; }
          const nk = K(ni, nj, y1); if (st[nk] === stamp) continue; st[nk] = stamp; yS[nk] = y1; pa[nk] = k; Q[qt++] = nk; } }
      let k = found != null ? found : best; if (k === k0) return null; const P = [];
      let guard = 0; while (k >= 0 && k !== k0 && guard++ < 20000) { const cell = (k / NL) | 0; P.push([cell % N - E, ((cell / N) | 0) - E, yS[k]]); k = pa[k]; } if (guard >= 20000) return null; P.reverse();
      /* 拉直：能直線走到的轉折點就跳過中間的格子 */
      const los = (a, b) => { if (!this._los(a, b)) return false; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ox = -(b[1] - a[1]) / L * .4, oz = (b[0] - a[0]) / L * .4; return this._los([a[0] + ox, a[1] + oz, a[2]], [b[0] + ox, b[1] + oz, b[2]]) && this._los([a[0] - ox, a[1] - oz, a[2]], [b[0] - ox, b[1] - oz, b[2]]); }; /* 拉直時兩側各留 0.4 的寬度，轉彎抄近路也不會踩空 */
      const out = []; let a = [sx, sz, sy], ai = -1; while (ai < P.length - 1) { let bj = ai + 1; { let lo = ai + 1, hi = Math.min(P.length - 1, ai + 80); if (los(a, P[hi])) bj = hi; else { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (los(a, P[mid])) lo = mid; else hi = mid; } bj = lo; } } /* 二分搜尋最遠能直走到的點 */ out.push(P[bj]); a = P[bj]; ai = bj; }
      return { pts: out, partial: found == null }; }
    _los(a, b) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.ceil(L / .4); let x = a[0], z = a[1], y = a[2]; for (let q = 1; q <= m; q++) { const nx = a[0] + (b[0] - a[0]) * q / m, nz = a[1] + (b[1] - a[1]) * q / m, ny = this._step(x, z, y, nx, nz); if (ny !== ny) return false; x = nx; z = nz; y = ny; } return b[2] == null || Math.abs(y - b[2]) < 1; } /* 直線走過去要到得了同一個高度（不能把爬坡道的那段拉直成穿過去） */
    /* 這一步可不可以走（實際移動、自動導航、脫困共用） */
    _okMove(x, z) { const p = this.p, S1 = this.scene, sY = S1.G ? S1.G(p.x, p.z, p.y) : S1.H(p.x, p.z); return (sY - S1.H(x, z) < .85 || !S1.maxStep) && (S1.H(x, z) > .35 && !(S1.blocked && S1.blocked(x, z)) && !(S1.maxStep && (sY - S1.H(p.x, p.z) > .5 ? (S1.H(x, z) - sY > .8) : Math.abs(S1.H(x, z) - S1.H(p.x, p.z)) / (Math.hypot(x - p.x, z - p.z) || 1) > S1.maxStep))) || (S1.onPlat && S1.onPlat(x, z, p.y) && S1.G(x, z, p.y) > sY - .85); }
    /* 脫困：卡住時往四周找一個能走、又更靠近下一個轉折點的位置，直接挪過去一小步 */
    _unstick(wp) { const p = this.p; let best = null, bd = Math.hypot(wp[0] - p.x, wp[1] - p.z); for (let r of [.6, 1.1]) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (!this._okMove(x, z)) continue; const [cx, cz] = this._collide(x, z); if (Math.hypot(cx - x, cz - z) > .3) continue; const d = Math.hypot(wp[0] - x, wp[1] - z); if (d < bd - .2) { bd = d; best = [x, z]; } }
      if (!best) return false; p.x = best[0]; p.z = best[1]; return true; }
    navTo(x, z, near, obj) { const p = this.p; let r = this.findPath(p.x, p.z, p.y, x, z, near || 2); if (!r || (r.partial && Math.hypot(r.pts[r.pts.length - 1][0] - x, r.pts[r.pts.length - 1][1] - z) > 8)) { this._relax = true; const r2 = this.findPath(p.x, p.z, p.y, x, z, near || 2); this._relax = false; if (r2 && (!r || !r2.partial)) r = r2; } /* 站在陡坡上時，放寬坡度再找一次 */ this._goObj = obj || null; if (r && r.pts.length) { this._path = r.pts; this._pi = 0; this._navStuck = 0; p.target = this._path[0].slice(0, 2); return true; } this._path = null; p.target = [x, z]; return false; }

    /* ---------- 更新 ---------- */
    frame(now) {
      const dt = Math.max(0, Math.min(.05, (now - this.last) / 1000)); this.last = now; this.r.time += dt;
      // 自適應畫質：幀率偏低時降低解析度，順暢時慢慢拉回
      const raw = (now - this.last0 || 16) ; this.last0 = now; this._acc = (this._acc || 0) * .95 + raw * .05; this._qt = (this._qt || 0) + dt;
      if (this._qt > 1.5) { this._qt = 0; const r = this.r; if (this._acc > 30 && r.dpr > .6) r.dpr = Math.max(.6, r.dpr - .15); else if (this._acc < 19 && r.dpr < r.maxDpr) r.dpr = Math.min(r.maxDpr, r.dpr + .1); }
      if (!this.paused) this.update(dt);
      this.render(dt);
    }
    update(dt) {
      const p = this.p, k = this.keys, yaw = this.cam.yaw;
      let ix = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0) + this.joy.x;
      let iz = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0) + this.joy.y;
      let mx = 0, mz = 0;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      if (ix || iz) { this._path = null; this._goObj = null; const l = Math.min(1, Math.hypot(ix, iz)) / (Math.hypot(ix, iz) || 1); mx = (fx * iz + rx * ix) * l; mz = (fz * iz + rz * ix) * l; }
      else if (this._path) { /* 沿著導航路徑走：到了一個轉折點就換下一個；卡住就重新找路 */
        let wp = this._path[this._pi]; while (wp) { const dw = Math.hypot(wp[0] - p.x, wp[1] - p.z) + Math.max(0, Math.abs(p.y - wp[2]) - .9), nx2 = this._path[this._pi + 1]; if (dw < .45 || (dw < 1.4 && (!nx2 ? dw < .7 : this._los([p.x, p.z, p.y], nx2)))) wp = this._path[++this._pi]; else break; }
        if (!wp) { this._path = null; p.target = null; if (this._goObj) { const o = this._goObj; this._goObj = null; if (Math.hypot(o.x - p.x, o.z - p.z) < FIGHT_R + 1) this.interact(); } }
        else { p.target = [wp[0], wp[1]]; const dx = wp[0] - p.x, dz = wp[1] - p.z, d = Math.hypot(dx, dz) || 1; mx = dx / d; mz = dz / d;
          this._navT = (this._navT || 0) + dt; if (this._navT > .5) { if (Math.hypot(p.x - (this._navX ?? 1e9), p.z - (this._navZ ?? 1e9)) < .35) { this._navStuck = (this._navStuck || 0) + 1; if (this._unstick(wp)) { this._navT = 0; this._navX = p.x; this._navZ = p.z; } else { const last = this._path[this._path.length - 1], o = this._goObj; if (this._navStuck < 9) { const sc = this._navStuck; this.navTo(last[0], last[1], 1, o); this._navStuck = sc; } else { this._path = null; p.target = null; } } } this._navT = 0; this._navX = p.x; this._navZ = p.z; } } }
      else if (p.target) { const dx = p.target[0] - p.x, dz = p.target[1] - p.z, d = Math.hypot(dx, dz); if (d < .8) { p.target = null; if (this._goObj) { const o = this._goObj; this._goObj = null; if (Math.hypot(o.x - p.x, o.z - p.z) < FIGHT_R + 1) this.interact(); } } else { mx = dx / d; mz = dz / d; } }
      // 加速度緩衝：起步與停下更順
      const acc = Math.min(1, dt * (mx || mz ? 10 : 14)); p.vx = (p.vx || 0) + (mx - (p.vx || 0)) * acc; p.vz = (p.vz || 0) + (mz - (p.vz || 0)) * acc;
      const sp = Math.hypot(p.vx, p.vz); p.moving = sp > .06;
      if (p.moving) {
        let nx = p.x + p.vx * SPEED * dt, nz = p.z + p.vz * SPEED * dt;
        [nx, nz] = this._collide(nx, nz);
        const ok = (x, z) => this._okMove(x, z);
        if (ok(nx, nz)) { p.x = nx; p.z = nz; } else if (ok(nx, p.z)) { p.x = nx; p.vz *= .3; } else if (ok(p.x, nz)) { p.z = nz; p.vx *= .3; } else { p.vx = p.vz = 0; if (!this._path) p.target = null; } /* 撞到邊時把那個方向的速度去掉，不會一直往外推而卡住 */
        const side = mx * rx + mz * rz; if (Math.abs(side) > .2) p.flip = side < 0;
        p.t += dt * 9 * Math.min(1, sp * 1.2);
        // 行進時鏡頭緩慢跟到背後
        if (!(ix || iz) && p.target) { const want = Math.atan2(-mx, -mz); let d = want - this.cam.tYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.cam.tYaw += d * dt * .6; }
      }
      /* 高度：地形或腳下的平台；跳躍與掉落有重力 */
      { const S1 = this.scene, g = S1.G ? S1.G(p.x, p.z, p.y) : S1.H(p.x, p.z);
        if (this._jumpReq) { this._jumpReq = false; if (Math.abs(p.y - g) < .25 && !p.vy) { p.vy = 10.5; if (window.SFX) try { SFX.play('whoosh'); } catch (e) { } } }
        if (p.vy || p.y > g + .3) { p.vy = (p.vy || 0) - 30 * dt; p.y += p.vy * dt; if (p.y <= g) { p.y = g; p.vy = 0; } }
        else if (g > p.y) p.y = g; /* 上樓梯：立刻貼齊，避免陡的樓梯跟不上而掉下去 */ else p.y += (g - p.y) * Math.min(1, dt * 14); }
      // 轉身翻面：寬度縮放模擬翻牌
      p.face = (p.face == null ? 1 : p.face) + ((p.flip ? -1 : 1) - (p.face == null ? 1 : p.face)) * Math.min(1, dt * 12);
      // 撿道具
      for (const it of this.items) { if (!it.taken && Math.hypot(it.x - p.x, it.z - p.z) < PICK_R) { it.taken = true; this.cb.onPickup(it); } }
      // 提示
      const n = this.nearest(); if (n !== this._near) { this._near = n; this.cb.onNear(n); }
      if (this._marker) this._marker.t += dt;
      const S0 = this.scene;
      // 野外敵人：在原地附近閒晃，玩家靠近時停下來面向玩家
      for (const e of this.enemies) { if (e.boss) continue; if (!e.home) { e.home = [e.x, e.z]; e.wt = Math.random() * 2; }
        const dp = Math.hypot(p.x - e.x, p.z - e.z); if (dp < 9) { e.flip = p.x < e.x; continue; }
        e.wt -= dt; if (e.wt <= 0 || !e.goal) { const a = Math.random() * 6.283, r = 1.5 + Math.random() * 4.5; e.goal = [e.home[0] + Math.cos(a) * r, e.home[1] + Math.sin(a) * r]; e.wt = 2.5 + Math.random() * 3; }
        const gx = e.goal[0] - e.x, gz = e.goal[1] - e.z, gd = Math.hypot(gx, gz); if (gd > .2) { const sp = Math.min(gd, 2.4 * dt), nx = e.x + gx / gd * sp, nz = e.z + gz / gd * sp; if ((S0.blocked && S0.blocked(nx, nz)) || S0.H(nx, nz) < .35) { e.goal = null; e.wt = 0; continue; } e.x = nx; e.z = nz; e.y = (S0.Ho || S0.H)(e.x, e.z); e.flip = gx < 0; } } /* v147：敵人閒晃不會走進房子或水裡 */
      this._guide = this.guidePoint();
      if (this.autoGo) { const g = this._guide; if (!g || this.paused) this.autoGo = false; else { const d = Math.hypot(g.x - p.x, g.z - p.z);
        if (d < (g.npc ? 3 : 2.2)) { this.autoGo = false; p.target = null; }
        else { // 卡住時往側邊繞路
          /* v149：用 A* 找整條路；目標換了（或還沒有路）才重新找 */
          const ng = this._navGoal; if (!ng || Math.hypot(ng[0] - g.x, ng[1] - g.z) > 1.5 || (!this._path && !p.target)) { this._navGoal = [g.x, g.z]; this.navTo(g.x, g.z, g.npc ? 2.6 : 1.8); } } } }
      if (Object.values(this.keys).some(Boolean)) this.autoGo = false;
      if (this.escort) { const n = this.npcs.find(n => n.id === this.escort.id); if (n) { /* v149：護送的 NPC 沿著玩家走過的路跟上，不會穿牆 */
        const T = this._trail || (this._trail = [[n.x, n.z]]), lt = T[T.length - 1]; if (Math.hypot(p.x - lt[0], p.z - lt[1]) > .8) { T.push([p.x, p.z]); if (T.length > 600) T.splice(0, 200); }
        const d = Math.hypot(p.x - n.x, p.z - n.z); n.walking = d > 3.4; if (n.walking) { let tg = T[0]; while (T.length > 1 && Math.hypot(tg[0] - n.x, tg[1] - n.z) < .5) { T.shift(); tg = T[0]; } if (Math.hypot(p.x - n.x, p.z - n.z) > 30) { const q = T[Math.max(0, T.length - 6)]; n.x = q[0]; n.z = q[1]; T.splice(0, T.length - 6); }
          const dx = tg[0] - n.x, dz = tg[1] - n.z, dd = Math.hypot(dx, dz) || 1, sp = Math.min(dd, SPEED * .95 * dt); n.x += dx / dd * sp; n.z += dz / dd * sp; n.face = Math.atan2(dx, dz); }
        if (!this._escDone && Math.hypot(n.x - this.escort.to[0], n.z - this.escort.to[1]) < (this.escort.r || 6)) { this._escDone = true; this.cb.onEscortDone && this.cb.onEscortDone(); } } }
      if (this._spotCd > 0) this._spotCd -= dt;
      for (const g of this.guards) { const tg = g.path[(g.seg + 1) % g.path.length], gx = tg[0] - g.x, gz = tg[1] - g.z, gd = Math.hypot(gx, gz), sp = (g.speed || 5) * dt; if (gd <= sp) g.seg = (g.seg + 1) % g.path.length; else { g.x += gx / gd * sp; g.z += gz / gd * sp; const want = Math.atan2(gx, gz); g.face += Math.atan2(Math.sin(want - g.face), Math.cos(want - g.face)) * Math.min(1, dt * 6); }
        const px = p.x - g.x, pz = p.z - g.z, pd = Math.hypot(px, pz); if (pd < (g.view || 9)) { const a = Math.atan2(px, pz) - g.face; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < .7 || pd < 2.2) { if (!(this._spotCd > 0)) { this._spotCd = 1.5; this.cb.onSpotted && this.cb.onSpotted(g); } } } }
      if (this.beacon && !this._reached && Math.hypot(this.beacon.x - p.x, this.beacon.z - p.z) < this.beacon.r) { this._reached = true; this.cb.onReach && this.cb.onReach(); }
    }
    _collide(x, z) {
      const pr = 1.1;
      const all = this.scene.obstacles;
      for (let i = 0; i < all.length; i++) { const o = all[i], dx = x - o[0], dz = z - o[1], d = Math.hypot(dx, dz), m = o[2] + pr; if (d < m && d > 1e-4) { x = o[0] + dx / d * m; z = o[1] + dz / d * m; } }
      for (const n of this.npcs) { const dx = x - n.x, dz = z - n.z, d = Math.hypot(dx, dz), m = SCENES.lookScale(n.look) * 1.1 + pr; if (d < m && d > 1e-4) { x = n.x + dx / d * m; z = n.z + dz / d * m; } }
      for (const e of this.enemies) { const dx = x - e.x, dz = z - e.z, d = Math.hypot(dx, dz), m = (e.boss && !this.bossUnlocked ? 13.5 : 1.8) + pr; if (d < m && d > 1e-4) { x = e.x + dx / d * m; z = e.z + dz / d * m; } }
      /* 牆：身體高度和牆重疊才擋 */
      const W2 = this.scene.walls; if (W2 && W2.length) { const y = this.p.y, r2 = .55; for (const w of W2) { if (y + 1.7 <= w.y0 || y + .3 >= w.y1) continue; if (x < w.x0 - r2 || x > w.x1 + r2 || z < w.z0 - r2 || z > w.z1 + r2) continue; const dl = x - (w.x0 - r2), dr = (w.x1 + r2) - x, dn = z - (w.z0 - r2), df = (w.z1 + r2) - z, m = Math.min(dl, dr, dn, df); if (m === dl) x = w.x0 - r2; else if (m === dr) x = w.x1 + r2; else if (m === dn) z = w.z0 - r2; else z = w.z1 + r2; } }
      const EB = (this.scene.ext || 100) - 4, d = Math.hypot(x, z); if (this.scene.ext && this.scene.ext > 100) { x = Math.max(-EB, Math.min(EB, x)); z = Math.max(-EB, Math.min(EB, z)); } else if (d > 95) { x *= 95 / d; z *= 95 / d; } /* v149：新版大地圖用地圖邊界，不再把角色拉回半徑 95 以內 */
      return [x, z];
    }

    /* ---------- 繪製 ---------- */
    render(dt) {
      const r = this.r, p = this.p, S = this.scene, t = r.time; r.resize();
      let dy = this.cam.tYaw - this.cam.yaw; this.cam.yaw += dy * Math.min(1, dt * 8);
      // 鏡頭避障：鏡頭與角色之間有障礙物時把鏡頭拉近
      let want = this.cam.dist; const sy = Math.sin(this.cam.yaw), cy = Math.cos(this.cam.yaw), cp0 = Math.cos(this.cam.pitch);
      for (const o of S.obstacles) { const ox = o[0] - p.x, oz = o[1] - p.z; if (ox * ox + oz * oz > 1600) continue; for (let k = .25; k <= 1; k += .125) { const d = want * k, qx = sy * d * cp0, qz = cy * d * cp0; if ((qx - ox) ** 2 + (qz - oz) ** 2 < (o[2] * 1.5 + 1) ** 2) { want = Math.max(7, d - 2); break; } } }
      /* v146：被房子擋住時不要把鏡頭塞進牆裡，改成抬高視角從屋頂上方看 */
      const blk = want < this.cam.dist * .7; if (blk && S.maxStep) want = Math.max(want, this.cam.dist * .8);
      const pT = blk && S.maxStep ? Math.max(this.cam.pitch, .95) : this.cam.pitch; this.cam.pE = this.cam.pE == null ? pT : this.cam.pE + (pT - this.cam.pE) * Math.min(1, dt * (pT > this.cam.pE ? 6 : 2));
      this.cam.eff = this.cam.eff == null ? want : this.cam.eff + (want - this.cam.eff) * Math.min(1, dt * (want < this.cam.eff ? 10 : 3));
      const PE = this.cam.pE, cp = Math.cos(PE), eye = [p.x + Math.sin(this.cam.yaw) * this.cam.eff * cp, p.y + 2.5 + Math.sin(PE) * this.cam.eff, p.z + Math.cos(this.cam.yaw) * this.cam.eff * cp];
      const minY = S.H(eye[0], eye[2]) + 2; if (eye[1] < minY) eye[1] = minY;
      r.setCamera(eye, [p.x, p.y + 3, p.z], .9);
      if (this.chapter.id === 'dark' || this.chapter.id === 'skypiea') { if (Math.random() < dt * .12) this._flashT = .35; if (this._flashT > 0) { this._flashT -= dt; r.flash = Math.max(0, this._flashT) * (this.chapter.id === 'dark' ? .5 : .35); } else r.flash = 0; }
      r.begin();
      if (S.sky) r.draw(S.sky, M.trs(p.x, 0, p.z, 0, 1), { noFog: true, noCull: true, mat: 3 });
      r.draw(S.staticMesh, null, { mat: 1 });
      /* 屋頂：玩家走進房子時不畫，才看得到室內 */ if (S.roofs) for (const R of S.roofs) { if (p.x > R.x0 && p.x < R.x1 && p.z > R.z0 && p.z < R.z1) continue; r.draw(R.mesh, null, { mat: 1 }); }
      if (S.blade) S.dyn.windmills.forEach(([x, y, z], i) => r.draw(S.blade, M.mul(M.mul(M.trs(x, y, z, 0, 1), M.rz(t * .8 + i)), M.rx(Math.PI / 2))));
      if (S.cloud) S.dyn.clouds.forEach(([x, y, z, s, ph]) => r.draw(S.cloud, M.trs(x + Math.sin(t * .1 + ph) * 6, y + Math.sin(t * .4 + ph), z, ph, s)));
      if (S.bird && this.chapter.id !== 'fishman') for (let i = 0; i < 7; i++) { const a = t * (.25 + i * .03) + i * 1.3, R = 30 + i * 9; r.draw(S.bird, M.mul(M.trs(Math.cos(a) * R, 24 + i * 2 + Math.sin(t * 2 + i) * 1.5, Math.sin(a) * R, -a, 1.3), M.rz(Math.sin(t * 9 + i) * .35)), { noCull: true, tint: this.chapter.id === 'dark' ? [.3, .25, .35, 1] : [1, 1, 1, 1] }); }
      if (S.fishMesh) S.dyn.fish.forEach(([x, y, z, ph, c], i) => { const a = t * .4 + ph; r.draw(S.fishMesh, M.trs(x + Math.cos(a) * 12, y + Math.sin(t + ph) * .8, z + Math.sin(a) * 12, -a - Math.PI / 2, 1.4), { tint: E3.hex(c).concat(1) }); });
      if (S.petal) for (let i = 0; i < 40; i++) { const ph = i * 7.13, fx = p.x + ((i * 37) % 60) - 30 + Math.sin(t * .7 + ph) * 3, fz = p.z + ((i * 53) % 60) - 30, fy = S.H(fx, fz) + 12 - ((t * 1.6 + ph) % 12); r.draw(S.petal, M.mul(M.trs(fx, fy, fz, t + ph, 1), M.rx(t * 2 + ph)), { noCull: true }); }
      for (const n of this.npcs) { const sc = SCENES.lookScale(n.look); const lookAt = !n.walking && Math.hypot(n.x - p.x, n.z - p.z) < 9 ? Math.atan2(p.x - n.x, p.z - n.z) : n.face; n.face += Math.atan2(Math.sin(lookAt - n.face), Math.cos(lookAt - n.face)) * Math.min(1, dt * 5); r.draw(this.npcMeshes[n.look], M.trs(n.x, (S.Ho || S.H)(n.x, n.z) + Math.abs(Math.sin(t * (n.walking ? 9 : 2) + n.x)) * (n.walking ? .25 : .05), n.z, n.face, sc), { mat: 2 }); }
      for (const it of this.items) if (!it.taken) r.draw(this.itemMeshes[it.icon], M.trs(it.x, it.y + 1.4 + Math.sin(t * 2.4 + it.x) * .35, it.z, t * 1.5, 1.2));
      r.draw(S.water, M.trs(p.x - (p.x % 11.8), 0, p.z - (p.z % 11.8), 0, 1), { wave: true, alpha: S.waterAlpha < 1 ? false : false, tint: [1, 1, 1, 1] });
      // 影子
      r.sprite(null, p.x, p.y, p.z, 3.2, 2.2, { shadow: true });
      for (const e of this.enemies) r.sprite(null, e.x, e.y, e.z, e.boss ? 4.6 : 3.4, e.boss ? 3.2 : 2.4, { shadow: true });
      // 角色廣告板（由遠到近）
      const list = [];
      const pc = CHARACTERS[this.playerId];
      const bob = p.moving ? Math.pow(Math.abs(Math.sin(p.t)), 1.6) * .32 : Math.sin(t * 2.2) * .07, squash = p.moving ? 1 - Math.abs(Math.cos(p.t)) * .04 : 1 + Math.sin(t * 2.2) * .012;
      list.push({ url: pc.image, x: p.x, y: p.y + bob, z: p.z, h: 5.6 * squash, wk: Math.max(.08, Math.abs(p.face == null ? 1 : p.face)) / squash, flip: (p.face == null ? 1 : p.face) < 0, d: 0 });
      for (const e of this.enemies) { const hh = e.boss ? 8 : 5.8; list.push({ url: CHARACTERS[e.id].image, x: e.x, y: e.y + Math.sin(t * 1.8 + e.x) * .12, z: e.z, h: hh, flip: e.flip !== undefined ? !e.flip : true, d: Math.hypot(e.x - eye[0], e.z - eye[2]), glow: e.boss && !this.bossUnlocked ? .0 : 0, tint: [1, 1, 1, 1] }); }
      list.forEach(o => { if (!o.d) o.d = Math.hypot(o.x - eye[0], o.z - eye[2]); }); list.sort((a, b) => b.d - a.d);
      for (const o of list) { const rec = r.texture(o.url); const asp = rec.ready ? rec.w / rec.h : .75; r.sprite(o.url, o.x, o.y, o.z, o.h * asp * (o.wk || 1), o.h, { flip: o.flip, tint: o.tint }); }
      this.updateGuide();
      for (const c of this.chests) { const cy = S.H(c.x, c.z), f = c.face || 0; r.draw(this.chestBase, M.trs(c.x, cy - .45, c.z, f, 1), { mat: 1 }); if (c.opened) r.draw(this.chestLid, M.mul(M.trs(c.x - Math.sin(f) * .5, cy + .55, c.z - Math.cos(f) * .5, f, 1), M.rx(-1.1)), { mat: 1 }); else { r.draw(this.chestLid, M.trs(c.x, cy + .1, c.z, f, 1), { mat: 1 }); const d = Math.hypot(c.x - p.x, c.z - p.z); if (d < 16) r.draw(this.beaconMesh, M.trs3(c.x, cy - .9, c.z, t, .5, .5 + Math.sin(t * 4) * .1, .5), { alpha: true, noCull: true, tint: [1, .9, .5, .35 * (1 - d / 16)] }); } }
      for (const g of this.guards) { const gy = S.H(g.x, g.z); r.draw(this.npcMeshes[g.look], M.trs(g.x, gy + Math.abs(Math.sin(t * 6 + g.x)) * .08, g.z, g.face, 1), { mat: 2 }); r.draw(this.coneMesh, M.trs3(g.x, gy + .05, g.z, g.face, g.view || 9, 1, g.view || 9), { alpha: true, noCull: true, tint: [1, .35, .25, .3 + Math.sin(t * 4) * .06] }); }
      for (const m of this.digMarks) r.draw(this.moundMesh, M.trs(m[0], S.H(m[0], m[1]), m[1], 0, 1), { mat: 1 });
      if (this.beacon) { const by = this.beacon.y, pu = (t * .8) % 1; r.draw(this.beaconMesh, M.trs3(this.beacon.x, by - 1, this.beacon.z, t, 1.6 + Math.sin(t * 3) * .12, 2.6, 1.6 + Math.sin(t * 3) * .12), { alpha: true, noCull: true, tint: [1, .92, .55, .5] }); r.draw(this.beaconMesh, M.trs3(this.beacon.x, by - .9, this.beacon.z, 0, 1 + pu * 5, .02, 1 + pu * 5), { alpha: true, noCull: true, tint: [1, .85, .4, .55 * (1 - pu)] }); }
      if (this.target && this.target.type === 'npc') for (const n of this.npcs) if (this.target.ids.includes(n.id)) { const ny = (S.Ho || S.H)(n.x, n.z), pu = (t * .9 + n.x * .01) % 1, sc = SCENES.lookScale(n.look); r.draw(this.beaconMesh, M.trs3(n.x, ny - .95, n.z, 0, (1.3 + pu * 2.2) * sc, .02, (1.3 + pu * 2.2) * sc), { alpha: true, noCull: true, tint: [1, .82, .3, .7 * (1 - pu)] }); r.draw(this.beaconMesh, M.trs3(n.x, ny - .95, n.z, 0, 1.3 * sc, .03, 1.3 * sc), { alpha: true, noCull: true, tint: [1, .85, .35, .45] }); }
      // BOSS 屏障
      const boss = this.enemies.find(e => e.boss);
      if (boss && !this.bossUnlocked) r.draw(this.barrier, M.trs3(boss.x, boss.y - 1, boss.z, t * .3, 1, 1 + Math.sin(t * 2) * .03, 1), { alpha: true, noCull: true, tint: [.6, .85, 1, .22 + Math.sin(t * 3) * .05] });
      this._labels(eye);
      this._minimap();
    }
    _labels(eye) {
      const r = this.r, seen = new Set();
      const put = (key, x, y, z, html, cls, onclick) => {
        const s = r.project(x, y, z); if (!s || s.d > 75) return;
        let el = this.labelEls.get(key); if (!el) { el = document.createElement('div'); el.className = 'wlabel ' + cls; el.innerHTML = html; if (onclick) { el.onclick = onclick; el.classList.add('clickable'); } this.labels.appendChild(el); this.labelEls.set(key, el); }
        el.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%) scale(${Math.max(.72, Math.min(1.05, 26 / s.d + .3)).toFixed(3)})`;
        el.style.opacity = s.d > 60 ? (75 - s.d) / 15 : 1; seen.add(key);
      };
      const tgt = this.target;
      for (const n of this.npcs) { const h = SCENES.lookScale(n.look) * 3.6 + .4; const q = tgt && tgt.type === 'npc' && tgt.ids.includes(n.id); put('n' + n.id + (q ? 'q' : ''), n.x, S0(this, n) + h, n.z, (q ? '<b class="qmark">!</b>' : '') + `<span>${n.name}</span>`, 'npc' + (q ? ' qtarget' : ''), () => this.goTo(n)); }
      if (typeof crewLv === 'function' && CHARACTERS[this.playerId]) { const lv = crewLv(this.playerId), tr = TIERS[tierOf(lv)]; put('me', this.p.x, this.p.y + .05, this.p.z, `<span class="me-tag"><b>${CHARACTERS[this.playerId].name}</b><small style="--c:${tr.color}">LV ${lv}・${tr.name}</small></span>`, 'me'); }
      for (const e of this.enemies) { const lock = e.boss && !this.bossUnlocked; const h = e.boss ? 8.6 : 6.4; put('e' + e.id + (lock ? 'l' : ''), e.x, e.y + h, e.z, `${e.boss ? '<i class="crown"></i>' : ''}<em class="lv">LV ${e.lv || ''}</em><span>${CHARACTERS[e.id].name}</span>${lock ? '<em>屏障中</em>' : ''}`, 'foe' + (e.boss ? ' boss' : '') + (lock ? ' locked' : ''), lock ? null : () => this.goTo(e)); }
      for (const it of this.items) if (!it.taken) put('i' + it.idx, it.x, it.y + 3.2, it.z, `<span>${it.label}</span>`, 'item');
      if (this.beacon) put('bc', this.beacon.x, this.beacon.y + 9, this.beacon.z, `<b class="qmark">▼</b><span>${this.beacon.label}</span>`, 'npc qtarget beacon', () => { this.p.target = [this.beacon.x, this.beacon.z]; });
      if (this._marker && this._marker.t < .8 && this.p.target) put('mk', this._marker.x, this.scene.H(this._marker.x, this._marker.z) + .5, this._marker.z, '<i class="dot"></i>', 'marker'); 
      for (const [k, el] of this.labelEls) if (!seen.has(k)) { el.remove(); this.labelEls.delete(k); }
    }
    _minimap() {
      const cv = this.mini; if (!cv || !cv.offsetParent) return; const now = performance.now(); if (this._mt && now - this._mt < 90) return; this._mt = now;
      const ctx = cv.getContext('2d'), W = cv.width, EX = this.scene.ext || 100, sc = W / (EX * 2);
      if (!this._miniBase) {
        const b = document.createElement('canvas'); b.width = b.height = W; const bx = b.getContext('2d'); const img = bx.createImageData(W, W);
        const land = E3.hex(this.chapter.env.ground), sea = this.chapter.id === 'skypiea' ? [.93, .96, 1] : [.1, .25, .35];
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const wx = x / sc - EX, wz = y / sc - EX, h = this.scene.H(wx, wz), i = (y * W + x) * 4; const c = h > .35 ? land.map(v => Math.min(1, v * 1.25 + h * .02)) : sea; img.data[i] = c[0] * 255; img.data[i + 1] = c[1] * 255; img.data[i + 2] = c[2] * 255; img.data[i + 3] = 255; }
        bx.putImageData(img, 0, 0); this._miniBase = b;
      }
      ctx.clearRect(0, 0, W, W); ctx.save(); ctx.beginPath(); ctx.arc(W / 2, W / 2, W / 2 - 1, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(this._miniBase, 0, 0);
      const dot = (x, z, r, c, ring) => { ctx.beginPath(); ctx.arc((x + EX) * sc, (z + EX) * sc, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); if (ring) { ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.stroke(); } };
      const tg = this.target;
      for (const it of this.items) if (!it.taken) dot(it.x, it.z, 3, '#7fe3ff');
      for (const n of this.npcs) { const q = tg && tg.type === 'npc' && tg.ids.includes(n.id); dot(n.x, n.z, 3, q ? '#ffd26c' : '#f4ead2', q ? '#fff' : null); }
      if (this.beacon) dot(this.beacon.x, this.beacon.z, 5, '#ffd26c', '#fff');
      for (const g of this.guards) dot(g.x, g.z, 3.5, '#ff4a3a', '#fff');
      if (this._guide) { const G = this._guide; ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,210,108,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo((this.p.x + EX) * sc, (this.p.z + EX) * sc); ctx.lineTo((G.x + EX) * sc, (G.z + EX) * sc); ctx.stroke(); ctx.restore(); if (Math.floor(now / 300) % 2) dot(G.x, G.z, 6, '#ffd26c', '#c8322b'); }
      for (const e of this.enemies) dot(e.x, e.z, e.boss ? 5 : 3.2, e.boss ? (this.bossUnlocked ? '#ff5a4a' : '#8f9bb0') : '#e8553b', e.boss ? '#ffd26c' : null);
      const px = (this.p.x + EX) * sc, pz = (this.p.z + EX) * sc, a = -this.cam.yaw;
      ctx.translate(px, pz); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2.5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#0a1f33'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    snapshot() { return this.canvas.toDataURL('image/webp', .85); }
  }
  function S0(w, n) { return (w.scene.Ho || w.scene.H)(n.x, n.z); } /* v147：天界平台上的 NPC 站在平台上 */
  global.World = World;
})(window);
/* 跳躍按鈕（手機）：按下就跳 */
document.addEventListener('DOMContentLoaded', () => { const b = document.getElementById('jumpBtn'); if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (typeof WORLD !== 'undefined' && WORLD) WORLD._jumpReq = true; }); });
/* 跳躍按鈕：和電話蟲按鈕上下置中對齊、放在它左邊（右手大拇指區），不同裝置都不會偏移 */
(function () {
  function place() { const j = document.getElementById('jumpBtn'), d = document.getElementById('denden'); if (!j || !d || !d.offsetParent || !j.offsetParent) return; const r = d.getBoundingClientRect(), pr = j.offsetParent.getBoundingClientRect(); if (!r.width) return;
    const w = j.offsetWidth, h = j.offsetHeight; j.style.setProperty('top', Math.round(r.top + r.height / 2 - h / 2 - pr.top) + 'px', 'important'); j.style.setProperty('left', Math.round(r.left - 14 - w - pr.left) + 'px', 'important'); j.style.setProperty('bottom', 'auto', 'important'); j.style.setProperty('right', 'auto', 'important'); }
  window.placeJumpBtn = place;
  window.addEventListener('resize', () => requestAnimationFrame(place)); setInterval(place, 800);
  window.addEventListener('DOMContentLoaded', () => { if (window.ResizeObserver) { const d = document.getElementById('denden'); if (d) new ResizeObserver(place).observe(d); } });
})();
