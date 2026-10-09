/* v142 戰鬥擴充：娜美。載入順序：ext_v121 之後、ext_v128 之前（ext_v129 仍是最外層）。
   namiZeus：自身每 1 層速度提升，奧義傷害 +namiZeus（最多 6 層）。
   namiSteal { pp, to }：先把對手的能力提升（攻擊／防禦／速度中為正的部分）移到自己身上，再讓對手隨機一招 -pp 次，補到自己名為 to 的招式（不超過上限）。 */
(function () {
  if (typeof computeSkillOutcome !== 'function' || typeof applySkillEffects !== 'function') return;
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill) {
    const r = _cso.apply(this, arguments), ef = (skill && skill.effect) || {};
    if (r && ef.namiZeus && r.damage > 0 && actor && !(r.meta && r.meta.execute)) {
      const st = Math.max(0, Math.min(6, (actor.buffs && actor.buffs.spd) || 0));
      if (st) { const m = 1 + ef.namiZeus * st; r.damage = Math.floor(r.damage * m); log(`⚡ 速度 +${st}，宙斯的雷擊傷害 ×${m.toFixed(2)}！`); }
    }
    return r;
  };
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill) {
    const ef = (skill && skill.effect) || {};
    if (ef.namiSteal && actor && target && target.hp > 0) {
      let n = 0; ['atk', 'def', 'spd'].forEach(k => { const v = target.buffs[k]; if (v > 0) { actor.buffs[k] = Math.max(-6, Math.min(6, actor.buffs[k] + v)); target.buffs[k] = 0; n += v; } });
      log(n ? `🐱 ${actor.name} 偷走了 ${target.name} 的 ${n} 層能力提升！` : `🐱 ${target.name} 身上沒有能力提升可以偷`);
      const pool = target.skills.filter(s => s.pp > 0);
      if (pool.length && ef.namiSteal.pp) { const s = pool[Math.floor(Math.random() * pool.length)], k = Math.min(s.pp, ef.namiSteal.pp); s.pp -= k;
        const mine = actor.skills.find(x => x.name === ef.namiSteal.to); if (mine) mine.pp = Math.min(mine.maxPP || mine.pp + k, mine.pp + k);
        log(`🐱 ${actor.name} 摸走了「${s.name}」的 ${k} 次技能次數！`); }
    }
    return _ase.apply(this, arguments);
  };
})();
