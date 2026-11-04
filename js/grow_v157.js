/* v157 角色培養重新規劃（使用者 11/04「操作很亂、不便利、卡卡的、不知道自己在幹嘛」；設計說明見 promo/v157/grow/design.md）
   取代 grow_v112.js 的 openGrow，畫面結構：
   上方（電腦在左側）立繪＋目前數值 → 分頁（升級／覺醒／技能／寶物）→ 分頁內容 → 最下方固定的主要按鈕列。
   - 升級：選目標等級（−／＋、±10、最大、滑桿、長按連續），經驗書自動帶入；數值即時預覽（目前 → 之後）。
   - 覺醒：條件逐項列出（需要／擁有，不夠標紅），按鈕旁寫還差什麼、附取得地點。
   - 技能：點一下選技能（不用長按），下方顯示目前效果 → 下一級，主要按鈕升級。
   - 寶物：欄位清單、同頁展開候選清單；主要按鈕「一鍵裝備最佳」。
   效能：骨架只在開啟時建立一次；操作只更新有變化的區塊（數值、分頁內容、按鈕列），立繪只有換角色時才換圖（先在背景解碼好）。
   相容：沿用 #growModal（.gw-wrap.show／.gw）、.gw-tabs [data-tab]（hint_v134 的紅點）、.gr-tools／.gr-slots（hint_v134 的寶物工具列不會重複插入）、.gw-art img（zoom_v113 放大檢視）。 */
(function () {
  const BOOKS = ['exp_s', 'exp_m', 'exp_l'];
  const TABS = [['lv', '升級'], ['star', '覺醒'], ['sk', '技能'], ['gear', '寶物']];
  const $ = (r, q) => r.querySelector(q);
  const fmt = n => (+n || 0).toLocaleString();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inv = () => SAVE.data.inventory || {};
  const P = () => window.PROG, G = () => window.GEAR;
  let cur = null, tab = 'lv', target = 0, pv = 0, skSel = -1, gearPick = null, gPrev = null, gEnh = null, eTarget = 0, M = null, busy = false, brk = false, Ac = null;

  /* ---------- 計算 ---------- */
  /* v158：上方數值＝戰鬥裡實際使用的數值。直接走戰鬥建立角色的同一條流程（battle.js startBattle）：
     buildFighter → applyRarityScale（稀有度體質）→ applySetBonus（羈絆，依目前出戰陣容）→ PROG.applyGrowth（覺醒）→ GEAR.applyExtra（寶物）。
     攻擊＝傷害倍率×1000（與 lvStats 的定義相同：dmgMul×覺醒與寶物的傷害加成）。PvP 不計算覺醒與寶物。
     預覽時暫時改存檔裡的數值（等級用參數；覺醒星數、寶物裝備、強化等級在 withTemp 裡改完立刻還原，不會存檔）。 */
  const snap = f => { const o = { hp: Math.round(f.maxHp), atk: Math.round((f.dmgMul || 1) * (f.__dmgB || 1) * 1000), def: Math.round(f.def || 0), spd: Math.round(f.baseSpeed || 0), ult: Math.round(((f.__ultB || 1) - 1) * 1000) / 10 }; o.pow = Math.round(o.atk * 1.6 + o.def * 1.2 + o.hp * .45 + o.spd * 2.2); return o; };
  function withTemp(o, fn) {
    const undo = [];
    try {
      if (o.star != null) { const r = SAVE.data.roster[o.id], old = r.star; r.star = o.star; undo.push(() => { r.star = old; }); }
      if (o.gear && G()) { const it = G().gear().items, x = it.find(y => y.id === o.gear); if (x) { it.filter(y => y.eq === o.id && y.slot === x.slot && y !== x).forEach(y => { undo.push(() => { y.eq = o.id; }); y.eq = null; }); const oe = x.eq; x.eq = o.id; undo.push(() => { x.eq = oe; }); } }
      if (o.genh && G()) { const x = G().gear().items.find(y => y.id === o.genh.id); if (x) { const ol = x.lv; x.lv = o.genh.lv; undo.push(() => { x.lv = ol; }); } }
      return fn();
    } finally { undo.reverse().forEach(f => f()); }
  }
  function fstats(id, o) {
    o = Object.assign({ id }, o || {}); const L = SAVE.data.lineup || [], team = L.includes(id) ? L : [id];
    return withTemp(o, () => {
      const f = buildFighter(id, o.lv || crewLv(id), typeof equippedSkin === 'function' ? equippedSkin(id) : null); applyRarityScale(f); const a = snap(f);
      if (typeof applySetBonus === 'function') applySetBonus(f, team); const b = snap(f);
      if (P() && P().applyGrowth) P().applyGrowth(f, null); const c = snap(f);
      if (G() && G().applyExtra) G().applyExtra(f, null); const d = snap(f);
      return Object.assign(d, { parts: { base: a, set: b, star: c, gear: d } });
    });
  }
  window.GROW_STATS = fstats; /* 我的船員（crew.js）的戰力與數值也用這個，兩邊一致 */
  const stats = (id, lv) => fstats(id, { lv });
  const rarOf = id => (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || 'R';
  const list = () => Object.keys(SAVE.data.roster || {}).filter(id => CHARACTERS[id]).sort((a, b) => crewLv(b) - crewLv(a) || CHARACTER_ORDER.indexOf(a) - CHARACTER_ORDER.indexOf(b));
  function expTo(id, lv) { const r = SAVE.data.roster[id]; let L = r.lv, need = -r.exp; while (L < lv && L < MAX_LV) { need += expNeed(L); L++; } return Math.max(0, need); }
  const allExp = () => BOOKS.reduce((a, b) => a + (inv()[b] || 0) * ITEMS[b].effect.exp, 0);
  const maxReach = id => Math.min(MAX_LV, previewLv(id, allExp()));
  /* 經驗書自動選擇：從經驗多的開始用，最後用一本最小、夠補足的書（浪費最少） */
  function pickBooks(id, lv) {
    let left = expTo(id, lv); const q = {}; [...BOOKS].reverse().forEach(b => { const n = inv()[b] || 0, e = ITEMS[b].effect.exp, u = Math.min(n, Math.floor(left / e)); q[b] = u; left -= u * e; });
    if (left > 0) for (const b of BOOKS) { if ((inv()[b] || 0) > q[b]) { q[b]++; left -= ITEMS[b].effect.exp; break; } }
    if (left > 0) BOOKS.forEach(b => { q[b] = inv()[b] || 0; }); /* 不夠就全部用上 */
    return q;
  }
  const qExp = q => BOOKS.reduce((a, b) => a + (q[b] || 0) * ITEMS[b].effect.exp, 0);
  const hint = id => (window.GROWHINT ? GROWHINT.hints(id) : { star: false, trial: false, sk: false, gear: false });
  function skState(id, i) {
    const c = CHARACTERS[id], s = c.skills[i], u = (typeof SKILL_UNLOCK !== 'undefined' && SKILL_UNLOCK[i]) || 1, lv = crewLv(id), skin = !!(c.skinSkills && c.skinSkills.includes(i) && !(((SAVE.data.skins || {}).equip || {})[id]));
    const learned = lv >= u && !skin, p = P(); if (!learned || !p) return { s, u, skin, learned, lv: 0, can: false, why: skin ? '裝備皮膚後才能使用' : `角色 LV ${u} 學會` };
    const L = p.skLv(id, i), mx = p.skMax(id), cost = L < 5 ? p.skCost(L + 1) : null;
    let why = '', can = false;
    if (L >= 5) why = '已升到最高 Lv5'; else if (L >= mx) why = `角色 LV ${L * 20} 才能升到 Lv${L + 1}`; else if ((inv().skill_book || 0) < cost.book) why = `秘傳書還差 ${cost.book - (inv().skill_book || 0)} 本`; else if ((SAVE.data.berry || 0) < cost.berry) why = `貝里還差 ${fmt(cost.berry - (SAVE.data.berry || 0))}`; else can = true;
    return { s, u, skin, learned, lv: L, mx, cost, can, why };
  }

  /* ---------- 取得地點 ---------- */
  const hub = t => { close(); if (typeof openGacha === 'function') openGacha(typeof currentScreen !== 'undefined' ? currentScreen : 'modeScreen'); if (t && typeof switchHub === 'function') setTimeout(() => switchHub(t), 0); };
  const GO = { shop: ['道具商店', () => hub('shop')], tower: ['勇者之塔', () => { close(); window.openTower && openTower(); }], daily: ['每日活躍寶箱', () => { close(); window.openPass && openPass('daily'); }], pass: ['航海通行證', () => { close(); window.openPass && openPass('pass'); }], ladder: ['海賊天梯', () => { close(); window.openLadder && openLadder(); }] };
  const goBtns = keys => `<div class="g7-go">${keys.filter(k => GO[k]).map(k => `<button class="btn-ghost sm" data-go="${k}">${GO[k][0]}<i aria-hidden="true">›</i></button>`).join('')}</div>`;

  /* ---------- 骨架（開啟或換角色時建立一次） ---------- */
  function el() {
    let m = document.getElementById('growModal');
    if (!m) { m = document.createElement('div'); m.id = 'growModal'; document.body.appendChild(m); }
    if (!m.__g7) { m.__g7 = true; m.className = 'gw-wrap g7'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', '角色培養');
      m.addEventListener('click', e => { if (e.target === m) close(); }); bindDelegates(m); bindSwipe(m); }
    return m;
  }
  function skeleton() {
    const m = el(), id = cur, c = CHARACTERS[id], rar = rarOf(id), col = (window.RAR_COLOR || {})[rar] || '#ffcf5a', n = list().length;
    m.dataset.id = id;
    m.innerHTML = `<div class="gw g7-card" style="--rc:${col}">
      <header class="g7-head"><button class="g7-nav" data-nav="-1" aria-label="上一位船員" ${n > 1 ? '' : 'disabled'}>‹</button><button type="button" class="g7-title" data-pick aria-label="選擇要培養的船員"><span class="rar c-rar r-${rar}">${rar}</span><b>${esc(c.name)}</b><small>${esc(c.title || '')}</small><i class="g7-dd" aria-hidden="true">▾</i></button><button class="g7-nav" data-nav="1" aria-label="下一位船員" ${n > 1 ? '' : 'disabled'}>›</button><button class="g7-x" aria-label="關閉">×</button></header>
      <div class="g7-main">
        <section class="g7-hero"><button class="gw-art g7-art" type="button" aria-label="放大檢視立繪"><img alt="${esc(c.name)}" decoding="async"><i class="g7-zoom" aria-hidden="true">⤢</i></button><div class="g7-sum"></div></section><div class="g7-brk" hidden></div>
        <div class="g7-side"><nav class="gw-tabs g7-tabs" role="tablist">${TABS.map(([k, t]) => `<button role="tab" data-tab="${k}">${t}</button>`).join('')}</nav><div class="g7-panel" role="tabpanel"></div>
        <footer class="g7-bar"><div class="g7-need"></div><button class="btn-gold g7-goBtn"></button></footer></div>
      </div></div>`;
    setArt(true);
  }
  /* 立繪：先在背景解碼好再換，避免閃白；同一張圖不重設 */
  function setArt(first) {
    const id = cur, k = ((SAVE.data.skins || {}).equip || {})[id], src = k && typeof SKINS !== 'undefined' && SKINS[k] ? SKINS[k].image : CHARACTERS[id].image, im = $(M, '.g7-art img');
    if (!im || im.getAttribute('src') === src) return;
    const fit = () => im.classList.toggle('wide', im.naturalWidth > im.naturalHeight * .95);
    if (first) { im.onload = fit; im.src = src; return; }
    const pre = new Image(); pre.src = src; (pre.decode ? pre.decode() : Promise.resolve()).catch(() => { }).then(() => { if (cur !== id) return; im.onload = fit; im.src = src; if (im.complete) fit(); });
  }

  /* ---------- 上方數值 ---------- */
  function renderSum() {
    const id = cur, r = SAVE.data.roster[id], lv = r.lv, p = P(), st = p ? p.starOf(id) : 0;
    const to = tab === 'lv' && pv > lv ? pv : lv, A = Ac || (Ac = fstats(id)), B = previewStats(A), need = lv >= MAX_LV ? 1 : expNeed(lv), pct = lv >= MAX_LV ? 100 : Math.min(100, r.exp / need * 100);
    const S0 = $(M, '.g7-sum');
    if (!S0.firstChild) S0.innerHTML = `<div class="g7-lv"></div><div class="g7-bar0"><i></i></div><small class="g7-exp"></small><div class="g7-stars"></div><button type="button" class="g7-pow" data-brk aria-label="查看數值組成"></button><dl class="g7-stats">${[['atk', '⚔', '攻擊'], ['def', '🛡', '防禦'], ['hp', '❤', '體力'], ['spd', '💨', '速度']].map(([k, ic, t]) => `<div data-k="${k}"><dt><i aria-hidden="true">${ic}</i><span>${t}</span></dt><dd></dd></div>`).join('')}</dl>`;
    /* 只改有變化的地方（調整目標等級時，每次只動幾個數字） */
    setH($(S0, '.g7-lv'), `<span class="k">LV</span><b class="g7-lvn">${lv}</b>${to > lv ? `<span class="ar">→</span><b class="g7-to">${to}</b>` : ''}<span class="mx">/ ${MAX_LV}</span>`);
    const bi = $(S0, '.g7-bar0 i'); if (bi.__w !== pct) { bi.__w = pct; bi.style.width = pct + '%'; }
    setH($(S0, '.g7-exp'), lv >= MAX_LV ? '已達最高等級' : `經驗 ${fmt(r.exp)} / ${fmt(need)}`);
    const sx = $(S0, '.g7-stars'); sx.hidden = !p; if (p) { setH(sx, [1, 2, 3, 4, 5].map(k => `<i class="${k <= st ? 'on' : ''}">★</i>`).join('')); sx.setAttribute('aria-label', `覺醒 ${st} 星`); }
    const dv = k => B[k] !== A[k] ? `<em class="${B[k] < A[k] ? 'dn' : ''}">→ ${fmt(B[k])}</em>` : '';
    setH($(S0, '.g7-pow'), `<span>戰力</span><b>${fmt(A.pow)}</b>${dv('pow')}<i class="g7-brkb" aria-hidden="true">組成 ▾</i>`);
    ['atk', 'def', 'hp', 'spd'].forEach(k => setH($(S0, `[data-k="${k}"] dd`), `<b>${fmt(A[k])}</b>${dv(k)}`));
    const bk = $(M, '.g7-brk'); if (bk) { bk.hidden = !brk; if (brk) setH(bk, brkHTML()); }
  }
  /* 各分頁的預覽：升級＝目標等級；覺醒＝下一顆星；寶物＝正在看的候選寶物或強化目標 */
  function previewStats(A) {
    const id = cur, lv = crewLv(id);
    if (tab === 'lv' && pv > lv) return fstats(id, { lv: pv });
    if (tab === 'star' && P()) { const st = P().starOf(id); if (st < 5) return fstats(id, { star: st + 1 }); }
    if (tab === 'gear' && gPrev) return fstats(id, { gear: gPrev });
    if (tab === 'gear' && gEnh && eTarget) return fstats(id, { genh: { id: gEnh, lv: eTarget } });
    return A;
  }
  function brkHTML() {
    const A = Ac || (Ac = fstats(cur)), p = A.parts, rows = [['atk', '攻擊'], ['def', '防禦'], ['hp', '體力'], ['spd', '速度'], ['pow', '戰力']];
    const d = (x, y) => { const v = x - y; return v ? `<em>+${fmt(v)}</em>` : '<i>—</i>'; };
    return `<div class="g7-brkh"><b>數值組成</b><small>和戰鬥裡實際使用的數值相同；天梯、好友對戰不計算覺醒與寶物</small><button class="g7-brkx" data-brk aria-label="收起">×</button></div>
      <table><thead><tr><th></th><th>等級<small>含體質</small></th><th>羈絆</th><th>覺醒</th><th>寶物</th><th>合計</th></tr></thead><tbody>${rows.map(([k, t]) => `<tr><th>${t}</th><td>${fmt(p.base[k])}</td><td>${d(p.set[k], p.base[k])}</td><td>${d(p.star[k], p.set[k])}</td><td>${d(p.gear[k], p.star[k])}</td><td><b>${fmt(A[k])}</b></td></tr>`).join('')}</tbody></table>
      ${A.ult ? `<p>寶物：奧義傷害 +${A.ult}%</p>` : ''}${(SAVE.data.lineup || []).includes(cur) ? '' : '<p>羈絆加成要在出戰陣容中才會生效。</p>'}`;
  }
  function setH(e, h) { if (e && e.__h !== h) { e.__h = h; e.innerHTML = h; } }
  function renderTabs() {
    const h = hint(cur), dot = { star: h.star || h.trial, sk: h.sk, gear: h.gear };
    M.querySelectorAll('.g7-tabs [data-tab]').forEach(b => { const k = b.dataset.tab, show = (k !== 'star' && k !== 'sk' || P()) && (k !== 'gear' || G()); b.hidden = !show; b.classList.toggle('on', k === tab); b.setAttribute('aria-selected', k === tab); b.classList.toggle('gh-dot', !!dot[k]); });
  }
  /* 主要按鈕列：need＝左邊說明（消耗或缺少什麼），btn＝[文字, 可按, 動作] */
  function setBar(need, txt, ok, act, extra) {
    setH($(M, '.g7-need'), need || ''); const b = $(M, '.g7-goBtn'); setH(b, txt); b.disabled = !ok; b.__act = ok ? act : null; b.classList.toggle('ok', !!ok);
    $(M, '.g7-bar').classList.toggle('has-x', !!extra);
  }

  /* ---------- 升級 ---------- */
  function lvPanel() {
    const id = cur, lv = crewLv(id), mx = maxReach(id), P0 = $(M, '.g7-panel');
    if (lv >= MAX_LV) { P0.innerHTML = `<div class="g7-done"><b>已達最高等級 LV ${MAX_LV}</b><p>可以到「覺醒」「技能」「寶物」繼續變強。</p></div>`; return setBar('', '已達最高等級', false); }
    const any = BOOKS.some(b => inv()[b] > 0);
    if (!any) { P0.innerHTML = `<div class="g7-sec"><h4>經驗書</h4><ul class="g7-mats">${BOOKS.map(b => matLi(b, 0)).join('')}</ul></div><div class="g7-sec"><h4>去哪裡拿經驗書</h4>${goBtns(['shop', 'tower'])}<p class="g7-tip">劇情地圖的寶箱、每日懸賞也會給經驗書；把船員放進訓練營也能獲得經驗。</p></div>`;
      return setBar('<span class="no">沒有經驗書</span>', '升級', false); }
    if (!target || target <= lv || target > Math.max(mx, lv + 1)) target = mx > lv ? mx : lv + 1;
    P0.innerHTML = `<div class="g7-sec"><h4>目標等級</h4>
      <div class="g7-tgt"><button class="g7-st" data-lvq="-10" aria-label="減少 10 級">−10</button><button class="g7-st" data-lvq="-1" aria-label="減少 1 級">−</button><output class="g7-tv"></output><button class="g7-st" data-lvq="1" aria-label="增加 1 級">＋</button><button class="g7-st" data-lvq="10" aria-label="增加 10 級">+10</button></div>
      ${mx > lv + 1 ? `<input class="g7-range" type="range" min="${lv + 1}" max="${mx}" step="1" aria-label="目標等級">` : ''}
      <div class="g7-quick"><button class="btn-ghost sm" data-lvset="next">下一級</button><button class="btn-ghost sm" data-lvset="max">最大（LV ${Math.max(mx, lv)}）</button></div></div>
      <div class="g7-sec"><h4>使用的經驗書<small>自動選擇，經驗多的先用</small></h4><ul class="g7-mats"></ul></div>`;
    updLv();
  }
  const matLi = (b, use) => { const it = ITEMS[b], n = inv()[b] || 0; return `<li class="${n ? '' : 'off'} ${use ? 'use' : ''}" data-b="${b}"><span class="g7-mi">${typeof itemIcon === 'function' ? itemIcon(it) : ''}</span><b>${it.name}</b><small>每本 +${fmt(it.effect.exp)}</small><span class="g7-mq"><em>${use ? '×' + use : '—'}</em><small>擁有 ${n}</small></span></li>`; };
  function updLv() {
    const id = cur, lv = crewLv(id), mx = maxReach(id), P0 = $(M, '.g7-panel'); if (!$(P0, '.g7-tgt')) return;
    const enough = mx > lv; target = Math.max(lv + 1, Math.min(enough ? mx : lv + 1, target));
    const q = enough ? pickBooks(id, target) : Object.fromEntries(BOOKS.map(b => [b, inv()[b] || 0])), e = qExp(q), real = previewLv(id, e);
    setH($(P0, '.g7-tv'), `<small>LV ${lv} →</small><b>LV ${enough ? target : real}</b>`);
    const rg = $(P0, '.g7-range'); if (rg) { rg.value = target; rg.style.setProperty('--p', ((target - rg.min) / Math.max(1, rg.max - rg.min) * 100) + '%'); }
    P0.querySelectorAll('[data-lvq]').forEach(b => { const d = +b.dataset.lvq; b.disabled = !enough || (d < 0 ? target <= lv + 1 : target >= mx); });
    { const ul = $(P0, '.g7-mats'); if (ul.children.length !== BOOKS.length) ul.innerHTML = BOOKS.map(b => matLi(b, q[b] || 0)).join('');
      else BOOKS.forEach((b, i) => { const li = ul.children[i], u = q[b] || 0; li.classList.toggle('use', !!u); setH($(li, '.g7-mq em'), u ? '×' + u : '—'); }); }
    const used = BOOKS.reduce((a, b) => a + (q[b] || 0), 0);
    pv = real; renderSum();
    if (enough) setBar(`<span>消耗經驗書 ${used} 本</span><small>經驗 +${fmt(e)}</small>`, `<span>升級到 LV ${real}</span>`, true, () => doLv(q));
    else setBar(`<span>經驗書不夠升 1 級</span><small>全部用掉可得經驗 +${fmt(e)}</small>`, '<span>使用全部經驗書</span>', e > 0, () => doLv(q));
  }
  function doLv(q) {
    const id = cur, e = qExp(q); if (!e) return; const before = crewLv(id), A = stats(id, before);
    BOOKS.forEach(b => { if (q[b]) SAVE.data.inventory[b] -= q[b]; }); SAVE.save();
    gainExp(id, e, true, true); if (typeof track === 'function') track('grows');
    const after = crewLv(id), B = stats(id, after), un = CHARACTERS[id].skills.filter((s, i) => { const u = SKILL_UNLOCK[i] || 1; return u > before && u <= after; }).map(s => s.name);
    if (typeof SFX !== 'undefined') SFX.play(after > before ? 'quest' : 'coin');
    toast(after > before ? `${CHARACTERS[id].name} 升到 LV ${after}！${un.length ? `學會「${un.join('」「')}」` : ''}` : `${CHARACTERS[id].name} 獲得 ${fmt(e)} 經驗`, 'gold');
    target = 0; refresh(); celebrate(A, B, after > before);
  }

  /* ---------- 覺醒 ---------- */
  function starPanel() {
    const p = P(), id = cur, st = p.starOf(id), lv = crewLv(id), k = st + 1, cost = k <= 5 ? p.starCost(id, k) : null, b = p.cfg.starBonus * 100, have = inv().awaken_gem || 0, berry = SAVE.data.berry || 0;
    const dup = p.dupes(id), dupG = dup * (p.cfg.dupeGem[p.rarOf(id)] || 5), T = window.TRIAL, tlock = st === 4 && T && !T.done(id);
    const req = cost ? [['角色等級', `LV ${lv}`, `LV ${cost.lv}`, lv >= cost.lv], ['覺醒結晶', fmt(have), fmt(cost.gem), have >= cost.gem], ['貝里', fmt(berry), fmt(cost.berry), berry >= cost.berry]] : [];
    if (tlock) req.push(['角色試煉', T.done(id) ? '已通過' : '未通過', '通過', !!T.done(id)]);
    const trial = st >= 4 && T ? (() => { const done = T.done(id), r = T.rival(id), rn = r === id ? `另一個${CHARACTERS[id].name}` : CHARACTERS[r].name, av = typeof charArt === 'function' ? charArt(r, 'avatar') : CHARACTERS[r].avatar;
      return `<div class="g7-trial ${done ? 'ok' : ''}"><img src="${av}" alt=""><span><b>${CHARACTERS[id].name} 的試煉</b><small>${done ? `已通過・對手：${rn}` : `對手：${rn}・通過後才能覺醒到 ★5`}</small></span><button class="${done ? 'btn-ghost' : 'btn-gold'} sm" data-trial>${done ? '再挑戰' : '挑戰'}</button></div>`; })() : '';
    $(M, '.g7-panel').innerHTML = `<div class="g7-sec g7-starsec"><div class="g7-starbig">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= st ? 'on' : i === k ? 'next' : ''}">★</i>`).join('')}</div>
        <div class="g7-cmp"><span>覺醒加成（體力、傷害）</span><b>+${st * b}%</b>${cost ? `<em>→ +${k * b}%</em>` : ''}</div></div>
      ${cost ? `<div class="g7-sec"><h4>覺醒到 ★${k} 需要</h4><ul class="g7-req">${req.map(([t, h, n, ok]) => `<li class="${ok ? 'ok' : 'no'}"><span>${t}</span><b>${h}<small> / ${n}</small></b><i aria-hidden="true">${ok ? '✓' : '✕'}</i></li>`).join('')}</ul>${have < cost.gem ? `<h4 class="g7-h2">覺醒結晶去哪裡拿</h4>${goBtns(['daily', 'pass', 'ladder'])}` : ''}</div>` : '<div class="g7-done"><b>已經覺醒到最高的 ★5！</b></div>'}
      ${trial}
      <div class="g7-sec g7-dupe"><span>重複的「${CHARACTERS[id].name}」<b>×${dup}</b>${dup ? `<small>可分解為覺醒結晶 ×${dupG}</small>` : '<small>抽到重複角色時會存在這裡</small>'}</span><button class="btn-ghost sm" data-dupe ${dup ? '' : 'disabled'}>分解</button></div>
      <p class="g7-tip">覺醒加成在劇情、勇者之塔、皇帝領海等挑戰中生效；天梯、好友對戰雙方條件相同，不計算覺醒與技能等級。</p>`;
    if (!cost) return setBar('', '已覺醒到最高', false);
    const miss = req.filter(x => !x[3]).map(x => x[0] === '角色等級' ? `角色要 ${x[2]}` : x[0] === '角色試煉' ? '先通過角色試煉' : `${x[0]}還差 ${fmt(x[0] === '貝里' ? cost.berry - berry : cost.gem - have)}`);
    setBar(miss.length ? `<span class="no">${miss.join('、')}</span>` : `<span>消耗 結晶 ×${fmt(cost.gem)}</span><small>貝里 ${fmt(cost.berry)}</small>`, `<span>覺醒到 ★${k}</span>`, !miss.length, () => {
      const r = p.starUp(id); if (!r.ok) return toast(r.msg, 'warn'); if (typeof SFX !== 'undefined') SFX.play('ult'); toast(`${CHARACTERS[id].name} 覺醒到 ★${r.star}！體力、傷害 +${r.star * b}%`, 'gold'); const A0 = Ac || fstats(id); refresh(); pop('.g7-starbig'); glow(); celebrate(A0, fstats(id), false); });
  }

  /* ---------- 技能 ---------- */
  function skPanel() {
    const id = cur, c = CHARACTERS[id], S = c.skills.map((s, i) => skState(id, i));
    if (skSel < 0 || !S[skSel]) { const f = S.findIndex(x => x.can); skSel = f >= 0 ? f : 0; }
    $(M, '.g7-panel').innerHTML = `<div class="g7-own"><span>${typeof itemIcon === 'function' && ITEMS.skill_book ? itemIcon(ITEMS.skill_book) : ''}秘傳書 <b>${fmt(inv().skill_book || 0)}</b></span><span><img src="assets/ui/coin_berry.webp?v=100" alt="">貝里 <b>${fmt(SAVE.data.berry || 0)}</b></span></div>
      <ol class="g7-sks">${S.map((x, i) => `<li><button class="g7-sk ${i === skSel ? 'on' : ''} ${x.learned ? '' : 'lock'} ${x.s.ultimate ? 'ult' : ''}" data-sk="${i}" aria-pressed="${i === skSel}"><span class="n">${i + 1}</span><b>${esc(x.s.name)}</b><i class="t ${x.s.ultimate ? 'ult' : x.s.type === 'support' ? 'sup' : 'atk'}">${x.s.ultimate ? '奧義' : x.s.type === 'support' ? '輔助' : '攻擊'}</i><span class="l">${x.learned ? `Lv ${x.lv}<small>/5</small>` : '🔒'}</span>${x.can ? '<i class="g7-dot" aria-label="可以升級"></i>' : ''}</button></li>`).join('')}</ol>
      <div class="g7-skd"></div>`;
    updSk();
  }
  function updSk() {
    const id = cur, i = skSel, x = skState(id, i), s = x.s, p = P(), d = $(M, '.g7-skd'); if (!d) return;
    M.querySelectorAll('.g7-sk').forEach(b => { const on = +b.dataset.sk === i; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const tags = (s.tags || []).map(t => Array.isArray(t) ? `<span class="tag ${t[1] || ''}">${t[0]}</span>` : `<span class="tag">${t}</span>`).join('');
    const S2 = window.PROG2, spec = x.learned && x.lv >= 5 && S2 ? `<div class="g7-spec"><h4>專精（Lv5 後可選一種，隨時可換）</h4><div>${S2.specOpts(s).map(k => `<button class="g7-spb ${S2.specOf(id, i) === k ? 'on' : ''}" data-spec="${i}:${k}"><b>${S2.SPEC_TXT[k][0]}</b><small>${S2.SPEC_TXT[k][1]}</small></button>`).join('')}</div></div>` : '';
    const BD = s.ultimate && window.BOND ? BOND.info(id) : [], bond = BD.length ? `<div class="g7-bond"><h4>羈絆</h4><ul>${BD.map(y => { const got = y.S.members.filter(m => owned(m)).length; return `<li class="${y.done ? 'on' : ''}"><b>${y.B.n}<em>${y.S.name}</em></b><small>${BOND.text(y.B)}</small><small class="st">${y.done ? `已開通・出戰陣容有 ${y.need} 位以上成員時生效` : `收集成員 ${got}/${y.S.members.length} 後開通`}</small></li>`; }).join('')}</ul></div>` : '';
    const L0 = lvStats(CHARACTERS[id], crewLv(id)), pp = typeof skillPP === 'function' ? skillPP(s, crewLv(id), L0.ppAdj) : s.maxPP;
    d.innerHTML = `<h4>${i + 1}. ${esc(s.name)}</h4><dl class="g7-skm"><div><dt>威力</dt><dd>${s.power || '—'}</dd></div><div><dt>命中</dt><dd>${s.accuracy || '—'}</dd></div><div><dt>次數</dt><dd>${x.learned ? pp : s.maxPP || '—'}</dd></div><div><dt>學會</dt><dd>${x.skin ? '皮膚' : 'LV ' + x.u}</dd></div></dl>
      <p class="g7-skp">${esc(s.desc || '')}</p>${tags ? `<div class="g7-skg">${tags}</div>` : ''}
      ${x.learned && p ? `<div class="g7-cmp"><span>技能等級 Lv ${x.lv}</span><b>${p.skEffect(s, x.lv) || '尚無加成'}</b>${x.lv < 5 ? `<em>→ ${p.skNext(s, x.lv)}</em>` : ''}</div>` : ''}${spec}${bond}`;
    if (!x.learned || !p) return setBar(`<span class="no">${x.why}</span>`, '升級技能', false);
    if (x.lv >= 5) return setBar('<span>已升到最高 Lv5</span>', '已滿級', false);
    setBar(x.can ? `<span>消耗 秘傳書 ×${x.cost.book}</span><small>貝里 ${fmt(x.cost.berry)}</small>` : `<span class="no">${x.why}</span>${(inv().skill_book || 0) < x.cost.book ? goBtns(['daily', 'pass']) : ''}`, `<span>升到 Lv${x.lv + 1}</span>`, x.can, () => {
      const r = p.skUp(id, i); if (!r.ok) return toast(r.msg, 'warn'); if (typeof SFX !== 'undefined') SFX.play('rare'); toast(`${s.name} 升到 Lv${r.lv}！`, 'gold');
      renderTabs(); const keep = skSel; skPanel(); skSel = keep; updSk(); pop(`.g7-sk[data-sk="${i}"] .l`); });
  }

  /* ---------- 寶物 ---------- */
  function gearPanel() {
    const g = G(), C = g.cfg, id = cur, S = g.gearSum(id), eq = g.equipped(id), items = g.gear().items, cnt = r => items.filter(x => x.rar === r && !x.eq).length;
    const sum = Object.entries(S).filter(([, v]) => v).map(([k, v]) => `<span class="gr-sum">${C.label[k]} <b>+${v}%</b></span>`).join('') || '<span class="gr-sum off">還沒有裝備寶物</span>';
    const tools = `<div class="gr-tools"><span class="gr-bag">寶物 <b>${items.length}</b>/${C.cap}</span><button class="btn-ghost sm" data-gsalr="R" ${cnt('R') ? '' : 'disabled'}>分解 R（${cnt('R')}）</button><button class="btn-ghost sm" data-gsalr="SR" ${cnt('SR') ? '' : 'disabled'}>分解 SR（${cnt('SR')}）</button></div>`;
    let body, bar = null;
    if (gEnh) { const x = items.find(y => y.id === gEnh); if (!x) gEnh = null; else {
      const cap = C.maxLv, costTo = n => { let c = 0; for (let L = x.lv; L < n; L++) c += Math.round(C.enhCost(L) * C.rarMul[x.rar]); return c; }, berry = SAVE.data.berry || 0;
      let afford = x.lv; while (afford < cap && costTo(afford + 1) <= berry) afford++;
      if (!eTarget || eTarget <= x.lv || eTarget > cap) eTarget = Math.max(x.lv + 1, Math.min(cap, afford));
      const d0 = g.describe(x), d1 = withTemp({ id, genh: { id: x.id, lv: eTarget } }, () => g.describe(x)), cost = costTo(eTarget), ok = x.lv < cap && cost <= berry;
      body = `<div class="g7-pickh"><button class="btn-ghost sm" data-gback>‹ 返回</button><b>強化 ${x.name}</b></div>
        <div class="g7-sec"><div class="g7-gcard r-${x.rar}">${g.gearIcon(x, 48)}<div><b><em class="rar c-rar r-${x.rar}">${x.rar}</em>${x.name}</b><small>${d0.subs.join('・') || '沒有副詞條'}</small></div></div>
        <h4>強化到</h4><div class="g7-tgt"><button class="g7-st" data-eq="-10" aria-label="減到最低">«</button><button class="g7-st" data-eq="-1" aria-label="減少 1 級">−</button><output class="g7-tv"><small>+${x.lv} →</small><b>+${eTarget}</b></output><button class="g7-st" data-eq="1" aria-label="增加 1 級">＋</button><button class="g7-st" data-eq="10" aria-label="強化到最高">»</button></div>
        <ul class="g7-req"><li class="ok"><span>主詞條</span><b>${d0.main}<small> → </small>${d1.main}</b><i aria-hidden="true">↑</i></li><li class="${ok || x.lv >= cap ? 'ok' : 'no'}"><span>貝里</span><b>${fmt(berry)}<small> / ${fmt(cost)}</small></b><i aria-hidden="true">${ok ? '✓' : '✕'}</i></li></ul>
        <p class="g7-tip">強化到 +3／+6／+9 時，會隨機一條副詞條成長（上方預覽只算主詞條）。目前的貝里最多可以強化到 +${afford}。</p></div>`;
      bar = x.lv >= cap ? ['<span>已強化到最高 +10</span>', '已滿級', false] : [ok ? `<span>消耗 貝里 ${fmt(cost)}</span><small>+${x.lv} → +${eTarget}</small>` : `<span class="no">貝里還差 ${fmt(cost - berry)}</span>`, `<span>強化到 +${eTarget}</span>`, ok, () => {
        let n = 0, ups = []; while (x.lv < eTarget) { const r = g.enhance(x.id); if (!r.ok) break; n++; if (r.up) ups.push(r.up); }
        if (!n) return toast('貝里不足', 'warn'); if (typeof SFX !== 'undefined') SFX.play('rare'); toast(`強化到 +${x.lv}${ups.length ? `（${ups.join('、')}）` : ''}`, 'gold');
        const A0 = Ac || fstats(id); eTarget = 0; refresh(); celebrate(A0, fstats(id), false); }];
    } }
    if (gEnh) { /* 已在上面組好 */ }
    else if (gearPick) { const A = Ac || (Ac = fstats(id)), DP = {}; items.filter(x => x.slot === gearPick).forEach(x => { DP[x.id] = x.eq === id ? 0 : fstats(id, { gear: x.id }).pow - A.pow; });
      const L = items.filter(x => x.slot === gearPick).sort((a, b) => (b.eq === id) - (a.eq === id) || DP[b.id] - DP[a.id]); /* 使用中的放最上面，其餘依戰力提升排序 */
      if (!gPrev) { const f = L.find(x => x.eq !== id); gPrev = f ? f.id : null; }
      body = `<div class="g7-pickh"><button class="btn-ghost sm" data-gback>‹ 返回</button><b>選擇${C.slots[gearPick].name}（${L.length}）</b><small>點一下預覽，上方數值會變化</small></div><ol class="gr-list g7-glist">${L.map(x => { const d = g.describe(x), who = x.eq && CHARACTERS[x.eq], dp = DP[x.id];
        return `<li class="r-${x.rar} ${x.id === gPrev ? 'on' : ''}" data-gprev="${x.id}" tabindex="0">${g.gearIcon(x, 44)}<div class="gr-i"><b><em class="rar c-rar r-${x.rar}">${x.rar}</em>${x.name}${x.lv ? ` +${x.lv}` : ''}</b><small>${d.main}${d.subs.length ? '・' + d.subs.join('・') : ''}</small>${who ? `<small class="gr-who">${x.eq === id ? '裝備中' : `${who.name} 裝備中`}</small>` : ''}</div><div class="gr-b">${x.eq === id ? '<span class="gr-on">使用中</span>' : `<span class="g7-dp ${dp < 0 ? 'dn' : ''}">戰力 ${dp >= 0 ? '+' : ''}${fmt(dp)}</span>`}</div></li>`; }).join('') || '<li class="gr-empty">還沒有這種寶物。勇者之塔、篇章 BOSS、皇帝領海、天梯與本週活躍寶箱會掉落。</li>'}</ol>`;
      const px = items.find(y => y.id === gPrev);
      bar = px && px.eq === id ? ['<span>這件正在使用中</span><small>點其他寶物比較看看</small>', '使用中', false] : px ? [px.eq && px.eq !== id ? `<span>會從${CHARACTERS[px.eq].name}身上換過來</span>` : `<span>${px.name}${px.lv ? ` +${px.lv}` : ''}</span><small>${g.describe(px).main}</small>`, '<span>裝備這件</span>', true, () => { if (g.equip(px.id, id)) { if (typeof SFX !== 'undefined') SFX.play('buff'); toast(`已裝備「${px.name}」`, 'gold'); const A0 = Ac || fstats(id); gearPick = null; gPrev = null; refresh(); celebrate(A0, fstats(id), false); } }] : ['<span>選一件寶物預覽</span>', '裝備這件', false]; }
    else body = `<ol class="gr-slots g7-gslots">${Object.keys(C.slots).map(k => { const x = eq.find(y => y.slot === k);
      if (!x) { const has = items.some(y => y.slot === k && !y.eq); return `<li class="gr-slot empty"><span class="gr-ic0">${g.gearIcon({ slot: k, rar: 'R' }, 44)}</span><div class="gr-i"><b>${C.slots[k].name}</b><small>${has ? '有可以裝備的寶物' : '空欄位'}・主詞條：${C.label[C.slots[k].main]}</small></div><div class="gr-b">${has ? `<button class="btn-gold sm gh-dot" data-gslot="${k}">裝備</button>` : '<span class="g7-none">還沒有</span>'}</div></li>`; }
      const d = g.describe(x);
      return `<li class="gr-slot r-${x.rar}">${g.gearIcon(x, 44)}<div class="gr-i"><b><em class="rar c-rar r-${x.rar}">${x.rar}</em>${x.name} +${x.lv}</b><small class="gr-main">${d.main}</small><small>${d.subs.join('・') || '沒有副詞條'}</small></div>
        <div class="gr-b"><button class="btn-gold sm gr-enh" data-genh="${x.id}" ${x.lv >= C.maxLv ? 'disabled' : ''}>${x.lv >= C.maxLv ? '已滿 +10' : '強化'}</button><button class="btn-ghost sm" data-gslot="${k}">更換</button></div></li>`; }).join('')}</ol>`;
    $(M, '.g7-panel').innerHTML = `${gearPick || gEnh ? '' : `<div class="gr-sums">${sum}</div>${tools}`}${body}<p class="g7-tip">寶物只在劇情與挑戰中生效（PvP 不計算）。強化每級主詞條 +10%，+3／+6／+9 時隨機一條副詞條成長。</p>`;
    if (bar) return setBar(bar[0], bar[1], bar[2], bar[3]);
    const can = window.GROWHINT && items.length;
    setBar(items.length ? '<span>從背包挑評分最高的寶物換上</span><small>不會拿走其他船員身上的寶物</small>' : '<span class="no">還沒有寶物</span><small>勇者之塔、篇章 BOSS、皇帝領海會掉落</small>', '<span>一鍵裝備最佳</span>', !!can, () => {
      const A0 = Ac || fstats(id), n = GROWHINT.bestEquip(id); toast(n ? `已換上評分最高的寶物（${n} 件）` : '目前已經是最佳裝備', n ? 'gold' : ''); if (n && typeof SFX !== 'undefined') SFX.play('buff'); gearPick = null; refresh(); if (n) celebrate(A0, fstats(id), false); });
  }

  /* ---------- 共用事件（委派，只綁一次） ---------- */
  function bindDelegates(m) {
    let hold = null;
    const step = d => { const lv = crewLv(cur), mx = maxReach(cur); const nt = Math.max(lv + 1, Math.min(mx, target + d)); if (nt === target) return false; target = nt; updLv(); return true; };
    const stop = () => { if (hold) { clearTimeout(hold.t); clearInterval(hold.i); hold = null; } };
    /* 長按 −／＋：0.35 秒後開始連續加減，越按越快 */
    m.addEventListener('pointerdown', e => { const b = e.target.closest('[data-lvq]'); if (!b || b.disabled) return; e.preventDefault(); stop(); const d = +b.dataset.lvq; step(d); let n = 0;
      hold = { t: setTimeout(() => { hold.i = setInterval(() => { n++; if (!step(n > 12 ? d * (Math.abs(d) === 1 ? 5 : 1) : d)) stop(); }, 90); }, 350) }; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => m.addEventListener(ev, stop));
    m.addEventListener('contextmenu', e => { if (e.target.closest('[data-lvq]')) e.preventDefault(); });
    m.addEventListener('input', e => { if (e.target.matches('.g7-range')) { target = +e.target.value; updLv(); } });
    m.addEventListener('keydown', e => { const b = e.target.closest && e.target.closest('[data-lvq]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); step(+b.dataset.lvq); } });
    m.addEventListener('click', e => {
      const li = e.target.closest('[data-gprev]'); if (li && m.contains(li)) { gPrev = li.dataset.gprev; M.querySelectorAll('[data-gprev]').forEach(x => x.classList.toggle('on', x === li)); gearPanelBarOnly(); return; }
      const t = e.target.closest('button,[data-tab]'); if (!t || t.disabled || !m.contains(t)) return;
      if (t.hasAttribute('data-brk')) { brk = !brk; renderSum(); return; }
      if (t.hasAttribute('data-pick')) { pickSheet(); return; }
      if (t.dataset.eq) { const x = G().gear().items.find(y => y.id === gEnh); if (!x) return; const d = +t.dataset.eq; eTarget = Math.max(x.lv + 1, Math.min(G().cfg.maxLv, Math.abs(d) >= 10 ? (d > 0 ? G().cfg.maxLv : x.lv + 1) : eTarget + d)); gearPanel(); renderSum(); return; }
      if (t.matches('.g7-x')) return close();
      if (t.dataset.nav) { goChar(+t.dataset.nav); return; }
      if (t.dataset.tab) { goTab(t.dataset.tab); return; }
      if (t.matches('.g7-art')) { const im = $(t, 'img'); if (window.openArtViewer && im) openArtViewer(im.currentSrc || im.src, im.alt, 1); return; }
      if (t.matches('.g7-goBtn')) { if (t.__act && !busy) { busy = true; const b = t; b.classList.remove('g7-hit'); void b.offsetWidth; b.classList.add('g7-hit'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (er) { } try { t.__act(); } finally { setTimeout(() => { busy = false; }, 250); } } return; }
      if (t.dataset.lvset) { target = t.dataset.lvset === 'max' ? maxReach(cur) : crewLv(cur) + 1; updLv(); return; }
      if (t.dataset.go) { const g = GO[t.dataset.go]; if (g) g[1](); return; }
      if (t.dataset.sk != null && t.matches('.g7-sk')) { skSel = +t.dataset.sk; updSk(); return; }
      if (t.dataset.spec) { const [i, k] = t.dataset.spec.split(':'), r = window.PROG2.setSpec(cur, +i, k); if (!r.ok) return toast(r.msg, 'warn'); if (!r.same) { toast(`專精改為「${window.PROG2.SPEC_TXT[k][0]}」`, 'gold'); updSk(); } return; }
      if (t.hasAttribute('data-trial')) { window.TRIAL && TRIAL.open(cur); return; }
      if (t.hasAttribute('data-dupe')) { const gm = P().dupeToGem(cur); if (gm) { toast(`分解完成：覺醒結晶 +${gm}`, 'gold'); refresh(); } return; }
      const g = G(); if (!g) return;
      if (t.dataset.gslot) { top0(); gearPick = t.dataset.gslot; gPrev = null; gEnh = null; gearPanel(); renderSum(); return; }
      if (t.hasAttribute('data-gback')) { gearPick = null; gPrev = null; gEnh = null; eTarget = 0; gearPanel(); renderSum(); return; }
      if (t.dataset.genh) { top0(); gEnh = t.dataset.genh; eTarget = 0; gearPick = null; gPrev = null; gearPanel(); renderSum(); return; }
      /* 批次分解：按第一次變成「再按一次確認」，3 秒內再按才分解 */
      if (t.dataset.gsalr) { if (!t.classList.contains('arm')) { t.classList.add('arm'); t.dataset.t = t.textContent; t.textContent = '再按一次確認'; clearTimeout(t.__t); t.__t = setTimeout(() => { t.classList.remove('arm'); t.textContent = t.dataset.t; }, 3000); return; }
        clearTimeout(t.__t); const ids = g.gear().items.filter(x => x.rar === t.dataset.gsalr && !x.eq).map(x => x.id), r = ids.length ? g.salvage(ids) : { n: 0, berry: 0, gem: 0 }; toast(`分解 ${r.n} 件：貝里 +${fmt(r.berry)}${r.gem ? `、覺醒結晶 +${r.gem}` : ''}`, 'gold'); refresh(); }
    });
  }
  /* 換分頁／換角色（按鈕與左右滑動共用） */
  function goTab(k, dir) {
    if (!k || tab === k) return; const ks = visTabs(); dir = dir || (ks.indexOf(k) > ks.indexOf(tab) ? 1 : -1);
    top0(); tab = k; gearPick = null; gPrev = null; gEnh = null; eTarget = 0; target = 0; refresh(); slide($(M, '.g7-panel'), dir);
    const b = M.querySelector(`.g7-tabs [data-tab="${k}"]`); if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  const visTabs = () => [...M.querySelectorAll('.g7-tabs [data-tab]')].filter(b => !b.hidden).map(b => b.dataset.tab);
  function goChar(d) { const L = list(), ix = L.indexOf(cur); if (L.length < 2) return; cur = L[(ix + d + L.length) % L.length]; target = 0; skSel = -1; gearPick = null; gPrev = null; gEnh = null; eTarget = 0; brk = false; M.dataset.id = cur; head(); setArt(); refresh(); slide($(M, '.g7-hero'), d); }
  function slide(e, d) { if (!e) return; e.classList.remove('g7-in-l', 'g7-in-r'); void e.offsetWidth; e.classList.add(d > 0 ? 'g7-in-r' : 'g7-in-l'); }
  /* 左右滑動：在立繪／數值區滑＝換角色，在內容區滑＝換分頁（滑桿、強化數量、橫向捲動區不算） */
  function bindSwipe(m) {
    let s0 = null;
    /* 數值組成打開時，點其他地方就收起 */
    m.addEventListener('pointerdown', e => { if (brk && !e.target.closest('.g7-brk,[data-brk]')) { brk = false; const bk = $(m, '.g7-brk'); if (bk) bk.hidden = true; } }, true);
    m.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || !e.isPrimary) return; if (e.target.closest('input,.g7-tgt,.g7-picksheet,.g7-brk')) { s0 = null; return; } const z = e.target.closest('.g7-hero,.g7-head') ? 'char' : e.target.closest('.g7-panel') ? 'tab' : null; s0 = z ? { x: e.clientX, y: e.clientY, t: Date.now(), z } : null; }, { passive: true });
    m.addEventListener('pointercancel', () => { s0 = null; });
    m.addEventListener('pointerup', e => { if (!s0) return; const dx = e.clientX - s0.x, dy = e.clientY - s0.y, z = s0.z, dt = Date.now() - s0.t; s0 = null;
      if (Math.abs(dx) < 56 || Math.abs(dy) > Math.abs(dx) * .6 || dt > 700) return; m.__swiped = Date.now();
      if (z === 'char') goChar(dx < 0 ? 1 : -1); else { const ks = visTabs(), i = ks.indexOf(tab), n = ks[i + (dx < 0 ? 1 : -1)]; if (n) goTab(n, dx < 0 ? 1 : -1); } });
    m.addEventListener('click', e => { if (m.__swiped && Date.now() - m.__swiped < 350) { e.stopPropagation(); e.preventDefault(); } }, true); /* 滑動放開時不要誤觸按鈕 */
  }
  /* 選擇要培養的船員（標題點一下、或從背包的「選擇要培養的船員」進來） */
  function pickSheet(standalone) {
    const team0 = SAVE.data.lineup || [], L = list().sort((a, b) => (team0.indexOf(a) < 0 ? 9 : team0.indexOf(a)) - (team0.indexOf(b) < 0 ? 9 : team0.indexOf(b))), d = document.createElement('div'); d.className = 'g7-picksheet'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '選擇要培養的船員');
    const team = SAVE.data.lineup || [];
    d.innerHTML = `<div class="g7-psc"><header><b>選擇要培養的船員</b><small>紅點＝有可以培養的項目</small><button class="g7-x" data-psx aria-label="關閉">×</button></header><div class="g7-pgrid">${L.map(id => { const c = CHARACTERS[id], h = hint(id), dot = h.star || h.trial || h.sk || h.gear, k = team.indexOf(id);
      return `<button class="g7-pc ${id === cur && !standalone ? 'on' : ''}" data-pid="${id}" style="--rc:${(window.RAR_COLOR || {})[rarOf(id)] || '#5fb8ff'}"><span class="g7-pa"><img src="${typeof charArt === 'function' ? charArt(id, 'avatar') : c.avatar}" alt="" loading="lazy">${k >= 0 ? `<i class="g7-pt">${k ? '陣容' + (k + 1) : '先鋒'}</i>` : ''}${dot ? '<i class="g7-dot"></i>' : ''}</span><b>${esc(c.name)}</b><small>LV ${crewLv(id)}</small></button>`; }).join('')}</div></div>`;
    const m = el(); m.appendChild(d);
    const shut = () => { d.remove(); if (standalone && !$(m, '.g7-card')) m.classList.remove('show'); };
    d.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-pid]'); if (b) { const id = b.dataset.pid; d.remove(); if (standalone || !$(m, '.g7-card')) window.openGrow(id); else if (id !== cur) { const L2 = list(); goChar(L2.indexOf(id) - L2.indexOf(cur)); } return; } if (e.target === d || e.target.closest('[data-psx]')) shut(); });
    if (standalone) m.classList.add('show');
  }
  window.openGrowPick = () => { if (!SAVE.data.roster || !list().length) return; M = el(); M.innerHTML = ''; pickSheet(true); };
  /* 寶物候選：只換按鈕列與上方預覽，清單不重畫 */
  function gearPanelBarOnly() { const sc = $(M, '.g7-panel').scrollTop; gearPanel(); $(M, '.g7-panel').scrollTop = sc; renderSum(); }
  /* 換分頁前先把內容捲回頂端（在改寫內容之前做，不會多一次同步排版） */
  function top0() { const pn = $(M, '.g7-panel'); if (pn && pn.scrollTop) pn.scrollTop = 0; }
  function head() { const c = CHARACTERS[cur], rar = rarOf(cur), t = $(M, '.g7-title'); $(M, '.g7-card').style.setProperty('--rc', (window.RAR_COLOR || {})[rar] || '#ffcf5a'); t.innerHTML = `<span class="rar c-rar r-${rar}">${rar}</span><b>${esc(c.name)}</b><small>${esc(c.title || '')}</small><i class="g7-dd" aria-hidden="true">▾</i>`; $(M, '.g7-art img').alt = c.name; }

  /* ---------- 回饋動畫 ---------- */
  function pop(q) { const e = M && M.querySelector(q); if (!e) return; e.classList.remove('g7-pop'); void e.offsetWidth; e.classList.add('g7-pop'); }
  function glow() { const a = $(M, '.g7-art'); if (!a) return; a.classList.remove('g7-glow'); void a.offsetWidth; a.classList.add('g7-glow'); }
  function celebrate(A, B, up) {
    if (up) { pop('.g7-lvn'); glow(); }
    ['atk', 'def', 'hp', 'spd'].forEach(k => { const d = B[k] - A[k], cell = M.querySelector(`.g7-stats [data-k="${k}"] dd`); if (d > 0 && cell) { const f = document.createElement('span'); f.className = 'g7-float'; f.textContent = '+' + fmt(d); cell.appendChild(f); setTimeout(() => f.remove(), 1100); } });
  }

  function refresh() {
    if (!M || !cur || !SAVE.data.roster[cur]) return close();
    if ((tab === 'star' || tab === 'sk') && !P()) tab = 'lv'; if (tab === 'gear' && !G()) tab = 'lv';
    pv = 0; Ac = null; renderTabs(); if (tab === 'lv') { renderSum(); lvPanel(); } else { target = 0; renderSum(); tab === 'star' ? starPanel() : tab === 'sk' ? skPanel() : gearPanel(); }
  }
  function close() { const m = document.getElementById('growModal'); if (!m || !m.classList.contains('show')) return; m.classList.remove('show'); document.querySelectorAll('.gw-pop').forEach(x => x.remove()); if (typeof window.__refreshCrew === 'function') window.__refreshCrew(); }

  window.openGrow = function (id, t) {
    if (!id || !SAVE.data.roster || !SAVE.data.roster[id]) return; cur = id; tab = t || 'lv'; target = 0; skSel = -1; gearPick = null;
    M = el(); skeleton(); refresh(); M.classList.add('show');
  };
  window.GROW7 = { refresh: () => { if (M && M.classList.contains('show')) refresh(); } };
  /* 背包或其他地方改變存檔時（例如分解、買書），培養視窗開著就更新數字 */
  document.addEventListener('visibilitychange', () => { if (!document.hidden) window.GROW7.refresh(); });
})();
