/* v156 大廳版面重整（以 v154 示意圖「推薦方案：船長甲板＋航線條」為基礎）
   只改版面與呈現，所有入口與點擊後的功能都沿用原本的按鈕：
   1. 主線航程卡 #v6Route：篇章插圖當背景、第幾篇／下一步任務、各篇進度點、「繼續航行」按鈕（點擊＝原本的 #l2Mission）。
   2. 右側（電腦）／下方（手機、平板直式）資訊區 #v6Side：航程卡 → 限定召喚 → 出戰陣容、皇帝領海、限時月費。
      以搬移既有節點實現（#lbEvent、#lbTeam、#l2Emperor、#l2Month），v118 的電腦版兩欄搬移之後會再搬回這裡。
   3. 左側圖示欄：所有裝置都是常用 5 個＋「更多」（v145 決定的順序），「更多」改成旁邊展開的抽屜（4 欄／手機 3 欄）。
   4. 船長立繪、名牌、對話框的位置依實際量到的頂部列、左側欄、資訊區、下方導覽列計算（不寫死裝置尺寸）。
   只在直式（手機、平板）與電腦版（寬 ≥1000、高 ≥600、橫式）啟用；手機橫式維持原本的版面。 */
(function () {
  const $ = id => document.getElementById(id);
  const DESK = matchMedia('(min-width:1000px) and (min-height:600px) and (orientation:landscape)');
  const PORT = matchMedia('(orientation:portrait)');
  const ARW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>';
  const homes = new Map(); let busy = false, side = null, route = null, drawerHead = null;

  const mode = () => DESK.matches ? 'desk' : PORT.matches ? (innerWidth <= 600 ? 'ph' : 'tb') : '';
  const nextIdx = () => { const d = SAVE.data; return CHAPTERS.findIndex(c => !(d.chapters[c.id] || {}).cleared); };
  const esc_ = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function build() {
    const lob = $('lobby'); if (!lob || side) return;
    ['lbEvent', 'lbTeam', 'l2Emperor'].forEach(id => { const el = $(id); if (el && !homes.has(el)) homes.set(el, { p: el.parentNode, n: el.nextSibling }); });
    side = document.createElement('div'); side.id = 'v6Side'; side.className = 'v6-side';
    route = document.createElement('button'); route.id = 'v6Route'; route.className = 'v6-route';
    route.innerHTML = '<span class="v6-r-art" aria-hidden="true"></span><span class="v6-r-in"><span class="v6-r-tag"></span><b class="v6-r-t"></b><small class="v6-r-s"></small><span class="v6-r-row"><span class="v6-voy" aria-hidden="true"></span><span class="v6-r-go"><span>繼續航行</span>' + ARW + '</span></span></span>';
    route.onclick = () => { const m = $('l2Mission'); if (m) m.click(); else if (window.openChart) openChart(); };
    side.appendChild(route); lob.appendChild(side);
    /* 出戰陣容整張卡都可以點（原本只有頭像可以點） */
    const tm = $('lbTeam'); if (tm) tm.addEventListener('click', e => { if (!lob.classList.contains('v6') || e.target.closest('.lbt-av,#lbTeamSet')) return; openCrew('crew'); });
    tm && tm.setAttribute('role', 'button'); tm && tm.setAttribute('tabindex', '0');
    tm && tm.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === tm) { e.preventDefault(); openCrew('crew'); } });
  }

  function fillRoute() {
    if (!route) return; const d = SAVE.data, i = nextIdx(), N = CHAPTERS.length, nc = i < 0 ? null : CHAPTERS[i];
    const art = route.querySelector('.v6-r-art'), img = (nc || CHAPTERS[N - 1]).art;
    if (art.dataset.src !== img) { art.dataset.src = img; art.style.backgroundImage = `url("${img}")`; }
    let tag, t, s;
    if (nc) { const st = d.chapters[nc.id] || { step: 0 }, k = Math.min(st.step || 0, nc.steps.length), step = nc.steps[Math.min(k, nc.steps.length - 1)];
      tag = `主線航路・第 ${i + 1} / ${N} 篇`; t = nc.name + (nc.subtitle ? `・${nc.subtitle}` : ''); s = `下一步：${step ? step.title : ''}（任務 ${k} / ${nc.steps.length}）`; }
    else { tag = `主線航路・${N} 篇全部通關`; t = '偉大航路已全數通關'; s = '可以重溫劇情，或挑戰其他冒險'; }
    route.querySelector('.v6-r-tag').textContent = tag; route.querySelector('.v6-r-t').textContent = t; route.querySelector('.v6-r-s').textContent = s;
    route.querySelector('.v6-r-go span').textContent = nc ? '繼續航行' : '查看航海圖';
    const cur = i < 0 ? N : i, voy = route.querySelector('.v6-voy');
    if (voy.dataset.k !== cur + '/' + N) { voy.dataset.k = cur + '/' + N; voy.innerHTML = CHAPTERS.map((c, j) => (j ? `<s class="${j <= cur ? 'd' : ''}"></s>` : '') + `<i class="${j < cur ? 'd' : j === cur ? 'n' : ''}"></i>`).join(''); }
    route.setAttribute('aria-label', `${tag}：${t}。${s}`);
  }

  /* 把節點搬到資訊區；順序：航程卡、限定召喚、出戰陣容、皇帝領海、限時月費 */
  function adopt() {
    /* 電腦版 v118 會把左側圖示欄搬進 .l2-colL；v6 版面一律放回大廳底層 */
    const lob = $('lobby'), rail = lob.querySelector('.l2-rail'); if (rail && rail.parentNode !== lob) lob.insertBefore(rail, side);
    const order = [route, $('lbEvent'), $('lbTeam'), $('l2Emperor'), $('l2Month')].filter(Boolean);
    order.forEach((el, k) => { if (el.parentNode !== side || side.children[k] !== el) side.insertBefore(el, side.children[k] || null); });
    side.classList.toggle('v6-m', !!($('l2Month') && !$('l2Month').hidden));
  }
  function release() {
    homes.forEach((h, el) => { if (el.parentNode === side) h.p.insertBefore(el, h.n && h.n.parentNode === h.p ? h.n : null); });
    const mc = $('l2Month'), sd = document.querySelector('#lobby .l2-side'); if (mc && mc.parentNode === side && sd) sd.appendChild(mc);
  }

  /* 「更多」抽屜：隱藏的圖示依序排成格子（位置寫入 --dx／--dy），抽屜底板用 #v6Drawer */
  function drawer() {
    const r = document.querySelector('#lobby .l2-rail'); if (!r) return;
    if (!drawerHead) { drawerHead = document.createElement('div'); drawerHead.id = 'v6Drawer'; drawerHead.className = 'v6-drawer'; drawerHead.setAttribute('aria-hidden', 'true'); drawerHead.innerHTML = '<b>更多功能</b>'; }
    if (drawerHead.parentNode !== r) r.insertBefore(drawerHead, r.firstChild);
    const cols = mode() === 'ph' ? 3 : 4;
    const xs = [...r.querySelectorAll(':scope > .l2-ic.v6-x'), ...r.querySelectorAll(':scope > .l2-ic.v5-x')].filter(b => !b.hidden);
    xs.forEach((b, k) => { b.style.setProperty('--dx', k % cols); b.style.setProperty('--dy', Math.floor(k / cols)); });
    r.style.setProperty('--dcols', cols); r.style.setProperty('--drows', Math.max(1, Math.ceil(xs.length / cols)));
    /* 「更多」紅點：v145 的 dot() 只看它收進去的圖示；被這裡收進抽屜的常用圖示用 v6-dot 另外標示 */
    const more = $('l2More'); if (more) more.classList.toggle('v6-dot', xs.some(b => b.classList.contains('has-dot') || b.id === 'l2BackupIc'));
  }

  /* 量測：頂部列、下方導覽列、資訊區、左側欄 → 船長立繪、名牌、對話框的位置 */
  function measure() {
    const lob = $('lobby'), m = mode(); if (!lob || !m) return; const r0 = lob.getBoundingClientRect(); if (!r0.height) return;
    const tb = document.querySelector('#modeScreen .topbar'), nav = lob.querySelector('.l2-nav'), rail = lob.querySelector('.l2-rail');
    const T = tb ? Math.max(0, Math.round(tb.getBoundingClientRect().bottom - r0.top)) : 72;
    /* 「出航」徽章會凸出導覽列上緣，直式資訊區要放在徽章上方 */
    const gi = lob.querySelector('.l2-go-img'), go = $('lbGo'), gt = Math.min(...[gi, go].filter(x => x && x.getBoundingClientRect().height).map(x => x.getBoundingClientRect().top + 4), Infinity);
    const NB = nav ? Math.round(r0.bottom - Math.min(nav.getBoundingClientRect().top, m === 'desk' ? Infinity : gt)) : 76;
    lob.style.setProperty('--v6tb', T + 'px'); lob.style.setProperty('--v6nb', NB + 'px');
    const S = side.getBoundingClientRect(), R = rail ? rail.getBoundingClientRect() : { right: r0.left, width: 0 };
    let hl, hr, ht, hb;
    if (m === 'desk') { hl = Math.round(R.right - r0.left + 16); hr = Math.round(r0.right - S.left + 16); ht = T + 8; hb = NB; }
    else { const SB = Math.round(r0.bottom - S.top); lob.style.setProperty('--v6sb', SB + 'px'); hl = 0; hr = 0; ht = T; hb = SB - Math.min(64, Math.round(S.height * .25)); }
    lob.style.setProperty('--v6hl', hl + 'px'); lob.style.setProperty('--v6hr', hr + 'px'); lob.style.setProperty('--v6ht', ht + 'px'); lob.style.setProperty('--v6hb', hb + 'px');
    /* 名牌：電腦版在立繪區下方置中；直式在資訊區上方置中 */
    if (m === 'desk') lob.style.setProperty('--v6pc', Math.round((hl + (r0.width - hr)) / 2) + 'px');
    else { const rl = Math.round(R.right - r0.left + 8); lob.style.setProperty('--v6pc', Math.round((rl + r0.width - 8) / 2) + 'px'); lob.style.setProperty('--v6pw', Math.round(r0.width - 8 - rl) + 'px'); }
    /* 圖示欄放不下 5 個常用＋更多（矮手機、App 內建瀏覽器）：多出來的常用圖示也收進「更多」 */
    if (rail) { const pl = $('lbPlate'), P = pl && pl.offsetParent ? pl.getBoundingClientRect() : null, RR = rail.getBoundingClientRect();
      /* 名牌和圖示欄左右不重疊時，圖示欄可以一路延伸到資訊區上緣 */
      const lim = m === 'desk' ? r0.bottom - NB - 16 : (P && P.left < RR.right + 4 ? P.top : S.top) - 8;
      const cs = getComputedStyle(rail), ic = parseFloat(cs.getPropertyValue('--ic')) || 56, gap = parseFloat(cs.rowGap) || 4, pad = parseFloat(cs.paddingTop) || 4;
      const fit = Math.max(2, Math.floor((lim - (T + 8) - pad * 2 + gap) / (ic + gap))), core = [...rail.querySelectorAll(':scope > .l2-ic:not(.v5-x):not(.l2-more)')].filter(b => !b.hidden).sort((a, b) => (+a.style.getPropertyValue('--v5o') || 0) - (+b.style.getPropertyValue('--v5o') || 0));
      let ch = false; core.forEach((b, k) => { const x = k >= fit - 1; if (b.classList.contains('v6-x') !== x) { b.classList.toggle('v6-x', x); ch = true; } });
      [...rail.querySelectorAll(':scope > .v6-x.v5-x')].forEach(b => { b.classList.remove('v6-x'); ch = true; });
      if (ch) drawer(); }
    /* 對話框：立繪區上方，避開左側欄 */
    const sayL = m === 'desk' ? hl : Math.round(R.right - r0.left + 8), sayR = m === 'desk' ? hr : 8;
    lob.style.setProperty('--v6sayL', sayL + 'px'); lob.style.setProperty('--v6sayR', sayR + 'px');
  }

  function apply() {
    const lob = $('lobby'); if (!lob || busy) return; busy = true;
    try {
      build(); const m = mode();
      lob.classList.toggle('v6', !!m); ['ph', 'tb', 'desk'].forEach(k => lob.classList.toggle('v6-' + k, m === k));
      if (!m) { release(); return; }
      fillRoute(); adopt(); drawer(); measure();
      lob.classList.remove('say-dock', 'say-compact', 'say-over', 'say-fold', 'say-open', 'say-center');
    } catch (e) { console.warn('lobby v156', e); }
    finally { busy = false; }
  }
  window.lobbyV156 = apply;

  window.addEventListener('DOMContentLoaded', () => {
    const lob = $('lobby'); if (!lob) return; build();
    const rl = window.renderLobby; if (rl) window.renderLobby = function () { const r = rl.apply(this, arguments); apply(); requestAnimationFrame(apply); return r; };
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); [0, 450, 950].forEach(t => setTimeout(apply, t + 20)); return r; };
    addEventListener('resize', () => requestAnimationFrame(apply));
    [DESK, PORT].forEach(q => q.addEventListener ? q.addEventListener('change', () => setTimeout(apply, 0)) : q.addListener(apply));
    /* 其他程式（v118 電腦版兩欄、VIP 月費卡）把節點搬走時，同一輪就搬回來，不會閃一下 */
    new MutationObserver(ms => {
      if (busy || !lob.classList.contains('v6')) return;
      if (ms.some(x => x.type === 'childList' && x.target !== side && (x.target === lob || x.target.matches('.l2-colR,.l2-colL,.l2-side,.l2-rail')))) apply();
      else if (ms.some(x => x.type === 'attributes' && /say-(dock|fold|over|compact|open|center)/.test(lob.className))) lob.classList.remove('say-dock', 'say-compact', 'say-over', 'say-fold', 'say-open', 'say-center');
    }).observe(lob, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => requestAnimationFrame(measure)); const tb = document.querySelector('#modeScreen .topbar'); if (tb) ro.observe(tb); ro.observe(side); }
  });
})();
