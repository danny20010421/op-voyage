/* v209（使用者 11/13 21:44）：戰鬥立繪尺寸（battleScale）。放在所有角色資料之後載入，蓋過舊的預設值。
   維歐娜的原立繪 0.55／維納斯型態 1.1 寫在 viona_v187.js 的 SZ0／SZV。
   注意：玩家自己在「立繪調整」存過的數值（localStorage op_visual_v1）仍然優先。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const SZ = { rocks: 1.5, rayleigh: .5, shamrock: .55, york: .8, kinemon: .9, kid: 1.5, reiju: .8, vergo: 1.25, monet: 1, shirahoshi: 1.25, perona: .9,
    enel: 1.3, wiper: 1, vivi: .75, kaido: 1.8, luffy_nika: 1.4, moria: 1.5, doflamingo: .95, koby_hc: .85, garp_hc: 1.3 };
  Object.entries(SZ).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].battleScale = v; });
})();
/* v207：密佛格新立繪——頭像（bag_v116.js 會改成 ?v=116）與奧義背景（舊的 ?v=40）一起換新版本號，避免瀏覽器繼續用快取裡的舊圖 */
(function () { const c = typeof CHARACTERS !== 'undefined' && CHARACTERS.mihawk; if (!c) return;
  c.image = 'assets/chars/mihawk.webp?v=6f613a94'; c.avatar = 'assets/chars/mihawk_face.webp?v=443ee7ed'; c.ultimateBg = 'assets/chars/mihawk.webp?v=6f613a94'; })();
