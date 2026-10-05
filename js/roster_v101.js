/* v101：七武海系列。新角色 愛德華·衛伯（SSR・白鬍子二世，限定池）、托拉法爾加·羅（七武海）（SR，立繪準備中，限定池）；
   原本的托拉法爾加·羅（SSR）移出一般召喚池，改為限定活動取得；多佛朗明哥列入七武海系列限定池。必須在 roster_v91 之前載入（序號）。 */
(function () {
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const V = 101;
  /* --- 愛德華·衛伯：SSR、半坦克爆發型。設計目標＝七武海中最弱（略低於其他 SSR 七武海） --- */
  CHARACTERS.weevil = { id: 'weevil', name: '愛德華·衛伯', title: '白鬍子二世', types: ['格鬥'], image: `assets/chars/weevil.webp?v=${V}`, avatar: `assets/chars/weevil_face.webp?v=${V}`, ultimateBg: `assets/chars/weevil.webp?v=${V}`,
    scale: .9, worldScale: 1.05, battleScale: 1.3, ai: 'balanced', maxHp: 2050, baseSpeed: 96, statScale: 1.1, cardPos: '62% 14%',
    desc: '自稱白鬍子兒子的新任王下七武海「白鬍子二世」。揮舞著和白鬍子一模一樣的大薙刀，力氣大得驚人，卻什麼事都聽老媽巴金的。半坦克爆發型：先用體魄撐住，再用大刀術一口氣打出傷害。',
    skills: [
      S('薙刀橫掃', 'attack', 15, 140, '揮動巨大的薙刀橫掃：30% 機率使對手防禦 -1（2 回合）。', [['降防', 'blue']], 'gigante', { enemyDefDownChance: [.3, [1, 1], 2] }),
      S('白鬍子的體魄', 'support', 5, 0, '靠驚人的體格硬接攻擊：接下來 2 回合受到的傷害 -40%，回復 15% 體力。', [['減傷', 'blue'], ['回復', 'green']], 'haki', { damageReductionTurns: 2, damageReductionValue: .4, healRatio: .15 }),
      S('老媽的命令', 'support', 4, 0, '「衛伯，去把他打倒！」攻擊 +2，接下來 2 回合的下一次攻擊威力 ×1.5。', [['強化', 'gold']], 'voice', { selfBuffAtk: 2, nextAttackMult: 1.5, nextAttackMultTurns: 2 }),
      S('大刀術', 'attack', 6, 210, '模仿白鬍子的大薙刀絕技：無視護盾，25% 機率造成 2 倍傷害。', [['爆發', 'red'], ['破盾', 'blue']], 'barrage', { ignoreShield: true, critBoost: .25, critMult: 2 }),
      S('白鬍子二世', 'attack', 2, 150, '奧義。用盡全力揮下大薙刀：造成 3～6 倍傷害，30% 使對手恐懼 1 回合，之後 2 回合受到的傷害 -25%。', [['奧義', 'gold'], ['恐懼', 'gold'], ['減傷', 'blue']], 'quake', { randomMultiplierRange: [3, 6], fearChance: .3, fearTurns: 1, damageReductionTurns: 2, damageReductionValue: .25 }, true)
    ] };
  /* --- 托拉法爾加·羅（七武海）：SR、暫定技能（立繪準備中，先用剪影） --- */
  CHARACTERS.law_w = { id: 'law_w', name: '托拉法爾加·羅（七武海）', title: '王下七武海', types: ['超能'], image: `assets/chars/law_w.webp?v=${V}`, avatar: `assets/chars/law_w_face.webp?v=${V}`, ultimateBg: `assets/chars/law_w.webp?v=${V}`,
    scale: .85, worldScale: .9, ai: 'control', maxHp: 1350, baseSpeed: 112, statScale: 1, pending: true,
    desc: '剛成為王下七武海時期的羅，和草帽一夥結成海賊同盟前夕。（立繪準備中，技能為暫定）',
    skills: [
      S('鬼哭・斬擊', 'attack', 15, 110, '用長刀「鬼哭」斬擊。', [], 'slash', {}),
      S('ROOM', 'support', 6, 0, '張開手術室：閃避 1 回合，接下來 2 回合的下一次攻擊威力 ×1.5。', [['閃避', 'blue'], ['強化', 'gold']], 'haki', { dodgeTurns: 1, nextAttackMult: 1.5, nextAttackMultTurns: 2 }),
      S('切斷', 'attack', 8, 60, '在手術室裡把對手切成好幾塊：攻擊 2～4 次。', [['連擊', 'red']], 'barrage', { multiHitNormal: [2, 4], perHitPower: 60 }),
      S('反擊電擊', 'attack', 5, 150, '電擊貫穿對手：50% 使對手麻痺 1 回合。', [['麻痺', 'gold']], 'voice', { paralyzeChance: .5, paralyzeTurns: 1 }),
      S('注射槍', 'attack', 2, 100, '奧義。手術室中的刺擊：造成 3～6 倍傷害、無視護盾。', [['奧義', 'gold'], ['破盾', 'blue']], 'quake', { randomMultiplierRange: [3, 6], ignoreShield: true }, true)
    ] };
  ['weevil', 'law_w'].forEach(id => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); });
  Object.assign(CHAR_RARITY, { weevil: 'SSR', law_w: 'SR', doflamingo: 'SSR', law: 'SSR' });
  Object.assign(CHAR_OBTAIN, {
    weevil: { boss: 0, eventOnly: true, npc: '七武海系列限定抽獎池（01/01～03/30）：集滿 100 碎片合成' },
    law_w: { boss: 0, eventOnly: true, npc: '七武海系列限定抽獎池（01/01～03/30）：集滿 100 碎片合成' },
    law: { boss: 0, eventOnly: true, npc: '限定活動取得（活動另行公告）・和之國篇 NPC' },
    doflamingo: Object.assign({}, CHAR_OBTAIN.doflamingo || {}, { npc: '德雷斯羅薩篇 BOSS・七武海系列限定抽獎池（01/01～03/30）' })
  });
  if (typeof COLLECTION_SETS !== 'undefined') { const sh = COLLECTION_SETS.find(s => s.id === 'shichi'); if (sh) ['weevil', 'law_w'].forEach(id => { if (!sh.members.includes(id)) sh.members.push(id); }); }
})();
/* v102：立繪縮放、正式立繪、黑鬍子（UR+・皇帝領海）、明哥技能強化與限定池專屬、衛伯與鷹眼強化 */
(function () {
  const V = 102, set = (id, o) => { if (CHARACTERS[id]) Object.assign(CHARACTERS[id], o); };
  set('weevil', { battleScale: 1.1, maxHp: 2250, statScale: 1.27, role: '半坦克爆發型' });
  set('doflamingo', { battleScale: .75, role: '控制型' });
  set('blackbeard', { battleScale: 1, role: '全能爆發型' });
  set('law_w', { image: `assets/chars/law_w.webp?v=${V}`, avatar: `assets/chars/law_w_face.webp?v=${V}`, ultimateBg: `assets/chars/law_w.webp?v=${V}`, pending: false, desc: '剛成為王下七武海時期的羅，手握長刀「鬼哭」，用手術果實的能力在 ROOM 裡任意切割、置換。（技能為暫定）', role: '控制型' });
  const W = CHARACTERS.weevil; if (W) { W.skills[3].power = 230; W.skills[3].desc = '模仿白鬍子的大薙刀絕技：無視護盾，30% 機率造成 2 倍傷害。'; W.skills[3].effect.critBoost = .3; }
  /* 鷹眼：強化體質與斬擊 */
  const M = CHARACTERS.mihawk; if (M) { M.maxHp = 1700; M.statScale = 1.12; M.skills[0].power = 80; M.skills[0].effect.perHitPower = 80; M.skills[0].desc = M.skills[0].desc.replace(/70/g, '80'); }
  /* 明哥：技能強化 */
  const D = CHARACTERS.doflamingo; if (D) { const sk = n => D.skills[n];
    Object.assign(sk(1), { desc: '用絲線操縱對手的身體：2 回合內對手下一次攻擊造成的傷害會以 2 倍反彈到自己身上（明哥不受傷），並使對手防禦、速度 -1（連續 2 回合）。', tags: [['操控', 'gold'], ['降防', 'blue'], ['降速', 'blue']], effect: { reflectTurns: 2, reflectMultiplier: 2, enemyDefDownTemp: [1, 2], enemySpdDownTemp: [1, 2] } });
    Object.assign(sk(2), { desc: '絲線連斬 5 次：50% 使對手流血 3 回合（每回合 5%）；30% 機率解除對手的能力提升；20% 機率再施放一次。', tags: [['連擊', 'red'], ['流血', 'red'], ['解除強化', 'blue'], ['連發', 'gold']], effect: Object.assign({}, sk(2).effect, { clearBuffsChance: .3, recastChance: .2 }) });
    Object.assign(sk(3), { name: '蜘蛛網', desc: '用絲線織出防護網：獲得最大體力 10～15% 的護盾；2 回合內受到攻擊時反彈 10～35% 傷害，且對手的攻擊有 10% 機率失效。', tags: [['護盾', 'blue'], ['反彈', 'gold'], ['失效', 'gold']], effect: { selfShieldMaxHpRange: [.1, .15], thornTurns: 2, thornRange: [.1, .35], attackFailTurns: 2, attackFailChance: .1 } });
    Object.assign(sk(4), { desc: '奧義。用絲線把整座國家關進收縮的鳥籠：連續切割 20～40 次，每次造成對手目前體力 0.5～3% 的傷害；對手全能力 -1，2 回合內使用技能有 25% 機率失效。', tags: [['奧義', 'gold'], ['連擊', 'red'], ['全能力下降', 'blue'], ['失效', 'gold']], effect: { birdcageHits: [20, 40], birdcagePct: [.005, .03], enemyAllDown: 1, attackFailTurns: 2, attackFailChance: .25 } }); }
  /* 黑鬍子：UR+、皇帝領海取得；第四、第五技能強化 */
  const B = CHARACTERS.blackbeard; if (B) {
    Object.assign(B.skills[3], { desc: '解放吸進來的力量：造成對手已損失體力 1～1.5 倍的傷害（最多對手最大體力 35%），並獲得自身目前體力 10% 的護盾；此回合結束時，對手全能力 -1、隨機一個技能次數 -1。', effect: { lostHpDamageRange: [1, 1.5], lostHpCapMax: .35, selfShieldCurrentHpRatio: .1, endTurnCurse: { allDown: 1, ppDown: 1 } } });
    Object.assign(B.skills[4], { pp: 1, maxPP: 1, desc: '奧義。全能力 +1、體力全滿、其他技能次數全部恢復；接下來 2 回合傷害 2～5 倍。對手直接失去目前體力 25～45%（特定 BOSS 無效），並追加使用對手的一個技能（對手該技能次數 -1）。次數 1 次，戰鬥中可用藥水補充，最多 3 次。', effect: { statUpAll: 1, fullHeal: true, restoreAllPP: true, damageMultTurns: 2, damageMultRange: [2, 5], enemyCurrentHpCutRange: [.25, .45], copyOpponentSkillAfter: true, copyDrainPP: 1, restoreMax: 3 } });
  }
  Object.assign(CHAR_RARITY, { blackbeard: 'UR+' });
  Object.assign(CHAR_OBTAIN, {
    blackbeard: { boss: 0, reward: '_emperor', npc: '皇帝領海挑戰：擊敗黑鬍子真身後加入（無法抽獎）' },
    doflamingo: { boss: 0, eventOnly: true, npc: '七武海系列限定抽獎池（每年 01/01～03/30）：集滿 100 碎片合成' },
    law_w: { boss: 0, eventOnly: true, npc: '七武海系列限定抽獎池（每年 01/01～03/30）：集滿 80 碎片合成' },
    weevil: { boss: 0, eventOnly: true, npc: '七武海系列限定抽獎池（每年 01/01～03/30）：集滿 100 碎片合成' }
  });
})();
