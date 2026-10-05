/* 背景音樂：登入頁、勇者之塔、關卡挑戰、戰鬥只播放玩家提供的 MP3（不使用內建合成音樂）。
   同一時間只有一首；換畫面時先淡出再淡入，這些畫面也會關掉環境音與合成短音效，避免聲音重疊。 */
const MUSIC_TRACKS = { title: 'assets/music/title.mp3?v=53', lobby: 'assets/music/lobby.mp3?v=55', chart: 'assets/music/chart.mp3?v=55', tower: 'assets/music/tower.mp3?v=55', stage: 'assets/music/stage.mp3?v=99', battle: 'assets/music/battle.mp3?v=55' };
const MUSIC_BY_SCREEN = { loginScreen: 'title', modeScreen: 'lobby', exchangeScreen: 'lobby', towerScreen: 'tower', chapterScreen: 'chart', worldScreen: 'stage', battleScreen: 'battle' };
(function () {
  const FALLBACK = { title: 'title', battle: 'battle', lobby: 'map', chart: 'map', tower: 'map', stage: 'map' };
  const A_ = () => (typeof AUDIO !== 'undefined' ? AUDIO : null);
  const exists = {}, audio = new Audio(); audio.loop = true; audio.preload = 'auto';
  /* 所有背景音樂都循環播放：少數手機瀏覽器會忽略 loop，播完時再從頭播一次 */ audio.addEventListener('ended', () => { if (cur) { audio.currentTime = 0; audio.play().catch(() => { }); } });
  let cur = null, token = 0, fadeT = 0;
  /* v107：只有「確定檔案不存在」（404、拿到網頁）才判定沒有音樂；網路慢或暫時連不上時仍然嘗試播放，不會整場遊戲都沒聲音 */
  function check(key) { if (key in exists) return exists[key]; exists[key] = fetch(MUSIC_TRACKS[key], { method: 'HEAD', cache: 'no-store' }).then(r => (r.status === 404 || (r.headers.get('content-type') || '').includes('text/html')) ? false : true).catch(() => { delete exists[key]; return true; }); return exists[key]; }
  function vol() { const a = A_(), p = (a && a.pref) || {}; return p.muted ? 0 : (p.music ?? .55); }
  function fadeTo(target, ms) { clearInterval(fadeT); return new Promise(res => { const start = audio.volume, t0 = performance.now(); fadeT = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); audio.volume = Math.max(0, Math.min(1, start + (target - start) * k)); if (k >= 1) { clearInterval(fadeT); fadeT = 0; res(); } }, 30); }); }
  async function stopTrack() { if (!cur) return; cur = null; if (!audio.paused) { await fadeTo(0, 300); audio.pause(); } }
  async function onScreen(id) {
    const my = ++token, key = MUSIC_BY_SCREEN[id];
    const au = A_(); if (key && au) { if (au.stopSong) au.stopSong(); if (au.ambient) au.ambient(null); }
    if (!key) { await stopTrack(); return; }
    const ok = await check(key); if (my !== token) return;
    if (!ok) { await stopTrack(); const a2 = A_(); if (a2 && a2.playSong && my === token) a2.playSong(FALLBACK[key] || 'map'); return; } /* v107：MP3 不能用時改播內建合成音樂，不會整個畫面沒有背景音樂 */
    if (cur === key && !audio.paused) { audio.volume = vol(); return; }
    if (cur && !audio.paused) { await fadeTo(0, 300); if (my !== token) return; audio.pause(); }
    cur = key; audio.src = MUSIC_TRACKS[key]; audio.currentTime = 0; audio.volume = 0;
    try { await audio.play(); } catch (e) { return; }
    if (my === token) fadeTo(vol(), 600);
  }
  const playing = () => cur && !audio.paused;
  const screenNow = () => (typeof currentScreen !== 'undefined' ? currentScreen : null);
  window.MUSIC = { onScreen, playing, refresh: () => { if (cur) audio.volume = vol(); }, state: () => ({ track: cur, src: audio.src.split('/').pop(), paused: audio.paused, time: +audio.currentTime.toFixed(1), duration: Math.round(audio.duration || 0), volume: +audio.volume.toFixed(2) }) };
  /* v107：播放失敗（檔案錯誤）時改用內建合成音樂；載入卡住時自動重新載入 */
  audio.addEventListener('error', () => { const k = cur; if (!k) return; console.warn('背景音樂載入失敗', k, audio.error && audio.error.code); exists[k] = Promise.resolve(false); const au = A_(); cur = null; if (au && au.playSong) au.playSong(FALLBACK[k] || 'map'); });
  let lastT = -1, stuck = 0;
  setInterval(() => { if (!cur || audio.paused || document.hidden) { stuck = 0; return; } if (audio.currentTime === lastT && audio.readyState < 3) { if (++stuck >= 3) { stuck = 0; const t = audio.currentTime; audio.load(); audio.currentTime = t; audio.play().catch(() => { }); } } else stuck = 0; lastT = audio.currentTime; }, 2000);
  window.addEventListener('DOMContentLoaded', () => {
    const ss = window.showScreen; if (ss) window.showScreen = function (id) { const r = ss.apply(this, arguments); onScreen(id); return r; };
    /* 播放 MP3 時略過合成短音效與環境音，避免疊在背景音樂上 */
    const AU = A_(); if (AU) { const J = AU.jingle, A = AU.ambient; if (J) AU.jingle = function () { if (playing()) return; return J.apply(this, arguments); }; if (A) AU.ambient = function (k) { if (k && (playing() || MUSIC_BY_SCREEN[screenNow()])) return A.call(this, null); return A.apply(this, arguments); }; }
    setInterval(() => { if (playing() && !fadeT) audio.volume = vol(); }, 1000);
    /* 靜音開關與音量滑桿：立即同步到 MP3 */
    if (typeof window.syncSound === 'function') { const S = window.syncSound; window.syncSound = function () { const r = S.apply(this, arguments); if (playing() && !fadeT) audio.volume = vol(); return r; }; }
    if (AU && AU.setPref) { const SP = AU.setPref; AU.setPref = function () { const r = SP.apply(this, arguments); if (playing() && !fadeT) audio.volume = vol(); return r; }; }
    /* 首次互動後補播（瀏覽器需要使用者操作才允許播放聲音） */
    /* v107：不只第一次——之後每次操作時，只要該播的音樂停住了（例如被系統打斷、切回分頁）就補播 */
    ['pointerdown', 'keydown', 'touchend'].forEach(ev => window.addEventListener(ev, () => { if (document.hidden || vol() <= 0) return; if (cur && audio.paused) audio.play().then(() => fadeTo(vol(), 400)).catch(() => { }); else if (!cur && screenNow() && MUSIC_BY_SCREEN[screenNow()]) onScreen(screenNow()); }, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pause(); else if (cur) audio.play().catch(() => { }); });
  });
})();
