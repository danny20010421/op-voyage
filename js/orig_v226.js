/* v226（使用者 11/14 22:10）：角色陸續換成原創角色，讓遊戲趨於原創。
   這一批：基德（電磁炮）→ 司諾、貝加龐克 → 艾恩斯坦克、軍子君 → 緋亞、賈巴 → 真柒、初登場香吉士 → 厄布、初登場索隆 → 開什。
   角色 id 不變（存檔、陣容、碎片都沿用），只換名字、稱號、介紹、立繪、頭像與尺寸；厄布、開什的技能照使用者規格重寫。
   這個檔案要放在所有角色資料與介紹（content_v180 等）之後載入。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const IMG = (n) => `assets/chars/${n}.webp?v=227`; /* v227：開什換立繪、艾恩斯坦克鏡射 */
  const O = {
    kid: { name: '司諾', title: '新世代之星・磁力人', image: IMG('snow'), avatar: IMG('snow_face'), battleScale: .6,
      desc: '被磁魂之心灌輸，獲得控制磁力的能力者。是大海上被稱為「新世代強者」之一的新星。' },
    vegapunk: { name: '艾恩斯坦克', title: '世界最聰明的人', image: IMG('einstank'), avatar: IMG('einstank_face'), battleScale: .35,
      desc: '被智魂之心灌輸，獲得無限容納知識的大腦。是當今全世界最聰明的人。' },
    gunko: { name: '緋亞', title: '神之使徒', image: IMG('fia'), avatar: IMG('fia_face'), ultimateBg: IMG('fia_dark'), battleScale: .55,
      desc: '神之使徒之一，擁有不死之身與方位之心的能力，疑似是失去記憶的某國公主，真相不得而知。' },
    gaban: { name: '真柒', title: '海賊王的左右手', image: IMG('shin'), avatar: IMG('shin_face'), battleScale: .85,
      desc: '傳說中海賊王的左右手，目前隱居在巨人島上，等待著傳說中的英雄出現。與巨人族女子瑟利姆生下一子。' },
    sanji: { name: '厄布', title: '海上餐廳一流廚師', image: IMG('ebu'), avatar: IMG('ebu_face'), battleScale: .6,
      desc: '海上餐廳的一流廚師，擅長使用腿腳攻擊對手。' },
    zoro: { name: '開什', title: '三刀流海賊獵人', image: IMG('kaish'), avatar: IMG('kaish_face'), battleScale: .6,
      desc: '立志成為世界第一劍豪的海賊獵人，是個刻苦訓練的三刀流劍士。因誤會被海軍抓走虐待，被主角救出後，一同出海成為海賊。' }
  };
  Object.entries(O).forEach(([id, o]) => { const c = CHARACTERS[id]; if (!c) return; Object.assign(c, o); if (!o.ultimateBg) c.ultimateBg = o.image; });
  /* 卡片、特寫鏡頭用的臉部位置（立繪寬高的比例） */
  window.CHAR_FACE = Object.assign(window.CHAR_FACE || {}, {"assets/chars/snow.webp": [0.55, 0.11, 0.141], "assets/chars/einstank.webp": [0.453, 0.212, 0.188], "assets/chars/fia.webp": [0.518, 0.079, 0.12], "assets/chars/shin.webp": [0.555, 0.134, 0.125], "assets/chars/ebu.webp": [0.522, 0.091, 0.243], "assets/chars/kaish.webp": [0.444, 0.068, 0.148]});
  /* 緋亞第五招「黑轉支配」的晉升立繪 */
  try { CHARACTERS.gunko.skills.forEach(k => { if (k.effect && k.effect.formImage) k.effect.formImage.image = IMG('fia_dark'); }); } catch (e) { }
  const S = (name, type, pp, power, desc, tags, anima, effect, ult) => ({ name, type, pp, maxPP: pp, power, accuracy: 100, desc, tags, anima, effect, ...(ult ? { ultimate: true } : {}) });
  const sa = CHARACTERS.sanji; if (sa) { const old = sa.skills[4];
    sa.skills = [
      S('迴旋踢', 'attack', 15, 100, '旋身連踢，攻擊對手 2～5 次，40% 使對手疲憊 1 回合。', [['多段', 'red'], ['疲憊', 'gold']], 'collier', { multiHitNormal: [2, 5], perHitPower: 100, skipAttackChance: .4, ccKind: 'fatigue', skipAttackTurns: 1 }),
      S('熾腳', 'attack', 10, 150, '燃燒的腳踢出強力一擊，50% 使對手燒傷 2 回合（每回合扣 5% 體力）。', [['火焰', 'red'], ['燒傷', 'gold']], 'diable', { burnChance: .5, burnTurns: 2 }),
      S('特製便當', 'support', 5, 0, '一流廚師的料理：解除自身能力下降，恢復 30% 體力。', [['回復', 'green'], ['淨化', 'green']], 'cook', { healRatio: .3, clearSelfStages: true }),
      S('天上連環踢', 'attack', 5, 55, '自身速度 +2，並踩著空氣連續踢擊對手 10～20 次。', [['連擊', 'blue'], ['加速', 'green']], 'skywalk', { selfBuffSpd: 2, multiHitNormal: [10, 20], perHitPower: 55 }),
      Object.assign({}, old, { name: '疾風熾腳' })
    ]; }
  const zo = CHARACTERS.zoro; if (zo) { const old = zo.skills[4];
    zo.skills = [
      S('三刀流', 'attack', 15, 55, '三把刀連斬，攻擊對手 3 次，40% 使對手虛弱 2 回合。', [['三連擊', 'red'], ['虛弱', 'gold']], 'onigiri', { multiHitNormal: [3, 3], perHitPower: 55, weakChance: .4, weakTurns: 2, weakRange: [1.2, 1.4] }),
      S('獅子絕歌', 'attack', 10, 130, '瞬間拔刀的強力居合斬，50% 使對手恐懼 1 回合。', [['居合', 'blue'], ['恐懼', 'gold']], 'shishi', { skipAttackChance: .5, ccKind: 'fear', skipAttackTurns: 1 }),
      S('妖氣殘身', 'support', 6, 0, '刀身纏上妖氣：攻擊 +2，並解除自身的異常狀態。', [['強化', 'gold'], ['淨化', 'green']], 'haki', { selfBuffAtk: 2, clearSelfAbn: true }),
      S('三千世界', 'attack', 5, 26, '自身速度 +2，並以三刀流連續斬擊對手 10～20 次。', [['連擊', 'red'], ['加速', 'green']], 'sanzen', { selfBuffSpd: 2, multiHitNormal: [10, 20], perHitPower: 26 }),
      Object.assign({}, old, { name: '九面阿修羅' })
    ]; }
})();
