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
