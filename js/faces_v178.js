/* v178 立繪依臉部對焦：畫面上用「裁切」方式（object-fit: cover）顯示的角色立繪——抽獎結果卡、獲得儀式、船員卡、造型卡、名片等——
   原本都用固定的裁切位置（例如上方 10%），立繪構圖不同時會只裁到衣服、頭被切掉。這裡依 CHAR_FACE 的臉部位置計算裁切位置，
   讓臉落在框的水平中央、垂直約 38% 的位置（頭上留一點空間）；框比立繪大或資料沒有的就不動。
   ‧ 監看新加入的圖片（MutationObserver），圖片載入、視窗大小改變時重新計算；手動指定過 object-position 的（data-fp-keep）不動。 */
(function () {
  const F = () => window.CHAR_FACE || {};
  const key = src => { try { const u = new URL(src, location.href); return decodeURIComponent(u.pathname).replace(/^.*?(assets\/)/, '$1'); } catch (e) { return ''; } };
  const tracked = new Set();
  function fit(img) {
    if (!img.isConnected) { tracked.delete(img); return; }
    if (img.dataset.fpKeep != null) return;
    const f = F()[key(img.currentSrc || img.src)]; if (!f || !img.naturalWidth) return;
    const cs = getComputedStyle(img); if (cs.objectFit !== 'cover') return;
    const bw = img.clientWidth, bh = img.clientHeight; if (!bw || !bh) return;
    const s = Math.max(bw / img.naturalWidth, bh / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    const px = iw > bw + 1 ? Math.min(1, Math.max(0, (bw / 2 - f[0] * iw) / (bw - iw))) : .5;
    const py = ih > bh + 1 ? Math.min(1, Math.max(0, (bh * .38 - f[1] * ih) / (bh - ih))) : .5;
    img.style.objectPosition = `${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%`;
    const fx = f[0] * iw + (bw - iw) * px, fy = f[1] * ih + (bh - ih) * py; /* 臉在框裡的位置（px） */
    const own = img.dataset.fpZoom != null;
    if (cs.transform && cs.transform !== 'none' && !own) { img.style.transformOrigin = `${fx.toFixed(0)}px ${fy.toFixed(0)}px`; return; } /* 樣式本身有放大（例如獲得儀式）：放大中心對準臉 */
    /* 小框（卡片、頭像框）：以臉為中心放大，臉約占框寬一半（中框約 1/3），最多 3.2 倍；只在外框會裁掉超出部分時才放大 */
    const par = img.parentElement, ov = par ? getComputedStyle(par).overflow : 'visible';
    const want = bw < 170 ? .5 : bw < 340 ? .34 : 0, k = want && /hidden|clip/.test(ov) ? Math.min(3.2, Math.max(1, want * bw / Math.max(1, f[2] * iw))) : 1;
    /* 放大後把臉移到框的水平中央、垂直 38%，但圖片仍要填滿整個框（位移限制在 [框×(1-k), 0]） */
    if (k > 1.02) { const dx = Math.min(0, Math.max(bw * (1 - k), bw / 2 - k * fx)), dy = Math.min(0, Math.max(bh * (1 - k), bh * .38 - k * fy));
      img.dataset.fpZoom = ''; img.style.transformOrigin = '0 0'; img.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${k.toFixed(2)})`; }
    else if (own) { img.style.transform = ''; delete img.dataset.fpZoom; }
  }
  function watch(img) { if (tracked.has(img)) { fit(img); return; } tracked.add(img); if (img.complete) requestAnimationFrame(() => fit(img)); img.addEventListener('load', () => fit(img)); }
  const seen = new WeakSet();
  function observe(root) { if (seen.has(root)) return; seen.add(root);
    new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(n => n.nodeType === 1 && scan(n)); if (m.type === 'attributes' && m.target.tagName === 'IMG') watch(m.target); }))
      .observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] }); }
  function scan(root) { if (!root || !root.querySelectorAll) return; if (root.tagName === 'IMG') watch(root);
    root.querySelectorAll('img').forEach(i => { if (/assets\/chars\//.test(i.getAttribute('src') || '')) watch(i); });
    /* 抽獎特效（gacha_v144）放在 shadow DOM 裡：一併監看 */
    if (root.shadowRoot) { observe(root.shadowRoot); scan(root.shadowRoot); } root.querySelectorAll('.gfx-host').forEach(h => { if (h.shadowRoot) { observe(h.shadowRoot); scan(h.shadowRoot); } }); }
  window.addEventListener('DOMContentLoaded', () => {
    scan(document.body); observe(document.body);
    let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => tracked.forEach(fit), 200); });
    /* 剛打開的視窗（display 由 none 變成顯示）時尺寸才確定：每次點擊後補算一次 */
    document.addEventListener('click', () => setTimeout(() => tracked.forEach(fit), 120), true);
  });
  /* 戰鬥結算的勝利／敗北立繪：原本是整個人縮成 120×140 的小圖，改成「臉是主角」的框（外框裁切＋臉部對焦） */
  window.addEventListener('DOMContentLoaded', () => { const im = document.getElementById('bResImg'); if (!im || im.parentElement.classList.contains('res-art')) return;
    const w = document.createElement('span'); w.className = 'res-art'; im.parentElement.insertBefore(w, im); w.appendChild(im); });
  window.FACE178 = { fit, refit: () => tracked.forEach(fit) };
})();
