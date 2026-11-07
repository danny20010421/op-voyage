/* v173 自動取景（使用者 11/07 22:41「尺寸 5 會超出畫面就調整鏡頭距離……雙方角色都必須在戰鬥系統畫面上對峙」）：
   battle.js 的 updateCamera 只依「立繪倍率」估算鏡頭（最多拉遠到 0.5），超大立繪（洛基第二型態 5、伊姆第三型態 5.5）在電腦或平板上會超出畫面上緣。
   這裡在原本的鏡頭之後再量一次「實際看得見的立繪範圍」（用圖片的不透明區域，不算透明留白），
   超出「上方資訊列下緣～下方技能欄上緣、畫面左右邊」就再把鏡頭拉遠，最多到 0.16；拉遠後雙方站位的拉開量（--spread）上限 1，避免被推出畫面。
   雙方重疊太多（巨龍蓋住對手）時，用 --fitX 把雙方往左右外側推開：立繪面向對方，外側（尾巴、翅膀）最多 45% 可以出畫面，臉留在畫面內；推不開才再拉遠。
   只在原本就需要拉遠（有人特別大）時才啟動，一般大小的對戰完全不受影響。視窗大小改變、手機轉向時重新取景。 */
(function () {
  if (typeof updateCamera !== 'function') return;
  const $ = id => document.getElementById(id);
  const BOX = {}; /* 圖片不透明區域（比例），依 src 快取 */
  function alphaBox(img) {
    const k = img.src; if (!k) return null;
    if (!img.complete || !img.naturalWidth) { if (!img.__camWait) { img.__camWait = 1; img.addEventListener('load', () => { img.__camWait = 0; try { updateCamera(); } catch (e) { } }, { once: true }); } return null; }
    if (BOX[k]) return BOX[k];
    try { const W = 96, H = Math.max(8, Math.round(96 * img.naturalHeight / img.naturalWidth)), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) if (d[(y * W + i) * 4 + 3] > 40) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      BOX[k] = x1 < 0 ? [0, 0, 1, 1] : [x0 / W, y0 / H, (x1 + 1) / W, (y1 + 1) / H]; } catch (e) { BOX[k] = [0, 0, 1, 1]; }
    return BOX[k];
  }
  function content(side) {
    const im = $('bImg' + side), F = $('bF' + side); if (!im || !F || F.style.display === 'none') return null;
    const b = alphaBox(im); if (!b) return { wait: 1 }; const r = im.getBoundingClientRect(); if (!r.width) return null;
    const mx = parseFloat(getComputedStyle(F).getPropertyValue('--mx')) || 1, flip = side === 'L' ? mx < 0 : mx > 0, bx0 = flip ? 1 - b[2] : b[0], bx1 = flip ? 1 - b[0] : b[2];
    return { l: r.left + r.width * bx0, r: r.left + r.width * bx1, t: r.top + r.height * b[1], b: r.top + r.height * b[3] };
  }
  const _uc = updateCamera;
  let busy = false;
  /* 換圖後瀏覽器要等下一個微任務才換成新圖的尺寸，所以取景排到下一幀再做（同一幀多次呼叫只做一次） */
  let raf = 0;
  updateCamera = function () {
    _uc.apply(this, arguments);
    if (typeof battle === 'undefined' || !battle) return;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; fit(); });
  };
  function fit() {
    if (busy || typeof battle === 'undefined' || !battle) return;
    const A = $('bArena'); if (!A) return;
    const cam0 = parseFloat(A.style.getPropertyValue('--cam')) || 1;
    ['L', 'R'].forEach(s => { const F = $('bF' + s); if (F) F.style.removeProperty('--fitX'); });
    if (cam0 >= 1) return;
    busy = true;
    try {
      const scr = ($('battleScreen') || document.body).getBoundingClientRect(), top = $('battleScreen') && $('battleScreen').querySelector('.b-top'), sk = $('bSkills'), panel = sk ? (sk.closest('.b-cmd') || sk).getBoundingClientRect() : null;
      const T = top ? top.getBoundingClientRect().bottom - 6 : scr.top, Bt = panel ? panel.top + 12 : scr.bottom, Lx = scr.left + 4, Rx = scr.right - 4;
      const old = { tr: A.style.transition, v: ['--cam', '--camY', '--spread'].map(k => A.style.getPropertyValue(k)) };
      const els = [A, $('bFL'), $('bFR'), $('bImgL'), $('bImgR')].filter(Boolean), tr0 = els.map(e => e.style.transition);
      els.forEach(e => { e.style.transition = 'none'; });
      const apply = c => { const oy = parseFloat((A.style.transformOrigin || '').split(' ')[1]) || A.offsetHeight, vis = panel ? panel.top - (scr.top + A.offsetTop) : A.offsetHeight;
        A.style.setProperty('--cam', c.toFixed(3)); A.style.setProperty('--camY', Math.max(0, Math.min(vis - oy, (1 - c) * 90)).toFixed(0) + 'px'); A.style.setProperty('--spread', Math.min(1, (1 - c) / .5).toFixed(3)); void A.offsetWidth; };
      /* 在鏡頭 c 下計算：上下是否放得下；左右用 --fitX 把雙方往外側推開（立繪面向對方，外側的尾巴／翅膀可以出畫面，最多 45%），推不開才再拉遠 */
      const plan = c => { apply(c); const L = content('L'), R = content('R'); if (!L || !R || L.wait || R.wait) return null;
        const t = Math.min(L.t, R.t), vn = t < T ? 1 + (T - t) / Math.max(1, Math.max(L.b, R.b) - t) : 1;
        const wL = L.r - L.l, wR = R.r - R.l; let sL = 0, sR = 0;
        /* 外側可出畫面的比例：比較大的一方 45%（尾巴、翅膀），比較小的一方 0（整個人都要看得到） */
        const oL = wL >= wR ? .45 : 0, oR = wR > wL ? .45 : 0, gap = .12 * Math.min(wL, wR);
        const ov = L.r - R.l - gap; if (ov > 0) { sL = -ov * wL / (wL + wR); sR = ov * wR / (wL + wR); }
        const fixR = () => { const lim = Rx + oR * wR; if (R.r + sR > lim) { const e = R.r + sR - lim; sR -= e; sL -= e; } };
        const fixL = () => { const lim = Lx - oL * wL; if (L.l + sL < lim) { const e = lim - (L.l + sL); sL += e; sR += e; } };
        fixR(); fixL(); fixR(); if (L.l + sL < Lx - oL * wL) sL = (Lx - oL * wL) - L.l;
        const ov2 = (L.r + sL) - (R.l + sR) - .2 * Math.min(wL, wR), hn = ov2 > 0 ? 1 + ov2 / Math.min(wL + wR, Rx - Lx) : 1;
        return { need: Math.max(vn, hn), sL, sR }; };
      let c = cam0, P = null;
      for (let it = 0; it < 10; it++) { P = plan(c); if (window.__camDebug) console.log('cam it', c.toFixed(3), JSON.stringify(P), JSON.stringify(content('L')), JSON.stringify(content('R'))); if (!P || P.need <= 1.001 || c <= .16) break; c = Math.max(.16, c / Math.min(P.need * 1.02, 1.5)); }
      if (P && c <= .16) P = plan(c);
      const fx = P ? { L: P.sL / c, R: P.sR / c } : {};
      /* 還原成舊值再開啟動畫，最後設成新值，讓鏡頭平順移動 */
      A.style.setProperty('--cam', old.v[0]); A.style.setProperty('--camY', old.v[1]); A.style.setProperty('--spread', old.v[2]); void A.offsetWidth;
      els.forEach((e, i) => { e.style.transition = tr0[i]; });
      apply(c); ['L', 'R'].forEach(s => { const F = $('bF' + s); if (F && Math.abs(fx[s] || 0) >= 1) F.style.setProperty('--fitX', fx[s].toFixed(0) + 'px'); });
      if (window.__camDebug) console.log('cam', cam0, '→', c, fx);
    } catch (e) { console.warn('自動取景', e); }
    busy = false;
  }
  let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { try { if (typeof battle !== 'undefined' && battle && !battle.gameOver) updateCamera(); } catch (e) { } }, 200); });
})();
