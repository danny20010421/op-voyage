/* v160 四皇新機制（使用者 11/04 指定：六位四皇技能重新設計；設計文件 /root/promo/v160/emperors_design.md）。
   效果欄位（skill.effect）：
   mark { key, turns, label }：在對手身上留下印記（不是異常狀態，淨化解不掉；回合結束倒數）
   markBonus { key, mult, exec, consume }：對手有該印記時傷害 ×mult、秒殺機率 +exec；consume＝打完消除印記
   soulLock { turns, down, drain }：靈魂壓制——turns 回合內對手全能力至少 -down、每回合被奪走最大體力 drain（BOSS 減半）給施放者；
     任何淨化、解除負面、能力提升都解不掉（出招前後、回合結束都重新壓回去）；同時算一個 soul 印記
   drainBuffs：奪走對手的能力提升加到自己身上｜invertBuffs：對手的能力提升反轉成等量下降｜flipDebuffs：解除自身異常，並把能力下降反轉成提升
   dmgToHeal { turns, ratio }：受到傷害後回復該傷害的 ratio｜reflectDebuff { turns }：對手施加的異常狀態與能力下降轉回對手身上
   lastStand { ratio, charges }：致命傷時保住 ratio 體力｜shieldToDmg：傷害 + 自身護盾 × 比例
   dragonBoost { dmg, dr, regen, guard }：凱多第 5 招之後（龍人型態）其他招式傷害 ×dmg、受到傷害 -dr、每回合回復 regen，並獲得 guard 的致命傷保命
   window.__aiW160(actor, target, skill)：AI 權重（battle_core.js pickEnemySkill 與 tests/*-sim.js 共用）。
   載入順序：所有 ext_*.js 與 battle_core.js 之後（index.html 在 balance_v160.js 前）。 */
(function () {
  if (typeof computeSkillOutcome !== 'function') return;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const other = f => { const b = B(); if (!b) return null; return f === b.enemy ? b.player : b.enemy; };
  const sideOf = f => { const b = B(); return b && f === b.player ? 'L' : 'R'; };
  const isBossFoe = t => { const b = B(); return !!(b && b.isBoss && t === b.enemy); };
  const L = m => { try { log(m); } catch (e) { } };
  const marks = f => (f.status.__marks = f.status.__marks || {});
  const hasMark = (f, k) => !!(f && f.status && f.status.__marks && f.status.__marks[k] > 0);
  const STAGES = ['atk', 'def', 'spd'];

  function enforceLock(f) {
    const Lk = f && f.status && f.status.__soulLock; if (!Lk || Lk.turns <= 0) return;
    STAGES.forEach(k => { if (f.buffs[k] > -Lk.down) f.buffs[k] = -Lk.down; });
    marks(f).soul = Math.max(marks(f).soul || 0, Lk.turns);
  }
  window.enforceSoulLock160 = enforceLock;

  /* ---------- 傷害計算 ---------- */
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    if (!actor || !target || !skill) return _cso.apply(this, arguments);
    enforceLock(actor); enforceLock(target);
    const ef = skill.effect || {}; let sk = skill, MB = null;
    if (ef.markBonus && hasMark(target, ef.markBonus.key)) {
      MB = ef.markBonus;
      if (MB.exec) { sk = JSON.parse(JSON.stringify(skill)); sk.effect.executeChance = (sk.effect.executeChance || 0) + MB.exec; }
    }
    const r = _cso.call(this, actor, target, sk, blocked);
    if (!r) return r; r.meta = r.meta || {};
    if (MB) {
      if (r.damage > 0 && !r.meta.execute && MB.mult && MB.mult !== 1) { r.damage = Math.floor(r.damage * MB.mult); }
      L(`👁 ${target.name} 身上的「${MB.label || '印記'}」發動！${MB.mult && MB.mult !== 1 ? `傷害 ×${MB.mult}` : ''}${MB.exec ? `、秒殺機率 +${Math.round(MB.exec * 100)}%` : ''}`);
      if (MB.consume && target.status.__marks) { target.status.__marks[MB.key] = 0; L(`👁 「${MB.label || '印記'}」消失了。`); }
    }
    if (ef.shieldToDmg && r.damage > 0 && !r.meta.execute && actor.status.shield > 0) { const add = Math.round(actor.status.shield * ef.shieldToDmg); r.damage += add; L(`🌊 ${actor.name} 的護盾化為震動：傷害 +${add}！`); }
    const DB = actor.status.__dragon; if (DB && !skill.ultimate && r.damage > 0 && !r.meta.execute && DB.dmg > 1) { r.damage = Math.floor(r.damage * DB.dmg); L(`🐉 龍人型態加成：傷害 ×${DB.dmg}！`); }
    return r;
  };

  /* ---------- 技能效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const ef = (skill && skill.effect) || {};
    /* 闇穴道：對手對「我」施加的負面效果反彈回去（target 是有反彈狀態的一方） */
    const RD = target && target.status && target.status.__reflectDebuff > 0 && actor !== target;
    const snap = RD ? { st: JSON.parse(JSON.stringify(target.status)), b: Object.assign({}, target.buffs) } : null;
    const r = _ase.apply(this, arguments);
    if (!actor || !skill) return r;
    if (snap && target.hp > 0) {
      let moved = 0; const keys = [...Object.keys(ABN), 'skipAttack', 'attackFail'];
      keys.forEach(k => { const a = snap.st[k] || 0, now = target.status[k] || 0; if (now > a) { target.status[k] = a; actor.status[k] = Math.max(actor.status[k] || 0, now - a); moved++; } });
      if ((target.status.attackFailChance || 0) !== (snap.st.attackFailChance || 0) && actor.status.attackFail > 0) actor.status.attackFailChance = target.status.attackFailChance;
      STAGES.forEach(k => { const d = (snap.b[k] || 0) - target.buffs[k]; if (d > 0) { target.buffs[k] += d; actor.buffs[k] = clamp(actor.buffs[k] - d, -6, 6); moved++; } });
      if (moved) L(`🌀 ${target.name} 的闇穴道把負面效果全部反彈給 ${actor.name}！`);
    }
    if (target && target !== actor && target.hp > 0 && !target.voidImmune) {
      if (ef.drainBuffs) { let n = 0; STAGES.forEach(k => { if (target.buffs[k] > 0) { actor.buffs[k] = clamp(actor.buffs[k] + target.buffs[k], -6, 6); n += target.buffs[k]; target.buffs[k] = 0; } }); if (n) L(`🌑 ${actor.name} 奪走了 ${target.name} 的能力提升！`); }
      if (ef.invertBuffs) { let n = 0; STAGES.forEach(k => { if (target.buffs[k] > 0) { target.buffs[k] = -target.buffs[k]; n++; } }); if (n) L(`🔄 ${target.name} 的能力提升被反轉成能力下降！`); }
      if (ef.mark) { const M = ef.mark; marks(target)[M.key] = Math.max(marks(target)[M.key] || 0, M.turns || 3); L(`👁 ${target.name} 被刻上「${M.label || '印記'}」（${M.turns || 3} 回合）`); }
      if (ef.soulLock) { const S = ef.soulLock, cur = target.status.__soulLock;
        target.status.__soulLock = { turns: Math.max(cur ? cur.turns : 0, S.turns), down: Math.max(cur ? cur.down : 0, S.down || 1), drain: S.drain || 0 };
        enforceLock(target); L(`🍭 靈魂壓制！${target.name} 全能力被壓在 -${target.status.__soulLock.down}，每回合被奪走體力（${target.status.__soulLock.turns} 回合，無法解除）`); }
      if (ef.extendLock && target.status.__soulLock && target.status.__soulLock.turns > 0) { target.status.__soulLock.turns += ef.extendLock; enforceLock(target); L(`🍭 靈魂壓制延長 ${ef.extendLock} 回合（剩 ${target.status.__soulLock.turns} 回合）`); }
    }
    if (ef.flipDebuffs) { if (typeof clearAbnormal === 'function') clearAbnormal(actor); let n = 0; STAGES.forEach(k => { if (actor.buffs[k] < 0) { actor.buffs[k] = -actor.buffs[k]; n++; } }); L(n ? `🔄 ${actor.name} 把負面能力反轉成強化，異常狀態也一起解除！` : `✨ ${actor.name} 解除了自身的異常狀態！`); }
    if (ef.dmgToHeal) { actor.status.__dmgToHeal = { turns: ef.dmgToHeal.turns || 2, ratio: ef.dmgToHeal.ratio || .5 }; L(`😆 ${actor.name} 接下來 ${ef.dmgToHeal.turns || 2} 回合會把受到的傷害笑成體力！`); }
    if (ef.reflectDebuff) { actor.status.__reflectDebuff = Math.max(actor.status.__reflectDebuff || 0, ef.reflectDebuff.turns || 2); L(`🌀 ${actor.name} 張開闇穴道：接下來 ${ef.reflectDebuff.turns || 2} 回合，對手的負面效果會反彈回去！`); }
    if (ef.lastStand) { actor.status.__lastStand = { ratio: ef.lastStand.ratio || .3, charges: Math.max((actor.status.__lastStand || {}).charges || 0, ef.lastStand.charges || 1) }; }
    if (ef.dragonBoost && actor.hp > 0) { const D = ef.dragonBoost; actor.status.__dragon = Object.assign({}, D); if (D.guard) actor.status.__lastStand = { ratio: D.guard, charges: Math.max((actor.status.__lastStand || {}).charges || 0, 1) };
      L(`🐉 龍人型態：其他招式傷害 ×${D.dmg}、受到的傷害 -${Math.round((D.dr || 0) * 100)}%、每回合回復 ${Math.round((D.regen || 0) * 100)}%${D.guard ? `，並能撐住一次致命傷` : ''}！`); }
    enforceLock(actor); if (target) enforceLock(target);
    return r;
  };

  /* ---------- 回合結束 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const r = _ets.apply(this, arguments); if (!c || !c.status) return r; const st = c.status;
    if (st.__marks) Object.keys(st.__marks).forEach(k => { if (st.__marks[k] > 0 && k !== 'soul') st.__marks[k]--; });
    const Lk = st.__soulLock;
    if (Lk && Lk.turns > 0 && c.hp > 0) {
      const foe = other(c);
      if (Lk.drain) { const d = Math.max(1, Math.floor(c.maxHp * Lk.drain * (isBossFoe(c) ? .5 : 1))); c.hp = Math.max(0, c.hp - d); if (foe && foe.hp > 0) foe.hp = Math.min(foe.maxHp, foe.hp + d);
        try { showDamage(sideOf(c), d, '#ff8acb'); } catch (e) { } L(`🍭 靈魂壓制：${c.name} 被奪走 ${d} 點體力${foe ? `，${foe.name} 回復了同樣的量` : ''}（無法解除，剩 ${Lk.turns - 1} 回合）`); }
      Lk.turns--; if (Lk.turns <= 0) { st.__soulLock = null; if (st.__marks) st.__marks.soul = 0; L(`🍭 ${c.name} 的靈魂壓制結束了。`); } else enforceLock(c);
    }
    if (st.__dmgToHeal && st.__dmgToHeal.turns > 0) { st.__dmgToHeal.turns--; if (st.__dmgToHeal.turns <= 0) st.__dmgToHeal = null; }
    if (st.__reflectDebuff > 0) st.__reflectDebuff--;
    const D = st.__dragon; if (D && D.regen && c.hp > 0) { const h = Math.floor(c.maxHp * D.regen); c.hp = Math.min(c.maxHp, c.hp + h); try { showHeal(sideOf(c), h); } catch (e) { } }
    return r;
  };

  /* ---------- 受到傷害：龍人減傷、笑成體力、致命傷保命 ---------- */
  const _ad = applyDamage;
  applyDamage = function (target, amount, side, opts) {
    if (!target || !target.status) return _ad.apply(this, arguments);
    const D = target.status.__dragon; if (D && D.dr && amount > 0) amount = Math.max(1, Math.floor(amount * (1 - D.dr)));
    const before = target.hp; const r = _ad.call(this, target, amount, side, opts);
    const LS = target.status.__lastStand;
    if (target.hp <= 0 && before > 0 && LS && LS.charges > 0) { LS.charges--; target.hp = Math.max(1, Math.floor(target.maxHp * LS.ratio)); L(`🔥 ${target.name} 撐住了致命一擊，保住 ${Math.round(LS.ratio * 100)}% 體力！`); try { if (typeof floatText === 'function') floatText(side, '撐住', 'status'); } catch (e) { } }
    const H = target.status.__dmgToHeal; const lost = before - target.hp;
    if (H && H.turns > 0 && lost > 0 && target.hp > 0) { const h = Math.floor(lost * H.ratio); if (h > 0) { target.hp = Math.min(target.maxHp, target.hp + h); L(`😆 ${target.name} 笑著把傷害變成體力（+${h}）`); try { showHeal(side, h); } catch (e) { } } }
    return r;
  };

  /* ---------- 體質傾斜 hpTilt（只影響玩家角色）：體力 ×t、傷害 ÷t，綜合戰力不變，讓角色更耐打（紅髮原本體力只有其他四皇的六成） ---------- */
  if (typeof applyRarityScale === 'function') { const _ars = applyRarityScale;
    applyRarityScale = function (f) { const r = _ars.apply(this, arguments); const t = f && CHARACTERS[f.id] && CHARACTERS[f.id].hpTilt;
      if (t && t !== 1) { f.maxHp = Math.round(f.maxHp * t); f.hp = Math.min(f.maxHp, Math.round(f.hp * t)); f.dmgMul /= t; } return r; }; }

  /* ---------- AI 權重（敵方 AI 與模擬共用） ---------- */
  window.__aiW160 = function (actor, target, s) {
    const e = (s && s.effect) || {}; let w = 1; if (!actor || !target) return w;
    if (e.markBonus) w *= hasMark(target, e.markBonus.key) ? 2.5 : .8;
    if (e.mark && !hasMark(target, e.mark.key)) w *= 1.7;
    if (e.soulLock && !(target.status.__soulLock && target.status.__soulLock.turns > 0)) w *= 2;
    if (e.extendLock && target.status.__soulLock && target.status.__soulLock.turns > 0) w *= 1.5;
    const bad = STAGES.some(k => actor.buffs[k] < 0) || (typeof CC_KEYS !== 'undefined' && CC_KEYS.some(k => actor.status[k] > 0)) || actor.status.weak > 0 || actor.status.burn > 0;
    if ((e.flipDebuffs || e.clearSelfDebuffs) && bad) w *= 1.8;
    if ((e.drainBuffs || e.invertBuffs) && STAGES.some(k => target.buffs[k] > 0)) w *= 1.8;
    if (e.shieldToDmg && actor.status.shield > actor.maxHp * .1) w *= 1.8;
    return w;
  };
})();
