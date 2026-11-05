/* v164 新角色（使用者 11/06 提供立繪與招式名）：
   ・斯科帕・賈巴（gaban，UR，「海賊王左手」，攻擊型，立繪 0.75）：招式名照使用者給的「雙斧流、神門、斧天樂、螳螂斧法、八千梟帥」，效果由 Claude 設計。
   ・西爾巴斯・雷利（rayleigh，UR，「海賊王右手」，攻擊型，立繪 0.7）：五招名稱與效果由 Claude 依原作設計（霸氣斬擊、見聞色、霸王色、鍍膜、奧義）。
     兩人強度：使用者指定「設定在 SSR 中屬於頂尖水平」——稀有度標 UR，但綜合戰力放在 SSR 頂尖～UR 下緣（約 1540～1560，不碾壓四皇），數值見 balance_v164.js。
   ・巴托洛米奧（bartolomeo，SR，「魯夫迷弟」，防禦中斷型，立繪 0.65）：1～4 招由 Claude 設計（屏障防禦＋打斷對手），
     第 5 招「屏障·絕對防禦」照使用者指定（效果欄位 bartoBarrier 在 ext_v164.js）。
   取得：三位都是限定抽獎池角色（CHAR_OBTAIN.eventOnly，不會出現在一般懸賞召喚）。限定池「海賊王左右手」（賈巴、雷利）與「魯夫迷弟」（巴托洛米奧）
     先建好放進 EVENT_POOLS，但還沒排 EVENT_CALENDAR 檔期——沒有檔期的池子不會出現在召喚畫面的分頁，排檔後才會開放；目前由月費取得（vip_v115.js）。
   皮膚：gaban_skin1「揮金如土」、rayleigh_skin1「價格斬殺」（2026 年 11 月月費）、bartolomeo_skin1「極夜聖誕」（2026 年 12 月月費，使用時防禦 +2%：SKINS.bonus.def，ext_v164.js）。
     皮膚的發放由 vip_v115.js（MC.skins）處理。
   巨人篇：劇情原本沒有賈巴的 NPC，這裡在艾爾巴夫陽界西邊村港口（多利旁邊，世界座標 [-220, 20]）加一位只會聊天的 NPC（look:'gaban'，名牌與頭像用新立繪），不增減任務步驟。
   必須在 roster_v91 之前載入（序號／圖鑑順序由 codex_order_v164.js 決定）。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const V = 164, img = n => `assets/chars/${n}.webp?v=${V}`;
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => Object.assign({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect: effect || {} }, ult ? { ultimate: true } : {});
  const base = (id, name, title, types, battleScale, extra) => Object.assign({ id, name, title, types, scale: 1, worldScale: 1, battleScale, ai: 'aggressive', image: img(id), avatar: img(id + '_face'), ultimateBg: img(id) }, extra);

  CHARACTERS.gaban = base('gaban', '斯科帕・賈巴', '海賊王左手', ['格鬥'], .75, {
    maxHp: 1720, baseSpeed: 114, statScale: 1, role: '攻擊型', cardPos: '50% 20%', cardFocus: '49% 28%',
    desc: '羅傑海賊團的戰鬥員，和雷利並稱「海賊王的左右手」。雙手各握一把巨斧，力氣大到能和巨人正面角力。羅傑死後隱居多年，在艾爾巴夫再次現身。',
    skills: [
      S('雙斧流', 'attack', 10, 0, '左右兩把巨斧交替劈下 2～3 次；命中後 30% 機率讓對手防禦 -1（3 回合）。', [['連擊', 'red'], ['降防', 'blue']], 'sandslash',
        { multiHitNormal: [2, 3], perHitPower: 130, enemyDefDownChance: [.3, [1, 1], 3] }),
      S('神門', 'attack', 6, 260, '雙斧纏上霸氣，像關上神殿大門一樣從兩側夾斬：無視護盾並打破護盾；30% 機率使對手暈眩 1 回合。', [['強力', 'red'], ['無視護盾', 'red'], ['破盾', 'red'], ['暈眩', 'gold']], 'ashura',
        { ignoreShield: true, shieldBreak: true, stunChance: .3, stunTurns: 1 }),
      S('斧天樂', 'support', 3, 0, '敲響雙斧，打得越久越開心：攻擊 +2、速度 +1、回復 20% 體力並解除自身的異常狀態與負面能力；接下來 2 回合的下一次攻擊威力 ×1.6。', [['強化', 'gold'], ['回復', 'green'], ['淨化', 'green'], ['下一擊', 'red']], 'awaken',
        { selfBuffAtk: 2, selfBuffSpd: 1, healRatio: .2, clearSelfDebuffs: true, nextAttackMult: 1.6, nextAttackMultTurns: 2 }),
      S('螳螂斧法', 'attack', 6, 0, '像螳螂揮動雙鐮，貼身連續揮斧 4～6 次；對手體力越低傷害越高（最多 1.8 倍），30% 機率使對手破防 2 回合。', [['連擊', 'red'], ['斬殺', 'red'], ['破防', 'gold']], 'shishi',
        { multiHitNormal: [4, 6], perHitPower: 75, lowHpBonus: 1.8, armorBreakChance: .3, armorBreakTurns: 2 }),
      S('八千梟帥', 'attack', 2, 280, '奧義。雙斧纏上霸王色，掀起八千道斬擊的風暴：造成 3～4.2 倍傷害，必中、無視護盾，並清除對手的能力提升；40% 機率使對手恐懼 1 回合。', [['奧義', 'gold'], ['強力', 'red'], ['必中', 'red'], ['無視護盾', 'red'], ['清強化', 'blue'], ['恐懼', 'gold']], 'sanzen',
        { randomMultiplierRange: [3, 4.2], sureHit: true, ignoreShield: true, clearBuffs: true, fearChance: .4, fearTurns: 1 }, true)
    ] });

  CHARACTERS.rayleigh = base('rayleigh', '西爾巴斯・雷利', '海賊王右手', ['格鬥'], .7, {
    maxHp: 1600, baseSpeed: 126, statScale: 1, role: '攻擊型', cardPos: '50% 6%', cardFocus: '59% 7%',
    desc: '羅傑海賊團副船長，人稱「冥王」。在夏波帝諸島當鍍膜師，偶爾去賭場欠錢。教會魯夫三種霸氣，年紀雖大，一個人就能和海軍大將打成平手。',
    skills: [
      S('霸氣・纏繞斬', 'attack', 10, 210, '刀身纏上漆黑的武裝色霸氣斬下，必中；30% 機率讓對手防禦 -2（3 回合）。', [['必中', 'red'], ['降防', 'blue']], 'onigiri',
        { sureHit: true, enemyDefDownChance: [.3, [2, 2], 3] }),
      S('見聞色・預見', 'support', 4, 0, '看穿對手下一步的動作：閃避 1 回合、速度 +2；接下來 2 回合的下一次攻擊威力 ×1.6。', [['閃避', 'blue'], ['加速', 'gold'], ['下一擊', 'red']], 'aura',
        { dodgeTurns: 1, selfBuffSpd: 2, nextAttackMult: 1.6, nextAttackMultTurns: 2 }),
      S('冥王的霸王色', 'attack', 4, 160, '放出霸王色霸氣壓住對手：清除對手的能力提升、對手全能力 -1；40% 機率使對手恐懼 1 回合。', [['清強化', 'blue'], ['降能力', 'blue'], ['恐懼', 'gold']], 'haki',
        { clearBuffs: true, enemyAllDown: 1, fearChance: .4, fearTurns: 1 }),
      S('鍍膜師的手藝', 'support', 3, 0, '用鍍膜師的手法替自己包上一層膜：獲得最大體力 18% 的護盾、防禦 +2，並解除自身的異常狀態與負面能力。', [['護盾', 'green'], ['強化', 'gold'], ['淨化', 'green']], 'heal',
        { selfShieldMaxHpRatio: .18, selfBuffDef: 2, clearSelfDebuffs: true }),
      S('冥王・霸氣一閃', 'attack', 2, 0, '奧義。拔刀的一瞬間，三道纏著霸王色的斬擊同時落下：強烈攻擊 3 次、必中、無視護盾；對手體力越低傷害越高（最多 1.6 倍），40% 機率使對手恐懼 1 回合。', [['奧義', 'gold'], ['連擊', 'red'], ['必中', 'red'], ['無視護盾', 'red'], ['斬殺', 'red'], ['恐懼', 'gold']], 'sanzen',
        { multiHitNormal: [3, 3], perHitPower: 300, sureHit: true, ignoreShield: true, lowHpBonus: 1.6, fearChance: .4, fearTurns: 1 }, true)
    ] });

  CHARACTERS.bartolomeo = base('bartolomeo', '巴托洛米奧', '魯夫迷弟', ['超能'], .65, {
    maxHp: 1640, baseSpeed: 104, statScale: 1, role: '防禦中斷型', ai: 'balanced', cardPos: '50% 10%', cardFocus: '53% 13%',
    desc: '食人海賊團船長，屏障果實能力者，能張開任何攻擊都打不穿的透明屏障。魯夫的頭號粉絲，在德雷斯羅薩加入草帽大船團，說到魯夫就會感動得痛哭流涕。',
    skills: [
      S('流動防壁·階梯', 'support', 8, 0, '在腳下架起一層層屏障階梯往上跳：獲得最大體力 15% 的護盾、速度 +1，下一回合先出手。', [['護盾', 'green'], ['加速', 'gold'], ['先制', 'gold']], 'aura',
        { selfShieldMaxHpRatio: .15, selfBuffSpd: 1, selfPriority: 1 }),
      S('屏障衝擊', 'attack', 10, 130, '用屏障整面撞上去；35% 機率使對手暈眩 1 回合（打斷對手的行動），自身防禦 +1。', [['暈眩', 'gold'], ['強化', 'gold']], 'hammer',
        { stunChance: .35, stunTurns: 1, selfBuffDef: 1 }),
      S('屏障·奔牛突進', 'attack', 6, 165, '屏障變成兩隻公牛的牛角往前衝：打破對手的護盾，清除對手的能力提升；30% 機率使對手恐懼 1 回合。', [['破盾', 'red'], ['清強化', 'blue'], ['恐懼', 'gold']], 'punch',
        { shieldBreak: true, clearBuffs: true, fearChance: .3, fearTurns: 1 }),
      S('流動障壁·球拍', 'support', 4, 0, '把屏障變成一面球拍：對手下一次攻擊會被原封不動打回去（反彈 1 次），並讓對手接下來 2 回合的技能附加效果失效。', [['反彈', 'blue'], ['效果無效', 'blue']], 'aura',
        { reflectTurns: 1, reflectMultiplier: 1, nullifyEnemySkillTurns: 2 }),
      S('屏障·絕對防禦', 'support', 2, 0, '奧義。張開最堅固的屏障，無敵 2 回合：這段期間所有攻擊、負面狀態、負面能力都無效。立刻回復 50% 體力，之後 2 回合每回合再回復 5～10%；解除對手施放在自己身上的效果與對手的能力提升（也會解除對手的減傷、無敵、增傷等加成），解除自身的能力下降與負面狀態；35% 機率使對手虛弱（弱化）2 回合。可以使用 2 次。', [['奧義', 'gold'], ['無敵', 'gold'], ['免疫', 'green'], ['回復', 'green'], ['淨化', 'green'], ['清強化', 'blue'], ['虛弱', 'gold']], 'awaken',
        { invulnTurns: 2, healRatio: .5, clearSelfDebuffs: true, clearBuffs: true, clearEnemyTimed: true, weakChance: .35, weakTurns: 2, bartoBarrier: { turns: 2, regen: [.05, .1], regenTurns: 2 } }, true)
    ] });

  const NEW = { gaban: 'UR', rayleigh: 'UR', bartolomeo: 'SR' };
  Object.entries(NEW).forEach(([id, r]) => { if (!CHARACTER_ORDER.includes(id)) CHARACTER_ORDER.push(id); CHAR_RARITY[id] = r; });
  CHAR_OBTAIN.gaban = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, monthCard: '2026-11', npc: '限定抽獎池「海賊王左右手」（檔期另行公告）・2026 年 11 月月費「賈巴／雷利角色隨機卡」・巨人篇 NPC' };
  CHAR_OBTAIN.rayleigh = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, monthCard: '2026-11', npc: '限定抽獎池「海賊王左右手」（檔期另行公告）・2026 年 11 月月費「賈巴／雷利角色隨機卡」' };
  CHAR_OBTAIN.bartolomeo = { boss: 0, bossFirst: 0, bossRepeat: 0, eventOnly: true, monthCard: '2026-12', npc: '限定抽獎池「魯夫迷弟」（檔期另行公告）・2026 年 12 月月費贈送' };

  /* 皮膚（取得方式由 vip_v115.js 的月費發放；這裡只定義資料） */
  if (typeof SKINS !== 'undefined') {
    SKINS.gaban_skin1 = { char: 'gaban', name: '揮金如土', image: img('gaban_skin1'), avatar: img('gaban_skin1_face'), battleScale: .75, monthCard: '2026-11', how: '2026 年 11 月月費限定（購買月費即可獲得）' };
    SKINS.rayleigh_skin1 = { char: 'rayleigh', name: '價格斬殺', image: img('rayleigh_skin1'), avatar: img('rayleigh_skin1_face'), battleScale: .7, monthCard: '2026-11', how: '2026 年 11 月月費限定（購買月費即可獲得）' };
    SKINS.bartolomeo_skin1 = { char: 'bartolomeo', name: '極夜聖誕', image: img('bartolomeo_skin1'), avatar: img('bartolomeo_skin1_face'), battleScale: .65, monthCard: '2026-12', bonus: { def: .02 }, perk: '使用時防禦 +2%', how: '2026 年 12 月月費限定（購買月費即可獲得）・使用時防禦 +2%' };
  }

  /* 限定抽獎池（還沒排檔期，不會出現在召喚畫面；排檔＝在 data.js 的 EVENT_CALENDAR 加一筆 id:'roger_hands'／'barto_fan'）。橫幅與碎片圖為暫用合成圖 */
  if (typeof EVENT_POOLS !== 'undefined') {
    const ui = n => `assets/ui/${n}.webp?v=${V}`;
    const P = (o) => Object.assign({ amount: [[20, .6], [30, .3], [50, .1]], pity: 120, newbieFree: 10, dailyFree: 3, bountyBonus: 2, tokenCost: 1 }, o);
    if (!EVENT_POOLS.some(p => p.id === 'roger_hands')) EVENT_POOLS.push(P({ id: 'roger_hands', tab: '海賊王左右手', series: '羅傑海賊團系列', name: '羅傑海賊團系列 海賊王左右手 限定活動', banner: ui('event_banner_roger'), need: 150,
      shards: [{ char: 'rayleigh', rate: .02, icon: ui('shard_rayleigh'), color: '#d9dde6' }, { char: 'gaban', rate: .02, icon: ui('shard_gaban'), color: '#b06cff' }] }));
    if (!EVENT_POOLS.some(p => p.id === 'barto_fan')) EVENT_POOLS.push(P({ id: 'barto_fan', tab: '魯夫迷弟', series: '草帽大船團系列', name: '草帽大船團系列 魯夫迷弟 限定活動', banner: ui('event_banner_barto'), need: 100,
      shards: [{ char: 'bartolomeo', rate: .03, icon: ui('shard_bartolomeo'), color: '#7cff4f' }] }));
  }

  /* 巨人篇：賈巴的聊天 NPC（劇情原本沒有賈巴；只加 NPC、不加任務步驟） */
  const G = typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === 'giant');
  if (G && G.npcs && !G.npcs.some(n => n.id === 'gaban_n'))
    G.npcs.push({ id: 'gaban_n', name: '賈巴', role: '羅傑海賊團・海賊王左手', look: 'gaban', pos: [-220, 20], chat: ['哈哈！你就是戴著那頂草帽的小子啊。', '羅傑那傢伙……要是看到你，大概會笑得很開心吧。', '在艾爾巴夫，力氣大的人說話才算數。要比比看嗎？'] });
})();
