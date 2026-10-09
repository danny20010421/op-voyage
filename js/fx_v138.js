/* v138 特效質感升級（全角色通用的一層，不改各招式的編排）：
   ① 泛光（Bloom）：特效畫布每幀縮小複製到 #bBloom，用 GPU 模糊後以「濾色」疊回去——所有光、火、雷、斬擊都會發光暈開。
      取代手機上把 shadowBlur 降到三成的作法（手機原本幾乎沒有光暈，是看起來廉價的主因）。
   ② 命中：頓幀（hit-stop 約 70ms）、目標色差殘影（紅／青錯位）、拖尾火花、雙層衝擊波、餘燼。
   ③ 出招：背景壓暗＋暗角，讓特效成為焦點；施放者描上招式顏色的輪廓光。奧義另加電影黑邊。
   設定：設定頁「戰鬥 → 技能特效」高／低（localStorage op_fxpro，'0'＝低：回到原本的特效）。「減少動態效果」開啟時不震動畫面。 */
(function () {
  const on = () => { try { return localStorage.getItem('op_fxpro') !== '0'; } catch (e) { return true; } }; /* 使用者已同意：預設開啟；設定「技能特效：低」＝ op_fxpro '0' */
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const COL = { blue: '#78d2ff', gold: '#ffd26e', red: '#ff7850', purple: '#b07cff', green: '#78ffaa' };

  /* ---------- ① 泛光 ---------- */
  let bloom = null, bctx = null, braf = 0, idle = 0;
  function ensureBloom() { const cv = $('bCanvas'); if (!cv) return null; if (!bloom) { bloom = document.createElement('canvas'); bloom.id = 'bBloom'; bloom.className = 'b-canvas b-bloom'; bloom.setAttribute('aria-hidden', 'true'); cv.insertAdjacentElement('afterend', bloom); bctx = bloom.getContext('2d'); } return cv; }
  function bloomLoop() { braf = 0; const cv = ensureBloom(); if (!cv || !on()) return; const w = Math.max(1, Math.round(cv.width / 4)), h = Math.max(1, Math.round(cv.height / 4));
    if (bloom.width !== w || bloom.height !== h) { bloom.width = w; bloom.height = h; }
    const s = cv.style, b = bloom.style; if (b.left !== s.left || b.top !== s.top || b.width !== s.width || b.height !== s.height) { b.left = s.left; b.top = s.top; b.width = s.width; b.height = s.height; b.right = b.bottom = 'auto'; }
    bctx.clearRect(0, 0, w, h); const full = window.__fxFullUntil && performance.now() < __fxFullUntil(); b.opacity = full ? '.12' : ''; bctx.drawImage(cv, 0, 0, w, h);
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
    /* 全畫面閃光／染色時暫時降低泛光，避免整個畫面被洗白 */
    let fullUntil = 0; ['flash', 'tint'].forEach(k => { const f = FXE.P[k]; if (!f) return; FXE.P[k] = function (col, life) { fullUntil = Math.max(fullUntil, performance.now() + (life || .3) * 1000 / (window.BSPEED || 1)); return f.apply(this, arguments); }; });
    window.__fxFullUntil = () => fullUntil;
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
    dark: ['#f0d0ff', '#b05aff', '#5a1a9a', '#120018'], psy: ['#ffffff', '#ffb0f0', '#d86fd0', '#4a1a6a'], nature: ['#ffffff', '#c8ffb0', '#5adf6f', '#1a5a2a'], fist: ['#ffffff', '#ffe0a0', '#ff8a3a', '#5a2a0a'], sword: ['#ffffff', '#e0f0ff', '#8fc8ff', '#0a1a3a'], sand: ['#fff8e0', '#ffd890', '#d8a040', '#4a2a0a'], light: ['#ffffff', '#fff6b0', '#ffd23b', '#6a5a00'],
    haki: ['#ffffff', '#ff8a9a', '#e0102a', '#000000'], poison: ['#f0ffe0', '#c88aff', '#7a3ad8', '#1a0a2a'], shadow: ['#f0e0ff', '#a87aff', '#4a1a8a', '#05000a'], thread: ['#ffffff', '#ffc8f0', '#ff5ad0', '#3a0a2a'], quake: ['#ffffff', '#e8f4ff', '#a8d8ff', '#1a2a4a'] };
  window.__FXPAL = PAL;
  const themeOf = f => { const C = f && typeof CHAR_FX !== 'undefined' && CHAR_FX[f.id]; if (C) return C[0]; const t = (f && f.types) || []; for (const x of t) if (THEME[x]) return THEME[x]; return 'fist'; };
  const palOf = (f, th) => { const C = f && typeof CHAR_FX !== 'undefined' && CHAR_FX[f.id]; return (C && C[2]) || PAL[th] || PAL.fist; };
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
  function shake(px, ms) { const a = $('bArena'); if (!a) return; try { if (localStorage.getItem('op_motion') === '1') return; } catch (e) { } const k = []; for (let i = 0; i < 6; i++) k.push({ translate: `${R(-px, px)}px ${R(-px, px)}px` }); k.push({ translate: '0 0' }); a.animate(k, { duration: ms, composite: 'add' }); }
  /* ---------- 屬性命中 ---------- */
  function element(th, x, y, G, P, big) {
    const m = big ? 1.4 : 1;
    if (th === 'fire') { for (let i = 0; i < n(7); i++) setTimeout(() => FXE.P.glow(x + R(-60, 60) * m, y + R(-60, 40) * m, { color: P[2], r: R(70, 120) * m, life: .5 }), i * 40); const fl = []; for (let i = 0; i < n(26); i++) { const a = R(-Math.PI, 0), v = R(150, 480) * m; fl.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(6, 14) }); } add({ add: true, life: .7, draw(c, k, dt) { fl.forEach(p => { p.vx *= .94; p.vy = p.vy * .94 - 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; const r = p.s * (1 - k * .6), g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, P[0]); g.addColorStop(.4, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 1 - k; c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill(); }); } }); }
    else if (th === 'ice') { const sh = []; for (let i = 0; i < n(16); i++) { const a = R(0, TAU), v = R(200, 520) * m; sh.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, r: R(0, TAU), s: R(8, 20) }); }
      add({ add: true, life: .8, draw(c, k, dt) { sh.forEach(p => { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 8 * dt; c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = P[1]; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * .35, 0); c.lineTo(0, p.s * .6); c.lineTo(-p.s * .35, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }); } }); }
    else if (th === 'bolt') { for (let i = 0; i < (big ? 3 : 2); i++) setTimeout(() => { FXE.P.bolt(x + R(-50, 50), -40, x + R(-20, 20), y, { color: P[2], w: big ? 6 : 4, life: .35 }); FXE.P.flash('#fff6c0', .12, .35); }, i * 90); }
    else if (th === 'water') { const dr = []; for (let i = 0; i < n(30); i++) { const a = R(-Math.PI, 0), v = R(200, 600) * m; dr.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(3, 7) }); }
      add({ add: true, life: .8, draw(c, k, dt) { dr.forEach(p => { p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = 1 - k; c.fillStyle = P[1]; c.beginPath(); c.ellipse(p.x, p.y, p.s * .6, p.s * 1.3, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, TAU); c.fill(); }); } }); }
    else if (th === 'dark' || th === 'psy') { add({ add: true, life: .6, draw(c, k) { const r = (50 + 170 * (1 - Math.pow(1 - k, 3))) * m, w = 26 * (1 - k) + 4; c.globalAlpha = .85 * (1 - k); const g = c.createRadialGradient(x, y, Math.max(0, r - w), x, y, r + w * .4); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, P[2]); g.addColorStop(.8, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); for (let q = 0; q <= 24; q++) { const a = q / 24 * TAU, rr = (r + w * .4) * (.9 + .1 * Math.sin(q * 3 + k * 9)); q ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } }); }
    else if (th === 'nature') { const lv = []; for (let i = 0; i < n(18); i++) { const a = R(0, TAU), v = R(150, 420) * m; lv.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: R(0, TAU), s: R(6, 12) }); }
      add({ add: true, life: 1, draw(c, k, dt) { lv.forEach(p => { p.vx *= .95; p.vy = p.vy * .95 + 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 4 * dt; c.globalAlpha = 1 - k; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = P[2]; c.beginPath(); c.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); c.fill(); c.restore(); }); } }); }
    else if (th === 'sword') { [[-.7, 0], [.7, 60], [0, 120]].forEach(([ang, d]) => setTimeout(() => add({ add: true, life: .35, draw(c, k) { const L = 340 * m * (1 - Math.pow(1 - Math.min(1, k * 2.5), 3)); c.translate(x, y); c.rotate(ang); const g = c.createLinearGradient(-L / 2, 0, L / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, '#fff'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 1 - k; c.fillStyle = g; c.fillRect(-L / 2, -4 * (1 - k) - 1, L, 8 * (1 - k) + 2); c.fillStyle = P[2]; c.globalAlpha = (1 - k) * .6; c.fillRect(-L / 2, -12 * (1 - k), L, 24 * (1 - k)); } }), d)); }
    else if (th === 'sand') { const sd = []; for (let i = 0; i < n(60); i++) { const a = R(-Math.PI, 0), v = R(150, 560) * m; sd.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(1.5, 4) }); } add({ life: 1, draw(c, k, dt) { sd.forEach(p => { p.vy += 900 * dt; p.vx *= .97; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = 1 - k; c.fillStyle = P[2]; c.fillRect(p.x, p.y, p.s, p.s); }); } }); }
    else if (th === 'light') { FXE.P.flash('#fffbe0', .14, .4); FXE.P.glow(x, y, { color: P[1], r: 200 * m, life: .5 }); }
    else if (th === 'haki') { for (let i = 0; i < (big ? 5 : 3); i++) setTimeout(() => { const a = R(0, TAU), L = R(80, 200) * m; FXE.P.bolt(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, { color: Math.random() < .5 ? '#1a0005' : P[2], w: 4, life: .3 }); }, i * 50); }
    else if (th === 'poison') { for (let i = 0; i < n(10); i++) setTimeout(() => FXE.P.glow(x + R(-70, 70) * m, y + R(-60, 50) * m, { color: P[2], r: R(50, 90) * m, life: .7 }), i * 40); }
    else if (th === 'shadow') { element('dark', x, y, null, P, big); }
    else if (th === 'thread') { for (let i = 0; i < 8; i++) { const a = R(0, TAU), L = R(140, 260) * m; add({ add: true, life: .5, draw(c, k) { const e = Math.min(1, k * 3); c.globalAlpha = 1 - k; c.strokeStyle = P[1]; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - Math.cos(a) * L * e, y - Math.sin(a) * L * e); c.lineTo(x + Math.cos(a) * L * e, y + Math.sin(a) * L * e); c.stroke(); } }); } }
    else if (th === 'quake') { FXE.P.ring(x, y, { r1: 260 * m, color: P[1], w: 18, life: .5 }); setTimeout(() => FXE.P.ring(x, y, { r1: 360 * m, color: '#ffffff', w: 10, life: .5 }), 100); }
    if (G) debris(G, P, big);
  }

  window.addEventListener('DOMContentLoaded', () => {
    let cur = null; /* 目前出招的角色與主題（命中時使用） */
    if (typeof playChoreo === 'function') { const _p = playChoreo; window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      if (!on()) return _p.apply(this, arguments); const S = side === 'P' ? 'L' : 'R', G = geo(S), th = themeOf(actor), P = palOf(actor, th), ult = !!(skill && skill.ultimate), sup = skill && skill.type === 'support';
      cur = { th, P, ult };
      try { if (G) {
        circle(G.x, G.g, P, { r: Math.max(90, G.w * .55), life: ult ? 2.4 : 1.3, spin: ult ? 2 : 1.2 }); aura(G, P, th, ult ? 2.4 : 1.2);
        if (ult) { circle(G.x, G.g - G.h * .02, P, { r: Math.max(150, G.w * .9), life: 2.4, spin: -.8, flat: .28 }); gather(G.x, G.y, P, { n: 70, rad: 420, life: .9 }); FXE.P.speedLines(G.x, G.y, { life: .9, n: 70, a: .55 }); shake(4, 600); }
        else if (sup) { add({ add: true, life: 1.2, draw(c, k) { const a = k < .2 ? k / .2 : (1 - k) / .8, w = G.w * .5 * (1 - k * .3), g = c.createLinearGradient(G.x - w, 0, G.x + w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a * .6; c.fillStyle = g; c.fillRect(G.x - w, -50, w * 2, G.g + 50); } }); }
        else gather(G.x + (S === 'L' ? 1 : -1) * G.w * .25, G.y, P, { n: 30, rad: 220, life: .45 });
      } } catch (e) { }
      try { return await _p.apply(this, arguments); } finally {
        if (ult) try { const T = geo(S === 'L' ? 'R' : 'L'); if (T) { rays(T.x, T.y, P[1], { n: 28, len: 700, life: .9 }); FXPRO.shock(T.x, T.y, P[2], true); } const rain = []; for (let i = 0; i < n(50); i++) rain.push({ x: R(0, FXE.W), y: R(-200, 0), v: R(200, 500), s: R(1.5, 3.5) }); add({ add: true, life: 1.6, draw(c, k, dt) { rain.forEach(p => { p.y += p.v * dt; c.globalAlpha = (1 - k) * .9; c.fillStyle = P[0]; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill(); c.globalAlpha = (1 - k) * .4; c.fillStyle = P[1]; c.beginPath(); c.arc(p.x, p.y, p.s * 3, 0, TAU); c.fill(); }); } }); shake(9, 500); } catch (e) { }
        setTimeout(() => { cur = null; }, 400); } }; }
    if (typeof hitFX === 'function') { const _h = hitFX; hitFX = function (side, theme, big) { const r = _h.apply(this, arguments); if (!on()) return r; try { const p = fighterPoint(side), G = geo(side), C = cur || { th: 'fist', P: PAL.fist }; const b = big || (cur && cur.ult);
      rays(p.x, p.y, C.P[1], { n: b ? 22 : 14, len: b ? 520 : 340, life: b ? .55 : .4, a: .7 }); element(C.th, p.x, p.y, G, C.P, b); shake(b ? 10 : 5, b ? 320 : 220); } catch (e) { } return r; }; }
  });
})();

/* v138 第三層「每位角色」：CHAR_FX[id] = [命中主題, 奧義全畫面轉場, 自訂配色?]
   主題決定氣場與命中爆發；轉場在奧義開始時鋪滿畫面（火海、冰封、雷暴、海嘯、深淵、沙暴、聖光、霸王色、花雨、震裂、劍閃、毒霧、影、絲線）。 */
const CHAR_FX = {
  luffy0: ['fist', 'quake'], zoro: ['sword', 'sword', ['#ffffff', '#c8ffd8', '#3adf8a', '#0a3a1a']], sanji: ['fire', 'inferno', ['#ffffff', '#bfe8ff', '#3a7fff', '#0a1a5a']],
  robin: ['psy', 'blossom', ['#ffffff', '#ffd0f0', '#c86fd8', '#3a1a4a']], franky: ['bolt', 'radiance', ['#ffffff', '#bfefff', '#3fd0ff', '#0a3a6a']], brook: ['ice', 'blizzard', ['#ffffff', '#d8e8ff', '#8fa8ff', '#1a1a4a']],
  nami: ['bolt', 'storm', ['#ffffff', '#fff3b0', '#8fd8ff', '#1a2a5a']], jinbe: ['water', 'tsunami'], luffy: ['psy', 'radiance', ['#ffffff', '#fff6d8', '#ffd86f', '#6a4a1a']], coby0: ['fist', 'radiance'], morgan: ['sword', 'quake'], marine: ['fist', 'quake'],
  koby_mf: ['fist', 'radiance'], garp_mf: ['haki', 'quake'], akainu: ['fire', 'inferno', ['#fff0c0', '#ff8a2e', '#d01a00', '#3a0500']], aokiji: ['ice', 'blizzard'], kizaru: ['light', 'radiance', ['#ffffff', '#fff6b0', '#ffd23b', '#8a6a00']],
  magellan: ['poison', 'poison'], lucci: ['fist', 'haki'], vergo: ['haki', 'haki'], garp_hc: ['haki', 'quake'], koby_hc: ['fist', 'radiance'],
  mihawk: ['sword', 'sword', ['#ffffff', '#c8fff0', '#5affc8', '#003a2a']], crocodile: ['sand', 'sandstorm'], doflamingo: ['thread', 'thread', ['#ffffff', '#ffc8f0', '#ff5ad0', '#4a0a3a']],
  kuma: ['psy', 'quake', ['#ffffff', '#ffe0c0', '#ffa86f', '#4a2a0a']], moria: ['shadow', 'abyss'], law: ['psy', 'sword', ['#ffffff', '#c8f0ff', '#5ad0ff', '#0a2a4a']], hancock: ['psy', 'blossom', ['#ffffff', '#ffd0e8', '#ff5aa8', '#4a0a2a']],
  kuma_eh: ['psy', 'quake', ['#ffffff', '#ffe0c0', '#ffa86f', '#4a2a0a']], law_w: ['psy', 'sword', ['#ffffff', '#c8f0ff', '#5ad0ff', '#0a2a4a']], weevil: ['haki', 'quake'], blackbeard_w: ['dark', 'abyss'], mihawk_w: ['sword', 'sword', ['#ffffff', '#c8fff0', '#5affc8', '#003a2a']],
  ace: ['fire', 'inferno'], marco: ['fire', 'inferno', ['#ffffff', '#bff8ff', '#3ad8ff', '#0a2a5a']], uta: ['psy', 'blossom', ['#ffffff', '#ffd8e8', '#ff6fa8', '#3a0a3a']], king: ['fire', 'inferno', ['#fff0d0', '#ffb05a', '#ff3a1a', '#2a0505']],
  katakuri: ['psy', 'haki', ['#ffffff', '#ffe8f8', '#d88fd0', '#3a1a3a']], catarina: ['fire', 'blossom', ['#ffffff', '#c8b0ff', '#8a5aff', '#1a0a3a']], burgess: ['fist', 'quake'], vasco: ['fire', 'inferno'],
  shanks: ['haki', 'haki'], blackbeard: ['dark', 'abyss'], buggy: ['psy', 'radiance', ['#ffffff', '#ffe0b0', '#ff6a3a', '#3a0a0a']], luffy_nika: ['light', 'radiance', ['#ffffff', '#fffbe8', '#ffe8a0', '#8a6a3a']],
  whitebeard: ['quake', 'quake', ['#ffffff', '#e8f4ff', '#a8d8ff', '#1a2a4a']], bigmom: ['fire', 'storm', ['#ffffff', '#ffe08a', '#ff8a3a', '#3a1a0a']], kaido: ['bolt', 'storm', ['#ffffff', '#d8c8ff', '#8a5aff', '#1a0a3a']],
  makino: ['fist', 'blossom'], mayor: ['fist', 'quake'], lordcoast: ['water', 'tsunami'], vivi: ['water', 'tsunami'], koza: ['sword', 'sandstorm'], enel: ['bolt', 'storm'], wiper: ['fire', 'quake'],
  perona: ['shadow', 'abyss', ['#ffffff', '#ffd0f0', '#d88fff', '#2a0a3a']], hody: ['water', 'tsunami'], shirahoshi: ['water', 'tsunami', ['#ffffff', '#d8f4ff', '#8fd8ff', '#1a4a6a']], monet: ['ice', 'blizzard'],
  sugar: ['psy', 'blossom'], kid: ['bolt', 'storm', ['#ffffff', '#ffd0c0', '#ff5a3a', '#3a0a0a']], kinemon: ['fire', 'sword'], tama: ['nature', 'blossom'], yamato: ['ice', 'blizzard'],
  vegapunk: ['light', 'radiance', ['#ffffff', '#d8f8ff', '#5ae0ff', '#0a2a3a']], york: ['light', 'radiance'], morgans: ['fist', 'quake'], loki: ['bolt', 'storm'], dorry: ['sword', 'quake'], brogy: ['sword', 'quake'],
  rocks: ['haki', 'abyss', ['#ffffff', '#ffb0b0', '#ff2a3a', '#1a0005']], imu: ['dark', 'abyss', ['#ffffff', '#ffb0c8', '#c8003a', '#05000a']], roger: ['haki', 'haki']
};
(function () {
  const on = () => window.FXPRO && FXPRO.on();
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2, LOW = typeof LOWFX !== 'undefined' && LOWFX;
  const n = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  const add = o => FXE.add(o);
  const W = () => FXE.W || 400, H = () => FXE.H || 600;
  const motionOK = () => { try { return localStorage.getItem('op_motion') !== '1'; } catch (e) { return true; } };
  /* ---------- 奧義全畫面轉場 ---------- */
  function wash(col, a, life) { add({ life, draw(c, k) { c.globalAlpha = a * (k < .15 ? k / .15 : k > .7 ? (1 - k) / .3 : 1); c.fillStyle = col; c.fillRect(-W(), -H(), W() * 3, H() * 3); } }); }
  const TR = {
    inferno(P) { wash(P[3], .35, 2.2); const fl = []; for (let i = 0; i < n(60); i++) fl.push({ x: R(-.1, 1.1), s: R(30, 90), v: R(.3, .8), ph: R(0, TAU) });
      add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; fl.forEach(f => { const y = H() * (1.1 - ((t * f.v + f.ph / TAU) % 1) * 1.3), x = W() * f.x + Math.sin(t * 3 + f.ph) * 20, r = f.s * (.6 + .4 * Math.sin(t * 6 + f.ph)); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, P[0]); g.addColorStop(.3, P[1]); g.addColorStop(.7, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .7; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }); } }); },
    blizzard(P) { wash(P[3], .3, 2.2); const sn = []; for (let i = 0; i < n(140); i++) sn.push({ x: R(-.2, 1.2), y: R(-.2, 1.2), v: R(.4, 1.2), s: R(1, 3.5) });
      add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; c.strokeStyle = P[0]; c.lineCap = 'round'; sn.forEach(p => { const x = W() * (((p.x - t * p.v * .6) % 1.4 + 1.4) % 1.4 - .2), y = H() * (((p.y + t * p.v) % 1.4) - .2); c.globalAlpha = fa * .9; c.lineWidth = p.s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10 * p.v, y - 16 * p.v); c.stroke(); });
        const g = c.createRadialGradient(W() / 2, H() / 2, Math.min(W(), H()) * .3, W() / 2, H() / 2, Math.max(W(), H()) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, P[1]); c.globalAlpha = fa * .55; c.fillStyle = g; c.fillRect(0, 0, W(), H()); } }); },
    storm(P) { wash('#05050f', .45, 2.2); for (let i = 0; i < n(7); i++) setTimeout(() => { const x = R(.05, .95) * W(); FXE.P.bolt(x, -60, x + R(-80, 80), H() * R(.55, .9), { color: P[2], w: R(3, 7), life: .3 }); FXE.P.flash(P[1], .1, .25); if (window.SFX) try { SFX.play('hit'); } catch (e) { } }, 150 + i * R(150, 260)); },
    tsunami(P) { wash(P[3], .3, 2); add({ add: true, life: 1.8, draw(c, k, dt, t) { const x = W() * (-1.2 + k * 2.6), fa = k > .8 ? (1 - k) / .2 : 1; for (let j = 0; j < 3; j++) { c.globalAlpha = fa * (.55 - j * .15); c.fillStyle = P[2 - j > 0 ? 2 - j : 1]; c.beginPath(); c.moveTo(x - W(), H()); for (let i = 0; i <= 40; i++) { const xx = x - W() + i / 40 * W() * 1.4, yy = H() * (.35 + j * .12) + Math.sin(i * .5 + t * 6 + j) * 24; c.lineTo(xx, yy); } c.lineTo(x + W() * .4, H()); c.closePath(); c.fill(); } } }); },
    abyss(P) { add({ life: 2.2, draw(c, k, dt, t) { const fa = k < .2 ? k / .2 : k > .75 ? (1 - k) / .25 : 1, cx = W() / 2, cy = H() * .45, r = Math.max(W(), H()) * (.3 + k * .6); const g = c.createRadialGradient(cx, cy, r * .2, cx, cy, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.6, P[3]); g.addColorStop(.85, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .75; c.fillStyle = g; c.fillRect(-W(), -H(), W() * 3, H() * 3);
      c.translate(cx, cy); c.rotate(t * 1.5); c.strokeStyle = P[1]; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.globalAlpha = fa * .5; c.beginPath(); for (let j = 0; j < 30; j++) { const rr = j * r / 30, a = j * .22; j ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(0, 0); } c.stroke(); } } }); },
    sandstorm(P) { wash('#5a3a10', .35, 2.2); const ps = []; for (let i = 0; i < n(160); i++) ps.push({ x: R(0, 1), y: R(0, 1), v: R(.6, 1.6), s: R(1, 3) });
      add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; c.fillStyle = '#ffd890'; ps.forEach(p => { const x = W() * (((p.x + t * p.v) % 1.2) - .1), y = H() * p.y + Math.sin(t * 4 + p.x * 20) * 10; c.globalAlpha = fa * .8; c.fillRect(x, y, p.s * 8, p.s); }); } }); },
    radiance(P) { wash('#ffffff', .12, 2); for (let i = 0; i < n(6); i++) setTimeout(() => { const x = R(.1, .9) * W(); add({ add: true, life: .9, draw(c, k) { const w = 60 * (1 - k * .5), g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, P[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = (1 - k) * .8; c.fillStyle = g; c.fillRect(x - w, -H(), w * 2, H() * 3); } }); }, i * 180);
      add({ add: true, life: 2, draw(c, k, dt, t) { const fa = k < .2 ? k / .2 : (1 - k) / .8; c.translate(W() / 2, -H() * .1); c.rotate(t * .2); for (let i = 0; i < 16; i++) { c.rotate(TAU / 16); const g = c.createLinearGradient(0, 0, 0, H() * 1.4); g.addColorStop(0, P[0]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .25; c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, H() * 1.4); c.lineTo(40, H() * 1.4); c.closePath(); c.fill(); } } }); },
    haki(P) { wash('#000000', .55, 2.2); add({ add: true, life: 2.2, draw(c, k, dt, t) { const fa = k < .1 ? k / .1 : k > .75 ? (1 - k) / .25 : 1; if (Math.random() < .5) { for (let i = 0; i < 3; i++) { let x = R(0, W()), y = R(0, H()); c.globalAlpha = fa; c.strokeStyle = Math.random() < .5 ? '#000' : P[2]; c.shadowColor = P[2]; c.shadowBlur = 16; c.lineWidth = R(2, 5); c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 8; j++) { x += R(-60, 60); y += R(-60, 60); c.lineTo(x, y); } c.stroke(); } }
      const r = (t * 900) % (Math.max(W(), H()) * 1.2); c.shadowBlur = 0; c.globalAlpha = fa * .6 * (1 - r / (Math.max(W(), H()) * 1.2)); c.strokeStyle = P[2]; c.lineWidth = 10; c.beginPath(); c.arc(W() / 2, H() * .5, r, 0, TAU); c.stroke(); } }); },
    blossom(P) { wash(P[3], .25, 2.2); const pt = []; for (let i = 0; i < n(80); i++) pt.push({ x: R(-.1, 1.1), y: R(-.6, 0), v: R(.25, .6), r: R(0, TAU), vr: R(-3, 3), s: R(5, 11), sw: R(0, TAU) });
      add({ add: true, life: 2.4, draw(c, k, dt, t) { const fa = k > .8 ? (1 - k) / .2 : 1; pt.forEach(p => { const x = W() * p.x + Math.sin(t * 2 + p.sw) * 30, y = H() * (p.y + t * p.v); c.globalAlpha = fa; c.save(); c.translate(x, y); c.rotate(p.r + t * p.vr); c.fillStyle = P[2]; c.beginPath(); c.moveTo(0, -p.s); c.bezierCurveTo(p.s, -p.s, p.s, p.s * .3, 0, p.s); c.bezierCurveTo(-p.s, p.s * .3, -p.s, -p.s, 0, -p.s); c.fill(); c.fillStyle = P[1]; c.globalAlpha = fa * .6; c.beginPath(); c.arc(0, -p.s * .2, p.s * .35, 0, TAU); c.fill(); c.restore(); }); } }); },
    quake(P) { wash('#000000', .3, 1.8); const cr = []; for (let i = 0; i < 9; i++) { const pts = []; let x = W() * .5 + R(-40, 40), y = H() * .55; const a = R(0, TAU); for (let j = 0; j < 12; j++) { x += Math.cos(a + R(-.6, .6)) * R(30, 60); y += Math.sin(a + R(-.6, .6)) * R(30, 60); pts.push([x, y]); } cr.push(pts); }
      add({ add: true, life: 2, draw(c, k) { const grow = Math.min(1, k * 3), fa = k > .7 ? (1 - k) / .3 : 1; c.lineCap = 'round'; cr.forEach(pts => { const m = Math.ceil(pts.length * grow); [[10, P[2], .5], [3, P[0], 1]].forEach(([w, col, a]) => { c.globalAlpha = fa * a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(W() * .5, H() * .55); for (let j = 0; j < m; j++) c.lineTo(pts[j][0], pts[j][1]); c.stroke(); }); }); } });
      [0, 300, 600].forEach(d => setTimeout(() => { FXE.P.ring(W() / 2, H() * .55, { r1: Math.max(W(), H()) * .7, color: P[1], w: 20, life: .6 }); }, d)); },
    sword(P) { wash('#000000', .4, 1.8); for (let i = 0; i < n(9); i++) setTimeout(() => { const y = R(.15, .85) * H(), a = R(-.5, .5); add({ add: true, life: .45, draw(c, k) { const e = 1 - Math.pow(1 - k, 3), L = W() * 1.6; c.translate(W() / 2, y); c.rotate(a); const g = c.createLinearGradient(-L / 2, 0, L / 2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(Math.max(0, e - .2), P[2]); g.addColorStop(e, '#ffffff'); g.addColorStop(Math.min(1, e + .02), 'rgba(0,0,0,0)'); c.globalAlpha = 1 - k * .7; c.fillStyle = g; c.fillRect(-L / 2, -3 - (1 - k) * 4, L, 6 + (1 - k) * 8); } }); if (window.SFX) try { SFX.play('whoosh'); } catch (e) { } }, i * 110); },
    poison(P) { wash('#1a0a2a', .4, 2.2); const bb = []; for (let i = 0; i < n(40); i++) bb.push({ x: R(0, 1), y: R(.5, 1.1), v: R(.1, .35), s: R(14, 46), ph: R(0, TAU) });
      add({ life: 2.2, draw(c, k, dt, t) { const fa = k < .15 ? k / .15 : k > .75 ? (1 - k) / .25 : 1; bb.forEach(b => { const x = W() * b.x + Math.sin(t * 2 + b.ph) * 16, y = H() * (b.y - t * b.v), g = c.createRadialGradient(x, y, 0, x, y, b.s); g.addColorStop(0, P[1]); g.addColorStop(.6, P[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = fa * .55; c.fillStyle = g; c.beginPath(); c.arc(x, y, b.s, 0, TAU); c.fill(); }); } }); },
    thread(P) { wash('#000000', .35, 2.2); const th = []; for (let i = 0; i < n(26); i++) { const a = R(0, TAU); th.push({ x1: W() / 2 + Math.cos(a) * W(), y1: H() * .45 + Math.sin(a) * H(), x2: W() / 2 + Math.cos(a + Math.PI + R(-.4, .4)) * W(), y2: H() * .45 + Math.sin(a + Math.PI + R(-.4, .4)) * H(), d: R(0, .4) }); }
      add({ add: true, life: 2.2, draw(c, k) { const fa = k > .8 ? (1 - k) / .2 : 1; th.forEach(l => { const e = Math.max(0, Math.min(1, (k - l.d) * 3)); if (!e) return; c.globalAlpha = fa; c.strokeStyle = P[1]; c.shadowColor = P[2]; c.shadowBlur = 10; c.lineWidth = 1.6; c.beginPath(); c.moveTo(l.x1, l.y1); c.lineTo(l.x1 + (l.x2 - l.x1) * e, l.y1 + (l.y2 - l.y1) * e); c.stroke(); }); } }); }
  };
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof playChoreo !== 'function') return; const _p = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      if (!on() || !actor) return _p.apply(this, arguments); const C = CHAR_FX[actor.id] || CHAR_FX[(actor.id || '').replace(/_.*/, '')];
      if (C && skill && skill.ultimate && TR[C[1]]) { try { TR[C[1]](C[2] || (window.__FXPAL && __FXPAL[C[0]]) || ['#ffffff', '#ffe0a0', '#ff8a3a', '#2a0a0a']); } catch (e) { } }
      return _p.apply(this, arguments); };
  });
  window.__FXTR = TR;
})();
