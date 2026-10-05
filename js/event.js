/* 限定活動抽獎池：抽角色碎片，集滿碎片（各期 need 片）合成限定角色（命運水晶動畫）。檔期見 data.js 的 EVENT_CALENDAR */
(function () {
  const POOLS = () => (typeof eventPoolsSorted === 'function' ? eventPoolsSorted() : typeof EVENT_POOLS !== 'undefined' ? EVENT_POOLS : [EVENT_POOL]);
  /* 活動預告：還沒開放（或休息中但已排好下一期）的限定池，依開放日期由近到遠排列；只放宣傳圖，不能抽。時間一到自動移到限定池標籤並開放抽獎 */
  const PV = '__preview';
  function upcoming(t = Date.now()) { return POOLS().filter(p => phase(p.id) !== 'live').map(p => ({ p, w: typeof eventWindow === 'function' ? eventWindow(p.id, t) : null })).filter(x => x.w && x.w.s > t).sort((a, b) => a.w.s - b.w.s).map(x => x.p); }
  function renderPreview(focus) {
    const pane = $('evPane'); if (!pane) return; const U = upcoming();
    pane.innerHTML = `<div class="pv-head"><b>活動預告</b><small>以下限定抽獎池尚未開放，依開放日期排列。時間一到會自動移到限定抽獎並開放抽獎。</small></div>` + U.map((pl, k) => { const W = eventWindow(pl.id);
      return `<article class="pv-card ${k === 0 ? 'next' : ''}" id="pv-${pl.id}"><div class="pv-ban"><img src="${pl.banner}" alt="${pl.name}" loading="lazy"><span class="pv-when">${md(W.s)} ${hm(W.s)} 開放</span></div>
        <div class="pv-info"><h4>${pl.name}</h4><p class="pv-date">檔期 ${md(W.s)}～${md(W.e - 60e3)} ${hm(W.e - 60e3)}${W.every === 'year' ? '・每年' : ''}</p><p class="pv-count">還有 <b>${left(W.s - Date.now())}</b></p>
        <div class="pv-chars">${pl.shards.map(x => { const c = CHARACTERS[x.char], r = (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[x.char]) || 'SSR'; return `<span class="pv-ch" style="--c:${x.color}"><img src="${x.icon}" alt=""><span><b><i class="rar c-rar r-${r}">${r}</i>${c ? c.name : x.char}</b><small>集滿 ${NEED(pl, x.char)} 片合成</small></span></span>`; }).join('')}</div>
        <button class="btn-ghost pv-lock" disabled>🔒 ${md(W.s)} ${hm(W.s)} 開放抽獎</button></div></article>`; }).join('');
    const f = focus && $('pv-' + focus); if (f) f.scrollIntoView({ block: 'start' });
  }
  window.openEventPreview = id => { pool = 'ev:' + PV; applyPool(); if (id) renderPreview(id); };
  /* 每位角色可以有自己的碎片需求（例：羅（七武海）80 片），沒寫就用活動池的 need */
  const NEED = (pl, cid) => ((pl.shards.find(x => x.char === cid) || {}).need || pl.need);
  const phase = id => (typeof eventPhase === 'function' ? eventPhase(id) : 'live');
  const md = ms => { const d = new Date(ms + 8 * 3600e3); return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`; };
  const hm = ms => { const d = new Date(ms + 8 * 3600e3); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  let curId = (POOLS().find(p => phase(p.id) === 'live') || POOLS()[0]).id; /* 預設打開開放中的活動 */
  const P = () => POOLS().find(p => p.id === curId) || POOLS()[0];
  /* 抽獎水晶：碎片＝彩虹水晶、道具＝銀色水晶（先出現水晶，打開後才顯示獎品） */
  const CRYS_IMG = { shard: 'assets/ui/crystal_shard.webp?v=37', item: 'assets/ui/crystal_item.webp?v=37' };
  [CRYS_IMG.shard, CRYS_IMG.item].forEach(src => { const im = new Image(); im.src = src; });
  const RCOL = { N: '#6fd08c', R: '#5fb8ff', SR: '#c58bff', SSR: '#ffcf5a' };
  /* 每個活動池各自記錄抽獎券、碎片與保底（舊存檔的 SAVE.data.event 會自動轉移） */
  function st(pool) {
    const Pp = pool || P(), d = SAVE.data; d.events = d.events || {};
    if (d.event && d.event.id && !d.events[d.event.id]) { d.events[d.event.id] = d.event; delete d.event; }
    const E = d.events[Pp.id] = d.events[Pp.id] || { id: Pp.id, shards: {}, pity: 0, newbie: false, day: '', bountyDay: '', tickets: 0 };
    E.shards = E.shards || {}; Pp.shards.forEach(s => { E.shards[s.char] = E.shards[s.char] || 0; });
    const today = new Date().toDateString();
    if (phase(Pp.id) === 'soon') return E; /* 預告期間不發抽獎券，開放當天才發新手與每日免費券 */
    if (!E.newbie) { E.newbie = true; E.tickets = (E.tickets || 0) + Pp.newbieFree; E.__msg = `新手福利：活動抽獎券 ×${Pp.newbieFree}`; }
    if (E.day !== today) { E.day = today; E.tickets = (E.tickets || 0) + Pp.dailyFree; E.__msg = (E.__msg ? E.__msg + '・' : '') + `今日免費：活動抽獎券 ×${Pp.dailyFree}`; }
    return E;
  }
  window.eventState = st;
  /* 懸賞任務全部領取後 +2 抽 */
  window.eventBountyCheck = function () { try { const today = new Date().toDateString(), list = bounties().filter(b => !b.premium); if (!list.length || !list.every(b => b.claimed)) return; let n = 0; POOLS().filter(pl => phase(pl.id) !== 'soon').forEach(pl => { const E = st(pl); if (E.bountyDay !== today) { E.bountyDay = today; E.tickets += pl.bountyBonus; n = pl.bountyBonus; } }); if (n) { SAVE.save(); toast(`完成全部每日懸賞！活動抽獎券 +${n}`, 'gold'); } } catch (e) { } };

  function rollItem() { const order = ['N', 'R', 'SR', 'SSR'], tot = order.reduce((t, k) => t + RARITY[k].rate, 0); let r = Math.random() * tot, rar = 'N'; for (const k of order) { r -= RARITY[k].rate; if (r < 0) { rar = k; break; } } const pool = Object.keys(ITEMS).filter(k => ITEMS[k].rarity === rar); return { item: pool[Math.floor(Math.random() * pool.length)] || 'potion_s', rar }; }
  function amount() { let r = Math.random(); for (const [n, p] of P().amount) { if ((r -= p) < 0) return n; } return P().amount[0][0]; }
  function rollOne(E) {
    const force = E.pity >= P().pity - 1; let r = Math.random(), hit = null;
    for (const s of P().shards) { if (r < s.rate) { hit = s; break; } r -= s.rate; }
    if (!hit && force) hit = P().shards[Math.floor(Math.random() * P().shards.length)];
    if (hit) { E.pity = 0; return { shard: hit.char, n: amount(), pity: force && r >= 0 }; }
    E.pity++; return rollItem();
  }
  function grant(E, res) { res.forEach(x => { if (x.shard) E.shards[x.shard] += x.n; else SAVE.data.inventory[x.item] = (SAVE.data.inventory[x.item] || 0) + 1; }); SAVE.save(); }

  /* ---------- 畫面 ---------- */
  function render() {
    const E = st(), pane = $('evPane'); if (!pane) return;
    if (E.__msg) { toast(E.__msg, 'gold'); delete E.__msg; SAVE.save(); }
    const card = s => { const c = CHARACTERS[s.char], n = E.shards[s.char], own = owned(s.char), pct = Math.min(100, n / NEED(P(), s.char) * 100);
      return `<div class="ev-shard" style="--c:${s.color}"><img src="${s.icon}" alt=""><div class="ev-sh-info"><b><span class="rar c-rar r-${(typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[s.char]) || 'SSR'}">${(typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[s.char]) || 'SSR'}</span> ${c.name}<small>${c.title}</small></b><div class="ev-bar"><i style="width:${pct}%"></i></div><small>碎片 ${n}/${NEED(P(), s.char)}・單抽機率 ${Math.round(s.rate * 1000) / 10}%</small></div>
        ${own ? '<span class="ev-owned">已擁有</span>' : `<button class="btn-gold sm" data-synth="${s.char}" ${n >= NEED(P(), s.char) ? '' : 'disabled'}>合成</button>`}</div>`; };
    const cost1 = E.tickets >= 1 ? '1 張抽獎券' : `${P().tokenCost} 枚寶藏幣`, cost10 = E.tickets >= 10 ? '10 張抽獎券' : `${P().tokenCost * 10} 枚寶藏幣`;
    const ph = phase(P().id), W = typeof eventWindow === 'function' ? eventWindow(P().id) : null, soon = ph === 'soon';
    const clock = ph === 'live' && W ? `<div class="ev-clock on"><span>${W.label || '本期限定'}・${md(W.s)}～${md(W.e - 60e3)} ${hm(W.e - 60e3)}</span><span>剩 <b>${left(W.e - Date.now())}</b></span></div>`
      : soon && W ? `<div class="ev-clock soon"><span>活動預告・${md(W.s)} ${hm(W.s)} 開放</span><span>還有 <b>${left(W.s - Date.now())}</b></span></div>`
      : `<div class="ev-clock"><span>活動休息中・${W ? `下次 ${md(W.s)} 開放` : '復刻時間另行公告'}</span><span>碎片保留，可照常合成</span></div>`;
    pane.innerHTML = clock + `<div class="ev-banner"><img src="${P().banner}" alt="${P().name}"></div>
      <div class="ev-side">
        <div class="ev-tickets"><span>🎟️ 活動抽獎券 <b>${soon ? '—' : E.tickets}</b></span><small>新手免費 ${P().newbieFree} 抽・每天免費 ${P().dailyFree} 抽・每日懸賞全部完成 +${P().bountyBonus} 抽</small></div>
        ${P().shards.map(card).join('')}
        <div class="ev-pulls">${ph === 'live' ? `<button class="btn-gold" id="evPull1">抽 1 次<small>${cost1}</small></button><button class="btn-primary" id="evPull10">抽 10 次<small>${cost10}</small></button>` : `<button class="btn-ghost ev-wait" disabled>${soon && W ? `${md(W.s)} ${hm(W.s)} 開放抽獎` : '活動休息中'}<small>${soon ? '開放當天發放新手 10 抽＋每日免費 3 抽' : '碎片可在角色背包合成'}</small></button>`}</div>
        <p class="ev-pity">再 <b>${Math.max(1, P().pity - E.pity)}</b> 抽內必定出現角色碎片</p>
        <details class="ev-rates"><summary>出現機率</summary><table>
          ${P().shards.map(s => `<tr><td>${CHARACTERS[s.char].name}碎片</td><td>${(s.rate * 100).toFixed(1)}%</td><td>每次 20／30／50 片（60%／30%／10%），集滿 ${NEED(P(), s.char)} 片合成</td></tr>`).join('')}
          <tr><td>各種道具</td><td>${((1 - P().shards.reduce((t, s) => t + s.rate, 0)) * 100).toFixed(1)}%</td><td>稀有度比例同寶藏扭蛋</td></tr>
          <tr><td>保底</td><td colspan="2">連續 ${P().pity - 1} 抽沒有碎片時，第 ${P().pity} 抽必定出現碎片</td></tr></table></details>
      </div>`;
    pane.querySelectorAll('[data-synth]').forEach(b => b.onclick = () => synth(b.dataset.synth));
    if ($('evPull1')) { $('evPull1').onclick = () => pull(1); $('evPull10').onclick = () => pull(10); }
  }
  function synth(id) {
    const E = st(); if (E.shards[id] < NEED(P(), id) || owned(id)) return;
    E.shards[id] -= NEED(P(), id); addCrew(id, GAME_SETTINGS.charLv || 20); SAVE.save(); SFX.play('rare');
    toast(`合成成功！${CHAR_RARITY[id] || 'SSR'} ${CHARACTERS[id].name} 加入角色背包`, 'gold'); render(); if (typeof renderCrewShards === 'function') renderCrewShards();
  }
  window.eventSynth = synth;

  let busy = false;
  /* 輪替：只有本期活動可以抽；其他活動顯示回歸倒數（碎片照樣保留、可合成） */
  const left = ms => { const h = Math.max(0, Math.floor(ms / 3600e3)); return h >= 24 ? `${Math.floor(h / 24)} 天 ${h % 24} 小時` : `${h} 小時 ${Math.max(0, Math.floor(ms / 60000) % 60)} 分`; };
  const isActive = () => phase(P().id) === 'live';
  async function pull(n) {
    if (busy) return; const E = st();
    if (typeof timeLocked === 'function' && timeLocked()) { toast('裝置時間異常，限定抽獎暫停。請開啟「自動設定日期與時間」', 'warn'); return; }
    if (!isActive()) { const W = typeof eventWindow === 'function' ? eventWindow(P().id) : null; toast(W ? `這個活動 ${md(W.s)} ${hm(W.s)} 開放，還有 ${left(W.s - Date.now())}` : '這個活動目前休息中，復刻時間另行公告'); return; }
    if (E.tickets >= n) E.tickets -= n; else if (SAVE.data.tokens >= n * P().tokenCost) SAVE.data.tokens -= n * P().tokenCost; else { toast(`抽獎券不足，也沒有足夠的寶藏幣（需要 ${n * P().tokenCost} 枚）`, 'warn'); return; }
    busy = true; const res = []; for (let i = 0; i < n; i++) res.push(rollOne(E)); grant(E, res); SAVE.save(); if (typeof coins === 'function') coins();
    try { await animate(res); } finally { busy = false; render(); }
  }

  /* ---------- 命運水晶動畫 ---------- */
  async function animate(res) {
    const ov = document.createElement('div'); ov.className = 'ev-ov'; ov.innerHTML = `<div class="ev-ov-bg"></div><div class="ev-stage"></div><button class="g-skip ev-skip">跳過 ▸▸</button><div class="ev-flash"></div>`;
    document.body.appendChild(ov);
    let skip = false, skipRes; const skipP = new Promise(r => skipRes = r); ov.querySelector('.ev-skip').onclick = () => { skip = true; skipRes(); };
    const W = ms => skip ? Promise.resolve() : Promise.race([wait(ms), skipP]);
    const stage = ov.querySelector('.ev-stage'); stage.classList.toggle('ten', res.length > 1);
    const colorOf = x => x.shard ? P().shards.find(s => s.char === x.shard).color : RCOL[x.rar || ITEMS[x.item].rarity] || '#8fd0ff';
    res.forEach((x, i) => { const el = document.createElement('div'); el.className = 'ev-crys' + (x.shard ? ' hit ' + x.shard : ''); el.style.setProperty('--c', colorOf(x)); el.style.setProperty('--d', (i * 70) + 'ms');
      el.innerHTML = `<img class="gem ev-gem-img" src="${x.shard ? CRYS_IMG.shard : CRYS_IMG.item}" alt="" draggable="false"><div class="ev-card">${x.shard ? `<img src="${P().shards.find(s => s.char === x.shard).icon}" alt=""><b>${CHARACTERS[x.shard].name}碎片</b><em>×${x.n}</em>` : `${itemIcon(ITEMS[x.item])}<b>${ITEMS[x.item].name}</b><em class="r-${ITEMS[x.item].rarity}">${ITEMS[x.item].rarity}</em>`}</div>`;
      stage.appendChild(el); });
    SFX.play('crank'); requestAnimationFrame(() => ov.classList.add('show'));
    await W(res.length > 1 ? 1200 : 900);
    const els = [...stage.children];
    for (let i = 0; i < els.length; i++) {
      const el = els[i], x = res[i];
      if (x.shard && !skip) { const f = ov.querySelector('.ev-flash'); f.style.setProperty('--c', colorOf(x)); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); SFX.play('rare'); particles(ov, x.shard, colorOf(x)); await W(350); }
      el.classList.add('open'); if (!skip) SFX.play(x.shard ? 'rare' : 'pop'); await W(x.shard ? 700 : 220);
    }
    els.forEach(e => e.classList.add('open'));
    const got = res.filter(x => x.shard);
    const foot = document.createElement('div'); foot.className = 'ev-foot';
    const sum = {}; got.forEach(x => { sum[x.shard] = (sum[x.shard] || 0) + x.n; });
    foot.innerHTML = `<p>${got.length ? Object.keys(sum).map(k => `<b style="color:${colorOf({ shard: k })}">${CHARACTERS[k].name}碎片 ×${sum[k]}</b>`).join('・') : '這次沒有抽到角色碎片'}</p><button class="btn-primary" id="evDone">收下</button>`;
    ov.appendChild(foot); ov.querySelector('.ev-skip').remove();
    await new Promise(r => { foot.querySelector('#evDone').onclick = r; });
    ov.classList.remove('show'); setTimeout(() => ov.remove(), 300);
  }
  function particles(ov, kind, col) {
    for (let i = 0; i < 26; i++) { const p = document.createElement('i'); p.className = 'ev-pt'; p.textContent = ({ hancock: '❤', moria: '🦇', mihawk: '⚔', buggy: '🎪', dorry: '⚔', brogy: '🛡' })[kind] || '✦'; p.style.color = col; ov.appendChild(p);
      const a = Math.random() * 6.28, d = 160 + Math.random() * 320; p.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1.3) rotate(${(Math.random() - .5) * 180}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }).onfinish = () => p.remove(); }
  }

  /* ---------- 召喚池切換（可左右滑動，之後新增活動會自動多一個標籤） ---------- */
  let pool = 'normal';
  function buildTabs() {
    const t = $('poolTabs'); if (!t) return;
    const U = upcoming(); t.innerHTML = `<button data-pool="normal" role="tab">寶藏扭蛋</button>` + POOLS().filter(pl => phase(pl.id) === 'live').map(pl => `<button data-pool="ev:${pl.id}" role="tab"><img src="${pl.shards[0].icon}" alt="">${pl.tab || pl.name}${({ live: '<i class="pool-hot">HOT</i>', soon: '<i class="pool-soon">預告</i>' })[phase(pl.id)] || '<i class="pool-off">休息</i>'}</button>`).join('') + (U.length ? `<button data-pool="ev:${PV}" role="tab" class="pool-pv"><img src="${U[0].shards[0].icon}" alt="">活動預告<i class="pool-soon">${U.length}</i></button>` : '');
    if (pool.startsWith('ev:') && !t.querySelector(`[data-pool="${pool}"]`)) pool = U.length ? 'ev:' + PV : 'normal';
    t.querySelectorAll('[data-pool]').forEach(b => b.onclick = () => { pool = b.dataset.pool; if (pool.startsWith('ev:')) curId = pool.slice(3); applyPool(); t.scrollTo({ left: Math.max(0, b.offsetLeft - (t.clientWidth - b.offsetWidth) / 2), behavior: 'smooth' }); const gs = $('gachaScreen'); if (gs) gs.scrollLeft = 0; });
  }
  function applyPool() {
    const on = typeof hubTab === 'undefined' || hubTab === 'summon', ev = pool.startsWith('ev:');
    document.querySelectorAll('#poolTabs [data-pool]').forEach(b => { b.classList.toggle('on', b.dataset.pool === pool); b.setAttribute('aria-selected', b.dataset.pool === pool); });
    const g = document.querySelector('.g-main.tavern'), e = $('evPane'), t = $('poolTabs');
    if (t) t.classList.toggle('hidden', !on);
    if (g) g.classList.toggle('hidden', !on || ev); if (e) e.classList.toggle('hidden', !on || !ev);
    const gs = $('gachaScreen'); if (gs) { gs.dataset.pool = on ? (ev ? 'event' : 'normal') : ''; if (t && on) gs.style.setProperty('--poolTop', Math.round(t.getBoundingClientRect().bottom + 10) + 'px'); }
    if (on && ev) { if (pool === 'ev:' + PV) renderPreview(); else render(); if (e) e.scrollTop = 0; }
  }
  window.addEventListener('resize', () => { if ($('gachaScreen') && !$('gachaScreen').classList.contains('hidden')) applyPool(); });
  /* 檔期切換（例如 11/01 00:00 開放）時，不用重新整理就自動更新標籤、活動頁與大廳 */
  let sig = '';
  const phaseSig = () => POOLS().map(p => p.id + phase(p.id)).join('|');
  setInterval(() => { const n = phaseSig(); if (pool === 'ev:' + PV && n === sig && $('evPane') && !$('evPane').classList.contains('hidden')) renderPreview(); if (n === sig) return; const first = !sig; sig = n; if (first) return; buildTabs(); applyPool(); if (typeof renderLobby === 'function' && typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen') renderLobby(); if (typeof toast === 'function') { const L = POOLS().find(p => phase(p.id) === 'live'); if (L) toast(`限定活動「${L.name}」開放了！`, 'gold'); } }, 20000);
  window.addEventListener('DOMContentLoaded', () => {
    sig = phaseSig(); buildTabs();
    const sw = window.switchHub; if (sw) window.switchHub = function () { const r = sw.apply(this, arguments); applyPool(); return r; };
    const og = window.openGacha; if (og) window.openGacha = function () { const r = og.apply(this, arguments); requestAnimationFrame(applyPool); return r; };
  });

  /* ---------- 角色背包：碎片區 ---------- */
  window.renderShardPane = function (el) {
    el.innerHTML = `<p class="sd-note">在懸賞處的「限定活動」抽取角色碎片，集滿就能在這裡合成限定角色。</p>` + POOLS().map(pl => { const E = st(pl);
      const ph = phase(pl.id), W = typeof eventWindow === 'function' ? eventWindow(pl.id) : null;
      return `<section class="sd-group"><h4><span>${pl.name}</span><small class="sd-ph ${ph}">${ph === 'live' ? `開放中・${md(W.e - 60e3)} 截止` : ph === 'soon' ? `${md(W.s)} 開放` : '休息中'}</small></h4>${pl.shards.map(s => { const c = CHARACTERS[s.char], n = E.shards[s.char], own = owned(s.char), ok = n >= NEED(pl, s.char) && !own, pct = Math.min(100, n / NEED(pl, s.char) * 100);
        return `<article class="sd-card ${ok ? 'ready' : ''} ${own ? 'own' : ''}" style="--c:${s.color}">
          <img class="sd-icon" src="${s.icon}" alt="">
          <div class="sd-head"><span class="sd-rar">${(typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[s.char]) || 'SSR'}</span><b>${c.name}</b><small>${c.title}</small></div>
          <div class="sd-prog"><div class="sd-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${NEED(pl, s.char)}" aria-valuenow="${Math.min(n, NEED(pl, s.char))}"><i style="width:${pct}%"></i></div><span><b>${n}</b> / ${NEED(pl, s.char)}</span></div>
          ${own ? '<span class="sd-state">✓ 已擁有</span>' : `<button class="sd-btn ${ok ? 'btn-gold' : ''}" data-synth="${s.char}" ${ok ? '' : 'disabled'}>${ok ? '合成角色' : `還差 ${NEED(pl, s.char) - n} 片`}</button>`}
        </article>`; }).join('')}</section>`; }).join('');
    el.querySelectorAll('[data-synth]').forEach(b => b.onclick = () => { const pl = POOLS().find(x => x.shards.some(s => s.char === b.dataset.synth)); if (pl) { curId = pl.id; synth(b.dataset.synth); } window.renderShardPane(el); });
  };

})();
