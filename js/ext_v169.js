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
