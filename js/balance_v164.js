/* v164 稀有度調整與新角色體質（使用者 11/06：娜美、羅賓降為 SR；亞爾麗塔降為 R；近海之王升為 RR；
   賈巴、雷利「設定在 SSR 中屬於頂尖水平」——稀有度 UR，但綜合戰力放在 SSR 頂尖～UR 下緣；巴托洛米奧 SR 中上的防禦中斷型）。
   強度定義沿用 balance_v156.js（tests/tier-sim.js 全角色循環賽 LV81 換算的綜合戰力，稀有度中心值 C 1230／R 1290／RR 1345／RRR 1395／SR 1445／SSR 1500／UR 1580／UR+ 1660，上位／下位 ±30）。
   改稀有度後體質倍率（GAME_SETTINGS.rarityScale）跟著變，所以重新校準 statScale 讓她們落在新稀有度的區間。量測結果：/root/promo/v164/balance_v164.md。
   只調體質（statScale 只影響玩家角色、PvP 與試煉換算，關卡敵人與 BOSS 不受影響）。必須在 balance_v161.js、ext_v164.js 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || typeof CHAR_RARITY === 'undefined') return;
  const RAR_V164 = { nami: 'SR', robin: 'SR', alvida: 'R', lordcoast: 'RR' };
  Object.entries(RAR_V164).forEach(([id, r]) => { if (CHARACTERS[id]) CHAR_RARITY[id] = r; });
  const STAT_V164 = { nami: 1.075, robin: 0.6, alvida: 1.269, lordcoast: 0.965, gaban: 1.23, rayleigh: 1.28, bartolomeo: 0.895 };
  Object.entries(STAT_V164).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  /* 劇情位階：娜美、羅賓原本是 SSR 下位，降到 SR 後算標準；亞爾麗塔原本 RR 下位，降到 R 後算標準；賈巴、雷利 UR 下位；巴托洛米奧 SR 上位 */
  const TIER_V164 = { nami: 0, robin: 0, alvida: 0, gaban: -1, rayleigh: -1, bartolomeo: 1 };
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V164); Object.assign(window.BALANCE_V156.tier, TIER_V164); }
  window.BALANCE_V164 = { stat: STAT_V164, rarity: RAR_V164, tier: TIER_V164 };
})();
