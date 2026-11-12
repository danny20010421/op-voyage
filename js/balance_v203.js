/* v203（使用者 11/12 20:49）：
   ① 艾涅爾「全方面提升攻擊傷害與效果」——數值依 tests/tier-sim.js 量測，同稀有度（SSR）平均勝率維持在 44～58%（DEC-035）。
   ② 洛克斯：蝕 威力 320 → 140；殺 威力 125 → 180（使用者指定）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const get = (id, n) => { const c = CHARACTERS[id]; return c && c.skills.find(s => s.name === n); };
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  /* ── 艾涅爾 ── */
  { const s = get('enel', '放電'); if (s) { Object.assign(s.effect, { randomPower: [85, 320] }); s.desc = '放出雷電，造成威力 85～320 的隨機傷害。'; } }
  { const s = get('enel', '電療'); if (s) { Object.assign(s.effect, { healRange: [.32, .52] }); s.desc = (s.desc || '').replace(/30～50%|30%～50%/, '32～52%'); } }
  { const s = get('enel', '電光'); if (s) { s.power = 135; Object.assign(s.effect, { paralyzeChance: .12, paralyzeTurns: 1 }); s.desc = '以雷光直擊對手（威力 135），消除對手的能力提升與自身的異常狀態，12% 機率使對手麻痺 1 回合。'; tag(s, '麻痺', 'gold'); } }
  { const s = get('enel', '神之制裁'); if (s) { Object.assign(s.effect, { executeChance: .12 }); s.desc = (s.desc || '').replace(/10%/, '12%'); } }
  { const s = get('enel', '二億伏特·雷神'); if (s) { s.power = 120; Object.assign(s.effect, { randomMultiplierRange: [10, 26], damageReductionValue: .3 }); s.desc = '給予對手 10～26 倍傷害，下回合受到的傷害 -30%。'; } }
  /* ── 洛克斯 ── */
  { const s = get('rocks', '蝕'); if (s) { s.power = 140; s.desc = (s.desc || '').replace(/威力\s*320/, '威力 140'); } }
  { const s = get('rocks', '殺'); if (s) { s.power = 180; s.desc = (s.desc || '').replace(/威力\s*125/, '威力 180'); } }
})();
