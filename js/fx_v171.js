/* v171 招式差異化（使用者 11/07 13:48「變化可能有點太少，要再添加一些差異性」）：
   v106 主題式編排讓 45 位角色的四招幾乎長一樣（同主題同衝擊，只差招式名）。這裡改寫這些「主題式」招式（不動專屬編排）：
   ① 出手方式：依招式名稱關鍵字（斬、拳、砲、腳、雷、龍、雨……）決定，沒有關鍵字就依「角色＋招式序號」輪替
      衝刺、飛彈、躍擊、地面衝擊波、天降、瞬移六種，同一角色的四招不會重複。
   ② 命中排列：單點、三連錯位、十字交叉、縱向貫穿輪替。
   ③ 招牌元素：關鍵字對應的額外元素（斬痕、拳風環、光束、新月踢、落雷、火柱、冰刺、龍捲、龍、花瓣、羽翼、流星雨、浪、地裂、影渦、光芒、鎖環……）。
   ④ 主色：單數招與雙數招互換主題的主色／副色，同角色的招式一眼就分得出來。
   ⑤ 輔助／削弱：光柱、法陣、環繞光點、護盾四種輪替；削弱有鎖環、落下的印記、黑渦三種。
   ‧ 等待全部用 sleep（跟倍速）。粒子數在手機乘 0.6。不改傷害結算時機（編排結束＝命中）。
   ‧ 載入順序：fx_v106.js 之後（同樣在 DOMContentLoaded 註冊，排在後面所以會覆蓋 v106 產生的編排）。 */
(function () {
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const wait = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(r => setTimeout(r, ms)));
  const LOW = typeof LOWFX !== 'undefined' && LOWFX, N = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const KW = [[/斬|刀|劍|剣|居合|一閃|太刀|鬼/, 'slash'], [/砲|炮|光線|射擊|彈|弾|銃|槍|ガン|加農/, 'shot'], [/腳|脚|蹴|踢|腿|ジャンブ/, 'kick'], [/雷|電|鳴|霆/, 'bolt'],
    [/炎|火|焰|焼|燒|熱|爆/, 'fire'], [/冰|凍|雪|氷|霜/, 'ice'], [/風|嵐|旋|竜巻|龍捲|颶/, 'wind'], [/龍|竜|蛇|大蛇/, 'dragon'], [/花|櫻|桜|薔薇|蓮/, 'petal'], [/鳥|翼|羽|鷹|鳳/, 'wing'],
    [/雨|流星|星|隕/, 'rain'], [/波|浪|海|水|潮/, 'wave'], [/地|震|岩|山|碎|崩|裂|大地/, 'quake'], [/影|闇|黑|暗|夜/, 'shadow'], [/光|輝|陽|日/, 'light'], [/毒|腐/, 'poison'],
    [/指|突|刺|針|穿/, 'pierce'], [/連|亂|千|百|萬|無數|機關/, 'multi'], [/鎖|縛|絲|線|網|鏈/, 'bind'], [/拳|打|撃|擊|鐵|錘|掌|頭/, 'fist']];
  const kwOf = n => { for (const [re, k] of KW) if (re.test(n || '')) return k; return null; };
  const APPROACH = ['dash', 'shot', 'leap', 'ground', 'sky', 'blink'];
  const BY_KW = { shot: 'shot', pierce: 'shot', bolt: 'sky', rain: 'sky', kick: 'leap', quake: 'ground', wave: 'ground', dragon: 'shot', wind: 'ground', slash: 'blink', light: 'sky' };
  const LAYOUT = ['single', 'triple', 'cross', 'pierce'];
  const X = () => FXE.P;
  const groundY = A => A.t.y + 70;

  /* ---------- 小型自製元素（不用 shadowBlur，便宜） ---------- */
  function orb(x1, y1, x2, y2, col, life, size) { const s = size || 26; return FXE.add({ add: true, life: life || .32, draw(c, k) { const e = k < 1 ? 1 - Math.pow(1 - k, 2) : 1;
    for (let j = 4; j >= 0; j--) { const q = Math.max(0, e - j * .06), x = x1 + (x2 - x1) * q, y = y1 + (y2 - y1) * q - Math.sin(q * Math.PI) * 30, r = s * (1 - j * .16), g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.35, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = j ? .35 : 1; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } } }); }
  function rune(x, y, col, r, life, flat) { const n = 12, f = flat || .32; return FXE.add({ add: true, life: life || .9, draw(c, k, dt, t) { const a = Math.min(1, k * 4) * (1 - Math.max(0, k - .7) / .3), rr = r * (0.6 + .4 * Math.min(1, k * 3));
    c.translate(x, y); c.scale(1, f); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, rr * .72, 0, TAU); c.stroke();
    c.rotate(t * 1.8); for (let i = 0; i < n; i++) { const q = i / n * TAU; c.save(); c.rotate(q); c.fillStyle = i % 3 ? col : '#ffffff'; c.fillRect(rr * .76, -3, rr * .2, 6); c.restore(); }
    c.rotate(-t * 3.2); c.beginPath(); for (let i = 0; i < 6; i++) { const q = i / 6 * TAU; c.lineTo(Math.cos(q) * rr * .62, Math.sin(q) * rr * .62); } c.closePath(); c.stroke(); } }); }
  function orbit(x, y, col, life) { const ps = []; for (let i = 0; i < N(10); i++) ps.push({ a: i / 10 * TAU, r: R(90, 140), s: R(4, 8), h: R(-60, 40) });
    return FXE.add({ add: true, life: life || 1, draw(c, k, dt, t) { ps.forEach(p => { const a = p.a + t * 5, px = x + Math.cos(a) * p.r, py = y + p.h + Math.sin(a) * p.r * .3, front = Math.sin(a) > 0; c.globalAlpha = (front ? 1 : .45) * (1 - k * .8);
      const g = c.createRadialGradient(px, py, 0, px, py, p.s * 2.4); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, py, p.s * 2.4, 0, TAU); c.fill(); }); } }); }
  function dome(x, y, col, life) { return FXE.add({ add: true, life: life || .9, draw(c, k) { const e = 1 - Math.pow(1 - Math.min(1, k * 2.5), 3), r = 150 * e; c.globalAlpha = (1 - Math.max(0, k - .6) / .4) * .8;
    const g = c.createRadialGradient(x, y, r * .6, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.85, col); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.ellipse(x, y, r, r * .3, 0, 0, Math.PI); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.globalAlpha *= .7; for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(x, y, r, r * i / 4, 0, Math.PI, 0); c.stroke(); } } }); }
  function sigil(x, y, col) { return FXE.add({ add: true, life: .7, draw(c, k) { const yy = y - 220 + 220 * Math.min(1, k * 2.2), a = k < .45 ? 1 : 1 - (k - .45) / .55; c.globalAlpha = a; c.translate(x, yy); c.scale(1, .5); c.strokeStyle = col; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.stroke(); c.beginPath(); for (let i = 0; i < 5; i++) { const q = -Math.PI / 2 + i * 4 * Math.PI / 5; c.lineTo(Math.cos(q) * 64, Math.sin(q) * 64); } c.closePath(); c.stroke(); } }); }
  function chains(x, y, col) { return FXE.add({ life: .8, draw(c, k) { const a = k < .7 ? 1 : (1 - k) / .3; c.globalAlpha = a; c.lineWidth = 3; for (let j = 0; j < 3; j++) { const ang = j * TAU / 3 + k * 1.2; c.save(); c.translate(x, y); c.scale(1, .45); c.rotate(ang);
    for (let i = 0; i < 14; i++) { const q = i / 14 * Math.PI * 1.2 * Math.min(1, k * 3); c.strokeStyle = i % 2 ? '#d8d8e8' : col; c.beginPath(); c.ellipse(Math.cos(q) * 120, Math.sin(q) * 120, 10, 6, q + Math.PI / 2, 0, TAU); c.stroke(); } c.restore(); } } }); }

  /* ---------- 招牌元素 ---------- */
  const SIG = {
    slash: (A, c, b) => { for (let i = 0; i < (b ? 3 : 2); i++) X().slash(A.t.x, A.t.y, { a: -2.5 + i * 1.1, span: 1.9, r: b ? 190 : 140, w: b ? 22 : 14, color: i % 2 ? '#ffffff' : c[0], life: .3 }); },
    shot: (A, c, b) => X().beam(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y - 10, { w: b ? 34 : 20, c1: '#ffffff', c2: c[0], life: .35 }),
    pierce: (A, c) => { for (let i = 0; i < 3; i++) X().beam(A.t.x - A.d * 200, A.t.y - 30 + i * 30, A.t.x + A.d * 60, A.t.y - 20 + i * 24, { w: 6, c1: '#ffffff', c2: c[0], life: .22 }); },
    kick: (A, c) => X().crescent(A.f.x + A.d * 40, A.f.y + 20, A.t.x, A.t.y - 30, { color: c[0], size: 80, life: .38 }),
    bolt: (A, c, b) => { for (let i = 0; i < (b ? 4 : 2); i++) setTimeout(() => X().bolt(A.t.x + R(-60, 60), -20, A.t.x + R(-20, 20), A.t.y, { color: i % 2 ? '#ffffff' : c[0], w: 6, life: .25 }), i * 70); },
    fire: (A, c, b) => X().pillar(A.t.x, A.t.y, { w: b ? 120 : 80, color: c[0], life: .6 }),
    ice: (A, c, b) => X().spikes(A.t.x, groundY(A) - 20, { color: '#dff6ff', n: b ? 11 : 7 }),
    wind: (A, c) => X().tornado(A.t.x, groundY(A), { smoke: c[1] === '#ffffff' ? '#e8f0ff' : c[1], h: 260, w: 110, life: .9 }),
    dragon: (A, c, b) => X().serpent(A.f.x, A.f.y + 30, A.t.x + A.d * 60, A.t.y - 30, { body: c[0], belly: '#ffffff', eye: '#ffef5a', horn: true, life: b ? 1 : .75, len: b ? 460 : 340, w: b ? 54 : 40 }),
    petal: (A, c, b) => X().particles({ x: A.t.x, y: A.t.y - 60, n: N(b ? 40 : 24), spd: [80, 260], life: [.7, 1.2], size: [6, 12], colors: ['#ffd0e8', '#ffffff', c[0]], shape: 'petal', g: 60, add: false }),
    wing: (A, c) => X().wings(A.t.x, A.t.y - 30, { color: c[0], life: .6 }),
    rain: (A, c, b) => { for (let i = 0; i < N(b ? 10 : 6); i++) setTimeout(() => X().beam(A.t.x + R(-160, 160) - A.d * 120, -30, A.t.x + R(-80, 80), A.t.y + R(-30, 50), { w: 5, c1: '#ffffff', c2: c[0], life: .22 }), i * 45); },
    wave: (A, c) => X().wave(A.f.x, A.t.x + A.d * 40, groundY(A), { color: c[0], h: 150, life: .6 }),
    quake: (A, c, b) => { X().cracks(A.t.x, groundY(A) - 10, { n: b ? 12 : 8, len: b ? 280 : 190, color: c[1] }); X().puffs(A.t.x, groundY(A), { n: N(10), rad: 150, life: .8, color: '#e8dcc8' }); },
    shadow: (A, c) => X().vortex(A.t.x, A.t.y, { r: 120, color: c[1], core: '#05000a', rim: c[0], arms: 5, spin: 9, life: .55 }),
    light: (A, c, b) => X().rays(A.t.x, A.t.y, { r: b ? 300 : 210, n: b ? 16 : 10, c1: 'rgba(255,245,200,.9)' }),
    poison: (A, c) => X().puffs(A.t.x, A.t.y, { n: N(12), rad: 130, life: .9, color: '#c88aff' }),
    multi: (A, c) => { for (let i = 0; i < 5; i++) setTimeout(() => X().burst(A.t.x + R(-60, 60), A.t.y + R(-60, 40), { r: 60, color: i % 2 ? '#ffffff' : c[0] }), i * 55); },
    bind: (A, c) => chains(A.t.x, A.t.y, c[0]),
    fist: (A, c, b) => { X().ring(A.t.x, A.t.y, { r1: b ? 260 : 180, color: '#ffffff', w: 6, life: .3 }); X().speedLines(A.t.x, A.t.y, { life: .25, a: .5, n: 30 }); }
  };

  /* ---------- 出手方式 ---------- */
  const GO = {
    dash: async (A, c, th) => { moveFighter(A.S, 'dash'); await wait(260); },
    shot: async (A, c, th) => { moveFighter(A.S, 'recoil'); orb(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y - 10, c[0], .3, 28); await wait(280); },
    leap: async (A, c, th) => { moveFighter(A.S, 'leap'); await wait(380); },
    ground: async (A, c, th) => { moveFighter(A.S, 'stomp'); await wait(160); const n = 5; for (let i = 0; i < n; i++) { const q = (i + 1) / n, x = A.f.x + (A.t.x - A.f.x) * q;
      setTimeout(() => { X().burst(x, groundY(A) - 10, { r: 50 + q * 40, color: c[i % 2] }); X().cracks && i === n - 1 && X().cracks(x, groundY(A) - 10, { n: 5, len: 120, color: c[1] }); }, i * 55); } await wait(n * 55 + 40); },
    sky: async (A, c, th) => { moveFighter(A.S, 'float'); X().glow(A.t.x, A.t.y - 220, { color: c[0], r: 110, life: .45 }); await wait(240); X().beam(A.t.x, -40, A.t.x, A.t.y + 20, { w: 30, c1: '#ffffff', c2: c[0], life: .3 }); await wait(80); },
    blink: async (A, c, th) => { X().glow(A.f.x, A.f.y, { color: c[0], r: 120, life: .25 }); moveFighter(A.S, 'dash'); await wait(120); X().speedLines(A.t.x, A.t.y, { life: .22, a: .6, n: 36 }); await wait(140); }
  };
  async function layout(kind, A, th, big) { const at = (dx, dy) => Object.assign({}, A, { t: { x: A.t.x + dx, y: A.t.y + dy } });
    if (kind === 'triple') { for (let i = 0; i < 3; i++) { SFX.play(i === 2 ? 'explode' : 'hit'); th.impact(at((i - 1) * 46, (i % 2 ? -36 : 24)), big && i === 2); await wait(85); } }
    else if (kind === 'cross') { th.impact(A, big); X().slash(A.t.x, A.t.y, { a: -2.36, span: .1, r: 170, w: 10, color: '#ffffff', life: .26 }); X().slash(A.t.x, A.t.y, { a: -.78, span: .1, r: 170, w: 10, color: th.c[0], life: .26 }); }
    else if (kind === 'pierce') { th.impact(A, big); X().beam(A.t.x - A.d * 160, A.t.y, A.t.x + A.d * 220, A.t.y, { w: big ? 26 : 16, c1: '#ffffff', c2: th.c[0], life: .26 }); }
    else th.impact(A, big); }

  const say = (A, at, n, c) => X().text(at.x, at.y - 160, n, { size: 52, color: '#ffffff', color2: c[1] === '#ffffff' ? c[0] : c[1] });

  function make(id, i, th, s, kindOf) {
    const k = kindOf(s), n = s.name, kw = kwOf(n), h = hash(id), sw = i % 2 === 1, c = sw ? [th.c[1], th.c[0]] : th.c.slice();
    if (c[0] === '#ffffff' || c[0] === '#fffbe0') c.reverse();
    const T = Object.assign({}, th, { c });
    const ap = (kw && BY_KW[kw]) || APPROACH[(i + h) % APPROACH.length], lay = LAYOUT[(i + (h >> 3)) % LAYOUT.length], sig = SIG[kw] || null;
    return async A => {
      FXE.ensure();
      if (k === 'buff' || k === 'heal') { const col = k === 'heal' ? '#9dffb8' : c[0], v = (i + h) % 4; SFX.play(k === 'heal' ? 'heal' : 'buff'); moveFighter(A.S, 'float');
        if (v === 0) X().pillar(A.f.x, A.f.y, { w: 90, color: col, life: .8 }); else if (v === 1) rune(A.f.x, A.f.y + 60, col, 150, .9); else if (v === 2) orbit(A.f.x, A.f.y, col, 1); else dome(A.f.x, A.f.y + 60, col, .9);
        X().particles({ x: A.f.x, y: A.f.y + 70, n: N(18), spd: [80, 220], ang: [-1.95, -1.2], life: [.5, .9], size: [3, 7], colors: [col, '#ffffff'], shape: 'spark', add: true, g: 0 });
        if (k === 'buff') { th.impact(Object.assign({}, A, { t: A.f }), false); if (sig) try { sig(Object.assign({}, A, { t: A.f }), c, false); } catch (e) { } }
        await wait(520); say(A, A.f, n, c); return; }
      if (k === 'hex') { SFX.play('dark'); const v = (i + h) % 3; if (v === 0) chains(A.t.x, A.t.y, c[0]); else if (v === 1) sigil(A.t.x, A.t.y, c[0]); else X().vortex(A.t.x, A.t.y, { r: 130, color: c[1], core: '#05000a', rim: c[0], arms: 5, spin: 8, life: .6 });
        await wait(200); th.impact(A, false); if (sig) try { sig(A, c, false); } catch (e) { } await wait(320); say(A, A.t, n, c); return; }
      const big = k === 'big';
      X().glow(A.f.x, A.f.y - 10, { color: c[0], r: big ? 170 : 110, life: .35 }); if (big) rune(A.f.x, A.f.y + 60, c[0], 130, .6); await wait(big ? 240 : 120);
      await GO[ap](A, c, T);
      if (k === 'multi') { for (let j = 0; j < 4; j++) { SFX.play(j % 2 ? 'hit' : 'punch'); const B = Object.assign({}, A, { t: { x: A.t.x + R(-50, 50), y: A.t.y + R(-50, 40) } }); th.impact(B, false); await wait(80); } }
      else { SFX.play(big ? 'explode' : 'punch'); await layout(lay, A, T, big); }
      if (sig) try { sig(A, c, big); } catch (e) { }
      X().flash('#ffffff', big ? .22 : .12, .14); X().ring(A.t.x, A.t.y, { r1: big ? 240 : 160, color: c[0], w: big ? 9 : 5, life: .32 }); if (big && typeof shake === 'function') shake();
      say(A, A.t, n, c); };
  }

  window.addEventListener('DOMContentLoaded', () => {
    const T = window.FX_THEMES; if (!T || typeof CHOREO === 'undefined') return; let cnt = 0;
    Object.entries(T.WHO).forEach(([id, t]) => { const ch = CHARACTERS[id], th = T.TH[t]; if (!ch || !th || !CHOREO[id]) return;
      ch.skills.forEach((s, i) => { const f = CHOREO[id][i]; if (!f || s.ultimate || !/FXE\.ensure\(\); await fn\(A\)/.test(f.toString())) return; const fn = make(id, i, th, s, T.kindOf);
        CHOREO[id][i] = async A => { try { await fn(A); } catch (e) { console.warn(e); } }; CHOREO[id][i].__v171 = 1; cnt++; }); });
    window.FX171 = { count: cnt, kwOf, make };
  });
})();

/* v171 自動畫質：技能特效播放中實際量測幀率，連續偏低就自動降級（不跳提示）：
   第 1 級 3D 特效解析度降到手機 0.75／電腦 1；第 2 級關閉 3D 特效層（泛光與 2D 特效保留）。
   降級記在 sessionStorage，本次開遊戲有效；重新開啟會重新判斷（設定頁的「技能特效／畫質」仍是使用者的選擇，不會被改）。 */
(function () {
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  let tier = 0; try { tier = +sessionStorage.getItem('op_fxauto') || 0; } catch (e) { }
  function apply() { window.__fx3dDpr = tier >= 1 ? (MOB ? .75 : 1) : 0; window.__fxAuto3DOff = tier >= 2; }
  apply();
  let active = 0, raf = 0, last = 0, buf = [];
  function loop(t) { raf = 0; const dt = t - last; last = t; if (dt > 0 && dt < 1000) buf.push(dt);
    if (buf.length >= 40) { const s = buf.slice().sort((a, b) => a - b), med = s[s.length >> 1]; buf = [];
      if (med > 42 && tier < 2) { tier++; apply(); try { sessionStorage.setItem('op_fxauto', tier); } catch (e) { } window.dispatchEvent(new CustomEvent('fxauto', { detail: tier })); } }
    if (performance.now() - active < 400) raf = requestAnimationFrame(loop); else buf = []; }
  function kick() { active = performance.now(); if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  window.addEventListener('DOMContentLoaded', () => { if (!window.FXE) return; const _a = FXE.add; FXE.add = function () { kick(); return _a.apply(this, arguments); }; });
  window.FXAUTO = { get tier() { return tier; }, reset() { tier = 0; apply(); try { sessionStorage.removeItem('op_fxauto'); } catch (e) { } } };
})();
