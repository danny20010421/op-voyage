/* v113 立繪放大檢視：
   - 電腦：在「我的船員」立繪上雙擊 → 開啟檢視器；滾輪縮放（以游標為中心）、拖曳移動、雙擊切換放大／還原、Esc 或 × 關閉。
   - 手機／平板：在立繪上用兩指拉開 → 開啟檢視器並繼續縮放；單指拖曳移動、點兩下切換放大／還原、點 × 關閉。
   也套用在「角色培養」視窗的立繪。 */
(function () {
  const TARGETS = '#cxPane_crew .sb-stage > img, .gw-art img';
  let V = null, img = null, s = 1, tx = 0, ty = 0;
  const P = new Map(); let pinch = null, drag = null, lastTap = 0, multi = false;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function apply() { s = clamp(s, 1, 6); if (s === 1) { tx = 0; ty = 0; } const r = img.getBoundingClientRect(), mx = (r.width / s) * (s - 1) / 2 + 40, my = (r.height / s) * (s - 1) / 2 + 40; tx = clamp(tx, -mx, mx); ty = clamp(ty, -my, my);
    img.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; V.classList.toggle('zoomed', s > 1.01); }
  function zoomAt(cx, cy, ns) { const r = V.getBoundingClientRect(), ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2), k = ns / s; tx = ox - (ox - tx) * k; ty = oy - (oy - ty) * k; s = ns; apply(); }
  function build() { if (V) return V; V = document.createElement('div'); V.className = 'zv'; V.setAttribute('role', 'dialog'); V.setAttribute('aria-modal', 'true'); V.setAttribute('aria-label', '立繪檢視');
    V.innerHTML = '<img alt=""><button class="zv-x" aria-label="關閉">×</button><p class="zv-tip"></p>'; document.body.appendChild(V); img = V.querySelector('img');
    V.querySelector('.zv-x').onclick = close;
    V.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
    V.addEventListener('dblclick', e => { if (e.target.closest('.zv-x')) return; s > 1.01 ? (s = 1, apply()) : zoomAt(e.clientX, e.clientY, 2.5); });
    V.addEventListener('pointerdown', e => { if (e.target.closest('.zv-x')) return; try { V.setPointerCapture(e.pointerId); } catch (x) { } P.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (P.size >= 2) multi = true; start(); });
    V.addEventListener('pointermove', e => { if (!P.has(e.pointerId)) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY }); move(); });
    /* 點兩下：只算「單指、沒有移動」的點擊；兩指縮放放開時不會被誤判 */
    const up = e => { if (!P.has(e.pointerId)) return; const single = !multi && drag && !drag.moved; P.delete(e.pointerId);
      if (P.size === 0) { if (e.pointerType !== 'mouse' && single) { if (Date.now() - lastTap < 300) { s > 1.01 ? (s = 1, apply()) : zoomAt(e.clientX, e.clientY, 2.5); lastTap = 0; } else lastTap = Date.now(); } else lastTap = 0; multi = false; }
      pinch = null; drag = null; start(); if (P.size === 1 && drag) drag.moved = true; };
    V.addEventListener('pointerup', up); V.addEventListener('pointercancel', up);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && V.classList.contains('show')) close(); });
    return V; }
  function start() { const p = [...P.values()]; if (p.length >= 2) { const [a, b] = p; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s, tx, ty, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; drag = null; }
    else if (p.length === 1) { drag = { x: p[0].x, y: p[0].y, tx, ty, moved: false }; pinch = null; } }
  function move() { const p = [...P.values()];
    if (pinch && p.length >= 2) { const [a, b] = p, d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; const ns = clamp(pinch.s * d / pinch.d, 1, 6), r = V.getBoundingClientRect(), ox = pinch.mx - (r.left + r.width / 2), oy = pinch.my - (r.top + r.height / 2), k = ns / pinch.s;
      s = ns; tx = ox - (ox - pinch.tx) * k + (mx - pinch.mx); ty = oy - (oy - pinch.ty) * k + (my - pinch.my); apply(); }
    else if (drag && p.length === 1) { const dx = p[0].x - drag.x, dy = p[0].y - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; if (s > 1.01) { tx = drag.tx + dx; ty = drag.ty + dy; apply(); } } }
  function open(src, alt, initScale) { build(); img.src = src; img.alt = alt || ''; s = initScale || 1; tx = ty = 0; P.clear(); pinch = drag = null;
    const touch = matchMedia('(hover:none),(pointer:coarse)').matches; V.querySelector('.zv-tip').textContent = touch ? '兩指拉動縮放・單指拖曳・點兩下切換大小' : '滾輪縮放・拖曳移動・雙擊切換大小・Esc 關閉';
    V.classList.add('show'); document.body.classList.add('zv-open'); requestAnimationFrame(apply); }
  function close() { if (!V) return; V.classList.remove('show', 'zoomed'); document.body.classList.remove('zv-open'); P.clear(); }
  window.openArtViewer = open;
  /* 電腦：雙擊立繪 */
  document.addEventListener('dblclick', e => { const t = e.target.closest && e.target.closest(TARGETS); if (!t) return; e.preventDefault(); open(t.currentSrc || t.src, t.alt, 1.6); });
  /* 手機：兩指在立繪上拉開 → 開啟檢視器（之後在檢視器內繼續縮放） */
  let tStart = null;
  document.addEventListener('touchstart', e => { const t = e.target.closest && e.target.closest(TARGETS); if (!t) { tStart = null; return; } if (e.touches.length === 2) { const [a, b] = e.touches; tStart = { t, d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) }; } }, { passive: true });
  document.addEventListener('touchmove', e => { if (!tStart || e.touches.length !== 2) return; const [a, b] = e.touches, d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (d > tStart.d * 1.08) { const t = tStart.t, k = d / tStart.d; tStart = null; open(t.currentSrc || t.src, t.alt, clamp(k, 1.2, 2)); } }, { passive: true });
  /* 立繪上的小提示 */
  function hint() { const st = document.querySelector('#cxPane_crew .sb-stage'); if (!st || st.querySelector('.zv-hint')) return; const h = document.createElement('span'); h.className = 'zv-hint'; h.setAttribute('role', 'button'); h.tabIndex = 0; h.setAttribute('aria-label', '放大檢視立繪'); h.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/></svg><span>放大</span>';
    const go = e => { e.preventDefault(); e.stopPropagation(); const im = st.querySelector(':scope > img'); if (im) open(im.currentSrc || im.src, im.alt, 1); };
    h.addEventListener('click', go); h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); }); st.appendChild(h); }
  /* v117 手機：在立繪上點兩下也能開啟（原本只有兩指拉開） */
  let tapT = 0, tapEl = null;
  document.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') return; const t = e.target.closest && e.target.closest(TARGETS); if (!t) { tapT = 0; return; } const now = Date.now(); if (tapEl === t && now - tapT < 320) { tapT = 0; open(t.currentSrc || t.src, t.alt, 1.6); } else { tapT = now; tapEl = t; } });
  window.addEventListener('DOMContentLoaded', () => { const P2 = document.getElementById('cxPane_crew'); if (P2) new MutationObserver(hint).observe(P2, { childList: true }); });
})();
