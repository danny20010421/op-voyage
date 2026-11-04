/* v158（使用者 11/04）：四皇的範圍＝皇帝領海 6 位＋巴基（buggy，四皇・SSR 下位）。巴基也套用 v157 規則：
   清除對手能力提升（四分五裂：碎塊四處亂飛擾亂對手）、解除自身負面（免疫斬擊，原本就有）、第 5 招以外的高傷害攻擊（四分五裂每擊 75 → 95）。
   劇情上靠運氣當上四皇，強度維持 SSR 下位（statScale 由 tests/tier-sim.js 重新求值），不能強過其他四皇。必須在 balance_v157.js 之後載入。 */
(function () {
  const C = typeof CHARACTERS !== 'undefined' && CHARACTERS.buggy; if (!C) return;
  const s = C.skills[2];
  if (s && s.effect && s.effect.multiHitNormal) {
    s.effect.perHitPower = 95; s.power = 95; s.effect.clearBuffs = true;
    s.tags = s.tags || []; if (!s.tags.some(t => t[0] === '清強化')) s.tags.push(['清強化', 'blue']);
    if (!s.desc.includes('能力提升')) s.desc = s.desc.replace(/[。]?$/, '。') + '碎塊四處亂飛擾亂對手：清除對手的能力提升。';
  }
  const h = C.skills[1]; if (h && h.effect && h.effect.clearSelfDebuffs) { h.tags = h.tags || []; if (!h.tags.some(t => t[0] === '淨化')) h.tags.push(['淨化', 'green']); }
  C.statScale = 0.86;
  if (window.BALANCE_V156) { window.BALANCE_V156.stat.buggy = C.statScale; window.BALANCE_V158 = { stat: { buggy: C.statScale } }; }
})();
