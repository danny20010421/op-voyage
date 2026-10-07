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
    const tok = { actor, target, st: {}, buffs: {}, setDR: target.setDR, nul: actor.status.skillNullify };
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
    Object.keys(tok.buffs).forEach(k => { if (target.buffs[k] === 0 && tok.buffs[k] > 0) target.buffs[k] = tok.buffs[k]; });
  };

  /* ---------- 傷害計算 ---------- */
  const _cso = computeSkillOutcome;
  computeSkillOutcome = function (actor, target, skill, blocked) {
    const ef = (skill && skill.effect) || {};
    if (ef.rocksKill && target && !skill.__rk) {
      const low = rarIdx(target) < ssrIdx(), p = low ? 1 : .5;
      /* 交給基本計算處理「秒殺」：BOSS 3 倍傷害、古代巨人族意志、免疫秒殺等既有規則都會套用 */
      const lg = window.log; window.log = (...a) => { if (!/倍率 x0/.test(String(a[0]))) lg(...a); }; /* 借用的倍率計算會印出「倍率 x0.0」，不顯示 */
      let r; try { r = _cso.call(this, actor, target, { ...skill, __rk: true, effect: { randomMultiplierRange: [.01, .01], executeChance: p } }, false) || { damage: 0, meta: {} }; } finally { window.log = lg; }
      r.meta = r.meta || {};
      if (!r.meta.execute && !r.meta.executeBuff && !r.meta.bossExec && (!low || r.damage < 2)) {
        if (target.voidImmune) { r.damage = 0; log(`👑 ${target.name} 不受比例傷害影響！`); }
        else { let d = Math.max(1, Math.floor(target.hp / 2)); if (isBossFoe(target)) d = Math.min(d, capOf(target)); r.damage = d; log(`🗡️ 殺：${target.name} 被奪去一半的體力！`); }
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
        else if (target && target.hp > 0 && st.dmg > 0) { const d = Math.round(st.dmg); log(`🌀 蓄：把累積的 ${d} 點傷害全數奉還給 ${target.name}！`); applyDamage(target, d, scrSide(target), { ignoreShield: true }); }
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
