/* v214 合併、v216 依原本的載入順序拆開：戰鬥效果擴充・後期 B（ext_v168、ext_v169）。檔案邊界以「==== 原 檔名 ====」標記。
   注意：這些檔案會一層層包住 playChoreo 等函式，載入順序必須維持 index.html 現在的排列，否則角色專屬特效會被通用特效蓋掉。 */

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

