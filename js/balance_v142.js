/* v142 角色平衡（使用者指定）：
   ① 同稀有度：同等級（LV80）、同條件（無寶物、無覺醒）互打時，每位角色對同稀有度其他角色的平均勝率約 50%（伊姆、洛基不調整）。
   ② 跨稀有度：稀有度越高越強，對低一階約 60%、低兩階以上逐步提高（RARITY_V142）。
   數值由 tests/tier-sim.js 全對戰模擬求出（每組對戰數百場）；statScale 是個別角色的倍率，rarityScale 是稀有度體質（只套用在玩家角色、PvP 與試煉換算，不影響關卡敵人）。
   必須在所有 roster_*.js（含 roster_v91）之後載入。 */
(function () {
  const STAT_V142 = {
    /* C */ coby0: 0.917, marine: 0.966, makino: 1.122, mayor: 0.859, tama: 1.171,
    /* R */ luffy0: 0.826, zoro: 1.086, sanji: 1.018, morgan: 1.237, vergo: 1.13, lordcoast: 1.213,
    /* RR */ koby_mf: 1.072, koza: 0.953, wiper: 0.97, kinemon: 1.009,
    /* SR */ franky: 0.888, garp_mf: 0.983, koby_hc: 1.277, law_w: 1.067, ace: 0.978, katakuri: 1.069, catarina: 0.984, burgess: 1.082, vasco: 0.994, vivi: 0.973, perona: 0.885, hody: 1.027, monet: 1.186, sugar: 1.425, vegapunk: 1.231,
    /* SSR */ nami: 1.25, robin: 0.76, brook: 0.872, jinbe: 1.108, luffy: 1.117, aokiji: 1.338, kizaru: 1.209, magellan: 1.103, lucci: 0.891, garp_hc: 1.063, crocodile: 1.06, doflamingo: 1.055, kuma: 0.972, moria: 1.246, law: 1.241, hancock: 0.945, weevil: 1.292, blackbeard_w: 1.259, mihawk_w: 1.112, marco: 1.025, uta: 1.155, king: 1.001, buggy: 0.959, enel: 1.08, shirahoshi: 0.969, kid: 1.07, yamato: 1.077, dorry: 1.053, brogy: 0.978,
    /* UR */ akainu: 1.434, mihawk: 1.06, kuma_eh: 0.973,
    /* UR+ */ shanks: 0.682, blackbeard: 1.176, luffy_nika: 1.064, whitebeard: 1.026, bigmom: 1.016, kaido: 1.125,
  };
  const RARITY_V142 = {"C": 2.186, "R": 1.292, "RR": 1.64, "RRR": 1.368, "SR": 1.178, "SSR": 1, "UR": 0.937, "UR+": 0.841};
  Object.entries(STAT_V142).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  if (typeof GAME_SETTINGS !== 'undefined' && GAME_SETTINGS.rarityScale) Object.assign(GAME_SETTINGS.rarityScale, RARITY_V142);
  window.BALANCE_V142 = { stat: STAT_V142, rarity: RARITY_V142 };
})();
