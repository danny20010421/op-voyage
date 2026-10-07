/* v121 戰鬥擴充：美音。載入順序：ext_v118.js 之後。
   noteBurst [機率, 比例]：連擊的每一次音符有機率爆炸，額外造成「比例 × 對手最大體力」的傷害（BOSS 一招最多 bossPctCap）；
   utaStunBonus：對手正在暈眩時傷害倍率；
   utaDemon { revive, thorn, thornTurns, curse:[a,b] }：召喚魔王——體力歸 0 時以 revive 比例體力復活一次（全能力 +1、解除能力下降與負面狀態、
     thornTurns 回合反彈 thorn 傷害），之後對手每次對美音造成傷害，對手被扣除自身當下體力 a～b。
   utaRise(f)：給 battle.js（checkBattleEnd）與 live.js（rise）共用的復活判定。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const R = (a, b) => a + Math.random() * (b - a);
  const isBossFoe = t => typeof battle !== 'undefined' && battle && battle.isBoss && t === battle.enemy;
  const capOf = t => isBossFoe(t) ? Math.floor(t.maxHp * ((typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.bossPctCap) ?? .15)) : Infinity;
  const sideOf = f => (typeof battle !== 'undefined' && battle && f === battle.player) ? 'L' : 'R';
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const ef = (skill && skill.effect) || {}, stunned = !!(target && target.status && target.status.stun > 0);
    const r = _cso.apply(this, arguments); if (!r || skill.__x121 || !target) return r; r.meta = r.meta || {};
    if (ef.utaStunBonus && stunned && r.damage > 0 && !r.meta.execute) { r.damage = Math.floor(r.damage * ef.utaStunBonus); log(`🎵 ${target.name} 正在暈眩，歌之世界的傷害 ×${ef.utaStunBonus}！`); }
    if (ef.noteBurst && r.meta.hitCount && !r.meta.execute) {
      if (target.voidImmune) log(`👑 ${target.name} 不受比例傷害影響！`);
      else { const [p, ratio] = ef.noteBurst; let n = 0; for (let i = 0; i < r.meta.hitCount; i++) if (Math.random() < p) n++;
        if (n) { const extra = Math.min(capOf(target), n * Math.max(1, Math.floor(target.maxHp * ratio))); r.damage += extra; log(`💥 ${n} 個音符爆炸了！額外造成 ${extra} 點傷害`); } }
    }
    return r;
  };
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    _ase.apply(this, arguments); const ef = (skill && skill.effect) || {}; if (!actor || skill.__voidFx) return;
    if (ef.utaDemon) { actor.status.utaDemon = Object.assign({}, ef.utaDemon, { armed: true }); log(`🎼 魔王「Tot Musica」降臨了！${actor.name} 倒下時會復活一次。`); }
  };
  /* 復活：回傳 true 表示這次倒下被魔王的力量撐住 */
  window.utaRise = function (f) {
    const D = f && f.status && f.status.utaDemon; if (!D || !D.armed || f.hp > 0 || f.status.dominated) return false;
    D.armed = false; f.hp = Math.max(1, Math.round(f.maxHp * (D.revive || .5)));
    clearAbnormal(f); clearNegativeStages(f); f.status.buffBlock = 0;
    ['atk', 'def', 'spd'].forEach(k => { f.buffs[k] = clamp(f.buffs[k] + 1, -6, 6); });
    const had = f.status.thornTurns > 0 ? (f.status.thornRatio || 0) : 0; f.status.thornTurns = Math.max(f.status.thornTurns || 0, D.thornTurns || 2); f.status.thornRatio = Math.max(had, D.thorn || .25);
    f.status.utaCurse = D.curse || [.1, .2];
    log(`🎼 魔王的歌聲迴盪……${f.name} 以 ${Math.round((D.revive || .5) * 100)}% 體力復活了！全能力 +1，負面效果全部解除，受到攻擊會反彈 ${Math.round((D.thorn || .25) * 100)}% 傷害`);
    try { if (typeof banner === 'function') banner('魔王復活', f === battle.player ? 'me' : 'boss'); if (typeof showHeal === 'function') showHeal(sideOf(f), f.hp); } catch (e) { }
    return true;
  };
  if (typeof checkBattleEnd === 'function') { const _cbe = checkBattleEnd; checkBattleEnd = function () {
    try { const b = battle; let up = false; [b.enemy, b.player].forEach(f => { if (f && f.hp <= 0 && utaRise(f)) up = true; });
      if (up) { const L = document.getElementById('bFL'), Rr = document.getElementById('bFR'); [L, Rr].forEach(x => x && x.classList.remove('down')); if (typeof renderHUD === 'function') renderHUD(true); } } catch (e) { }
    return _cbe.apply(this, arguments); }; }
  /* 詛咒：對手每次對美音造成傷害，對手被扣除自身當下體力 a～b */
  const _ad = applyDamage;
  applyDamage = function (target, amount, side, opts) {
    const before = target ? target.hp : 0, r = _ad.apply(this, arguments);
    try { const C = target && target.status && target.status.utaCurse; if (C && target.hp < before && typeof battle !== 'undefined' && battle && !battle.__utaCurse) {
      const src = target === battle.player ? battle.enemy : target === battle.enemy ? battle.player : null;
      if (src && src.hp > 0 && !src.status.utaCurse) { if (src.voidImmune) log(`👑 ${src.name} 不受魔王的詛咒影響！`); else {
        battle.__utaCurse = true; const d = Math.min(capOf(src), Math.max(1, Math.floor(src.hp * R(C[0], C[1])))); src.hp = Math.max(0, src.hp - d);
        try { showDamage(sideOf(src), d, '#ff6ad5'); } catch (e) { } log(`🎼 魔王的詛咒！${src.name} 被扣除 ${d} 體力`); battle.__utaCurse = false; } } } } catch (e) { if (typeof battle !== 'undefined' && battle) battle.__utaCurse = false; }
    return r;
  };
})();
