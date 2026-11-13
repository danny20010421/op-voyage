/* v211（使用者 11/14 01:51）：青雉、大和在 v210 狀態改版後勝率偏低（39.4%、42.2%），提高技能威力、倍率與冰凍機率。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const G = (id, n, f) => { const c = CHARACTERS[id], s = c && c.skills.find(x => x.name === n); if (s) f(s, s.effect || (s.effect = {})); };
  const up = (s, k) => { if (s.power) s.power = Math.round(s.power * k); };
  /* 青雉 */
  G('aokiji', '冰凍時刻', s => up(s, 1.15));
  G('aokiji', '冰刀', (s, e) => { e.perHitPower = 65; e.extraIceChance = .35; s.desc = (s.desc || '').replace('25% 附加冰凍傷害', '35% 附加冰凍傷害'); });
  G('aokiji', '兩棘矛', (s, e) => { up(s, 1.15); e.freezeChance = .6; e.frozenBonusMult = [1.6, 2.2]; s.desc = (s.desc || '').replace('50% 使對手冰凍', '60% 使對手冰凍').replace('1.5～2 倍', '1.6～2.2 倍'); });
  G('aokiji', '暴雉嘴', (s, e) => { e.randomMultiplierRange = [4, 7]; e.freezeChance = .5; s.desc = (s.desc || '').replace('3～6 倍', '4～7 倍').replace('40% 使對手冰凍', '50% 使對手冰凍'); });
  /* 大和 */
  G('yamato', '無侍冰牙', (s, e) => { e.perHitPower = 70; e.extraIceChance = .4; s.desc = (s.desc || '').replace('30% 機率附加冰凍傷害', '40% 機率附加冰凍傷害'); });
  G('yamato', '雷鳴八卦', (s, e) => { up(s, 1.15); e.jackpotChance = .2; s.desc = (s.desc || '').replace('15% 機率打出 10 倍傷害', '20% 機率打出 10 倍傷害'); });
  G('yamato', '鏡山', s => up(s, 1.15));
  G('yamato', '大口真神形態', (s, e) => { e.freezeChance = .85; s.desc = (s.desc || '').replace('70% 使對手冰凍', '85% 使對手冰凍'); });
})();
