/* v110 戰鬥擴充：角色特性（免疫異常／免秒殺／免能力下降）、洛基新招式、伊姆 UR++ 招式、伊姆未裝備皮膚的限制。
   載入順序：ext_v109.js 之後。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const R = (a, b) => a + Math.random() * (b - a), has = (f, t) => !!(f && f.traits && f.traits.includes(t));
  const sideOf = f => (battle && f === battle.player) ? 'L' : 'R', oppOf = f => battle && (f === battle.player ? battle.enemy : battle.player);
  const isBoss = t => battle && battle.isBoss && t === battle.enemy;
  const EXEC_IMMUNE = ['loki', 'joyboy'];
  /* 建立戰鬥角色時帶入角色特性 */
  if (typeof buildFighter === 'function') { const _bf = buildFighter; buildFighter = function (id) { const f = _bf.apply(this, arguments); const c = CHARACTERS[id]; if (f && c && c.traits) { f.traits = c.traits.slice(); if (has(f, 'immuneAbn')) f.status.immunePermanent = true; } return f; }; }
  /* 免能力下降：效果結算前後比對，被降低的能力值還原 */
  const snap = f => f ? { atk: f.buffs.atk, def: f.buffs.def, spd: f.buffs.spd } : null;
  const guard = (f, s) => { if (!f || !s || !has(f, 'immuneDown')) return; let n = 0; ['atk', 'def', 'spd'].forEach(k => { if (f.buffs[k] < s[k]) { f.buffs[k] = s[k]; n++; } }); if (n) log(`🛡️ ${f.name} 不受能力下降影響！`); };
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const ef = (skill && skill.effect) || {};
    if (!skill || skill.__x110) return _cso(actor, target, skill, blocked);
    /* 洛基：鐵雷五矢 */
    if (ef.lokiBolts) { const [n, rg] = ef.lokiBolts; let d = 0; for (let i = 0; i < n; i++) d += Math.floor(target.maxHp * R(rg[0], rg[1]));
      if (target.voidImmune) d = 0; else if (isBoss(target)) d = Math.min(d, Math.floor(target.maxHp * (GAME_SETTINGS.bossPctCap ?? .15)));
      if (ef.reflectMultRange) ef.reflectMultiplier = Math.round(R(ef.reflectMultRange[0], ef.reflectMultRange[1]) * 10) / 10;
      log(`⚡ 五道鐵雷貫穿 ${target.name}！`); return { damage: d, meta: { hitCount: n } }; }
    /* 伊姆：虛無劍（目前體力 10～20%） */
    if (ef.imuVoidCut) { let d = target.voidImmune ? 0 : Math.floor(target.hp * R(ef.imuVoidCut[0], ef.imuVoidCut[1])); if (isBoss(target)) d = Math.min(d, Math.floor(target.maxHp * (GAME_SETTINGS.bossPctCap ?? .15))); return { damage: d, meta: {} }; }
    let r = _cso(actor, target, { ...skill, __x110: true }, blocked);
    if (!r) return r;
    if (ef.bonusTotalPct && r.damage > 0) { const b = Math.floor(r.damage * R(ef.bonusTotalPct[0], ef.bonusTotalPct[1])); r.damage += b; log(`⚡ 追加雷擊 ${b} 點傷害！`); } /* v112 洛基雷電噴吐 */
    /* 免秒殺（洛基、伊姆）；伊姆的秒殺對洛基、喬伊波伊無效 */
    if (r.meta && (r.meta.execute || r.meta.executeBuff) && (has(target, 'immuneExec') || (actor && actor.id === 'imu' && EXEC_IMMUNE.includes(target.id)))) {
      r.meta.execute = false; r.meta.executeBuff = false; r.damage = Math.min(r.damage, Math.floor(target.maxHp * .1)); log(`🛡️ ${target.name} 不會被秒殺！`); }
    if (r.damage > 0) {
      if (actor && actor.status.__pressure > 0) r.damage = Math.floor(r.damage * .75);
      if (target.status.__pressure > 0) r.damage = Math.floor(r.damage * 1.25);
      if (target.status.__eternal) r.damage = Math.floor(r.damage * .8);
    }
    return r;
  };
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const ef = (skill && skill.effect) || {}, sa = snap(actor), st = snap(target);
    /* 伊姆：不死之身——對手體力較高時互換 */
    if (ef.hpSwapIfLower && target.hp > actor.hp && actor.hp > 0) { const a = actor.hp; actor.hp = Math.min(actor.maxHp, target.hp); target.hp = Math.max(1, Math.min(target.maxHp, a)); log(`🔄 ${actor.name} 與 ${target.name} 的體力互換了！`); }
    _ase(actor, target, skill, result);
    if (!skill || skill.__voidFx) { guard(target, st); guard(actor, sa); return; }
    if (target.hp > 0 && !target.voidImmune && !(typeof immuneTo === 'function' && immuneTo(target))) {
      if (ef.pressureTurns) { target.status.__pressure = Math.max(target.status.__pressure || 0, ef.pressureTurns); log(`👁️ ${target.name} 受到「威壓」：傷害 -25%、防禦 -20%（${ef.pressureTurns} 回合）`); }
      if (ef.enemySkillNullify) { target.status.skillNullify = Math.max(target.status.skillNullify || 0, ef.enemySkillNullify); log(`🗡️ ${target.name} 下回合的技能將會失效！`); }
      if (ef.lokiStun && Math.random() < ef.lokiStun) { if (Math.random() < .5) { target.status.skipAttack = Math.max(target.status.skipAttack || 0, 1); log(`⚡ ${target.name} 被雷電麻痺，無法攻擊 1 回合！`); } else { target.status.skillNullify = Math.max(target.status.skillNullify || 0, 1); log(`⚡ ${target.name} 下一招將會失效！`); } }
    }
    if (ef.lokiEternal) { actor.status.__eternal = true; actor.status.__eternalT = 0; log(`🐉 ${actor.name} 覺醒了！直到倒下前受到的傷害 -20%，每 5 回合清除對手的能力提升。`); }
    if (ef.imuAura && target.hp >= 0) { target.status.buffBlock = 9999; actor.status.__miasma = true; log(`👑 ${target.name} 直到戰鬥結束前都無法提升能力，每回合都會受到魔氣侵蝕！`); }
    guard(target, st); guard(actor, sa);
  };
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const s0 = snap(c); _ets(c); guard(c, s0);
    if (!battle || !c || !c.status || c.hp <= 0) return;
    if (c.status.__pressure > 0) c.status.__pressure--;
    const o = oppOf(c);
    if (c.status.__eternal && o && o.hp > 0 && ++c.status.__eternalT % 5 === 0 && ['atk', 'def', 'spd'].some(k => o.buffs[k] > 0)) { ['atk', 'def', 'spd'].forEach(k => { o.buffs[k] = Math.min(0, o.buffs[k]); }); log(`🐉 尼德霍格的威壓清除了 ${o.name} 的能力提升！`); }
    if (c.status.__miasma && o && o.hp > 0) { const sk = c.skills[3]; if (sk) { log(`👑 魔氣侵蝕 ${o.name}！`); const r = computeSkillOutcome(c, o, sk, false); if (r && r.damage > 0) applyDamage(o, r.damage, sideOf(o), r.meta); applySkillEffects(c, o, sk, r || { damage: 0, meta: {} }); } }
  };
  /* 伊姆「未裝備皮膚時只能使用不死之身」沿用 buildFighter 原有的 skinSkills 機制（皮膚 imu_true） */
})();
