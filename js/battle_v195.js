/* v195 戰鬥：傷害數字與結算畫面（使用者 11/10 12:07
   「釋放技能打擊到對方身上，除了會出現技能名，還必須出現傷害數值；（結算）類似圖1請參考並調整，並移除原本的兩個結算視窗」）。
   鏡頭與站位的部分在 js/cam_v173.js（v195）。
   ① 傷害數字：原本的數字畫在戰場（#bArena）裡的 #bDmg——
      ‧ 在所有特效畫布「下面」，命中的白光、爆炸一蓋就看不到（實測凱多奧義打中索隆，-1225 幾乎看不見）；
      ‧ 跟著鏡頭一起縮小，對上大型角色（鏡頭拉遠到 0.2 倍）時數字只剩幾個像素。
      改成放在戰鬥畫面最上層的 #bDmgTop（特效畫布之上、上方資訊列與技能欄之下），大小固定不隨鏡頭縮放，位置用 cam_v173.js 的 __camBox（角色實際範圍）計算。
      連續命中時每個數字往上錯開，不會疊在同一點。補血、MISS、狀態文字也一起移到這一層。
   ② 結算畫面：原本勝利、戰敗各是一張置中的卡片視窗（頭像＋文字＋按鈕）。改成全螢幕：左邊是這場出戰的船員直條立繪（等級、經驗條，升級會標示），
      右邊是菱形徽章「勝利／戰敗／撤退」與獎勵說明；只有一個動作時「點擊任意位置繼續」，有「再挑戰一次」等第二個選項時才顯示按鈕。
      保留原本的元素 id（bResult、bResTitle、bResDesc、bRetry、bBack、bResImg），battle.js、hint_v134.js 等不用改。
   載入順序：battle.js、cam_v173.js、faces_v178.js 之後。 */
(function () {
  const $ = id => document.getElementById(id);
  const H = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SP = () => window.BSPEED || 1;

  /* ---------- ① 傷害數字 ---------- */
  if (typeof floatText === 'function') {
    let layer = null; const recent = { L: [], R: [], C: [] };
    const ensure = () => { if (layer && layer.isConnected) return layer; const scr = $('battleScreen'); if (!scr) return null; layer = document.createElement('div'); layer.id = 'bDmgTop'; layer.className = 'b-dmgtop'; layer.setAttribute('aria-hidden', 'true'); scr.appendChild(layer); return layer; };
    const _ft = floatText;
    floatText = function (side, text, kind) {
      try {
        const L = ensure(), scr = $('battleScreen'); if (!L || !scr) return _ft.apply(this, arguments);
        const top = scr.querySelector('.b-top'), sk = $('bSkills'), panel = sk ? (sk.closest('.b-cmd') || sk) : null, sr = scr.getBoundingClientRect();
        const T = (top ? top.getBoundingClientRect().bottom - sr.top : 0) + 28, B = (panel ? panel.getBoundingClientRect().top - sr.top : scr.clientHeight) - 36, W = scr.clientWidth;
        const bx = side && window.__camBox ? __camBox(side) : null; let x, y;
        if (bx) { x = bx.cx; y = bx.t + bx.h * .34; } else if (side && typeof fighterPoint === 'function') { const A = $('bArena').getBoundingClientRect(), p = fighterPoint(side), k = A.width / ($('bArena').offsetWidth || 1); x = A.left - sr.left + p.x * k; y = A.top - sr.top + (p.y - 40) * k; } else { x = W / 2; y = T + (B - T) * .35; }
        /* 連續命中：0.9 秒內同一方的第 n 個數字往上、左右錯開 */
        /* 數字往上疊、狀態文字（麻痺、MISS…）放在數字下方往下疊，兩種不會蓋在一起 */
        const now = performance.now(), isNum = /hit|heal/.test(kind || ''), key = (side || 'C') + (isNum ? '' : 't'), R = recent[key] = (recent[key] || []).filter(t => now - t < 900 / SP()), n = R.length; R.push(now);
        if (isNum) { x += (n % 2 ? 1 : -1) * Math.min(3, Math.ceil(n / 2)) * 26 + (Math.random() * 16 - 8); y -= (n % 5) * 38; }
        else { y += 46 + (n % 4) * 30; }
        x = Math.max(56, Math.min(W - 56, x)); y = Math.max(T, Math.min(B, y));
        const el = document.createElement('div'); el.className = 'dmg2 ' + (kind || ''); el.textContent = text; el.style.left = x.toFixed(0) + 'px'; el.style.top = y.toFixed(0) + 'px';
        const dur = (/big/.test(kind || '') ? 1500 : 1250) / Math.max(.5, Math.min(2, SP())); el.style.animationDuration = dur + 'ms';
        L.appendChild(el); setTimeout(() => el.remove(), dur + 80);
      } catch (e) { return _ft.apply(this, arguments); }
    };
    try { window.floatText = floatText; } catch (e) { }
  }

  /* ---------- ② 結算畫面 ---------- */
  const EN = { win: 'VICTORY', lose: 'DEFEAT', fled: 'RETREAT' };
  function build() {
    const res = $('bResult'); if (!res || res.dataset.v195) return; res.dataset.v195 = '1';
    const title = $('bResTitle'), desc = $('bResDesc'), acts = res.querySelector('.res-actions'), img = $('bResImg'); if (!title || !desc || !acts) return;
    const team = document.createElement('div'); team.className = 'rs-team'; team.id = 'bResTeam';
    const side = document.createElement('div'); side.className = 'rs-side';
    const emb = document.createElement('div'); emb.className = 'rs-emblem'; emb.innerHTML = '<i class="d3"></i><i class="d2"></i><i class="d1"></i>'; emb.appendChild(title);
    desc.classList.add('rs-desc'); const tap = document.createElement('p'); tap.className = 'rs-tap'; tap.id = 'bResTap';
    side.append(emb, desc, acts, tap);
    const old = res.querySelector('.res-card'); res.append(team, side); if (img) { img.hidden = true; res.appendChild(img.closest('.res-art') || img); } if (old) old.remove();
    /* 點擊任意位置繼續：只有一個動作時才啟用；剛出現的 0.7 秒內不接受（避免連點技能時誤觸） */
    res.addEventListener('click', e => { if (!res.classList.contains('show') || !res.classList.contains('rs-one')) return; if (e.target.closest('button,a')) return; if (performance.now() - (res.__shown || 0) < 700) return; const b = $('bBack'); if (b) b.click(); });
    new MutationObserver(() => { const on = res.classList.contains('show'); if (on && !res.__on) { res.__on = true; res.__shown = performance.now(); try { fill(); } catch (e) { console.warn('結算畫面', e); } } else if (!on) res.__on = false; }).observe(res, { attributes: true, attributeFilter: ['class'] });
  }
  /* 開戰時記下出戰船員的等級與經驗，結算時比對（經驗條從原本的位置長到新的位置、升級標示） */
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments);
    try { const b = typeof battle !== 'undefined' && battle; if (b && !b.__expSnap) { const R = (SAVE.data && SAVE.data.roster) || {}; b.__expSnap = {}; (b.team || []).forEach(f => { const o = R[f.id]; if (o) b.__expSnap[f.id] = { lv: o.lv, exp: o.exp || 0 }; }); } } catch (e) { } return r; }; try { window.startBattle = startBattle; } catch (e) { } }
  const ratio = (lv, exp) => (typeof MAX_LV !== 'undefined' && lv >= MAX_LV) ? 1 : Math.max(0, Math.min(1, (exp || 0) / Math.max(1, typeof expNeed === 'function' ? expNeed(lv) : 100)));
  function focus(im) { try { const F = window.CHAR_FACE || {}, u = new URL(im.currentSrc || im.src, location.href), f = F[decodeURIComponent(u.pathname).replace(/^.*?(assets\/)/, '$1')];
      const bw = im.clientWidth, bh = im.clientHeight; if (!f || !bw || !bh || !im.naturalWidth) return;
      const s = Math.max(bw / im.naturalWidth, bh / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s, cl = v => Math.min(1, Math.max(0, v));
      const px = iw > bw + 1 ? cl((bw / 2 - f[0] * iw) / (bw - iw)) : .5, py = ih > bh + 1 ? cl((bh * .3 - f[1] * ih) / (bh - ih)) : .5;
      im.style.objectPosition = `${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%`; } catch (e) { } }
  addEventListener('resize', () => { const t = $('bResTeam'); if (t && $('bResult').classList.contains('show')) t.querySelectorAll('img').forEach(focus); });
  function fill() {
    const res = $('bResult'), b = typeof battle !== 'undefined' && battle; if (!res || !b) return;
    const kind = res.classList.contains('win') ? 'win' : res.classList.contains('lose') ? 'lose' : 'fled';
    /* 徽章文字：兩個字（勝利、戰敗、撤退）時把英文直排夾在中間，其他長度的標題英文放下面 */
    const title = $('bResTitle'), txt = (title.textContent || '').trim(), ch = [...txt];
    title.innerHTML = ch.length === 2 ? `<span>${H(ch[0])}</span><em class="rs-en v">${EN[kind]}</em><span>${H(ch[1])}</span>` : `<span class="rs-long">${H(txt)}</span><em class="rs-en">${EN[kind]}</em>`;
    title.classList.toggle('long', ch.length > 2); title.style.setProperty('--n', Math.max(2, ch.length));
    /* 出戰船員直條 */
    const team = $('bResTeam'), R = (SAVE.data && SAVE.data.roster) || {}, snap = b.__expSnap || {}, list = (b.team && b.team.length ? b.team : [b.player]).filter(Boolean).slice(0, 6);
    team.style.setProperty('--n', list.length); team.dataset.n = list.length;
    team.innerHTML = list.map((f, i) => { const o = R[f.id], s0 = snap[f.id], lv = o ? o.lv : f.lv, up = o && s0 ? o.lv - s0.lv : 0, r1 = o ? ratio(o.lv, o.exp) : 0, r0 = o && s0 ? (up > 0 ? 0 : ratio(s0.lv, s0.exp)) : r1;
      return `<div class="rs-strip${f.hp <= 0 ? ' ko' : ''}" style="--i:${i}"><img src="${H(f.image)}" alt="" decoding="async">${up > 0 ? `<b class="rs-up">LV UP</b>` : ''}<div class="rs-info"><small>${H(f.name || '')}</small><b>Lv.${lv}</b></div>${o ? `<i class="rs-exp"><u style="--r0:${r0.toFixed(3)};--r1:${r1.toFixed(3)}"></u></i>` : '<i class="rs-exp none"></i>'}</div>`; }).join('');
    /* 直條是又窄又高的框：圖片以高度填滿，左右裁切；依臉部資料（faces_data_v178.js）把臉放在框的水平中央。
       faces_v178.js 對小框會放大到只剩臉，這裡自己算（data-fp-keep 讓它不處理），保留整個身體的直條構圖 */
    team.querySelectorAll('img').forEach(im => { im.dataset.fpKeep = '1'; const go = () => focus(im); if (im.complete && im.naturalWidth) go(); else im.addEventListener('load', go, { once: true }); });
    /* 只有一個動作：隱藏按鈕、整個畫面可點；有第二個選項（再挑戰一次、其他路線）時顯示兩個按鈕 */
    const retry = $('bRetry'), back = $('bBack'), one = !retry || retry.style.display === 'none'; res.classList.toggle('rs-one', one);
    const lab = (back && back.textContent || '').trim(), tap = $('bResTap'); if (tap) tap.textContent = one ? (lab && !/^(回到島上|返回|繼續)$/.test(lab) ? `點擊任意位置・${lab}` : '點擊任意位置繼續') : '';
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', () => setTimeout(build, 0)); else build();
})();
