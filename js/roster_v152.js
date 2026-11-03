/* v152：神之騎士團——曼麥亞・軍子宮（SSR）與費加蘭德・夏姆洛克聖（SSR，團長）。巨人篇的兩位 BOSS（使用者 11/03 設計，夏姆洛克第 1、3、4 招由 Claude 設計並經示意圖確認）。
   取得方式：限定「神之騎士團」抽獎池（使用者 11/03：暫時不開放、不規劃），所以目前只出現在巨人篇劇情，不會出現在一般懸賞召喚。
   立繪縮放：軍子 0.6（第 5 招黑轉支配變身 0.8，維持 2 回合，並播放「黑轉支配」全畫面背景演出約 4 秒）；夏姆洛克 0.65（第 5 招身後出現地獄三頭犬 1.2，鏡射，3 回合）。
   新效果（ext_v152.js）：fixedDot、sureHit、lowHpBonus、gunkoAfter、bgCutin、cerberus。必須在 roster_v91 之前載入。 */
(function () {
  const V = 152, S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const img = n => `assets/chars/${n}.webp?v=${V}`;
  CHARACTERS.gunko = { id: 'gunko', name: '曼麥亞・軍子宮', title: '神之騎士團', types: ['超能'], scale: 1, worldScale: 1, battleScale: .6, ai: 'balanced',
    image: img('gunko'), avatar: img('gunko_face'), ultimateBg: img('gunko_dark'), cardPos: '50% 12%', cardFocus: '50% 14%',
    maxHp: 1500, baseSpeed: 122, statScale: 1.02, role: '控制攻擊型',
    desc: '世界貴族「天龍人」曼麥亞家族的一員，隸屬「神之騎士團」。箭箭果實能力者，能把箭頭標誌變成實體，施展由箭矢構成的攻擊與特效。',
    skills: [
      S('矢印緣', 'attack', 10, 0, '箭矢強烈攻擊 3 次，對手接下來 3 回合每回合受到 300～1000 點傷害；對手下一回合攻擊軍子時，20% 傷害反彈回對手身上。', [['連擊', 'red'], ['持續傷害', 'red'], ['反彈', 'blue']], 'barrage',
        { multiHitNormal: [3, 3], perHitPower: 46, fixedDot: { turns: 3, range: [300, 1000], label: '矢印' }, thornTurns: 2, thornRatio: .2 }),
      S('自動追蹤', 'attack', 4, 70, '射出會自動追蹤的箭頭條帶（必中，無法閃避）：對手速度 -1、清除對手的能力提升，50% 機率使對手恐懼；軍子下回合的傷害 1.5～3 倍。', [['必中', 'gold'], ['降速', 'blue'], ['清除強化', 'blue'], ['恐懼', 'gold'], ['增傷', 'red']], 'barrage',
        { sureHit: true, enemySpdDownTemp: [1, 3], clearBuffs: true, fearChance: .5, fearTurns: 1, nextAttackMult: [1.5, 3], nextAttackMultTurns: 1 }),
      S('肢體強化', 'support', 5, 0, '全能力 +1，消除自身的弱化與能力下降，並獲得當前體力 25% 的護盾。', [['強化', 'gold'], ['淨化', 'green'], ['護盾', 'green']], 'aura',
        { statUpAll: 1, clearSelfDebuffs: true, selfShieldCurrentHpRatio: .25 }),
      S('革命舞曲・突刺', 'attack', 10, 120, '無視護盾，直接攻擊對手要害：對手防禦 -2（3 回合），10% 機率秒殺（BOSS 改為 3 倍傷害）。', [['無視護盾', 'red'], ['破防', 'blue'], ['秒殺', 'red']], 'slash',
        { ignoreShield: true, enemyDefDownTemp: [2, 3], executeChance: .1 }),
      S('黑轉支配', 'support', 2, 0, '奧義。轉換為黑轉型態（立繪變身 2 回合）：全能力 +2、恢復 50% 體力，接下來 3 回合攻擊 5～20 倍，無敵 2 回合；無敵結束後 3 回合受到的傷害 -35%，而且受到攻擊時有 30% 機率以 2～3 倍反彈。', [['奧義', 'gold'], ['變身', 'gold'], ['無敵', 'gold'], ['增傷', 'red'], ['減傷', 'green'], ['反彈', 'blue']], 'awaken',
        { formImage: { image: img('gunko_dark'), scale: .8 / .6, turns: 2, label: '黑轉支配' }, statUpAll: 2, healRatio: .5, damageMultTurns: 3, damageMultRange: [5, 20], invulnTurns: 2,
          gunkoAfter: { wait: 2, dr: .35, turns: 3, chance: .3, mult: [2, 3] }, bgCutin: { image: img('gunko_cutin'), ms: 4200, title: '黑轉支配', sub: '曼麥亞・軍子宮' }, noRestore: true }, true)
    ] };
  CHARACTERS.shamrock = { id: 'shamrock', name: '費加蘭德・夏姆洛克聖', title: '神之騎士團團長', types: ['格鬥'], scale: 1, worldScale: 1, battleScale: .65, ai: 'aggressive',
    image: img('shamrock'), avatar: img('shamrock_face'), ultimateBg: img('shamrock'), cardPos: '50% 10%', cardFocus: '50% 12%',
    maxHp: 1650, baseSpeed: 112, statScale: 1.05, role: '攻擊型',
    desc: '世界貴族「天龍人」，神之騎士團團長、前神之騎士團最高司令官五老星費加蘭德・賈林各聖的兒子。四皇「紅髮」的雙胞胎哥哥，配刀「塞博拉斯」。',
    skills: [
      /* v154：使用者 11/03「夏姆洛克要偏向攻擊型，而非生存型」——五招都改成以輸出為主 */
      S('霸王纏刃', 'attack', 10, 135, '纏上霸王色的強烈斬擊，必中、無視護盾；30% 機率使對手恐懼 1 回合，命中時 50% 機率清除對手的能力提升。', [['必中', 'red'], ['無視護盾', 'red'], ['恐懼', 'gold'], ['清除強化', 'blue']], 'slash',
        { sureHit: true, ignoreShield: true, fearChance: .3, fearTurns: 1, clearBuffsChance: .5 }),
      S('不死之身', 'support', 3, 0, '不死的肉體：恢復 25% 體力並解除自身的負面狀態；攻擊 +2，接下來 2 回合的下一次攻擊威力 ×1.6。', [['回復', 'green'], ['淨化', 'green'], ['強化', 'gold']], 'aura',
        { healRatio: .25, clearSelfDebuffs: true, selfBuffAtk: 2, nextAttackMult: 1.6, nextAttackMultTurns: 2 }),
      S('天龍人的威壓', 'attack', 6, 110, '天龍人的霸氣壓下對手，無視護盾；對手防禦 -2（3 回合）、攻擊 -1（3 回合），自身攻擊 +1。', [['無視護盾', 'red'], ['降防', 'blue'], ['降攻', 'blue'], ['強化', 'gold']], 'haki',
        { ignoreShield: true, enemyDefDownChance: [1, [2, 2], 3], enemyAtkDownChance: [[1, 1], 1, 3], selfBuffAtk: 1 }),
      S('雙生之影', 'attack', 6, 0, '紅髮的雙胞胎哥哥揮出連續斬擊 3～5 次；對手體力越低傷害越高（最多 2.5 倍），吸收造成傷害的 15% 回復體力。', [['連擊', 'red'], ['斬殺', 'red'], ['吸血', 'green']], 'slash',
        { multiHitNormal: [3, 5], perHitPower: 48, lowHpBonus: 2.5, lifestealRange: [.15, .15] }),
      S('地獄三頭犬', 'attack', 2, 0, '奧義。揮出配刀「塞博拉斯」，身後出現地獄三頭犬（3 回合）：強烈攻擊 3 次；三頭犬在場的每回合，夏姆洛克攻擊 +2，對手額外受到 500～1200 點傷害，20% 機率陷入恐懼。', [['奧義', 'gold'], ['召喚', 'gold'], ['連擊', 'red'], ['強化', 'gold'], ['恐懼', 'gold']], 'slash',
        { multiHitNormal: [3, 3], perHitPower: 80, cerberus: { turns: 3, regen: 0, statUp: 0, atkUp: 2, dmg: [500, 1200], fear: .2, image: img('shamrock_cerberus'), scale: 1.2 }, noRestore: true }, true)
    ] };
  ['gunko', 'shamrock'].forEach(id => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); CHAR_RARITY[id] = 'SSR';
    CHAR_OBTAIN[id] = { boss: 0, eventOnly: true, npc: '限定「神之騎士團」抽獎池（尚未開放）；目前只會在巨人篇劇情中以 BOSS 登場' }; });

  /* 巨人篇：「巨人們的認可」之後、前往冥界之前，插入兩場 BOSS 對決（第 7、8 步；舊存檔由 app.js chState 的 v152 轉換往後移） */
  const G = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'giant'), L = (w, t, x) => x ? [w, t, x] : [w, t];
  if (G && !G.steps.some(s => s.enemy === 'gunko')) {
    if (!G.npcs.some(n => n.id === 'gunko_n')) G.npcs.push({ id: 'gunko_n', name: '軍子', role: '神之騎士團', look: 'gunko', pos: [-192, -52], chat: ['……巨人族的村子，也該清理一下了。', '這是聖地的命令。'] });
    if (!G.npcs.some(n => n.id === 'shamrock_n')) G.npcs.push({ id: 'shamrock_n', name: '夏姆洛克', role: '神之騎士團團長', look: 'shamrock', pos: [6, 52], chat: ['……那張臉，你在想誰？', '我和那個男人，不一樣。'] });
    const g = G.steps.findIndex(s => s.type === 'goto'), at = g < 0 ? G.steps.length - 1 : g;
    G.steps.splice(at, 0,
      { type: 'duel', npc: 'gunko_n', enemy: 'gunko', bossDuel: true, title: '神之騎士團來襲', desc: '天空出現了巨大的箭頭標誌——神之騎士團的軍子降臨在陽界的西邊村。在她破壞村子之前擊敗她！', reward: 3,
        lines: [L(null, '天空突然裂開，一道巨大的箭頭標誌劃過西邊村的屋頂。', { fx: 'flash' }), L('gunko_n', '……巨人族、還有混進來的海賊。'), L('gunko_n', '我是神之騎士團的軍子。奉聖地之命，清除這座島上的「不穩定因素」。', { emo: '…' }), L('dorry', '葛基基基……想在艾爾巴夫撒野？小戰士，讓她看看我們的骨氣！')],
        after: [L('gunko_n', '……不可能……被這種人……'), L(null, '軍子化為一道箭矢消失在天空中。'), L('hajrudin', '神之騎士團……那傢伙不會是一個人來的。冥界的入口——快去！')] },
      { type: 'duel', npc: 'shamrock_n', enemy: 'shamrock', bossDuel: true, title: '神之騎士團團長', desc: '冥界入口的吊橋下，站著一個和紅髮長得一模一樣的男人——神之騎士團團長夏姆洛克。擊敗他，才能前往鎖住王子的鎖鏈。', reward: 4,
        lines: [L(null, '吊橋下的陰影裡，一個紅髮的男人慢慢轉過身。', { fx: 'shake' }), L('shamrock_n', '……你的眼神，像是看見了什麼不該看的東西。'), L('shamrock_n', '我是費加蘭德・夏姆洛克，神之騎士團團長。至於我那個弟弟——跟我無關。'), L('shamrock_n', '想見洛基？先過塞博拉斯這一關。', { emo: '💢' })],
        after: [L('shamrock_n', '……有意思。難怪那傢伙會把賭注押在你們這種人身上。'), L(null, '夏姆洛克收起配刀，身影消失在冥界的黑暗中。'), L(null, '吊橋另一端，傳來鎖鏈拖動的聲音……')] });
  }
})();
