/* v103：黑鬍子（七武海）、鷹眼（七武海）、巴基斯、斯巴可；明哥寄生線改為 20～200% 反彈。必須在 roster_v91 之前載入（序號）。 */
(function () {
  const V = 103, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const art = id => ({ image: `assets/chars/${id}.webp?v=${V}`, avatar: `assets/chars/${id}_face.webp?v=${V}`, ultimateBg: `assets/chars/${id}.webp?v=${V}` });
  /* 黑鬍子（七武海）：四皇版的弱化版本——同樣的五招，但數值與附加效果都比較低，奧義沒有恢復技能次數、沒有奪取技能 */
  CHARACTERS.blackbeard_w = Object.assign({ id: 'blackbeard_w', name: '馬歇爾·D·汀奇（七武海）', title: '王下七武海', types: ['闇'], scale: .92, worldScale: .95, battleScale: .95, ai: 'balanced', maxHp: 1950, baseSpeed: 88, statScale: 1.14, role: '吸收爆發型',
    desc: '用艾斯的人頭換到王下七武海席位的黑鬍子。頂上戰爭時才剛得到暗暗果實，力量還遠不如之後的四皇。' }, art('blackbeard_w'), { skills: [
    S('引力吸入', 'attack', 7, 0, '暗暗果實的引力：吸收對手目前體力 4～10%，清除對手的能力提升，20% 使對手恐懼 1 回合。', [['吸收', 'green'], ['恐懼', 'gold']], 'darkpull', { drainCurrentHpRange: [.04, .1], clearBuffs: true, fearChance: .2, fearTurns: 1 }),
    S('引發震動', 'attack', 5, 115, '剛奪來的震震果實，還無法完全掌控：威力 2.5～6 倍，10% 機率 12 倍。', [['震震', 'red']], 'quake', { variableMultipliers: [[.35, 2.5], [.35, 4], [.2, 6], [.1, 12]] }),
    S('闇穴道', 'support', 4, 0, '把對手的招式吸進黑暗：隨機複製對手的一個技能取代這一招。', [['複製', 'blue']], 'darkcopy', { copyReplace: true }),
    S('解放', 'attack', 4, 0, '解放吸進來的力量：造成對手已損失體力 0.8～1.2 倍的傷害（最多對手最大體力 30%），並獲得自身目前體力 8% 的護盾。', [['終結', 'gold'], ['護盾', 'green']], 'release', { lostHpDamageRange: [.8, 1.2], lostHpCapMax: .3, selfShieldCurrentHpRatio: .08 }),
    S('黑洞', 'support', 1, 0, '奧義。全能力 +1、回復 50% 體力；接下來 2 回合傷害 1.5～3 倍，對手直接失去目前體力 15～30%（特定 BOSS 無效）。次數 1 次，藥水最多補 1 次。', [['奧義', 'gold'], ['削血', 'red']], 'awaken', { statUpAll: 1, healRatio: .5, damageMultTurns: 2, damageMultRange: [1.5, 3], enemyCurrentHpCutRange: [.15, .3], restoreMax: 1 }, true)] });
  /* 鷹眼（七武海）：十字公會版的弱化版本 */
  CHARACTERS.mihawk_w = Object.assign({ id: 'mihawk_w', name: '喬拉可爾·密佛格（七武海）', title: '王下七武海・世界最強劍豪', types: ['格鬥'], scale: .95, worldScale: 1, battleScale: .7, ai: 'balanced', maxHp: 1620, baseSpeed: 120, statScale: 1.1, role: '爆發輸出型',
    desc: '頂上戰爭時以王下七武海身分站在海軍這一邊的鷹眼。和之後加入十字公會的他相比，還保留了幾分實力。' }, art('mihawk_w'), { skills: [
    S('斬擊', 'attack', 15, 72, '以黑刀「夜」快速斬擊 2～4 次。', [['連擊', 'red']], 'onigiri', { multiHitNormal: [2, 4], perHitPower: 72 }),
    S('劍氣狀態', 'support', 6, 0, '集中劍氣：回復 15～35% 體力，接下來 2 回合的下一次攻擊威力 ×1～1.3。', [['回復', 'green'], ['強化', 'gold']], 'haki', { healRange: [.15, .35], nextAttackMult: [1, 1.3], nextAttackMultTurns: 2 }),
    S('黑刀·夜', 'attack', 7, 150, '一刀劈開冰山的斬擊：造成 5～10 倍傷害，3% 機率一刀斬殺。', [['爆發', 'red'], ['斬殺', 'gold']], 'shishi', { executeChance: .03, randomMultiplierRange: [5, 10] }),
    S('洞察弱點', 'support', 5, 0, '看穿對手的破綻：清除對手的能力提升、對手防禦 -1（2 回合），並使對手虛弱 1 回合（受到 1～1.3 倍傷害）。', [['破防', 'blue'], ['虛弱', 'gold']], 'raimei', { clearBuffs: true, enemyDefDownTemp: [1, 2], weakChance: 1, weakTurns: 1, weakRange: [1, 1.3] }),
    S('世界最強劍豪', 'support', 2, 0, '奧義。全能力 +1，1 回合內不受任何傷害，並讓對手連續 2 回合受到 3～5% 最大體力的斬擊傷害。', [['奧義', 'gold'], ['無敵', 'blue']], 'ashura', { statUpAll: 1, invulnTurns: 1, dotSequence: [[.03, .05], [.03, .05]], dotLabel: '斬擊' }, true)] });
  /* 巴基斯：SR・坦克輔助型（黑鬍子海賊團一號船船長，摔角冠軍） */
  CHARACTERS.burgess = Object.assign({ id: 'burgess', name: '吉薩斯·巴基斯', title: '黑鬍子海賊團・一號船船長', types: ['格鬥', '巨人'], scale: .95, worldScale: 1.05, battleScale: 1.35, ai: 'balanced', maxHp: 1800, baseSpeed: 92, statScale: 1.04, role: '坦克輔助型',
    desc: '自稱「冠軍」的摔角手，力氣大到能把整棟建築舉起來丟出去。體格強壯、耐打，擅長用摔角技巧拖住對手。' }, art('burgess'), { skills: [
    S('強力投擲', 'attack', 12, 30, '把巨石、建築往對手身上丟：攻擊 3～10 次，20% 使對手虛弱 2 回合。', [['連擊', 'red'], ['虛弱', 'gold']], 'barrage', { multiHitNormal: [3, 10], perHitPower: 30, weakChance: .2, weakTurns: 2 }),
    S('冠軍的肉體', 'support', 5, 0, '鍛鍊到極限的肌肉：防禦 +2，接下來 2 回合受到的傷害 -35%。', [['強化', 'gold'], ['減傷', 'blue']], 'haki', { selfBuffDef: 2, damageReductionTurns: 2, damageReductionValue: .35 }),
    S('冠軍金腰帶', 'support', 4, 0, '「我才是冠軍！」回復 20% 體力，2 回合內免疫異常狀態，攻擊 +1。', [['回復', 'green'], ['免疫', 'blue'], ['強化', 'gold']], 'voice', { healRatio: .2, immuneTurns: 2, selfBuffAtk: 1 }),
    S('冠軍擒抱', 'attack', 6, 130, '抱住對手狠狠摔出去：25% 使對手暈眩 1 回合，並使對手防禦 -1（2 回合）。', [['暈眩', 'gold'], ['降防', 'blue']], 'gigante', { stunChance: .25, stunTurns: 1, enemyDefDownTemp: [1, 2] }),
    S('冠軍・巨岩粉碎', 'attack', 2, 120, '奧義。舉起整塊巨岩砸下：造成 3～6 倍傷害，30% 使對手暈眩 1 回合，之後 2 回合受到的傷害 -30%。', [['奧義', 'gold'], ['暈眩', 'gold'], ['減傷', 'blue']], 'quake', { randomMultiplierRange: [3, 6], stunChance: .3, stunTurns: 1, damageReductionTurns: 2, damageReductionValue: .3 }, true)] });
  /* 斯巴可：SR・控場輔助型（黑鬍子海賊團十號船船長，咕嚕咕嚕果實：能大量喝酒、把酒變成火噴出） */
  CHARACTERS.vasco = Object.assign({ id: 'vasco', name: '斯巴可', title: '黑鬍子海賊團・十號船船長', types: ['火', '超能'], scale: .92, worldScale: 1, battleScale: .85, faceLeft: true, ai: 'control', maxHp: 1380, baseSpeed: 104, statScale: 1, role: '控場輔助型',
    desc: '總是醉醺醺的黑鬍子海賊團船長，能把喝下去的大量酒水噴出來點火。醉拳般難以捉摸的動作，讓對手的攻擊總是落空。' }, art('vasco'), { skills: [
    S('混沌酒水', 'support', 5, 0, '噴出混濁的酒霧：2 回合內對手的攻擊有 50% 機率失效；受到攻擊時反彈 20～50% 傷害；30% 使對手暈眩 1 回合。', [['失效', 'gold'], ['反彈', 'gold'], ['暈眩', 'gold']], 'voice', { attackFailTurns: 2, attackFailChance: .5, thornTurns: 2, thornRange: [.2, .5], stunChance: .3, stunTurns: 1 }),
    S('酒精飛行', 'support', 5, 0, '醉醺醺地飄起來：1 回合內免疫異常狀態並閃避下一次攻擊，對手隨機一個技能次數 -1。', [['閃避', 'blue'], ['免疫', 'blue'], ['削次數', 'red']], 'haki', { immuneTurns: 1, dodgeTurns: 1, randomPPDown: 1 }),
    S('酒火', 'attack', 10, 32, '把酒噴成火焰掃過一大片：攻擊 1～10 次，60% 使對手燒傷 2 回合；對手已燒傷時傷害 ×1.2～1.5。', [['連擊', 'red'], ['燒傷', 'red']], 'barrage', { multiHitNormal: [1, 10], perHitPower: 32, burnChance: .6, burnTurns: 2, burnedBonusMult: [1.2, 1.5] }),
    S('大口牛飲', 'support', 4, 0, '一口氣喝光一整桶酒：回復 25% 體力，速度 +1，接下來 2 回合的下一次攻擊威力 ×1.4。', [['回復', 'green'], ['強化', 'gold']], 'voice', { healRatio: .25, selfBuffSpd: 1, nextAttackMult: 1.4, nextAttackMultTurns: 2 }),
    S('烈酒火柱', 'attack', 2, 100, '奧義。把肚子裡的酒全部噴出點燃：造成 3～6 倍傷害，使對手燒傷 3 回合、全能力 -1。', [['奧義', 'gold'], ['燒傷', 'red'], ['全能力下降', 'blue']], 'burn', { randomMultiplierRange: [3, 6], burnChance: 1, burnTurns: 3, enemyAllDown: 1 }, true)] });
  ['blackbeard_w', 'mihawk_w', 'burgess', 'vasco'].forEach(id => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); });
  Object.assign(CHAR_RARITY, { blackbeard_w: 'SSR', mihawk_w: 'SSR', burgess: 'SR', vasco: 'SR' });
  Object.assign(CHAR_OBTAIN, {
    blackbeard_w: { boss: 0, eventOnly: true, npc: '限定抽獎池取得（活動另行公告）・頂上戰爭篇 小 BOSS' },
    mihawk_w: { boss: 0, reward: 'marineford', npc: '完成頂上戰爭篇後免費加入' },
    burgess: { boss: 0, reward: 'dark', npc: '完成蜂巢島篇後免費加入' },
    vasco: { boss: 0, npc: '寶藏扭蛋（一般召喚池）' }
  });
  if (typeof COLLECTION_SETS !== 'undefined') { const sh = COLLECTION_SETS.find(s => s.id === 'shichi'); if (sh) ['blackbeard_w', 'mihawk_w'].forEach(id => { if (!sh.members.includes(id)) sh.members.push(id); }); }
  /* 明哥寄生線：反彈倍率 20～200% */
  const D = CHARACTERS.doflamingo; if (D && D.skills[1]) { const s = D.skills[1]; s.effect = Object.assign({}, s.effect, { reflectMultRange: [.2, 2] }); delete s.effect.reflectMultiplier; s.desc = '用絲線操縱對手的身體：對手下一次攻擊造成的傷害會反彈 20～200% 到自己身上（明哥不受傷），並使對手防禦、速度 -1（連續 2 回合）。'; }
  /* 頂上戰爭篇：處刑台前新增小 BOSS 黑鬍子（七武海），在卡普之前 */
  const M = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'marineford');
  if (M && !M.steps.some(s => s.enemy === 'blackbeard_w')) {
    if (!M.npcs.some(n => n.id === 'blackbeard_n')) M.npcs.push({ id: 'blackbeard_n', name: '黑鬍子', role: '王下七武海', look: 'blackbeard_w', pos: [4, 8], chat: ['塞哈哈哈哈！好戲才正要開始！', '我要的東西……就在這個戰場上。'] });
    const g = M.steps.findIndex(s => s.type === 'duel' && s.enemy === 'garp_mf'), L = (w, t) => [w, t];
    M.steps.splice(g < 0 ? M.steps.length - 1 : g, 0, { type: 'duel', npc: 'blackbeard_n', enemy: 'blackbeard_w', title: '黑暗中的笑聲', desc: '王下七武海黑鬍子帶著手下出現在戰場上。擊敗他，繼續往處刑台前進。', reward: 3,
      lines: [L('blackbeard_n', '塞哈哈哈哈！這裡真是熱鬧啊！'), L('blackbeard_n', '我可是正牌的王下七武海喔……讓開的人才能活命！')],
      after: [L('blackbeard_n', '……嘖，今天就先放過你。我要的東西，還在後頭。'), L(null, '黑鬍子帶著手下退進了混亂的戰場。前方，海軍英雄卡普擋住了去路。')] });
  }
})();
/* v103：已經通關頂上戰爭篇／蜂巢島篇的玩家，補發這次新增的通關角色 */
window.addEventListener('load', () => setTimeout(() => {
  try {
    if (typeof SAVE === 'undefined' || !SAVE.data || !SAVE.data.chapters || typeof addCrew !== 'function' || typeof owned !== 'function') return;
    const got = [];
    [['marineford', 'mihawk_w'], ['dark', 'burgess']].forEach(([ch, id]) => { const st = SAVE.data.chapters[ch]; if (st && st.cleared && !owned(id) && CHARACTERS[id]) { addCrew(id, 10); got.push(CHARACTERS[id].name); } });
    if (got.length) { SAVE.save(); if (typeof toast === 'function') toast(`通關獎勵補發：${got.join('、')} 加入了角色背包！`, 'gold'); }
  } catch (e) { console.warn('v103 補發失敗', e); }
}, 2500));

/* v104：羅（七武海）強化體質與技能（控制型：用 ROOM 掌控節奏，切斷、反擊電擊、注射槍收尾） */
(function () { const L = CHARACTERS.law_w; if (!L) return; Object.assign(L, { maxHp: 1650, baseSpeed: 116, statScale: 1.16 });
  const sk = L.skills, set = (i, o) => Object.assign(sk[i], o, { maxPP: o.pp || sk[i].pp });
  set(0, { power: 120, desc: '用長刀「鬼哭」斬擊：25% 使對手防禦 -1（2 回合）。', tags: [['降防', 'blue']], effect: { enemyDefDownChance: [.25, [1, 1], 2] } });
  set(1, { pp: 6, desc: '張開手術室：閃避 1 回合、1 回合內免疫異常狀態，接下來 2 回合的下一次攻擊威力 ×1.6。', tags: [['閃避', 'blue'], ['免疫', 'blue'], ['強化', 'gold']], effect: { dodgeTurns: 1, immuneTurns: 1, nextAttackMult: 1.6, nextAttackMultTurns: 2 } });
  set(2, { power: 68, desc: '在手術室裡把對手切成好幾塊：攻擊 2～5 次，25% 機率解除對手的能力提升。', tags: [['連擊', 'red'], ['解除強化', 'blue']], effect: { multiHitNormal: [2, 5], perHitPower: 68, clearBuffsChance: .25 } });
  set(3, { power: 160, desc: '電擊貫穿對手：60% 使對手麻痺 1 回合，對手隨機一個技能次數 -1。', tags: [['麻痺', 'gold'], ['削次數', 'red']], effect: { paralyzeChance: .6, paralyzeTurns: 1, randomPPDown: 1 } });
  set(4, { power: 105, desc: '奧義。手術室中的刺擊：造成 4～7 倍傷害、無視護盾，並使對手防禦 -2（2 回合）。', tags: [['奧義', 'gold'], ['破盾', 'blue'], ['破防', 'blue']], effect: { randomMultiplierRange: [4, 7], ignoreShield: true, enemyDefDownTemp: [2, 2] } });
  L.desc = '剛成為王下七武海時期的羅，手握長刀「鬼哭」，用手術果實的能力在 ROOM 裡任意切割、置換。擅長用麻痺與削減技能次數打亂對手節奏。'; L.role = '控制型'; })();
