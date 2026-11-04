/* v161 四皇平衡微調（使用者 11/04：紅髮拉回 UR+ 戰力區間但仍是四皇裡的強者；剋制組合勝率拉近；保留每位的招牌機制，只調體質、倍率、機率）。
   量測：tests/tier-sim.js（LV81）四皇互打與全角色循環賽，見 /root/promo/v160/table_v160.md 的 v161 一節。必須在 balance_v160.js 之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, name) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === name); };
  /* 體質：紅髮 1.35 → 1.2（綜合戰力約 1840 → 約 1780；壓到 1720 以下會變成四皇裡最弱，見報告）；BIG MOM 1.04 → 1.08；凱多 1.0 → 0.97；尼卡魯夫 1.12 → 1.16 */
  const STAT_V161 = { shanks: 1.2, bigmom: 1.08, kaido: 0.97, luffy_nika: 1.16 };
  Object.entries(STAT_V161).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
  /* 黑鬍子對 BIG MOM 原本 97%：比例傷害與護盾對高體力角色太強。保留黑暗印記、暗殺與吸收，只調倍率與機率 */
  const g = get('blackbeard', '引力吸入');
  if (g && g.effect.dotRatio) { g.effect.dotRatio = .06; g.desc = g.desc.replace('每回合扣 10% 體力', '每回合扣 6% 體力'); }
  const r = get('blackbeard', '解放');
  if (r) { r.effect.lostHpCapMax = .25; r.effect.selfShieldCurrentHpRatio = .05; if (r.effect.markBonus) r.effect.markBonus.exec = .15;
    r.desc = r.desc.replace('最多對手最大體力 35%', '最多對手最大體力 25%').replace('自身目前體力 10% 的護盾', '自身目前體力 5% 的護盾').replace('25% 機率直接秒殺', '15% 機率直接秒殺'); }
  if (window.BALANCE_V156) { Object.assign(window.BALANCE_V156.stat, STAT_V161); window.BALANCE_V161 = { stat: STAT_V161 }; }
})();
