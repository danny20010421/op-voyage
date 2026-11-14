/* v214：角色名單與技能資料（原 roster_v*.js、rocks_v166.js 依載入順序合併）。合併前的檔案邊界以「==== 原 檔名 ====」標記。 */

/* ==== 原 js/roster_v89.js ==== */
/* v89：稀有度八階（UR＞SSR＞SR＞RRR＞RR＞R＞U＞C，UR+ 仍在最上面）、新角色（克比三版本、甚平、錦衛門、懷帕、瑪琪諾）、既有角色等級調整。 */
(function () {
  const V = 89, img = id => `assets/chars/${id}.webp?v=${V}`, face = id => `assets/chars/${id}_face.webp?v=${V}`;
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const C = (id, o, skills) => { CHARACTERS[id] = Object.assign({ id, image: img(id), avatar: face(id), ultimateBg: img(id), scale: .85, worldScale: .9, ai: 'balanced' }, o, { skills }); if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); };

  /* ---------- 新角色 ---------- */
  C('coby0', { no: 115, name: '初登場克比', title: '想當海軍的少年', types: ['格鬥'], maxHp: 820, baseSpeed: 90, battleScale: .4, ai: 'balanced',
    desc: '被亞爾麗塔逼著在海賊船上做了兩年雜工的少年。遇見魯夫之後，終於鼓起勇氣說出「我要成為海軍」。' }, [
    S('木棍揮擊', 'attack', 15, 70, '握緊木棍拚命揮下，20% 機率造成 1.6 倍傷害。', [['爆發', 'red']], 'punch', { critBoost: .2, critMult: 1.6 }),
    S('拚命逃跑', 'support', 6, 0, '用打雜練出來的腳力逃開：閃避下一次攻擊，速度 +1。', [['閃避', 'blue'], ['強化', 'gold']], 'skywalk', { dodgeTurns: 1, selfBuffSpd: 1 }),
    S('我要成為海軍！', 'support', 3, 0, '對著自己大喊出夢想：回復 30% 體力、攻擊 +1，並清除自身的負面狀態。', [['回復', 'green'], ['強化', 'gold']], 'voice', { healRatio: .3, selfBuffAtk: 1, clearSelfDebuffs: true })
  ]);
  C('koby_mf', { no: 116, name: '克比（頂上戰爭）', title: '海軍見習生', types: ['格鬥'], maxHp: 1150, baseSpeed: 104, battleScale: .6, ai: 'balanced',
    desc: '在卡普手下接受特訓的海軍見習生。頂上戰爭的最後，他站到赤犬面前大喊「請停止戰鬥」，用一句話改變了戰場。' }, [
    S('剃', 'attack', 15, 95, '用六式「剃」高速踏地衝到對手面前出拳，15% 機率使對手麻痺 1 回合。', [['麻痺', 'gold']], 'rokushiki', { skipAttackChance: .15, skipAttackTurns: 1 }),
    S('拳骨', 'attack', 10, 130, '卡普親傳的拳骨，25% 機率使對手暈眩 1 回合。', [['暈眩', 'gold']], 'shigan', { skipAttackChance: .25, skipAttackTurns: 1, ccKind: 'paralyze' }),
    S('見聞色霸氣', 'support', 6, 0, '聽見戰場上所有人的聲音：閃避接下來 1 次攻擊，速度 +1，下一次攻擊必定暴擊（1.5 倍）。', [['閃避', 'blue'], ['強化', 'gold']], 'haki', { dodgeTurns: 1, selfBuffSpd: 1, critBoost: 1, critMult: 1.5 }),
    S('請停止戰鬥！', 'support', 2, 0, '用盡全身的勇氣大喊：70% 使對手恐懼 1 回合，對手全能力 -1，自身回復 20% 體力。', [['恐懼', 'gold'], ['弱化', 'red'], ['回復', 'green']], 'voice', { fearChance: .7, fearTurns: 1, enemyAllDown: 1, healRatio: .2 }, true)
  ]);
  C('koby_hc', { no: 117, name: '克比（蜂巢島）', title: '海軍上校・SWORD', types: ['格鬥'], maxHp: 1500, baseSpeed: 114, battleScale: .65, ai: 'aggressive',
    desc: '被稱為「英雄」的海軍上校，也是秘密部隊 SWORD 的一員。被黑鬍子海賊團抓到蜂巢島，靠著自己的拳頭與卡普的救援突破重圍。' }, [
    S('剃・連拳', 'attack', 15, 0, '以「剃」連續突進出拳 2～4 次，每次威力 60。', [['連擊', 'red']], 'barrage', { multiHitNormal: [2, 4], perHitPower: 60 }),
    S('月步', 'support', 6, 0, '踢著空氣在天上奔跑：閃避下一次攻擊、速度 +1，下一次攻擊傷害 1.5 倍。', [['閃避', 'blue'], ['強化', 'gold']], 'skywalk', { dodgeTurns: 1, selfBuffSpd: 1, nextAttackMult: 1.5, nextAttackMultTurns: 2 }),
    S('見聞色・預知', 'support', 4, 0, '聽見對手下一步的「聲音」：接下來 2 次攻擊全部閃避。', [['閃避', 'blue']], 'haki', { dodgeTurns: 2 }),
    S('武裝色・鐵拳', 'attack', 8, 150, '包覆武裝色霸氣的直拳，無視護盾；30% 機率使對手破防 2 回合。', [['破防', 'red'], ['無視護盾', 'blue']], 'shigan', { ignoreShield: true, armorBreakChance: .3, armorBreakTurns: 2 }),
    S('正直拳骨', 'attack', 2, 200, '「正直」的霸氣拳骨（Honesty Impact）：無視護盾，30% 機率造成 2.5 倍傷害，40% 使對手暈眩 1 回合。', [['奧義', 'gold'], ['暈眩', 'gold']], 'shigan', { ignoreShield: true, critBoost: .3, critMult: 2.5, stunChance: .4, stunTurns: 1 }, true)
  ]);
  C('jinbe', { no: 118, name: '甚平', title: '海俠・前王下七武海', types: ['格鬥'], maxHp: 1950, baseSpeed: 98, battleScale: .9, ai: 'aggressive',
    desc: '魚人空手道的高手，被稱為「海俠」的前王下七武海。為了救艾斯捨棄了七武海的稱號，後來成為草帽海賊團的舵手。爆發攻擊型角色。' }, [
    S('擊水', 'attack', 15, 0, '把水滴當成子彈彈出，攻擊 3～5 次，每次威力 45。', [['連擊', 'red']], 'barrage', { multiHitNormal: [3, 5], perHitPower: 45 }),
    S('唐草瓦正拳', 'attack', 10, 160, '透過空氣中的水分把衝擊傳進對手體內：無視護盾，35% 機率造成 2 倍傷害。', [['爆發', 'red'], ['無視護盾', 'blue']], 'shigan', { ignoreShield: true, critBoost: .35, critMult: 2 }),
    S('武賴貫', 'attack', 8, 190, '把大量海水凝成水塊砸向對手，50% 機率使對手破防 2 回合。', [['破防', 'red']], 'poseidon', { armorBreakChance: .5, armorBreakTurns: 2 }),
    S('鬼瓦正拳', 'attack', 6, 240, '魚人空手道的奧秘，全力正拳：30% 機率造成 2.2 倍傷害，30% 使對手暈眩 1 回合。', [['爆發', 'red'], ['暈眩', 'gold']], 'shigan', { critBoost: .3, critMult: 2.2, skipAttackChance: .3, skipAttackTurns: 1, ccKind: 'paralyze' }),
    S('海流過肩摔', 'attack', 2, 200, '抓住海流的力量把對手整個摔出去，造成 4～7 倍傷害，50% 使對手恐懼 1 回合。', [['奧義', 'gold'], ['恐懼', 'gold']], 'kaifu', { randomMultiplierRange: [4, 7], fearChance: .5, fearTurns: 1 }, true)
  ]);
  C('kinemon', { no: 119, name: '錦衛門', title: '赤鞘九俠・狐火流', types: ['格鬥', '超能'], maxHp: 1300, baseSpeed: 100, battleScale: .65, ai: 'balanced',
    desc: '光月家的家臣、赤鞘九俠之首。狐火流的劍士，能斬斷火焰；吃了服服果實，可以把任何東西變成衣服。' }, [
    S('狐火流・焰裂', 'attack', 12, 120, '斬開火焰、把火焰收進刀中再劈出，40% 使對手燒傷 2 回合。', [['燒傷', 'red']], 'sanzen', { burnChance: .4, burnTurns: 2 }),
    S('狐火流・斬火', 'support', 5, 0, '斬斷迎面而來的火焰與攻擊：接下來 2 回合受到的傷害 -40%。', [['減傷', 'blue']], 'shishi', { damageReductionTurns: 2, damageReductionValue: .4 }),
    S('服服果實・變裝術', 'support', 4, 0, '用服服果實把身邊的東西變成衣服、喬裝成別人：出現 1 個替身承受攻擊，速度 +1。', [['替身', 'blue'], ['強化', 'gold']], 'transform', { decoys: 1, selfBuffSpd: 1 }),
    S('狐火流・燃燒斬', 'attack', 3, 210, '燃起狐火的必殺一刀：無視護盾，必定使對手燒傷 3 回合。', [['奧義', 'gold'], ['燒傷', 'red']], 'ifrit', { ignoreShield: true, burnChance: 1, burnTurns: 3 }, true)
  ]);
  C('wiper', { no: 120, name: '懷帕', title: '香迪亞的戰士', types: ['格鬥'], maxHp: 1250, baseSpeed: 106, battleScale: .6, ai: 'aggressive',
    desc: '香迪亞族的戰士，為了奪回祖先的土地，四百年來族人一直在戰鬥。滑著噴射滑板，扛著燃燒火箭筒，必要時會使出傷害自己的「排擊貝」。' }, [
    S('燃燒火箭筒', 'attack', 10, 140, '扛起火箭筒噴出火焰，40% 使對手燒傷 2 回合。', [['燒傷', 'red']], 'karyu', { burnChance: .4, burnTurns: 2 }),
    S('衝擊貝', 'support', 5, 0, '用衝擊貝吸收衝擊：下一次受到的攻擊以 1.5 倍反彈。', [['反彈', 'gold']], 'release', { reflectTurns: 1, reflectMultiplier: 1.5 }),
    S('排擊貝', 'attack', 2, 320, '衝擊貝的十倍威力，連自己的身體也會受傷：無視護盾造成巨大傷害，自身接下來 3 回合每回合失去 8% 體力。', [['奧義', 'gold'], ['無視護盾', 'blue']], 'quake', { ignoreShield: true, selfDot: [3, .08] }, true)
  ]);
  C('makino', { no: 121, name: '瑪琪諾', title: '風車村的酒館老闆娘', types: ['超能'], maxHp: 760, baseSpeed: 84, battleScale: .4, ai: 'support',
    desc: '風車村「PARTYS BAR」的老闆娘。從魯夫小時候就一直照顧他，也是紅髮海賊團在東海最信任的朋友。' }, [
    S('托盤敲擊', 'attack', 12, 60, '用酒館的托盤敲下去，20% 使對手暈眩 1 回合。', [['暈眩', 'gold']], 'punch', { skipAttackChance: .2, skipAttackTurns: 1, ccKind: 'paralyze' }),
    S('老闆娘的招待', 'support', 4, 0, '端上一盤熱騰騰的料理：回復 35% 體力，接下來 2 回合每回合再回復 5%。', [['回復', 'green']], 'cook', { healRatio: .35, regenTurns: 2, regenRatio: .05 })
  ]);

  /* 卡片裁切焦點（立繪是橫幅或臉不在上方時） */
  Object.assign(CHARACTERS.whitebeard, { cardPos: '50% 14%' }); if (CHARACTERS.jinbe) CHARACTERS.jinbe.cardPos = '52% 26%'; if (CHARACTERS.wiper) CHARACTERS.wiper.cardPos = '58% 20%'; if (CHARACTERS.coby0) CHARACTERS.coby0.cardPos = '46% 14%';
  /* ---------- 稀有度 ---------- */
  Object.assign(CHAR_RARITY, { coby0: 'C', koby_mf: 'RR', koby_hc: 'SR', jinbe: 'SSR', kinemon: 'RR', wiper: 'RR', makino: 'C',
    robin: 'SSR', mayor: 'C', marine: 'C', vergo: 'R', york: 'RRR' });
  window.RAR_ORDER = ['C', 'U', 'R', 'RR', 'RRR', 'SR', 'SSR', 'UR', 'UR+'];
  if (GAME_SETTINGS.rarityScale) Object.assign(GAME_SETTINGS.rarityScale, { C: 1.1, U: 1.15, RR: 1.2, RRR: 1.15 });
  if (typeof SELL_VALUE !== 'undefined') { Object.assign(SELL_VALUE.berry, { C: 800, U: 1200, RR: 3000, RRR: 4500 }); Object.assign(SELL_VALUE.exp, { C: 600, U: 900, RR: 2200, RRR: 3300 }); }
  /* 一般召喚池加入 C 級（瑪琪諾）：只多加 C 的份額，UR／SSR／SR 的實際出率不變 */
  if (typeof CHAR_RATE_BY_RARITY !== 'undefined') { CHAR_RATE_BY_RARITY.C = .008; GAME_SETTINGS.charRate = +(GAME_SETTINGS.charRate + .008).toFixed(4); if (typeof RARITY !== 'undefined' && RARITY.N) RARITY.N.rate = +(RARITY.N.rate - .008).toFixed(4); }

  /* ---------- 取得方式 ---------- */
  Object.assign(CHAR_OBTAIN, {
    coby0: { boss: 0, reward: 'east', npc: '東海篇 NPC・通關後免費加入' }, koby_mf: { boss: 0, reward: 'marineford', npc: '頂上戰爭篇 NPC・通關後免費加入' },
    kinemon: { boss: 0, reward: 'wano', npc: '和之國篇 NPC・通關後免費加入' }, wiper: { boss: 0, reward: 'skypiea', npc: '空島篇 NPC・通關後免費加入' },
    koby_hc: { boss: 0, npc: '蜂巢島篇 NPC（僅能從懸賞召喚取得）' }, jinbe: { boss: 0, npc: '頂上戰爭篇 NPC・前七武海（僅能從懸賞召喚取得）' }, makino: { boss: 0, npc: '風車村 NPC（一般召喚池）' }
  });
  /* 已經通關的玩家：補發這次新增的通關獎勵角色 */
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { const d = SAVE.data, got = []; Object.entries(CHAR_OBTAIN).forEach(([cid, o]) => { if (!['east', 'marineford', 'wano', 'skypiea'].includes(o.reward)) return; const st = d.chapters && d.chapters[o.reward]; if (st && st.cleared && !owned(cid)) { addCrew(cid, 10); got.push({ char: cid }); } });
    if (got.length) { SAVE.save(); if (window.queueWelcome) queueWelcome(got); } } catch (e) { } }, 2500));

  /* 圖鑑順序：放在相關角色旁邊 */
  const after = (a, ids) => { ids.forEach(id => { const k = CHARACTER_ORDER.indexOf(id); if (k >= 0) CHARACTER_ORDER.splice(k, 1); }); const i = CHARACTER_ORDER.indexOf(a); CHARACTER_ORDER.splice(i < 0 ? CHARACTER_ORDER.length : i + 1, 0, ...ids); };
  after('luffy0', ['coby0', 'makino']); after('garp_mf', ['koby_mf', 'jinbe']); after('garp_hc', ['koby_hc']); after('yamato', ['kinemon']); after('enel', ['wiper']);
})();

/* ==== 原 js/roster_v90.js ==== */
/* v90：布魯克、阿玉、多利、寇沙。 */
(function () {
  const V = 90, img = id => `assets/chars/${id}.webp?v=${V}`, face = id => `assets/chars/${id}_face.webp?v=${V}`;
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const C = (id, o, skills) => { CHARACTERS[id] = Object.assign({ id, image: img(id), avatar: face(id), ultimateBg: img(id), scale: .85, worldScale: .9, ai: 'balanced' }, o, { skills }); if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); };

  C('brook', { no: 122, name: '布魯克', title: '靈魂之王', types: ['超能', '冰'], maxHp: 1750, baseSpeed: 122, battleScale: 1.35, ai: 'aggressive', cardPos: '50% 50%',
    desc: '黃泉果實能力者，死後靈魂回到身體、以骷髏之姿復活的音樂家劍士。冥界的寒氣與靈魂之力讓他被稱為「靈魂之王」。' }, [
    S('靈魂歡歌', 'support', 4, 0, '演奏靈魂之歌：35% 機率使下回合攻擊傷害 3～20 倍；對手 25% 機率攻擊無效 1 回合；接下來 2 回合造成的傷害有 15～20% 回復到自己身上。', [['強化', 'gold'], ['吸血', 'green'], ['致盲', 'gold']], 'voice', { nextAttackMult: [3, 20], nextAttackMultTurns: 2, nextAttackMultChance: .35, attackFailChance: .25, attackFailTurns: 1, nextLifestealRange: [.15, .2], nextLifestealTurns: 2 }),
    S('催眠曲', 'attack', 6, 0, '演奏讓人沉睡的曲子：使對手麻痺 1 回合、解除對手的能力提升，並吸取對手目前體力的 1～8%。', [['麻痺', 'gold'], ['解除強化', 'blue'], ['吸取', 'green']], 'voice', { skipAttackChance: 1, skipAttackTurns: 1, ccKind: 'paralyze', clearBuffs: true, drainCurrentHpRange: [.01, .08] }),
    S('飛空斬擊', 'attack', 12, 130, '以極快的拔刀把斬擊送向遠方（鼻歌三丁・矢筈斬），30% 機率造成 1.8 倍傷害。', [['爆發', 'red']], 'sanzen', { critBoost: .3, critMult: 1.8 }),
    S('魂之喪劍', 'attack', 8, 160, '注入冥界寒氣的一劍（靈魂之喪劍），40% 使對手冰凍 1 回合。', [['冰凍', 'blue']], 'icefang', { freezeChance: .4, freezeTurns: 1 }),
    S('黃泉之力', 'attack', 1, 0, '解放黃泉的力量：3 回合內閃避所有攻擊並免疫異常狀態，恢復全部體力、全能力 +1，接著斬擊 2～30 次（每次威力 22）；25% 使對手冰凍（凍傷），並使對手全能力 -1。使用次數 1，只能用藥水恢復一次。', [['奧義', 'gold'], ['無敵', 'blue'], ['回復', 'green']], 'sanzen', { dodgeTurns: 3, immuneTurns: 3, fullHeal: true, statUpAll: 1, multiHitNormal: [2, 30], perHitPower: 22, freezeChance: .25, freezeTurns: 1, enemyAllDown: 1, restoreOnce: true }, true)
  ]);
  C('tama', { no: 123, name: '阿玉', title: '黍團子的女孩', types: ['超能'], maxHp: 700, baseSpeed: 92, battleScale: .3, ai: 'support', cardPos: '50% 18%',
    desc: '住在和之國兔丼的女孩，一直等著艾斯回來帶她出海。吃了黍黍果實，給動物吃下她做的黍團子，動物就會聽她的話。' }, [
    S('黍團子', 'support', 4, 0, '把黍團子丟給對手：60% 使對手聽話、1 回合無法攻擊，並使對手攻擊 -1。', [['控場', 'blue'], ['弱化', 'red']], 'cook', { skipAttackChance: .6, skipAttackTurns: 1, enemyAtkDownChance: [[1, 1], 1, 2] }),
    S('狛千代，上！', 'attack', 12, 85, '呼喚大山犬狛千代衝撞對手，25% 使對手恐懼 1 回合。', [['恐懼', 'gold']], 'punch', { fearChance: .25, fearTurns: 1 })
  ]);
  C('dorry', { no: 124, name: '多利', title: '青鬼', types: ['格鬥'], maxHp: 1800, baseSpeed: 92, battleScale: 1.8, faceLeft: true, ai: 'aggressive', cardPos: '50% 12%',
    desc: '艾爾巴夫的巨人戰士「青鬼」多利。和赤鬼布洛基在小花園島決鬥了整整一百年，是艾爾巴夫戰士榮耀的化身。' }, [
    S('巨劍劈砍', 'attack', 15, 140, '揮下巨人的大劍，20% 機率造成 1.8 倍傷害。', [['爆發', 'red']], 'gigante', { critBoost: .2, critMult: 1.8 }),
    S('巨盾格擋', 'support', 6, 0, '舉起巨大的圓盾：接下來 2 回合受到的傷害 -50%，並把受到傷害的 30% 反彈給對手。', [['減傷', 'blue'], ['反傷', 'gold']], 'haki', { damageReductionTurns: 2, damageReductionValue: .5, thornTurns: 2, thornRatio: .3 }),
    S('艾爾巴夫的戰吼', 'support', 4, 0, '巨人戰士的怒吼響徹戰場：攻擊 +2，40% 使對手恐懼 1 回合。', [['強化', 'gold'], ['恐懼', 'gold']], 'voice', { selfBuffAtk: 2, fearChance: .4, fearTurns: 1 }),
    S('百年決鬥', 'attack', 8, 0, '一百年來從未停下的連續劍擊，攻擊 2～5 次（每次威力 70），30% 使對手破防 2 回合。', [['連擊', 'red'], ['破防', 'red']], 'barrage', { multiHitNormal: [2, 5], perHitPower: 70, armorBreakChance: .3, armorBreakTurns: 2 }),
    S('霸國', 'attack', 2, 200, '全能力 +1，揮舞巨劍與巨斧放出巨大的衝擊波——威力足以貫穿吞島怪獸的腹部，連衝擊產生的氣流都能粉碎巨物：造成 4～8 倍傷害，無視並擊破護盾。', [['奧義', 'gold'], ['破盾', 'blue']], 'quake', { statUpAll: 1, randomMultiplierRange: [4, 8], ignoreShield: true, shieldBreak: true }, true)
  ]);
  C('koza', { no: 125, name: '寇沙', title: '叛亂軍首領', types: ['格鬥'], maxHp: 1200, baseSpeed: 104, battleScale: .75, ai: 'balanced', cardPos: '52% 10%',
    desc: '阿拉巴斯坦叛亂軍的首領，薇薇的兒時玩伴。為了在乾旱中活下去而拿起武器，最後與薇薇一起阻止了戰爭。' }, [
    S('叛亂軍之劍', 'attack', 14, 110, '扛起長劍劈下，30% 使對手流血 2 回合（每回合 5%）。', [['流血', 'red']], 'sandslash', { dotChance: .3, dotTurns: 2, dotRatio: .05, dotLabel: '流血' }),
    S('守護這個國家', 'support', 5, 0, '為了國家而戰的覺悟：攻擊 +1、防禦 +1，回復 15% 體力。', [['強化', 'gold'], ['回復', 'green']], 'voice', { selfBuffAtk: 1, selfBuffDef: 1, healRatio: .15 }),
    S('綠洲的誓言', 'attack', 2, 190, '想起和薇薇在尤巴許下的約定，全力一擊：30% 機率造成 2 倍傷害，30% 使對手恐懼 1 回合。', [['奧義', 'gold'], ['恐懼', 'gold']], 'sandslash', { critBoost: .3, critMult: 2, fearChance: .3, fearTurns: 1 }, true)
  ]);
  Object.assign(CHAR_RARITY, { brook: 'SSR', tama: 'C', dorry: 'SR', koza: 'RR' });
  Object.assign(CHAR_OBTAIN, {
    brook: { boss: 0, eventOnly: true, npc: '僅能用碎片兌換（限定活動，目前沒有開放中的活動）' },
    tama: { boss: 0, reward: 'wano', npc: '和之國篇 NPC・通關後免費加入' },
    dorry: { boss: 0, eventOnly: true, npc: '11 月限定活動抽獎池「艾爾巴夫第一彈」：集滿 150 碎片合成' },
    koza: { boss: 0, reward: 'alabasta', npc: '阿拉巴斯坦篇 NPC・通關後免費加入' }
  });
  /* 已經通關的玩家：補發這次新增的通關獎勵角色 */
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { const d = SAVE.data, got = []; [['tama', 'wano'], ['koza', 'alabasta']].forEach(([cid, ch]) => { const st = d.chapters && d.chapters[ch]; if (st && st.cleared && !owned(cid)) { addCrew(cid, 10); got.push({ char: cid }); } });
    if (got.length) { SAVE.save(); if (window.queueWelcome) queueWelcome(got); } } catch (e) { } }, 2500));
  const after = (a, ids) => { ids.forEach(id => { const k = CHARACTER_ORDER.indexOf(id); if (k >= 0) CHARACTER_ORDER.splice(k, 1); }); const i = CHARACTER_ORDER.indexOf(a); CHARACTER_ORDER.splice(i < 0 ? CHARACTER_ORDER.length : i + 1, 0, ...ids); };
  after('moria', ['brook']); after('kinemon', ['tama']); after('loki', ['dorry']); after('vivi', ['koza']);
})();

/* ==== 原 js/roster_v92.js ==== */
/* v92：多利升 SSR（攻擊型）、洛基升 UR+（限定抽獎池）、新角色布洛基（SSR・赤鬼・防禦型，立繪準備中）、多利＋布洛基羈絆。 */
(function () {
  const PEND = 'assets/chars/brogy.webp?v=e7547575', PFACE = 'assets/chars/brogy_face.webp?v=d6f341cf';
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  /* --- 多利：SSR、攻擊型 --- */
  if (CHARACTERS.dorry) { const d = CHARACTERS.dorry; Object.assign(d, { maxHp: 1850, baseSpeed: 96, statScale: 1.05, desc: d.desc.replace(/。$/, '') + '。攻擊型角色：大劍的每一擊都帶著百年決鬥磨出來的力量。' });
    const sk = n => d.skills.find(x => x.name === n); if (sk('巨劍劈砍')) Object.assign(sk('巨劍劈砍'), { power: 165, desc: '揮下巨人的大劍，25% 機率造成 2 倍傷害。', effect: { critBoost: .25, critMult: 2 } });
    if (sk('百年決鬥')) Object.assign(sk('百年決鬥'), { desc: '一百年來從未停下的連續劍擊：攻擊 1～100 次（每次威力 6），之後 3 回合每回合攻擊 +1。', tags: [['百連擊', 'red'], ['強化', 'gold']], effect: { multiHitNormal: [1, 100], perHitPower: 6, rampAtkTurns: 3 } }); }
  CHAR_RARITY.dorry = 'SSR';
  /* v100：多利換上新版立繪 */ if (CHARACTERS.dorry) Object.assign(CHARACTERS.dorry, { image: 'assets/chars/dorry.webp?v=7205a5ca', avatar: 'assets/chars/dorry_face.webp?v=290a1f28', ultimateBg: 'assets/chars/dorry.webp?v=7205a5ca' });
  /* --- 洛基：UR+、只能從限定抽獎池取得 --- */
  CHAR_RARITY.loki = 'UR+'; CHAR_OBTAIN.loki = Object.assign({}, CHAR_OBTAIN.loki || {}, { boss: 0, eventOnly: true, npc: '巨人篇・僅能從限定抽獎池取得（目前沒有開放中的活動）' });
  /* --- 布洛基：SSR、赤鬼、防禦型（技能與多利相似，偏重防守） --- */
  CHARACTERS.brogy = { id: 'brogy', name: '布洛基', title: '赤鬼', types: ['格鬥'], image: 'assets/chars/brogy.webp?v=e7547575', avatar: 'assets/chars/brogy_face.webp?v=d6f341cf', ultimateBg: 'assets/chars/brogy.webp?v=e7547575', scale: .85, worldScale: .9, ai: 'balanced', maxHp: 2300, baseSpeed: 86, battleScale: 1.8, statScale: 1.05, cardPos: '50% 10%',
    desc: '艾爾巴夫的巨人戰士「赤鬼」布洛基，多利一百年的決鬥對手。揮舞巨斧、舉著大盾，是能扛住任何攻擊的防禦型戰士。技能和多利幾乎相同，多利偏攻擊、布洛基偏防守。',
    skills: [
      S('巨斧劈砍', 'attack', 15, 160, '揮下巨人的大斧：25% 機率造成 1.8 倍傷害，40% 使對手防禦 -1（2 回合），自身防禦 +1。', [['爆發', 'red'], ['降防', 'blue'], ['強化', 'gold']], 'gigante', { critBoost: .25, critMult: 1.8, enemyDefDownChance: [.4, [1, 1], 2], selfBuffDef: 1 }),
      S('巨盾格擋', 'support', 6, 0, '把大盾立在身前：接下來 2 回合受到的傷害 -60%，並把受到傷害的 40% 反彈給對手。', [['減傷', 'blue'], ['反傷', 'gold']], 'haki', { damageReductionTurns: 2, damageReductionValue: .6, thornTurns: 2, thornRatio: .4 }),
      S('艾爾巴夫的戰吼', 'support', 4, 0, '巨人戰士的怒吼：防禦 +2，回復 50% 體力，30% 使對手恐懼 1 回合。', [['強化', 'gold'], ['回復', 'green'], ['恐懼', 'gold']], 'voice', { selfBuffDef: 2, healRatio: .5, fearChance: .3, fearTurns: 1 }),
      S('百年決鬥', 'attack', 8, 0, '一百年來從未停下的斧擊：攻擊 1～100 次（每次威力 5），之後 3 回合每回合防禦 +1。', [['百連擊', 'red'], ['強化', 'gold']], 'barrage', { multiHitNormal: [1, 100], perHitPower: 5, rampDefTurns: 3 }),
      S('霸國', 'attack', 2, 180, '全能力 +1，和多利一起揮舞巨斧與巨劍放出的衝擊波：造成 3～6 倍傷害、無視並擊破護盾，之後 2 回合受到的傷害 -30%。', [['奧義', 'gold'], ['破盾', 'blue'], ['減傷', 'blue']], 'quake', { statUpAll: 1, randomMultiplierRange: [3, 6], ignoreShield: true, shieldBreak: true, damageReductionTurns: 2, damageReductionValue: .3 }, true)
    ] };
  if (!CHARACTER_ORDER.includes('brogy')) CHARACTER_ORDER.push('brogy');
  CHAR_RARITY.brogy = 'SSR'; CHAR_OBTAIN.brogy = { boss: 0, eventOnly: true, npc: '11 月限定活動抽獎池「艾爾巴夫第一彈」：集滿 150 碎片合成' };
  /* --- 羈絆：艾爾巴夫的雙鬼（同一個陣容中：受到傷害 -20%、造成傷害 +20%；不受一般羈絆的 10% 上限限制） --- */
  if (typeof COLLECTION_SETS !== 'undefined' && !COLLECTION_SETS.some(s => s.id === 'elbaf_oni')) COLLECTION_SETS.push({ id: 'elbaf_oni', need: 2, name: '艾爾巴夫的雙鬼', members: ['dorry', 'brogy'], bonus: { dr: 20, atk: 20 }, capFree: true });
  /* v94：立繪縮放與鏡射快速更正 */
  [['whitebeard', 2.1], ['shanks', .95], ['bigmom', 1.45], ['buggy', 1.1]].forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].battleScale = v; });
  if (CHARACTERS.monet) CHARACTERS.monet.faceLeft = !CHARACTERS.monet.faceLeft;
  /* v97：女帝新皮膚「星塵異色」，寶藏幣 1000 購買（取代原本的第一個「敬請期待」位置） */
  if (typeof SKINS !== 'undefined') SKINS.hancock_s2 = { char: 'hancock', name: '星塵異色', image: 'assets/chars/hancock_skin2.webp?v=a164764f', avatar: 'assets/chars/hancock_skin2_face.webp?v=259c1f1e', price: { tokens: 1000 }, how: '寶藏幣 1000 購買（皮膚圖鑑）' };
})();

/* ==== 原 js/roster_v101.js ==== */
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

/* ==== 原 js/roster_v103.js ==== */
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

/* ==== 原 js/roster_v109.js ==== */
/* v109：稀有度與屬性校正、洛基史詩級強化（專剋伊姆）、伊姆改為可用的 UR+、巴基改 SSR 並強化、
   明哥（控場）／甚平（攻擊）／羅（控制）強化、卡特琳小幅削弱、三大將拉近。必須在 roster_v91 之前載入。 */
(function () {
  const C = CHARACTERS, sk = (id, i, o) => { const s = C[id] && C[id].skills[i]; if (!s) return; if (o.effect) o.effect = Object.assign({}, s.effect, o.effect); Object.assign(s, o); if (o.pp) s.maxPP = o.pp; };
  const st = (id, o) => { if (C[id]) Object.assign(C[id], o); };
  /* ---------- 稀有度 ---------- */
  Object.assign(CHAR_RARITY, { bigmom: 'UR+', kaido: 'UR+', imu: 'UR+', buggy: 'SSR', loki: 'UR+' }); /* 四皇一律 UR+（與皇帝領海畫面一致） */
  /* ---------- 屬性 ---------- */
  st('jinbe', { types: ['魚人', '格鬥'] }); st('robin', { types: ['超能'] }); st('dorry', { types: ['巨人', '格鬥'] }); st('brogy', { types: ['巨人', '格鬥'] });
  st('burgess', { types: ['格鬥'] }); st('loki', { types: ['巨人', '格鬥', '雷電'] });
  /* ---------- 洛基：史詩級強化 ---------- */
  st('loki', { maxHp: 3900, baseSpeed: 130, statScale: 2.15, role: '終極爆發型', desc: '艾爾巴夫的王子，被稱為「詛咒的王子」。吃下幻獸種尼德霍格的果實，擁有能與世界之王抗衡的古代巨人族意志——伊姆的支配與秒殺對他無效，受到伊姆的傷害減半。' });
  sk('loki', 0, { power: 95, desc: '從口中噴出雷電 2～6 次，並追加自身目前體力 12% 的傷害。', effect: { multiHitNormal: [2, 6], perHitPower: 95, bonusSelfHpRatio: .12 } });
  sk('loki', 1, { power: 175, desc: '雷電纏身的鐵鎚重擊：50% 機率 2.5 倍爆擊，50% 使對手無法攻擊 1 回合，40% 使對手破防 3 回合。', effect: { critBoost: .5, critMult: 2.5, skipAttackChance: .5, armorBreakChance: .4 } });
  sk('loki', 2, { desc: '喚醒原初的世界：清除對手強化與自身負面狀態，造成 10 次最大體力 3% 的傷害，60% 冰凍 2 回合，接下來 2 回合傷害 ×2.5。', effect: { fixedLightHits: [10, .03], freezeChance: .6, damageMultValue: 2.5 } });
  sk('loki', 3, { desc: '五道鐵雷貫穿：造成 5 次最大體力 5% 的傷害，下一次受到的攻擊以 2 倍反彈並附帶負面效果，對手無法攻擊 1 回合。', effect: { fixedLightHits: [5, .05] } });
  /* ---------- 伊姆：改為可使用的 UR+（BOSS 戰仍保有黑轉支配與 20 條命） ---------- */
  st('imu', { maxHp: 2300, statScale: 1.15, role: '支配型' });
  sk('imu', 1, { power: 140, pp: 2, desc: '世界之王的一擊：造成 4～8 倍傷害，10% 機率直接秒殺（洛基無效）。', effect: { randomMultiplierRange: [4, 8], executeChance: .1, noRestore: false } });
  sk('imu', 4, { desc: '奧義。召喚最初的 20 人：BOSS 戰中獲得 20 條命，其他情況獲得 2 條命，並全能力 +1。', effect: { statUpAll: 1 } });
  /* ---------- 巴基（SSR） ---------- */
  st('buggy', { maxHp: 1950, statScale: 1.02 });
  sk('buggy', 2, { power: 75, effect: { perHitPower: 75 } });
  /* ---------- 明哥：控場 ---------- */
  st('doflamingo', { maxHp: 1700, statScale: 1.09 });
  sk('doflamingo', 0, { desc: '用絲線操縱的強力一擊：30% 使對手燒傷 2 回合，25% 使對手麻痺 1 回合。', effect: { paralyzeChance: .25, paralyzeTurns: 1 } });
  sk('doflamingo', 2, { power: 55, effect: { perHitPower: 55 } });
  sk('doflamingo', 3, { desc: '用絲線織出防護網：獲得最大體力 10～15% 的護盾；2 回合內受到攻擊時反彈 10～35% 傷害，且對手的攻擊有 20% 機率失效。', effect: { attackFailChance: .2 } });
  sk('doflamingo', 4, { desc: '奧義。用絲線把整座國家關進收縮的鳥籠：連續切割 20～40 次，每次造成對手目前體力 0.5～3% 的傷害；對手全能力 -1，20% 暈眩 1 回合，2 回合內使用技能有 30% 機率失效。', effect: { attackFailChance: .3, stunChance: .2, stunTurns: 1 } });
  /* ---------- 甚平：攻擊 ---------- */
  st('jinbe', { statScale: 1.15, role: '攻擊型' });
  sk('jinbe', 0, { power: 60, desc: '魚人空手道「擊水」：攻擊 3～5 次。', effect: { perHitPower: 60 } });
  sk('jinbe', 1, { power: 180 }); sk('jinbe', 2, { power: 210, effect: { armorBreakChance: .6 } }); sk('jinbe', 3, { power: 260 });
  sk('jinbe', 4, { desc: '奧義。抓住對手順著海流摔出：造成 5～8 倍傷害，50% 使對手恐懼 1 回合。', effect: { randomMultiplierRange: [5, 8] } });
  /* ---------- 羅：控制 ---------- */
  st('law', { maxHp: 1500, statScale: 1.26, role: '控制型' });
  sk('law', 0, { desc: '注射·刺擊：吸收 20% 傷害，25% 使對手麻痺 1 回合。', effect: { paralyzeChance: .25, paralyzeTurns: 1 } });
  sk('law', 1, { desc: '高頻手術刀連續切割 3～10 次：2 回合內對手無法回復，攻擊有 20% 機率失效。', effect: { attackFailTurns: 2, attackFailChance: .2 } });
  sk('law', 2, { desc: '伽馬刀：造成最大體力 10% 的傷害、清除對手強化、使對手虛弱 1 回合，30% 暈眩 1 回合。', effect: { stunChance: .3, stunTurns: 1 } });
  sk('law', 4, { desc: '奧義。衝擊波動：獲得目前體力 50% 的護盾並吸取對手體力，對手全能力 -1。', effect: { enemyAllDown: 1 } });
  /* ---------- 三大將：拉近實力（青雉補強、黃猿略降） ---------- */
  st('aokiji', { maxHp: 1850, statScale: 1.42 }); st('kizaru', { maxHp: 1600, statScale: 1.28 }); st('akainu', { statScale: 1.32 });
  /* ---------- 卡特琳：小幅削弱 ---------- */
  st('catarina', { statScale: 1.08 });
})();

/* ==== 原 js/roster_v110.js ==== */
/* v110：洛基（限定池專屬、角色特性、鐵雷五矢與尼德霍格覺醒改版）、伊姆升為 UR++（全新五招、未裝備皮膚時只能用不死之身）。
   必須在 roster_v109 之後、roster_v91 之前載入。戰鬥效果在 ext_v110.js。 */
(function () {
  const C = CHARACTERS, S = (id, i, o) => { const s = C[id] && C[id].skills[i]; if (!s) return; Object.assign(s, o); if (o.pp) s.maxPP = o.pp; };
  const TRAITS = ['immuneAbn', 'immuneExec', 'immuneDown'];
  /* ---------- UR++ 稀有度 ---------- */
  if (window.RAR_ORDER && !window.RAR_ORDER.includes('UR++')) window.RAR_ORDER.push('UR++');
  if (window.RAR_COLOR) window.RAR_COLOR['UR++'] = '#f4f4ff';
  if (GAME_SETTINGS.rarityScale && GAME_SETTINGS.rarityScale['UR++'] == null) GAME_SETTINGS.rarityScale['UR++'] = 1.2;
  if (typeof SELL_VALUE !== 'undefined') { SELL_VALUE.berry['UR++'] = 160000; SELL_VALUE.exp['UR++'] = 120000; }
  /* ---------- 洛基 ---------- */
  const L = C.loki; if (L) {
    L.traits = TRAITS;
    L.desc = '艾爾巴夫的王子，被稱為「詛咒的王子」。吃下傳說中的幻獸種尼德霍格的果實，擁有能與世界之王抗衡的力量，繼承了古代巨人族的意志。【角色特性】免疫異常、免秒殺、免能力下降。';
    S('loki', 3, { pp: 5, desc: '五道鐵雷貫穿：造成 5 次最大體力 5～8% 的傷害；下一次受到的攻擊以 1.5～2 倍反彈並附帶隨機異常；40% 機率使對手無法攻擊 1 回合或下一招失效；對手持續受到雷電傷害 2 回合。',
      tags: [['連擊', 'red'], ['反彈', 'gold'], ['封招', 'gold'], ['雷電', 'gold']],
      effect: { lokiBolts: [5, [.05, .08]], reflectTurns: 1, reflectMultRange: [1.5, 2], reflectNegative: true, lokiStun: .4, dotChance: 1, dotRatio: .03, dotTurns: 2, dotLabel: '雷電' } });
    const U = L.skills[4], fi = U && U.effect && U.effect.formImage;
    S('loki', 4, { pp: 2, desc: '奧義。全能力 +2；連續 2 回合恢復全部體力，並恢復其他技能的全部次數；接下來 2 回合傷害提升 200～2000%，攻擊有 20% 機率直接秒殺（BOSS 無效）。覺醒後直到倒下前：受到的傷害 -20%，每 5 回合清除對手的能力提升。',
      tags: [['奧義', 'gold'], ['變身', 'gold'], ['全回復', 'green'], ['秒殺', 'red']],
      effect: Object.assign({ awaken: 'nidhogg', fullHeal: true, fullRestoreTurns: 2, restoreAllPP: true, statUpAll: 2, damageMultTurns: 2, damageMultRange: [3, 21], executeBuffTurns: 2, executeBuffChance: .2, frostBoostTurns: 2, immunePermanent: true, lokiEternal: true }, fi ? { formImage: fi } : {}) });
  }
  Object.assign(CHAR_RARITY, { loki: 'UR+', imu: 'UR++' });
  CHAR_OBTAIN.loki = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, npc: '僅能從限定抽獎池取得（無法在巨人篇取得）' };
  /* ---------- 伊姆：UR++ ---------- */
  const I = C.imu; if (I) {
    I.traits = TRAITS; I.role = '世界之王';
    I.desc = '坐在瑪莉喬亞「空白王座」上的世界之王，真實身分籠罩在黑影之中。未裝備皮膚時只能使用「不死之身」。【角色特性】免疫異常、免秒殺、免能力下降。';
    S('imu', 0, { pp: 3, desc: '直接把對手場上的角色變成自己的部下；若自身隊伍已滿，則封印對手場上的角色 3 回合。（洛基無效）', tags: [['支配', 'red']], effect: { dominate: true } });
    S('imu', 1, { pp: 5, power: 60, desc: '施加「威壓」（3 回合：造成的傷害 -25%、防禦 -20%），再進行 1 次攻擊，造成 15～50 倍傷害，90% 機率直接秒殺（洛基、喬伊波伊與免秒殺角色無效）。', tags: [['威壓', 'red'], ['爆發', 'red'], ['秒殺', 'red']], effect: { pressureTurns: 3, randomMultiplierRange: [15, 50], executeChance: .9 } });
    S('imu', 2, { pp: 5, desc: '3 回合內，每回合結束時體力回復至 100%。若對手目前體力高於自己，雙方體力互換。', tags: [['全回復', 'green'], ['換血', 'gold']], effect: { fullRestoreTurns: 3, hpSwapIfLower: true } });
    S('imu', 3, { pp: 8, desc: '魔氣化為各種武器，每次隨機施展一種：天罰劍（10～20 倍傷害）、日食爆擊（最大體力 20%）、憤怒劍（5～10 連擊）、怨魔劍（3 連擊並回復傷害的 50%）、虛無劍（目前體力 10～20%＋麻痺 1 回合）、長柄劍（對手下回合技能失效＋3 次攻擊，50% 虛弱）。',
      effect: { variants: [
        { name: '天罰劍', power: 100, effect: { randomMultiplierRange: [10, 20] } },
        { name: '日食爆擊', power: 0, effect: { fixedLightHits: [1, .2] } },
        { name: '憤怒劍', power: 40, effect: { multiHitNormal: [5, 10], perHitPower: 40 } },
        { name: '怨魔劍', power: 60, effect: { multiHitNormal: [3, 3], perHitPower: 60, lifesteal: .5 } },
        { name: '虛無劍', power: 0, effect: { imuVoidCut: [.1, .2], paralyzeChance: 1, paralyzeTurns: 1 } },
        { name: '長柄劍', power: 50, effect: { multiHitNormal: [3, 3], perHitPower: 50, enemySkillNullify: 1, weakChance: .5, weakTurns: 1 } }] } });
    S('imu', 4, { pp: 1, desc: '奧義。BOSS 戰中獲得 20 條命，其他情況獲得 2 條命，全能力 +3；對手直到戰鬥結束前無法提升能力，且每回合結束時都會受到一次「魔氣變化」。', tags: [['奧義', 'gold'], ['復活', 'gold'], ['封強化', 'red']], effect: { extraLives: 20, noRestore: true, statUpAll: 3, imuAura: true } });
  }
})();

/* ==== 原 js/roster_v112.js ==== */
/* v112：洛基第一招改版（削弱）、紅髮小幅削弱、大和新皮膚「和服歌妓」（寶藏幣 1500）。roster_v110 之後載入。 */
(function () {
  const L = CHARACTERS.loki; if (L && L.skills[0]) Object.assign(L.skills[0], { pp: 10, maxPP: 10, power: 70,
    desc: '噴出雷電攻擊 5～10 次，並追加這次總傷害 5～10% 的額外傷害。', tags: [['連擊', 'red'], ['追加傷害', 'gold']],
    effect: { multiHitNormal: [5, 10], perHitPower: 70, bonusTotalPct: [.05, .1] } });
  /* 紅髮：小幅削弱（體質略降；神避秒殺率 60%→40%、倍率上限 50→40；強者波動最多 50→40 段） */
  const S = CHARACTERS.shanks; if (S) { S.statScale = .9; const k = S.skills;
    if (k[0]) { k[0].effect = Object.assign({}, k[0].effect, { multiHitNormal: [1, 40] }); k[0].desc = k[0].desc.replace(/1～50|1-50|50 次|50次/g, m => m.replace('50', '40')); }
    if (k[4]) { k[4].effect = Object.assign({}, k[4].effect, { executeChance: .4, randomMultiplierRange: [5, 40] }); k[4].desc = k[4].desc.replace(/60%/g, '40%').replace(/5～50|5-50/g, '5～40'); } }
  if (typeof SKINS !== 'undefined') {
    delete SKINS.yamato_s2;
    SKINS.yamato_geisha = { char: 'yamato', name: '和服歌妓', image: 'assets/chars/yamato_skin2.webp?v=9fb580bb', avatar: 'assets/chars/yamato_skin2_face.webp?v=63013093', battleScale: .6, price: { tokens: 1500 }, how: '寶藏幣 1500 購買（皮膚圖鑑）' };
    ['yamato_s3', 'yamato_s4'].forEach(k => { if (SKINS[k]) { const v = SKINS[k]; delete SKINS[k]; SKINS[k] = v; } }); /* 未推出的「？？？」排在新皮膚後面 */
  }
})();

/* ==== 原 js/roster_v115.js ==== */
/* v115：燼（炎災，SSR・防禦速度型）——2026 年 10 月月費限定、和之國篇小 BOSS；限定皮膚「萬聖之燼」（2026 年 10 月月費）。
   必須在 roster_v91 之前載入（序號：百獸海賊團第 1 位）。戰鬥效果 ppUpRandom、kingFlame 在 ext_v115.js。 */
(function () {
  const V = 115, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  CHARACTERS.king = { id: 'king', name: '燼', title: '炎災', types: ['火', '獸'], scale: .95, worldScale: 1.05, battleScale: 1.8, ai: 'balanced',
    image: `assets/chars/king.webp?v=${V}`, avatar: `assets/chars/king_face.webp?v=${V}`, ultimateBg: `assets/chars/king.webp?v=${V}`, cardPos: '50% 38%', cardFocus: '49% 30%',
    maxHp: 1880, baseSpeed: 114, statScale: 1.035, role: '防禦速度型',
    desc: '百獸海賊團「大看板」之一，傳說中的露娜莉亞族倖存者。背上燃起火焰時刀槍不入；火焰熄滅時，又能化為無齒翼龍以極速飛行。',
    skills: [
      S('刃里双皇', 'attack', 10, 16, '揮出燃燒的刀刃，對敵人進行 5～20 次火焰攻擊，並使對手燒傷 2 回合。', [['連擊', 'red'], ['燒傷', 'red']], 'barrage', { multiHitNormal: [5, 20], perHitPower: 16, burnChance: 1, burnTurns: 2 }),
      S('丹弓皇', 'attack', 6, 125, '速度 +2，並對敵人進行強力攻擊，造成傷害的 50% 回復自身體力。', [['強化', 'gold'], ['吸血', 'green']], 'flame', { selfBuffSpd: 2, lifestealRange: [.5, .5] }),
      S('貂自尊皇', 'attack', 5, 100, '防禦 +2，並對敵人進行爆炸攻擊，造成 2～3 倍傷害（無視護盾）。', [['強化', 'gold'], ['爆發', 'red'], ['破盾', 'blue']], 'burn', { selfBuffDef: 2, randomMultiplierRange: [2, 3], ignoreShield: true }),
      S('露娜莉亞族的驕傲', 'support', 3, 0, '回復 50% 體力，解除自身的異常狀態與負面能力，並讓隨機兩個技能的使用次數 +2（奧義除外）。', [['回復', 'green'], ['淨化', 'blue'], ['回復次數', 'gold']], 'haki', { healRatio: .5, clearSelfDebuffs: true, ppUpRandom: [2, 2] }),
      S('火龍皇', 'attack', 2, 100, '奧義。化身無齒翼龍，全身燃起露娜莉亞之火俯衝：造成 2.5～3.5 倍火焰傷害，使對手燒傷 3 回合。之後 3 回合背上的火焰燃燒：受到的傷害 -25%，攻擊者會被火焰反灼 20% 的傷害；火焰熄滅時速度 +2。', [['奧義', 'gold'], ['燒傷', 'red'], ['減傷', 'blue'], ['反彈', 'gold']], 'burn',
        { randomMultiplierRange: [2.5, 3.5], burnChance: 1, burnTurns: 3, kingFlame: { turns: 3, reduce: .25, thorn: .2, spdOnOut: 2 } }, true)
    ] };
  if (!CHARACTER_ORDER.includes('king')) CHARACTER_ORDER.push('king');
  CHAR_RARITY.king = 'SSR';
  CHAR_OBTAIN.king = { boss: 0, eventOnly: true, monthCard: '2026-10', npc: '2026 年 10 月月費限定・和之國篇 小 BOSS' };
  if (typeof COLLECTION_SETS !== 'undefined') { const b = COLLECTION_SETS.find(s => s.id === 'beasts' || /百獸/.test(s.name || '')); if (b && !b.members.includes('king')) b.members.push('king'); }
  /* 限定皮膚：萬聖之燼（只能從 2026 年 10 月月費取得，不能用寶藏幣購買、不在皮膚選擇券內） */
  if (typeof SKINS !== 'undefined') SKINS.king_halloween = { char: 'king', name: '萬聖之燼', image: `assets/chars/king_skin1.webp?v=${V}`, avatar: `assets/chars/king_skin1_face.webp?v=${V}`, battleScale: 1.8, monthCard: '2026-10', how: '2026 年 10 月月費限定（購買月費即可獲得）' };
  /* 和之國篇：鬼之島屋頂的決戰之前，新增小 BOSS「炎災」燼（第 11 步；舊存檔由 app.js chState 的 v115 轉換往後移） */
  const W = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'wano');
  if (W && !W.steps.some(s => s.enemy === 'king')) {
    if (!W.npcs.some(n => n.id === 'king_n')) W.npcs.push({ id: 'king_n', name: '燼', role: '百獸海賊團・大看板', look: 'king', pos: [-14, -30], chat: ['……凱多先生的夢想，由我來守護。', '露娜莉亞族的火焰，不會輕易熄滅。'] });
    const b = W.steps.findIndex(s => s.type === 'boss'), L = (w, t) => [w, t];
    W.steps.splice(b < 0 ? W.steps.length - 1 : b, 0, { type: 'duel', npc: 'king_n', enemy: 'king', title: '大看板「炎災」', desc: '百獸海賊團大看板「炎災」燼擋在屋頂的入口前。擊敗他，前往屋頂與凱多決戰。', reward: 3,
      lines: [L('king_n', '……你們就是闖進鬼之島的傢伙？'), L('king_n', '我是百獸海賊團大看板，「炎災」燼。凱多先生所在的屋頂，誰都別想踏上去！')],
      after: [L('king_n', '……背上的火……竟然被壓下去了……'), L(null, '燼的火焰暫時黯淡下來。通往屋頂的路打開了——凱多就在上面。')] });
  }
})();

/* ==== 原 js/roster_v118.js ==== */
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

/* ==== 原 js/roster_v121.js ==== */
/* v121：美音（歌姬・SSR・控制攻擊型）——只能從「歌姬挑戰」取得碎片（每首不同的歌第一次拿到 S 以上 → 20 片，集滿 100 片合成），無法抽獎。
   序號：紅髮海賊團第 1 位（必須在 roster_v91 之前載入）。戰鬥效果 noteBurst、utaStunBonus、utaDemon 在 ext_v121.js；第 1～4 招動畫在 fx_v121.js。
   戰鬥立繪縮放 0.6；第 5 招「召喚魔王」後換成魔王型態立繪（縮放 0.75＝0.6 × 1.25）。 */
(function () {
  const V = 121, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  CHARACTERS.uta = { id: 'uta', name: '美音', title: '歌姬', types: ['超能'], scale: .95, worldScale: 1, battleScale: .6, ai: 'balanced',
    image: `assets/chars/uta.webp?v=${V}`, avatar: `assets/chars/uta_face.webp?v=${V}`, ultimateBg: `assets/chars/uta_totmusica.webp?v=${V}`, cardPos: '50% 14%', cardFocus: '50% 16%',
    maxHp: 1580, baseSpeed: 118, statScale: 1.06, role: '控制攻擊型',
    desc: '紅髮傑克斯的女兒，被全世界喜愛的歌姬。吃下歌歌果實，能把聽到歌聲的人拉進「歌之世界」；在歌聲的盡頭，沉睡著傳說中的魔王「Tot Musica」。',
    skills: [
      S('歌聲催眠', 'support', 5, 0, '唱出催眠的歌聲：對手暈眩 1 回合，對手身上由技能施放的效果（減傷、無敵、閃避、反彈、再生、增傷等）全部消失，並清除對手的能力提升。', [['暈眩', 'gold'], ['解除效果', 'blue'], ['清除強化', 'blue']], 'voice',
        { stunChance: 1, stunTurns: 1, clearEnemyTimed: true, clearBuffs: true }),
      S('五線譜束縛', 'attack', 5, 10, '這回合先出招，五線譜纏住對手，使對手這回合的攻擊無效；接著承受 5～30 次音符攻擊，每一次音符有 10% 機率爆炸，額外造成 10% 最大體力的傷害。', [['先制', 'gold'], ['無效', 'blue'], ['連擊', 'red'], ['爆炸', 'red']], 'barrage',
        { firstStrike: true, invulnTurns: 1, multiHitNormal: [5, 30], perHitPower: 11, noteBurst: [.1, .1] }),
      S('具現化攻擊', 'attack', 10, 22, '防禦 +1，把歌聲具現化成音符攻擊對手 5～10 次；造成傷害的 10% 回復自身體力，20% 機率使對手暈眩 1 回合。', [['強化', 'gold'], ['連擊', 'red'], ['吸血', 'green'], ['暈眩', 'gold']], 'barrage',
        { selfBuffDef: 1, multiHitNormal: [5, 10], perHitPower: 22, lifesteal: .1, stunChance: .2, stunTurns: 1 }),
      S('歌之世界', 'attack', 5, 110, '把對手拉進歌歌果實的夢境「歌之世界」：造成傷害，對手攻擊 -1、速度 -1（2 回合），之後 3 回合每回合結束時受到 5% 最大體力的傷害。對手正在暈眩時，傷害 ×1.6。', [['降攻', 'blue'], ['降速', 'blue'], ['持續傷害', 'red'], ['暈眩追擊', 'gold']], 'voice',
        { enemyAtkDownChance: [[1, 1], 1, 2], enemySpdDownTemp: [1, 2], dotTurns: 3, dotRatio: .05, dotLabel: '歌之世界', utaStunBonus: 1.6 }),
      S('召喚魔王', 'support', 1, 0, '奧義。唱出禁忌之歌，召喚魔王「Tot Musica」（立繪變為魔王型態）。之後美音體力歸 0 時，會以 50% 體力復活一次：復活後全能力 +1、解除自身能力下降與負面狀態，這回合與下回合受到攻擊時反彈 25% 傷害；而且之後對手每次對美音造成傷害，對手自己會被扣除當下體力的 10～20%。只能使用 1 次（藥水無法恢復）。', [['奧義', 'gold'], ['變身', 'gold'], ['復活', 'green'], ['反彈', 'gold'], ['詛咒', 'red']], 'awaken',
        { formImage: { image: `assets/chars/uta_totmusica.webp?v=${V}`, scale: 1.25, turns: 999, label: '魔王型態' }, utaDemon: { revive: .5, thorn: .25, thornTurns: 2, curse: [.1, .2] }, noRestore: true }, true)
    ] };
  if (!CHARACTER_ORDER.includes('uta')) CHARACTER_ORDER.push('uta');
  CHAR_RARITY.uta = 'SSR';
  CHAR_OBTAIN.uta = { boss: 0, eventOnly: true, npc: '歌姬挑戰：每首不同的歌第一次拿到 S 以上評分得 20 片碎片，集滿 100 片合成（無法抽獎）' };
})();

/* ==== 原 js/roster_v128.js ==== */
/* v128：凱多（四皇）換新立繪（使用者提供圖 1，左右鏡射），縮放照舊（scale 1.2）。
   第 5 招「升龍・火焰八卦」使用後：雷光劈下 → 化為龍人型態（使用者提供圖 2，立繪縮放 1.2 + 0.3 ＝ 1.5，即 ×1.25），
   一直維持到凱多倒下或戰鬥結束才恢復圖 1。效果 kaidoDragon 的處理在 ext_v128.js，雷光演出在 fx_v128.js。
   載入順序：data_ext.js 之後、roster_v91.js 之前（與其他 roster 檔相同）。 */
(function () {
  const K = typeof CHARACTERS !== 'undefined' && CHARACTERS.kaido; if (!K) return;
  const V = 130; /* v130：立繪縮小重新壓縮 */
  K.image = `assets/chars/kaido_v128.webp?v=${V}`;
  K.ultimateBg = `assets/chars/kaido_v128.webp?v=${V}`;
  K.avatar = `assets/chars/kaido_face_v128.webp?v=${V}`;
  K.cardPos = '50% 12%'; K.cardFocus = '50% 16%';
  const U = K.skills && K.skills[4]; if (!U) return;
  U.effect.kaidoDragon = { image: `assets/chars/kaido_dragon.webp?v=${V}`, scale: 1.25, label: '龍人型態' };
  if (!/龍人型態/.test(U.desc)) U.desc += ' 使用後雷光劈下，化為「龍人型態」（立繪改變），直到凱多倒下或戰鬥結束。';
  if (U.tags && !U.tags.some(t => t[0] === '變身')) U.tags.push(['變身', 'gold']);
})();

/* ==== 原 js/roster_v129.js ==== */
/* v129：紅髮削弱、新角色洛克斯（UR++・戴維）、洛克斯挑戰用的哥爾·D·羅傑（只在挑戰中出現的敵人）。
   載入順序：roster_v128.js 之後、roster_v91.js 之前。技能效果 rocksTrue / rocksShun / rocksKill / rocksStore / rocksSecret 在 ext_v129.js；挑戰在 rocks_v129.js。 */
(function () {
  const V = 130; /* v130：立繪縮小重新壓縮 */
  /* ---------- 紅髮：同稀有度（洛基除外）勝率約 75%（tests/duel-sim.js，玩家式出招：奧義一能用就放）----------
     體質 0.9 → 0.85；神避秒殺 40% → 20%、倍率 5～40 → 5～30。調整前約 88%，調整後約 75%。 */
  const SH = CHARACTERS.shanks;
  if (SH) {
    SH.statScale = .85;
    const u = SH.skills[4];
    if (u) {
      u.effect = Object.assign({}, u.effect, { executeChance: .2, randomMultiplierRange: [5, 30] });
      u.desc = u.desc.replace(/5～\d+ 倍/, '5～30 倍').replace(/\d+% 直接秒殺/, '20% 直接秒殺');
    }
  }

  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});

  /* ---------- 洛克斯（UR++・戴維・攻擊爆發型）：集齊皇帝領海全部四皇後，通過「洛克斯挑戰」四關直接加入 ---------- */
  CHARACTERS.rocks = { id: 'rocks', name: '洛克斯', title: '戴維', types: ['闇', '格鬥'], scale: .9, worldScale: 1, battleScale: 1, ai: 'aggressive',
    image: `assets/chars/rocks.webp?v=${V}`, avatar: `assets/chars/rocks_face.webp?v=${V}`, ultimateBg: `assets/chars/rocks.webp?v=${V}`, cardPos: '50% 8%', cardFocus: '60% 14%',
    maxHp: 2300, baseSpeed: 120, statScale: 1.15, role: '攻擊爆發型', /* 對 UR+（洛基除外）勝率約 79%（tests/duel-sim.js，玩家式出招） */
    desc: '洛克斯海賊團船長，被稱為「戴維」的男人。他的船上曾聚集了後來的四皇；在神之谷與哥爾·D·羅傑、海軍英雄卡普交手的傳說海賊。',
    skills: [
      S('蝕', 'attack', 10, 150, '無視護盾、無視對手的能力提升、無視對手的效果技能（減傷、無敵、閃避、反彈、替身等），也無視攻擊無效，直接對敵人造成真實傷害。', [['真實', 'gold'], ['無視護盾', 'gold'], ['必中', 'red']], 'darkpull',
        { rocksTrue: true, ignoreShield: true }),
      S('瞬', 'support', 5, 0, '先出招。無視對手的技能與效果，自身無敵 1 回合並回復 20% 體力；下回合攻擊時有 5～25% 機率直接秒殺對手（BOSS 改為受到 3 倍傷害）。', [['先制', 'gold'], ['無敵', 'blue'], ['回復', 'green'], ['秒殺', 'red']], 'naraku',
        { firstStrike: true, invulnTurns: 1, immuneTurns: 1, healRatio: .2, rocksShun: [.05, .25] }),
      S('殺', 'attack', 5, 100, '對手稀有度在 SSR 以下（不含 SSR）時直接秒殺；SSR 以上（含 SSR）有 50% 直接秒殺，另外 50% 扣除對手當下體力的一半。此技能無法被抵擋或無效化（BOSS：秒殺改為 3 倍傷害，扣除體力最多 15% 最大體力）。', [['秒殺', 'red'], ['必中', 'red'], ['無法無效', 'gold']], 'ashura',
        { rocksKill: true }),
      S('蓄', 'support', 2, 0, '第一次使用：開始記錄之後敵人對我方造成的傷害（最多記錄 5 回合）。第二次使用：把記錄到的傷害全部無視護盾奉還給對手。第一次使用後超過 5 回合才再次使用，就無法奉還。', [['蓄力', 'gold'], ['反擊', 'red'], ['無視護盾', 'gold']], 'darkcopy',
        { rocksStore: 5 }),
      S('戴維的秘密', 'support', 2, 0, '奧義。全能力 +2，回復全部體力，隨機讓 2 個技能各恢復 2 次使用次數。之後瀕臨死亡（體力低於 10%）時自動回復 20% 體力，且下回合攻擊傷害 5～10 倍（每次使用觸發 1 次）；3 回合內若秒殺對手，對手下一位出場的角色必定恐懼、無法攻擊。（藥水可以恢復次數）', [['奧義', 'gold'], ['強化', 'gold'], ['全回復', 'green'], ['保命', 'green'], ['恐懼', 'blue']], 'awaken',
        { statUpAll: 2, fullHeal: true, rocksSecret: { restore: 2, picks: 2, guard: [.1, .2], mult: [5, 10], fearTurns: 3 } }, true)
    ] };
  if (!CHARACTER_ORDER.includes('rocks')) CHARACTER_ORDER.push('rocks');
  CHAR_RARITY.rocks = 'UR++';
  CHAR_OBTAIN.rocks = { boss: 0, eventOnly: true, npc: '洛克斯挑戰：集齊皇帝領海全部四皇後才能挑戰，通過四關後直接加入（無法抽獎）' };

  /* ---------- 哥爾·D·羅傑：只在洛克斯挑戰第二關出現（不在圖鑑、不能取得）。立繪尚未提供，先用剪影 ---------- */
  CHARACTERS.roger = { id: 'roger', name: '哥爾·D·羅傑', title: '海賊王', types: ['格鬥', '超能'], scale: .95, worldScale: 1, battleScale: 1, ai: 'aggressive', npcOnly: true,
    image: `assets/chars/roger_sil.svg?v=${V}`, avatar: `assets/chars/roger_sil_face.svg?v=${V}`, ultimateBg: `assets/chars/roger_sil.svg?v=${V}`,
    maxHp: 2250, baseSpeed: 116, statScale: .95,
    desc: '征服偉大航路的海賊王。', skills: [
      S('霸王色纏繞', 'attack', 10, 34, '刀身纏上霸王色斬擊 3～8 次，每一擊有 30% 機率化為真實攻擊直接打中本體。', [['連擊', 'red'], ['真實', 'gold']], 'onigiri', { multiHitNormal: [3, 8], perHitPower: 34, trueHitChance: .3 }),
      S('海賊王的威壓', 'support', 5, 0, '全能力 +1，回復 15% 體力，對手攻擊 -1（2 回合）。', [['強化', 'gold'], ['回復', 'green'], ['降攻', 'blue']], 'haki', { statUpAll: 1, healRatio: .15, enemyAtkDownChance: [[1, 1], 1, 2] }),
      S('一刀兩斷', 'attack', 6, 150, '強力斬擊，30% 使對手暈眩 1 回合。', [['暈眩', 'gold']], 'sanzen', { stunChance: .3, stunTurns: 1 }),
      S('聽見萬物之聲', 'support', 4, 0, '看穿對手的下一招：閃避下 1 次攻擊，並清除自身負面狀態。', [['閃避', 'blue'], ['淨化', 'green']], 'haki', { dodgeTurns: 1, clearSelfDebuffs: true }),
      S('神避', 'attack', 1, 100, '奧義。造成 3～20 倍傷害（無視護盾），15% 直接秒殺（BOSS 改為 3 倍傷害）。', [['奧義', 'gold'], ['秒殺', 'red']], 'ashura', { randomMultiplierRange: [3, 20], ignoreShield: true, executeChance: .15, noRestore: true }, true)
    ] };
  CHAR_RARITY.roger = 'UR+';
})();

/* ==== 原 js/rocks_v166.js ==== */
/* v166 使用者 11/06：洛克斯換上新立繪（assets/chars/rocks.webp），舊立繪改成皮膚「神之谷的霸者」（rocks_skin1）；
   新立繪在戰鬥中有藍黑色閃電環繞（.rocks-aura，只在原本造型時出現，皮膚與戴維分身不顯示）。
   皮膚取得：擁有洛克斯就自動獲得（那是洛克斯原本的樣子）。可動 GIF 待使用者提供檔案後再換上。 */
(function () {
  if (typeof SKINS === 'undefined' || typeof CHARACTERS === 'undefined' || !CHARACTERS.rocks) return;
  const V = 166, img = n => `assets/chars/${n}.webp?v=${V}`;
  const R = CHARACTERS.rocks; R.battleScale = .85; /* 使用者 11/06 08:13：新立繪尺寸 0.85 */ R.image = img('rocks'); R.avatar = img('rocks_face'); R.ultimateBg = img('rocks'); R.cardFocus = '61% 22%'; R.cardPos = '50% 12%';
  SKINS.rocks_classic = { char: 'rocks', name: '神之谷的霸者', image: img('rocks_skin1'), avatar: img('rocks_skin1_face'), battleScale: 1, how: '擁有洛克斯即可使用（洛克斯原本的造型）' };
  const grant = () => { try { if (!SAVE || !SAVE.data || typeof owned !== 'function' || !owned('rocks')) return; const S = SAVE.data.skins = SAVE.data.skins || { owned: [], equip: {} }; S.owned = S.owned || [];
    if (!S.owned.includes('rocks_classic')) { S.owned.push('rocks_classic'); SAVE.save && SAVE.save(); } } catch (e) { } };
  document.addEventListener('DOMContentLoaded', () => { grant(); setInterval(grant, 5000); });
  /* 戰鬥：原本造型的洛克斯加上閃電環繞 */
  const SVG = '<svg class="rk-bolts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    ['M8,30 L18,38 L12,46 L24,56', 'M92,26 L80,36 L88,44 L74,58', 'M20,80 L32,70 L28,62 L40,52', 'M84,78 L70,70 L76,60 L62,50', 'M48,6 L44,18 L54,24 L46,36', 'M30,12 L36,24 L26,30'].map((d, i) => `<path d="${d}" style="--i:${i}"/>`).join('') + '</svg>';
  const tag = f => { try { if (!battle || !f) return; const side = f === battle.player ? 'L' : f === battle.enemy ? 'R' : null; if (!side) return; const el = document.getElementById('bF' + side); if (!el) return;
    const on = f.id === 'rocks' && /assets\/chars\/rocks\.webp/.test(f.image || '');
    el.classList.toggle('rocks-aura', on); if (on && !el.querySelector('.rk-bolts')) el.insertAdjacentHTML('beforeend', SVG); } catch (e) { } };
  const hook = () => { if (typeof applyVisual !== 'function' || applyVisual.__rk) return; const _a = applyVisual; applyVisual = function (f) { const r = _a.apply(this, arguments); tag(f); return r; }; applyVisual.__rk = true; };
  document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0));
})();

/* ==== 原 js/roster_v142.js ==== */
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

/* ==== 原 js/roster_v152.js ==== */
/* v152：神之騎士團——曼麥亞・軍子宮（SSR）與費加蘭德・夏姆洛克聖（SSR，團長）。巨人篇的兩位 BOSS（使用者 11/03 設計，夏姆洛克第 1、3、4 招由 Claude 設計並經示意圖確認）。
   取得方式：限定「神之騎士團」抽獎池（使用者 11/03：暫時不開放、不規劃），所以目前只出現在巨人篇劇情，不會出現在一般懸賞召喚。
   立繪縮放：軍子 0.6（第 5 招黑轉支配變身 0.8，維持 2 回合，並播放「黑轉支配」全畫面背景演出約 4 秒）；夏姆洛克 0.65（第 5 招身後出現地獄三頭犬 1.2，鏡射，3 回合）。
   新效果（ext_v152.js）：fixedDot、sureHit、lowHpBonus、gunkoAfter、bgCutin、cerberus。必須在 roster_v91 之前載入。 */
(function () {
  const V = 152, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const img = n => `assets/chars/${n}.webp?v=${V}`;
  CHARACTERS.gunko = { id: 'gunko', name: '曼麥亞・軍子宮', title: '神之騎士團', types: ['超能'], scale: 1, worldScale: 1, battleScale: .6, ai: 'balanced',
    image: img('gunko'), avatar: img('gunko_face'), ultimateBg: img('gunko_dark'), cardPos: '50% 12%', cardFocus: '50% 14%',
    maxHp: 1500, baseSpeed: 122, statScale: 1.02, role: '控制攻擊型',
    desc: '世界貴族「天龍人」曼麥亞家族的一員，隸屬「神之騎士團」。箭箭果實能力者，能把箭頭標誌變成實體，施展由箭矢構成的攻擊與特效。',
    skills: [
      S('矢印緣', 'attack', 10, 0, '箭矢強烈攻擊 3 次，對手接下來 3 回合每回合受到 300～1000 點傷害；對手下一回合攻擊軍子時，20% 傷害反彈回對手身上。', [['連擊', 'red'], ['持續傷害', 'red'], ['反彈', 'blue']], 'barrage',
        { multiHitNormal: [3, 3], perHitPower: 46, fixedDot: { turns: 3, range: [300, 1000], label: '矢印' }, thornTurns: 2, thornRatio: .2 }),
      S('自動追蹤', 'attack', 4, 70, '射出會自動追蹤的箭頭條帶（必中，無法閃避）：對手速度 -1、清除對手的能力提升，50% 機率使對手恐懼；軍子下回合的傷害 1.5～3 倍。', [['必中', 'gold'], ['降速', 'blue'], ['清除強化', 'blue'], ['恐懼', 'gold'], ['增傷', 'red']], 'barrage',
        { sureHit: true, enemySpdDownTemp: [1, 3], clearBuffs: true, fearChance: .5, fearTurns: 1, nextAttackMult: [1.5, 3], nextAttackMultTurns: 1 }),
      S('肢體強化', 'support', 5, 0, '全能力 +1，消除自身的弱化與能力下降，並獲得當前體力 25% 的護盾。', [['強化', 'gold'], ['淨化', 'green'], ['護盾', 'green']], 'aura',
        { statUpAll: 1, clearSelfDebuffs: true, selfShieldCurrentHpRatio: .25 }),
      S('革命舞曲・突刺', 'attack', 10, 120, '無視護盾，直接攻擊對手要害：對手防禦 -2（3 回合），10% 機率秒殺（BOSS 改為 3 倍傷害）。', [['無視護盾', 'red'], ['破防', 'blue'], ['秒殺', 'red']], 'slash',
        { ignoreShield: true, enemyDefDownTemp: [2, 3], executeChance: .1 }),
      S('黑轉支配', 'support', 2, 0, '奧義。轉換為黑轉型態（立繪變身 2 回合）：全能力 +2、恢復 50% 體力，接下來 3 回合攻擊 5～20 倍，無敵 2 回合；無敵結束後 3 回合受到的傷害 -35%，而且受到攻擊時有 30% 機率以 2～3 倍反彈。', [['奧義', 'gold'], ['變身', 'gold'], ['無敵', 'gold'], ['增傷', 'red'], ['減傷', 'green'], ['反彈', 'blue']], 'awaken',
        { formImage: { image: img('gunko_dark'), scale: .8 / .6, turns: 2, label: '黑轉支配' }, statUpAll: 2, healRatio: .5, damageMultTurns: 3, damageMultRange: [5, 20], invulnTurns: 2,
          gunkoAfter: { wait: 2, dr: .35, turns: 3, chance: .3, mult: [2, 3] }, bgCutin: { image: img('gunko_cutin'), ms: 4200, title: '黑轉支配', sub: '曼麥亞・軍子宮' }, noRestore: true }, true)
    ] };
  CHARACTERS.shamrock = { id: 'shamrock', name: '費加蘭德・夏姆洛克聖', title: '神之騎士團團長', types: ['格鬥'], scale: 1, worldScale: 1, battleScale: .65, ai: 'aggressive',
    image: img('shamrock'), avatar: img('shamrock_face'), ultimateBg: img('shamrock'), cardPos: '50% 10%', cardFocus: '50% 12%',
    maxHp: 1650, baseSpeed: 112, statScale: 1.05, role: '攻擊型',
    desc: '世界貴族「天龍人」，神之騎士團團長、前神之騎士團最高司令官五老星費加蘭德・賈林各聖的兒子。四皇「紅髮」的雙胞胎哥哥，配刀「塞博拉斯」。',
    skills: [
      /* v154：使用者 11/03「夏姆洛克要偏向攻擊型，而非生存型」——五招都改成以輸出為主 */
      S('霸王纏刃', 'attack', 10, 135, '纏上霸王色的強烈斬擊，必中、無視護盾；30% 機率使對手恐懼 1 回合，命中時 50% 機率清除對手的能力提升。', [['必中', 'red'], ['無視護盾', 'red'], ['恐懼', 'gold'], ['清除強化', 'blue']], 'slash',
        { sureHit: true, ignoreShield: true, fearChance: .3, fearTurns: 1, clearBuffsChance: .5 }),
      S('不死之身', 'support', 3, 0, '不死的肉體：恢復 25% 體力並解除自身的負面狀態；攻擊 +2，接下來 2 回合的下一次攻擊威力 ×1.6。', [['回復', 'green'], ['淨化', 'green'], ['強化', 'gold']], 'aura',
        { healRatio: .25, clearSelfDebuffs: true, selfBuffAtk: 2, nextAttackMult: 1.6, nextAttackMultTurns: 2 }),
      S('天龍人的威壓', 'attack', 6, 110, '天龍人的霸氣壓下對手，無視護盾；對手防禦 -2（3 回合）、攻擊 -1（3 回合），自身攻擊 +1。', [['無視護盾', 'red'], ['降防', 'blue'], ['降攻', 'blue'], ['強化', 'gold']], 'haki',
        { ignoreShield: true, enemyDefDownChance: [1, [2, 2], 3], enemyAtkDownChance: [[1, 1], 1, 3], selfBuffAtk: 1 }),
      S('雙生之影', 'attack', 6, 0, '紅髮的雙胞胎哥哥揮出連續斬擊 3～5 次；對手體力越低傷害越高（最多 2.5 倍），吸收造成傷害的 15% 回復體力。', [['連擊', 'red'], ['斬殺', 'red'], ['吸血', 'green']], 'slash',
        { multiHitNormal: [3, 5], perHitPower: 48, lowHpBonus: 2.5, lifestealRange: [.15, .15] }),
      S('地獄三頭犬', 'attack', 2, 0, '奧義。揮出配刀「塞博拉斯」，身後出現地獄三頭犬（3 回合）：強烈攻擊 3 次；三頭犬在場的每回合，夏姆洛克攻擊 +2，對手額外受到 500～1200 點傷害，20% 機率陷入恐懼。', [['奧義', 'gold'], ['召喚', 'gold'], ['連擊', 'red'], ['強化', 'gold'], ['恐懼', 'gold']], 'slash',
        { multiHitNormal: [3, 3], perHitPower: 80, cerberus: { turns: 3, regen: 0, statUp: 0, atkUp: 2, dmg: [500, 1200], fear: .2, image: img('shamrock_cerberus'), scale: 1.2 }, noRestore: true }, true)
    ] };
  ['gunko', 'shamrock'].forEach(id => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); CHAR_RARITY[id] = 'SSR';
    CHAR_OBTAIN[id] = { boss: 0, eventOnly: true, npc: '限定「神之騎士團」抽獎池（尚未開放）；目前只會在巨人篇劇情中以 BOSS 登場' }; });

  /* 巨人篇：「巨人們的認可」之後、前往冥界之前，插入兩場 BOSS 對決（第 7、8 步；舊存檔由 app.js chState 的 v152 轉換往後移） */
  const G = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'giant'), L = (w, t, x) => x ? [w, t, x] : [w, t];
  if (G && !G.steps.some(s => s.enemy === 'gunko')) {
    if (!G.npcs.some(n => n.id === 'gunko_n')) G.npcs.push({ id: 'gunko_n', name: '軍子', role: '神之騎士團', look: 'gunko', pos: [-192, -52], chat: ['……巨人族的村子，也該清理一下了。', '這是聖地的命令。'] });
    if (!G.npcs.some(n => n.id === 'shamrock_n')) G.npcs.push({ id: 'shamrock_n', name: '夏姆洛克', role: '神之騎士團團長', look: 'shamrock', pos: [6, 52], chat: ['……那張臉，你在想誰？', '我和那個男人，不一樣。'] });
    const g = G.steps.findIndex(s => s.type === 'goto'), at = g < 0 ? G.steps.length - 1 : g;
    G.steps.splice(at, 0,
      { type: 'duel', npc: 'gunko_n', enemy: 'gunko', bossDuel: true, title: '神之騎士團來襲', desc: '天空出現了巨大的箭頭標誌——神之騎士團的軍子降臨在陽界的西邊村。在她破壞村子之前擊敗她！', reward: 3,
        lines: [L(null, '天空突然裂開，一道巨大的箭頭標誌劃過西邊村的屋頂。', { fx: 'flash' }), L('gunko_n', '……巨人族、還有混進來的海賊。'), L('gunko_n', '我是神之騎士團的軍子。奉聖地之命，清除這座島上的「不穩定因素」。', { emo: '…' }), L('dorry', '葛基基基……想在艾爾巴夫撒野？小戰士，讓她看看我們的骨氣！')],
        after: [L('gunko_n', '……不可能……被這種人……'), L(null, '軍子化為一道箭矢消失在天空中。'), L('hajrudin', '神之騎士團……那傢伙不會是一個人來的。冥界的入口——快去！')] },
      { type: 'duel', npc: 'shamrock_n', enemy: 'shamrock', bossDuel: true, title: '神之騎士團團長', desc: '冥界入口的吊橋下，站著一個和紅髮長得一模一樣的男人——神之騎士團團長夏姆洛克。擊敗他，才能前往鎖住王子的鎖鏈。', reward: 4,
        lines: [L(null, '吊橋下的陰影裡，一個紅髮的男人慢慢轉過身。', { fx: 'shake' }), L('shamrock_n', '……你的眼神，像是看見了什麼不該看的東西。'), L('shamrock_n', '我是費加蘭德・夏姆洛克，神之騎士團團長。至於我那個弟弟——跟我無關。'), L('shamrock_n', '想見洛基？先過塞博拉斯這一關。', { emo: '💢' })],
        after: [L('shamrock_n', '……有意思。難怪那傢伙會把賭注押在你們這種人身上。'), L(null, '夏姆洛克收起配刀，身影消失在冥界的黑暗中。'), L(null, '吊橋另一端，傳來鎖鏈拖動的聲音……')] });
  }
})();

/* ==== 原 js/roster_v185.js ==== */
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

  CHARACTERS.reiju = { id: 'reiju', name: '文斯莫克·蕾玖', title: '毒粉紅', types: ['闇'], scale: 1, worldScale: 1, battleScale: .65, ai: 'control',
    image: img('reiju'), avatar: img('reiju_face'), ultimateBg: img('reiju'), cardPos: '50% 12%', cardFocus: '50% 15%',
    maxHp: 1400, baseSpeed: 118, statScale: 1.07 /* v194：1.0 → 1.07。tests/tier-sim.js 對全部 SR 各打 60 場：調整前平均勝率 36.9%（低於同稀有度 44～58% 的範圍），調整後 49.4% */, role: '控制型',
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

  CHARACTERS.robin_wano = { id: 'robin_wano', name: '妮可·羅賓（和之國）', title: '惡魔之子・鬼島之戰', types: ['自然'], scale: 1, worldScale: 1, battleScale: .65, ai: 'control',
    image: img('robin_wano'), avatar: img('robin_wano_face'), ultimateBg: img('robin_wano'), cardPos: '50% 8%', cardFocus: '50% 10%',
    maxHp: 1500, baseSpeed: 116, statScale: 1.3 /* v194：1.05 → 1.3。tests/tier-sim.js 對全部 SSR 各打 60 場：調整前平均勝率 16.0%，1.28＝46.7%、1.31＝52.0% */, role: '控制型',
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

/* ==== 原 js/viona_v187.js ==== */
/* v187 原創角色「賽博亞齊·維歐娜」（使用者 11/09 14:00）
   UR・初代女帝・攻擊控制型，只能從限定抽獎池「初代女帝」抽取（集滿碎片合成）。
   人人果實·幻獸種·維納斯型態，手持無上大快刀「神妃」，亞馬遜百合·九蛇島初代女帝，空白一百年中少數被記錄下來的傳說人物。
   立繪：原始 0.65（viona）；第 4 招「維納斯降臨」2 回合變成維納斯型態 0.95（viona_venus）；限定皮膚「無名女郎」0.55（viona_bunny，暫時無法獲得）。

   被動「女神之印」（存在維歐娜身上，最多 3 層）：
     ・每施放一招 +1 層（第 1～3 招說明裡的「附加一層」就是這一層，不會重複疊）。
     ・每層讓對手對維歐娜造成的傷害 -10%。
     ・v188 使用者 11/09：最多 3 層；滿 3 層必定觸發被動「臣服」→ 對手隨機一招的次數歸 0（BOSS 改為失去目前體力 20%），效果結束後印記歸零重新累積。
   狀態：
     魅惑（ABN.charm，2 回合）：施加時攻擊 -1、速度 -1；神妃對魅惑中的對手傷害 +40%。
     臣服（ABN.subdue，CC）：無法行動，施加時解除對手的能力提升與強化效果。
   技能自訂效果鍵：vioCharm、vioIgnoreDef、vioCharmBonus、vioSubdueStack、vioVenus、vioDot、vioFinal（下方實作）。
   特效：紫紅色系漸層（VFX 表）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const V = 202, img = n => `assets/chars/${n}.webp?v=${V}`, ui = n => `assets/ui/${n}.webp?v=${V}`;
  const B = () => (typeof battle !== 'undefined' && battle) || null;
  const L = m => { try { log(m); } catch (e) { } };
  const R = (a, b) => a + Math.random() * (b - a), pct = x => Math.round(x * 100);
  const onScreen = f => { const b = B(); return !!(b && f && (f === b.player || f === b.enemy)); };
  const sideOf = f => { const b = B(); return b && f === b.enemy ? 'R' : 'L'; };
  const say = (f, t) => { try { if (onScreen(f)) floatText(sideOf(f), t, 'status'); } catch (e) { } };
  const isBossT = t => { const b = B(); return !!(t && (t.voidImmune || (b && b.isBoss && t === b.enemy))); };
  const SZ0 = .55, SZV = 1.1; /* v209 使用者 11/13 21:44：原立繪 0.55、第四技能維納斯型態 1.1 */ /* v192 使用者 11/09 18:42：維納斯型態立繪 0.95；無名女郎 0.45（v200b） */

  /* ---------- 狀態 ---------- */
  if (typeof ABN !== 'undefined') {
    ABN.charm = { name: '魅惑', icon: '💗', desc: '被女帝的美貌迷住：無法行動，受到的傷害 +15～30%' }; /* v210 */ if (typeof CC_KEYS !== 'undefined' && !CC_KEYS.includes('charm')) CC_KEYS.push('charm');
    ABN.subdue = { name: '臣服', icon: '🙇', desc: '無法行動，所有強化效果被解除' };
    if (typeof CC_KEYS !== 'undefined' && !CC_KEYS.includes('subdue')) CC_KEYS.push('subdue');
  }

  /* ---------- 角色資料 ---------- */
  const S = (o) => Object.assign({ accuracy: 100, maxPP: o.pp, tags: [] }, o);
  const PASSIVE = '【被動・女神之印】每施放一招累積 1 層（最多 3 層），每層使對手對自己的傷害 -10%；不論疊幾次最多 3 層；滿 3 層時立刻觸發「臣服」：對手隨機一招的次數歸 0（BOSS 改為失去目前體力 20%），效果結束後印記歸零、重新累積。';
  CHARACTERS.viona = { id: 'viona', name: '賽博亞齊·維歐娜', title: '初代女帝', types: ['超能'], scale: 1, worldScale: 1, battleScale: SZ0, ai: 'control',
    image: img('viona'), avatar: img('viona_face'), ultimateBg: img('viona_venus'), cardPos: '50% 8%', cardFocus: '52% 10%',
    maxHp: 2150, baseSpeed: 124, statScale: 1.2, role: '攻擊控制型',
    desc: '本遊戲原創角色。亞馬遜百合·九蛇島的初代女帝，空白一百年中少數被記錄下來的傳說人物，擁有極高的智謀與強大的實力。吃下人人果實·幻獸種·維納斯型態，手持無上大快刀「神妃」。【定位】攻擊控制型：用「女神之印」削弱對手的傷害並讓對手臣服，魅惑與臣服控場，維納斯型態下以終焉·黃昏一擊定勝負。',
    passive: PASSIVE,
    skills: [
      S({ name: '垂憐', type: 'attack', power: 100, pp: 10, anima: 'snake', desc: '【範圍】敵方全體（後排同樣受到傷害）。造成 180% 攻擊傷害，附加 1 層女神之印。45% 機率使對手「魅惑」2 回合：攻擊 -1、速度 -1。',
        tags: [['全體', 'red'], ['魅惑', 'gold'], ['女神之印', 'gold']], effect: { randomMultiplierRange: [1.8, 1.8], splash: 1, vioCharm: .45 } }),
      S({ name: '神妃', type: 'attack', power: 100, pp: 8, anima: 'slash', desc: '【範圍】單體。無上大快刀「神妃」斬擊，造成 100～500% 傷害，無視 30% 防禦；對「魅惑」中的對手傷害再 +40%。附加 1 層女神之印。',
        tags: [['斬擊', 'red'], ['破防', 'red'], ['魅惑增傷', 'gold']], effect: { randomMultiplierRange: [1, 5], vioIgnoreDef: .3, vioCharmBonus: .4 } }),
      S({ name: '萬王俯首', type: 'support', power: 0, pp: 5, anima: 'awaken', desc: '【範圍】自身＋對手。全能力 +1，附加 1 層女神之印；每 1 層印記使對手有 25% 機率「臣服」1 回合（3 層＝75%）：無法行動，且能力提升與強化效果全部解除。',
        tags: [['強化', 'gold'], ['臣服', 'red'], ['女神之印', 'gold']], effect: { statUpAll: 1, vioSubdueStack: .25 } }),
      S({ name: '維納斯降臨', type: 'support', power: 0, pp: 3, anima: 'awaken', desc: '【範圍】自身＋對手。進入「維納斯型態」2 回合，女神之印直接疊滿 3 層（立刻觸發被動臣服，之後歸零重新累積）；下回合攻擊 +30%、2 回合受到的傷害 -10%；對手 2 回合每回合受到 100～1000 固定傷害；清除自身的負面狀態與能力下降。這一回合對手的攻擊無效，並 100% 反彈。',
        tags: [['變身', 'gold'], ['反彈', 'green'], ['淨化', 'green'], ['固定傷害', 'red']],
        effect: { vioVenus: { turns: 2 }, nextAttackMult: 1.3, nextAttackMultTurns: 1, damageReductionTurns: 2, damageReductionValue: .1, clearSelfDebuffs: true, reflectTurns: 1, reflectMultiplier: 1, vioDot: [100, 1000, 2] } }),
      S({ name: '終焉·黃昏', type: 'attack', power: 100, pp: 3 /* v202 使用者 11/12 19:32：使用次數 2 → 3 */, ultimate: true, anima: 'slash', desc: '奧義（無法用道具恢復次數）。【範圍】敵方全體。對手體力直接降到最大體力的 10%（BOSS 無效），再造成 520～1314% 傷害、無視 20～50% 防禦；每層女神之印最終傷害 +15%（最多 +45%）。45% 機率使對手「臣服」1 回合；隨機降低對手的技能共 5 次（BOSS 無效）。【維納斯型態下施放】追加一次 160% 的神罰傷害（無視 20% 減傷），並進入「自由」2 回合：不受任何控制與限制。施放後恢復自身最大體力 20%。',
        tags: [['奧義', 'gold'], ['斬殺', 'red'], ['全體', 'red'], ['臣服', 'red'], ['削次數', 'blue']], effect: { randomMultiplierRange: [5.2, 13.14], healRatio: .2, splash: 1, vioFinal: { sub: .45, pp: 5, venusMul: 1.6 }, noRestore: true } })
    ] };
  if (typeof CHARACTER_ORDER !== 'undefined' && !CHARACTER_ORDER.includes('viona')) CHARACTER_ORDER.push('viona');
  if (typeof CHAR_RARITY !== 'undefined') CHAR_RARITY.viona = 'UR+'; /* v189 使用者 11/09 改為 UR+ */
  if (typeof CHAR_OBTAIN !== 'undefined') CHAR_OBTAIN.viona = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, npc: '本遊戲原創角色・限定抽獎池「初代女帝」：集滿 300 碎片合成；碎片 100 片可兌換皮膚「無名女郎」（無法從一般召喚取得）' };
  if (typeof SKINS !== 'undefined') SKINS.viona_bunny = { char: 'viona', name: '無名女郎', image: img('viona_bunny'), avatar: img('viona_bunny_face'), battleScale: .45 /* v200b 使用者 11/12 17:01 指定 0.45 */, how: '限定召喚「初代女帝」：碎片 100 片兌換' };

  /* 限定抽獎池＋檔期 */
  if (typeof EVENT_POOLS !== 'undefined' && !EVENT_POOLS.some(p => p.id === 'venus_viona'))
    EVENT_POOLS.push({ id: 'venus_viona', tab: '初代女帝', series: '原創系列', name: '原創系列 初代女帝 限定活動', banner: ui('event_banner_viona'), need: 300,
      amount: [[20, .6], [30, .3], [50, .1]], pity: 120, newbieFree: 10, dailyFree: 3, bountyBonus: 2, tokenCost: 1,
      shards: [{ char: 'viona', rate: .02, icon: ui('shard_viona'), color: '#e04cff', skin: { key: 'viona_bunny', need: 100 } }] });
  if (typeof EVENT_CALENDAR !== 'undefined' && !EVENT_CALENDAR.some(c => c.id === 'venus_viona'))
    EVENT_CALENDAR.push({ id: 'venus_viona', start: '2026-11-11 00:00', end: '2026-12-13 00:00', label: '11～12 月限定', preview: '2026-11-09 00:00' }); /* v188：11/11～12/12，開放前顯示預告 */

  /* 結算畫面臉部位置 */
  window.addEventListener('DOMContentLoaded', () => { if (window.CHAR_FACE) Object.assign(CHAR_FACE, { 'assets/chars/viona.webp': [0.457, 0.085, 0.096], 'assets/chars/viona_venus.webp': [0.452, 0.272, 0.052], 'assets/chars/viona_bunny.webp': [0.579, 0.128, 0.118] }); });

  /* ---------- 戰鬥狀態 ---------- */
  const isV = f => !!(f && f.id === 'viona');
  const st = f => (f.__vio = f.__vio || { marks: 0, venus: 0, base: null });
  function chips(f) { const I = st(f); return `${I.marks ? `<span class="chip up" title="每層使對手對自己的傷害 -10%；滿 3 層觸發臣服後歸零">女神之印 ${'◆'.repeat(I.marks)}</span>` : ''}${I.venus > 0 ? `<span class="chip up" title="維納斯型態：終焉·黃昏追加神罰並進入自由">維納斯型態 ${I.venus}</span>` : ''}`; }
  function refresh(f) { try { if (onScreen(f) && typeof renderHUD === 'function') renderHUD(); } catch (e) { } }
  function setVenus(f, on) {
    const I = st(f);
    if (on) { if (!I.base) I.base = { image: f.image, avatar: f.avatar, title: f.title, visMul: f.visMul || 1 }; f.image = img('viona_venus'); f.avatar = img('viona_venus_face'); f.title = '維納斯型態'; f.visMul = SZV / (f.battleScale || SZ0); } /* 不論穿哪套皮膚，維納斯型態都是 8.5 */
    else if (I.base) { f.image = I.base.image; f.avatar = I.base.avatar; f.title = I.base.title; f.visMul = I.base.visMul; I.base = null; }
    if (!onScreen(f)) return; const S2 = sideOf(f), $$ = id => document.getElementById(id);
    try { if (typeof refreshFighterImage === 'function') refreshFighterImage(f); else { if ($$('bImg' + S2)) $$('bImg' + S2).src = f.image; if (typeof applyVisual === 'function') applyVisual(f); } } catch (e) { }
    try { if ($$('bTitle' + S2)) $$('bTitle' + S2).textContent = f.title; if ($$('bAv' + S2)) $$('bAv' + S2).src = f.avatar; if (S2 === 'L' && typeof renderTeam === 'function') renderTeam(); } catch (e) { }
  }
  function subdue(f, t, why) {
    if (!t || t.hp <= 0) return false;
    if (typeof inflict === 'function' && !inflict(t, 'subdue', 1)) return false;
    let n = 0; ['atk', 'def', 'spd'].forEach(k => { if (t.buffs[k] > 0) { n += t.buffs[k]; t.buffs[k] = 0; } });
    const T = t.status, gone = []; [['shield', '護盾'], ['damageReductionTurns', '減傷'], ['invuln', '無敵'], ['dodge', '閃避'], ['reflect', '反彈'], ['regen', '持續回復'], ['thornTurns', '荊棘'], ['nextAttackMultTurns', '增傷']].forEach(([k, nm]) => { if (T[k] > 0) { T[k] = 0; gone.push(nm); } });
    L(`🙇 ${t.name} 向女帝臣服${why ? `（${why}）` : ''}！${n || gone.length ? `能力提升與強化被解除：${[n ? `能力提升 ${n} 階` : '', ...gone].filter(Boolean).join('、')}` : ''}`); say(t, '臣服');
    return true;
  }
  function addMark(f, t) {
    const I = st(f); if (I.marks < 3) { I.marks++; L(`💜 女神之印 ${I.marks}/3（對手對 ${f.name} 的傷害 -${I.marks * 10}%）`); }
    if (I.marks >= 3) {
      if (t && t.hp > 0 && t !== f) {
        if (isBossT(t)) { const d = Math.max(1, Math.floor(t.hp * .2)); t.hp = Math.max(1, t.hp - d); try { showDamage(sideOf(t), d, '#e04cff'); } catch (e) { } L(`👑 女神之印滿 3 層・臣服：${t.name} 失去目前體力的 20%（${d}）`); }
        else { const K = (t.skills || []).filter(s => s && s.pp > 0); if (K.length) { const s = K[Math.floor(Math.random() * K.length)]; s.pp = 0; L(`👑 女神之印滿 3 層・臣服：${t.name} 的「${s.name}」次數歸 0`); } else L(`👑 女神之印滿 3 層・臣服：${t.name} 已經沒有可用的招式了`); }
        say(t, '臣服'); try { if (onScreen(t) && t === B().player && typeof renderSkills === 'function') renderSkills(); } catch (e) { }
      }
      I.marks = 0; L('💜 女神之印歸零，重新累積');
    }
    refresh(f);
  }
  /* 「無視防禦 x」：把對手防禦的減傷效果拿掉 x 比例 */
  function ignoreDef(t, x) { const f0 = (typeof defTake === 'function' ? defTake(t.buffs.def) : 1) * (1 - Math.min(.25, (t.def || 0) / 6000)); if (f0 >= 1) return 1; return (f0 + (1 - f0) * x) / f0; }

  /* ---------- 傷害 ---------- */
  if (typeof computeSkillOutcome === 'function') { const _cso = computeSkillOutcome;
    computeSkillOutcome = function (actor, target, skill) {
      const r = _cso.apply(this, arguments);
      try {
        const ef = (skill && skill.effect) || {};
        if (r && r.damage > 0 && isV(actor) && skill.type === 'attack' && !(r.meta && r.meta.execute)) {
          let m = 1;
          if (ef.vioIgnoreDef) m *= ignoreDef(target, ef.vioIgnoreDef);
          if (false && ef.vioCharmBonus && target.status && target.status.charm > 0) { m *= 1 + ef.vioCharmBonus; L(`💗 對魅惑中的 ${target.name} 傷害 +${pct(ef.vioCharmBonus)}%`); }
          if (ef.vioFinal && !isBossT(target) && !(target.status && target.status.reflect > 0)) { const cap = Math.max(1, Math.floor(target.maxHp * .1)); if (target.hp > cap) { r.meta = r.meta || {}; r.meta.__vioCut = target.hp - cap; L(`🌅 黃昏降臨：${target.name} 的體力先被壓到最大體力的 10%`); } }
          if (ef.vioFinal) { const ig = R(.2, .5), mk = st(actor).marks, mb = 1 + Math.min(.45, .15 * mk); m *= ignoreDef(target, ig) * mb; L(`🌅 終焉·黃昏：無視 ${pct(ig)}% 防禦${mk ? `，女神之印 ${mk} 層最終傷害 +${pct(mb - 1)}%` : ''}`);
            if (st(actor).venus > 0) { const ex = Math.floor(calcAttackDamage(actor, target, { type: 'attack', power: 100, effect: { forceMultiplier: ef.vioFinal.venusMul || 1.6 } }) * 1.2); r.damage += ex; r.meta = r.meta || {}; r.meta.__vioJudg = ex; } }
          if (m !== 1) r.damage = Math.floor(r.damage * m);
          if (r.meta && r.meta.__vioCut) r.damage += r.meta.__vioCut; /* 先壓到 10% 再打傷害：壓掉的體力併進這一擊 */
          if (r.meta && r.meta.__vioJudg) L(`⚖️ 維納斯的神罰：追加 ${r.meta.__vioJudg} 點傷害（無視 20% 減傷）`);
        }
        if (r && r.damage > 0 && isV(target) && target.__vio && target.__vio.marks > 0) r.damage = Math.max(1, Math.floor(r.damage * (1 - .1 * target.__vio.marks)));
      } catch (e) { console.warn('維歐娜傷害', e); }
      return r; }; }

  /* ---------- 技能效果 ---------- */
  if (typeof applySkillEffects === 'function') { const _ase = applySkillEffects;
    applySkillEffects = function (actor, target, skill, result) {
      const r = _ase.apply(this, arguments);
      try { if (isV(actor) && skill) { const ef = skill.effect || {}, I = st(actor), foe = target && target !== actor ? target : null;
        if (ef.vioCharm && foe && foe.hp > 0 && Math.random() < ef.vioCharm && typeof inflict === 'function' && inflict(foe, 'charm', 1)) { say(foe, '魅惑'); }
        if (ef.vioSubdueStack && foe) { const p = Math.min(1, ef.vioSubdueStack * (I.marks + 1)); if (Math.random() < p) subdue(actor, foe, `機率 ${pct(p)}%`); else L(`🙇 臣服沒有成功（機率 ${pct(p)}%）`); }
        if (ef.vioVenus) { if (typeof clearNegativeStages === 'function') clearNegativeStages(actor); I.venus = ef.vioVenus.turns; I.fresh = 1; if (!I.base) setVenus(actor, true); I.marks = 2; L(`🌸 ${actor.name} 化身維納斯型態（${I.venus} 回合）！女神之印直接疊到 3 層`); say(actor, '維納斯降臨'); }
        if (ef.vioDot && foe && foe.hp > 0) { foe.status.__vioDot = { t: ef.vioDot[2], a: ef.vioDot[0], b: ef.vioDot[1] }; L(`💜 ${foe.name} 接下來 ${ef.vioDot[2]} 回合每回合受到 ${ef.vioDot[0]}～${ef.vioDot[1]} 固定傷害`); }
        if (ef.vioFinal && foe) { const F = ef.vioFinal;
          if (foe.hp > 0 && Math.random() < F.sub) subdue(actor, foe, '終焉·黃昏');
          if (foe.hp > 0 && !isBossT(foe)) { let n = F.pp, cut = 0; for (let k = 0; k < 40 && n > 0; k++) { const K = foe.skills.filter(s => s && s.pp > 0); if (!K.length) break; const s = K[Math.floor(Math.random() * K.length)]; s.pp--; n--; cut++; } if (cut) L(`⏳ ${foe.name} 的技能次數共減少 ${cut} 次`); }
          if (I.venus > 0) { actor.status.__free = Math.max(actor.status.__free || 0, 2); actor.status.immune = Math.max(actor.status.immune || 0, 2); if (typeof clearAbnormal === 'function') clearAbnormal(actor); L(`🕊️ ${actor.name} 進入「自由」2 回合：不受任何控制與限制`); }
        }
        addMark(actor, foe);
      } } catch (e) { console.warn('維歐娜效果', e); }
      return r; }; }

  /* ---------- 回合結束：維納斯型態、魅惑、固定傷害 ---------- */
  if (typeof endTurnStatus === 'function') { const _ets = endTurnStatus;
    endTurnStatus = function (c) {
      const r = _ets.apply(this, arguments);
      try {
        /* v210：魅惑改為無法行動（CC_KEYS），在輪到出手時才減 1，這裡不再遞減 */
        const D = c && c.status && c.status.__vioDot; if (D && D.t > 0 && c.hp > 0) { const d = Math.round(R(D.a, D.b)); c.hp = Math.max(0, c.hp - d); D.t--; try { showDamage(sideOf(c), d, '#e04cff'); } catch (e) { } L(`💜 女神的刻印灼燒 ${c.name}：${d} 點固定傷害`); if (!D.t) c.status.__vioDot = null; }
        if (isV(c) && c.__vio && c.__vio.fresh) c.__vio.fresh = 0; /* 施放當回合不扣，維持之後完整 2 回合 */
        else if (isV(c) && c.__vio && c.__vio.venus > 0) { c.__vio.venus--; if (!c.__vio.venus) { setVenus(c, false); L(`🌸 ${c.name} 的維納斯型態結束了`); } }
      } catch (e) { console.warn('維歐娜回合', e); }
      return r; }; }
  if (typeof statusChips === 'function') { const _sc = statusChips; statusChips = function (c) { const h = _sc.apply(this, arguments); return isV(c) && c.__vio ? chips(c) + h : h; }; }
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { const r = _sb.apply(this, arguments); try { const b = B(); if (b) [b.enemy, ...(b.team || [])].forEach(f => { if (isV(f)) { f.__vio = null; warm(); } }); } catch (e) { } return r; }; }

  /* ---------- 特效：紫紅色系漸層 ---------- */
  const X = () => FXE.P, sl = ms => (typeof sleep === 'function' ? sleep(ms) : new Promise(res => setTimeout(res, ms)));
  /* v192 使用者 11/09 18:42：用使用者提供的素材（翅膀、白蛇、能量球、神妃、光暈螺旋）重做五招動畫。
     畫在戰場畫布（FXE）上：素材圖片 drawImage＋位移／旋轉／縮放／透明度曲線，搭配既有的爆炸、斬擊、光環。能量球是黑底圖，用加亮混合（lighter）去掉黑底。
     圖片尺寸都在 1000px 以下，畫布繪製不會產生大型圖層（iPhone 安全）。 */
  const PK = ['#ff4fd8', '#e04cff', '#a63cff', '#ffd1f5', '#ffffff'];
  const IMG = {}; ['wings', 'snake', 'orb', 'sword', 'aura'].forEach(k => { const i = new Image(); i.decoding = 'async'; i.src = `assets/fx/viona/${k}.webp?v=199`; IMG[k] = i; });
  const ready = i => i && i.complete && i.naturalWidth > 0;
  const PI = Math.PI, lerp = (a, b, q) => a + (b - a) * q, cl = q => Math.max(0, Math.min(1, q));
  const eOut = q => 1 - Math.pow(1 - cl(q), 3), eIn = q => Math.pow(cl(q), 2.2), fd = (q, a, b) => q < a ? q / a : q > b ? Math.max(0, (1 - q) / (1 - b)) : 1;
  const SWORD_ANG = Math.atan2(1238, -58); /* v199 新素材（直立的刀，303×1400）：握柄（.683,.114）指向刀尖（.492,.999），約 93° */
  const BLADE = 4.09; /* 刀身長度（握柄到刀尖）＝圖寬 × 4.09 */
  /* v193 使用者 11/09 18:59「很醜也很不符合邏輯，請重新設計」：
     ・尺寸一律以角色在畫面上的身高為單位（u），不再寫死像素：手機上不會整片糊住畫面。
     ・翅膀、白蛇「從背後長出來」：畫在角色圖的後面（插在角色 img 之前的 div），不再用加亮混合蓋在人身上。
     ・有實體的素材（翅膀、白蛇、神妃）用一般透明度；只有能量球、光暈螺旋用加亮。
     ・每招只講一件事：垂憐＝白蛇咬人；神妃＝刀現形→飛到對手頭上→一刀劈下；萬王俯首＝展翼→光螺旋從天壓下把對手壓跪；
       維納斯降臨＝光螺旋包住全身→展翼、白蛇盤上背→胸前能量球爆開；終焉·黃昏＝展翼→頭上集氣→能量球砸下→神妃從天插進地面。 */
  /* sp(圖, 參數)：x、y、w（寬）、s（縮放）、sy（垂直縮放）、a（透明度）、r（旋轉）可以是數字或 (進度q, 秒t) => 值；ax/ay＝錨點；fx＝水平鏡像；add＝加亮混合 */
  function sp(k, o) { const img = IMG[k]; if (typeof FXE === 'undefined') return;
    return FXE.add({ add: !!o.add, life: o.life || .8, draw(c, q, dt, t) { if (!ready(img)) return; const v = f => typeof f === 'function' ? f(q, t) : f;
      const s = v(o.s == null ? 1 : o.s), w = (o.w || 300) * s, h = w * img.naturalHeight / img.naturalWidth, a = v(o.a == null ? 1 : o.a);
      if (a <= 0 || w <= 1) return; c.globalAlpha = Math.min(1, a); c.translate(v(o.x), v(o.y)); c.rotate(v(o.r || 0)); if (o.fx) c.scale(-1, 1); if (o.sy != null) c.scale(1, v(o.sy));
      c.drawImage(img, -w * (o.ax == null ? .5 : o.ax), -h * (o.ay == null ? .5 : o.ay), w, h); } }); }
  const wait = ms => sl(ms / (window.BSPEED || 1));
  /* v194：維歐娜上場時先把五張特效素材解碼好（實測第一次放「萬王俯首」時，翅膀圖在出招當下才解碼，卡了約 0.3 秒） */
  let warmed = false; function warm() { movPre(); if (warmed) return; warmed = true; Object.values(IMG).forEach(i => { try { if (i.decode) i.decode().catch(() => { }); } catch (e) { } }); }
  /* v201b 使用者 11/12 19:24「是在戰鬥系統的背景圖改成播變身動畫，不是直接變螢幕」：影片放在戰鬥背景那一層（#bBg／#bGL 上面、角色與介面下面），
     雙方角色、血條、技能欄照常顯示；播完淡回原本的背景。
     v201 使用者 11/12 19:15：第 4 招「維納斯降臨」先播放變身影片（assets/video/viona_venus.mp4／.webm，4 秒、1280×720、約 1.5MB），
     播完再接原本立繪上的技能特效、化身維納斯型態。
     - 有維歐娜的戰鬥一開始就先下載；直向手機用 object-fit:cover 裁左右，人物在正中間不受影響。
     - 聲音跟著設定裡的音效音量／靜音；背景音樂播放期間降到 25%；瀏覽器不允許有聲自動播放時改成靜音播放；影片載入失敗直接跳過。
     - 戰鬥倍速 ×2 以上時影片也加速（最多 2 倍）。 */
  const MOV = 'assets/video/viona_venus.mp4?v=7e2362bd', POSTER = 'assets/video/viona_venus_poster.webp?v=d652ca04'; let movEl = null;
  function movPre() { if (movEl) return movEl; const v = document.createElement('video'); v.preload = 'auto'; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.poster = POSTER; v.muted = true; /* 先用 mp4（iPhone、Safari），不支援 H.264 的瀏覽器改用 webm */
    [[MOV, 'video/mp4'], [MOV.replace('.mp4', '.webm'), 'video/webm']].forEach(([src, type]) => { const so = document.createElement('source'); so.src = src; so.type = type; v.appendChild(so); });
    if (!document.getElementById('vioMovCss')) { const c = document.createElement('style'); c.id = 'vioMovCss';
      c.textContent = '#battleScreen .vio-movbox{position:absolute;inset:0;z-index:0;opacity:0;transition:opacity .35s;overflow:hidden;pointer-events:none;background:#12061c}#battleScreen .vio-movbox.in{opacity:1}#battleScreen .vio-movbox.out{opacity:0;transition:opacity .5s}.vio-movbox video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.82) saturate(1.05)}';
      document.head.appendChild(c); }
    try { v.load(); } catch (e) { } return (movEl = v); }
  const duck = k => { try { if (window.MUSIC && MUSIC.duck) MUSIC.duck(k); } catch (e) { } };
  function movie() { return new Promise(res => { const bg = document.getElementById('bBg'); if (!bg) return res();
    const v = movPre(), box = document.createElement('div'); box.className = 'vio-movbox'; box.appendChild(v); const gl = document.getElementById('bGL'); ((gl && gl.parentNode === bg.parentNode) ? gl : bg).insertAdjacentElement('afterend', box);
    let done = false; const end = () => { if (done) return; done = true; duck(1); box.classList.add('out'); res(); setTimeout(() => { try { v.pause(); } catch (e) { } box.remove(); }, 520); }; /* 背景開始淡回時就接立繪特效 */
    const P = (window.AUDIO && AUDIO.pref) || {}; v.muted = !!P.muted; try { v.volume = Math.max(0, Math.min(1, P.sfx == null ? .8 : P.sfx)); } catch (e) { }
    try { v.currentTime = 0; } catch (e) { } const rate = Math.max(1, Math.min(2, window.BSPEED || 1)); try { v.playbackRate = rate; } catch (e) { }
    v.onended = end; const lastSrc = v.querySelector('source:last-child'); if (lastSrc) lastSrc.onerror = end; v.onerror = end; setTimeout(end, 4000 / rate + 3000);
    duck(.25); const p = v.play(); if (p && p.catch) p.catch(() => { if (done) return; v.muted = true; const q = v.play(); if (q && q.catch) q.catch(end); });
    requestAnimationFrame(() => box.classList.add('in')); }); }
  /* fw：用特效畫布的時間等待（不是牆上時鐘）。手機掉幀時畫布時間會變慢，用它排程才不會「刀還沒劈下、刀光先出來」。分頁在背景（畫布停止）時，最多等到原本時間的 3 倍再加 1 秒就放行。 */
  const fw = ms => typeof FXE === 'undefined' ? wait(ms) : new Promise(res => { let done = false; const ok = () => { if (!done) { done = true; res(); } };
    const e = FXE.add({ life: 99, draw(c, q, dt, t) { if (t * 1000 >= ms) { e.t = 99; ok(); } } }); setTimeout(ok, ms * 3 / (window.BSPEED || 1) + 1000); });
  const $$ = id => document.getElementById(id);
  /* 角色在戰場上的實際範圍（戰場座標）：x 中線、top 頭頂、bot 腳底、h 身高、y 身體中心 */
  function pt(side) { const f = $$('bF' + side), img = $$('bImg' + side);
    const sc = parseFloat(getComputedStyle(f).getPropertyValue('--sc')) || 1, h = Math.max(60, img.offsetHeight * sc), bot = f.offsetTop + img.offsetTop + img.offsetHeight;
    return { x: f.offsetLeft + img.offsetLeft + img.offsetWidth / 2 + (window.__camTx ? __camTx(side) : 0), bot, top: bot - h, h, y: bot - h * .5 }; } /* v195：加上鏡頭取景的左右位移（js/cam_v173.js） */
  /* back(角色, 圖, 參數)：畫在角色「身後」的素材（DOM，插在角色圖之前），跟著角色一起移動。kf＝Web Animations 關鍵影格 */
  function back(side, k, o) { const f = $$('bF' + side), img = $$('bImg' + side), I = IMG[k]; if (!f || !img || !ready(I)) return;
    const w = o.w, h = w * I.naturalHeight / I.naturalWidth, ax = o.ax == null ? .5 : o.ax, ay = o.ay == null ? .5 : o.ay, el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${o.x - (window.__camTx ? __camTx(side) : 0) - f.offsetLeft - w * ax}px;top:${o.y - f.offsetTop - h * ay}px;width:${w}px;height:${h}px;background:url("${I.src}") center/100% 100% no-repeat;pointer-events:none;transform-origin:${ax * 100}% ${ay * 100}%;opacity:0`;
    f.insertBefore(el, img); const dur = o.dur / (window.BSPEED || 1);
    try { el.animate(o.kf, { duration: dur, easing: o.ease || 'linear', fill: 'forwards' }); } catch (e) { }
    setTimeout(() => el.remove(), dur + 60); return el; }
  const M = d => d < 0 ? ' scaleX(-1)' : '';
  /* v221：白蛇從肩後盤上、蛇頭朝向對手（畫在特效畫布，不會被立繪擋住）：先從下方竄起放大 → 停住輕輕擺動 → 淡出 */
  function snakeUp(f, d, u, life, ox, oy, wk) { const x0 = f.x - d * u * ox, y0 = f.top + u * oy;
    sp('snake', { life, w: u * wk, fx: d < 0, x: (q, t) => x0 + Math.sin(t * 2.2) * u * .015, y: (q, t) => y0 + (1 - eOut(Math.min(1, t / .45))) * u * .35 - Math.sin(t * 3) * u * .02,
      s: (q, t) => .55 + .45 * eOut(Math.min(1, t / .45)), r: (q, t) => (1 - eOut(Math.min(1, t / .45))) * -.14 * d + Math.sin(t * 2.4) * .02, a: (q, t) => Math.min(1, t / .25) * (q > .85 ? (1 - q) / .15 : 1) });
    sp('snake', { add: true, life, w: u * wk * 1.04, fx: d < 0, x: x0, y: (q, t) => y0 + (1 - eOut(Math.min(1, t / .45))) * u * .35, s: (q, t) => .55 + .45 * eOut(Math.min(1, t / .45)), a: (q, t) => .35 * Math.min(1, t / .25) * (q > .7 ? Math.max(0, (1 - q) / .3) : 1) }); }
  /* 翅膀從背後展開：先收攏（窄、矮）→ 一口氣張開略過頭 → 回到原尺寸停住 → 淡出 */
  const wingsKF = (hold) => [{ opacity: 0, transform: 'scale(.12,.55)', easing: 'cubic-bezier(.2,.9,.3,1.2)' }, { opacity: 1, transform: 'scale(1.06,1.03)', offset: .22 }, { opacity: 1, transform: 'scale(1,1)', offset: .3 },
    { opacity: 1, transform: 'scale(1.02,1.02)', offset: hold }, { opacity: 0, transform: 'scale(1.1,1.06)' }];
  const boom = (x, y, r) => { X().burst(x, y, { r, color: '#e04cff', n: 22 }); X().ring(x, y, { r1: r * 1.6, color: '#ff4fd8', w: 8, life: .4 }); X().particles({ x, y, n: 24, spd: [r * 1.5, r * 4], life: [.35, .7], size: [2, 6], colors: PK, shape: 'spark', add: true, g: 140 }); };
  const orbBurst = (x, y, w) => sp('orb', { add: true, x, y, w, life: .45, s: q => .4 + 1.1 * eOut(q), a: q => (1 - q) * .9, r: (q, t) => t * 3 });
  /* 地面上的紫色封印圈（壓跪用）：扁橢圓，從中心張開後停住、淡出 */
  const seal = (x, y, r, life) => FXE.add({ add: true, life, draw(c, q) { const k = eOut(q * 3), a = fd(q, .1, .7); c.globalAlpha = a; c.translate(x, y); c.scale(1, .28);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r * k); g.addColorStop(0, 'rgba(166,60,255,.55)'); g.addColorStop(.75, 'rgba(224,76,255,.25)'); g.addColorStop(1, 'rgba(255,79,216,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * k, 0, TAU2); c.fill();
    c.strokeStyle = '#ff9cf5'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, r * k, 0, TAU2); c.stroke(); c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r * k * .72, 0, TAU2); c.stroke(); } });
  const TAU2 = PI * 2;
  /* 神妃：以握柄為支點畫刀；ang＝刀尖指向的角度 */
  const sword = (L, o) => sp('sword', Object.assign({ w: L / BLADE, ax: .683, ay: .114 }, o, o.flipY ? { sy: -1, r: (q, t) => o.ang(q, t) - SWORD_ANG_F } : { r: (q, t) => o.ang(q, t) - SWORD_ANG }));
  /* v204 使用者 11/12 21:23「神妃技能特效的刀需要上下鏡射」：flipY＝刀圖上下翻轉（刀尖方向不變，刀刃與護手換到另一側） */
  const SWORD_ANG_F = Math.atan2(-1238, -58);
  /* v202 終焉·黃昏用的小工具 */
  function visTop() { try { const Ar = $$('bArena'), r = Ar.getBoundingClientRect(), k = r.height / (Ar.offsetHeight || 1), tb = document.querySelector('#battleScreen .b-top'); return ((tb ? tb.getBoundingClientRect().bottom : r.top) - r.top) / (k || 1); } catch (e) { return 0; } }
  /* 黃昏天空：放在戰場背景那一層（角色與介面下面），紫黑天頂→緋紅地平線＋一輪巨大的落日，結束時淡回原背景 */
  function duskSky(ms) { const bg = $$('bBg'); if (!bg) return; const el = document.createElement('div'), dur = ms / (window.BSPEED || 1);
    el.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0;background:radial-gradient(60% 46% at 62% 70%,rgba(255,170,120,.85) 0,rgba(255,96,140,.55) 26%,rgba(170,40,140,.25) 48%,transparent 62%),radial-gradient(22% 30% at 62% 72%,rgba(255,236,200,.95) 0,rgba(255,180,140,.6) 55%,transparent 100%),linear-gradient(180deg,#0c0418 0%,#2a0a3a 34%,#7a1e5a 62%,#d8566a 80%,#3a0e2a 100%)';
    const gl = $$('bGL'); ((gl && gl.parentNode === bg.parentNode) ? gl : bg).insertAdjacentElement('afterend', el);
    try { el.animate([{ opacity: 0 }, { opacity: .96, offset: .1 }, { opacity: .96, offset: .86 }, { opacity: 0 }], { duration: dur, fill: 'forwards' }); } catch (e) { }
    setTimeout(() => el.remove(), dur + 80); }
  /* 神紋魔法陣：兩圈＋六芒星＋刻度，旋轉；flat＝壓扁（地面上） */
  const sigil = (x, y, r, o) => FXE.add({ add: true, life: o.life || 1.2, draw(c, q, dt, t) { const k = eOut(Math.min(1, t / .35)), a = fd(q, .08, .78); if (a <= 0) return;
    c.globalAlpha = a; c.translate(x, y); c.scale(1, o.flat || 1); c.rotate(t * (o.spin || 1)); const R0 = r * k, col = o.color || '#ff9cf5';
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R0); g.addColorStop(0, 'rgba(255,79,216,.35)'); g.addColorStop(.7, 'rgba(166,60,255,.18)'); g.addColorStop(1, 'rgba(166,60,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R0, 0, TAU2); c.fill();
    c.strokeStyle = col; c.shadowColor = '#ff4fd8'; c.shadowBlur = 12; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, R0, 0, TAU2); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R0 * .86, 0, TAU2); c.stroke();
    c.beginPath(); for (let i = 0; i < 48; i++) { const an = i / 48 * TAU2, l = i % 4 ? .04 : .09; c.moveTo(Math.cos(an) * R0 * .86, Math.sin(an) * R0 * .86); c.lineTo(Math.cos(an) * R0 * (.86 - l), Math.sin(an) * R0 * (.86 - l)); } c.stroke();
    c.lineWidth = 2.5; [0, PI].forEach(o2 => { c.beginPath(); for (let i = 0; i <= 3; i++) { const an = o2 + i / 3 * TAU2 - PI / 2; const px = Math.cos(an) * R0 * .7, py = Math.sin(an) * R0 * .7; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); });
    c.beginPath(); c.arc(0, 0, R0 * .3, 0, TAU2); c.stroke(); c.shadowBlur = 0; } });
  /* 光點從四周螺旋吸進中心 */
  const converge = (x, y, R, life, n) => { const P = []; for (let i = 0; i < n; i++) P.push({ a: Math.random() * TAU2, r: R * (.6 + Math.random() * .6), d: Math.random() * .5, s: 1.5 + Math.random() * 2.5, c: PK[i % PK.length] });
    return FXE.add({ add: true, life, draw(c, q, dt, t) { P.forEach(p => { const k = Math.max(0, Math.min(1, (q - p.d * .6) / .55)); if (k <= 0 || k >= 1) return; const rr = p.r * (1 - eIn(k)), an = p.a + k * 2.4;
      c.globalAlpha = Math.sin(k * PI); c.fillStyle = p.c; c.beginPath(); c.arc(x + Math.cos(an) * rr, y + Math.sin(an) * rr * .8, p.s, 0, TAU2); c.fill(); }); } }); };
  /* 黃昏刀光：一道從施放者那側橫掃整個畫面的寬弧光 */
  const duskBlade = (f, e, d) => { const W = Math.abs(e.x - f.x) + e.h * 2.4, cx = (f.x + e.x) / 2 + d * e.h * .3, cy = e.y - e.h * .05;
    return FXE.add({ add: true, life: .55, draw(c, q) { const k = eOut(Math.min(1, q / .45)), a = q < .45 ? 1 : 1 - (q - .45) / .55; c.globalAlpha = a; c.translate(cx, cy); c.rotate(d * -.1); if (d < 0) c.scale(-1, 1);
      const x0 = -W / 2, x1 = x0 + W * k, g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(255,120,170,0)'); g.addColorStop(.7, 'rgba(255,150,200,.75)'); g.addColorStop(.97, '#ffffff'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(x0, 0); c.quadraticCurveTo((x0 + x1) / 2, -e.h * .16, x1, -e.h * .02); c.quadraticCurveTo((x0 + x1) / 2, e.h * .1, x0, 0); c.fill(); } }); };
  const VFX = {
    /* ① 垂憐：白蛇從女帝背後探出頭 → 張口竄向對手 → 一口咬住（魅惑的粉紅光炸開） */
    '垂憐': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('dark'); X().tint('#2a0530', 1.1, .28);
      X().ring(f.x, f.bot - 4, { r1: u * .45, flat: .25, color: '#e04cff', w: 6, life: .5 });
      back(A.S, 'snake', { x: f.x - d * u * .12, y: f.top + u * .3, w: u * 1.05, dur: 520,
        kf: [{ opacity: 0, transform: 'translate(0,35%) scale(.55)' + M(d) }, { opacity: 1, transform: 'translate(0,0) scale(1)' + M(d), offset: .65 }, { opacity: 0, transform: `translate(${d * 12}%,-4%) scale(1.04)` + M(d) }] });
      await fw(430); SFX.play('whoosh');
      const x0 = f.x + d * u * .25, y0 = f.top + u * .3, x1 = e.x - d * E * .08, y1 = e.y - E * .12, ang = Math.atan2(y1 - y0, x1 - x0);
      sp('snake', { life: .62, w: u * 1.25, fx: d < 0, ax: .93, ay: .2, x: (q, t) => lerp(x0, x1, eIn(t / .34)), y: (q, t) => lerp(y0, y1, eIn(t / .34)) - Math.sin(cl(t / .34) * PI) * u * .12,
        r: (q, t) => (d < 0 ? ang - PI : ang) + (t > .34 ? Math.sin(t * 60) * .04 : 0), a: (q, t) => t < .06 ? t / .06 : t > .5 ? Math.max(0, (.62 - t) / .12) : 1 });
      await fw(340); SFX.play('explode');
      X().slash(e.x, e.y - E * .12, { a: -2.2, span: 1.2, r: E * .3, w: E * .05, color: '#ffd1f5', life: .22 }); X().slash(e.x, e.y - E * .12, { a: .9, span: 1.2, r: E * .3, w: E * .05, color: '#ffd1f5', life: .22 });
      orbBurst(e.x, e.y - E * .1, E * .9); X().ring(e.x, e.y, { r1: E * .6, color: '#ff4fd8', w: 8, life: .45 });
      X().particles({ x: e.x, y: e.y - E * .1, n: 18, spd: [E * .6, E * 1.6], life: [.4, .8], size: [3, 7], colors: PK, shape: 'spark', add: true, g: -60 });
      moveFighter(A.T, 'recoil'); shake(); await fw(200); },
    /* ② 神妃：無上大快刀在女帝身前現形（刀尖朝上）→ 飛到對手頭頂舉刀 → 一刀斜劈而下 → 刀光爆開 */
    '神妃': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('whoosh');
      const L = E * 1.2, P0 = { x: f.x + d * u * .32, y: f.top + u * .05 }, Pv = { x: e.x - d * E * .4, y: e.y - E * .6 };
      const mir = a => d > 0 ? a : PI - a, th0 = -PI / 2 - .75, th1 = .5;
      const ang = (q, t) => mir(t < .3 ? -PI / 2 : t < .5 ? lerp(-PI / 2, th0, eOut((t - .3) / .2)) : lerp(th0, th1, eIn((t - .5) / .15)));
      sword(L, { life: 1, x: (q, t) => t < .3 ? P0.x : lerp(P0.x, Pv.x, eOut((t - .3) / .2)), y: (q, t) => t < .3 ? P0.y - u * .05 * t / .3 : lerp(P0.y - u * .05, Pv.y, eOut((t - .3) / .2)),
        s: (q, t) => t < .3 ? .6 + .4 * eOut(t / .3) : 1, a: (q, t) => t < .12 ? t / .12 : t > .82 ? Math.max(0, (1 - t) / .18) : 1, ang, flipY: true });
      X().burst(P0.x, P0.y, { r: u * .25, color: '#e04cff', n: 14 }); X().ring(P0.x, P0.y, { r1: u * .4, color: '#ffd1f5', w: 6, life: .4 });
      await fw(500); SFX.play('whoosh');
      X().slash(Pv.x, Pv.y, { a: mir(th0), span: th1 - th0, ccw: d < 0, r: L * .95, w: E * .14, color: '#a63cff', life: .32 });
      X().slash(Pv.x, Pv.y, { a: mir(th0), span: th1 - th0, ccw: d < 0, r: L * .95, w: E * .06, color: '#ffd1f5', life: .26 });
      await fw(160); SFX.play('explode'); boom(e.x, e.y, E * .35); X().rays(e.x, e.y, { r: E * .8, n: 12, wid: 10, c1: 'rgba(255,79,216,.6)', life: .5 }); X().flash('#ffd1f5', .2, .12);
      moveFighter(A.T, 'recoil'); shake(); await fw(260); },
    /* ③ 萬王俯首：背後展開光翼、腳下升起紫光 → 光螺旋從對手頭頂壓下、地面浮出封印圈 → 對手被壓得一沉 */
    '萬王俯首': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('buff'); X().tint('#1a0422', 1.5, .45);
      back(A.S, 'wings', { x: f.x, y: f.top + u * .34, w: u * 2.1, dur: 1450, kf: wingsKF(.82) });
      sp('aura', { add: true, life: .9, x: f.x, y: f.bot, ay: 1, w: u * .7, sy: q => .3 + .8 * eOut(q * 1.6), a: q => .5 * fd(q, .2, .6) });
      await fw(480); seal(e.x, e.bot, E * .8, 1);
      sp('aura', { add: true, life: .7, x: e.x, ay: 1, w: E * .85, y: (q, t) => lerp(e.top - E * .35, e.bot, eIn(t / .32)), sy: (q, t) => t < .32 ? 1 : lerp(1, .22, eOut((t - .32) / .2)),
        a: (q, t) => t < .08 ? t / .08 : t > .45 ? Math.max(0, (.7 - t) / .25) : .85 });
      X().particles({ x: e.x, y: e.top - E * .4, jx: E * .4, n: 16, ang: [PI / 2 - .05, PI / 2 + .05], spd: [E * 3, E * 4.5], life: [.2, .3], size: [2, 4], colors: PK, shape: 'spark', add: true });
      await fw(320); SFX.play('explode');
      X().ring(e.x, e.bot, { r1: E * 1.2, flat: .25, color: '#ff4fd8', w: 10, life: .5 }); X().ring(e.x, e.bot, { r1: E * .8, flat: .25, color: '#ffd1f5', w: 6, life: .4 });
      X().particles({ x: e.x, y: e.bot, jx: E * .3, n: 22, ang: [PI + .15, TAU2 - .15], spd: [E * .8, E * 2], life: [.3, .6], size: [2, 6], colors: ['#a63cff', '#e04cff', '#ffd1f5'], shape: 'spark', add: true, g: 300 });
      moveFighter(A.T, 'stomp'); shake(); await fw(380); },
    /* ④ 維納斯降臨：腳下光螺旋升起包住全身 → 背後雙翼展開、白蛇盤上背 → 胸前能量球凝聚後爆開 → 化身維納斯 */
    '維納斯降臨': async A => { await movie(); const f = A.f, d = A.d, u = f.h; SFX.play('ult'); X().tint('#2a0530', 2, .5);
      X().ring(f.x, f.bot - 4, { r1: u * .6, flat: .25, color: '#e04cff', w: 8, life: .7 });
      sp('aura', { add: true, life: 1.5, x: f.x, y: f.bot + u * .04, ay: 1, w: u * .95, sy: q => .15 + 1.05 * eOut(q * 1.6), a: q => .6 * fd(q, .15, .75), r: (q, t) => Math.sin(t * 3) * .03 });
      await fw(220);
      back(A.S, 'wings', { x: f.x, y: f.top + u * .32, w: u * 2.4, dur: 1500, kf: wingsKF(.85) });
      /* v224：使用者 11/14 19:53 第四、第五招不要出現白蛇立繪 */
      moveFighter(A.S, 'float');
      await fw(560);
      sp('orb', { add: true, life: .5, x: f.x, y: f.top + u * .38, w: u * .7, s: q => .15 + .85 * eOut(q), a: q => fd(q, .2, .9), r: (q, t) => t * 4 });
      await fw(480); SFX.play('explode');
      orbBurst(f.x, f.top + u * .38, u * 1.2); X().pillar(f.x, f.bot, { w: u * .1, color: '#ff4fd8', life: .6 });
      X().rays(f.x, f.top + u * .38, { r: u * .8, n: 12, wid: 10, c1: 'rgba(255,209,245,.6)', life: .6 }); X().flash('#ffd1f5', .2, .18); shake(); await fw(300); },
    /* ⑤ 終焉·黃昏（v202 使用者 11/12 19:32「已經很帥了，但我想更帥」重新編排，約 4.3 秒）：
       ① 黃昏降臨：戰場背景換成黃昏天空（紫黑天頂→緋紅地平線，背後一輪巨大的落日），維歐娜腳下展開旋轉的神紋魔法陣，雙翼與白蛇從背後展開
       ② 集氣：光點從四周螺旋吸進頭頂，三道光環收縮，能量球越來越大
       ③ 三連星：能量球分裂成三顆，依序轟向對手（每顆都有爆炸與受擊）
       ④ 天罰：對手頭頂裂開一個巨大的神紋陣，神妃帶著三道殘影從天插下 → 光柱、三重衝擊波、地面龜裂、碎石噴飛
       ⑤ 終焉：十字斬＋一道橫掃全畫面的黃昏刀光，花瓣飄落，天空淡回原本的背景 */
    '終焉·黃昏': async A => { const f = A.f, e = A.t, d = A.d, u = f.h, E = e.h; SFX.play('ult'); duskSky(4300);
      X().tint('#12001a', 1.2, .35);
      sigil(f.x, f.bot - 2, u * .95, { life: 3.2, flat: .3, spin: .9 * d });
      back(A.S, 'wings', { x: f.x, y: f.top + u * .32, w: Math.min(u * 2.8, Math.abs(e.x - f.x) * 1.5), dur: 3300, kf: wingsKF(.9) }); /* 直向手機兩人很近：翅膀不蓋住對手 */
      moveFighter(A.S, 'float');
      /* ② 集氣 */
      const O = { x: f.x + d * u * .04, y: f.top - u * .26 };
      converge(O.x, O.y, u * 1.4, 1.0, 70);
      for (let k = 0; k < 3; k++) setTimeout(() => X().ring(O.x, O.y, { r0: u * (.9 - k * .1), r1: u * .08, color: k % 2 ? '#ffd1f5' : '#e04cff', w: 5, life: .45 }), (180 + k * 260) / (window.BSPEED || 1));
      sp('orb', { add: true, life: 1.2, x: O.x, y: O.y, w: u * 1.05, s: q => .1 + .9 * eOut(q * 1.15) + Math.sin(q * 40) * .02 * q, a: q => Math.min(1, q * 4) * (q > .92 ? (1 - q) / .08 : 1), r: (q, t) => t * 5 });
      X().glow(O.x, O.y, { color: '#ff4fd8', r: u * .6, life: 1.2, hold: true });
      await fw(1000); SFX.play('zap'); X().flash('#ffd1f5', .12, .12);
      /* ③ 三連星 */
      for (let k = 0; k < 3; k++) { const oy = O.y + (k - 1) * u * .22, ox = O.x - d * u * (.1 + k * .05), tx = e.x + (k - 1) * E * .12, ty = e.y - E * (.18 - k * .12);
        sp('orb', { add: true, life: .28, x: q => lerp(ox, tx, eIn(q)), y: q => lerp(oy, ty, eIn(q)) - Math.sin(q * PI) * u * (k - 1) * .25, w: u * .55, s: q => lerp(1, E / u * 1.1, q), r: (q, t) => t * 9 });
        SFX.play('whoosh'); await fw(260); SFX.play('explode'); orbBurst(tx, ty, E * 1.1); boom(tx, ty, E * .32); moveFighter(A.T, 'recoil'); if (k === 2) shake();
        await fw(110); }
      /* ④ 天罰 */
      const skyY = Math.max(visTop() + E * .1, e.top - E * .55);
      sigil(e.x, skyY, E * .85, { life: 1.4, flat: .32, spin: -1.4, color: '#ffd1f5' });
      X().rays(e.x, skyY, { r: E * 1.1, n: 14, wid: 8, c1: 'rgba(255,209,245,.45)', life: .9 });
      await fw(320); SFX.play('whoosh');
      const L = E * 1.6, yEnd = e.bot + E * .04 - L, yStart = skyY - L * .9;
      [.45, .3, .16].forEach((ga, gi) => sword(L, { add: true, life: .55, x: e.x, y: (q, t) => lerp(yStart, yEnd, eIn(Math.max(0, t - (gi + 1) * .035) / .22)), ang: () => PI / 2, a: (q, t) => (t < .25 ? ga : ga * Math.max(0, 1 - (t - .25) / .2)) }));
      sword(L, { life: 1.25, x: e.x, y: (q, t) => lerp(yStart, yEnd, eIn(t / .22)), ang: () => PI / 2, a: (q, t) => t > 1 ? Math.max(0, (1.25 - t) / .25) : 1 });
      sword(L, { add: true, life: 1.25, x: e.x, y: (q, t) => lerp(yStart, yEnd, eIn(t / .22)), ang: () => PI / 2, a: (q, t) => t < .22 ? .5 : Math.max(0, .5 - (t - .22) * 1.4) });
      await fw(220); SFX.play('explode'); SFX.play('heavy');
      X().pillar(e.x, e.bot, { w: E * .2, color: '#ff4fd8', life: .8 }); X().pillar(e.x, e.bot, { w: E * .08, color: '#ffffff', life: .5 });
      [1.2, 1.8, 2.5].forEach((r, k) => setTimeout(() => X().ring(e.x, e.bot, { r1: E * r, flat: .25, color: k === 1 ? '#a63cff' : '#ffd1f5', w: 14 - k * 3, life: .55 + k * .1 }), k * 90 / (window.BSPEED || 1)));
      try { X().cracks(e.x, e.bot - 2, { n: 12, len: E * 1.1 }); } catch (er) { }
      X().particles({ x: e.x, y: e.bot, jx: E * .25, n: 34, ang: [PI + .15, TAU2 - .15], spd: [E * 1.2, E * 3], life: [.45, .9], size: [3, 8], colors: PK, shape: 'spark', add: true, g: 520 });
      X().particles({ x: e.x, y: e.bot, jx: E * .3, n: 16, ang: [PI + .3, TAU2 - .3], spd: [E * .8, E * 1.8], life: [.6, 1], size: [5, 10], colors: ['#3a1a40', '#5a2a5a', '#2a1030'], shape: 'shard', g: 900 });
      X().flash('#ffffff', .22, .28); moveFighter(A.T, 'recoil'); shake();
      await fw(260); shake();
      /* ⑤ 終焉 */
      X().slash(e.x, e.y, { a: -2.4, span: 1.7, r: E * .62, w: E * .09, color: '#ff4fd8', life: .3 });
      await fw(90); X().slash(e.x, e.y, { a: -.7, span: 1.7, r: E * .62, w: E * .09, color: '#a63cff', life: .3, ccw: true });
      await fw(140); SFX.play('slash'); duskBlade(f, e, d);
      X().particles({ x: e.x, y: visTop() + 4, jx: E * 1.6, n: 30, ang: [PI / 2 - .4, PI / 2 + .4], spd: [40, 120], life: [1.2, 1.8], size: [6, 10], colors: ['#ff9cf5', '#ffd1f5', '#e04cff'], shape: 'petal', g: 60 });
      X().flash('#ffd1f5', .2, .22); moveFighter(A.T, 'recoil');
      await fw(520); }
  };
  if (typeof playChoreo === 'function') { const _pc = playChoreo;
    window.playChoreo = playChoreo = async function (side, actor, idx, skill) {
      const fn = isV(actor) && skill && VFX[skill.name];
      if (!fn || typeof FXE === 'undefined' || typeof fighterPoint !== 'function') return _pc.apply(this, arguments);
      try { FXE.ensure(); const S2 = side === 'P' ? 'L' : 'R', T = S2 === 'L' ? 'R' : 'L'; await fn({ S: S2, T, f: pt(S2), t: pt(T), d: S2 === 'L' ? 1 : -1 }); } catch (e) { console.warn(e); return _pc.apply(this, arguments); }
    }; }
  /* ---------- 專屬武器「神妃」（v192 使用者 11/09 18:42：抽中維歐娜免費送；裝備後攻擊 +5%、體力 +5%、受到的傷害 -5%） ----------
     存檔 SAVE.data.sigw[角色] = { eq: true/false }；開戰時（天梯即時對戰除外）套用。角色卡「技能一覽」上方顯示武器卡，可以裝備／卸下。 */
  const SIGW = { viona: { name: '無上大快刀「神妃」', img: 'assets/fx/viona/sword.webp?v=5cc4facb', atk: .05, hp: .05, dr: .05, desc: '初代女帝的佩刀，刀身纏繞著紫紅色的妖光。' } };
  CHARACTERS.viona.sigWeapon = 'viona';
  const sw = () => (SAVE.data.sigw = SAVE.data.sigw || {});
  function giveSig(id) { if (!SIGW[id] || sw()[id]) return; sw()[id] = { eq: true }; SAVE.save(); setTimeout(() => { try { toast(`獲得專屬武器 ${SIGW[id].name}，已自動裝備！`, 'gold'); } catch (e) { } }, 1200); }
  window.sigWeaponCard = function (c) { const W = SIGW[c.sigWeapon]; if (!W) return ''; const S2 = sw()[c.id], has = !!S2, eq = has && S2.eq;
    return `<li class="sk sigw" data-sigw-card="${c.id}"><div class="sk-top"><span class="sk-no sigw-ic"><img src="${W.img}" alt=""></span><b>${W.name}</b><em class="sk-type sigw">專屬武器</em></div>
      <p>${W.desc}裝備後：攻擊 +${pct(W.atk)}%、體力 +${pct(W.hp)}%、受到的傷害 -${pct(W.dr)}%。${has ? '' : '<br>取得方式：獲得此角色時免費贈送。'}</p>
      ${has ? `<button class="${eq ? 'btn-ghost' : 'btn-gold'} sm sigw-btn" data-sigw="${c.id}">${eq ? '卸下' : '裝備'}</button>` : '<span class="sigw-lock">尚未獲得</span>'}</li>`; };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sigw]'); if (!b) return; const id = b.dataset.sigw, S2 = sw()[id]; if (!S2) return;
    S2.eq = !S2.eq; SAVE.save(); toast(S2.eq ? `已裝備 ${SIGW[id].name}` : `已卸下 ${SIGW[id].name}`); const card = b.closest('[data-sigw-card]'); if (card) card.outerHTML = sigWeaponCard(CHARACTERS[id]); });
  if (typeof addCrew === 'function') { const _ac = addCrew; addCrew = function (id) { const r = _ac.apply(this, arguments); try { if (SIGW[id]) giveSig(id); } catch (e) { } return r; }; }
  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { Object.keys(SIGW).forEach(id => { if (typeof owned === 'function' && owned(id)) giveSig(id); }); } catch (e) { } }, 1500));
  if (typeof startBattle === 'function') { const _sb2 = startBattle; startBattle = function (opts) { const r = _sb2.apply(this, arguments);
    try { const b = B(); if (b && !(opts && opts.live)) (b.team || []).forEach(f => { const W = f && SIGW[f.id], S2 = W && sw()[f.id]; if (!S2 || !S2.eq || f.__sigw) return; f.__sigw = W;
      const full = f.hp >= f.maxHp; f.maxHp = Math.round(f.maxHp * (1 + W.hp)); if (full) f.hp = f.maxHp; f.__dmgB = (f.__dmgB || 1) * (1 + W.atk); L(`⚔️ ${f.name} 裝備專屬武器 ${W.name}：攻擊 +${pct(W.atk)}%、體力 +${pct(W.hp)}%、受到的傷害 -${pct(W.dr)}%`); }); } catch (e) { } return r; }; }
  if (typeof computeSkillOutcome === 'function') { const _c2 = computeSkillOutcome; computeSkillOutcome = function (a, t) { const r = _c2.apply(this, arguments); try { if (r && r.damage > 0 && t && t.__sigw && t.__sigw.dr) r.damage = Math.max(1, Math.floor(r.damage * (1 - t.__sigw.dr))); } catch (e) { } return r; }; }

  window.VIONA187 = { st, setVenus, addMark, subdue };
})();

/* ==== 原 js/roster_v154.js ==== */
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

/* ==== 原 js/roster_v154w.js ==== */
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
  CHARACTERS.zoro_wano = base('zoro_wano', '索隆（和之國篇）', '閻魔與霸王色', ['格鬥'], .65, {
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
  CHARACTERS.sanji_wano = base('sanji_wano', '香吉士（和之國篇）', '魔神風腳', ['火', '格鬥'], .65, {
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

/* ==== 原 js/roster_v164.js ==== */
/* v164 新角色（使用者 11/06 提供立繪與招式名）：
   ・斯科帕・賈巴（gaban，UR，「海賊王左手」，攻擊型，立繪 0.75）：招式名照使用者給的「雙斧流、神門、斧天樂、螳螂斧法、八千梟帥」，效果由 Claude 設計。
   ・西爾巴斯・雷利（rayleigh，UR，「海賊王右手」，攻擊型，立繪 0.7）：五招名稱與效果由 Claude 依原作設計（霸氣斬擊、見聞色、霸王色、鍍膜、奧義）。
     兩人強度：使用者指定「設定在 SSR 中屬於頂尖水平」——稀有度標 UR，但綜合戰力放在 SSR 頂尖～UR 下緣（約 1540～1560，不碾壓四皇），數值見 balance_v164.js。
   ・巴托洛米奧（bartolomeo，SR，「魯夫迷弟」，防禦中斷型，立繪 0.65）：1～4 招由 Claude 設計（屏障防禦＋打斷對手），
     第 5 招「屏障·絕對防禦」照使用者指定（效果欄位 bartoBarrier 在 ext_v164.js）。
   取得：三位都是限定抽獎池角色（CHAR_OBTAIN.eventOnly，不會出現在一般懸賞召喚）。限定池「海賊王左右手」（賈巴、雷利）與「魯夫迷弟」（巴托洛米奧）
     先建好放進 EVENT_POOLS，但還沒排 EVENT_CALENDAR 檔期——沒有檔期的池子不會出現在召喚畫面的分頁，排檔後才會開放；目前由月費取得（vip_v115.js）。
   皮膚：gaban_skin1「揮金如土」、rayleigh_skin1「價格斬殺」（2026 年 11 月月費）、bartolomeo_skin1「極夜聖誕」（2026 年 12 月月費，使用時防禦 +2%：SKINS.bonus.def，ext_v164.js）。
     皮膚的發放由 vip_v115.js（MC.skins）處理。
   巨人篇：劇情原本沒有賈巴的 NPC，這裡在艾爾巴夫陽界西邊村港口（多利旁邊，世界座標 [-220, 20]）加一位只會聊天的 NPC（look:'gaban'，名牌與頭像用新立繪），不增減任務步驟。
   必須在 roster_v91 之前載入（序號／圖鑑順序由 codex_order_v164.js 決定）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const V = 164, img = n => `assets/chars/${n}.webp?v=${V}`;
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const base = (id, name, title, types, battleScale, extra) => Object.assign({ id, name, title, types, scale: 1, worldScale: 1, battleScale, ai: 'aggressive', image: img(id), avatar: img(id + '_face'), ultimateBg: img(id) }, extra);

  CHARACTERS.gaban = base('gaban', '斯科帕・賈巴', '海賊王左手', ['格鬥'], .75, {
    maxHp: 1720, baseSpeed: 114, statScale: 1, role: '攻擊型', cardPos: '50% 20%', cardFocus: '49% 28%',
    desc: '羅傑海賊團的戰鬥員，和雷利並稱「海賊王的左右手」。雙手各握一把巨斧，力氣大到能和巨人正面角力。羅傑死後隱居多年，在艾爾巴夫再次現身。',
    skills: [
      S('雙斧流', 'attack', 10, 0, '左右兩把巨斧交替劈下 2～3 次；命中後 30% 機率讓對手防禦 -1（3 回合）。', [['連擊', 'red'], ['降防', 'blue']], 'sandslash',
        { multiHitNormal: [2, 3], perHitPower: 130, enemyDefDownChance: [.3, [1, 1], 3] }),
      S('神門', 'attack', 6, 260, '雙斧纏上霸氣，像關上神殿大門一樣從兩側夾斬：無視護盾並打破護盾；30% 機率使對手暈眩 1 回合。', [['強力', 'red'], ['無視護盾', 'red'], ['破盾', 'red'], ['暈眩', 'gold']], 'ashura',
        { ignoreShield: true, shieldBreak: true, stunChance: .3, stunTurns: 1 }),
      S('斧天樂', 'support', 3, 0, '敲響雙斧，打得越久越開心：攻擊 +2、速度 +1、回復 20% 體力並解除自身的異常狀態與負面能力；接下來 2 回合的下一次攻擊威力 ×1.6。', [['強化', 'gold'], ['回復', 'green'], ['淨化', 'green'], ['下一擊', 'red']], 'awaken',
        { selfBuffAtk: 2, selfBuffSpd: 1, healRatio: .2, clearSelfDebuffs: true, nextAttackMult: 1.6, nextAttackMultTurns: 2 }),
      S('螳螂斧法', 'attack', 6, 0, '像螳螂揮動雙鐮，貼身連續揮斧 4～6 次；對手體力越低傷害越高（最多 1.8 倍），30% 機率使對手破防 2 回合。', [['連擊', 'red'], ['斬殺', 'red'], ['破防', 'gold']], 'shishi',
        { multiHitNormal: [4, 6], perHitPower: 75, lowHpBonus: 1.8, armorBreakChance: .3, armorBreakTurns: 2 }),
      S('八千梟帥', 'attack', 2, 280, '奧義。雙斧纏上霸王色，掀起八千道斬擊的風暴：造成 3～4.2 倍傷害，必中、無視護盾，並清除對手的能力提升；40% 機率使對手恐懼 1 回合。', [['奧義', 'gold'], ['強力', 'red'], ['必中', 'red'], ['無視護盾', 'red'], ['清強化', 'blue'], ['恐懼', 'gold']], 'sanzen',
        { randomMultiplierRange: [3, 4.2], sureHit: true, ignoreShield: true, clearBuffs: true, fearChance: .4, fearTurns: 1 }, true)
    ] });

  CHARACTERS.rayleigh = base('rayleigh', '西爾巴斯・雷利', '海賊王右手', ['格鬥'], .7, {
    maxHp: 1600, baseSpeed: 126, statScale: 1, role: '攻擊型', cardPos: '50% 6%', cardFocus: '59% 7%',
    desc: '羅傑海賊團副船長，人稱「冥王」。在夏波帝諸島當鍍膜師，偶爾去賭場欠錢。教會魯夫三種霸氣，年紀雖大，一個人就能和海軍大將打成平手。',
    skills: [
      S('霸氣・纏繞斬', 'attack', 10, 210, '刀身纏上漆黑的武裝色霸氣斬下，必中；30% 機率讓對手防禦 -2（3 回合）。', [['必中', 'red'], ['降防', 'blue']], 'onigiri',
        { sureHit: true, enemyDefDownChance: [.3, [2, 2], 3] }),
      S('見聞色・預見', 'support', 4, 0, '看穿對手下一步的動作：閃避 1 回合、速度 +2；接下來 2 回合的下一次攻擊威力 ×1.6。', [['閃避', 'blue'], ['加速', 'gold'], ['下一擊', 'red']], 'aura',
        { dodgeTurns: 1, selfBuffSpd: 2, nextAttackMult: 1.6, nextAttackMultTurns: 2 }),
      S('冥王的霸王色', 'attack', 4, 160, '放出霸王色霸氣壓住對手：清除對手的能力提升、對手全能力 -1；40% 機率使對手恐懼 1 回合。', [['清強化', 'blue'], ['降能力', 'blue'], ['恐懼', 'gold']], 'haki',
        { clearBuffs: true, enemyAllDown: 1, fearChance: .4, fearTurns: 1 }),
      S('鍍膜師的手藝', 'support', 3, 0, '用鍍膜師的手法替自己包上一層膜：獲得最大體力 18% 的護盾、防禦 +2，並解除自身的異常狀態與負面能力。', [['護盾', 'green'], ['強化', 'gold'], ['淨化', 'green']], 'heal',
        { selfShieldMaxHpRatio: .18, selfBuffDef: 2, clearSelfDebuffs: true }),
      S('冥王・霸氣一閃', 'attack', 2, 0, '奧義。拔刀的一瞬間，三道纏著霸王色的斬擊同時落下：強烈攻擊 3 次、必中、無視護盾；對手體力越低傷害越高（最多 1.6 倍），40% 機率使對手恐懼 1 回合。', [['奧義', 'gold'], ['連擊', 'red'], ['必中', 'red'], ['無視護盾', 'red'], ['斬殺', 'red'], ['恐懼', 'gold']], 'sanzen',
        { multiHitNormal: [3, 3], perHitPower: 300, sureHit: true, ignoreShield: true, lowHpBonus: 1.6, fearChance: .4, fearTurns: 1 }, true)
    ] });

  CHARACTERS.bartolomeo = base('bartolomeo', '巴托洛米奧', '魯夫迷弟', ['超能'], .65, {
    maxHp: 1640, baseSpeed: 104, statScale: 1, role: '防禦中斷型', ai: 'balanced', cardPos: '50% 10%', cardFocus: '53% 13%',
    desc: '食人海賊團船長，屏障果實能力者，能張開任何攻擊都打不穿的透明屏障。魯夫的頭號粉絲，在德雷斯羅薩加入草帽大船團，說到魯夫就會感動得痛哭流涕。',
    skills: [
      S('流動防壁·階梯', 'support', 8, 0, '在腳下架起一層層屏障階梯往上跳：獲得最大體力 15% 的護盾、速度 +1，下一回合先出手。', [['護盾', 'green'], ['加速', 'gold'], ['先制', 'gold']], 'aura',
        { selfShieldMaxHpRatio: .15, selfBuffSpd: 1, selfPriority: 1 }),
      S('屏障衝擊', 'attack', 10, 130, '用屏障整面撞上去；35% 機率使對手暈眩 1 回合（打斷對手的行動），自身防禦 +1。', [['暈眩', 'gold'], ['強化', 'gold']], 'hammer',
        { stunChance: .35, stunTurns: 1, selfBuffDef: 1 }),
      S('屏障·奔牛突進', 'attack', 6, 165, '屏障變成兩隻公牛的牛角往前衝：打破對手的護盾，清除對手的能力提升；30% 機率使對手恐懼 1 回合。', [['破盾', 'red'], ['清強化', 'blue'], ['恐懼', 'gold']], 'punch',
        { shieldBreak: true, clearBuffs: true, fearChance: .3, fearTurns: 1 }),
      S('流動障壁·球拍', 'support', 4, 0, '把屏障變成一面球拍：對手下一次攻擊會被原封不動打回去（反彈 1 次），並讓對手接下來 2 回合的技能附加效果失效。', [['反彈', 'blue'], ['效果無效', 'blue']], 'aura',
        { reflectTurns: 1, reflectMultiplier: 1, nullifyEnemySkillTurns: 2 }),
      S('屏障·絕對防禦', 'support', 2, 0, '奧義。張開最堅固的屏障，無敵 2 回合：這段期間所有攻擊、負面狀態、負面能力都無效。立刻回復 50% 體力，之後 2 回合每回合再回復 5～10%；解除對手施放在自己身上的效果與對手的能力提升（也會解除對手的減傷、無敵、增傷等加成），解除自身的能力下降與負面狀態；35% 機率使對手虛弱（弱化）2 回合。可以使用 2 次。', [['奧義', 'gold'], ['無敵', 'gold'], ['免疫', 'green'], ['回復', 'green'], ['淨化', 'green'], ['清強化', 'blue'], ['虛弱', 'gold']], 'awaken',
        { invulnTurns: 2, healRatio: .5, clearSelfDebuffs: true, clearBuffs: true, clearEnemyTimed: true, weakChance: .35, weakTurns: 2, bartoBarrier: { turns: 2, regen: [.05, .1], regenTurns: 2 } }, true)
    ] });

  const NEW = { gaban: 'UR', rayleigh: 'UR', bartolomeo: 'SR' };
  Object.entries(NEW).forEach(([id, r]) => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); CHAR_RARITY[id] = r; });
  CHAR_OBTAIN.gaban = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, monthCard: '2026-11', npc: '限定抽獎池「海賊王左右手」（檔期另行公告）・2026 年 11 月月費「賈巴／雷利角色隨機卡」・巨人篇 NPC' };
  CHAR_OBTAIN.rayleigh = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, monthCard: '2026-11', npc: '限定抽獎池「海賊王左右手」（檔期另行公告）・2026 年 11 月月費「賈巴／雷利角色隨機卡」' };
  CHAR_OBTAIN.bartolomeo = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, monthCard: '2026-12', npc: '限定抽獎池「魯夫迷弟」（檔期另行公告）・2026 年 12 月月費贈送' };

  /* 皮膚（取得方式由 vip_v115.js 的月費發放；這裡只定義資料） */
  if (typeof SKINS !== 'undefined') {
    SKINS.gaban_skin1 = { char: 'gaban', name: '揮金如土', image: img('gaban_skin1'), avatar: img('gaban_skin1_face'), battleScale: .75, monthCard: '2026-11', how: '2026 年 11 月月費限定（購買月費即可獲得）' };
    SKINS.rayleigh_skin1 = { char: 'rayleigh', name: '價格斬殺', image: img('rayleigh_skin1'), avatar: img('rayleigh_skin1_face'), battleScale: .7, monthCard: '2026-11', how: '2026 年 11 月月費限定（購買月費即可獲得）' };
    SKINS.bartolomeo_skin1 = { char: 'bartolomeo', name: '極夜聖誕', image: img('bartolomeo_skin1'), avatar: img('bartolomeo_skin1_face'), battleScale: .65, monthCard: '2026-12', bonus: { def: .02 }, perk: '使用時防禦 +2%', how: '2026 年 12 月月費限定（購買月費即可獲得）・使用時防禦 +2%' };
  }

  /* 限定抽獎池（還沒排檔期，不會出現在召喚畫面；排檔＝在 data.js 的 EVENT_CALENDAR 加一筆 id:'roger_hands'／'barto_fan'）。橫幅與碎片圖為暫用合成圖 */
  if (typeof EVENT_POOLS !== 'undefined') {
    const ui = n => `assets/ui/${n}.webp?v=${V}`;
    const P = (o) => Object.assign({ amount: [[20, .6], [30, .3], [50, .1]], pity: 120, newbieFree: 10, dailyFree: 3, bountyBonus: 2, tokenCost: 1 }, o);
    if (!EVENT_POOLS.some(p => p.id === 'roger_hands')) EVENT_POOLS.push(P({ id: 'roger_hands', tab: '海賊王左右手', series: '羅傑海賊團系列', name: '羅傑海賊團系列 海賊王左右手 限定活動', banner: ui('event_banner_roger'), need: 150,
      shards: [{ char: 'rayleigh', rate: .02, icon: ui('shard_rayleigh'), color: '#d9dde6' }, { char: 'gaban', rate: .02, icon: ui('shard_gaban'), color: '#b06cff' }] }));
    if (!EVENT_POOLS.some(p => p.id === 'barto_fan')) EVENT_POOLS.push(P({ id: 'barto_fan', tab: '魯夫迷弟', series: '草帽大船團系列', name: '草帽大船團系列 魯夫迷弟 限定活動', banner: ui('event_banner_barto'), need: 100,
      shards: [{ char: 'bartolomeo', rate: .03, icon: ui('shard_bartolomeo'), color: '#7cff4f' }] }));
  }

  /* 巨人篇：賈巴的聊天 NPC（劇情原本沒有賈巴；只加 NPC、不加任務步驟） */
  const G = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'giant');
  if (G && G.npcs && !G.npcs.some(n => n.id === 'gaban_n'))
    G.npcs.push({ id: 'gaban_n', name: '賈巴', role: '羅傑海賊團・海賊王左手', look: 'gaban', pos: [-220, 20], chat: ['哈哈！你就是戴著那頂草帽的小子啊。', '羅傑那傢伙……要是看到你，大概會笑得很開心吧。', '在艾爾巴夫，力氣大的人說話才算數。要比比看嗎？'] });
})();

/* ==== 原 js/roster_v91.js ==== */
/* v91：依「登場篇章」重新排列角色序號；寇沙縮放、布魯克飛空斬擊、多利戰吼調整。 */
(function () {
  /* 序號規則（v93，依使用者指定）：
     No.001～011 主角群 → 海軍與世界政府（15）→ 王下七武海（13）→ 四皇團員（白鬍子 16、紅髮 11、百獸 12、BIG MOM 8、黑鬍子 10、十字公會 6）
     → 四皇（紅髮、黑鬍子、巴基、魯夫（尼卡）、白鬍子、BIG MOM、凱多）→ 其他角色依登場篇章（先排 100 位）→ 伊姆（No.???）→ 喬伊波伊（No.???）。
     '?群組' 是預留給還沒設計的角色的神秘編號。 */
  const R = (label, n) => Array(Math.max(0, n)).fill('?' + label);
  const block = (label, ids, total) => [...ids, ...R(label, total - ids.length)];
  const ORDER = [
    ...block('草帽一夥', [], 0), 'luffy0', 'zoro', 'nami', '?草帽一夥', 'sanji', '?草帽一夥', 'robin', 'franky', 'brook', 'jinbe', 'luffy', /* 第 11 號：巨人篇魯夫 */
    ...block('海軍與世界政府', ['coby0', 'morgan', 'marine', 'koby_mf', 'garp_mf', 'akainu', 'aokiji', 'kizaru', 'magellan', 'lucci', 'vergo', 'garp_hc', 'koby_hc'], 15),
    ...block('王下七武海', ['mihawk', 'crocodile', 'doflamingo', 'kuma', 'moria', 'law', 'hancock', 'kuma_eh', 'law_w', 'weevil', 'blackbeard_w', 'mihawk_w'], 13), /* v103：No.037 黑鬍子（七武海）、No.038 鷹眼（七武海） */ /* v102：No.037 預留給黑鬍子（七武海），立繪之後補 */ /* v101：七武海版羅 No.035、衛伯 No.036 */
    ...block('白鬍子海賊團', ['ace', 'marco'], 16), ...block('紅髮海賊團', ['uta'], 11) /* v121：No.056 美音 */, ...block('百獸海賊團', ['king'], 12) /* v115：No.067 燼 */,
    ...block('BIG MOM 海賊團', ['katakuri'], 8), ...block('黑鬍子海賊團', ['catarina', 'burgess', 'vasco'], 10), ...block('十字公會', [], 6),
    'shanks', 'blackbeard', 'buggy', 'luffy_nika', 'whitebeard', 'bigmom', 'kaido', /* 第 4 位是魯夫（尼卡型態），立繪完成前保留為神秘編號 */
    ...block('東海篇', ['makino', 'mayor', 'lordcoast', 'alvida'], 10), ...block('阿拉巴斯坦篇', ['vivi', 'koza'], 8), ...block('空島篇', ['enel', 'wiper'], 6),
    ...block('司法島篇', [], 7), ...block('恐怖三桅帆船篇', ['perona'], 6), ...block('魚人島篇', ['hody', 'shirahoshi'], 7),
    ...block('德雷斯羅薩篇', ['monet', 'sugar'], 12), ...block('蛋糕島篇', [], 8), ...block('和之國篇', ['kid', 'kinemon', 'tama', 'yamato', 'luffy_wano', 'zoro_wano', 'sanji_wano'], 12),
    ...block('蜂巢島篇', [], 4), ...block('蛋頭島篇', ['vegapunk', 'york', 'morgans'], 8), ...block('巨人篇', ['loki', 'dorry', 'brogy', 'gunko', 'shamrock'], 12),
    'imu', '!喬伊波伊'
  ];
  const finalList = ORDER.filter(x => x[0] === '?' || x[0] === '!' || CHARACTERS[x]); const extra = CHARACTER_ORDER.filter(id => !ORDER.includes(id) && CHARACTERS[id]);
  extra.forEach(id => finalList.splice(finalList.indexOf('imu'), 0, id)); /* 還沒排進規則的新角色：先放在伊姆之前 */
  CHARACTER_ORDER.length = 0; if (typeof RESERVED_NOS !== 'undefined') RESERVED_NOS.length = 0;
  finalList.forEach((x, i) => { if (x[0] === '?' || x[0] === '!') { if (typeof RESERVED_NOS !== 'undefined') { const [g, nm] = x.slice(1).split('|'); RESERVED_NOS.push({ no: i + 1, group: x[0] === '!' ? '？？？' : g, name: nm || '', hideNo: x[0] === '!' }); } } else { CHARACTER_ORDER.push(x); CHARACTERS[x].no = i + 1; delete CHARACTERS[x].noText; } });
  if (CHARACTERS.imu) { CHARACTERS.imu.mystery = true; CHARACTERS.imu.noText = '???'; } /* 伊姆：編號與身分都保持神秘 */
  window.CHAR_ARC = { luffy0: '東海篇', nami: '東海篇', vivi: '阿拉巴斯坦篇', enel: '空島篇', franky: '司法島篇', moria: '恐怖三桅帆船篇', hancock: '頂上戰爭篇', hody: '魚人島篇', law: '德雷斯羅薩篇', katakuri: '蛋糕島篇', kid: '和之國篇', garp_hc: '蜂巢島篇', vegapunk: '蛋頭島篇', luffy: '巨人篇', imu: '其他' };

  /* ---------- 數值調整 ---------- */
  if (CHARACTERS.koza) CHARACTERS.koza.battleScale = .6;
  { const s = CHARACTERS.brook && CHARACTERS.brook.skills.find(x => x.name === '飛空斬擊'); if (s) Object.assign(s, { desc: '把斬擊送向遠方：20% 機率 10 倍、30% 機率 5 倍、50% 機率 2～3.5 倍傷害；自身下回合受到的傷害 -10%。', tags: [['倍率', 'red'], ['減傷', 'blue']], effect: { variableMultipliers: [[.2, 10], [.3, 5], [.5, [2, 3.5]]], damageReductionTurns: 2, damageReductionValue: .1 } }); }
  { const s = CHARACTERS.dorry && CHARACTERS.dorry.skills.find(x => x.name === '艾爾巴夫的戰吼'); if (s) Object.assign(s, { desc: '巨人戰士的怒吼響徹戰場：攻擊 +2，回復 50% 體力，40% 使對手恐懼 1 回合。', tags: [['強化', 'gold'], ['回復', 'green'], ['恐懼', 'gold']], effect: Object.assign({}, s.effect, { healRatio: .5 }) }); }
})();
