/* v142：娜美（天候棒・SSR・爆發速度型）——只能從一般懸賞召喚取得。序號 No.003（草帽一夥第 3 位，必須在 roster_v91 之前載入）。
   招式參考原作的魔法天候棒（Sorcery Clima-Tact）與雷雲「宙斯」：先用落雷與蜃氣樓累積速度、偷走對手的強化，再一口氣放出宙斯的雷擊。
   特殊效果 namiSteal、namiZeus 在 ext_v142.js；五招動畫在 fx_v142.js。戰鬥立繪縮放 0.7（v143 換新立繪，使用者指定）。
   皮膚「波雲雷擊」（nami_cloud）：活動中心的限時活動「天候祭」免費取得（weekly.js）。 */
(function () {
  const V = 142, V2 = 143, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  CHARACTERS.nami = { id: 'nami', name: '娜美', title: '小貓竊賊', types: ['雷電', '水'], scale: .95, worldScale: 1, battleScale: .7, ai: 'aggressive',
    image: `assets/chars/nami.webp?v=${V2}`, avatar: `assets/chars/nami_face.webp?v=${V2}`, ultimateBg: `assets/chars/nami.webp?v=${V2}`, cardPos: '50% 8%', cardFocus: '50% 10%',
    maxHp: 1300, baseSpeed: 132, statScale: 1, role: '爆發速度型',
    desc: '草帽一夥的航海士，綽號「小貓竊賊」。能讀懂天氣與海流，用魔法天候棒操縱雷雲、熱氣與冷氣；和雷雲「宙斯」聯手時，雷擊足以撼動整片海。最愛的是橘子和錢。',
    skills: [
      S('雷擊節奏', 'attack', 14, 95, '在對手頭上造出小雷雲，降下落雷：造成傷害，25% 使對手麻痺 1 回合；自身速度 +1（天候越來越站在娜美這邊）。', [['麻痺', 'gold'], ['加速', 'gold']], 'lightning',
        { paralyzeChance: .25, paralyzeTurns: 1, selfBuffSpd: 1 }),
      S('蜃氣樓節奏', 'support', 4, 0, '用冷熱空氣做出海市蜃樓的分身：閃避下一次攻擊、下回合先出招，接下來 2 回合攻擊傷害 ×1.7。', [['閃避', 'blue'], ['先制', 'gold'], ['增傷', 'red']], 'buff',
        { dodgeTurns: 1, selfPriority: 1, nextAttackMult: 1.7, nextAttackMultTurns: 2 }),
      S('小貓竊賊', 'attack', 6, 60, '航海士兼小偷的看家本領：這回合先出招，把對手的能力提升「偷」到自己身上（對手的提升歸零），再摸走對手隨機一招 1 次技能次數，補到自己的「雷擊節奏」。', [['先制', 'gold'], ['偷取強化', 'gold'], ['偷取次數', 'blue']], 'dash',
        { firstStrike: true, namiSteal: { pp: 1, to: '雷擊節奏' } }),
      S('雷光槍節奏', 'attack', 8, 135, '把雷電凝聚成長槍刺出：無視護盾，35% 機率造成 2.2 倍爆擊，40% 機率使對手破防 2 回合。', [['無視護盾', 'red'], ['爆擊', 'red'], ['破防', 'blue']], 'lightning',
        { ignoreShield: true, critBoost: .35, critMult: 2.2, armorBreakChance: .4, armorBreakTurns: 2 }),
      S('宙斯・微風節奏', 'attack', 2, 100, '奧義。呼喚雷雲「宙斯」，把整片雷雲的電一口氣砸向對手：5～12 倍傷害，必定使對手麻痺 1 回合；自身每 1 層速度提升，傷害再 +15%（最多 +90%）。', [['奧義', 'gold'], ['倍率', 'red'], ['麻痺', 'gold'], ['速度加成', 'gold']], 'lightning',
        { randomMultiplierRange: [5, 12], paralyzeChance: 1, paralyzeTurns: 1, namiZeus: .15 }, true)
    ] };
  if (!CHARACTER_ORDER.includes('nami')) CHARACTER_ORDER.push('nami');
  CHAR_RARITY.nami = 'SSR';
  CHAR_OBTAIN.nami = { boss: 0, npc: '僅能從一般懸賞召喚取得' };
  if (typeof SKINS !== 'undefined') SKINS.nami_cloud = { char: 'nami', name: '波雲雷擊', image: `assets/chars/nami_skin1.webp?v=${V}`, avatar: `assets/chars/nami_skin1_face.webp?v=${V}`, battleScale: .6, event: 'weather142', how: '限時活動「天候祭」免費獲得（活動中心）' };
})();
