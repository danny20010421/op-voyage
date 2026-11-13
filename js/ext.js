/* v214：戰鬥效果擴充（原 ext_*.js、status_v*.js 依載入順序合併）。合併前的檔案邊界以「==== 原 檔名 ====」標記。 */

/* ==== 原 js/ext_effects.js ==== */
/* v63 戰鬥擴充：暈眩、護盾無效、真實傷害、霸王色、老爹光環、神避、冰河時期等新效果。
   以包裝原本函式的方式加入，原本角色的技能完全不受影響。載入順序：battle.js 之後。 */
(function () {
  /* 新篇章難度 */
  Object.assign(CHAPTER_DIFFICULTY, {
    thriller: { order: 4, label: '困難', stars: 3, hp: 1.52, atk: 2, def: 1, spd: 1, bossHp: 1.45, bossStages: 2, ai: 1.16, revives: 1, bossLvUp: 16 },
    dressrosa: { order: 6, label: '極難', stars: 3, hp: 1.65, atk: 2, def: 2, spd: 1, bossHp: 1.52, bossStages: 2, ai: 1.22, revives: 2, bossLvUp: 19 },
    emperor: { order: 9, label: '皇帝', stars: 5, hp: 1, atk: 0, def: 0, spd: 0, bossHp: 1, bossStages: 0, ai: 1.35, revives: 0, bossLvUp: 0 },
    pvp: { order: 1, label: '對戰', stars: 0, hp: 1, atk: 0, def: 0, spd: 0, bossHp: 1, bossStages: 0, ai: 1.3, revives: 0, bossLvUp: 0 },
    egghead: { order: 9, label: '地獄', stars: 4, hp: 1.9, atk: 3, def: 2, spd: 2, bossHp: 1.62, bossStages: 2, ai: 1.32, revives: 2, bossLvUp: 23 }
  });
  ABN.stun = { name: '暈眩', icon: '💫', desc: '無法行動，也無法使用道具' }; if (!CC_KEYS.includes('stun')) CC_KEYS.push('stun');
  VOID_PCT_KEYS.push('selfLostHpDamage');
  const RANK = { C: -.5, U: -.25, N: 0, R: 1, RR: 1.33, RRR: 1.66, SR: 2, SSR: 3, UR: 4, 'UR+': 5, 'UR++': 6 }; /* v130：補上 UR++ */
  const rarOf = f => (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[f.id]) || 'SSR';
  const sideOf = f => (battle && f === battle.enemy) ? 'R' : 'L';
  const isBossTarget = t => battle && battle.isBoss && t === battle.enemy && !t.voidImmune;
  const binom = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (Math.random() < p) k++; return k; };

  /* ---------- 傷害計算 ---------- */
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    if (!skill || skill.__ext) return _cso(actor, target, skill, blocked);
    const ef = skill.effect || {};
    /* 霸王色：控場為主，弱者直接倒下 */
    if (ef.haoshoku) {
      if (target.voidImmune) return { damage: 0, meta: { haoshoku: true } };
      const weak = RANK[rarOf(target)] <= 1 || (target.level || 100) <= 80;
      if (weak) {
        if (isBossTarget(target)) { const d = calcAttackDamage(actor, target, { type: 'attack', power: 100, effect: { forceMultiplier: 3 } }); log(`👑 ${target.name} 撐住了霸王色，改為受到 3 倍傷害！`); return { damage: d, meta: { haoshoku: true, bossExec: true } }; }
        log(`👑 霸王色的威壓讓 ${target.name} 當場失去意識！`); return { damage: target.hp, meta: { haoshoku: true, execute: true, ignoreShield: true } };
      }
      return { damage: 0, meta: { haoshoku: true } };
    }
    /* 痛苦泡泡：依自身已損失體力造成傷害 */
    if (ef.selfLostHpDamage) {
      if (target.voidImmune) { log(`👑 ${target.name} 不受比例傷害影響！`); return { damage: 0, meta: {} }; }
      const [m, cap] = ef.selfLostHpDamage; let d = Math.max(1, Math.round((actor.maxHp - actor.hp) * m)); d = Math.min(d, Math.floor(target.maxHp * cap));
      if (isBossTarget(target)) d = Math.min(d, Math.floor(target.maxHp * (GAME_SETTINGS.bossPctCap ?? .15)));
      log(`💢 ${actor.name} 把承受過的痛苦打了回去！`); return { damage: d, meta: {} };
    }
    if (ef.shieldBreak && target.status.shield > 0 && !target.voidImmune) { log(`🌊 震動穿透！${target.name} 的護盾失效了！`); target.status.shield = 0; target.status.tempShield = 0; }
    const frozen = (target.status.freeze || 0) > 0, hpR = target.hp / target.maxHp, selfR = actor.hp / actor.maxHp;
    const r = _cso(actor, target, { ...skill, __ext: true }, blocked); r.meta = r.meta || {};
    if (r.damage > 0 && !r.meta.execute && !r.meta.executeBuff) {
      if (ef.hpAboveBonus && hpR > ef.hpAboveBonus[0]) { const [a, b] = ef.hpAboveBonus[1], m = Math.round((a + Math.random() * (b - a)) * 10) / 10; r.damage = Math.floor(r.damage * m); log(`💥 對手體力充沛，威力 ×${m}！`); }
      if (ef.frozenBonusMult && frozen) { const [a, b] = ef.frozenBonusMult, m = Math.round((a + Math.random() * (b - a)) * 10) / 10; r.damage = Math.floor(r.damage * m); log(`❄️ 對手已被冰凍，傷害 ×${m}！`); }
      if (ef.selfHpAboveExtra && selfR > ef.selfHpAboveExtra[0]) { const [, [a, b], pw] = ef.selfHpAboveExtra, n = a + Math.floor(Math.random() * (b - a + 1)); let x = 0; for (let i = 0; i < n; i++) x += calcAttackDamage(actor, target, { type: 'attack', power: pw }); r.damage += x; r.meta.hitCount = (r.meta.hitCount || 0) + n; log(`⚔️ 氣勢正盛，追加 ${n} 次斬擊！`); }
      if (ef.trueHitChance && target.status.shield > 0) { const n = r.meta.hitCount || 1, k = binom(n, ef.trueHitChance); if (k) { r.meta.trueDamage = Math.floor(r.damage * k / n); log(`🗡️ ${k} 次斬擊穿過了護盾！`); } }
      /* 老爹光環：首次攻擊 1～5 倍 */
      if (actor.__dad && actor.__dad.first && skill.type === 'attack') { actor.__dad.first = false; const m = Math.round((1 + Math.random() * 4) * 10) / 10; r.damage = Math.floor(r.damage * m); log(`🌊 老爹的意志！首次攻擊 ×${m}！`); }
      /* 神避之後的吸血 */
      if (actor.status.kamuLs > 0) { const ls = Math.floor(r.damage * (.05 + Math.random() * .1)); r.meta.lifesteal = (r.meta.lifesteal || 0) + ls; }
    }
    if (ef.kamusari && r.damage > 0) { const ls = Math.floor(Math.min(r.damage, target.hp + (target.status.shield || 0)) * (.05 + Math.random() * .1)); r.meta.lifesteal = (r.meta.lifesteal || 0) + ls; }
    return r;
  };

  /* ---------- 傷害套用：真實傷害、老爹光環的受傷加成與保命 ---------- */
  const _ad = applyDamage;
  applyDamage = function (target, amount, side, opts) {
    if (target.status && target.status.dadOwner) amount = Math.round(amount * 1.03);
    const tru = opts && opts.trueDamage > 0 && target.status.shield > 0 ? Math.min(amount, opts.trueDamage) : 0;
    if (tru) { _ad(target, tru, side, { ...opts, ignoreShield: true, trueDamage: 0 }); amount -= tru; }
    if (amount > 0) _ad(target, amount, side, opts);
    if (target.hp <= 0 && target.__dad && target.__dad.guts) { target.__dad.guts = false; target.hp = 1; log(`🌊 老爹守護著 ${target.name}！撐住了致命一擊，剩下 1 體力！`); if (typeof floatText === 'function') floatText(side, '撐住', 'status'); renderHUD(); }
  };

  /* ---------- 附加效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    _ase(actor, target, skill, result);
    if (skill.__voidFx) return; const ef = skill.effect || {};
    if (ef.restoreAllPP) { actor.skills.forEach(s => { if (s !== skill && !(skill && s.name === skill.name) && !s.locked) s.pp = s.maxPP; }); /* v160：技能是複本時（即時對戰、模擬）也不能恢復自己 */ log(`🔄 ${actor.name} 的其他技能次數全部恢復！`); if (typeof renderSkills === 'function' && actor === battle.player) renderSkills(); }
    if (ef.immuneTurns && !ef.regenTurns) { actor.status.immune = Math.max(actor.status.immune || 0, ef.immuneTurns); log(`🛡️ ${actor.name} ${ef.immuneTurns} 回合內免疫異常狀態！`); }
    if (ef.stunChance && target.hp > 0 && Math.random() < ef.stunChance) inflict(target, 'stun', ef.stunTurns || 1);
    if (ef.haoshoku) haoshoku(actor, target);
    if (ef.dadAura) dadAura(actor);
    if (ef.kamusari) {
      actor.status.kamuLs = 2; log(`🩸 ${actor.name} 接下來 2 回合造成的傷害會轉為體力！`);
      if (target.hp > 0 && Math.random() < .3) { inflict(target, 'stun', 1); if (inflict(target, 'weak', 2)) { target.status.weakMin = 1.2; target.status.weakMax = 1.5; } inflict(target, 'fear', 1); }
      if (target.hp <= 0) { target.status.stun = Math.max(target.status.stun || 0, 1); battle.__nextFoeStun = sideOf(target); log('💫 神避的餘威：下一位出場的對手會暈眩 1 回合！'); }
    }
    if (ef.iceAge) { const [t, ratio] = ef.iceAge; battle.iceAge = { owner: actor, left: t, ratio }; actor.status.damageReductionTurns = Math.max(actor.status.damageReductionTurns || 0, t); actor.status.damageReductionValue = Math.max(actor.status.damageReductionValue || 0, .2); log(`🧊 冰河時期！整片戰場都結冰了！`); }
  };
  function revertForm(t) {
    let did = false; const st = t.status;
    if (st.formTurns > 0) { st.formTurns = 0; did = true; }
    if (st.phoenix > 0) { st.phoenix = 0; st.counterChance = 0; if (st.phoenixSpd) { t.buffs.spd = clamp(t.buffs.spd - st.phoenixSpd, -6, 6); st.phoenixSpd = 0; } did = true; }
    if (st.awaken) { st.awaken = ''; st.frostBoostTurns = 0; st.allyBoostPer = 0; st.allyAliveBoost = 0; st.damageMultTurns = 0; st.damageMultValue = 1; did = true; }
    if (did && t.baseImage) { t.image = t.baseImage; t.visMul = 1; t.mirror = false; if (typeof refreshFighterImage === 'function') refreshFighterImage(t); }
    return did;
  }
  function haoshoku(actor, target) {
    clearAbnormal(actor); clearNegativeStages(actor); log(`👑 ${actor.name} 的霸王色霸氣席捲戰場！自身負面狀態全部消除。`);
    if (target.voidImmune || target.hp <= 0) return;
    ['atk', 'def', 'spd'].forEach(k => { target.buffs[k] = clamp(target.buffs[k] - 2, -6, 6); }); log(`👑 ${target.name} 全能力 -2！`);
    if (revertForm(target)) log(`👑 ${target.name} 的變身被強制解除了！`);
    if (inflict(target, 'weak', 1, true)) { target.status.weakMin = 1.2; target.status.weakMax = 1.5; }
    if (RANK[rarOf(target)] <= 2) { target.status.skipAttack = Math.max(target.status.skipAttack || 0, 1); log(`👑 ${target.name} 被震懾得無法攻擊 1 回合！`); }
  }
  function grantDad(f) { if (!f || f.__dad || f.hp <= 0) return; f.__dad = { first: true, guts: true }; ['atk', 'def', 'spd'].forEach(k => { f.buffs[k] = clamp(f.buffs[k] + 1, -6, 6); }); log(`🌊 ${f.name} 感受到老爹的意志：全能力 +1！`); }
  window.grantDad = grantDad;
  function dadAura(actor) {
    actor.status.dadOwner = true; log(`🌊 「你們都是我的兒子！」白鬍子的意志籠罩全隊！`);
    if (actor === battle.enemy) grantDad(actor); else { battle.dadTeam = true; battle.team.forEach(f => { if (f === battle.player) grantDad(f); else if (f.hp > 0) f.__dadPending = true; }); }
  }

  /* ---------- 換人：光環與神避的暈眩 ---------- */
  const _sw = doSwitch;
  doSwitch = function (i) {
    _sw(i); const f = battle.player;
    if (f.__dadPending) { f.__dadPending = false; grantDad(f); }
    if (battle.__nextFoeStun === 'L') { battle.__nextFoeStun = null; inflict(f, 'stun', 1, true); }
    renderHUD();
  };

  /* ---------- 回合結束：老爹回復、神避吸血倒數、冰河時期 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    _ets(c); if (!battle || !c) return;
    if (c.status.dadOwner && c.hp > 0 && healOk(c)) { const h = Math.max(1, Math.floor(c.maxHp * .05)); c.hp = Math.min(c.maxHp, c.hp + h); showHeal(sideOf(c), h); log(`🌊 ${c.name} 回復 ${h} 體力`); }
    if (c.status.kamuLs > 0) c.status.kamuLs--;
    const I = battle.iceAge;
    if (I) {
      if (I.owner.hp <= 0) { battle.iceAge = null; log('🧊 冰河融化了。'); return; }
      const ownerSide = battle.team.includes(I.owner) ? 'L' : 'R', side = sideOf(c);
      if (c === I.owner) { if (--I.left <= 0) { battle.iceAge = null; log('🧊 冰河時期結束，冰原開始融化。'); } }
      else if (side !== ownerSide && c.hp > 0 && !c.voidImmune) { let d = Math.max(1, Math.floor(c.maxHp * I.ratio)); c.hp = Math.max(0, c.hp - d); showDamage(side, d, '#9fe6ff'); log(`🧊 ${c.name} 被冰河凍傷，損失 ${d} 體力！`); if (c.hp > 0 && Math.random() < .35) inflict(c, 'freeze', 1); } /* v210：冰凍改成無法行動，冰河時期每回合 35% 機率冰凍 */
    }
  };

  /* ---------- 開戰：連戰時把「神避」的暈眩帶到下一場；支援帶入技能次數 ---------- */
  const _sb = startBattle;
  startBattle = function (opts) {
    _sb(opts);
    /* 玩家對戰：對手也套用稀有度體質，雙方條件相同 */ if (opts && opts.pvp) { applyRarityScale(battle.enemy); $('bLvR').textContent = 'LV ' + battle.enemy.level; renderHUD(true); }
    if (opts && opts.enemyMod) { const e = battle.enemy, M = opts.enemyMod; if (M.hp) { e.maxHp = Math.round(e.maxHp * M.hp); e.hp = e.maxHp; } if (M.dmg) e.dmgMul *= M.dmg; if (M.hpFixed) { e.maxHp = M.hpFixed; e.hp = e.maxHp; } if (M.infPP) e.skills.forEach(s => { if (s.locked) return; const n = s.ultimate && M.ultCap ? M.ultCap : 99; s.pp = s.maxPP = n; }); if (M.allUp) ['atk', 'def', 'spd'].forEach(k => { e.buffs[k] = clamp(e.buffs[k] + M.allUp, -6, 6); }); ['atk', 'def', 'spd'].forEach(k => { if (M[k]) e.buffs[k] = clamp(e.buffs[k] + M[k], -6, 6); }); if (M.name) e.name = M.name; if (M.title) e.title = M.title; if (M.lv) e.level = M.lv; $('bNameR').textContent = e.name; $('bTitleR').textContent = e.title; renderHUD(true); }
    if (opts && opts.team) opts.team.forEach((t, i) => { const f = battle.team[i]; if (f && Array.isArray(t.pp)) f.skills.forEach((s, k) => { if (t.pp[k] != null && !s.locked) s.pp = Math.max(0, Math.min(s.maxPP, t.pp[k])); }); });
    if (window.__carryStun) { window.__carryStun = false; inflict(battle.enemy, 'stun', 1, true); }
    renderSkills();
  };
  /* 戰鬥結束時把技能次數一起回報，讓連戰模式可以延續 */
  window.teamSnapshot = () => battle ? battle.team.map(f => ({ id: f.id, hp: f.hp, pp: f.skills.map(s => s.pp) })) : [];
})();

/* ==== 原 js/ext_v102.js ==== */
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

/* ==== 原 js/ext_v109.js ==== */
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

/* ==== 原 js/ext_v110.js ==== */
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

/* ==== 原 js/ext_v115.js ==== */
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

/* ==== 原 js/ext_v118.js ==== */
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

/* ==== 原 js/ext_v121.js ==== */
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

/* ==== 原 js/ext_v142.js ==== */
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

/* ==== 原 js/ext_v128.js ==== */
/* v128 戰鬥擴充：凱多的龍人型態（效果 kaidoDragon { image, scale, label }）。載入順序：ext_v121.js 之後。
   - 只要第 5 招真的使用出去（扣了 PP，不論打中、落空或被閃避），凱多仍活著 → 化為龍人型態。
   - 不使用 formTurns：回合結束不會倒數恢復，紅髮的霸王色（revertForm）也不會解除；只有倒下（體力歸 0）才恢復原本立繪。
   - 戰鬥結束後角色會重新建立，自然回到原本立繪。
   kaidoDragonOn(f) / kaidoDragonOff(f)：只改角色狀態並更新立繪，battle.js（executeAction 包裝，見 fx_v128.js 的雷光演出）與 live.js 共用。 */
(function () {
  const vo = id => (typeof visualOverride === 'function' ? visualOverride('form:' + id) : null);
  const refresh = f => { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); };
  window.kaidoDragonOn = function (f, silent) {
    const sk = f && f.skills && f.skills.find(s => s.effect && s.effect.kaidoDragon), D = sk && sk.effect.kaidoDragon;
    if (!D || f.hp <= 0 || f.status.kaidoDragon) return false;
    if (!f.baseImage) f.baseImage = f.image;
    f.image = D.image; const VO = vo(f.id); f.visMul = (VO && VO.battleScale) || D.scale || 1; f.mirror = VO && VO.faceLeft !== undefined ? VO.faceLeft : !!D.mirror;
    f.status.kaidoDragon = true;
    if (!silent) refresh(f);
    if (typeof log === 'function') log(`🐉 ${f.name} 化為${D.label || '龍人型態'}！`);
    return true;
  };
  window.kaidoDragonOff = function (f) {
    if (!f || !f.status || !f.status.kaidoDragon) return false;
    f.status.kaidoDragon = false;
    if (f.baseImage) f.image = f.baseImage; f.visMul = 1; f.mirror = false; refresh(f);
    return true;
  };
  /* 倒下就恢復原本立繪 */
  if (typeof applyDamage === 'function') {
    const _ad = applyDamage;
    applyDamage = function (target) { const r = _ad.apply(this, arguments); if (target && target.hp <= 0) kaidoDragonOff(target); return r; };
  }
  if (typeof checkBattleEnd === 'function') {
    const _cbe = checkBattleEnd;
    checkBattleEnd = function () { try { const b = typeof battle !== 'undefined' && battle; if (b) [b.player, b.enemy].concat(b.team || []).forEach(f => { if (f && f.hp <= 0) kaidoDragonOff(f); }); } catch (e) { } return _cbe.apply(this, arguments); };
  }
  /* 第 5 招使用後變身：包住 executeAction（battle.js），招式演出結束後才播雷光並換圖 */
  if (typeof executeAction === 'function') {
    const _ea = executeAction;
    executeAction = async function (side, idx) {
      const actor = typeof battle !== 'undefined' && battle ? (side === 'P' ? battle.player : battle.enemy) : null;
      const skill = actor && idx !== -1 ? actor.skills[idx] : null, D = skill && skill.effect && skill.effect.kaidoDragon;
      if (!D) return _ea.apply(this, arguments);
      const mark = {}, prev = actor.status.lastSkill; actor.status.lastSkill = mark;
      const r = await _ea.apply(this, arguments);
      const used = actor.status.lastSkill === skill.name;
      if (actor.status.lastSkill === mark) actor.status.lastSkill = prev;
      if (used && actor.hp > 0 && !actor.status.kaidoDragon && battle && (battle.player === actor || battle.enemy === actor)) {
        const S = battle.player === actor ? 'L' : 'R';
        if (typeof kaidoDragonFx === 'function') { try { await kaidoDragonFx(S, actor, () => kaidoDragonOn(actor)); } catch (e) { console.warn(e); kaidoDragonOn(actor); } }
        else kaidoDragonOn(actor);
        if (typeof renderHUD === 'function') renderHUD();
      }
      return r;
    };
  }
})();

/* ==== 原 js/ext_v129.js ==== */
/* v129 戰鬥擴充：洛克斯的技能效果。載入順序：ext_v128.js 之後（最外層包裝）。
   rocksTrue（蝕）：出招這一下暫時無視對手的護盾、正向能力等級、減傷、無敵、閃避、反彈、荊棘、替身——打完後恢復原狀（只是這一擊看不見它們）。
   rocksShun [a,b]（瞬）：先制、無敵 1 回合、回復 20%（基本效果）；再進入「秒殺威壓」：下回合攻擊有 a～b 機率秒殺（沿用 executeBuff，BOSS 自動改為 3 倍傷害）。
   rocksKill（殺）：無法被抵擋或無效化。對手稀有度 < SSR 直接秒殺；≥ SSR 有 50% 秒殺、50% 扣除當下體力一半（BOSS：秒殺改 3 倍傷害、扣血最多 bossPctCap）。
   rocksStore n（蓄）：第一次使用開始記錄我方受到的傷害（n 回合內有效）；第二次使用把記錄的傷害無視護盾奉還。超過 n 回合才再用就失敗。
   rocksSecret（戴維的秘密）：隨機 picks 個技能各恢復 restore 次；之後體力低於 guard[0]（含倒下）時回復 guard[1]，下回合攻擊 mult 倍（每次使用 1 次）；
     fearTurns 回合內秒殺對手 → 對手下一位出場角色恐懼（無法使用技能）。
   rocksPre(actor, target, skill) / rocksPost(token)：出招前後的「無視」處理，battle.js（包住 executeAction）、live.js（act）、tests/duel-sim.js 共用。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const R = (a, b) => a + Math.random() * (b - a);
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const sideOf = f => { const b = B(); if (!b) return 'R'; if (typeof b.sideOf === 'function') return b.sideOf(f); /* 即時對戰：雙方輪流當 player，改用隊伍判斷 */ return f === b.player || (b.team || []).includes(f) ? 'L' : 'R'; };
  const scrSide = f => { const b = B(); return b && f === b.player ? 'L' : 'R'; }; /* 畫面上的左右（浮字、回復數字用） */
  const isBossFoe = t => { const b = B(); return !!(b && b.isBoss && t === b.enemy && !t.voidImmune); };
  const capOf = t => Math.floor(t.maxHp * ((typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.bossPctCap) ?? .15));
  const rarIdx = t => { const O = window.RAR_ORDER || ['C', 'U', 'R', 'RR', 'RRR', 'SR', 'SSR', 'UR', 'UR+', 'UR++']; const r = (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[t.id]) || 'SR'; const i = O.indexOf(r); return i < 0 ? (r === 'UR++' ? O.length : -1) : i; }; /* v130：N 等不在順序表裡的稀有度視為最低 */
  const ssrIdx = () => (window.RAR_ORDER || []).indexOf('SSR');
  const say = (S, t, k) => { try { if (typeof floatText === 'function') floatText(S, t, k || 'status'); } catch (e) { } };

  /* ---------- 出招前後：無視 ---------- */
  const TGT = ['invuln', 'dodge', 'reflect', 'thornTurns', 'damageReductionTurns', 'damageReductionValue', 'shield', 'decoys', 'immune'];
  window.rocksPre = function (actor, target, skill) {
    const ef = (skill && skill.effect) || {}; if (!actor || !target || !(ef.rocksTrue || ef.rocksKill || ef.rocksShun)) return null;
    const tok = { actor, target, st: {}, buffs: {}, setDR: target.setDR, nul: actor.status.skillNullify, dispel: !!ef.clearBuffs }; /* v157：蝕帶有驅散時，出招後不還原對手的能力提升 */
    actor.status.skillNullify = 0; /* 無法被無效化（效果也不會被封印） */
    if (ef.rocksTrue || ef.rocksKill) {
      TGT.forEach(k => { tok.st[k] = target.status[k]; if (k !== 'damageReductionValue') target.status[k] = 0; });
      target.status.damageReductionValue = 0; target.setDR = 0;
      if (ef.rocksTrue) ['atk', 'def', 'spd'].forEach(k => { tok.buffs[k] = target.buffs[k]; if (target.buffs[k] > 0) target.buffs[k] = 0; });
    }
    return tok;
  };
  /* 連戰的「迎戰下一位」：上一場洛克斯秒殺了敵人 → 下一場的敵人開場恐懼 */
  window.rocksFearCarry = () => { const b = B(); if (b && b.__carryFearNext) window.__carryFear = 1; };
  window.rocksPost = function (tok) {
    if (!tok) return; const { actor, target } = tok;
    if (actor.status.skillNullify === 0 && tok.nul) actor.status.skillNullify = tok.nul;
    Object.keys(tok.st).forEach(k => { target.status[k] = tok.st[k]; }); if (tok.setDR !== undefined) target.setDR = tok.setDR;
    if (!tok.dispel) Object.keys(tok.buffs).forEach(k => { if (target.buffs[k] === 0 && tok.buffs[k] > 0) target.buffs[k] = tok.buffs[k]; });
  };

  /* ---------- 傷害計算 ---------- */
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const ef = (skill && skill.effect) || {};
    if (ef.rocksKill && target && !skill.__rk) {
      const RK = typeof ef.rocksKill === 'object' ? ef.rocksKill : {}, low = rarIdx(target) < ssrIdx(), p = low ? 1 : (RK.p || .5); /* v159：秒殺機率、扣血比例可設定 */
      /* 交給基本計算處理「秒殺」：BOSS 3 倍傷害、古代巨人族意志、免疫秒殺等既有規則都會套用 */
      const lg = window.log; window.log = (...a) => { if (!/倍率 x0/.test(String(a[0]))) lg(...a); }; /* 借用的倍率計算會印出「倍率 x0.0」，不顯示 */
      let r; try { r = _cso.call(this, actor, target, { ...skill, __rk: true, effect: { randomMultiplierRange: [.01, .01], executeChance: p } }, false) || { damage: 0, meta: {} }; } finally { window.log = lg; }
      r.meta = r.meta || {};
      if (!r.meta.execute && !r.meta.executeBuff && !r.meta.bossExec && (!low || r.damage < 2)) {
        if (target.voidImmune) { r.damage = 0; log(`👑 ${target.name} 不受比例傷害影響！`); }
        else { let d = Math.max(1, Math.floor(target.hp * (RK.cut || .5))); if (isBossFoe(target)) d = Math.min(d, capOf(target)); r.damage = d; log(`🗡️ 殺：${target.name} 被奪去${(RK.cut || .5) === .5 ? '一半' : Math.round((RK.cut || .5) * 100) + '%'}的體力！`); }
      }
      if (r.meta.execute || r.meta.executeBuff) actor.__rocksExec = true;
      return r;
    }
    const r = _cso.apply(this, arguments);
    if (r && r.meta && (r.meta.execute || r.meta.executeBuff) && actor && actor.status && actor.status.rocksFearTurns > 0) actor.__rocksExec = true;
    if (r && ef.rocksTrue && target && r.damage > 0 && !r.meta.execute) log(`🌑 蝕：無視一切防禦，對 ${target.name} 造成真實傷害！`);
    return r;
  };

  /* 蓄的有效期間：用戰鬥回合數計算（洛克斯換下場時也照樣倒數）。使用當回合＝第 0 回合，之後 n 回合內有效 */
  const storeOn = st => !!st && st.on !== false && (((B() && B().round) || 1) - (st.r0 || 1)) <= (st.n || 5);
  /* ---------- 技能附加效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    _ase.apply(this, arguments); const ef = (skill && skill.effect) || {}; if (!actor || skill.__voidFx) return;
    if (ef.rocksShun) { const c = Math.round(R(ef.rocksShun[0], ef.rocksShun[1]) * 100) / 100; actor.status.executeBuffTurns = 2; actor.status.executeBuffChance = c; log(`⚡ 瞬：${actor.name} 下回合攻擊有 ${Math.round(c * 100)}% 機率直接秒殺！`); }
    if (ef.rocksStore) {
      const st = actor.status.rocksStore;
      if (!st) { actor.status.rocksStore = { dmg: 0, n: ef.rocksStore, r0: (B() && B().round) || 1, side: sideOf(actor), on: true }; log(`🌀 蓄：${actor.name} 開始記錄敵人造成的傷害（${ef.rocksStore} 回合內有效）`); say(scrSide(actor), '蓄力'); }
      else {
        actor.status.rocksStore = null;
        if (!storeOn(st)) { log(`🌀 蓄：已經超過 ${st.n || ef.rocksStore} 回合，累積的力量消散了……`); say(scrSide(actor), '失敗', 'miss'); }
        else if (target && target.hp > 0 && st.dmg > 0) { const d = Math.round(st.dmg * (ef.rocksStoreMult || 1)); /* v159：奉還倍率 */ log(`🌀 蓄：把累積的 ${d} 點傷害全數奉還給 ${target.name}！`); applyDamage(target, d, scrSide(target), { ignoreShield: true }); }
        else log('🌀 蓄：沒有累積到傷害。');
      }
    }
    if (ef.rocksSecret) {
      const X = ef.rocksSecret, pool = actor.skills.map((s, i) => ({ s, i })).filter(x => !x.s.ultimate && !x.s.locked && x.s.maxPP > 0);
      const lack = pool.filter(x => x.s.pp < x.s.maxPP), src = (lack.length >= (X.picks || 2) ? lack : pool).slice();
      const got = []; for (let k = 0; k < (X.picks || 2) && src.length; k++) { const j = Math.floor(Math.random() * src.length), x = src.splice(j, 1)[0]; x.s.pp = Math.min(x.s.maxPP, x.s.pp + (X.restore || 2)); got.push(x.s.name); }
      actor.status.rocksGuard = { at: X.guard[0], heal: X.guard[1], mult: X.mult };
      actor.status.rocksFearTurns = (X.fearTurns || 3) + 1; /* 本回合結束時會先減 1 */
      log(`🏴‍☠️ 戴維的秘密！${actor.name} 全能力 +2、體力全滿；「${got.join('」「')}」各恢復 ${X.restore || 2} 次。`);
      if (typeof renderSkills === 'function') try { renderSkills(); } catch (e) { }
    }
  };

  /* ---------- 受到傷害：蓄的記錄、戴維的保命 ---------- */
  function guard(f) {
    const G = f && f.status && f.status.rocksGuard; if (!G || f.hp >= f.maxHp * G.at || f.status.dominated) return false;
    f.status.rocksGuard = null; f.hp = Math.min(f.maxHp, Math.max(0, f.hp) + Math.round(f.maxHp * G.heal));
    f.status.nextAttackMultValue = Math.round(R(G.mult[0], G.mult[1]) * 10) / 10; f.status.nextAttackMultTurns = 2;
    log(`🏴‍☠️ 戴維的秘密：${f.name} 在瀕死邊緣站了回來（+${Math.round(G.heal * 100)}% 體力），下回合攻擊傷害 ×${f.status.nextAttackMultValue}！`);
    try { if (typeof showHeal === 'function') showHeal(scrSide(f), Math.round(f.maxHp * G.heal)); if (typeof banner === 'function') banner('戴維的秘密', scrSide(f) === 'L' ? 'me' : 'boss'); } catch (e) { }
    return true;
  }
  if (typeof applyDamage === 'function') {
    const _ad = applyDamage;
    applyDamage = function (target) {
      const before = target ? target.hp : 0, r = _ad.apply(this, arguments), b = B();
      if (target && b) {
        const lost = Math.max(0, before - target.hp);
        if (lost > 0) new Set([b.player, b.enemy].concat(b.team || [])).forEach(f => { const st = f && f.status && f.status.rocksStore; if (st && storeOn(st) && f.hp > 0 && sideOf(target) === st.side) st.dmg += lost; });
        guard(target);
      }
      return r;
    };
  }
  /* 回合結束：蓄的有效回合、恐懼的有效回合 */
  if (typeof endTurnStatus === 'function') {
    const _ets = endTurnStatus;
    endTurnStatus = function (c) {
      const r = _ets.apply(this, arguments); if (!c || !c.status) return r;
      if (c.status.rocksFearTurns > 0) c.status.rocksFearTurns--;
      if (c.hp <= 0) guard(c); /* 持續傷害倒下時也會觸發保命 */
      return r;
    };
  }
  if (typeof checkBattleEnd === 'function') {
    const _cbe = checkBattleEnd;
    checkBattleEnd = function () {
      const b = B(); if (b) [b.player, b.enemy].forEach(f => { if (f && f.hp <= 0) guard(f); });
      const r = _cbe.apply(this, arguments);
      if (b && b.__fearCand) { const v = b.__fearCand; b.__fearCand = null;
        if (v.hp <= 0) { log('😱 洛克斯的威壓！對手下一位出場的角色會陷入恐懼，無法攻擊！'); if (v === b.player || (b.team || []).includes(v)) b.__nextFoeFear = 'L'; else b.__carryFearNext = true; } }
      return r;
    };
  }

  /* ---------- 出招：無視處理＋秒殺後的恐懼 ---------- */
  /* 秒殺後的恐懼：先記下候選，等 checkBattleEnd 處理完復活（美音魔王、不死鳥、命數等）仍然倒下才成立。
     我方倒下 → 下一位換上場的角色恐懼（doSwitch）；敵方倒下 → 連戰的下一場（emperor.js／rocks_v129.js 的「下一位」才帶過去，見 rocksFearCarry）。 */
  function fearNext(victim) { const b = B(); if (b) b.__fearCand = victim; }
  if (typeof executeAction === 'function') {
    const _ea = executeAction;
    executeAction = async function (side, idx) {
      const b = B(), actor = b ? (side === 'P' ? b.player : b.enemy) : null, target = b ? (side === 'P' ? b.enemy : b.player) : null;
      const skill = actor && idx !== -1 ? actor.skills[idx] : null;
      if (actor) actor.__rocksExec = false;
      const tok = skill ? rocksPre(actor, target, skill) : null;
      let r; try { r = await _ea.apply(this, arguments); } finally { rocksPost(tok); }
      if (actor && actor.__rocksExec && actor.status.rocksFearTurns > 0 && target && target.hp <= 0) fearNext(target);
      if (actor) actor.__rocksExec = false;
      return r;
    };
  }
  if (typeof doSwitch === 'function') {
    const _sw = doSwitch;
    doSwitch = function () { const r = _sw.apply(this, arguments); const b = B(); if (b && b.__nextFoeFear === 'L') { b.__nextFoeFear = null; inflict(b.player, 'fear', 1, true); try { renderHUD(); } catch (e) { } } return r; };
  }
  if (typeof startBattle === 'function') {
    const _sb = startBattle;
    startBattle = function () { const r = _sb.apply(this, arguments); document.querySelectorAll('#battleScreen .kd-dim.on').forEach(x => x.classList.remove('on')); const t = window.__carryFear; window.__carryFear = 0; if (t && B()) { inflict(B().enemy, 'fear', 1, true); log(`😱 ${B().enemy.name} 被洛克斯的威壓震懾，陷入恐懼！`); try { renderHUD(true); } catch (e) { } } return r; };
  }
})();

/* ==== 原 js/ext_v152.js ==== */
/* v152 戰鬥擴充：神之騎士團（軍子、夏姆洛克）。載入順序：ext_v121.js 之後。
   fixedDot { turns, range:[a,b], label }：對手每回合受到 a～b 點（固定數值）的持續傷害；
   sureHit：這招必中，不會被閃避（battle.js 判定閃避時檢查）；
   lowHpBonus：對手體力越低傷害越高，最多 lowHpBonus 倍；
   gunkoAfter { wait, dr, turns, chance, mult:[a,b] }：wait 回合（無敵）結束後，turns 回合受到的傷害 -dr，而且受到傷害時 chance 機率以 a～b 倍反彈；
   bgCutin { image, ms, title, sub }：全畫面「霸氣」進場演出，接著那張圖當戰鬥背景停留約 ms 毫秒；
   cerberus { turns, regen, statUp, dmg:[a,b], fear, image, scale }：身後出現召喚獸（立繪後方的圖層，跟著角色的面向，鏡射），在場的每回合全能力 +statUp、
     恢復 regen 體力、對手受到 a～b 點傷害、fear 機率恐懼。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const R = (a, b) => a + Math.random() * (b - a), sideOf = f => (battle && f === battle.player) ? 'L' : 'R', other = f => (battle && f === battle.enemy) ? battle.player : battle.enemy;
  const isBossFoe = t => battle && battle.isBoss && t === battle.enemy, capOf = t => isBossFoe(t) ? Math.floor(t.maxHp * ((typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.bossPctCap) ?? .15)) : Infinity;
  const blocked = t => t.status.immune > 0 || t.status.immunePermanent;

  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, b) {
    const r = _cso.apply(this, arguments), ef = (skill && skill.effect) || {}; if (!r || !target) return r;
    if (ef.lowHpBonus && r.damage > 0 && !(r.meta && r.meta.execute)) { const k = 1 + (1 - Math.max(0, target.hp) / target.maxHp) * (ef.lowHpBonus - 1); if (k > 1.01) { r.damage = Math.floor(r.damage * k); log(`⚔ ${target.name} 越虛弱，斬擊越重！傷害 ×${k.toFixed(2)}`); } }
    return r;
  };
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    _ase.apply(this, arguments); const ef = (skill && skill.effect) || {}; if (!actor || skill.__voidFx) return;
    if (ef.fixedDot && target && target.hp > 0 && !blocked(target)) { const F = ef.fixedDot, seq = [], k = actor.__rs || 1, a = Math.round(F.range[0] * k), b = Math.round(F.range[1] * k); for (let i = 0; i < F.turns; i++) seq.push([a / target.maxHp, b / target.maxHp]); /* v156：玩家角色依體質倍率縮放（BOSS 不變） */
      target.status.dots.push({ turns: F.turns, sequence: seq, label: F.label || '持續傷害', index: 0 }); log(`🏹 ${target.name} 被${F.label || '箭矢'}纏住了！接下來 ${F.turns} 回合每回合受到 ${a}～${b} 點傷害`); }
    if (ef.gunkoAfter) { actor.status.gunkoAfter = Object.assign({}, ef.gunkoAfter, { left: ef.gunkoAfter.wait || 0 }); }
    if (ef.cerberus) { const C = ef.cerberus; actor.status.cerberus = Object.assign({}, C, { left: C.turns || 3 }); setSummon(actor, C.image, C.scale); log(`🐺 地獄三頭犬「塞博拉斯」出現在 ${actor.name} 身後！`); try { if (typeof banner === 'function') banner('地獄三頭犬', actor === battle.player ? 'me' : 'boss'); } catch (e) { } }
    if (ef.bgCutin && !ef.__cutDone) cutin(ef.bgCutin);
  };
  /* 回合結束：無敵結束後的減傷＋反彈、三頭犬每回合的效果 */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const r = _ets.apply(this, arguments); if (!c || !battle) return r; const st = c.status;
    const GA = st.gunkoAfter; if (GA && c.hp > 0) {
      if (GA.left > 0) { GA.left--; if (GA.left <= 0) { st.damageReductionTurns = Math.max(st.damageReductionTurns || 0, GA.turns); st.damageReductionValue = Math.max(st.damageReductionValue || 0, GA.dr); st.gunkoRef = GA.turns; log(`🛡️ 黑轉支配的無敵結束了——接下來 ${GA.turns} 回合受到的傷害 -${Math.round(GA.dr * 100)}%，受到攻擊時有 ${Math.round(GA.chance * 100)}% 機率反彈 ${GA.mult[0]}～${GA.mult[1]} 倍！`); } }
      else if (st.gunkoRef > 0) { st.gunkoRef--; if (st.gunkoRef <= 0) { st.gunkoAfter = null; log(`${c.name} 的黑轉支配餘威消散了。`); } }
    }
    const CB = st.cerberus; if (CB && CB.left > 0) {
      if (c.hp <= 0) { st.cerberus = null; setSummon(c, null); }
      else { const foe = other(c);
        if (CB.statUp && st.buffBlock <= 0) ['atk', 'def', 'spd'].forEach(k => { c.buffs[k] = clamp(c.buffs[k] + CB.statUp, -6, 6); });
        if (CB.atkUp && st.buffBlock <= 0) c.buffs.atk = clamp(c.buffs.atk + CB.atkUp, -6, 6);
        if (CB.regen && (typeof healOk !== 'function' || healOk(c))) { const h = Math.floor(c.maxHp * CB.regen); c.hp = Math.min(c.maxHp, c.hp + h); showHeal(sideOf(c), h); }
        if (foe && foe.hp > 0) { const d = Math.min(capOf(foe), Math.round(R(CB.dmg[0], CB.dmg[1]) * (c.__rs || 1))); foe.hp = Math.max(0, foe.hp - d); showDamage(sideOf(foe), d, '#ff5a3a'); if (CB.fear && Math.random() < CB.fear && typeof inflict === 'function') inflict(foe, 'fear', 1);
          log(`🐺 地獄三頭犬撲向 ${foe.name}，造成 ${d} 點傷害！${CB.atkUp ? `${c.name} 攻擊 +${CB.atkUp}` : CB.statUp ? `${c.name} 全能力 +${CB.statUp}` : ''}${CB.regen ? '、恢復體力' : ''}`); }
        CB.left--; if (CB.left <= 0) { st.cerberus = null; setSummon(c, null); log(`🐺 地獄三頭犬回到了黑暗之中。`); } }
    }
    return r;
  };
  /* 受到傷害時的機率反彈（黑轉支配後） */
  const _ad = applyDamage; let inRef = false;
  applyDamage = function (target, amount, side, opts) {
    const before = target ? target.hp : 0, r = _ad.apply(this, arguments);
    try { const st = target && target.status, GA = st && st.gunkoAfter;
      if (!inRef && GA && st.gunkoRef > 0 && target.hp > 0 && before > target.hp && Math.random() < GA.chance) { const foe = other(target); if (foe && foe.hp > 0) { const d = Math.min(capOf(foe), Math.round((before - target.hp) * R(GA.mult[0], GA.mult[1])));
        inRef = true; try { _ad(foe, d, sideOf(foe), { noRef: true }); } finally { inRef = false; } log(`↩️ ${target.name} 把 ${d} 點傷害反彈給 ${foe.name}！`); if (typeof floatText === 'function') floatText(sideOf(foe), '反彈', 'status'); } } } catch (e) { }
    return r;
  };

  /* ---------- 立繪後方的召喚圖層 ---------- */
  function setSummon(f, image, scale) {
    const el = document.getElementById('bF' + sideOf(f)); if (!el) return; let im = el.querySelector('.f-summon');
    if (!image) { if (im) { im.classList.add('out'); setTimeout(() => im.remove(), 700); } return; }
    if (!im) { im = document.createElement('img'); im.className = 'f-summon'; im.alt = ''; el.insertBefore(im, el.firstChild); }
    im.classList.remove('out'); im.src = image; el.style.setProperty('--ssr', (scale || 1.2) / (f.battleScale || 1) * .6); /* 和 11/03 確認的示意圖一樣：三頭犬約是本人高度的 1.1 倍 */
    im.classList.remove('in'); void im.offsetWidth; im.classList.add('in');
  }
  window.setSummon = setSummon;
  /* ---------- 黑轉支配：全畫面進場演出，接著當背景停留 ---------- */
  let lastCut = 0;
  function cutin(C) {
    if (Date.now() - lastCut < 3000) return; lastCut = Date.now(); /* v154：變身前播過就不再重播（技能效果拿到的 skill 物件是複本，__cutDone 標記不可靠） */
    const scr = document.getElementById('battleScreen'), bg = document.getElementById('bBg'); if (!scr || !bg) return;
    scr.querySelectorAll('.cut-bg,.cut-fx').forEach(e => e.remove());
    const fx = document.createElement('div'); fx.className = 'cut-fx'; fx.innerHTML = `<i class="cut-black"></i><svg class="cut-bolts" viewBox="0 0 100 56" preserveAspectRatio="none">${[[50, 0, 44, 14, 52, 22, 46, 34], [50, 0, 58, 12, 50, 20, 60, 30], [0, 20, 16, 24, 22, 18, 36, 26], [100, 18, 84, 26, 78, 20, 64, 28], [20, 56, 28, 44, 24, 38, 38, 34], [80, 56, 72, 44, 78, 38, 62, 34]].map(p => `<polyline points="${p.join(' ')}"/>`).join('')}</svg><i class="cut-flash"></i>`; /* v154：標題只用遊戲本來的奧義標題（fx_v111 ultTitle），不再自己疊一層，也先收掉技能名橫幅 */
    const bn = document.getElementById('bBanner'); if (bn) bn.classList.remove('show');
    const back = document.createElement('div'); back.className = 'cut-bg'; back.style.setProperty('--img', `url("${new URL(C.image, location.href).href}")`); /* 絕對網址：CSS 變數裡的相對路徑會以 css/ 為基準 */ back.innerHTML = '<i class="cut-img"></i><i class="cut-rgb"></i><i class="cut-vig"></i>';
    (document.getElementById('bGL') || bg).after(back); /* 3D 背景畫布在 #bBg 後面，要蓋在它上面 */ scr.appendChild(fx); scr.classList.add('cut-shake', 'cut-on');
    try { if (typeof AUDIO !== 'undefined' && AUDIO.sfx) AUDIO.sfx('boom'); } catch (e) { }
    setTimeout(() => scr.classList.remove('cut-shake'), 900); setTimeout(() => fx.remove(), 2100);
    const ms = C.ms || 4200; setTimeout(() => { back.classList.add('out'); scr.classList.remove('cut-on'); setTimeout(() => back.remove(), 800); }, ms);
  }
  window.gunkoCutin = cutin;
  /* 變身招式：在變身演出之前先播進場演出（等 1.2 秒讓標題打完） */
  const hookTF = () => { if (typeof window.transformFx !== 'function' || window.transformFx.__v152) return; const _tf = window.transformFx; window.transformFx = async function (side, actor, skill, stage) {
    const C = skill && skill.effect && skill.effect.bgCutin; if (C && stage === 'before') { cutin(C); skill.effect.__cutDone = true; await new Promise(r => setTimeout(r, 1200)); }
    if (C && stage !== 'before') skill.effect.__cutDone = false; return _tf.apply(this, arguments); }; window.transformFx.__v152 = true; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookTF); else hookTF();
  /* 新戰鬥開始時清掉上一場留下的圖層 */
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { document.querySelectorAll('.f-summon,.cut-bg,.cut-fx').forEach(e => e.remove()); const sc = document.getElementById('battleScreen'); if (sc) sc.classList.remove('cut-on'); return _sb.apply(this, arguments); }; }
})();
