/* v102 戰鬥擴充：明哥（鳥籠、五色線連發、蜘蛛網）、黑鬍子（解放、奧義奪取技能）用到的新效果。
   以包裝原本函式的方式加入，其他角色不受影響。載入順序：ext_effects.js 之後。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const rr = ([a, b]) => a + Math.random() * (b - a), side = f => (battle && f === battle.player) ? 'L' : 'R';
  const isBoss = t => battle && battle.isBoss && t === battle.enemy;
  if (typeof VOID_PCT_KEYS !== 'undefined') VOID_PCT_KEYS.push('birdcageHits', 'enemyCurrentHpCutRange', 'lostHpDamageRange');
  /* 每次施放前先擲出這次的隨機數值 */
  function roll(ef) {
    if (ef.lostHpDamageRange) ef.lostHpDamageMult = Math.round(rr(ef.lostHpDamageRange) * 100) / 100;
    if (ef.enemyCurrentHpCutRange) ef.enemyCurrentHpCut = Math.round(rr(ef.enemyCurrentHpCutRange) * 100) / 100;
    if (ef.selfShieldMaxHpRange) ef.selfShieldMaxHpRatio = Math.round(rr(ef.selfShieldMaxHpRange) * 100) / 100;
    if (ef.thornRange) ef.thornRatio = Math.round(rr(ef.thornRange) * 100) / 100;
    if (ef.reflectMultRange) ef.reflectMultiplier = Math.round(rr(ef.reflectMultRange) * 10) / 10; /* v103 明哥寄生線 20～200% */
  }
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const ef = (skill && skill.effect) || {};
    if (!skill || skill.__x102) return _cso(actor, target, skill, blocked);
    roll(ef);
    /* 鳥籠：連續切割，每次削去對手目前體力的一定比例 */
    if (ef.birdcageHits) {
      if (target.voidImmune) { log(`👑 ${target.name} 不受比例傷害影響！`); return { damage: 0, meta: {} }; }
      const [a, b] = ef.birdcageHits, n = a + Math.floor(Math.random() * (b - a + 1)); let hp = target.hp, d = 0;
      for (let i = 0; i < n && hp > 1; i++) { const x = Math.max(1, Math.floor(hp * rr(ef.birdcagePct))); d += x; hp -= x; }
      if (isBoss(target)) d = Math.min(d, Math.floor(target.maxHp * (GAME_SETTINGS.bossPctCap ?? .15)));
      log(`🕸️ 鳥籠收緊！連續切割 ${n} 次！`); return { damage: d, meta: { hitCount: n } };
    }
    if (ef.enemyCurrentHpCutRange && ef.enemyCurrentHpCut) log(`🕳️ 削去對手目前體力 ${Math.round(ef.enemyCurrentHpCut * 100)}%`);
    if (ef.lostHpDamageRange) log(`🕳️ 解放倍率 ×${ef.lostHpDamageMult}`);
    return _cso(actor, target, { ...skill, __x102: true }, blocked);
  };
  /* 奪取對手技能時，對手那個技能次數 -1 */
  if (typeof safeCopiedSkill === 'function') { const _scs = safeCopiedSkill; safeCopiedSkill = function (t) { const p = _scs(t); if (p && window.__copyDrain) { p.pp = Math.max(0, p.pp - window.__copyDrain); log(`🕳️ ${t.name} 的「${p.name}」次數 -${window.__copyDrain}`); } return p; }; }
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const ef = (skill && skill.effect) || {};
    window.__copyDrain = ef.copyDrainPP || 0;
    try { _ase(actor, target, skill, result); } finally { window.__copyDrain = 0; }
    if (!skill || skill.__voidFx) return;
    if (ef.enemySpdDownTemp && target.hp > 0 && !target.voidImmune && !(typeof immuneTo === 'function' && immuneTo(target))) {
      const [amt, turns] = ef.enemySpdDownTemp; target.buffs.spd = clamp(target.buffs.spd - amt, -6, 6);
      target.status.spdDownTemp = Math.max(target.status.spdDownTemp || 0, turns); target.status.spdDownAmt = (target.status.spdDownAmt || 0) + amt; log(`🧵 ${target.name} 速度 -${amt}（${turns} 回合）`);
    }
    if (ef.clearBuffsChance && target.hp > 0 && result && result.damage > 0 && Math.random() < ef.clearBuffsChance && ['atk', 'def', 'spd'].some(k => target.buffs[k] > 0)) {
      ['atk', 'def', 'spd'].forEach(k => { target.buffs[k] = Math.min(0, target.buffs[k]); }); log(`🧵 ${target.name} 的能力提升被絲線切斷了！`);
    }
    if (ef.endTurnCurse && target.hp > 0 && !target.voidImmune) { target.status.__curse = ef.endTurnCurse; log(`🕳️ 黑暗纏上了 ${target.name}……`); }
    /* 連發：再施放一次（不會再連發） */
    if (ef.recastChance && !skill.__recast && target.hp > 0 && actor.hp > 0 && Math.random() < ef.recastChance) {
      const again = { ...skill, __recast: true, effect: { ...ef, recastChance: 0 } }; log(`🧵 ${actor.name} 再次施放「${skill.name}」！`);
      const r = computeSkillOutcome(actor, target, again, false); if (r.damage > 0) applyDamage(target, r.damage, side(target), r.meta); applySkillEffects(actor, target, again, r);
    }
  };
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    _ets(c); if (!battle || !c || !c.status) return;
    if (c.status.__curse && c.hp > 0) { const C = c.status.__curse; c.status.__curse = null;
      if (C.allDown) { ['atk', 'def', 'spd'].forEach(k => { c.buffs[k] = clamp(c.buffs[k] - C.allDown, -6, 6); }); log(`🕳️ ${c.name} 全能力 -${C.allDown}`); }
      if (C.ppDown) { const pool = c.skills.filter(s => s.pp > 0 && !s.locked); if (pool.length) { const s = pool[Math.floor(Math.random() * pool.length)]; s.pp = Math.max(0, s.pp - C.ppDown); log(`🕳️ ${c.name} 的「${s.name}」次數 -${C.ppDown}`); } } }
    if (c.status.spdDownTemp > 0 && --c.status.spdDownTemp === 0) { c.buffs.spd = clamp(c.buffs.spd + (c.status.spdDownAmt || 0), -6, 6); c.status.spdDownAmt = 0; }
  };
})();
