/* v121 大廳：手機直式的船長對話框放在限定召喚橫條上方的空白處（位置用實際量測：左側圖示欄、右側欄、限定召喚橫條，不寫死座標）。
   依序嘗試：
   ① 置中：左右兩欄下方到限定召喚之間空間夠 → 水平置中（最寬 480px）
   ② 偏左：圖示欄左緣～右側欄左緣（一般字級，放不下再用縮小字級）
   ③ 收縮展開（v121b，使用者指定）：都放不下（例如 320px 寬的小手機）→ 先顯示一顆小膠囊（船長名字＋▲），
      點一下展開完整對話（蓋在限定召喚上方），再點一下收起；展開時會延長顯示時間。 */
(function () {
  const $ = id => document.getElementById(id);
  const PHONE = matchMedia('(max-width:900px) and (orientation:portrait)');
  const GAP = 16, OPEN_MS = 6000;
  let openT = 0, userClose = false;
  const CLS = ['say-dock', 'say-compact', 'say-over', 'say-fold', 'say-open', 'say-center'];
  function place() {
    const say = $('l2Say'), lb = $('lobby'); if (!say || !lb) return;
    const off = () => lb.classList.remove(...CLS);
    if (!PHONE.matches || !say.classList.contains('show')) return off();
    const r0 = lb.getBoundingClientRect(), rail = lb.querySelector('.l2-rail'), side = lb.querySelector('.l2-side'), ev = $('lbEvent');
    const vis = x => x && x.getClientRects().length > 0;
    if (!vis(rail) || !vis(ev)) return off();
    const R = rail.getBoundingClientRect(), E = ev.getBoundingClientRect(), S = vis(side) ? side.getBoundingClientRect() : null;
    const sideL = S && S.left > R.right ? S.left : E.right + GAP, colsBottom = Math.max(R.bottom, S ? S.bottom : 0);
    const set = (l, w, cls) => { lb.classList.remove(...CLS); lb.classList.add('say-dock', ...cls); lb.style.setProperty('--sayL', Math.round(l - r0.left) + 'px'); lb.style.setProperty('--sayW', Math.round(w) + 'px'); };
    const fits = (gap, top) => { const h = say.offsetHeight, bottom = Math.round(E.top - r0.top - gap); if (bottom - h >= Math.round(top - r0.top + gap)) { lb.style.setProperty('--sayT', (bottom - h) + 'px'); return true; } return false; };
    const open = lb.classList.contains('say-open');
    if (!open) {
      /* ① 置中：兩欄下方空間夠 */
      { const w = Math.min(480, E.width); set(E.left + (E.width - w) / 2, w, ['say-center']); if (fits(GAP, colsBottom)) return; }
      /* ② 偏左（一般 → 縮小字級） */
      for (const [gap, cls] of [[GAP, []], [8, ['say-compact']]]) { const w = Math.min(480, sideL - gap - R.left); if (w < 160) continue; set(R.left, w, cls); if (fits(gap, R.bottom)) return; }
    }
    /* ③ 收縮展開 */
    if (open) { const w = Math.min(480, E.width); set(E.left + (E.width - w) / 2, w, ['say-compact', 'say-over', 'say-fold', 'say-open']); fits(8, r0.top); return; }
    const between = sideL - 4 - (R.right + 4);
    if (between >= 96) { set(R.right + 4, between, ['say-fold']); if (fits(8, Math.max(R.top, S ? S.top : R.top))) return; }
    { const w = Math.min(240, E.width); set(E.left + (E.width - w) / 2, w, ['say-fold', 'say-over']); fits(8, r0.top); }
  }
  window.addEventListener('DOMContentLoaded', () => {
    const say = $('l2Say'), lb = $('lobby'); if (!say || !lb) return;
    /* 收縮狀態：點膠囊展開（不要被原本「點一下就關閉」吃掉）；展開狀態再點才收起 */
    say.addEventListener('click', e => {
      if (!lb.classList.contains('say-fold')) return;
      if (!lb.classList.contains('say-open')) { e.stopImmediatePropagation(); lb.classList.add('say-open'); place(); clearTimeout(openT); openT = setTimeout(() => { userClose = true; say.classList.remove('show'); }, OPEN_MS); }
      else { userClose = true; clearTimeout(openT); }
    }, true);
    new MutationObserver(() => {
      /* 展開中被原本 4 秒自動收起的計時器關掉 → 保持顯示，等展開的計時結束 */
      if (lb.classList.contains('say-open') && !say.classList.contains('show') && !userClose) { say.classList.add('show'); return; }
      if (!say.classList.contains('show')) { userClose = false; clearTimeout(openT); lb.classList.remove('say-open'); }
      requestAnimationFrame(place); clearTimeout(say._pt); say._pt = setTimeout(place, 160); /* 版面可能還在調整（syncLayout），稍後再量一次 */
    }).observe(say, { attributes: true, attributeFilter: ['class'], childList: true });
    addEventListener('resize', () => requestAnimationFrame(place));
    PHONE.addEventListener ? PHONE.addEventListener('change', place) : PHONE.addListener(place);
  });
  window.lobbyPlaceSay = place;
})();
