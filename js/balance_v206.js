/* v206（使用者 11/12 23:30）：喬拉可爾·密佛格（UR）要比密佛格（七武海）傷害更強、效果更多。
   數值依 tests/tier-sim.js 量測，UR 同稀有度平均勝率維持在 44～58%（DEC-035）。 */
(function () {
  if (typeof CHARACTERS === 'undefined' || !CHARACTERS.mihawk) return;
  const get = n => CHARACTERS.mihawk.skills.find(s => s.name === n);
  const tag = (s, t, c) => { s.tags = s.tags || []; if (!s.tags.some(x => x[0] === t)) s.tags.push([t, c]); };
  { const s = get('普攻'); if (s) { s.power = 95; Object.assign(s.effect, { multiHitNormal: [3, 5], perHitPower: 95 });
    s.desc = '對敵人進行 3～5 段連續揮砍攻擊。'; } }
  { const s = get('劍氣狀態'); if (s) { Object.assign(s.effect, { healRange: [.2, .5], nextAttackMult: [1.3, 1.8], nextAttackMultTurns: 2});
    s.desc = '恢復自身 20～50% 體力，下回合攻擊傷害 1.3～1.8 倍。'; } }
  { const s = get('黑刀·夜'); if (s) { s.power = 185; Object.assign(s.effect, { executeChance: .08, randomMultiplierRange: [6, 13] });
    s.desc = '揮動大刀斬擊對手，造成 6～13 倍傷害；8% 機率直接秒殺對手。'; } }
  { const s = get('洞察弱點'); if (s) { Object.assign(s.effect, { weakRange: [1.1, 1.5] });
    s.desc = '清除對手的能力提升，對手防禦 -2（2 回合），且 2 回合內受到的傷害為 1.1～1.5 倍。'; } }
  { const s = get('世界最強劍豪'); if (s) { Object.assign(s.effect, { dotSequence: [[.04, .06], [.04, .06], [.04, .06]], clearSelfDebuffs: true }); tag(s, '淨化', 'green');
    s.desc = '解除自身的異常狀態與負面能力，全能力 +1；接下來 2 回合，對手對自己的攻擊無效；對手每回合損失 4～6% 體力，最多 3 回合。'; } }
})();
/* v207：密佛格新立繪——頭像（bag_v116.js 會改成 ?v=116）與奧義背景（舊的 ?v=40）一起換新版本號，避免瀏覽器繼續用快取裡的舊圖 */
(function () { const c = typeof CHARACTERS !== 'undefined' && CHARACTERS.mihawk; if (!c) return;
  c.image = 'assets/chars/mihawk.webp?v=207'; c.avatar = 'assets/chars/mihawk_face.webp?v=207'; c.ultimateBg = 'assets/chars/mihawk.webp?v=207'; })();
