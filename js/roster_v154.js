/* v154 新角色：「鐵棒」亞爾麗塔（亞爾麗塔海賊團船長，RR）。使用者 11/03：三招（高速滑行、鐵棒打擊、棒打連擊），技能效果由 Claude 設計；
   取得方式：通關東海篇「風車村的出航之日」時 50% 機率免費加入（每次通關都會判定，直到加入為止；不在懸賞召喚裡）。
   app.js onBattleEnd 的 boss 分支讀 CHAR_OBTAIN[id].clearDrop（章節 id）與 clearRate。必須在 roster_v91 之前載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const V = 154, img = n => `assets/chars/${n}.webp?v=${V}`;
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  CHARACTERS.alvida = { id: 'alvida', name: '亞爾麗塔', title: '「鐵棒」亞爾麗塔', types: ['格鬥'], scale: 1, worldScale: 1, battleScale: .7, ai: 'aggressive',
    image: img('alvida'), avatar: img('alvida_face'), ultimateBg: img('alvida'), cardPos: '50% 10%', cardFocus: '50% 12%',
    maxHp: 1450, baseSpeed: 96, statScale: 1.08, role: '攻擊型',
    desc: '東海的女海賊，亞爾麗塔海賊團的船長，扛著一根釘頭鐵棒。自認是「這片海上最美的女人」，曾經把克比抓到船上當了兩年的雜工。',
    skills: [
      S('高速滑行', 'support', 6, 0, '用滑溜溜的身體在地上高速滑行：閃避 1 回合、速度 +2；接下來 2 回合的下一次攻擊威力 ×1.3。', [['閃避', 'blue'], ['加速', 'gold'], ['強化', 'gold']], 'aura',
        { dodgeTurns: 1, selfBuffSpd: 2, nextAttackMult: 1.3, nextAttackMultTurns: 2 }),
      S('鐵棒打擊', 'attack', 12, 120, '扛起釘頭鐵棒用力砸下；30% 機率使對手暈眩 1 回合。', [['強力', 'red'], ['暈眩', 'gold']], 'sandslash',
        { stunChance: .3, stunTurns: 1 }),
      S('棒打連擊', 'attack', 6, 0, '揮著鐵棒連續痛打 2～4 次；命中後 40% 機率讓對手防禦 -1（3 回合）。', [['連擊', 'red'], ['降防', 'blue']], 'shigan',
        { multiHitNormal: [2, 4], perHitPower: 48, enemyDefDownChance: [.4, [1, 1], 3] })
    ] };
  if (!CHARACTER_ORDER.includes('alvida')) CHARACTER_ORDER.push('alvida');
  CHAR_RARITY.alvida = 'RR';
  CHAR_OBTAIN.alvida = { boss: 0, clearDrop: 'east', clearRate: .5, clearLv: 10, npc: '通關東海篇「風車村的出航之日」時 50% 機率加入（每次通關都會判定）' };
})();
