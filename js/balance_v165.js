/* v165 伊姆重做（使用者 11/06 指定規格 /root/promo/v165/src/imu_skills.txt，逐條照做；強度不壓回平衡區間）。
   三種型態：初始型態「伊姆」（原立繪）→ 第一型態「伊姆聖」（imu_form1）→ 第二型態「世界之王・伊姆聖」（imu_form2）。
   - CHARACTERS.imu.skills：初始／第一型態的五招（①不死之身 ②黑轉支配 ③虛空威壓 ④黑焰・凶兆 ⑤最初20人）；初始型態只能用①⑤
   - CHARACTERS.imu.form2Skills：第二型態的①～④（⑤沿用同一招）
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
    { key: 'form2', label: '第二型態', name: '世界之王・伊姆聖', title: '第二型態', image: img('imu_form2'), avatar: img('imu_form2_face'), scale: 1.45 }
  ];
  delete C.skinSkills; /* v165：型態取代皮膚鎖招 */
  C.desc = '坐在瑪莉喬亞「空白王座」上的世界之王，真實身分籠罩在黑影之中。初始型態只能使用「不死之身」與「最初20人」；施放「最初20人」晉升為第一型態「伊姆聖」、再次施放晉升為第二型態「世界之王・伊姆聖」，立繪與技能都會改變。【角色特性】免疫異常、免秒殺、免能力下降。';
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
    sk({ name: '最初20人', type: 'support', pp: 4, anima: 'awaken', ultimate: true,
      desc: '奧義（4 次）。第一次施放晉升為第一型態「伊姆聖」，開啟第 2～4 招；第二次施放晉升為第二型態「世界之王・伊姆聖」，技能欄換成第二型態的技能，第 1～4 招次數全部恢復（本招不恢復，最多 4 次），並繼承全部累積效果。每次施放：全能力 +3、無敵 5 回合、連續 3 回合奪走對手目前體力的 30%、自身負面狀態與能力下降全部反彈給對手（之後對手施加的也會反彈）、全部技能威力 +20～50% 且都改為真實傷害；並開始每回合判定秒殺對手（從 20% 起每回合 +5%，秒殺後重新累加）；體力低於 10% 時恢復全部體力（每次施放 +2 次）。最多晉升兩次，之後立繪維持最新型態，但仍能施放技能效果。',
      tags: [['奧義', 'gold'], ['變身', 'gold'], ['無敵', 'green'], ['真實傷害', 'red'], ['秒殺', 'red']],
      effect: { imuAscend: { stat: 3, inv: 5, steal: [3, .3], pow: [.2, .5], exec: [.2, .05], clutch: 2, clutchAt: .1 }, noRestore: true } })
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
