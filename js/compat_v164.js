/* v164 跨裝置相容性（放在 <head> 最前面，比其他程式都早執行）
   1. 儲存空間被封鎖時（部分 App 內建瀏覽器、Safari「阻擋所有 Cookie」、無痕模式容量 0）：
      讀寫 localStorage 會丟出例外，原本會讓好幾個程式檔中途停止（戰鬥速度按鈕、首頁初始化）。
      改成暫存在記憶體裡讓遊戲照常進行，並提醒玩家「關掉頁面後進度不會保留」。
   2. 同時開了兩個分頁或視窗：後存檔的會蓋掉另一邊的進度。
      改成「最後打開的那一頁」才能存檔；舊的那一頁停止存檔並顯示提示，按下按鈕可以改在那一頁繼續。
   3. 在 <html> 加上 is-ios／is-inapp class，讓樣式可以針對 iPhone／iPad 與 App 內建瀏覽器微調。 */
(function () {
  /* ---------- 1. 儲存空間 ---------- */
  var mem = false;
  try { var k = '__op_ls_test'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); }
  catch (e) {
    var quota = e && (e.name === 'QuotaExceededError' || e.code === 22);
    /* 容量已滿（不是被封鎖）時保留原本的 localStorage：讀得到舊存檔，寫入失敗由 SAVE.save 提醒 */
    var readable = false; try { window.localStorage.getItem('op_voyage_save_v2'); readable = true; } catch (e2) { }
    if (!(quota && readable)) {
      var store = {};
      var M = {
        getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
        setItem: function (k, v) { store[String(k)] = String(v); },
        removeItem: function (k) { delete store[String(k)]; },
        clear: function () { store = {}; },
        key: function (i) { return Object.keys(store)[i] || null; }
      };
      Object.defineProperty(M, 'length', { get: function () { return Object.keys(store).length; } });
      try { Object.defineProperty(window, 'localStorage', { configurable: true, value: M }); mem = true; } catch (e3) { }
    }
  }
  window.__lsMemory = mem;

  /* ---------- 3. 裝置標記 ---------- */
  try {
    var ua = navigator.userAgent || '', de = document.documentElement;
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (ios) de.classList.add('is-ios');
    if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|; wv\)/i.test(ua)) de.classList.add('is-inapp');
  } catch (e) { }

  /* ---------- 共用：不可關閉的提示框（不依賴遊戲本身的樣式） ---------- */
  function notice(id, title, text, btn, onBtn, closable) {
    if (document.getElementById(id)) return;
    var w = document.createElement('div'); w.id = id; w.setAttribute('role', 'alertdialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', id + 'T');
    w.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(3,8,20,.82);font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
    w.innerHTML = '<div style="width:min(400px,100%);padding:24px;border-radius:16px;background:#0f1c36;border:1px solid rgba(235,199,126,.6);box-shadow:0 16px 48px rgba(0,0,0,.6);color:#f3ead6;text-align:center">' +
      '<h2 id="' + id + 'T" style="margin:0 0 8px;font-size:18px;line-height:1.5;color:#ffd77a"></h2><p style="margin:0 0 16px;font-size:14px;line-height:1.7"></p>' +
      '<div style="display:flex;gap:8px;justify-content:center;align-items:center"></div></div>';
    w.querySelector('h2').textContent = title; w.querySelector('p').textContent = text;
    var row = w.querySelector('div > div');
    var mk = function (label, primary, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.style.cssText = 'min-height:48px;padding:0 24px;border-radius:12px;font:inherit;font-size:15px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;' + (primary ? 'background:linear-gradient(180deg,#ffd77a,#e0a43a);color:#2a1700;border:0' : 'background:transparent;color:#f3ead6;border:1px solid rgba(235,199,126,.5)');
      b.onclick = fn; row.appendChild(b); return b; };
    if (closable) mk('知道了', false, function () { w.remove(); });
    mk(btn, true, onBtn); setTimeout(function () { try { row.lastChild.focus(); } catch (e) { } }, 50);
    document.body.appendChild(w);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (mem) setTimeout(function () {
      notice('opLsWarn', '這個瀏覽器不能保存進度', '目前的瀏覽器封鎖了網站儲存空間（常見於 App 內建瀏覽器或隱私設定），關掉頁面後進度就會消失。建議用 Safari 或 Chrome 開啟，或登入雲端存檔。', '我知道了', function () { var n = document.getElementById('opLsWarn'); if (n) n.remove(); }, false);
    }, 1500);

    /* ---------- 2. 多分頁 ---------- */
    if (mem) return;
    var OWN = 'op_tab_owner', me = Date.now().toString(36) + Math.random().toString(36).slice(2, 8), stale = false;
    try { localStorage.setItem(OWN, me); } catch (e) { }
    window.addEventListener('storage', function (e) {
      if (stale || e.key !== OWN || !e.newValue || e.newValue === me) return;
      stale = true; window.__tabStale = true;
      try {
        if (typeof SAVE !== 'undefined' && SAVE) {
          /* 先改成另一頁的最新進度（雲端同步若在這一頁觸發也只會上傳最新的），再停止這一頁的存檔 */
          try { SAVE.load(); } catch (er) { }
          SAVE.save = function () { };
        }
      } catch (er) { }
      try { if (typeof WORLD !== 'undefined' && WORLD && WORLD.stop) WORLD.stop(); } catch (er) { }
      notice('opTabStale', '遊戲已在其他分頁開啟', '為了避免兩邊的進度互相覆蓋，這個分頁已停止存檔。要在這裡繼續玩，請按下方按鈕重新載入（另一個分頁會改為停止存檔）。', '在這個分頁繼續', function () { location.reload(); }, false);
    });
  });
})();
