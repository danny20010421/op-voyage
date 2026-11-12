/* v205（使用者 11/12 21:58）：
   ① 大熊第五技能改名「毀滅光炮」：解除自身所有負面狀態與能力下降，這回合與下回合受到攻擊時反彈 50% 傷害，
      恢復 20% 體力並獲得 20% 護盾，給予對手 5～12 倍傷害；50% 機率使對手所有技能次數 -1（不含第五技能奧義）。
   ② 喬拉可爾·密佛格（七武海）升為 UR：攻擊技能與效果全面提升，定位為「瞬殺型」攻擊角色
      （數值依 tests/tier-sim.js 量測，UR 同稀有度平均勝率維持在 44～58%，DEC-035）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, n) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === n); };
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  const untag = (s, t) => { if (s.tags) s.tags = s.tags.filter(x => x[0] !== t); };

  /* ── 大熊：毀滅光炮 ── */
  { const s = get('kuma', '什麼都沒有發生'); if (s) {
    s.name = '毀滅光炮'; s.power = 100;
    s.effect = { randomMultiplierRange: [5, 12], clearSelfDebuffs: true, thornTurns: 2, thornRatio: .5, healRatio: .2, selfShieldMaxHpRatio: .2, ppDownAllChance: .5 };
    s.desc = '奧義。解除自身所有負面狀態與能力下降，這回合與下回合受到攻擊時反彈 50% 傷害，恢復 20% 體力並獲得 20% 護盾，給予對手 5～12 倍傷害；50% 機率使對手所有技能次數 -1（不含第五技能奧義）。';
    untag(s, '無法攻擊'); untag(s, '疲勞'); tag(s, '淨化', 'green'); tag(s, '反彈', 'gold'); tag(s, '護盾', 'blue'); tag(s, '次數-1', 'purple'); } }

  /* 新效果 ppDownAllChance：機率使對手所有非奧義技能次數 -1 */
  if (typeof applySkillEffects === 'function') { const _ase = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) { const r = _ase.apply(this, arguments);
      try { const ef = skill && skill.effect; if (ef && ef.ppDownAllChance && target && target.hp > 0 && Math.random() < ef.ppDownAllChance) {
        let n = 0; (target.skills || []).forEach(x => { if (!x.ultimate && x.pp > 0) { x.pp--; n++; } });
        if (n && typeof log === 'function') log(`💥 ${target.name} 被光炮轟散了架勢：所有技能次數 -1！`); } } catch (e) { }
      return r; };
    try { window.applySkillEffects = applySkillEffects; } catch (e) { } }

  /* ── 喬拉可爾·密佛格（七武海）→ UR，瞬殺型 ── */
  if (CHARACTERS.mihawk_w && typeof CHAR_RARITY !== 'undefined') { CHAR_RARITY.mihawk_w = 'UR';
    const S = CHARACTERS.mihawk_w;
    { const s = get('mihawk_w', '斬擊'); if (s) { s.power = 90; Object.assign(s.effect, { multiHitNormal: [3, 5], perHitPower: 90, executeChance: .03 });
      s.desc = '以黑刀「夜」快速斬擊 3～5 次，3% 機率一刀斬殺。'; tag(s, '斬殺', 'red'); } }
    { const s = get('mihawk_w', '劍氣狀態'); if (s) { Object.assign(s.effect, { healRange: [.2, .4], nextAttackMult: [1.3, 1.8], nextAttackMultTurns: 2 });
      s.desc = '劍氣纏身：回復 20～40% 體力，接下來 2 回合的下一次攻擊威力 ×1.3～1.8。'; } }
    { const s = get('mihawk_w', '黑刀·夜'); if (s) { s.power = 185; Object.assign(s.effect, { executeChance: .08, randomMultiplierRange: [6, 13] });
      s.desc = '一刀劈開冰山的斬擊：造成 6～13 倍傷害，8% 機率一刀斬殺。'; } }
    { const s = get('mihawk_w', '洞察弱點'); if (s) { Object.assign(s.effect, { enemyDefDownTemp: [2, 2], weakTurns: 2, weakRange: [1.2, 1.6] });
      s.desc = '鷹眼看穿對手的破綻：清除對手的能力提升、對手防禦 -2（2 回合），並使對手虛弱 2 回合（受到 1.2～1.6 倍傷害）。'; } }
    { const s = get('mihawk_w', '世界最強劍豪'); if (s) { Object.assign(s.effect, { dotSequence: [[.04, .07], [.04, .07], [.04, .07]] });
      s.desc = '奧義。全能力 +1，1 回合內不受任何傷害，並讓對手連續 3 回合受到 4～7% 最大體力的斬擊傷害。'; } }
    void S; }
})();
