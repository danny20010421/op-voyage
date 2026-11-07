/* v180 內容檢查修正（使用者 11/08 05:02「劇情是否連貫、角色介紹是否正確、每日任務是否多元」）：
   ① 角色介紹：對照原作修正錯誤（黑鬍子海賊團船隊編號、紅髮譯名統一「傑克斯」、夏姆洛克「雙胞胎兄弟」），
      只寫技能數值的介紹改寫成「人物背景＋戰鬥定位」，近海之王補上稱號。
   ② 每日懸賞：任務池加入角色培養、海賊天梯、掃蕩、歌姬挑戰、挖寶（都是遊戲已經在記錄的行為），一般 12 → 17 種、高級 5 → 8 種。 */
(function () {
  if (typeof CHARACTERS === 'undefined') return;
  const D = {
    luffy0: '夢想成為海賊王的少年，吃下橡膠果實的橡膠人。從風車村獨自出海，拳腳能像橡膠一樣伸縮自如。【定位】入門攻擊型：連打與伸縮重拳，靠不服輸的鬥志越打越強。',
    zoro: '立志成為世界第一大劍豪的「海賊獵人」，草帽一夥的第一位夥伴。口咬一把、雙手各握一把的三刀流劍士。【定位】單體爆發：斬擊、流血與霸氣纏繞的一擊必殺。',
    sanji: '海上餐廳「巴拉蒂」出身的一流廚師，草帽一夥的廚師。為了保護做菜的雙手，戰鬥只用腳。【定位】攻擊兼回復：踢技連段、燃燒的惡魔風腳，以及能回復體力的料理。',
    robin: '奧哈拉唯一的倖存者，花花果實能力者，能在任何地方「開花」長出手腳。為了解讀記載空白一百年的歷史本文而旅行，後來成為草帽一夥的考古學家。【定位】多段攻擊與控場：閃避、反彈與惡魔開花的高倍率爆發。',
    blackbeard: '黑鬍子海賊團船長，四皇之一。史上唯一同時擁有暗暗果實與震震果實兩種能力的人，暗暗果實能吸入一切、封住對手的能力。【定位】反制型：黑暗引力拉近、震震爆發、奪取技能與護盾反打。',
    enel: '空島「神之國」的自稱之神，響雷果實能力者。能化身雷電、以心綱（見聞色）聽見整座島的聲音，降下萬雷。【定位】速攻型：神速雷擊、秒殺機率與雷神型態。',
    shirahoshi: '龍宮王國的人魚公主，擁有能呼喚海王類的古代兵器「海王」之力。個性膽小愛哭，卻擁有守護魚人島的勇氣。【定位】輔助型：高回復、高護盾，以及召喚海王類的超大型爆發。',
    yamato: '凱多的「兒子」，憧憬光月御田、自稱「御田」的武士。吃下幻獸種「大口真神」的果實，揮舞纏繞霸氣的狼牙棒。【定位】攻守兼備：狼牙棒連打，與冰雪之神的守護。',
    luffy: '在和之國打倒凱多、成為新四皇之後的魯夫，跟著巨人族一起來到艾爾巴夫。【定位】近身爆發：高機率爆擊，覺醒後持續壓制對手。',
    roger: '征服偉大航路、抵達最終之島「拉乎德爾」的海賊王。臨刑前一句「我的財寶嗎？想要的話就給你吧！去找吧！我把所有的財寶都放在那裡了！」掀起了大海賊時代。【定位】全能型：霸王色纏繞的神避與強力斬擊。',
    catarina: '狗狗果實幻獸種・九尾狐型能力者，黑鬍子海賊團第 6 船船長，被稱為「若月獵人」。能變身成任何人的樣子，是推進城 LEVEL6 出身的大罪人。',
    vasco: '總是醉醺醺的黑鬍子海賊團第 8 船船長，推進城 LEVEL6 出身。能把喝下去的大量酒水噴出來點火，醉拳般難以捉摸的動作讓對手的攻擊總是落空。',
    lordcoast: '盤據在風車村外海的巨大海王類。十年前曾被紅髮傑克斯一眼瞪跑，而傑克斯也為了救下魯夫，被牠吃掉了一條手臂。'
  };
  Object.entries(D).forEach(([id, t]) => { if (CHARACTERS[id]) CHARACTERS[id].desc = t; });
  if (CHARACTERS.lordcoast && !CHARACTERS.lordcoast.title) CHARACTERS.lordcoast.title = '近海的主人';
  if (CHARACTERS.shamrock && CHARACTERS.shamrock.desc) CHARACTERS.shamrock.desc = CHARACTERS.shamrock.desc.replace('雙胞胎哥哥', '雙胞胎兄弟');

  /* 每日懸賞 */
  if (typeof BOUNTY_POOL !== 'undefined') {
    const add = (L, b) => { if (!L.some(x => x.id === b.id)) L.push(b); };
    add(BOUNTY_POOL, { id: 'grow2', text: '培養角色 2 次（升級、覺醒、技能升級或武器強化）', stat: 'grows', goal: 2, berry: 1500 });
    add(BOUNTY_POOL, { id: 'pvp1', text: '在海賊天梯對戰 1 次', stat: 'pvp', goal: 1, berry: 2000 });
    add(BOUNTY_POOL, { id: 'sweep3', text: '掃蕩 3 場戰鬥', stat: 'sweeps', goal: 3, berry: 1200 });
    add(BOUNTY_POOL, { id: 'rhythm1', text: '完成 1 首歌姬挑戰', stat: 'rhythm', goal: 1, berry: 1800 });
    add(BOUNTY_POOL, { id: 'dig2', text: '在島上挖寶 2 次', stat: 'digs', goal: 2, berry: 1200 });
    if (typeof BOUNTY_PREMIUM !== 'undefined') {
      add(BOUNTY_PREMIUM, { id: 'p_grow5', text: '培養角色 5 次', stat: 'grows', goal: 5, berry: 5000, tokens: 5, premium: true });
      add(BOUNTY_PREMIUM, { id: 'p_pvp3', text: '在海賊天梯對戰 3 次', stat: 'pvp', goal: 3, berry: 5000, tokens: 5, premium: true });
      add(BOUNTY_PREMIUM, { id: 'p_sweep10', text: '掃蕩 10 場戰鬥', stat: 'sweeps', goal: 10, berry: 5000, tokens: 5, premium: true });
    }
  }
})();
