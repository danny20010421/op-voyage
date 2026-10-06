/* v115 戰鬥擴充：燼的技能效果。載入順序：ext_v110.js 之後。
   ppUpRandom [數量, 次數]：隨機挑幾個技能（奧義除外，優先挑用過的）恢復使用次數，不超過上限。
   kingFlame { turns, reduce, thorn, spdOnOut }：露娜莉亞之火——turns 回合內受到的傷害 -reduce、反彈 thorn；火焰熄滅時速度 +spdOnOut。 */
(function () {
  if (typeof applySkillEffects !== 'function') return;
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    _ase(actor, target, skill, result);
    const ef = (skill && skill.effect) || {};
    if (!actor || skill.__voidFx) return;
    if (ef.ppUpRandom) { const [n, amt] = ef.ppUpRandom, pool = actor.skills.filter(s => !s.ultimate && !s.locked && s.maxPP > 0), used = pool.filter(s => s.pp < s.maxPP);
      const pick = [], src = (used.length >= n ? used : pool).slice();
      while (pick.length < n && src.length) pick.push(src.splice(Math.floor(Math.random() * src.length), 1)[0]);
      if (pick.length < n) pool.filter(s => !pick.includes(s)).slice(0, n - pick.length).forEach(s => pick.push(s));
      pick.forEach(s => { const before = s.pp; s.pp = Math.min(s.maxPP, s.pp + amt); if (s.pp > before) log(`🔥 「${s.name}」使用次數 +${s.pp - before}！`); }); }
    if (ef.kingFlame) { const K = ef.kingFlame, st = actor.status;
      st.damageReductionTurns = Math.max(st.damageReductionTurns || 0, K.turns); st.damageReductionValue = Math.max(st.damageReductionValue || 0, K.reduce);
      st.thornTurns = Math.max(st.thornTurns || 0, K.turns); st.thornRatio = Math.max(st.thornRatio || 0, K.thorn);
      st.__kingFlame = K.turns; st.__kingSpd = K.spdOnOut || 0;
      log(`🔥 ${actor.name} 背上燃起露娜莉亞之火！${K.turns} 回合內受到的傷害 -${Math.round(K.reduce * 100)}%，攻擊者會被反灼 ${Math.round(K.thorn * 100)}% 傷害。`); }
  };
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    _ets(c);
    if (!c || !c.status || c.hp <= 0 || !(c.status.__kingFlame > 0)) return;
    if (--c.status.__kingFlame === 0 && c.status.__kingSpd) {
      if (!(c.status.buffBlock > 0)) c.buffs.spd = Math.max(-6, Math.min(6, c.buffs.spd + c.status.__kingSpd));
      log(`🪶 ${c.name} 背上的火焰熄滅了——化為無齒翼龍，速度 +${c.status.__kingSpd}！`);
    }
  };
})();
