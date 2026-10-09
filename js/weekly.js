/* 活動中心：每週任務＋週末航海祭。
   - 每週任務（週一 05:00 台灣時間重置）：以「本週開始時的累計數字」當基準，計算本週進度；每項完成可領一次獎勵，全部完成再加碼。
   - 週末航海祭：週六、週日（台灣時間）戰鬥獲得的船員經驗 ×2。
   好友對戰本身沒有獎勵；與好友互動的任務（送禮、留言）才有獎勵，鼓勵大家多交流。 */
const WEEKLY = {
  missions: [
    { id: 'wins', name: '戰鬥勝利', goal: 25, stat: 'wins', reward: { tokens: 5 } },
    { id: 'boss', name: '擊敗 BOSS', goal: 6, stat: 'bossWins', reward: { tokens: 5 } },
    { id: 'tower', name: '勇者之塔前進', goal: 8, stat: 'towerWins', unit: '層', reward: { tokens: 5 } },
    { id: 'pulls', name: '懸賞召喚', goal: 10, stat: '_pulls', unit: '次', reward: { berry: 10000 } },
    { id: 'gifts', name: '送禮物給好友', goal: 5, stat: 'giftsSent', unit: '份', reward: { tokens: 5 } },
    { id: 'notes', name: '在好友留言板留言', goal: 3, stat: 'notesSent', unit: '則', reward: { tokens: 3 } }
  ],
  bonus: { tokens: 20 },     /* 全部完成的加碼 */
  weekendExp: 2              /* 週末經驗倍率 */
};
/* v142 限時活動「天候祭」：活動期間戰鬥勝利 goal 場，免費獲得娜美皮膚「波雲雷擊」。進度從活動期間第一次進遊戲時開始計算（SAVE.data.wfest）。 */
const WEATHER_FEST = { id: 'weather142', name: '天候祭', start: Date.parse('2026-10-10T00:00:00+08:00'), end: Date.parse('2026-11-10T05:00:00+08:00'), goal: 20, stat: 'wins', skin: 'nami_cloud' };
(function () {
  const W = WEEKLY, TZ = 8 * 3600e3;
  const tw = () => new Date(Date.now() + TZ - 5 * 3600e3);
  const weekId = () => { const d = tw(), day = (d.getUTCDay() + 6) % 7, m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)); return m.toISOString().slice(0, 10); };
  const isWeekend = () => { const d = new Date(Date.now() + TZ).getUTCDay(); return d === 0 || d === 6; };
  const statOf = k => k === '_pulls' ? (SAVE.data.pulls || 0) : ((SAVE.data.stats || {})[k] || 0);
  function state() { const id = weekId(); let S = SAVE.data.weekly; if (!S || S.week !== id) { S = SAVE.data.weekly = { week: id, base: {}, got: [] }; W.missions.forEach(m => { S.base[m.stat] = statOf(m.stat); }); SAVE.save(); } return S; }
  const prog = m => { const S = state(); return Math.max(0, Math.min(m.goal, statOf(m.stat) - (S.base[m.stat] ?? statOf(m.stat)))); };
  const rtext = R => [R.tokens ? `寶藏幣 ×${R.tokens}` : '', R.berry ? `貝里 ${R.berry.toLocaleString()}` : ''].filter(Boolean).join('、');
  function give(R, why) { if (R.tokens) addTokens(R.tokens, why); if (R.berry) addBerry(R.berry); SAVE.save(); if (typeof coins === 'function') coins(); }
  const F = WEATHER_FEST, fLive = () => Date.now() >= F.start && Date.now() < F.end;
  function fState() { if (!SAVE.data) return null; let S = SAVE.data.wfest; if (!S || S.id !== F.id) { if (!fLive()) return null; S = SAVE.data.wfest = { id: F.id, base: statOf(F.stat), got: false }; SAVE.save(); } return S; }
  const fOwned = () => (((SAVE.data.skins || {}).owned) || []).includes(F.skin);
  const fProg = () => { const S = fState(); return S ? Math.max(0, Math.min(F.goal, statOf(F.stat) - S.base)) : 0; };
  const fClaimable = () => { const S = fState(); return !!S && fLive() && !S.got && !fOwned() && fProg() >= F.goal; };
  function fClaim() { if (!fClaimable()) return; const S = fState(), sk = SAVE.data.skins = SAVE.data.skins || { owned: [], equip: {} }; sk.owned = sk.owned || []; sk.equip = sk.equip || {};
    sk.owned.push(F.skin); S.got = true; const c = typeof SKINS !== 'undefined' && SKINS[F.skin]; if (c && SAVE.data.roster && SAVE.data.roster[c.char]) sk.equip[c.char] = F.skin; SAVE.save();
    toast(`獲得皮膚「${c ? c.name : F.skin}」！${c && SAVE.data.roster && SAVE.data.roster[c.char] ? '已經換上' : '擁有娜美後即可換上'}`, 'gold'); render(); dot(); }
  function fSection() { if (!fLive() || typeof SKINS === 'undefined' || !SKINS[F.skin]) return ''; const S = fState(), p = fProg(), own = fOwned() || (S && S.got), days = Math.max(1, Math.ceil((F.end - Date.now()) / 864e5));
    return `<section class="wk-ev wk-fest2 ${fClaimable() ? 'on' : ''}"><b>⚡ ${F.name}（限時・剩 ${days} 天）</b><small>活動期間戰鬥勝利 ${p}/${F.goal} 場，免費獲得娜美皮膚「${SKINS[F.skin].name}」</small>${own ? '<em class="wk-done">已領取</em>' : `<button class="btn-gold sm" data-fest ${fClaimable() ? '' : 'disabled'}>領取</button>`}</section>`; }
  window.WFEST = { live: fLive, state: fState, prog: fProg, claimable: fClaimable, claim: fClaim };
  const claimable = () => (fClaimable() ? 1 : 0) + _claimable();
  const _claimable = () => { const S = state(); return W.missions.filter(m => prog(m) >= m.goal && !S.got.includes(m.id)).length + (W.missions.every(m => S.got.includes(m.id)) && !S.got.includes('_all') ? 1 : 0); };
  function claim(id) { const S = state(); if (S.got.includes(id)) return; if (id === '_all') { if (!W.missions.every(m => S.got.includes(m.id))) return; S.got.push('_all'); give(W.bonus, '每週任務全完成'); toast(`🎉 本週任務全部完成！${rtext(W.bonus)}`, 'gold'); }
    else { const m = W.missions.find(x => x.id === id); if (!m || prog(m) < m.goal) return; S.got.push(id); give(m.reward, '每週任務'); toast(`領取：${rtext(m.reward)}`, 'gold'); } render(); dot(); }
  function left() { const d = tw(), day = (d.getUTCDay() + 6) % 7, ms = (7 - day) * 864e5 - (d.getUTCHours() * 3600e3 + d.getUTCMinutes() * 60e3), h = Math.floor(ms / 3600e3); return h >= 24 ? `${Math.floor(h / 24)} 天 ${h % 24} 小時` : `${h} 小時`; }
  let panel = null;
  function render() {
    if (!panel || !panel.isConnected) return; const S = state(), all = W.missions.every(m => S.got.includes(m.id));
    panel.innerHTML = `<div class="dl-card wk-card"><header><h3>🎪 活動中心</h3><button class="icon-btn sm" data-x aria-label="關閉">×</button></header><div class="wk-body">
      <section class="wk-fest ${isWeekend() ? 'on' : ''}"><b>⛵ 週末航海祭</b><small>${isWeekend() ? `進行中！今天戰鬥獲得的船員經驗 ×${W.weekendExp}` : `每週六、日舉行：戰鬥獲得的船員經驗 ×${W.weekendExp}`}</small></section>
      ${fSection()}
      <section class="wk-ev"><b>🎰 限定召喚池</b><small>限定角色定期輪替，集滿碎片可以直接換角色。</small><button class="btn-ghost sm" data-go="gacha">前往</button></section>
      <h4>本週任務<small>剩下 ${left()} 重置</small></h4>
      <ul class="wk-list">${W.missions.map(m => { const p = prog(m), ok = p >= m.goal, got = S.got.includes(m.id); return `<li class="${got ? 'got' : ok ? 'ok' : ''}"><span><b>${m.name} ${m.goal}${m.unit || '次'}</b><i class="wk-bar"><em style="width:${p / m.goal * 100}%"></em></i><small>${p}/${m.goal}・獎勵：${rtext(m.reward)}</small></span>${got ? '<em class="wk-done">已領取</em>' : `<button class="btn-gold sm" data-c="${m.id}" ${ok ? '' : 'disabled'}>領取</button>`}</li>`; }).join('')}
        <li class="wk-all ${S.got.includes('_all') ? 'got' : all ? 'ok' : ''}"><span><b>🏆 全部完成加碼</b><small>${rtext(W.bonus)}</small></span>${S.got.includes('_all') ? '<em class="wk-done">已領取</em>' : `<button class="btn-gold sm" data-c="_all" ${all ? '' : 'disabled'}>領取</button>`}</li></ul>
      <p class="sc-hint">送禮與留言需要先登入並加好友（大廳「好友」）。好友對戰本身沒有獎勵。</p></div></div>`;
    panel.querySelector('[data-x]').onclick = close; { const fb = panel.querySelector('[data-fest]'); if (fb) fb.onclick = fClaim; } panel.querySelectorAll('[data-c]').forEach(b => b.onclick = () => claim(b.dataset.c));
    const g = panel.querySelector('[data-go=gacha]'); if (g) g.onclick = () => { close(); if (typeof openGacha === 'function') openGacha('modeScreen'); };
  }
  function open() { if (!panel) { panel = document.createElement('div'); panel.className = 'dl-wrap wk-wrap'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '活動中心'); panel.onclick = e => { if (e.target === panel) close(); }; } document.body.appendChild(panel); render(); }
  function close() { if (panel) panel.remove(); }
  function dot() { const b = document.getElementById('lbWeekly'); if (!b) return; const n = claimable(), S = state(), done = W.missions.filter(m => S.got.includes(m.id)).length; b.classList.toggle('has-dot', n > 0); const t = document.getElementById('lbWeeklyTxt'); if (t) t.textContent = `${done}/${W.missions.length}${isWeekend() ? '・航海祭中' : ''}`; const bar = document.getElementById('lbWeeklyBar'); if (bar) bar.style.width = done / W.missions.length * 100 + '%'; }
  window.openWeekly = open; window.weeklyDot = dot;
  window.addEventListener('DOMContentLoaded', () => {
    /* 週末經驗加倍 */
    if (typeof gainExp === 'function') { const _g = gainExp; window.gainExp = function (id, n) { const a = [...arguments]; if (isWeekend() && n > 0) a[1] = Math.round(n * W.weekendExp); return _g.apply(this, a); }; }
    const b = document.getElementById('lbWeekly'); if (b) b.onclick = open;
    if (typeof openModes === 'function') { const _om = window.openModes; window.openModes = function () { const r = _om.apply(this, arguments); try { fState(); dot(); } catch (e) { } return r; }; }
  });
})();
