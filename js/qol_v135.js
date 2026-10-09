/* v135 參考市面手遊的標準功能（QoL）：
   ① 掛機寶藏（AFK 寶箱）：離線也會累積貝里、一般召喚券、經驗書（v136 起只給這三類），最多 12 小時；每天一次「快速領取」立即拿 2 小時份。大廳左側入口。
   ② 召喚紀錄：懸賞處召喚、新手召喚、限定活動召喚都記錄（最近 300 筆），召喚頁的機率表下方「召喚紀錄」。
   ③ 編隊預設：船員畫面「出戰陣容」下方 3 組編隊，一鍵切換、可儲存目前陣容。
   ④ 劇情「跳過」：對話框右上角，直接跳到選項或結束。
   ⑤ 每日／本週活躍寶箱「全部領取」。
   存檔：SAVE.data.afk = { t, fast }、SAVE.data.gachaLog = [...]、SAVE.data.presets = [[ids], [ids], [ids]] */
const AFK_CFG = { capH: 12, fastH: 2, minClaimMin: 10,
  /* v136：只給貝里、一般召喚券、一般道具（使用者決定）；不給覺醒結晶與航海寶物 */
  berryPerH: cl => 2000 + 500 * cl,           /* cl：已完成的篇章數 */
  expSPerH: 1, expMEveryH: 3, ticketEveryH: 6, ticketN: 1 };
(function () {
  const $q = (s, r) => (r || document).querySelector(s);
  const fmtN = n => (+n || 0).toLocaleString();
  const D = () => SAVE.data;
  const todayKey = () => (typeof today === 'function' ? today() : new Date().toDateString());
  function overlay(cls, label, html) { closeOv(); const o = document.createElement('div'); o.className = 'qo-wrap ' + cls; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', label); o.innerHTML = `<div class="qo-card">${html}</div>`; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target === o) closeOv(); }); const x = o.querySelector('[data-qx]'); if (x) x.onclick = closeOv; if (window.fixIcons) fixIcons(o); return o; }
  function closeOv() { document.querySelectorAll('.qo-wrap').forEach(o => o.remove()); }
  const head = (sub, title) => `<header class="qo-head"><div><small>${sub}</small><h2>${title}</h2></div><button class="icon-btn qo-x" data-qx aria-label="關閉">×</button></header>`;

  /* ---------- ① 掛機寶藏 ---------- */
  const afk = () => { const d = D(); if (!d.afk) d.afk = { t: Date.now(), fast: '' }; return d.afk; };
  const cleared = () => (typeof CHAPTERS !== 'undefined' ? CHAPTERS.filter(c => D().chapters && D().chapters[c.id] && D().chapters[c.id].cleared).length : 0);
  const hoursNow = () => Math.max(0, Math.min(AFK_CFG.capH, (Date.now() - afk().t) / 3600e3));
  function afkReward(h) { const C = AFK_CFG, cl = cleared(), items = {};
    const exS = Math.floor(h * C.expSPerH), exM = Math.floor(h / C.expMEveryH), tk = Math.floor(h / C.ticketEveryH) * C.ticketN;
    if (exS) items.exp_s = exS; if (exM) items.exp_m = exM; if (tk && ITEMS.summon_ticket) items.summon_ticket = tk;
    return { berry: Math.floor(C.berryPerH(cl) * h / 10) * 10, items }; }
  function afkGive(h, why) { return window.PROG ? PROG.give(afkReward(h), why) : []; }
  function claimAfk() { const h = hoursNow(); if (h * 60 < AFK_CFG.minClaimMin) { toast(`再累積 ${Math.ceil(AFK_CFG.minClaimMin - h * 60)} 分鐘就能領取`); return; } const L = afkGive(h, '掛機寶藏'); afk().t = Date.now(); SAVE.save(); if (window.PROG) PROG.celebrate('掛機寶藏', L, `累積 ${fmtH(h)}`); openAfk(); lobby(); }
  function fastAfk() { const A = afk(); if (A.fast === todayKey()) { toast('今天的快速領取已經用過了'); return; } A.fast = todayKey(); const L = afkGive(AFK_CFG.fastH, '快速領取'); SAVE.save(); if (window.PROG) PROG.celebrate('快速領取', L, `立即獲得 ${AFK_CFG.fastH} 小時的掛機收益`); openAfk(); lobby(); }
  const fmtH = h => { const m = Math.floor(h * 60); return m >= 60 ? `${Math.floor(m / 60)} 小時 ${m % 60} 分` : `${m} 分鐘`; };
  function rewRow(R) { const out = []; if (R.berry) out.push(['<img src="assets/ui/coin_berry.webp?v=100" alt="">', fmtN(R.berry), '貝里']); Object.entries(R.items).forEach(([k, n]) => { const it = ITEMS[k]; if (it) out.push([typeof itemIcon === 'function' ? itemIcon(it) : '', '×' + n, it.name]); }); return out.map(([ic, n, name]) => `<li><span class="qo-ric">${ic}</span><b>${n}</b><small>${name}</small></li>`).join(''); }
  function openAfk() { const h = hoursNow(), C = AFK_CFG, R = afkReward(h), full = h >= C.capH, can = h * 60 >= C.minClaimMin, fastOk = afk().fast !== todayKey(), per = afkReward(1);
    const o = overlay('qo-afk', '掛機寶藏', `${head('離線也會累積', '掛機寶藏')}
      <div class="qo-afk-top"><div class="qo-ring" style="--p:${h / C.capH * 100}%"><b>${fmtH(h)}</b><small>/ ${C.capH} 小時${full ? '・已滿' : ''}</small></div>
        <p>船員在海上替你蒐集物資，最多累積 ${C.capH} 小時。完成的篇章越多，每小時的貝里越多（目前 ${cleared()} 篇：每小時 ${fmtN(per.berry)} 貝里）。每 ${C.ticketEveryH} 小時還有一張一般召喚券。</p></div>
      <h3 class="qo-h3">目前可領取</h3><ul class="qo-rew">${rewRow(R) || '<li class="qo-none">還沒有累積到物資</li>'}</ul>
      <div class="qo-btns"><button class="btn-ghost" data-fast ${fastOk ? '' : 'disabled'}>${fastOk ? `快速領取（${C.fastH} 小時份・今日免費）` : '今日快速領取已用'}</button><button class="btn-gold" data-claim ${can ? '' : 'disabled'}>領取</button></div>`);
    o.querySelector('[data-claim]').onclick = claimAfk; o.querySelector('[data-fast]').onclick = fastAfk; }
  function lobby() { const b = document.getElementById('lbAfk'); if (!b || !SAVE.data || !SAVE.data.roster) return; const h = hoursNow();
    const t = document.getElementById('lbAfkTxt'), bar = document.getElementById('lbAfkBar'); if (t) t.textContent = h >= AFK_CFG.capH ? '已滿' : fmtH(h); if (bar) bar.style.width = (h / AFK_CFG.capH * 100) + '%';
    b.classList.toggle('has-dot', h >= 1 || afk().fast !== todayKey()); }

  /* ---------- ② 召喚紀錄 ---------- */
  function gachaLog(src, res) { try { const L = D().gachaLog = D().gachaLog || [], t = Date.now();
    res.forEach(x => { const e = { t, s: src }; if (x.char) { e.k = 'c'; e.id = x.char; e.dup = !!x.dup; } else if (x.shard) { e.k = 's'; e.id = x.shard; e.n = x.n; } else if (x.item) { e.k = 'i'; e.id = x.item; } else return; if (x.pity) e.p = 1; L.push(e); });
    if (L.length > 300) L.splice(0, L.length - 300); SAVE.save(); } catch (e) { } }
  function logRow(e) { const d = new Date(e.t), ts = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    let name = '', rar = 'N'; if (e.k === 'c') { const c = CHARACTERS[e.id]; name = c ? c.name : e.id; rar = (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[e.id]) || 'SSR'; name += e.dup ? '（重複）' : ''; }
    else if (e.k === 's') { const c = CHARACTERS[e.id]; name = `${c ? c.name : e.id} 碎片 ×${e.n || 1}`; rar = 'UR'; } else { const it = ITEMS[e.id]; name = it ? it.name : e.id; rar = it ? it.rarity : 'N'; }
    const hi = e.k !== 'i' || ['SR', 'SSR'].includes(rar);
    return `<li class="${hi ? 'hi' : ''}"><time>${ts}</time><span class="qo-src">${e.s}</span><em class="rar c-rar r-${rar}">${e.k === 'c' ? '船員' : rar}</em><b>${name}</b>${e.p ? '<i class="qo-pity">保底</i>' : ''}</li>`; }
  function openLog() { const L = (D().gachaLog || []).slice().reverse(), chars = L.filter(e => e.k === 'c').length;
    overlay('qo-log', '召喚紀錄', `${head(`最近 ${L.length} 筆（最多保留 300 筆）`, '召喚紀錄')}
      <p class="qo-sum">共 ${L.length} 抽・船員 ${chars} 次・距離下次保底 ${Math.max(1, (GAME_SETTINGS.gachaPity || 150) - (D().pity || 0))} 抽（懸賞處召喚）</p>
      <ol class="qo-list">${L.map(logRow).join('') || '<li class="qo-none">還沒有召喚紀錄</li>'}</ol>`); }
  function logBtn() { const t = document.getElementById('rateTable'); if (!t || document.getElementById('gLogBtn')) return; const b = document.createElement('button'); b.id = 'gLogBtn'; b.className = 'btn-ghost sm qo-logbtn'; b.textContent = '召喚紀錄'; b.onclick = openLog; t.insertAdjacentElement('afterend', b); }

  /* ---------- ③ 編隊預設 ---------- */
  let saving = false;
  const presets = () => { const d = D(); if (!Array.isArray(d.presets)) d.presets = [[], [], []]; return d.presets; };
  const avatarOf = id => typeof charArt === 'function' ? charArt(id, 'avatar') : CHARACTERS[id].avatar;
  function presetRow() { const P = presets(), L = D().lineup || [];
    return `<div class="tp-row" role="group" aria-label="編隊預設"><span class="tp-l">編隊</span>${P.map((ids, i) => { const v = ids.filter(id => owned(id)); const same = v.length && v.join() === L.join();
      return `<button class="tp-slot ${same ? 'on' : ''} ${saving ? 'save' : ''}" data-tp="${i}" aria-label="編隊 ${i + 1}${v.length ? '：' + v.map(id => CHARACTERS[id].name).join('、') : '（空）'}"><i>${i + 1}</i><span class="tp-av">${v.length ? v.slice(0, 3).map(id => `<img src="${avatarOf(id)}" alt="">`).join('') : '<small>空</small>'}</span></button>`; }).join('')}
      <button class="btn-ghost sm tp-save ${saving ? 'on' : ''}" data-tps>${saving ? '選擇要存的編隊' : '儲存目前陣容'}</button></div>`; }
  function decorateCrew() { const pane = document.getElementById('cxPane_crew'), slots = pane && pane.querySelector('.sb-slots'); if (!slots || pane.querySelector('.tp-row')) return;
    slots.insertAdjacentHTML('afterend', presetRow());
    pane.querySelectorAll('[data-tp]').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.tp, P = presets();
      if (saving) { P[i] = (D().lineup || []).slice(); saving = false; SAVE.save(); toast(`已儲存到編隊 ${i + 1}`, 'gold'); return redraw(); }
      const ids = P[i].filter(id => owned(id) && !(typeof isTraining === 'function' && isTraining(id))).slice(0, GAME_SETTINGS.lineupMax || 3);
      if (!ids.length) { toast('這組編隊是空的：先按「儲存目前陣容」'); return; }
      D().lineup = ids; SAVE.save(); toast(`已切換到編隊 ${i + 1}`, 'gold'); redraw(); });
    const s = pane.querySelector('[data-tps]'); if (s) s.onclick = e => { e.stopPropagation(); saving = !saving; redraw(); }; }
  function redraw() { if (typeof openCrew === 'function') openCrew('crew'); }

  /* ---------- ④ 劇情跳過 ---------- */
  function skipBtn() { const d = document.getElementById('dialog'); if (!d || document.getElementById('dlgSkip')) return; const b = document.createElement('button'); b.id = 'dlgSkip'; b.className = 'dlg-min dlg-skip'; b.type = 'button'; b.textContent = '跳過 ▸▸'; b.setAttribute('aria-label', '跳過對話');
    b.onclick = e => { e.stopPropagation(); try { if (typeof typing !== 'undefined' && typing) { clearInterval(typing.h); const t = document.getElementById('dlgText'); if (t) t.innerHTML = typeof dlgHL === 'function' ? dlgHL(typing.full) : typing.full; typing = null; } dlgQueue.length = 0; if (dlgChoices) { if (typeof showChoices === 'function') showChoices(); return; } nextLine(); } catch (er) { } };
    d.appendChild(b); }
  function placeSkip() { const m = document.getElementById('dlgMin'), s = document.getElementById('dlgSkip'); if (m && s) s.style.right = (m.offsetWidth ? m.offsetWidth + 20 : 96) + 'px'; if (s) { let n = 0; try { n = dlgQueue.length; } catch (e) { } s.hidden = n < 1; } }

  /* ---------- ⑤ 活躍寶箱全部領取 ---------- */
  function claimAllAct(kind) { const A = window.ACT, C = PROG.cfg; if (!A) return 0; const cel = PROG.celebrate; let all = [], n = 0; PROG.celebrate = (t, L) => { all = all.concat(L || []); };
    try { if (kind === 'd') { const p = A.points(), got = A.today().got; C.dailyChest.forEach(c => { if (p >= c.at && !got.includes(c.at) && A.claimDaily(c.at)) n++; }); }
      else { const W = A.week(); C.weekChest.forEach(c => { if (W.pts >= c.at && !W.got.includes(c.at) && A.claimWeek(c.at)) n++; }); } } finally { PROG.celebrate = cel; }
    const m = {}; all.forEach(x => { const k = x.item || x.name; if (!m[k]) m[k] = { ...x }; else m[k].count += x.count; }); if (n) PROG.celebrate(kind === 'd' ? `活躍寶箱 ×${n}` : `本週寶箱 ×${n}`, Object.values(m)); return n; }
  function decoratePass() { const w = document.querySelector('.ps-wrap'); if (!w || !window.ACT || !window.PROG) return; [['d', '.ps-today'], ['w', '.ps-week']].forEach(([k, sel]) => { const card = w.querySelector(sel); if (!card || card.querySelector('.ps-claimall')) return;
      const C = PROG.cfg, cnt = k === 'd' ? C.dailyChest.filter(c => ACT.points() >= c.at && !ACT.today().got.includes(c.at)).length : C.weekChest.filter(c => ACT.week().pts >= c.at && !ACT.week().got.includes(c.at)).length; if (cnt < 2) return;
      const b = document.createElement('button'); b.className = 'btn-gold sm ps-claimall'; b.textContent = `全部領取（${cnt}）`; b.onclick = e => { e.stopPropagation(); claimAllAct(k); if (window.openPass) openPass('daily'); }; card.appendChild(b); }); }

  window.addEventListener('DOMContentLoaded', () => {
    /* 大廳入口：放在「通行證」後面 */
    const pass = document.getElementById('lbPass'); if (pass && !document.getElementById('lbAfk')) { pass.insertAdjacentHTML('afterend', '<button class="l2-ic" id="lbAfk"><i class="l2-svg" data-ic="afk" aria-hidden="true"></i><b>掛機寶藏</b><small id="lbAfkTxt"></small><span class="l2-bar"><i id="lbAfkBar"></i></span></button>'); document.getElementById('lbAfk').onclick = openAfk; if (window.paintLobbyIcons) paintLobbyIcons(); }
    if (typeof openModes === 'function') { const om = window.openModes; window.openModes = function () { const r = om.apply(this, arguments); setTimeout(lobby, 250); return r; }; }
    setInterval(() => { if (typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen') lobby(); }, 60000);
    /* 召喚紀錄 */
    if (typeof pull === 'function') { const _p = pull; pull = async function (n) { const before = (D().gachaLog || []).length, tok = SAVE.data.tokens; const _g = grant; let caught = null; grant = function (res) { caught = res; return _g.apply(this, arguments); }; try { return await _p.apply(this, arguments); } finally { grant = _g; if (caught) gachaLog(n >= 10 ? `懸賞處 ${n} 連` : '懸賞處 單抽', caught); } }; }
    if (typeof pullFree === 'function') { const _pf = pullFree; pullFree = async function () { const _g = grant; let caught = null; grant = function (res) { caught = res; return _g.apply(this, arguments); }; try { return await _pf.apply(this, arguments); } finally { grant = _g; if (caught) gachaLog('新手召喚', caught); } }; }
    window.gachaLog = gachaLog;
    let qd = 0; new MutationObserver(() => { if (qd) return; qd = requestAnimationFrame(() => { qd = 0; logBtn(); decorateCrew(); decoratePass(); placeSkip(); }); }).observe(document.body, { childList: true, subtree: true });
    skipBtn(); logBtn();
  });
  window.QOL = { openAfk, claimAfk, fastAfk, afkReward, hoursNow, openLog, gachaLog, presets, claimAllAct };
})();
