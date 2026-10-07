/* 音樂遊戲「歌姬劇場」（v118 建立，v120 改版）：
   - 選曲：MV 封面當背景；歌曲清單、歌曲資訊、三種難度（等級 1～12）、譜面速度、打擊音開關、最佳成績。
     選曲時自動試聽開頭 20 秒前奏（循環，可關閉）；開始遊戲或離開時停止。
   - 進入歌姬劇場時大廳背景音樂完全停止（MUSIC.hold），不會兩首音樂重疊；離開後恢復。
   - 遊戲：開始前 10 秒倒數；四條音軌置中，左側出戰陣容隊長立繪、右側 BOSS 立繪；上方中央歌名與分數，音軌中央大字 COMBO。
     判定：PERFECT ±45ms、GREAT ±90ms、GOOD ±135ms；失誤或按錯扣血，血量歸 0 挑戰失敗。打中音符會對 BOSS 造成傷害（判定越好、COMBO 越高傷害越高）。
     打擊感：音軌光柱、粒子爆發、擴散光環、判定字放大彈出、畫面震動、BOSS 受擊閃白與傷害數字、隊長出拳、每 50 COMBO 金色閃光、打擊音效。
   - 結算：評級 SSS／SS／S／A／B／C／D／E、分數、最佳時機（PERFECT）數、失誤數、最高 COMBO、BOSS 是否擊敗、獎勵。
   譜面在 js/rhythm_charts.js（tools/rhythm_beatmap.py 由音訊產生節奏、tools/rhythm_lanes.py 分配軌道）。操作：觸控／滑鼠點擊音軌；鍵盤 D F J K。 */
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
  const PV_LEN = 20;                                    /* 試聽長度（秒） */
  const songs = () => window.RHYTHM_SONGS || [];
  const st = () => { const d = SAVE.data; d.rhythm = d.rhythm || { best: {}, speed: 6 }; const r = d.rhythm; r.best = r.best || {}; if (r.pv == null) r.pv = true; if (r.hs == null) r.hs = true; return r; };
  const pref = () => { try { return (typeof AUDIO !== 'undefined' && AUDIO.pref) || {}; } catch (e) { return {}; } };
  const musicVol = () => { const p = pref(); return p.muted ? 0 : Math.min(1, (p.music ?? .55) * 1.5); };
  const sfxVol = () => { const p = pref(); return p.muted ? 0 : (p.sfx ?? .8); };
  const art = (id, kind) => typeof charArt === 'function' ? charArt(id, kind) : CHARACTERS[id][kind === 'avatar' ? 'avatar' : 'image'];
  let wrap = null, view = 'select', songIx = 0, diff = 'normal', G = null, actx = null; const bufCache = {};

  /* ---------- 共用 ---------- */
  function el() { if (wrap) return wrap; wrap = document.createElement('div'); wrap.id = 'rhythm'; wrap.className = 'rg'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', '歌姬劇場'); document.body.appendChild(wrap); return wrap; }
  function stopBgm() { try { if (window.MUSIC && MUSIC.hold) MUSIC.hold(true); else if (window.MUSIC) MUSIC.onScreen('rhythmScreen'); } catch (e) { } try { AUDIO.stopSong && AUDIO.stopSong(); AUDIO.ambient && AUDIO.ambient(null); } catch (e) { } }
  function resumeBgm() { try { if (window.MUSIC && MUSIC.hold) MUSIC.hold(false); if (window.MUSIC && MUSIC.onScreen && typeof currentScreen !== 'undefined') MUSIC.onScreen(currentScreen); } catch (e) { } }
  function open() { if (typeof SAVE === 'undefined' || !SAVE.data) return; stopBgm(); view = 'select'; renderSelect(); el().classList.add('show'); document.body.classList.add('rg-open'); }
  function close() { endGame(true); pvStop(true); if (wrap) wrap.classList.remove('show'); document.body.classList.remove('rg-open'); resumeBgm(); if (typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen') { try { renderLobby && renderLobby(); } catch (e) { } } }
  window.openRhythm = open;
  const fmtT = s => { s = Math.floor(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const keyOf = (id, d) => id + ':' + d;
  const rankOf = acc => (RANKS.find(([, v]) => acc >= v) || RANKS[RANKS.length - 1])[0];
  const absUrl = u => new URL(u, location.href).href;

  /* ---------- 試聽（開頭 20 秒前奏，循環） ---------- */
  let pv = null, pvId = null, pvRaf = 0;
  function fadeEl(a, to, ms, done) { clearInterval(a._f); const from = a.volume, t0 = performance.now(); a._f = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k >= 1) { clearInterval(a._f); done && done(); } }, 30); }
  function pvStart(S) {
    if (!st().pv || view !== 'select') return pvUi();
    if (pv && pvId === S.id) { if (pv.paused) pv.play().catch(() => { }); return pvUi(); }
    pvStop(true); const a = pv = new Audio(S.src); pvId = S.id; a.preload = 'auto'; a.volume = 0;
    a.play().then(() => { if (pv === a) fadeEl(a, musicVol(), 700); }).catch(() => { if (pv === a) { pv = null; pvId = null; } pvUi(); });
    cancelAnimationFrame(pvRaf); pvTick(); pvUi();
  }
  function pvTick() {
    pvRaf = requestAnimationFrame(pvTick); const a = pv; if (!a) return; const t = a.currentTime || 0;
    if (t >= PV_LEN - .7 && !a._out) { a._out = 1; fadeEl(a, 0, 600, () => { if (pv !== a) return; a.currentTime = 0; a._out = 0; fadeEl(a, musicVol(), 700); }); }
    const b = $('rgPvBar'), o = $('rgPvT'); if (b) b.style.transform = `scaleX(${Math.min(1, t / PV_LEN)})`; if (o) o.textContent = fmtT(Math.min(PV_LEN, t));
  }
  function pvStop(now) { cancelAnimationFrame(pvRaf); const a = pv; pv = null; pvId = null; if (!a) return pvUi(); const kill = () => { clearInterval(a._f); a.pause(); a.removeAttribute('src'); try { a.load(); } catch (e) { } };
    if (now) kill(); else fadeEl(a, 0, 250, kill); pvUi(); }
  function pvUi() { const b = document.querySelector('.rg-pv'); if (!b) return; const on = st().pv; b.classList.toggle('off', !on); b.classList.toggle('play', !!(pv && !pv.paused)); const k = b.querySelector('button'); if (k) { k.setAttribute('aria-pressed', on); k.setAttribute('aria-label', on ? '關閉前奏試聽' : '開啟前奏試聽'); }
    if (!on) { const bar = $('rgPvBar'), o = $('rgPvT'); if (bar) bar.style.transform = 'scaleX(0)'; if (o) o.textContent = '0:00'; } }

  /* ---------- 選曲 ---------- */
  function renderSelect() {
    const L = songs(), S = L[songIx]; if (!S) { el().innerHTML = '<div class="rg-empty">還沒有歌曲</div>'; return; }
    const R = st(), best = R.best[keyOf(S.id, diff)], D = S.diffs[diff];
    el().innerHTML = `<div class="rg-sel" style="--jk:url('${absUrl(S.jacket)}')">
      <div class="rg-cover" aria-hidden="true"></div>
      <header class="rg-sh"><button class="rg-back" data-a="close" aria-label="返回大廳"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>歌姬劇場</span></button>
        <div class="rg-opts"><button class="rg-hs ${R.hs ? 'on' : ''}" data-a="hs" aria-pressed="${R.hs}" aria-label="打擊音效"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg><span>打擊音</span><b>${R.hs ? '開' : '關'}</b></button>
        <div class="rg-speed"><span><em class="lg">譜面</em>速度</span><button data-sp="-1" aria-label="變慢">−</button><output>${R.speed}</output><button data-sp="1" aria-label="變快">＋</button></div></div></header>
      <aside class="rg-list" aria-label="歌曲">${L.map((s, i) => { const b = DIFFS.map(([k]) => R.best[keyOf(s.id, k)]).filter(Boolean); const top = b.sort((a, c) => c.score - a.score)[0];
        return `<button class="rg-song ${i === songIx ? 'on' : ''}" data-song="${i}"><img src="${s.sq}" alt=""><span><b>${esc(s.title)}</b><small>${esc(s.artist)}</small><i>${DIFFS.map(([k, n, c]) => `<em style="--c:${c}">${s.diffs[k].lv}</em>`).join('')}</i></span><span class="rg-sr">${top ? `<b style="color:${RANK_COL[top.rank]}">${top.rank}</b>` : '<small>未挑戰</small>'}<small>${fmtT(s.dur)}</small></span></button>`; }).join('')}</aside>
      <section class="rg-info"><div class="rg-meta">
          <small class="rg-from">${esc(S.from || '')}</small><h2>${esc(S.title)}</h2><p class="rg-artist">${esc(S.artist)}</p>
          <dl class="rg-stat"><div><dt>BPM</dt><dd>${S.bpm}</dd></div><div><dt>長度</dt><dd>${fmtT(S.dur)}</dd></div><div><dt>音符</dt><dd>${D.notes.length}</dd></div></dl>
          <div class="rg-best"><span>最佳成績</span>${best ? `<b>${best.score.toLocaleString()}</b><em style="color:${RANK_COL[best.rank]}">${best.rank}</em>${best.fc ? '<i>FULL COMBO</i>' : ''}` : '<b class="none">尚未挑戰</b>'}</div>
          <div class="rg-diffs" role="radiogroup" aria-label="難度">${DIFFS.map(([k, n, c]) => `<button role="radio" aria-checked="${k === diff}" class="${k === diff ? 'on' : ''}" data-diff="${k}" style="--c:${c}"><b>${S.diffs[k].lv}</b><small>${n}</small></button>`).join('')}</div>
          <div class="rg-pv"><button data-a="pv" aria-pressed="${R.pv}"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><svg class="mute" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 6M21 9l-5 6"/></svg></button><span class="rg-pvl">前奏試聽</span><i class="rg-pvbar"><b id="rgPvBar"></b></i><output id="rgPvT">0:00</output><small>/ 0:${PV_LEN}</small></div>
          <p class="rg-how">觸控：點擊音軌／長按／<b>滑動</b>（粉紅箭頭）・鍵盤：D F J K</p>
          <div class="rg-go"><button class="btn-gold" data-a="start">開始挑戰</button></div></div>
      </section></div>`;
    const W = el(); W.querySelectorAll('[data-song]').forEach(b => b.onclick = () => { songIx = +b.dataset.song; renderSelect(); });
    W.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { diff = b.dataset.diff; renderSelect(); });
    W.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { R.speed = Math.max(1, Math.min(10, R.speed + +b.dataset.sp)); SAVE.save(); renderSelect(); });
    W.querySelector('[data-a=hs]').onclick = () => { R.hs = !R.hs; SAVE.save(); renderSelect(); if (R.hs) { ensureCtx(); hitSnd('p'); } };
    W.querySelector('[data-a=pv]').onclick = () => { R.pv = !R.pv; SAVE.save(); if (R.pv) pvStart(S); else pvStop(); };
    W.querySelector('[data-a=close]').onclick = close; W.querySelector('[data-a=start]').onclick = () => startGame(S, diff);
    pvStart(S);
  }

  /* ---------- 音訊 ---------- */
  function ensureCtx() { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; }
  async function loadBuf(src) {
    if (bufCache[src]) return bufCache[src];
    ensureCtx(); const r = await fetch(src); if (!r.ok) throw new Error('音樂載入失敗'); const ab = await r.arrayBuffer();
    const buf = await new Promise((ok, no) => { const p = actx.decodeAudioData(ab, ok, no); if (p && p.then) p.then(ok, no); });
    return (bufCache[src] = buf);
  }
  /* 打擊音：WebAudio 合成（與歌曲同一個時鐘，不會延遲） */
  let noiseBuf = null;
  function hitSnd(kind) {
    if (!actx || !st().hs) return; const v = sfxVol(); if (v <= 0) return; const t = actx.currentTime;
    if (!noiseBuf) { noiseBuf = actx.createBuffer(1, actx.sampleRate * .08, actx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); }
    const out = actx.createGain(); out.gain.value = v * .5; out.connect(actx.destination);
    if (kind === 'm') { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(55, t + .14); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g); g.connect(out); o.start(t); o.stop(t + .17); return; }
    const n = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain(); n.buffer = noiseBuf; f.type = kind === 'f' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'f' ? 2500 : 3200; f.Q.value = 1.1;
    g.gain.setValueAtTime(kind === 'p' ? .9 : .65, t); g.gain.exponentialRampToValueAtTime(.001, t + (kind === 'f' ? .12 : .06)); n.connect(f); f.connect(g); g.connect(out); n.start(t);
    const o = actx.createOscillator(), og = actx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(kind === 'p' ? 1760 : kind === 'g' ? 1320 : kind === 'f' ? 2200 : 990, t); if (kind === 'f') o.frequency.exponentialRampToValueAtTime(3600, t + .08);
    og.gain.setValueAtTime(.18, t); og.gain.exponentialRampToValueAtTime(.001, t + .07); o.connect(og); og.connect(out); o.start(t); o.stop(t + .09);
  }

  /* ---------- 遊戲 ---------- */
  async function startGame(S, dk) {
    endGame(true); pvStop(); view = 'play'; ensureCtx();
    const C = CHARACTERS, lead = [(SAVE.data.lineup || [])[0], SAVE.data.player].find(x => x && C[x]) || 'luffy', pool = ENEMIES.filter(id => C[id]), foe = pool[Math.floor(Math.random() * pool.length)] || 'kaido';
    const notes = S.diffs[dk].notes.map(([t, l, k, d], i) => ({ i, t, l, k, d, hit: 0, res: null, holding: false, done: false }));
    const N = notes.length, base = notes.length * 1.35, beat = 60000 / (S.bpm || 120);
    G = { S, dk, notes, N, lead, foe, hp: 100, ehp: base, emax: base, combo: 0, maxCombo: 0, score: 0, cnt: { p: 0, g: 0, o: 0, m: 0 }, t: -10000, started: false, paused: false, over: false,
      speed: st().speed, fx: [], parts: [], beams: [0, 0, 0, 0], beamC: ['', '', '', ''], shake: 0, judge: null, press: [0, 0, 0, 0], pts: new Map(), defeated: false, raf: 0, src: null, t0: 0,
      beat, bOff: notes.length ? notes[0].t % beat : 0, lastBossHit: 0, lastAtk: 0, missPen: dk === 'hard' ? 7 : dk === 'normal' ? 6 : 4 };
    const W = el();
    W.innerHTML = `<div class="rg-play" style="--jk:url('${absUrl(S.jacket)}')">
      <div class="rg-bg" aria-hidden="true"></div>
      <div class="rg-stage" aria-hidden="true">
        <figure class="rg-cap"><img src="${art(lead, 'image')}" alt=""></figure>
        <figure class="rg-boss"><img src="${art(foe, 'image')}" alt=""></figure>
      </div>
      <canvas class="rg-cv"></canvas>
      <div class="rg-flash" id="rgFlash" aria-hidden="true"></div>
      <header class="rg-hud">
        <div class="rg-me"><img src="${art(lead, 'avatar')}" alt=""><div><small>${esc(C[lead].name)}・LIFE</small><div class="rg-bar me"><i id="rgHp"></i></div></div></div>
        <div class="rg-mid"><b>${esc(S.title)}</b><small>${esc(S.artist)}・${DIFFS.find(x => x[0] === dk)[1]} ${S.diffs[dk].lv}</small><div class="rg-score" id="rgScore">0</div></div>
        <div class="rg-foe"><div><small>BOSS・${esc(C[foe].name)}</small><div class="rg-bar foe"><i id="rgEhp"></i></div></div><img src="${art(foe, 'avatar')}" alt=""></div>
      </header>
      <button class="rg-pause" aria-label="暫停"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button>
      <div class="rg-combo" id="rgCombo" aria-live="off"><b>0</b><small>COMBO</small></div>
      <div class="rg-dmgs" id="rgDmgs" aria-hidden="true"></div>
      <div class="rg-count" id="rgCount" aria-live="assertive"></div>
      <div class="rg-load" id="rgLoad">載入音樂中…</div>
    </div>`;
    const cv = W.querySelector('.rg-cv'); G.cv = cv; G.cx = cv.getContext('2d'); G.root = W.querySelector('.rg-play'); G.capEl = W.querySelector('.rg-cap'); G.bossEl = W.querySelector('.rg-boss'); G.comboEl = $('rgCombo'); fit();
    W.querySelector('.rg-pause').onclick = () => pause(true);
    bindInput(cv); hud();
    try { G.buf = await loadBuf(S.src); } catch (e) { const l = $('rgLoad'); if (l) l.textContent = '音樂載入失敗，請檢查網路後再試一次'; return; }
    if (!G || G.over) return; const l = $('rgLoad'); if (l) l.remove();
    G.cdStart = performance.now(); loop();
  }
  /* 版面：音軌永遠水平置中；左右兩側放隊長與 BOSS 立繪（直式手機改成音軌後方的半透明立繪） */
  function fit() {
    if (!G) return; const cv = G.cv, r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); G.dpr = dpr; G.W = r.width; G.H = r.height;
    const land = r.width > r.height * 1.05, hud = G.root.querySelector('.rg-hud'), hb = hud ? hud.getBoundingClientRect().bottom - r.top : 96;
    G.lw = land ? Math.min(560, r.width * .46, r.height * .9) : Math.min(560, r.width * .9); G.lx = Math.round((r.width - G.lw) / 2); G.jy = r.height * (land ? .86 : .85); G.top = Math.max(land ? 56 : 96, Math.round(hb + 8));
    const R = G.root.style, side = (r.width - G.lw) / 2; G.root.classList.toggle('portrait', !land);
    R.setProperty('--lx', G.lx + 'px'); R.setProperty('--lw', G.lw + 'px'); R.setProperty('--jy', G.jy + 'px'); R.setProperty('--top', G.top + 'px');
    R.setProperty('--aw', Math.round(land ? Math.min(side + G.lw * .1, r.height * .78) : r.width * .62) + 'px');
    R.setProperty('--cy', Math.round(G.top + (G.jy - G.top) * .3) + 'px');
  }
  addEventListener('resize', () => setTimeout(fit, 60));
  const laneX = l => G.lx + G.lw * (l + .5) / 4, laneOf = x => { const k = Math.floor((x - G.lx) / (G.lw / 4)); return k >= 0 && k < 4 ? k : -1; };
  const travel = () => 2600 - G.speed * 210; /* 音符從上方落到判定線的時間（毫秒） */
  /* 聲音實際播出的時間要扣掉裝置輸出延遲（藍牙耳機、手機） */
  function latency() { const l = ((actx && (actx.outputLatency || 0)) + (actx && (actx.baseLatency || 0))) * 1000; return l > 0 ? Math.min(250, l) : 30; }
  function songTime() { if (!G.started) return G.t; return (actx.currentTime - G.t0) * 1000 - G.lat; }
  function beginAudio(at) { const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = musicVol(); s.buffer = G.buf; s.connect(g); g.connect(actx.destination); G.lat = latency();
    G.t0 = actx.currentTime + .06 - at / 1000; s.start(actx.currentTime + .06, Math.max(0, at / 1000)); G.src = s; G.started = true; s.onended = () => { if (G && !G.paused && !G.over) finish(false); }; }
  function loop() {
    if (!G || G.over) return; G.raf = requestAnimationFrame(loop);
    if (G.paused) return draw();
    if (!G.started) { const left = 10 - (performance.now() - G.cdStart) / 1000, c = $('rgCount'); if (c) { const n = Math.ceil(left); if (c.textContent !== String(left > 0 ? n : '')) { c.textContent = left > 0 ? n : ''; c.className = 'rg-count' + (left > 0 && n <= 3 ? ' big' : ''); } }
      G.t = -Math.max(0, left) * 1000 * .14; /* 倒數時音符停在上方，最後一刻開始落下 */
      if (left <= 0) { if (actx.state === 'suspended') actx.resume(); beginAudio(0); if (c) c.textContent = ''; } }
    else G.t = songTime();
    if (G.auto && G.started) for (const n of G.notes) { if (n.t - G.t > 40) break; if (n.hit || n.done || n.pending) continue; if (G.t >= n.t - G.auto) { n.hit = 1; G.press[n.l] = 1; if (n.k === 1) n.holding = true; award(n, judgeOf(n.t - G.t) || 'o'); } } /* 測試用自動演奏 */
    /* 判定：沒打到的音符過線視為失誤；長按中鬆開過早 */
    for (const n of G.notes) { if (n.done) continue; if (n.t - G.t > 1000) break;
      if (!n.hit && G.t - n.t > WIN.o) { n.done = true; miss(n); continue; }
      if (n.k === 1 && n.hit && n.holding && G.t >= n.t + n.d - 60) { n.done = true; n.holding = false; tailOk(n); }
      if (n.k === 1 && n.hit && n.holding && Math.random() < .35) spark(laneX(n.l), G.jy, LANE_COL[n.l], 1, 2);
      if (n.k === 1 && n.hit && !n.holding && !n.done) { n.done = true; }
      if (n.k !== 1 && n.hit) n.done = true; }
    draw();
  }
  function draw() {
    const { cx, dpr, W, H, lx, lw, jy } = G; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (G.shake > .2) { cx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake); G.shake *= .86; } else G.shake = 0;
    const top = G.top, tr = travel(), y = t => jy - (t - G.t) / tr * (jy - top);
    const ph = G.started ? (((G.t - G.bOff) % G.beat) + G.beat) % G.beat / G.beat : 1, pulse = Math.pow(1 - ph, 3); /* 節拍脈動 */
    const heat = Math.min(1, G.combo / 100);
    /* 音軌 */
    cx.save(); const g = cx.createLinearGradient(0, top, 0, H); g.addColorStop(0, 'rgba(8,10,30,0)'); g.addColorStop(.18, 'rgba(8,10,30,.62)'); g.addColorStop(1, 'rgba(8,10,30,.86)'); cx.fillStyle = g; cx.fillRect(lx, top, lw, H - top);
    /* 節拍線：隨歌曲往下流動，增加速度感 */
    if (G.started) { const b0 = Math.ceil((G.t - G.bOff) / G.beat) * G.beat + G.bOff; for (let bt = b0; bt < G.t + tr; bt += G.beat) { const yy = y(bt); if (yy < top) break; const bar = Math.round((bt - G.bOff) / G.beat) % 4 === 0; cx.fillStyle = bar ? 'rgba(160,200,255,.16)' : 'rgba(160,200,255,.06)'; cx.fillRect(lx, yy - (bar ? 1.5 : .5), lw, bar ? 3 : 1); } }
    for (let l = 0; l <= 4; l++) { const x = lx + lw * l / 4, edge = l === 0 || l === 4; cx.strokeStyle = edge ? `rgba(${Math.round(160 + 95 * heat)},${Math.round(200 + 20 * heat)},${Math.round(255 - 150 * heat)},${.5 + .4 * pulse})` : 'rgba(160,200,255,.16)'; cx.lineWidth = edge ? 2 + 2 * pulse : 1;
      if (edge) { cx.shadowColor = heat > .5 ? '#ffd04a' : '#7fdcff'; cx.shadowBlur = 8 + 14 * pulse; } cx.beginPath(); cx.moveTo(x, top); cx.lineTo(x, H); cx.stroke(); cx.shadowBlur = 0; }
    for (let l = 0; l < 4; l++) if (G.press[l] > 0) { const a = Math.min(1, G.press[l]); const lg = cx.createLinearGradient(0, jy, 0, top + (jy - top) * .4); lg.addColorStop(0, hexA(LANE_COL[l], .3 * a)); lg.addColorStop(1, hexA(LANE_COL[l], 0)); cx.fillStyle = lg; cx.fillRect(lx + lw * l / 4, top, lw / 4, jy - top); G.press[l] = Math.max(0, G.press[l] - .07); }
    /* 打中時的光柱 */
    cx.globalCompositeOperation = 'lighter';
    for (let l = 0; l < 4; l++) if (G.beams[l] > 0) { const a = G.beams[l], x0 = lx + lw * l / 4, bw = lw / 4, c = G.beamC[l]; const lg = cx.createLinearGradient(0, jy, 0, top); lg.addColorStop(0, hexA(c, .75 * a)); lg.addColorStop(.6, hexA(c, .18 * a)); lg.addColorStop(1, hexA(c, 0)); cx.fillStyle = lg;
      const sh = bw * (1 - a) * .25; cx.fillRect(x0 + sh, top, bw - sh * 2, jy - top); cx.fillStyle = hexA('#ffffff', .5 * a); cx.fillRect(x0 + bw * .42, top + (jy - top) * (1 - a), bw * .16, (jy - top) * a); G.beams[l] = Math.max(0, a - .08); }
    cx.globalCompositeOperation = 'source-over';
    /* 判定線 */
    cx.shadowColor = '#7fdcff'; cx.shadowBlur = 14 + 16 * pulse; cx.strokeStyle = '#dff6ff'; cx.lineWidth = 3 + 2 * pulse; cx.beginPath(); cx.moveTo(lx, jy); cx.lineTo(lx + lw, jy); cx.stroke(); cx.shadowBlur = 0;
    for (let l = 0; l < 4; l++) { const pr = G.press[l]; cx.strokeStyle = hexA(LANE_COL[l], .7 + .3 * pr); cx.lineWidth = 2 + 2 * pr; cx.beginPath(); cx.ellipse(laneX(l), jy, (lw / 8 - 10) * (1 + .12 * pr), 10 + 4 * pr, 0, 0, Math.PI * 2); cx.stroke(); if (pr > .3) { cx.fillStyle = hexA(LANE_COL[l], .25 * pr); cx.fill(); } }
    cx.restore();
    /* 音符 */
    const nw = lw / 4 - 12;
    for (const n of G.notes) {
      if (n.done && !(n.k === 1 && n.holding)) continue; const yy = y(n.t); if (yy < top - 40) break; if (yy > H + 40 && n.k !== 1) continue;
      const x = laneX(n.l), c = n.k === 2 ? '#ff4ad2' : n.k === 1 ? '#b06bff' : LANE_COL[n.l];
      const fade = Math.min(1, Math.max(0, (yy - top + 10) / 60)); cx.globalAlpha = fade;
      if (n.k === 1) { const y2 = Math.max(top, y(n.t + n.d)), y1 = n.hit ? jy : yy; cx.fillStyle = hexA(c, n.hit ? .6 : .35); cx.strokeStyle = hexA(c, .9); cx.lineWidth = 2; roundRect(cx, x - nw * .32, y2, nw * .64, Math.max(4, y1 - y2), 8); cx.fill(); cx.stroke(); if (!n.hit) chevron(cx, x, yy, nw, c); }
      else if (n.k === 2) flick(cx, x, yy, nw, c);
      else chevron(cx, x, yy, nw, c);
      cx.globalAlpha = 1;
    }
    /* 擴散光環 */
    G.fx = G.fx.filter(f => (f.a -= .045) > 0);
    cx.globalCompositeOperation = 'lighter';
    for (const f of G.fx) { const k = 1 - f.a; cx.globalAlpha = f.a; cx.strokeStyle = f.c; cx.lineWidth = 2 + 4 * f.a; cx.beginPath(); cx.ellipse(f.x, jy, k * (f.big ? 70 : 44) + 12, (k * (f.big ? 70 : 44) + 12) * .55, 0, 0, Math.PI * 2); cx.stroke();
      if (f.big) { cx.lineWidth = 2; cx.beginPath(); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + f.r, r1 = 14 + k * 30, r2 = 30 + k * 90; cx.moveTo(f.x + Math.cos(an) * r1, jy + Math.sin(an) * r1 * .6); cx.lineTo(f.x + Math.cos(an) * r2, jy + Math.sin(an) * r2 * .6); } cx.stroke(); } }
    /* 粒子 */
    G.parts = G.parts.filter(p => (p.life -= p.dl) > 0);
    for (const p of G.parts) { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .97; cx.globalAlpha = Math.min(1, p.life * 1.4); cx.fillStyle = p.c; const s = p.s * (.5 + p.life * .5); cx.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    /* 判定字：放大後彈回 */
    if (G.judge && (G.judge.a -= .022) > 0) { const J = G.judge, k = Math.max(0, J.a - .82) / .18, sc = 1 + .55 * k, fs = Math.round(Math.min(44, lw / 9)); cx.save(); cx.globalAlpha = Math.min(1, J.a * 1.6);
      cx.translate(W / 2, top + (jy - top) * .6 - (1 - J.a) * 12); cx.scale(sc, sc); cx.font = `italic 900 ${fs}px Anton, Impact, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.lineWidth = 7; cx.lineJoin = 'round'; cx.strokeStyle = 'rgba(0,0,0,.75)'; cx.strokeText(J.txt, 0, 0); cx.shadowColor = J.c; cx.shadowBlur = 18; cx.fillStyle = J.c; cx.fillText(J.txt, 0, 0);
      if (J.sub) { cx.shadowBlur = 0; cx.font = `700 ${Math.round(fs * .34)}px system-ui, sans-serif`; cx.fillStyle = '#ffffff'; cx.fillText(J.sub, 0, fs * .66); } cx.restore(); }
  }
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* 點擊音符：霓虹向下箭頭 */
  function chevron(c, x, y, w, col) { c.save(); c.shadowColor = col; c.shadowBlur = 16; c.strokeStyle = col; c.lineWidth = 6; c.lineJoin = 'round'; c.lineCap = 'round';
    const hw = w * .36; c.beginPath(); c.moveTo(x - hw, y - 12); c.lineTo(x, y + 6); c.lineTo(x + hw, y - 12); c.stroke(); c.shadowBlur = 0; c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - hw, y - 12); c.lineTo(x, y + 6); c.lineTo(x + hw, y - 12); c.stroke();
    c.fillStyle = hexA(col, .25); roundRect(c, x - w / 2, y - 16, w, 28, 10); c.fill(); c.restore(); }
  /* 滑動音符：雙箭頭 */
  function flick(c, x, y, w, col) { c.save(); c.shadowColor = col; c.shadowBlur = 18; c.fillStyle = hexA(col, .3); roundRect(c, x - w / 2, y - 18, w, 32, 12); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round'; for (const dx of [-10, 6]) { c.beginPath(); c.moveTo(x + dx - 8, y - 10); c.lineTo(x + dx + 4, y - 2); c.lineTo(x + dx - 8, y + 6); c.stroke(); } c.restore(); }
  function spark(x, y, c, n, sp) { for (let i = 0; i < n && G.parts.length < 260; i++) { const an = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.3, v = (sp || 5) * (.5 + Math.random()); G.parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, c: Math.random() < .3 ? '#ffffff' : c, s: 3 + Math.random() * 4, life: 1, dl: .025 + Math.random() * .03 }); } }

  /* ---------- 判定與結算 ---------- */
  function judgeOf(dt) { dt = Math.abs(dt); return dt <= WIN.p ? 'p' : dt <= WIN.g ? 'g' : dt <= WIN.o ? 'o' : null; }
  const JTXT = { p: ['PERFECT', '#ffe866'], g: ['GREAT', '#5ad8ff'], o: ['GOOD', '#8affb0'], m: ['MISS', '#ff6a7a'] };
  function award(n, j) {
    G.cnt[j]++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.score += 900000 / G.N * JW[j] + 100000 / G.N * Math.min(1, G.combo / 50);
    if (j === 'p') G.hp = Math.min(100, G.hp + .4);
    const dmg = JW[j] * (1 + Math.min(G.combo, 100) / 100); G.ehp = Math.max(0, G.ehp - dmg);
    const x = laneX(n.l), c = JTXT[j][1];
    G.judge = { txt: JTXT[j][0], c, a: 1 }; G.fx.push({ x, c, a: 1, r: Math.random() * 6, big: j === 'p' });
    G.beams[n.l] = 1; G.beamC[n.l] = n.k === 2 ? '#ff4ad2' : j === 'p' ? '#ffe866' : LANE_COL[n.l];
    spark(x, G.jy, c, j === 'p' ? 18 : j === 'g' ? 11 : 6, j === 'p' ? 7 : 5);
    if (j === 'p') G.shake = Math.max(G.shake, 4 + Math.min(6, G.combo / 40));
    hitSnd(n.k === 2 ? 'f' : j);
    bossHit(dmg, j);
    if (!G.defeated && G.ehp <= 0) { G.defeated = true; G.bossEl && G.bossEl.classList.add('down'); flash('gold'); G.shake = 16; banner(`擊敗了 ${CHARACTERS[G.foe].name}！`, 'win'); }
    if (G.combo % 50 === 0) { flash('gold'); G.shake = Math.max(G.shake, 10); banner(`${G.combo} COMBO!`); try { typeof SFX !== 'undefined' && SFX.play('coin'); } catch (e) { } }
    hud(true);
  }
  /* BOSS 受擊：閃白抖動＋傷害數字；隊長出拳 */
  function bossHit(dmg, j) {
    const now = performance.now(), B = G.bossEl, Cp = G.capEl;
    if (B && !G.defeated && now - G.lastBossHit > 70) { G.lastBossHit = now; B.classList.remove('hit'); void B.offsetWidth; B.classList.add('hit'); }
    if (Cp && now - G.lastAtk > 160) { G.lastAtk = now; Cp.classList.remove('atk', 'hurt'); void Cp.offsetWidth; Cp.classList.add('atk'); }
    const box = $('rgDmgs'); if (!box || G.defeated) return; if (box.childElementCount > 7) box.firstElementChild.remove();
    const d = document.createElement('b'); d.className = 'rg-dmg ' + j; d.textContent = Math.round(dmg * 137 * (j === 'p' ? 1 + Math.random() * .2 : 1)).toLocaleString();
    d.style.setProperty('--dx', Math.round((Math.random() - .5) * 80) + 'px'); d.style.setProperty('--dy', Math.round((Math.random() - .5) * 60) + 'px'); box.appendChild(d); setTimeout(() => d.remove(), 800);
  }
  function flash(kind) { const f = $('rgFlash'); if (!f) return; f.className = 'rg-flash'; void f.offsetWidth; f.className = 'rg-flash ' + kind; }
  function miss(n, quiet) { const had = G.combo; G.cnt.m++; G.combo = 0; G.hp = Math.max(0, G.hp - G.missPen);
    if (!quiet) { G.judge = { txt: 'MISS', c: JTXT.m[1], a: 1, sub: had >= 10 ? `COMBO ${had} 中斷` : '' }; flash('miss'); hitSnd('m'); G.shake = Math.max(G.shake, 6);
      const Cp = G.capEl; if (Cp) { Cp.classList.remove('atk', 'hurt'); void Cp.offsetWidth; Cp.classList.add('hurt'); } }
    hud(); if (G.hp <= 0) finish(true); }
  function tailOk(n) { spark(laneX(n.l), G.jy, '#e0c0ff', 10, 6); G.beams[n.l] = .8; G.beamC[n.l] = '#b06bff'; hitSnd('g'); hud(); }
  function hud(pop) { const h = $('rgHp'), e = $('rgEhp'), s = $('rgScore'), c = G.comboEl; if (h) { h.style.width = G.hp + '%'; h.classList.toggle('low', G.hp < 30); } if (e) e.style.width = (G.ehp / G.emax * 100) + '%';
    if (s) s.textContent = Math.round(G.score).toLocaleString();
    if (c) { c.querySelector('b').textContent = G.combo; c.classList.toggle('on', G.combo >= 1); c.classList.toggle('t50', G.combo >= 50); c.classList.toggle('t100', G.combo >= 100); c.classList.toggle('t200', G.combo >= 200);
      if (pop) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } } }
  function banner(t, kind) { const b = document.createElement('div'); b.className = 'rg-banner' + (kind ? ' ' + kind : ''); b.textContent = t; G.root.appendChild(b); setTimeout(() => b.remove(), 1800); }
  /* ---------- 輸入 ---------- */
  function hitLane(l, kind, pid) {
    if (!G || G.paused || G.over || !G.started) return; G.press[l] = 1;
    const cand = G.notes.find(n => !n.done && !n.hit && !n.pending && n.l === l && Math.abs(n.t - G.t) <= WIN.o + 20);
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
      if (n.k === 1 && n.holding && !n.done) { n.holding = false; if (G.t < n.t + n.d - 120) { n.done = true; miss(n); } else { n.done = true; tailOk(n); } } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  const down = new Set();
  document.addEventListener('keydown', e => { if (!G || view !== 'play') return; if (e.key === 'Escape') { pause(!G.paused); return; } const l = KEYS[e.key.toLowerCase()]; if (l == null || e.repeat || down.has(l)) return; down.add(l);
    const n = hitLane(l, 'key', 'k' + l); if (n && n.pending) { n.pending = null; n.hit = 1; award(n, 'g'); } /* 鍵盤：滑動音符以按鍵代替（最高 GREAT） */ });
  document.addEventListener('keyup', e => { if (!G) return; const l = KEYS[e.key.toLowerCase()]; if (l == null) return; down.delete(l); const n = G.notes.find(x => x.k === 1 && x.holding && x.l === l); if (n) { n.holding = false; n.done = true; if (G.t < n.t + n.d - 120) miss(n); else tailOk(n); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G && G.started && !G.over) pause(true); if (pv) pv.pause(); } else if (pv && view === 'select' && wrap && wrap.classList.contains('show')) pv.play().catch(() => { }); });
  /* ---------- 暫停 ---------- */
  function pause(on) {
    if (!G || G.over) return; G.paused = on;
    const W = G.root; let m = W && W.querySelector('.rg-pm');
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
    el().innerHTML = `<div class="rg-res" style="--jk:url('${absUrl(S.jacket)}')"><div class="rg-bg" aria-hidden="true"></div>
      <section class="rg-rcard">
        <header><img src="${S.sq}" alt=""><div><small>${failed ? '挑戰失敗' : '挑戰完成'}</small><b>${esc(S.title)}</b><span><em style="--c:${D[2]}">${D[1]} ${S.diffs[g.dk].lv}</em>${esc(S.artist)}</span></div></header>
        <div class="rg-rank" style="--rc:${RANK_COL[rank]}"><b>${rank}</b>${fc ? `<i>${cnt.p === N ? 'ALL PERFECT' : 'FULL COMBO'}</i>` : ''}${isNew ? '<i class="new">NEW RECORD</i>' : ''}</div>
        <div class="rg-sc"><small>SCORE</small><b>${score.toLocaleString()}</b><span>準確率 ${(acc * 100).toFixed(1)}%</span></div>
        <dl class="rg-rows">
          <div><dt>最佳時機（PERFECT）</dt><dd style="color:#ffe866">${cnt.p}</dd></div><div><dt>GREAT</dt><dd style="color:#5ad8ff">${cnt.g}</dd></div>
          <div><dt>GOOD</dt><dd style="color:#8affb0">${cnt.o}</dd></div><div><dt>失誤數（MISS）</dt><dd style="color:#ff6a7a">${cnt.m}</dd></div>
          <div><dt>最高 COMBO</dt><dd>${g.maxCombo}</dd></div><div><dt>BOSS・${esc(CHARACTERS[g.foe].name)}</dt><dd>${g.defeated ? '已擊敗' : `剩 ${Math.round(g.ehp / g.emax * 100)}%`}</dd></div>
        </dl>
        <div class="rg-rew"><span>獎勵</span><b><i class="berry-ico">B</i>${Math.round(rw.berry).toLocaleString()}</b>${rw.tokens ? `<b><i class="coin-ico"></i>×${rw.tokens}<small>首次通關</small></b>` : ''}</div>
        <div class="rg-ract"><button class="btn-ghost" data-r="sel">選曲</button><button class="btn-gold" data-r="again">再挑戰</button></div>
      </section></div>`;
    view = 'result'; const W = el(); W.querySelector('[data-r=sel]').onclick = () => { view = 'select'; renderSelect(); }; W.querySelector('[data-r=again]').onclick = () => startGame(S, g.dk);
    try { if (typeof SFX !== 'undefined') SFX.play(failed ? 'lose' : 'rare'); } catch (e) { }
  }
  window.RHYTHM = { open, close, _g: () => G, _finish: finish, _hit: (l) => hitLane(l, 'test', 'test'), _auto: ms => { if (G) G.auto = ms; }, _pv: () => pv && { id: pvId, t: pv.currentTime, paused: pv.paused, vol: pv.volume } };

  /* ---------- 冒險選單：新增「歌姬劇場」卡片 ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#lbModes .mode-grid'); if (!grid || grid.querySelector('[data-mode=rhythm]')) return;
    const b = document.createElement('button'); b.className = 'mode-card m-rhythm'; b.dataset.mode = 'rhythm';
    b.innerHTML = '<span class="mc-art" aria-hidden="true"></span><span class="mc-body"><b>歌姬劇場</b><small>跟著節奏點擊、長按、滑動四條音軌，用歌聲擊敗 BOSS</small><em id="mdRhythm">新模式</em></span>';
    b.addEventListener('click', () => { const s = $('lbModes'); if (s) { s.classList.remove('show'); s.setAttribute('aria-hidden', 'true'); } open(); });
    grid.appendChild(b);
    const R = () => { const e = $('mdRhythm'); if (!e || !SAVE.data) return; const best = Object.values((SAVE.data.rhythm || {}).best || {}); e.textContent = best.length ? `最佳 ${best.sort((a, c) => c.score - a.score)[0].rank}・${best.length} 個譜面` : '新模式'; };
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); try { R(); } catch (e) { } return r; };
  });
})();
