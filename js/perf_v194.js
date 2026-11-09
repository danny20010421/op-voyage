/* v194 效能與記憶體（使用者 11/10「全方面優化每一個系統，降低閃退、卡頓與效能低下」）
   這個檔案只放「跨系統」的處理；各系統自己的修正寫在原檔（都標 v194）：
   ・js/loader.js：載入時不再強制解碼每一張圖。
   ・js/fx.js、fx_v138.js、fx3d_v145.js、fx_vfx_v155.js：戰鬥特效的四層畫布沒東西時隱藏。
   ・js/seer.js：互動泡泡只在島上才每幀定位。
   ・js/e3three.js：手機的多重取樣 4 → 2。
   ・sw.js：帶版本號的檔案命中快取後不再每次重新下載。
   ・css/perf_v194.css：關閉的對話框不繪製、觸控裝置不做背景模糊。
   載入順序：所有程式之後（loader.js 之前）。 */
(function () {
  /* ① 離開島嶼畫面（進戰鬥、回大廳）時，把 3D 渲染器的後製緩衝縮到 1×1。
        島嶼的後製用半浮點＋多重取樣的緩衝，手機上一組就幾十 MB；以前進戰鬥後它還留著，戰鬥又另外開三個 WebGL 畫布，是劇情戰鬥閃退的高風險點。
        畫面隱藏時畫布寬高是 0，呼叫渲染器自己的 resize() 就會縮到 1×1；回到島上 world.js 每幀都會呼叫 resize()，自動配置回原尺寸。 */
  if (typeof showScreen === 'function') { const _ss = showScreen;
    showScreen = function (id) { const prev = typeof currentScreen !== 'undefined' ? currentScreen : ''; const r = _ss.apply(this, arguments);
      if (prev === 'worldScreen' && id !== 'worldScreen') setTimeout(() => { try { if (currentScreen !== 'worldScreen' && WORLD && !WORLD.running && WORLD.r && WORLD.r.composer && typeof WORLD.r.resize === 'function') WORLD.r.resize(); } catch (e) { } }, 400);
      return r; }; try { window.showScreen = showScreen; } catch (e) { } }
  /* 戰鬥的 2D 特效畫布一開始是空的：先隱藏，第一個特效（FXE.add）出現時 fx.js 會自己顯示 */
  try { const c = document.getElementById('bCanvas'); if (c) c.style.visibility = 'hidden'; } catch (e) { }
  /* ② 分頁切到背景：停掉仍在跑的戰鬥特效（回來時不會一口氣補畫），也讓瀏覽器有機會回收記憶體 */
  document.addEventListener('visibilitychange', () => { if (!document.hidden) return; try { if (typeof FXE !== 'undefined' && FXE.clear && (typeof battle === 'undefined' || !battle || battle.over || battle.gameOver)) FXE.clear(); } catch (e) { } });
})();
