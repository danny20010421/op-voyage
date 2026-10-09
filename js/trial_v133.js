/* v133 培養規劃第三批：羈絆技能、角色試煉。
   ① 羈絆技能：已開通的羈絆（COLLECTION_SETS）在出戰陣容中生效時，成員的第 5 招（奧義）命中後追加效果（BOND_SKILL）。只在非 PvP 戰鬥中生效。
   ② 角色試煉：★4 角色要通過自己的試煉（短劇情＋與宿敵單挑）才能覺醒到 ★5（已經 ★5 的不受影響）。
      存檔：roster[id].trial = true；入口：角色培養 →「覺醒」分頁。對手體質依雙方 LV100 戰力換算，再套 BOSS 強化（體力 ×1.56、全能力 +1、不復活）。 */
const BOND_SKILL = {
  yonko: { n: '皇帝的霸氣', fx: 'echo', v: .2 }, shichi: { n: '七武海的威壓', fx: 'break', v: 1 }, worst: { n: '最惡的世代', fx: 'swift', v: 1 },
  beasts: { n: '百獸的咆哮', fx: 'rally', v: 1 }, gov: { n: '絕對的正義', fx: 'shield', v: .12 }, straw: { n: '草帽的羈絆', fx: 'heal', v: .12 },
  limited: { n: '女帝與影之王', fx: 'pp', v: 1 }, wb: { n: '老爹的兒子們', fx: 'heal', v: .12 }, bmp: { n: '甜點的盛宴', fx: 'shield', v: .12 },
  thriller: { n: '幽靈與影子', fx: 'pp', v: 1 }, cross: { n: '十字公會的懸賞', fx: 'echo', v: .15 }, donquixote: { n: '天夜叉的絲線', fx: 'break', v: 1 },
  egghead: { n: '未來的科技', fx: 'pp', v: 1 }, admirals: { n: '三大將的正義', fx: 'echo', v: .15 }, elbaf_oni: { n: '艾爾巴夫的戰士', fx: 'rally', v: 1 }
};
const BOND_FX_TXT = { echo: v => `奧義命中後追擊 ${Math.round(v * 100)}% 傷害`, break: v => `奧義命中後對手防禦 −${v}`, swift: v => `施放奧義後速度 +${v}`, rally: v => `施放奧義後攻擊 +${v}`,
  shield: v => `施放奧義後獲得 ${Math.round(v * 100)}% 最大體力的護盾`, heal: v => `施放奧義後回復 ${Math.round(v * 100)}% 最大體力`, pp: v => `施放奧義後其他招式次數 +${v}` };
/* 角色試煉：r＝宿敵（角色 id），l＝劇情（n 旁白、c 角色、r 宿敵） */
const TRIALS = {
  luffy0: { r: 'buggy', l: [['n', '橘子鎮，小丑巴基的大砲對準了整座城鎮。'], ['r', '華麗地給我消失吧，草帽小子！'], ['c', '我才不會讓你傷害這裡的人！']] },
  zoro: { r: 'mihawk', l: [['n', '巴拉蒂海上餐廳，世界最強的劍士就在眼前。'], ['r', '讓我看看你的刀有多重。'], ['c', '背後的傷是劍士的恥辱——這次我不會再輸！']] },
  sanji: { r: 'katakuri', l: [['n', '蛋糕島的婚禮會場，退路只剩一條。'], ['r', '想帶走草帽的話，先過我這關。'], ['c', '廚師的腳，是用來保護同伴的！']] },
  robin: { r: 'lucci', l: [['n', '司法島，CP9 擋在通往自由的橋上。'], ['r', '惡魔之子，你的過去不會放過你。'], ['c', '我想活下去——帶我去大海！']] },
  franky: { r: 'kizaru', l: [['n', '蛋頭島，光速的踢擊劃過實驗室。'], ['r', '哎呀～船匠先生，你造的東西擋不住光喔。'], ['c', '超～級！我的身體就是最強的作品！']] },
  brook: { r: 'moria', l: [['n', '恐怖三桅帆船，被奪走的影子在黑暗中呼喚。'], ['r', '你的影子在我手上，骷髏。'], ['c', '哟嚯嚯，請把我的影子還給我！']] },
  jinbe: { r: 'hody', l: [['n', '魚人島，仇恨在海底蔓延。'], ['r', '背叛魚人族的叛徒！'], ['c', '仇恨只會換來仇恨，這一戰由我來結束。']] },
  luffy: { r: 'kaido', l: [['n', '鬼之島屋頂，最強生物俯視著挑戰者。'], ['r', '你也想像武士一樣死去嗎？'], ['c', '我要打倒你，讓和之國的人都吃得飽！']] },
  coby0: { r: 'morgan', l: [['n', '謝爾斯鎮的海軍基地，被斧手摩根統治。'], ['r', '違抗上校就是死罪！'], ['c', '我、我要成為正義的海軍，不會再逃了！']] },
  morgan: { r: 'luffy0', l: [['n', '被拔掉上校頭銜的男人，想奪回權力。'], ['r', '你這種人不配當海軍！'], ['c', '我才是這個鎮上最偉大的人！']] },
  koby_mf: { r: 'akainu', l: [['n', '頂上戰爭，一個見習生擋在岩漿之前。'], ['r', '讓開，見習生。'], ['c', '請停下來！已經夠了，不要再犧牲了！']] },
  garp_mf: { r: 'whitebeard', l: [['n', '頂上戰爭，老對手在戰場上相遇。'], ['r', '卡普，你要擋我的路嗎？'], ['c', '我是海軍。就算是你，也不會讓你過去！']] },
  akainu: { r: 'whitebeard', l: [['n', '頂上戰爭，岩漿與震動正面衝突。'], ['r', '你這種人也配稱為正義？'], ['c', '徹底的正義，才是正義！']] },
  aokiji: { r: 'akainu', l: [['n', '龐克哈薩特，決定元帥之位的十天死鬥。'], ['r', '庫山，你的正義太過懶散了。'], ['c', '就算輸了，我也要用我的方式貫徹到底。']] },
  kizaru: { r: 'marco', l: [['n', '頂上戰爭，光與不死鳥的火焰交錯。'], ['r', '光的速度，可擋不住重生的火焰。'], ['c', '哎呀～那就讓我看看你能重生幾次。']] },
  magellan: { r: 'luffy0', l: [['n', '推進城 LEVEL 4，毒氣瀰漫的灼熱地獄。'], ['r', '我要救艾斯！讓開！'], ['c', '這座監獄，沒有人能逃得出去。']] },
  lucci: { r: 'luffy0', l: [['n', '司法島的塔頂，最強的殺手等著草帽。'], ['r', '把羅賓還給我們！'], ['c', '正義？我只執行任務。']] },
  vergo: { r: 'law', l: [['n', '龐克哈薩特，臥底的海軍中將現身。'], ['r', '威爾可，你就是家族安插在海軍的人。'], ['c', '對前輩要用敬語，小子。']] },
  garp_hc: { r: 'aokiji', l: [['n', '蜂巢島，老師與學生在冰雪中重逢。'], ['r', '卡普先生，你不該來這裡的。'], ['c', '笨蛋徒弟！我是來帶克比回家的！']] },
  koby_hc: { r: 'burgess', l: [['n', '蜂巢島，被抓走的克比要靠自己突圍。'], ['r', '海軍英雄也不過如此！'], ['c', '我不是英雄……但我絕不放棄！']] },
  mihawk: { r: 'shanks', l: [['n', '很久以前，兩名劍士每天都在海上決鬥。'], ['r', '好久不見了，鷹眼。'], ['c', '少了一隻手的你，還是我的對手嗎？讓我確認看看。']] },
  crocodile: { r: 'luffy0', l: [['n', '阿拉巴斯坦地下，沙暴之王等著第三次決戰。'], ['r', '我要打倒你，讓這個國家下雨！'], ['c', '理想只是弱者的藉口。']] },
  doflamingo: { r: 'law', l: [['n', '德雷斯羅薩，鳥籠逐漸收緊。'], ['r', '柯拉先生的仇，今天由我來報！'], ['c', '正義？贏的人才是正義！']] },
  kuma: { r: 'zoro', l: [['n', '恐怖三桅帆船，暴君要帶走草帽的頭。'], ['r', '要帶走他的話，就拿我的命去換！'], ['c', '……那就承受他所有的痛苦吧。']] },
  moria: { r: 'kaido', l: [['n', '新世界，莫莉亞曾在這裡失去所有夥伴。'], ['r', '你連死人都要拿來用嗎？'], ['c', '這一次，我的影子軍團不會再輸！']] },
  law: { r: 'blackbeard', l: [['n', '外海，羅的潛水艇被黑鬍子攔下。'], ['r', '嘖哈哈哈！你的手術果實我收下了！'], ['c', 'ROOM——這裡是我的手術台。']] },
  hancock: { r: 'blackbeard_w', l: [['n', '亞馬遜百合，黑鬍子覬覦著女帝的能力。'], ['r', '你的果實看起來很美味啊。'], ['c', '無禮之徒，給我變成石頭吧！']] },
  kuma_eh: { r: 'kizaru', l: [['n', '從瑪莉喬亞到蛋頭島，大熊為了女兒奔跑。'], ['r', '大熊，你已經不是自由的人了。'], ['c', '為了波妮……我不會停下腳步。']] },
  law_w: { r: 'monet', l: [['n', '龐克哈薩特，雪花覆蓋整座島。'], ['r', '七武海大人，你的心臟在這裡喔。'], ['c', '我的計畫，才剛開始。']] },
  weevil: { r: 'marco', l: [['n', '白鬍子二世四處尋找「遺產」。'], ['r', '你不是老爹的兒子。'], ['c', '老爹的遺產全部是我的！']] },
  blackbeard_w: { r: 'ace', l: [['n', '香蕉海岸，火與暗正面相撞。'], ['r', '你殺了薩奇，我要你付出代價！'], ['c', '嘖哈哈哈！時代已經改變了，艾斯！']] },
  mihawk_w: { r: 'zoro', l: [['n', '克拉伊加納島，鷹眼在古堡裡指導劍術。'], ['r', '請收我為徒！'], ['c', '想超越我？先讓我看看你的覺悟。']] },
  ace: { r: 'blackbeard', l: [['n', '香蕉海岸，艾斯追蹤背叛者到了盡頭。'], ['r', '艾斯，加入我吧。'], ['c', '我是白鬍子的兒子——為了薩奇，我要打倒你！']] },
  marco: { r: 'king', l: [['n', '鬼之島，不死鳥獨自擋住大看板。'], ['r', '不死鳥，你的火焰燒不到我。'], ['c', '草帽要走的路，由我來守護。']] },
  uta: { r: 'shanks', l: [['n', '新時代的舞台，歌姬與父親久別重逢。'], ['r', '美音，夠了。停下來吧。'], ['c', '這是大家的夢想——誰都不能阻止我！']] },
  king: { r: 'zoro', l: [['n', '鬼之島屋頂，月光照在燼的黑翼上。'], ['r', '你的速度，我已經看穿了。'], ['c', '月見族的力量，不是你能斬斷的。']] },
  katakuri: { r: 'luffy', l: [['n', '鏡世界，兩人在無盡的對決中互相認可。'], ['r', '我還沒倒下！'], ['c', '站起來吧，草帽。我要看見你的未來。']] },
  catarina: { r: 'hancock', l: [['n', '亞馬遜百合，若月獵人化身成別人的模樣。'], ['r', '竟敢冒充我！'], ['c', '獵物可不能挑選獵人喔。']] },
  burgess: { r: 'ace', l: [['n', '香蕉海岸，巴基斯是黑鬍子的開路先鋒。'], ['r', '閃開，大塊頭！'], ['c', '衛哈哈哈！想過去就先打倒我！']] },
  vasco: { r: 'jinbe', l: [['n', '黑鬍子艦隊的十號船，正在海上尋歡作樂。'], ['r', '喝醉的海賊也想跟我打？'], ['c', '嗝……酒喝得越多，我就越強！']] },
  shanks: { r: 'kid', l: [['n', '艾爾巴夫外海，紅髮的見聞色看見了未來。'], ['r', '紅髮！我的左手就是被你——'], ['c', '未來已經決定了。還要打嗎？']] },
  blackbeard: { r: 'whitebeard', l: [['n', '頂上戰爭，背叛者站在老爹面前。'], ['r', '汀奇，你背叛了船上的規矩。'], ['c', '老爹，你的時代已經結束了！']] },
  buggy: { r: 'shanks', l: [['n', '兩人曾一起在羅傑的船上當見習生。'], ['r', '巴基，好久不見啊！'], ['c', '閉嘴！我的寶藏地圖，我要親手討回來！']] },
  luffy_nika: { r: 'kaido', l: [['n', '和之國的黎明，解放的鼓聲響起。'], ['r', '這就是傳說中的尼卡？'], ['c', '我要打倒你，讓大家都能自由地笑！']] },
  whitebeard: { r: 'akainu', l: [['n', '頂上戰爭，岩漿貫穿了老人的胸口。'], ['r', '時代的殘渣，就該被清除。'], ['c', '我是白鬍子！就算倒下，也要讓兒子們活下去！']] },
  bigmom: { r: 'rocks', l: [['n', '神之谷前夕，洛克斯海賊團的船上。'], ['r', '玲玲，你的野心還不夠大。'], ['c', '這個世界的所有人，都要成為我的家人！']] },
  kaido: { r: 'luffy_nika', l: [['n', '鬼之島，凱多聽見了傳說的鼓聲。'], ['r', '凱多！這是最後一戰！'], ['c', '喬伊波伊……我等你很久了！']] },
  makino: { r: 'buggy', l: [['n', '風車村的酒館，來了一群鬧事的海賊。'], ['r', '這間酒館我華麗地包下了！'], ['c', '在我店裡鬧事的客人，請出去。']] },
  mayor: { r: 'morgan', l: [['n', '風車村，村長要保護村子的孩子們。'], ['r', '這座村子要繳上貢金！'], ['c', '就算我老了，這座村子也輪不到你作主！']] },
  lordcoast: { r: 'shanks', l: [['n', '風車村近海，巨大的影子在海面下翻滾。'], ['r', '就這樣離開吧，近海的主人。'], ['c', '（近海之王張開了巨口……）']] },
  vivi: { r: 'crocodile', l: [['n', '阿拉巴斯坦王宮，公主要阻止戰爭。'], ['r', '理想救不了任何人，公主。'], ['c', '只要還有一個人在流血，我就不會放棄！']] },
  koza: { r: 'crocodile', l: [['n', '雨地的叛亂軍正要向王宮進攻。'], ['r', '很好，替我把這個國家毀了吧。'], ['c', '我們是為了國家而戰——不是為了你！']] },
  enel: { r: 'luffy0', l: [['n', '空島，神的審判降落在方舟上。'], ['r', '我是橡膠人，雷打不到我！'], ['c', '神是不會輸的——呀哈哈哈！']] },
  wiper: { r: 'enel', l: [['n', '香迪亞的戰士帶著排斥貝，衝向神的神殿。'], ['r', '無禮之徒，你也想挑戰神？'], ['c', '為了故鄉，我要把你打下來！']] },
  perona: { r: 'mihawk', l: [['n', '克拉伊加納島，佩羅娜的幽靈飛向古堡。'], ['r', '吵鬧的小姑娘。'], ['c', '消極幽靈！讓你也變得消極吧！']] },
  hody: { r: 'jinbe', l: [['n', '魚人島，仇恨的藥丸讓荷帝變得瘋狂。'], ['r', '荷帝，你的仇恨不是你自己的。'], ['c', '人類全部都要沉進海底！']] },
  shirahoshi: { r: 'hody', l: [['n', '魚人島，海王的力量被仇恨所覬覦。'], ['r', '人魚公主，你應該屬於我。'], ['c', '我……我不會再哭了！']] },
  monet: { r: 'law_w', l: [['n', '龐克哈薩特的研究所，雪女守著重要的心臟。'], ['r', '把心臟交出來，雪女。'], ['c', '少主的計畫，誰都不准打亂。']] },
  sugar: { r: 'luffy0', l: [['n', '德雷斯羅薩，玩具之家的守衛。'], ['r', '被你變成玩具的人，全都要還回來！'], ['c', '被我碰到的人，就會被世界遺忘喔。']] },
  kid: { r: 'bigmom', l: [['n', '鬼之島，基德與羅聯手面對四皇。'], ['r', '小鬼，你也想嚐嚐我的蛋糕嗎？'], ['c', '我要靠這隻手打倒四皇！']] },
  kinemon: { r: 'kaido', l: [['n', '和之國，赤鞘九俠等了二十年。'], ['r', '御田的家臣，還在做白日夢嗎？'], ['c', '主公的遺志，由我們來完成！']] },
  tama: { r: 'king', l: [['n', '和之國兔丼，阿玉的黍團子是最後的希望。'], ['r', '小鬼，滾開。'], ['c', '路飛大哥說過會回來的——我不怕你！']] },
  yamato: { r: 'kaido', l: [['n', '鬼之島，鎖鏈終於被斬斷。'], ['r', '你永遠是我的孩子，大和。'], ['c', '我是光月御田！我要讓和之國自由！']] },
  vegapunk: { r: 'lucci', l: [['n', '蛋頭島，CP0 前來執行命令。'], ['r', '博士，你知道得太多了。'], ['c', '知識屬於全世界——我要把它傳出去！']] },
  york: { r: 'vegapunk', l: [['n', '蛋頭島，「貪欲」背叛了本體。'], ['r', '約克，我們是同一個人啊。'], ['c', '只有我能成為天龍人！']] },
  loki: { r: 'shanks', l: [['n', '艾爾巴夫，被鎖住的王子渴望自由。'], ['r', '洛基，艾爾巴夫不需要你的憤怒。'], ['c', '我才是艾爾巴夫的王！']] },
  dorry: { r: 'brogy', l: [['n', '小花園，兩位巨人的決鬥已經持續了一百年。'], ['r', '嘎巴巴巴！今天也來分個勝負吧，多利！'], ['c', '咯嘰嘰嘰！艾爾巴夫的戰士不會退縮！']] },
  brogy: { r: 'dorry', l: [['n', '小花園，又一場決鬥開始了。'], ['r', '咯嘰嘰嘰！布洛基，今天也是好天氣！'], ['c', '嘎巴巴巴！為了艾爾巴夫的榮耀！']] },
  rocks: { r: 'roger', l: [['n', '神之谷，世界最強的兩人正面相撞。'], ['r', '洛克斯，你的時代到此為止。'], ['c', '這個世界的王——只能是我！']] }
};
/* 試煉對手的額外倍率（體力、傷害同乘）：tests/trial-sim.js 以 ★4、技能 Lv4、沒有寶物時勝率約 60% 校準；白鬍子、洛基、紅髮、尼卡魯夫、洛克斯的特殊機制模擬不準，改用實戰自動戰鬥調整 */
const TRIAL_ADJ = { luffy0: 0.59, zoro: 0.74, sanji: 1.16, robin: 0.89, franky: 1.51, brook: 1.25, jinbe: 1.59, luffy: 0.77, coby0: 1.54, morgan: 1.05, koby_mf: 1.09, garp_mf: 1.32, akainu: 0.83, aokiji: 1.09, kizaru: 1.05, magellan: 1.98, lucci: 1.96, vergo: 0.78, garp_hc: 2.2, koby_hc: 0.94, mihawk: 0.83, crocodile: 2.54, doflamingo: 1.31, kuma: 2.45, moria: 0.81, law: 0.71, hancock: 1.92, kuma_eh: 1.27, law_w: 1.01, weevil: 0.7, blackbeard_w: 0.87, mihawk_w: 2.04, ace: 1.41, marco: 0.93, uta: 0.56, king: 1.99, katakuri: 0.97, catarina: 0.89, burgess: 0.89, vasco: 1.11, shanks: 1, blackbeard: 0.97, buggy: 0.69, luffy_nika: 1.3, whitebeard: 2.5, bigmom: 1.23, kaido: 1.3, makino: 0.33, mayor: 1.73, lordcoast: 0.31, vivi: 0.96, koza: 0.71, enel: 2.69, wiper: 0.86, perona: 1.01, hody: 1.19, shirahoshi: 2.21, monet: 1.24, sugar: 0.98, kid: 1.08, kinemon: 0.7, tama: 0.54, yamato: 0.74, vegapunk: 0.73, york: 1.15, loki: 2.2, dorry: 1.19, brogy: 1.12, rocks: 1.3 };
const TRIAL_CFG = { reward: { awaken_gem: 30, skill_book: 2 }, berry: 20000, lv: 100, boss: true };
(function () {
  const R = id => (SAVE.data.roster || {})[id];
  const pvpOf = o => !!(o && (o.pvp || o.live));
  /* ---------- 羈絆技能 ---------- */
  function bondFx(S) { if (BOND_SKILL[S.id]) return BOND_SKILL[S.id]; const b = S.bonus || {}; const k = b.atk ? 'echo' : b.def || b.dr ? 'shield' : b.hp ? 'heal' : b.spd ? 'swift' : 'rally'; return { n: S.name, fx: k, v: k === 'echo' ? .15 : k === 'shield' || k === 'heal' ? .12 : 1 }; }
  const bondsOf = id => (typeof COLLECTION_SETS !== 'undefined' ? COLLECTION_SETS : []).filter(S => S.members.includes(id));
  const bondDone = S => S.members.every(m => typeof owned === 'function' && owned(m));
  const bondNeed = S => Math.min(S.need || S.members.length, S.members.length);
  function bondInfo(id) { return bondsOf(id).map(S => ({ S, B: bondFx(S), done: bondDone(S), need: bondNeed(S) })); }
  function bondText(B) { return (BOND_FX_TXT[B.fx] || (() => ''))(B.v); }
  function fireBond(actor, target, result) {
    const L = actor.__bonds; if (!L || !L.length || typeof battle === 'undefined' || !battle) return; const side = actor === battle.player ? 'L' : 'R', T = side === 'L' ? 'R' : 'L';
    L.forEach(B => { try {
      if (B.fx === 'echo') { if (!(result && result.damage > 0) || target.hp <= 0) return; const d = Math.max(1, Math.round(result.damage * B.v)); applyDamage(target, d, T); }
      else if (B.fx === 'break') { if (target.hp <= 0) return; target.buffs.def = clamp((target.buffs.def || 0) - B.v, -6, 6); }
      else if (B.fx === 'swift') actor.buffs.spd = clamp((actor.buffs.spd || 0) + B.v, -6, 6);
      else if (B.fx === 'rally') actor.buffs.atk = clamp((actor.buffs.atk || 0) + B.v, -6, 6);
      else if (B.fx === 'shield') actor.status.shield = (actor.status.shield || 0) + Math.round(actor.maxHp * B.v);
      else if (B.fx === 'heal') { if (actor.hp <= 0) return; const h = Math.min(actor.maxHp - actor.hp, Math.round(actor.maxHp * B.v)); if (h > 0) { actor.hp += h; if (typeof showHeal === 'function') showHeal(side, h); } }
      else if (B.fx === 'pp') actor.skills.forEach(s => { if (!s.ultimate && !s.locked && s.maxPP) s.pp = Math.min(s.maxPP, s.pp + B.v); });
      log(`🔗 羈絆技能「${B.n}」：${bondText(B)}`); if (typeof floatText === 'function') floatText(side, '羈絆', 'status');
    } catch (e) { } });
    if (typeof renderHUD === 'function') renderHUD(); if (typeof renderSkills === 'function' && side === 'L') renderSkills();
  }

  /* ---------- 角色試煉 ---------- */
  const trialOf = id => TRIALS[id] || null;
  const trialDone = id => !!(R(id) || {}).trial;
  const rivalOf = id => { const t = trialOf(id); return t && CHARACTERS[t.r] ? t.r : id; };
  const pow = id => { const S = lvStats(CHARACTERS[id], TRIAL_CFG.lv); return S.atk * 1.6 + S.def * 1.2 + S.hp * .45 + S.spd * 2.2; };
  /* 對手體質：依雙方 LV100 戰力與稀有度體質換算成同一水準（0.4～2 倍），再乘上 TRIAL_ADJ 校準值 */
  function rivalMod(id) { const r = rivalOf(id); const rs = typeof rarityScale === 'function' ? rarityScale(id) / rarityScale(r) : 1; const q = Math.max(.4, Math.min(2, pow(id) / pow(r) * rs)) * (TRIAL_ADJ[id] || 1);
    return { hp: +q.toFixed(3), dmg: +q.toFixed(3), title: `${CHARACTERS[id].name} 的試煉`, name: r === id ? `另一個${CHARACTERS[id].name}` : undefined }; }
  let RUN = null, ov = null;
  function close() { if (ov) { ov.remove(); ov = null; } }
  function back(id) { if (typeof openModes === 'function') openModes(); if (typeof openCrew === 'function') openCrew(); setTimeout(() => { if (window.openGrow) openGrow(id, 'star'); }, 60); }
  function openTrial(id) {
    const c = CHARACTERS[id]; if (!c || !R(id)) return; const t = trialOf(id) || { r: id, l: [['n', `${c.name}站在鏡子前，鏡中的自己舉起了武器。`], ['r', '想再往前走，就先超越現在的你。'], ['c', '我會證明給你看！']] };
    const rv = CHARACTERS[rivalOf(id)], rn = rivalOf(id) === id ? `另一個${c.name}` : rv.name, done = trialDone(id);
    const art = (k, x) => typeof charArt === 'function' ? charArt(k, x) : CHARACTERS[k][x === 'avatar' ? 'avatar' : 'image'];
    const who = w => w === 'c' ? [c.name, art(id, 'avatar')] : w === 'r' ? [rn, art(rivalOf(id), 'avatar')] : null;
    const rw = TRIAL_CFG.reward;
    close(); ov = document.createElement('div'); ov.className = 'tr-wrap'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', `${c.name} 的試煉`);
    ov.innerHTML = `<div class="tr-card">
      <header class="tr-head"><div><small>角色試煉</small><h2>${c.name} 的試煉</h2></div><button class="icon-btn tr-x" aria-label="關閉">×</button></header>
      <div class="tr-vs"><figure class="tr-me"><img src="${art(id, 'image')}" alt="${c.name}" style="${c.faceLeft ? 'transform:scaleX(-1)' : ''}"><figcaption>${c.name}</figcaption></figure><b class="tr-vsb" aria-hidden="true">VS</b><figure class="tr-foe"><img src="${art(rivalOf(id), 'image')}" alt="${rn}" style="${rv.faceLeft ? '' : 'transform:scaleX(-1)'}"><figcaption>${rn}</figcaption></figure></div>
      <ol class="tr-lines">${t.l.map(([w, s], i) => { const p = who(w); return `<li class="tr-l ${w}" style="--d:${i * .35}s">${p ? `<img src="${p[1]}" alt=""><div><b>${p[0]}</b><span>${s}</span></div>` : `<div><span>${s}</span></div>`}</li>`; }).join('')}</ol>
      <dl class="tr-info"><div><dt>規則</dt><dd>${c.name} 單獨出戰</dd></div><div><dt>對手</dt><dd>${rn}・LV ${TRIAL_CFG.lv}・BOSS</dd></div><div><dt>${done ? '已通過' : '首次通過'}</dt><dd>${done ? '可以重複挑戰' : `解鎖 ★5、覺醒結晶 ×${rw.awaken_gem}、秘傳書 ×${rw.skill_book}`}</dd></div></dl>
      <div class="tr-btns"><button class="btn-ghost tr-no">返回</button><button class="btn-gold tr-go">開始試煉</button></div></div>`;
    document.body.appendChild(ov); if (window.fixIcons) fixIcons(ov);
    ov.querySelector('.tr-x').onclick = ov.querySelector('.tr-no').onclick = close;
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('.tr-go').onclick = () => begin(id);
  }
  function begin(id) {
    if (typeof isTraining === 'function' && isTraining(id)) { toast(`${CHARACTERS[id].name} 正在訓練營，訓練結束後才能挑戰`, 'warn'); return; }
    close(); const g = document.getElementById('growModal'); if (g) g.classList.remove('show'); if (typeof closeModal === 'function') try { closeModal('charModal'); } catch (e) { }
    const r = rivalOf(id), ch = (typeof CHAPTERS !== 'undefined' ? CHAPTERS : []).find(x => x.boss === r);
    RUN = { id };
    startBattle({ team: [{ id, lv: crewLv(id) }], enemyId: r, enemyLv: TRIAL_CFG.lv, enemyMod: rivalMod(id), chapterId: 'east', isBoss: TRIAL_CFG.boss, revives: 0, trial: id,
      bg: ch ? ch.art : 'assets/ui/emperor_bg.webp?v=63', onEnd: res => end(res), onLeave: () => back(id) });
    log(`角色試煉：${CHARACTERS[id].name} 對上 ${CHARACTERS[r].name}`);
  }
  function end(res) {
    const Rn = RUN; RUN = null; if (!Rn) return {}; const id = Rn.id, c = CHARACTERS[id];
    if (!res.win) return { message: `${res.fled ? '撤退' : '戰敗'}了……強化寶物、技能等級後再來挑戰吧。`, alt: { label: '再試一次', fn: () => begin(id) }, next: { label: '返回角色培養', fn: () => back(id) } };
    track('wins'); const r = R(id), first = !r.trial; const msgs = [`🏆 ${c.name} 通過了試煉！`];
    if (first) { r.trial = true; const list = window.PROG ? PROG.give({ items: TRIAL_CFG.reward }) : [];
      msgs.push(`可以覺醒到 ★5 了！獲得 覺醒結晶 ×${TRIAL_CFG.reward.awaken_gem}、秘傳書 ×${TRIAL_CFG.reward.skill_book}`);
      setTimeout(() => { if (window.PROG) PROG.celebrate('試煉通過！', list, `${c.name} 可以覺醒到 ★5`); }, 700); }
    else { if (typeof addBerry === 'function') addBerry(TRIAL_CFG.berry); msgs.push(`貝里 +${TRIAL_CFG.berry.toLocaleString()}`); }
    SAVE.save(); if (typeof coins === 'function') coins();
    return { message: msgs.join('<br>'), next: { label: '返回角色培養', fn: () => back(id) } };
  }

  window.addEventListener('DOMContentLoaded', () => {
    /* 羈絆技能：非 PvP 戰鬥中，出戰陣容的羈絆成員標記 __bonds */
    if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function (opts) { const r = _sb.apply(this, arguments); try {
      if (battle && !pvpOf(opts) && typeof setsActive === 'function') { const ids = battle.team.map(f => f.id), act = setsActive(ids); battle.team.forEach(f => { f.__bonds = act.filter(S => S.members.includes(f.id)).map(bondFx); }); }
    } catch (e) { } return r; }; }
    if (typeof applySkillEffects === 'function') { const _ae = applySkillEffects; let depth = 0; applySkillEffects = function (actor, target, skill, result) { depth++; let r; try { r = _ae.apply(this, arguments); } finally { depth--; }
      if (!depth && skill && skill.ultimate && actor && actor.__bonds && actor.__bonds.length && !skill.__voidFx) fireBond(actor, target, result); return r; }; }
    /* ★5 需要通過試煉（已經 ★5 的不受影響） */
    if (window.PROG && PROG.starUp) { const su = PROG.starUp; PROG.starUp = function (id) { if (PROG.starOf(id) === 4 && !trialDone(id)) return { ok: false, msg: `先通過「${CHARACTERS[id].name} 的試煉」才能覺醒到 ★5` }; return su.apply(this, arguments); }; }
  });
  window.TRIAL = { open: openTrial, done: trialDone, rival: rivalOf, of: trialOf, mod: rivalMod, cfg: TRIAL_CFG };
  window.BOND = { info: bondInfo, text: bondText, fx: bondFx };
})();
