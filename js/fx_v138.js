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
