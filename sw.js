/* 離線快取：網頁本體優先抓最新版（沒網路時用快取），圖片、音樂、程式則先用快取、背景更新。
   所有資源網址都帶有 ?v= 版本號，改版後會自動換成新檔。 */
const CACHE = 'op-voyage-runtime';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
/* v164：程式與樣式（.js／.css）每次改版都會換 ?v=，舊版本留在快取裡只會越積越多（手機儲存空間被吃掉、Safari 可能整包清掉）。
   存入新版本時，把同一個檔案的其他版本刪掉；圖片與音樂不處理（同一張圖可能同時用不同版本號引用）。 */
function prune(k, req, url) {
  if (!url.search || !/\.(js|css)$/.test(url.pathname)) return;
  k.keys(req, { ignoreSearch: true }).then(ks => ks.forEach(x => { if (x.url !== req.url) k.delete(x); })).catch(() => { });
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async k => {
    const hit = await k.match(req);
    /* v194：帶 ?v= 版本號的檔案內容不會變（改檔一定換版本號），命中快取就直接用，不再每次開遊戲都在背景把兩百多個檔案重新下載一遍
       （以前每次進遊戲約 280 個請求，手機上跟遊戲搶網路與 CPU）。保險：快取超過 7 天的仍會在背景更新一次。 */
    if (hit && url.search.includes('v=')) { const d = Date.parse(hit.headers.get('date') || ''); if (d && Date.now() - d < 7 * 864e5) return hit; }
    const net = fetch(req).then(r => { if (r.ok && r.type === 'basic') { k.put(req, r.clone()); prune(k, req, url); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
