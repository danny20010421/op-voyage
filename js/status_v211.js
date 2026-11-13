/* v211（使用者 11/14 01:51）：「無法行動」類異常各自加上不同的附加效果。
   麻痺：被麻痺的那一擊額外造成 3～5% 傷害｜恐懼：輪到出手時無法行動，並隨機扣 2 次技能次數（第 1～4 技能）
   疲憊：無法行動並損失 3～5% 最大體力｜固化：無法行動，下一次出手時隨機 1 個技能（第 1～4 技能）無法使用
   暈眩：無法行動，也無法使用道具（battle.js useItem）｜冰凍：無法行動，之後速度 -2（持續 1 回合）｜臣服：不變。
   CC 回合結束的附加效果由 battle.js／live.js 呼叫 ccSideEffect。 */
function ccSideEffect(c, kind) {
  try {
    const L = m => { if (typeof log === 'function') log(m); }, side = typeof battle !== 'undefined' && battle && c === battle.player ? 'L' : 'R';
    const pool = () => (c.skills || []).map((s, i) => ({ s, i })).filter(x => x.i < 4 && x.s && !x.s.ultimate && !x.s.locked && x.s.pp > 0);
    if (kind === 'fear') { const got = []; for (let k = 0; k < 2; k++) { const p = pool(); if (!p.length) break; const x = p[Math.floor(Math.random() * p.length)]; x.s.pp--; got.push(x.s.name); }
      if (got.length) L(`😱 ${c.name} 嚇得手忙腳亂：${got.map(n => `「${n}」`).join('、')}次數 -1`); }
    if (kind === 'fatigue' && c.hp > 0) { const d = Math.max(1, Math.floor(c.maxHp * (.03 + Math.random() * .02))); c.hp = Math.max(0, c.hp - d); if (typeof showDamage === 'function') showDamage(side, d); L(`😮‍💨 ${c.name} 疲憊不堪，損失 ${d} 體力`); }
    if (kind === 'petrify') { const p = pool(); if (p.length) { const x = p[Math.floor(Math.random() * p.length)]; c.status.__petriSeal = x.i; L(`🪨 ${c.name} 的「${x.s.name}」被固化，下回合無法使用`); } }
    if (kind === 'freeze') { const amt = 2; c.buffs.spd = Math.max(-6, (c.buffs.spd || 0) - amt); c.status.spdDownTemp = Math.max(c.status.spdDownTemp || 0, 2); c.status.spdDownAmt = (c.status.spdDownAmt || 0) + amt; L(`❄️ ${c.name} 凍得動作僵硬：速度 -2（持續 1 回合）`); }
    if (typeof renderHUD === 'function') renderHUD();
  } catch (e) { }
}
/* 固化封住的技能：輪到出手時如果選到它，改用其他可用技能（沒有就奮力一擊） */
function petriRedirect(c, idx) {
  try { const si = c && c.status && c.status.__petriSeal; if (si == null) return idx; c.status.__petriSeal = null; if (idx !== si) return idx;
    const alt = c.skills.map((s, i) => ({ s, i })).filter(x => x.i !== si && x.s && !x.s.locked && x.s.pp > 0);
    const n = alt.length ? alt[Math.floor(Math.random() * alt.length)].i : -1; if (typeof log === 'function') log(`🪨 ${c.name} 的「${c.skills[si].name}」被固化，改用${n >= 0 ? `「${c.skills[n].name}」` : '奮力一擊'}`); return n; } catch (e) { return idx; }
}
(function () {
  /* 麻痺：被麻痺的那一擊額外造成該次傷害的 3～5% */
  if (typeof applySkillEffects === 'function') { const _a = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) { const was = target && target.status ? target.status.paralyze || 0 : 0; const r = _a.apply(this, arguments);
      try { if (target && target !== actor && target.hp > 0 && (target.status.paralyze || 0) > was && result && result.damage > 0) { const d = Math.max(1, Math.floor(result.damage * (.03 + Math.random() * .02))); target.hp = Math.max(0, target.hp - d);
        if (typeof showDamage === 'function' && typeof battle !== 'undefined' && battle) showDamage(target === battle.player ? 'L' : 'R', d, '#f3d36b'); if (typeof log === 'function') log(`⚡ 電流竄過 ${target.name} 全身，追加 ${d} 傷害`); } } catch (e) { }
      return r; };
    try { window.applySkillEffects = applySkillEffects; } catch (e) { } }
  /* 敵方 AI 不選被固化的技能 */
  if (typeof pickEnemySkill === 'function') { const _p = pickEnemySkill;
    pickEnemySkill = function () { let i = _p.apply(this, arguments); try { const e = battle && battle.enemy, si = e && e.status.__petriSeal; if (si != null && i === si) { const alt = e.skills.map((s, k) => ({ s, k })).filter(x => x.k !== si && x.s.pp > 0 && !x.s.locked); i = alt.length ? alt[Math.floor(Math.random() * alt.length)].k : -1; } } catch (e) { } return i; }; }
  /* 介面：被固化的技能按鈕停用；固化封印、暈眩禁用道具顯示在狀態列 */
  if (typeof renderSkills === 'function') { const _r = renderSkills;
    renderSkills = function () { const r = _r.apply(this, arguments); try { const p = battle && battle.player, root = document.getElementById('bSkills'), si = p && p.status.__petriSeal;
      if (root && si != null && root.children[si] && root.children[si].tagName === 'BUTTON') { const el = root.children[si]; el.disabled = true; el.classList.add('imu-sealed'); el.title = '被固化，這回合無法使用'; } } catch (e) { } return r; }; }
  if (typeof statusChips === 'function') { const _c = statusChips;
    statusChips = function (c) { let h = _c.apply(this, arguments); try { if (c.status.__petriSeal != null && c.skills[c.status.__petriSeal]) h += `<span class="chip bad" title="下回合無法使用">🪨封住「${c.skills[c.status.__petriSeal].name}」</span>`; } catch (e) { } return h; }; }
})();
