/* v196 基德（電磁炮模式）強化（使用者 11/10 12:46「基德技能傷害跟第五技能也要順便強化」）。
   強化前同稀有度（SSR）平均勝率 44.8%，在 33 位裡排第 29（tests/tier-sim.js，量測在 /root/promo/v196）。
   ① 磁氣機械臂：每擊威力 60 → 72，回復 3～5% → 4～7%
   ③ 電磁砲：5～15 倍 → 6～16 倍；秒殺機率 3～5% → 4～7%
   ⑤ 賦極（奧義）：對手防禦 -2 持續 2 → 3 回合；自身全能力 +1 → +2；傷害加成 +30%（2 回合）→ +50%（3 回合）；麻痺機率 25% → 50%；
      新增：隨機恢復自己一個技能 1 次（奧義除外）。
      另外修正：以前先放「磁氣魔人」（傷害 2～5 倍）再放「賦極」，倍率會被賦極的 +30% 蓋掉、反而變弱；現在保留兩者中較高的倍率（effect.multKeepMax）。
   ②④ 不變。statScale 不動。 */
(function () {
  const C = typeof CHARACTERS !== 'undefined' && CHARACTERS.kid; if (!C) return;
  const get = n => C.skills.find(s => s.name === n);
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  { const s = get('磁氣機械臂'); if (s) { s.power = 72; Object.assign(s.effect, { perHitPower: 72, healRange: [.04, .07] });
      s.desc = '用磁力組成的機械臂強力攻擊對手 3 次，並回復自身 4～7% 體力。'; } }
  { const s = get('電磁砲'); if (s) { Object.assign(s.effect, { randomMultiplierRange: [6, 16], executeChanceRange: [.04, .07] });
      s.desc = '對敵人造成 6～16 倍傷害，有 4～7% 機率直接秒殺。'; } }
  { const s = get('賦極'); if (s) { Object.assign(s.effect, { enemyDefDownTemp: [2, 3], statUpAll: 2, paralyzeChance: .5, damageMultTurns: 3, damageMultValue: 1.5, randomSelfPPUp: 1, multKeepMax: true });
      s.desc = '奧義。對手防禦 -2（持續 3 回合），自身全能力 +2，接下來 3 回合傷害 +50%（已有更高的傷害倍率時保留較高的），消除對手的能力提升，50% 機率使對手麻痺 1 回合，並隨機恢復自己一個技能 1 次（奧義除外）。';
      tag(s, '強化', 'gold'); tag(s, '破防', 'red'); tag(s, '麻痺', 'gold'); } }
  /* multKeepMax：這一招設定的傷害倍率不會蓋掉原本較高的倍率（回合數取較長的） */
  if (typeof applySkillEffects === 'function') { const _a = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) { const ef = skill && skill.effect, keep = ef && ef.multKeepMax && actor && actor.status;
      const pv = keep ? actor.status.damageMultValue || 1 : 1, pt = keep ? actor.status.damageMultTurns || 0 : 0;
      const r = _a.apply(this, arguments);
      try { if (keep && pt > 0 && pv > (actor.status.damageMultValue || 1)) { actor.status.damageMultValue = pv; actor.status.damageMultTurns = Math.max(pt, actor.status.damageMultTurns || 0); } } catch (e) { }
      return r; };
    try { window.applySkillEffects = applySkillEffects; } catch (e) { } }
})();
