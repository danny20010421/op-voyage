/* v167 新效果（使用者 11/06 08:26：洛基要有真實傷害、莫莉亞的技能要能互相疊加；技能資料在 js/balance_v167.js）。
   效果欄位（skill.effect）：
   trueBurst { pct, label }：命中後追加「對手最大體力 pct」的真實傷害——無視護盾、減傷與防禦，直接扣體力（對 BOSS 減半；施放者的傷害加成 __dmgB 照樣套用；虛空王座的伊姆不受比例傷害）
   shadowAdd { n, max, turns }：在對手身上累積「影子」n 層（最多 max 層，turns 回合內沒有再累積就消散；淨化解不掉）
   shadowBonus { per, consume, burst }：對手每有 1 層影子，這招傷害 +per；consume＝打完把影子全部收回；burst＝收回時每層再追加對手最大體力 burst 的真實傷害
   AI：包住 window.__aiW160（battle_core.js pickEnemySkill 與 tests/*-sim.js 共用）——對手影子越多越常用加成招，影子少時優先累積。
   畫面：戰鬥狀態列顯示「影子 ×N」。
   載入順序：ext_v165.js 之後（index.html 在 balance_v167.js 前）。 */
(function () {
  if (typeof computeSkillOutcome !== 'function' || typeof applySkillEffects !== 'function') return;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const pct = x => Math.round(x * 100);
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const isBossFoe = t => { const b = B(); return !!(b && b.isBoss && t === b.enemy); };
  const shadow = f => (f && f.status && f.status.__shadow && f.status.__shadow.n > 0) ? f.status.__shadow : null;
  const nShadow = f => { const s = shadow(f); return s ? s.n : 0; };

  /* 真實傷害：直接扣體力（不經過護盾、減傷）；BOSS 減半、上限為 BOSS 比例傷害上限 */
  function trueHit(actor, target, ratio, label) {
    if (!target || target.hp <= 0 || !(ratio > 0)) return 0;
    if (target.voidImmune) { L(`👑 ${target.name} 不受比例傷害影響！`); return 0; }
    let d = Math.floor(target.maxHp * ratio * (isBossFoe(target) ? .5 : 1) * ((actor && actor.__dmgB) || 1)); /* __dmgB：星級傷害加成、篇章 BOSS 傷害倍率（story_boss_v156.js）一併套用 */
    if (isBossFoe(target)) d = Math.min(d, Math.floor(target.maxHp * ((typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.bossPctCap) ?? .15)));
    if (d <= 0) return 0;
    if (d >= target.hp && typeof applyDamage === 'function') { const S = target.status, k = { dr: S.damageReductionTurns, sd: target.setDR }; S.damageReductionTurns = 0; target.setDR = 0; /* 致命的一擊交給一般受傷流程，讓保命效果（撐住致命傷、不死、瀕死回滿）照常判定 */
      try { applyDamage(target, d, sideOf(target), { ignoreShield: true }); } finally { S.damageReductionTurns = k.dr; target.setDR = k.sd; } }
    else { target.hp = Math.max(0, target.hp - d); try { if (onScreen(target)) showDamage(sideOf(target), d, '#ffe066'); } catch (e) { } }
    L(`⚡ ${label || '真實傷害'}：無視護盾與減傷，${target.name} 直接失去 ${d} 點體力！`);
    return d;
  }
  window.trueHit167 = trueHit;

  /* ---------- 傷害計算：影子加成 ---------- */
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const r = _cso.apply(this, arguments);
    const SB = skill && skill.effect && skill.effect.shadowBonus, n = nShadow(target);
    if (SB && n > 0 && r && r.damage > 0 && !(r.meta && r.meta.execute)) {
      const m = 1 + (SB.per || 0) * n;
      if (m !== 1) { r.damage = Math.floor(r.damage * m); L(`👤 ${target.name} 身上有 ${n} 層影子：「${skill.name}」傷害 ×${m.toFixed(2)}！`); }
    }
    return r;
  };

  /* ---------- 技能效果：真實傷害、累積／收回影子 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const ef = (skill && skill.effect) || {}, n0 = nShadow(target);
    const r = _ase.apply(this, arguments);
    if (!actor || !target || target === actor || skill.__voidFx) return r;
    if (ef.trueBurst && target.hp > 0 && (skill.type !== 'attack' || (result && result.damage > 0))) trueHit(actor, target, ef.trueBurst.pct, ef.trueBurst.label);
    if (ef.shadowBonus && ef.shadowBonus.consume && n0 > 0 && target.status) {
      target.status.__shadow = null;
      L(`👤 ${actor.name} 收回了 ${target.name} 身上的 ${n0} 層影子！`);
      if (ef.shadowBonus.burst && target.hp > 0) trueHit(actor, target, ef.shadowBonus.burst * n0, '影子回收');
    }
    if (ef.shadowAdd && target.hp > 0 && target.status && !target.voidImmune) {
      const A = ef.shadowAdd, cur = target.status.__shadow || { n: 0, t: 0 }, max = A.max || 5;
      const n = Math.min(max, (ef.shadowBonus && ef.shadowBonus.consume ? 0 : cur.n) + (A.n || 1));
      target.status.__shadow = { n, t: A.turns || 4, max };
      L(`👤 ${target.name} 的影子被剪下：影子 ${n} 層（最多 ${max} 層，${A.turns || 4} 回合內沒有再累積就會消散）`);
    }
    return r;
  };

  /* ---------- 回合結束：影子倒數 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const r = _ets.apply(this, arguments); const S = c && c.status && c.status.__shadow;
    if (S && S.n > 0) { S.t--; if (S.t <= 0) { c.status.__shadow = null; L(`👤 ${c.name} 身上的影子消散了。`); } }
    return r;
  };

  /* ---------- AI 權重 ---------- */
  const _w = window.__aiW160;
  window.__aiW160 = function (actor, target, s) {
    let w = _w ? _w(actor, target, s) : 1; const e = (s && s.effect) || {}; if (!actor || !target) return w;
    const n = nShadow(target);
    if (e.shadowBonus) w *= n > 0 ? 1 + .45 * n : .75;
    if (e.shadowAdd && !e.shadowBonus) w *= n < 2 ? 1.6 : n >= 4 ? .7 : 1;
    if (e.trueBurst) w *= 1.15;
    return w;
  };

  /* ---------- 戰鬥狀態列 ---------- */
  if (typeof statusChips === 'function') {
    const _sc = statusChips;
    statusChips = function (c) {
      const h = _sc.apply(this, arguments), S = shadow(c);
      return S ? `<span class="chip bad" title="莫莉亞的招式對有影子的對手傷害提高（${S.t} 回合內沒有再累積就會消散）">影子 ×${S.n}</span>` + h : h;
    };
  }
})();
