/* v109 戰鬥擴充：
   ① 洛基「古代巨人族的王子」：不受伊姆的黑轉支配、不會被伊姆秒殺，受到伊姆的傷害 -50%（專門用來撐住伊姆）。
   ② 伊姆「最初的20人」：只有 BOSS 戰中的伊姆是 20 條命，其他情況（玩家使用、一般對戰）最多 +2 條。
   載入順序：ext_v102.js 之後。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const isLokiVsImu = (a, t) => a && t && a.id === 'imu' && t.id === 'loki';
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const r = _cso(actor, target, skill, blocked);
    if (isLokiVsImu(actor, target) && r && r.damage > 0) {
      if (r.meta && (r.meta.execute || r.meta.executeBuff)) { r.meta.execute = false; r.meta.executeBuff = false; r.damage = Math.floor(target.maxHp * .12); log(`⚡ ${target.name} 以古代巨人族的意志撐住了「${skill.name}」！`); }
      r.damage = Math.max(1, Math.floor(r.damage * .5));
    }
    return r;
  };
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    let s = skill; const ef = (skill && skill.effect) || {};
    if (ef.dominate && isLokiVsImu(actor, target)) { s = { ...skill, effect: { ...ef, dominate: false } }; log(`⚡ ${target.name} 抵抗了黑轉支配！`); }
    if (ef.extraLives > 2 && !(typeof battle !== 'undefined' && battle && battle.isBoss && actor === battle.enemy)) s = { ...s, effect: { ...(s.effect || ef), extraLives: 2 } };
    return _ase(actor, target, s, result);
  };
})();
