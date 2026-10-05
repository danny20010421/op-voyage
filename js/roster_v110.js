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
