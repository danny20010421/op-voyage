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
