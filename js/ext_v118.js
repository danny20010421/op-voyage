/* v118 戰鬥擴充：尼卡魯夫。載入順序：ext_v115.js 之後。
   dmgToShield：造成的傷害 × 比例 → 自身護盾；nikaThunder [a,b]：被閃避／無敵躲開時，對手下次攻擊會反彈自己 a～b 倍傷害；
   nikaTeamHeal：陣容中體力低於 85% 的隊友回復比例；nikaTriple：機率連續攻擊 3 次（傷害 ×3）；nikaLegacy：倒下後下一位隊友 2 回合無敵、攻擊 +1；
   ignoreShield 也適用於一般攻擊。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const R = (a, b) => a + Math.random() * (b - a);
  window.onEvaded = function (actor, target, skill) { const ef = (skill && skill.effect) || {}; if (!ef.nikaThunder || !target) return; target.status.__selfReflect = Math.round(R(ef.nikaThunder[0], ef.nikaThunder[1]) * 10) / 10; log(`⚡ ${target.name} 躲開了雷電……但下一次攻擊會反彈 ${Math.round(target.status.__selfReflect * 100)}% 的傷害到自己身上！`); };
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const r = _cso.apply(this, arguments); const ef = (skill && skill.effect) || {};
    if (!r || skill.__x118) return r;
    if (ef.ignoreShield && r.damage > 0) { r.meta = r.meta || {}; r.meta.ignoreShield = true; }
    if (ef.nikaTriple && r.damage > 0 && !(r.meta && r.meta.execute) && Math.random() < ef.nikaTriple) { r.damage *= 3; r.meta = r.meta || {}; r.meta.hitCount = 3; log('👊 巨人之拳連續砸下 3 次！'); }
    return r;
  };
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    _ase.apply(this, arguments); const ef = (skill && skill.effect) || {}; if (!actor || skill.__voidFx) return;
    if (ef.dmgToShield && result && result.damage > 0) { const s = Math.floor(result.damage * ef.dmgToShield); actor.status.shield = (actor.status.shield || 0) + s; log(`🛡️ ${actor.name} 把打出的傷害化為 ${s} 點護盾！`); }
    if (ef.nikaTeamHeal && typeof battle !== 'undefined' && battle && actor === battle.player && battle.team) battle.team.forEach(f => { if (f !== actor && f.hp > 0 && f.hp < f.maxHp * .85) { const h = Math.floor(f.maxHp * ef.nikaTeamHeal); f.hp = Math.min(f.maxHp, f.hp + h); log(`🥁 鼓聲傳到 ${f.name}，回復 ${h} 體力`); } });
    if (ef.nikaLegacy) { actor.status.__legacy = true; }
    /* 自身反彈：被雷電詛咒的一方攻擊時，傷害反彈給自己 */
    if (actor.status.__selfReflect && skill.type === 'attack' && result && result.damage > 0 && actor.hp > 0) { const m = actor.status.__selfReflect, d = Math.max(1, Math.round(result.damage * m)); actor.status.__selfReflect = 0; actor.hp = Math.max(0, actor.hp - d); log(`⚡ 雷電反噬！${actor.name} 受到 ${d} 點反彈傷害`); try { showDamage(actor === battle.player ? 'L' : 'R', d, '#ffe04a'); } catch (e) { } }
  };
  if (typeof doSwitch === 'function') { const _ds = doSwitch; doSwitch = function (i) { const prev = battle && battle.player; const r = _ds.apply(this, arguments);
    try { const f = battle.player; if (prev && prev !== f && prev.hp <= 0 && prev.status && prev.status.__legacy) { prev.status.__legacy = false; f.status.invuln = Math.max(f.status.invuln || 0, 2); if (!(f.status.buffBlock > 0)) f.buffs.atk = Math.min(6, f.buffs.atk + 1); log(`☀️ 太陽神的意志延續！${f.name} 2 回合無敵、攻擊 +1`); renderHUD && renderHUD(); } } catch (e) { } return r; }; }
})();
