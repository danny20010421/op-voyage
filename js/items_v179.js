/* v179 道具整理（使用者 11/08 05:10「重整道具的規格、名稱與使用效果，大致分類為恢復血量、恢復技能次數、抵擋傷害、提高攻擊等等」）：
   ‧ 戰鬥道具分六類（ITEMS[id].cat）：heal 回復體力、pp 恢復技能次數、guard 抵擋傷害、buff 提升能力、cleanse 淨化、revive 復活；戰鬥背包依類別分組。
   ‧ 每種道具有單場上限（ITEMS[id].limit），整場另有總上限（GAME_SETTINGS.itemsPerBattle，5 次）；說明統一寫成「效果＋限制」。
   ‧ 新增：中回復藥水（40%）、技能全補劑（恢復 5 次）、防禦藥劑（3 回合受到的傷害 -30%）、霸王色藥劑（攻擊、防禦、速度 +2 階）。
   ‧ 舊存檔的道具 ID 不變，只更新名稱、說明與分類。 */
(function () {
  if (typeof ITEMS === 'undefined') return;
  const CAT = { heal: '回復體力', pp: '恢復技能次數', guard: '抵擋傷害', buff: '提升能力', cleanse: '淨化', revive: '復活' };
  const add = (id, o) => { ITEMS[id] = Object.assign(ITEMS[id] || {}, o); };
  const lim = n => `（每場最多 ${n} 個）`;
  add('potion_s', { cat: 'heal', limit: 3, desc: '回復最大體力 25% 的體力。' + lim(3) });
  add('potion_m', { name: '中回復藥水', rarity: 'R', icon: 'potion', color: '#46c9a6', cat: 'heal', limit: 3, effect: { healRatio: .4 }, desc: '回復最大體力 40% 的體力。' + lim(3) });
  add('potion_l', { cat: 'heal', limit: 2, desc: '回復最大體力 60% 的體力。' + lim(2) });
  add('meat', { cat: 'heal', limit: 1, desc: '體力全滿，並清除所有異常狀態與負面能力。' + lim(1) });
  add('pp_s', { cat: 'pp', limit: 3, desc: '恢復 2 次技能使用次數：優先補用完的技能，其次是剩餘最少的（不超過上限，奧義等不能恢復的招式除外）。' + lim(3) });
  add('pp_l', { name: '技能全補劑', rarity: 'SR', icon: 'flask', color: '#3d7dff', cat: 'pp', limit: 1, effect: { ppSmart: 5 }, desc: '恢復 5 次技能使用次數：優先補用完的技能，其次是剩餘最少的（不超過上限，奧義等不能恢復的招式除外）。' + lim(1) });
  add('tome', { cat: 'pp', limit: 1, desc: '奧義（第 5 招）使用次數 +1，其餘技能各 +1（不超過上限；標明「無法用道具恢復」的招式除外）。' + lim(1) });
  add('shield', { cat: 'guard', limit: 2, desc: '獲得最大體力 35% 的護盾，先扣護盾再扣體力。' + lim(2) });
  add('guard_pot', { name: '防禦藥劑', rarity: 'R', icon: 'fruit', color: '#6aa8d8', cat: 'guard', limit: 2, effect: { itemDR: { turns: 3, cut: .3 } }, desc: '接下來 3 回合受到的傷害 -30%（再次使用會重新計算回合，不會疊加）。' + lim(2) });
  add('haki', { cat: 'buff', limit: 2, desc: '攻擊能力 +2 階（最高 +6 階）。' + lim(2) });
  add('haki_l', { name: '霸王色藥劑', rarity: 'SR', icon: 'flask', color: '#d23b6a', cat: 'buff', limit: 1, effect: { atkUp: 2, defUp: 2, spdUp: 2 }, desc: '攻擊、防禦、速度各 +2 階（最高 +6 階）。' + lim(1) });
  add('herb', { cat: 'cleanse', limit: 3, desc: '清除自身所有異常狀態（冰凍、燒傷、麻痺、恐懼等）。' + lim(3) });
  add('feather', { cat: 'revive', limit: 1, desc: '本場戰鬥倒下時，以 50% 體力復活一次。' + lim(1) });
  window.ITEM_CATS = CAT;

  /* 商店新增 */
  if (typeof SHOP !== 'undefined') [['potion_m', 600], ['guard_pot', 1200], ['pp_l', 2600], ['haki_l', 3000]].forEach(([id, price]) => { if (!SHOP.some(s => s.id === id)) SHOP.push({ id, price }); });

  const BAT = id => { const it = ITEMS[id]; return !!(it && it.cat && CAT[it.cat]); };
  const usedOf = id => (battle && battle.itemUse && battle.itemUse[id]) || 0;
  /* 單場上限 */
  if (typeof useItem === 'function') { const _u = useItem;
    useItem = function (id) { const it = ITEMS[id]; if (battle && it && it.limit && usedOf(id) >= it.limit) { if (typeof toast === 'function') toast(`「${it.name}」這場已經用了 ${it.limit} 個，達到上限`); return; }
      const before = battle ? battle.itemsUsed : 0; _u.apply(this, arguments); if (battle && battle.itemsUsed > before) { battle.itemUse = battle.itemUse || {}; battle.itemUse[id] = usedOf(id) + 1; } }; }
  /* 新效果：防禦藥劑、霸王色藥劑 */
  if (typeof applyItem === 'function') { const _a = applyItem;
    applyItem = async function (id) { const it = ITEMS[id], ef = (it && it.effect) || {}, p = battle && battle.player;
      if (p && ef.itemDR) { p.status.__itemDR = { t: ef.itemDR.turns, cut: ef.itemDR.cut }; }
      if (p && (ef.defUp || ef.spdUp)) { const c = v => Math.max(-6, Math.min(6, v)); if (ef.defUp) p.buffs.def = c((p.buffs.def || 0) + ef.defUp); if (ef.spdUp) p.buffs.spd = c((p.buffs.spd || 0) + ef.spdUp); }
      await _a.apply(this, arguments);
      if (p && ef.itemDR) log(`🛡️ 接下來 ${ef.itemDR.turns} 回合受到的傷害 -${Math.round(ef.itemDR.cut * 100)}%`);
      if (p && (ef.defUp || ef.spdUp)) log(`防禦能力 +${ef.defUp || 0}、速度 +${ef.spdUp || 0}`); }; }
  if (typeof computeSkillOutcome === 'function') { const _c = computeSkillOutcome;
    computeSkillOutcome = function (actor, target) { const r = _c.apply(this, arguments); try { const D = target && target.status && target.status.__itemDR; if (r && r.damage > 0 && D && D.t > 0) r.damage = Math.floor(r.damage * (1 - D.cut)); } catch (e) { } return r; }; }
  if (typeof endTurnStatus === 'function') { const _e = endTurnStatus;
    endTurnStatus = function (f) { const r = _e.apply(this, arguments); try { const D = f && f.status && f.status.__itemDR; if (D && D.t > 0 && --D.t <= 0) { f.status.__itemDR = null; log(`${f.name} 的防禦藥劑效果結束`); } } catch (e) { } return r; }; }
  /* 戰鬥背包：依類別分組，顯示本場已用／上限 */
  if (typeof renderBag === 'function') { const _r = renderBag;
    renderBag = function () { _r.apply(this, arguments); try {
      const L = document.getElementById('bBagList'); if (!L) return; const btns = [...L.querySelectorAll('.bagItem')]; if (!btns.length) return;
      const groups = {}; btns.forEach(b => { const it = ITEMS[b.dataset.id]; const c = (it && it.cat) || 'other'; (groups[c] = groups[c] || []).push(b);
        if (it && it.limit && battle) { const u = usedOf(b.dataset.id), sm = document.createElement('em'); sm.className = 'bi-lim'; sm.textContent = `本場 ${u}/${it.limit}`; b.querySelector('.bi-name').appendChild(sm); if (u >= it.limit) { b.disabled = true; b.classList.add('lim'); } } });
      L.innerHTML = ''; [...Object.keys(CAT), 'other'].forEach(c => { if (!groups[c]) return; const h = document.createElement('div'); h.className = 'bag-cat'; h.textContent = CAT[c] || '其他'; L.appendChild(h); const RK = { N: 0, R: 1, SR: 2, SSR: 3 }; groups[c].sort((a, b) => (RK[(ITEMS[a.dataset.id] || {}).rarity] || 0) - (RK[(ITEMS[b.dataset.id] || {}).rarity] || 0)).forEach(b => L.appendChild(b)); });
    } catch (e) { console.warn(e); } }; }
})();
