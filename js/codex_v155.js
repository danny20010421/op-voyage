/* v155 角色圖鑑：寬版立繪（寬高比 > 1，例如基德的電磁炮、白鬍子、金恩）整張縮放會太小、留白太多，
   改成放大填滿卡片、以臉部為準（使用者 11/04「像基德這種……就放大以人物面部能看清楚為準」）。
   一般直式立繪照 v155 原則：整張顯示、頭部優先（css/v155.css）。水平位置用角色的 cardFocus（沒有就置中）。 */
(function () {
  const FACE = { kid: .2, whitebeard: .55, king: .55, brook: .4, lordcoast: .45, seaking: .45, vergo: .38, blackbeard_w: .45, kuma_eh: .6, kaido: .45, magellan: .45 };
  const fit = img => { const w = img.naturalWidth, h = img.naturalHeight; if (!w || !h) return; const card = img.closest('.char[data-id]'), c = card && typeof CHARACTERS !== 'undefined' && CHARACTERS[card.dataset.id];
    const wide = w / h > 1; img.classList.toggle('cx-wide', wide);
    if (wide) { /* 臉在立繪裡的水平位置（0～1，逐張看過）；換算成 object-position，讓臉落在卡片中間 */
      const id = card ? card.dataset.id : '', f = FACE[id] != null ? FACE[id] : .5, v = Math.min(1, .75 / (w / h)), p = v >= 1 ? 50 : Math.max(0, Math.min(100, (f - v / 2) / (1 - v) * 100));
      img.style.setProperty('--cxf', p.toFixed(1) + '% 0%'); img.style.setProperty('--cxo', ((f - (p / 100) * (1 - v)) / v * 100).toFixed(1) + '% 24%'); } };
  const scan = root => root.querySelectorAll('.char.v2:not(.res) .c-art img').forEach(img => { if (img.complete) fit(img); else img.addEventListener('load', () => fit(img), { once: true }); });
  const boot = () => { const g = document.getElementById('cxCodexGrid'); if (!g) return setTimeout(boot, 500); scan(g); new MutationObserver(() => scan(g)).observe(g, { childList: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
