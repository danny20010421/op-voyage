/* 音樂遊戲「歌姬挑戰」（v118 建立為「歌姬劇場」，v120 改版，v121 改名並改成固定 BOSS 美音）：
   - 選曲：MV 封面當背景；歌曲清單、歌曲資訊、三種難度（EASY 3／NORMAL 7／HARD 12）、譜面速度、打擊音開關、最佳成績、BOSS 美音的攻擊說明、美音碎片進度。
     選曲時自動試聽開頭 20 秒前奏（循環，可關閉）；開始遊戲或離開時停止。進入時大廳背景音樂完全停止（MUSIC.hold），離開後恢復。
   - 遊戲：開始前 5 秒倒數；四條「半立體」音軌（透視：遠處窄、近處寬，音符由遠方滑向判定線並逐漸放大）；
     左邊 BOSS 美音、右邊我方出戰陣容隊長（HUD 與立繪同側）。
     判定：PERFECT ±45ms、GREAT ±90ms、GOOD ±135ms；失誤或按錯扣血，血量歸 0 挑戰失敗。打中音符會對 BOSS 造成傷害（判定越好、COMBO 越高傷害越高）。
   - BOSS 美音依難度不同（BOSS_CFG）：體力倍率、失誤扣血、攻擊間隔與攻擊種類——
       歌聲衝擊：直接扣我方體力（COMBO 30 以上減半）；催眠歌聲：音軌遠端被霧遮住幾秒；五線譜束縛：音符加速幾秒；
       HARD 時美音體力剩一半「魔王降臨」：立繪換成魔王型態、攻擊更頻繁、歌聲衝擊更痛。攻擊前 2 拍會預告。
   - 結算：評級 SSS～E、分數、PERFECT 數、失誤數、最高 COMBO、BOSS 是否擊敗、獎勵；
     美音碎片：每一輪中，不重複的歌曲拿到 S 以上評分（任一難度）滿 5 首，獲得 20 片美音碎片（SAVE.data.rhythm.uta），集滿 100 片合成美音。
   譜面在 js/rhythm_charts.js（tools/rhythm_chart_v121.py 由音訊產生）。操作：觸控／滑鼠點擊音軌；鍵盤 D F J K。 */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const NAME = '歌姬挑戰';
  const DIFFS = [['easy', 'EASY', '#4fd38a'], ['normal', 'NORMAL', '#4fa8ff'], ['hard', 'HARD', '#ff4a7a']];
  const WIN = { p: 45, g: 90, o: 135 };                 /* 判定時間（毫秒） */
  const JW = { p: 1, g: .7, o: .4 };                    /* 判定權重 */
  const LANE_COL = ['#3ad8ff', '#b06bff', '#ff5ad2', '#3ad8ff'];
  const KEYS = { d: 0, f: 1, j: 2, k: 3 };
  const RANKS = [['SSS', .98], ['SS', .95], ['S', .9], ['A', .8], ['B', .7], ['C', .6], ['D', .5], ['E', 0]];
  const RANK_COL = { SSS: '#ffe066', SS: '#ffd04a', S: '#c58bff', A: '#4fd3ff', B: '#6fe0a0', C: '#cfd8e6', D: '#9aa6b8', E: '#7a8496' };
  const S_UP = ['SSS', 'SS', 'S'];
  const BOSS = 'uta';                                   /* 固定 BOSS：美音 */
  const DEMON_IMG = 'assets/chars/uta_totmusica.webp?v=121', DEMON_FACE = 'assets/chars/uta_totmusica_face.webp?v=121';
  const UTA = { need: 100, per: 20, songs: 5 };         /* 美音碎片：5 首不重複 S 以上 → 20 片；100 片合成 */
  /* BOSS 美音依難度：hp＝體力倍率（×音符數）、miss＝失誤扣血、every＝攻擊間隔（秒）、atk＝攻擊種類、wave＝歌聲衝擊傷害、fog＝催眠霧遮住的遠端比例、spd＝束縛加速倍率、demon＝魔王降臨 */
  const BOSS_CFG = {
    easy: { hp: 1.1, miss: 3, every: 26, atk: ['wave'], wave: 3, fog: 0, spd: 1, demon: false, label: '體力 低', desc: '歌聲衝擊（約每 26 秒）' },
    normal: { hp: 1.35, miss: 5, every: 16, atk: ['wave', 'fog'], wave: 6, fog: .45, spd: 1, demon: false, label: '體力 中', desc: '歌聲衝擊、催眠歌聲（約每 16 秒）' },
    hard: { hp: 1.55, miss: 6, every: 11, atk: ['wave', 'fog', 'staff'], wave: 8, fog: .58, spd: 1.35, demon: true, label: '體力 高', desc: '歌聲衝擊、催眠歌聲、五線譜束縛（約每 11 秒）；體力剩一半時魔王降臨' }
  };
  const ATK_NAME = { wave: '歌聲衝擊', fog: '催眠歌聲', staff: '五線譜束縛' };
  const PV_LEN = 20, COUNT = 5;                         /* 試聽長度、開始倒數（秒） */
  const songs = () => window.RHYTHM_SONGS || [];
  const st = () => { const d = SAVE.data; d.rhythm = d.rhythm || { best: {}, speed: 6 }; const r = d.rhythm; r.best = r.best || {}; if (r.pv == null) r.pv = true; if (r.hs == null) r.hs = true;
    r.uta = r.uta || { shards: 0, cycle: [], total: 0 }; r.uta.cycle = r.uta.cycle || []; return r; };
  const pref = () => { try { return (typeof AUDIO !== 'undefined' && AUDIO.pref) || {}; } catch (e) { return {}; } };
  const musicVol = () => { const p = pref(); return p.muted ? 0 : Math.min(1, (p.music ?? .55) * 1.5); };
  const sfxVol = () => { const p = pref(); return p.muted ? 0 : (p.sfx ?? .8); };
  const art = (id, kind) => typeof charArt === 'function' ? charArt(id, kind) : CHARACTERS[id][kind === 'avatar' ? 'avatar' : 'image'];
  const bossId = () => CHARACTERS[BOSS] ? BOSS : 'kaido';
  const hasUta = () => typeof owned === 'function' && owned(BOSS);
  let wrap = null, view = 'select', songIx = 0, diff = 'normal', G = null, actx = null; const bufCache = {};

  /* ---------- 共用 ---------- */
  function el() { if (wrap) return wrap; wrap = document.createElement('div'); wrap.id = 'rhythm'; wrap.className = 'rg'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', NAME); document.body.appendChild(wrap); return wrap; }
  function stopBgm() { try { if (window.MUSIC && MUSIC.hold) MUSIC.hold(true); else if (window.MUSIC) MUSIC.onScreen('rhythmScreen'); } catch (e) { } try { AUDIO.stopSong && AUDIO.stopSong(); AUDIO.ambient && AUDIO.ambient(null); } catch (e) { } }
  function resumeBgm() { try { if (window.MUSIC && MUSIC.hold) MUSIC.hold(false); if (window.MUSIC && MUSIC.onScreen && typeof currentScreen !== 'undefined') MUSIC.onScreen(currentScreen); } catch (e) { } }
  function open() { if (typeof SAVE === 'undefined' || !SAVE.data) return; stopBgm(); view = 'select'; renderSelect(); el().classList.add('show'); document.body.classList.add('rg-open'); }
  function close() { endGame(true); pvStop(true); if (wrap) wrap.classList.remove('show'); document.body.classList.remove('rg-open'); resumeBgm(); if (typeof currentScreen !== 'undefined' && currentScreen === 'modeScreen') { try { renderLobby && renderLobby(); } catch (e) { } } }
  window.openRhythm = open;
  const fmtT = s => { s = Math.floor(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const keyOf = (id, d) => id + ':' + d;
  const rankOf = acc => (RANKS.find(([, v]) => acc >= v) || RANKS[RANKS.length - 1])[0];
  const absUrl = u => new URL(u, location.href).href;

  /* ---------- 美音碎片 ---------- */
  function utaLine() { const U = st().uta, own = hasUta();
    return `<div class="rg-uta"><img src="${art(bossId(), 'avatar')}" alt=""><div><b>美音碎片 <em>${U.shards}</em> / ${UTA.need}</b><small>${own ? '已擁有美音・碎片持續累積' : `S 以上不重複歌曲 ${U.cycle.length} / ${UTA.songs} 首 → +${UTA.per} 片`}</small>
      <i class="rg-uta-bar"><b style="width:${Math.min(100, U.shards / UTA.need * 100)}%"></b></i></div>${!own && U.shards >= UTA.need ? '<button class="btn-gold" data-a="synth">合成</button>' : ''}</div>`; }
  function synthUta() { const U = st().uta; if (hasUta() || U.shards < UTA.need || typeof addCrew !== 'function') return false;
    U.shards -= UTA.need; addCrew(BOSS, (typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.charLv) || 20); SAVE.save(); try { SFX.play('rare'); } catch (e) { }
    if (typeof toast === 'function') toast('合成成功！美音加入了你的船隊', 'gold'); return true; }
  window.RHYTHM_UTA = { st: () => st().uta, need: UTA.need, synth: synthUta };
  /* 一輪中不重複的歌曲拿到 S 以上 → 記錄；滿 5 首給 20 片並開始新的一輪 */
  function utaProgress(songId, rank, failed) {
    const U = st().uta; if (failed || !S_UP.includes(rank)) return { added: false, got: 0 };
    if (U.cycle.includes(songId)) return { added: false, dup: true, got: 0 };
    U.cycle.push(songId); let got = 0; if (U.cycle.length >= UTA.songs) { got = UTA.per; U.shards += got; U.total = (U.total || 0) + got; U.cycle = []; }
    SAVE.save(); return { added: true, got };
  }

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
    const R = st(), best = R.best[keyOf(S.id, diff)], D = S.diffs[diff], B = BOSS_CFG[diff], inCycle = R.uta.cycle.includes(S.id);
    el().innerHTML = `<div class="rg-sel" style="--jk:url('${absUrl(S.jacket)}')">
      <div class="rg-cover" aria-hidden="true"></div>
      <header class="rg-sh"><button class="rg-back" data-a="close" aria-label="返回大廳"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>${NAME}</span></button>
        <div class="rg-opts"><button class="rg-hs ${R.hs ? 'on' : ''}" data-a="hs" aria-pressed="${R.hs}" aria-label="打擊音效"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg><span>打擊音</span><b>${R.hs ? '開' : '關'}</b></button>
        <div class="rg-speed"><span><em class="lg">譜面</em>速度</span><button data-sp="-1" aria-label="變慢">−</button><output>${R.speed}</output><button data-sp="1" aria-label="變快">＋</button></div></div></header>
      <aside class="rg-list" aria-label="歌曲">${L.map((s, i) => { const b = DIFFS.map(([k]) => R.best[keyOf(s.id, k)]).filter(Boolean); const top = b.sort((a, c) => c.score - a.score)[0];
        return `<button class="rg-song ${i === songIx ? 'on' : ''}" data-song="${i}"><img src="${s.sq}" alt=""><span><b>${esc(s.title)}</b><small>${esc(s.artist)}</small><i>${DIFFS.map(([k, n, c]) => `<em style="--c:${c}">${s.diffs[k].lv}</em>`).join('')}</i></span><span class="rg-sr">${top ? `<b style="color:${RANK_COL[top.rank]}">${top.rank}</b>` : '<small>未挑戰</small>'}<small>${fmtT(s.dur)}</small></span></button>`; }).join('')}${utaLine()}</aside>
      <section class="rg-info"><div class="rg-meta">
          <small class="rg-from">${esc(S.from || '')}</small><h2>${esc(S.title)}</h2><p class="rg-artist">${esc(S.artist)}</p>
          <dl class="rg-stat"><div><dt>BPM</dt><dd>${Math.round(S.bpm)}</dd></div><div><dt>長度</dt><dd>${fmtT(S.dur)}</dd></div><div><dt>音符</dt><dd>${D.notes.length}</dd></div></dl>
          <div class="rg-best"><span>最佳成績</span>${best ? `<b>${best.score.toLocaleString()}</b><em style="color:${RANK_COL[best.rank]}">${best.rank}</em>${best.fc ? '<i>FULL COMBO</i>' : ''}` : '<b class="none">尚未挑戰</b>'}</div>
          <div class="rg-diffs" role="radiogroup" aria-label="難度">${DIFFS.map(([k, n, c]) => `<button role="radio" aria-checked="${k === diff}" class="${k === diff ? 'on' : ''}" data-diff="${k}" style="--c:${c}"><b>${S.diffs[k].lv}</b><small>${n}</small></button>`).join('')}</div>
          <div class="rg-boss-info" style="--c:${DIFFS.find(x => x[0] === diff)[2]}"><img src="${art(bossId(), 'avatar')}" alt=""><div><b>BOSS・${esc(CHARACTERS[bossId()].name)}<em>${B.label}</em></b><small>${B.desc}</small></div></div>
          ${utaLine()}
          <div class="rg-pv"><button data-a="pv" aria-pressed="${R.pv}"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><svg class="mute" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 6M21 9l-5 6"/></svg></button><span class="rg-pvl">前奏試聽</span><i class="rg-pvbar"><b id="rgPvBar"></b></i><output id="rgPvT">0:00</output><small>/ 0:${PV_LEN}</small></div>
          <p class="rg-how">${inCycle ? '這首歌本輪已計入美音碎片進度・' : ''}觸控：點擊音軌／長按／<b>滑動</b>（粉紅箭頭）・鍵盤：D F J K</p>
          <div class="rg-go"><button class="btn-gold" data-a="start">開始挑戰</button></div></div>
      </section></div>`;
    const W = el(); W.querySelectorAll('[data-song]').forEach(b => b.onclick = () => { songIx = +b.dataset.song; renderSelect(); });
    W.querySelectorAll('[data-diff]').forEach(b => b.onclick = () => { diff = b.dataset.diff; renderSelect(); });
    W.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { R.speed = Math.max(1, Math.min(10, R.speed + +b.dataset.sp)); SAVE.save(); renderSelect(); });
    W.querySelector('[data-a=hs]').onclick = () => { R.hs = !R.hs; SAVE.save(); renderSelect(); if (R.hs) { ensureCtx(); hitSnd('p'); } };
    W.querySelector('[data-a=pv]').onclick = () => { R.pv = !R.pv; SAVE.save(); if (R.pv) pvStart(S); else pvStop(); };
    W.querySelectorAll('[data-a=synth]').forEach(sy => sy.onclick = () => { if (synthUta()) renderSelect(); });
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
    const C = CHARACTERS, lead = [(SAVE.data.lineup || [])[0], SAVE.data.player].find(x => x && C[x]) || 'luffy', foe = bossId(), B = BOSS_CFG[dk];
    const notes = S.diffs[dk].notes.map(([t, l, k, d], i) => ({ i, t, l, k, d, hit: 0, res: null, holding: false, done: false }));
    const N = notes.length, base = N * B.hp, beat = 60000 / (S.bpm || 120);
    G = { S, dk, B, notes, N, lead, foe, hp: 100, ehp: base, emax: base, combo: 0, maxCombo: 0, score: 0, cnt: { p: 0, g: 0, o: 0, m: 0 }, t: -COUNT * 1000, started: false, paused: false, over: false,
      speed: st().speed, fx: [], parts: [], beams: [0, 0, 0, 0], beamC: ['', '', '', ''], shake: 0, judge: null, press: [0, 0, 0, 0], pts: new Map(), defeated: false, raf: 0, src: null, t0: 0,
      beat, bOff: S.offset != null ? S.offset % beat : notes.length ? notes[0].t % beat : 0, lastBossHit: 0, lastAtk: 0, missPen: B.miss,
      /* BOSS 攻擊 */ nextAtk: (notes.length ? notes[0].t : 0) + B.every * 1000, atkIx: 0, warn: null, fogUntil: 0, staffUntil: 0, spd: 1, waves: [], demon: false, endT: notes.length ? notes[notes.length - 1].t : 0 };
    const W = el();
    W.innerHTML = `<div class="rg-play rg3d dk-${dk}" style="--jk:url('${absUrl(S.jacket)}')">
      <div class="rg-bg" aria-hidden="true"></div>
      <div class="rg-stage" aria-hidden="true">
        <figure class="rg-boss"><img src="${art(foe, 'image')}" alt=""></figure>
        <figure class="rg-cap"><img src="${art(lead, 'image')}" alt=""></figure>
      </div>
      <canvas class="rg-cv"></canvas>
      <div class="rg-flash" id="rgFlash" aria-hidden="true"></div>
      <header class="rg-hud">
        <div class="rg-foe"><img id="rgFoeAv" src="${art(foe, 'avatar')}" alt=""><div><small>BOSS・${esc(C[foe].name)}</small><div class="rg-bar foe"><i id="rgEhp"></i></div></div></div>
        <div class="rg-mid"><b>${esc(S.title)}</b><small class="rg-dpill" style="--c:${DIFFS.find(x => x[0] === dk)[2]}">${DIFFS.find(x => x[0] === dk)[1]} ${S.diffs[dk].lv}</small><div class="rg-score" id="rgScore">0</div></div>
        <div class="rg-me"><div><small>${esc(C[lead].name)}・LIFE</small><div class="rg-bar me"><i id="rgHp"></i></div></div><img src="${art(lead, 'avatar')}" alt=""></div>
      </header>
      <button class="rg-pause" aria-label="暫停"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button>
      <div class="rg-combo" id="rgCombo" aria-live="off"><b>0</b><small>COMBO</small></div>
      <div class="rg-dmgs" id="rgDmgs" aria-hidden="true"></div>
      <div class="rg-warn" id="rgWarn" aria-live="assertive"></div>
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
  /* 版面：半立體音軌永遠水平置中（近端寬 lw、遠端寬 lw×SF）；左邊 BOSS、右邊隊長立繪（直式手機放在音軌遠端兩側） */
  const SF = .3, PK = 1 / SF - 1; /* 遠端縮放與透視係數 */
  function fit() {
    if (!G) return; const cv = G.cv, r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); G.dpr = dpr; G.W = r.width; G.H = r.height;
    const land = r.width > r.height * 1.05, hud = G.root.querySelector('.rg-hud'), hb = hud ? hud.getBoundingClientRect().bottom - r.top : 96;
    G.lw = land ? Math.min(640, r.width * .5, r.height * 1.1) : Math.min(600, r.width - 16); G.cxm = r.width / 2; G.lx = Math.round(G.cxm - G.lw / 2);
    G.jy = Math.round(r.height * (land ? .86 : .84)); G.top = Math.max(land ? 56 : 96, Math.round(hb + 8));
    G.farY = Math.round(G.top + (G.jy - G.top) * (land ? .02 : .1)); G.hz = (G.farY - G.jy * SF) / (1 - SF); G.sH = (r.height - G.hz) / (G.jy - G.hz);
    const R = G.root.style, side = (r.width - G.lw * SF) / 2; G.root.classList.toggle('portrait', !land);
    R.setProperty('--lx', G.lx + 'px'); R.setProperty('--lw', G.lw + 'px'); R.setProperty('--jy', G.jy + 'px'); R.setProperty('--top', G.top + 'px'); R.setProperty('--far', G.farY + 'px');
    R.setProperty('--aw', Math.round(land ? Math.min((r.width - G.lw) / 2 + G.lw * .12, r.height * .8) : Math.min(side + 24, r.width * .5)) + 'px');
    R.setProperty('--cy', Math.round(G.farY + (G.jy - G.farY) * .3) + 'px'); G.judgeY = Math.round(G.farY + (G.jy - G.farY) * .62); /* COMBO 在音軌上段、判定字在下段，不會重疊 */
  }
  addEventListener('resize', () => setTimeout(fit, 60));
  const sAt = z => 1 / (1 + z * PK), yAt = z => G.hz + (G.jy - G.hz) * sAt(z), xAt = (b, s) => G.cxm + (b / 4 - .5) * G.lw * s;
  const laneX = l => xAt(l + .5, 1);
  function laneOf(x, y) { const s = Math.max(SF, Math.min(G.sH || 1.4, (y - G.hz) / (G.jy - G.hz))), u = (x - G.cxm) / (G.lw * s) + .5, k = Math.floor(u * 4); return k >= 0 && k < 4 ? k : -1; }
  const travel = () => (2600 - G.speed * 210) / G.spd; /* 音符從遠端滑到判定線的時間（毫秒）；五線譜束縛時加速 */
  /* 聲音實際播出的時間要扣掉裝置輸出延遲（藍牙耳機、手機） */
  function latency() { const l = ((actx && (actx.outputLatency || 0)) + (actx && (actx.baseLatency || 0))) * 1000; return l > 0 ? Math.min(250, l) : 30; }
  function songTime() { if (!G.started) return G.t; return (actx.currentTime - G.t0) * 1000 - G.lat; }
  function beginAudio(at) { const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = musicVol(); s.buffer = G.buf; s.connect(g); g.connect(actx.destination); G.lat = latency();
    G.t0 = actx.currentTime + .06 - at / 1000; s.start(actx.currentTime + .06, Math.max(0, at / 1000)); G.src = s; G.started = true; s.onended = () => { if (G && !G.paused && !G.over) finish(false); }; }
  function loop() {
    if (!G || G.over) return; G.raf = requestAnimationFrame(loop);
    if (G.paused) return draw();
    if (!G.started) { const left = COUNT - (performance.now() - G.cdStart) / 1000, c = $('rgCount'); if (c) { const n = Math.ceil(left); if (c.textContent !== String(left > 0 ? n : '')) { c.textContent = left > 0 ? n : ''; c.className = 'rg-count' + (left > 0 && n <= 3 ? ' big' : ''); } }
      G.t = -Math.max(0, left) * 1000 * .3; /* 倒數時音符停在遠方，最後一刻開始滑過來 */
      if (left <= 0) { if (actx.state === 'suspended') actx.resume(); beginAudio(0); if (c) c.textContent = ''; } }
    else G.t = songTime();
    G.spd += ((G.started && G.t < G.staffUntil ? G.B.spd : 1) - G.spd) * .08;
    if (G.started) bossTick();
    if (G.auto && G.started) for (const n of G.notes) { if (n.t - G.t > 40) break; if (n.hit || n.done || n.pending) continue; if (G.t >= n.t - G.auto) { n.hit = 1; G.press[n.l] = 1; if (n.k === 1) n.holding = true; award(n, judgeOf(n.t - G.t) || 'o'); } } /* 測試用自動演奏 */
    /* 判定：沒打到的音符過線視為失誤；長按中鬆開過早 */
    for (const n of G.notes) { if (n.done) continue; if (n.t - G.t > 1000) break;
      if (!n.hit && G.t - n.t > WIN.o) { n.done = true; miss(n); continue; }
      if (n.k === 1 && n.hit && n.holding && G.t >= n.t + n.d - 60) { n.done = true; n.holding = false; tailOk(n); }
      if (n.k === 1 && n.hit && n.holding && Math.random() < .35) spark(laneX(n.l), G.jy, LANE_COL[n.l], 1, 2);
      if (n.k === 1 && n.hit && !n.holding && !n.done) { n.done = true; }
      if (n.k !== 1 && n.hit) n.done = true; }
    if (G && !G.over) draw();
  }

  /* ---------- BOSS 美音的攻擊 ---------- */
  function bossTick() {
    if (G.defeated || G.over || G.t > G.endT - 3000) { if (G.warn && G.t > G.warn.at + 400) setWarn(null); return; }
    const lead = G.beat * 2;
    if (!G.warn && G.t >= G.nextAtk - lead) { const L = G.B.atk, kind = L.length === 1 ? L[0] : (G.atkIx % L.length === 0 ? 'wave' : L[1 + Math.floor(Math.random() * (L.length - 1))]); G.atkIx++;
      G.warn = { kind, at: G.nextAtk }; setWarn(kind); G.bossEl && G.bossEl.classList.add('cast'); }
    if (G.warn && G.t >= G.warn.at && !G.warn.done) { G.warn.done = true; bossAttack(G.warn.kind); G.nextAtk = G.warn.at + G.B.every * 1000 * (G.demon ? .72 : 1) * (.9 + Math.random() * .2); }
    if (G.warn && G.warn.done && G.t > G.warn.at + 700) { G.warn = null; setWarn(null); G.bossEl && G.bossEl.classList.remove('cast'); }
  }
  function setWarn(kind) { const w = $('rgWarn'); if (!w) return; if (!kind) { w.className = 'rg-warn'; return; }
    w.innerHTML = `<i aria-hidden="true">!</i><span>${esc(CHARACTERS[G.foe].name)}・${ATK_NAME[kind]}</span>`; w.className = 'rg-warn on k-' + kind; }
  function bossAttack(kind) {
    const now = performance.now();
    if (kind === 'wave') { const dmg = G.B.wave + (G.demon ? 2 : 0), guard = G.combo >= 30, d = guard ? Math.ceil(dmg / 2) : dmg; G.hp = Math.max(0, G.hp - d);
      G.waves.push({ t0: now }); flash('wave'); G.shake = Math.max(G.shake, 12); hitSnd('m');
      const Cp = G.capEl; if (Cp) { Cp.classList.remove('atk', 'hurt'); void Cp.offsetWidth; Cp.classList.add('hurt'); }
      G.judge = { txt: guard ? 'GUARD' : `-${d} LIFE`, c: guard ? '#8affb0' : '#ff6a9a', a: 1, sub: guard ? `COMBO ${G.combo} 護盾：傷害減半（-${d}）` : '歌聲衝擊！' }; hud(); if (G.hp <= 0) finish(true); }
    else if (kind === 'fog') { G.fogUntil = G.t + 4200; G.fogAt = performance.now(); banner('催眠歌聲：遠方被音符之霧遮住了！', 'boss'); }
    else if (kind === 'staff') { G.staffUntil = G.t + 4500; G.staffAt = performance.now(); banner('五線譜束縛：音符加速！', 'boss'); }
  }
  function demonCheck() { if (!G.B.demon || G.demon || G.defeated || G.ehp > G.emax * .5) return; G.demon = true; G.root.classList.add('demon');
    const im = G.bossEl && G.bossEl.querySelector('img'); if (im) { im.src = DEMON_IMG; G.bossEl.classList.add('demon'); } const av = $('rgFoeAv'); if (av) av.src = DEMON_FACE;
    flash('demon'); G.shake = 18; banner('魔王降臨！美音召喚了魔王', 'boss big'); G.nextAtk = Math.min(G.nextAtk, G.t + G.beat * 6); }

  function draw() {
    const { cx, dpr, W, H, lw, jy } = G; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (G.shake > .2) { cx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake); G.shake *= .86; } else G.shake = 0;
    const far = G.farY, tr = travel(), zOf = t => (t - G.t) / tr, sH = G.sH;
    const ph = G.started ? (((G.t - G.bOff) % G.beat) + G.beat) % G.beat / G.beat : 1, pulse = Math.pow(1 - ph, 3); /* 節拍脈動 */
    const heat = Math.min(1, G.combo / 100), demon = G.demon;
    const quad = (b0, b1, s0, s1, y0, y1) => { cx.beginPath(); cx.moveTo(xAt(b0, s0), y0); cx.lineTo(xAt(b1, s0), y0); cx.lineTo(xAt(b1, s1), y1); cx.lineTo(xAt(b0, s1), y1); cx.closePath(); };
    /* 音軌：梯形（遠窄近寬） */
    cx.save(); const g = cx.createLinearGradient(0, far, 0, H); g.addColorStop(0, demon ? 'rgba(40,6,30,.35)' : 'rgba(8,10,30,.3)'); g.addColorStop(.25, demon ? 'rgba(30,4,24,.72)' : 'rgba(8,10,30,.7)'); g.addColorStop(1, demon ? 'rgba(24,2,16,.9)' : 'rgba(8,10,30,.9)');
    cx.fillStyle = g; quad(0, 4, SF, sH, far, H); cx.fill();
    /* 每條音軌的淡色底 */
    for (let l = 0; l < 4; l++) { const lg = cx.createLinearGradient(0, far, 0, jy); lg.addColorStop(0, hexA(LANE_COL[l], 0)); lg.addColorStop(1, hexA(LANE_COL[l], .08)); cx.fillStyle = lg; quad(l + .08, l + .92, SF, 1, far, jy); cx.fill(); }
    /* 節拍線：隨歌曲往近處流動，越近越寬越亮 */
    if (G.started) { const b0 = Math.ceil((G.t - G.bOff) / G.beat) * G.beat + G.bOff; for (let bt = b0; bt < G.t + tr; bt += G.beat) { const z = zOf(bt); if (z > 1) break; const s = sAt(z), yy = yAt(z), bar = Math.round((bt - G.bOff) / G.beat) % 4 === 0;
      cx.fillStyle = bar ? `rgba(160,200,255,${.08 + .14 * s})` : `rgba(160,200,255,${.03 + .05 * s})`; const th = (bar ? 3 : 1) * s; cx.fillRect(xAt(0, s), yy - th / 2, lw * s, th); } }
    /* 分隔線與發光邊框 */
    for (let l = 0; l <= 4; l++) { const edge = l === 0 || l === 4; cx.strokeStyle = edge ? (demon ? `rgba(255,${Math.round(90 + 60 * pulse)},200,${.55 + .4 * pulse})` : `rgba(${Math.round(160 + 95 * heat)},${Math.round(200 + 20 * heat)},${Math.round(255 - 150 * heat)},${.5 + .4 * pulse})`) : 'rgba(160,200,255,.18)';
      cx.lineWidth = edge ? 2 + 2 * pulse : 1; if (edge) { cx.shadowColor = demon ? '#ff4ad2' : heat > .5 ? '#ffd04a' : '#7fdcff'; cx.shadowBlur = 8 + 14 * pulse; }
      cx.beginPath(); cx.moveTo(xAt(l, SF), far); cx.lineTo(xAt(l, sH), H); cx.stroke(); cx.shadowBlur = 0; }
    /* 遠端光暈（音符的出口） */
    { const rg = cx.createRadialGradient(G.cxm, far, 2, G.cxm, far, lw * SF * .9); rg.addColorStop(0, demon ? 'rgba(255,120,220,.55)' : 'rgba(170,220,255,.5)'); rg.addColorStop(1, 'rgba(170,220,255,0)'); cx.fillStyle = rg; cx.fillRect(G.cxm - lw * SF, far - lw * SF * .5, lw * SF * 2, lw * SF); }
    for (let l = 0; l < 4; l++) if (G.press[l] > 0) { const a = Math.min(1, G.press[l]); const lg = cx.createLinearGradient(0, jy, 0, far + (jy - far) * .3); lg.addColorStop(0, hexA(LANE_COL[l], .32 * a)); lg.addColorStop(1, hexA(LANE_COL[l], 0)); cx.fillStyle = lg; quad(l, l + 1, SF, 1, far, jy); cx.fill(); G.press[l] = Math.max(0, G.press[l] - .07); }
    /* 打中時的光柱 */
    cx.globalCompositeOperation = 'lighter';
    for (let l = 0; l < 4; l++) if (G.beams[l] > 0) { const a = G.beams[l], c = G.beamC[l]; const lg = cx.createLinearGradient(0, jy, 0, far); lg.addColorStop(0, hexA(c, .55 * a)); lg.addColorStop(.5, hexA(c, .12 * a)); lg.addColorStop(1, hexA(c, 0)); cx.fillStyle = lg;
      const sh = (1 - a) * .25; quad(l + sh, l + 1 - sh, SF, 1, far, jy); cx.fill(); cx.fillStyle = hexA('#ffffff', .35 * a); const zt = 1 - a; quad(l + .42, l + .58, sAt(zt), 1, yAt(zt), jy); cx.fill(); G.beams[l] = Math.max(0, a - .08); }
    cx.globalCompositeOperation = 'source-over';
    /* 判定線與判定圈 */
    cx.shadowColor = demon ? '#ff6ad5' : '#7fdcff'; cx.shadowBlur = 14 + 16 * pulse; cx.strokeStyle = '#dff6ff'; cx.lineWidth = 3 + 2 * pulse; cx.beginPath(); cx.moveTo(xAt(0, 1), jy); cx.lineTo(xAt(4, 1), jy); cx.stroke(); cx.shadowBlur = 0;
    for (let l = 0; l < 4; l++) { const pr = G.press[l], rx = (lw / 8 - 8) * (1 + .12 * pr), ry = Math.max(8, rx * .3) + 4 * pr; cx.shadowColor = LANE_COL[l]; cx.shadowBlur = 10 + 10 * pr; cx.strokeStyle = hexA(LANE_COL[l], .75 + .25 * pr); cx.lineWidth = 2.5 + 2 * pr;
      cx.beginPath(); cx.ellipse(laneX(l), jy, rx, ry, 0, 0, Math.PI * 2); cx.stroke(); cx.shadowBlur = 0; cx.strokeStyle = hexA('#ffffff', .35 + .4 * pr); cx.lineWidth = 1; cx.beginPath(); cx.ellipse(laneX(l), jy, rx * .66, ry * .66, 0, 0, Math.PI * 2); cx.stroke();
      if (pr > .3) { cx.fillStyle = hexA(LANE_COL[l], .25 * pr); cx.beginPath(); cx.ellipse(laneX(l), jy, rx, ry, 0, 0, Math.PI * 2); cx.fill(); } }
    cx.restore();
    /* 音符（越遠越小、遠端淡入） */
    for (const n of G.notes) {
      if (n.done && !(n.k === 1 && n.holding)) continue; const z = zOf(n.t); if (z > 1.02) break; const zz = Math.max(z, -(sH - 1) / PK * .9); if (z < -.35 && n.k !== 1) continue;
      const s = sAt(zz), yy = yAt(zz), x = xAt(n.l + .5, s), nw = (lw / 4 - 12) * s, c = n.k === 2 ? '#ff4ad2' : n.k === 1 ? '#b06bff' : LANE_COL[n.l];
      cx.globalAlpha = Math.min(1, Math.max(0, (1.02 - z) / .14));
      if (n.k === 1) { const z2 = Math.min(1, zOf(n.t + n.d)), z1 = n.hit ? 0 : Math.max(0, z); if (z2 > z1) { const s1 = sAt(z1), s2 = sAt(z2); cx.fillStyle = hexA(c, n.hit ? .6 : .35); cx.strokeStyle = hexA(c, .9); cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(xAt(n.l + .5, s2) - nw / s * s2 * .3, yAt(z2)); cx.lineTo(xAt(n.l + .5, s2) + nw / s * s2 * .3, yAt(z2)); cx.lineTo(xAt(n.l + .5, s1) + nw / s * s1 * .3, yAt(z1)); cx.lineTo(xAt(n.l + .5, s1) - nw / s * s1 * .3, yAt(z1)); cx.closePath(); cx.fill(); cx.stroke(); }
        if (!n.hit) chevron(cx, x, yy, nw, c, s); }
      else if (n.k === 2) flick(cx, x, yy, nw, c, s);
      else chevron(cx, x, yy, nw, c, s);
      cx.globalAlpha = 1;
    }
    /* 催眠歌聲：遠端被音符之霧遮住 */
    if (G.t < G.fogUntil + 600 && G.fogAt != null) { const a = Math.min(1, (performance.now() - G.fogAt) / 300, (G.fogUntil + 600 - G.t) / 600); if (a > 0) { const zf = 1 - G.B.fog, yb = yAt(zf), fg = cx.createLinearGradient(0, far - 20, 0, yb + 40);
      fg.addColorStop(0, `rgba(70,18,90,${.97 * a})`); fg.addColorStop(.78, `rgba(90,24,110,${.94 * a})`); fg.addColorStop(1, 'rgba(90,24,110,0)'); cx.fillStyle = fg; quad(-.3, 4.3, SF, sAt(zf), far - 20, yb + 40); cx.fill();
      cx.font = `900 ${Math.round(lw * .05)}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = `rgba(255,190,240,${.7 * a})`;
      for (let i = 0; i < 7; i++) { const k = ((G.t / 1600 + i / 7) % 1), zz = 1 - G.B.fog * k, s = sAt(zz); cx.fillText(i % 2 ? '♪' : '♫', xAt((i * 1.37) % 4 + .2, s), yAt(zz) - 8 * Math.sin(G.t / 300 + i)); } } }
    /* 五線譜束縛：五條發光的譜線橫跨音軌 */
    if (G.t < G.staffUntil + 400 && G.staffAt != null) { const a = Math.min(1, (performance.now() - G.staffAt) / 250, (G.staffUntil + 400 - G.t) / 400); if (a > 0) { cx.save(); cx.globalCompositeOperation = 'lighter'; cx.strokeStyle = `rgba(255,120,220,${.55 * a})`; cx.shadowColor = '#ff6ad5'; cx.shadowBlur = 10; cx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { const z = .35 + i * .08, s = sAt(z), yy = yAt(z); cx.beginPath(); for (let k = 0; k <= 24; k++) { const b = -.2 + 4.4 * k / 24, xx = xAt(b, s), wv = Math.sin(k * .7 + G.t / 180 + i) * 4 * s; k ? cx.lineTo(xx, yy + wv) : cx.moveTo(xx, yy + wv); } cx.stroke(); } cx.restore(); } }
    /* 擴散光環 */
    G.fx = G.fx.filter(f => (f.a -= .045) > 0);
    cx.globalCompositeOperation = 'lighter';
    for (const f of G.fx) { const k = 1 - f.a; cx.globalAlpha = f.a; cx.strokeStyle = f.c; cx.lineWidth = 2 + 4 * f.a; cx.beginPath(); cx.ellipse(f.x, jy, k * (f.big ? 70 : 44) + 12, (k * (f.big ? 70 : 44) + 12) * .4, 0, 0, Math.PI * 2); cx.stroke();
      if (f.big) { cx.lineWidth = 2; cx.beginPath(); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + f.r, r1 = 14 + k * 30, r2 = 30 + k * 90; cx.moveTo(f.x + Math.cos(an) * r1, jy + Math.sin(an) * r1 * .5); cx.lineTo(f.x + Math.cos(an) * r2, jy + Math.sin(an) * r2 * .5); } cx.stroke(); } }
    /* 歌聲衝擊：從美音身上擴散的衝擊波 */
    const now = performance.now(); G.waves = G.waves.filter(w => now - w.t0 < 700);
    for (const w of G.waves) { const k = (now - w.t0) / 700, bx = G.W * (G.root.classList.contains('portrait') ? .22 : .16), by = G.top + (jy - G.top) * .2, R = Math.hypot(G.W, G.H) * k;
      cx.globalAlpha = 1 - k; cx.strokeStyle = demon ? '#ff4a9a' : '#ff8ae0'; cx.lineWidth = 14 * (1 - k) + 2; cx.beginPath(); cx.arc(bx, by, R, 0, Math.PI * 2); cx.stroke(); cx.lineWidth = 3; cx.beginPath(); cx.arc(bx, by, R * .8, 0, Math.PI * 2); cx.stroke(); }
    /* 粒子 */
    G.parts = G.parts.filter(p => (p.life -= p.dl) > 0);
    for (const p of G.parts) { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .97; cx.globalAlpha = Math.min(1, p.life * 1.4); cx.fillStyle = p.c; const s = p.s * (.5 + p.life * .5); cx.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    /* 判定字：放大後彈回 */
    if (G.judge && (G.judge.a -= .022) > 0) { const J = G.judge, k = Math.max(0, J.a - .82) / .18, sc = 1 + .55 * k, fs = Math.round(Math.min(44, lw / 9)); cx.save(); cx.globalAlpha = Math.min(1, J.a * 1.6);
      cx.translate(W / 2, G.judgeY - (1 - J.a) * 12); cx.scale(sc, sc); cx.font = `italic 900 ${fs}px Anton, Impact, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.lineWidth = 7; cx.lineJoin = 'round'; cx.strokeStyle = 'rgba(0,0,0,.75)'; cx.strokeText(J.txt, 0, 0); cx.shadowColor = J.c; cx.shadowBlur = 18; cx.fillStyle = J.c; cx.fillText(J.txt, 0, 0);
      if (J.sub) { cx.shadowBlur = 0; cx.font = `700 ${Math.round(fs * .34)}px system-ui, sans-serif`; cx.fillStyle = '#ffffff'; cx.fillText(J.sub, 0, fs * .66); } cx.restore(); }
  }
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
  function roundRect(c, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  /* 點擊音符：霓虹膠囊＋向下箭頭（s＝透視縮放） */
  function chevron(c, x, y, w, col, s) { s = s || 1; c.save(); c.shadowColor = col; c.shadowBlur = 16 * s; c.fillStyle = hexA(col, .3); c.strokeStyle = col; c.lineWidth = 2 * s; roundRect(c, x - w / 2, y - 12 * s, w, 24 * s, 12 * s); c.fill(); c.stroke();
    c.lineWidth = 5 * s; c.lineJoin = 'round'; c.lineCap = 'round'; const hw = w * .3; c.beginPath(); c.moveTo(x - hw, y - 7 * s); c.lineTo(x, y + 5 * s); c.lineTo(x + hw, y - 7 * s); c.stroke(); c.shadowBlur = 0; c.strokeStyle = '#ffffff'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x - hw, y - 7 * s); c.lineTo(x, y + 5 * s); c.lineTo(x + hw, y - 7 * s); c.stroke(); c.restore(); }
  /* 滑動音符：雙箭頭 */
  function flick(c, x, y, w, col, s) { s = s || 1; c.save(); c.shadowColor = col; c.shadowBlur = 18 * s; c.fillStyle = hexA(col, .35); roundRect(c, x - w / 2, y - 15 * s, w, 30 * s, 12 * s); c.fill(); c.strokeStyle = col; c.lineWidth = 2 * s; c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 4 * s; c.lineCap = 'round'; c.lineJoin = 'round'; for (const dx of [-10, 6]) { c.beginPath(); c.moveTo(x + (dx - 8) * s, y - 9 * s); c.lineTo(x + (dx + 4) * s, y - 1 * s); c.lineTo(x + (dx - 8) * s, y + 7 * s); c.stroke(); } c.restore(); }
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
    bossHit(dmg, j); demonCheck();
    if (!G.defeated && G.ehp <= 0) { G.defeated = true; G.bossEl && G.bossEl.classList.add('down'); flash('gold'); G.shake = 16; banner(`擊敗了 ${CHARACTERS[G.foe].name}！`, 'win'); setWarn(null); }
    if (G.combo % 50 === 0) { flash('gold'); G.shake = Math.max(G.shake, 10); banner(`${G.combo} COMBO!`); try { typeof SFX !== 'undefined' && SFX.play('coin'); } catch (e) { } }
    hud(true);
  }
  /* BOSS 受擊：閃白抖動＋傷害數字；隊長出招 */
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
    cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } const r = cv.getBoundingClientRect(), l = laneOf(e.clientX - r.left, e.clientY - r.top); if (l < 0) return;
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
    const first = !prev || !prev.cleared; const rw = { berry: failed ? 300 : { SSS: 12000, SS: 9000, S: 7000, A: 5000, B: 3500, C: 2500, D: 1500, E: 800 }[rank] * ({ easy: 1, normal: 1.6, hard: 2.4 }[g.dk]), tokens: !failed && first ? { easy: 3, normal: 6, hard: 12 }[g.dk] : 0 };
    if (isNew) R.best[k] = { score, rank, fc, acc: Math.round(acc * 1000) / 10, combo: g.maxCombo, cleared: !failed || (prev && prev.cleared) }; else if (!failed) prev.cleared = true;
    const up = utaProgress(g.S.id, rank, failed), U = R.uta;
    SAVE.save(); if (rw.berry && typeof addBerry === 'function') addBerry(Math.round(rw.berry)); if (rw.tokens) { SAVE.data.tokens += rw.tokens; SAVE.save(); if (typeof coins === 'function') coins(); }
    const S = g.S, D = DIFFS.find(x => x[0] === g.dk);
    const utaMsg = up.got ? `<b class="got">+${up.got} 美音碎片！</b><small>${U.shards} / ${UTA.need}${!hasUta() && U.shards >= UTA.need ? '・可以合成美音了' : ''}</small>`
      : up.added ? `<b>本輪 S 以上 ${U.cycle.length} / ${UTA.songs} 首</b><small>再 ${UTA.songs - U.cycle.length} 首不同的歌拿到 S 以上，就能獲得 ${UTA.per} 片</small>`
      : up.dup ? `<b>本輪已計入這首歌</b><small>換一首還沒拿過 S 的歌（${U.cycle.length} / ${UTA.songs}）</small>`
      : `<b>本輪 S 以上 ${U.cycle.length} / ${UTA.songs} 首</b><small>拿到 S 以上評分才會計入</small>`;
    el().innerHTML = `<div class="rg-res" style="--jk:url('${absUrl(S.jacket)}')"><div class="rg-bg" aria-hidden="true"></div>
      <section class="rg-rcard">
        <header><img src="${S.sq}" alt=""><div><small>${failed ? '挑戰失敗' : '挑戰完成'}</small><b>${esc(S.title)}</b><span><em style="--c:${D[2]}">${D[1]} ${S.diffs[g.dk].lv}</em>${esc(S.artist)}</span></div></header>
        <div class="rg-rank" style="--rc:${RANK_COL[rank]}"><b>${rank}</b>${fc ? `<i>${cnt.p === N ? 'ALL PERFECT' : 'FULL COMBO'}</i>` : ''}${isNew ? '<i class="new">NEW RECORD</i>' : ''}</div>
        <div class="rg-sc"><small>SCORE</small><b>${score.toLocaleString()}</b><span>準確率 ${(acc * 100).toFixed(1)}%</span></div>
        <dl class="rg-rows">
          <div><dt>最佳時機（PERFECT）</dt><dd style="color:#ffe866">${cnt.p}</dd></div><div><dt>GREAT</dt><dd style="color:#5ad8ff">${cnt.g}</dd></div>
          <div><dt>GOOD</dt><dd style="color:#8affb0">${cnt.o}</dd></div><div><dt>失誤數（MISS）</dt><dd style="color:#ff6a7a">${cnt.m}</dd></div>
          <div><dt>最高 COMBO</dt><dd>${g.maxCombo}</dd></div><div><dt>BOSS・${esc(CHARACTERS[g.foe].name)}${g.demon ? '（魔王）' : ''}</dt><dd>${g.defeated ? '已擊敗' : `剩 ${Math.round(g.ehp / g.emax * 100)}%`}</dd></div>
        </dl>
        <div class="rg-uta-res"><img src="${art(bossId(), 'avatar')}" alt=""><div>${utaMsg}</div></div>
        <div class="rg-rew"><span>獎勵</span><b><i class="berry-ico">B</i>${Math.round(rw.berry).toLocaleString()}</b>${rw.tokens ? `<b><i class="coin-ico"></i>×${rw.tokens}<small>首次通關</small></b>` : ''}</div>
        <div class="rg-ract"><button class="btn-ghost" data-r="sel">選曲</button><button class="btn-gold" data-r="again">再挑戰</button></div>
      </section></div>`;
    view = 'result'; const W = el(); W.querySelector('[data-r=sel]').onclick = () => { view = 'select'; renderSelect(); }; W.querySelector('[data-r=again]').onclick = () => startGame(S, g.dk);
    try { if (typeof SFX !== 'undefined') SFX.play(failed ? 'lose' : 'rare'); } catch (e) { }
  }
  window.RHYTHM = { open, close, _g: () => G, _finish: finish, _hit: (l) => hitLane(l, 'test', 'test'), _auto: ms => { if (G) G.auto = ms; }, _pv: () => pv && { id: pvId, t: pv.currentTime, paused: pv.paused, vol: pv.volume },
    _atk: k => G && bossAttack(k), _warn: k => G && setWarn(k), _demon: () => { if (G) { G.ehp = G.emax * .49; demonCheck(); hud(); } }, BOSS_CFG, _utaProgress: utaProgress };

  /* ---------- 角色背包「碎片」分頁：加上美音（歌姬挑戰） ---------- */
  const rsp = window.renderShardPane;
  window.renderShardPane = function (el) {
    if (rsp) rsp.apply(this, arguments); if (!el || !CHARACTERS[BOSS] || !SAVE.data) return;
    const U = st().uta, own = hasUta(), ok = !own && U.shards >= UTA.need, pct = Math.min(100, U.shards / UTA.need * 100), c = CHARACTERS[BOSS];
    const sec = document.createElement('section'); sec.className = 'sd-group sd-uta';
    sec.innerHTML = `<h4><span>${NAME}</span><small class="sd-ph live">常駐</small></h4><article class="sd-card ${ok ? 'ready' : ''} ${own ? 'own' : ''}" style="--c:#ff8ae0">
      <img class="sd-icon" src="${c.avatar}" alt=""><div class="sd-head"><span class="sd-rar">${CHAR_RARITY[BOSS] || 'SSR'}</span><b>${c.name}</b><small>S 以上不重複歌曲 ${U.cycle.length}/${UTA.songs} 首 → +${UTA.per} 片</small></div>
      <div class="sd-prog"><div class="sd-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${UTA.need}" aria-valuenow="${Math.min(U.shards, UTA.need)}"><i style="width:${pct}%"></i></div><span><b>${U.shards}</b> / ${UTA.need}</span></div>
      ${own ? '<span class="sd-state">✓ 已擁有</span>' : `<button class="sd-btn ${ok ? 'btn-gold' : ''}" data-uta="1" ${ok ? '' : 'disabled'}>${ok ? '合成角色' : `還差 ${UTA.need - U.shards} 片`}</button>`}</article>`;
    el.appendChild(sec); const b = sec.querySelector('[data-uta]'); if (b) b.onclick = () => { if (synthUta()) window.renderShardPane(el); };
  };

  /* ---------- 冒險選單：「歌姬挑戰」卡片 ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#lbModes .mode-grid'); if (!grid || grid.querySelector('[data-mode=rhythm]')) return;
    const b = document.createElement('button'); b.className = 'mode-card m-rhythm'; b.dataset.mode = 'rhythm';
    b.innerHTML = `<span class="mc-art" aria-hidden="true"></span><span class="mc-body"><b>${NAME}</b><small>跟著節奏擊敗歌姬美音，集滿碎片讓她加入船隊</small><em id="mdRhythm">新模式</em></span>`;
    b.addEventListener('click', () => { const s = $('lbModes'); if (s) { s.classList.remove('show'); s.setAttribute('aria-hidden', 'true'); } open(); });
    grid.appendChild(b);
    const R = () => { const e = $('mdRhythm'); if (!e || !SAVE.data) return; const U = st().uta; e.textContent = hasUta() ? `美音碎片 ${U.shards}` : `美音碎片 ${U.shards}/${UTA.need}`; };
    const om = window.openModes; if (om) window.openModes = function () { const r = om.apply(this, arguments); try { R(); } catch (e) { } return r; };
  });
})();
