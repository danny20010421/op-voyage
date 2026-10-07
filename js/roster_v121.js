/* v121：美音（歌姬・SSR・控制攻擊型）——只能從「歌姬挑戰」取得碎片（每首不同的歌第一次拿到 S 以上 → 20 片，集滿 100 片合成），無法抽獎。
   序號：紅髮海賊團第 1 位（必須在 roster_v91 之前載入）。戰鬥效果 noteBurst、utaStunBonus、utaDemon 在 ext_v121.js；第 1～4 招動畫在 fx_v121.js。
   戰鬥立繪縮放 0.6；第 5 招「召喚魔王」後換成魔王型態立繪（縮放 0.75＝0.6 × 1.25）。 */
(function () {
  const V = 121, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  CHARACTERS.uta = { id: 'uta', name: '美音', title: '歌姬', types: ['超能'], scale: .95, worldScale: 1, battleScale: .6, ai: 'balanced',
    image: `assets/chars/uta.webp?v=${V}`, avatar: `assets/chars/uta_face.webp?v=${V}`, ultimateBg: `assets/chars/uta_totmusica.webp?v=${V}`, cardPos: '50% 14%', cardFocus: '50% 16%',
    maxHp: 1580, baseSpeed: 118, statScale: 1.06, role: '控制攻擊型',
    desc: '紅髮傑克斯的女兒，被全世界喜愛的歌姬。吃下歌歌果實，能把聽到歌聲的人拉進「歌之世界」；在歌聲的盡頭，沉睡著傳說中的魔王「Tot Musica」。',
    skills: [
      S('歌聲催眠', 'support', 5, 0, '唱出催眠的歌聲：對手暈眩 1 回合，對手身上由技能施放的效果（減傷、無敵、閃避、反彈、再生、增傷等）全部消失，並清除對手的能力提升。', [['暈眩', 'gold'], ['解除效果', 'blue'], ['清除強化', 'blue']], 'voice',
        { stunChance: 1, stunTurns: 1, clearEnemyTimed: true, clearBuffs: true }),
      S('五線譜束縛', 'attack', 5, 10, '這回合先出招，五線譜纏住對手，使對手這回合的攻擊無效；接著承受 5～30 次音符攻擊，每一次音符有 10% 機率爆炸，額外造成 10% 最大體力的傷害。', [['先制', 'gold'], ['無效', 'blue'], ['連擊', 'red'], ['爆炸', 'red']], 'barrage',
        { firstStrike: true, invulnTurns: 1, multiHitNormal: [5, 30], perHitPower: 11, noteBurst: [.1, .1] }),
      S('具現化攻擊', 'attack', 10, 22, '防禦 +1，把歌聲具現化成音符攻擊對手 5～10 次；造成傷害的 10% 回復自身體力，20% 機率使對手暈眩 1 回合。', [['強化', 'gold'], ['連擊', 'red'], ['吸血', 'green'], ['暈眩', 'gold']], 'barrage',
        { selfBuffDef: 1, multiHitNormal: [5, 10], perHitPower: 22, lifesteal: .1, stunChance: .2, stunTurns: 1 }),
      S('歌之世界', 'attack', 5, 110, '把對手拉進歌歌果實的夢境「歌之世界」：造成傷害，對手攻擊 -1、速度 -1（2 回合），之後 3 回合每回合結束時受到 5% 最大體力的傷害。對手正在暈眩時，傷害 ×1.6。', [['降攻', 'blue'], ['降速', 'blue'], ['持續傷害', 'red'], ['暈眩追擊', 'gold']], 'voice',
        { enemyAtkDownChance: [[1, 1], 1, 2], enemySpdDownTemp: [1, 2], dotTurns: 3, dotRatio: .05, dotLabel: '歌之世界', utaStunBonus: 1.6 }),
      S('召喚魔王', 'support', 1, 0, '奧義。唱出禁忌之歌，召喚魔王「Tot Musica」（立繪變為魔王型態）。之後美音體力歸 0 時，會以 50% 體力復活一次：復活後全能力 +1、解除自身能力下降與負面狀態，這回合與下回合受到攻擊時反彈 25% 傷害；而且之後對手每次對美音造成傷害，對手自己會被扣除當下體力的 10～20%。只能使用 1 次（藥水無法恢復）。', [['奧義', 'gold'], ['變身', 'gold'], ['復活', 'green'], ['反彈', 'gold'], ['詛咒', 'red']], 'awaken',
        { formImage: { image: `assets/chars/uta_totmusica.webp?v=${V}`, scale: 1.25, turns: 999, label: '魔王型態' }, utaDemon: { revive: .5, thorn: .25, thornTurns: 2, curse: [.1, .2] }, noRestore: true }, true)
    ] };
  if (!CHARACTER_ORDER.includes('uta')) CHARACTER_ORDER.push('uta');
  CHAR_RARITY.uta = 'SSR';
  CHAR_OBTAIN.uta = { boss: 0, eventOnly: true, npc: '歌姬挑戰：每首不同的歌第一次拿到 S 以上評分得 20 片碎片，集滿 100 片合成（無法抽獎）' };
})();
