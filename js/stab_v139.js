/* v139 畫面穩定（手機、LINE／FB 等 App 內建瀏覽器）：
   症狀：角色培養、洛克斯挑戰等全畫面視窗打開時，畫面局部閃爍、出現殘影方塊，或上半部空白（背景讀不出來）。
   原因：全畫面視窗後面的大廳仍在播放動畫，加上視窗的毛玻璃（backdrop-filter）與大張立繪的陰影濾鏡，
   手機 GPU 記憶體不足時無法完整繪製，就會出現方塊殘影或空白區塊。
   作法：① 全畫面不透明視窗打開時，把後面的畫面與視窗隱藏（不繪製、動畫暫停）；
        ② 觸控裝置上，視窗不用毛玻璃，大張立繪不用陰影濾鏡（改用 CSS 漸層影子）；
        ③ 洛克斯挑戰／皇帝領海背景改用漸層壓暗，並在打開時先預載背景圖。 */
(function () {
  const OPAQUE = '.rk-wrap,.eh-wrap,.ps-wrap,.ld-wrap,.tw-wrap-full,.gfx-host'; /* v144：新抽獎演出（js/gacha_v144.js）也是全畫面不透明 */
  function covered() {
    if (document.querySelector(OPAQUE)) return true;
    const g = document.querySelector('#growModal.show .gw'); if (g) { const r = g.getBoundingClientRect(); if (r.width >= innerWidth - 4 && r.height >= innerHeight - 4) return true; }
    return false; }
  let last = null;
  function sync() { const c = covered(), any = c || !!document.querySelector('#growModal.show,.tr-wrap,.qo-wrap,.modal.show'); if (c === last && document.body.classList.contains('ov-open') === any) return; last = c;
    document.body.classList.toggle('ov-cover', c); document.body.classList.toggle('ov-open', any); }
  let q = 0; const queue = () => { if (q) return; q = requestAnimationFrame(() => { q = 0; sync(); }); };
  window.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'] });
    const gm = () => { const m = document.getElementById('growModal'); if (m && !m.__stab) { m.__stab = 1; new MutationObserver(queue).observe(m, { attributes: true, attributeFilter: ['class'] }); } };
    gm(); setInterval(() => { gm(); sync(); }, 1500);
    document.querySelectorAll('.modal').forEach(m => new MutationObserver(queue).observe(m, { attributes: true, attributeFilter: ['class'] }));
    addEventListener('resize', queue);
    /* 洛克斯挑戰、皇帝領海的背景圖先預載 */
    ['assets/ui/emperor_bg.webp?v=63'].forEach(u => { const i = new Image(); i.decoding = 'async'; i.src = u; });
  });
  window.__stabSync = sync;
})();
