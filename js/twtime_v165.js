/* v165 台灣時間（UTC+8）：所有「今天是哪一天」的判斷都用這裡，和玩家裝置的時區無關。
   - TW.now()：目前時間（毫秒）。連得上網路時會用伺服器回應的時間校正（js/timeguard.js 呼叫 TW.setServerOffset）。
   - TW.today()：台灣日期鍵 'YYYY-MM-DD'（每天台灣時間 00:00 換日）。TW.dateKey(ms) 同格式。
   - TW.midnight(y, m, d)：台灣時間該日 00:00 的絕對毫秒（月費、活動檔期用）。
   - TW.dayNum('YYYY-MM-DD')：日期鍵換成第幾天（整數，用來算「第幾天」，不受時區影響）。
   - TW.fmtMD(ms)：顯示用「M/DD」（台灣日期）。
   - TW.migrate(save)：舊版用裝置時區記錄的「今天」日期，第一次載入時換成台灣日期，避免時區不同的玩家今天被重複發獎或少一天。 */
(function () {
  const H8 = 8 * 3600e3;
  let off = 0; /* 伺服器時間 − 裝置時間 */
  const pad = n => String(n).padStart(2, '0');
  const now = () => Date.now() + off;
  const dateKey = t => { const d = new Date((t == null ? now() : t) + H8); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
  const midnight = (y, m, d) => Date.UTC(y, m - 1, d) - H8;
  const dayNum = s => { const p = String(s || '').split('-').map(Number); return p.length === 3 && p.every(isFinite) ? Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5) : NaN; };
  const fmtMD = t => { const d = new Date(t + H8); return `${d.getUTCMonth() + 1}/${pad(d.getUTCDate())}`; };
  /* 舊版的「今天」：裝置時區的 YYYY-MM-DD 與 toDateString() 兩種寫法 */
  const localKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function migrate(S) {
    if (!S || typeof S !== 'object' || S.twDate) return false;
    const d = new Date(), tw = dateKey(Date.now()), oldA = localKey(d), oldB = d.toDateString();
    let n = 0;
    const walk = (o, depth) => {
      if (!o || typeof o !== 'object' || depth > 6) return;
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string') { if ((v === oldA && oldA !== tw) || v === oldB) { o[k] = tw; n++; } }
        else if (v && typeof v === 'object') walk(v, depth + 1);
      }
    };
    walk(S, 0);
    S.twDate = { at: Date.now(), from: oldA, to: tw, n }; /* 只做一次 */
    return true;
  }
  window.TW = {
    now, today: () => dateKey(), dateKey, midnight, dayNum, fmtMD, migrate,
    setServerOffset(ms) { if (isFinite(ms)) off = ms; },
    offset: () => off
  };
})();
