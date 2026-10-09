/* v136：
   ① 一般召喚券（summon_ticket）：懸賞處召喚優先使用（單抽 1 張；十連 10 張；百連 100 張），不夠時才用寶藏幣。來源：掛機寶藏、回歸玩家七日禮。
   ② 回歸玩家（RETURN）：超過 30 天沒有登入，再回來時開啟「回歸七日禮」（14 天內每天領 1 次、共 7 天）。
      v137：領取視窗（每天第一次進大廳自動跳出）與大廳左側「回歸禮」入口（只在回歸期間出現）。 */
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
  /* ---------- v137：領取畫面與大廳入口（使用者已同意示意圖） ---------- */
  const fmtR = (k, n) => k === 'berry' ? (n % 10000 ? n.toLocaleString() : (n / 10000) + '萬') : '×' + n;
  const icon = k => k === 'tokens' ? '<img src="assets/ui/coin_token.webp?v=115" alt="">' : k === 'berry' ? '<img src="assets/ui/coin_berry.webp?v=100" alt="">' : (ITEMS[k] && typeof itemIcon === 'function' ? itemIcon(ITEMS[k]) : '');
  const nameOf = k => k === 'tokens' ? '寶藏幣' : k === 'berry' ? '貝里' : (ITEMS[k] ? ITEMS[k].name : k);
  const rwHtml = r => { const o = []; if (r.tokens) o.push(['tokens', r.tokens]); if (r.berry) o.push(['berry', r.berry]); Object.entries(r.items || {}).forEach(e => o.push(e)); return o.map(([k, n]) => `<span title="${nameOf(k)} ${fmtR(k, n)}">${icon(k)}${fmtR(k, n)}</span>`).join(''); };
  function close() { document.querySelectorAll('.qo-wrap.rt-wrap').forEach(o => o.remove()); }
  function open() { if (!st()) { toast('目前沒有回歸禮'); return; } close(); const r = st(), got = r.got, can = claimable(), act = active(), Rw = RETURN_CFG.rewards;
    const o = document.createElement('div'); o.className = 'qo-wrap rt-wrap'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', '回歸七日禮');
    o.innerHTML = `<div class="qo-card rt-card"><header class="qo-head"><div><small>歡迎回來，船長！</small><h2>回歸七日禮</h2></div><button class="icon-btn qo-x" data-x aria-label="關閉">×</button></header>
      <p class="rt-sub">${act ? `你離開了 <em>${r.away} 天</em>。從回來那天起 14 天內，每天登入可以領一次，共 7 天（還剩 <em>${daysLeft()} 天</em>）。` : got >= Rw.length ? '7 天的回歸禮都領完了，祝航海順利！' : '回歸禮的領取期限已經結束。'}</p>
      <ol class="rt-days">${Rw.map((x, i) => `<li class="${i < got ? 'got' : i === got && act ? 'now' : ''} ${i === Rw.length - 1 ? 'd7' : ''}"><b>${i < got ? '✓ 已領取' : i === got && act ? (can ? '今天' : '明天') : '第 ' + (i + 1) + ' 天'}</b><div class="rt-rw">${rwHtml(x)}</div></li>`).join('')}</ol>
      <div class="qo-btns"><button class="btn-ghost" data-x>${can ? '稍後再說' : '關閉'}</button><button class="btn-gold" data-c ${can ? '' : 'disabled'}>${can ? `領取第 ${got + 1} 天` : act ? '明天再來領' : '已結束'}</button></div></div>`;
    document.body.appendChild(o); if (window.fixIcons) fixIcons(o);
    o.addEventListener('click', e => { if (e.target === o) close(); }); o.querySelectorAll('[data-x]').forEach(b => b.onclick = close);
    o.querySelector('[data-c]').onclick = () => { const day = st().got + 1, L = claim(); if (!L) return; if (typeof SFX !== 'undefined') SFX.play('coin'); close(); if (window.PROG) PROG.celebrate(`回歸七日禮・第 ${day} 天`, L); rail(); }; }
  function rail() { const ex = document.getElementById('lbRet'); if (!active()) { if (ex) ex.remove(); return; }
    let b = ex; if (!b) { const n = document.getElementById('lbNews'); if (!n) return; n.insertAdjacentHTML('beforebegin', '<button class="l2-ic rt-ic" id="lbRet"><i class="l2-svg" data-ic="login" aria-hidden="true"></i><b>回歸禮</b><small id="lbRetTxt"></small></button>'); b = document.getElementById('lbRet'); b.onclick = open; if (window.paintLobbyIcons) paintLobbyIcons(); }
    const t = document.getElementById('lbRetTxt'); if (t) t.textContent = `第 ${Math.min(7, st().got + (claimable() ? 1 : 0))}/7 天`; b.classList.toggle('has-dot', claimable()); }
  let popped = '';
  window.addEventListener('DOMContentLoaded', () => { if (typeof openModes === 'function') { const om = window.openModes; window.openModes = function () { const r = om.apply(this, arguments); setTimeout(() => { try { rail(); if (claimable() && popped !== todayKey()) { popped = todayKey(); setTimeout(open, 600); } } catch (e) { } }, 300); return r; }; } });
  window.RETURN = { cfg: RETURN_CFG, check, state: st, active, claimable, claim, daysLeft, open, rail };
})();
