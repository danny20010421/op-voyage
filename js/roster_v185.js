/* v185 新角色與皮膚（使用者 11/09 01:15）：
   ・文斯莫克·蕾玖（reiju，SR，控制型，立繪 0.65）：只能從一般懸賞召喚取得；蛋糕島篇 NPC。技能由 Claude 依原作設計（毒粉紅、毒之吻、吸毒、傑爾馬的隱形戰鬥服）。
   ・妮可·羅賓（和之國）（robin_wano，SSR，控制型，立繪 0.65）：只能從一般懸賞召喚取得；和之國篇 NPC。技能取自羅賓在鬼島對決黑瑪利亞時用過的招式
     （六輪開花·緊鎖、千紫萬紅·巨大之手、百花繚亂·翅膀、惡魔開花、惡魔開花·大噴泉緊鎖）。
   ・刪除妮可·羅賓的皮膚「城市女郎」（skins_v143.js 一併移除抽獎機率）；已擁有的玩家改發覺醒結晶 ×10，裝備中的自動卸下。
   ・薇薇的皮膚「水之都的祈禱」換成新立繪（vivi_skin2），立繪 0.65。
   必須在 roster_v91 之前載入（圖鑑、角色順序由 codex_order_v164.js 處理）。 */
(function () {
  const V = 185, img = n => `assets/chars/${n}.webp?v=${V}`;
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});

  CHARACTERS.reiju = { id: 'reiju', name: '文斯莫克·蕾玖', title: '毒粉紅', types: ['闇'], scale: .95, worldScale: 1, battleScale: .65, ai: 'control',
    image: img('reiju'), avatar: img('reiju_face'), ultimateBg: img('reiju'), cardPos: '50% 12%', cardFocus: '50% 15%',
    maxHp: 1400, baseSpeed: 118, statScale: 1.0, role: '控制型',
    desc: '傑爾馬王國文斯莫克家的長女、香吉士的姊姊，「傑爾馬 66」的「毒粉紅」。身體經過改造，能吸收毒素、用毒攻擊，也能吸走別人身上的毒。在萬國暗中幫助了香吉士與草帽一夥。【定位】控制型：中毒持續傷害、麻痺與降攻，搭配吸毒自我回復。',
    skills: [
      S('毒粉紅', 'attack', 12, 60, '帶毒的踢擊連續攻擊 2 次；60% 機率使對手中毒 3 回合（每回合扣最大體力 5%）。', [['連擊', 'red'], ['中毒', 'red']], 'dash',
        { multiHitNormal: [2, 2], perHitPower: 60, dotChance: .6, dotTurns: 3, dotRatio: .05, dotLabel: '中毒' }),
      S('毒之吻', 'attack', 6, 70, '帶著劇毒的一吻：40% 機率使對手麻痺 1 回合無法攻擊，對手攻擊 -1（2 回合）；造成傷害的 30% 回復到自己身上。', [['麻痺', 'gold'], ['降攻', 'blue'], ['吸血', 'green']], 'haki',
        { skipAttackChance: .4, skipAttackTurns: 1, ccKind: 'paralyze', enemyAtkDownChance: [[1, 1], 1, 3], lifestealRange: [.3, .3] }),
      S('吸毒', 'support', 5, 0, '把身上的毒與傷全部吸走：回復 30% 體力、清除自身的負面效果，並清除對手的能力提升。', [['回復', 'green'], ['淨化', 'green'], ['清除強化', 'blue']], 'heal',
        { healRatio: .3, clearSelfDebuffs: true, clearBuffs: true }),
      S('隱形戰鬥服', 'support', 5, 0, '傑爾馬的戰鬥服讓身影消失在空氣中：下回合躲開對手的攻擊，速度 +1，接下來的攻擊傷害 1.5 倍。', [['閃避', 'green'], ['加速', 'gold'], ['增傷', 'red']], 'flash',
        { dodgeTurns: 1, selfBuffSpd: 1, nextAttackMult: 1.5, nextAttackMultTurns: 1 }),
      S('劇毒之霧・粉紅暴風', 'attack', 2, 160, '奧義。全身放出粉紅色的劇毒，造成 2～4 倍傷害：對手中毒 3 回合（每回合扣最大體力 8%）、全能力 -1，60% 機率麻痺 1 回合。無法用道具恢復次數。', [['奧義', 'gold'], ['中毒', 'red'], ['降能力', 'blue'], ['麻痺', 'gold']], 'awaken',
        { randomMultiplierRange: [2, 4], dotChance: 1, dotTurns: 3, dotRatio: .08, dotLabel: '中毒', enemyAllDown: 1, skipAttackChance: .6, skipAttackTurns: 1, ccKind: 'paralyze', noRestore: true }, true)
    ] };

  CHARACTERS.robin_wano = { id: 'robin_wano', name: '妮可·羅賓（和之國）', title: '惡魔之子・鬼島之戰', types: ['自然'], scale: .95, worldScale: 1, battleScale: .65, ai: 'control',
    image: img('robin_wano'), avatar: img('robin_wano_face'), ultimateBg: img('robin_wano'), cardPos: '50% 8%', cardFocus: '50% 10%',
    maxHp: 1500, baseSpeed: 116, statScale: 1.05, role: '控制型',
    desc: '潛入和之國時化名「阿羅賓」的羅賓。在鬼島上與百獸海賊團「飛六胞」的黑瑪利亞對決，第一次展現了「惡魔開花」的姿態。【定位】控制型：用無數的手鎖住對手——麻痺、暈眩、降防，奧義以大噴泉緊鎖一口氣扭斷對手。',
    skills: [
      S('六輪開花·緊鎖', 'attack', 12, 70, '在對手身上開出手臂反折關節：50% 機率使對手麻痺 1 回合，對手速度 -1（2 回合）。', [['麻痺', 'gold'], ['降速', 'blue']], 'limbs',
        { paralyzeChance: .5, paralyzeTurns: 1, enemySpdDownTemp: [1, 2] }),
      S('千紫萬紅·巨大之手', 'attack', 8, 120, '開出巨大的手臂重重拍下：對手防禦 -2（3 回合），30% 機率使對手暈眩 1 回合。', [['破防', 'blue'], ['暈眩', 'gold']], 'gigante',
        { enemyDefDownTemp: [2, 3], stunChance: .3, stunTurns: 1 }),
      S('百花繚亂·翅膀', 'support', 6, 0, '用手臂開出翅膀飛上空中：下回合躲開對手的攻擊，回復 15% 體力，速度 +1。', [['閃避', 'green'], ['回復', 'green'], ['加速', 'gold']], 'wings',
        { dodgeTurns: 1, healRatio: .15, selfBuffSpd: 1 }),
      S('惡魔開花', 'support', 4, 0, '以花花果實做出巨大的惡魔分身：全能力 +1、清除自身的負面效果，2 回合免疫異常狀態，接下來的攻擊傷害 2 倍。', [['強化', 'gold'], ['淨化', 'green'], ['免疫', 'green'], ['增傷', 'red']], 'demonflower',
        { statUpAll: 1, clearSelfDebuffs: true, immuneTurns: 2, nextAttackMult: 2, nextAttackMultTurns: 1 }),
      S('惡魔開花·大噴泉緊鎖', 'attack', 2, 150, '奧義。惡魔分身用無數的手臂把對手整個反折：造成 3～6 倍傷害，對手暈眩 2 回合、全能力 -1，並清除對手的能力提升。無法用道具恢復次數。', [['奧義', 'gold'], ['暈眩', 'gold'], ['降能力', 'blue'], ['清除強化', 'blue']], 'demonflower',
        { randomMultiplierRange: [3, 6], stunChance: 1, stunTurns: 2, enemyAllDown: 1, clearBuffs: true, noRestore: true }, true)
    ] };

  ['reiju', 'robin_wano'].forEach(id => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); });
  CHAR_RARITY.reiju = 'SR'; CHAR_RARITY.robin_wano = 'SSR';
  CHAR_OBTAIN.reiju = { boss: 0, npc: '蛋糕島篇 NPC（只能從一般懸賞召喚取得）' };
  CHAR_OBTAIN.robin_wano = { boss: 0, npc: '和之國篇 NPC（只能從一般懸賞召喚取得）' };

  /* 劇情地圖 NPC */
  const npc = (ch, n) => { const C = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === ch); if (C && C.npcs && !C.npcs.some(x => x.id === n.id)) C.npcs.push(n); };
  npc('wholecake', { id: 'reiju_n', name: '蕾玖', role: '傑爾馬 66・毒粉紅', look: 'reiju', pos: [-24, 88], chat: ['香吉士那孩子……還是一樣溫柔呢。', '別擔心，你身上的毒，我替你吸走。', '這場婚禮是個陷阱。快逃吧，趁現在。'] });
  npc('wano', { id: 'robin_wano_n', name: '阿羅賓', role: '潛入和之國的藝伎', look: 'robin_wano', pos: [-96, -68], chat: ['在這個國家，我叫「阿羅賓」。', '光月家的歷史本文……一定藏在這個國家的某處。', '「惡魔之子」——這個稱呼，我已經不在乎了。'] });

  /* 結算畫面臉部位置（faces_v178.js） */
  const faces = () => { if (window.CHAR_FACE) Object.assign(CHAR_FACE, { 'assets/chars/reiju.webp': [.505, .153, .092], 'assets/chars/robin_wano.webp': [.455, .076, .083], 'assets/chars/vivi_skin2.webp': [.476, .091, .105] }); };
  window.addEventListener('DOMContentLoaded', faces); /* faces_data_v178.js 晚載入會整個重設 CHAR_FACE，所以等載完再補 */

  /* 薇薇「水之都的祈禱」換新立繪 */
  if (typeof SKINS !== 'undefined' && SKINS.vivi_water) Object.assign(SKINS.vivi_water, { image: img('vivi_skin2'), avatar: img('vivi_skin2_face'), battleScale: .65 });

  /* 已擁有「城市女郎」的存檔：移除並補償覺醒結晶 ×10，裝備中的卸下 */
  function cleanCity() {
    try { const d = SAVE && SAVE.data; if (!d || !d.skins) return; const S2 = d.skins; let changed = false;
      if (Array.isArray(S2.owned) && S2.owned.includes('robin_city')) { S2.owned = S2.owned.filter(k => k !== 'robin_city'); d.inventory = d.inventory || {}; d.inventory.awaken_gem = (d.inventory.awaken_gem || 0) + 10; changed = true; setTimeout(() => window.toast && toast('皮膚「城市女郎」已下架，補償覺醒結晶 ×10', 'gold'), 3000); }
      if (S2.equip) Object.keys(S2.equip).forEach(c => { if (S2.equip[c] === 'robin_city') { delete S2.equip[c]; changed = true; } });
      if (d.inventory && d.inventory.skin_robin_city) { delete d.inventory.skin_robin_city; changed = true; }
      if (changed) SAVE.save(); } catch (e) { }
  }
  window.addEventListener('DOMContentLoaded', () => setTimeout(cleanCity, 500));
  window.addEventListener('op:cloud-loaded', cleanCity);
})();
