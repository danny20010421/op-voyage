/* v214：負面狀態規則（原 status_v210、status_v211 合併）。合併前的檔案邊界以「==== 原 檔名 ====」標記。 */

/* ==== 原 js/status_v210.js ==== */
/* v210（使用者 11/14 01:35）：負面狀態重新定義。
   冰凍＝無法行動＋速度 -50%（不再扣血）；燒傷每回合 5%、一律 2 回合；虛弱＝傷害 -15%、受傷 ×1.0～1.5；破防＝受傷 +5～10%；
   麻痺／恐懼／疲憊／固化／暈眩／臣服／魅惑＝無法行動（臣服另外解除所有強化，魅惑另外受傷 +15～30%）；
   封鎖＝無法行動，並消耗 1 次技能次數；熔岩灼燒每回合 6～12%。核心數值在 battle_core.js（ABN、CC_KEYS、applyDamage、endTurnStatus）。 */
function sealPP(c) { /* 封鎖：隨機扣掉 1 個還有次數的技能（不含第五技能奧義） */
  try { const pool = (c.skills || []).filter(s => !s.ultimate && s.pp > 0); if (!pool.length) return; const s = pool[Math.floor(Math.random() * pool.length)]; s.pp--;
    if (typeof log === 'function') log(`🚫 ${c.name} 的「${s.name}」被封鎖消耗 1 次`); } catch (e) { }
}
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  Object.values(CHARACTERS).forEach(c => (c.skills || []).forEach(s => { const e = s.effect; if (!e) return;
    if (e.burnTurns) e.burnTurns = 2;
    if ((e.weakChance || e.weakTurns) && s.desc) s.desc = s.desc.replace(/(虛弱[^。]*?)(\d(?:\.\d)?)\s*～\s*(\d(?:\.\d)?)(\s*倍)/g, '$11.0～1.5$4');
    if (e.freezeTurns) e.freezeTurns = 1; if (e.freezeForce) e.freezeForce = 1; /* 冰凍改成無法行動，一律 1 回合 */
    if (e.burnChance || e.burnChanceRange || e.perHitBurn) { if (s.desc) s.desc = s.desc.replace(/燒傷\s*(\d)\s*回合/g, '燒傷 2 回合').replace(/(\d)\s*回合(內)?的?燒傷/g, '2 回合燒傷'); }
  }));
  /* 技能說明同步新的狀態定義 */
  const D = (id, n, a, b) => { const c = CHARACTERS[id], k = c && c.skills.find(x => x.name === n); if (k && k.desc) k.desc = k.desc.split(a).join(b); };
  D('sanji', '惡魔風腳 畫龍點睛', '每回合扣 4% 體力', '每回合扣 5% 體力');
  D('aokiji', '冰凍時刻', '對手冰凍 2 回合', '對手冰凍 1 回合（無法行動）');
  D('aokiji', '兩棘矛', '冰凍 2 回合', '冰凍 1 回合');
  D('aokiji', '暴雉嘴', '冰凍 2 回合', '冰凍 1 回合');
  D('aokiji', '冰河時期', '每回合損失 6% 體力並被冰凍', '每回合損失 6% 體力，35% 機率被冰凍');
  D('mihawk_w', '洞察弱點', '受到 1.2～1.6 倍傷害', '受到 1.0～1.5 倍傷害');
  D('bigmom', '普羅米修斯', '燒傷對手 3 回合', '燒傷對手 2 回合');
  ['雪之羽', '白色世界', '雪女・暴風雪'].forEach(n => D('monet', n, '冰凍 2 回合', '冰凍 1 回合'));
  D('yamato', '雷鳴八卦', '受到 1.2～1.5 倍傷害', '受到 1.0～1.5 倍傷害');
  D('yamato', '大口真神形態', '冰凍 2 回合（每回合扣 2%、速度下降）', '冰凍 1 回合（無法行動、速度 -50%）');
  D('viona', '垂憐', '「魅惑」2 回合：攻擊 -1、速度 -1', '「魅惑」1 回合：無法行動，受到的傷害 +15～30%');
  D('mihawk', '洞察弱點', '1.1～1.5 倍', '1.0～1.5 倍');
  D('viona', '神妃', '；對「魅惑」中的對手傷害再 +40%', '');
})();

/* ==== 原 js/status_v211.js ==== */
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
  /* v214：技能說明與實際數值對齊 */
  const D = (id, n, a, b) => { const c = CHARACTERS[id], k = c && c.skills.find(x => x.name === n); if (k && k.desc) k.desc = k.desc.split(a).join(b); };
  D('yamato', '大口真神形態', '（無法行動、速度 -50%）', '（無法行動，之後速度 -2）');
  D('jinbe', '武賴貫', '50% 機率使對手破防', '60% 機率使對手破防');
})();
