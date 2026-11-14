/* v116 背包改版：左側分類、中間道具格（圖示＋數量）、右側詳細資訊（說明、獲取方式可直接前往、使用按鈕）。
   手機：分類在上方、道具格在中間可捲動、詳細資訊固定在下方。取代 app.js 的 openBag（舊的 #bagModal 不再使用）。
   也負責：頭像重新裁切後的快取參數（v116）、獲得角色畫面的橫式立繪改為放大顯示。載入順序：vip_v115.js 之後。 */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- 頭像重新裁切（以臉為中心）：換新的快取參數 ---------- */
  const FACES = ['loki', 'yamato', 'mihawk_w', 'law', 'burgess', 'hody', 'morgans', 'mihawk'], SKIN_FACES = ['yamato_skin1', 'yamato_skin2'];
  const bump = u => u ? u.replace(/\?v=[^&]*$/, '') + '?v=116' : u;
  FACES.forEach(id => { const c = typeof CHARACTERS !== 'undefined' && CHARACTERS[id]; if (c && c.avatar) c.avatar = bump(c.avatar); });
  if (typeof SKINS !== 'undefined') Object.values(SKINS).forEach(s => { if (s.avatar && SKIN_FACES.some(f => s.avatar.includes(f + '_face'))) s.avatar = bump(s.avatar); });

  /* 橫式立繪（例如燼）放在直式框裡時會縮得很小：改為放大裁切，角色在框內清楚可見 */
  const WIDE_SEL = '.cer-char img, .cx-art img';
  const markWide = img => { if (img.naturalWidth && img.naturalWidth > img.naturalHeight * .9) img.classList.add('wide'); else img.classList.remove('wide'); };
  document.addEventListener('load', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.matches(WIDE_SEL)) markWide(t); }, true);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; (n.matches && n.matches(WIDE_SEL) ? [n] : [...n.querySelectorAll(WIDE_SEL)]).forEach(i => { if (i.complete) markWide(i); }); }))).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- 分類與獲取方式 ---------- */
  const CATS = [['all', '全部'], ['battle', '戰鬥'], ['grow', '培養'], ['ticket', '票券']];
  const CAT_OF = { potion_s: 'battle', herb: 'battle', potion_l: 'battle', pp_s: 'battle', haki: 'battle', shield: 'battle', tome: 'battle', meat: 'battle', feather: 'battle', potion_m: 'battle', pp_l: 'battle', guard_pot: 'battle', haki_l: 'battle',
    exp_s: 'grow', exp_m: 'grow', exp_l: 'grow', sweep: 'grow', skin_ticket: 'ticket', event_ticket: 'ticket', char_select: 'ticket', mc_pick_2611: 'ticket', awaken_gem: 'grow', skill_book: 'grow', summon_ticket: 'ticket' };
  const hub = t => { if (typeof openGacha === 'function') openGacha(typeof currentScreen !== 'undefined' ? currentScreen : 'modeScreen'); if (t && typeof switchHub === 'function') setTimeout(() => switchHub(t), 0); };
  const GO = {
    story: ['劇情任務・首次通關', null], afk: ['掛機寶藏（大廳左側）', () => window.QOL && QOL.openAfk()], ret: ['回歸玩家七日禮', () => window.RETURN && RETURN.open()],
    summon: ['懸賞處・召喚', () => hub('summon')], shop: ['道具商店', () => hub('shop')], bounty: ['每日懸賞', () => hub('bounty')],
    tower: ['勇者之塔', () => window.openTower && openTower()], login: ['七日登入', () => window.openLogin && openLogin()], ach: ['成就', () => window.openAchievements && openAchievements()],
    vip: ['VIP 每日／升級禮包', () => window.openVIP && openVIP('member')], card: ['月費', () => window.openVIP && openVIP('card')],
    fest: ['限時祭典・祭典商店（大廳右側）', () => window.openStages && openStages('fest')], realm: ['每日秘境（大廳右側）', () => window.openStages && openStages('realm')],
    chest: ['劇情地圖的寶箱', null], supply: ['每天自動補給 5 張', null],
    activity: ['每日／本週活躍寶箱', () => window.openPass && openPass('daily')], pass: ['航海通行證', () => window.openPass && openPass('pass')], ladder: ['海賊天梯賽季獎勵', () => window.openLadder && openLadder()], dupe: ['分解重複角色（角色培養 → 覺醒）', null]
  };
  /* v182：補上活動關卡（限時祭典、每日秘境）與商店新增的取得途徑 */
  const SRC = {
    potion_s: ['shop', 'realm', 'summon', 'chest', 'login'], herb: ['shop', 'realm', 'summon', 'login'], potion_l: ['shop', 'realm', 'summon', 'login'], pp_s: ['shop', 'realm', 'summon', 'login'], haki: ['shop', 'realm', 'summon'],
    shield: ['shop', 'realm', 'summon', 'login'], tome: ['summon', 'login'], meat: ['summon', 'login'], feather: ['summon', 'login'], potion_m: ['shop', 'realm', 'summon'], guard_pot: ['shop', 'realm', 'fest', 'summon'], pp_l: ['shop', 'realm', 'summon'], haki_l: ['shop', 'fest', 'summon'],
    exp_s: ['realm', 'shop', 'tower', 'chest', 'vip'], exp_m: ['realm', 'shop', 'tower', 'vip'], exp_l: ['realm', 'fest', 'shop', 'tower', 'summon', 'vip'], sweep: ['supply', 'shop', 'fest', 'vip'],
    skin_ticket: ['ach', 'vip'], event_ticket: ['fest', 'card', 'vip', 'login'], char_select: ['card', 'vip'], mc_pick_2611: ['card'],
    awaken_gem: ['realm', 'fest', 'activity', 'pass', 'ladder', 'dupe'], skill_book: ['realm', 'fest', 'activity', 'pass', 'ladder'], summon_ticket: ['story', 'bounty', 'login', 'activity', 'tower', 'shop', 'ach', 'pass', 'afk', 'ret'] /* v218：寶藏幣改為儲值限定後，遊戲內獎勵都改發召喚券 */
  };
  const USE = id => {
    const it = ITEMS[id] || {}, e = it.effect || {};
    if (e.skinTicket) return ['使用', () => { close(); openSkinTicket(); }];
    if (e.charSelect) return ['使用', () => { close(); window.openCharSelect && openCharSelect(); }];
    if (e.mcPick) return ['使用', () => { close(); window.openMcPick && openMcPick(id); }]; /* v164：月費角色隨機卡（vip_v115.js） */
    if (e.summonTicket) return ['前往召喚', () => { close(); hub('summon'); }];
    if (e.eventTicket) return ['前往限定召喚', () => { close(); const b = $('lbEvent'); if (b && typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen') b.click(); else hub(); }];
    if (e.grow) return ['選擇要培養的船員', () => { close(); if (window.openGrowPick) openGrowPick(); else { const id0 = (SAVE.data.lineup || [])[0]; if (window.openGrow && id0) openGrow(id0); } }]; /* v158：先選要培養誰 */
    if (e.exp) return ['選擇要培養的船員', () => { close(); if (window.openGrowPick) return openGrowPick(); const id0 = (SAVE.data.lineup || [])[0]; if (window.openGrow && id0) openGrow(id0); else if (typeof openCrew === 'function') openCrew('crew'); }];
    if (id === 'sweep') return ['前往每日秘境掃蕩', () => { close(); if (window.openStages) openStages('realm'); else if (typeof openChart === 'function') openChart(); }]; /* v182：秘境掃蕩最常用；海圖掃蕩仍可在劇情地圖使用 */
    return null; /* 戰鬥道具：在戰鬥中按「道具」使用 */
  };
  const RCOL = { N: '#7d93ab', R: '#3f8fe0', SR: '#9b5fe8', SSR: '#e8a83a' };

  let cat = 'all', sel = null, q = '', open_ = false;
  const inv = () => SAVE.data.inventory || {};
  const ids = () => Object.keys(ITEMS).filter(id => (inv()[id] || 0) > 0);
  const ORDER = { SSR: 0, SR: 1, R: 2, N: 3 };
  const listOf = () => ids().filter(id => (cat === 'all' || CAT_OF[id] === cat) && (!q || ITEMS[id].name.includes(q)))
    .sort((a, b) => (ORDER[ITEMS[a].rarity] ?? 9) - (ORDER[ITEMS[b].rarity] ?? 9) || Object.keys(ITEMS).indexOf(a) - Object.keys(ITEMS).indexOf(b));
  const fmtN = n => n >= 1e4 ? (Math.floor(n / 1e3) / 10) + '萬' : String(n);

  function wrap() { let m = $('bagV2'); if (!m) { m = document.createElement('div'); m.id = 'bagV2'; m.className = 'bg2-wrap'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', '背包'); document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) close(); }); } return m; }
  function close() { open_ = false; const m = $('bagV2'); if (m) m.classList.remove('show'); }
  function detail(id) {
    if (!id) return `<div class="bg2-empty"><p>選擇一個道具查看詳細資訊</p></div>`;
    const it = ITEMS[id], n = inv()[id] || 0, U = USE(id), src = (SRC[id] || []).map(k => GO[k]).filter(Boolean);
    return `<div class="bg2-dh"><div class="bg2-dt"><b>${esc(it.name)}</b><small>擁有 <em>${n.toLocaleString()}</em></small><span class="bg2-rar r-${it.rarity}">${it.rarity}</span></div><span class="bg2-dic" style="--rc:${RCOL[it.rarity] || RCOL.N}">${itemIcon(it)}</span></div>
      <div class="bg2-db"><p class="bg2-desc">${esc(it.desc)}</p>
      ${src.length ? `<h4 class="bg2-h">獲取方式</h4><ul class="bg2-src">${src.map(([t, f], i) => `<li>${f ? `<button data-go="${(SRC[id] || [])[i]}"><span>${t}</span><i aria-hidden="true"></i></button>` : `<div><span>${t}</span></div>`}</li>`).join('')}</ul>` : ''}</div>
      <div class="bg2-da">${U ? `<button class="btn-gold" data-use>${U[0]}</button>` : '<p class="bg2-note">戰鬥中按「道具」使用</p>'}</div>`;
  }
  /* v156：格子下方加上道具名稱、右上角稀有度；搜尋時只更新道具格（不重畫整個背包、輸入框不會失去焦點） */
  const gridHTML = L => L.length ? L.map(id => { const it = ITEMS[id]; return `<button class="bg2-tile v156 ${id === sel ? 'on' : ''}" data-id="${id}" style="--rc:${RCOL[it.rarity] || RCOL.N}" aria-label="${esc(it.name)} ×${inv()[id]}" title="${esc(it.name)}"><span class="bg2-ic">${itemIcon(it)}</span><em class="bg2-tr">${esc(it.rarity || 'N')}</em><b>${fmtN(inv()[id])}</b><span class="bg2-tn">${esc(it.name)}</span></button>`; }).join('') : `<div class="bg2-none">${ids().length ? '找不到符合的道具' : '背包是空的。完成劇情任務、每日懸賞或到懸賞處召喚，就能拿到道具。'}</div>`;
  function bindTiles(m) { m.querySelectorAll('.bg2-tile[data-id]').forEach(b => b.onclick = () => { sel = b.dataset.id; m.querySelectorAll('.bg2-tile').forEach(t => t.classList.toggle('on', t === b)); m.querySelector('.bg2-det').innerHTML = detail(sel); bindDet(m); if (window.fixIcons) fixIcons(m.querySelector('.bg2-det')); }); }
  function render() {
    const m = wrap(), L = listOf(); if (!sel || !L.includes(sel)) sel = L[0] || null;
    const counts = {}; ids().forEach(id => { const c = CAT_OF[id] || 'battle'; counts[c] = (counts[c] || 0) + 1; }); counts.all = ids().length;
    m.innerHTML = `<div class="bg2">
      <header class="bg2-head"><h2>背包</h2><label class="bg2-q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg><input type="search" placeholder="輸入物品名稱" value="${esc(q)}" aria-label="搜尋道具"></label><button class="bg2-x" aria-label="關閉">×</button></header>
      <nav class="bg2-cats" role="tablist">${CATS.map(([k, n]) => `<button role="tab" aria-selected="${cat === k}" class="${cat === k ? 'on' : ''}" data-cat="${k}"><span>${n}</span><small>${counts[k] || 0}</small></button>`).join('')}</nav>
      <section class="bg2-grid" aria-label="道具">${gridHTML(L)}</section>
      <aside class="bg2-det" aria-live="polite">${detail(sel)}</aside></div>`;
    m.querySelector('.bg2-x').onclick = close;
    m.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; sel = null; render(); });
    bindTiles(m);
    const inp = m.querySelector('.bg2-q input'); inp.oninput = () => { q = inp.value.trim(); const L2 = listOf(), was = sel; if (!sel || !L2.includes(sel)) sel = L2[0] || null; const g = m.querySelector('.bg2-grid'); g.innerHTML = gridHTML(L2); g.scrollTop = 0; bindTiles(m); if (sel !== was) { m.querySelector('.bg2-det').innerHTML = detail(sel); bindDet(m); } if (window.fixIcons) fixIcons(m); };
    bindDet(m);
  }
  function bindDet(m) {
    const u = m.querySelector('[data-use]'); if (u) u.onclick = () => { const U = USE(sel); if (U) U[1](); };
    m.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const g = GO[b.dataset.go]; if (g && g[1]) { close(); g[1](); } });
  }
  function openBag2() { if (typeof SAVE === 'undefined' || !SAVE.data) return; SAVE.data.inventory = SAVE.data.inventory || {}; open_ = true; q = ''; render(); wrap().classList.add('show'); if (typeof closeModal === 'function') { try { closeModal('bagModal'); } catch (e) { } } }
  window.bagRefresh = () => { if (open_) render(); };
  try { openBag = openBag2; } catch (e) { } window.openBag = openBag2;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open_ && !document.querySelector('.dl-wrap,.vp-note,.cer-wrap')) close(); });
  window.addEventListener('DOMContentLoaded', () => ['bagBtnMap', 'bagBtnWorld', 'bagBtnGacha'].forEach(i => { const b = $(i); if (b) b.onclick = openBag2; }));
  window.addEventListener('load', () => ['bagBtnMap', 'bagBtnWorld', 'bagBtnGacha'].forEach(i => { const b = $(i); if (b) b.onclick = openBag2; }));
})();
