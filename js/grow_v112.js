/* v112 角色培養：在「我的船員」立繪下方新增「培養」按鈕，開啟培養視窗（手機：上下排版；電腦：左立繪、右數值）。
   使用經驗書升級：選擇三種經驗書的數量，即時預覽升級後的等級與能力值（綠色 +數字），一鍵升到最高可升等級。 */
(function () {
  const BOOKS = ['exp_s', 'exp_m', 'exp_l'];
  let cur = null, qty = {}, tab = 'lv';
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
  function close() { const m = document.getElementById('growModal'); if (m) m.classList.remove('show'); if (typeof window.__refreshCrew === 'function') window.__refreshCrew(); }
  function render() {
    const id = cur, c = CHARACTERS[id], r = SAVE.data.roster[id]; if (!c || !r) return close();
    const lv = r.lv, add = totalExp(), pv = typeof previewLv === 'function' ? previewLv(id, add) : lv, need = lv >= MAX_LV ? 1 : expNeed(lv);
    const A = stats(id, lv), B = stats(id, pv), d = k => B[k] > A[k] ? `<em>(+${(B[k] - A[k]).toLocaleString()})</em>` : '';
    const rar = (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || 'R', col = (window.RAR_COLOR || {})[rar] || '#ffcf5a';
    const skinK = ((SAVE.data.skins || {}).equip || {})[id], img = skinK && typeof SKINS !== 'undefined' && SKINS[skinK] ? SKINS[skinK].image : c.image;
    const list = ownedList(), ix = list.indexOf(id);
    const pctNow = lv >= MAX_LV ? 100 : Math.min(100, r.exp / need * 100);
    const skills = c.skills.map((s, i) => { const u = (typeof SKILL_UNLOCK !== 'undefined' && SKILL_UNLOCK[i]) || 1, ok = pv >= u, was = lv >= u;
      return `<li class="${ok ? '' : 'lock'} ${ok && !was ? 'new' : ''} ${s.ultimate ? 'ult' : ''}"><b>${i + 1}. ${s.name}</b><span>${ok ? (was ? '已學會' : '升級後學會！') : `LV ${u} 解鎖`}</span></li>`; }).join('');
    const books = BOOKS.map(b => { const n = inv()[b] || 0, q = qty[b] || 0, it = ITEMS[b];
      return `<div class="gw-book ${n ? '' : 'off'}" data-b="${b}"><div class="gw-bi">${typeof itemIcon === 'function' ? itemIcon(it) : ''}<span class="gw-own">${n}</span></div><b>${it.name}</b><small>+${it.effect.exp.toLocaleString()}</small>
        <div class="gw-step"><button data-q="-1" aria-label="減少" ${q ? '' : 'disabled'}>−</button><output>${q}</output><button data-q="1" aria-label="增加" ${q < n && lv < MAX_LV ? '' : 'disabled'}>＋</button></div></div>`; }).join('');
    const m = el();
    m.innerHTML = `<div class="gw" style="--rc:${col}">
      <header class="gw-head"><h3>角色培養</h3><button class="gw-x" aria-label="關閉">×</button></header>
      <nav class="gw-tabs"><button data-tab="lv" class="${tab === 'lv' ? 'on' : ''}">升級</button><button data-tab="sk" class="${tab === 'sk' ? 'on' : ''}">技能</button></nav>
      <div class="gw-body">
        <section class="gw-art"><div class="gw-name"><span class="rar c-rar r-${rar}">${rar}</span><b>${c.name}</b><small>${c.title || ''}</small></div>
          <button class="gw-nav prev" aria-label="上一位" ${list.length > 1 ? '' : 'disabled'}>‹</button><img src="${img}" alt="${c.name}"><button class="gw-nav next" aria-label="下一位" ${list.length > 1 ? '' : 'disabled'}>›</button>
          <div class="gw-lv"><div class="gw-bar"><i style="width:${pctNow}%"></i>${pv > lv ? '<s style="width:100%"></s>' : ''}</div><span>Lv.<b>${lv}</b>${pv > lv ? ` → <b class="up">${pv}</b>` : ''} / ${MAX_LV}</span><small>${lv >= MAX_LV ? '已達最高等級' : `${r.exp.toLocaleString()} / ${need.toLocaleString()}${add ? `　＋${add.toLocaleString()} 經驗` : ''}`}</small></div></section>
        <section class="gw-panel">
          ${tab === 'lv' ? `<div class="gw-pow"><span>戰力</span><b>${A.pow.toLocaleString()}</b>${B.pow > A.pow ? `<em>(+${(B.pow - A.pow).toLocaleString()})</em>` : ''}</div>
          <dl class="gw-stats"><div><dt>⚔ 攻擊</dt><dd>${A.atk}${d('atk')}</dd></div><div><dt>🛡 防禦</dt><dd>${A.def}${d('def')}</dd></div><div><dt>❤ 體力</dt><dd>${A.hp}${d('hp')}</dd></div><div><dt>💨 速度</dt><dd>${A.spd}${d('spd')}</dd></div></dl>
          <h4>經驗書</h4><div class="gw-books">${books}</div>
          <div class="gw-acts"><button class="btn-ghost gw-auto" ${lv < MAX_LV && BOOKS.some(b => inv()[b] > 0) ? '' : 'disabled'}>自動選擇</button><button class="btn-gold gw-go" ${add && lv < MAX_LV ? '' : 'disabled'}>${lv >= MAX_LV ? '已達最高等級' : '升級'}</button></div>
          <p class="gw-tip">經驗書可在懸賞處的道具商店、勇者之塔、寶箱取得。</p>`
          : `<ol class="gw-skills">${skills}</ol><p class="gw-tip">技能會在指定等級自動學會；先選擇經驗書，就能預覽升級後會學會哪些技能。</p>`}
        </section></div></div>`;
    m.querySelector('.gw-x').onclick = close;
    m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    const go = dir => { if (list.length < 2) return; cur = list[(ix + dir + list.length) % list.length]; qty = {}; render(); };
    m.querySelector('.gw-nav.prev').onclick = () => go(-1); m.querySelector('.gw-nav.next').onclick = () => go(1);
    m.querySelectorAll('.gw-book').forEach(x => { const b = x.dataset.b, n = inv()[b] || 0; x.querySelectorAll('[data-q]').forEach(btn => btn.onclick = () => { qty[b] = Math.max(0, Math.min(n, (qty[b] || 0) + +btn.dataset.q)); render(); }); });
    const au = m.querySelector('.gw-auto'); if (au) au.onclick = () => { autoFill(id); render(); };
    const gb = m.querySelector('.gw-go'); if (gb) gb.onclick = () => { const e = totalExp(); if (!e) return; BOOKS.forEach(b => { if (qty[b]) SAVE.data.inventory[b] -= qty[b]; }); const before = crewLv(id); qty = {}; SAVE.save();
      gainExp(id, e, false, true); const after = crewLv(id); if (typeof SFX !== 'undefined') SFX.play('quest'); if (typeof toast === 'function') toast(after > before ? `${c.name} 升到 LV ${after}！` : `${c.name} 獲得 ${e.toLocaleString()} 經驗`, 'gold');
      render(); const im = m.querySelector('.gw-art img'); if (im) { im.classList.remove('lvup'); void im.offsetWidth; im.classList.add('lvup'); } };
    if (window.fixIcons) fixIcons(m);
  }
  window.openGrow = function (id) { if (!id || !SAVE.data.roster[id]) return; cur = id; qty = {}; tab = 'lv'; render(); el().classList.add('show'); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const m = document.getElementById('growModal'); if (m && m.classList.contains('show')) close(); } });
  /* 在「我的船員」立繪下方加上「培養」按鈕；右側的「培養」分頁也改為打開培養視窗 */
  function inject() { const P = document.getElementById('cxPane_crew'); if (!P) return; const acts = P.querySelector('.sb-acts'), sel = P.querySelector('.sb-tile.on[data-id]'); if (!acts || !sel) return;
    if (!acts.querySelector('.gw-open')) { const b = document.createElement('button'); b.className = 'btn-primary gw-open'; b.innerHTML = '⬆ 培養'; b.onclick = () => openGrow(sel.dataset.id); acts.prepend(b); }
    const t = P.querySelector('[data-rt="grow"]'); if (t && !t.__gw) { t.__gw = true; t.onclick = e => { e.stopPropagation(); openGrow(sel.dataset.id); }; } }
  window.addEventListener('DOMContentLoaded', () => { const P = document.getElementById('cxPane_crew'); if (P) new MutationObserver(inject).observe(P, { childList: true }); inject();
    window.__refreshCrew = () => { const s = document.querySelector('#cxPane_crew .sb-tile.on[data-id]'); if (s) s.click(); }; });
})();
