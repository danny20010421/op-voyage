/* v112 角色培養：在「我的船員」立繪下方新增「培養」按鈕，開啟培養視窗（手機：上下排版；電腦：左立繪、右數值）。
   使用經驗書升級：選擇三種經驗書的數量，即時預覽升級後的等級與能力值（綠色 +數字），一鍵升到最高可升等級。 */
(function () {
  const BOOKS = ['exp_s', 'exp_m', 'exp_l'];
  let cur = null, qty = {}, tab = 'lv', openSk = -1;
  const coarse = () => window.matchMedia && matchMedia('(hover:none),(pointer:coarse)').matches;
  /* v114：技能詳細說明（電腦版展開；手機長按彈出） */
  function skDetail(s, i, o) {
    const tags = (s.tags || []).map(t => Array.isArray(t) ? `<span class="tag ${t[1] || ''}">${t[0]}</span>` : `<span class="tag">${t}</span>`).join('');
    return `<dl class="gw-skm"><div><dt>威力</dt><dd>${s.power || '—'}</dd></div><div><dt>命中</dt><dd>${s.accuracy || '—'}</dd></div><div><dt>次數</dt><dd>${o.ok && o.was ? o.pp : s.maxPP || '—'}<small>/${s.maxPP || '—'}</small></dd></div><div><dt>解鎖</dt><dd>${o.skinLock ? '皮膚' : 'LV ' + o.u}</dd></div></dl><p class="gw-skp">${s.desc || '（沒有說明）'}</p>${tags ? `<div class="gw-skg">${tags}</div>` : ''}`;
  }
  const inv = () => SAVE.data.inventory || {};
  const ownedList = () => Object.keys(SAVE.data.roster || {}).filter(id => CHARACTERS[id]).sort((a, b) => crewLv(b) - crewLv(a));
  const stats = (id, lv) => { const S = lvStats(CHARACTERS[id], lv); return { atk: S.atk, def: S.def, hp: S.hp, spd: S.spd, pow: Math.round(S.atk * 1.6 + S.def * 1.2 + S.hp * .45 + S.spd * 2.2) }; };
  const totalExp = () => BOOKS.reduce((a, b) => a + (qty[b] || 0) * ITEMS[b].effect.exp, 0);
  /* 升到最高等級還需要的經驗 */
  function expToMax(id) { const r = SAVE.data.roster[id]; let lv = r.lv, need = -r.exp; while (lv < MAX_LV) { need += expNeed(lv); lv++; } return Math.max(0, need); }
  function autoFill(id) { qty = {}; let left = expToMax(id); [...BOOKS].reverse().forEach(b => { const n = inv()[b] || 0, e = ITEMS[b].effect.exp; const use = Math.min(n, Math.floor(left / e)); qty[b] = use; left -= use * e; });
    if (left > 0) for (const b of BOOKS) { if ((inv()[b] || 0) > (qty[b] || 0)) { qty[b] = (qty[b] || 0) + 1; break; } } }
  function el() { let m = document.getElementById('growModal'); if (!m) { m = document.createElement('div'); m.id = 'growModal'; m.className = 'gw-wrap'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m) close(); }); } return m; }
  function close() { closePop(); const m = document.getElementById('growModal'); if (m) m.classList.remove('show'); if (typeof window.__refreshCrew === 'function') window.__refreshCrew(); }
  function render() {
    const id = cur, c = CHARACTERS[id], r = SAVE.data.roster[id]; if (!c || !r) return close();
    const lv = r.lv, add = totalExp(), pv = typeof previewLv === 'function' ? previewLv(id, add) : lv, need = lv >= MAX_LV ? 1 : expNeed(lv);
    const A = stats(id, lv), B = stats(id, pv), d = k => B[k] > A[k] ? `<em>(+${(B[k] - A[k]).toLocaleString()})</em>` : '';
    const rar = (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || 'R', col = (window.RAR_COLOR || {})[rar] || '#ffcf5a';
    const skinK = ((SAVE.data.skins || {}).equip || {})[id], img = skinK && typeof SKINS !== 'undefined' && SKINS[skinK] ? SKINS[skinK].image : c.image;
    const list = ownedList(), ix = list.indexOf(id);
    const pctNow = lv >= MAX_LV ? 100 : Math.min(100, r.exp / need * 100);
    const L0 = lvStats(c, lv), skinOn = !!skinK;
    const skills = c.skills.map((s, i) => { const u = (typeof SKILL_UNLOCK !== 'undefined' && SKILL_UNLOCK[i]) || 1, skinLock = !!(c.skinSkills && c.skinSkills.includes(i) && !skinOn), ok = pv >= u && !skinLock, was = lv >= u && !skinLock;
      const typ = s.ultimate ? '奧義' : s.type === 'support' ? '輔助' : '攻擊', st = skinLock ? '需要皮膚' : ok ? (was ? '已學會' : '升級後學會！') : `LV ${u} 解鎖`;
      const pp = typeof skillPP === 'function' ? skillPP(s, lv, L0.ppAdj) : s.maxPP;
      return `<li class="gw-sk ${ok ? '' : 'lock'} ${ok && !was ? 'new' : ''} ${s.ultimate ? 'ult' : ''} ${openSk === i ? 'open' : ''}" data-sk="${i}" tabindex="0" role="button" aria-expanded="${openSk === i}">
        <div class="gw-skh"><span class="gw-skn">${i + 1}</span><b>${s.name}</b><i class="gw-skt ${s.ultimate ? 'ult' : s.type === 'support' ? 'sup' : 'atk'}">${typ}</i><span class="gw-sks">${st}</span><span class="gw-chev" aria-hidden="true"></span></div>
        <div class="gw-skd">${skDetail(s, i, { u, ok, was, pp, skinLock })}</div></li>`; }).join('');
    const books = BOOKS.map(b => { const n = inv()[b] || 0, q = qty[b] || 0, it = ITEMS[b];
      return `<div class="gw-book ${n ? '' : 'off'}" data-b="${b}"><div class="gw-bi">${typeof itemIcon === 'function' ? itemIcon(it) : ''}<span class="gw-own">${n}</span></div><b>${it.name}</b><small>+${it.effect.exp.toLocaleString()}</small>
        <div class="gw-step"><button data-q="-1" aria-label="減少" ${q ? '' : 'disabled'}>−</button><output>${q}</output><button data-q="1" aria-label="增加" ${q < n && lv < MAX_LV ? '' : 'disabled'}>＋</button></div></div>`; }).join('');
    const m = el(), oldImg = m.querySelector('.gw-art img'); /* v130：重畫時沿用同一張立繪（不重新解碼大圖，避免每按一下就閃一下） */
    m.innerHTML = `<div class="gw" style="--rc:${col}">
      <header class="gw-head"><h3>角色培養</h3><button class="gw-x" aria-label="關閉">×</button></header>
      <nav class="gw-tabs"><button data-tab="lv" class="${tab === 'lv' ? 'on' : ''}">升級</button><button data-tab="sk" class="${tab === 'sk' ? 'on' : ''}">技能</button></nav>
      <div class="gw-body">
        <section class="gw-art"><div class="gw-name"><span class="rar c-rar r-${rar}">${rar}</span><b>${c.name}</b><small>${c.title || ''}</small></div>
          <button class="gw-nav prev" aria-label="上一位" ${list.length > 1 ? '' : 'disabled'}>‹</button><img src="${img}" alt="${c.name}"><button class="gw-nav next" aria-label="下一位" ${list.length > 1 ? '' : 'disabled'}>›</button>
          <div class="gw-lv"><div class="gw-bar"><i style="width:${pctNow}%"></i>${pv > lv ? '<s style="width:100%"></s>' : ''}</div><div class="gw-lvl"><span class="k">LV</span><b>${lv}</b>${pv > lv ? `<span class="ar">→</span><b class="up">${pv}</b>` : ''}<span class="mx">/ ${MAX_LV}</span></div><small>${lv >= MAX_LV ? '已達最高等級' : `${r.exp.toLocaleString()} / ${need.toLocaleString()}${add ? `　＋${add.toLocaleString()} 經驗` : ''}`}</small></div></section>
        <section class="gw-panel">
          ${tab === 'lv' ? `<div class="gw-pow"><span>戰力</span><b>${A.pow.toLocaleString()}</b>${B.pow > A.pow ? `<em>(+${(B.pow - A.pow).toLocaleString()})</em>` : ''}</div>
          <dl class="gw-stats"><div><dt>⚔ 攻擊</dt><dd>${A.atk}${d('atk')}</dd></div><div><dt>🛡 防禦</dt><dd>${A.def}${d('def')}</dd></div><div><dt>❤ 體力</dt><dd>${A.hp}${d('hp')}</dd></div><div><dt>💨 速度</dt><dd>${A.spd}${d('spd')}</dd></div></dl>
          <h4>經驗書</h4><div class="gw-books">${books}</div>
          <div class="gw-acts"><button class="btn-ghost gw-auto" ${lv < MAX_LV && BOOKS.some(b => inv()[b] > 0) ? '' : 'disabled'}>自動選擇</button><button class="btn-gold gw-go" ${add && lv < MAX_LV ? '' : 'disabled'}>${lv >= MAX_LV ? '已達最高等級' : '升級'}</button></div>
          <p class="gw-tip">經驗書可在懸賞處的道具商店、勇者之塔、寶箱取得。</p>`
          : `<ol class="gw-skills">${skills}</ol><p class="gw-tip">${coarse() ? '長按技能可查看詳細說明。' : '點擊技能可展開詳細說明。'}技能會在指定等級自動學會；先選擇經驗書，就能預覽升級後會學會哪些技能。</p>`}
        </section></div></div>`;
    { const ni = m.querySelector('.gw-art img'); if (oldImg && ni && oldImg.getAttribute('src') === ni.getAttribute('src')) { oldImg.className = ni.className; ni.replaceWith(oldImg); } }
    m.querySelector('.gw-x').onclick = close;
    m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; openSk = -1; render(); });
    bindSkills(m, c);
    const go = dir => { if (list.length < 2) return; cur = list[(ix + dir + list.length) % list.length]; qty = {}; openSk = -1; render(); };
    m.querySelector('.gw-nav.prev').onclick = () => go(-1); m.querySelector('.gw-nav.next').onclick = () => go(1);
    m.querySelectorAll('.gw-book').forEach(x => { const b = x.dataset.b, n = inv()[b] || 0; x.querySelectorAll('[data-q]').forEach(btn => btn.onclick = () => { qty[b] = Math.max(0, Math.min(n, (qty[b] || 0) + +btn.dataset.q)); render(); }); });
    const au = m.querySelector('.gw-auto'); if (au) au.onclick = () => { autoFill(id); render(); };
    const gb = m.querySelector('.gw-go'); if (gb) gb.onclick = () => { const e = totalExp(); if (!e) return; BOOKS.forEach(b => { if (qty[b]) SAVE.data.inventory[b] -= qty[b]; }); const before = crewLv(id); qty = {}; SAVE.save();
      gainExp(id, e, false, true); const after = crewLv(id); if (typeof SFX !== 'undefined') SFX.play('quest'); if (typeof toast === 'function') toast(after > before ? `${c.name} 升到 LV ${after}！` : `${c.name} 獲得 ${e.toLocaleString()} 經驗`, 'gold');
      render(); const im = m.querySelector('.gw-art img'); if (im) { im.classList.remove('lvup'); void im.offsetWidth; im.classList.add('lvup'); } };
    if (window.fixIcons) fixIcons(m);
  }
  /* 技能列：滑鼠點擊＝展開／收合；觸控長按（0.45 秒）＝彈出詳細說明 */
  function bindSkills(m, c) {
    m.querySelectorAll('.gw-sk').forEach(li => { const i = +li.dataset.sk; let t = null, fired = false, x0 = 0, y0 = 0;
      const toggle = () => { openSk = openSk === i ? -1 : i; m.querySelectorAll('.gw-sk').forEach(o => { const on = +o.dataset.sk === openSk; o.classList.toggle('open', on); o.setAttribute('aria-expanded', on); }); };
      const cancel = () => { clearTimeout(t); t = null; li.classList.remove('pressing'); };
      li.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; fired = false; x0 = e.clientX; y0 = e.clientY; li.classList.add('pressing');
        t = setTimeout(() => { t = null; fired = true; li.classList.remove('pressing'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (er) { } showPop(c, i, li); }, 450); });
      li.addEventListener('pointermove', e => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancel(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => li.addEventListener(ev, cancel));
      li.addEventListener('contextmenu', e => e.preventDefault());
      li.addEventListener('click', e => { if (fired) { fired = false; e.preventDefault(); return; } if (coarse()) { li.classList.add('hint'); setTimeout(() => li.classList.remove('hint'), 900); return; } toggle(); });
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }); });
  }
  function showPop(c, i, li) { closePop(); const s = c.skills[i], p = document.createElement('div'); p.className = 'gw-pop'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', s.name + ' 技能說明');
    const typ = li.querySelector('.gw-skt').outerHTML;
    p.innerHTML = `<div class="gw-popc ${li.classList.contains('ult') ? 'ult' : ''}"><header><span class="gw-skn">${i + 1}</span><b>${s.name}</b>${typ}<button class="gw-popx" aria-label="關閉">×</button></header>${li.querySelector('.gw-skd').innerHTML}<p class="gw-pops">${li.querySelector('.gw-sks').textContent}</p></div>`;
    /* 長按放開時，瀏覽器的 click 會落在剛彈出的說明卡上；要等新的一次按下後才接受關閉 */
    let ready = false; p.addEventListener('pointerdown', () => { ready = true; });
    p.addEventListener('click', e => { if (!ready) return; if (e.target === p || e.target.closest('.gw-popx')) closePop(); });
    document.getElementById('growModal').appendChild(p); requestAnimationFrame(() => p.classList.add('show')); }
  function closePop() { document.querySelectorAll('.gw-pop').forEach(x => x.remove()); }
  window.openGrow = function (id) { if (!id || !SAVE.data.roster[id]) return; cur = id; qty = {}; tab = 'lv'; openSk = -1; render(); el().classList.add('show'); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.querySelector('.gw-pop')) return closePop(); const m = document.getElementById('growModal'); if (m && m.classList.contains('show')) close(); } });
  /* 在「我的船員」立繪下方加上「培養」按鈕；右側的「培養」分頁也改為打開培養視窗 */
  function inject() { const P = document.getElementById('cxPane_crew'); if (!P) return; const acts = P.querySelector('.sb-acts'), sel = P.querySelector('.sb-tile.on[data-id]'); if (!acts || !sel) return;
    if (!acts.querySelector('.gw-open')) { const b = document.createElement('button'); b.className = 'btn-primary gw-open'; b.innerHTML = '⬆ 培養'; b.onclick = () => openGrow(sel.dataset.id); acts.prepend(b); }
    const t = P.querySelector('[data-rt="grow"]'); if (t && !t.__gw) { t.__gw = true; t.onclick = e => { e.stopPropagation(); openGrow(sel.dataset.id); }; } }
  window.addEventListener('DOMContentLoaded', () => { const P = document.getElementById('cxPane_crew'); if (P) new MutationObserver(inject).observe(P, { childList: true }); inject();
    window.__refreshCrew = () => { const s = document.querySelector('#cxPane_crew .sb-tile.on[data-id]'); if (s) s.click(); }; });
})();
