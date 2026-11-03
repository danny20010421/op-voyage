/* v156 角色強弱定義與平衡（使用者 11/04：不符合劇情、稀有度、定位的角色要調整；洛克斯、洛基、伊姆是戰力天花板）。
   ① 綜合戰力＝LV80、無寶物、無覺醒、一對一全角色循環賽（tests/tier-sim.js，每組 24 場以上）換算的戰力分數（SSR 平均＝1500；
      分數差 70 ≈ 勝率 60%、差 120 ≈ 勝率 66%）。
   ② 稀有度區間（中心值）：C 1230／R 1290／RR 1345／RRR 1395／SR 1445／SSR 1500／UR 1580／UR+ 1660；洛基、洛克斯（天花板）不設上限；
      伊姆、摩甘茲、海軍小兵是無法取得的 NPC，不列入。
   ③ 劇情位階：同稀有度裡「上位」+30、「下位」-30（TIER_V156：1＝上位、-1＝下位，其餘標準）；每位角色要落在目標 ±25 內。
   ④ 定位：攻擊／爆發型的每次出手傷害要在全體中位數以上；坦克型的承傷要在中位數以下；控制型每場至少讓對手失去 1 次行動；速攻型先手 65% 以上。
   數值只改 statScale（只影響玩家角色、PvP 與試煉換算，關卡敵人與 BOSS 不受影響）。必須在 balance_v142.js 之後載入。 */
(function () {
  const STAT_V156 = {
    /* C */ coby0: 0.955, makino: 1.036, mayor: 0.886, tama: 0.97,
    /* R */ luffy0: 0.841, zoro: 1.082, sanji: 0.95, morgan: 1.2, vergo: 1.122, lordcoast: 1.165,
    /* RR */ koby_mf: 0.994, alvida: 1.012, koza: 0.959, wiper: 0.945, kinemon: 1.056,
    /* RRR */ york: 1.024,
    /* SR */ franky: 1.011, garp_mf: 0.996, koby_hc: 1.271, law_w: 1.055, ace: 0.987, katakuri: 1.036, catarina: 0.994, burgess: 1.096, vasco: 1.005, vivi: 0.929, perona: 0.952, hody: 1.119, sugar: 1.397, vegapunk: 1.16,
    /* SSR */ nami: 1.263, robin: 0.752, brook: 0.913, jinbe: 1.125, luffy: 1.187, aokiji: 1.372, kizaru: 1.288, magellan: 1.117, lucci: 0.958, garp_hc: 1.138, crocodile: 1.006, doflamingo: 1.071, kuma: 0.93, moria: 1.262, law: 1.227, hancock: 0.936, weevil: 1.281, blackbeard_w: 1.27, mihawk_w: 1.166, marco: 1.049, uta: 0.969, king: 1.022, buggy: 0.907, enel: 1.142, shirahoshi: 0.948, kid: 1.072, yamato: 1.073, luffy_wano: 1.172, zoro_wano: 1.228, sanji_wano: 1.198, dorry: 1.085, gunko: 0.695, shamrock: 1.147,
    /* UR */ akainu: 1.525, mihawk: 1.118, kuma_eh: 0.995,
    /* UR+ */ shanks: 0.708, blackbeard: 1.251, luffy_nika: 1.121, whitebeard: 1.151, bigmom: 0.902, kaido: 1.123,
  };
  const TIER_V156 = {
    /* C */ makino: -1, mayor: -1,
    /* R */ vergo: 1, morgan: -1,
    /* RR */ kinemon: 1, alvida: -1, koza: -1,
    /* SR */ garp_mf: 1, ace: 1, katakuri: 1, vivi: -1, perona: -1, vegapunk: -1,
    /* SSR */ luffy: 1, aokiji: 1, kizaru: 1, garp_hc: 1, mihawk_w: 1, marco: 1, king: 1, luffy_wano: 1, zoro_wano: 1, shamrock: 1, nami: -1, robin: -1, brook: -1, weevil: -1, buggy: -1, shirahoshi: -1,
    /* UR */ akainu: 1,
    /* UR+ */ shanks: 1,
  };
  const BAND_V156 = {"C": 1230, "R": 1290, "RR": 1345, "RRR": 1395, "SR": 1445, "SSR": 1500, "UR": 1580, "UR+": 1660};
  const ROLE_V156 = {"lucci": "爆發輸出型", "mihawk": "爆發輸出型", "shanks": "爆發輸出型", "ace": "爆發輸出型", "dorry": "爆發輸出型", "franky": "坦克型", "brogy": "坦克型", "marco": "平衡型", "vivi": "平衡型"};
  Object.entries(STAT_V156).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  Object.entries(ROLE_V156).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].role = v; });
  /* 速攻型的初登場魯夫原本速度 112，先手率只有 52%；提高到 120（橡膠人的身手），定位與實際表現一致 */
  if (CHARACTERS.luffy0) CHARACTERS.luffy0.baseSpeed = 120;
  /* 路奇：六式（攻擊次數加倍）接指槍可達 60 連擊、一招打倒一位船員；收斂連擊上限（加倍後最多 32 次），單次威力略升。一般出招的平均傷害約降 15%，再由 statScale 補回綜合戰力。 */
  { const L = CHARACTERS.lucci, k = L && L.skills;
    if (k && k[0] && k[0].effect.multiHitNormal) { k[0].effect.multiHitNormal = [10, 16]; k[0].effect.perHitPower = 45; k[0].power = 45; k[0].desc = '普通攻擊對手 10～16 次。'; }
    if (k && k[1] && k[1].effect.multiHitNormal) { k[1].effect.multiHitNormal = [12, 18]; k[1].effect.perHitPower = 40; k[1].power = 40; k[1].desc = '連續普通攻擊對手 12～18 次，並有 8% 機率直接秒殺對手（整招判定一次）。'; } }
  if (window.BALANCE_V142) Object.assign(window.BALANCE_V142.stat, STAT_V156);
  window.BALANCE_V156 = { stat: STAT_V156, tier: TIER_V156, band: BAND_V156, role: ROLE_V156, offset: 30, tol: 25 };
})();
