/* v118 大廳與介面調整：
   1. 箭頭符號（‹ › ◀ ▶ ››）一律換成 SVG，放在按鈕正中央（文字符號在各字型高度不一，會偏上或偏下）。
   2. 船長對話框改為「點擊船長立繪」才出現的小互動（約 4 秒後收起）；原本點立繪開船員背包，改由名牌「更換船長」進入。
   3. 限定召喚卡：加上左右切換箭頭與輪播點；手機縮小成橫幅（不再佔太大畫面、不裁切活動圖）。
   4. 電腦版版面（寬 ≥ 1000、高 ≥ 600）：左側上方主線航路、下方功能圖示；右側上方限定召喚輪播，接著月費廣告、出戰陣容、皇帝領海。
      以搬移 DOM 節點實現，回到小螢幕時放回原位。 */
(function () {
  const $ = id => document.getElementById(id);
  /* ---------- 1. 箭頭 ---------- */
  const SVGS = { l: '<svg class="arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>', r: '<svg class="arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>',
    rr: '<svg class="arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l6 6-6 6M12.5 6l6 6-6 6"/></svg>', ll: '<svg class="arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6l-6 6 6 6M11.5 6l-6 6 6 6"/></svg>' };
  const GLYPH = { '‹': 'l', '◀': 'l', '❮': 'l', '›': 'r', '▶': 'r', '❯': 'r', '››': 'rr', '‹‹': 'll', '»': 'rr', '«': 'll' };
  const HOST = 'button, [role=button], .l2-mission em, .gw-nav, a';
  function fixArrows(root) {
    const w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT); const list = [];
    while (w.nextNode()) { const n = w.currentNode, t = n.nodeValue; if (!/[‹›◀▶❮❯»«]/.test(t)) continue; const p = n.parentElement; if (!p || p.closest('svg, script, style, textarea, input, .rg-cv') || !p.closest(HOST)) continue; list.push(n); }
    list.forEach(n => { const p = n.parentElement, raw = n.nodeValue, t = raw.trim();
      if (GLYPH[t] && p.childNodes.length === 1) { p.innerHTML = SVGS[GLYPH[t]]; p.classList.add('arw-only'); return; }
      const frag = document.createElement('span'); frag.className = 'arw-txt';
      frag.innerHTML = raw.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/››|‹‹|[‹›◀▶❮❯»«]/g, g => SVGS[GLYPH[g]] || g); n.replaceWith(...frag.childNodes); p.classList.add('arw-in'); });
  }
  window.fixArrows = fixArrows;

  /* ---------- 2. 點擊船長才說話 ---------- */
  let sayT = 0;
  function speak() { const el = $('l2Say'); if (!el) return; const d = SAVE.data, pid = [(d.lineup || [])[0], d.player].find(x => x && CHARACTERS[x] && owned(x)) || CHARACTER_ORDER[0], c = CHARACTERS[pid];
    const L = [`我是${c.name}，今天也一起航向偉大航路吧！`, '要不要去懸賞處看看限定召喚？', '船團的夥伴們在等你一起打 BOSS！'];
    if (typeof loginClaimable === 'function' && loginClaimable()) L.unshift('今天的登入獎勵還沒領喔！');
    if (typeof bounties === 'function') { const B = bounties(); if (B.some(b => b.prog >= b.goal && !b.claimed)) L.unshift('每日懸賞有獎勵可以領了！'); }
    if (typeof nextChapter === 'function') { const nc = nextChapter(); if (nc) L.push(`下一站是「${nc.name}」，準備好就出航吧！`); }
    const k = (+(el.dataset.k || -1) + 1) % L.length; el.dataset.k = k; el.innerHTML = `<b>${c.name.replace(/[&<>]/g, '')}</b><span>${L[k]}</span>`;
    el.classList.add('show'); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    const img = $('lbHeroImg'); if (img) { img.classList.remove('poke'); void img.offsetWidth; img.classList.add('poke'); }
    try { SFX.play('click'); } catch (e) { }
    clearTimeout(sayT); sayT = setTimeout(() => el.classList.remove('show'), 4200); }

  /* ---------- 3. 限定召喚輪播控制 ---------- */
  function pools() { if (typeof EVENT_POOLS === 'undefined') return []; const all = typeof eventPoolsSorted === 'function' ? eventPoolsSorted() : EVENT_POOLS, on = all.filter(p => typeof eventPhase !== 'function' || eventPhase(p.id) !== 'rest'); return on.length ? on : all; }
  function evCtrl() { const ev = $('lbEvent'); if (!ev) return; const L = pools(); let c = ev.querySelector('.l2-pc');
    if (!c) { c = document.createElement('span'); c.className = 'l2-pc'; c.innerHTML = `<span class="l2-pn prev" role="button" tabindex="0" aria-label="上一個活動">${SVGS.l}</span><span class="l2-dots"></span><span class="l2-pn next" role="button" tabindex="0" aria-label="下一個活動">${SVGS.r}</span>`; ev.appendChild(c);
      const step = d => e => { e.stopPropagation(); e.preventDefault(); const P = pools(); if (P.length < 2) return; const cur = P.findIndex(p => p.id === ev.dataset.pool); const nx = P[(cur + d + P.length) % P.length]; setPool(nx.id); };
      c.querySelector('.prev').addEventListener('click', step(-1)); c.querySelector('.next').addEventListener('click', step(1)); }
    c.hidden = L.length < 2; const cur = L.findIndex(p => p.id === ev.dataset.pool); c.querySelector('.l2-dots').innerHTML = L.map((p, i) => `<i class="${i === cur ? 'on' : ''}"></i>`).join(''); }
  /* 透過 lobby.js 的輪播：一直往下一個切換，直到指定的活動 */
  function setPool(id) { const ev = $('lbEvent'), P = pools(); let guard = 0; while (ev.dataset.pool !== id && guard++ < P.length + 1) { if (window.__lbEvNext) window.__lbEvNext(); else break; } evCtrl(); }

  /* ---------- 4. 電腦版兩欄版面 ---------- */
  const MQ = matchMedia('(min-width:1000px) and (min-height:600px) and (orientation:landscape)');
  const homes = new Map(); let cols = null;
  const remember = el => { if (el && !homes.has(el)) homes.set(el, { p: el.parentNode, n: el.nextSibling }); };
  function layout() {
    const lob = $('lobby'); if (!lob) return; const rail = lob.querySelector('.l2-rail'), side = lob.querySelector('.l2-side'), mis = $('l2Mission'), team = $('lbTeam'), emp = $('l2Emperor'), ev = $('lbEvent'), mc = $('l2Month');
    if (MQ.matches) {
      [rail, mis, team, emp, ev, mc].forEach(remember);
      if (!cols) { cols = { L: document.createElement('div'), R: document.createElement('div') }; cols.L.className = 'l2-colL'; cols.R.className = 'l2-colR'; lob.appendChild(cols.L); lob.appendChild(cols.R); }
      if (mis && mis.parentNode !== cols.L) cols.L.appendChild(mis); if (rail && rail.parentNode !== cols.L) cols.L.appendChild(rail);
      [ev, mc, team, emp].forEach(x => { if (x && x.parentNode !== cols.R) cols.R.appendChild(x); });
      [ev, mc, team, emp].forEach(x => x && cols.R.appendChild(x)); /* 依序：限定召喚、月費、出戰陣容、皇帝領海 */
      lob.classList.add('l2-desk');
    } else if (cols) {
      [...homes.entries()].forEach(([el, h]) => { if (h.p && el.parentNode !== h.p) h.p.insertBefore(el, h.n && h.n.parentNode === h.p ? h.n : null); });
      if (mis && side && mis.parentNode !== side) side.insertBefore(mis, side.firstChild);
      lob.classList.remove('l2-desk');
    }
  }
  /* 手機直式：限定召喚橫幅放在左側圖示欄與右側欄之間 */
  function fitPick() { const lob = $('lobby'); if (!lob || MQ.matches) return; const rail = lob.querySelector('.l2-rail'), side = lob.querySelector('.l2-side'); if (!rail || !side) return;
    const r0 = lob.getBoundingClientRect(), a = rail.getBoundingClientRect(), b = side.getBoundingClientRect(); if (!a.width || !b.width) return;
    lob.style.setProperty('--pk-l', Math.round(a.right - r0.left + 8) + 'px'); lob.style.setProperty('--pk-r', Math.round(r0.right - b.left + 8) + 'px'); }
  window.lobbyLayout118 = () => { layout(); fitPick(); };

  window.addEventListener('DOMContentLoaded', () => {
    fixArrows(document.body);
    new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n.nodeType === 1) fixArrows(n); else if (n.nodeType === 3 && n.parentElement) fixArrows(n.parentElement); }); }).observe(document.body, { childList: true, subtree: true });
    const hero = $('lbHero'); if (hero) { hero.setAttribute('aria-label', '和船長說話'); hero.onclick = e => { e.preventDefault(); speak(); }; }
    const say = $('l2Say'); if (say) say.addEventListener('click', () => say.classList.remove('show'));
    MQ.addEventListener ? MQ.addEventListener('change', () => { layout(); if (window.lobbySyncLayout) lobbySyncLayout(); }) : MQ.addListener(layout);
    addEventListener('resize', () => requestAnimationFrame(fitPick));
    const rl = window.renderLobby; if (rl) window.renderLobby = function () { const r = rl.apply(this, arguments); try { layout(); evCtrl(); requestAnimationFrame(fitPick); } catch (e) { } return r; };
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); [0, 400, 900].forEach(t => setTimeout(() => { try { layout(); evCtrl(); fitPick(); } catch (e) { } }, t)); return r; };
    const side = document.querySelector('#lobby .l2-side'); if (side) new MutationObserver(() => { if (MQ.matches) layout(); }).observe(side, { childList: true });
    const ev = $('lbEvent'); if (ev) new MutationObserver(evCtrl).observe(ev, { attributes: true, attributeFilter: ['data-pool'] });
  });
})();
