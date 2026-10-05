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
