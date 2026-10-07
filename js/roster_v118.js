/* v118：尼卡魯夫（四皇・UR+・攻擊生存型，限皇帝領海）、魯夫（巨人篇）降為 SSR、皇帝領海加入第 6 位皇帝。
   必須在 roster_v91 之前載入（序號：四皇第 4 位）。戰鬥效果在 ext_v118.js。 */
(function () {
  const V = 118, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  CHARACTERS.luffy_nika = { id: 'luffy_nika', name: '尼卡魯夫', title: '四皇・太陽神尼卡', types: ['超能', '格鬥'], scale: .95, worldScale: 1, battleScale: .8, ai: 'balanced',
    image: `assets/chars/luffy_nika.webp?v=${V}`, avatar: `assets/chars/luffy_nika_face.webp?v=${V}`, ultimateBg: `assets/chars/luffy_nika.webp?v=${V}`, cardPos: '55% 20%',
    maxHp: 2150, baseSpeed: 122, statScale: 1.12, role: '攻擊生存型',
    desc: '覺醒了橡膠果實——真名「人人果實 幻獸種 模型：尼卡」的魯夫。被稱為「解放之戰士」的太陽神，能讓身體與周遭的一切都像橡膠一樣自由變化，笑著打倒強敵。',
    skills: [
      S('橡膠橡膠·火箭砲', 'attack', 10, 13, '連續攻擊 5～50 次，對手受到的傷害全部轉為自身護盾。', [['連擊', 'red'], ['護盾', 'green']], 'barrage', { multiHitNormal: [5, 50], perHitPower: 13, dmgToShield: 1 }),
      S('橡膠橡膠·雷電', 'attack', 5, 135, '抓住閃電砸向對手：使對手麻痺 1 回合，無視護盾直接造成傷害。若這招被對手的閃避或無敵躲開，對手下回合的攻擊會反彈自己 20～120% 的傷害。', [['麻痺', 'gold'], ['破盾', 'blue'], ['反彈', 'gold']], 'lightning', { paralyzeChance: 1, paralyzeTurns: 1, ignoreShield: true, nikaThunder: [.2, 1.2] }),
      S('解放之鼓', 'support', 3, 0, '響起解放的鼓聲：體力全部回復、全能力 +1、解除自身異常狀態與負面能力；之後 2 回合每回合回復 20% 體力、受到的傷害 -20%。陣容中體力低於 85% 的隊友回復 5% 體力。', [['回復', 'green'], ['淨化', 'blue'], ['強化', 'gold']], 'haki', { fullHeal: true, statUpAll: 1, clearSelfDebuffs: true, regenTurns: 2, regenRatio: .2, damageReductionTurns: 2, damageReductionValue: .2, nikaTeamHeal: .05 }),
      S('橡膠橡膠·巨人', 'attack', 3, 165, '變成巨人一拳砸下：威懾對手使其 1 回合無法攻擊，並讓對手下回合的技能效果失效；50% 機率連續攻擊 3 次。', [['威懾', 'gold'], ['封印', 'blue'], ['連擊', 'red']], 'gigante', { skipAttackTurns: 1, enemySkillNullify: 1, nikaTriple: .5 }),
      S('甦醒的太陽神', 'attack', 1, 60, '奧義。之後 2 回合造成的傷害 5～15% 轉為自身體力；造成 5～20 倍傷害（無視護盾），並恢復其他所有技能的次數。若魯夫倒下，下一位出戰的隊友 2 回合無敵、攻擊 +1。只能使用 1 次（藥水最多補 1 次）。', [['奧義', 'gold'], ['吸血', 'green'], ['破盾', 'blue'], ['恢復次數', 'gold']], 'awaken',
        { randomMultiplierRange: [5, 20], ignoreShield: true, nextLifestealRange: [.05, .15], nextLifestealTurns: 2, restoreAllPP: true, restoreMax: 1, nikaLegacy: true }, true)
    ] };
  if (!CHARACTER_ORDER.includes('luffy_nika')) CHARACTER_ORDER.push('luffy_nika');
  CHAR_RARITY.luffy_nika = 'UR+';
  CHAR_RARITY.luffy = 'SSR'; /* v118：魯夫（巨人篇）降為 SSR */
  CHAR_OBTAIN.luffy_nika = { boss: 0, reward: '_emperor', npc: '皇帝領海挑戰：擊敗尼卡真身後加入（無法抽獎）' };
  if (typeof COLLECTION_SETS !== 'undefined') { const y = COLLECTION_SETS.find(s => s.id === 'yonko' || /四皇/.test(s.name || '')); if (y && !y.members.includes('luffy_nika')) y.members.push('luffy_nika'); }
})();
