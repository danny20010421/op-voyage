/* v214：角色數值調整（原 balance_v*.js 依版本順序合併）。合併前的檔案邊界以「==== 原 檔名 ====」標記。 */

/* ==== 原 js/balance_v142.js ==== */
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

/* ==== 原 js/balance_v156.js ==== */
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

/* ==== 原 js/balance_v157.js ==== */
/* v157 技能調整（使用者 11/04 看完 v156 平衡報告後指定）：
   四皇（白鬍子、BIG MOM、凱多、紅髮、黑鬍子、尼卡魯夫，含七武海時期的黑鬍子 blackbeard_w）、洛基、伊姆、漢庫克、洛克斯：
   ① 都要有「清除對手能力提升」（effect.clearBuffs，戰鬥紀錄「🌀 ○○ 的能力提升被清除！」）；
   ② 都要有「解除自身異常狀態與負面能力」（effect.clearSelfDebuffs；紅髮、白鬍子的霸王色本來就會清除）；
   ③ 第 5 招以外都要有一招傷害較高的攻擊技能。
   原本就具備的不重複加；新加的效果同時補上技能說明與標籤（清強化／淨化，沿用既有標籤名稱）。敵方 AI 在對手有能力提升、自己有負面狀態時會優先選用（battle_core.js pickEnemySkill）。
   必須在 balance_v156.js 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  /* 使用者指定：黑鬍子再加強一點；黃猿、青雉削弱一點（仍是海軍大將）；娜美、羅賓加強一點。技能變動的角色也重新求 statScale（tests/tier-sim.js） */
  const STAT_V157 = {
    blackbeard: 1.269, kizaru: 1.263, aokiji: 1.365, nami: 1.32, robin: 0.771, franky: 0.93, hancock: 0.906, blackbeard_w: 1.25, bigmom: 0.85, kaido: 1.104, whitebeard: 1.119, akainu: 1.443, luffy0: 0.853, zoro: 1.104, sanji: 0.973, brook: 0.902, coby0: 0.976, morgan: 1.218, koby_mf: 1.037, vergo: 1.137, law: 1.215, mihawk_w: 1.183, marco: 1.058, catarina: 1.006, mayor: 0.915, lordcoast: 1.175, enel: 1.16, wiper: 0.955, shirahoshi: 0.96, monet: 1.199, sugar: 1.377, tama: 0.99, yamato: 1.087, zoro_wano: 1.247, sanji_wano: 1.209, york: 1.015
  };
  /* 前 5 位是使用者指定；其餘是加上清強化／淨化（AI 會在對的時機用）後重新量測，拉回各自稀有度區間的角色 */
  Object.entries(STAT_V157).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  const TAG_DISPEL = ['清強化', 'blue'], TAG_CLEANSE = ['淨化', 'green'];
  const sk = (id, i) => CHARACTERS[id] && CHARACTERS[id].skills && CHARACTERS[id].skills[i];
  const addTag = (s, t) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t[0])) s.tags.push(t); };
  const desc = (s, txt) => { if (!s.desc.includes(txt)) s.desc = s.desc.replace(/[。]?$/, '。') + txt; };
  function dispel(id, i, txt) { const s = sk(id, i); if (!s) return; s.effect = s.effect || {}; s.effect.clearBuffs = true; addTag(s, TAG_DISPEL); desc(s, txt || '清除對手的能力提升。'); }
  function cleanse(id, i, txt) { const s = sk(id, i); if (!s) return; s.effect = s.effect || {}; s.effect.clearSelfDebuffs = true; addTag(s, TAG_CLEANSE); desc(s, txt || '解除自身的異常狀態與負面能力。'); }

  /* 紅髮：霸王色本來就清除自身負面狀態；加上驅散（霸氣壓過對手的強化）。重擊＝「給我一個面子」 */
  dispel('shanks', 3, '並清除對手的能力提升。');
  /* 白鬍子：霸王色同上；重擊＝「空震」 */
  dispel('whitebeard', 3, '並清除對手的能力提升。');
  /* 黑鬍子（四皇）：驅散＝引力吸入（原有）；淨化加在「解放」；重擊＝「引發震動」。另外使用者要求再加強一點（statScale，見 balance_v156 後的 STAT_V157） */
  cleanse('blackbeard', 3, '解放的同時把身上的負面狀態一起吐出：解除自身的異常狀態與負面能力。');
  /* 黑鬍子（七武海）：同上 */
  cleanse('blackbeard_w', 3, '解放的同時把身上的負面狀態一起吐出：解除自身的異常狀態與負面能力。');
  /* 凱多：淨化＝酒龍八卦（原有）；驅散加在「降三世・引奈落」（狼牙棒把對手的氣勢一起砸碎）；重擊＝「大威德・雷鳴八卦」 */
  dispel('kaido', 3, '狼牙棒連同對手的氣勢一起砸碎：清除對手的能力提升。');
  /* BIG MOM：驅散＝靈魂咒語（原有）；淨化也加在靈魂咒語（奪走靈魂的同時甩掉負面狀態）；重擊＝「拿破崙」 */
  cleanse('bigmom', 3);
  /* 尼卡魯夫：淨化＝解放之鼓（原有）；驅散加在「橡膠橡膠・巨人」（威懾）；重擊＝橡膠橡膠・巨人 */
  dispel('luffy_nika', 3, '巨人的威懾讓對手的強化全部消失：清除對手的能力提升。');
  /* 洛基：原初世界本來就同時清除對手強化與自身負面狀態；重擊＝「鐵雷」。不調整 */
  /* 伊姆：驅散加在「世界之王」（威壓）；淨化加在「不死之身」（沒有「伊姆真身」皮膚時唯一能用的技能）；重擊＝世界之王 */
  dispel('imu', 1, '並清除對手的能力提升。');
  cleanse('imu', 2);
  /* 漢庫克：驅散＝迷戀甘風（原有）；淨化也加在迷戀甘風；重擊「芳香腳」威力 150 → 210 */
  cleanse('hancock', 0);
  { const s = sk('hancock', 3); if (s && s.power === 150) s.power = 210; }
  /* 洛克斯：驅散加在「蝕」（侵蝕對手的強化）；淨化加在「瞬」；重擊＝蝕（真實傷害） */
  dispel('rocks', 0, '命中後清除對手的能力提升。');
  cleanse('rocks', 1);
  /* 原本就有清強化／淨化的招式也補上標籤，玩家一眼看得出來 */
  ['shanks', 'whitebeard', 'blackbeard', 'blackbeard_w', 'kaido', 'bigmom', 'luffy_nika', 'loki', 'imu', 'hancock', 'rocks'].forEach(id => (CHARACTERS[id] && CHARACTERS[id].skills || []).forEach(s => {
    const e = s.effect || {}; if (e.clearBuffs) addTag(s, TAG_DISPEL); if (e.clearSelfDebuffs || e.haoshoku) addTag(s, TAG_CLEANSE); }));
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V157); window.BALANCE_V157 = { stat: STAT_V157 }; }
})();

/* ==== 原 js/balance_v158.js ==== */
/* v158（使用者 11/04）：四皇的範圍＝皇帝領海 6 位＋巴基（buggy，四皇・SSR 下位）。巴基也套用 v157 規則：
   清除對手能力提升（四分五裂：碎塊四處亂飛擾亂對手）、解除自身負面（免疫斬擊，原本就有）、第 5 招以外的高傷害攻擊（四分五裂每擊 75 → 95）。
   劇情上靠運氣當上四皇，強度維持 SSR 下位（statScale 由 tests/tier-sim.js 重新求值），不能強過其他四皇。必須在 balance_v157.js 之後載入。 */
(function () {
  const C = typeof CHARACTERS !== 'undefined' && CHARACTERS.buggy; if (!C) return;
  const s = C.skills[2];
  if (s && s.effect && s.effect.multiHitNormal) {
    s.effect.perHitPower = 95; s.power = 95; s.effect.clearBuffs = true;
    s.tags = s.tags || []; if (!s.tags.some(t => t[0] === '清強化')) s.tags.push(['清強化', 'blue']);
    if (!s.desc.includes('能力提升')) s.desc = s.desc.replace(/[。]?$/, '。') + '碎塊四處亂飛擾亂對手：清除對手的能力提升。';
  }
  const h = C.skills[1]; if (h && h.effect && h.effect.clearSelfDebuffs) { h.tags = h.tags || []; if (!h.tags.some(t => t[0] === '淨化')) h.tags.push(['淨化', 'green']); }
  C.statScale = 0.86;
  if (window.BALANCE_V156) { window.BALANCE_V156.stat.buggy = C.statScale; window.BALANCE_V158 = { stat: { buggy: C.statScale } }; }
})();

/* ==== 原 js/balance_v159.js ==== */
/* v159 使用者 11/04 20:32：「女帝第五技能幫我加強傷害，另外洛克斯五個技能效果的傷害與秒殺效果也再加強」。
   漢庫克 大芳香腳：3～12 倍 → 5～16 倍、威力 100 → 120。
   洛克斯：蝕 威力 150 → 210、新增 12% 秒殺（BOSS 依既有規則改為 3 倍傷害）；瞬 下回合秒殺 5～25% → 15～40%、回復 20% → 30%；
   殺 SSR 以上秒殺 50% → 70%、沒秒殺時扣當下體力 50% → 60%；蓄 奉還 ×1.5；戴維的秘密 瀕死後下一擊 5～10 倍 → 8～15 倍、瀕死回復 20% → 30%。
   效果實作在 js/ext_v129.js（rocksKill 物件 {p,cut}、rocksStoreMult）。必須在 roster_v129、balance_v158 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const H = CHARACTERS.hancock, K = CHARACTERS.rocks, sk = (c, n) => c && c.skills.find(s => s.name === n);
  const ult = sk(H, '大芳香腳'); if (ult) { ult.power = 120; ult.effect.randomMultiplierRange = [5, 16]; ult.desc = ult.desc.replace('3～12 倍', '5～16 倍'); }
  const e = sk(K, '蝕'); if (e) { e.power = 210; e.effect.executeChance = .12; if (!/秒殺/.test(e.desc)) e.desc += '12% 機率直接秒殺（BOSS 改為受到 3 倍傷害）。'; if (e.tags && !e.tags.some(t => t[0] === '秒殺')) e.tags.push(['秒殺', 'red']); }
  const sh = sk(K, '瞬'); if (sh) { sh.effect.rocksShun = [.15, .4]; sh.effect.healRatio = .3; sh.desc = sh.desc.replace('回復 20% 體力', '回復 30% 體力').replace('5～25%', '15～40%'); }
  const kl = sk(K, '殺'); if (kl) { kl.effect.rocksKill = { p: .7, cut: .6 }; kl.desc = kl.desc.replace('有 50% 直接秒殺，另外 50% 扣除對手當下體力的一半', '有 70% 直接秒殺，另外 30% 扣除對手當下體力的 60%'); }
  const st = sk(K, '蓄'); if (st) { st.effect.rocksStoreMult = 1.5; st.desc = st.desc.replace('把記錄到的傷害全部無視護盾奉還給對手', '把記錄到的傷害 1.5 倍、無視護盾奉還給對手'); }
  const ds = sk(K, '戴維的秘密'); if (ds && ds.effect.rocksSecret) { ds.effect.rocksSecret.mult = [8, 15]; ds.effect.rocksSecret.guard = [.1, .3]; ds.desc = ds.desc.replace('5～10 倍', '8～15 倍').replace('自動回復 20% 體力', '自動回復 30% 體力'); }
})();

/* ==== 原 js/balance_v160.js ==== */
/* v160 六位四皇技能重新設計（使用者 11/04；設計文件 /root/promo/v160/emperors_design.md；新機制在 js/ext_v160.js）。
   招式名稱沿用原本的；每位仍保有：清除對手能力提升（清強化）、解除自身負面（淨化）、第 5 招以外的高傷害技。
   必須在 balance_v159.js 之後、所有 roster 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, name) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === name); };
  function set(id, name, o) { const s = get(id, name); if (!s) return; s.effect = Object.assign(s.effect || {}, o.e || {}); (o.del || []).forEach(k => delete s.effect[k]); if (o.desc) s.desc = o.desc; if (o.tags) s.tags = o.tags; if (o.power !== undefined) s.power = o.power; }
  const PRESS = { key: 'haki', label: '霸氣壓制' }, DARK = { key: 'dark', label: '黑暗' }, SOUL = { key: 'soul', label: '靈魂壓制' };

  /* ---------- 紅髮：霸氣壓制 → 印記加成、瞬殺 ---------- */
  set('shanks', '強者波動', { e: { trueHitChance: .5, mark: Object.assign({ turns: 3 }, PRESS) },
    desc: '對對手進行 1～40 次斬擊；若對手有護盾，每一擊有 50% 機率化為真實攻擊直接打中本體（霸氣貫穿）。命中後對手被刻上「霸氣壓制」3 回合。',
    tags: [['連擊', 'red'], ['真實', 'gold'], ['霸氣壓制', 'gold']] });
  set('shanks', '強者對決', { e: { markBonus: Object.assign({ mult: 1.4 }, PRESS) },
    desc: '全能力 +1，回復 15% 體力，進行 1～30 次普通斬擊；自身體力高於 80% 時再追加 1～10 次。對「霸氣壓制」中的對手傷害 ×1.4。',
    tags: [['強化', 'gold'], ['連擊', 'red'], ['壓制加成', 'red']] });
  set('shanks', '給我一個面子', { e: { markBonus: Object.assign({ mult: 1.6, exec: .1, consume: true }, PRESS) },
    desc: '回復 20% 體力，強力攻擊 1～3 次，25% 使對手暈眩 1 回合，並使對手虛弱 2 回合。對「霸氣壓制」中的對手傷害 ×1.6、10% 機率直接秒殺（BOSS 改為 3 倍傷害），打完壓制消失。',
    tags: [['回復', 'green'], ['暈眩', 'gold'], ['虛弱', 'gray'], ['壓制加成', 'red'], ['秒殺', 'red']] });
  set('shanks', '霸王色', { e: { clearBuffs: true, shieldBreak: true, immuneTurns: 2, mark: Object.assign({ turns: 3 }, PRESS) },
    desc: '強制控場：對手全能力 -2；解除對手的變身；清除自身負面狀態，自身 2 回合免疫異常狀態；清除對手的能力提升並震碎對手的護盾；使對手虛弱 1 回合，並刻上「霸氣壓制」3 回合。對手稀有度 SR 以下時無法攻擊 1 回合；稀有度 R、或等級 LV80 以下時體力直接歸 0（BOSS 改為受到 3 倍傷害）。',
    tags: [['霸王色', 'gold'], ['控場', 'blue'], ['清強化', 'blue'], ['淨化', 'green'], ['霸氣壓制', 'gold']] });
  { const s = get('shanks', '神避'); if (s) { s.effect.markBonus = Object.assign({ mult: 1, exec: .15 }, PRESS); if (!/霸氣壓制/.test(s.desc)) s.desc = s.desc.replace('20% 直接秒殺', '20% 直接秒殺（對「霸氣壓制」中的對手 35%）'); } }

  /* ---------- 白鬍子：坦克、護盾、免疫控制、護盾轉傷害 ---------- */
  set('whitebeard', '海闊天空', { e: { selfShieldMaxHpRatio: .2, immuneTurns: 2 },
    desc: '全能力 +1，回復 20% 體力，獲得最大體力 20% 的護盾，2 回合免疫異常狀態；下回合攻擊傷害提升 2～10 倍。',
    tags: [['強化', 'gold'], ['回復', 'green'], ['護盾', 'blue'], ['免疫', 'green']] });
  set('whitebeard', '海震', { e: { clearBuffs: true },
    desc: '對敵人進行 1～50 次震動衝擊波；若對手有護盾，護盾直接失效；並清除對手的能力提升。',
    tags: [['連擊', 'red'], ['破盾', 'blue'], ['清強化', 'blue']] });
  set('whitebeard', '空震', { e: { shieldToDmg: .6 },
    desc: '強力衝擊 1～3 次，25% 使對手暈眩 1 回合，並附加破防 3 回合；對手體力高於 80% 時威力再提升 1.2～4 倍。自身的護盾越厚越強：傷害再加上目前護盾的 60%。',
    tags: [['重擊', 'red'], ['暈眩', 'gold'], ['破防', 'blue'], ['護盾轉傷害', 'gold']] });
  set('whitebeard', '霸王色', { e: { damageReductionTurns: 3, damageReductionValue: .3, selfShieldMaxHpRatio: .15 }, del: ['clearBuffs'],
    desc: '強制控場：對手全能力 -2；解除對手的變身；清除自身負面狀態；使對手虛弱 1 回合；自身 3 回合受到的傷害 -30%，並獲得最大體力 15% 的護盾。對手稀有度 SR 以下時無法攻擊 1 回合；稀有度 R、或等級 LV80 以下時體力直接歸 0（BOSS 改為受到 3 倍傷害）。',
    tags: [['霸王色', 'gold'], ['控場', 'blue'], ['淨化', 'green'], ['減傷', 'blue'], ['護盾', 'blue']] });
  { const s = get('whitebeard', '老爹'); if (s) { Object.assign(s.effect, { immuneTurns: 2, damageReductionTurns: 3, damageReductionValue: .25 }); if (!/免疫異常/.test(s.desc)) s.desc = s.desc.replace('只能使用 1 次（藥水無法補充）。', '只能使用 1 次（藥水無法補充）。白鬍子 2 回合免疫異常狀態、3 回合受到的傷害 -25%。'); } }

  /* ---------- 黑鬍子：吸收、反彈、極限暗殺 ---------- */
  set('blackbeard', '引力吸入', { e: { drainBuffs: true, mark: Object.assign({ turns: 3 }, DARK) }, del: ['clearBuffs'],
    desc: '吸取對手 5～15% 體力、奪走對手的能力提升加到自己身上；30% 使對手恐懼 1 回合；對手 2 回合每回合扣 10% 體力，並被刻上「黑暗」3 回合。',
    tags: [['吸收', 'green'], ['奪強化', 'blue'], ['恐懼', 'gold'], ['黑暗印記', 'gold']] });
  set('blackbeard', '引發震動', { e: { lifesteal: .15, markBonus: Object.assign({ mult: 1.4 }, DARK) },
    desc: '30% → 2.5 倍、30% → 5 倍、20% → 10～20 倍、10% → 20～40 倍，其餘為普通震動傷害；造成傷害的 15% 轉為體力。對「黑暗」中的對手傷害 ×1.4。',
    tags: [['震震', 'red'], ['吸血', 'green'], ['印記加成', 'red']] });
  set('blackbeard', '闇穴道', { e: { reflectDebuff: { turns: 2 }, reflectTurns: 1, reflectMultiplier: 1.2, healRatio: .1, copyCast: true }, del: ['copyReplace'], /* v162：再加上複製對手技能立刻使用 */
    desc: '張開黑暗的漩渦：接下來 2 回合，對手施加在自己身上的異常狀態與能力下降全部彈回對手；下一次受到的攻擊以 1.2 倍反彈，並回復 10% 體力。同時把對手的一個技能（第 5 招除外）吸進黑暗，立刻拿來使用一次。',
    tags: [['反彈', 'gold'], ['反彈負面', 'blue'], ['回復', 'green'], ['複製', 'purple']] });
  set('blackbeard', '解放', { e: { markBonus: Object.assign({ mult: 1, exec: .25, consume: true }, DARK) },
    desc: '解放吸進來的力量：造成對手已損失體力 1～1.5 倍的傷害（最多對手最大體力 35%），並獲得自身目前體力 10% 的護盾，解除自身的異常狀態與負面能力；此回合結束時，對手全能力 -1、隨機一個技能次數 -1。對「黑暗」中的對手 25% 機率直接秒殺（BOSS 改為 3 倍傷害），打完黑暗消失。',
    tags: [['終結', 'gold'], ['護盾', 'green'], ['淨化', 'green'], ['秒殺', 'red']] });

  { const s = get('blackbeard', '假裝認輸'); if (s && s.effect.enemyCurrentHpCutRange) { s.effect.enemyCurrentHpCutRange = [.2, .35]; s.desc = s.desc.replace('25～45%', '20～35%'); } } /* 削血比例太高，對高體力的四皇幾乎必勝 */

  /* ---------- 凱多：坦克、高傷、龍人型態加成、瀕死保命 ---------- */
  set('kaido', '酒龍八卦', { e: { damageReductionTurns: 2, damageReductionValue: .25 },
    desc: '全能力 +1，清除自身負面狀態，下回合攻擊傷害 5～7 倍；2 回合受到的傷害 -25%。',
    tags: [['強化', 'gold'], ['淨化', 'green'], ['減傷', 'blue']] });
  { const s = get('kaido', '升龍·火焰八卦'); if (s) { s.effect.dragonBoost = { dmg: 1.3, dr: .2, regen: .04, guard: .3 };
    if (!/龍人型態期間/.test(s.desc)) s.desc += ' 龍人型態期間：其他招式傷害 ×1.3、受到的傷害 -20%、每回合回復 4% 體力，並能撐住一次致命傷（保住 30% 體力）。';
    if (!s.tags.some(t => t[0] === '保命')) s.tags.push(['保命', 'green']); } }

  /* ---------- BIG MOM：強控、靈魂壓制（無法解除）、奪取 ---------- */
  set('bigmom', '宙斯', { e: { attackFailChance: .35, markBonus: Object.assign({ mult: 1.25 }, SOUL) },
    desc: '強力雷電攻擊，35% 機率使對手暈眩 1 回合；接下來 2 回合對手的攻擊有 35% 機率落空。對「靈魂壓制」中的對手傷害 ×1.25。',
    tags: [['暈眩', 'gold'], ['落空', 'blue'], ['壓制加成', 'red']] });
  set('bigmom', '拿破崙', { e: { markBonus: Object.assign({ mult: 1.35 }, SOUL) },
    desc: '恐怖的斬擊波；50% 機率額外扣除對手當前體力的 30%，並附加破防 2 回合。對「靈魂壓制」中的對手傷害 ×1.35。',
    tags: [['強力', 'red'], ['比例', 'gold'], ['壓制加成', 'red']] });
  set('bigmom', '靈魂咒語', { e: { drainBuffs: true, soulLock: { turns: 3, down: 1, drain: .03 }, selfShieldCurrentHpRatio: .1, damageReductionTurns: 3, damageReductionRange: [.2, .35] }, del: ['clearBuffs', 'statUpAll', 'immuneTurns'],
    desc: '「壽命還是點心？」奪走對手的能力提升加到自己身上，並施加「靈魂壓制」3 回合：對手全能力至少 -1、每回合被奪走最大體力 3%（BOSS 1.5%）給 BIG MOM，這個壓制無法被任何淨化或強化解除。同時解除自身的異常狀態與負面能力，獲得目前體力 10% 的護盾，3 回合受到的傷害 -20～35%。',
    tags: [['靈魂壓制', 'red'], ['無法解除', 'gold'], ['奪強化', 'blue'], ['淨化', 'green'], ['護盾', 'blue'], ['減傷', 'blue']] });
  { const s = get('bigmom', '霸海'); if (s) { s.effect.extendLock = 2; if (!/靈魂壓制/.test(s.desc)) s.desc += ' 對手若正被「靈魂壓制」，壓制延長 2 回合。'; } }

  /* ---------- 尼卡魯夫：反轉、自由、多段與回復 ---------- */
  set('luffy_nika', '解放之鼓', { e: { flipDebuffs: true, damageReductionValue: .35, dmgToHeal: { turns: 2, ratio: .5 } }, del: ['clearSelfDebuffs'],
    desc: '響起解放的鼓聲：體力全部回復、全能力 +1、解除自身異常狀態，並把自身的能力下降反轉成同等的能力提升；之後 2 回合每回合回復 20% 體力、受到的傷害 -35%，受到傷害後再把其中 50% 笑成體力。陣容中體力低於 85% 的隊友回復 5% 體力。',
    tags: [['回復', 'green'], ['反轉', 'gold'], ['淨化', 'green'], ['減傷', 'blue']] });
  { const s = get('luffy_nika', '橡膠橡膠·火箭砲'); if (s) { s.effect.perHitPower = 20; s.power = 20; } } /* 多段攻擊：每擊 13 → 20 */
  set('luffy_nika', '橡膠橡膠·雷電', { e: { paralyzeChance: .5 },
    desc: '抓住閃電砸向對手：50% 使對手麻痺 1 回合，無視護盾直接造成傷害。若這招被對手的閃避或無敵躲開，對手下回合的攻擊會反彈自己 20～120% 的傷害。' }); /* 原本 100% 麻痺＋速度較快，可以把較慢的對手一直麻痺到倒 */
  set('luffy_nika', '橡膠橡膠·巨人', { e: { invertBuffs: true }, del: ['clearBuffs'],
    desc: '變成巨人一拳砸下：威懾對手使其 1 回合無法攻擊，並讓對手下回合的技能效果失效；把對手的能力提升反轉成同等的能力下降；50% 機率連續攻擊 3 次。',
    tags: [['威懾', 'gold'], ['封印', 'blue'], ['反轉強化', 'blue'], ['連擊', 'red']] });
  /* 平衡（tests/tier-sim.js 四皇互打與全角色量測） */
  const STAT_V160 = { shanks: 1.35, whitebeard: 0.88, blackbeard: 1.12, kaido: 1.0, bigmom: 1.04, luffy_nika: 1.12 };
  if (CHARACTERS.shanks) CHARACTERS.shanks.hpTilt = 1.35;
  if (CHARACTERS.blackbeard) CHARACTERS.blackbeard.hpTilt = 1.3; /* 黑鬍子：提高自身生存（體力 ×1.3、傷害 ÷1.3，只限玩家角色） */ /* 紅髮：體力 ×1.35、傷害 ÷1.35（只限玩家角色；ext_v160.js） */
  Object.entries(STAT_V160).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V160); window.BALANCE_V160 = { stat: STAT_V160 }; }
})();

/* ==== 原 js/balance_v161.js ==== */
/* v161 四皇平衡微調（使用者 11/04：紅髮拉回 UR+ 戰力區間但仍是四皇裡的強者；剋制組合勝率拉近；保留每位的招牌機制，只調體質、倍率、機率）。
   量測：tests/tier-sim.js（LV81）四皇互打與全角色循環賽，見 /root/promo/v160/table_v160.md 的 v161 一節。必須在 balance_v160.js 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, name) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === name); };
  /* 體質：紅髮 1.35 → 1.2（綜合戰力約 1840 → 約 1780；壓到 1720 以下會變成四皇裡最弱，見報告）；BIG MOM 1.04 → 1.08；凱多 1.0 → 0.97；尼卡魯夫 1.12 → 1.16 */
  const STAT_V161 = { shanks: 1.2, bigmom: 1.08, kaido: 0.97, luffy_nika: 1.16 };
  Object.entries(STAT_V161).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  /* 黑鬍子對 BIG MOM 原本 97%：比例傷害與護盾對高體力角色太強。保留黑暗印記、暗殺與吸收，只調倍率與機率 */
  const g = get('blackbeard', '引力吸入');
  if (g && g.effect.dotRatio) { g.effect.dotRatio = .06; g.desc = g.desc.replace('每回合扣 10% 體力', '每回合扣 6% 體力'); }
  const r = get('blackbeard', '解放');
  if (r) { r.effect.lostHpCapMax = .25; r.effect.selfShieldCurrentHpRatio = .05; if (r.effect.markBonus) r.effect.markBonus.exec = .15;
    r.desc = r.desc.replace('最多對手最大體力 35%', '最多對手最大體力 25%').replace('自身目前體力 10% 的護盾', '自身目前體力 5% 的護盾').replace('25% 機率直接秒殺', '15% 機率直接秒殺'); }
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V161); window.BALANCE_V161 = { stat: STAT_V161 }; }
})();

/* ==== 原 js/balance_v164.js ==== */
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

/* ==== 原 js/balance_v165.js ==== */
/* v165 伊姆重做（使用者 11/06 指定規格 /root/promo/v165/src/imu_skills.txt，逐條照做；強度不壓回平衡區間）。
   四種型態：初始型態「伊姆」（原立繪）→ 第一型態「伊姆聖」（imu_form1）→ 第二型態「世界之王・伊姆聖」（imu_form2）→ 第三型態「深淵聖靈・伊姆」（imu_form3，v169）。
   - CHARACTERS.imu.skills：初始／第一型態的五招（①不死之身 ②黑轉支配 ③虛空威壓 ④黑焰・凶兆 ⑤最初20人）；初始型態只能用①⑤
   - CHARACTERS.imu.form2Skills／form3Skills：第二、第三型態的①～④（⑤沿用同一招；第三型態再施放為「天罰」）
   - CHARACTERS.imu.forms：三種型態的名字、立繪、頭像、對戰大小（皮膚只換初始型態的樣子，晉升後一律用型態立繪）
   效果欄位（imuUndying、imuPact、imuVoid、imuSealAtk、imuPactChase、imuDefIgnore、imuAscend、imuEternal、imuDomain、imuRuin）的處理都在 js/ext_v165.js。
   不再用皮膚鎖招（拿掉 skinSkills）；角色特性（免疫異常、免秒殺、免能力下降，v110）保留。
   必須在 balance_v164.js 之後載入（覆蓋 roster_v109／v110、balance_v157 對伊姆的舊設定），ext_v165.js 在本檔之後。 */
(function () {
  const C = typeof CHARACTERS !== 'undefined' && CHARACTERS.imu; if (!C) return;
  const V = 165, img = n => `assets/chars/${n}.webp?v=${V}`;
  C.forms = [
    { key: 'base', label: '初始型態', name: C.name || '伊姆', title: C.title || '世界之王', image: C.image, avatar: C.avatar },
    { key: 'form1', label: '第一型態', name: '伊姆聖', title: '第一型態', image: img('imu_form1'), avatar: img('imu_form1_face'), scale: 1.25 },
    { key: 'form2', label: '第二型態', name: '世界之王・伊姆聖', title: '第二型態', image: img('imu_form2'), avatar: img('imu_form2_face'), scale: 1.8 }, /* v167：使用者 11/06 08:26 第二型態放大到約 1.8 */
    { key: 'form3', label: '第三型態', name: '深淵聖靈・伊姆', title: '第三型態', image: `assets/chars/imu_form3.webp?v=41c8be3e`, avatar: `assets/chars/imu_form3_face.webp?v=444653eb`, scale: 5.5, turns: 5 } /* v169：使用者 11/07 00:36 新增第三型態（橫幅雙翼立繪）；v170b：使用者 11/07 13:48 對戰大小改 3 */
  ];
  delete C.skinSkills; /* v165：型態取代皮膚鎖招 */
  C.desc = '坐在瑪莉喬亞「空白王座」上的世界之王，真實身分籠罩在黑影之中。初始型態只能使用「不死之身」與「最初20人」；施放「最初20人」晉升為第一型態「伊姆聖」、第二次晉升為第二型態「世界之王・伊姆聖」、第三次晉升為第三型態「深淵聖靈・伊姆」，立繪與技能都會改變；第四次施放降下「天罰」。【角色特性】免疫異常、免秒殺、免能力下降。';
  const sk = (o) => Object.assign({ power: 0, accuracy: 100 }, o, { maxPP: o.pp });
  C.skills = [
    sk({ name: '不死之身', type: 'support', pp: 2, anima: 'cook',
      desc: '施放後 3 回合內，每回合恢復最大體力的 100%（對手是 BOSS 時為每回合 20%）；受到致命傷害時保留 1 點體力並立即恢復 60% 體力，每次施放最多觸發 1 次。不死期間受到傷害的 30% 反彈給攻擊者。解除全部異常狀態，並把自身的能力下降轉化為同等幅度的能力提升。',
      tags: [['不死', 'green'], ['回復', 'green'], ['反彈', 'gold'], ['淨化', 'green']],
      effect: { imuUndying: { turns: 3, regen: 1, bossRegen: .2, guard: .6, thorn: .3 } } }),
    sk({ name: '黑轉支配', type: 'support', pp: 3, anima: 'naraku', formNeed: 1,
      desc: '（第一型態起才能使用）對手被刻上「惡魔契約」3 回合，每回合失去最大體力的 10%，受到的治療效果減少 60%（對 BOSS 無效）。對手全能力 -2，並有 50% 機率陷入「支配」1 回合：無法自己選擇技能，改由伊姆隨機施放，若是攻擊技能，造成傷害的 50% 會反傷自己。若對手在契約期間被擊敗，伊姆恢復最大體力的 50%。',
      tags: [['惡魔契約', 'red'], ['支配', 'red'], ['全能力-2', 'red'], ['減療', 'red']],
      effect: { imuPact: { turns: 3, ratio: .1, healCut: .6, bossHealExempt: true, allDown: 2, domChance: .5, domRecoil: .5, reward: .5 } } }),
    sk({ name: '虛空威壓', type: 'support', pp: 3, anima: 'darkpull', formNeed: 1,
      desc: '（第一型態起才能使用）3 回合內自身迴避率 +50%；受到攻擊時有 50% 機率透過「深淵轉移」，把這次攻擊轉給我方陣容中其他還站著的角色承擔（沒有其他角色時不會轉移，當 BOSS 時也沒有可以轉移的對象）。並進行一次深淵攻擊，造成對手最大體力 10% 的傷害。每次成功迴避，下一次攻擊威力 +20%，最多累積 3 次。',
      tags: [['迴避', 'blue'], ['深淵轉移', 'blue'], ['比例傷害', 'red']],
      effect: { imuVoid: { turns: 3, evade: .5, abyss: .5, strike: .1, stackPer: .2, stackMax: 3 } } }),
    sk({ name: '黑焰・凶兆', type: 'attack', power: 120, pp: 8, anima: 'naraku', formNeed: 1,
      desc: '（第一型態起才能使用）造成 5～30 倍傷害，無視對手 50% 防禦力與護盾。附加「黑焰侵蝕」3 回合，每回合損失最大體力的 3～8%。30% 機率封印對手下一回合的攻擊技能。若對手帶有「惡魔契約」，額外造成一次 50% 威力的追擊。',
      tags: [['爆發', 'red'], ['破防', 'red'], ['黑焰侵蝕', 'red'], ['封招', 'gold'], ['追擊', 'gold']],
      effect: { randomMultiplierRange: [5, 30], ignoreShield: true, imuDefIgnore: .5, dotSequence: [[.03, .08], [.03, .08], [.03, .08]], dotLabel: '黑焰侵蝕', imuSealAtk: .3, imuPactChase: .5 } }),
    sk({ name: '最初20人', type: 'support', pp: 5, anima: 'awaken', ultimate: true,
      desc: '奧義（5 次，無法用道具恢復）。第一次施放晉升為第一型態「伊姆聖」，開啟第 2～4 招；第二次施放晉升為第二型態「世界之王・伊姆聖」、第三次施放晉升為第三型態「深淵聖靈・伊姆」（只能維持 5 回合，之後降回第二型態，再次施放才會再晉升），每次晉升技能欄都換成新型態的技能，第 1～4 招次數全部恢復（本招不恢復，最多 5 次），並繼承全部累積效果。每次施放：全能力 +3、無敵 5 回合、連續 3 回合奪走對手目前體力的 30%、自身負面狀態與能力下降全部反彈給對手（之後對手施加的也會反彈）、全部技能威力 +20～50% 且都改為真實傷害；並開始每回合判定秒殺對手（從 20% 起每回合 +5%，秒殺後重新累加）；體力低於 10% 時恢復全部體力（每次施放 +2 次）。第三型態時再次施放改為降下「天罰」：無敵改為 3 回合，清除對手全部強化（能力提升、護盾、減傷、無敵、閃避），對手失去最大體力 30% 的體力（BOSS 為 10%），且 3 回合內無法獲得強化。',
      tags: [['奧義', 'gold'], ['變身', 'gold'], ['無敵', 'green'], ['真實傷害', 'red'], ['秒殺', 'red'], ['天罰', 'red']],
      effect: { imuAscend: { stat: 3, inv: 5, steal: [3, .3], pow: [.2, .5], exec: [.2, .05], clutch: 2, clutchAt: .1, judge: { inv: 3, strike: .3, bossStrike: .1, block: 3 } }, noRestore: true } })
  ];
  C.form2Skills = [
    sk({ name: '永劫不滅', type: 'support', pp: 5, anima: 'cook',
      desc: '獲得「永劫不滅」5 回合：每回合恢復最大體力的 50%；受到致命傷害時保留 1 點體力並立即恢復全部體力（每次施放最多觸發 1 次）；免疫所有異常狀態、控制、秒殺與能力下降；受到的傷害 -50%，並把實際受到傷害的 50% 反彈給對手。期間每回合全部攻擊技能威力 +10%，最多累積 5 次。',
      tags: [['不滅', 'green'], ['回復', 'green'], ['免疫', 'green'], ['減傷', 'blue'], ['反彈', 'gold']],
      effect: { imuEternal: { turns: 5, regen: .5, dr: .5, reflect: .5, stack: .1, stackMax: 5 } } }),
    sk({ name: '黑轉支配・萬物逆轉', type: 'support', pp: 3, anima: 'naraku',
      desc: '發動完整的黑轉支配，把對手的生命、力量與意志逆轉，使其成為惡魔契約的犧牲品：對手陷入「完全支配」3 回合，每回合失去最大體力的 15%；立即奪走對手目前的攻擊、防禦、速度強化轉到自己身上；70% 機率封印對手下一次主動技能。契約期間對手無法獲得新的能力提升，受到的治療效果 -80%。契約中的對手受到致命傷害時，伊姆吸收其剩餘生命，立即恢復全部體力並獲得 1 回合無敵。',
      tags: [['完全支配', 'red'], ['奪取強化', 'gold'], ['封招', 'gold'], ['封強化', 'red'], ['減療', 'red']],
      effect: { imuPact: { full: true, turns: 3, ratio: .15, healCut: .8, noBuff: true, steal: true, sealChance: .7, reward: 'full' } } }),
    sk({ name: '世界之王', type: 'support', pp: 5, anima: 'darkpull',
      desc: '以虛空王座為中心展開巨大深淵，整個戰場落入伊姆的支配 5 回合，對手換人後依然有效：自身迴避率 +70%、受到的傷害 -30%；對手命中率與速度 -50%。每回合發動一次「霸王色震懾」：50% 機率使對手無法行動 1 回合，並受到對手最大體力 95% 的真實傷害。只要對手一次對我方造成超過 25% 體力的傷害，下回合對手直接損失目前體力的 30%。',
      tags: [['領域', 'gold'], ['迴避', 'blue'], ['減傷', 'blue'], ['降命中', 'red'], ['震懾', 'red']],
      effect: { imuDomain: { turns: 5, evade: .7, dr: .3, acc: .5, spd: .5, shock: .5, shockDmg: .95, punishAt: .25, punish: .3 } } }),
    sk({ name: '毀滅之力', type: 'attack', power: 200, pp: 5, anima: 'naraku',
      desc: '把黑焰凝聚成巨大的毀滅之刃，以霸王色霸氣纏繞刀身：造成 15～30 倍傷害，無視防禦與護盾，追加對手最大體力 20% 的傷害。清除對手全部能力提升並奪為己有。使對手陷入「存在抹除」3 回合：受到的治療 -90%、無法復活、無法發動一般保命效果。若對手體力低於 30%，再觸發一次 100% 威力的黑焰追擊，並有 50% 機率隨機擊殺對手一位未出戰的角色（對手沒有其他角色時改為 500 點傷害）。',
      tags: [['爆發', 'red'], ['無視防禦', 'red'], ['奪取強化', 'gold'], ['存在抹除', 'red'], ['追擊', 'gold']],
      effect: { randomMultiplierRange: [15, 30], ignoreShield: true, imuDefIgnore: 1, imuRuin: { extra: .2, erase: 3, healCut: .9, low: .3, chase: 1, kill: .5, flat: 500 } } })
  ];
  /* v169 第三型態「深淵聖靈・伊姆」的①～④（⑤沿用「最初20人」）：使用者 11/07 選「再更強」——比第二型態再強一階，作為戰力天花板。
     沿用 ext_v165 的 imuEternal／imuPact／imuDomain／imuRuin；新欄位 foresight（看穿）、imuPact.chain（契約連鎖）、splash（波及後排）在 js/ext_v169.js；
     bossRegen／bossRatio／bossShockDmg／bossExtra：對手是 BOSS 時改用的比例（比照不死之身的 bossRegen 慣例）。 */
  C.form3Skills = [
    sk({ name: '千眼天啟', type: 'support', pp: 5, anima: 'cook',
      desc: '八隻紅眼睜開，看穿一切：獲得「千眼天啟」5 回合，每回合恢復最大體力的 70%（對手是 BOSS 時為 20%）；受到致命傷害時保留 1 點體力並立即恢復全部體力（每次施放最多觸發 1 次）；免疫所有異常狀態、控制、秒殺與能力下降；受到的傷害 -65%，並把實際受到傷害的 70% 反彈給對手。期間每回合全部攻擊技能威力 +15%，最多累積 6 次。「看穿」：每回合第一次受到的攻擊必定迴避（能打破無敵的攻擊、自由狀態下的攻擊無法被看穿）。',
      tags: [['看穿', 'blue'], ['不滅', 'green'], ['回復', 'green'], ['免疫', 'green'], ['減傷', 'blue'], ['反彈', 'gold']],
      effect: { imuEternal: { turns: 5, regen: .7, bossRegen: .2, dr: .65, reflect: .7, stack: .15, stackMax: 6 }, foresight: 5 } }),
    sk({ name: '黑轉支配・終焉契約', type: 'support', pp: 3, anima: 'naraku',
      desc: '與對手全隊締結終焉的契約：對手陷入「完全支配」4 回合，每回合失去最大體力的 20%（BOSS 為 6%）；「契約連鎖」：對手後排還沒上場的角色每回合也失去最大體力的 12%。立即奪走對手目前的能力提升轉到自己身上，並使對手全能力 -2；90% 機率封印對手下一次主動技能。契約期間對手無法獲得新的能力提升，受到的治療效果 -90%。契約中的對手受到致命傷害時，伊姆吸收其剩餘生命，立即恢復全部體力並獲得 1 回合無敵。',
      tags: [['完全支配', 'red'], ['契約連鎖', 'red'], ['奪取強化', 'gold'], ['封招', 'gold'], ['封強化', 'red'], ['減療', 'red']],
      effect: { imuPact: { full: true, turns: 4, ratio: .2, bossRatio: .06, healCut: .9, noBuff: true, steal: true, allDown: 2, sealChance: .9, reward: 'full', chain: .12 } } }),
    sk({ name: '虛空王座・天翼', type: 'support', pp: 5, anima: 'darkpull',
      desc: '張開遮天的雙翼，展開虛空王座的領域 6 回合，對手換人後依然有效：自身迴避率 +80%、受到的傷害 -45%；對手命中率與速度 -60%。每回合發動一次「霸王色震懾」：60% 機率使對手無法行動 1 回合，並受到對手最大體力 95% 的真實傷害（BOSS 為 12%）。只要對手一次對我方造成超過 20% 體力的傷害，下回合對手直接損失目前體力的 35%。',
      tags: [['領域', 'gold'], ['迴避', 'blue'], ['減傷', 'blue'], ['降命中', 'red'], ['震懾', 'red']],
      effect: { imuDomain: { turns: 6, evade: .8, dr: .45, acc: .6, spd: .6, shock: .6, shockDmg: .95, bossShockDmg: .12, punishAt: .2, punish: .35 } } }),
    sk({ name: '終焉之翼', type: 'attack', power: 240, pp: 5, anima: 'naraku',
      desc: '雙翼化為黑焰之刃橫掃戰場：造成 20～40 倍傷害，無視防禦與護盾，追加對手最大體力 25% 的傷害（BOSS 為 8%）。「翅膀掃擊」：對手後排還沒上場的角色受到這次傷害 30% 的波及。清除對手全部能力提升並奪為己有。使對手陷入「存在抹除」4 回合：受到的治療 -95%、無法復活、無法發動一般保命效果。若對手體力低於 35%，再觸發一次 100% 威力的黑焰追擊，並有 60% 機率隨機擊殺對手一位未出戰的角色（對手沒有其他角色時改為 800 點傷害）。',
      tags: [['爆發', 'red'], ['無視防禦', 'red'], ['波及後排', 'red'], ['奪取強化', 'gold'], ['存在抹除', 'red'], ['追擊', 'gold']],
      effect: { randomMultiplierRange: [20, 40], ignoreShield: true, imuDefIgnore: 1, splash: .3, imuRuin: { extra: .25, bossExtra: .08, erase: 4, healCut: .95, low: .35, chase: 1, kill: .6, flat: 800 } } })
  ];
  /* 取得方式（v165 確認）：目前仍是 npcOnly，玩家無法取得；只出現在勇者之塔第 200／250 層 BOSS（250 層穿皮膚「真實型態」）與虛空王座 */
  if (typeof CHAR_OBTAIN !== 'undefined' && CHAR_OBTAIN.imu) CHAR_OBTAIN.imu.npc = '暫時無法獲得（勇者之塔第 200、250 層 BOSS，以及虛空王座）'; /* 原本寫 100、120 層，v128 起塔改成 250 層後沒有更新 */
})();

/* v165 洛基、尼卡魯夫、洛克斯、黑鬍子強化（使用者 11/06 06:02～06:10：要有能剋制伊姆的能力，但做成通用效果、對所有對手都有效，說明照一般寫法）。
   效果欄位處理在 js/ext_v165.js（pierceDR、breakInvuln、guardBreak、healSeal、ultSeal、nullNext、drainForm、voidGuard、mirror、cleanseMarks、breakField）。
   洛基＝傷害穿透；尼卡魯夫＝反彈反轉、解除壓制類效果、打破場地；洛克斯＝回復壓制、奧義壓制、五招傷害再提高；黑鬍子＝讓對手的招式與保命失效、吸走型態增益。
   window.__NO_V165_COUNTER：模擬工具量「調整前」用。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || window.__NO_V165_COUNTER) return;
  const get = (id, n) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === n); };
  const tag = (s, t, c) => { if (s && !(s.tags || []).some(x => x[0] === t)) (s.tags = s.tags || []).push([t, c]); };
  const add = (id, n, e, txt, tg) => { const s = get(id, n); if (!s) return null; Object.assign(s.effect = s.effect || {}, e); if (txt && !s.desc.includes(txt)) s.desc += txt; (tg || []).forEach(([t, c]) => tag(s, t, c)); return s; };
  /* 洛基：巨人族的雷電貫穿一切防禦 */
  add('loki', '雷電噴吐', { pierceDR: 1, breakInvuln: true, guardBreak: .5 }, '雷電穿透一切防禦：出招前打破對手的無敵、無視對手的減傷效果；這次攻擊足以擊倒對手時，有 50% 機率讓對手的保命效果不發動。', [['穿透', 'red'], ['破無敵', 'red']]);
  add('loki', '鐵雷', { pierceDR: 1, breakInvuln: true, guardBreak: .6 }, '出招前打破對手的無敵、無視對手的減傷效果；這一擊足以擊倒對手時，有 60% 機率讓對手的保命效果（撐住致命傷、不死、瀕死回滿等）不發動。', [['穿透', 'red'], ['破保命', 'red']]);
  add('loki', '原初世界', { pierceDR: 1, breakInvuln: true }, '出招前先打破對手的無敵，並無視對手的減傷效果。', [['破無敵', 'red']]);
  add('loki', '鐵雷五矢', { pierceDR: 1, breakInvuln: true }, '鐵雷穿透一切防禦：出招前打破對手的無敵、無視對手的減傷效果。', [['穿透', 'red']]);
  /* 尼卡魯夫：自由——反彈反轉、解除束縛、打破場地 */
  add('luffy_nika', '解放之鼓', { mirror: 3, cleanseMarks: true, freeTurns: 3 }, '解除自身身上的契約、支配、封印、存在抹除、奧義與回復壓制等效果（契約類會反轉給對手）；接下來 3 回合是「自由」的：不受契約、支配、封印、壓制、場地壓制、奪取體力與秒殺，反彈到自己身上的傷害全部反轉回反彈的人。', [['自由', 'gold'], ['反轉', 'gold']]);
  add('luffy_nika', '橡膠橡膠·巨人', { breakField: 2 }, '巨人一拳打碎對手展開的場地效果（例如領域、火山、冰河），持續時間 -2 回合。', [['破場地', 'gold']]);
  /* 洛克斯：真實傷害與壓制，五招傷害再提高（約 +20～30%） */
  { const s = add('rocks', '蝕', { pierceDR: 1, breakInvuln: true, healSeal: { turns: 3, cut: .7 }, ultSeal: 2 }, '命中後壓制對手：3 回合內回復量 -70%，2 回合內無法使用奧義（第 5 招，含變身與晉升）。', [['回復壓制', 'red'], ['奧義壓制', 'red']]); if (s) { s.power = 260; s.desc = s.desc.replace('也無視攻擊無效', '也無視攻擊無效與無敵'); } }
  { const s = get('rocks', '瞬'); if (s && s.effect.rocksShun) { s.effect.rocksShun = [.2, .45]; s.desc = s.desc.replace('15～40%', '20～45%'); } }
  { const s = add('rocks', '殺', { ultSeal: 3, breakInvuln: true, healSeal: { turns: 3, cut: .7 } }, '出招前打破對手的無敵；命中後壓制對手：3 回合內無法使用奧義（第 5 招，含變身與晉升）、回復量 -70%。', [['奧義壓制', 'red'], ['回復壓制', 'red']]); if (s) { s.power = 125; if (s.effect.rocksKill) s.effect.rocksKill.cut = .7; s.desc = s.desc.replace('扣除對手當下體力的 60%', '扣除對手當下體力的 70%'); } }
  { const s = get('rocks', '蓄'); if (s) { s.effect.rocksStoreMult = 1.8; s.desc = s.desc.replace('1.5 倍', '1.8 倍'); } }
  { const s = get('rocks', '戴維的秘密'); if (s && s.effect.rocksSecret) { s.effect.rocksSecret.mult = [10, 18]; s.desc = s.desc.replace('8～15 倍', '10～18 倍'); } }
  /* 黑鬍子：黑暗吞噬——讓對手的招式與保命失效，吸走型態增益 */
  add('blackbeard', '引力吸入', { drainForm: .5, nullNext: .35 }, '黑暗同時吸走對手一半的型態與傷害加成（例如變身、晉升帶來的威力倍率），並有 35% 機率讓對手的下一招失效。', [['吸收加成', 'gold'], ['招式失效', 'gold']]);
  add('blackbeard', '闇穴道', { nullNext: .75 }, '75% 機率讓對手的下一招被黑暗吞噬而失效。', [['招式失效', 'gold']]);
  add('blackbeard', '解放', { voidGuard: .8 }, '命中後 80% 機率讓對手身上的保命效果（撐住致命傷、不死、瀕死回滿、重生、命數各 1 次）全部失效。', [['破保命', 'red']]);
})();

/* ==== 原 js/balance_v167.js ==== */
/* v167 七位角色強化（使用者 11/06 08:26）：
   洛克斯＝第 1～4 招都有回復、傷害再提高；大和、鷹眼（含七武海版）＝輸出提高；沙鱷魚＝控制加強；
   莫莉亞＝輸出提高＋「影子」疊層（影法師、影武者、影箱・封印累積影子，角刀影、影箱・連擊依影子層數加成，影子集合地收回全部影子造成真實傷害）；
   多佛朗明哥＝寄生線加一點控制；洛基＝輸出提高，並補上控制、回復、淨化、護盾、真實傷害。
   招式名稱與概念不變。新效果（trueBurst、shadowAdd、shadowBonus）在 js/ext_v167.js；其餘沿用既有效果欄位。
   平衡：洛克斯、洛基維持天花板之上；其他五位調到各自稀有度區間偏上、不超過上一階（量測 /root/promo/v167/bal）。
   window.__NO_V167：模擬工具量「調整前」用。必須在 balance_v165.js、ext_v165.js、ext_v167.js 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || window.__NO_V167) return;
  const get = (id, n) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === n); };
  const tag = (s, t, c) => { if (s && !(s.tags || []).some(x => x[0] === t)) (s.tags = s.tags || []).push([t, c]); };
  function upd(id, n, o) {
    const s = get(id, n); if (!s) return null;
    if (o.power !== undefined) s.power = o.power;
    s.effect = Object.assign(s.effect || {}, o.e || {}); (o.del || []).forEach(k => delete s.effect[k]);
    if (o.desc) s.desc = o.desc; if (o.tags) s.tags = o.tags; (o.add || []).forEach(([t, c]) => tag(s, t, c));
    return s;
  }

  /* ---------- 洛克斯：第 1～4 招都會回復體力，傷害再提高 ---------- */
  upd('rocks', '蝕', { power: 320, e: { lifestealPost: .25 },
    desc: '無視護盾、無視對手的能力提升、無視對手的效果技能（減傷、無敵、閃避、反彈、替身等），也無視攻擊無效與無敵，直接對敵人造成真實傷害，並把造成傷害的 25% 轉為自己的體力。命中後清除對手的能力提升。12% 機率直接秒殺（BOSS 改為受到 3 倍傷害）。命中後壓制對手：3 回合內回復量 -70%，2 回合內無法使用奧義（第 5 招，含變身與晉升）。',
    add: [['吸血', 'green']] });
  upd('rocks', '瞬', { e: { healRatio: .35, rocksShun: [.25, .5] },
    desc: '先出招。無視對手的技能與效果，自身無敵 1 回合並回復 35% 體力；下回合攻擊時有 25～50% 機率直接秒殺對手（BOSS 改為受到 3 倍傷害）。解除自身的異常狀態與負面能力。',
    add: [['回復', 'green']] });
  upd('rocks', '殺', { e: { healRatio: .15, rocksKill: { p: .7, cut: .75 } },
    desc: '對手稀有度在 SSR 以下（不含 SSR）時直接秒殺；SSR 以上（含 SSR）有 70% 直接秒殺，另外 30% 扣除對手當下體力的 75%。此技能無法被抵擋或無效化（BOSS：秒殺改為 3 倍傷害，扣除體力最多 15% 最大體力）。出招前打破對手的無敵；命中後壓制對手：3 回合內無法使用奧義（第 5 招，含變身與晉升）、回復量 -70%。出招後回復自身 15% 體力。',
    add: [['回復', 'green']] });
  upd('rocks', '蓄', { e: { healRatio: .2, rocksStoreMult: 2.2 },
    desc: '每次使用都回復自身 20% 體力。第一次使用：開始記錄之後敵人對我方造成的傷害（最多記錄 5 回合）。第二次使用：把記錄到的傷害 2.2 倍、無視護盾奉還給對手。第一次使用後超過 5 回合才再次使用，就無法奉還。',
    add: [['回復', 'green']] });
  { const s = get('rocks', '戴維的秘密'); if (s && s.effect.rocksSecret) { s.effect.rocksSecret.mult = [12, 22]; s.desc = s.desc.replace('10～18 倍', '12～22 倍'); } }

  /* ---------- 洛基：輸出提高；控制、回復、淨化、護盾、真實傷害 ---------- */
  upd('loki', '雷電噴吐', { power: 85, e: { perHitPower: 85, paralyzeChance: .25, paralyzeTurns: 1, lifestealPost: .15 },
    desc: '噴出雷電攻擊 5～10 次，並追加這次總傷害 5～10% 的額外傷害；把造成傷害的 15% 轉為自己的體力，25% 使對手麻痺 1 回合。雷電穿透一切防禦：出招前打破對手的無敵、無視對手的減傷效果；這次攻擊足以擊倒對手時，有 50% 機率讓對手的保命效果不發動。',
    add: [['吸血', 'green'], ['麻痺', 'gold']] });
  upd('loki', '鐵雷', { power: 210, e: { trueBurst: { pct: .08, label: '鐵雷的真實傷害' } },
    desc: '雷電纏身的鐵鎚重擊：50% 機率 2.5 倍爆擊，50% 使對手無法攻擊 1 回合，40% 使對手破防 3 回合；命中後再追加對手最大體力 8% 的真實傷害（無視護盾與減傷，BOSS 減半）。出招前打破對手的無敵、無視對手的減傷效果；這一擊足以擊倒對手時，有 60% 機率讓對手的保命效果（撐住致命傷、不死、瀕死回滿等）不發動。',
    add: [['真實傷害', 'red']] });
  upd('loki', '原初世界', { e: { freezeChance: .75, selfShieldMaxHpRatio: .25, healRatio: .15 },
    desc: '喚醒原初的世界：清除對手強化與自身負面狀態，回復自身 15% 體力並獲得最大體力 25% 的護盾；造成 10 次最大體力 3% 的傷害，75% 冰凍 2 回合，接下來 2 回合傷害 ×2.5。出招前先打破對手的無敵，並無視對手的減傷效果。',
    tags: [['清強化', 'blue'], ['淨化', 'green'], ['回復', 'green'], ['護盾', 'blue'], ['冰凍', 'gold'], ['破無敵', 'red']] });
  upd('loki', '鐵雷五矢', { e: { lokiBolts: [5, [.06, .1]], lokiStun: .55, trueBurst: { pct: .05, label: '第五道鐵雷' } },
    desc: '五道鐵雷貫穿：造成 5 次最大體力 6～10% 的傷害，最後一道化為真實傷害，再扣對手最大體力 5%（無視護盾與減傷，BOSS 減半）；下一次受到的攻擊以 1.5～2 倍反彈並附帶隨機異常；55% 機率使對手無法攻擊 1 回合或下一招失效；對手持續受到雷電傷害 2 回合。鐵雷穿透一切防禦：出招前打破對手的無敵、無視對手的減傷效果。',
    add: [['真實傷害', 'red'], ['控制', 'gold']] });
  upd('loki', '尼德霍格覺醒', { e: { clearSelfDebuffs: true, selfShieldMaxHpRatio: .3 },
    desc: '奧義。全能力 +2，解除自身的異常狀態與負面能力，獲得最大體力 30% 的護盾；連續 2 回合恢復全部體力，並恢復其他技能的全部次數；接下來 2 回合傷害提升 200～2000%，攻擊有 20% 機率直接秒殺（BOSS 無效）。覺醒後直到倒下前：受到的傷害 -20%，每 5 回合清除對手的能力提升。',
    add: [['淨化', 'green'], ['護盾', 'blue']] });

  /* ---------- 大和：輸出提高 ---------- */
  upd('yamato', '無侍冰牙', { power: 60, e: { perHitPower: 60, extraIceChance: .3 },
    desc: '對敵人普通攻擊 2～5 次，每次有 30% 機率附加冰凍傷害。' });
  upd('yamato', '雷鳴八卦', { power: 145, e: { jackpotChance: .15 },
    desc: '纏繞霸氣的狼牙棒高速突進，15% 機率打出 10 倍傷害；50% 使對手虛弱 2 回合（受到 1.2～1.5 倍傷害）。' });
  upd('yamato', '鳴鏑', { e: { nextAttackMult: 2.5 },
    desc: '全能力 +1，下回合攻擊威力 2.5 倍，並把自身所有負面效果與負面能力轉移給對手。' });
  upd('yamato', '鏡山', { power: 120,
    desc: '獲得自身體力 30% 的護盾，3 回合內每回合回復 10% 體力，並對敵人進行一次強力攻擊。' });

  /* ---------- 鷹眼：輸出提高（七武海版小幅） ---------- */
  upd('mihawk', '普攻', { power: 95, e: { perHitPower: 95 } });
  upd('mihawk', '劍氣狀態', { e: { nextAttackMult: [1.3, 1.8] },
    desc: '恢復自身 20～50% 體力，下回合攻擊傷害 1.3～1.8 倍。' });
  upd('mihawk', '黑刀·夜', { power: 185, e: { randomMultiplierRange: [6, 13], executeChance: .06 },
    desc: '揮動大刀斬擊對手，造成 6～13 倍傷害；6% 機率直接秒殺對手。' });
  upd('mihawk', '世界最強劍豪', { e: { dotSequence: [[.04, .06], [.04, .06], [.04, .06]] },
    desc: '全能力 +1；接下來 2 回合，對手對自己的攻擊無效；對手每回合損失 4～6% 體力，最多 3 回合。' });
  upd('mihawk_w', '斬擊', { power: 80, e: { perHitPower: 80 } });
  upd('mihawk_w', '黑刀·夜', { power: 165, e: { randomMultiplierRange: [5, 11] },
    desc: '一刀劈開冰山的斬擊：造成 5～11 倍傷害，3% 機率一刀斬殺。' });

  /* ---------- 沙鱷魚：控制加強 ---------- */
  upd('crocodile', '沙漠寶刀', { e: { petrifyChance: .2, petrifyTurns: 1 },
    desc: '15% 機率直接減少對方當前 50% 血量，否則為普通攻擊；30% 機率使對手防禦 -1（2 回合），20% 機率使對手乾涸固化 1 回合。',
    add: [['固化', 'gold']] });
  upd('crocodile', '沙漠向日葵', { e: { attackFailTurns: 2, attackFailChance: .25 },
    desc: '地面化為流沙：使對方疲憊 1 回合（無法使用技能）、隨機扣除一個技能次數 1，並使對手易傷 2 回合（受到的傷害 1.15～1.3 倍）；陷在流沙裡的對手 2 回合內攻擊有 25% 機率落空；自己下回合傷害 1.5 倍。',
    add: [['落空', 'blue']] });
  upd('crocodile', '金剛寶刀', { e: { petrifyChance: .55 },
    desc: '連續攻擊 3 次，每次造成對手當前 HP 1%～15% 傷害；55% 機率使對手固化 1 回合。' });
  upd('crocodile', '侵蝕輪迴 / 乾涸', { e: { petrifyChance: .65 },
    desc: '吸取對手部分血量，自己攻防各 +2，並有 65% 機率使對手固化 1 回合。' });
  upd('crocodile', '沙嵐（沙塵暴）', { e: { skipAttackChance: .7, attackFailTurns: 2, attackFailChance: .3 },
    desc: '全能力 +1，捲起沙塵暴造成 4～5.5 倍傷害，70% 使對手睜不開眼 1 回合無法攻擊，之後 2 回合攻擊有 30% 機率落空；之後 3 回合依序扣對手 8%、12%、15% 體力。',
    add: [['落空', 'blue']] });

  /* ---------- 莫莉亞：輸出提高＋影子疊層 ---------- */
  const SH = { n: 1, max: 5, turns: 4 };
  upd('moria', '影法師', { power: 55, e: { perHitPower: 55, shadowAdd: SH },
    desc: '召喚 3～5 個影子分身攻擊 3～5 次，並剪下對手 1 層「影子」（最多 5 層）；對手受到的傷害轉為莫莉亞的護盾（護盾只維持 1 回合）。',
    add: [['影子疊層', 'purple']] });
  upd('moria', '影武者', { e: { healRatio: .15, shadowAdd: SH },
    desc: '讓影子替身擋下對手的下一次攻擊，並回復自身 15% 體力；替身趁機剪下對手 1 層「影子」。',
    add: [['影子疊層', 'purple']] });
  upd('moria', '角刀影', { power: 150, e: { shadowBonus: { per: .2 } },
    desc: '影子化為巨大的影之蜥蜴，以尖角刺穿對手；清除對手的能力提升，並有 50% 機率使對手虛弱。對手身上每有 1 層「影子」，傷害 +20%（5 層 +100%）。',
    add: [['影子加成', 'red']] });
  { const s = get('moria', '影箱'); if (s && s.effect.variants) {
    s.effect.variants.forEach(v => { if (v.effect.noDamage) v.effect.shadowAdd = { n: 2, max: 5, turns: 4 }; else { v.power = 40; v.effect.perHitPower = 40; v.effect.shadowBonus = { per: .15 }; } });
    s.power = 40;
    s.desc = '隨機發動其中一種：「影箱・封印」對手 2 回合無法攻擊，並剪下對手 2 層「影子」；或「影箱・連擊」普通攻擊對手 5～10 次，對手每有 1 層影子傷害 +15%。';
    tag(s, '影子疊層', 'purple'); tag(s, '影子加成', 'red'); } }
  upd('moria', '影子集合地', { e: { shadowBonus: { consume: true, burst: .05 } },
    desc: '強制剪下周圍所有人的影子吸入體內：體力上限與體力增加等同對手目前的體力（最多自身最大體力的 50%），對手受到 100～1000 點隨機傷害，自身防禦 +2，身形巨大化；並收回對手身上全部的「影子」，每層再造成對手最大體力 5% 的真實傷害（無視護盾與減傷，BOSS 減半）。可使用 2 次，每施放一次身形就更巨大。',
    add: [['影子回收', 'red'], ['真實傷害', 'red']] });

  /* ---------- 多佛朗明哥：寄生線加一點控制 ---------- */
  upd('doflamingo', '寄生線', { e: { skipAttackChance: .3, skipAttackTurns: 1, ccKind: 'paralyze' },
    desc: '用絲線操縱對手的身體：對手下一次攻擊造成的傷害會反彈 20～200% 到自己身上（明哥不受傷），並使對手防禦、速度 -1（連續 2 回合）；30% 機率完全操縱對手，使其 1 回合無法行動。',
    add: [['操縱', 'gold']] });

  /* ---------- 平衡（tests/tier-sim.js 全角色量測，/root/promo/v167/bal） ---------- */
  const STAT_V167 = { rocks: 1.18, yamato: 1.05, mihawk: 1.1, mihawk_w: 1.15, crocodile: 0.875, moria: 1.15, doflamingo: 1.06 }; /* 調整前：洛克斯 1.15、大和 1.087、鷹眼 1.118、鷹眼（七武海）1.183、沙鱷魚 1.006、莫莉亞 1.262、明哥 1.071（技能變強後把綜合戰力拉回稀有度區間偏上） */
  Object.entries(STAT_V167).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V167); window.BALANCE_V167 = { stat: STAT_V167 }; }
})();

/* ==== 原 js/balance_v196.js ==== */
/* v196 基德（電磁炮模式）強化（使用者 11/10 12:46「基德技能傷害跟第五技能也要順便強化」）。
   強化前同稀有度（SSR）平均勝率 44.8%，在 33 位裡排第 29（tests/tier-sim.js，量測在 /root/promo/v196）。
   ① 磁氣機械臂：每擊威力 60 → 72，回復 3～5% → 4～7%
   ③ 電磁砲：5～15 倍 → 6～16 倍；秒殺機率 3～5% → 4～7%
   ⑤ 賦極（奧義）：對手防禦 -2 持續 2 → 3 回合；自身全能力 +1 → +2；傷害加成 +30%（2 回合）→ +50%（3 回合）；麻痺機率 25% → 50%；
      新增：隨機恢復自己一個技能 1 次（奧義除外）。
      另外修正：以前先放「磁氣魔人」（傷害 2～5 倍）再放「賦極」，倍率會被賦極的 +30% 蓋掉、反而變弱；現在保留兩者中較高的倍率（effect.multKeepMax）。
   ②④ 不變。statScale 不動。 */
(function () {
  const C = typeof CHARACTERS !== 'undefined' && CHARACTERS.kid; if (!C) return;
  const get = n => C.skills.find(s => s.name === n);
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  { const s = get('磁氣機械臂'); if (s) { s.power = 72; Object.assign(s.effect, { perHitPower: 72, healRange: [.04, .07] });
      s.desc = '用磁力組成的機械臂強力攻擊對手 3 次，並回復自身 4～7% 體力。'; } }
  { const s = get('電磁砲'); if (s) { Object.assign(s.effect, { randomMultiplierRange: [6, 16], executeChanceRange: [.04, .07] });
      s.desc = '對敵人造成 6～16 倍傷害，有 4～7% 機率直接秒殺。'; } }
  { const s = get('賦極'); if (s) { Object.assign(s.effect, { enemyDefDownTemp: [2, 3], statUpAll: 2, paralyzeChance: .5, damageMultTurns: 3, damageMultValue: 1.5, randomSelfPPUp: 1, multKeepMax: true });
      s.desc = '奧義。對手防禦 -2（持續 3 回合），自身全能力 +2，接下來 3 回合傷害 +50%（已有更高的傷害倍率時保留較高的），消除對手的能力提升，50% 機率使對手麻痺 1 回合，並隨機恢復自己一個技能 1 次（奧義除外）。';
      tag(s, '強化', 'gold'); tag(s, '破防', 'red'); tag(s, '麻痺', 'gold'); } }
  /* multKeepMax：這一招設定的傷害倍率不會蓋掉原本較高的倍率（回合數取較長的） */
  if (typeof applySkillEffects === 'function') { const _a = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) { const ef = skill && skill.effect, keep = ef && ef.multKeepMax && actor && actor.status;
      const pv = keep ? actor.status.damageMultValue || 1 : 1, pt = keep ? actor.status.damageMultTurns || 0 : 0;
      const r = _a.apply(this, arguments);
      try { if (keep && pt > 0 && pv > (actor.status.damageMultValue || 1)) { actor.status.damageMultValue = pv; actor.status.damageMultTurns = Math.max(pt, actor.status.damageMultTurns || 0); } } catch (e) { }
      return r; };
    try { window.applySkillEffects = applySkillEffects; } catch (e) { } }
})();

/* ==== 原 js/balance_v203.js ==== */
/* v203（使用者 11/12 20:49）：
   ① 艾涅爾「全方面提升攻擊傷害與效果」——數值依 tests/tier-sim.js 量測，同稀有度（SSR）平均勝率維持在 44～58%（DEC-035）。
   ② 洛克斯：蝕 威力 320 → 140；殺 威力 125 → 180（使用者指定）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, n) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === n); };
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  /* ── 艾涅爾 ── */
  { const s = get('enel', '放電'); if (s) { Object.assign(s.effect, { randomPower: [85, 320] }); s.desc = '放出雷電，造成威力 85～320 的隨機傷害。'; } }
  { const s = get('enel', '電療'); if (s) { Object.assign(s.effect, { healRange: [.32, .52] }); s.desc = (s.desc || '').replace(/30～50%|30%～50%/, '32～52%'); } }
  { const s = get('enel', '電光'); if (s) { s.power = 135; Object.assign(s.effect, { paralyzeChance: .12, paralyzeTurns: 1 }); s.desc = '以雷光直擊對手（威力 135），消除對手的能力提升與自身的異常狀態，12% 機率使對手麻痺 1 回合。'; tag(s, '麻痺', 'gold'); } }
  { const s = get('enel', '神之制裁'); if (s) { Object.assign(s.effect, { executeChance: .12 }); s.desc = (s.desc || '').replace(/10%/, '12%'); } }
  { const s = get('enel', '二億伏特·雷神'); if (s) { s.power = 120; Object.assign(s.effect, { randomMultiplierRange: [10, 26], damageReductionValue: .3 }); s.desc = '給予對手 10～26 倍傷害，下回合受到的傷害 -30%。'; } }
  /* ── 洛克斯 ── */
  { const s = get('rocks', '蝕'); if (s) { s.power = 140; s.desc = (s.desc || '').replace(/威力\s*320/, '威力 140'); } }
  { const s = get('rocks', '殺'); if (s) { s.power = 180; s.desc = (s.desc || '').replace(/威力\s*125/, '威力 180'); } }
})();

/* ==== 原 js/balance_v205.js ==== */
/* v205（使用者 11/12 21:58）：
   ① 大熊第五技能改名「毀滅光炮」：解除自身所有負面狀態與能力下降，這回合與下回合受到攻擊時反彈 50% 傷害，
      恢復 20% 體力並獲得 20% 護盾，給予對手 5～12 倍傷害；50% 機率使對手所有技能次數 -1（不含第五技能奧義）。
   ② 喬拉可爾·密佛格（七武海）升為 UR：攻擊技能與效果全面提升，定位為「瞬殺型」攻擊角色
      （數值依 tests/tier-sim.js 量測，UR 同稀有度平均勝率維持在 44～58%，DEC-035）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, n) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === n); };
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  const untag = (s, t) => { if (s.tags) s.tags = s.tags.filter(x => x[0] !== t); };

  /* ── 大熊：毀滅光炮 ── */
  { const s = get('kuma', '什麼都沒有發生'); if (s) {
    s.name = '毀滅光炮'; s.power = 100;
    s.effect = { randomMultiplierRange: [5, 12], clearSelfDebuffs: true, thornTurns: 2, thornRatio: .5, healRatio: .2, selfShieldMaxHpRatio: .2, ppDownAllChance: .5 };
    s.desc = '奧義。解除自身所有負面狀態與能力下降，這回合與下回合受到攻擊時反彈 50% 傷害，恢復 20% 體力並獲得 20% 護盾，給予對手 5～12 倍傷害；50% 機率使對手所有技能次數 -1（不含第五技能奧義）。';
    untag(s, '無法攻擊'); untag(s, '疲勞'); tag(s, '淨化', 'green'); tag(s, '反彈', 'gold'); tag(s, '護盾', 'blue'); tag(s, '次數-1', 'purple'); } }

  /* 新效果 ppDownAllChance：機率使對手所有非奧義技能次數 -1 */
  if (typeof applySkillEffects === 'function') { const _ase = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) { const r = _ase.apply(this, arguments);
      try { const ef = skill && skill.effect; if (ef && ef.ppDownAllChance && target && target.hp > 0 && Math.random() < ef.ppDownAllChance) {
        let n = 0; (target.skills || []).forEach(x => { if (!x.ultimate && x.pp > 0) { x.pp--; n++; } });
        if (n && typeof log === 'function') log(`💥 ${target.name} 被光炮轟散了架勢：所有技能次數 -1！`); } } catch (e) { }
      return r; };
    try { window.applySkillEffects = applySkillEffects; } catch (e) { } }

  /* ── 喬拉可爾·密佛格（七武海）→ UR，瞬殺型 ── */
  if (CHARACTERS.mihawk_w && typeof CHAR_RARITY !== 'undefined') { CHAR_RARITY.mihawk_w = 'UR';
    const S = CHARACTERS.mihawk_w;
    { const s = get('mihawk_w', '斬擊'); if (s) { s.power = 90; Object.assign(s.effect, { multiHitNormal: [3, 5], perHitPower: 90, executeChance: .02 });
      s.desc = '以黑刀「夜」快速斬擊 3～5 次，2% 機率一刀斬殺。'; tag(s, '斬殺', 'red'); } }
    { const s = get('mihawk_w', '劍氣狀態'); if (s) { Object.assign(s.effect, { healRange: [.2, .4], nextAttackMult: [1.3, 1.8], nextAttackMultTurns: 2 });
      s.desc = '劍氣纏身：回復 20～40% 體力，接下來 2 回合的下一次攻擊威力 ×1.3～1.8。'; } }
    { const s = get('mihawk_w', '黑刀·夜'); if (s) { s.power = 180; Object.assign(s.effect, { executeChance: .07, randomMultiplierRange: [6, 13] });
      s.desc = '一刀劈開冰山的斬擊：造成 6～13 倍傷害，7% 機率一刀斬殺。'; } }
    { const s = get('mihawk_w', '洞察弱點'); if (s) { Object.assign(s.effect, { enemyDefDownTemp: [2, 2], weakTurns: 2, weakRange: [1.2, 1.6] });
      s.desc = '鷹眼看穿對手的破綻：清除對手的能力提升、對手防禦 -2（2 回合），並使對手虛弱 2 回合（受到 1.2～1.6 倍傷害）。'; } }
    { const s = get('mihawk_w', '世界最強劍豪'); if (s) { Object.assign(s.effect, { dotSequence: [[.03, .06], [.03, .06], [.03, .06]] });
      s.desc = '奧義。全能力 +1，1 回合內不受任何傷害，並讓對手連續 3 回合受到 3～6% 最大體力的斬擊傷害。'; } }
    void S; }
})();

/* ==== 原 js/balance_v206.js ==== */
/* v206（使用者 11/12 23:30）：喬拉可爾·密佛格（UR）要比密佛格（七武海）傷害更強、效果更多。
   數值依 tests/tier-sim.js 量測，UR 同稀有度平均勝率維持在 44～58%（DEC-035）。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || !CHARACTERS.mihawk) return;
  const get = n => CHARACTERS.mihawk.skills.find(s => s.name === n);
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  { const s = get('普攻'); if (s) { s.power = 95; Object.assign(s.effect, { multiHitNormal: [3, 5], perHitPower: 95 });
    s.desc = '對敵人進行 3～5 段連續揮砍攻擊。'; } }
  { const s = get('劍氣狀態'); if (s) { Object.assign(s.effect, { healRange: [.2, .5], nextAttackMult: [1.3, 1.8], nextAttackMultTurns: 2});
    s.desc = '恢復自身 20～50% 體力，下回合攻擊傷害 1.3～1.8 倍。'; } }
  { const s = get('黑刀·夜'); if (s) { s.power = 185; Object.assign(s.effect, { executeChance: .08, randomMultiplierRange: [6, 13] });
    s.desc = '揮動大刀斬擊對手，造成 6～13 倍傷害；8% 機率直接秒殺對手。'; } }
  { const s = get('洞察弱點'); if (s) { Object.assign(s.effect, { weakRange: [1.1, 1.5] });
    s.desc = '清除對手的能力提升，對手防禦 -2（2 回合），且 2 回合內受到的傷害為 1.1～1.5 倍。'; } }
  { const s = get('世界最強劍豪'); if (s) { Object.assign(s.effect, { dotSequence: [[.04, .06], [.04, .06], [.04, .06]], clearSelfDebuffs: true }); tag(s, '淨化', 'green');
    s.desc = '解除自身的異常狀態與負面能力，全能力 +1；接下來 2 回合，對手對自己的攻擊無效；對手每回合損失 4～6% 體力，最多 3 回合。'; } }
})();

/* ==== 原 js/balance_v211.js ==== */
/* v211（使用者 11/14 01:51）：青雉、大和在 v210 狀態改版後勝率偏低（39.4%、42.2%），提高技能威力、倍率與冰凍機率。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const G = (id, n, f) => { const c = CHARACTERS[id], s = c && c.skills.find(x => x.name === n); if (s) f(s, s.effect || (s.effect = {})); };
  const up = (s, k) => { if (s.power) s.power = Math.round(s.power * k); };
  /* 青雉：v213 撤回（v211 的模擬沒算進冰凍無法行動，青雉其實偏強），改由 balance_v213.js 調 statScale */
  /* 大和 */
  G('yamato', '無侍冰牙', (s, e) => { e.perHitPower = 70; e.extraIceChance = .4; s.desc = (s.desc || '').replace('30% 機率附加冰凍傷害', '40% 機率附加冰凍傷害'); });
  G('yamato', '雷鳴八卦', (s, e) => { up(s, 1.15); e.jackpotChance = .2; s.desc = (s.desc || '').replace('15% 機率打出 10 倍傷害', '20% 機率打出 10 倍傷害'); });
  G('yamato', '鏡山', s => up(s, 1.15));
  G('yamato', '大口真神形態', (s, e) => { e.freezeChance = .85; s.desc = (s.desc || '').replace('70% 使對手冰凍', '85% 使對手冰凍'); });
})();

/* ==== 原 js/balance_v213.js ==== */
/* v213（使用者 11/14 02:47）：依全角色勝率（對全部 83 位角色，不含伊姆）調整，只改 statScale。
   白星 45% → 約 60%、青雉 80% → 約 56%（並撤回 v211 的技能強化）、莫內 59% → 約 47%、軍子宮 50% → 約 54%。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const S = { shirahoshi: 1.185, aokiji: 1.17, monet: 1.135, gunko: .72 };
  Object.entries(S).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
})();
