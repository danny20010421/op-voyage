/* v156 劇情 BOSS 強度曲線：各篇章 BOSS 本身的強弱差很多（路奇、多佛朗明哥、BIG MOM、凱多、洛基出手很重；莫莉亞、赤犬、荷帝偏耐打），
   原本只靠篇章倍率疊加，造成司法島之後幾乎打不過、恐怖三桅帆船與頂上戰爭卻要打 100 回合以上。
   這裡只調篇章的 BOSS 設定（BOSS 血量倍率 bossHp、BOSS 額外能力階級 bossStages（可為負）、BOSS 等級加成 bossLvUp、復活次數 revives，
   以及新增的 BOSS 傷害倍率 bossDmg、BOSS 奧義次數上限 bossUltCap），
   不動角色本身的數值與技能；篇章一般敵人的 hp/atk/def/spd 不變。模擬工具：promo/v156/story/bsim.js（3 人隊伍對 BOSS，實際戰鬥流程）。
   必須在 ext_effects.js 之後、admin.js 之前載入（後台會在 admin.js 載入時記下預設難度）。 */
(function () {
  if (typeof CHAPTER_DIFFICULTY === 'undefined' || window.__NO_BOSS156) return; /* __NO_BOSS156：模擬工具量「調整前」用 */
  const T = {
    /*            bossHp  bossStages  bossLvUp  revives  bossDmg  bossUltCap */
    skypiea:    [1.30,  0, 14, 1, 1],
    enies:      [1.30,  0, 10, 1, 0.45],
    thriller:   [0.50,  2, 16, 1, 0.92],  /* v167：莫莉亞輸出提高＋影子疊層後 0.70／1.2 → 0.50／0.92，玩家勝率回到調整前（bsim） */
    marineford: [1.00,  3, 17, 1, 1.75],  /* v157：加了清強化／淨化後重調；1.65 實測平均 92% 偏簡單，取 1.75 讓頂上戰爭回到約 75～80% */
    fishman:    [1.30,  2, 18, 1, 1],
    dressrosa:  [1.30,  0, 12, 1, 0.55],  /* v167：明哥寄生線加了控制後 bossDmg 0.6 → 0.55（bsim） */
    wholecake:  [0.45, -3, 14, 1, 0.6],   /* v160：BIG MOM 新技能（靈魂壓制）後 bossHp 0.70 → 0.45，玩家勝率回到約 64%（bsim） */
    wano:       [0.35, -3, 14, 1, 0.22],  /* v160：凱多龍人型態加成後 bossHp 0.60 → 0.35、bossDmg 0.3 → 0.22，玩家勝率約 57%（bsim） */
    dark:       [1.50,  2, 22, 1, 0.9],
    egghead:    [1.40,  0, 23, 1, 0.8],
    giant:      [0.60, -3, 25, 2, 0.5, 1]   /* 復活 2 次維持 v152 的決定（神之騎士團兩場對決＋洛基） */
  };
  /* 巨人篇同一章三位 BOSS：軍子出手太重；洛基是戰力天花板（每回合回滿、秒殺、反彈），另外大幅壓低 */
  const FIX = { giant: { gunko: { hp: 0.5, dmg: 0.4 }, shamrock: { dmg: 1.3 }, loki: { hp: 0.3, atk: -4, def: 0, spd: 3, dmg: 0.33 } /* v157：0.5 → 0.42；v167：洛基加上真實傷害、護盾、回復、控制後 hp 0.42→0.3、atk -3→-4、def 1→0、dmg 0.42→0.33，玩家勝率回到調整前（bsim） */ } };
  /* v167 支線對決：大和（和之國「想成為御田的人」）輸出提高後，對決的大和體力、傷害 ×0.75，玩家勝率回到調整前（bsim） */
  { const W = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'wano'), S = W && (W.sides || []).find(x => x.id === 'yamato_oden'); if (S && !S.foe) S.foe = { hp: 0.75, dmg: 0.75 }; }
  Object.entries(T).forEach(([id, [bossHp, bossStages, bossLvUp, revives, bossDmg, bossUltCap]]) => { const d = CHAPTER_DIFFICULTY[id]; if (d) Object.assign(d, { bossHp, bossStages: Math.max(0, bossStages), bossStageAdj: Math.min(0, bossStages), bossLvUp, revives, bossDmg }, bossUltCap ? { bossUltCap } : {}, FIX[id] ? { bossFix: FIX[id] } : {}); });
  /* bossDmg：BOSS 造成的攻擊傷害倍率（新欄位，只作用在劇情／困難模式的篇章 BOSS）。
     用 __dmgB（progress_v131 的傷害加成，計算在 computeSkillOutcome 之後），不改 dmgMul（dmgMul 同時是受傷除數）。 */
  if (typeof applyChapterDifficulty === 'function') {
    const _acd = applyChapterDifficulty;
    applyChapterDifficulty = function (fighter, chapterId, isBoss) {
      const r = _acd.apply(this, arguments), d = CHAPTER_DIFFICULTY[chapterId];
      if (isBoss && d && d.bossDmg && d.bossDmg !== 1 && r) r.__dmgB = (r.__dmgB || 1) * d.bossDmg;
      /* 負的 BOSS 能力階級另外存在 bossStageAdj（戰鬥紀錄「敵方全能力額外 +N」只顯示正數） */
      if (isBoss && d && d.bossStageAdj && r) ['atk', 'def', 'spd'].forEach(k => { r.buffs[k] = Math.max(-6, Math.min(6, (r.buffs[k] || 0) + d.bossStageAdj)); });
      /* bossUltCap：BOSS 奧義最多可用幾次（洛基的尼德霍格覺醒會全回復並恢復其他技能次數，連放幾次就打不倒） */
      if (isBoss && d && d.bossUltCap && r) r.skills.forEach(k => { if (k.ultimate && k.maxPP > d.bossUltCap) { k.maxPP = d.bossUltCap; k.pp = Math.min(k.pp, d.bossUltCap); } });
      /* bossFix：同一章有好幾位 BOSS 時（巨人篇的神之騎士團對決＋洛基），只針對某一位微調：hp 倍率、atk/def/spd 階級增減、dmg 傷害倍率 */
      const fx = isBoss && d && d.bossFix && r && d.bossFix[r.id];
      if (fx) { if (fx.hp) { r.maxHp = Math.round(r.maxHp * fx.hp); r.hp = r.maxHp; } ['atk', 'def', 'spd'].forEach(k => { if (fx[k]) r.buffs[k] = Math.max(-6, Math.min(6, (r.buffs[k] || 0) + fx[k])); }); if (fx.dmg) r.__dmgB = (r.__dmgB || 1) * fx.dmg; }
      return r;
    };
  }
})();
