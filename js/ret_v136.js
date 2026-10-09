/* v136：
   ① 一般召喚券（summon_ticket）：懸賞處召喚優先使用（單抽 1 張；十連 10 張；百連 100 張），不夠時才用寶藏幣。來源：掛機寶藏、回歸玩家七日禮。
   ② 回歸玩家（RETURN）：超過 30 天沒有登入，再回來時開啟「回歸七日禮」（14 天內每天領 1 次、共 7 天）。
      這一版先記錄回歸狀態（SAVE.data.ret）與 SAVE.data.lastSeen；領取畫面等使用者確認示意圖後再做。 */
const RETURN_CFG = { awayDays: 30, windowDays: 14,
  rewards: [
    { tokens: 30, berry: 50000 },
    { items: { summon_ticket: 5, exp_s: 10 } },
    { items: { awaken_gem: 40, skill_book: 2 } },
    { berry: 80000, items: { exp_l: 3 } },
    { items: { summon_ticket: 5, awaken_gem: 40 } },
    { berry: 120000, items: { skill_book: 3 } },
    { tokens: 80, items: { event_ticket: 5 } }
  ] };
(function () {
  if (typeof ITEMS !== 'undefined' && !ITEMS.summon_ticket) ITEMS.summon_ticket = { name: '一般召喚券', rarity: 'SR', icon: 'scroll', color: '#5fb8ff', desc: '懸賞處召喚用的召喚券，1 張＝抽 1 次（十連用 10 張）。召喚時會優先使用，不夠時才用寶藏幣。', effect: { summonTicket: true } };
  const inv = () => (SAVE.data.inventory = SAVE.data.inventory || {});
  const DAY = 864e5;
  const todayKey = () => (typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10));

  /* ---------- ① 一般召喚券 ---------- */
  const need = n => n; /* 單抽 1、十連 10、百連 100 張 */
  function hookSummon() {
    if (typeof pull !== 'function' || pull.__tk) return; const _p = pull;
    pull = async function (n) { const k = need(n), cost = n === 100 ? GACHA_COST.hundred : n === 10 ? GACHA_COST.ten : GACHA_COST.single;
      if (!(typeof gachaBusy !== 'undefined' && gachaBusy) && (inv().summon_ticket || 0) >= k) { inv().summon_ticket -= k; SAVE.data.tokens += cost; /* 原本的 pull 會扣回同樣的寶藏幣 */ }
      return _p.apply(this, arguments); };
    pull.__tk = true;
    if (typeof updateGachaBtns === 'function') { const _u = updateGachaBtns; updateGachaBtns = function () { const r = _u.apply(this, arguments); try { const t = inv().summon_ticket || 0, busy = typeof gachaBusy !== 'undefined' && gachaBusy;
      [['pull1', 1], ['pull10', 10], ['pull100', 100]].forEach(([id, n]) => { const b = document.getElementById(id); if (!b || t < n) return; b.disabled = busy; const sm = b.querySelector('small'); if (sm) sm.textContent = `召喚券 ${n} 張（剩 ${t}）`; }); } catch (e) { } return r; }; }
  }

  /* ---------- ② 回歸玩家 ---------- */
  function lastSeenOf(d) { if (d.lastSeen) return d.lastSeen; const l = d.login && d.login.last; if (l) { const t = Date.parse(l + 'T12:00:00+08:00'); if (!isNaN(t)) return t; } return 0; }
  function check() { const d = SAVE.data; if (!d || !d.roster || !Object.keys(d.roster).length) return; const prev = lastSeenOf(d), now = Date.now();
    if (prev && now - prev >= RETURN_CFG.awayDays * DAY && !(d.ret && active())) { d.ret = { start: now, away: Math.floor((now - prev) / DAY), got: 0, last: '' }; }
    d.lastSeen = now; SAVE.save(); }
  const st = () => SAVE.data.ret || null;
  function active() { const r = st(); return !!r && r.got < RETURN_CFG.rewards.length && Date.now() - r.start < RETURN_CFG.windowDays * DAY; }
  const claimable = () => active() && st().last !== todayKey();
  function claim() { if (!claimable()) return null; const r = st(), R = RETURN_CFG.rewards[r.got]; const L = window.PROG ? PROG.give(R, '回歸七日禮') : []; r.got++; r.last = todayKey(); SAVE.save(); return L; }
  const daysLeft = () => { const r = st(); return r ? Math.max(0, Math.ceil((r.start + RETURN_CFG.windowDays * DAY - Date.now()) / DAY)) : 0; };

  window.addEventListener('DOMContentLoaded', () => {
    hookSummon();
    if (typeof openModes === 'function') { const om = window.openModes; let done = false; window.openModes = function () { const r = om.apply(this, arguments); if (!done) { done = true; try { check(); } catch (e) { } } return r; }; }
    setInterval(() => { try { if (SAVE.data && SAVE.data.roster && Object.keys(SAVE.data.roster).length) { SAVE.data.lastSeen = Date.now(); } } catch (e) { } }, 5 * 60e3);
  });
  /* open：領取畫面等使用者確認示意圖後再做 */
  window.RETURN = { cfg: RETURN_CFG, check, state: st, active, claimable, claim, daysLeft, open: () => { if (typeof toast === 'function') toast(active() ? `回歸七日禮：第 ${st().got + 1} 天` : '目前沒有回歸禮'); } };
})();
