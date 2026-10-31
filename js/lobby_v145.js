/* v145 大廳版面整理（手機／平板直式）
   1. 手機左側圖示欄改成單欄：常用 5 個 + 「更多」；點「更多」展開第二欄（公告、成就、寶藏日誌、VIP、備份…），隱藏項目有紅點時「更多」也顯示紅點。
   2. 直式畫面在限定召喚上方加「主線航路」橫條（點擊＝原本的主線航路卡）與船長名牌（含更換船長）。
   位置用實際量到的限定召喚卡頂端排列（--v5pk），不寫死裝置高度。 */
(function () {
  const $ = id => document.getElementById(id);
  const CORE = ['lbRet', 'lbBounty', 'lbWeekly', 'lbPass', 'lbAfk', 'lbLogin'];
  const PHONE = matchMedia('(max-width:760px) and (orientation:portrait)');
  const PORT = matchMedia('(max-width:900px) and (orientation:portrait)');
  const MORE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><circle cx="16.75" cy="16.75" r="3.25"/></svg>';

  function rail() {
    const r = document.querySelector('#lobby .l2-rail'); if (!r) return;
    let more = $('l2More');
    if (!more) {
      more = document.createElement('button'); more.id = 'l2More'; more.className = 'l2-ic l2-more'; more.setAttribute('aria-expanded', 'false');
      more.innerHTML = `<i class="l2-svg" aria-hidden="true">${MORE_SVG}</i><b>更多</b>`;
      more.onclick = e => { e.stopPropagation(); const o = !r.classList.contains('v5-open'); r.classList.toggle('v5-open', o); more.setAttribute('aria-expanded', o); more.querySelector('b').textContent = o ? '收合' : '更多'; };
      document.addEventListener('click', e => { if (r.classList.contains('v5-open') && !r.contains(e.target)) more.click(); });
    }
    const btns = [...r.querySelectorAll(':scope > .l2-ic')].filter(b => b !== more);
    const core = CORE.map(id => $(id)).filter(b => b && btns.includes(b) && !b.hidden).slice(0, 5);
    btns.forEach(b => b.classList.toggle('v5-x', !core.includes(b)));
    core.forEach((b, i) => b.style.setProperty('--v5o', i));
    if (more.parentNode !== r || r.lastElementChild !== more) r.appendChild(more);
    dot();
  }
  function dot() {
    const more = $('l2More'); if (!more) return;
    const any = [...document.querySelectorAll('#lobby .l2-rail > .v5-x')].some(b => !b.hidden && (b.classList.contains('has-dot') || b.id === 'l2BackupIc'));
    more.classList.toggle('has-dot', any);
  }

  function strip() {
    const lob = $('lobby'), mis = $('l2Mission'); if (!lob || !mis) return;
    let s = $('v5Strip');
    if (!s) { s = document.createElement('button'); s.id = 'v5Strip'; s.className = 'v5-strip'; s.innerHTML = '<span class="v5-st-h">主線航路</span><b></b><small></small><em aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg></em>'; s.onclick = () => mis.click(); lob.appendChild(s); }
    const t = $('l2MissionT'), u = $('l2MissionS');
    s.querySelector('b').textContent = t ? t.textContent : ''; s.querySelector('small').textContent = u ? u.textContent : '';
    s.setAttribute('aria-label', '主線航路：' + s.textContent);
  }
  function place() {
    const lob = $('lobby'), pk = $('lbEvent'); if (!lob || !pk) return;
    if (!PORT.matches) { lob.classList.remove('v5-port'); return; }
    lob.classList.add('v5-port');
    const r0 = lob.getBoundingClientRect(), a = pk.getBoundingClientRect(); if (!a.height) return;
    lob.style.setProperty('--v5pk', Math.round(r0.bottom - a.top) + 'px');
  }
  function all() { try { rail(); strip(); place(); } catch (e) { } }
  window.lobbyV145 = all;

  window.addEventListener('DOMContentLoaded', () => {
    const rl = window.renderLobby; if (rl) window.renderLobby = function () { const r = rl.apply(this, arguments); all(); requestAnimationFrame(place); return r; };
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); [0, 450, 950].forEach(t => setTimeout(all, t)); return r; };
    addEventListener('resize', () => requestAnimationFrame(place));
    [PHONE, PORT].forEach(m => m.addEventListener && m.addEventListener('change', all));
    const r = document.querySelector('#lobby .l2-rail');
    if (r) new MutationObserver(ms => { if (ms.some(m => m.type === 'childList' || m.attributeName === 'hidden')) rail(); else dot(); }).observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  });
})();
