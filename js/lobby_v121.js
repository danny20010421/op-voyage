/* v121 大廳：手機直式的船長對話框移到「左下空白處」——左側圖示欄下方、限定召喚橫條上方，寬度到右側欄（出戰陣容）左緣為止（最寬 480px）。
   位置用實際量測（左側圖示欄底部、右側欄左緣、限定召喚橫條上緣），不寫死座標；小手機改用縮小版或放在兩欄之間的下方，都放不下才退回上方置中。 */
(function () {
  const $ = id => document.getElementById(id);
  const PHONE = matchMedia('(max-width:900px) and (orientation:portrait)');
  const GAP = 16;
  function place() {
    const say = $('l2Say'), lb = $('lobby'); if (!say || !lb) return;
    const off = () => { lb.classList.remove('say-dock', 'say-compact', 'say-over'); };
    if (!PHONE.matches || !say.classList.contains('show')) return off();
    const r0 = lb.getBoundingClientRect(), rail = lb.querySelector('.l2-rail'), side = lb.querySelector('.l2-side'), ev = $('lbEvent');
    const vis = x => x && x.getClientRects().length > 0;
    if (!vis(rail) || !vis(ev)) return off();
    const R = rail.getBoundingClientRect(), E = ev.getBoundingClientRect(), S = vis(side) ? side.getBoundingClientRect() : null;
    const sideL = S && S.left > R.right ? S.left : E.right + GAP;
    /* 依序嘗試：① 左下（圖示欄左緣～右側欄）、② 同位置縮小字級與間距、③ 左右兩欄之間的下方、④ 限定召喚正上方（暫時蓋住圖示欄底部）；都放不下才退回上方置中 */
    const tries = [
      { l: R.left, r: sideL - GAP, gap: GAP, top: R.bottom, compact: false },
      { l: R.left, r: sideL - 8, gap: 8, top: R.bottom, compact: true },
      { l: R.right + 8, r: sideL - 8, gap: 8, top: Math.max(R.top, S ? S.top : R.top), compact: true },
      { l: E.left, r: E.right, gap: 8, top: r0.top, compact: true, over: true } /* 極小螢幕：直接放在限定召喚上方（約 4 秒後自動收起） */
    ];
    for (const T of tries) {
      const w = Math.min(480, Math.round(T.r - T.l)); if (w < 120) continue;
      lb.style.setProperty('--sayL', Math.round(T.l - r0.left) + 'px'); lb.style.setProperty('--sayW', w + 'px');
      lb.classList.add('say-dock'); lb.classList.toggle('say-compact', T.compact); lb.classList.toggle('say-over', !!T.over);
      const h = say.offsetHeight, bottom = Math.round(E.top - r0.top - T.gap), topMin = Math.round(T.top - r0.top + T.gap);
      if (bottom - h >= topMin) { lb.style.setProperty('--sayT', (bottom - h) + 'px'); return; }
    }
    off();
  }
  window.addEventListener('DOMContentLoaded', () => {
    const say = $('l2Say'); if (!say) return;
    new MutationObserver(() => { requestAnimationFrame(place); clearTimeout(say._pt); say._pt = setTimeout(place, 160); }).observe(say, { attributes: true, attributeFilter: ['class'], childList: true }); /* 版面可能還在調整（syncLayout），稍後再量一次 */
    addEventListener('resize', () => requestAnimationFrame(place));
    PHONE.addEventListener ? PHONE.addEventListener('change', place) : PHONE.addListener(place);
  });
  window.lobbyPlaceSay = place;
})();
