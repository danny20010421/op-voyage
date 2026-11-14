/* v214 合併、v216 依原本的載入順序拆開：技能特效・中期（fx_v165、fx_v138、fx_v140、fx3d_v145、fx_vfx_v155）。檔案邊界以「==== 原 檔名 ====」標記。
   注意：這些檔案會一層層包住 playChoreo 等函式，載入順序必須維持 index.html 現在的排列，否則角色專屬特效會被通用特效蓋掉。 */

/* ==== 原 js/fx_v165.js ==== */
/* v165 伊姆型態：① 晉升演出 imuFormFx（ext_v165.js 在「最初20人」演出結束後呼叫，swap() 才真正換立繪／名牌／頭像）
   畫面壓暗 → 深紅與紫色的黑雷劈在伊姆身上 → 最後一道巨雷落下的瞬間換成新型態 → 深淵光環擴散、顯示型態名稱。
   ② 角色背包「我的船員」與圖鑑詳細頁：伊姆加上「初始型態／第一～第三型態」切換（v169 起 4 個），換立繪與該型態的技能一覽（樣式見 css/v165.css）。
   不改 crew.js：以 MutationObserver 在畫面更新後補上切換列。 */
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms)), R = (a, b) => a + Math.random() * (b - a);
  const COL = ['#ff2a5a', '#b04aff', '#ffffff', '#ff8ab0'];
  const layer = cls => { const scr = document.getElementById('battleScreen'); if (!scr) return null; let d = scr.querySelector('.' + cls); if (!d) { d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); scr.appendChild(d); } return d; };
  const flash = (a, d, c) => { const el = layer('kd-flash'); if (!el) return; el.style.setProperty('--a', a); el.style.setProperty('--d', d + 's'); el.style.setProperty('--c', c || '#fff'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
  window.imuFormFx = async function (S, actor, form, swap) {
    const el = document.getElementById('bF' + S), F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[form] || {};
    if (typeof X === 'undefined' || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') { swap(); return; }
    let dim = null, swapped = false; const doSwap = () => { if (!swapped) { swapped = true; swap(); } };
    try {
      FXE.ensure(); const p = fighterPoint(S), top = p.y - 160;
      if (typeof SFX !== 'undefined') SFX.play('thunder');
      dim = layer('kd-dim'); if (dim) { void dim.offsetWidth; dim.classList.add('on'); }
      if (el) el.classList.add('morph-out');
      X.glow(p.x, p.y - 20, { color: '#c8003a', r: 240, life: 1.1 });
      for (let i = 0; i < 6; i++) {
        X.bolt(p.x + R(-160, 160), -20, p.x + R(-40, 40), top + R(-30, 80), { color: COL[i % 2], w: R(6, 11), life: .26, amp: 34 });
        if (i % 2 === 0) { flash(.12, .14, '#ffd0dc'); if (typeof SFX !== 'undefined') SFX.play('zap'); }
        await wait(110);
      }
      if (typeof SFX !== 'undefined') SFX.play('thunder');
      X.bolt(p.x, -20, p.x, p.y, { color: '#ffffff', w: 16, life: .4, amp: 24 });
      X.bolt(p.x + 30, -20, p.x - 10, p.y - 40, { color: '#ff2a5a', w: 10, life: .4 });
      flash(.4, .35, form >= 2 ? (form === 3 ? '#f0d0ff' : '#ffd0e0') : '#ffffff');
      if (form === 3) { X.ring(p.x, p.y - 60, { r1: 560, color: '#b04aff', w: 14, life: .9 }); X.glow(p.x, p.y - 80, { color: '#ff2a5a', r: 320, life: 1.2 }); } /* v169：第三型態展翼的大光環 */
      if (typeof shake === 'function') shake();
      doSwap();
      if (el) { el.classList.remove('morph-out'); el.classList.add('morph-in'); setTimeout(() => el.classList.remove('morph-in'), 800); }
      X.ring(p.x, p.y, { r1: 400, color: '#ff2a5a', w: 10, life: .7 });
      X.ring(p.x, p.y, { r1: 260, color: '#b04aff', w: 5, life: .55 });
      X.particles({ x: p.x, y: p.y - 40, n: 50, spd: [160, 460], life: [.5, 1.1], size: [3, 8], colors: COL, shape: 'spark', add: true });
      X.text(p.x, p.y - 230, F.label || '型態', { size: 40, color: '#ffe0e8', color2: '#8a0a2a' });
      X.text(p.x, p.y - 180, F.name || '', { size: 56, color: '#ffffff', color2: '#c8003a' });
      for (let i = 0; i < 3; i++) setTimeout(() => X.bolt(p.x + R(-20, 20), p.y - 80, p.x + R(-220, 220), p.y + R(-160, 40), { color: COL[i], w: 6, life: .22 }), 120 + i * 120);
      await wait(900);
    } finally { if (dim) dim.classList.remove('on'); if (el) el.classList.remove('morph-out'); doSwap(); }
  };

  /* ---------- 角色詳細頁：型態切換 ---------- */
  let pick = 0;
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kindOf = s => s.ultimate ? '奧義' : s.type === 'attack' ? '攻擊' : '輔助';
  function formSkills(form) { const C = CHARACTERS[CID]; if (CID === 'loki') return (form === 0 ? C.skills : (C['form' + (form + 1) + 'Skills'] || []).concat([C.skills[4]])).map((s, i) => ({ s, i, lock: false })); if (form < 2) return C.skills.map((s, i) => ({ s, i, lock: form === 0 && s.formNeed })); return (C['form' + form + 'Skills'] || C.form2Skills).concat([C.skills[4]]).map((s, i) => ({ s, i, lock: false })); } /* v169：第三型態 form3Skills */
  function bar(cur) { const F = CHARACTERS[CID].forms; return `<div class="imu-forms" role="tablist" aria-label="型態">${F.map((f, i) => `<button type="button" role="tab" data-imuf="${i}" aria-selected="${i === cur}" class="${i === cur ? 'on' : ''}"><img src="${f.avatar}" alt=""><span><b>${f.label}</b><small>${f.name}</small></span></button>`).join('')}</div>`; }
  function cxList(form) {
    return `<ol class="cx-skills imu-fsk">${formSkills(form).map(({ s, i, lock }) => `<li class="sk ${lock ? 'lock' : ''} ${s.ultimate ? 'ult' : ''}"><div class="sk-top"><span class="sk-no">${i + 1}</span><b>${s.name}</b><em class="sk-type ${s.type}">${kindOf(s)}</em></div>
      <div class="sk-meta"><span>威力 <b>${s.power || '—'}</b></span><span>命中 <b>${s.accuracy}</b></span><span>次數 <b>${s.maxPP}/${s.maxPP}</b></span></div><p>${s.desc}</p>${(s.tags || []).length ? `<div class="sk-tags">${s.tags.map(([t, cl]) => `<span class="tag ${cl}">${t}</span>`).join('')}</div>` : ''}${lock ? '<div class="sk-lock">🔒 晉升第一型態後開啟</div>' : ''}</li>`).join('')}</ol>`;
  }
  function sbList(form) {
    return formSkills(form).map(({ s, i, lock }) => `<div class="sb-sk ${lock ? 'lock' : ''} ${s.ultimate ? 'ult' : ''} ${s.type === 'support' ? 'sup' : 'atk'}" title="${esc2(s.desc)}"><span class="sb-sk-n">${i + 1}</span><b>${s.ultimate ? '★ ' : ''}${s.name}</b><span>威力 ${s.power || '—'}</span><span>次數 ${s.maxPP}</span>${lock ? '<i>第一型態開啟</i>' : ''}<p>${s.desc}</p></div>`).join('');
  }
  const formImg = (form, skinImg) => form === 0 ? skinImg : CHARACTERS[CID].forms[form].image;
  function enhance(root, kind) {
    if (!root || !CHARACTERS[CID] || !CHARACTERS[CID].forms) return;
    const isImuView = kind === 'cx' ? !!root.querySelector('.cx-hero') && root.__imuId === CID : true; if (!isImuView) return;
    const list = kind === 'cx' ? root.querySelector('.cx-skills') : root.querySelector('.sb-skills'); if (!list || list.dataset.imu) return;
    const art = kind === 'cx' ? root.querySelector('.cx-art img') : root.querySelector('.sb-stage > img'); const base = art ? art.getAttribute('src') : CHARACTERS[CID].image;
    list.dataset.imu = '1';
    const host = document.createElement('div'); host.className = 'imu-forms-host'; host.innerHTML = bar(pick); list.parentNode.insertBefore(host, list);
    const paint = () => { if (art) art.src = formImg(pick, base); if (kind === 'cx') { list.outerHTML; const tmp = document.createElement('div'); tmp.innerHTML = cxList(pick); list.innerHTML = tmp.firstElementChild.innerHTML; } else list.innerHTML = sbList(pick);
      host.innerHTML = bar(pick); host.querySelectorAll('[data-imuf]').forEach(b => b.onclick = () => { pick = +b.dataset.imuf; paint(); }); };
    paint();
  }
  function watch(id, kind, isImu) {
    const el = document.getElementById(id); if (!el || el.__imuObs) return; el.__imuObs = true;
    new MutationObserver(() => { const id = isImu(el); if (!id) return; if (CID !== id) pick = 0; CID = id; if (kind === 'cx') el.__imuId = id; enhance(el, kind); }).observe(el, { childList: true, subtree: false });
  }
  /* v172：洛基也有型態切換（CID＝目前顯示的角色） */
  let CID = 'imu'; const FORM_IDS = ['imu', 'loki'];
  const nameHit = t => FORM_IDS.find(id => CHARACTERS[id] && CHARACTERS[id].forms && (t === CHARACTERS[id].name || t === CHARACTERS[id].forms[0].name)) || null;
  function hook() {
    watch('cxCodexDetail', 'cx', el => { const h = el.querySelector('.cx-head h3'); return h && h.firstChild && el.querySelector('.cx-art:not(.sil)') && !el.querySelector('.reserved') ? nameHit(h.firstChild.textContent.trim()) : null; });
    watch('cxPane_crew', 'sb', el => { const h = el.querySelector('.sb-head h3'); return h && h.firstChild ? nameHit(h.firstChild.textContent.trim()) : null; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
  setTimeout(hook, 1500);
})();

/* ==== 原 js/fx_v138.js ==== */
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
    if (vis && performance.now() - idle < 2500) braf = requestAnimationFrame(bloomLoop); else { bctx.clearRect(0, 0, w, h); bloom.style.visibility = 'hidden'; /* v194：閒置時整層隱藏（這層有模糊＋濾色混合，空著也要合成） */ } }
  function kick() { idle = performance.now(); if (bloom && bloom.style.visibility) bloom.style.visibility = ''; if (!braf) braf = requestAnimationFrame(bloomLoop); }

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

/* ==== 原 js/fx_v140.js ==== */
/* v140 每位角色的招牌動畫（MOTIF）：每次出招都會出現該角色的招牌元素，奧義時規模更大。
   例：路飛橡膠拳影、索隆阿修羅鬼影、艾斯火拳、青雉冰原、艾涅爾雷鼓、羅的 ROOM、漢庫克愛心、多佛朗明哥鳥籠、
   馬爾科不死鳥、凱多青龍、美音音符、莫莉亞蝙蝠、卡塔庫栗年糕、黃猿光束、赤犬岩漿拳、BIG MOM 太陽雲……
   與技能特效共用開關 op_fxpro（低＝不顯示）。 */
const MOTIF = {
  luffy0: 'rubber', nami: 'clima', luffy: 'rubber', luffy_nika: 'nika', zoro: 'asura', sanji: 'kick', robin: 'hands', franky: 'robo', brook: 'notes', jinbe: 'waterfist',
  coby0: 'fist', morgan: 'axe', marine: 'fist', koby_mf: 'fist', garp_mf: 'meteor', garp_hc: 'meteor', koby_hc: 'fist', akainu: 'magma', aokiji: 'icefield', kizaru: 'beams',
  magellan: 'hydra', lucci: 'claws', vergo: 'bamboo', mihawk: 'greenslash', mihawk_w: 'greenslash', crocodile: 'sandspiral', doflamingo: 'birdcage', kuma: 'paws', kuma_eh: 'paws',
  moria: 'bats', law: 'room', law_w: 'room', hancock: 'hearts', weevil: 'axe', blackbeard_w: 'blackhole', blackbeard: 'blackhole', ace: 'firefist', marco: 'phoenix',
  uta: 'notes', king: 'pteranodon', katakuri: 'mochi', catarina: 'foxfire', burgess: 'meteor', vasco: 'firefist', shanks: 'kingsaura', roger: 'kingsaura', buggy: 'parts',
  whitebeard: 'crack', bigmom: 'homies', kaido: 'dragon', makino: 'notes', mayor: 'fist', lordcoast: 'hydra', vivi: 'waterfist', koza: 'fist', enel: 'drums', wiper: 'meteor',
  perona: 'ghosts', hody: 'sharks', shirahoshi: 'seakings', monet: 'snow', sugar: 'toys', kid: 'magnet', kinemon: 'foxfire', tama: 'fist', yamato: 'icefield', vegapunk: 'beams',
  york: 'beams', morgans: 'claws', loki: 'drums', dorry: 'giantblade', brogy: 'giantblade', rocks: 'kingsaura', imu: 'blackhole'
};
(function () {
  const on = () => window.FXPRO && FXPRO.on();
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2, LOW = typeof LOWFX !== 'undefined' && LOWFX;
  const n = k => Math.max(1, Math.round(k * (LOW ? .6 : 1)));
  const add = o => FXE.add(o), P = () => FXE.P;
  const later = (ms, f) => setTimeout(() => { try { f(); } catch (e) { } }, ms / (window.BSPEED || 1));
  const fade = (k, a, b) => k < a ? k / a : k > b ? Math.max(0, (1 - k) / (1 - b)) : 1;
  function heart(c, s) { c.beginPath(); c.moveTo(0, s * .3); c.bezierCurveTo(-s, -s * .4, -s * .4, -s * 1.1, 0, -s * .45); c.bezierCurveTo(s * .4, -s * 1.1, s, -s * .4, 0, s * .3); c.fill(); }
  function fist(c, s, col) { c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, s, s * .8, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(s * .55, -s * .5 + i * s * .34, s * .2, s * .14, 0, 0, TAU); c.fill(); } }
  /* 投射物：從施放者飛到目標 */
  function fly(A, draw, o) { o = o || {}; const life = o.life || .45; add({ add: o.add !== false, life, draw(c, k) { const e = o.ease ? o.ease(k) : 1 - Math.pow(1 - k, 2), x = A.f.x + (A.t.x - A.f.x) * e, y = A.f.y + (A.t.y - A.f.y) * e - Math.sin(k * Math.PI) * (o.arc || 0); c.globalAlpha = fade(k, .05, .9); c.translate(x, y); if (A.d < 0) c.scale(-1, 1); draw(c, k); } }); }
  function fwings(x, y, cols, life, sc) { add({ add: true, life, draw(c, k, dt, t) { c.globalAlpha = fade(k, .12, .75); const flap = Math.sin(t * 10) * .3; [-1, 1].forEach(sd => { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + sd * (.5 + i * .17 + flap), L = (110 + i * 22) * sc, g = c.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L); g.addColorStop(0, cols[0]); g.addColorStop(.5, cols[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.strokeStyle = g; c.lineWidth = (18 - i * 1.5) * sc; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a - sd * .3) * L * .6, y + Math.sin(a - sd * .3) * L * .6, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); } }); } }); }
  const M = {
    rubber(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 70, () => fly({ ...A, t: { x: A.t.x, y: A.t.y + R(-50, 40) } }, (c, k) => { c.save(); c.scale(1 + k * .6, 1 + k * .6); fist(c, big ? 34 : 24, '#f0b98a'); c.restore(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(-40 - j * 14, -12 + j * 12); c.lineTo(-90 - j * 14, -12 + j * 12); c.stroke(); } }, { life: .3, add: false })); },
    nika(A, big) { P().rays(A.f.x, A.f.y - 40, { r: big ? 520 : 320, life: 1.2 }); for (let i = 0; i < n(big ? 30 : 14); i++) later(i * 30, () => P().text(A.f.x + R(-140, 140), A.f.y + R(-160, 40), '咚', { size: R(26, 44), life: .7, color: '#ffffff', color2: '#ffe08a', rot: R(-.4, .4) })); },
    asura(A, big) { const ghosts = big ? 3 : 1; for (let g = 0; g < ghosts; g++) add({ life: 1.1, draw(c, k) { c.globalAlpha = fade(k, .15, .6) * .55; c.translate(A.f.x + A.d * (g - 1) * 50, A.f.y - 30 - g * 10); c.scale(1.4 + g * .1, 1.4 + g * .1); c.fillStyle = '#1a3a2a'; c.shadowColor = '#3adf8a'; c.shadowBlur = 30; c.beginPath(); c.ellipse(0, -60, 34, 42, 0, 0, TAU); c.fill(); c.fillStyle = '#ff3a3a'; c.beginPath(); c.arc(-12, -66, 5, 0, TAU); c.arc(12, -66, 5, 0, TAU); c.fill(); } });
      for (let i = 0; i < (big ? 9 : 3); i++) later(200 + i * 80, () => P().slash(A.t.x + R(-30, 30), A.t.y + R(-40, 30), { r: 150, a: R(-3, 0), span: 2, color: '#c8ffd8', w: 14, life: .3 })); },
    kick(A, big) { for (let i = 0; i < (big ? 6 : 3); i++) later(i * 90, () => P().crescent(A.f.x, A.f.y + 20, A.t.x, A.t.y + R(-40, 40), { color: big ? '#8fd8ff' : '#ffb04a', life: .35 })); },
    hands(A, big) { P().hands(A.t.x, A.t.y, { n: big ? 24 : 10 }); P().particles({ x: A.t.x, y: A.t.y, n: big ? 40 : 18, spd: [80, 260], life: [.6, 1], size: [4, 8], colors: ['#ff8ad8', '#ffd0f0', '#ffffff'], drag: 2 }); },
    robo(A, big) { P().beam(A.f.x + A.d * 40, A.f.y - 20, A.t.x, A.t.y, { c2: '#5ad8ff', w: big ? 50 : 26, life: .6 }); },
    notes(A, big) { const s = '♪♫♬♩'; for (let i = 0; i < n(big ? 26 : 10); i++) later(i * 45, () => { const x0 = A.f.x + R(-40, 40), y0 = A.f.y + R(-80, 20), tx = A.t.x + R(-60, 60), ty = A.t.y + R(-80, 40), ch = s[(Math.random() * 4) | 0], col = ['#ff8ad8', '#8fd8ff', '#ffe08a'][(Math.random() * 3) | 0];
      add({ add: true, life: .9, draw(c, k) { const x = x0 + (tx - x0) * k, y = y0 + (ty - y0) * k - Math.sin(k * Math.PI) * 60; c.globalAlpha = fade(k, .1, .8); c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.font = '900 34px serif'; c.textAlign = 'center'; c.fillText(ch, x, y); } }); }); },
    waterfist(A, big) { P().wave(A.f.x, A.t.x, A.t.y + 40, { h: big ? 220 : 130, life: .7 }); fly(A, (c) => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 50); g.addColorStop(0, '#fff'); g.addColorStop(.4, '#8fd8ff'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, big ? 70 : 46, 0, TAU); c.fill(); }, { life: .4 }); },
    fist(A, big) { fly(A, (c, k) => { c.save(); c.scale(1 + k, 1 + k); fist(c, big ? 30 : 20, '#e8b88a'); c.restore(); }, { life: .3, add: false }); },
    axe(A, big) { P().slash(A.t.x, A.t.y, { r: big ? 220 : 150, a: -2.8, span: 2.6, color: '#d0d8e8', w: 30, life: .4 }); },
    meteor(A, big) { for (let i = 0; i < (big ? 9 : 3); i++) later(i * 110, () => { const x = A.t.x + R(-90, 90); add({ add: true, life: .45, draw(c, k) { const y = -120 + (A.t.y + 120) * k * k, xx = x + (A.t.x - x) * k; c.globalAlpha = 1; const g = c.createLinearGradient(xx, y - 120, xx, y); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, '#ffd08a'); c.strokeStyle = g; c.lineWidth = 14; c.beginPath(); c.moveTo(xx - 30, y - 120); c.lineTo(xx, y); c.stroke(); c.fillStyle = '#5a4030'; c.beginPath(); c.arc(xx, y, 22, 0, TAU); c.fill(); } }); later(430, () => P().burst(x, A.t.y, { color: '#ffaa5a', r: 90 })); }); },
    magma(A, big) { fly(A, (c, k) => { const s = (big ? 90 : 50) * (1 + k * .5); const g = c.createRadialGradient(0, 0, 0, 0, 0, s); g.addColorStop(0, '#fff2a0'); g.addColorStop(.4, '#ff6a1a'); g.addColorStop(.8, '#8a1000'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); }, { life: .5 }); later(450, () => P().flames(A.t.x, A.t.y, { n: big ? 70 : 30 })); },
    icefield(A, big) { add({ add: true, life: 1.2, draw(c, k) { const w = 900 * Math.min(1, k * 2.5); c.globalAlpha = fade(k, .05, .7) * .55; const g = c.createLinearGradient(A.f.x, 0, A.f.x + A.d * w, 0); g.addColorStop(0, '#e8fbff'); g.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = g; c.save(); c.translate(0, A.f.y + 120); c.scale(1, .18); c.fillRect(Math.min(A.f.x, A.f.x + A.d * w), -200, w, 400); c.restore(); } });
      P().spikes && later(250, () => P().spikes(A.t.x, A.t.y + 80, { n: big ? 18 : 8, color: '#bff4ff' })); },
    beams(A, big) { for (let i = 0; i < (big ? 12 : 4); i++) later(i * 60, () => P().beam(A.f.x, A.f.y - R(10, 60), A.t.x + R(-40, 40), A.t.y + R(-60, 40), { c2: '#ffe86f', w: 10, life: .28 })); },
    hydra(A, big) { for (let i = 0; i < (big ? 3 : 1); i++) later(i * 160, () => P().serpent(A.f.x, A.f.y + 40 - i * 40, A.t.x, A.t.y - 20 + i * 30, { body: '#7a3ad8', belly: '#c88aff', eye: '#ffef5a', life: .9, len: 420, w: 40 })); },
    claws(A, big) { P().claws(A.t.x, A.t.y, { color: '#ffe0a0' }); if (big) later(200, () => P().claws(A.t.x, A.t.y, { color: '#ffffff' })); },
    bamboo(A, big) { for (let i = 0; i < (big ? 6 : 3); i++) later(i * 70, () => P().slash(A.t.x + R(-30, 30), A.t.y, { r: 140, a: -1.6, span: .3, color: '#5aff8a', w: 12, life: .25 })); },
    greenslash(A, big) { add({ add: true, life: .6, draw(c, k) { const x = A.f.x + (A.t.x - A.f.x + A.d * 300) * k, h = big ? 520 : 300; c.globalAlpha = fade(k, .05, .7); c.translate(x, A.t.y); c.rotate(.15 * A.d); const g = c.createLinearGradient(-40, 0, 20, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, '#3affb0'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -h / 2); c.quadraticCurveTo(40 * A.d, 0, 0, h / 2); c.quadraticCurveTo(10 * A.d, 0, 0, -h / 2); c.fill(); } }); },
    sandspiral(A, big) { P().tornado(A.t.x, A.t.y + 40, { life: big ? 1.4 : .9, smoke: '#d9b064' }); },
    birdcage(A, big) { add({ add: true, life: big ? 1.6 : .9, draw(c, k) { const e = Math.min(1, k * 2), r = big ? 260 : 150; c.globalAlpha = fade(k, .05, .75); c.strokeStyle = '#ffd0f0'; c.shadowColor = '#ff5ad0'; c.shadowBlur = 10; c.lineWidth = 1.5; const cx = A.t.x, cy = A.t.y; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI; c.beginPath(); c.ellipse(cx, cy - r * .2, r * Math.abs(Math.cos(a)) + 2, r * e, 0, 0, TAU); c.stroke(); } } }); },
    paws(A, big) { for (let i = 0; i < (big ? 7 : 3); i++) later(i * 90, () => fly({ ...A, t: { x: A.t.x + R(-40, 40), y: A.t.y + R(-50, 40) } }, (c, k) => { c.fillStyle = 'rgba(255,190,120,.9)'; c.beginPath(); c.arc(0, 8, 26, 0, TAU); c.fill(); [[-22, -20], [-8, -30], [8, -30], [22, -20]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); }); }, { life: .35 })); },
    bats(A, big) { for (let i = 0; i < n(big ? 30 : 12); i++) later(i * 25, () => { const y0 = A.f.y + R(-100, 40), y1 = A.t.y + R(-80, 60); add({ life: .8, draw(c, k) { const x = A.f.x + (A.t.x - A.f.x) * k, y = y0 + (y1 - y0) * k + Math.sin(k * 20) * 10, f = Math.sin(k * 40) * 10; c.globalAlpha = fade(k, .1, .8); c.fillStyle = '#1a0a2a'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 18, y - 6 + f); c.lineTo(x - 8, y + 2); c.lineTo(x, y + 6); c.lineTo(x + 8, y + 2); c.lineTo(x + 18, y - 6 + f); c.closePath(); c.fill(); } }); }); },
    room(A, big) { add({ add: true, life: big ? 1.6 : 1, draw(c, k) { const r = (big ? 360 : 240) * Math.min(1, k * 3); c.globalAlpha = fade(k, .05, .8) * .5; c.strokeStyle = '#8fe0ff'; c.lineWidth = 3; c.beginPath(); c.arc((A.f.x + A.t.x) / 2, (A.f.y + A.t.y) / 2, r, 0, TAU); c.stroke(); const g = c.createRadialGradient((A.f.x + A.t.x) / 2, (A.f.y + A.t.y) / 2, r * .7, (A.f.x + A.t.x) / 2, (A.f.y + A.t.y) / 2, r); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(1, 'rgba(120,200,255,.35)'); c.fillStyle = g; c.fill(); } });
      later(300, () => P().slash(A.t.x, A.t.y, { r: 200, a: A.d > 0 ? -.3 : -2.8, span: .5, color: '#bff0ff', w: 10, life: .3 })); },
    hearts(A, big) { for (let i = 0; i < n(big ? 34 : 14); i++) later(i * 30, () => { const x0 = A.f.x + R(-30, 30), y0 = A.f.y + R(-60, 20), tx = A.t.x + R(-60, 60), ty = A.t.y + R(-80, 50), s = R(10, 20); add({ add: true, life: .8, draw(c, k) { c.globalAlpha = fade(k, .1, .8); c.translate(x0 + (tx - x0) * k, y0 + (ty - y0) * k); c.rotate(Math.sin(k * 10) * .3); c.fillStyle = '#ff5aa8'; c.shadowColor = '#ff8ad8'; c.shadowBlur = 12; heart(c, s); } }); }); },
    blackhole(A, big) { P().vortex(A.t.x, A.t.y, { r: big ? 200 : 110, color: '#2a0a3a', core: '#000000', rim: '#8a5aff', arms: 6, spin: 10, life: big ? 1.4 : .8 }); },
    firefist(A, big) { fly(A, (c, k) => { const s = big ? 110 : 60; c.save(); c.scale(1 + k * .4, 1 + k * .4); const g = c.createRadialGradient(0, 0, 0, 0, 0, s); g.addColorStop(0, '#fff4c0'); g.addColorStop(.35, '#ffa02e'); g.addColorStop(.8, '#ff3a0a'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); fist(c, s * .35, 'rgba(255,240,200,.9)'); c.restore(); }, { life: .5 }); },
    phoenix(A, big) { fwings(A.f.x, A.f.y - 30, ['#e8fbff', '#3ad8ff'], big ? 1.4 : .9, big ? 1.4 : 1); P().flames(A.f.x, A.f.y, { n: big ? 60 : 24, colors: ['#e8fbff', '#5ae0ff', '#2a8aff'] }); },
    pteranodon(A, big) { P().flames(A.f.x, A.f.y, { n: big ? 60 : 24 }); fwings(A.f.x, A.f.y - 30, ['#fff0c0', '#ff6a2a'], .9, big ? 1.3 : 1); },
    mochi(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 80, () => fly({ ...A, t: { x: A.t.x, y: A.t.y + R(-50, 40) } }, (c, k) => { c.fillStyle = '#f4e8f0'; c.strokeStyle = '#c8a8c0'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 34, 28, 0, 0, TAU); c.fill(); c.stroke(); }, { life: .35, add: false })); },
    foxfire(A, big) { for (let i = 0; i < (big ? 9 : 4); i++) later(i * 60, () => fly({ ...A, t: { x: A.t.x + R(-50, 50), y: A.t.y + R(-60, 40) } }, (c) => { const g = c.createRadialGradient(0, 0, 0, 0, 0, 28); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, '#8a5aff'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 28, 0, TAU); c.fill(); }, { life: .5, arc: R(-80, 80) })); },
    kingsaura(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 60, () => { const a = R(0, TAU), L = R(120, 300); P().bolt(A.f.x, A.f.y, A.f.x + Math.cos(a) * L, A.f.y + Math.sin(a) * L, { color: Math.random() < .5 ? '#140000' : '#ff2a3a', w: 5, life: .3 }); }); if (big) P().ring(A.f.x, A.f.y, { r1: 600, color: '#ff2a3a', w: 24, life: .7 }); },
    parts(A, big) { for (let i = 0; i < (big ? 10 : 4); i++) later(i * 60, () => fly({ ...A, t: { x: A.t.x + R(-60, 60), y: A.t.y + R(-60, 50) } }, (c, k) => { c.rotate(k * 12); c.fillStyle = '#e8c0a0'; c.fillRect(-14, -6, 28, 12); }, { life: .45, arc: 100, add: false })); },
    crack(A, big) { P().cracks && P().cracks(A.t.x, A.t.y, { n: big ? 18 : 10 }); add({ add: true, life: .7, draw(c, k) { const r = 60 + 300 * k; c.globalAlpha = (1 - k) * .8; c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.arc(A.t.x, A.t.y, r, 0, TAU); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(A.t.x, A.t.y, r * .8, 0, TAU); c.stroke(); } }); },
    homies(A, big) { fly(A, (c, k) => { const s = big ? 70 : 44; const g = c.createRadialGradient(0, 0, 0, 0, 0, s); g.addColorStop(0, '#fff7c0'); g.addColorStop(.6, '#ff9a2e'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); c.fillStyle = '#3a1a0a'; c.beginPath(); c.arc(-12, -8, 5, 0, TAU); c.arc(12, -8, 5, 0, TAU); c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a1a0a'; c.beginPath(); c.arc(0, 4, 12, 0, Math.PI); c.stroke(); }, { life: .55, arc: 60 }); },
    dragon(A, big) { P().serpent(A.f.x - A.d * 160, A.f.y + 40, A.t.x + A.d * 80, A.t.y - 40, { body: '#3f7fe8', belly: '#bfe8ff', eye: '#ff5a5a', horn: true, fins: true, fin: '#e8c170', life: big ? 1.2 : .8, len: big ? 520 : 360, w: big ? 60 : 44 }); },
    clima(A, big) { P().puffs && P().puffs(A.t.x, A.t.y - 190, { n: big ? 12 : 6, rad: big ? 140 : 80, life: .9, color: '#e8f0ff' }); for (let i = 0; i < (big ? 6 : 2); i++) later(160 + i * 110, () => { P().bolt(A.t.x + R(-60, 60), A.t.y - 190, A.t.x + R(-20, 20), A.t.y, { color: i % 2 ? '#8fd8ff' : '#fff3a0', w: 6, life: .28 }); }); },
    drums(A, big) { P().drums && P().drums(A.f.x, A.f.y - 40, { life: 1 }); for (let i = 0; i < (big ? 6 : 2); i++) later(150 + i * 120, () => { P().bolt(A.t.x + R(-60, 60), -40, A.t.x + R(-20, 20), A.t.y, { color: '#ffe86f', w: 6, life: .3 }); P().flash('#fffbd0', .08, .2); }); },
    ghosts(A, big) { for (let i = 0; i < n(big ? 14 : 6); i++) later(i * 60, () => fly({ ...A, t: { x: A.t.x + R(-60, 60), y: A.t.y + R(-80, 40) } }, (c, k) => { c.fillStyle = 'rgba(255,240,255,.85)'; c.beginPath(); c.arc(0, -6, 16, Math.PI, 0); c.lineTo(16, 12); for (let j = 0; j < 4; j++) c.lineTo(12 - j * 8, 6 + (j % 2) * 6); c.closePath(); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(-5, -6, 2.5, 0, TAU); c.arc(5, -6, 2.5, 0, TAU); c.fill(); }, { life: .7, arc: R(-60, 60), add: false })); },
    sharks(A, big) { for (let i = 0; i < (big ? 8 : 3); i++) later(i * 80, () => P().serpent(A.f.x, A.f.y + R(-60, 40), A.t.x, A.t.y + R(-40, 40), { body: '#6f8fa8', belly: '#e8f2f8', eye: '#ffd23b', fins: true, fin: '#8fb0c8', life: .45, len: 220, w: 34 })); },
    seakings(A, big) { for (let i = 0; i < (big ? 3 : 1); i++) later(i * 200, () => P().serpent(A.f.x - A.d * 220, A.f.y + 60 - i * 50, A.t.x, A.t.y - 40 + i * 40, { body: '#2f9f8a', belly: '#c9f5e6', eye: '#ffef5a', fins: true, life: 1, len: 520, w: 56 })); },
    snow(A, big) { P().particles({ x: A.t.x, y: A.t.y - 120, n: big ? 70 : 30, spd: [40, 160], ang: [1.2, 1.9], life: [.8, 1.3], size: [3, 6], colors: ['#ffffff', '#e8fbff'], drag: 1 }); },
    toys(A, big) { for (let i = 0; i < (big ? 6 : 3); i++) later(i * 80, () => P().text(A.t.x + R(-60, 60), A.t.y + R(-60, 30), ['🧸', '🎈', '🪀'][i % 3], { size: 40, life: .7 })); },
    magnet(A, big) { for (let i = 0; i < n(big ? 30 : 12); i++) later(i * 25, () => fly({ ...A, f: { x: A.f.x + R(-120, 120), y: A.f.y + R(-160, 40) } }, (c, k) => { c.rotate(k * 10); c.fillStyle = '#9aa8b8'; c.fillRect(-10, -4, 20, 8); }, { life: .4, add: false })); },
    giantblade(A, big) { add({ add: true, life: .55, draw(c, k) { const a = -2.4 + k * 2.4; c.globalAlpha = fade(k, .05, .7); c.translate(A.t.x - A.d * 60, A.t.y - 200); c.rotate(A.d > 0 ? a : -a); c.fillStyle = '#d8e0f0'; c.shadowColor = '#ffffff'; c.shadowBlur = 20; c.fillRect(-14, 0, 28, big ? 420 : 300); } }); }
  };
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof playChoreo !== 'function') return; const _p = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      /* v171：招牌元素不再每招都出現（同一個鳥籠／拳影每招都蓋滿畫面，招式看起來都一樣）：奧義一定有，一般招只有第 1、3 招 */
      const f = on() && actor && MOTIF[actor.id] && (!skill || skill.ultimate || idx % 2 === 0) && M[MOTIF[actor.id]];
      if (f) { try { const S = side === 'P' ? 'L' : 'R', T = S === 'L' ? 'R' : 'L', A = { S, T, f: fighterPoint(S), t: fighterPoint(T), d: S === 'L' ? 1 : -1 }; const big = !!(skill && skill.ultimate), sup = skill && skill.type === 'support';
        if (sup && !['nika', 'phoenix', 'pteranodon', 'asura', 'kingsaura', 'drums', 'room', 'notes'].includes(MOTIF[actor.id])) { /* 輔助招式：招牌元素繞著自己 */ later(200, () => f({ ...A, t: { x: A.f.x + A.d * 10, y: A.f.y - 60 } }, big)); }
        else later(big ? 900 : 220, () => f(A, big)); } catch (e) { } }
      return _p.apply(this, arguments); };
  });
  window.__MOTIF = M;
})();

/* ==== 原 js/fx3d_v145.js ==== */
/* v145 戰鬥特效 3D 層（Three.js / WebGL2）：
   ① 背景層 #bGL：戰鬥背景改用 GPU 繪製——命中時衝擊波扭曲背景（含色差）、奧義時鏡頭推近＋放射模糊、依招式屬性打光、火系熱浪。
   ② 粒子層 #bPGL：GPU 粒子（一次最多數千顆），依屬性有火星與火焰、冰晶、電火花、水珠與氣泡、暗黑煙霧、光點、花瓣、碎石與煙塵、斬擊光痕。
   ③ 奧義最後一擊的「衝擊格」（黑白反轉兩格）、出招殘影、受擊全身閃白。
   原本的 2D 特效（fx.js、fx_v138.js、各角色編排）照常播放，這一層疊加在上面。
   開關：技能特效「高」（op_fxpro）且畫質不是「省電」（op_gfx）才開；不支援 WebGL2 時自動不開。Three.js 在第一次進戰鬥時才載入。 */
(function () {
  const ok = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })();
  const enabled = () => { try { return ok && localStorage.getItem('op_fxpro') !== '0' && localStorage.getItem('op_gfx') !== 'low' && !window.__fxAuto3DOff; } catch (e) { return ok; } }; /* v171：__fxAuto3DOff＝實際掉幀時自動關閉（fx_v171.js） */
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  const $ = id => document.getElementById(id);
  const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const THEME = { '火': 'fire', '冰': 'ice', '雷電': 'bolt', '水': 'water', '魚人': 'water', '闇': 'dark', '超能': 'psy', '龍': 'psy', '自然': 'nature', '格鬥': 'fist', '獸': 'fist', '巨人': 'fist' };
  const COLT = { blue: 'ice', gold: 'light', red: 'fire', purple: 'dark', green: 'nature' };
  const PAL0 = { fire: ['#fff3c0', '#ffb02e', '#ff4a1a', '#7a1200'], ice: ['#ffffff', '#c8f4ff', '#6fd3ff', '#1a5aa8'], bolt: ['#ffffff', '#fff27a', '#ffd23b', '#6a8aff'], water: ['#ffffff', '#bfeaff', '#3fa8ff', '#0a3a8a'], dark: ['#f0d0ff', '#b05aff', '#5a1a9a', '#120018'], light: ['#ffffff', '#fff6c8', '#ffd86a', '#8a6a1a'], fist: ['#ffffff', '#ffe0a0', '#ff8a3a', '#5a2a0a'] };
  const pal = th => (window.__FXPAL && __FXPAL[th]) || PAL0[th] || PAL0.fist;
  const themeOf = f => { const C = f && typeof CHAR_FX !== 'undefined' && CHAR_FX[f.id]; if (C) return C[0]; for (const x of (f && f.types) || []) if (THEME[x]) return THEME[x]; return 'fist'; };
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  let T = null, loading = null, rd = null, prd = null, bgM = null, bgS = null, cam = null, pS = null, pCam = null, ADD = null, NRM = null;
  const MAXP = MOB ? 1400 : 3200;
  /* ---------- 載入 ---------- */
  function load() { if (T || loading || !enabled()) return loading; loading = import('three').then(m => { T = m; init(); }).catch(e => { console.warn('戰鬥 3D 特效載入失敗', e); }); return loading; }

  /* ---------- ① 背景層 ---------- */
  const BG_FS = `uniform sampler2D tBg; uniform vec2 uRes, uImg, uZC; uniform float uTime, uDim, uSat, uZoom, uRad, uTintK, uHaze, uReady; uniform vec3 uTint; uniform vec4 uW[4]; varying vec2 vUv;
    vec2 cover(vec2 uv){ float sa = uRes.x/uRes.y, ia = uImg.x/uImg.y; vec2 s = sa > ia ? vec2(1., ia/sa) : vec2(sa/ia, 1.); return (uv - .5)*s + .5; }
    float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float ns(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
    void main(){ vec2 asp = vec2(uRes.x/uRes.y, 1.); vec2 uv = vUv; vec2 off = vec2(0.); float ca = 0.;
      for (int i = 0; i < 4; i++) { vec4 w = uW[i]; float age = uTime - w.z; if (w.w <= 0. || age < 0. || age > .9) continue; float r = age*1.35, d = length((uv - w.xy)*asp), k = exp(-pow((d - r)/.07, 2.)) * w.w * (1. - age/.9); off += normalize((uv - w.xy)*asp + 1e-5) * k * .035; ca += k; }
      if (uHaze > 0.) off += vec2(ns(uv*8. + vec2(0., -uTime*2.)) - .5, ns(uv*7. + vec2(uTime, -uTime*1.6)) - .5) * .012 * uHaze;
      uv = uZC + (uv + off - uZC) / uZoom;
      vec3 col = vec3(0.); float n = uRad > .001 ? 8. : 1.;
      for (int i = 0; i < 8; i++) { if (float(i) >= n) break; vec2 su = uZC + (uv - uZC) * (1. - uRad*float(i)/8.*.12); vec2 cu = cover(su);
        col += vec3(texture2D(tBg, cover(su + vec2(ca*.006, 0.))).r, texture2D(tBg, cu).g, texture2D(tBg, cover(su - vec2(ca*.006, 0.))).b); }
      col /= n; float l = dot(col, vec3(.299,.587,.114)); col = mix(vec3(l), col, uSat) * uDim;
      col = mix(col, col*(.55 + uTint*.75), uTintK); vec2 q = vUv - .5; col *= 1. - dot(q, q)*.5;
      gl_FragColor = vec4(col * uReady, uReady); }`;
  const BU = {};
  function initBg() {
    const scr = $('battleScreen'), cv = document.createElement('canvas'); cv.id = 'bGL'; cv.className = 'b-gl'; cv.setAttribute('aria-hidden', 'true'); $('bBg').insertAdjacentElement('afterend', cv);
    rd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); rd.setClearColor(0x000000, 0);
    Object.assign(BU, { tBg: { value: null }, uRes: { value: new T.Vector2(1, 1) }, uImg: { value: new T.Vector2(16, 9) }, uZC: { value: new T.Vector2(.5, .5) }, uTime: { value: 0 }, uDim: { value: .66 }, uSat: { value: 1.1 }, uZoom: { value: 1 }, uRad: { value: 0 }, uTintK: { value: 0 }, uHaze: { value: 0 }, uReady: { value: 0 }, uTint: { value: new T.Color(1, 1, 1) }, uW: { value: [0, 1, 2, 3].map(() => new T.Vector4(0, 0, -9, 0)) } });
    bgM = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ uniforms: BU, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: BG_FS, transparent: true, depthTest: false }));
    bgS = new T.Scene(); bgS.add(bgM); cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    /* 背景圖換了就重新載入（battle.js 設定 #bBg 的 background-image） */
    const sync = () => { const m = /url\(["']?([^"')]+)["']?\)/.exec($('bBg').style.backgroundImage || ''); const url = m && m[1]; if (!url || url === BS.url) return; BS.url = url; BU.uReady.value = 0; $('battleScreen').classList.remove('gl-bg');
      new T.TextureLoader().load(url, t => { if (BS.url !== url) return; t.colorSpace = T.SRGBColorSpace; t.minFilter = T.LinearFilter; t.generateMipmaps = false; if (BU.tBg.value) BU.tBg.value.dispose(); BU.tBg.value = t; BU.uImg.value.set(t.image.width, t.image.height); BU.uReady.value = 1; $('battleScreen').classList.add('gl-bg'); wake(); }); };
    new MutationObserver(sync).observe($('bBg'), { attributes: true, attributeFilter: ['style'] }); sync();
    new MutationObserver(() => wake()).observe(scr, { attributes: true, attributeFilter: ['class'] });
  }
  const BS = { url: '', zoom: 1, zT: 1, rad: 0, rT: 0, tint: [1, 1, 1], tK: 0, tT: 0, haze: 0, hT: 0, zc: [.5, .5], waves: 0 };

  /* ---------- ② 粒子層：每顆粒子是一個面片（可拉長成光痕、旋轉、換形狀） ---------- */
  const P_VS = `attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; varying vec2 vUv; varying vec4 vCol; varying float vShape;
    void main(){ vUv = uv; vCol = vec4(iC.rgb, iB.w); vShape = iC.w; vec2 p = position.xy; p.x *= iB.y; float c = cos(iB.z), s = sin(iB.z); p = mat2(c, s, -s, c) * p * iB.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(iA.xy + p, 0., 1.); }`;
  const P_FS = `varying vec2 vUv; varying vec4 vCol; varying float vShape; void main(){ vec2 q = vUv*2. - 1.; float r = length(q); float a;
      if (vShape < .5) { a = exp(-r*r*4.5) + smoothstep(.22, 0., r)*.9; }                                   /* 光點 */
      else if (vShape < 1.5) { a = exp(-q.y*q.y*18.) * smoothstep(1., .2, abs(q.x)) * (1. + smoothstep(.5, 1., q.x)); }   /* 光痕（往前方較亮） */
      else if (vShape < 2.5) { a = smoothstep(1., .9, abs(q.x) + abs(q.y)) * (.55 + .45*(1. - abs(q.x))) ; }       /* 冰晶 */
      else if (vShape < 3.5) { a = smoothstep(.12, 0., abs(r - .8)) + smoothstep(.95, .0, r)*.12; }           /* 圓環（衝擊波、氣泡） */
      else if (vShape < 4.5) { a = smoothstep(1., .1, r) * .55; }                                               /* 煙霧 */
      else if (vShape < 5.5) { vec2 k = q*vec2(1., 2.); a = smoothstep(1., .75, length(k)); }                  /* 花瓣、葉片 */
      else if (vShape < 6.5) { a = smoothstep(1., .85, max(abs(q.x), abs(q.y))) ; }                             /* 碎石 */
      else { float st = max(exp(-q.x*q.x*60.)*smoothstep(1., 0., abs(q.y)), exp(-q.y*q.y*60.)*smoothstep(1., 0., abs(q.x))); a = st + exp(-r*r*8.)*.6; }  /* 十字星光 */
      gl_FragColor = vec4(vCol.rgb * a * vCol.a, a * vCol.a); if (gl_FragColor.a < .003) discard; }`;
  const PS = { list: [], free: [] };
  function mkLayer(blend) {
    const g = new T.InstancedBufferGeometry(); g.copy(new T.PlaneGeometry(1, 1)); g.instanceCount = 0;
    const A = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4), B = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4), C = new T.InstancedBufferAttribute(new Float32Array(MAXP * 4), 4);
    [A, B, C].forEach(x => x.setUsage(T.DynamicDrawUsage)); g.setAttribute('iA', A); g.setAttribute('iB', B); g.setAttribute('iC', C);
    const m = new T.Mesh(g, new T.ShaderMaterial({ vertexShader: P_VS, fragmentShader: P_FS, transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true,
      blending: blend === 'add' ? T.CustomBlending : T.NormalBlending, blendSrc: T.OneFactor, blendDst: blend === 'add' ? T.OneFactor : T.OneMinusSrcAlphaFactor }));
    m.frustumCulled = false; pS.add(m); return { m, g, A, B, C };
  }
  function initP() {
    const cv = document.createElement('canvas'); cv.id = 'bPGL'; cv.className = 'b-canvas b-pgl'; cv.setAttribute('aria-hidden', 'true');
    const ref = $('bBloom') || $('bCanvas'); ref.insertAdjacentElement('afterend', cv);
    prd = new T.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true }); prd.setClearColor(0x000000, 0);
    pS = new T.Scene(); pCam = new T.OrthographicCamera(0, 1, 0, 1, -1, 1); NRM = mkLayer('normal'); ADD = mkLayer('add');
  }
  function init() { try { initBg(); initP(); window.FX3D.ready = true; } catch (e) { console.warn('戰鬥 3D 特效初始化失敗', e); window.FX3D.ready = false; } }

  /* 座標：特效以「畫面座標」（#battleScreen 內的像素）計算 */
  let geo = { S: 1, OX: 0, OY: 0, SW: 1, SH: 1 };
  function measure() { const A = $('bArena'), scr = $('battleScreen'); if (!A || !scr) return; const aR = A.getBoundingClientRect(), sR = scr.getBoundingClientRect(); geo = { S: aR.width / (A.offsetWidth || 1), OX: aR.left - sR.left, OY: aR.top - sR.top, SW: sR.width, SH: sR.height }; }
  const toScr = p => [p.x * geo.S + geo.OX, p.y * geo.S + geo.OY];
  const pt = side => { measure(); try { return toScr(fighterPoint(side)); } catch (e) { return [geo.SW * (side === 'L' ? .3 : .7), geo.SH * .5]; } };

  /* 粒子：x y vx vy 大小 長寬比 角度 角速度 顏色 透明度 形狀 壽命 阻力 重力 長大 加法混合 */
  function emit(o) { if (PS.list.length >= MAXP * 2 - 10) return; PS.list.push(Object.assign({ t: 0, vx: 0, vy: 0, s: 20, g: 0, drag: 0, grow: 0, rot: 0, vr: 0, st: 1, a: 1, shape: 0, add: true, life: .5, flick: 0, stretch: 0 }, o)); }
  function spark(x, y, c, n, sp, o) { for (let i = 0; i < n; i++) { const a = R(0, TAU), v = R(sp[0], sp[1]); emit(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - R(0, 150), s: R(10, 22), shape: 1, stretch: .022, col: c, life: R(.25, .6), drag: 3.2, g: 900 }, o)); } }
  function glow(x, y, c, s, life, o) { emit(Object.assign({ x, y, s, col: c, life, shape: 0, grow: -.2 }, o)); }
  function ring(x, y, c, s0, s1, life, o) { emit(Object.assign({ x, y, s: s0, s1, col: c, life, shape: 3, ring: true }, o)); }

  /* ---------- 屬性爆發 ---------- */
  function impact(x, y, th, big, side) {
    const P = pal(th).map(hex), W = [1, 1, 1], k = big ? 1.15 : .9, n = v => Math.round(v * k * (MOB ? .65 : 1));
    glow(x, y, W, big ? 170 : 120, .16, { a: .8 }); glow(x, y, P[2], big ? 300 : 210, .3, { grow: .4, a: .55 }); ring(x, y, mix(P[1], W, .3), 40, big ? 480 : 320, big ? .5 : .4, { a: .75 }); if (big) ring(x, y, P[2], 30, 760, .65, { a: .45 });
    spark(x, y, mix(P[1], W, .25), n(50), [380, big ? 1400 : 950]);
    const fx = {
      fire() { for (let i = 0; i < n(36); i++) emit({ x: x + R(-60, 60), y: y + R(-40, 40), vx: R(-90, 90), vy: R(-320, -90), s: R(14, 30), col: mix(P[1], P[2], Math.random()), life: R(.6, 1.2), shape: 0, flick: 1, drag: 1, g: -60 });
        for (let i = 0; i < n(14); i++) emit({ x: x + R(-50, 50), y: y + R(-30, 30), vx: R(-60, 60), vy: R(-220, -60), s: R(60, 120), grow: 1.4, col: mix(P[2], P[3], .3), life: R(.5, .9), shape: 4, drag: 1.4 }); },
      ice() { for (let i = 0; i < n(34); i++) { const a = R(0, TAU), v = R(240, 820); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, s: R(14, 34), st: R(.45, .7), rot: R(0, TAU), vr: R(-12, 12), col: mix(P[1], W, .5), life: R(.6, 1.1), shape: 2, drag: 2, g: 1100 }); }
        for (let i = 0; i < n(8); i++) emit({ x: x + R(-60, 60), y: y + R(-40, 40), vx: R(-40, 40), vy: R(-50, 10), s: R(90, 160), grow: 1, col: P[1], a: .45, life: R(.7, 1.1), shape: 4, add: false }); },
      bolt() { for (let b = 0; b < (big ? 4 : 2); b++) { let px = x, py = y; const a0 = R(0, TAU), L = R(160, 380); for (let i = 0; i < 18; i++) { const t = i / 17; px = x + Math.cos(a0) * L * t + R(-26, 26); py = y + Math.sin(a0) * L * t + R(-26, 26); glow(px, py, i % 3 ? P[2] : W, R(16, 30), R(.12, .22), { flick: 1 }); } }
        spark(x, y, mix(P[1], W, .5), n(60), [700, 1800], { life: R(.15, .3), stretch: .03 }); },
      water() { for (let i = 0; i < n(60); i++) { const a = R(-Math.PI, 0), v = R(300, 900); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(8, 18), st: .7, col: mix(P[1], W, .4), life: R(.6, 1), shape: 0, drag: .8, g: 1500 }); }
        for (let i = 0; i < n(14); i++) emit({ x: x + R(-80, 80), y: y + R(-50, 50), vx: R(-30, 30), vy: R(-160, -60), s: R(14, 36), col: P[1], life: R(.8, 1.4), shape: 3, flick: 0 }); ring(x, y, P[2], 60, 520, .6, { st: .45 }); },
      dark() { for (let i = 0; i < n(16); i++) emit({ x: x + R(-60, 60), y: y + R(-50, 50), vx: R(-80, 80), vy: R(-140, -20), s: R(80, 170), grow: 1.2, col: [.06, .0, .1], a: .75, life: R(.6, 1.1), shape: 4, add: false, drag: 1.5 });
        for (let i = 0; i < n(40); i++) { const a = R(0, TAU), v = R(80, 420); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, s: R(16, 34), col: mix(P[1], P[2], Math.random()), life: R(.6, 1.2), shape: 0, drag: 2.2, g: -120, flick: 1 }); } },
      light() { for (let i = 0; i < n(36); i++) { const a = R(0, TAU), v = R(120, 600); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(20, 48), rot: R(0, 1), vr: R(-3, 3), col: mix(P[1], W, .5), life: R(.5, 1), shape: 7, drag: 2.6 }); } },
      nature() { for (let i = 0; i < n(32); i++) { const a = R(0, TAU), v = R(160, 620); emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, s: R(14, 26), rot: R(0, TAU), vr: R(-9, 9), col: mix(P[1], P[2], Math.random()), life: R(.9, 1.5), shape: 5, drag: 2.4, g: 260, add: false }); } },
      fist() { const gy = y + R(60, 110); for (let i = 0; i < n(28); i++) { const a = R(-Math.PI * .95, -Math.PI * .05), v = R(300, 950); emit({ x, y: gy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: R(8, 22), rot: R(0, TAU), vr: R(-10, 10), col: mix(P[3], [.55, .45, .35], .5), life: R(.6, 1.1), shape: 6, g: 2000, drag: .4, add: false }); }
        for (let i = 0; i < n(12); i++) emit({ x: x + R(-90, 90), y: gy + R(-10, 20), vx: R(-160, 160), vy: R(-80, -10), s: R(90, 170), grow: 1.3, col: [.62, .56, .5], a: .5, life: R(.8, 1.3), shape: 4, add: false, drag: 2 }); },
      sword() { const a = R(-.7, .7); for (let i = 0; i < 3; i++) { emit({ x: x + R(-30, 30), y: y + (i - 1) * 46, s: big ? 820 : 640, st: .05, rot: a + (i - 1) * .14, col: mix(P[2], W, .5), life: .32, shape: 1 }); emit({ x: x + R(-30, 30), y: y + (i - 1) * 46, s: big ? 900 : 700, st: .12, rot: a + (i - 1) * .14, col: P[2], a: .45, life: .38, shape: 1 }); }
        spark(x, y, W, n(70), [600, 1600], { life: R(.15, .35) }); this.fist(); },
      haki() { this.dark(); this.bolt(); },
    };
    const alias = { psy: 'light', sand: 'fist', quake: 'fist', poison: 'dark', shadow: 'dark', thread: 'sword', haki: 'haki' };
    try { (fx[th] || fx[alias[th]] || fx.fist).call(fx); } catch (e) { }
    /* 背景：衝擊波扭曲＋屬性閃光 */
    if (BU.uW && !RM) { const w = BU.uW.value[BS.waves++ % 4]; w.set(x / geo.SW, 1 - y / geo.SH, BU.uTime.value, big ? 1.25 : .85); BS.punch = Math.max(BS.punch || 0, big ? .07 : .045); BS.pc = [x / geo.SW, 1 - y / geo.SH]; }   /* 背景震推 */
    BS.tint = pal(th).map(hex)[2]; BS.tK = Math.max(BS.tK, big ? .5 : .3); BS.tT = 0;
    if (side) silhouette(side);
    wake();
  }

  /* 受擊閃白：用立繪當遮罩的白色剪影，不動到原本立繪的濾鏡動畫 */
  function silhouette(side) { const f = $('bF' + side), img = $('bImg' + side); if (!f || !img || !img.src) return; let s = f.querySelector('.fx3-sil');
    if (!s) { s = document.createElement('i'); s.className = 'fx3-sil'; f.appendChild(s); }
    Object.assign(s.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', webkitMaskImage: `url("${img.src}")`, maskImage: `url("${img.src}")`, transform: getComputedStyle(img).transform === 'none' ? '' : getComputedStyle(img).transform });
    s.getAnimations().forEach(a => a.cancel()); s.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 170, easing: 'ease-out' }); }

  /* 出招殘影 */
  function ghosts(side, col) { if (RM) return; const img = $('bImg' + side), scr = $('battleScreen'); if (!img || !scr) return; const sR = scr.getBoundingClientRect(); let k = 0;
    const tick = () => { if (k++ > 8) return; const r = img.getBoundingClientRect(); if (r.width > 4) { const g = img.cloneNode(); g.removeAttribute('id'); g.className = 'fx3-ghost'; Object.assign(g.style, { left: r.left - sR.left + 'px', top: r.top - sR.top + 'px', width: r.width + 'px', height: r.height + 'px', filter: `brightness(1.7) drop-shadow(0 0 10px ${col})` });
      scr.appendChild(g); g.animate([{ opacity: .42 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' }).onfinish = () => g.remove(); } setTimeout(tick, 48 / (window.BSPEED || 1)); }; tick(); }

  /* 奧義最後一擊：黑白衝擊格 */
  function impactFrame() { if (RM) return; const s = $('battleScreen'); s.classList.add('fx3-if1'); setTimeout(() => { s.classList.remove('fx3-if1'); s.classList.add('fx3-if2'); }, 70); setTimeout(() => s.classList.remove('fx3-if2'), 150); }

  /* 奧義蓄力：粒子往施放者聚集、鏡頭推近、背景染色 */
  function charge(side, th, ult) { const [x, y] = pt(side), P = pal(th).map(hex), N = (ult ? 90 : 30) * (MOB ? .6 : 1);
    for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(180, ult ? 520 : 300), life = R(.45, .8); emit({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d / life, vy: -Math.sin(a) * d / life, s: R(12, 26), shape: 1, stretch: .012, col: mix(P[1], [1, 1, 1], .4), life, t: -R(0, ult ? .35 : .15) }); }
    glow(x, y, P[2], ult ? 300 : 180, ult ? 1 : .5, { grow: .3, a: .5 }); if (ult) { ring(x, y, P[2], 700, 60, .8, { a: .6 }); BS.zT = 1.09; BS.rT = 1; BS.zc = [x / geo.SW, 1 - y / geo.SH]; BS.hT = th === 'fire' ? 1 : 0; }
    BS.tint = P[2]; BS.tK = Math.max(BS.tK, ult ? .45 : .2); BS.tT = 0; wake(); }



  /* ---------- v145 第二輪：鏡頭推近、命中停格、奧義氣場、地面焦痕、畫面邊緣屬性光 ---------- */
  let dolly = null;
  /* 疊加在原本的鏡頭縮放（--cam、--camY）之上，以角色位置為中心推近 */
  let dollyT = '';
  function camPush(side, s, ms) { if (RM) return; const a = $('bArena'); if (!a) return; let p; try { p = fighterPoint(side); } catch (e) { p = null; } if (!p) return;
    const cs = getComputedStyle(a), ox = parseFloat(cs.transformOrigin) || a.offsetWidth / 2, oy = parseFloat(cs.transformOrigin.split(' ')[1]) || a.offsetHeight, dx = p.x - ox, dy = p.y - oy;
    const to = `translate(${dx}px, ${dy}px) scale(${s}) translate(${-dx}px, ${-dy}px)`, from = dollyT || 'translate(0px, 0px) scale(1) translate(0px, 0px)';
    if (dolly) dolly.cancel(); dollyT = to; dolly = a.animate([{ transform: from }, { transform: to }], { duration: ms, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards', composite: 'add' }); }
  function camRelease(ms) { if (!dolly) return; const a = $('bArena'), from = dollyT; dolly.cancel(); dolly = null; dollyT = '';
    a.animate([{ transform: from }, { transform: 'translate(0px, 0px) scale(1) translate(0px, 0px)' }], { duration: ms || 420, easing: 'cubic-bezier(.3,0,.2,1)', composite: 'add' }); }
  function hitStop(ms) { if (RM) return; const s = $('battleScreen'); s.classList.add('fx3-stop'); stopUntil = performance.now() + ms; setTimeout(() => s.classList.remove('fx3-stop'), ms); }
  let stopUntil = 0;
  function aura2(side, th) { if (RM) return; const f = $('bF' + side), img = $('bImg' + side); if (!f || !img || !img.src) return; const col = toHex(pal(th).map(hex)[2]); let a = f.querySelector('.fx3-aura');
    if (!a) { a = document.createElement('i'); a.className = 'fx3-aura'; f.insertBefore(a, img); }
    Object.assign(a.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', background: col, webkitMaskImage: `url("${img.src}")`, maskImage: `url("${img.src}")`, transform: (getComputedStyle(img).transform === 'none' ? '' : getComputedStyle(img).transform) });
    a.getAnimations().forEach(x => x.cancel()); a.animate([{ opacity: 0, scale: '1' }, { opacity: .9, scale: '1.05', offset: .25 }, { opacity: .55, scale: '1.08', offset: .6 }, { opacity: .85, scale: '1.06', offset: .8 }, { opacity: 0, scale: '1.12' }], { duration: 1500 / (window.BSPEED || 1), easing: 'ease-out' }); }
  function scorch(x, y, th) { const P = pal(th).map(hex), gy = y + 105; emit({ x, y: gy, s: 340, st: .26, col: [.04, .03, .03], a: .55, life: 1.8, shape: 4, add: false });
    emit({ x, y: gy, s: 260, st: .22, col: mix(P[2], [1, 1, 1], .2), a: .7, life: .9, shape: 0, grow: .3 });
    for (let i = 0; i < 10; i++) { const a = R(-Math.PI, Math.PI); emit({ x: x + Math.cos(a) * 50, y: gy + Math.sin(a) * 12, s: R(70, 150), st: .05, rot: Math.atan2(Math.sin(a) * .26, Math.cos(a)), col: [.05, .04, .04], a: .6, life: 1.6, shape: 1, add: false }); } }
  function edge(th) { const P = pal(th).map(hex), D = Math.hypot(geo.SW, geo.SH); ring(geo.SW / 2, geo.SH / 2, P[2], D * .62, D * .52, .7, { a: .65 }); ring(geo.SW / 2, geo.SH / 2, mix(P[1], [1, 1, 1], .3), D * .58, D * .5, .5, { a: .5 }); }

  /* ---------- v145 奧義強化 ---------- */
  const toHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
  /* 蓄力：腳下光圈＋屬性能量往上竄（約 1 秒） */
  function aura(side, th) { if (RM) return; const [x, y] = pt(side), P = pal(th).map(hex), W = [1, 1, 1], n = MOB ? 4 : 8; let k = 0;
    const tick = () => { if (k++ > 18 || !cur) return; const fy = y + 110;
      for (let i = 0; i < n; i++) emit({ x: x + R(-80, 80), y: fy + R(-10, 10), vx: R(-25, 25), vy: R(-760, -360), s: R(12, 24), shape: 1, stretch: .016, col: mix(P[i % 2 ? 1 : 2], W, .3), life: R(.35, .6), drag: .6 });
      if (k % 3 === 1) { glow(x, fy, P[2], 340, .3, { st: .3, a: .55 }); ring(x, fy, mix(P[1], W, .3), 60, 300, .45, { st: .3, a: .6 }); }
      wake(); setTimeout(tick, 50 / (window.BSPEED || 1)); }; tick(); }
  /* 終結一擊：集中線＋三重衝擊波＋光柱＋屬性風暴＋餘燼 */
  function finisher(x, y, th) { const P = pal(th).map(hex), W = [1, 1, 1], D = Math.hypot(geo.SW, geo.SH), N = MOB ? 40 : 72;
    for (let i = 0; i < N; i++) { const a = R(0, TAU), d = R(.22, .42) * D; emit({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, s: R(.25, .5) * D, st: R(.012, .03), rot: a, col: i % 3 ? W : mix(P[1], W, .4), a: R(.5, .9), life: R(.22, .38), shape: 1 }); }
    glow(x, y, W, 460, .22, { a: .95 }); glow(x, y, P[2], 900, .5, { grow: .3, a: .5 });
    [0, 90, 180].forEach((t, i) => setTimeout(() => { ring(x, y, i === 1 ? W : mix(P[1 + (i > 1)], W, .25), 60, D * (.55 + i * .18), .55 + i * .1, { a: .8 - i * .15 }); wake(); }, t / (window.BSPEED || 1)));
    emit({ x, y: y - geo.SH * .1, s: geo.SH * 1.6, st: .06, rot: Math.PI / 2, col: mix(P[2], W, .5), a: .85, life: .42, shape: 1 }); emit({ x, y: y - geo.SH * .1, s: geo.SH * 1.7, st: .16, rot: Math.PI / 2, col: P[2], a: .45, life: .55, shape: 1 });
    scorch(x, y, th); edge(th); hitStop(90);
    impact(x, y, th, true); setTimeout(() => impact(x + R(-90, 90), y + R(-60, 40), th, true), 120 / (window.BSPEED || 1)); setTimeout(() => impact(x + R(-120, 120), y + R(-80, 60), th, true), 260 / (window.BSPEED || 1));
    let k = 0; const ember = () => { if (k++ > 26) return; for (let i = 0; i < (MOB ? 3 : 5); i++) emit({ x: x + R(-.35, .35) * geo.SW, y: y + R(-.2, .3) * geo.SH, vx: R(-30, 30), vy: R(-90, -30), s: R(8, 18), col: mix(P[1], P[2], Math.random()), life: R(.8, 1.5), flick: 1, drag: .5 }); wake(); setTimeout(ember, 55); }; setTimeout(ember, 200);
    if (BU.uW && !RM) { BS.punch = .11; BS.pc = [x / geo.SW, 1 - y / geo.SH]; BS.rad = Math.max(BS.rad, 1.4); }
    BS.tint = P[2]; BS.tK = .7; BS.tT = 0; wake(); }

  /* ---------- 迴圈：有東西在動才畫 ---------- */
  let raf = 0, last = 0, t0 = performance.now();
  function wake() { if (!raf && window.FX3D.ready) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; const dt = now < stopUntil ? 0 : Math.min(.05, (now - last) / 1000) * (window.BSPEED || 1); last = now; BU.uTime.value = (now - t0) / 1000;
    const scr = $('battleScreen'); if (!scr || scr.classList.contains('hidden')) { PS.list.length = 0; return; }
    measure(); const dpr = Math.min(window.__fx3dDpr || (MOB ? 1 : 1.75), devicePixelRatio || 1) /* v171：手機 1.25 → 1，掉幀時再降 */, W = Math.max(1, Math.round(geo.SW)), H = Math.max(1, Math.round(geo.SH));
    /* 背景 */
    const foc = scr.classList.contains('fxp-focus'); BS.zoom += (BS.zT - BS.zoom) * Math.min(1, dt * 5); BS.rad += (BS.rT - BS.rad) * Math.min(1, dt * 6); BS.tT += dt; BS.tK *= Math.pow(.18, dt); BS.haze += (BS.hT - BS.haze) * Math.min(1, dt * 3);
    if (rd.domElement.width !== Math.round(W * dpr)) { rd.setPixelRatio(dpr); rd.setSize(W, H, false); } BU.uRes.value.set(W, H); BU.uDim.value = foc ? .5 : .66; BU.uSat.value = foc ? .8 : 1.1; BS.punch = (BS.punch || 0) * Math.pow(.004, dt); const pz = BS.punch || 0, zc = BS.zT > 1.01 ? BS.zc : (BS.pc || BS.zc); BU.uZoom.value = BS.zoom + pz; BU.uRad.value = Math.max(BS.rad, pz * 8); BU.uZC.value.set(zc[0], zc[1]); BU.uTint.value.setRGB(...BS.tint); BU.uTintK.value = BS.tK; BU.uHaze.value = BS.haze;
    rd.render(bgS, cam);
    /* 粒子 */
    const pc = prd.domElement; if (pc.width !== Math.round(W * dpr) || pc.height !== Math.round(H * dpr)) { prd.setPixelRatio(dpr); prd.setSize(W, H, false); }
    { const st = pc.style, px = v => v.toFixed(2) + 'px', key = [geo.OX, geo.OY, geo.S, W, H].map(v => v.toFixed(2)).join(); if (pc.__k !== key) { pc.__k = key; st.right = st.bottom = 'auto'; st.left = px(-geo.OX / geo.S); st.top = px(-geo.OY / geo.S); st.width = px(W / geo.S); st.height = px(H / geo.S); } }   /* 跟 fx.js 一樣：畫布反向放大蓋滿畫面 */
    pCam.right = W; pCam.bottom = H; pCam.updateProjectionMatrix();
    let na = 0, nn = 0; const live = [];
    for (const p of PS.list) { p.t += dt; if (p.t < 0) { live.push(p); continue; } if (p.t > p.life) continue; live.push(p);
      const k = p.t / p.life; p.vx *= Math.exp(-p.drag * dt); p.vy = p.vy * Math.exp(-p.drag * dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      let s = p.ring ? p.s + (p.s1 - p.s) * (1 - Math.pow(1 - k, 3)) : p.s * (1 + p.grow * k), st = p.st, rot = p.rot;
      if (p.shape === 1 && p.stretch) { const v = Math.hypot(p.vx, p.vy); st = Math.max(.08, 1 / (1 + v * p.stretch)); s = p.s / st * .5; rot = Math.atan2(p.vy, p.vx); }
      let a = p.a * (p.add ? .82 : 1) * (p.ring ? 1 - k : Math.min(1, k * 8) * (1 - k * k)); if (p.flick) a *= .6 + .4 * Math.sin(p.t * 40 + p.x);
      const L = p.add ? ADD : NRM, i = p.add ? na++ : nn++; if (i >= MAXP) continue;
      L.A.array.set([p.x, p.y, 0, 0], i * 4); L.B.array.set([s, st, rot, a], i * 4); L.C.array.set([p.col[0], p.col[1], p.col[2], p.shape], i * 4); }
    PS.list = live;
    [[ADD, na], [NRM, nn]].forEach(([L, c]) => { L.g.instanceCount = Math.min(c, MAXP); L.A.needsUpdate = L.B.needsUpdate = L.C.needsUpdate = true; });
    prd.render(pS, pCam);
    { const hv = PS.list.length ? '' : 'hidden'; if (pc.style.visibility !== hv) pc.style.visibility = hv; } /* v194：沒有粒子時隱藏粒子層 */
    const busy = PS.list.length || (BS.punch || 0) > .001 || Math.abs(BS.zoom - BS.zT) > .002 || BS.rad > .01 || BS.tK > .01 || BS.haze > .01 || BU.uW.value.some(w => w.w > 0 && BU.uTime.value - w.z < .9) || foc !== BS.foc;
    BS.foc = foc; if (busy) raf = requestAnimationFrame(loop);
  }

  /* ---------- 掛到原本的戰鬥流程 ---------- */
  let cur = null;   /* 目前出招：{ side, theme, ult, hitDone } */
  function hook() {
    /* 命中：以「傷害數字跳出」為準（奧義編排不一定會呼叫 hitFX）；多段攻擊每 0.11 秒最多一次，奧義第一下加衝擊格 */
    if (typeof window.showDamage === 'function' && !window.showDamage.__fx3) { const _d = window.showDamage; let lastT = 0; window.showDamage = function (side, amount) { const r = _d.apply(this, arguments);
        if (window.FX3D.ready && enabled() && cur && cur.side !== side) try { const now = performance.now(), F = side === 'L' ? battle.player : battle.enemy, big = cur.ult || amount > (F ? F.maxHp * .12 : 1e9);
          if (big && cur.ult && !cur.hitDone) { cur.hitDone = true; impactFrame(); lastT = now; const [fx0, fy0] = pt(side); finisher(fx0, fy0, cur.theme); camPush(side, 1.1, 90); setTimeout(() => camRelease(520), 260 / (window.BSPEED || 1)); }
          else if (big && !cur.ult && now - lastT > 110) hitStop(55);
          if (now - lastT > 110 / (window.BSPEED || 1)) { lastT = now; const [x, y] = pt(side); if (!(window.VFX00 && VFX00.hit(side, cur, big, x, y))) impact(x, y, cur.theme, big, side); } } catch (e) { } /* v155：00GameDevs 特效載入後由它接手命中爆發 */
        return r; }; window.showDamage.__fx3 = true; }
    if (typeof window.playChoreo === 'function' && !window.playChoreo.__fx3) { const _p = window.playChoreo; window.playChoreo = async function (side, actor, idx, skill) {
        if (!window.FX3D.ready || !enabled()) { load(); return _p.apply(this, arguments); }
        const S = side === 'P' ? 'L' : 'R', ult = !!(skill && skill.ultimate), th = themeOf(actor), col = pal(th)[2]; cur = { side: S, theme: th, ult, hitDone: false, skill, actor };
        try { charge(S, th, ult); if (!(skill && skill.type === 'support')) ghosts(S, col); if (ult) { aura(S, th); aura2(S, th); camPush(S, 1.06, 650 / (window.BSPEED || 1)); setTimeout(() => { if (cur && !cur.hitDone) camRelease(600); }, 1300 / (window.BSPEED || 1)); } } catch (e) { }
        /* 奧義期間：全白閃光改成屬性色、強度壓低，避免畫面整片白、看不到特效 */
        const XX = typeof X !== 'undefined' ? X : null, _fl = XX && XX.flash, tf = toHex(mix(pal(th).map(hex)[1], [1, 1, 1], .35));
        if (ult && _fl && !RM) XX.flash = function (c, life, a) { let w = false; if (typeof c === 'string' && /^#?[0-9a-f]{3,6}$/i.test(c)) { const h = c.replace('#', ''), f = h.length === 3 ? h.split('').map(v => v + v).join('') : h; const v = hex('#' + f); w = Math.min(...v) > .82; } else if (c === 'white') w = true;
          return _fl.call(this, w ? tf : c, life, w ? Math.min(a || .7, .42) : a); };
        try { return await _p.apply(this, arguments); } finally { if (ult && _fl) XX.flash = _fl; camRelease(360); cur = null; BS.zT = 1; BS.rT = 0; BS.hT = 0; wake(); } }; window.playChoreo.__fx3 = true; }
  }
  window.FX3D = { ready: false, load, pt, pal, themeOf, geo: () => geo, impact: (s, th, big) => { const [x, y] = pt(s); impact(x, y, th, big, s); }, charge, impactFrame, enabled };
  window.addEventListener('load', () => { setTimeout(hook, 0); });
  /* 第一次進戰鬥時載入 Three.js（之後一直保留） */
  if (typeof window.startBattle === 'function') { const _sb = window.startBattle; window.startBattle = function () { load(); const r = _sb.apply(this, arguments); setTimeout(wake, 0); return r; }; }
})();

/* ==== 原 js/fx_vfx_v155.js ==== */
/* v155 戰鬥特效升級：使用 00GameDevs（https://00gamedevs.com/，MIT 授權）的 Three.js 特效，取代 fx3d_v145 的命中粒子爆發。
   使用者 11/04：「把裡面不錯的素材拿出來優化我們的技能特效；先從相關的開始升級替換」。
   ‧ 素材：vendor/vfx00/vfx00.js（各款共用的執行期＋預設，第一次進戰鬥才載入；SHA-256 與版本記在 vfx00.meta.json）。
   ‧ 畫布 #bVFX 疊在 #bPGL 上方，透視鏡頭對著 z=0 平面：畫面像素 ↔ 世界座標的比例依角色立繪高度換算，特效大小跟著角色走。
   ‧ 對應（依角色的命中主題 CHAR_FX／屬性）：劍＝蒼刃迴斬（奧義加裂空迴斬）、拳／霸氣／震動＝揚塵震波＋雷弧綻爆、火＝白熱炎爆（奧義加翻湧炎潮）、
     冰＝裂晶霜爆（奧義霜矛落陣）、雷＝渦雷落擊、水＝翻浪衝潮、闇／影＝雷弧綻爆（奧義渦光黑洞）、砂＝飛砂風旋、光／超能＝雷弧綻爆；
     輔助技：回復＝療光法陣、閃避／護盾＝稜晶護壁。沒對應到的主題照舊用 fx3d_v145 的粒子。
   ‧ 開關跟 fx3d_v145 相同（技能特效「高」且畫質不是「省電」）；同時最多 6 個（手機 4 個）特效，超過就先收掉最舊的。 */
(function () {
  const $ = id => document.getElementById(id);
  const MOB = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 700;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAP = MOB ? 4 : 6, R = (a, b) => a + Math.random() * (b - a);
  let T = null, V = null, loading = null, rd = null, sc = null, cam = null, cv = null, raf = 0, last = 0;
  const live = [];
  const enabled = () => !!(window.FX3D && FX3D.enabled && FX3D.enabled()) && !RM;
  /* 和之國篇三位：自訂命中主題與配色 */
  if (typeof CHAR_FX !== 'undefined') Object.assign(CHAR_FX, {
    zoro_wano: CHAR_FX.zoro_wano || ['sword', 'sword', ['#ffffff', '#e8c8ff', '#9a4aff', '#1a0a3a']],
    luffy_wano: CHAR_FX.luffy_wano || ['haki', 'haki', ['#ffffff', '#ffd8d0', '#ff3a4a', '#2a0508']],
    sanji_wano: CHAR_FX.sanji_wano || ['fire', 'inferno', ['#ffffff', '#bfe8ff', '#3a7fff', '#0a1a5a']] });

  /* 主題 → [一般命中, 奧義命中] 的特效清單。每項：[素材 id, 選項, 擺法]；擺法 g=從腳下往上長、s=斬擊（立起來的刀光圈）、c=中心 */
  const MAP = {
    sword: [[['azure-sweep', {}, 's']], [['spatial-sweep', { size: 1.25 }, 's'], ['azure-sweep', { size: 1.1 }, 's']]],
    fist: [[['energy-burst', { size: 1.2, color: '#ffb46a' }, 'g'], ['shockwave', { size: .8 }, 'g']], [['energy-burst', { size: 1.7, color: '#ffb46a' }, 'g'], ['shockwave', { size: 1.3 }, 'g']]],
    haki: [[['energy-burst', { size: 1.3 }, 'g']], [['energy-burst', { size: 1.8 }, 'g'], ['shockwave', { size: 1.3 }, 'g']]],
    quake: [[['shockwave', { size: 1.15 }, 'g']], [['shockwave', { size: 1.5 }, 'g'], ['magma-fissure', { color: '#ffd0a0' }, 'g']]],
    fire: [[['fire-explosion', { size: 1 }, 'g']], [['fire-explosion', { size: 1.35 }, 'g'], ['flame-surge', { size: 1.7 }, 'g']]],
    ice: [[['ice-shatter', { size: 2 }, 'g']], [['frost-lance-rain', {}, 'g'], ['ice-shatter', { size: 2.4 }, 'g']]],
    bolt: [[['thunder-strike', { size: 1.2 }, 'g']], [['thunder-strike', { size: 1.6 }, 'g'], ['energy-burst', { size: 1.5 }, 'g']]],
    water: [[['tidal-surge', { size: 1.1 }, 'g']], [['tidal-surge', { size: 1.5 }, 'g']]],
    dark: [[['energy-burst', {}, 'g']], [['black-hole', { size: .8 }, 'c', 1.4]]],
    shadow: [[['energy-burst', {}, 'g']], [['black-hole', { size: .8 }, 'c', 1.4]]],
    sand: [[['dust-devil', { size: .8 }, 'g', .9]], [['dust-devil', { size: 1.1 }, 'g', 1.3], ['shockwave', {}, 'g']]],
    light: [[['energy-burst', {}, 'g']], [['energy-burst', { size: 1.35 }, 'g'], ['shockwave', { size: 1.2, color: '#fff2b0' }, 'g']]],
    psy: [[['energy-burst', {}, 'g']], [['energy-burst', { size: 1.35 }, 'g'], ['shockwave', { size: 1.1 }, 'g']]]
  };
  /* 這些主題的原色比較好看，不套角色配色（火、冰、雷、水、砂、震動的塵土） */
  const KEEP = { fire: 1, ice: 1, water: 1, sand: 1, quake: 1 };

  function load() {
    if (V || loading || !enabled()) return loading;
    loading = Promise.all([import('three'), import(new URL('vendor/vfx00/vfx00.js?v=155', document.baseURI).href)]).then(([t, v]) => { T = t; V = v; init(); }).catch(e => { console.warn('00GameDevs 特效載入失敗', e); V = null; });
    return loading;
  }
  function init() {
    cv = document.createElement('canvas'); cv.id = 'bVFX'; cv.className = 'b-canvas b-pgl b-vfx'; cv.setAttribute('aria-hidden', 'true'); cv.style.visibility = 'hidden'; /* v194：有特效（wake）才顯示 */
    const ref = $('bPGL') || $('bBloom') || $('bCanvas'); ref.insertAdjacentElement('afterend', cv);
    rd = new T.WebGLRenderer({ canvas: cv, antialias: !MOB, alpha: true, premultipliedAlpha: true }); rd.setClearColor(0x000000, 0);
    rd.outputColorSpace = T.SRGBColorSpace; rd.toneMapping = T.NoToneMapping;
    sc = new T.Scene(); cam = new T.PerspectiveCamera(30, 1, .1, 400);
    /* 預先編譯著色器：第一次命中時才編譯會卡一下，所以載入後趁空檔先把會用到的款式各建一次、編譯完就釋放 */
    setTimeout(() => { try { const ids = [...new Set(Object.values(MAP).flatMap(m => m.flat().map(x => x[0])).concat(['healing-field', 'prism-guard']))], tmp = new T.Scene(), made = [];
      ids.forEach(id => { try { const f = V.make(id, {}); f.update(.016); tmp.add(f.group); made.push(f); } catch (e) { } });
      cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); (rd.compileAsync ? rd.compileAsync(tmp, cam) : Promise.resolve(rd.compile(tmp, cam))).catch(() => { }).finally(() => made.forEach(f => { try { tmp.remove(f.group); f.dispose(); } catch (e) { } }));
      cam.userData.W = 0; } catch (e) { } }, 400);
  }
  /* 換算：每公尺幾個畫面像素＝角色立繪高度 / 5.5（特效素材以公尺為單位，命中爆發約 1.5～4 公尺寬） */
  function unit(side) { try { const img = $('bImg' + side), f = $('bF' + side); const s = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, g = FX3D.geo(); return Math.max(14, img.offsetHeight * s * g.S / 5.5); } catch (e) { return 40; } }
  function size(W, H) {
    const dpr = Math.min(window.__fx3dDpr || (MOB ? 1 : 1.75), devicePixelRatio || 1); /* v171 */
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { rd.setPixelRatio(dpr); rd.setSize(W, H, false); }
    const g = FX3D.geo(), st = cv.style, px = v => v.toFixed(2) + 'px', key = [g.OX, g.OY, g.S, W, H].map(v => v.toFixed(2)).join();
    if (cv.__k !== key) { cv.__k = key; st.right = st.bottom = 'auto'; st.left = px(-g.OX / g.S); st.top = px(-g.OY / g.S); st.width = px(W / g.S); st.height = px(H / g.S); }
  }
  /* 鏡頭：z=0 平面上 1 公尺＝U 像素；畫面左上角是 (0,0) */
  function setCam(W, H, U) { const f = T.MathUtils.degToRad(cam.fov), D = H / (U * 2 * Math.tan(f / 2)); cam.aspect = W / H; cam.position.set(W / 2 / U, -H / 2 / U, D); cam.lookAt(W / 2 / U, -H / 2 / U, 0); cam.updateProjectionMatrix(); cam.userData.U = U; }
  function spawn(id, opt, mode, x, y, U, life) {
    if (!V.PRESETS[id]) return;
    while (live.length >= CAP) { const o = live.shift(); try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } }
    const fx = V.make(id, opt), gr = fx.group, k = U / cam.userData.U;
    let X = x / cam.userData.U, Y = -y / cam.userData.U;
    if (mode === 'g') { Y -= 1.5 * k; gr.rotation.x = .32; }               /* 從角色腳邊往上長，稍微俯看 */
    else if (mode === 's') { gr.rotation.x = 1.18; gr.rotation.z = R(-.5, .5); gr.rotation.y = R(-.3, .3); }  /* 刀光圈立起來，斜斜劃過 */
    else gr.rotation.x = .9;
    gr.position.set(X, Y, 0); gr.scale.setScalar(k);
    sc.add(gr); live.push({ fx, t: 0, stopAt: life || 0, stopped: false });
    wake();
  }
  function wake() { if (!raf) { last = performance.now(); if (cv && cv.style.visibility) cv.style.visibility = ''; raf = requestAnimationFrame(loop); } }
  function loop(now) {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000) * (window.BSPEED || 1); last = now;
    const scr = $('battleScreen'); if (!scr || !rd) return;
    const g = FX3D.geo(), W = Math.max(1, Math.round(g.SW)), H = Math.max(1, Math.round(g.SH)); size(W, H);
    if (Math.abs(cam.aspect - W / H) > .001 || !cam.userData.W || cam.userData.W !== W) { setCam(W, H, cam.userData.U || 40); cam.userData.W = W; }
    for (let i = live.length - 1; i >= 0; i--) { const o = live[i]; o.t += dt; try { if (o.stopAt && !o.stopped && o.t > o.stopAt) { o.stopped = true; o.fx.stop(); } o.fx.update(dt); } catch (e) { o.dead = true; }
      if (o.dead || o.fx.finished || o.t > 8) { try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } live.splice(i, 1); } }
    rd.render(sc, cam);
    if (live.length) raf = requestAnimationFrame(loop); else { rd.clear(); cv.style.visibility = 'hidden'; } /* v194：閒置時隱藏 */
  }
  const themeOf = cur => cur.theme || 'fist';
  const colorOf = (actor, th) => { try { const C = typeof CHAR_FX !== 'undefined' && actor && CHAR_FX[actor.id]; const P = (C && C[2]) || (FX3D.pal ? FX3D.pal(th) : null); return P ? P[2] : null; } catch (e) { return null; } };
  /* 命中：fx3d_v145 的 showDamage 掛勾呼叫；回傳 true 表示由這一層接手（fx3d 就不放原本的粒子爆發） */
  function hit(side, cur, big, x, y) {
    if (!V || !rd || !enabled() || !cur) return false;
    const th = themeOf(cur), M = MAP[th]; if (!M) return false;
    const U = unit(side); if (!cam.userData.W) { const g = FX3D.geo(); setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); }
    if (!cam.userData.U) cam.userData.U = U;
    const ult = cur.ult && !cur.vfxUlt; if (ult) cur.vfxUlt = true;
    const list = ult ? M[1] : M[0], col = KEEP[th] ? null : colorOf(cur.actor, th);
    list.forEach(([id, o, mode, life], i) => setTimeout(() => spawn(id, Object.assign(col ? { color: col } : {}, o, big && !ult ? { size: (o.size || 1) * 1.15 } : {}), mode, x + (i ? R(-12, 12) : 0), y, U, life), i * 70));
    return true;
  }
  /* 輔助技：回復放療光法陣，閃避／護盾放稜晶護壁（在施放者身上） */
  function cast(side, skill) {
    if (!V || !rd || !enabled() || !skill || skill.type !== 'support') return;
    const e = skill.effect || {}, heal = e.healRatio || e.heal || e.regen, guard = e.dodgeTurns || e.shield || e.shieldRatio || e.selfBuffDef > 0;
    const id = heal ? 'healing-field' : guard ? 'prism-guard' : null; if (!id) return;
    try { const [x, y] = FX3D.pt(side), U = unit(side), g = FX3D.geo(); if (!cam.userData.W) { setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); }
      spawn(id, { size: heal ? .9 : .8 }, heal ? 'c' : 'g', x, heal ? y + U * .9 : y, U, heal ? 1.4 : 1.1); } catch (e) { }
  }
  function hook() {
    if (typeof window.playChoreo === 'function' && !window.playChoreo.__vfx) { const _p = window.playChoreo; window.playChoreo = function (side, actor, idx, skill) { if (!V) load(); else try { cast(side === 'P' ? 'L' : 'R', skill); } catch (e) { } return _p.apply(this, arguments); }; window.playChoreo.__vfx = true; }
  }
  /* v170：指定素材放在某個角色身上（伊姆專屬特效 js/fx_imu_v170.js 用）；ox／oy 以「公尺」為單位偏移，回傳是否有放出來 */
  function fx(id, opt, mode, side, life, ox, oy) {
    if (!V || !rd || !enabled() || !V.PRESETS[id]) return false;
    try { const [x, y] = FX3D.pt(side), U = unit(side), g = FX3D.geo(); if (!cam.userData.W) { setCam(Math.round(g.SW), Math.round(g.SH), U); cam.userData.W = Math.round(g.SW); } if (!cam.userData.U) cam.userData.U = U;
      spawn(id, opt || {}, mode || 'c', x + (ox || 0) * U, y + (oy || 0) * U, U, life); return true; } catch (e) { return false; }
  }
  window.VFX00 = { load, hit, cast, fx, get ready() { return !!(V && rd); }, live: () => live.length };
  window.addEventListener('load', () => setTimeout(hook, 30));
  if (typeof window.startBattle === 'function') { const _sb = window.startBattle; window.startBattle = function () { load(); if (live.length) { live.splice(0).forEach(o => { try { sc.remove(o.fx.group); o.fx.dispose(); } catch (e) { } }); if (rd) rd.clear(); } return _sb.apply(this, arguments); }; /* 新的一場戰鬥：清掉殘留特效 */ }
})();

