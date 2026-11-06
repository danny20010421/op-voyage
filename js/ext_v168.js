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
