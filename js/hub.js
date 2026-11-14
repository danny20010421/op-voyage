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

const COIN_STACK = '<svg class="coin-stack" viewBox="0 0 40 32" aria-hidden="true"><defs><linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f3c969"/><stop offset="1" stop-color="#b8801a"/></linearGradient></defs><g stroke="#6b4a0a" stroke-width="1.2"><ellipse cx="14" cy="26" rx="11" ry="4" fill="url(#cs)"/><ellipse cx="14" cy="21" rx="11" ry="4" fill="url(#cs)"/><ellipse cx="14" cy="16" rx="11" ry="4" fill="url(#cs)"/><ellipse cx="28" cy="24" rx="10" ry="3.6" fill="url(#cs)"/><ellipse cx="28" cy="19.5" rx="10" ry="3.6" fill="url(#cs)"/><circle cx="24" cy="10" r="7.5" fill="url(#cs)"/></g><text x="24" y="13.2" font-size="8" text-anchor="middle" fill="#6b4a0a" font-weight="900">฿</text></svg>';
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
  const ico = g => g.id === '_token' ? '<span class="ico token-ico"><i class="coin-ico tk-ico"></i></span>' : itemIcon(g.it);
  $('shopList').className = 'shop-v183';
  $('shopList').innerHTML = `<nav class="sh-cats" role="tablist">${SHOP_CATS.map(([k, n]) => `<button role="tab" data-scat="${k}" class="${k === shopCat ? 'on' : ''}" aria-selected="${k === shopCat}">${n}</button>`).join('')}</nav>
    <div class="sh-grid">${L.map(g => `<button class="sh-it r-${g.it.rarity || 'N'} ${g.id === shopSel ? 'sel' : ''}" data-sit="${g.id}"><span class="sh-ic">${ico(g)}</span><b>${g.it.name}</b><small>擁有 ${g.have.toLocaleString()}</small><em><i class="berry-ico">B</i>${g.price.toLocaleString()}</em></button>`).join('')}</div>`;
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
(function () { const sw = switchHub; switchHub = function (tab) { if (tab !== 'shop') { shopSel = null; const s = document.getElementById('shopSheet'); if (s) s.remove(); } return sw.apply(this, arguments); }; })();
function openShop() { openHub('shop'); }

/* ---------- 海軍本部：販賣角色 ---------- */
let navyPick = null, navyMode = 'berry', navyTarget = null;
function sellValue(id, mode) { const r = CHAR_RARITY[id] || 'R', lv = crewLv(id), V = SELL_VALUE[mode]; return V[r] + lv * V.perLv; }
function renderNavy() {
  const ids = CHARACTER_ORDER.filter(owned);
  if (!ids.includes(navyPick)) navyPick = ids.find(id => !inLineup(id)) || ids[0];
  $('navyList').innerHTML = ids.map(id => { const c = CHARACTERS[id], r = CHAR_RARITY[id] || 'R'; return `<button class="char ${id === navyPick ? 'on' : ''}" data-id="${id}"><img src="${c.image}" alt="" loading="lazy"><span class="c-lv" style="--c:${TIERS[tierOf(crewLv(id))].color}">LV ${crewLv(id)}</span><span class="rar c-rar r-${r}">${r}</span>${inLineup(id) || dupeN(id) ? `<span class="c-tags">${inLineup(id) ? '<span class="c-team">陣容中</span>' : ''}${dupeN(id) ? `<span class="c-badge">重複 ×${dupeN(id)}</span>` : ''}</span>` : ''}<span class="c-name">${c.name}</span></button>`; }).join('');
  $('navyList').querySelectorAll('.char').forEach(b => b.onclick = () => { navyPick = b.dataset.id; renderNavy(); });
  const id = navyPick, c = CHARACTERS[id]; if (!id) { $('navyDetail').innerHTML = ''; return; }
  const targets = ids.filter(x => x !== id && crewLv(x) < MAX_LV); if (!targets.includes(navyTarget)) navyTarget = targets[0] || null;
  const onlyOne = ids.length <= 1, lastInLineup = inLineup(id);
  const reason = onlyOne ? '這是你唯一的船員，不能販賣。' : (window.isTraining && isTraining(id)) ? '這位船員正在訓練營，訓練結束或中止後才能販賣。' : lastInLineup ? '這位船員正在出戰陣容中，不能販賣。請先到角色背包讓他下陣。' : '';
  $('navyDetail').innerHTML = `<img src="${c.avatar}" alt=""><div class="nv-main">
    <h3>${c.name}<small>LV ${crewLv(id)}・稀有度 ${CHAR_RARITY[id] || 'R'}</small></h3>
    ${dupeN(id) ? `<div class="nv-dupe"><b>重複卡 ×${dupeN(id)}</b><span>每張 ${dupeValue(id).toLocaleString()} 貝里，賣掉不影響船隊裡的 ${c.name}</span><div><button class="btn-gold sm" data-dupe="1">賣 1 張</button>${dupeN(id) > 1 ? `<button class="btn-ghost sm" data-dupe="all">全部賣出</button>` : ''}</div></div>` : ''}
    <p class="nv-warn">販賣後船員會離開船隊，<b>無法反悔</b>。之後只能再從懸賞召喚或擊敗 BOSS 取得。</p>
    <div class="nv-opts" role="radiogroup" aria-label="換取的獎勵">
      <label class="${navyMode === 'berry' ? 'on' : ''}"><input type="radio" name="nvm" value="berry" ${navyMode === 'berry' ? 'checked' : ''}><b><i class="berry-ico">B</i>${sellValue(id, 'berry').toLocaleString()}</b><small>換成貝里</small></label>
      <label class="${navyMode === 'exp' ? 'on' : ''} ${targets.length ? '' : 'off'}"><input type="radio" name="nvm" value="exp" ${navyMode === 'exp' ? 'checked' : ''} ${targets.length ? '' : 'disabled'}><b>經驗 ${sellValue(id, 'exp').toLocaleString()}</b><small>傳承給另一位船員</small></label>
    </div>
    ${navyMode === 'exp' && targets.length ? `<label class="af"><span>把經驗交給</span><select id="nvTarget">${targets.map(x => `<option value="${x}" ${x === navyTarget ? 'selected' : ''}>${CHARACTERS[x].name}（LV ${crewLv(x)}）</option>`).join('')}</select></label>` : ''}
    ${reason ? `<p class="nv-block">${reason}</p>` : ''}
    <button class="btn-primary big" id="nvSell" ${reason ? 'disabled' : ''}>交給海軍本部</button>
  </div>`;
  $('navyDetail').querySelectorAll('[data-dupe]').forEach(b => b.onclick = () => sellDupes(id, b.dataset.dupe === 'all' ? dupeN(id) : 1));
  $('navyDetail').querySelectorAll('input[name=nvm]').forEach(r => r.onchange = () => { navyMode = r.value; renderNavy(); });
  const tg = $('nvTarget'); if (tg) tg.onchange = () => { navyTarget = tg.value; };
  const sb = $('nvSell'); if (sb) sb.onclick = () => {
    const val = sellValue(id, navyMode), what = navyMode === 'berry' ? `${val.toLocaleString()} 貝里` : `${val.toLocaleString()} 經驗（給 ${CHARACTERS[navyTarget].name}）`;
    confirmBox(`販賣 ${c.name}？`, `你會得到 ${what}。這個動作無法復原，${c.name} 會永遠離開船隊。`, '確定販賣', () => sellChar(id, navyMode, navyTarget));
  };
}
function sellChar(id, mode, target) {
  const val = sellValue(id, mode), name = CHARACTERS[id].name;
  if (inLineup(id)) { if (!lineupRemove(id)) return; }
  delete SAVE.data.roster[id]; SAVE.save();
  if (mode === 'berry') addBerry(val); else gainExp(target, val, false, true);
  SFX.play('coin'); toast(`${name} 已交給海軍本部`, 'gold'); navyPick = null; renderNavy();
}

function bindHub() {
  document.querySelectorAll('#hubTabs button').forEach(b => b.onclick = () => switchHub(b.dataset.hub));
  const nb = $('navyBtnMap'); if (nb) nb.onclick = () => openHub('navy');
  ['shopBtnMap', 'shopBtnGacha'].forEach(i => { const b = $(i); if (b) b.onclick = () => openHub('shop'); });
}
window.addEventListener('DOMContentLoaded', bindHub);
