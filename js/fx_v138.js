/* v138 特效質感升級（全角色通用的一層，不改各招式的編排）：
   ① 泛光（Bloom）：特效畫布每幀縮小複製到 #bBloom，用 GPU 模糊後以「濾色」疊回去——所有光、火、雷、斬擊都會發光暈開。
      取代手機上把 shadowBlur 降到三成的作法（手機原本幾乎沒有光暈，是看起來廉價的主因）。
   ② 命中：頓幀（hit-stop 約 70ms）、目標色差殘影（紅／青錯位）、拖尾火花、雙層衝擊波、餘燼。
   ③ 出招：背景壓暗＋暗角，讓特效成為焦點；施放者描上招式顏色的輪廓光。奧義另加電影黑邊。
   狀態：示意中，預設關閉；localStorage op_fxpro = '1' 才開啟（等使用者同意後再改成預設開啟）。 */
(function () {
  const on = () => { try { return localStorage.getItem('op_fxpro') === '1'; } catch (e) { return false; } }; /* 等使用者同意前預設關閉（op_fxpro = '1' 才開啟） */
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const COL = { blue: '#78d2ff', gold: '#ffd26e', red: '#ff7850', purple: '#b07cff', green: '#78ffaa' };

  /* ---------- ① 泛光 ---------- */
  let bloom = null, bctx = null, braf = 0, idle = 0;
  function ensureBloom() { const cv = $('bCanvas'); if (!cv) return null; if (!bloom) { bloom = document.createElement('canvas'); bloom.id = 'bBloom'; bloom.className = 'b-canvas b-bloom'; bloom.setAttribute('aria-hidden', 'true'); cv.insertAdjacentElement('afterend', bloom); bctx = bloom.getContext('2d'); } return cv; }
  function bloomLoop() { braf = 0; const cv = ensureBloom(); if (!cv || !on()) return; const w = Math.max(1, Math.round(cv.width / 4)), h = Math.max(1, Math.round(cv.height / 4));
    if (bloom.width !== w || bloom.height !== h) { bloom.width = w; bloom.height = h; }
    const s = cv.style, b = bloom.style; if (b.left !== s.left || b.top !== s.top || b.width !== s.width || b.height !== s.height) { b.left = s.left; b.top = s.top; b.width = s.width; b.height = s.height; b.right = b.bottom = 'auto'; }
    bctx.clearRect(0, 0, w, h); bctx.drawImage(cv, 0, 0, w, h);
    const vis = typeof currentScreen === 'undefined' || currentScreen === 'battleScreen';
    if (vis && performance.now() - idle < 2500) braf = requestAnimationFrame(bloomLoop); else bctx.clearRect(0, 0, w, h); }
  function kick() { idle = performance.now(); if (!braf) braf = requestAnimationFrame(bloomLoop); }

  /* ---------- ② 命中 ---------- */
  let stopUntil = 0;
  function hitStop(ms) { const t = performance.now(); if (t < stopUntil) return; stopUntil = t + ms; const el = [$('bFL'), $('bFR'), $('bArena')].filter(Boolean); const anims = []; el.forEach(e => e.getAnimations({ subtree: true }).forEach(a => { if (a.playState === 'running') { a.pause(); anims.push(a); } })); setTimeout(() => anims.forEach(a => { try { a.play(); } catch (e) { } }), ms); }
  function chroma(side) { const img = $('bImg' + side); if (!img) return; img.animate([{ filter: 'drop-shadow(-7px 0 0 rgba(255,40,80,.85)) drop-shadow(7px 0 0 rgba(40,220,255,.85)) brightness(1.8)' }, { filter: 'drop-shadow(-3px 0 0 rgba(255,40,80,.5)) drop-shadow(3px 0 0 rgba(40,220,255,.5)) brightness(1.2)', offset: .4 }, { filter: 'none' }], { duration: 260, easing: 'ease-out' }); }
  function streaks(x, y, col, n, big) { const ps = []; const N = Math.round(n * (LOWFX ? .7 : 1)); for (let i = 0; i < N; i++) { const a = R(0, TAU), v = R(260, big ? 900 : 650); ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - R(0, 120), l: R(.25, .55), w: R(1.5, 3.5) }); }
    FXE.add({ add: true, life: .6, draw(c, k, dt) { ps.forEach(p => { if (p.dead) return; p.vx *= .9; p.vy = p.vy * .9 + 900 * dt; const ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt; const a = Math.max(0, 1 - k / p.l); if (!a) { p.dead = 1; return; }
      const tx = p.x - p.vx * .045, ty = p.y - p.vy * .045, g = c.createLinearGradient(tx, ty, p.x, p.y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.6, col); g.addColorStop(1, '#fff');
      c.globalAlpha = a; c.strokeStyle = g; c.lineWidth = p.w; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(p.x, p.y); c.stroke(); }); } }); }
  function shock(x, y, col, big) { const r1 = big ? 260 : 170; FXE.add({ add: true, life: big ? .55 : .42, draw(c, k) { const e = 1 - Math.pow(1 - k, 3), r = 20 + r1 * e;
      [[1, 18, .9], [.82, 8, .55]].forEach(([m, w, a]) => { const rr = r * m, g = c.createRadialGradient(x, y, Math.max(0, rr - w * 2), x, y, rr + w); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.6, col); g.addColorStop(.8, '#ffffff'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = a * (1 - k); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rr + w, (rr + w) * .62, 0, 0, TAU); c.fill(); }); } });
    FXE.add({ add: true, life: .14, draw(c, k) { const r = (big ? 80 : 55) * (1 + k * .5), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(.3, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = .6 * (1 - k); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } }); }
  function embers(x, y, col, n) { const ps = []; for (let i = 0; i < n; i++) ps.push({ x: x + R(-60, 60), y: y + R(-50, 40), vx: R(-60, 60), vy: R(-140, -30), s: R(2, 5), ph: R(0, TAU), l: R(.6, 1) });
    FXE.add({ add: true, life: 1.3, draw(c, k, dt, t) { ps.forEach(p => { p.x += (p.vx + Math.sin(t * 4 + p.ph) * 30) * dt; p.y += p.vy * dt; p.vy *= .99; const a = Math.max(0, 1 - k / p.l); c.globalAlpha = a; c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, p.s * .5, 0, TAU); c.fill(); c.globalAlpha = a * .6; c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, p.s * 1.6, 0, TAU); c.fill(); }); } }); }

  /* ---------- ③ 出招焦點 ---------- */
  let focusN = 0;
  function focus(onoff, ult) { const scr = $('battleScreen'); if (!scr) return; if (!scr.querySelector('.fxp-bars')) scr.insertAdjacentHTML('beforeend', '<i class="fxp-bars top" aria-hidden="true"></i><i class="fxp-bars bot" aria-hidden="true"></i>'); focusN = Math.max(0, focusN + (onoff ? 1 : -1)); scr.classList.toggle('fxp-focus', focusN > 0); if (ult !== undefined) scr.classList.toggle('fxp-ult', !!ult && focusN > 0); }
  function rim(side, col) { const img = $('bImg' + side); if (!img) return; img.animate([{ filter: 'none' }, { filter: `drop-shadow(0 0 2px #fff) drop-shadow(0 0 14px ${col}) drop-shadow(0 0 28px ${col})`, offset: .25 }, { filter: `drop-shadow(0 0 2px #fff) drop-shadow(0 0 14px ${col}) drop-shadow(0 0 28px ${col})`, offset: .75 }, { filter: 'none' }], { duration: 1100, easing: 'ease-in-out' }); }
  const skillCol = s => { const t = (s && (s.anima || '')) + ''; const th = typeof BATTLE_ANIM !== 'undefined' && BATTLE_ANIM[s && s.anima]; return COL[th] || (s && s.type === 'support' ? COL.green : s && s.ultimate ? COL.gold : COL.red); };

  window.addEventListener('DOMContentLoaded', () => {
    if (window.FXE && FXE.add) { const _a = FXE.add; FXE.add = function () { const r = _a.apply(this, arguments); if (on()) kick(); return r; }; }
    /* 衝擊環：原本是一條細線，加一層柔和的光帶，看起來比較有厚度 */
    if (window.FXE && FXE.P && FXE.P.ring) { const _r = FXE.P.ring; FXE.P.ring = function (x, y, o) { const r = _r.apply(this, arguments); if (!on()) return r; o = o || {}; const col = o.color || '#ffffff', r0 = o.r0 || 10, r1 = o.r1 || 150, life = (o.life || .45) * 1.15, flat = o.flat || 1, bw = Math.max(18, (o.w || 14) * 2.2);
      FXE.add({ add: true, life, draw(c, k) { const e = 1 - Math.pow(1 - k, 3), rr = r0 + (r1 - r0) * e, g = c.createRadialGradient(0, 0, Math.max(0, rr - bw), 0, 0, rr + bw * .5); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, col); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = .55 * (1 - k); c.translate(x, y); c.scale(1, flat); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr + bw * .5, 0, Math.PI * 2); c.fill(); } }); return r; }; }
    if (typeof hitFX === 'function') { const _h = hitFX; hitFX = function (side, theme, big) { const r = _h.apply(this, arguments); if (!on()) return r; try { const p = fighterPoint(side), col = COL[theme] || COL.red; hitStop(big ? 90 : 60); chroma(side); shock(p.x, p.y, col, big); streaks(p.x, p.y, col, big ? 26 : 16, big); embers(p.x, p.y, col, big ? 14 : 8); } catch (e) { } return r; }; }
    if (typeof playChoreo === 'function') { const _p = playChoreo; window.playChoreo = playChoreo = async function (side, actor, idx, skill) { if (!on()) return _p.apply(this, arguments); const S = side === 'P' ? 'L' : 'R', ult = !!(skill && skill.ultimate);
      focus(true, ult); try { rim(S, skillCol(skill)); } catch (e) { } try { return await _p.apply(this, arguments); } finally { setTimeout(() => focus(false), 650 / (window.BSPEED || 1)); } }; }
  });
  window.FXPRO = { on, hitStop, chroma, shock, streaks, embers, focus, kick };
})();

/* v138 第二層「更帥」：屬性氣場、蓄力集氣、魔法陣、命中屬性爆發（火焰綻放、冰晶碎裂、落雷、水花、黑焰）、
   光芒放射、碎石與煙塵、畫面震動；奧義另有天色變暗、雙層魔法陣、集中線、結尾白光衝擊與光雨；輔助招式有光柱。
   與第一層共用開關 op_fxpro。 */
(function () {
  const on = () => window.FXPRO && FXPRO.on();
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2, LOW = typeof LOWFX !== 'undefined' && LOWFX;
  const n = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  /* 屬性 → 主題 */
  const THEME = { '火': 'fire', '冰': 'ice', '雷電': 'bolt', '水': 'water', '魚人': 'water', '闇': 'dark', '超能': 'psy', '龍': 'psy', '自然': 'nature', '格鬥': 'fist', '獸': 'fist', '巨人': 'fist' };
  const PAL = { fire: ['#fff3c0', '#ffb02e', '#ff4a1a', '#7a1200'], ice: ['#ffffff', '#c8f4ff', '#6fd3ff', '#1a5aa8'], bolt: ['#ffffff', '#fff27a', '#ffd23b', '#6a8aff'], water: ['#ffffff', '#bfeaff', '#3fa8ff', '#0a3a8a'],
    dark: ['#f0d0ff', '#b05aff', '#5a1a9a', '#120018'], psy: ['#ffffff', '#ffb0f0', '#d86fd0', '#4a1a6a'], nature: ['#ffffff', '#c8ffb0', '#5adf6f', '#1a5a2a'], fist: ['#ffffff', '#ffe0a0', '#ff8a3a', '#5a2a0a'] };
  const themeOf = f => { const t = (f && f.types) || []; for (const x of t) if (THEME[x]) return THEME[x]; return 'fist'; };
  function geo(side) { const f = $('bF' + side), img = $('bImg' + side); if (!f || !img) return null; const p = fighterPoint(side), sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, h = img.offsetHeight * sc;
    return { x: p.x, y: p.y, g: f.offsetTop + img.offsetTop + img.offsetHeight, h, w: img.offsetWidth * sc }; }
  const add = o => FXE.add(o);

  /* ---------- 共用圖形 ---------- */
  function rays(x, y, col, o) { o = o || {}; const N = o.n || 18, L = o.len || 420, rs = []; for (let i = 0; i < N; i++) rs.push({ a: R(0, TAU), w: R(.02, .07), l: R(.6, 1) });
    add({ add: true, life: o.life || .5, draw(c, k) { const e = 1 - Math.pow(1 - k, 2); c.translate(x, y); c.rotate(k * .3); rs.forEach(r => { const len = L * r.l * (.3 + e * .7), g = c.createLinearGradient(0, 0, Math.cos(r.a) * len, Math.sin(r.a) * len); g.addColorStop(0, '#ffffff'); g.addColorStop(.25, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = (o.a || .8) * (1 - k); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, len, r.a - r.w, r.a + r.w); c.closePath(); c.fill(); }); } }); }
  function circle(x, y, P, o) { o = o || {}; const r = o.r || 120, life = o.life || 1.2, flat = o.flat || .32, runes = '☉☽✦✧❖✶⚔⚓★✪'.split('');
    add({ add: true, life, draw(c, k, dt, t) { const a = k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1, s = k < .15 ? .6 + .4 * (k / .15) : 1; c.translate(x, y); c.scale(s, s * flat); c.globalAlpha = a;
      c.shadowColor = P[2]; c.shadowBlur = 20; c.strokeStyle = P[1]; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r * .82, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, r * .45, 0, TAU); c.stroke();
      c.save(); c.rotate(t * (o.spin || 1.2)); c.lineWidth = 2; c.strokeStyle = P[2]; c.beginPath(); for (let i = 0; i <= 6; i++) { const q = i * TAU / 6 * 2; const px = Math.cos(q) * r * .82, py = Math.sin(q) * r * .82; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
      c.fillStyle = P[0]; c.font = `${Math.round(r * .16)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < 10; i++) { const q = i * TAU / 10; c.fillText(runes[i], Math.cos(q) * r * .91, Math.sin(q) * r * .91); } c.restore();
      c.save(); c.rotate(-t * (o.spin || 1.2) * 1.6); c.strokeStyle = P[0]; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { c.rotate(TAU / 4); c.strokeRect(-r * .32, -r * .32, r * .64, r * .64); } c.restore();
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a * .35; c.shadowBlur = 0; c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); } }); }
  function gather(x, y, P, o) { o = o || {}; const ps = [], N = n(o.n || 36); for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(120, o.rad || 260); ps.push({ a, d, s: R(1.5, 4), sp: R(.8, 1.3), c: P[R(0, 3) | 0] }); }
    add({ add: true, life: o.life || .55, draw(c, k) { ps.forEach(p => { const kk = Math.min(1, k * p.sp), d = p.d * (1 - kk * kk), px = x + Math.cos(p.a) * d, py = y + Math.sin(p.a) * d, tx = x + Math.cos(p.a) * (d + 26), ty = y + Math.sin(p.a) * (d + 26);
      c.globalAlpha = kk < 1 ? .9 : 0; c.strokeStyle = p.c; c.lineWidth = p.s; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(px, py); c.stroke(); }); const g = c.createRadialGradient(x, y, 0, x, y, 60 * k + 10); g.addColorStop(0, '#fff'); g.addColorStop(.4, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = .8 * k; c.fillStyle = g; c.fillRect(x - 80, y - 80, 160, 160); } }); }
  function aura(G, P, th, life) { const ps = [], N = n(th === 'bolt' ? 10 : 34); for (let i = 0; i < N; i++) ps.push({ x: R(-G.w * .45, G.w * .45), y: R(-G.h * .1, 0), vy: R(-260, -90), s: R(3, 9), ph: R(0, TAU), c: P[R(0, 3) | 0], t0: R(0, life * .7) });
    add({ add: true, life, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .8 ? (1 - k) / .2 : 1;
      const g = c.createRadialGradient(G.x, G.g, 0, G.x, G.g, G.w * .7); g.addColorStop(0, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = .45 * fa; c.fillStyle = g; c.save(); c.translate(G.x, G.g); c.scale(1, .25); c.translate(-G.x, -G.g); c.beginPath(); c.arc(G.x, G.g, G.w * .7, 0, TAU); c.fill(); c.restore();
      ps.forEach(p => { const lt = t - p.t0; if (lt < 0) return; const ly = (lt * -p.vy) % (G.h * 1.1), px = G.x + p.x + Math.sin(lt * 5 + p.ph) * 12, py = G.g + p.y - ly, a = fa * Math.max(0, 1 - ly / (G.h * 1.1));
        c.globalAlpha = a; if (th === 'bolt') { c.strokeStyle = p.c; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 4; j++) c.lineTo(px + R(-14, 14), py - j * 12); c.stroke(); }
        else if (th === 'ice') { c.fillStyle = p.c; c.save(); c.translate(px, py); c.rotate(lt * 2 + p.ph); c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * .5, 0); c.lineTo(0, p.s); c.lineTo(-p.s * .5, 0); c.closePath(); c.fill(); c.restore(); }
        else { const rg = c.createRadialGradient(px, py, 0, px, py, p.s * 2.2); rg.addColorStop(0, '#fff'); rg.addColorStop(.35, p.c); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.beginPath(); c.arc(px, py, p.s * 2.2, 0, TAU); c.fill(); } }); } }); }
  function debris(G, P, big) { const ps = [], N = n(big ? 22 : 12); for (let i = 0; i < N; i++) ps.push({ x: G.x + R(-40, 40), y: G.g - R(0, 20), vx: R(-320, 320), vy: R(-620, -220), r: R(0, TAU), vr: R(-10, 10), s: R(4, big ? 13 : 9) });
    add({ life: 1, draw(c, k, dt) { ps.forEach(p => { p.vy += 1500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > G.g + 10) { p.y = G.g + 10; p.vy *= -.3; p.vx *= .6; } c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = '#5a4a3a'; c.beginPath(); c.moveTo(-p.s, -p.s * .4); c.lineTo(p.s * .2, -p.s); c.lineTo(p.s, p.s * .3); c.lineTo(-p.s * .3, p.s * .8); c.closePath(); c.fill(); c.fillStyle = P[2]; c.globalAlpha = (1 - k) * .5; c.fill(); c.restore(); }); } });
    const ds = []; for (let i = 0; i < n(10); i++) ds.push({ x: G.x + R(-30, 30), vx: R(-180, 180), r: R(30, 60) });
    add({ life: 1.1, draw(c, k, dt) { ds.forEach(d => { d.x += d.vx * dt; d.vx *= .95; const r = d.r * (1 + k * 1.5), g = c.createRadialGradient(d.x, G.g - r * .3, 0, d.x, G.g - r * .3, r); g.addColorStop(0, 'rgba(200,180,150,.5)'); g.addColorStop(1, 'rgba(200,180,150,0)'); c.globalAlpha = (1 - k) * .8; c.fillStyle = g; c.beginPath(); c.arc(d.x, G.g - r * .3, r, 0, TAU); c.fill(); }); } }); }
  function shake(px, ms) { const a = $('bArena'); if (!a) return; const k = []; for (let i = 0; i < 6; i++) k.push({ translate: `${R(-px, px)}px ${R(-px, px)}px` }); k.push({ translate: '0 0' }); a.animate(k, { duration: ms, composite: 'add' }); }
  /* ---------- 屬性命中 ---------- */
  function element(th, x, y, G, P, big) {
    const m = big ? 1.4 : 1;
    if (th === 'fire') { for (let i = 0; i < n(7); i++) setTimeout(() => FXE.P.glow(x + R(-60, 60) * m, y + R(-60, 40) * m, { color: P[2], r: R(70, 120) * m, life: .5 }), i * 40); const fl = []; for (let i = 0; i < n(26); i++) { const a = R(-Math.PI, 0), v = R(150, 480) * m; fl.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(6, 14) }); } add({ add: true, life: .7, draw(c, k, dt) { fl.forEach(p => { p.vx *= .94; p.vy = p.vy * .94 - 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; const r = p.s * (1 - k * .6), g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, P[0]); g.addColorStop(.4, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 1 - k; c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill(); }); } }); }
    else if (th === 'ice') { const sh = []; for (let i = 0; i < n(16); i++) { const a = R(0, TAU), v = R(200, 520) * m; sh.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, r: R(0, TAU), s: R(8, 20) }); }
      add({ add: true, life: .8, draw(c, k, dt) { sh.forEach(p => { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 8 * dt; c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = P[1]; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * .35, 0); c.lineTo(0, p.s * .6); c.lineTo(-p.s * .35, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }); } }); }
    else if (th === 'bolt') { for (let i = 0; i < (big ? 3 : 2); i++) setTimeout(() => { FXE.P.bolt(x + R(-50, 50), -40, x + R(-20, 20), y, { color: P[2], w: big ? 6 : 4, life: .35 }); FXE.P.flash('#fff6c0', .12, .35); }, i * 90); }
    else if (th === 'water') { const dr = []; for (let i = 0; i < n(30); i++) { const a = R(-Math.PI, 0), v = R(200, 600) * m; dr.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(3, 7) }); }
      add({ add: true, life: .8, draw(c, k, dt) { dr.forEach(p => { p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = 1 - k; c.fillStyle = P[1]; c.beginPath(); c.ellipse(p.x, p.y, p.s * .6, p.s * 1.3, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, TAU); c.fill(); }); } }); }
    else if (th === 'dark' || th === 'psy') { add({ life: .7, draw(c, k) { const r = (60 + 160 * (1 - Math.pow(1 - k, 3))) * m; c.globalAlpha = .8 * (1 - k); const g = c.createRadialGradient(x, y, r * .2, x, y, r); g.addColorStop(0, P[3]); g.addColorStop(.7, P[3]); g.addColorStop(.85, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = r * (.85 + .15 * Math.sin(i * 3 + k * 9)); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } }); }
    else if (th === 'nature') { const lv = []; for (let i = 0; i < n(18); i++) { const a = R(0, TAU), v = R(150, 420) * m; lv.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: R(0, TAU), s: R(6, 12) }); }
      add({ add: true, life: 1, draw(c, k, dt) { lv.forEach(p => { p.vx *= .95; p.vy = p.vy * .95 + 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 4 * dt; c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = P[2]; c.beginPath(); c.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); c.fill(); c.restore(); }); } }); }
    if (G) debris(G, P, big);
  }

  window.addEventListener('DOMContentLoaded', () => {
    let cur = null; /* 目前出招的角色與主題（命中時使用） */
    if (typeof playChoreo === 'function') { const _p = playChoreo; window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      if (!on()) return _p.apply(this, arguments); const S = side === 'P' ? 'L' : 'R', G = geo(S), th = themeOf(actor), P = PAL[th], ult = !!(skill && skill.ultimate), sup = skill && skill.type === 'support';
      cur = { th, P, ult };
      try { if (G) {
        circle(G.x, G.g, P, { r: Math.max(90, G.w * .55), life: ult ? 2.4 : 1.3, spin: ult ? 2 : 1.2 }); aura(G, P, th, ult ? 2.4 : 1.2);
        if (ult) { FXE.P.tint('#000010', 2.2, .4); circle(G.x, G.g - G.h * .02, P, { r: Math.max(150, G.w * .9), life: 2.4, spin: -.8, flat: .28 }); gather(G.x, G.y, P, { n: 70, rad: 420, life: .9 }); FXE.P.speedLines(G.x, G.y, { life: .9, n: 70, a: .55 }); shake(4, 600); }
        else if (sup) { add({ add: true, life: 1.2, draw(c, k) { const a = k < .2 ? k / .2 : (1 - k) / .8, w = G.w * .5 * (1 - k * .3), g = c.createLinearGradient(G.x - w, 0, G.x + w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a * .6; c.fillStyle = g; c.fillRect(G.x - w, -50, w * 2, G.g + 50); } }); }
        else gather(G.x + (S === 'L' ? 1 : -1) * G.w * .25, G.y, P, { n: 30, rad: 220, life: .45 });
      } } catch (e) { }
      try { return await _p.apply(this, arguments); } finally {
        if (ult) try { const T = geo(S === 'L' ? 'R' : 'L'); FXE.P.flash('#ffffff', .35, .55); if (T) { rays(T.x, T.y, P[1], { n: 28, len: 700, life: .9 }); FXPRO.shock(T.x, T.y, P[2], true); } const rain = []; for (let i = 0; i < n(50); i++) rain.push({ x: R(0, FXE.W), y: R(-200, 0), v: R(200, 500), s: R(1.5, 3.5) }); add({ add: true, life: 1.6, draw(c, k, dt) { rain.forEach(p => { p.y += p.v * dt; c.globalAlpha = (1 - k) * .9; c.fillStyle = P[0]; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill(); c.globalAlpha = (1 - k) * .4; c.fillStyle = P[1]; c.beginPath(); c.arc(p.x, p.y, p.s * 3, 0, TAU); c.fill(); }); } }); shake(9, 500); } catch (e) { }
        setTimeout(() => { cur = null; }, 400); } }; }
    if (typeof hitFX === 'function') { const _h = hitFX; hitFX = function (side, theme, big) { const r = _h.apply(this, arguments); if (!on()) return r; try { const p = fighterPoint(side), G = geo(side), C = cur || { th: 'fist', P: PAL.fist }; const b = big || (cur && cur.ult);
      rays(p.x, p.y, C.P[1], { n: b ? 22 : 14, len: b ? 520 : 340, life: b ? .55 : .4, a: .7 }); element(C.th, p.x, p.y, G, C.P, b); shake(b ? 10 : 5, b ? 320 : 220); } catch (e) { } return r; }; }
  });
})();
