/* v131 第二階段：航海通行證（每月一季）＋「每日活躍」畫面。
   - 賽季＝台灣時間的每個月；30 級，每級 100 經驗。經驗來源：每日活躍（1 點活躍＝1 經驗，每天最多 100）、本週活躍寶箱（每個 +50）、天梯對戰（勝 +20、敗 +10）。
   - 免費路線人人可領；進階路線用寶藏幣解鎖（PASS.price；目前沒有開放付款，之後可改成真實金額）。
   - 換季時未領取的獎勵會消失（月底最後 3 天大廳會提醒）。
   存檔：SAVE.data.pass＝{ season, xp, prem, free:[已領等級], paid:[已領等級] }。
   入口：大廳左側「通行證」（openPass('daily'|'pass')）；背包道具的獲取方式也會連過來。 */
const PASS = {
  levels: 30, xpPer: 100, price: 680,
  /* 每一級的獎勵：免費／進階 */
  reward(lv) {
    const F = [{ berry: 4000 }, { items: { exp_m: 1 } }, { items: { awaken_gem: 8 } }, { items: { skill_book: 1 } }], P = [{ items: { awaken_gem: 12 } }, { items: { skill_book: 2 } }, { items: { exp_l: 1 } }, { berry: 10000 }];
    if (lv === 30) return { free: { tokens: 10, items: { exp_l: 2 } }, paid: { tokens: 30, items: { skin_ticket: 1, awaken_gem: 40 } } };
    if (lv === 15) return { free: { tokens: 3 }, paid: { tokens: 10, items: { awaken_gem: 30, skill_book: 3 } } };
    if (lv % 5 === 0) return { free: { tokens: 3 }, paid: { tokens: 10, items: { awaken_gem: 20 } } };
    return { free: F[(lv - 1) % 4], paid: P[(lv - 1) % 4] };
  }
};
(function () {
  const $ = id => document.getElementById(id), fmt = n => (+n || 0).toLocaleString();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const tw = () => new Date(Date.now() + 8 * 3600e3);
  const seasonKey = () => { const d = tw(); return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
  const seasonName = k => `${k.slice(0, 4)} 年 ${+k.slice(4)} 月`;
  const daysLeft = () => { const d = tw(), end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); return Math.max(0, Math.ceil((end - d.getTime()) / 864e5)); };
  function st() { const d = SAVE.data, k = seasonKey(); if (!d.pass || d.pass.season !== k) { d.pass = { season: k, xp: 0, prem: false, free: [], paid: [] }; SAVE.save(); } return d.pass; }
  const level = () => Math.min(PASS.levels, Math.floor(st().xp / PASS.xpPer));
  window.passAddXp = function (n, why) { if (!n || typeof SAVE === 'undefined' || !SAVE.data) return; const P = st(), before = level(); P.xp += Math.round(n); SAVE.save(); const after = level(); if (after > before && typeof toast === 'function') toast(`航海通行證升到 Lv ${after}！`, 'gold'); lobby(); };
  const canFree = lv => level() >= lv && !st().free.includes(lv), canPaid = lv => st().prem && level() >= lv && !st().paid.includes(lv);
  const pending = () => { let n = 0; for (let lv = 1; lv <= PASS.levels; lv++) { if (canFree(lv)) n++; if (canPaid(lv)) n++; } return n; };
  function claim(lv, kind) { const P = st(), R = PASS.reward(lv)[kind]; if (kind === 'free' ? !canFree(lv) : !canPaid(lv)) return []; (kind === 'free' ? P.free : P.paid).push(lv); SAVE.save(); return window.PROG ? PROG.give(R) : []; }
  function claimAll() { let L = []; for (let lv = 1; lv <= PASS.levels; lv++) { L = L.concat(claim(lv, 'free'), claim(lv, 'paid')); } const m = {}; L.forEach(x => { const k = x.item || x.name; if (!m[k]) m[k] = { ...x }; else m[k].count += x.count; }); const list = Object.values(m); if (list.length && window.PROG) PROG.celebrate('通行證獎勵', list); return list.length; }
  function buy() { const P = st(); if (P.prem) return; if ((SAVE.data.tokens || 0) < PASS.price) { toast(`寶藏幣不足：進階通行證需要 ${fmt(PASS.price)} 枚`, 'warn'); return; } SAVE.data.tokens -= PASS.price; P.prem = true; SAVE.save(); if (typeof coins === 'function') coins(); if (typeof SFX !== 'undefined') SFX.play('ult'); toast('已解鎖進階通行證！', 'gold'); render(); }

  /* ---------- 大廳入口 ---------- */
  function lobby() { const t = $('lbPassTxt'), b = $('lbPassBar'), ic = $('lbPass'); if (!t || typeof SAVE === 'undefined' || !SAVE.data || !SAVE.data.roster) return;
    let a = 0, c = 0; try { a = window.ACT ? ACT.points() : 0; c = (window.ACT ? ACT.claimable() : 0) + pending(); } catch (e) { }
    t.textContent = `活躍 ${a}/100・Lv ${level()}`; if (b) b.style.width = a + '%'; if (ic) ic.classList.toggle('has-dot', c > 0); }

  /* ---------- 畫面 ---------- */
  let el = null, tab = 'daily';
  const rewIcons = R => { const out = []; if (!R) return ''; if (R.tokens) out.push(['<img src="assets/ui/coin_token.webp?v=115" alt="">', `×${R.tokens}`, '寶藏幣']); if (R.berry) out.push(['<img src="assets/ui/coin_berry.webp?v=100" alt="">', fmt(R.berry), '貝里']);
    Object.entries(R.items || {}).forEach(([k, n]) => { const it = ITEMS[k]; if (it) out.push([typeof itemIcon === 'function' ? itemIcon(it) : '', `×${n}`, it.name]); });
    return out.map(([ic, n, name]) => `<span class="ps-rw" title="${esc(name)} ${n}"><span class="ps-ric">${ic}</span><em>${n}</em></span>`).join(''); };
  const GO = { chart: () => typeof openChart === 'function' && openChart(), bounty: () => typeof openHub === 'function' && openHub('bounty'), tower: () => window.openTower && openTower(), crew: () => typeof openCrew === 'function' && openCrew('crew'),
    summon: () => typeof openHub === 'function' && openHub('summon'), rhythm: () => window.openRhythm && openRhythm(), ladder: () => window.openLadder && openLadder() };
  function dailyHtml() {
    const A = window.ACT; if (!A) return ''; const T = A.tasks(), p = A.points(), D = A.today(), W = A.week(), C = PROG.cfg;
    const node = (c, max, got, val, kind) => { const can = val >= c.at && !got.includes(c.at), done = got.includes(c.at);
      return `<button class="ps-node ${done ? 'done' : can ? 'can' : ''}" style="--x:${c.at / max * 100}%" data-${kind}="${c.at}" ${can ? '' : 'aria-disabled="true"'} aria-label="${c.at} 寶箱：${esc(PROG.rewText(c.rew))}${done ? '（已領取）' : can ? '（可領取）' : ''}"><span class="ps-chest" aria-hidden="true">${done ? '✓' : ''}</span><b>${c.at}</b></button>`; };
    const wkEnd = (() => { const t = Date.now() + 3 * 3600e3, dow = (new Date(t).getUTCDay() + 6) % 7, left = 7 - dow - ((t % 864e5) / 864e5); return Math.max(0, left); })();
    return `<section class="ps-card ps-today"><header><div><small>今日活躍</small><b class="ps-big">${p}<span>/100</span></b></div><p>完成「今日必做」累積活躍度，打開寶箱。每天 00:00 重置。活躍度也會變成通行證經驗。</p></header>
        <div class="ps-track"><div class="ps-bar"><i style="width:${p}%"></i></div>${C.dailyChest.map(c => node(c, 100, D.got, p, 'd')).join('')}</div></section>
      <section class="ps-card"><h3>今日必做</h3><ol class="ps-tasks">${T.map(t => `<li class="${t.done ? 'done' : ''}"><div class="ps-tt"><b>${esc(t.text)}</b><span class="ps-tb"><i style="width:${t.prog / t.goal * 100}%"></i></span><small>${t.prog}/${t.goal}</small></div><em class="ps-pts">+${t.pts}</em>${t.done ? '<span class="ps-ok" aria-label="已完成">✓</span>' : t.go && GO[t.go] ? `<button class="btn-ghost sm" data-go="${t.go}">前往</button>` : '<span class="ps-ok off">—</span>'}</li>`).join('')}</ol></section>
      <section class="ps-card ps-week"><header><div><small>本週活躍</small><b class="ps-big">${W.pts}<span>/600</span></b></div><p>每天的活躍度會累積到本週，週一 05:00 重置（還有 ${wkEnd.toFixed(1)} 天）。每個本週寶箱另外給通行證經驗 +50。</p></header>
        <div class="ps-track"><div class="ps-bar"><i style="width:${Math.min(100, W.pts / 6)}%"></i></div>${C.weekChest.map(c => node(c, 600, W.got, W.pts, 'w')).join('')}</div>
        <ul class="ps-legend">${C.weekChest.map(c => `<li><b>${c.at}</b>${PROG.rewText(c.rew)}</li>`).join('')}</ul></section>`;
  }
  function passHtml() {
    const P = st(), lv = level(), xpIn = P.xp - lv * PASS.xpPer, maxed = lv >= PASS.levels, n = pending();
    const rows = []; for (let k = 1; k <= PASS.levels; k++) { const R = PASS.reward(k), fGot = P.free.includes(k), pGot = P.paid.includes(k), reach = lv >= k;
      const cell = (kind, got, can, lock) => `<button class="ps-cell ${kind} ${got ? 'got' : can ? 'can' : lock ? 'lock' : ''}" data-c="${kind}:${k}" ${can ? '' : 'aria-disabled="true"'}>${rewIcons(R[kind])}<span class="ps-st">${got ? '已領取' : can ? '領取' : lock ? '🔒 進階' : `Lv ${k}`}</span></button>`;
      rows.push(`<li class="${reach ? 'reach' : ''} ${k === lv + 1 ? 'next' : ''} ${k % 5 === 0 ? 'big' : ''}"><span class="ps-lv">${k}</span>${cell('free', fGot, canFree(k), false)}${cell('paid', pGot, canPaid(k), !P.prem)}</li>`); }
    return `<section class="ps-card ps-head"><div class="ps-hl"><small>${seasonName(P.season)} 航海通行證・剩 ${daysLeft()} 天</small><b class="ps-big">Lv ${lv}<span>/${PASS.levels}</span></b>
        <div class="ps-bar"><i style="width:${maxed ? 100 : xpIn / PASS.xpPer * 100}%"></i></div><p>${maxed ? '已滿級！' : `下一級還差 ${PASS.xpPer - xpIn} 經驗`}　經驗來源：每日活躍、本週活躍寶箱、天梯對戰。換季時沒領的獎勵會消失。</p></div>
        <div class="ps-hr">${P.prem ? '<span class="ps-prem on">進階通行證　已解鎖</span>' : `<button class="btn-gold ps-buy"><span>解鎖進階通行證</span><small><img src="assets/ui/coin_token.webp?v=115" alt="">${fmt(PASS.price)} 寶藏幣</small></button>`}
          <button class="btn-ghost ps-all" ${n ? '' : 'disabled'}>全部領取${n ? `（${n}）` : ''}</button></div></section>
      <section class="ps-card ps-tl"><div class="ps-th"><span>等級</span><span>免費</span><span>進階</span></div><ol class="ps-lvls">${rows.join('')}</ol>
        <p class="ps-note">進階通行證目前用寶藏幣解鎖（測試期間）；30 級可領「限定皮膚選擇卷」。</p></section>`;
  }
  function render() {
    if (!el) return; if (window.ACT) ACT.sync();
    el.innerHTML = `<div class="ps-bg" aria-hidden="true"></div>
      <header class="ps-top"><button class="icon-btn" data-x aria-label="返回">‹</button><div><h2>航海通行證</h2><small>每日活躍・本週寶箱・每月通行證</small></div>
        <span class="ps-coins"><img src="assets/ui/coin_token.webp?v=115" alt=""><b>${fmt(SAVE.data.tokens)}</b></span></header>
      <nav class="ps-tabs" role="tablist"><button role="tab" data-t="daily" class="${tab === 'daily' ? 'on' : ''}" aria-selected="${tab === 'daily'}">每日活躍${window.ACT && ACT.claimable() ? '<i class="ps-dot"></i>' : ''}</button><button role="tab" data-t="pass" class="${tab === 'pass' ? 'on' : ''}" aria-selected="${tab === 'pass'}">通行證${pending() ? '<i class="ps-dot"></i>' : ''}</button></nav>
      <div class="ps-body">${tab === 'daily' ? dailyHtml() : passHtml()}</div>`;
    if (window.fixIcons) fixIcons(el);
    el.querySelector('[data-x]').onclick = close;
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (ACT.claimDaily(+b.dataset.d)) render(); });
    el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { if (ACT.claimWeek(+b.dataset.w)) render(); });
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const f = GO[b.dataset.go]; close(); if (f) f(); });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const [kind, k] = b.dataset.c.split(':'); const L = claim(+k, kind); if (L.length) { PROG.celebrate(`通行證 Lv ${k}`, L); render(); } else if (kind === 'paid' && !st().prem) toast('解鎖進階通行證後才能領取', 'warn'); });
    const by = el.querySelector('.ps-buy'); if (by) by.onclick = buy;
    const al = el.querySelector('.ps-all'); if (al) al.onclick = () => { if (claimAll()) render(); };
    lobby();
  }
  function open(t) { if (t) tab = t; if (!el) { el = document.createElement('div'); el.className = 'ps-wrap'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '航海通行證'); }
    st(); render(); document.body.appendChild(el); }
  function close() { if (el) el.remove(); lobby(); }
  window.openPass = open;
  window.passLevel = level;
  window.addEventListener('DOMContentLoaded', () => {
    const b = $('lbPass'); if (b) b.onclick = () => open();
    setInterval(lobby, 4000); setTimeout(lobby, 1200);
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); setTimeout(lobby, 200); return r; };
  });
})();
