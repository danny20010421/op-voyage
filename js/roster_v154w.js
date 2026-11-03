/* v154 和之國篇的三位船員（使用者 11/04 提供立繪；SSR；只能從一般懸賞召喚取得）。技能由 Claude 依和之國篇裡實際用過的招式設計：
   索隆（和之國篇）：煉獄鬼斬、黑繩・大龍卷、九刀流阿修羅、閻魔（霸王色纏繞）、奧義「三千世界」。立繪 0.7（使用者給的圖已鏡射）。
   魯夫（和之國篇）：猿王銃、流櫻、猿王群鴉砲、霸王色纏繞、奧義「猿神銃」。立繪 0.65。
   香吉士（和之國篇）：惡魔風腳・首肉、粗碎、外骨骼・隱形、惡魔風腳・一級挽肉、奧義「魔神風腳」。立繪 0.7。
   v156 平衡：三人原本的招式威力只有其他 SSR 的一半左右（對戰勝率約 5%），依 v156 強度定義（tests/tier-sim.js）把攻擊威力提高約 1.4～3.5 倍、猿神銃加上 3～4.5 倍傷害；三人的強化招式各加 20～25% 回復（BOSS 戰撐不久）。
   和之國篇劇情裡的 '@luffy'／'@zoro' 改成這兩位（劇情用的是篇章當時的樣子，不受皮膚影響）。必須在 roster_v91 之前載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const V = 154, img = n => `assets/chars/${n}.webp?v=${V}`;
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const base = (id, name, title, types, battleScale, extra) => Object.assign({ id, name, title, types, scale: 1, worldScale: 1, battleScale, ai: 'aggressive', image: img(id), avatar: img(id + '_face'), ultimateBg: img(id), cardPos: '50% 8%', cardFocus: '50% 10%' }, extra);
  CHARACTERS.zoro_wano = base('zoro_wano', '索隆（和之國篇）', '閻魔與霸王色', ['格鬥'], .7, {
    maxHp: 1620, baseSpeed: 116, statScale: 1.06, role: '攻擊型',
    desc: '在和之國拿到光月御田的名刀「閻魔」。閻魔會不斷吸走使用者的霸氣，索隆在鬼之島屋頂和凱多交手後，終於駕馭它，覺醒了霸王色的纏繞。',
    skills: [
      S('三刀流・煉獄鬼斬', 'attack', 10, 200, '三把刀纏上霸氣交叉斬出，無視護盾；30% 機率使對手燒傷 3 回合。', [['無視護盾', 'red'], ['燒傷', 'gold']], 'onigiri',
        { ignoreShield: true, burnChance: .3, burnTurns: 3 }),
      S('黑繩・大龍卷', 'attack', 8, 0, '捲起漆黑的龍捲風連續斬擊 3～5 次；命中後對手速度 -1（3 回合）。', [['連擊', 'red'], ['降速', 'blue']], 'shishi',
        { multiHitNormal: [3, 5], perHitPower: 70, enemySpdDownTemp: [1, 3] }),
      S('九刀流「阿修羅・魔九閃」', 'attack', 5, 0, '鬼氣化成三頭六臂，九把刀一起斬下 9 次；對手體力越低傷害越高（最多 2 倍）。', [['連擊', 'red'], ['斬殺', 'red']], 'ashura',
        { multiHitNormal: [9, 9], perHitPower: 40, lowHpBonus: 2 }),
      S('閻魔・霸王色纏繞', 'support', 3, 0, '任由閻魔吸走霸氣，換來霸王色的纏繞：攻擊 +3、防禦 -1、回復 20% 體力；接下來 2 回合的下一次攻擊威力 ×1.8。', [['強化', 'gold'], ['下一擊', 'red'], ['代價', 'blue']], 'haki',
        { selfBuffAtk: 3, selfBuffDef: -1, healRatio: .2, nextAttackMult: 1.8, nextAttackMultTurns: 2 }),
      S('三刀流奧義「三千世界」', 'attack', 2, 0, '奧義。一邊旋轉一邊揮出三千道斬擊，強烈攻擊 4 次、無視護盾與減傷；40% 機率使對手恐懼 1 回合。', [['奧義', 'gold'], ['連擊', 'red'], ['無視護盾', 'red'], ['恐懼', 'gold']], 'sanzen',
        { multiHitNormal: [4, 4], perHitPower: 250, ignoreShield: true, fearChance: .4, fearTurns: 1, sureHit: true }, true)
    ] });
  CHARACTERS.luffy_wano = base('luffy_wano', '魯夫（和之國篇）', '流櫻的魯太郎', ['格鬥', '超能'], .65, {
    maxHp: 1680, baseSpeed: 118, statScale: 1.06, role: '攻擊型',
    desc: '在和之國化名「魯太郎」。在兔丼監獄跟著老俠客「花之兵五郎」學會了流櫻——不碰觸對手也能從內部破壞的霸氣。鬼之島的屋頂上，霸王色纏繞的拳頭打倒了凱多。',
    skills: [
      S('橡膠橡膠猿王銃', 'attack', 10, 200, '把拳頭灌氣變得巨大，纏上霸氣砸下；30% 機率使對手暈眩 1 回合。', [['強力', 'red'], ['暈眩', 'gold']], 'punch',
        { stunChance: .3, stunTurns: 1 }),
      S('流櫻', 'attack', 8, 170, '不碰到對手，霸氣直接從內部破壞：無視護盾並打破護盾，對手防禦 -2（3 回合）。', [['無視護盾', 'red'], ['破盾', 'red'], ['降防', 'blue']], 'haki',
        { ignoreShield: true, shieldBreak: true, enemyDefDownChance: [1, [2, 2], 3] }),
      S('橡膠橡膠猿王群鴉砲', 'attack', 6, 0, '雙拳像機關槍一樣灌氣連打 4～6 次，每次命中 25% 機率讓對手攻擊 -1。', [['連擊', 'red'], ['降攻', 'blue']], 'barrage',
        { multiHitNormal: [4, 6], perHitPower: 65, enemyAtkDownChance: [[.25, .25], 1, 3] }),
      S('霸王色纏繞', 'support', 3, 0, '覺醒霸王色的纏繞：全能力 +1、解除自身負面狀態、回復 25% 體力；接下來 2 回合的下一次攻擊威力 ×1.6。', [['強化', 'gold'], ['淨化', 'green'], ['下一擊', 'red']], 'awaken',
        { statUpAll: 1, clearSelfDebuffs: true, healRatio: .25, nextAttackMult: 1.6, nextAttackMultTurns: 2 }, false),
      S('橡膠橡膠猿神銃', 'attack', 2, 260, '奧義。把整條手臂灌氣到比凱多還大，纏上霸王色砸下，造成 3～4.5 倍傷害：無視護盾、必中；50% 機率使對手暈眩 1 回合。', [['奧義', 'gold'], ['強力', 'red'], ['必中', 'red'], ['暈眩', 'gold']], 'punch',
        { randomMultiplierRange: [3, 4.5], ignoreShield: true, sureHit: true, stunChance: .5, stunTurns: 1 }, true)
    ] });
  CHARACTERS.sanji_wano = base('sanji_wano', '香吉士（和之國篇）', '魔神風腳', ['火', '格鬥'], .7, {
    maxHp: 1560, baseSpeed: 124, statScale: 1.05, role: '攻擊型',
    desc: '在和之國化名「三五郎」，以蕎麥麵攤打響名號。鬼之島上穿著傑爾馬的外骨骼戰鬥服對上奎因，覺醒了比惡魔風腳更燙的藍色火焰——魔神風腳。',
    skills: [
      S('惡魔風腳・首肉', 'attack', 10, 190, '燒紅的腳踢向對手的脖子；35% 機率使對手燒傷 3 回合。', [['燒傷', 'gold']], 'karyu',
        { burnChance: .35, burnTurns: 3 }),
      S('粗碎', 'attack', 6, 230, '從空中用腳跟重重踩下；30% 機率使對手暈眩 1 回合，並使對手破防 2 回合。', [['強力', 'red'], ['暈眩', 'gold'], ['破防', 'gold']], 'skywalk',
        { stunChance: .3, stunTurns: 1, armorBreakChance: 1, armorBreakTurns: 2 }),
      S('外骨骼・隱形', 'support', 4, 0, '穿上傑爾馬的戰鬥服隱形：閃避 1 回合、速度 +2、回復 20% 體力（外骨骼的自癒力）；接下來 2 回合的下一次攻擊威力 ×1.5。', [['閃避', 'blue'], ['加速', 'gold'], ['下一擊', 'red']], 'aura',
        { dodgeTurns: 1, selfBuffSpd: 2, healRatio: .2, nextAttackMult: 1.5, nextAttackMultTurns: 2 }),
      S('惡魔風腳・一級挽肉', 'attack', 6, 0, '火焰中連續踢擊 5～8 次；30% 機率使對手燒傷 2 回合。', [['連擊', 'red'], ['燒傷', 'gold']], 'karyu',
        { multiHitNormal: [5, 8], perHitPower: 50, burnChance: .3, burnTurns: 2 }),
      S('魔神風腳・頰肉射擊', 'attack', 2, 0, '奧義。藍色的魔神之火包住雙腳，強烈踢擊 3 次、無視護盾，必定使對手燒傷 3 回合，並讓對手防禦 -2。', [['奧義', 'gold'], ['連擊', 'red'], ['無視護盾', 'red'], ['燒傷', 'gold']], 'ifrit',
        { multiHitNormal: [3, 3], perHitPower: 300, ignoreShield: true, burnChance: 1, burnTurns: 3, enemyDefDownChance: [1, [2, 2], 3] }, true)
    ] });
  ['zoro_wano', 'luffy_wano', 'sanji_wano'].forEach(id => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); CHAR_RARITY[id] = 'SSR'; CHAR_OBTAIN[id] = { boss: 0 }; });
})();
