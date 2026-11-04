/* v160 六位四皇技能重新設計（使用者 11/04；設計文件 /root/promo/v160/emperors_design.md；新機制在 js/ext_v160.js）。
   招式名稱沿用原本的；每位仍保有：清除對手能力提升（清強化）、解除自身負面（淨化）、第 5 招以外的高傷害技。
   必須在 balance_v159.js 之後、所有 roster 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, name) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === name); };
  function set(id, name, o) { const s = get(id, name); if (!s) return; s.effect = Object.assign(s.effect || {}, o.e || {}); (o.del || []).forEach(k => delete s.effect[k]); if (o.desc) s.desc = o.desc; if (o.tags) s.tags = o.tags; if (o.power !== undefined) s.power = o.power; }
  const PRESS = { key: 'haki', label: '霸氣壓制' }, DARK = { key: 'dark', label: '黑暗' }, SOUL = { key: 'soul', label: '靈魂壓制' };

  /* ---------- 紅髮：霸氣壓制 → 印記加成、瞬殺 ---------- */
  set('shanks', '強者波動', { e: { trueHitChance: .5, mark: Object.assign({ turns: 3 }, PRESS) },
    desc: '對對手進行 1～40 次斬擊；若對手有護盾，每一擊有 50% 機率化為真實攻擊直接打中本體（霸氣貫穿）。命中後對手被刻上「霸氣壓制」3 回合。',
    tags: [['連擊', 'red'], ['真實', 'gold'], ['霸氣壓制', 'gold']] });
  set('shanks', '強者對決', { e: { markBonus: Object.assign({ mult: 1.4 }, PRESS) },
    desc: '全能力 +1，回復 15% 體力，進行 1～30 次普通斬擊；自身體力高於 80% 時再追加 1～10 次。對「霸氣壓制」中的對手傷害 ×1.4。',
    tags: [['強化', 'gold'], ['連擊', 'red'], ['壓制加成', 'red']] });
  set('shanks', '給我一個面子', { e: { markBonus: Object.assign({ mult: 1.6, exec: .1, consume: true }, PRESS) },
    desc: '回復 20% 體力，強力攻擊 1～3 次，25% 使對手暈眩 1 回合，並使對手虛弱 2 回合。對「霸氣壓制」中的對手傷害 ×1.6、10% 機率直接秒殺（BOSS 改為 3 倍傷害），打完壓制消失。',
    tags: [['回復', 'green'], ['暈眩', 'gold'], ['虛弱', 'gray'], ['壓制加成', 'red'], ['秒殺', 'red']] });
  set('shanks', '霸王色', { e: { clearBuffs: true, shieldBreak: true, immuneTurns: 2, mark: Object.assign({ turns: 3 }, PRESS) },
    desc: '強制控場：對手全能力 -2；解除對手的變身；清除自身負面狀態，自身 2 回合免疫異常狀態；清除對手的能力提升並震碎對手的護盾；使對手虛弱 1 回合，並刻上「霸氣壓制」3 回合。對手稀有度 SR 以下時無法攻擊 1 回合；稀有度 R、或等級 LV80 以下時體力直接歸 0（BOSS 改為受到 3 倍傷害）。',
    tags: [['霸王色', 'gold'], ['控場', 'blue'], ['清強化', 'blue'], ['淨化', 'green'], ['霸氣壓制', 'gold']] });
  { const s = get('shanks', '神避'); if (s) { s.effect.markBonus = Object.assign({ mult: 1, exec: .15 }, PRESS); if (!/霸氣壓制/.test(s.desc)) s.desc = s.desc.replace('20% 直接秒殺', '20% 直接秒殺（對「霸氣壓制」中的對手 35%）'); } }

  /* ---------- 白鬍子：坦克、護盾、免疫控制、護盾轉傷害 ---------- */
  set('whitebeard', '海闊天空', { e: { selfShieldMaxHpRatio: .2, immuneTurns: 2 },
    desc: '全能力 +1，回復 20% 體力，獲得最大體力 20% 的護盾，2 回合免疫異常狀態；下回合攻擊傷害提升 2～10 倍。',
    tags: [['強化', 'gold'], ['回復', 'green'], ['護盾', 'blue'], ['免疫', 'green']] });
  set('whitebeard', '海震', { e: { clearBuffs: true },
    desc: '對敵人進行 1～50 次震動衝擊波；若對手有護盾，護盾直接失效；並清除對手的能力提升。',
    tags: [['連擊', 'red'], ['破盾', 'blue'], ['清強化', 'blue']] });
  set('whitebeard', '空震', { e: { shieldToDmg: .6 },
    desc: '強力衝擊 1～3 次，25% 使對手暈眩 1 回合，並附加破防 3 回合；對手體力高於 80% 時威力再提升 1.2～4 倍。自身的護盾越厚越強：傷害再加上目前護盾的 60%。',
    tags: [['重擊', 'red'], ['暈眩', 'gold'], ['破防', 'blue'], ['護盾轉傷害', 'gold']] });
  set('whitebeard', '霸王色', { e: { damageReductionTurns: 3, damageReductionValue: .3, selfShieldMaxHpRatio: .15 }, del: ['clearBuffs'],
    desc: '強制控場：對手全能力 -2；解除對手的變身；清除自身負面狀態；使對手虛弱 1 回合；自身 3 回合受到的傷害 -30%，並獲得最大體力 15% 的護盾。對手稀有度 SR 以下時無法攻擊 1 回合；稀有度 R、或等級 LV80 以下時體力直接歸 0（BOSS 改為受到 3 倍傷害）。',
    tags: [['霸王色', 'gold'], ['控場', 'blue'], ['淨化', 'green'], ['減傷', 'blue'], ['護盾', 'blue']] });
  { const s = get('whitebeard', '老爹'); if (s) { Object.assign(s.effect, { immuneTurns: 2, damageReductionTurns: 3, damageReductionValue: .25 }); if (!/免疫異常/.test(s.desc)) s.desc = s.desc.replace('只能使用 1 次（藥水無法補充）。', '只能使用 1 次（藥水無法補充）。白鬍子 2 回合免疫異常狀態、3 回合受到的傷害 -25%。'); } }

  /* ---------- 黑鬍子：吸收、反彈、極限暗殺 ---------- */
  set('blackbeard', '引力吸入', { e: { drainBuffs: true, mark: Object.assign({ turns: 3 }, DARK) }, del: ['clearBuffs'],
    desc: '吸取對手 5～15% 體力、奪走對手的能力提升加到自己身上；30% 使對手恐懼 1 回合；對手 2 回合每回合扣 10% 體力，並被刻上「黑暗」3 回合。',
    tags: [['吸收', 'green'], ['奪強化', 'blue'], ['恐懼', 'gold'], ['黑暗印記', 'gold']] });
  set('blackbeard', '引發震動', { e: { lifesteal: .15, markBonus: Object.assign({ mult: 1.4 }, DARK) },
    desc: '30% → 2.5 倍、30% → 5 倍、20% → 10～20 倍、10% → 20～40 倍，其餘為普通震動傷害；造成傷害的 15% 轉為體力。對「黑暗」中的對手傷害 ×1.4。',
    tags: [['震震', 'red'], ['吸血', 'green'], ['印記加成', 'red']] });
  set('blackbeard', '闇穴道', { e: { reflectDebuff: { turns: 2 }, reflectTurns: 1, reflectMultiplier: 1.2, healRatio: .1, copyCast: true }, del: ['copyReplace'], /* v162：再加上複製對手技能立刻使用 */
    desc: '張開黑暗的漩渦：接下來 2 回合，對手施加在自己身上的異常狀態與能力下降全部彈回對手；下一次受到的攻擊以 1.2 倍反彈，並回復 10% 體力。同時把對手的一個技能（第 5 招除外）吸進黑暗，立刻拿來使用一次。',
    tags: [['反彈', 'gold'], ['反彈負面', 'blue'], ['回復', 'green'], ['複製', 'purple']] });
  set('blackbeard', '解放', { e: { markBonus: Object.assign({ mult: 1, exec: .25, consume: true }, DARK) },
    desc: '解放吸進來的力量：造成對手已損失體力 1～1.5 倍的傷害（最多對手最大體力 35%），並獲得自身目前體力 10% 的護盾，解除自身的異常狀態與負面能力；此回合結束時，對手全能力 -1、隨機一個技能次數 -1。對「黑暗」中的對手 25% 機率直接秒殺（BOSS 改為 3 倍傷害），打完黑暗消失。',
    tags: [['終結', 'gold'], ['護盾', 'green'], ['淨化', 'green'], ['秒殺', 'red']] });

  { const s = get('blackbeard', '假裝認輸'); if (s && s.effect.enemyCurrentHpCutRange) { s.effect.enemyCurrentHpCutRange = [.2, .35]; s.desc = s.desc.replace('25～45%', '20～35%'); } } /* 削血比例太高，對高體力的四皇幾乎必勝 */

  /* ---------- 凱多：坦克、高傷、龍人型態加成、瀕死保命 ---------- */
  set('kaido', '酒龍八卦', { e: { damageReductionTurns: 2, damageReductionValue: .25 },
    desc: '全能力 +1，清除自身負面狀態，下回合攻擊傷害 5～7 倍；2 回合受到的傷害 -25%。',
    tags: [['強化', 'gold'], ['淨化', 'green'], ['減傷', 'blue']] });
  { const s = get('kaido', '升龍·火焰八卦'); if (s) { s.effect.dragonBoost = { dmg: 1.3, dr: .2, regen: .04, guard: .3 };
    if (!/龍人型態期間/.test(s.desc)) s.desc += ' 龍人型態期間：其他招式傷害 ×1.3、受到的傷害 -20%、每回合回復 4% 體力，並能撐住一次致命傷（保住 30% 體力）。';
    if (!s.tags.some(t => t[0] === '保命')) s.tags.push(['保命', 'green']); } }

  /* ---------- BIG MOM：強控、靈魂壓制（無法解除）、奪取 ---------- */
  set('bigmom', '宙斯', { e: { attackFailChance: .35, markBonus: Object.assign({ mult: 1.25 }, SOUL) },
    desc: '強力雷電攻擊，35% 機率使對手暈眩 1 回合；接下來 2 回合對手的攻擊有 35% 機率落空。對「靈魂壓制」中的對手傷害 ×1.25。',
    tags: [['暈眩', 'gold'], ['落空', 'blue'], ['壓制加成', 'red']] });
  set('bigmom', '拿破崙', { e: { markBonus: Object.assign({ mult: 1.35 }, SOUL) },
    desc: '恐怖的斬擊波；50% 機率額外扣除對手當前體力的 30%，並附加破防 2 回合。對「靈魂壓制」中的對手傷害 ×1.35。',
    tags: [['強力', 'red'], ['比例', 'gold'], ['壓制加成', 'red']] });
  set('bigmom', '靈魂咒語', { e: { drainBuffs: true, soulLock: { turns: 3, down: 1, drain: .03 }, selfShieldCurrentHpRatio: .1, damageReductionTurns: 3, damageReductionRange: [.2, .35] }, del: ['clearBuffs', 'statUpAll', 'immuneTurns'],
    desc: '「壽命還是點心？」奪走對手的能力提升加到自己身上，並施加「靈魂壓制」3 回合：對手全能力至少 -1、每回合被奪走最大體力 3%（BOSS 1.5%）給 BIG MOM，這個壓制無法被任何淨化或強化解除。同時解除自身的異常狀態與負面能力，獲得目前體力 10% 的護盾，3 回合受到的傷害 -20～35%。',
    tags: [['靈魂壓制', 'red'], ['無法解除', 'gold'], ['奪強化', 'blue'], ['淨化', 'green'], ['護盾', 'blue'], ['減傷', 'blue']] });
  { const s = get('bigmom', '霸海'); if (s) { s.effect.extendLock = 2; if (!/靈魂壓制/.test(s.desc)) s.desc += ' 對手若正被「靈魂壓制」，壓制延長 2 回合。'; } }

  /* ---------- 尼卡魯夫：反轉、自由、多段與回復 ---------- */
  set('luffy_nika', '解放之鼓', { e: { flipDebuffs: true, damageReductionValue: .35, dmgToHeal: { turns: 2, ratio: .5 } }, del: ['clearSelfDebuffs'],
    desc: '響起解放的鼓聲：體力全部回復、全能力 +1、解除自身異常狀態，並把自身的能力下降反轉成同等的能力提升；之後 2 回合每回合回復 20% 體力、受到的傷害 -35%，受到傷害後再把其中 50% 笑成體力。陣容中體力低於 85% 的隊友回復 5% 體力。',
    tags: [['回復', 'green'], ['反轉', 'gold'], ['淨化', 'green'], ['減傷', 'blue']] });
  { const s = get('luffy_nika', '橡膠橡膠·火箭砲'); if (s) { s.effect.perHitPower = 20; s.power = 20; } } /* 多段攻擊：每擊 13 → 20 */
  set('luffy_nika', '橡膠橡膠·雷電', { e: { paralyzeChance: .5 },
    desc: '抓住閃電砸向對手：50% 使對手麻痺 1 回合，無視護盾直接造成傷害。若這招被對手的閃避或無敵躲開，對手下回合的攻擊會反彈自己 20～120% 的傷害。' }); /* 原本 100% 麻痺＋速度較快，可以把較慢的對手一直麻痺到倒 */
  set('luffy_nika', '橡膠橡膠·巨人', { e: { invertBuffs: true }, del: ['clearBuffs'],
    desc: '變成巨人一拳砸下：威懾對手使其 1 回合無法攻擊，並讓對手下回合的技能效果失效；把對手的能力提升反轉成同等的能力下降；50% 機率連續攻擊 3 次。',
    tags: [['威懾', 'gold'], ['封印', 'blue'], ['反轉強化', 'blue'], ['連擊', 'red']] });
  /* 平衡（tests/tier-sim.js 四皇互打與全角色量測） */
  const STAT_V160 = { shanks: 1.35, whitebeard: 0.88, blackbeard: 1.12, kaido: 1.0, bigmom: 1.04, luffy_nika: 1.12 };
  if (CHARACTERS.shanks) CHARACTERS.shanks.hpTilt = 1.35;
  if (CHARACTERS.blackbeard) CHARACTERS.blackbeard.hpTilt = 1.3; /* 黑鬍子：提高自身生存（體力 ×1.3、傷害 ÷1.3，只限玩家角色） */ /* 紅髮：體力 ×1.35、傷害 ÷1.35（只限玩家角色；ext_v160.js） */
  Object.entries(STAT_V160).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V160); window.BALANCE_V160 = { stat: STAT_V160 }; }
})();
