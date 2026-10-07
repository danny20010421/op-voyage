/* v118 音樂遊戲「歌姬劇場」：
   - 選曲：歌曲清單（左）、唱片與歌曲資訊（右）、三種難度（等級 1～12）、譜面速度、最佳成績。
   - 遊戲：開始前 10 秒倒數；四條音軌，音符落到判定線時點擊／長按／滑動；上方中央歌名與 COMBO、左側自己的血量、右側隨機敵人的血量。
     判定：PERFECT ±45ms、GREAT ±90ms、GOOD ±135ms；失誤或按錯扣血，血量歸 0 挑戰失敗。打中音符會對敵人造成傷害（判定越好、COMBO 越高傷害越高）。
   - 結算：評級 SSS／SS／S／A／B／C／D／E、分數、最佳時機（PERFECT）數、失誤數、最高 COMBO、敵人是否擊敗、獎勵。
   譜面在 js/rhythm_charts.js（tools/rhythm_beatmap.py 由音訊自動產生）。操作：觸控／滑鼠點擊音軌；鍵盤 D F J K。 */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DIFFS = [['easy', 'EASY', '#4fd38a'], ['normal', 'NORMAL', '#4fa8ff'], ['hard', 'HARD', '#ff4a7a']];
  const WIN = { p: 45, g: 90, o: 135 };                 /* 判定時間（毫秒） */
  const JW = { p: 1, g: .7, o: .4 };                    /* 判定權重 */
  const LANE_COL = ['#3ad8ff', '#b06bff', '#b06bff', '#3ad8ff'];
  const KEYS = { d: 0, f: 1, j: 2, k: 3 };
  const RANKS = [['SSS', .98], ['SS', .95], ['S', .9], ['A', .8], ['B', .7], ['C', .6], ['D', .5], ['E', 0]];
  const RANK_COL = { SSS: '#ffe066', SS: '#ffd04a', S: '#c58bff', A: '#4fd3ff', B: '#6fe0a0', C: '#cfd8e6', D: '#9aa6b8', E: '#7a8496' };
  const ENEMIES = ['kaido', 'bigmom', 'blackbeard', 'akainu', 'doflamingo', 'crocodile', 'katakuri', 'magellan', 'lucci', 'moria', 'enel', 'hody'];
  const songs = () => window.RHYTHM_SONGS || [];
  const st = () => { const d = SAVE.data; d.rhythm = d.rhythm || { best: {}, speed: 6 }; d.rhythm.best = d.rhythm.best || {}; return d.rhythm; };
  let wrap = null, view = 'select', songIx = 0, diff = 'normal', G = null, actx = null; const bufCache = {};

  /* ---------- 共用 ---------- */
  function el() { if (wrap) return wrap; wrap = document.createElement('div'); wrap.id = 'rhythm'; wrap.className = 'rg'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', '歌姬劇場'); document.body.appendChild(wrap); return wrap; }
  function stopBgm() { try { if (window.MUSIC && MUSIC.onScreen) MUSIC.onScreen('rhythmScreen'); } catch (e) { } try { AUDIO.stopSong && AUDIO.stopSong(); AUDIO.ambient && AUDIO.ambient(null); } catch (e) { } }
  function resumeBgm() { try { if (window.MUSIC && MUSIC.onScreen && typeof currentScreen !== 'undefined') MUSIC.onScreen(currentScreen); } catch (e) { } }
  function open() { if (typeof SAVE === 'undefined' || !SAVE.data) return; stopBgm(); view = 'select'; renderSelect(); el().classList.add('show'); document.body.classList.add('rg-open'); }
  function close() { endGame(true); if (wrap) wrap.classList.remove('show'); document.body.classList.remove('rg-open'); resumeBgm(); if (typeof openModes === 'function' && typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen') { try { renderLobby && renderLobby(); } catch (e) { } } }
  window.openRhythm = open;
  const fmtT = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const keyOf = (id, d) => id + ':' + d;
  const rankOf = acc => (RANKS.find(([, v]) => acc >= v) || RANKS[RANKS.length - 1])[0];

  /* ---------- 選曲 ---------- */
  function renderSelect() {
    const L = songs(), S = L[songIx]; if (!S) { el().innerHTML = '<div class="rg-empty">還沒有歌曲</div>'; return; }
    const R = st(), best = R.best[keyOf(S.id, diff)], D = S.diffs[diff];
    el().innerHTML = `<div class="rg-sel">
      <header class="rg-sh"><button class="rg-back" data-a="close" aria-label="返回大廳"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>歌姬劇場</span></button>
        <div class="rg-speed"><span>譜面速度</span><button data-sp="-1" aria-label="變慢">−</button><output>${R.speed}</output><button data-sp="1" aria-label="變快">＋</button></div></header>
      <aside class="rg-list" aria-label="歌曲">${L.map((s, i) => { const b = DIFFS.map(([k]) => R.best[keyOf(s.id, k)]).filter(Boolean); const top = b.sort((a, c) => c.score - a.score)[0];
        return `<button class="rg-song ${i === songIx ? 'on' : ''}" data-song="${i}"><img src="${s.sq}" alt=""><span><b>${esc(s.title)}</b><small>${esc(s.artist)}</small><i>${DIFFS.map(([k, n, c]) => `<em style="--c:${c}">${s.diffs[k].lv}</em>`).join('')}</i></span><span class="rg-sr">${top ? `<b style="color:${RANK_COL[top.rank]}">${top.rank}</b>` : '<small>未挑戰</small>'}<small>${fmtT(s.dur)}</small></span></button>`; }).join('')}</aside>
      <section class="rg-info">
        <div class="rg-disc" aria-hidden="true"><div class="rg-vinyl"><img src="${S.sq}" alt=""><i></i></div><img class="rg-jk" src="${S.jacket}" alt=""></div>
        <div class="rg-meta"><small>${esc(S.from || '')}</small><h2>${esc(S.title)}</h2><p>${esc(S.artist)}</p>
          <dl class="rg-stat"><div><dt>BPM</dt><dd>${S.bpm}</dd></div><div><dt>長度</dt><dd>${fmtT(S.dur)}</dd></div><div><dt>音符</dt><dd>${D.notes.length}</dd></div></dl>
          <div class="rg-best"><span>最佳成績</span>${best ? `<b>${best.score.toLocaleString()}</b><em style="color:${RANK_COL[best.rank]}">${best.rank}</em>${best.fc ? '<i>FULL COMBO</i>' : ''}` : '<b class="none">尚未挑戰</b>'}</div>
          <div class="rg-diffs" role="radiogroup" aria-label="難度">${DIFFS.map(([k, n, c]) => `<button role="radio" aria-checked="${k === diff}" class="${k === diff ? 'on' : ''}" data-diff="${k}" style="--c:${c}"><b>${S.diffs[k].lv}</b><small>${n}</small></button>`).join('')}</div>
          <p class="rg-how">觸控：點擊音軌／長按／<b>滑動</b>（粉紅箭頭）・鍵盤：D F J K</p>
          <div class="rg-go"><button class="btn-gold" data-a="start">開始挑戰</button></div></div>
      </section></div>`;
    const W = el(); W.querySelectorAll('[data-song]').forEach(b => b.onclick = () => { songIx = +b.dataset.song; renderSelect(); });
    W.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { diff = b.dataset.diff; renderSelect(); });
    W.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { R.speed = Math.max(1, Math.min(10, R.speed + +b.dataset.sp)); SAVE.save(); renderSelect(); });
    W.querySelector('[data-a=close]').onclick = close; W.querySelector('[data-a=start]').onclick = () => startGame(S, diff);
  }

  /* ---------- 音訊 ---------- */
  async function loadBuf(src) {
    if (bufCache[src]) return bufCache[src];
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const r = await fetch(src); if (!r.ok) throw new Error('音樂載入失敗'); const ab = await r.arrayBuffer();
    const buf = await new Promise((ok, no) => { const p = actx.decodeAudioData(ab, ok, no); if (p && p.then) p.then(ok, no); });
    return (bufCache[src] = buf);
  }

  /* ---------- 遊戲 ---------- */
  async function startGame(S, dk) {
    endGame(true); view = 'play';
    const lead = (SAVE.data.lineup || [])[0] || 'luffy0', foe = ENEMIES.filter(id => CHARACTERS[id])[Math.floor(Math.random() * ENEMIES.filter(id => CHARACTERS[id]).length)] || 'kaido';
    const notes = S.diffs[dk].notes.map(([t, l, k, d], i) => ({ i, t, l, k, d, hit: 0, res: null, holding: false, done: false }));
    const N = notes.length, base = notes.length * 1.35;
    G = { S, dk, notes, N, lead, foe, hp: 100, ehp: base, emax: base, combo: 0, maxCombo: 0, score: 0, cnt: { p: 0, g: 0, o: 0, m: 0 }, t: -10000, started: false, paused: false, over: false,
      speed: st().speed, fx: [], judge: null, press: [0, 0, 0, 0], pts: new Map(), defeated: false, raf: 0, src: null, t0: 0, missPen: dk === 'hard' ? 7 : dk === 'normal' ? 6 : 4 };
    const W = el(); const C = CHARACTERS;
    const JK = new URL(S.jacket, location.href).href; W.innerHTML = `<div class="rg-play" style="--jk:url('${JK}')">
      <div class="rg-bg" aria-hidden="true"></div><canvas class="rg-cv"></canvas>
      <header class="rg-hud">
        <div class="rg-me"><img src="${typeof charArt === 'function' ? charArt(lead, 'avatar') : C[lead].avatar}" alt=""><div><small>LIFE</small><div class="rg-bar me"><i id="rgHp"></i></div></div></div>
        <div class="rg-mid"><b>${esc(S.title)}</b><small>${esc(S.artist)}・${DIFFS.find(x => x[0] === dk)[1]} ${S.diffs[dk].lv}</small><div class="rg-score" id="rgScore">0</div></div>
        <div class="rg-foe"><div><small>${esc(C[foe].name)}</small><div class="rg-bar foe"><i id="rgEhp"></i></div></div><img src="${C[foe].avatar}" alt=""></div>
        <button class="rg-pause" aria-label="暫停"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button>
      </header>
      <div class="rg-combo" id="rgCombo" aria-live="polite"></div>
      <div class="rg-count" id="rgCount" aria-live="assertive"></div>
      <div class="rg-load" id="rgLoad">載入音樂中…</div>
    </div>`;
    const cv = W.querySelector('.rg-cv'); G.cv = cv; G.cx = cv.getContext('2d'); fit();
    W.querySelector('.rg-pause').onclick = () => pause(true);
    bindInput(cv);
    try { G.buf = await loadBuf(S.src); } catch (e) { const l = $('rgLoad'); if (l) l.textContent = '音樂載入失敗，請檢查網路後再試一次'; return; }
    if (!G || G.over) return; const l = $('rgLoad'); if (l) l.remove();
    G.cdStart = performance.now(); loop();
  }
  function fit() { if (!G) return; const cv = G.cv, r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); G.dpr = dpr; G.W = r.width; G.H = r.height;
    const land = r.width > r.height; G.lw = Math.min(land ? Math.min(560, r.width * .5) : 560, r.width * .96); G.lx = (r.width - G.lw) / 2; G.jy = r.height * (land ? .86 : .84); G.top = land ? 64 : 104; }
  addEventListener('resize', () => setTimeout(fit, 60));
  const laneX = l => G.lx + G.lw * (l + .5) / 4, laneOf = x => { const k = Math.floor((x - G.lx) / (G.lw / 4)); return k >= 0 && k < 4 ? k : -1; };
  const travel = () => 2600 - G.speed * 210; /* 音符從上方落到判定線的時間（毫秒） */
  function songTime() { if (!G.started) return G.t; return (actx.currentTime - G.t0) * 1000 - 30; }
  function beginAudio(at) { const s = actx.createBufferSource(); s.buffer = G.buf; s.connect(actx.destination); G.t0 = actx.currentTime + .06 - at / 1000; s.start(actx.currentTime + .06, Math.max(0, at / 1000)); G.src = s; G.started = true; s.onended = () => { if (G && !G.paused && !G.over) finish(false); }; }
  function loop() {
    if (!G || G.over) return; G.raf = requestAnimationFrame(loop);
    if (G.paused) return draw();
    if (!G.started) { const left = 10 - (performance.now() - G.cdStart) / 1000, c = $('rgCount'); if (c) { const n = Math.ceil(left); c.textContent = left > 0 ? (n <= 3 ? n : n) : ''; c.className = 'rg-count' + (left > 0 && n <= 3 ? ' big' : ''); if (left > 0 && left < 9.5) c.dataset.tip = ''; }
      G.t = -Math.max(0, left) * 1000 * .14; /* 倒數時音符停在上方，最後一刻開始落下 */
      if (left <= 0) { if (actx.state === 'suspended') actx.resume(); beginAudio(0); if (c) c.textContent = ''; } }
    else G.t = songTime();
    /* 判定：沒打到的音符過線視為失誤；長按中鬆開過早 */
    for (const n of G.notes) { if (n.done) continue;
      if (!n.hit && G.t - n.t > WIN.o) { n.done = true; miss(n); continue; }
      if (n.k === 1 && n.hit && n.holding && G.t >= n.t + n.d - 60) { n.done = true; n.holding = false; tailOk(n); }
      if (n.k === 1 && n.hit && !n.holding && !n.done) { n.done = true; }
      if (n.k !== 1 && n.hit) n.done = true; }
    draw();
  }
  function draw() {
    const { cx, dpr, W, H, lx, lw, jy } = G; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    const top = G.top, tr = travel(), y = t => jy - (t - G.t) / tr * (jy - top);
    /* 音軌 */
    cx.save(); const g = cx.createLinearGradient(0, top, 0, H); g.addColorStop(0, 'rgba(10,14,40,0)'); g.addColorStop(.25, 'rgba(10,14,40,.55)'); g.addColorStop(1, 'rgba(10,14,40,.8)'); cx.fillStyle = g; cx.fillRect(lx, top, lw, H - top);
    for (let l = 0; l <= 4; l++) { const x = lx + lw * l / 4; cx.strokeStyle = l === 0 || l === 4 ? 'rgba(160,200,255,.55)' : 'rgba(160,200,255,.18)'; cx.lineWidth = l === 0 || l === 4 ? 2 : 1; cx.beginPath(); cx.moveTo(x, top); cx.lineTo(x, H); cx.stroke(); }
    for (let l = 0; l < 4; l++) if (G.press[l] > 0) { const a = Math.min(1, G.press[l]); const lg = cx.createLinearGradient(0, jy, 0, top + (jy - top) * .3); lg.addColorStop(0, hexA(LANE_COL[l], .38 * a)); lg.addColorStop(1, hexA(LANE_COL[l], 0)); cx.fillStyle = lg; cx.fillRect(lx + lw * l / 4, top, lw / 4, jy - top); G.press[l] = Math.max(0, G.press[l] - .06); }
    /* 判定線 */
    cx.shadowColor = '#7fdcff'; cx.shadowBlur = 14; cx.strokeStyle = '#dff6ff'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(lx, jy); cx.lineTo(lx + lw, jy); cx.stroke(); cx.shadowBlur = 0;
    for (let l = 0; l < 4; l++) { cx.strokeStyle = hexA(LANE_COL[l], .8); cx.lineWidth = 2; cx.beginPath(); cx.ellipse(laneX(l), jy, lw / 8 - 10, 10, 0, 0, Math.PI * 2); cx.stroke(); }
    cx.restore();
    /* 音符 */
    const nw = lw / 4 - 12;
    for (const n of G.notes) {
      if (n.done && !(n.k === 1 && n.holding)) continue; const yy = y(n.t); if (yy < top - 40) break; if (yy > H + 40 && n.k !== 1) continue;
      const x = laneX(n.l), c = n.k === 2 ? '#ff4ad2' : n.k === 1 ? '#b06bff' : LANE_COL[n.l];
      if (n.k === 1) { const y2 = Math.max(top, y(n.t + n.d)), y1 = n.hit ? jy : yy; cx.fillStyle = hexA(c, n.hit ? .55 : .35); cx.strokeStyle = hexA(c, .9); cx.lineWidth = 2; roundRect(cx, x - nw * .32, y2, nw * .64, Math.max(4, y1 - y2), 8); cx.fill(); cx.stroke(); if (!n.hit) chevron(cx, x, yy, nw, c); }
      else if (n.k === 2) flick(cx, x, yy, nw, c);
      else chevron(cx, x, yy, nw, c);
    }
    /* 效果 */
    G.fx = G.fx.filter(f => (f.a -= .04) > 0);
    for (const f of G.fx) { cx.globalAlpha = f.a; cx.strokeStyle = f.c; cx.lineWidth = 3; cx.beginPath(); cx.arc(f.x, jy, (1 - f.a) * 26 + 10, 0, Math.PI * 2); cx.stroke();
      for (let k = 0; k < 6; k++) { const an = k / 6 * Math.PI * 2 + f.r, rr = (1 - f.a) * 40; cx.fillStyle = f.c; cx.fillRect(f.x + Math.cos(an) * rr - 2, jy + Math.sin(an) * rr * .5 - 2, 4, 4); } }
    cx.globalAlpha = 1;
    if (G.judge && (G.judge.a -= .025) > 0) { const J = G.judge; cx.globalAlpha = Math.min(1, J.a * 1.5); cx.font = `italic 900 ${Math.round(Math.min(40, lw / 10))}px Anton, Impact, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.lineWidth = 6; cx.lineJoin = 'round'; cx.strokeStyle = 'rgba(0,0,0,.7)'; cx.strokeText(J.txt, W / 2, jy - (jy - top) * .32 - (1 - J.a) * 10); cx.fillStyle = J.c; cx.fillText(J.txt, W / 2, jy - (jy - top) * .32 - (1 - J.a) * 10); cx.globalAlpha = 1; }
  }
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* 點擊音符：霓虹向下箭頭（參考箭頭素材） */
  function chevron(c, x, y, w, col) { c.save(); c.shadowColor = col; c.shadowBlur = 16; c.strokeStyle = col; c.lineWidth = 6; c.lineJoin = 'round'; c.lineCap = 'round';
    const hw = w * .36; c.beginPath(); c.moveTo(x - hw, y - 12); c.lineTo(x, y + 6); c.lineTo(x + hw, y - 12); c.stroke(); c.shadowBlur = 0; c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - hw, y - 12); c.lineTo(x, y + 6); c.lineTo(x + hw, y - 12); c.stroke();
    c.fillStyle = hexA(col, .25); roundRect(c, x - w / 2, y - 16, w, 28, 10); c.fill(); c.restore(); }
  /* 滑動音符：雙箭頭 */
  function flick(c, x, y, w, col) { c.save(); c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = hexA(col, .3); roundRect(c, x - w / 2, y - 18, w, 32, 12); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round'; for (const dx of [-10, 6]) { c.beginPath(); c.moveTo(x + dx - 8, y - 10); c.lineTo(x + dx + 4, y - 2); c.lineTo(x + dx - 8, y + 6); c.stroke(); } c.restore(); }
  /* ---------- 判定與結算 ---------- */
  function judgeOf(dt) { dt = Math.abs(dt); return dt <= WIN.p ? 'p' : dt <= WIN.g ? 'g' : dt <= WIN.o ? 'o' : null; }
  const JTXT = { p: ['PERFECT', '#ffe866'], g: ['GREAT', '#5ad8ff'], o: ['GOOD', '#8affb0'], m: ['MISS', '#ff6a7a'] };
  function award(n, j) {
    G.cnt[j]++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.score += 900000 / G.N * JW[j] + 100000 / G.N * Math.min(1, G.combo / 50);
    if (j === 'p') G.hp = Math.min(100, G.hp + .4);
    const dmg = JW[j] * (1 + Math.min(G.combo, 100) / 100); G.ehp = Math.max(0, G.ehp - dmg);
    if (!G.defeated && G.ehp <= 0) { G.defeated = true; banner(`擊敗了 ${CHARACTERS[G.foe].name}！`); }
    G.judge = { txt: JTXT[j][0], c: JTXT[j][1], a: 1 }; G.fx.push({ x: laneX(n.l), c: JTXT[j][1], a: 1, r: Math.random() * 6 });
    try { if (j === 'p' && typeof SFX !== 'undefined' && G.combo % 25 === 0) SFX.play('coin'); } catch (e) { }
    hud();
  }
  function miss(n, quiet) { G.cnt.m++; G.combo = 0; G.hp = Math.max(0, G.hp - G.missPen); if (!quiet) G.judge = { txt: 'MISS', c: JTXT.m[1], a: 1 }; hud(); if (G.hp <= 0) finish(true); }
  function tailOk(n) { G.score += 0; hud(); }
  function hud() { const h = $('rgHp'), e = $('rgEhp'), s = $('rgScore'), c = $('rgCombo'); if (h) { h.style.width = G.hp + '%'; h.classList.toggle('low', G.hp < 30); } if (e) e.style.width = (G.ehp / G.emax * 100) + '%';
    if (s) s.textContent = Math.round(G.score).toLocaleString(); if (c) { c.innerHTML = G.combo >= 3 ? `<b>${G.combo}</b><small>COMBO</small>` : ''; c.classList.remove('pop'); void c.offsetWidth; if (G.combo >= 3) c.classList.add('pop'); } }
  function banner(t) { const b = document.createElement('div'); b.className = 'rg-banner'; b.textContent = t; G.cv.parentElement.appendChild(b); setTimeout(() => b.remove(), 1800); }
  /* ---------- 輸入 ---------- */
  function hitLane(l, kind, pid) {
    if (!G || G.paused || G.over || !G.started) return; G.press[l] = 1;
    const cand = G.notes.find(n => !n.done && !n.hit && n.l === l && Math.abs(n.t - G.t) <= WIN.o + 20);
    if (!cand) { if (kind !== 'key-up') { G.hp = Math.max(0, G.hp - 1); hud(); if (G.hp <= 0) finish(true); } return; } /* 按錯：少量扣血，不中斷 COMBO */
    const j = judgeOf(cand.t - G.t) || 'o';
    if (cand.k === 2) { cand.pending = { j, pid, x0: null, t0: performance.now() }; return cand; } /* 等待滑動 */
    cand.hit = 1; if (cand.k === 1) { cand.holding = true; cand.pid = pid; } award(cand, j); return cand;
  }
  function bindInput(cv) {
    const P = G.pts;
    cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } const r = cv.getBoundingClientRect(), l = laneOf(e.clientX - r.left); if (l < 0) return;
      const n = hitLane(l, 'down', e.pointerId); P.set(e.pointerId, { l, x: e.clientX, y: e.clientY, n }); });
    cv.addEventListener('pointermove', e => { const p = P.get(e.pointerId); if (!p || !p.n || !p.n.pending) return; if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 26) { const n = p.n, j = n.pending.j; n.pending = null; n.hit = 1; award(n, j); p.n = null; } });
    const up = e => { const p = P.get(e.pointerId); P.delete(e.pointerId); if (!p || !G) return; const n = p.n; if (!n) return;
      if (n.pending) { n.pending = null; n.hit = 1; n.done = true; miss(n); return; } /* 滑動音符只點不滑：失誤 */
      if (n.k === 1 && n.holding && !n.done) { n.holding = false; if (G.t < n.t + n.d - 120) { n.done = true; miss(n); } else { n.done = true; } } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  const down = new Set();
  document.addEventListener('keydown', e => { if (!G || view !== 'play') return; if (e.key === 'Escape') { pause(!G.paused); return; } const l = KEYS[e.key.toLowerCase()]; if (l == null || e.repeat || down.has(l)) return; down.add(l);
    const n = hitLane(l, 'key', 'k' + l); if (n && n.pending) { n.pending = null; n.hit = 1; award(n, 'g'); } /* 鍵盤：滑動音符以按鍵代替（最高 GREAT） */ });
  document.addEventListener('keyup', e => { if (!G) return; const l = KEYS[e.key.toLowerCase()]; if (l == null) return; down.delete(l); const n = G.notes.find(x => x.k === 1 && x.holding && x.l === l); if (n) { n.holding = false; n.done = true; if (G.t < n.t + n.d - 120) miss(n); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && G.started && !G.over) pause(true); });
  /* ---------- 暫停 ---------- */
  function pause(on) {
    if (!G || G.over) return; G.paused = on;
    const W = el().querySelector('.rg-play'); let m = W && W.querySelector('.rg-pm');
    if (on) { if (!G.started) G.cdEl = performance.now() - G.cdStart; if (G.started && actx.state === 'running') actx.suspend(); if (!m && W) { m = document.createElement('div'); m.className = 'rg-pm'; m.innerHTML = `<div><h3>暫停</h3><button class="btn-gold" data-p="go">繼續</button><button class="btn-ghost" data-p="re">重新開始</button><button class="btn-ghost" data-p="out">離開</button></div>`; W.appendChild(m);
        m.querySelector('[data-p=go]').onclick = () => pause(false); m.querySelector('[data-p=re]').onclick = () => startGame(G.S, G.dk); m.querySelector('[data-p=out]').onclick = () => { endGame(true); view = 'select'; renderSelect(); }; } }
    else { if (m) m.remove(); if (G.started) actx.resume(); else G.cdStart = performance.now() - (G.cdEl || 0); }
  }
  function endGame(silent) { if (!G) return; G.over = true; cancelAnimationFrame(G.raf); try { if (G.src) { G.src.onended = null; G.src.stop(); } } catch (e) { } if (actx && actx.state === 'suspended') actx.resume(); if (silent) G = null; }
  /* ---------- 結算 ---------- */
  function finish(failed) {
    if (!G || G.over) return; const g = G; endGame(false);
    const { cnt, N } = g; for (const n of g.notes) if (!n.hit && !n.done) cnt.m++; /* 失敗時未出現的音符算失誤 */
    const acc = Math.min(1, (cnt.p + cnt.g * JW.g + cnt.o * JW.o) / N), rank = failed ? 'E' : rankOf(acc), score = Math.round(g.score), fc = !failed && cnt.m === 0;
    const R = st(), k = keyOf(g.S.id, g.dk), prev = R.best[k], isNew = !prev || score > prev.score;
    const first = !prev || !prev.cleared; const rw = { berry: failed ? 300 : { SSS: 12000, SS: 9000, S: 7000, A: 5000, B: 3500, C: 2500, D: 1500, E: 800 }[rank] * ({ easy: 1, normal: 1.5, hard: 2 }[g.dk]), tokens: !failed && first ? { easy: 3, normal: 5, hard: 10 }[g.dk] : 0 };
    if (isNew) R.best[k] = { score, rank, fc, acc: Math.round(acc * 1000) / 10, combo: g.maxCombo, cleared: !failed || (prev && prev.cleared) }; else if (!failed) prev.cleared = true;
    SAVE.save(); if (rw.berry && typeof addBerry === 'function') addBerry(Math.round(rw.berry)); if (rw.tokens) { SAVE.data.tokens += rw.tokens; SAVE.save(); if (typeof coins === 'function') coins(); }
    const S = g.S, D = DIFFS.find(x => x[0] === g.dk);
    el().innerHTML = `<div class="rg-res" style="--jk:url('${new URL(S.jacket, location.href).href}')"><div class="rg-bg" aria-hidden="true"></div>
      <section class="rg-rcard">
        <header><img src="${S.sq}" alt=""><div><small>${failed ? '挑戰失敗' : '挑戰完成'}</small><b>${esc(S.title)}</b><span><em style="--c:${D[2]}">${D[1]} ${S.diffs[g.dk].lv}</em>${esc(S.artist)}</span></div></header>
        <div class="rg-rank" style="--rc:${RANK_COL[rank]}"><b>${rank}</b>${fc ? '<i>FULL COMBO</i>' : ''}${isNew ? '<i class="new">NEW RECORD</i>' : ''}</div>
        <div class="rg-sc"><small>SCORE</small><b>${score.toLocaleString()}</b><span>準確率 ${(acc * 100).toFixed(1)}%</span></div>
        <dl class="rg-rows">
          <div><dt>最佳時機（PERFECT）</dt><dd style="color:#ffe866">${cnt.p}</dd></div><div><dt>GREAT</dt><dd style="color:#5ad8ff">${cnt.g}</dd></div>
          <div><dt>GOOD</dt><dd style="color:#8affb0">${cnt.o}</dd></div><div><dt>失誤數（MISS）</dt><dd style="color:#ff6a7a">${cnt.m}</dd></div>
          <div><dt>最高 COMBO</dt><dd>${g.maxCombo}</dd></div><div><dt>${esc(CHARACTERS[g.foe].name)}</dt><dd>${g.defeated ? '已擊敗' : `剩 ${Math.round(g.ehp / g.emax * 100)}%`}</dd></div>
        </dl>
        <div class="rg-rew"><span>獎勵</span><b><i class="berry-ico">B</i>${Math.round(rw.berry).toLocaleString()}</b>${rw.tokens ? `<b><i class="coin-ico"></i>×${rw.tokens}<small>首次通關</small></b>` : ''}</div>
        <div class="rg-ract"><button class="btn-ghost" data-r="sel">選曲</button><button class="btn-gold" data-r="again">再挑戰</button></div>
      </section></div>`;
    view = 'result'; const W = el(); W.querySelector('[data-r=sel]').onclick = () => { view = 'select'; renderSelect(); }; W.querySelector('[data-r=again]').onclick = () => startGame(S, g.dk);
    try { if (typeof SFX !== 'undefined') SFX.play(failed ? 'lose' : 'rare'); } catch (e) { }
  }
  window.RHYTHM = { open, close, _g: () => G, _finish: finish, _hit: (l) => hitLane(l, 'test', 'test') };

  /* ---------- 冒險選單：新增「歌姬劇場」卡片 ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#lbModes .mode-grid'); if (!grid || grid.querySelector('[data-mode=rhythm]')) return;
    const b = document.createElement('button'); b.className = 'mode-card m-rhythm'; b.dataset.mode = 'rhythm';
    b.innerHTML = '<span class="mc-art" aria-hidden="true"></span><span class="mc-body"><b>歌姬劇場</b><small>跟著節奏點擊、長按、滑動四條音軌，用歌聲擊敗對手</small><em id="mdRhythm">新模式</em></span>';
    b.addEventListener('click', () => { const s = $('lbModes'); if (s) { s.classList.remove('show'); s.setAttribute('aria-hidden', 'true'); } open(); });
    grid.appendChild(b);
    const R = () => { const e = $('mdRhythm'); if (!e || !SAVE.data) return; const best = Object.values((SAVE.data.rhythm || {}).best || {}); e.textContent = best.length ? `最佳 ${best.sort((a, c) => c.score - a.score)[0].rank}・${best.length} 個譜面` : '新模式'; };
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); try { R(); } catch (e) { } return r; };
  });
})();
