/* v175 首次登入詢問帳號（使用者 11/08 03:40／04:16：先上 Google 與信箱，LINE 之後再說）：
   按「揚帆出航」時，這台裝置還沒有船員、也沒登入過雲端存檔（op_cloud_on）、也還沒問過（op_acct_asked）→ 先問「你有帳號嗎？」
   ‧「我有帳號，登入」→ 選 Google 或信箱登入（信箱登入／註冊用雲端存檔面板）。
       登入後雲端有存檔 → cloud.js 的 found() 顯示摘要，可載入或重新開始；雲端沒有存檔 → 直接進入新玩家流程（進度自動存到這個帳號）。
   ‧「我是新玩家，開始冒險」→ 原本的選入門船員流程；之後也能在「設定 → 雲端存檔」綁定帳號。
   LINE 登入需要 Firebase Identity Platform＋LINE Login 頻道，之後再加（SHOW_LINE）。 */
(function () {
  const SHOW_LINE = false;
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const hasCrew = () => { try { return !!Object.keys((SAVE.data && SAVE.data.roster) || {}).length; } catch (e) { return true; } };
  const inApp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent || '');
  let box = null, waiting = false;
  function shut() { if (box) box.remove(); box = null; }
  function show(html) {
    document.querySelectorAll('.acq').forEach(x => x.remove());
    box = document.createElement('div'); box.className = 'dl-wrap cl-wrap acq'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '帳號登入');
    box.innerHTML = `<div class="dl-card cl-card">${html}</div>`; document.body.appendChild(box); return box;
  }
  function newPlayer() { put('op_acct_asked', '1'); shut(); waiting = false; if (typeof _start === 'function') _start(); }
  function ask() {
    const b = show(`<header><h3>⚓ 歡迎來到海賊新時代</h3></header>
      <p class="acq-hero">你之前玩過、已經有帳號了嗎？<br>登入後就能接續原本的進度，換手機也不會重來。</p>
      <div class="acq-btns"><button class="btn-gold big" data-a="have">我有帳號，登入</button><button class="btn-ghost big" data-a="new">我是新玩家，開始冒險</button></div>
      <p class="acq-note">新玩家之後也能在「設定 → 雲端存檔」綁定帳號，進度會一起保存。</p>`);
    b.querySelector('[data-a=have]').onclick = pick; b.querySelector('[data-a=new]').onclick = newPlayer;
    try { CLOUD.sdk().catch(() => { }); } catch (e) { } /* 先下載登入程式，按 Google 登入時才不會被瀏覽器擋 */
  }
  function pick() {
    const b = show(`<header><h3>選擇登入方式</h3><button class="icon-btn sm" data-a="back" aria-label="返回">‹</button></header>
      <p class="acq-hero">用上次綁定的方式登入，就會找到你的存檔。</p>
      <div class="acq-btns"><button class="acq-g" data-a="g"><span class="acq-ico" aria-hidden="true">G</span>使用 Google 登入</button>
        ${SHOW_LINE ? '<button class="acq-line" data-a="line"><span class="acq-ico" aria-hidden="true">L</span>使用 LINE 登入</button>' : ''}
        <div class="acq-sep">或</div><button class="btn-ghost big" data-a="mail">信箱登入</button></div>
      <p class="acq-note">${inApp ? '你正在 LINE、Facebook 或 Instagram 的內建瀏覽器，這裡無法使用 Google 登入：請點右上角選單「用瀏覽器開啟」，或改用信箱登入。' : '在 LINE、Facebook 內建瀏覽器開啟時，Google 登入會被擋，請改用瀏覽器開啟或用信箱登入。'}</p>
      <p class="acq-status" aria-live="polite"></p>`);
    b.querySelector('[data-a=back]').onclick = ask;
    b.querySelector('[data-a=g]').onclick = () => { waiting = true; const st = b.querySelector('.acq-status'); if (st) st.textContent = '正在開啟 Google 登入…'; try { CLOUD.login(); } catch (e) { } watchCloud(b); };
    b.querySelector('[data-a=mail]').onclick = () => { waiting = true; shut(); try { CLOUD.open('login'); } catch (e) { } };
  }
  /* Google 登入的狀態訊息（失敗原因）顯示在這個視窗 */
  function watchCloud(b) { let n = 0; const t = setInterval(() => { if (!b.isConnected || ++n > 120) return clearInterval(t); const s = CLOUD._state && CLOUD._state(); const st = b.querySelector('.acq-status'); if (st && s && s.status) st.textContent = s.status; if (s && s.user) { clearInterval(t); shut(); } }, 500); }
  /* 登入後：雲端沒有存檔 → 新玩家流程；有存檔 → cloud.js found() 已經顯示 */
  addEventListener('cloud:none', () => { if (!waiting || hasCrew()) return; waiting = false; put('op_acct_asked', '1'); try { CLOUD.close(); } catch (e) { } if (typeof toast === 'function') toast('這個帳號還沒有存檔，開始新的冒險吧！進度會自動存到這個帳號', 'gold'); if (typeof _start === 'function') _start(); });
  addEventListener('cloud:fresh', () => { put('op_acct_asked', '1'); waiting = false; if (!hasCrew() && typeof _start === 'function') _start(); });
  let _start = null;
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof startGame !== 'function' || typeof CLOUD === 'undefined') return;
    _start = startGame;
    const btn = document.getElementById('startBtn');
    startGame = function () { if (!hasCrew() && !get('op_cloud_on') && !get('op_acct_asked') && !CLOUD.ready()) return ask(); return _start.apply(this, arguments); };
    if (btn) btn.onclick = startGame;
  });
  window.ACCT175 = { ask, pick };
})();
