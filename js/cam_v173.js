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
  /* v195（使用者 11/10 12:07「角色的站位跟鏡頭變化必須在最佳觀賞視角，尤其是會晉升、改變立繪的角色」）取景改成「用版面座標直接算」：
     以前是把鏡頭套上去之後再量畫面上的實際位置（getBoundingClientRect）。量的當下如果角色正在突進、受擊、鏡頭正在推近，量到的是動畫中途的位置——
     例如凱多奧義衝到對手身上的那一刻換成龍人型態，程式以為雙方重疊，就把鏡頭一路拉到最遠（0.16）而且不會回來，兩個角色變成畫面中間兩個小點。
     現在只用版面尺寸（offsetLeft／offsetWidth，不受 transform 與動畫影響）和 --sc、--mx、--vx／--vy 算出立繪的不透明範圍，鏡頭與站位都用算的，不再套用、測量、還原。 */
  const scrEl = () => $('battleScreen');
  function off(el, root) { let x = 0, y = 0, e = el; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return e === root ? { x, y } : null; }
  function pct(v, base) { v = String(v || '').trim(); if (!v) return 0; return v.endsWith('%') ? parseFloat(v) / 100 * base : parseFloat(v) || 0; }
  function faceOf(im) { try { const F = window.CHAR_FACE; if (!F) return null; const u = new URL(im.src, location.href); return F[decodeURIComponent(u.pathname).replace(/^.*?(assets\/)/, '$1')] || null; } catch (e) { return null; } }
  /* 立繪在戰場座標（鏡頭 1 倍、沒有左右位移）裡的不透明範圍：l、r、t、b；w、h；另外回傳「外側最多可以出畫面多少」（不能裁到臉） */
  function box(side) {
    const F = $('bF' + side), im = $('bImg' + side); if (!F || !im || F.style.display === 'none') return null;
    const bb = alphaBox(im); if (!bb) return { wait: 1 }; const iw = im.offsetWidth, ih = im.offsetHeight; if (!iw || !ih) return null;
    const cs = getComputedStyle(F), sc = parseFloat(cs.getPropertyValue('--sc')) || 1, mx = parseFloat(cs.getPropertyValue('--mx')) || 1, flip = side === 'L' ? mx < 0 : mx > 0;
    const vx = pct(cs.getPropertyValue('--vx'), iw), vy = pct(cs.getPropertyValue('--vy'), ih);
    const cx = F.offsetLeft + im.offsetLeft + iw / 2 + vx, by = F.offsetTop + im.offsetTop + ih + vy, W = iw * sc, H = ih * sc, x0 = cx - W / 2;
    const bx0 = flip ? 1 - bb[2] : bb[0], bx1 = flip ? 1 - bb[0] : bb[2];
    const o = { l: x0 + W * bx0, r: x0 + W * bx1, t: by - H * (1 - bb[1]), b: by - H * (1 - bb[3]) }; o.w = o.r - o.l; o.h = o.b - o.t; o.cx = (o.l + o.r) / 2;
    /* 外側可以出畫面的量（鏡頭 1 倍的像素）：最多自身寬度的 18%（翅膀尖、尾巴、火焰邊緣），而且不能裁到臉（臉部資料在 faces_data_v178.js）。
       v173 允許到 45%，直式手機上大型立繪常被切掉快一半；改成寧可鏡頭再拉遠一點，讓整個角色都看得到。 */
    const f = faceOf(im); let cut = .18 * o.w;
    if (f) { const fx = flip ? 1 - f[0] : f[0], fw = (f[2] || .2) * 1.3, fl = x0 + W * (fx - fw / 2), fr = x0 + W * (fx + fw / 2); cut = Math.max(0, Math.min(cut, side === 'L' ? fl - o.l : o.r - fr)); }
    o.cut = cut; return o;
  }
  const _uc = updateCamera;
  /* 換圖後瀏覽器要等下一個微任務才換成新圖的尺寸，所以取景排到下一幀再做（同一幀多次呼叫只做一次） */
  let raf = 0;
  updateCamera = function () {
    /* v195：battle.js 的估算值不再直接套用（只取它算好的地面位置 transformOrigin）。先還原成目前的鏡頭，再由 fit() 算出正確值，
       鏡頭動畫才不會先往估算值走一小段再折回來。每場戰鬥的第一次（上一場的值不能沿用）才先用估算值。 */
    const A = $('bArena'), keep = A && typeof battle !== 'undefined' && battle && battle.__camInit ? ['--cam', '--camY', '--spread'].map(k => A.style.getPropertyValue(k)) : null;
    _uc.apply(this, arguments);
    if (typeof battle === 'undefined' || !battle) return;
    if (keep) ['--cam', '--camY', '--spread'].forEach((k, i) => A.style.setProperty(k, keep[i])); else { battle.__camInit = true; setTx('L', 0); setTx('R', 0); }
    try { xl(); } catch (e) { } /* v176：換成超大立繪的同一刻就標記 .xl（不等下一幀），變身動畫才不會先建出超大圖層 */
    try { fit(); } catch (e) { console.warn('自動取景', e); }
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; try { fit(); } catch (e) { console.warn('自動取景', e); } });
  };
  /* v173b：iPhone 在放大很多倍的立繪上套用發光濾鏡（drop-shadow、亮度閃爍）會用掉大量記憶體導致閃退（伊姆晉升第三型態 5.5 倍時發生），
     立繪放大超過 2.4 倍的一方加上 .xl，不套用任何濾鏡（css/cam_v173.css）。 */
  function xl() { ['L', 'R'].forEach(s => { const F = $('bF' + s); if (!F) return; const sc = parseFloat(getComputedStyle(F).getPropertyValue('--sc')) || 1; F.classList.toggle('xl', sc > 2.4); }); }
  /* 角色目前的左右位移（戰場座標的像素）。特效座標（battle.js fighterPoint）要加上它，特效才會打在移動後的角色身上 */
  const TX = { L: 0, R: 0 };
  window.__camTx = side => TX[side] || 0;
  function setTx(side, v) { const F = $('bF' + side); if (!F) return; TX[side] = Math.abs(v) < .5 ? 0 : v;
    if (TX[side]) { F.style.setProperty('--fitX', TX[side].toFixed(1) + 'px'); F.style.translate = TX[side].toFixed(1) + 'px 0px'; } else { F.style.removeProperty('--fitX'); F.style.translate = ''; } }
  window.__camTr = () => { }; /* v184 的介面保留（已不需要） */
  if (typeof fighterPoint === 'function' && !fighterPoint.__cam) { const _fp = fighterPoint; fighterPoint = function (side) { const p = _fp.apply(this, arguments); try { if (p && TX[side]) p.x += TX[side]; } catch (e) { } return p; }; fighterPoint.__cam = true; try { window.fighterPoint = fighterPoint; } catch (e) { } }
  /* 角色（不透明範圍）在戰鬥畫面上的位置（相對於 #battleScreen 左上角的像素），用「目標鏡頭」計算，鏡頭動畫途中也穩定。
     傷害數字（js/battle_v195.js）用它決定要跳在哪裡。 */
  window.__camBox = side => { try { const A = $('bArena'), scr = scrEl(), o = box(side); if (!A || !scr || !o || o.wait) return null;
      const a = off(A, scr) || { x: A.offsetLeft, y: A.offsetTop }, c = parseFloat(A.style.getPropertyValue('--cam')) || 1, cy = parseFloat(A.style.getPropertyValue('--camY')) || 0;
      const ox = A.offsetWidth / 2, oy = parseFloat((A.style.transformOrigin || '').split(' ')[1]) || A.offsetHeight, t = TX[side] || 0;
      const X = x => a.x + ox + (x + t - ox) * c, Y = y => a.y + oy + (y - oy) * c + cy;
      return { l: X(o.l), r: X(o.r), t: Y(o.t), b: Y(o.b), cx: X(o.cx), w: o.w * c, h: o.h * c }; } catch (e) { return null; } };
  /* 取景：
     ① 鏡頭＝「雙方都放得下」的最大倍率（最多 1 倍，最遠 0.16）：上緣不超過上方資訊列；左右放不下才拉遠。
        以前先用立繪倍率估一個鏡頭（1.08 ÷ 倍率^0.85）再往下修，變身後常常拉得比需要的遠（凱多變龍人後反而比人形小）。
     ② 站位：比較小的一方留在原本的站位（畫面 1/4、3/4 處，不再被縮到畫面中間貼著對手）；比較大的一方盡量也留在原位，
        外側超出畫面超過自身寬度 10% 才往內收；雙方距離不夠時先把小的往外側讓、再讓大的外側出畫面（不裁到臉），都不夠才拉遠鏡頭。 */
  function fit() {
    xl();
    if (typeof battle === 'undefined' || !battle) return;
    const A = $('bArena'), scr = scrEl(); if (!A || !scr || !A.offsetWidth) return;
    const L = box('L'), R = box('R'); if (!L || !R || L.wait || R.wait) return; /* 圖片還沒載入：保留目前的鏡頭，載入後 alphaBox 會再呼叫一次 */
    const a = off(A, scr) || { x: A.offsetLeft, y: A.offsetTop }, sr = scr.getBoundingClientRect();
    const top = scr.querySelector('.b-top'), sk = $('bSkills'), panel = sk ? (sk.closest('.b-cmd') || sk) : null;
    const T = (top ? top.getBoundingClientRect().bottom - sr.top : 0) + 2, Bt = panel ? panel.getBoundingClientRect().top - sr.top : scr.clientHeight, SW = scr.clientWidth, m = 6;
    const ox = A.offsetWidth / 2, oy = parseFloat((A.style.transformOrigin || '').split(' ')[1]) || A.offsetHeight, vis = Bt - a.y;
    const topY = Math.min(L.t, R.t), feet = Math.max(L.b, R.b);
    /* 鏡頭上下位置：拉遠時整個戰場往下移一點（原本的規則）；另外，腳不能低於下方技能欄的上緣——
       平板橫式（1024×768）技能欄比較高，以前雙方的下半身被技能欄擋住約 90px，這裡把戰場往上抬到腳剛好站在技能欄上方。 */
    const camY = c => Math.min(Math.max(0, Math.min(vis - oy, (1 - c) * 90)), (Bt - 4) - (a.y + oy + (feet - oy) * c));
    const sy = (y, c) => a.y + oy + (y - oy) * c + camY(c);
    /* 上下：頭頂不超過上方資訊列 */
    const vOK = c => sy(topY, c) >= T - .5;
    /* 左右：回傳雙方中心的畫面座標；need > 0 表示這個鏡頭下放不下 */
    const bigL = L.w >= R.w, G = bigL ? L : R, S = bigL ? R : L, gOut = bigL ? -1 : 1; /* gOut：大的一方的外側方向（左 -1、右 +1） */
    const homeG = a.x + G.cx, homeS = a.x + S.cx;
    const place = c => { const wg = G.w * c, ws = S.w * c, gmin = Math.max(.15 * ws, .03 * SW); let pG = homeG, pS = homeS;
      const outG = () => gOut < 0 ? m - (pG - wg / 2) : (pG + wg / 2) - (SW - m);            /* 大的一方外側超出畫面的量（正＝超出） */
      const outS = () => gOut < 0 ? (pS + ws / 2) - (SW - m) : m - (pS - ws / 2);            /* 小的一方外側（另一邊）超出的量 */
      const gap = () => gOut < 0 ? (pS - ws / 2) - (pG + wg / 2) : (pG - wg / 2) - (pS + ws / 2);
      const pref = Math.min(G.cut * c, .1 * wg); let o = outG(); if (o > pref) pG -= gOut * (o - pref);
      o = outS(); if (o > 0) pS += gOut * o;                                                  /* 小的一方整個留在畫面內 */
      let need = gmin - gap();
      if (need > 0) { const slack = Math.max(0, -outS()), d = Math.min(need, slack); pS -= gOut * d; need -= d; }
      if (need > 0) { const room = Math.max(0, G.cut * c - Math.max(0, outG())), d = Math.min(need, room); pG += gOut * d; need -= d; }
      return { pG, pS, need }; };
    const ok = c => vOK(c) && place(c).need <= .5;
    let c = 1;
    if (!ok(1)) { let lo = .16, hi = 1; if (!ok(lo)) c = lo; else { for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; } c = lo; } }
    c = Math.round(c * 1000) / 1000;
    const P = place(c), tx = (p, cxArena) => (p - a.x - ox) / c + ox - cxArena;
    A.style.setProperty('--cam', c.toFixed(3)); A.style.setProperty('--camY', camY(c).toFixed(0) + 'px'); A.style.setProperty('--spread', '0');
    setTx(bigL ? 'L' : 'R', tx(P.pG, G.cx)); setTx(bigL ? 'R' : 'L', tx(P.pS, S.cx));
    if (window.__camDebug) console.log('cam', c, JSON.stringify(P), JSON.stringify(L), JSON.stringify(R));
  }
  let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { try { if (typeof battle !== 'undefined' && battle && !battle.gameOver) updateCamera(); } catch (e) { } }, 200); });
})();
/* v176：超大立繪（.xl）不做位移、縮放、濾鏡動畫。moveFighter、受擊震動等用 Web Animations 移動整個角色，動畫期間瀏覽器會替角色（含放大後的立繪）
   建一張超大圖層，iPhone 會因此閃退（洛基第二型態 8 倍）。這裡把這類動畫換成同長度、只維持不透明度的空動畫（回傳值與完成時間不變）。 */
(function () {
  const _an = Element.prototype.animate; if (!_an) return;
  const big = el => { try { return !!(el.classList && el.classList.contains('xl')) || !!(el.tagName === 'IMG' && el.parentElement && el.parentElement.classList.contains('xl')); } catch (e) { return false; } };
  Element.prototype.animate = function (kf, opt) {
    if (big(this)) { let t = ''; try { t = JSON.stringify(kf); } catch (e) { }
      /* v177：只保留原本動畫裡的不透明度（沒有就用空動畫）；不再記下「當下」的不透明度（淡入中途記到 0 會一直透明，看起來像角色消失） */
      if (/transform|scale|translate|rotate|filter/.test(t)) { const keep = Array.isArray(kf) ? kf.map(k => { const o = {}; if (k && k.opacity != null) o.opacity = k.opacity; if (k && k.offset != null) o.offset = k.offset; return o; }) : [];
        return _an.call(this, keep.some(k => k.opacity != null) ? keep : [], opt); } }
    return _an.apply(this, arguments);
  };
})();
