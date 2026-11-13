/* v214：戰鬥效果擴充・後期（原 ext_v160～ext_v172 依載入順序合併）。合併前的檔案邊界以「==== 原 檔名 ====」標記。 */

/* ==== 原 js/ext_v160.js ==== */
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
    /* v162 闇穴道：保留反彈效果之外，再複製對手一個技能（第 5 招除外）立刻使用一次（使用者 11/04 22:23） */
    if (ef.copyCast && !skill.__copyCast && target && target !== actor && target.hp > 0 && actor.hp > 0) {
      const BAD = ['copyReplace', 'copyCast', 'dominate', 'rocksStore', 'rocksSecret', 'restoreAllPP', 'fullRestoreTurns', 'extraLives', 'awaken', 'selfDamageRatio', 'selfHpCost', 'selfDebuff', 'selfFreeze', 'selfPetrify', 'noRestore'];
      const pool = target.skills.filter(x => x && !x.ultimate && !x.locked && !BAD.some(k => x.effect && x.effect[k]));
      if (pool.length) { const cs = JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)])); cs.__copyCast = true; cs.copiedFrom = { id: target.id };
        L(`🕳️ ${actor.name} 用闇穴道吸進「${cs.name}」，立刻拿來使用！`);
        try { const o = computeSkillOutcome(actor, target, cs, false) || { damage: 0, meta: {} };
          if (o.damage > 0) applyDamage(target, o.damage, target === battle.player ? 'L' : 'R');
          if (target.hp > 0 || cs.type === 'support') applySkillEffects(actor, target, cs, o); } catch (e) { console.warn('闇穴道複製失敗', e); } }
      else L(`🕳️ 闇穴道沒有可以複製的技能。`);
    }
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

/* ==== 原 js/ext_v164.js ==== */
/* v164 戰鬥擴充：巴托洛米奧第 5 招「屏障·絕對防禦」與皮膚能力加成。
   效果欄位（skill.effect）：
   bartoBarrier { turns, regen:[a,b], regenTurns }：張開絕對防禦屏障 turns 回合（與 invulnTurns 一起用，攻擊由 invuln 擋下）。
     屏障期間：對手的技能效果（異常狀態、能力下降、持續傷害、印記、扣技能次數、驅散、比例傷害等）對自己全部無效；
     任何來源的傷害（反彈、召喚獸、持續傷害、熔岩、靈魂壓制的吸取……）都不會扣體力。
     另外解除對手留在自己身上的印記（靈魂壓制這類「無法解除」的設計不解除，但屏障期間不會被吸體力）。
     regenTurns 回合內，每回合結束回復最大體力 a～b。
   皮膚加成 SKINS[k].bonus { def }：裝備該皮膚出戰時防禦力 ×(1＋def)（buildFighter 帶 skin 參數時套用）。
   載入順序：所有 ext_*.js、balance_*.js 之後（index.html 在 balance_v161.js 後面）；tests/*-sim.js 會用到 applySkillEffects／applyDamage／endTurnStatus。 */
(function () {
  if (typeof applySkillEffects !== 'function') return;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const sideOf = f => { const b = B(); return b && (f === b.player || (b.team && b.team.includes(f))) ? 'L' : 'R'; };
  const on = f => !!(f && f.status && f.status.__barrier > 0);
  const R = (a, b) => a + Math.random() * (b - a);
  const clone = o => { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return null; } };

  /* ---------- 技能效果：施放屏障；屏障中的一方不受對手效果影響 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const guard = on(target) && actor !== target && !(skill && skill.__voidFx);
    const snap = guard ? { st: clone(target.status), b: Object.assign({}, target.buffs), hp: target.hp, mx: target.maxHp, pp: (target.skills || []).map(s => s.pp) } : null;
    /* 屏障中：先把這次的戰鬥紀錄暫存起來，擋下的效果（提到被保護的人）不寫進紀錄，只留一行「屏障擋下了」 */
    let buf = null, _log = null;
    if (snap && snap.st && typeof log === 'function') { buf = []; _log = log; try { log = function (m) { buf.push([this, arguments]); }; } catch (e) { buf = null; } }
    let r; try { r = _ase.apply(this, arguments); } finally { if (buf) { try { log = _log; } catch (e) { } } }
    if (buf) buf.forEach(([t, a]) => { if (!String(a[0] || '').includes(target.name)) _log.apply(t, a); });
    if (snap && snap.st) {
      let blocked = false;
      if (target.hp < snap.hp || target.maxHp !== snap.mx) { target.hp = Math.max(target.hp, snap.hp); target.maxHp = snap.mx; blocked = true; }
      ['atk', 'def', 'spd'].forEach(k => { if (target.buffs[k] < snap.b[k]) { target.buffs[k] = snap.b[k]; blocked = true; } });
      if (JSON.stringify(target.status) !== JSON.stringify(snap.st)) { target.status = snap.st; blocked = true; }
      (target.skills || []).forEach((s, i) => { if (s.pp < snap.pp[i]) { s.pp = snap.pp[i]; blocked = true; } });
      if (blocked) L(`🛡️ 絕對防禦！${target.name} 的屏障擋下了 ${actor.name} 的所有效果！`);
    }
    const ef = (skill && skill.effect) || {};
    if (ef.bartoBarrier && actor && actor.hp > 0 && !skill.__voidFx) {
      const BB = ef.bartoBarrier, st = actor.status;
      st.__barrier = Math.max(st.__barrier || 0, BB.turns || 2);
      if (BB.regenTurns) st.__bRegen = { turns: BB.regenTurns, range: BB.regen || [.05, .1] };
      if (st.__marks) Object.keys(st.__marks).forEach(k => { if (k !== 'soul') st.__marks[k] = 0; });
      st.__reflectDebuff = st.__reflectDebuff || 0;
      L(`🛡️ ${actor.name} 張開「絕對防禦」屏障！接下來 ${st.__barrier} 回合，所有攻擊、負面狀態與負面能力都無效。`);
      if (st.__bRegen) L(`💚 之後 ${st.__bRegen.turns} 回合，${actor.name} 每回合回復 ${Math.round(st.__bRegen.range[0] * 100)}～${Math.round(st.__bRegen.range[1] * 100)}% 體力。`);
    }
    return r;
  };

  /* ---------- 傷害：屏障中不受任何傷害 ---------- */
  const _ad = applyDamage;
  applyDamage = function (target, amount, side, opts) {
    if (on(target) && amount > 0) { L(`🛡️ 屏障擋下了攻擊！${target.name} 沒有受到傷害。`); try { if (typeof floatText === 'function') floatText(side || sideOf(target), '無效', 'miss'); } catch (e) { } return; }
    return _ad.apply(this, arguments);
  };

  /* ---------- 回合結束：屏障擋下持續傷害、每回合回復、倒數 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const b = B(), all = b ? [b.player, b.enemy, ...(b.team || [])].filter((f, i, a) => f && a.indexOf(f) === i) : [c];
    const held = all.filter(on).map(f => [f, f.hp]);
    const r = _ets.apply(this, arguments);
    held.forEach(([f, hp]) => { if (f.hp < hp) { f.hp = hp; if (f === c) L(`🛡️ 屏障擋下了持續傷害，${f.name} 沒有損失體力。`); } });
    if (c && c.status) {
      const st = c.status, G = st.__bRegen;
      if (G && G.turns > 0 && c.hp > 0) {
        const h = Math.max(1, Math.floor(c.maxHp * R(G.range[0], G.range[1])));
        if (typeof healOk !== 'function' || healOk(c)) { const add = Math.min(c.maxHp - c.hp, h); if (add > 0) { c.hp += add; try { showHeal(sideOf(c), add); } catch (e) { } L(`💚 屏障裡的 ${c.name} 回復了 ${add} 體力（剩 ${G.turns - 1} 回合）`); } }
        G.turns--; if (G.turns <= 0) st.__bRegen = null;
      }
      if (st.__barrier > 0) { st.__barrier--; if (st.__barrier <= 0) L(`${c.name} 的絕對防禦屏障消失了。`); }
    }
    return r;
  };

  /* ---------- 狀態標籤 ---------- */
  if (typeof statusChips === 'function') {
    const _sc = statusChips;
    statusChips = function (c) {
      let h = _sc.apply(this, arguments); const st = c && c.status; if (!st) return h;
      if (st.__barrier > 0) h += `<span class="chip good" title="所有攻擊、負面狀態與負面能力都無效">絕對防禦 ${st.__barrier}</span>`;
      if (st.__bRegen && st.__bRegen.turns > 0) h += `<span class="chip good" title="每回合回復 ${Math.round(st.__bRegen.range[0] * 100)}～${Math.round(st.__bRegen.range[1] * 100)}% 體力">屏障回復 ${st.__bRegen.turns}</span>`;
      return h;
    };
  }

  /* ---------- 皮膚加成：防禦力 ---------- */
  if (typeof buildFighter === 'function') {
    const _bf = buildFighter;
    buildFighter = function (id, lv, skin) {
      const f = _bf.apply(this, arguments), SK = skin && typeof SKINS !== 'undefined' ? SKINS[skin] : null;
      if (f && SK && SK.char === id && SK.bonus) { if (SK.bonus.def && f.def) f.def = Math.round(f.def * (1 + SK.bonus.def)); f.__skinBonus = SK.bonus; }
      return f;
    };
  }

  /* ---------- AI 權重（敵方 AI 與模擬共用 window.__aiW160） ---------- */
  const _w = window.__aiW160;
  window.__aiW160 = function (actor, target, s) {
    let w = _w ? _w.apply(this, arguments) : 1; const e = (s && s.effect) || {}; if (!actor || !target) return w;
    if (e.bartoBarrier) w *= on(actor) ? .1 : (actor.hp / actor.maxHp < .55 ? 3 : 1);
    if (e.reflectTurns && !(actor.status.reflect > 0)) w *= 1.3;
    return w;
  };
})();

/* ==== 原 js/ext_v165.js ==== */
/* v165 伊姆三型態機制（使用者 11/06 規格 /root/promo/v165/src/imu_skills.txt；技能資料在 js/balance_v165.js）。
   型態：f.__imu.form 0 初始（只能用①⑤）→ 1 第一型態「伊姆聖」（開啟②③④）→ 2 第二型態「世界之王・伊姆聖」（①～④換成 form2Skills、次數全部恢復）。
   v169：再施放一次晉升為 3 第三型態「深淵聖靈・伊姆」（①～④換成 form3Skills）；第三型態再施放⑤為「天罰」（imuAscend.judge）。
   f.__imu.maxForm：最高能晉升到第幾型態（預設 3；勇者之塔第 200 層由 enemyMod.imuMaxForm 設成 2）。
   最多晉升三次；之後⑤仍有晉升效果，但立繪不再改變、也不會變回去（倒下、復活、霸王色解除變身都不影響）。
   v172：第三型態只維持 5 回合，之後降回第二型態（revert3），再施放⑤才會再晉升；⑤固定 5 次、不能用道具補，虛空王座與勇者之塔的伊姆⑤無限。
   效果欄位：
   imuUndying { turns, regen, bossRegen, guard, thorn }：不死之身（每回合回復、致命保命 1 次、反彈受到傷害、淨化並把能力下降轉成提升）
   imuPact { turns, ratio, healCut, bossHealExempt, allDown, domChance, domRecoil, reward, full, noBuff, steal, sealChance }：惡魔契約／完全支配
   imuVoid { turns, evade, abyss, strike, stackPer, stackMax }：迴避、深淵轉移（我方陣容其他角色承擔；沒有就不轉移）、深淵攻擊、迴避後加成
   imuSealAtk：機率封印對手下一回合的攻擊技能｜imuPactChase：對契約中的對手追擊｜imuDefIgnore：無視防禦比例（晉升後一律 100%＝真實傷害）
   imuAscend { stat, inv, steal, pow, exec, clutch, clutchAt }：最初20人（晉升與每次的晉升效果）
   imuEternal { turns, regen, dr, reflect, stack, stackMax }：永劫不滅｜imuDomain {...}：世界之王領域（存在 battle.__imuDom，跨換人）
   imuRuin { extra, erase, healCut, low, chase, kill, flat }：毀滅之力（追加最大體力傷害、奪取強化、存在抹除、低血追擊、擊殺未出戰角色）
   對外：window.IMU165 = { preAct, postAct, ai, setForm, init }（battle.js 的 executeAction 包裝與 tests/imu-sim.js 共用）。
   載入順序：balance_v165.js 之後（所有 ext_*.js、balance_*.js 之後，成為最外層包裝）。 */
(function () {
  if (typeof computeSkillOutcome !== 'function' || typeof applySkillEffects !== 'function') return;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const R = (a, b) => a + Math.random() * (b - a), pct = x => Math.round(x * 100);
  const wait = ms => new Promise(r => setTimeout(r, ms / (window.BSPEED || 1)));
  const STAGES = ['atk', 'def', 'spd'];
  const isImu = f => !!(f && f.__imu);
  const teamOf = () => { const b = B(); return (b && b.team) || []; };
  const isPlayerSide = f => { const b = B(); return !!(b && f && (f === b.player || teamOf().includes(f))); };
  const foeOf = f => { const b = B(); if (!b || !f) return null; if (f === b.enemy) return b.player || null; if (isPlayerSide(f)) return b.enemy || null; return null; };
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const isBossUnit = f => { const b = B(); return !!(b && b.isBoss && f === b.enemy && !f.voidImmune); };
  const ownerOf = side => { const b = B(); if (!b) return null; if (side === 'E') return b.enemy || null; return teamOf().find(isImu) || b.player || null; };
  const sideKey = f => { const b = B(); return b && f === b.enemy ? 'E' : 'P'; };
  const immune = f => typeof immuneTo === 'function' && immuneTo(f);
  const hasTrait = (f, t) => !!(f && f.traits && f.traits.includes(t));
  const dmgFx = (f, d, c) => { try { if (onScreen(f)) showDamage(sideOf(f), d, c); } catch (e) { } };
  const healFx = (f, h) => { try { if (onScreen(f) && h > 0) showHeal(sideOf(f), h); } catch (e) { } };
  const say = (f, t) => { try { if (onScreen(f)) floatText(sideOf(f), t, 'status'); } catch (e) { } };
  const hud = () => { try { renderHUD(); } catch (e) { } };
  const canHeal = f => typeof healOk !== 'function' || healOk(f);
  let curActor = null, curSkill = null, reflecting = 0, inAction = 0, dCso = 0, dAse = 0;
  /* ---------- v165 通用效果（洛基、尼卡魯夫、洛克斯、黑鬍子；對所有對手都有效） ----------
     pierceDR：無視對手減傷的比例（含減傷型態、套組減傷、龍人型態、永劫不滅、世界之王領域）｜breakInvuln：出招前打破對手的無敵
     guardBreak：致命一擊時該機率讓對手的保命效果（撐住、不死、瀕死回滿、復活）不發動｜healSeal { turns, cut }：命中後對手回復量減少
     ultSeal：命中後對手幾回合內無法使用奧義（第 5 招，含變身／晉升）｜nullNext：機率讓對手下一招失效｜drainForm：吸走對手一半的型態增益（倍率加成）
     voidGuard：機率讓對手身上的保命效果全部失效｜mirror：幾回合內反彈到自己身上的傷害轉回反彈的人｜cleanseMarks：解除契約、支配、封印、存在抹除等（惡魔契約反轉給對手）
     breakField：對手展開的場地效果（世界之王、火山、冰河）縮短幾回合 */
  const ce = () => (curSkill && curSkill.effect) || {};
  const free = f => !!(f && f.status && f.status.__free > 0); /* freeTurns：尼卡魯夫的「自由」——不受契約、支配、封印、壓制與秒殺 */
  const freeMsg = f => L(`🥁 ${f.name} 是自由的，不受影響！`);
  function pierceOf(a) { if (!a || a !== curActor) return 0; return Math.min(1, ce().pierceDR || 0); }
  function pierceInv(t) { return !!(curActor && curActor !== t && ce().breakInvuln); }
  function guardBreak(a, t, amt) { const g = a && a === curActor ? ce().guardBreak : 0; if (!g || !t || t.hp <= 0 || amt < t.hp + (t.status.shield || 0)) return false; if (Math.random() >= g) return false; L(`💥 ${a.name} 的一擊貫穿了 ${t.name} 的保命效果！`); return true; }
  function bounce(atk, from, d) { if (!atk || d <= 0) return; reflecting++; try { if (atk.status.__mirror > 0 && from && from.hp > 0) { L(`🔄 ${atk.name} 把反彈回來的傷害再反轉回去，${from.name} 自己承受 ${d} 點！`); _adRef(from, d, sideOf(from)); } else _adRef(atk, d, sideOf(atk)); } finally { reflecting--; } }
  let _adRef = (t, d, s) => applyDamage(t, d, s);

  /* ---------- 初始化與型態 ---------- */
  function ppFor(f, s, i) {
    const lv = f.level || MAX_LV, need = (typeof SKILL_UNLOCK !== 'undefined' && SKILL_UNLOCK[i]) || 1;
    if (lv < need) return -need;
    if ((f.__imu && f.__imu.throne) || (f.skills[4] && f.skills[4].maxPP >= 999)) return 9999; /* 虛空王座：次數無限 */
    const src = s.maxPP > 0 ? s : ((CHARACTERS.imu.skills || [])[i] || s); /* 鎖住的技能 maxPP 是 0，改用原始資料 */
    let n = skillPP(src, lv, lvStats(CHARACTERS.imu, lv).ppAdj);
    if (f.difficulty && f.difficulty.order >= 3) n += 1;
    return n;
  }
  function init(f) {
    if (!f || f.id !== 'imu' || !f.skills) return f;
    if (!f.__imu) f.__imu = { form: 0, asc: 0, ascSeq: 0, pow: 1, evStacks: 0, etStacks: 0, exec: 0, execStep: .05, execBase: .2, stealR: .3, clutch: 0, clutchAt: .1, formTurns: 0, voidUsed: false, pend: null,
      base: { image: f.image, avatar: f.avatar, name: f.name, title: f.title } };
    lockForm(f); return f;
  }
  function lockForm(f) {
    if (!isImu(f) || f.__imu.form > 0) return;
    f.skills.forEach(s => { if (!s || !s.formNeed || typeof s.locked === 'number') return; if (s.locked !== 'form') { s.__inf = s.maxPP >= 999; s.locked = 'form'; s.pp = 0; s.maxPP = 0; } });
  }
  function unlockForm1(f) {
    f.skills.forEach((s, i) => { if (s && s.locked === 'form') { const n = s.__inf ? 9999 : ppFor(f, s, i); if (n < 0) { s.locked = -n; s.pp = s.maxPP = 0; } else { s.locked = 0; s.pp = s.maxPP = n; } } });
    L(`👁 ${f.name} 開啟了「黑轉支配」「虛空威壓」「黑焰・凶兆」！`);
  }
  const maxFormOf = f => { const n = (((CHARACTERS.imu && CHARACTERS.imu.forms) || []).length || 3) - 1; return Math.min(n, f.__imu.maxForm != null ? f.__imu.maxForm : n); };
  function swapForm(f, form) {
    const K = (CHARACTERS.imu && CHARACTERS.imu['form' + form + 'Skills']) || []; if (!K.length) return;
    K.forEach((src, i) => { const s = JSON.parse(JSON.stringify(src)); const n = ppFor(f, s, i); if (n < 0) { s.locked = -n; s.pp = s.maxPP = 0; } else { s.pp = s.maxPP = n; } f.skills[i] = s; });
    /* 所有技能次數恢復＝第 1～4 招（換成第二型態的新技能，次數全滿）；第 5 招「最初20人」不恢復，最多 4 次（使用者 11/06 確認） */
    L(`👑 技能欄換成${form === 3 ? '第三' : '第二'}型態：${K.map(x => `「${x.name}」`).join('')}，第 1～4 招次數全滿！`);
  }
  function setForm(f, form) {
    if (!isImu(f)) return; const F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[form] || null;
    const src = form === 0 || !F ? f.__imu.base : F;
    f.image = src.image; f.avatar = src.avatar; f.name = src.name; f.title = src.title;
    const VO = typeof visualOverride === 'function' ? visualOverride('form:imu_form' + form) : null;
    f.visMul = form === 0 ? 1 : (VO && VO.battleScale) || F.scale || 1; f.mirror = VO && VO.faceLeft !== undefined ? VO.faceLeft : false;
    if (!onScreen(f)) return;
    try { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); } catch (e) { }
    const S = sideOf(f), $$ = id => document.getElementById(id);
    try { if ($$('bName' + S)) $$('bName' + S).textContent = f.name; if ($$('bTitle' + S)) $$('bTitle' + S).textContent = f.title; if ($$('bAv' + S)) $$('bAv' + S).src = f.avatar; if (S === 'L' && typeof renderTeam === 'function') renderTeam(); } catch (e) { }
  }

  /* v172（使用者 11/07 19:34）：第三型態只能維持 forms[3].turns（5）回合，之後降回第二型態；再次施放「最初20人」才會再晉升（晉升效果照常）。
     第二型態的技能欄在晉升時保存（f2Saved），降回時還原（次數維持當時剩下的）。 */
  const f3Turns = () => ((((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[3] || {}).turns) || 5;
  function revert3(c) {
    const I = c.__imu; I.form = 2; I.formTurns = 0;
    if (I.f2Saved) { I.f2Saved.forEach((s, i) => { c.skills[i] = s; }); I.f2Saved = null; } else swapForm(c, 2);
    const F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[2] || {};
    L(`⌛ ${c.name} 的第三型態維持 ${f3Turns()} 回合後結束，降回第二型態「${F.name || '世界之王・伊姆聖'}」！再次施放「最初20人」才會再晉升。`);
    if (inAction) I.pend = 2; else setForm(c, 2);
    say(c, '降回第二型態');
    if (onScreen(c) && c === B().player && typeof renderSkills === 'function') try { renderSkills(); } catch (e) { }
  }

  /* ---------- 晉升（最初20人） ---------- */
  function transferNegatives(f, t) {
    const A = f.status; let n = 0;
    const keys = [...Object.keys(typeof ABN !== 'undefined' ? ABN : {}), 'skipAttack', 'skillNullify', 'buffBlock', 'attackFail', 'healBlock'];
    keys.forEach(k => { if ((A[k] || 0) > 0) { if (t && !t.voidImmune) t.status[k] = Math.max(t.status[k] || 0, A[k]); A[k] = 0; n++; } });
    if (A.attackFail === 0 && t && t.status.attackFail > 0 && !t.status.attackFailChance) t.status.attackFailChance = .5;
    if (A.dots && A.dots.length) { if (t && !t.voidImmune) t.status.dots.push(...A.dots.map(d => ({ ...d }))); A.dots = []; n++; }
    STAGES.forEach(k => { if (f.buffs[k] < 0) { if (t && !t.voidImmune) t.buffs[k] = clamp(t.buffs[k] + f.buffs[k], -6, 6); f.buffs[k] = 0; n++; } });
    ['__pact', '__erase', '__sealAtk', '__sealNext', '__imuDomd', '__awe'].forEach(k => { if (A[k]) { A[k] = k === '__pact' || k === '__erase' ? null : 0; n++; } });
    return n;
  }
  function ascend(f, t, A) {
    const I = f.__imu, S = f.status; I.asc++; I.ascSeq++;
    const judge = I.form >= 3 && A.judge ? A.judge : null; /* v169：第三型態再施放＝天罰 */
    if (I.form < maxFormOf(f)) {
      I.form++; I.formTurns = 0;
      { const F = ((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[I.form]; if (F) L(`👑 ${f.name} 晉升為${F.label}「${F.name}」！`); }
      if (I.form === 1) unlockForm1(f); else { if (I.form === 3 && !I.f2Saved) I.f2Saved = f.skills.slice(0, 4); swapForm(f, I.form); }
      if (inAction) I.pend = I.form; else setForm(f, I.form);
    } else if (judge) L(`⚡ ${f.name} 降下「天罰」！`);
    else L(`👑 ${f.name} 已是最終型態，最初20人的力量再次湧現！`);
    STAGES.forEach(k => { f.buffs[k] = clamp(f.buffs[k] + A.stat, -6, 6); });
    const inv = judge ? judge.inv : A.inv; S.__imuInv = Math.max(S.__imuInv || 0, inv); S.invuln = Math.max(S.invuln || 0, inv);
    if (judge && t && t.hp > 0) heavenly(f, t, judge);
    const ts = I.tScale || 1; S.__imuSteal = Math.max(S.__imuSteal || 0, A.steal[0]); I.stealR = A.steal[1] * ts;
    const moved = transferNegatives(f, t && t.hp > 0 ? t : null); S.__reflectDebuff = 99999;
    const up = R(A.pow[0], A.pow[1]); I.pow = Math.round(I.pow * (1 + up) * 100) / 100;
    if (!I.exec) I.exec = A.exec[0] * ts; I.execBase = A.exec[0] * ts; I.execStep = A.exec[1] * ts;
    I.clutch += A.clutch; I.clutchAt = A.clutchAt;
    L(`👑 最初20人！${f.name} 全能力 +${A.stat}、無敵 ${inv} 回合、接下來 ${A.steal[0]} 回合每回合奪走對手 ${pct(A.steal[1])}% 體力`);
    L(`👑 全部技能威力 +${pct(up)}%（累計 ×${I.pow}），伊姆的傷害全部改為真實傷害；${moved ? '身上的負面效果全部反彈給對手，' : ''}之後對手施加的負面效果也會反彈`);
    L(`👑 每回合秒殺判定 ${pct(I.exec)}%（每回合 +${pct(I.execStep)}%）；瀕死時恢復全部體力（剩 ${I.clutch} 次）`);
    if (onScreen(f) && f === B().player && typeof renderSkills === 'function') try { renderSkills(); } catch (e) { }
  }

  /* v169 天罰：清除對手全部強化、比例體力損失（BOSS 改用 bossStrike）、幾回合內無法獲得強化 */
  function heavenly(f, t, J) {
    if (t.voidImmune) { L(`👑 ${t.name} 不受天罰的比例效果影響！`); return; }
    const T = t.status, gone = []; let n = 0;
    STAGES.forEach(k => { if (t.buffs[k] > 0) { n += t.buffs[k]; t.buffs[k] = 0; } }); if (n) gone.push(`能力提升 ${n} 階`);
    if (T.shield > 0) { T.shield = 0; gone.push('護盾'); } if (T.damageReductionTurns > 0) { T.damageReductionTurns = 0; gone.push('減傷'); }
    if (T.invuln > 0 || T.__imuInv > 0) { T.invuln = 0; T.__imuInv = 0; gone.push('無敵'); } if (T.dodge > 0) { T.dodge = 0; gone.push('閃避'); }
    if (T.reflect > 0) { T.reflect = 0; gone.push('反彈'); } if (T.thornTurns > 0) { T.thornTurns = 0; gone.push('荊棘'); }
    L(gone.length ? `⚡ 天罰清除了 ${t.name} 的${gone.join('、')}！` : `⚡ ${t.name} 身上沒有可以清除的強化。`);
    const r = (isBossUnit(t) ? J.bossStrike : J.strike) * (f.__imu.tScale || 1), d = Math.max(1, Math.floor(t.maxHp * r));
    t.hp = Math.max(0, t.hp - d); dmgFx(t, d, '#ffe066'); L(`⚡ 天罰之雷：${t.name} 失去最大體力 ${pct(r)}% 的體力（${d}）！`);
    if (free(t)) freeMsg(t); else { T.buffBlock = Math.max(T.buffBlock || 0, J.block); L(`⚡ ${t.name} ${J.block} 回合內無法獲得強化！`); }
    hud();
  }

  /* ---------- 共用：狀態查詢 ---------- */
  const act = (o, k) => !!(o && o.t > 0);
  const etOn = f => !!(f && f.status && act(f.status.__imuEt));
  const kit = f => !!(f && f.status && (f.__imu || f.status.__imuUnd || f.status.__imuEt || f.status.__imuEv || f.status.__imuInv > 0)); /* 伊姆本人，或用闇穴道複製到伊姆技能的角色 */
  const domOwner = D => D && (D.owner || ownerOf(D.side));
  function domain() { const b = B(), D = b && b.__imuDom; if (!D || D.t <= 0) return null; const o = domOwner(D); if (!o || o.hp <= 0) return null; return D; }
  const domainOwner = () => { const D = domain(); return D ? domOwner(D) : null; };
  function domainVs(c) { const D = domain(); if (!D || !c || free(c)) return null; const o = domOwner(D); if (o === c) return null; return (D.side === 'E' ? isPlayerSide(c) : c === B().enemy) ? D : null; }
  function evadeChance(f) { if (!kit(f) && domainOwner() !== f) return 0; let miss = 1; const V = f.status.__imuEv; if (act(V)) miss *= 1 - V.evade; const D = domain(); if (D && domainOwner() === f) miss *= 1 - D.evade; return 1 - miss; }
  function healCutOf(f) { const S = f && f.status; if (!S) return 0; let keep = 1; if (act(S.__pact) && S.__pact.healCut) keep *= 1 - S.__pact.healCut; if (act(S.__erase) && S.__erase.healCut) keep *= 1 - S.__erase.healCut; if (act(S.__healSeal)) keep *= 1 - S.__healSeal.cut; return 1 - keep; }
  const healScale = f => 1 - healCutOf(f); /* 伊姆自己的回復（不死、永劫、瀕死回滿、保命）也吃減療 */
  function cutHeal(f, before) {
    if (!f || f.hp <= before || f.hp <= 0) return; const c = healCutOf(f); if (c <= 0) return;
    const gain = f.hp - before, keep = Math.floor(gain * (1 - c)); f.hp = before + keep;
    L(`🩸 ${f.name} 受到的治療效果 -${pct(c)}%（只回復 ${keep}）`);
  }
  function noBuffRevert(f, snap) { const P = f && f.status && f.status.__pact; if (!act(P) || !P.noBuff) return; let n = 0; STAGES.forEach(k => { if (f.buffs[k] > snap[k]) { f.buffs[k] = snap[k]; n++; } }); if (n) L(`👁 ${f.name} 在契約中，無法獲得新的能力提升！`); }
  function pactReward(t, lethal) {
    const P = t && t.status && t.status.__pact; if (!act(P) || P.paid) return; if (!(t.hp <= 0 || (P.full && lethal))) return;
    const o = ownerOf(P.owner); if (!o || o.hp <= 0) return; P.paid = true;
    if (P.reward === 'full') { if (t.hp > 0) t.hp = 0; const h = o.maxHp - o.hp; o.hp = o.maxHp; o.status.__imuInv = Math.max(o.status.__imuInv || 0, 1); o.status.invuln = Math.max(o.status.invuln || 0, 1); healFx(o, h); L(`👁 完全支配！${o.name} 吸收了 ${t.name} 剩餘的生命，體力全滿並獲得 1 回合無敵！`); }
    else { const h = Math.min(o.maxHp - o.hp, Math.floor(o.maxHp * (P.reward || .5))); o.hp += h; healFx(o, h); L(`👁 惡魔契約：${t.name} 在契約中被擊敗，${o.name} ${h > 0 ? `恢復 ${h} 體力` : '吸收了契約之力（體力已滿）'}！`); }
    hud();
  }

  /* ---------- 傷害計算 ---------- */
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    if (!actor || !target || !skill || dCso > 0) return _cso.apply(this, arguments);
    dCso++; curActor = actor; curSkill = skill;
    const ef = skill.effect || {}; let p = ef.imuDefIgnore || 0, sv = null;
    if (isImu(actor) && actor.__imu.asc > 0) p = 1;
    if (p > 0) { sv = { bd: target.buffs.def, d: target.def || 0 }; if (target.buffs.def > 0) target.buffs.def = target.buffs.def * (1 - p); target.def = sv.d * (1 - p); sv.mbd = target.buffs.def; sv.md = target.def; }
    let r;
    try { r = _cso.call(this, actor, target, skill, blocked); }
    finally { if (sv) { target.buffs.def = sv.bd + (target.buffs.def - sv.mbd); target.def = sv.d + ((target.def || 0) - sv.md); } dCso--; }
    if (!r) return r; r.meta = r.meta || {};
    if (free(target) && (r.meta.execute || r.meta.executeBuff)) { r.meta.execute = false; r.meta.executeBuff = false; r.damage = calcAttackDamage(actor, target, { type: 'attack', power: skill.power || 100, effect: {} }); L(`🥁 ${target.name} 是自由的，不會被秒殺！`); }
    if (etOn(target) && (r.meta.execute || r.meta.executeBuff)) { r.meta.execute = false; r.meta.executeBuff = false; r.damage = calcAttackDamage(actor, target, { type: 'attack', power: skill.power || 100, effect: {} }); L(`👑 ${target.name} 永劫不滅，不會被秒殺！`); }
    if (isImu(actor) || kit(actor) || ef.imuVoid || ef.imuPactChase || ef.imuRuin) {
      const I = actor.__imu || { pow: 1, etStacks: 0, evStacks: 0, asc: 0 };
      if (ef.imuVoid && target.hp > 0 && !target.voidImmune) { const d = Math.max(1, Math.floor(target.maxHp * (ef.imuVoid.strike || .1))); r.damage = (r.damage || 0) + d; L(`🌑 深淵攻擊：造成 ${target.name} 最大體力 ${pct(ef.imuVoid.strike || .1)}% 的傷害！`); }
      if (r.damage > 0 && !r.meta.execute && !r.meta.executeBuff) {
        let m = I.pow; const atk = skill.type === 'attack';
        if (atk && I.etStacks > 0) m *= 1 + I.etStacks * (I.etStep || .1);
        if (atk && I.evStacks > 0) { m *= 1 + .2 * I.evStacks; L(`🌑 迴避累積：這次攻擊威力 +${I.evStacks * 20}%！`); I.evStacks = 0; }
        if (m !== 1) r.damage = Math.floor(r.damage * m);
        if (ef.imuPactChase && act(target.status.__pact)) { const add = Math.floor(r.damage * ef.imuPactChase); r.damage += add; L(`🔥 ${target.name} 身上有惡魔契約，黑焰追擊 ${add} 點傷害！`); }
        if (ef.imuRuin && !target.voidImmune) { const ex = isBossUnit(target) && ef.imuRuin.bossExtra != null ? ef.imuRuin.bossExtra : ef.imuRuin.extra, add = Math.floor(target.maxHp * ex * ((actor.__imu && actor.__imu.tScale) || 1)); r.damage += add; L(`🔥 ${skill.name}追加對手最大體力 ${pct(ex)}% 的傷害（${add}）！`); }
      }
      if (I.asc > 0 && r.damage > 0) r.meta.imuTrue = true;
    }
    return r;
  };

  /* ---------- 技能效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    if (!actor || !skill) return _ase.apply(this, arguments);
    if (dAse > 0) { const r0 = _ase.apply(this, arguments); if (skill.__copyCast && !isImu(actor)) { try { imuEffects(actor, target, skill, result || { damage: 0, meta: {} }); } catch (e) { console.warn(e); } } return r0; }
    const preHp = actor.hp, preB = { ...actor.buffs }, tEt = target && target !== actor && etOn(target), preT = target ? { ...target.buffs } : null;
    dAse++; let r;
    try { r = _ase.apply(this, arguments); } finally { dAse--; }
    noBuffRevert(actor, preB); cutHeal(actor, preHp);
    if (tEt && preT) { let n = 0; STAGES.forEach(k => { if (target.buffs[k] < preT[k]) { target.buffs[k] = preT[k]; n++; } }); if (n) L(`👑 ${target.name} 永劫不滅，不受能力下降影響！`); }
    try { counterFx(actor, target, skill, result || { damage: 0, meta: {} }); } catch (e) { console.warn('v165 通用效果錯誤', e); }
    try { if (isImu(actor) || skill.__copyCast) imuEffects(actor, target, skill, result || { damage: 0, meta: {} }); } catch (e) { console.warn('伊姆技能效果錯誤', e); }
    return r;
  };
  function counterFx(f, t, sk, res) {
    const ef = sk.effect || {}, S = f.status, hit0 = t && t !== f && t.hp > 0 && !t.voidImmune, T = t && t.status, hit = hit0 && !free(t);
    if (hit0 && !hit && (ef.healSeal || ef.ultSeal || ef.nullNext)) freeMsg(t);
    if (ef.freeTurns) { S.__free = Math.max(S.__free || 0, ef.freeTurns); L(`🥁 ${f.name} 接下來 ${ef.freeTurns} 回合是自由的：不受契約、支配、封印、壓制、場地壓制、奪取體力與秒殺！`); }
    if (ef.healSeal && hit && (res.damage > 0 || sk.type !== 'attack')) { T.__healSeal = { t: Math.max((T.__healSeal || {}).t || 0, ef.healSeal.turns), cut: Math.max((T.__healSeal || {}).cut || 0, ef.healSeal.cut) }; L(`🩸 ${t.name} 的回復被壓制：${ef.healSeal.turns} 回合內回復量 -${pct(ef.healSeal.cut)}%`); }
    if (ef.ultSeal && hit) { T.__ultSeal = Math.max(T.__ultSeal || 0, ef.ultSeal); L(`⛓️ ${t.name} 被壓制：${ef.ultSeal} 回合內無法使用奧義（含變身與晉升）`); }
    if (ef.nullNext && hit && Math.random() < ef.nullNext) { T.__nullNext = 1; L(`🕳️ 黑暗吞噬了 ${t.name} 的力量：下一招將會失效！`); }
    if (ef.drainForm && hit) { const k = ef.drainForm; let n = 0;
      if (t.__imu && t.__imu.pow > 1) { const was = t.__imu.pow; t.__imu.pow = Math.round((1 + (was - 1) * (1 - k)) * 100) / 100; n++; L(`🕳️ ${f.name} 吸走了 ${t.name} 的型態力量：威力 ×${was} → ×${t.__imu.pow}`); }
      if (T.damageMultTurns > 0 && T.damageMultValue > 1) { const was = T.damageMultValue; T.damageMultValue = Math.round((1 + (was - 1) * (1 - k)) * 10) / 10; n++; L(`🕳️ ${f.name} 吸走了 ${t.name} 的傷害加成：×${was} → ×${T.damageMultValue}`); }
      if (T.__dragon && T.__dragon.dmg > 1) { T.__dragon.dmg = Math.round((1 + (T.__dragon.dmg - 1) * (1 - k)) * 100) / 100; n++; L(`🕳️ ${f.name} 吸走了 ${t.name} 的龍人型態加成（傷害 ×${T.__dragon.dmg}）`); } }
    if (ef.voidGuard && hit && Math.random() < ef.voidGuard) { const lost = [];
      if (act(T.__imuUnd) && T.__imuUnd.guard) { T.__imuUnd.guard = false; lost.push('不死之身的保命'); } if (act(T.__imuEt) && T.__imuEt.guard) { T.__imuEt.guard = false; lost.push('永劫不滅的保命'); }
      if (T.__lastStand && T.__lastStand.charges > 0) { T.__lastStand.charges = 0; lost.push('撐住致命傷'); } if (T.undyingTurns > 0) { T.undyingTurns = 0; lost.push('重生'); } if (T.clutchHealCharges > 0) { T.clutchHealCharges = 0; lost.push('瀕死回滿'); }
      if (t.__imu && t.__imu.clutch > 0) { t.__imu.clutch--; lost.push(`瀕死回滿 1 次`); } if (T.lives > 0) { T.lives--; lost.push('1 條命'); }
      if (lost.length) L(`🕳️ 黑暗吞噬了 ${t.name} 的保命效果：${lost.join('、')}失效！`); }
    if (ef.mirror) { S.__mirror = Math.max(S.__mirror || 0, ef.mirror); L(`🔄 ${f.name} 接下來 ${ef.mirror} 回合，反彈到自己身上的傷害都會反轉回去！`); }
    if (ef.cleanseMarks) { const o = foeOf(f), done = [];
      if (act(S.__pact)) { const P = S.__pact; S.__pact = null; done.push(P.full ? '完全支配' : '惡魔契約'); if (o && o.hp > 0 && !o.voidImmune) { o.status.__pact = Object.assign({}, P, { owner: sideKey(f), paid: false, healCut: P.healCut }); L(`🔄 ${f.name} 把${P.full ? '完全支配' : '惡魔契約'}反轉給 ${o.name}！`); } }
      [['__erase', '存在抹除'], ['__imuDomd', '支配'], ['__sealAtk', '攻擊封印'], ['__sealNext', '技能封印'], ['__awe', '震懾'], ['__nullNext', '技能失效'], ['__ultSeal', '奧義壓制'], ['__healSeal', '回復壓制']].forEach(([k, n]) => { if (S[k] && (S[k] > 0 || S[k].t > 0)) { S[k] = typeof S[k] === 'object' ? null : 0; done.push(n); } });
      if (done.length) L(`🥁 解放！${f.name} 解除了：${done.join('、')}`); }
    if (ef.breakField) { const b = B(), o = foeOf(f), n = ef.breakField; const cut = (F, name) => { F.t != null ? (F.t = Math.max(0, F.t - n)) : (F.left = Math.max(0, F.left - n)); L(`🥁 ${f.name} 的自由打破了「${name}」：持續時間 -${n} 回合${(F.t ?? F.left) <= 0 ? '，效果消失了' : ''}`); };
      if (b && b.__imuDom && domOwner(b.__imuDom) === o) { cut(b.__imuDom, b.__imuDom.name || '世界之王'); if (b.__imuDom.t <= 0) b.__imuDom = null; }
      if (b && b.eruption && b.eruption.owner === o) { cut(b.eruption, '火山噴發'); if (b.eruption.left <= 0) b.eruption = null; }
      if (b && b.iceAge && b.iceAge.owner === o) { cut(b.iceAge, '冰河時期'); if (b.iceAge.left <= 0) b.iceAge = null; } }
  }
  function imuEffects(f, t, skill, res) {
    const ef = skill.effect || {}, S = f.status, tOk = t && t !== f && t.hp > 0 && !t.voidImmune;
    if (ef.imuUndying) { const U = ef.imuUndying; S.__imuUnd = { t: U.turns, regen: U.regen, bossRegen: U.bossRegen, guard: true, guardHeal: U.guard, thorn: U.thorn };
      if (typeof clearAbnormal === 'function') clearAbnormal(f); let n = 0; STAGES.forEach(k => { if (f.buffs[k] < 0) { f.buffs[k] = -f.buffs[k]; n++; } });
      const boss = isBossUnit(foeOf(f));
      L(`✨ 不死之身！${U.turns} 回合內每回合恢復 ${pct(boss ? U.bossRegen : U.regen)}% 體力${boss ? '（對手是 BOSS）' : ''}、能撐住一次致命傷，受到傷害的 ${pct(U.thorn)}% 會反彈；異常狀態全部解除${n ? '，能力下降轉成了提升' : ''}！`); }
    if (tOk && free(t) && (ef.imuPact || ef.imuSealAtk)) freeMsg(t);
    else if (ef.imuPact && tOk) { const P = ef.imuPact, T = t.status, cut = P.bossHealExempt && isBossUnit(t) ? 0 : P.healCut;
      const ratio = (isBossUnit(t) && P.bossRatio != null ? P.bossRatio : P.ratio) * ((f.__imu && f.__imu.tScale) || 1);
      T.__pact = { t: P.turns, ratio, healCut: cut, noBuff: !!P.noBuff, full: !!P.full, reward: P.reward, owner: sideKey(f), paid: false, chain: (P.chain || 0) * ((f.__imu && f.__imu.tScale) || 1) };
      L(P.full ? `👁 ${skill.name}！${t.name} 陷入「完全支配」${P.turns} 回合：每回合失去最大體力 ${pct(ratio)}%，治療 -${pct(cut)}%，無法獲得新的能力提升` : `👁 黑轉支配！${t.name} 被刻上「惡魔契約」${P.turns} 回合：每回合失去最大體力 ${pct(P.ratio)}%${cut ? `，治療 -${pct(cut)}%` : '（BOSS 不受減療影響）'}`);
      if (P.noBuff) T.buffBlock = Math.max(T.buffBlock || 0, P.turns);
      if (P.allDown) { if (immune(t) || hasTrait(t, 'immuneDown')) L(`🛡️ ${t.name} 不受能力下降影響！`); else { STAGES.forEach(k => { t.buffs[k] = clamp(t.buffs[k] - P.allDown, -6, 6); }); L(`👁 ${t.name} 全能力 -${P.allDown}！`); } }
      if (P.steal) { let n = 0; STAGES.forEach(k => { if (t.buffs[k] > 0) { f.buffs[k] = clamp(f.buffs[k] + t.buffs[k], -6, 6); n += t.buffs[k]; t.buffs[k] = 0; } }); L(n ? `👁 ${f.name} 奪走了 ${t.name} 的能力提升（共 ${n} 階）！` : `👁 ${t.name} 沒有能力提升可以奪取。`); }
      if (P.domChance && Math.random() < P.domChance) { if (immune(t)) L(`🛡️ ${t.name} 抵抗了支配！`); else { T.__imuDomd = Math.max(T.__imuDomd || 0, 1); T.__domRecoil = P.domRecoil || .5; L(`👁 ${t.name} 陷入「支配」：下一次行動無法自己選擇技能！`); } }
      if (P.sealChance && Math.random() < P.sealChance) { if (immune(t)) L(`🛡️ ${t.name} 抵抗了封印！`); else { T.__sealNext = 1; L(`🔒 ${t.name} 的下一次主動技能被封印！`); } } }
    if (ef.imuVoid) { const V = ef.imuVoid; S.__imuEv = { t: V.turns, evade: V.evade, abyss: V.abyss }; if (f.__imu) { f.__imu.voidUsed = true; f.__imu.stackMax = V.stackMax; }
      const allies = isPlayerSide(f) ? teamOf().filter(x => x !== f && x.hp > 0).length : 0;
      L(`🌑 虛空威壓！${V.turns} 回合內迴避率 +${pct(V.evade)}%，受到攻擊時 ${pct(V.abyss)}% 透過深淵轉移給${allies ? `我方其他 ${allies} 位角色` : '其他角色（目前沒有可以承擔的角色，不會轉移）'}`); }
    if (ef.imuSealAtk && tOk && !free(t) && Math.random() < ef.imuSealAtk) { if (immune(t)) L(`🛡️ ${t.name} 抵抗了封印！`); else { t.status.__sealAtk = 1; L(`🔒 黑焰封印了 ${t.name} 下一回合的攻擊技能！`); } }
    if (ef.imuAscend && isImu(f)) ascend(f, t, ef.imuAscend);
    if (ef.imuEternal) { const E = ef.imuEternal; S.__imuEt = { t: E.turns, regen: E.regen, bossRegen: E.bossRegen, dr: E.dr, reflect: E.reflect, guard: true, name: skill.name }; if (f.__imu) { f.__imu.etMax = E.stackMax || 5; f.__imu.etStep = E.stack || .1; } S.immune = Math.max(S.immune || 0, E.turns);
      if (typeof clearAbnormal === 'function') clearAbnormal(f); STAGES.forEach(k => { if (f.buffs[k] < 0) f.buffs[k] = 0; });
      L(`♾️ ${skill.name}！${E.turns} 回合內每回合恢復 ${pct(isBossUnit(foeOf(f)) && E.bossRegen != null ? E.bossRegen : E.regen)}% 體力、能撐住一次致命傷並回滿、免疫異常／控制／秒殺／能力下降、受到傷害 -${pct(E.dr)}% 並反彈 ${pct(E.reflect)}%`); }
    if (ef.imuDomain) { const D = ef.imuDomain, b = B(); if (b) { b.__imuDom = { t: D.turns, name: skill.name, side: sideKey(f), evade: D.evade, dr: D.dr, acc: D.acc, spd: D.spd, shock: D.shock, shockDmg: D.shockDmg * ((f.__imu && f.__imu.tScale) || 1), bossShockDmg: D.bossShockDmg, punishAt: D.punishAt, punish: D.punish, pend: false }; Object.defineProperty(b.__imuDom, 'owner', { value: f, enumerable: false });
      L(`👑 ${skill.name}！虛空王座展開深淵 ${D.turns} 回合（對手換人也持續）：${f.name} 迴避 +${pct(D.evade)}%、受到傷害 -${pct(D.dr)}%；對手命中與速度 -${pct(D.acc)}%，每回合承受霸王色震懾`); } }
    if (ef.imuRuin && t && t !== f) { const X = ef.imuRuin;
      if (!t.voidImmune) { let n = 0; STAGES.forEach(k => { if (t.buffs[k] > 0) { f.buffs[k] = clamp(f.buffs[k] + t.buffs[k], -6, 6); n += t.buffs[k]; t.buffs[k] = 0; } }); if (n) L(`🔥 毀滅之力清除了 ${t.name} 的能力提升，並奪為己有（${n} 階）！`);
        t.status.__erase = { t: X.erase, healCut: X.healCut }; L(`🔥 ${t.name} 陷入「存在抹除」${X.erase} 回合：治療 -${pct(X.healCut)}%、無法復活、無法發動保命效果！`); }
      if (t.hp > 0 && t.hp < t.maxHp * X.low) { const d = Math.max(1, Math.floor((res.damage || 0) * X.chase)); if (d > 0 && !t.voidImmune) { L(`🔥 ${t.name} 體力低於 ${pct(X.low)}%，黑焰追擊！`); applyDamage(t, d, sideOf(t), { ignoreShield: true }); } }
      if (t.hp < t.maxHp * X.low && Math.random() < X.kill * ((f.__imu && f.__imu.tScale) || 1)) {
        const bench = isPlayerSide(t) ? teamOf().filter(x => x !== B().player && x.hp > 0) : [];
        if (bench.length) { const v = bench[Math.floor(Math.random() * bench.length)];
          if (hasTrait(v, 'immuneExec')) { v.hp = Math.max(0, v.hp - X.flat); L(`🔥 毀滅之力波及未出戰的 ${v.name}，造成 ${X.flat} 點傷害！`); }
          else { v.hp = 0; L(`💀 毀滅之力抹除了未出戰的 ${v.name}！`); }
          try { if (typeof renderTeam === 'function') renderTeam(); } catch (e) { } }
        else if (t.hp > 0 && !t.voidImmune) { L(`🔥 對手沒有其他角色，毀滅之力改為造成 ${X.flat} 點傷害！`); applyDamage(t, X.flat, sideOf(t), { ignoreShield: true }); }
      } }
  }

  /* ---------- 受到傷害 ---------- */
  const _ad = applyDamage; _adRef = _ad;
  applyDamage = function (target, amount, side, opts) {
    if (!target || !target.status || reflecting) return _ad.apply(this, arguments);
    if (target === curActor && target.status.__mirror > 0 && amount > 0 && inAction) { const f = foeOf(target); if (f && f.hp > 0) { L(`🔄 ${target.name} 把反彈回來的傷害反轉回去，${f.name} 自己承受 ${amount} 點！`); reflecting++; try { _ad(f, amount, sideOf(f)); } finally { reflecting--; } hud(); return; } }
    const S = target.status, atk = curActor && curActor !== target && foeOf(target) === curActor ? curActor : null;
    if (S.__imuInv > 0 && amount > 0 && !pierceInv(target)) { L(`🛡️ ${target.name} 處於無敵狀態，不受傷害！`); say(target, '無敵'); hud(); return; }
    let amt = amount;
    if ((kit(target) || domainOwner() === target) && atk && amt > 0) {
      const V = S.__imuEv;
      if (act(V) && V.abyss && Math.random() < V.abyss) { const allies = isPlayerSide(target) ? teamOf().filter(x => x !== target && x.hp > 0) : [];
        if (allies.length) { const a = allies[Math.floor(Math.random() * allies.length)], before = a.hp; a.hp = Math.max(0, a.hp - amt);
          L(`🌑 深淵轉移！這次攻擊由 ${a.name} 承擔了 ${before - a.hp} 點傷害${a.hp <= 0 ? `，${a.name} 倒下了` : ''}`); say(target, '轉移');
          recoil(atk, before - a.hp); try { if (typeof renderTeam === 'function') renderTeam(); } catch (e) { } hud(); return; } }
      let m = 1; if (etOn(target)) m *= 1 - S.__imuEt.dr; const D = domain(); if (D && domainOwner() === target) m *= 1 - D.dr;
      const pz = pierceOf(atk); if (pz > 0 && m < 1) { m = 1 - (1 - m) * (1 - pz); }
      if (m < 1) amt = Math.max(1, Math.floor(amt * m));
    }
    let td = null, er = null;
    if (atk && ((isImu(atk) && atk.__imu.asc > 0) || pierceOf(atk) > 0)) { const pz = isImu(atk) && atk.__imu.asc > 0 ? 1 : pierceOf(atk); td = { drt: S.damageReductionTurns, sdr: target.setDR, dd: S.__dragon ? S.__dragon.dr : null }; if (pz >= 1) { S.damageReductionTurns = 0; target.setDR = 0; if (S.__dragon) S.__dragon.dr = 0; } else { td.drv = S.damageReductionValue; S.damageReductionValue = (S.damageReductionValue || 0) * (1 - pz); target.setDR = (target.setDR || 0) * (1 - pz); if (S.__dragon) S.__dragon.dr = (S.__dragon.dr || 0) * (1 - pz); } }
    if (act(S.__erase) || guardBreak(atk, target, amt)) { er = { ls: S.__lastStand, ch: S.clutchHealCharges, dad: target.__dad ? target.__dad.guts : null }; S.__lastStand = null; S.clutchHealCharges = 0; if (target.__dad) target.__dad.guts = false; }
    const before = target.hp, shield = S.shield || 0; let r;
    try { r = _ad.call(this, target, amt, side, opts); }
    finally {
      if (td) { S.damageReductionTurns = td.drt; if (td.drv != null) S.damageReductionValue = td.drv; target.setDR = td.sdr; if (S.__dragon && td.dd != null) S.__dragon.dr = td.dd; }
      if (er) { S.__lastStand = er.ls; S.clutchHealCharges = er.ch; if (target.__dad && er.dad != null) target.__dad.guts = er.dad; }
    }
    const lost = Math.max(0, before - target.hp);
    if ((kit(target) || domainOwner() === target) && before > 0) imuGuard(target, before, lost, atk, !!er);
    if (atk && lost > 0) recoil(atk, lost);
    if (act(S.__pact)) pactReward(target, before > 0 && amt >= before + (opts && opts.ignoreShield ? 0 : shield));
    return r;
  };
  function recoil(atk, lost) { const S = atk.status; if (!S.__domAct || atk.hp <= 0 || lost <= 0) return; const d = Math.max(1, Math.floor(lost * (S.__domRecoil || .5))); L(`👁 被支配的攻擊反噬：${atk.name} 自己也要承受 ${d} 點傷害！`); bounce(atk, foeOf(atk), d); }
  function imuGuard(f, before, lost, atk, noGuard) {
    const S = f.status, I = f.__imu || {}, hs = healScale(f);
    if (f.hp <= 0 && !noGuard) {
      if (etOn(f) && S.__imuEt.guard) { S.__imuEt.guard = false; f.hp = Math.max(1, Math.floor(f.maxHp * hs)); healFx(f, f.hp); L(`♾️ ${S.__imuEt.name || '永劫不滅'}！${f.name} 保住 1 點體力，立即恢復全部體力！`); say(f, '不滅'); }
      else if (act(S.__imuUnd) && S.__imuUnd.guard) { S.__imuUnd.guard = false; f.hp = Math.min(f.maxHp, 1 + Math.floor(f.maxHp * S.__imuUnd.guardHeal * hs)); healFx(f, f.hp); L(`✨ 不死之身！${f.name} 保住 1 點體力，立即恢復 ${pct(S.__imuUnd.guardHeal)}% 體力！`); say(f, '不死'); }
    }
    if (I.clutch > 0 && f.hp < f.maxHp * I.clutchAt && !(noGuard && f.hp <= 0)) { I.clutch--; const h0 = Math.max(0, f.hp), h = Math.floor((f.maxHp - h0) * hs); f.hp = Math.max(1, h0 + h); if (hs < 1) L(`🩸 回復受到壓制，只回復 ${h}`); healFx(f, h); L(`👑 ${f.name} 瀕死時被最初20人的力量拉回，體力全滿！（剩 ${I.clutch} 次）`); say(f, '回滿'); }
    if (atk && lost > 0 && atk.hp > 0) { let rr = 0; if (act(S.__imuUnd)) rr += S.__imuUnd.thorn || 0; if (etOn(f)) rr += S.__imuEt.reflect || 0;
      if (rr > 0) { const d = Math.max(1, Math.floor(lost * rr)); L(`↩️ ${f.name} 把受到傷害的 ${pct(rr)}%（${d}）反彈給 ${atk.name}！`); bounce(atk, f, d); } }
    const D = domain(); if (D && domainOwner() === f && atk && lost > f.maxHp * D.punishAt && !D.pend) { D.pend = true; L(`👑 ${atk.name} 對${D.name || '世界之王'}造成超過 ${pct(D.punishAt)}% 的傷害，下回合將直接損失目前體力的 ${pct(D.punish)}%！`); }
    hud();
  }

  /* ---------- 回合結束 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    if (!c || !c.status) return _ets.apply(this, arguments);
    curActor = null; const S = c.status, pre = c.hp, inv = S.__imuInv > 0;
    const r = _ets.apply(this, arguments);
    if (inv && c.hp < pre) c.hp = pre;
    cutHeal(c, pre);
    try { marksTick(c); if (kit(c) || domainOwner() === c) imuTick(c); } catch (e) { console.warn('伊姆回合結束錯誤', e); }
    if (typeof beginTurn !== 'function') punishNow();
    return r;
  };
  function marksTick(c) {
    const S = c.status, P = S.__pact;
    if (act(P)) { if (c.hp > 0) { const d = Math.max(1, Math.floor(c.maxHp * P.ratio)); c.hp = Math.max(0, c.hp - d); dmgFx(c, d, '#c8003a'); L(`👁 ${P.full ? '完全支配' : '惡魔契約'}：${c.name} 失去 ${d} 點體力（剩 ${P.t - 1} 回合）`); if (c.hp <= 0) pactReward(c, true); }
      P.t--; if (P.t <= 0 && !P.paid) { S.__pact = null; L(`👁 ${c.name} 的${P.full ? '完全支配' : '惡魔契約'}結束了。`); } }
    if (act(S.__erase)) { S.__erase.t--; if (S.__erase.t <= 0) { S.__erase = null; L(`🔥 ${c.name} 的存在抹除結束了。`); } }
    if (act(S.__healSeal)) { S.__healSeal.t--; if (S.__healSeal.t <= 0) S.__healSeal = null; }
    if (S.__ultSeal > 0) S.__ultSeal--; if (S.__mirror > 0) S.__mirror--; if (S.__free > 0) S.__free--;
  }
  function imuTick(c) {
    const S = c.status, I = c.__imu || { form: 0, exec: 0 }, o = foeOf(c), oOk = o && o.hp > 0 && !o.voidImmune, hs = healScale(c);
    if (I.form > 0) I.formTurns++;
    if (I.form >= 3 && c.hp > 0 && c.__imu && I.formTurns >= f3Turns()) revert3(c); /* v172：第三型態只維持 5 回合 */
    if (S.__imuInv > 0) S.__imuInv--;
    if (c.hp <= 0) return;
    const U = S.__imuUnd; if (act(U)) { const rg = isBossUnit(o) ? U.bossRegen : U.regen; if (canHeal(c)) { const h = Math.min(c.maxHp - c.hp, Math.floor(c.maxHp * rg * hs)); c.hp += h; healFx(c, h); if (h > 0) L(`✨ 不死之身：${c.name} 恢復 ${h} 體力`); } U.t--; if (U.t <= 0) L(`✨ ${c.name} 的不死之身結束了。`); }
    const E = S.__imuEt; if (act(E)) { const rgE = isBossUnit(o) && E.bossRegen != null ? E.bossRegen : E.regen; if (canHeal(c)) { const h = Math.min(c.maxHp - c.hp, Math.floor(c.maxHp * rgE * hs)); c.hp += h; healFx(c, h); }
      if (c.__imu && I.etStacks < (I.etMax || 5)) { I.etStacks++; L(`♾️ ${E.name || '永劫不滅'}：${c.name} 回復體力，攻擊技能威力 +${pct(I.etStacks * (I.etStep || .1))}%`); } E.t--; if (E.t <= 0) { L(`♾️ ${c.name} 的${E.name || '永劫不滅'}結束了。`); } }
    if (act(S.__imuEv)) S.__imuEv.t--;
    if (S.__imuSteal > 0 && oOk && free(o)) { S.__imuSteal--; L(`🥁 ${o.name} 是自由的，體力沒有被奪走！`); }
    else if (S.__imuSteal > 0 && oOk) { const d = Math.max(1, Math.floor(o.hp * I.stealR)); o.hp = Math.max(0, o.hp - d); dmgFx(o, d, '#ff2a5a'); const h = canHeal(c) ? Math.min(c.maxHp - c.hp, Math.floor(d * hs)) : 0; c.hp += h; healFx(c, h); S.__imuSteal--; L(`👑 最初20人奪走 ${o.name} ${d} 點體力${h ? `，${c.name} 回復 ${h}` : ''}（還剩 ${S.__imuSteal} 回合）`); }
    else if (S.__imuSteal > 0) S.__imuSteal--;
    if (I.exec > 0 && o && o.hp > 0) {
      if (Math.random() < I.exec) {
        const no = o.voidImmune || hasTrait(o, 'immuneExec') || ['loki', 'joyboy'].includes(o.id) || etOn(o) || free(o);
        if (no) L(`🛡️ 秒殺判定成功，但 ${o.name} 不會被秒殺！`);
        else if (isBossUnit(o)) { const d = Math.floor(calcAttackDamage(c, o, { type: 'attack', power: 100, effect: { forceMultiplier: 3 } }) * I.pow); L(`👑 秒殺判定成功！${o.name} 是 BOSS，改為受到 3 倍傷害（${d}）`); curActor = c; applyDamage(o, d, sideOf(o), { ignoreShield: true }); curActor = null; }
        else { L(`☠️ 最初20人的秒殺判定成功（${pct(I.exec)}%）！${o.name} 被直接擊倒！`); curActor = c; applyDamage(o, o.hp + (o.status.shield || 0), sideOf(o), { ignoreShield: true }); curActor = null; }
        I.exec = I.execBase;
      } else I.exec = Math.min(1, Math.round((I.exec + I.execStep) * 100) / 100);
    }
    const b = B(), D = b && b.__imuDom; if (D && D.t > 0 && domOwner(D) === c) {
      if (oOk && free(o) && Math.random() < D.shock) L(`🥁 ${o.name} 是自由的，霸王色震懾對他無效！`);
      else if (oOk && Math.random() < D.shock) { const sR = isBossUnit(o) && D.bossShockDmg != null ? D.bossShockDmg : D.shockDmg, d = Math.max(1, Math.floor(o.maxHp * sR)); o.hp = Math.max(0, o.hp - d); dmgFx(o, d, '#ff2a5a');
        if (immune(o) || free(o)) L(`👑 霸王色震懾！${o.name} 受到最大體力 ${pct(sR)}% 的真實傷害（${d}），但免疫了無法行動`);
        else { o.status.__awe = Math.max(o.status.__awe || 0, 1); L(`👑 霸王色震懾！${o.name} 受到最大體力 ${pct(sR)}% 的真實傷害（${d}），下回合無法行動！`); } }
      D.t--; if (D.t <= 0) { b.__imuDom = null; L(`👑 ${D.name || '世界之王'}的深淵消散了。`); }
    }
  }
  function punishNow() {
    const D = domain(); if (!D || !D.pend) return; D.pend = false; const o = foeOf(domainOwner()); if (!o || o.hp <= 0) return;
    const d = Math.floor(o.hp * D.punish); if (d <= 0) return; o.hp -= d; dmgFx(o, d, '#ff2a5a'); L(`👑 ${D.name || '世界之王'}的懲罰：${o.name} 直接損失目前體力的 ${pct(D.punish)}%（${d}）！`); hud();
  }
  if (typeof beginTurn === 'function') { const _bt = beginTurn; beginTurn = function () { try { punishNow(); } catch (e) { } return _bt.apply(this, arguments); }; }

  /* ---------- 出招前後：震懾、封印、支配、命中、迴避 ---------- */
  function preAct(actor, target, idx) {
    const S = actor.status, out = { idx, skip: false };
    if (S.__awe > 0) { S.__awe--; L(`👑 ${actor.name} 被霸王色震懾，這回合無法行動！`); say(actor, '震懾'); out.skip = true; return out; }
    if (S.__sealNext > 0) { S.__sealNext--; L(`🔒 ${actor.name} 的主動技能被封印，這回合無法施放！`); say(actor, '封印'); out.skip = true; return out; }
    let skill = idx >= 0 ? actor.skills[idx] : null;
    if (S.__nullNext > 0 && skill) { S.__nullNext = 0; if (skill.pp > 0) skill.pp--; L(`🕳️ ${actor.name} 的「${skill.name}」被黑暗吞噬，失效了！`); say(actor, '失效'); out.skip = true; return out; }
    if (S.__ultSeal > 0 && skill && skill.ultimate) { L(`⛓️ ${actor.name} 被壓制，無法施放奧義「${skill.name}」！`); say(actor, '壓制'); out.skip = true; return out; }
    if (skill && skill.effect && skill.effect.breakInvuln && target && (target.status.invuln > 0 || target.status.__imuInv > 0)) { target.status.invuln = 0; target.status.__imuInv = 0; L(`⚡ ${actor.name} 的「${skill.name}」打破了 ${target.name} 的無敵！`); }
    if (S.__imuDomd > 0) { S.__imuDomd--; const pool = actor.skills.map((s, i) => ({ s, i })).filter(x => x.s && x.s.pp > 0 && !x.s.locked);
      if (pool.length) { const pk = pool[Math.floor(Math.random() * pool.length)]; out.idx = pk.i; skill = pk.s; L(`👁 ${actor.name} 被支配，無法自己選擇技能，被迫施放「${pk.s.name}」！`); say(actor, '支配'); if (skill.type === 'attack') S.__domAct = 1; } }
    if (S.__sealAtk > 0) { S.__sealAtk--; if (skill && skill.type === 'attack') { L(`🔒 ${actor.name} 的攻擊技能被黑焰封印，這回合無法攻擊！`); say(actor, '封印'); S.__domAct = 0; out.skip = true; return out; } }
    const D = skill && domainVs(actor); if (D) { out.acc = [skill, skill.accuracy]; skill.accuracy = skill.accuracy * (1 - D.acc); }
    if (skill && skill.type === 'attack' && target && isImu(target) && target.hp > 0) { const ev = evadeChance(target); if (ev > 0 && Math.random() < ev) { target.status.dodge = (target.status.dodge || 0) + 1; out.dodge = target.status.dodge; out.dodgeT = target; } }
    return out;
  }
  function postAct(actor, target, skill, pre) {
    if (pre.acc) pre.acc[0].accuracy = pre.acc[1];
    if (pre.dodgeT) { const T = pre.dodgeT; if ((T.status.dodge || 0) >= pre.dodge) T.status.dodge = Math.max(0, T.status.dodge - 1);
      else if (T.__imu.voidUsed && T.__imu.evStacks < (T.__imu.stackMax || 3)) { T.__imu.evStacks++; L(`🌑 ${T.name} 迴避成功！下一次攻擊威力 +${T.__imu.evStacks * 20}%（最多 ${(T.__imu.stackMax || 3) * 20}%）`); } }
    if (actor && actor.status) actor.status.__domAct = 0;
  }

  /* ---------- 出招：包住 executeAction（battle.js） ---------- */
  if (typeof executeAction === 'function') {
    const _ea = executeAction;
    executeAction = async function (side, idx) {
      const b = B(); if (!b) return _ea.apply(this, arguments);
      const actor = side === 'P' ? b.player : b.enemy, target = side === 'P' ? b.enemy : b.player;
      if (!actor || actor.hp <= 0) return _ea.apply(this, arguments);
      const pre = window.IMU165.preAct(actor, target, idx); /* v169：經過 window.IMU165，讓 ext_v169 的包裝（看穿）也套用到實戰 */
      if (pre.skip) { hud(); try { renderSkills(); } catch (e) { } await wait(650); return; }
      idx = pre.idx; const skill = idx >= 0 ? actor.skills[idx] : null, pp0 = skill ? skill.pp : 0, seq0 = isImu(actor) ? actor.__imu.ascSeq : 0;
      inAction++; curActor = actor; let r;
      try { r = await _ea.call(this, side, idx); }
      finally { inAction--; window.IMU165.postAct(actor, target, skill, pre); curActor = null; }
      if (isImu(actor) && skill && skill.effect && skill.effect.imuAscend && skill.pp < pp0 && actor.__imu.ascSeq === seq0 && actor.hp > 0) ascend(actor, target, skill.effect.imuAscend); /* 附加效果被封印時，晉升本身仍然發生 */
      if (isImu(actor) && actor.__imu.pend != null) { const form = actor.__imu.pend; actor.__imu.pend = null;
        if (onScreen(actor) && typeof imuFormFx === 'function') { try { await imuFormFx(side === 'P' ? 'L' : 'R', actor, form, () => setForm(actor, form)); } catch (e) { console.warn(e); setForm(actor, form); } } else setForm(actor, form);
        hud(); try { renderSkills(); } catch (e) { } }
      return r;
    };
  }

  /* ---------- 敵方 AI：先晉升，再用②③④ ---------- */
  function ai(f, o) {
    if (!isImu(f) || !o) return -1;
    const s = f.skills, ok = i => !!(s[i] && !s[i].locked && s[i].pp > 0 && !(s[i].ultimate && f.status.__ultSeal > 0)), I = f.__imu, S = f.status, hp = f.hp / f.maxHp, OS = o.status || {};
    if (S.__sealAtk > 0) { for (const i of [0, 1, 2, 4]) if (ok(i) && s[i].type !== 'attack') return i; }
    const top = I.form >= maxFormOf(f);
    if (I.throne && I.form >= 2 && !top && ok(4) && I.formTurns >= (I.pace || 6)) return 4; /* v169：王座的伊姆第二型態也會再晉升到第三型態（不放天罰） */
    if (I.throne && I.form >= 2) { for (const i of (Math.random() < .5 ? [3, 2, 1, 0] : [2, 1, 3, 0])) if (ok(i) && !(i === 2 && domain()) && !(i === 0 && act(S.__imuEt))) return i; return ok(3) ? 3 : -1; }
    /* pace：勇者之塔的伊姆不會一開場就晉升（tower.js 的 enemyMod.imuPace＝第幾回合起才放⑤；體力低於 50% 時提早） */
    const b0 = B(), rd = (b0 && b0.round) || 1, wait5 = I.pace && hp >= (I.paceHp ?? .5) && (I.form === 0 ? rd < I.pace : I.formTurns < (I.paceNext || I.pace)); /* v169 paceNext：第一次晉升之後，每次再晉升至少隔幾回合（tower.js enemyMod.imuPaceNext） */
    if (wait5 && !top) { if (I.form === 0) { if (ok(0) && !act(S.__imuUnd) && hp < .9) return 0; return -2; } }
    if (I.form === 0) { if (ok(4)) return 4; if (ok(0)) return 0; return -1; }
    if (I.form === 1) {
      if (hp < .35 && ok(0) && !act(S.__imuUnd)) return 0;
      if (!act(OS.__pact) && ok(1)) return 1;
      if (ok(4) && !wait5 && (I.formTurns >= 2 || hp < .5)) return 4;
      if (!act(S.__imuEv) && ok(2) && Math.random() < .5) return 2;
      for (const i of [3, 2, 4, 0, 1]) if (ok(i)) return i; return -1;
    }
    if (hp < .45 && ok(0) && !act(S.__imuEt)) return 0;
    if (!top && ok(4) && !wait5 && (I.formTurns >= 3 || hp < .5)) return 4; /* v169：第二型態會再晉升到第三型態（不等無敵結束） */
    if (!domain() && ok(2)) return 2;
    if (!act(OS.__pact) && ok(1)) return 1;
    if (ok(4) && !(S.__imuInv > 0) && (hp < .5 || (I.form >= 3 && I.formTurns >= 4)) && Math.random() < .5) return 4;
    for (const i of [3, 1, 2, 0, 4]) if (ok(i)) return i; return -1;
  }
  if (typeof pickEnemySkill === 'function') {
    const _pes = pickEnemySkill;
    pickEnemySkill = function () {
      const b = B(), e = b && b.enemy;
      if (e && isImu(e)) { const i = ai(e, b.player); if (i >= 0) return i; if (i === -2) return -1; /* 還沒到晉升的時機：用奮力一擊 */ }
      let i = _pes.apply(this, arguments);
      if (e && e.status && e.status.__ultSeal > 0 && i >= 0 && e.skills[i] && e.skills[i].ultimate) { const al = e.skills.map((s, k) => ({ s, k })).filter(x => x.s.pp > 0 && !x.s.locked && !x.s.ultimate); if (al.length) i = al[Math.floor(Math.random() * al.length)].k; }
      if (e && e.status && e.status.__sealAtk > 0 && i >= 0 && e.skills[i] && e.skills[i].type === 'attack') { const sup = e.skills.map((s, k) => ({ s, k })).filter(x => x.s.pp > 0 && !x.s.locked && x.s.type !== 'attack'); if (sup.length) i = sup[Math.floor(Math.random() * sup.length)].k; }
      return i;
    };
  }

  /* ---------- 速度：世界之王領域 ---------- */
  if (typeof effectiveSpeed === 'function') { const _es = effectiveSpeed; effectiveSpeed = function (c) { const v = _es.apply(this, arguments); const D = domainVs(c); return D ? v * (1 - D.spd) : v; }; }

  /* ---------- 倒下：契約回報、存在抹除（無法復活） ---------- */
  if (typeof checkBattleEnd === 'function') {
    const _cbe = checkBattleEnd;
    checkBattleEnd = function () {
      const b = B();
      if (b) [b.player, b.enemy, ...teamOf()].forEach(f => { if (!f || !f.status || f.hp > 0) return; pactReward(f, true);
        const S = f.status; if (act(S.__erase) && (S.undyingTurns > 0 || S.lives > 0 || S.revive > 0)) { S.undyingTurns = 0; S.lives = 0; S.revive = 0; L(`🔥 ${f.name} 的存在被抹除，無法復活！`); } });
      return _cbe.apply(this, arguments);
    };
  }

  /* ---------- 道具回復也受減療影響 ---------- */
  if (typeof applyItem === 'function') { const _ai = applyItem; applyItem = async function () { const b = B(), p = b && b.player, h0 = p ? p.hp : 0; const r = await _ai.apply(this, arguments); if (p) { cutHeal(p, h0); hud(); } return r; }; }

  /* ---------- BOSS 奧義次數上限（story_boss_v156 的 bossUltCap）不套用在「最初20人」：使用者指定 4 次 ---------- */
  if (typeof applyChapterDifficulty === 'function') { const _acd = applyChapterDifficulty; applyChapterDifficulty = function (f) { const r = _acd.apply(this, arguments); const U = r && r.id === 'imu' && r.skills && r.skills[4];
    if (U && U.effect && U.effect.imuAscend && !U.locked) { const n = ((CHARACTERS.imu.skills || [])[4] || {}).maxPP || 5; U.pp = U.maxPP = n; } return r; }; } /* v172：固定 5 次（難度不加次數） */

  /* ---------- 建立角色與開戰 ---------- */
  if (typeof buildFighter === 'function') { const _bf = buildFighter; buildFighter = function (id) { const f = _bf.apply(this, arguments); if (id === 'imu') init(f); return f; }; }
  if (typeof startBattle === 'function') {
    const _sb = startBattle;
    startBattle = function () {
      const r = _sb.apply(this, arguments); const b = B();
      if (b) { b.__imuDom = null; [b.enemy, ...teamOf()].forEach(f => { if (f && f.id === 'imu') { init(f); lockForm(f); } });
        if (isImu(b.enemy) && b.opts && b.opts.enemyMod && b.opts.enemyMod.imuPace) { b.enemy.__imu.pace = b.opts.enemyMod.imuPace; if (b.opts.enemyMod.imuPaceHp != null) b.enemy.__imu.paceHp = b.opts.enemyMod.imuPaceHp; if (b.opts.enemyMod.imuPaceNext) b.enemy.__imu.paceNext = b.opts.enemyMod.imuPaceNext; }
        if (isImu(b.enemy) && b.opts && b.opts.enemyMod && b.opts.enemyMod.imuMaxForm != null) b.enemy.__imu.maxForm = b.opts.enemyMod.imuMaxForm; /* v169：勇者之塔第 200 層停在第二型態 */
        if (isImu(b.enemy) && b.opts && b.opts.tower && b.enemy.skills[4]) b.enemy.skills[4].pp = b.enemy.skills[4].maxPP = 9999; /* v172 使用者 11/07：勇者之塔的伊姆第 5 招次數無限 */
        /* 虛空王座：伊姆完全體直接以第二型態登場（不經過晉升，所以沒有晉升的無敵、奪血、秒殺判定），也不施放「最初20人」，
           否則開場連續 10 回合無敵、累積傷害永遠是 0，挑戰失去意義（v165 待使用者確認） */
        const e = b.enemy; if (b.opts && b.opts.throne && isImu(e) && e.__imu.form === 0) throneInit(e);
        try { renderSkills(); renderHUD(true); } catch (e) { } }
      return r;
    };
  }

  /* ---------- 介面：技能按鈕（型態未開啟、攻擊封印）與狀態標籤 ---------- */
  if (typeof renderSkills === 'function') {
    const _rs = renderSkills;
    renderSkills = function () {
      const r = _rs.apply(this, arguments); const b = B(), p = b && b.player, root = document.getElementById('bSkills'); if (!p || !root) return r;
      const kids = root.children;
      p.skills.forEach((s, i) => { const el = kids[i]; if (!el) return;
        if (s.locked === 'form') { const d = el.querySelector('.sk-desc'), k = el.querySelector('.sk-kind'); if (d) d.textContent = '晉升第一型態後開啟'; if (k) k.textContent = '型態'; el.classList.add('imu-form-lock'); }
        if (p.status.__ultSeal > 0 && s.ultimate && el.tagName === 'BUTTON') { el.disabled = true; el.classList.add('imu-sealed'); el.title = '奧義被壓制'; }
        if (p.status.__sealAtk > 0 && s.type === 'attack' && el.tagName === 'BUTTON') { el.disabled = true; el.classList.add('imu-sealed'); el.title = '攻擊技能被黑焰封印'; } });
      return r;
    };
  }
  if (typeof statusChips === 'function') {
    const _sc = statusChips;
    statusChips = function (c) {
      const h0 = _sc.apply(this, arguments); const S = c && c.status; if (!S) return h0; let h = ''; /* v165 標籤放在最前面：手機只顯示前 3 個 */
      const chip = (t, k, tip) => { h += `<span class="chip ${k}"${tip ? ` title="${tip}"` : ''}>${t}</span>`; };
      if (isImu(c)) { const I = c.__imu;
        if (I.form > 0) chip((((CHARACTERS.imu && CHARACTERS.imu.forms) || [])[I.form] || {}).label + (I.form >= 3 ? ' ' + Math.max(1, f3Turns() - I.formTurns) : '') || '型態', 'up', I.form >= 3 ? `第三型態還剩 ${Math.max(1, f3Turns() - I.formTurns)} 回合，之後降回第二型態` : '最初20人晉升的型態');
        if (S.__imuInv > 0) chip('無敵 ' + S.__imuInv, 'good', '不受任何傷害');
        if (act(S.__imuUnd)) chip('不死 ' + S.__imuUnd.t, 'good', `每回合回復、${S.__imuUnd.guard ? '可撐住一次致命傷、' : ''}反彈 ${pct(S.__imuUnd.thorn)}% 傷害`);
        if (act(S.__imuEt)) chip((S.__imuEt.name || '永劫不滅') + ' ' + S.__imuEt.t, 'good', `每回合回復 ${pct(S.__imuEt.regen)}%、減傷 ${pct(S.__imuEt.dr)}%、反彈 ${pct(S.__imuEt.reflect)}%`);
        if (act(S.__imuEv)) chip(`迴避 +${pct(S.__imuEv.evade)}% ` + S.__imuEv.t, 'good', '受到攻擊時有機率迴避或深淵轉移');
        if (I.evStacks > 0) chip(`下擊 +${I.evStacks * 20}%`, 'up', '迴避成功的累積加成');
        if (I.etStacks > 0) chip(`攻擊威力 +${pct(I.etStacks * (I.etStep || .1))}%`, 'up', '永劫不滅的累積加成');
        if (I.pow > 1) chip('威力 ×' + I.pow, 'up', '最初20人：全部技能威力提升，傷害改為真實傷害');
        if (S.__imuSteal > 0) chip('奪血 ' + S.__imuSteal, 'up', `每回合奪走對手目前體力 ${pct(I.stealR)}%`);
        if (I.exec > 0) chip('秒殺 ' + pct(I.exec) + '%', 'up', '每回合判定秒殺對手，失敗則 +5%');
        if (I.clutch > 0) chip('瀕死回滿 ×' + I.clutch, 'good', `體力低於 ${pct(I.clutchAt)}% 時恢復全部體力`);
        const D = domain(); if (D && domainOwner() === c) chip((D.name || '世界之王') + ' ' + D.t, 'good', `迴避 +${pct(D.evade)}%、減傷 ${pct(D.dr)}%、每回合霸王色震懾`);
      }
      if (act(S.__pact)) chip(`${S.__pact.full ? '完全支配' : '惡魔契約'} ${S.__pact.t}`, 'bad', `每回合失去最大體力 ${pct(S.__pact.ratio)}%${S.__pact.healCut ? `、治療 -${pct(S.__pact.healCut)}%` : ''}${S.__pact.noBuff ? '、無法獲得能力提升' : ''}`);
      if (S.__imuDomd > 0) chip('支配', 'bad', '下一次行動無法自己選擇技能');
      if (S.__sealAtk > 0) chip('攻擊封印', 'bad', '下一回合無法使用攻擊技能');
      if (S.__sealNext > 0) chip('技能封印', 'bad', '下一次主動技能會被封印');
      if (S.__awe > 0) chip('霸王色震懾', 'bad', '下回合無法行動');
      if (act(S.__erase)) chip('存在抹除 ' + S.__erase.t, 'bad', `治療 -${pct(S.__erase.healCut)}%、無法復活、無法發動保命效果`);
      if (act(S.__healSeal)) chip(`回復 -${pct(S.__healSeal.cut)}% ${S.__healSeal.t}`, 'bad', '回復量被壓制');
      if (S.__ultSeal > 0) chip('奧義壓制 ' + S.__ultSeal, 'bad', '無法使用第 5 招（含變身與晉升）');
      if (S.__nullNext > 0) chip('下一招失效', 'bad', '下一招會被黑暗吞噬');
      if (S.__mirror > 0) chip('反彈反轉 ' + S.__mirror, 'good', '反彈到自己身上的傷害會轉回去');
      if (S.__free > 0) chip('自由 ' + S.__free, 'good', '不受契約、支配、封印、壓制與秒殺');
      const Dv = domainVs(c); if (Dv) chip(`命中・速度 -${pct(Dv.acc)}%`, 'bad', `${Dv.name || '世界之王'}的深淵壓制（換人也持續）`);
      return h + h0;
    };
  }

  function throneInit(e) { const I = e.__imu; I.throne = true; I.tScale = THRONE_SCALE; I.pace = THRONE_PACE; I.paceHp = 0; e.dmgMul = (e.dmgMul || 1) * THRONE_DMG;
    lockForm(e); const U = e.skills[4]; if (U) U.pp = U.maxPP = 9999; /* v172 使用者 11/07：虛空王座的伊姆第 5 招次數無限 */
    L(`👑 虛空王座上的伊姆從初始型態開始，施放「最初20人」後才會一步步晉升！`); }
  /* 虛空王座的伊姆（v167：從初始型態開始，第 THRONE_PACE 回合起才施放「最初20人」，晉升後每次至少隔 THRONE_PACE 回合）：比例類效果（契約、霸王色震懾、毀滅之力追加、擊殺未出戰角色的機率、晉升的奪血與秒殺判定）×THRONE_SCALE，傷害倍率 ×THRONE_DMG。
     王座比的是累積傷害，伊姆照原規格出手時三人隊 4～5 回合全滅、累積傷害幾乎是 0；調整後回到與 v164 王座相近的挑戰長度（v165 待使用者確認） */
  const THRONE_SCALE = .2, THRONE_DMG = .35, THRONE_PACE = 6;
  window.IMU165 = { throneInit, preAct, postAct, ai, setForm, init, lockForm, ascend, punishNow, pactReward, maxFormOf, isPlayerSide, teamOf, free };
})();

/* ==== 原 js/ext_v167.js ==== */
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

/* ==== 原 js/ext_v168.js ==== */
/* v168 使用者 11/06：皇帝領海第二階段（分身）、第三階段（真身）不能被秒殺——觸發任何秒殺效果時不扣血，對手改為恢復全部體力，一般傷害照常。
   開關：emperor.js 在第二、三階段的 startBattle 帶 noExec: true（battle.opts.noExec）；第一階段（隊長連戰）不受影響。
   攔截的路徑：
   ① computeSkillOutcome 回傳的 meta.execute（executeChance／executeChanceRange／perHitExecute／markBonus.exec／洛克斯「殺」rocksKill／
      霸王色 haoshoku「當場失去意識」）、meta.executeBuff（瞬、尼德霍格覺醒等「秒殺威壓」）、meta.bossExec（BOSS 被秒殺改 3 倍傷害、霸王色 3 倍）。
      battle_core 的 BOSS 規則會再呼叫一次最外層的 computeSkillOutcome，所以秒殺在變成「3 倍傷害」之前就先被這裡擋下。
      擋下後在 meta 留 __execBlocked：外層包裝（例如洛克斯「殺」沒秒殺時改扣體力）之後補上的傷害一律歸 0。
   ② 保險：技能附加效果（applySkillEffects）或回合結束（endTurnStatus）期間，對手體力被直接設成 0、且戰鬥紀錄出現秒殺字樣
      （黑轉支配、伊姆的秒殺判定、完全支配、毀滅之力抹除等）→ 同樣改成恢復全部體力。
   必須在所有 computeSkillOutcome／applySkillEffects／endTurnStatus 包裝之後載入（含 DOMContentLoaded 才包的 progress_v131、trial_v133）。 */
(function () {
  const B = () => (typeof battle !== 'undefined' ? battle : null);
  const on = t => { const b = B(); return !!(b && b.opts && b.opts.noExec && t && t === b.enemy); };
  const EXEC_KEYS = ['execute', 'executeBuff', 'bossExec'];
  const KILL_RE = /秒殺|失去意識|直接擊倒|黑轉支配|完全支配|抹除了|歸 ?0/, NOT_KILL = /機率|威壓狀態|秒殺無效|不會被秒殺/;
  const killLog = buf => buf.some(a => { const s = String(a[0]); return KILL_RE.test(s) && !NOT_KILL.test(s); });
  function restore(t, why) {
    const h = Math.max(0, t.maxHp - Math.max(0, t.hp)); t.hp = t.maxHp;
    try { log(`👑 霸氣護體！${why || '秒殺無效'}，${t.name}恢復全部體力`, 'foe'); } catch (e) { }
    try { if (h > 0 && typeof showHeal === 'function') showHeal('R', h); if (typeof floatText === 'function') floatText('R', '秒殺無效', 'status'); } catch (e) { }
    try { if (typeof renderHUD === 'function') renderHUD(); } catch (e) { }
  }
  /* 戰鬥紀錄暫存：秒殺被擋下時，拿掉「改為受到 3 倍傷害」「當場失去意識」這類和結果矛盾的句子 */
  function withLogs(fn) {
    const lg = window.log, buf = []; window.log = (...a) => { buf.push(a); };
    let r; try { r = fn(); } finally { window.log = lg; }
    return { r, buf, flush: drop => buf.forEach(a => { if (!(drop && drop.test(String(a[0])))) { try { lg(...a); } catch (e) { } } }) };
  }
  function install() {
    if (window.__empNoExec168) return; window.__empNoExec168 = true;
    const _cso = computeSkillOutcome;
    computeSkillOutcome = function (actor, target, skill, blocked) {
      if (!on(target)) return _cso.apply(this, arguments);
      const args = arguments, self = this, W = withLogs(() => _cso.apply(self, args)), r = W.r;
      if (!r) { W.flush(); return r; }
      const m = r.meta = r.meta || {};
      if (EXEC_KEYS.some(k => m[k])) {
        EXEC_KEYS.forEach(k => { m[k] = false; }); m.haoshoku = m.haoshoku && 'blocked'; m.__execBlocked = true;
        r.damage = 0; delete m.lifesteal; delete m.trueDamage; delete m.imuTrue;
        W.flush(/改為受到 ?3 ?倍傷害|當場失去意識|撐住了(致命一擊|霸王色)/); restore(target);
        return r;
      }
      /* 內層已擋下秒殺：外層之後補的傷害（例如洛克斯「殺」沒秒殺時改扣體力）不算，相關紀錄也拿掉 */
      W.flush(m.__execBlocked ? /被奪去.*體力|改為受到 ?3 ?倍傷害/ : null);
      if (m.__execBlocked) { r.damage = 0; delete m.lifesteal; delete m.trueDamage; }
      return r;
    };
    const _ase = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) {
      const b = B(), e = b && b.enemy; if (!on(e)) return _ase.apply(this, arguments);
      const before = e.hp, args = arguments, self = this, W = withLogs(() => _ase.apply(self, args)); W.flush();
      if (before > 0 && e.hp <= 0 && e === B().enemy && killLog(W.buf)) { e.status.dominated = false; restore(e); }
      return W.r;
    };
    const _ets = endTurnStatus;
    endTurnStatus = function (c) {
      const b = B(), e = b && b.enemy; if (!on(e)) return _ets.apply(this, arguments);
      const before = e.hp, args = arguments, self = this, W = withLogs(() => _ets.apply(self, args)); W.flush();
      if (before > 0 && e.hp <= 0 && killLog(W.buf)) restore(e);
      return W.r;
    };
    if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function (opts) { const r = _sb.apply(this, arguments); try { if (opts && opts.noExec && B()) log(`👑 ${B().enemy.name} 的霸氣護體：這一戰秒殺效果無效（觸發時會恢復全部體力），只能一點一點削減體力！`, 'foe'); } catch (e) { } return r; }; }
  }
  /* 有些包裝在 DOMContentLoaded 才裝上（progress_v131、trial_v133）；本檔載入較晚，同一事件裡排在它們後面 */
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', install); else install();
  window.EMP_NOEXEC168 = { on };
})();

/* ==== 原 js/ext_v169.js ==== */
/* v169 伊姆第三型態「深淵聖靈・伊姆」的新效果（使用者 11/07 00:36；技能資料在 js/balance_v165.js 的 form3Skills）。做成通用欄位，任何技能都能用：
   foresight: n        「看穿」n 回合：每回合第一次受到的攻擊必定迴避。能打破無敵的攻擊（breakInvuln）、必中攻擊（sureHit）、自由狀態（尼卡魯夫 freeTurns）下的攻擊不會被看穿。
                       做法：包住 window.IMU165.preAct／postAct（battle.js 的 executeAction 包裝與 tests/*-sim.js 都走這裡），出招前給目標 1 次閃避，沒用掉就收回。
   imuPact.chain: r    「契約連鎖」：契約中的角色每回合結束時，他那一方後排還沒上場的角色也失去最大體力 r（ext_v165 把 chain 存進 status.__pact）。
   splash: r           「翅膀掃擊」：攻擊命中後，目標那一方後排還沒上場的角色受到這次傷害 r 的波及。
   後排＝battle.team 裡不是 battle.player、還站著的角色；只有我方有後排（單人戰、BOSS 戰、伊姆在我方時對手沒有後排，這兩個效果自動不發動）。
   載入順序：ext_v165.js、ext_v168.js 之後，loader.js 之前。 */
(function () {
  const I = window.IMU165; if (!I || typeof applySkillEffects !== 'function' || typeof endTurnStatus !== 'function') return;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const pct = x => Math.round(x * 100);
  const say = (f, t) => { try { const b = B(); if (b && (f === b.player || f === b.enemy)) floatText(f === b.enemy ? 'R' : 'L', t, 'status'); } catch (e) { } };
  const free = f => !!(f && f.status && f.status.__free > 0);
  /* 目標那一方的後排（只有我方有） */
  function bench(t) { const b = B(); if (!b || !t || !Array.isArray(b.team) || !I.isPlayerSide(t)) return []; return b.team.filter(x => x && x !== b.player && x !== t && x.hp > 0 && !x.voidImmune); }
  function hurtBench(list, amt, msg) {
    if (!list.length) return; const parts = [];
    list.forEach(v => { const d = Math.max(1, Math.floor(amt(v))); const h0 = v.hp; v.hp = Math.max(0, v.hp - d); parts.push(`${v.name} -${h0 - v.hp}${v.hp <= 0 ? '（倒下）' : ''}`); });
    L(`${msg}：${parts.join('、')}`);
    try { if (typeof renderTeam === 'function') renderTeam(); } catch (e) { }
  }

  /* ---------- 看穿：出招前後 ---------- */
  const round = () => { const b = B(); return (b && b.round) || 0; };
  const foresee = t => { const F = t && t.status && t.status.__foresee; return F && F.t > 0 && F.r !== round() ? F : null; };
  const _pre = I.preAct, _post = I.postAct;
  I.preAct = function (actor, target, idx) {
    const out = _pre.apply(this, arguments);
    if (!out || out.skip || !target || target === actor || target.hp <= 0) return out;
    const sk = out.idx >= 0 && actor.skills ? actor.skills[out.idx] : null, ef = (sk && sk.effect) || {};
    if (!sk || sk.type !== 'attack' || !foresee(target)) return out;
    if (ef.breakInvuln || ef.sureHit || free(actor)) return out;
    target.status.dodge = (target.status.dodge || 0) + 1; out.fsT = target; out.fsD = target.status.dodge;
    return out;
  };
  I.postAct = function (actor, target, skill, pre) {
    if (pre && pre.fsT) { const T = pre.fsT, F = T.status.__foresee;
      if ((T.status.dodge || 0) >= pre.fsD) T.status.dodge = Math.max(0, T.status.dodge - 1); /* 沒用到：收回 */
      else if (F) { F.r = round(); L(`👁 ${T.name} 的千眼看穿了「${skill ? skill.name : '攻擊'}」，完全迴避！`); say(T, '看穿'); } }
    return _post.apply(this, arguments);
  };

  /* ---------- 技能效果：看穿、契約連鎖、翅膀掃擊 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const r = _ase.apply(this, arguments);
    try {
      const ef = (skill && skill.effect) || {};
      if (!actor || !actor.status || skill.__voidFx) return r;
      if (ef.foresight) { actor.status.__foresee = { t: ef.foresight, r: -1 }; L(`👁 ${actor.name} 睜開千眼：${ef.foresight} 回合內每回合第一次受到的攻擊必定迴避！`); }
      if (ef.splash && target && target !== actor && result && result.damage > 0) {
        const list = bench(target), dmg = result.damage;
        hurtBench(list, () => dmg * ef.splash, `🪽 翅膀掃擊波及後排（這次傷害的 ${pct(ef.splash)}%）`);
      }
    } catch (e) { console.warn('v169 效果錯誤', e); }
    return r;
  };

  /* ---------- 回合結束：契約連鎖、看穿倒數 ---------- */
  const _ets = endTurnStatus;
  endTurnStatus = function (c) {
    const P = c && c.status && c.status.__pact, on = !!(P && P.t > 0 && P.chain > 0 && c.hp > 0 && !free(c));
    const r = _ets.apply(this, arguments);
    try {
      if (on) hurtBench(bench(c).filter(v => !free(v)), v => v.maxHp * P.chain, `⛓️ 契約連鎖：後排角色也失去最大體力 ${pct(P.chain)}%`);
      const F = c && c.status && c.status.__foresee; if (F && F.t > 0) { F.t--; if (F.t <= 0) { c.status.__foresee = null; L(`👁 ${c.name} 的千眼閉上了。`); } }
    } catch (e) { console.warn('v169 回合結束錯誤', e); }
    return r;
  };

  /* ---------- 戰鬥狀態列 ---------- */
  if (typeof statusChips === 'function') {
    const _sc = statusChips;
    statusChips = function (c) {
      const h = _sc.apply(this, arguments), S = c && c.status; if (!S) return h; let x = '';
      if (S.__foresee && S.__foresee.t > 0) x += `<span class="chip good" title="每回合第一次受到的攻擊必定迴避${S.__foresee.r === round() ? '（本回合已用）' : ''}">看穿 ${S.__foresee.t}</span>`;
      if (S.__pact && S.__pact.t > 0 && S.__pact.chain > 0) x += `<span class="chip bad" title="後排角色每回合失去最大體力 ${pct(S.__pact.chain)}%">契約連鎖</span>`;
      return x + h;
    };
  }
})();

/* ==== 原 js/ext_v172.js ==== */
/* v172 洛基三型態（使用者 11/07 19:34）：設定跟伊姆類似，施放第 5 招「尼德霍格覺醒」就晉升型態、技能欄換新、效果強化；技能設計用來克制伊姆。
   型態：0 第一型態「詛咒王子・洛基」（原立繪，尺寸 2.5）→ 1 第二型態「尼德霍格・洛基」（loki_form2，尺寸 5）→ 2 第三型態「諸神黃昏・洛基」（loki_form3，尺寸 4.5）。
   尺寸以伊姆初始型態＝1 為單位（見下方 UNIT 換算）。
   第 5 招（4 次、不能用道具恢復）：第一次晉升第二型態、第二次晉升第三型態，第 1～4 招換成新型態的技能、次數全滿；第三型態再施放＝「諸神黃昏」。
   克制伊姆的做法（都是通用效果，對所有對手都有效）：
     sureHit 必中（無視閃避、看穿、虛空威壓與世界之王的迴避，也無視領域降低的命中）｜pierceDR／breakInvuln 穿透減傷與無敵
     lokiDispel { block }：打散對手全部強化（能力提升、護盾、減傷、無敵、閃避、反彈、荊棘、不死之身、永劫不滅、虛空威壓、看穿、對手展開的領域），並封鎖強化 block 回合
     godSlayer：對「變身／晉升／覺醒中」的對手傷害 ×godSlayer｜voidGuard／guardBreak 讓保命失效｜healSeal 壓制回復｜ultSeal 壓制奧義（含晉升）
     freeTurns 自由（不受契約、支配、封印、奪血、秒殺）｜mirror 反彈轉回｜drainForm 吸走型態加成
   既有的「巨人的意志」（ext_v109／ext_v110）保留：伊姆的支配與秒殺對洛基無效、受到伊姆的傷害減半、覺醒後受到傷害 -20%。
   載入順序：ext_v169.js、fx_imu_v170.js 之後（最外層包裝 applySkillEffects、computeSkillOutcome、playChoreo）。 */
(function () {
  const C = typeof CHARACTERS !== 'undefined' && CHARACTERS.loki; if (!C) return;
  const V = 172, img = n => `assets/chars/${n}.webp?v=${V}`;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const pct = x => Math.round(x * 100), R = (a, b) => a + Math.random() * (b - a);
  const STAGES = ['atk', 'def', 'spd'];
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const say = (f, t) => { try { if (onScreen(f)) floatText(sideOf(f), t, 'status'); } catch (e) { } };
  const act = o => !!(o && (o.t > 0 || o.left > 0));

  /* ---------- 資料 ---------- */
  /* 尺寸換算：使用者說的「立繪尺寸」以伊姆初始型態為 1（伊姆深淵聖靈 5.5 也是同一個單位）。洛基的立繪本身是伊姆的 1.5÷0.65 倍大，
     所以第一型態 2.5 → 對戰大小 2.5×0.65÷1.5≈1.08；第二型態 5、第三型態 4.5 → 型態倍率 5÷2.5＝2、4.5÷2.5＝1.8（視覺設定頁可再微調）。 */
  const UNIT = ((CHARACTERS.imu && CHARACTERS.imu.scale) || .65) / (C.scale || 1.5), SZ = [2.5, 5, 4.5];
  C.battleScale = Math.round(SZ[0] * UNIT * 100) / 100;
  C.forms = [
    { key: 'form1', label: '第一型態', name: '詛咒王子・洛基', title: '巨人族王子', image: C.image, avatar: C.avatar, scale: 1 },
    { key: 'form2', label: '第二型態', name: '尼德霍格・洛基', title: '第二型態', image: img('loki_form2'), avatar: img('loki_form2_face'), scale: 5 } /* v172b 使用者 11/07 22:05：第二型態立繪尺寸 5（型態倍率 5）；v173 起由自動取景（cam_v173.js）處理超出畫面 */,
    { key: 'form3', label: '第三型態', name: '諸神黃昏・洛基', title: '第三型態', image: img('loki_form3'), avatar: img('loki_form3_face'), scale: SZ[2] / SZ[0] }
  ];
  const sk = o => Object.assign({ accuracy: 100, maxPP: o.pp, tags: [] }, o);
  /* v173b 使用者 11/08「洛基的技能太亂了……不要每一個技能既能攻擊也能有效果」：攻擊招只打傷害，效果集中在輔助招。
     克制伊姆的「必中、打破無敵、無視減傷」改成第二、三型態攻擊的被動（寫在第 5 招說明），不在每招重複。 */
  const P2 = { sureHit: true, pierceDR: 1, breakInvuln: true }, P3 = Object.assign({ guardBreak: 1 }, P2);
  const atk = (name, power, pp, anima, desc, tags, ef) => sk({ name, type: 'attack', power, pp, anima, desc, tags, effect: ef || {} });
  const sup = (name, pp, anima, desc, tags, ef) => sk({ name, type: 'support', pp, anima, desc, tags, effect: ef });
  /* v177（使用者 11/08 04:55）：每型態的技能比例重新分配——攻擊招都附帶特殊效果、每型態至少一招輔助；說明寫清楚【範圍】、威力與段數、每個效果。
     第二、三型態的攻擊共通被動寫在每招最後：【必中】【破無敵】【穿透】（第三型態再加【貫穿保命】）。 */
  const PS2 = '型態被動：【必中】不會被閃避、看穿、迴避躲開；【破無敵】出招前打破對手的無敵；【穿透】無視對手的減傷。';
  const PS3 = '型態被動：【必中】【破無敵】【穿透】同第二型態；【貫穿保命】這一擊足以擊倒對手時，撐住致命傷、不死之身、永劫不滅等保命效果無效。';
  /* 第一型態（詛咒王子・洛基），傷害 ×1 */
  const F1 = [
    atk('雷電噴吐', 85, 10, 'bolt', '【範圍】單體。從口中噴出雷電，威力 85 × 3～5 段。【效果】命中後 30% 機率麻痺：對手 1 回合無法攻擊，或下一招失效。',
      [['連擊', 'blue'], ['麻痺', 'blue']], { multiHitNormal: [3, 5], perHitPower: 85, lokiStun: .3 }),
    atk('鐵雷', 230, 8, 'thunder', '【範圍】單體。舉起鐵錘砸下雷霆，威力 230 × 1 段。【效果】50% 機率讓對手破防 3 回合（防禦下降，受到的傷害提高）。',
      [['重擊', 'red'], ['破防', 'red']], { armorBreakChance: .5, armorBreakTurns: 3 }),
    sup('原初世界', 5, 'awaken', '【範圍】對手＋自身，不造成傷害。【效果】① 打散對手身上全部的強化：能力提升、護盾、減傷、無敵、閃避、反彈、持續回復，以及伊姆的不死之身、永劫不滅、看穿；② 打散對手展開的領域（例如伊姆的世界之王）；③ 清除自己身上全部的負面狀態；④ 自己獲得最大體力 20% 的護盾。',
      [['驅散', 'red'], ['淨化', 'green'], ['護盾', 'green']], { lokiDispel: { block: 0 }, clearSelfDebuffs: true, selfShieldMaxHpRatio: .2 }),
    atk('鐵雷五矢', 260, 5, 'thunder', '【範圍】單體＋後排波及。五道鐵雷同時落下，威力 260 × 1 段。【效果】① 追加對手最大體力 5% 的真實傷害（無視護盾、減傷與防禦；對 BOSS 減半）；② 對手後排還沒上場的角色受到這次傷害 25% 的波及。',
      [['強力', 'red'], ['真實傷害', 'gold'], ['波及後排', 'red']], { trueBurst: { pct: .05, label: '第五道鐵雷的真實傷害' }, splash: .25 })
  ];
  F1.forEach((x, i) => { const o = C.skills[i]; if (o) { Object.keys(o).forEach(k => delete o[k]); Object.assign(o, x); } });
  /* 第二型態（尼德霍格・洛基），傷害 ×1.4 */
  C.form2Skills = [
    atk('冥龍雷息', 95, 10, 'bolt', `【範圍】單體。尼德霍格噴出黑雷吐息，威力 95 × 3～6 段。【效果】命中後 2 回合內對手的回復量 -40%。${PS2}`,
      [['連擊', 'blue'], ['回復壓制', 'red'], ['必中', 'red']], Object.assign({ multiHitNormal: [3, 6], perHitPower: 95, healSeal: { turns: 2, cut: .4 } }, P2)),
    atk('黑雷裂空', 300, 6, 'thunder', `【範圍】單體。撕裂天空的黑雷，威力 300 × 1 段。【效果】① 2 回合內對手無法使用奧義（伊姆的「最初20人」晉升也會被擋下）；② 55% 機率麻痺：對手 1 回合無法攻擊，或下一招失效。${PS2}`,
      [['重擊', 'red'], ['奧義壓制', 'red'], ['麻痺', 'blue'], ['必中', 'red']], Object.assign({ ultSeal: 2, lokiStun: .55 }, P2)),
    atk('啃噬世界樹', 180, 5, 'chomp', `【範圍】單體。咬碎支撐世界的根，威力 180 × 1 段。【效果】① 打散對手身上全部的強化與展開的領域（內容同「原初世界」）；② 接下來 2 回合，對手無法再獲得任何強化；③ 吸走對手一半的型態與傷害加成。${PS2}`,
      [['驅散', 'red'], ['封鎖強化', 'red'], ['吸收加成', 'gold'], ['必中', 'red']], Object.assign({ lokiDispel: { block: 2 }, drainForm: .5 }, P2)),
    sup('冥龍鱗甲', 5, 'awaken', '【範圍】自身，不造成傷害。【效果】① 獲得最大體力 35% 的護盾；② 回復最大體力 20% 的體力；③ 接下來 4 回合進入「自由」：不會被契約、支配、技能封印、能力壓制、奪取體力與秒殺影響。',
      [['護盾', 'green'], ['回復', 'green'], ['自由', 'gold']], { selfShieldMaxHpRatio: .35, healRatio: .2, freeTurns: 4 })
  ];
  /* 第三型態（諸神黃昏・洛基），傷害 ×1.8 */
  C.form3Skills = [
    atk('諸神黃昏之雷', 115, 10, 'bolt', `【範圍】單體。終末之雷連續落下，威力 115 × 5～8 段。【效果】造成傷害的 20% 回復到自己身上。${PS3}`,
      [['連擊', 'blue'], ['吸血', 'green'], ['必中', 'red'], ['貫穿保命', 'red']], Object.assign({ multiHitNormal: [5, 8], perHitPower: 115, lifesteal: .2 }, P3)),
    atk('拉格納洛克', 420, 5, 'ragnarok', `【範圍】單體＋後排波及。諸神黃昏的終焉一擊，威力 420 × 1 段。【效果】① 追加對手最大體力 8% 的真實傷害（無視護盾、減傷與防禦；對 BOSS 減半）；② 對手後排還沒上場的角色受到這次傷害 40% 的波及。${PS3}`,
      [['終焉', 'gold'], ['真實傷害', 'gold'], ['波及後排', 'red'], ['貫穿保命', 'red']], Object.assign({ trueBurst: { pct: .08, label: '拉格納洛克的真實傷害' }, splash: .4 }, P3)),
    sup('芬布爾之冬', 4, 'ice', '【範圍】對手，不造成傷害。【效果】① 打散對手身上全部的強化與展開的領域（內容同「原初世界」）；② 接下來 4 回合，對手無法再獲得任何強化，回復量 -80%；③ 接下來 3 回合，對手無法使用奧義（伊姆的「最初20人」晉升也會被擋下）。',
      [['驅散', 'red'], ['封鎖強化', 'red'], ['回復壓制', 'red'], ['奧義壓制', 'red']], { lokiDispel: { block: 4 }, healSeal: { turns: 4, cut: .8 }, ultSeal: 3 }),
    sup('諸神之鎧', 5, 'awaken', '【範圍】自身，不造成傷害。【效果】① 獲得最大體力 40% 的護盾；② 回復最大體力 25% 的體力；③ 清除自己身上全部的負面狀態；④ 接下來 4 回合進入「自由」：不會被契約、支配、技能封印、能力壓制、奪取體力與秒殺影響。',
      [['護盾', 'green'], ['回復', 'green'], ['淨化', 'green'], ['自由', 'gold']], { selfShieldMaxHpRatio: .4, healRatio: .25, clearSelfDebuffs: true, freeTurns: 4 })
  ];
  /* 第 5 招：晉升；v177 每次施放都把第 1～4 招的次數恢復到全滿（第 5 招本身不恢復） */
  { const U = C.skills[4]; if (U) {
    Object.keys(U).forEach(k => delete U[k]);
    Object.assign(U, { name: '尼德霍格覺醒', type: 'support', pp: 4, maxPP: 4, ultimate: true, power: 0, accuracy: 100, anima: 'awaken',
      desc: '奧義，共 4 次（無法用道具恢復）。【範圍】自身（第三型態時為對手）。【每次施放】第 1～4 招的次數全部恢復到全滿（第 5 招不恢復），並回復最大體力 30% 的體力。【第 1 次】晉升為第二型態「尼德霍格・洛基」：技能欄換成第二型態的 4 招，全部傷害 ×1.4，攻擊獲得【必中】【破無敵】【穿透】。【第 2 次】晉升為第三型態「諸神黃昏・洛基」：技能欄換成第三型態的 4 招，全部傷害 ×1.8，攻擊再獲得【貫穿保命】。【第 3 次以後】改為「諸神黃昏」：對手直接失去最大體力 25% 的體力（BOSS 為 8%）。',
      tags: [['奧義', 'gold'], ['變身', 'gold'], ['恢復次數', 'green']],
      effect: { lokiAscend: { mul: [1.4, 1.8], final: { strike: .25, bossStrike: .08 } }, healRatio: .3, noRestore: true } });
  } }
  if (C.desc && !C.desc.includes('三種型態')) C.desc = '艾爾巴夫的王子「詛咒王子」，有三種型態。吃下幻獸種尼德霍格的果實，施放奧義「尼德霍格覺醒」晉升為尼德霍格・洛基、再晉升為諸神黃昏・洛基。攻擊必中、打破無敵、無視減傷，輔助招能打散強化與領域、封鎖強化與奧義，是專門對抗世界之王伊姆的力量；伊姆的支配與秒殺對他無效。';

  /* ---------- 型態 ---------- */
  const isLoki = f => !!(f && f.__loki);
  function init(f) { if (!f || f.id !== 'loki' || f.__loki) return f; f.__loki = { form: 0, pow: 1, base: { image: f.image, avatar: f.avatar, name: f.name, title: f.title } }; return f; }
  function setForm(f, form) {
    const I = f.__loki, F = C.forms[form] || C.forms[0], src = form === 0 ? I.base : F;
    f.image = src.image; f.avatar = src.avatar; f.name = src.name; f.title = src.title;
    const VO = form && typeof visualOverride === 'function' ? visualOverride('form:loki_form' + form) : null;
    f.visMul = form === 0 ? 1 : (VO && VO.battleScale) || F.scale || 1; f.mirror = VO && VO.faceLeft !== undefined ? VO.faceLeft : false;
    if (!onScreen(f)) return;
    try { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); } catch (e) { }
    const S = sideOf(f), $$ = id => document.getElementById(id);
    try { if ($$('bName' + S)) $$('bName' + S).textContent = f.name; if ($$('bTitle' + S)) $$('bTitle' + S).textContent = f.title; if ($$('bAv' + S)) $$('bAv' + S).src = f.avatar; if (S === 'L' && typeof renderTeam === 'function') renderTeam(); } catch (e) { }
  }
  function swap(f, form) {
    const K = C['form' + (form + 1) + 'Skills'] || []; const lv = f.level || (typeof MAX_LV !== 'undefined' ? MAX_LV : 100), adj = (typeof lvStats === 'function' ? lvStats(C, lv).ppAdj : 0) || 0;
    K.forEach((src, i) => { const s = JSON.parse(JSON.stringify(src)); const n = typeof skillPP === 'function' ? skillPP(s, lv, adj) : s.maxPP; s.pp = s.maxPP = n; f.skills[i] = s; });
    L(`🐉 技能欄換成${form === 2 ? '第三' : '第二'}型態：${K.map(x => `「${x.name}」`).join('')}，第 1～4 招次數全滿！`);
  }
  const transformed = t => !!(t && ((t.__imu && t.__imu.form > 0) || (t.__loki && t.__loki.form > 0) || (t.status && (t.status.formTurns > 0 || t.status.awakened || (t.status.__dragon && t.status.__dragon.t > 0))) || (t.baseImage && t.image !== t.baseImage)));

  function dispel(f, t, D) {
    if (!t || t === f || t.hp <= 0 || t.voidImmune) return;
    const T = t.status, gone = []; let n = 0;
    STAGES.forEach(k => { if (t.buffs[k] > 0) { n += t.buffs[k]; t.buffs[k] = 0; } }); if (n) gone.push(`能力提升 ${n} 階`);
    const z = (k, name) => { if (T[k] && (T[k] > 0 || T[k].t > 0)) { T[k] = typeof T[k] === 'object' ? null : 0; gone.push(name); } };
    z('shield', '護盾'); z('damageReductionTurns', '減傷'); if (T.invuln > 0 || T.__imuInv > 0) { T.invuln = 0; T.__imuInv = 0; gone.push('無敵'); }
    z('dodge', '閃避'); z('reflect', '反彈'); z('thornTurns', '荊棘'); z('regen', '持續回復'); z('__imuUnd', '不死之身'); z('__imuEt', '永劫不滅'); z('__imuEv', '虛空威壓'); z('__foresee', '看穿');
    const b = B(); if (b && b.__imuDom && b.__imuDom.t > 0) { const own = b.__imuDom.owner || (b.__imuDom.side === 'E' ? b.enemy : null); if (!own || own === t || (b.__imuDom.side === 'E') === (t === b.enemy)) { gone.push(b.__imuDom.name || '世界之王領域'); b.__imuDom = null; } }
    if (b && b.eruption && b.eruption.owner === t) { b.eruption = null; gone.push('火山噴發'); } if (b && b.iceAge && b.iceAge.owner === t) { b.iceAge = null; gone.push('冰河時期'); }
    if (D.block) T.buffBlock = Math.max(T.buffBlock || 0, D.block);
    L(gone.length ? `🐉 ${f.name} 打散了 ${t.name} 的強化：${gone.join('、')}${D.block ? `；${D.block} 回合內無法獲得強化` : ''}` : `🐉 ${t.name} 身上沒有可以打散的強化${D.block ? `；${D.block} 回合內無法獲得強化` : ''}`);
    if (gone.length) say(t, '驅散');
  }
  function ragnarok(f, t, J) {
    if (!t || t.hp <= 0) return;
    if (t.voidImmune) { L(`🐉 ${t.name} 不受諸神黃昏的比例傷害影響！`); }
    else { const b = B(), boss = !!(b && b.isBoss && t === b.enemy); const d = Math.max(1, Math.floor(t.maxHp * (boss ? J.bossStrike : J.strike) * (isImuF(t) ? VS().atk : 1))); const h0 = t.hp; t.hp = Math.max(0, t.hp - d);
      try { if (onScreen(t)) showDamage(sideOf(t), h0 - t.hp, '#b06bff'); } catch (e) { } L(`🌑 諸神黃昏！${t.name} 失去 ${h0 - t.hp} 點體力（最大體力的 ${pct(boss ? J.bossStrike : J.strike)}%）`); }
    if (J.ult) { t.status.__ultSeal = Math.max(t.status.__ultSeal || 0, J.ult); L(`⛓️ ${t.name} ${J.ult} 回合內無法使用奧義（含變身與晉升）`); }
    if (J.inv) { f.status.invuln = Math.max(f.status.invuln || 0, J.inv); L(`🛡️ ${f.name} 無敵 ${J.inv} 回合`); }
  }
  function ascend(f, t, A) {
    const I = f.__loki;
    if (I.form < C.forms.length - 1) {
      I.form++; I.pow = A.mul[I.form - 1] || I.pow; const F = C.forms[I.form];
      L(`🐉 ${f.__loki.base.name} 晉升為${F.label}「${F.name}」！全部傷害 ×${I.pow}`);
      swap(f, I.form); setForm(f, I.form); say(f, F.label);
    } else { L(`🌑 ${f.name} 施放「諸神黃昏」！`); ragnarok(f, t, A.final); }
    { let n = 0; f.skills.slice(0, 4).forEach(s => { if (s && s.maxPP && s.pp < s.maxPP) { s.pp = s.maxPP; n++; } }); if (n) L(`🔄 ${f.name} 第 1～4 招的次數全部恢復！`); } /* v177：每次施放都恢復第 1～4 招 */
    if (onScreen(f) && f === B().player && typeof renderSkills === 'function') try { renderSkills(); } catch (e) { }
  }

  /* ---------- 技能效果 ---------- */
  const _ase = applySkillEffects;
  applySkillEffects = function (actor, target, skill, result) {
    const vs = isLoki(actor) && isImuF(target) && VS().atk !== 1, d0 = actor && actor.__dmgB; if (vs) actor.__dmgB = (d0 || 1) * VS().atk; /* 比例與真實傷害也套用對伊姆倍率 */
    let r; try { r = _ase.apply(this, arguments); } finally { if (vs) actor.__dmgB = d0; }
    try { const ef = (skill && skill.effect) || {};
      if (ef.lokiDispel && actor && target && target !== actor && (skill.type !== 'attack' || (result && result.damage > 0))) dispel(actor, target, ef.lokiDispel);
      if (ef.lokiAscend && isLoki(actor)) ascend(actor, target, ef.lokiAscend);
    } catch (e) { console.warn('洛基型態效果錯誤', e); }
    return r;
  };
  /* v172b 使用者 11/07 22:05「洛基打贏伊姆的機率 60～65% 就好」：洛基與伊姆互打時的傷害倍率（模擬調出來的值，見 CHANGELOG） */
  /* 模擬（tests/imu-sim.js，各 60～120 場）調出來的：BOSS／勇者之塔／虛空王座的伊姆（真・伊姆，第 250 層）洛基隊勝率約 63～68%；一般對戰 1 對 1 約 60～66%。
     atk＝洛基打伊姆的傷害倍率（也套用到比例與真實傷害、諸神黃昏），def＝伊姆打洛基的傷害倍率（疊在巨人的意志減半之上）。 */
  const VS_BOSS = { atk: .29, def: 3 }, VS_NORM = { atk: 2.3, def: .45 }; /* v177 技能重新配置後重調（各 80～100 場）：塔 250 洛基隊 64%、洛基單人 55%；1 對 1 洛基先手 74%、後手 47%（平均約 61%） */
  const VS = () => { if (window.__LOKI_VS_IMU) return window.__LOKI_VS_IMU; const b = B(); return b && b.opts && b.opts.throne ? VS_THRONE : b && (b.isBoss || (b.opts && b.opts.tower)) ? VS_BOSS : VS_NORM; };
  /* 虛空王座是比累積傷害：洛基的穿透減傷會無視王座伊姆的巨額減傷，傷害變成其他隊伍的上百倍，這裡壓回和改版前差不多（模擬約 2.4 萬，改版前約 2.6 萬） */
  const VS_THRONE = { atk: .55, def: 3 };
  const isImuF = t => !!(t && (t.id === 'imu' || t.__imu));
  if (typeof computeSkillOutcome === 'function') { const _cso = computeSkillOutcome;
    computeSkillOutcome = function (actor, target, skill) {
      const r = _cso.apply(this, arguments);
      try { if (r && r.damage > 0 && actor && skill && skill.type === 'attack') { let m = isLoki(actor) ? actor.__loki.pow || 1 : 1; const g = skill.effect && skill.effect.godSlayer; if (g && transformed(target)) { m *= g; r.__god = 1; }
        if (isLoki(actor) && isImuF(target)) m *= VS().atk;
        if (m !== 1) r.damage = Math.floor(r.damage * m); if (r.__god) L(`⚔️ 弒神！對變身中的 ${target.name} 傷害 ×${g}`); } } catch (e) { }
      try { if (r && r.damage > 0 && isImuF(actor) && isLoki(target) && VS().def !== 1) r.damage = Math.floor(r.damage * VS().def); } catch (e) { }
      return r; }; }
  /* 必中也無視「降低命中」（世界之王領域把命中降 50～60%）：在 IMU165.preAct 之後把命中改回 100 */
  if (window.IMU165) { const I = window.IMU165, _pre = I.preAct;
    I.preAct = function (actor, target, idx) { const out = _pre.apply(this, arguments);
      try { const s = out && !out.skip && out.idx >= 0 && actor && actor.skills ? actor.skills[out.idx] : null; if (s && s.effect && s.effect.sureHit && s.accuracy < 100) { if (!out.acc) out.acc = [s, s.accuracy]; s.accuracy = 100; } } catch (e) { }
      return out; }; }

  /* ---------- 建立角色、開戰、狀態標籤 ---------- */
  if (typeof buildFighter === 'function') { const _bf = buildFighter; buildFighter = function (id) { const f = _bf.apply(this, arguments); if (id === 'loki') init(f); return f; }; }
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments); const b = B(); if (b) [b.enemy, ...(b.team || [])].forEach(f => { if (f && f.id === 'loki') init(f); }); return r; }; }
  if (typeof statusChips === 'function') { const _sc = statusChips; statusChips = function (c) { const h0 = _sc.apply(this, arguments); if (!isLoki(c) || !c.__loki.form) return h0;
    const F = C.forms[c.__loki.form]; return `<span class="chip up" title="尼德霍格覺醒晉升的型態，全部傷害 ×${c.__loki.pow}">${F.label}</span><span class="chip up" title="型態傷害加成">傷害 ×${c.__loki.pow}</span>` + h0; }; }

  /* ---------- 特效：第二、第三型態的招式與晉升 ---------- */
  const X = () => FXE.P, sl = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(r => setTimeout(r, ms)));
  const LFX = {
    '冥龍雷息': async A => { moveFighter(A.S, 'recoil'); SFX.play('zap'); for (let i = 0; i < 4; i++) { X().beam(A.f.x + A.d * 60, A.f.y - 40, A.t.x + R(-30, 30), A.t.y + R(-40, 30), { w: 30 - i * 4, c1: '#ffffff', c2: i % 2 ? '#7a5cff' : '#5fb8ff', life: .3 }); await sl(90); } X().burst(A.t.x, A.t.y, { r: 120, color: '#8a6bff' }); X().bolt(A.t.x, -20, A.t.x, A.t.y, { w: 10, color: '#b9a8ff' }); },
    '啃噬世界樹': async A => { moveFighter(A.S, 'lunge'); SFX.play('whoosh'); await sl(160); X().cracks(A.t.x, A.t.y + 70, { n: 12, len: 260, color: '#6b3cff' }); X().slash(A.t.x, A.t.y, { a: -2.3, span: 1.6, r: 170, w: 26, color: '#2a0f4a', life: .3 }); X().slash(A.t.x, A.t.y, { a: .9, span: 1.6, r: 170, w: 26, color: '#2a0f4a', life: .3 }); await sl(120); SFX.play('explode'); X().particles({ x: A.t.x, y: A.t.y, n: 26, spd: [160, 420], life: [.4, .8], size: [4, 9], colors: ['#ffe27a', '#ffffff', '#b9a8ff'], shape: 'spark', add: true, g: 120 }); X().ring(A.t.x, A.t.y, { r1: 260, color: '#ffe27a', w: 8, life: .4 }); shake(); },
    '冥龍鱗甲': async A => { SFX.play('buff'); X().vortex(A.f.x, A.f.y, { r: 150, color: '#2a0f4a', core: '#000000', rim: '#8a6bff', arms: 6, spin: 6, life: .7 }); await sl(220); X().ring(A.f.x, A.f.y, { r1: 190, color: '#b9a8ff', w: 10, life: .5 }); X().particles({ x: A.f.x, y: A.f.y, n: 30, spd: [60, 200], life: [.5, 1], size: [4, 8], colors: ['#b9a8ff', '#ffffff'], shape: 'spark', add: true, g: 0 }); },
    '黑雷裂空': async A => { moveFighter(A.S, 'float'); SFX.play('thunder'); X().tint('#1a0b33', .9, .4); for (let i = 0; i < 5; i++) setTimeout(() => X().bolt(A.t.x + R(-90, 90), -30, A.t.x + R(-20, 20), A.t.y, { w: 12, color: i % 2 ? '#ffffff' : '#7a5cff' }), i * 70); await sl(380); X().cracks(A.t.x, A.t.y + 70, { n: 10, len: 220, color: '#b9a8ff' }); X().flash('#ffffff', .25, .15); shake(); },
    '諸神黃昏之雷': async A => { SFX.play('thunder'); X().tint('#2a0a3a', .9, .45); for (let i = 0; i < 8; i++) setTimeout(() => { X().bolt(A.t.x + R(-120, 120), -30, A.t.x + R(-30, 30), A.t.y + R(-20, 30), { w: 9, color: i % 2 ? '#ff9cf5' : '#c86bff' }); if (i % 3 === 0) SFX.play('zap'); }, i * 55); await sl(460); X().burst(A.t.x, A.t.y, { r: 150, color: '#ff7ae6' }); },
    '諸神之鎧': async A => { SFX.play('buff'); X().wings(A.f.x, A.f.y - 40, { color: '#c86bff', life: .8 }); X().ring(A.f.x, A.f.y, { r1: 200, color: '#ff9cf5', w: 10, life: .55 }); await sl(240); X().particles({ x: A.f.x, y: A.f.y, n: 34, spd: [60, 220], life: [.5, 1], size: [4, 8], colors: ['#ff9cf5', '#ffffff'], shape: 'spark', add: true, g: 0 }); },
    '弒神之爪': async A => { moveFighter(A.S, 'dash'); SFX.play('whoosh'); await sl(200); for (let i = 0; i < 3; i++) X().slash(A.t.x + (i - 1) * 26, A.t.y, { a: -2.2, span: 1.5, r: 210, w: 18, color: i === 1 ? '#ffffff' : '#c86bff', life: .32 }); await sl(120); SFX.play('explode'); X().particles({ x: A.t.x, y: A.t.y, n: 30, spd: [160, 420], life: [.4, .8], size: [4, 9], colors: ['#ffe27a', '#ffffff', '#ff9cf5'], shape: 'spark', add: true, g: 120 }); X().rays(A.t.x, A.t.y, { r: 260, n: 14, c1: 'rgba(255,170,250,.9)' }); X().flash('#ffffff', .25, .15); shake(); },
    '芬布爾之冬': async A => { SFX.play('ice'); X().tint('#bfe6ff', 1.2, .4); X().particles({ x: FXE.W / 2, y: -20, n: 70, spd: [60, 200], ang: [1.3, 1.9], life: [1, 1.6], size: [3, 7], colors: ['#ffffff', '#dff6ff', '#c86bff'], g: 40 }); await sl(260); X().spikes(A.t.x, A.t.y + 100, { n: 14, w: 220, life: 1.1, color: '#e8f6ff' }); X().ring(A.f.x, A.f.y, { r1: 180, color: '#dff6ff', w: 8, life: .5 }); },
    '拉格納洛克': async A => { moveFighter(A.S, 'leap'); SFX.play('ult'); X().tint('#120018', 1.4, .55); X().wings(A.f.x, A.f.y - 40, { color: '#c86bff', life: .9 }); await sl(420); for (let i = 0; i < 6; i++) setTimeout(() => X().bolt(A.t.x + R(-140, 140), -30, A.t.x + R(-40, 40), A.t.y, { w: 14, color: i % 2 ? '#ffffff' : '#ff7ae6' }), i * 60); X().beam(A.f.x, A.f.y - 40, A.t.x, A.t.y, { w: 60, c1: '#ffffff', c2: '#c86bff', life: .5 }); await sl(380); SFX.play('explode'); X().pillar(A.t.x, A.t.y, { w: 160, color: '#c86bff', life: .7 }); X().cracks(A.t.x, A.t.y + 70, { n: 16, len: 320, color: '#ff9cf5' }); X().flash('#ffffff', .35, .2); shake(); }
  };
  async function ascendFx(A, form) {
    if (form === 1) { SFX.play('ult'); X().tint('#0d0620', 1.6, .55); X().vortex(A.f.x, A.f.y, { r: 220, color: '#2a0f4a', core: '#000000', rim: '#5fb8ff', arms: 7, spin: 7, life: 1.1 }); for (let i = 0; i < 6; i++) setTimeout(() => X().bolt(A.f.x + R(-160, 160), -30, A.f.x + R(-40, 40), A.f.y, { w: 12, color: i % 2 ? '#ffffff' : '#5fb8ff' }), 200 + i * 90); await sl(800); X().flash('#ffffff', .4, .25); shake(); }
    else { SFX.play('ult'); X().tint('#1a0024', 1.8, .6); X().wings(A.f.x, A.f.y - 40, { color: '#c86bff', life: 1.3 }); X().particles({ x: A.f.x, y: A.f.y - 40, n: 60, spd: [120, 360], life: [.8, 1.4], size: [6, 12], colors: ['#c86bff', '#ff9cf5', '#2a0f4a'], shape: 'petal', g: 60 }); for (let i = 0; i < 8; i++) setTimeout(() => X().bolt(A.f.x + R(-200, 200), -30, A.f.x + R(-50, 50), A.f.y, { w: 10, color: i % 2 ? '#ffffff' : '#ff7ae6' }), 150 + i * 80); await sl(900); X().flash('#ffffff', .45, .25); shake(); }
  }
  async function finalFx(A) { SFX.play('ult'); X().tint('#000000', 1.6, .65); X().rays(A.t.x, A.t.y, { r: 420, n: 20, c1: 'rgba(200,107,255,.9)' }); await sl(300); for (let i = 0; i < 10; i++) setTimeout(() => X().bolt(A.t.x + R(-180, 180), -30, A.t.x + R(-30, 30), A.t.y, { w: 14, color: i % 2 ? '#ffffff' : '#c86bff' }), i * 50); await sl(520); X().pillar(A.t.x, A.t.y, { w: 200, color: '#ffffff', life: .8 }); X().flash('#ffffff', .4, .25); shake(); }
  if (typeof playChoreo === 'function') { const _pc = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      if (!isLoki(actor) || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return _pc.apply(this, arguments);
      const I = actor.__loki, S = side === 'P' ? 'L' : 'R', T = S === 'L' ? 'R' : 'L';
      const fn = idx === 4 ? (I.form >= 2 ? finalFx : (A => ascendFx(A, I.form + 1))) : (I.form > 0 ? LFX[skill && skill.name] : null);
      if (!fn) return _pc.apply(this, arguments);
      try { FXE.ensure(); const A = { S, T, f: fighterPoint(S), t: fighterPoint(T), d: S === 'L' ? 1 : -1 }; await fn(A); } catch (e) { console.warn(e); return _pc.apply(this, arguments); }
    }; }
  window.LOKI172 = { init, setForm, ascend, dispel, transformed, vs: () => VS() };
})();
