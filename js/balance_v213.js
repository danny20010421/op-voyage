/* v213（使用者 11/14 02:47）：依全角色勝率（對全部 83 位角色，不含伊姆）調整，只改 statScale。
   白星 45% → 約 60%、青雉 80% → 約 56%（並撤回 v211 的技能強化）、莫內 59% → 約 47%、軍子宮 50% → 約 54%。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const S = { shirahoshi: 1.185, aokiji: 1.17, monet: 1.135, gunko: .72 };
  Object.entries(S).forEach(([id, v]) => { if (CHARACTERS[id]) CHARACTERS[id].statScale = v; });
})();
