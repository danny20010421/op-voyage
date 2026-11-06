/* v167 七位角色強化（使用者 11/06 08:26）：
   洛克斯＝第 1～4 招都有回復、傷害再提高；大和、鷹眼（含七武海版）＝輸出提高；沙鱷魚＝控制加強；
   莫莉亞＝輸出提高＋「影子」疊層（影法師、影武者、影箱・封印累積影子，角刀影、影箱・連擊依影子層數加成，影子集合地收回全部影子造成真實傷害）；
   多佛朗明哥＝寄生線加一點控制；洛基＝輸出提高，並補上控制、回復、淨化、護盾、真實傷害。
   招式名稱與概念不變。新效果（trueBurst、shadowAdd、shadowBonus）在 js/ext_v167.js；其餘沿用既有效果欄位。
   平衡：洛克斯、洛基維持天花板之上；其他五位調到各自稀有度區間偏上、不超過上一階（量測 /root/promo/v167/bal）。
   window.__NO_V167：模擬工具量「調整前」用。必須在 balance_v165.js、ext_v165.js、ext_v167.js 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || window.__NO_V167) return;
  const get = (id, n) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === n); };
  const tag = (s, t, c) => { if (s && !(s.tags || []).some(x => x[0] === t)) (s.tags = s.tags || []).push([t, c]); };
  function upd(id, n, o) {
    const s = get(id, n); if (!s) return null;
    if (o.power !== undefined) s.power = o.power;
    s.effect = Object.assign(s.effect || {}, o.e || {}); (o.del || []).forEach(k => delete s.effect[k]);
    if (o.desc) s.desc = o.desc; if (o.tags) s.tags = o.tags; (o.add || []).forEach(([t, c]) => tag(s, t, c));
    return s;
  }

  /* ---------- 洛克斯：第 1～4 招都會回復體力，傷害再提高 ---------- */
  upd('rocks', '蝕', { power: 320, e: { lifestealPost: .25 },
    desc: '無視護盾、無視對手的能力提升、無視對手的效果技能（減傷、無敵、閃避、反彈、替身等），也無視攻擊無效與無敵，直接對敵人造成真實傷害，並把造成傷害的 25% 轉為自己的體力。命中後清除對手的能力提升。12% 機率直接秒殺（BOSS 改為受到 3 倍傷害）。命中後壓制對手：3 回合內回復量 -70%，2 回合內無法使用奧義（第 5 招，含變身與晉升）。',
    add: [['吸血', 'green']] });
  upd('rocks', '瞬', { e: { healRatio: .35, rocksShun: [.25, .5] },
    desc: '先出招。無視對手的技能與效果，自身無敵 1 回合並回復 35% 體力；下回合攻擊時有 25～50% 機率直接秒殺對手（BOSS 改為受到 3 倍傷害）。解除自身的異常狀態與負面能力。',
    add: [['回復', 'green']] });
  upd('rocks', '殺', { e: { healRatio: .15, rocksKill: { p: .7, cut: .75 } },
    desc: '對手稀有度在 SSR 以下（不含 SSR）時直接秒殺；SSR 以上（含 SSR）有 70% 直接秒殺，另外 30% 扣除對手當下體力的 75%。此技能無法被抵擋或無效化（BOSS：秒殺改為 3 倍傷害，扣除體力最多 15% 最大體力）。出招前打破對手的無敵；命中後壓制對手：3 回合內無法使用奧義（第 5 招，含變身與晉升）、回復量 -70%。出招後回復自身 15% 體力。',
    add: [['回復', 'green']] });
  upd('rocks', '蓄', { e: { healRatio: .2, rocksStoreMult: 2.2 },
    desc: '每次使用都回復自身 20% 體力。第一次使用：開始記錄之後敵人對我方造成的傷害（最多記錄 5 回合）。第二次使用：把記錄到的傷害 2.2 倍、無視護盾奉還給對手。第一次使用後超過 5 回合才再次使用，就無法奉還。',
    add: [['回復', 'green']] });
  { const s = get('rocks', '戴維的秘密'); if (s && s.effect.rocksSecret) { s.effect.rocksSecret.mult = [12, 22]; s.desc = s.desc.replace('10～18 倍', '12～22 倍'); } }

  /* ---------- 洛基：輸出提高；控制、回復、淨化、護盾、真實傷害 ---------- */
  upd('loki', '雷電噴吐', { power: 85, e: { perHitPower: 85, paralyzeChance: .25, paralyzeTurns: 1, lifestealPost: .15 },
    desc: '噴出雷電攻擊 5～10 次，並追加這次總傷害 5～10% 的額外傷害；把造成傷害的 15% 轉為自己的體力，25% 使對手麻痺 1 回合。雷電穿透一切防禦：出招前打破對手的無敵、無視對手的減傷效果；這次攻擊足以擊倒對手時，有 50% 機率讓對手的保命效果不發動。',
    add: [['吸血', 'green'], ['麻痺', 'gold']] });
  upd('loki', '鐵雷', { power: 210, e: { trueBurst: { pct: .08, label: '鐵雷的真實傷害' } },
    desc: '雷電纏身的鐵鎚重擊：50% 機率 2.5 倍爆擊，50% 使對手無法攻擊 1 回合，40% 使對手破防 3 回合；命中後再追加對手最大體力 8% 的真實傷害（無視護盾與減傷，BOSS 減半）。出招前打破對手的無敵、無視對手的減傷效果；這一擊足以擊倒對手時，有 60% 機率讓對手的保命效果（撐住致命傷、不死、瀕死回滿等）不發動。',
    add: [['真實傷害', 'red']] });
  upd('loki', '原初世界', { e: { freezeChance: .75, selfShieldMaxHpRatio: .25, healRatio: .15 },
    desc: '喚醒原初的世界：清除對手強化與自身負面狀態，回復自身 15% 體力並獲得最大體力 25% 的護盾；造成 10 次最大體力 3% 的傷害，75% 冰凍 2 回合，接下來 2 回合傷害 ×2.5。出招前先打破對手的無敵，並無視對手的減傷效果。',
    tags: [['清強化', 'blue'], ['淨化', 'green'], ['回復', 'green'], ['護盾', 'blue'], ['冰凍', 'gold'], ['破無敵', 'red']] });
  upd('loki', '鐵雷五矢', { e: { lokiBolts: [5, [.06, .1]], lokiStun: .55, trueBurst: { pct: .05, label: '第五道鐵雷' } },
    desc: '五道鐵雷貫穿：造成 5 次最大體力 6～10% 的傷害，最後一道化為真實傷害，再扣對手最大體力 5%（無視護盾與減傷，BOSS 減半）；下一次受到的攻擊以 1.5～2 倍反彈並附帶隨機異常；55% 機率使對手無法攻擊 1 回合或下一招失效；對手持續受到雷電傷害 2 回合。鐵雷穿透一切防禦：出招前打破對手的無敵、無視對手的減傷效果。',
    add: [['真實傷害', 'red'], ['控制', 'gold']] });
  upd('loki', '尼德霍格覺醒', { e: { clearSelfDebuffs: true, selfShieldMaxHpRatio: .3 },
    desc: '奧義。全能力 +2，解除自身的異常狀態與負面能力，獲得最大體力 30% 的護盾；連續 2 回合恢復全部體力，並恢復其他技能的全部次數；接下來 2 回合傷害提升 200～2000%，攻擊有 20% 機率直接秒殺（BOSS 無效）。覺醒後直到倒下前：受到的傷害 -20%，每 5 回合清除對手的能力提升。',
    add: [['淨化', 'green'], ['護盾', 'blue']] });

  /* ---------- 大和：輸出提高 ---------- */
  upd('yamato', '無侍冰牙', { power: 60, e: { perHitPower: 60, extraIceChance: .3 },
    desc: '對敵人普通攻擊 2～5 次，每次有 30% 機率附加冰凍傷害。' });
  upd('yamato', '雷鳴八卦', { power: 145, e: { jackpotChance: .15 },
    desc: '纏繞霸氣的狼牙棒高速突進，15% 機率打出 10 倍傷害；50% 使對手虛弱 2 回合（受到 1.2～1.5 倍傷害）。' });
  upd('yamato', '鳴鏑', { e: { nextAttackMult: 2.5 },
    desc: '全能力 +1，下回合攻擊威力 2.5 倍，並把自身所有負面效果與負面能力轉移給對手。' });
  upd('yamato', '鏡山', { power: 120,
    desc: '獲得自身體力 30% 的護盾，3 回合內每回合回復 10% 體力，並對敵人進行一次強力攻擊。' });

  /* ---------- 鷹眼：輸出提高（七武海版小幅） ---------- */
  upd('mihawk', '普攻', { power: 95, e: { perHitPower: 95 } });
  upd('mihawk', '劍氣狀態', { e: { nextAttackMult: [1.3, 1.8] },
    desc: '恢復自身 20～50% 體力，下回合攻擊傷害 1.3～1.8 倍。' });
  upd('mihawk', '黑刀·夜', { power: 185, e: { randomMultiplierRange: [6, 13], executeChance: .06 },
    desc: '揮動大刀斬擊對手，造成 6～13 倍傷害；6% 機率直接秒殺對手。' });
  upd('mihawk', '世界最強劍豪', { e: { dotSequence: [[.04, .06], [.04, .06], [.04, .06]] },
    desc: '全能力 +1；接下來 2 回合，對手對自己的攻擊無效；對手每回合損失 4～6% 體力，最多 3 回合。' });
  upd('mihawk_w', '斬擊', { power: 80, e: { perHitPower: 80 } });
  upd('mihawk_w', '黑刀·夜', { power: 165, e: { randomMultiplierRange: [5, 11] },
    desc: '一刀劈開冰山的斬擊：造成 5～11 倍傷害，3% 機率一刀斬殺。' });

  /* ---------- 沙鱷魚：控制加強 ---------- */
  upd('crocodile', '沙漠寶刀', { e: { petrifyChance: .2, petrifyTurns: 1 },
    desc: '15% 機率直接減少對方當前 50% 血量，否則為普通攻擊；30% 機率使對手防禦 -1（2 回合），20% 機率使對手乾涸固化 1 回合。',
    add: [['固化', 'gold']] });
  upd('crocodile', '沙漠向日葵', { e: { attackFailTurns: 2, attackFailChance: .25 },
    desc: '地面化為流沙：使對方疲憊 1 回合（無法使用技能）、隨機扣除一個技能次數 1，並使對手易傷 2 回合（受到的傷害 1.15～1.3 倍）；陷在流沙裡的對手 2 回合內攻擊有 25% 機率落空；自己下回合傷害 1.5 倍。',
    add: [['落空', 'blue']] });
  upd('crocodile', '金剛寶刀', { e: { petrifyChance: .55 },
    desc: '連續攻擊 3 次，每次造成對手當前 HP 1%～15% 傷害；55% 機率使對手固化 1 回合。' });
  upd('crocodile', '侵蝕輪迴 / 乾涸', { e: { petrifyChance: .65 },
    desc: '吸取對手部分血量，自己攻防各 +2，並有 65% 機率使對手固化 1 回合。' });
  upd('crocodile', '沙嵐（沙塵暴）', { e: { skipAttackChance: .7, attackFailTurns: 2, attackFailChance: .3 },
    desc: '全能力 +1，捲起沙塵暴造成 4～5.5 倍傷害，70% 使對手睜不開眼 1 回合無法攻擊，之後 2 回合攻擊有 30% 機率落空；之後 3 回合依序扣對手 8%、12%、15% 體力。',
    add: [['落空', 'blue']] });

  /* ---------- 莫莉亞：輸出提高＋影子疊層 ---------- */
  const SH = { n: 1, max: 5, turns: 4 };
  upd('moria', '影法師', { power: 55, e: { perHitPower: 55, shadowAdd: SH },
    desc: '召喚 3～5 個影子分身攻擊 3～5 次，並剪下對手 1 層「影子」（最多 5 層）；對手受到的傷害轉為莫莉亞的護盾（護盾只維持 1 回合）。',
    add: [['影子疊層', 'purple']] });
  upd('moria', '影武者', { e: { healRatio: .15, shadowAdd: SH },
    desc: '讓影子替身擋下對手的下一次攻擊，並回復自身 15% 體力；替身趁機剪下對手 1 層「影子」。',
    add: [['影子疊層', 'purple']] });
  upd('moria', '角刀影', { power: 150, e: { shadowBonus: { per: .2 } },
    desc: '影子化為巨大的影之蜥蜴，以尖角刺穿對手；清除對手的能力提升，並有 50% 機率使對手虛弱。對手身上每有 1 層「影子」，傷害 +20%（5 層 +100%）。',
    add: [['影子加成', 'red']] });
  { const s = get('moria', '影箱'); if (s && s.effect.variants) {
    s.effect.variants.forEach(v => { if (v.effect.noDamage) v.effect.shadowAdd = { n: 2, max: 5, turns: 4 }; else { v.power = 40; v.effect.perHitPower = 40; v.effect.shadowBonus = { per: .15 }; } });
    s.power = 40;
    s.desc = '隨機發動其中一種：「影箱・封印」對手 2 回合無法攻擊，並剪下對手 2 層「影子」；或「影箱・連擊」普通攻擊對手 5～10 次，對手每有 1 層影子傷害 +15%。';
    tag(s, '影子疊層', 'purple'); tag(s, '影子加成', 'red'); } }
  upd('moria', '影子集合地', { e: { shadowBonus: { consume: true, burst: .05 } },
    desc: '強制剪下周圍所有人的影子吸入體內：體力上限與體力增加等同對手目前的體力（最多自身最大體力的 50%），對手受到 100～1000 點隨機傷害，自身防禦 +2，身形巨大化；並收回對手身上全部的「影子」，每層再造成對手最大體力 5% 的真實傷害（無視護盾與減傷，BOSS 減半）。可使用 2 次，每施放一次身形就更巨大。',
    add: [['影子回收', 'red'], ['真實傷害', 'red']] });

  /* ---------- 多佛朗明哥：寄生線加一點控制 ---------- */
  upd('doflamingo', '寄生線', { e: { skipAttackChance: .3, skipAttackTurns: 1, ccKind: 'paralyze' },
    desc: '用絲線操縱對手的身體：對手下一次攻擊造成的傷害會反彈 20～200% 到自己身上（明哥不受傷），並使對手防禦、速度 -1（連續 2 回合）；30% 機率完全操縱對手，使其 1 回合無法行動。',
    add: [['操縱', 'gold']] });

  /* ---------- 平衡（tests/tier-sim.js 全角色量測，/root/promo/v167/bal） ---------- */
  const STAT_V167 = { rocks: 1.18, yamato: 1.05, mihawk: 1.1, mihawk_w: 1.15, crocodile: 0.875, moria: 1.15, doflamingo: 1.06 }; /* 調整前：洛克斯 1.15、大和 1.087、鷹眼 1.118、鷹眼（七武海）1.183、沙鱷魚 1.006、莫莉亞 1.262、明哥 1.071（技能變強後把綜合戰力拉回稀有度區間偏上） */
  Object.entries(STAT_V167).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V167); window.BALANCE_V167 = { stat: STAT_V167 }; }
})();
