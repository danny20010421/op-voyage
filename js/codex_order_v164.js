/* v164 圖鑑順序表：把航海王主要角色全部排進圖鑑（使用者 11/06「把海賊王全部角色統整後，全部加入圖鑑……依循我們當初編排角色順序的邏輯；
   每隔 30 個編號就要預留 5 個？？？？位置；伊姆、洛克斯、喬伊波伊放於圖鑑最末位」）。
   排序邏輯沿用 v93（roster_v91.js）：主角群 → 海軍與世界政府 → 王下七武海 → 四皇團員（白鬍子、紅髮、百獸、BIG MOM、黑鬍子、十字公會）
   → 四皇 → 其他角色依登場篇章 → 最後三位。同一陣營內依登場篇章；同一人物的不同篇章版本各佔一個編號（例：初登場魯夫、魯夫（和之國篇））。
   每一筆是「id|名字|篇章代碼」：CHARACTERS 裡已經有這個 id（而且不是只在挑戰中出現的敵人）就是可玩角色，否則顯示「未實裝」名字卡。
   之後新增角色時用這裡寫好的 id，圖鑑就會自動把名字卡換成角色；要插入新的版本，放進最近的「？？？？」預留位置（把那一格改成角色 id）。
   編號只用在顯示；存檔、召喚、皮膚、成就都用角色 id，不受編號影響。本檔必須在所有角色檔之後載入；開啟圖鑑時會再套用一次（晚載入的角色也會排進來）。 */
(function () {
  const ARCS = { e: ['東海篇', '風車村～羅格鎮'], a: ['阿拉巴斯坦篇', '顛倒山～磁鼓島～阿拉巴斯坦'], s: ['空島篇', '加雅～空島'], n: ['司法島篇', '七水之都～司法島'], t: ['恐怖三桅帆船篇', '魔幻三角地帶'],
    m: ['頂上戰爭篇', '香波地諸島～女兒島～推進城～馬林福特'], f: ['魚人島篇', '魚人島'], d: ['德雷斯羅薩篇', '龐克哈薩特～德雷斯羅薩'], w: ['蛋糕島篇', '佐烏～萬國～世界會議'], o: ['和之國篇', '和之國'],
    h: ['蜂巢島篇', '蜂巢島'], g: ['蛋頭島篇', '蛋頭島'], b: ['巨人篇', '艾爾巴夫'], x: ['傳說', '空白的一百年'] };
  const GROUPS = [
    ['crew', '草帽一夥', 'luffy0|初登場魯夫|e zoro|初登場索隆|e nami|娜美|e usopp|騙人布|e sanji|初登場香吉士|e chopper|托尼托尼·喬巴|a robin|妮可·羅賓|a franky|佛朗基|n brook|布魯克|t jinbe|甚平|m luffy|魯夫（巨人篇）|b'],
    ['navy', '海軍與世界政府', 'coby0|初登場克比|e morgan|斧手摩根|e marine|海軍小兵|e helmeppo|貝魯梅柏|e nezumi|老鼠上校|e smoker|斯摩格|e tashigi|達斯琪|e hina|黑檻希娜|a ' +
      'lucci|羅布·路奇|n kaku|卡古|n kalifa|卡莉法|n blueno|布魯諾|n jabra|賈布拉|n kumadori|庫馬德利|n fukurou|福克羅|n spandam|斯潘達姆|n aokiji|青雉|n ' +
      'sengoku|佛之戰國|m tsuru|鶴中將|m kizaru|黃猿|m akainu|赤犬|m sentomaru|戰桃丸|m momonga|摩摩加中將|m garp_mf|卡普（頂上戰爭）|m koby_mf|克比（頂上戰爭）|m magellan|麥哲倫|m hannyabal|漢尼拔|m sadi|莎蒂|m charlos|查爾洛斯聖|m kong|空|m ' +
      'fujitora|藤虎|d stussy|史塔西|w ryokugyu|綠牛|o garp_hc|卡普（蜂巢島）|h koby_hc|克比（蜂巢島）|h hibari|希巴莉|h grus|普林斯·格魯斯|h ' +
      'saturn|傑格西亞·沙杜恩聖|g mars|馬可斯·馬斯聖|g warcury|托普曼·沃丘里聖|g nusjuro|伊森巴隆·V·納斯壽郎聖|g jupeter|謝帕德·十·彼得聖|g'],
    ['warlord', '王下七武海', 'mihawk_w|喬拉可爾·密佛格（七武海）|m mihawk|喬拉可爾·密佛格|e crocodile|沙·克洛克達爾|a doflamingo|唐吉訶德·多佛朗明哥|s kuma|巴索羅繆·大熊|t kuma_eh|巴索羅繆·大熊（蛋頭島）|g ' +
      'moria|月光·莫莉亞|t law|托拉法爾加·羅|m law_w|托拉法爾加·羅（七武海）|d hancock|波雅·漢庫克|m weevil|愛德華·衛伯|w blackbeard_w|馬歇爾·D·汀奇（七武海）|m'],
    ['wb', '白鬍子海賊團', 'ace|波特卡斯·D·艾斯|a marco|馬爾科|m jozu|鑽石·喬斯|m vista|花劍·比斯塔|m izo|以藏|m thatch|薩奇|m squard|斯庫亞德|m oars_jr|小奧斯Jr.|m'],
    ['rh', '紅髮海賊團', 'uta|美音|e beckman|班·貝克曼|e yasopp|耶穌布|e lucky_roux|拉基·路|e limejuice|萊姆瓊斯|e rockstar|洛克斯達|m'],
    ['beast', '百獸海賊團', 'king|燼|o jack|傑克|w queen|奎因|o ulti|烏爾緹|o page_one|佩吉萬|o black_maria|黑色瑪利亞|o sasaki|佐佐木|o whos_who|胡斯胡|o'],
    ['bm', 'BIG MOM 海賊團', 'katakuri|夏洛特·卡塔庫栗|w pekoms|佩金斯|f tamago|塔馬哥男爵|f perospero|夏洛特·佩洛斯佩洛|w cracker|夏洛特·克力架|w smoothie|夏洛特·斯慕吉|w oven|夏洛特·歐文|w daifuku|夏洛特·大福|w ' +
      'pudding|夏洛特·布琳|w brulee|夏洛特·布蕾|w montdor|夏洛特·蒙多爾|w streusen|斯特洛伊森|w'],
    ['bb', '黑鬍子海賊團', 'catarina|卡特琳·蝶美|w burgess|吉薩斯·巴基斯|s vasco|斯巴可|s laffitte|拉斐特|s van_augur|范·歐卡|s doc_q|毒Q|s shiryu|雨之希留|m pizarro|阿巴羅·皮薩羅|m sanjuan|桑法安·烏魯夫|m'],
    ['cg', '十字公會', 'mohji|莫吉|e cabaji|卡巴吉|e'],
    ['emp', '四皇', 'shanks|紅髮傑克斯|e blackbeard|馬歇爾·D·汀奇|s buggy|小丑巴基|e luffy_nika|尼卡魯夫|o whitebeard|愛德華·紐蓋特|m bigmom|夏洛特·玲玲|f kaido|凱多|w'],
    ['e', '東海篇', 'makino|瑪琪諾|e mayor|烏普·史拉布|e higuma|山賊希古馬|e lordcoast|近海之王|e alvida|亞爾麗塔|e kuina|古伊娜|e kuro|百計·克洛|e kaya|可雅|e johnny|強尼|e yosaku|約薩克|e ' +
      'zeff|紅腳哲普|e gin|鬼人·吉恩|e krieg|首領·克利克|e arlong|惡龍|e hatchan|小八|e kuroobi|克洛歐比|e bellmere|貝爾梅爾|e nojiko|諾琪高|e genzo|阿健|e roger|哥爾·D·羅傑|e dragon|蒙其·D·多拉格|e'],
    ['a', '阿拉巴斯坦篇', 'crocus|克洛卡斯|a laboon|拉布|a mr5|Mr.5|a valentine|情人節小姐|a mr3|Mr.3|a goldenweek|黃金週小姐|a wapol|瓦波爾|a dalton|德爾頓|a hiriluk|希魯魯克|a kureha|古蕾哇|a ' +
      'vivi|奈菲魯塔利·薇薇|a igaram|伊卡萊姆|a cobra|奈菲魯塔利·寇布拉|a koza|寇沙|a pell|貝爾|a chaka|查卡|a carue|超級鴨卡魯|a bonclay|馮·克雷|a mr1|Mr.1|a doublefinger|雙指小姐|a mr4|Mr.4|a merrychristmas|聖誕快樂小姐|a'],
    ['s', '空島篇', 'bellamy|貝拉米|s cricket|蒙布朗·克力克|s masira|馬西拉|s shoujou|修裘|s conis|柯妮絲|s pagaya|帕加亞|s ganfall|甘·福爾|s wiper|懷帕|s laki|拉琪|s ' +
      'satori|薩托利|s shura|修拉|s gedatsu|傑達斯|s ohm|奧姆|s enel|艾涅爾|s noland|蒙布朗·諾蘭德|s calgara|卡爾加拉|s'],
    ['n', '司法島篇', 'foxy|銀狐佛克西|n iceburg|艾斯巴古|n paulie|帕烏利|n kokoro|可可羅亞婆婆|n chimney|奇姆尼|n tom|湯姆|n zambai|桑拜|n kiwi|奇威|n mozu|莫茲|n olvia|妮可·奧爾比亞|n clover|克洛巴博士|n'],
    ['t', '恐怖三桅帆船篇', 'hogback|霍古巴克|t cindry|辛德莉|t absalom|阿布薩羅姆|t perona|佩羅娜|t oars|歐斯|t lola|蘿拉|t ryuma|霜月龍馬|t'],
    ['m', '頂上戰爭篇', 'duval|杜巴爾|m camie|凱米|m pappug|帕帕古|m shakky|夏姬|m rayleigh|西爾巴斯·雷利|m eustass|尤斯塔斯·基德|m killer|殺戮武人|m apoo|斯克拉奇·梅杰·阿普|m hawkins|巴吉爾·霍金斯|m ' +
      'drake|X·德雷克|m urouge|怪僧烏爾基|m bonney|珠寶·波妮|m bege|卡彭·貝基|m nyon|尼優婆婆|m marguerite|瑪格麗特|m sandersonia|波雅·桑達索妮雅|m marigold|波雅·瑪莉哥德|m ivankov|伊萬科夫|m inazuma|伊娜茲瑪|m dadan|達旦|m'],
    ['f', '魚人島篇', 'shyarly|夏莉|f decken|凡達·戴肯九世|f hody|荷帝·瓊斯|f neptune|尼普頓|f fukaboshi|富卡波|f ryuboshi|龍包|f manboshi|萬包|f shirahoshi|白星|f otohime|乙姬王妃|f fisher_tiger|費雪·泰格|f koala|可亞拉|f aladine|阿拉丁|f'],
    ['d', '德雷斯羅薩篇', 'caesar|凱薩·克朗|d monet|莫內|d vergo|威爾可|d rebecca|蕾貝卡|d kyros|基羅斯|d riku|力克·德爾多三世|d viola|維奧萊特|d cavendish|卡文迪許|d bartolomeo|巴托洛米奧|d sai|齊|d ideo|伊迪歐|d orlumbus|歐隆布斯|d ' +
      'sabo|薩波|d hack|哈克|d mansherry|曼雪莉|d leo|雷歐|d trebol|托雷波爾|d diamante|迪亞曼帝|d pica|比卡|d pink|塞尼奧爾·粉紅|d gladius|葛拉迪斯|d baby5|寶貝5|d buffalo|巴法洛|d dellinger|德林傑|d laog|拉奧G|d ' +
      'jora|喬拉|d machvise|馬哈拜斯|d sugar|砂糖|d rosinante|唐吉訶德·羅西南迪|d'],
    ['w', '蛋糕島篇', 'inuarashi|犬嵐公爵|w nekomamushi|貓蝮蛇老大|w pedro|佩德羅|w carrot|卡洛特|w wanda|萬達|w judge|文斯莫克·加治|w reiju|文斯莫克·蕾玖|w ichiji|文斯莫克·一治|w niji|文斯莫克·二治|w ' +
      'yonji|文斯莫克·四治|w sora|文斯莫克·索拉|w belo_betty|貝洛·貝蒂|w morley|莫利|w karasu|卡拉斯|w lindbergh|林德柏格|w'],
    ['o', '和之國篇', 'kid|基德（電磁炮模式）|o kinemon|錦衛門|o tama|阿玉|o yamato|大和|o luffy_wano|魯夫（和之國篇）|o zoro_wano|索隆（和之國篇）|o sanji_wano|香吉士（和之國篇）|o robin_wano|妮可·羅賓（和之國篇）|o ' +
      'momonosuke|光月桃之助|o oden|光月御田|o toki|光月時|o hiyori|光月日和|o denjiro|傳次郎|o kawamatsu|河松|o raizo|雷藏|o kikunojo|菊之丞|o ashura|阿修羅童子|o kanjuro|勘十郎|o orochi|黑炭大蛇|o yasuie|霜月康義|o shinobu|忍|o'],
    ['g', '蛋頭島篇', 'vegapunk|貝加龐克|g york|約克|g morgans|摩甘茲|g shaka|夏卡|g lilith|莉莉絲|g edison|艾迪森|g pythagoras|畢達哥拉斯|g atlas|阿特拉斯|g ginny|金妮|g emet|艾美特|g'],
    ['b', '巨人篇', 'loki|洛基|b dorry|多利|b brogy|布洛基|b gunko|曼麥亞・軍子宮|b shamrock|費加蘭德・夏姆洛克聖|b gaban|賈巴|b harald|哈拉魯德|b jarul|雅爾|b hajrudin|漢裘爾頓|b ' +
      'oimo|歐依莫|b kashii|卡西|b saul|哈古瓦爾·D·薩龍|b garling|菲加蘭德·加林聖|b sommers|索馬茲聖|b killingham|基林漢聖|b']
  ];
  const LAST = 'viona|賽博亞齊·維歐娜|x imu|伊姆|x rocks|洛克斯·D·吉貝克|x joyboy|喬伊波伊|x'; /* 使用者指定：伊姆、洛克斯、喬伊波伊依序放在最末三位 */
  const PERIOD = 30, GAP = 5; /* 每 30 個編號之後預留 5 個「？？？？」 */
  const parse = (s, g) => s.trim().split(/\s+/).map(t => { const [id, name, arc] = t.split('|'); return { id, name, arc, g }; });
  const playable = id => typeof CHARACTERS !== 'undefined' && CHARACTERS[id] && !CHARACTERS[id].npcOnly;

  function apply() {
    if (typeof CHARACTERS === 'undefined' || typeof CHARACTER_ORDER === 'undefined') return null;
    const list = []; GROUPS.forEach(([g, , s]) => list.push(...parse(s, g)));
    const listed = new Set(list.map(x => x.id)), last = parse(LAST, 'last');
    last.forEach(x => listed.add(x.id));
    /* 順序表裡還沒寫到的新角色：先放在最後三位之前，並提醒開發者補進順序表 */
    const extra = CHARACTER_ORDER.concat(Object.keys(CHARACTERS)).filter((id, i, a) => a.indexOf(id) === i && playable(id) && !listed.has(id));
    if (extra.length && typeof console !== 'undefined') console.warn('[圖鑑] 這些角色還沒排進 js/codex_order_v164.js：', extra.join(', '));
    extra.forEach(id => list.push({ id, name: CHARACTERS[id].name, arc: '', g: 'more' }));
    const seq = list.concat(last), slots = []; let n = 0;
    seq.forEach((x, i) => {
      n++; slots.push(Object.assign({ no: n, kind: playable(x.id) ? 'char' : 'name' }, x));
      if (n % (PERIOD + GAP) === PERIOD && i < seq.length - 1) for (let k = 0; k < GAP; k++) { n++; slots.push({ no: n, kind: 'res', g: x.g, arc: x.arc }); }
    });
    /* 套用到角色資料：編號、圖鑑順序（CHARACTER_ORDER 保持同一個陣列，其他模組的參照不會失效） */
    const order = slots.filter(x => x.kind === 'char').map(x => x.id);
    slots.forEach(x => { if (x.kind === 'char') { const c = CHARACTERS[x.id]; c.no = x.no; delete c.noText; c.codexArc = x.arc; } });
    const rest = CHARACTER_ORDER.filter(id => !order.includes(id)); /* 理論上不會有（npcOnly 不在 CHARACTER_ORDER）；保險起見保留在最後 */
    CHARACTER_ORDER.length = 0; CHARACTER_ORDER.push(...order, ...rest);
    if (CHARACTERS.imu) { CHARACTERS.imu.mystery = true; CHARACTERS.imu.noText = '???'; } /* 伊姆：未獲得前編號與身分都保持神秘（沿用 v91） */
    const joy = slots.find(x => x.id === 'joyboy' && x.kind === 'name'); if (joy) joy.hideNo = true; /* 喬伊波伊：No.???（沿用 v91） */
    if (typeof RESERVED_NOS !== 'undefined') { RESERVED_NOS.length = 0; slots.forEach(x => { if (x.kind !== 'char') RESERVED_NOS.push({ no: x.no, group: groupName(x.g), name: x.kind === 'name' ? x.name : '', hideNo: !!x.hideNo }); }); }
    CODEX.slots = slots; return slots;
  }
  const groupName = g => g === 'last' ? '傳說' : g === 'more' ? '新登場' : ((GROUPS.find(x => x[0] === g) || [])[1] || '');
  const CODEX = window.CODEX = { ARCS, GROUPS: GROUPS.map(([k, l]) => [k, l]).concat([['more', '新登場'], ['last', '傳說']]), PERIOD, GAP, apply, groupName, arcName: a => (ARCS[a] || [''])[0], arcWhere: a => (ARCS[a] || ['', ''])[1], slots: [] };
  apply();
})();
