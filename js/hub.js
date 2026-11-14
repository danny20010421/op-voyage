/* 懸賞處：懸賞召喚、懸賞任務、道具商店、海軍本部（販賣角色） */
/* 稀有度：UR 彩虹、SSR 金、SR 紫、R 藍。召喚時依稀有度加權（見 js/app.js 的 CHAR_RATE_BY_RARITY） */
const CHAR_RARITY = { luffy: 'UR', kaido: 'UR', blackbeard: 'UR', akainu: 'UR', loki: 'UR', imu: 'UR',
  yamato: 'SSR', lucci: 'SSR', crocodile: 'SSR', enel: 'SSR', law: 'SSR', kid: 'SSR', shirahoshi: 'SSR', moria: 'SSR', hancock: 'SSR',
  mihawk: 'UR', buggy: 'UR', marco: 'SSR', ace: 'SR', franky: 'SR', garp_hc: 'SSR', garp_mf: 'SR', bigmom: 'SSR', magellan: 'SSR', catarina: 'SR', katakuri: 'SR', morgan: 'R', lordcoast: 'R', morgans: 'N', robin: 'SR', vivi: 'SR', perona: 'SR', hody: 'SR', luffy0: 'R', zoro: 'R', sanji: 'R', marine: 'R', mayor: 'R',
  /* v63：四皇升為 UR+（皇帝領海挑戰取得）與新角色 */ whitebeard: 'UR+', shanks: 'UR+', doflamingo: 'SSR', kuma: 'SSR', kuma_eh: 'UR', kizaru: 'SSR', aokiji: 'SSR', vegapunk: 'SR', york: 'SR', sugar: 'SR', monet: 'SR', vergo: 'R' };
CHAR_RARITY.kaido = 'UR+'; CHAR_RARITY.bigmom = 'UR+';
const SELL_VALUE = { berry: { R: 2000, SR: 6000, SSR: 15000, UR: 40000, 'UR+': 80000, perLv: 120 }, exp: { R: 1500, SR: 4500, SSR: 12000, UR: 30000, 'UR+': 60000, perLv: 80 } };
/* 重複抽到的船員：存在 SAVE.data.dupes，可在海軍本部換成貝里（以 LV 20 計價） */
const dupeN = id => ((SAVE.data.dupes || {})[id] || 0);
function dupeValue(id) { const r = CHAR_RARITY[id] || 'R', V = SELL_VALUE.berry; return V[r] + GACHA_CHAR_LV * V.perLv; }
function sellDupes(id, n) { const have = dupeN(id); n = Math.min(have, n); if (!n) return; SAVE.data.dupes[id] = have - n; const val = dupeValue(id) * n; SAVE.save(); addBerry(val); SFX.play('coin'); toast(`賣出 ${CHARACTERS[id].name} 重複卡 ×${n}，獲得 ${val.toLocaleString()} 貝里`, 'gold'); renderNavy(); }
const BOUNTY_POOL = [
  { id: 'win3', text: '擊敗 3 名敵人', stat: 'wins', goal: 3, berry: 1500 },
  { id: 'win6', text: '擊敗 6 名敵人', stat: 'wins', goal: 6, berry: 3200, tokens: 1 },
  { id: 'boss1', text: '擊敗 1 名篇章 BOSS', stat: 'bossWins', goal: 1, berry: 4000, tokens: 1 },
  { id: 'step3', text: '推進 3 個劇情任務', stat: 'steps', goal: 3, berry: 2000 },
  { id: 'pick3', text: '撿拾 3 個任務道具', stat: 'pickups', goal: 3, berry: 1200 },
  { id: 'skill15', text: '在戰鬥中使用 15 次技能', stat: 'skills', goal: 15, berry: 1500 },
  { id: 'ult2', text: '在戰鬥中發動 2 次奧義', stat: 'ults', goal: 2, berry: 2500 },
  { id: 'item2', text: '在戰鬥中使用 2 次道具', stat: 'items', goal: 2, berry: 1000 },
  { id: 'switch2', text: '在戰鬥中換人 2 次', stat: 'switches', goal: 2, berry: 1200 },
  { id: 'run1000', text: '奪寶大冒險累計航行 1000 公尺', stat: 'runDist', goal: 1000, berry: 1800 },
  { id: 'tower3', text: '勇者之塔突破 3 層', stat: 'towerWins', goal: 3, berry: 2000, tokens: 1 },
  { id: 'chest1', text: '在島上打開 1 個寶箱', stat: 'chests', goal: 1, berry: 1500 }
];
/* 高級懸賞：每天一張，難度較高，完成可得一般召喚券 ×5 */
const BOUNTY_PREMIUM = [
  { id: 'p_win15', text: '擊敗 15 名敵人', stat: 'wins', goal: 15, berry: 5000, tokens: 5, premium: true },
  { id: 'p_boss2', text: '擊敗 2 名篇章 BOSS', stat: 'bossWins', goal: 2, berry: 5000, tokens: 5, premium: true },
  { id: 'p_tower6', text: '勇者之塔突破 6 層', stat: 'towerWins', goal: 6, berry: 5000, tokens: 5, premium: true },
  { id: 'p_ult5', text: '在戰鬥中發動 5 次奧義', stat: 'ults', goal: 5, berry: 5000, tokens: 5, premium: true },
  { id: 'p_run3000', text: '奪寶大冒險累計航行 3000 公尺', stat: 'runDist', goal: 3000, berry: 5000, tokens: 5, premium: true }
];
const bountyDef = id => BOUNTY_POOL.find(b => b.id === id) || BOUNTY_PREMIUM.find(b => b.id === id);
const TOKEN_PRICE = 2500;

/* 統計：各種行為的累計次數，懸賞任務依此計算進度 */
function track(key, n) { const d = SAVE.data; d.stats = d.stats || {}; d.stats[key] = (d.stats[key] || 0) + (n || 1); SAVE.save(); }
function statOf(key) { return (SAVE.data.stats || {})[key] || 0; }
function bounties() {
  const d = SAVE.data, day = today();
  if (!d.bounty || d.bounty.date !== day) {
    const pool = BOUNTY_POOL.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[pool[i], pool[j]] = [pool[j], pool[i]]; }
    d.bounty = { date: day, list: pool.slice(0, 4).map(b => ({ id: b.id, base: statOf(b.stat), claimed: false })) }; SAVE.save();
  }
  /* 每天（本地時間 00:00 換日）附上一張高級懸賞 */
  if (!d.bounty.list.some(x => bountyDef(x.id) && bountyDef(x.id).premium)) { const p = BOUNTY_PREMIUM[Math.floor(Math.random() * BOUNTY_PREMIUM.length)]; d.bounty.list.push({ id: p.id, base: statOf(p.stat), claimed: false }); SAVE.save(); }
  return d.bounty.list.filter(x => bountyDef(x.id)).map(x => { const def = bountyDef(x.id); return { ...def, ...x, prog: Math.min(def.goal, statOf(def.stat) - x.base) }; });
}

const COIN_STACK = '<img class="coin-stack" src="assets/ui/coin_berry.webp?v=5c0e832b" alt="貝里">'; /* v218：貝里圖示統一用 coin_berry.webp */
let hubTab = 'summon';
function openHub(tab) { if (currentScreen !== 'gachaScreen') openGacha(); switchHub(tab || hubTab); }
function switchHub(tab) {
  hubTab = tab; const gs = $('gachaScreen'); if (gs) gs.dataset.tab = tab;
  document.querySelectorAll('#hubTabs button').forEach(b => { b.classList.toggle('on', b.dataset.hub === tab); b.setAttribute('aria-selected', String(b.dataset.hub === tab)); });
  document.querySelectorAll('#gachaScreen [data-pane]').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== tab));
  if (tab === 'bounty') renderBounty(); if (tab === 'shop') renderShop(); if (tab === 'navy') renderNavy();
  coins();
}
/* v183（使用者 11/08 19:03 同意示意圖）：懸賞單改成精簡卡片（可領的排最上面、全部領取、未完成可「前往」）；
   道具商店分「戰鬥／培養／票券・幣」三類、三欄格子、點道具後下方購買面板一次買多個（×1／×5／×10／最大）。 */
const BOUNTY_GO = { wins: 'chart', bossWins: 'chart', steps: 'chart', pickups: 'chart', chests: 'chart', digs: 'chart', skills: 'chart', ults: 'chart', items: 'chart', switches: 'chart',
  towerWins: 'tower', runDist: 'runner', sweeps: 'realm', realm: 'realm', grows: 'grow', pvp: 'ladder', rhythm: 'rhythm' };
function bountyGo(stat) {
  const k = BOUNTY_GO[stat], f = {
    chart: () => typeof openChart === 'function' && openChart(), tower: () => window.openTower && openTower(), runner: () => window.openRunner && openRunner(),
    realm: () => window.openStages && openStages('realm'), grow: () => window.openGrowPick && openGrowPick(), ladder: () => window.openLadder && openLadder(), rhythm: () => window.openRhythm && openRhythm() }[k];
  if (f) f(); else toast('到劇情地圖或各玩法中完成就會累計');
}
function claimBounty(id, quiet) {
  if (window.timeLocked && timeLocked()) { toast('裝置時間異常，暫時無法領取懸賞獎勵'); return null; }
  const x = SAVE.data.bounty.list.find(y => y.id === id), def = x && bountyDef(x.id); if (!x || x.claimed) return null;
  x.claimed = true; track('bounty'); SAVE.save(); addBerry(def.berry); if (def.tokens) addTokens(def.tokens, '懸賞任務');
  if (!quiet) { SFX.play('coin'); toast(`領到賞金 ${def.berry.toLocaleString()} 貝里${def.tokens ? `＋一般召喚券 ×${def.tokens}` : ''}`, 'gold'); }
  return def;
}
function renderBounty() {
  const list = bounties(), rank = b => b.claimed ? 2 : b.prog >= b.goal ? 0 : 1;
  const sorted = list.slice().sort((a, b) => rank(a) - rank(b) || (b.premium ? 1 : 0) - (a.premium ? 1 : 0) || b.prog / b.goal - a.prog / a.goal);
  const ready = list.filter(b => !b.claimed && b.prog >= b.goal);
  const head = $('bountyHead') || (() => { const h = document.createElement('div'); h.id = 'bountyHead'; h.className = 'bt-head'; const t = document.querySelector('[data-pane="bounty"] h3'); t.parentNode.insertBefore(h, t); h.appendChild(t); h.appendChild($('bountyNote')); return h; })();
  let all = $('bountyAll'); if (!all) { all = document.createElement('button'); all.id = 'bountyAll'; all.className = 'btn-gold bt-all'; head.appendChild(all); }
  all.textContent = ready.length ? `全部領取（${ready.length}）` : '全部領取'; all.disabled = !ready.length;
  all.onclick = () => { let berry = 0, tk = 0; ready.forEach(b => { const d = claimBounty(b.id, true); if (d) { berry += d.berry; tk += d.tokens || 0; } }); if (!berry) return;
    SFX.play('coin'); toast(`領到賞金 ${berry.toLocaleString()} 貝里${tk ? `＋一般召喚券 ×${tk}` : ''}`, 'gold'); if (window.eventBountyCheck) setTimeout(eventBountyCheck, 60); renderBounty(); };
  $('bountyList').innerHTML = sorted.map(b => { const done = b.prog >= b.goal, st = b.claimed ? '已領' : done ? '可領' : `${b.prog}/${b.goal}`;
    return `<article class="bounty v183 ${b.premium ? 'premium' : ''} ${b.claimed ? 'claimed' : done ? 'done' : ''}">
    <div class="bt-poster"><span>${b.premium ? '高級' : 'WANTED'}</span><b>${st}</b></div>
    <div class="bt-body"><h4>${b.text}</h4><div class="bar"><i style="width:${b.prog / b.goal * 100}%"></i></div>
      <p class="bt-rew">${COIN_STACK}<b>${b.berry.toLocaleString()}</b>${b.tokens ? `<span class="bt-plus">＋</span><i class="coin-ico tk-ico"></i><b>×${b.tokens}</b>` : ''}</p></div>
    ${b.claimed ? '<button class="btn-ghost" disabled>已領取</button>' : done ? `<button class="btn-gold" data-claim="${b.id}">領取</button>` : `<button class="btn-ghost" data-go="${b.stat}">前往</button>`}</article>`; }).join('');
  $('bountyList').querySelectorAll('[data-claim]').forEach(btn => btn.onclick = () => { if (claimBounty(btn.dataset.claim)) { if (window.eventBountyCheck) setTimeout(eventBountyCheck, 60); renderBounty(); } });
  $('bountyList').querySelectorAll('[data-go]').forEach(btn => btn.onclick = () => bountyGo(btn.dataset.go));
  $('bountyNote').textContent = `每天 00:00 更換 4 張懸賞單＋1 張高級懸賞，今天剩 ${list.filter(b => !b.claimed).length} 張。`;
}
const SHOP_CATS = [['battle', '戰鬥'], ['grow', '培養'], ['ticket', '票券・幣']];
const shopCatOf = id => { const it = ITEMS[id] || {}; if (it.cat) return 'battle'; if (/^exp_|sweep|awaken_gem|skill_book/.test(id)) return 'grow'; return 'ticket'; };
let shopCat = 'battle', shopSel = null, shopQty = 1;
function shopGoods() {
  const G = SHOP.filter(x => ITEMS[x.id]).map(x => ({ id: x.id, price: x.price, it: ITEMS[x.id], cat: shopCatOf(x.id), have: (SAVE.data.inventory || {})[x.id] || 0 }));
  G.push({ id: '_token', price: TOKEN_PRICE, cat: 'ticket', have: ticketCount(), it: { name: '一般召喚券', rarity: 'SR', desc: '懸賞處召喚用，1 張＝召喚 1 次。用貝里兌換。' } });
  return G;
}
function renderShop() {
  const B = SAVE.data.berry || 0, G = shopGoods(), L = G.filter(g => g.cat === shopCat);
  const ico = g => itemIcon(g.id === '_token' ? ITEMS.summon_ticket : g.it); /* v220：一般召喚券也用道具插圖 */
  $('shopList').className = 'shop-v183';
  $('shopList').innerHTML = `<nav class="sh-cats" role="tablist">${SHOP_CATS.map(([k, n]) => `<button role="tab" data-scat="${k}" class="${k === shopCat ? 'on' : ''}" aria-selected="${k === shopCat}">${n}</button>`).join('')}</nav>
    <div class="sh-grid">${L.map(g => `<button class="sh-it r-${g.it.rarity || 'N'} ${g.id === shopSel ? 'sel' : ''}" data-sit="${g.id}"><span class="sh-ic">${ico(g)}</span><b class="sh-nm">${g.it.name}</b><em class="sh-pr"><i class="berry-ico">B</i>${g.price.toLocaleString()}</em><small class="sh-hv">擁有 ${g.have.toLocaleString()}</small></button>`).join('')}</div>`;
  $('shopList').querySelectorAll('[data-scat]').forEach(b => b.onclick = () => { shopCat = b.dataset.scat; shopSel = null; renderShop(); });
  $('shopList').querySelectorAll('[data-sit]').forEach(b => b.onclick = () => { shopSel = b.dataset.sit; shopQty = 1; renderShop(); });
  /* 下方購買面板 */
  let sh = $('shopSheet'); const g = G.find(x => x.id === shopSel);
  if (!g) { if (sh) sh.remove(); return; }
  if (!sh) { sh = document.createElement('div'); sh.id = 'shopSheet'; sh.className = 'sh-sheet'; document.getElementById('gachaScreen').appendChild(sh); }
  const max = Math.max(0, Math.min(99, Math.floor(B / g.price))); shopQty = Math.max(1, Math.min(shopQty, Math.max(1, max)));
  const cost = g.price * shopQty, ok = max >= 1 && B >= cost;
  sh.innerHTML = `<div class="sh-in"><div class="sh-h"><span class="sh-ic">${ico(g)}</span><div><b>${g.it.name}</b><small>${g.it.desc || ''}</small></div><button class="icon-btn sm" data-sx aria-label="關閉">×</button></div>
    <div class="sh-qty"><button data-q="-1" aria-label="減少" ${shopQty <= 1 ? 'disabled' : ''}>−</button><b>${shopQty}</b><button data-q="1" aria-label="增加" ${shopQty >= max ? 'disabled' : ''}>＋</button></div>
    <div class="sh-quick">${[1, 5, 10].map(n => `<button data-qs="${n}" class="${shopQty === n ? 'on' : ''}" ${n > max ? 'disabled' : ''}>×${n}</button>`).join('')}<button data-qs="${max}" ${max < 1 ? 'disabled' : ''} class="${shopQty === max && max > 10 ? 'on' : ''}">最大${max > 0 ? `（${max}）` : ''}</button></div>
    <div class="sh-act"><button class="btn-ghost" data-sx>取消</button><button class="btn-gold" data-sbuy ${ok ? '' : 'disabled'}>${ok ? `購買 ×${shopQty}・<i class="berry-ico">B</i>${cost.toLocaleString()}` : '貝里不足'}</button></div></div>`;
  sh.querySelectorAll('[data-sx]').forEach(b => b.onclick = () => { shopSel = null; renderShop(); });
  sh.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { shopQty += +b.dataset.q; renderShop(); });
  sh.querySelectorAll('[data-qs]').forEach(b => b.onclick = () => { shopQty = +b.dataset.qs; renderShop(); });
  sh.querySelector('[data-sbuy]').onclick = () => {
    const n = shopQty, c = g.price * n; if ((SAVE.data.berry || 0) < c) return;
    SAVE.data.berry -= c; if (g.id === '_token') { SAVE.save(); addTokens(n, '貝里兌換'); } else { SAVE.data.inventory[g.id] = (SAVE.data.inventory[g.id] || 0) + n; SAVE.save(); }
    coins(); SFX.play('coin'); toast(`買了 ${g.it.name} ×${n}`, 'gold'); renderShop();
  };
}
/* 離開商店分頁時收起購買面板 */
(function () { const sw = switchHub; switchHub = function (tab) { if (tab !== 'shop') { shopSel = null; const s = document.getElementById('shopSheet'); if (s) s.remove(); } { const n = document.getElementById('navySheet'); if (n) n.remove(); } return sw.apply(this, arguments); }; })();
function openShop() { openHub('shop'); }

/* ---------- 海軍本部（v225 使用者 11/14 19:58「直接改」，照示意圖重做） ----------
   ① 重複卡兌換（預設）：列出重複抽到的角色卡，−／＋ 選張數，底部合計貝里，一鍵兌換，不影響船隊。
   ② 遣散船員：稀有度篩選、可多選，出戰中／訓練中的船員不能選；底部切換「換成貝里／經驗傳承」並即時合計。
   ③ 按下後跳出確認面板：列出要遣散的船員、合計，經驗傳承時在這裡選接收的船員並預覽升級；確定後才執行。 */
let navyTab = 'dupe', navyMode = 'berry', navyTarget = null, navyRar = 'all';
const navyDupeSel = {}, navyFire = new Set();
function sellValue(id, mode) { const r = CHAR_RARITY[id] || 'R', lv = crewLv(id), V = SELL_VALUE[mode]; return (V[r] || V['UR+']) + lv * V.perLv; }
const NV_RANK = { 'UR++': 7, 'UR+': 6, UR: 5, SSR: 4, SR: 3, RR: 2, RRR: 2, R: 1, C: 0, N: 0 };
const nvRank = id => NV_RANK[CHAR_RARITY[id] || 'R'] || 0;
const nvLock = id => inLineup(id) ? '出戰中' : (window.isTraining && isTraining(id)) ? '訓練中' : '';
const nvRarOk = id => { const r = CHAR_RARITY[id] || 'R'; return navyRar === 'all' || (navyRar === 'UR' ? nvRank(id) >= 5 : navyRar === 'R' ? nvRank(id) <= 2 : r === navyRar); };
function nvLvAfter(id, add) { const r = SAVE.data.roster[id]; if (!r) return 1; let lv = r.lv, ex = r.exp + add; while (lv < MAX_LV && ex >= expNeed(lv)) { ex -= expNeed(lv); lv++; } return lv; }
function renderNavy() {
  const box = document.querySelector('[data-pane="navy"] .navy'); if (!box) return;
  const owned_ = CHARACTER_ORDER.filter(owned), dupes = owned_.concat(Object.keys(SAVE.data.dupes || {}).filter(id => !owned(id) && CHARACTERS[id])).filter(id => dupeN(id) > 0).sort((a, b) => nvRank(b) - nvRank(a));
  [...navyFire].forEach(id => { if (!owned(id) || nvLock(id)) navyFire.delete(id); });
  Object.keys(navyDupeSel).forEach(id => { navyDupeSel[id] = Math.max(0, Math.min(dupeN(id), navyDupeSel[id])); });
  dupes.forEach(id => { if (navyDupeSel[id] == null) navyDupeSel[id] = dupeN(id); });
  const nDupe = dupes.reduce((a, id) => a + dupeN(id), 0);
  const seg = `<div class="nv2-seg" role="tablist"><button role="tab" data-nt="dupe" class="${navyTab === 'dupe' ? 'on' : ''}" aria-selected="${navyTab === 'dupe'}"><b>重複卡兌換</b><small>${dupes.length ? `${dupes.length} 種・共 ${nDupe} 張` : '目前沒有'}</small></button><button role="tab" data-nt="fire" class="${navyTab === 'fire' ? 'on' : ''}" aria-selected="${navyTab === 'fire'}"><b>遣散船員</b><small>船員永久離隊</small></button></div>`;
  const B = '<i class="berry-ico">B</i>';
  let body = '', bar = '';
  if (navyTab === 'dupe') {
    const pick = dupes.reduce((a, id) => a + (navyDupeSel[id] || 0), 0), sum = dupes.reduce((a, id) => a + (navyDupeSel[id] || 0) * dupeValue(id), 0);
    body = `<p class="nv2-hint">重複抽到的角色卡，換成貝里不會影響船隊</p>` + (dupes.length ? `<ul class="nv2-rows">${dupes.map(id => { const c = CHARACTERS[id], n = navyDupeSel[id] || 0, r = CHAR_RARITY[id] || 'R';
      return `<li><img class="nv2-av r-${r}" src="${c.avatar}" alt=""><div class="nv2-t"><b>${c.name}</b><small><span class="rar r-${r}">${r}</span>重複 ×${dupeN(id)}・每張 ${dupeValue(id).toLocaleString()}</small></div><div class="nv2-step"><button data-dq="${id}:-1" aria-label="減少" ${n <= 0 ? 'disabled' : ''}>−</button><em>${n}</em><button data-dq="${id}:1" aria-label="增加" ${n >= dupeN(id) ? 'disabled' : ''}>＋</button></div></li>`; }).join('')}</ul>`
      : `<div class="nv2-empty"><b>目前沒有重複卡</b><small>懸賞召喚抽到已擁有的角色時，會變成重複卡出現在這裡。</small></div>`);
    bar = `<div class="nv2-sum">合計獲得 <b>${B}${sum.toLocaleString()}</b></div><button class="nv2-go gold" id="nvDupeGo" ${pick ? '' : 'disabled'}>${pick ? `兌換 ${pick} 張重複卡` : '請選擇要兌換的張數'}</button>`;
  } else {
    const list = owned_.filter(nvRarOk).sort((a, b) => (!!nvLock(a) - !!nvLock(b)) || (nvRank(a) - nvRank(b)) || (crewLv(a) - crewLv(b)));
    const sel = [...navyFire], sum = sel.reduce((a, id) => a + sellValue(id, navyMode), 0);
    const chips = [['all', '全部'], ['R', 'R 以下'], ['SR', 'SR'], ['SSR', 'SSR'], ['UR', 'UR 以上']];
    body = `<div class="nv2-chips">${chips.map(([k, n]) => `<button data-nr="${k}" class="${navyRar === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="nv2-grid">${list.map(id => { const c = CHARACTERS[id], lk = nvLock(id), on = navyFire.has(id), r = CHAR_RARITY[id] || 'R';
        return `<button class="nv2-cd r-${r} ${on ? 'sel' : ''} ${lk ? 'lock' : ''}" data-nf="${id}" ${lk ? 'aria-disabled="true"' : ''} aria-pressed="${on}"><img src="${c.image}" alt="" loading="lazy"><span class="nv2-lv">LV ${crewLv(id)}</span><span class="rar c-rar r-${r}">${r}</span>${lk ? `<span class="nv2-lk">${lk}</span>` : ''}<span class="nv2-nm">${c.name}</span></button>`; }).join('') || '<div class="nv2-empty"><b>這個稀有度沒有船員</b></div>'}</div>`;
    bar = `<div class="nv2-mode"><button data-nm="berry" class="${navyMode === 'berry' ? 'on' : ''}">換成貝里</button><button data-nm="exp" class="${navyMode === 'exp' ? 'on' : ''}">經驗傳承</button></div>
      <div class="nv2-sum">${sel.length ? `已選 ${sel.length} 位・合計 <b>${navyMode === 'berry' ? B : '經驗 '}${sum.toLocaleString()}</b>` : '點選要遣散的船員（可多選）'}</div><button class="nv2-go red" id="nvFireGo" ${sel.length ? '' : 'disabled'}>交給海軍本部${sel.length ? `（${sel.length}）` : ''}</button>`;
  }
  box.className = 'navy nv2'; box.innerHTML = seg + `<div class="nv2-body">${body}</div><div class="nv2-bar">${bar}</div>`;
  box.querySelectorAll('[data-nt]').forEach(b => b.onclick = () => { navyTab = b.dataset.nt; renderNavy(); });
  box.querySelectorAll('[data-dq]').forEach(b => b.onclick = () => { const [id, d] = b.dataset.dq.split(':'); navyDupeSel[id] = Math.max(0, Math.min(dupeN(id), (navyDupeSel[id] || 0) + +d)); renderNavy(); });
  box.querySelectorAll('[data-nr]').forEach(b => b.onclick = () => { navyRar = b.dataset.nr; renderNavy(); });
  box.querySelectorAll('[data-nm]').forEach(b => b.onclick = () => { navyMode = b.dataset.nm; renderNavy(); });
  box.querySelectorAll('[data-nf]').forEach(b => b.onclick = () => { const id = b.dataset.nf, lk = nvLock(id); if (lk) { toast(lk === '出戰中' ? '出戰中的船員不能遣散，請先到角色背包讓他下陣' : '訓練中的船員不能遣散，訓練結束或中止後再來', 'warn'); return; }
    if (navyFire.has(id)) navyFire.delete(id); else { if (owned_.length - navyFire.size <= 1) { toast('至少要留下一位船員', 'warn'); return; } navyFire.add(id); } renderNavy(); });
  const dg = $('nvDupeGo'); if (dg) dg.onclick = () => { let got = 0, cnt = 0; dupes.forEach(id => { const n = Math.min(dupeN(id), navyDupeSel[id] || 0); if (!n) return; SAVE.data.dupes[id] = dupeN(id) - n; got += dupeValue(id) * n; cnt += n; delete navyDupeSel[id]; });
    if (!cnt) return; SAVE.save(); addBerry(got); SFX.play('coin'); toast(`兌換 ${cnt} 張重複卡，獲得 ${got.toLocaleString()} 貝里`, 'gold'); renderNavy(); };
  const fg = $('nvFireGo'); if (fg) fg.onclick = () => navySheet();
}
function navySheet() {
  const sel = [...navyFire]; if (!sel.length) return;
  const targets = CHARACTER_ORDER.filter(id => owned(id) && !navyFire.has(id) && crewLv(id) < MAX_LV).sort((a, b) => (inLineup(b) - inLineup(a)) || (nvRank(b) - nvRank(a)));
  if (navyMode === 'exp' && !targets.includes(navyTarget)) navyTarget = targets[0] || null;
  const sum = sel.reduce((a, id) => a + sellValue(id, navyMode), 0), exp = navyMode === 'exp';
  let sh = $('navySheet'); if (!sh) { sh = document.createElement('div'); sh.id = 'navySheet'; sh.className = 'nv2-sheet'; document.getElementById('gachaScreen').appendChild(sh); }
  let picking = false;
  const draw = () => { const t = navyTarget && CHARACTERS[navyTarget];
    sh.innerHTML = `<div class="nv2-dim" data-nx></div><div class="nv2-in" role="dialog" aria-label="確認遣散"><h3>確認遣散 ${sel.length} 位船員</h3>
      <div class="nv2-mini">${sel.map(id => `<img class="r-${CHAR_RARITY[id] || 'R'}" src="${CHARACTERS[id].avatar}" alt="${CHARACTERS[id].name}" title="${CHARACTERS[id].name}">`).join('')}</div>
      <div class="nv2-rw"><span>方式</span><b>${exp ? '經驗傳承' : '換成貝里'}</b></div><div class="nv2-rw"><span>${exp ? '合計經驗' : '合計貝里'}</span><b class="gold">${exp ? '' : '<i class="berry-ico">B</i>'}${sum.toLocaleString()}</b></div>
      ${exp ? (t ? `<div class="nv2-tg"><img src="${t.avatar}" alt=""><div><b>${t.name}</b><small>LV ${crewLv(navyTarget)} → LV ${nvLvAfter(navyTarget, sum)}</small></div><button class="nv2-sm" data-pick>${picking ? '收起' : '更換'}</button></div>
        ${picking ? `<div class="nv2-pick">${targets.map(id => `<button data-tg="${id}" class="${id === navyTarget ? 'on' : ''}"><img src="${CHARACTERS[id].avatar}" alt=""><small>LV ${crewLv(id)}</small></button>`).join('')}</div>` : ''}` : '<p class="nv2-warn">沒有可以接收經驗的船員（其他船員都已滿級），請改成換貝里。</p>') : ''}
      <p class="nv2-warn">遣散後船員會離開船隊，<b>無法復原</b>。</p>
      <div class="nv2-bt"><button class="nv2-go ghost" data-nx>取消</button><button class="nv2-go red" data-nok ${exp && !t ? 'disabled' : ''}>確定遣散</button></div></div>`;
    sh.querySelectorAll('[data-nx]').forEach(b => b.onclick = () => sh.remove());
    const pk = sh.querySelector('[data-pick]'); if (pk) pk.onclick = () => { picking = !picking; draw(); };
    sh.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => { navyTarget = b.dataset.tg; picking = false; draw(); });
    sh.querySelector('[data-nok]').onclick = () => { sh.remove(); sellMany(sel, navyMode, navyTarget); }; };
  draw();
}
function sellMany(ids, mode, target) {
  let total = 0; const names = [];
  ids.forEach(id => { if (!owned(id) || nvLock(id) || Object.keys(SAVE.data.roster).length <= 1) return; total += sellValue(id, mode); names.push(CHARACTERS[id].name); delete SAVE.data.roster[id]; navyFire.delete(id); });
  if (!names.length) return; SAVE.save();
  if (mode === 'berry') addBerry(total); else if (target && owned(target)) gainExp(target, total, false, true);
  SFX.play('coin'); toast(`${names.length} 位船員已交給海軍本部，${mode === 'berry' ? `獲得 ${total.toLocaleString()} 貝里` : `${CHARACTERS[target].name} 獲得 ${total.toLocaleString()} 經驗`}`, 'gold'); renderNavy();
}
/* 舊介面相容：其他地方呼叫 sellChar 時仍可用 */
function sellChar(id, mode, target) { sellMany([id], mode, target); }

function bindHub() {
  document.querySelectorAll('#hubTabs button').forEach(b => b.onclick = () => switchHub(b.dataset.hub));
  const nb = $('navyBtnMap'); if (nb) nb.onclick = () => openHub('navy');
  ['shopBtnMap', 'shopBtnGacha'].forEach(i => { const b = $(i); if (b) b.onclick = () => openHub('shop'); });
}
window.addEventListener('DOMContentLoaded', bindHub);
