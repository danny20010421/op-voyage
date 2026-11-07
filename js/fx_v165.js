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
