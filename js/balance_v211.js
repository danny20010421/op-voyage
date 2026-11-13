/* v211（使用者 11/14 01:51）：青雉、大和在 v210 狀態改版後勝率偏低（39.4%、42.2%），提高技能威力、倍率與冰凍機率。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const G = (id, n, f) => { const c = CHARACTERS[id], s = c && c.skills.find(x => x.name === n); if (s) f(s, s.effect || (s.effect = {})); };
  const up = (s, k) => { if (s.power) s.power = Math.round(s.power * k); };
  /* 青雉：v213 撤回（v211 的模擬沒算進冰凍無法行動，青雉其實偏強），改由 balance_v213.js 調 statScale */
  /* 大和 */
  G('yamato', '無侍冰牙', (s, e) => { e.perHitPower = 70; e.extraIceChance = .4; s.desc = (s.desc || '').replace('30% 機率附加冰凍傷害', '40% 機率附加冰凍傷害'); });
  G('yamato', '雷鳴八卦', (s, e) => { up(s, 1.15); e.jackpotChance = .2; s.desc = (s.desc || '').replace('15% 機率打出 10 倍傷害', '20% 機率打出 10 倍傷害'); });
  G('yamato', '鏡山', s => up(s, 1.15));
  G('yamato', '大口真神形態', (s, e) => { e.freezeChance = .85; s.desc = (s.desc || '').replace('70% 使對手冰凍', '85% 使對手冰凍'); });
})();
