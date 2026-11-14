/* v131 第二階段：航海通行證（每月一季）＋「每日活躍」畫面。
   - 賽季＝台灣時間的每個月；30 級，每級 100 經驗。經驗來源：每日活躍（1 點活躍＝1 經驗，每天最多 100）、本週活躍寶箱（每個 +50）、天梯對戰（勝 +20、敗 +10）。
   - 免費路線人人可領；進階路線用寶藏幣解鎖（PASS.price；目前沒有開放付款，之後可改成真實金額）。
   - 換季時未領取的獎勵會消失（月底最後 3 天大廳會提醒）。
   存檔：SAVE.data.pass＝{ season, xp, prem, free:[已領等級], paid:[已領等級] }。
   入口：大廳左側「通行證」（openPass('daily'|'pass')）；背包道具的獲取方式也會連過來。 */
const PASS = {
  levels: 30, xpPer: 100, price: 280, /* v157：使用者 11/04 回饋偏少，先降價到 280 寶藏幣 */
  /* 每一級的獎勵：免費／進階 */
  reward(lv) {
    const F = [{ berry: 4000 }, { items: { exp_m: 1 } }, { items: { awaken_gem: 8 } }, { items: { skill_book: 1 } }], P = [{ items: { awaken_gem: 12 } }, { items: { skill_book: 2 } }, { items: { exp_l: 1 } }, { berry: 10000 }];
    if (lv === 30) return { free: { items: { summon_ticket: 10, exp_l: 2 } }, paid: { tokens: 30, items: { skin_ticket: 1, awaken_gem: 40 } } };
    if (lv === 15) return { free: { items: { summon_ticket: 3 } }, paid: { tokens: 10, items: { awaken_gem: 30, skill_book: 3 } } };
    if (lv % 5 === 0) return { free: { items: { summon_ticket: 3 } }, paid: { tokens: 10, items: { awaken_gem: 20 } } };
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
  const rewIcons = R => { const out = []; if (!R) return ''; if (R.tokens) out.push(['<img src="assets/ui/coin_token.webp?v=79247db3" alt="">', `×${R.tokens}`, '寶藏幣']); if (R.berry) out.push(['<img src="assets/ui/coin_berry.webp?v=5c0e832b" alt="">', fmt(R.berry), '貝里']);
    Object.entries(R.items || {}).forEach(([k, n]) => { const it = ITEMS[k]; if (it) out.push([typeof itemIcon === 'function' ? itemIcon(it) : '', `×${n}`, it.name]); });
    return out.map(([ic, n, name]) => `<span class="ps-rw" title="${esc(name)} ${n}"><span class="ps-ric">${ic}</span><em>${n}</em></span>`).join(''); };
  const GO = { chart: () => typeof openChart === 'function' && openChart(), bounty: () => typeof openHub === 'function' && openHub('bounty'), tower: () => window.openTower && openTower(), crew: () => typeof openCrew === 'function' && openCrew('crew'),
    summon: () => typeof openHub === 'function' && openHub('summon'), rhythm: () => window.openRhythm && openRhythm(), ladder: () => window.openLadder && openLadder() };
  /* ---------- v220：依使用者參考圖重新設計（每日任務／航海通行證） ---------- */
  const SV = {
    login: '<rect x="5" y="7" width="22" height="20" rx="3"/><path d="M5 13h22M11 4v6M21 4v6M11 20l3.5 3.5L21 17"/>',
    wins: '<path d="M6 6l14 14M26 6L12 20M6 6l1 5M6 6l5 1M26 6l-1 5M26 6l-5 1M10 22l-4 4M22 22l4 4M9 19l4 4M23 19l-4 4"/>',
    bounty: '<path d="M8 5h14l4 4v18H8z"/><path d="M12 13h10M12 18h10M12 23h6"/>',
    tower: '<path d="M9 27V12l7-6 7 6v15M6 27h20M13 27v-6h6v6M13 15h6"/>',
    sweep: '<path d="M18 4L8 18h7l-2 10 10-14h-7z"/>',
    grow: '<path d="M16 28V15M16 15c0-5-4-8-10-8 0 6 4 8 10 8zM16 18c0-5 4-8 10-8 0 6-4 8-10 8z"/>',
    pull: '<path d="M4 11a3 3 0 000 6v6h24v-6a3 3 0 010-6V5H4z" transform="rotate(-12 16 16)"/><path d="M16 10l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"/>',
    rhythm: '<path d="M12 24V8l14-3v16"/><circle cx="9" cy="24" r="3"/><circle cx="23" cy="21" r="3"/>',
    pvp: '<path d="M10 5h12v6a6 6 0 01-12 0zM10 8H5c0 4 2 6 5 6M22 8h5c0 4-2 6-5 6M16 17v5M11 27h10M13 22h6v5h-6z"/>'
  };
  const tico = id => `<svg viewBox="0 0 32 32" aria-hidden="true">${SV[id] || SV.login}</svg>`;
  /* 獎勵 → [{ic, n}]：圖示＋數量 */
  const rwList = R => { const o = []; if (!R) return o; if (R.tokens) o.push({ ic: '<img src="assets/ui/coin_token.webp?v=79247db3" alt="">', n: `×${fmt(R.tokens)}`, name: '寶藏幣' }); if (R.berry) o.push({ ic: '<img src="assets/ui/coin_berry.webp?v=5c0e832b" alt="">', n: fmt(R.berry), name: '貝里' });
    Object.entries(R.items || {}).forEach(([k, n]) => { const it = ITEMS[k]; if (it) o.push({ ic: it.img ? `<img src="${it.img}" alt="">` : itemIcon(it), n: `×${fmt(n)}`, name: it.name }); }); return o; };
  const bub = R => { const L = rwList(R), a = L[0]; if (!a) return ''; return `<span class="p2-bub" title="${esc(L.map(x => x.name + ' ' + x.n).join('、'))}"><span class="p2-bic">${a.ic}</span><em>${a.n}</em>${L.length > 1 ? `<i class="p2-more">+${L.length - 1}</i>` : ''}</span>`; };
  function track(list, max, got, val, kind) {
    return `<div class="p2-track"><div class="p2-rail"><i style="width:${Math.min(100, val / max * 100)}%"></i></div>${list.map(c => { const done = got.includes(c.at), can = val >= c.at && !done;
      return `<button class="p2-ms ${done ? 'done' : can ? 'can' : ''}" style="--x:${(c.at / max).toFixed(4)}" data-${kind}="${c.at}" ${can ? '' : 'aria-disabled="true"'} aria-label="${c.at} 寶箱：${esc(PROG.rewText(c.rew))}${done ? '（已領取）' : can ? '（可領取）' : ''}">${bub(c.rew)}<span class="p2-dot">${done ? '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg>' : ''}</span><b>${c.at}</b></button>`; }).join('')}</div>`;
  }
  function dailyHtml() {
    const A = window.ACT; if (!A) return ''; const T = A.tasks(), p = A.points(), D = A.today(), W = A.week(), C = PROG.cfg;
    const wkEnd = (() => { const t = Date.now() + 3 * 3600e3, dow = (new Date(t).getUTCDay() + 6) % 7, left = 7 - dow - ((t % 864e5) / 864e5); return Math.max(0, left); })();
    return `<section class="p2-card p2-act"><div class="p2-actbox"><small>今日活躍度</small><b>${p}</b></div>${track(C.dailyChest, 100, D.got, p, 'd')}</section>
      <section class="p2-card"><header class="p2-ch"><h3><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="6" width="18" height="22" rx="3"/><path d="M12 4h8v5h-8zM11 15h2M16 15h6M11 20h2M16 20h6"/></svg>任務列表</h3><small><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 11-1.5-3.6M13 2.5V5h-2.5"/></svg>每日 00:00 重置</small></header>
        <ol class="p2-tasks">${T.map(t => `<li class="${t.done ? 'done' : ''}"><span class="p2-tic">${tico(t.id)}</span><div class="p2-tt"><b>${esc(t.text)}</b><div class="p2-tp"><span class="p2-tb"><i style="width:${t.prog / t.goal * 100}%"></i></span><small>${t.prog} / ${t.goal}</small></div></div>
          <span class="p2-trw"><span class="p2-pts">活躍</span><em>+${t.pts}</em></span>${t.done ? '<span class="p2-btn ok">已完成</span>' : t.go && GO[t.go] ? `<button class="p2-btn go" data-go="${t.go}">前往<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg></button>` : '<span class="p2-btn off">進行中</span>'}</li>`).join('')}</ol></section>
      <section class="p2-card p2-act p2-wk"><div class="p2-actbox"><small>本週活躍</small><b>${W.pts}</b><em>/ 600</em></div>${track(C.weekChest, 600, W.got, W.pts, 'w')}<p class="p2-foot">每天的活躍度累積到本週，週一 05:00 重置（還有 ${wkEnd.toFixed(1)} 天）。每個本週寶箱另給通行證經驗 +50。</p></section>`;
  }
  /* v186：整季合計 */
  function total(kind) { const T = { tokens: 0, berry: 0, items: {} }; for (let k = 1; k <= PASS.levels; k++) { const R = PASS.reward(k)[kind] || {}; T.tokens += R.tokens || 0; T.berry += R.berry || 0; Object.entries(R.items || {}).forEach(([i, n]) => { T.items[i] = (T.items[i] || 0) + n; }); } return T; }
  function totText(T) { const a = []; if (T.tokens) a.push(`寶藏幣 ×${fmt(T.tokens)}`); Object.entries(T.items).forEach(([i, n]) => { if (ITEMS[i]) a.push(`${ITEMS[i].name} ×${fmt(n)}`); }); if (T.berry) a.push(`貝里 ${fmt(T.berry)}`); return a.join('、'); }
  function sumText() { return `<b>整季合計</b>　免費：${totText(total('free'))}。<br><b>進階再加碼</b>：${totText(total('paid'))}（含 30 級「限定皮膚選擇券」）。解鎖後已達等級的進階獎勵可以立刻補領。`; }
  const PER = 4; let page = null;
  function passHtml() {
    const P = st(), lv = level(), xpIn = P.xp - lv * PASS.xpPer, maxed = lv >= PASS.levels, n = pending(), pages = Math.ceil(PASS.levels / PER);
    if (page === null) { let f = 1; for (let k = 1; k <= PASS.levels; k++) if (canFree(k) || canPaid(k)) { f = k; break; } else if (k === Math.min(PASS.levels, lv + 1)) f = k; page = Math.floor((f - 1) / PER); }
    page = Math.max(0, Math.min(pages - 1, page));
    const cell = (k, kind, R, got, can, lock) => { const L = rwList(R); return `<button class="p2-cell ${kind} ${got ? 'got' : can ? 'can' : lock ? 'lock' : ''}" data-c="${kind}:${k}" ${can ? '' : 'aria-disabled="true"'}>
      <span class="p2-rws n${Math.min(2, L.length)}">${L.slice(0, 2).map(x => `<span class="p2-rw"><span class="p2-ric">${x.ic}</span><em>${x.n}</em></span>`).join('')}</span>
      <span class="p2-st">${got ? '<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg>已領取' : can ? '<b>領取</b>' : '<svg viewBox="0 0 16 16"><rect x="3.5" y="7" width="9" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>'}</span></button>`; };
    const cols = []; for (let k = page * PER + 1; k <= Math.min(PASS.levels, page * PER + PER); k++) { const R = PASS.reward(k);
      cols.push(`<div class="p2-col ${lv >= k ? 'reach' : ''} ${k === Math.max(1, Math.min(PASS.levels, lv)) ? 'cur' : ''}"><span class="p2-hex"><b>${k}</b></span>${cell(k, 'free', R.free, P.free.includes(k), canFree(k), lv < k)}${cell(k, 'paid', R.paid, P.paid.includes(k), canPaid(k), !P.prem || lv < k)}</div>`); }
    return `<section class="p2-card p2-head"><img class="p2-scroll" src="assets/ui/pass_scroll.webp?v=37e15b2e" alt=""><div class="p2-hi"><small>${seasonName(P.season)} 航海通行證・剩 ${daysLeft()} 天</small><b class="p2-lv">Lv ${lv}<span>/${PASS.levels}</span></b>
        <div class="p2-xbar"><i style="width:${maxed ? 100 : xpIn / PASS.xpPer * 100}%"></i></div><p>${maxed ? '已滿級！記得把獎勵領完' : `下一級還差 ${PASS.xpPer - xpIn} 經驗（每級 ${PASS.xpPer}）`}</p></div>
        <p class="p2-src">經驗來源：每日活躍（1 點＝1 經驗，每天最多 100）、本週活躍寶箱（每個 +50）、海賊天梯（勝 +20、敗 +10）。每月 1 日換季，沒領的獎勵會消失。</p>
        <div class="p2-acts">${P.prem ? '<span class="p2-prem on">進階通行證　已解鎖</span>' : `<button class="p2-prem ps-buy"><span>解鎖進階通行證</span><small><img src="assets/ui/coin_token.webp?v=79247db3" alt="">${fmt(PASS.price)}</small></button>`}<button class="p2-all ps-all" ${n ? '' : 'disabled'}>全部領取${n ? `（${n}）` : ''}</button></div></section>
      <section class="p2-card p2-tl"><header class="p2-th"><span class="p2-lane free"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4z"/></svg>免費獎勵</span><span class="p2-lane paid ${P.prem ? 'on' : ''}">${P.prem ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'}進階獎勵</span><b class="p2-pg">${page + 1} / ${pages}</b></header>
        <div class="p2-rows"><button class="p2-arw l" data-pg="-1" ${page ? '' : 'disabled'} aria-label="上一頁"><svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5"/></svg></button><div class="p2-cols">${cols.join('')}</div><button class="p2-arw r" data-pg="1" ${page < pages - 1 ? '' : 'disabled'} aria-label="下一頁"><svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5"/></svg></button></div>
        <div class="p2-dots">${Array.from({ length: pages }, (_, i) => `<button class="${i === page ? 'on' : ''}" data-pgi="${i}" aria-label="第 ${i + 1} 頁"></button>`).join('')}</div>
        <p class="p2-note">${sumText()}</p></section>`;
  }
  function render() {
    if (!el) return; if (window.ACT) ACT.sync();
    const isD = tab === 'daily';
    el.innerHTML = `<div class="ps-bg p2-bg" aria-hidden="true"></div><div class="p2-in">
      <header class="p2-top"><button class="p2-back" data-x aria-label="返回"><svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5"/></svg></button>
        <div class="p2-title"><svg class="p2-wheel" viewBox="0 0 64 32" aria-hidden="true"><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="6"/><path d="M32 4v22M14 14l13 13M50 14L37 27M6 32h20M38 32h20"/><circle cx="32" cy="4" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="52" cy="12" r="3"/></svg>
          <h2><span class="p2-ln"></span>${isD ? '每日任務' : '航海通行證'}<span class="p2-ln"></span></h2><small>◆ ${isD ? '完成每日任務・領取豐富獎勵' : '每日活躍・本週寶箱・每月通行證'} ◆</small></div>
        <span class="p2-coin"><img src="assets/ui/coin_token.webp?v=79247db3" alt=""><b>${fmt(SAVE.data.tokens)}</b></span></header>
      <nav class="p2-tabs" role="tablist"><button role="tab" data-t="daily" class="${isD ? 'on' : ''}" aria-selected="${isD}"><svg viewBox="0 0 32 32" aria-hidden="true">${SV.login}</svg>每日任務${window.ACT && ACT.claimable() ? '<i class="p2-red"></i>' : ''}</button><button role="tab" data-t="pass" class="${!isD ? 'on' : ''}" aria-selected="${!isD}"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="9"/><circle cx="16" cy="16" r="3"/><path d="M16 3v26M3 16h26M7 7l18 18M25 7L7 25"/></svg>航海通行證${pending() ? '<i class="p2-red"></i>' : ''}</button></nav>
      <div class="p2-body">${isD ? dailyHtml() : passHtml()}</div></div>`;
    el.querySelector('[data-x]').onclick = close;
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; page = null; render(); });
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (ACT.claimDaily(+b.dataset.d)) render(); });
    el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { if (ACT.claimWeek(+b.dataset.w)) render(); });
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const f = GO[b.dataset.go]; close(); if (f) f(); });
    el.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { page += +b.dataset.pg; render(); });
    el.querySelectorAll('[data-pgi]').forEach(b => b.onclick = () => { page = +b.dataset.pgi; render(); });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const [kind, k] = b.dataset.c.split(':'); const L = claim(+k, kind); if (L.length) { PROG.celebrate(`通行證 Lv ${k}`, L); render(); } else if (kind === 'paid' && !st().prem) toast('解鎖進階通行證後才能領取', 'warn'); });
    const by = el.querySelector('.ps-buy'); if (by) by.onclick = buy;
    const al = el.querySelector('.ps-all'); if (al) al.onclick = () => { if (claimAll()) render(); };
    /* 左右滑動換頁 */
    const cw = el.querySelector('.p2-cols'); if (cw) { let x0 = null; cw.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true }); cw.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) { const np = page + (dx < 0 ? 1 : -1); if (np >= 0 && np < Math.ceil(PASS.levels / PER)) { page = np; render(); } } }); }
    lobby();
  }
  function open(t) { if (t) tab = t; page = null; if (!el) { el = document.createElement('div'); el.className = 'ps-wrap p2'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '航海通行證'); }
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
