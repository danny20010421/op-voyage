/* v115：燼（炎災，SSR・防禦速度型）——2026 年 10 月月費限定、和之國篇小 BOSS；限定皮膚「萬聖之燼」（2026 年 10 月月費）。
   必須在 roster_v91 之前載入（序號：百獸海賊團第 1 位）。戰鬥效果 ppUpRandom、kingFlame 在 ext_v115.js。 */
(function () {
  const V = 115, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  CHARACTERS.king = { id: 'king', name: '燼', title: '炎災', types: ['火', '獸'], scale: .95, worldScale: 1.05, battleScale: 1.1, ai: 'balanced',
    image: `assets/chars/king.webp?v=${V}`, avatar: `assets/chars/king_face.webp?v=${V}`, ultimateBg: `assets/chars/king.webp?v=${V}`, cardPos: '50% 38%', cardFocus: '49% 30%',
    maxHp: 1880, baseSpeed: 114, statScale: 1.035, role: '防禦速度型',
    desc: '百獸海賊團「大看板」之一，傳說中的露娜莉亞族倖存者。背上燃起火焰時刀槍不入；火焰熄滅時，又能化為無齒翼龍以極速飛行。',
    skills: [
      S('刃里双皇', 'attack', 10, 16, '揮出燃燒的刀刃，對敵人進行 5～20 次火焰攻擊，並使對手燒傷 2 回合。', [['連擊', 'red'], ['燒傷', 'red']], 'barrage', { multiHitNormal: [5, 20], perHitPower: 16, burnChance: 1, burnTurns: 2 }),
      S('丹弓皇', 'attack', 6, 125, '速度 +2，並對敵人進行強力攻擊，造成傷害的 50% 回復自身體力。', [['強化', 'gold'], ['吸血', 'green']], 'flame', { selfBuffSpd: 2, lifestealRange: [.5, .5] }),
      S('貂自尊皇', 'attack', 5, 100, '防禦 +2，並對敵人進行爆炸攻擊，造成 2～3 倍傷害（無視護盾）。', [['強化', 'gold'], ['爆發', 'red'], ['破盾', 'blue']], 'burn', { selfBuffDef: 2, randomMultiplierRange: [2, 3], ignoreShield: true }),
      S('露娜莉亞族的驕傲', 'support', 3, 0, '回復 50% 體力，解除自身的異常狀態與負面能力，並讓隨機兩個技能的使用次數 +2（奧義除外）。', [['回復', 'green'], ['淨化', 'blue'], ['回復次數', 'gold']], 'haki', { healRatio: .5, clearSelfDebuffs: true, ppUpRandom: [2, 2] }),
      S('火龍皇', 'attack', 2, 100, '奧義。化身無齒翼龍，全身燃起露娜莉亞之火俯衝：造成 2.5～3.5 倍火焰傷害，使對手燒傷 3 回合。之後 3 回合背上的火焰燃燒：受到的傷害 -25%，攻擊者會被火焰反灼 20% 的傷害；火焰熄滅時速度 +2。', [['奧義', 'gold'], ['燒傷', 'red'], ['減傷', 'blue'], ['反彈', 'gold']], 'burn',
        { randomMultiplierRange: [2.5, 3.5], burnChance: 1, burnTurns: 3, kingFlame: { turns: 3, reduce: .25, thorn: .2, spdOnOut: 2 } }, true)
    ] };
  if (!CHARACTER_ORDER.includes('king')) CHARACTER_ORDER.push('king');
  CHAR_RARITY.king = 'SSR';
  CHAR_OBTAIN.king = { boss: 0, eventOnly: true, monthCard: '2026-10', npc: '2026 年 10 月月費限定・和之國篇 小 BOSS' };
  if (typeof COLLECTION_SETS !== 'undefined') { const b = COLLECTION_SETS.find(s => s.id === 'beasts' || /百獸/.test(s.name || '')); if (b && !b.members.includes('king')) b.members.push('king'); }
  /* 限定皮膚：萬聖之燼（只能從 2026 年 10 月月費取得，不能用寶藏幣購買、不在皮膚選擇卷內） */
  if (typeof SKINS !== 'undefined') SKINS.king_halloween = { char: 'king', name: '萬聖之燼', image: `assets/chars/king_skin1.webp?v=${V}`, avatar: `assets/chars/king_skin1_face.webp?v=${V}`, battleScale: 1.1, monthCard: '2026-10', how: '2026 年 10 月月費限定（購買月費即可獲得）' };
  /* 和之國篇：鬼之島屋頂的決戰之前，新增小 BOSS「炎災」燼（第 11 步；舊存檔由 app.js chState 的 v115 轉換往後移） */
  const W = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'wano');
  if (W && !W.steps.some(s => s.enemy === 'king')) {
    if (!W.npcs.some(n => n.id === 'king_n')) W.npcs.push({ id: 'king_n', name: '燼', role: '百獸海賊團・大看板', look: 'king', pos: [-14, -30], chat: ['……凱多先生的夢想，由我來守護。', '露娜莉亞族的火焰，不會輕易熄滅。'] });
    const b = W.steps.findIndex(s => s.type === 'boss'), L = (w, t) => [w, t];
    W.steps.splice(b < 0 ? W.steps.length - 1 : b, 0, { type: 'duel', npc: 'king_n', enemy: 'king', title: '大看板「炎災」', desc: '百獸海賊團大看板「炎災」燼擋在屋頂的入口前。擊敗他，前往屋頂與凱多決戰。', reward: 3,
      lines: [L('king_n', '……你們就是闖進鬼之島的傢伙？'), L('king_n', '我是百獸海賊團大看板，「炎災」燼。凱多先生所在的屋頂，誰都別想踏上去！')],
      after: [L('king_n', '……背上的火……竟然被壓下去了……'), L(null, '燼的火焰暫時黯淡下來。通往屋頂的路打開了——凱多就在上面。')] });
  }
})();
