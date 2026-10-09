# 程式地圖（CODEMAP）

參考 [AOCI-CODE](https://github.com/aoci-spec/aoci-code) 的「一檔一行」格式，讓任何人或 AI 開發助手在動手前先看懂整個專案。
**每次修改檔案的職責、依賴或對外介面時，同一個版本內一併更新這裡。**

格式：`檔案: F:負責什麼 | R:要一起看的檔案 | A:別人依賴的對外介面 | S:從程式碼看不出來、但絕對不能弄錯的事`

## 載入順序（index.html）
資料 → 引擎 → 主程式 → 擴充（後載入的檔案用「包裝函式」覆寫前面的全域函式，順序不能任意調換）。
`data.js → data_ext.js → story_ext.js → engine3d.js → landmarks.js → scenes.js → world.js →（模組）e3three.js → battle_core.js → battle.js → ext_effects.js → fx*.js → app.js → 其他模式與系統`

## 資料
- `js/data.js`: F:角色、篇章劇情、道具、難度等核心資料 | R:data_ext.js,story_ext.js | A:CHARACTERS,CHARACTER_ORDER,CHAPTERS,CHAPTER_DIFFICULTY,ITEMS,DATA_VERSION | S:改劇情或角色資料要把 DATA_VERSION 加一，否則後台舊設定會覆蓋新內容
- `js/data_ext.js`: F:v63 起的資料擴充（新角色、新篇章、四皇、立繪縮放 VIS、公告） | R:data.js,hub.js | A:CHARACTERS 的新增欄位,DEFAULT_NEWS | S:立繪縮放以 VIS 表為準，後台「立繪調整」的本機設定優先於這裡
- `js/story_more.js`～`story_more4.js`: F:劇情擴充第二彈（v86），各章序章、尾聲、任務對話、NPC 閒聊 | R:story_stage.js | A:- | S:同 story_ext 規則；閒聊（npc.chat）是一句一句的字串，依序播放
- `js/story_stage.js`: F:劇情立繪舞台（說話者亮起、聽者變暗、進場與呼吸動畫、旁白黑邊、每句特效 fx／emo）與 NPC→立繪對照表 | R:app.js(say/nextLine) | A:speakerArt,vnStageClear | S:NPC 對照只列確定同一人的（村裡的孩子 kid 不是尤斯塔斯·基德）；擊敗／連戰／蒐集任務完成時也會播該任務的台詞
- `js/story_ext.js`: F:為 13 篇章補對話、序章、尾聲與支線 | R:data.js | A:- | S:只能「加對話」不能增減任務步驟，否則舊存檔的任務進度會錯位

- `js/lobby_v118.js`: F:箭頭換 SVG（fixArrows）、點船長說話、限定召喚輪播控制、電腦版兩欄（搬移 DOM，.l2-colL/.l2-colR） | S:lobby.js 的 __lbEvNext 提供切換
- `js/rhythm_v118.js`＋`js/rhythm_charts.js`＋`css/v121_rhythm.css`（選曲／結算）＋`css/v121b_rhythm.css`（遊玩畫面 .rgx）＋`assets/ui/rhythm/`（預先處理的舞台素材）: S:舞台不要用 CSS mask／filter／混合模式（手機點擊時會閃黑），新效果先做進圖檔；美音晃動在 bob()（JS 改 transform） | F:歌姬挑戰（openRhythm；v121 由歌姬劇場改名），譜面 [ms, lane, 種類, 長按ms]；SAVE.data.rhythm（best、uta＝美音碎片 {shards, songs＝已領過的歌, total}；每首歌第一次 S 以上 +20）；長按 HOLD_OK＝0.7；FEVER（feverGain／feverOn）；潑墨背景 inkBg；固定 BOSS 美音 BOSS_CFG（依難度的體力、攻擊間隔、歌聲衝擊／催眠霧／五線譜束縛、HARD 魔王降臨）；半立體音軌（SF 遠端縮放、sAt/yAt/xAt 透視、laneOf(x,y) 依觸控高度換算軌道）；RHYTHM_UTA、renderShardPane 加上美音 | S:新歌用 tools/rhythm_chart_v121.py 產生（舊的 rhythm_beatmap.py／rhythm_lanes.py 不再使用）；開啟時呼叫 MUSIC.hold(true) 停止背景音樂（js/music.js），關閉時 hold(false)；RHYTHM._auto(ms) 自動演奏、_atk(種類)、_warn、_demon 為測試用；霧與束縛的淡入用 performance.now（歌曲時鐘在部分裝置會跳格）
- `js/roster_v121.js`／`ext_v121.js`／`fx_v121.js`: F:美音（uta，紅髮海賊團第 1 位）與效果 noteBurst、utaStunBonus、utaDemon（召喚魔王：倒下復活一次、反彈、詛咒）；utaRise(f) 給 battle.js（包住 checkBattleEnd）與 live.js（rise）共用；applyDamage 包裝處理詛咒 | S:roster_v121 必須在 roster_v91 之前載入；第 5 招有 formImage，屬於變身招式（fx_v104 transformFx）
- `js/roster_v128.js`／`ext_v128.js`／`fx_v128.js`／`css/v128.css`: F:凱多新立繪（kaido_v128.webp，鏡射）與第 5 招效果 kaidoDragon { image, scale, label }——第 5 招使用後（包住 executeAction，演出完才變身）雷光演出 kaidoDragonFx 再換成龍人型態（visMul 1.25）；kaidoDragonOn/Off 給 battle.js 與 live.js（act、rise）共用；倒下時由 applyDamage／checkBattleEnd 包裝恢復 | S:不用 formTurns（回合結束不恢復、霸王色 revertForm 不解除）；變暗與閃光用 #battleScreen 上的 .kd-dim／.kd-flash（不能畫在 canvas 上，鏡頭拉遠會變方框）；roster_v128 必須在 roster_v91 之前載入
- `js/roster_v129.js`／`ext_v129.js`／`fx_v129.js`: F:紅髮削弱；洛克斯（rocks，UR++）與五招效果 rocksTrue／rocksShun／rocksKill／rocksStore／rocksSecret；哥爾·D·羅傑（roger，npcOnly，只在洛克斯挑戰出現）；rocksPre／rocksPost（出招前暫時拿掉對手的護盾、無敵、閃避、反彈等，出招後恢復）給 battle.js（包住 executeAction）、live.js（act）、tests/duel-sim.js 共用 | S:ext_v129 必須是最外層包裝（ext_v128 之後）；殺的秒殺借用基本計算，BOSS 規則才會套用
- `js/rocks_v129.js`／`css/v129.css`: F:洛克斯挑戰（ROCKS_TRIAL：4 關連戰，SAVE.data.rocks）與皇帝領海展示頁下方入口橫條 | D:emperor_hall.js（包住 openEmperorHall）、EMPEROR_DOMAIN、startBattle | S:不加進 EMPEROR_DOMAIN.list（大廳與成就的四皇計數不能變）
- `js/fx.js`（v129）: S:特效畫布每幀依 .b-arena 的 getBoundingClientRect 反向放大蓋滿 .screen，setTransform 把戰場座標換到畫面；全畫面效果用 screenSpace() 畫
- `tests/duel-sim.js`: F:指定角色對戰模擬（window.__DUEL = { id, opps, rar, n, ultFirst }）
- `js/fx_v130.js`／`css/v130.css`: F:補上缺少的第 5 招奧義動畫（荷帝、羅傑；只在 CHOREO 沒有時才補）；toast 圖層、平板直式登入頁公告位置 | S:新角色的第 5 招一定要有 CHOREO[id][4]（或變身演出），可用瀏覽器檢查 CHARACTER_ORDER 中沒有動畫的奧義
- `js/progress_v131.js`: F:覺醒（roster[id].star）、技能等級（roster[id].sk）、新道具 awaken_gem／skill_book、每日活躍（SAVE.data.act）與本週活躍（SAVE.data.actW）；window.PROG／window.ACT | D:startBattle、computeSkillOutcome（DOMContentLoaded 時最外層包裝）、track（包裝後同步活躍度） | S:加成只在 opts.pvp 為否時套用；連戰帶入的 hp／pp 不能重複加成
- `js/pass_v131.js`: F:航海通行證（SAVE.data.pass，每月一季）＋每日活躍畫面（openPass('daily'|'pass')）；passAddXp | S:換季未領的獎勵會清掉
- `js/ladder_v131.js`: F:海賊天梯（SAVE.data.ladder；players/{uid}.lp_YYYYMM、lpS、lpTier、team）、賽季獎勵、本季排行 | S:積分在客戶端計算（可被修改，正式營運需伺服器計分）；排行依單一欄位排序，不需複合索引
- `css/v131.css`: 覺醒／技能等級、通行證、天梯畫面
- `js/progress_v132.js`: F:航海寶物（SAVE.data.gear {items, seq}；每件 {id, slot, rar, name, lv, subs, eq}）、技能專精（roster[id].spec）、覺醒被動（★3 護盾、★5 +1 與 __guts）；window.GEAR／window.PROG2 | D:startBattle（DOMContentLoaded 最外層，applyExtra 只在非 PvP）、applyDamage（撐住致命傷）、applyVisual（#bFL .aw3/.aw5）、track（塔／BOSS 掉落）、ACT.claimWeek、passAddXp | S:傷害加成只能乘 f.__dmgB／__ultB（由 progress_v131 的 computeSkillOutcome 包裝計算），不要改 dmgMul
- `js/trial_v133.js`: F:羈絆技能（BOND_SKILL、BOND_FX_TXT；戰鬥中 f.__bonds）、角色試煉（TRIALS 宿敵與劇情、TRIAL_ADJ 校準倍率、TRIAL_CFG；roster[id].trial）；window.TRIAL／window.BOND | D:startBattle（標記 __bonds，非 PvP）、applySkillEffects（奧義後觸發；depth 計數避免變體遞迴重複觸發）、PROG.starUp（★4→★5 需要試煉） | S:新增角色時在 TRIALS 加宿敵與劇情，並用 tests/trial-sim.js 的 calibrate 求出 TRIAL_ADJ；沒有資料時用「另一個自己」
- `css/v133.css`: 試煉視窗 .tr-*、培養視窗 .gw-trial、羈絆列 .gw-bond
- `js/qol_v135.js`: F:掛機寶藏（AFK_CFG；SAVE.data.afk {t, fast}；大廳 #lbAfk）、召喚紀錄（SAVE.data.gachaLog 最多 300 筆；window.gachaLog，event.js 限定召喚也會呼叫）、編隊預設（SAVE.data.presets 3 組；#cxPane_crew .tp-row）、劇情跳過 #dlgSkip（直接操作 app.js 的 dlgQueue／typing／dlgChoices）、活躍寶箱全部領取（.ps-claimall）；window.QOL | D:pull（暫時替換 grant 取得結果）、openModes；document.body 的 MutationObserver（每幀最多一次）
- `css/v135.css`: .qo-*（掛機寶藏、召喚紀錄視窗）、.tp-*、#dlgSkip、.ps-claimall
- **3D 分段下載（v135）**: index.html 不再直接載入 e3three.js；js/engine3d.js 的 window.ensure3D() 用 import() 載入（importmap 仍在 index.html），app.js enterChapter 先 await ensure3D() 再建立 World；進入遊戲 15 秒後背景預先下載
- `js/ret_v136.js`: F:一般召喚券 ITEMS.summon_ticket（pull 外層包裝：券夠時先補回寶藏幣再呼叫原本的 pull）、回歸玩家 RETURN_CFG／window.RETURN（check／claim；SAVE.data.lastSeen、SAVE.data.ret）| D:pull、updateGachaBtns、openModes（第一次進大廳時 check） ；v137 領取視窗 RETURN.open（.rt-wrap，每天第一次進大廳自動跳出）、大廳入口 #lbRet（RETURN.rail） | S:樣式在 css/v137.css；視窗沿用 .qo-wrap
- `js/fx_v138.js`／`css/v138.css`: F:技能特效三層升級（FXPRO 泛光／命中／焦點；屬性氣場、魔法陣、屬性命中；CHAR_FX[id]=[主題, 奧義轉場, 配色]、__FXTR 轉場表、__FXPAL 主題配色）| D:FXE.add（啟動泛光）、FXE.P.flash／tint（期間降低泛光）、FXE.P.ring、hitFX、playChoreo（三層包裝） | S:開關 op_fxpro（'0'＝低）；新角色要在 CHAR_FX 加一行，否則依屬性挑主題、沒有奧義轉場；泛光圖層 #bBloom 跟著 #bCanvas 的位置
- `js/stab_v139.js`／`css/v139.css`: F:全畫面視窗打開時 body.ov-cover（隱藏後面的 .screen 與 .modal.show、暫停動畫）、body.ov-open；觸控裝置拿掉視窗毛玻璃與大圖陰影濾鏡 | S:新增全畫面不透明視窗時把 class 加進 OPAQUE；不要在大張立繪上用 filter:drop-shadow（手機 GPU 會繪製不完整）
- `js/fx_v140.js`: F:角色招牌動畫 MOTIF[id] → __MOTIF 繪製函式（每次出招，奧義放大；輔助招式繞著自己） | D:playChoreo | S:新角色要在 MOTIF 加一行；開關沿用 op_fxpro
- **class 名稱衝突（v140 修正）**: .ld-bg 是載入畫面的背景；天梯畫面請用 .ld-wrap .ld-bg，不要寫全域 .ld-bg
- `js/loader.js`: F:載入畫面，下載並檢查圖片後才顯示「點擊進入」；只預載已擁有角色的立繪與已擁有皮膚（v134），篇章封面與 *_bg 大背景（LATER）在進入後背景下載 | S:不要在其他檔案預先下載全部角色立繪（v134 前 app.js 會多下載約 33 MB）
- `js/hint_v134.js`: F:培養紅點 growHints(id)（star／trial／sk／gear）、寶物工具列（一鍵裝備最佳 bestEquip、分解 R／SR）、結算掉落 .gr-drop；window.GROWHINT | D:GEAR.addGear（戰鬥結束後的掉落寫進結算）、openGrow、openModes、SAVE.save（存檔後重畫紅點）；觀察 #growModal、#charModal 的變動 | S:#growModal.dataset.id 由 grow_v112 render 設定
- `css/v134.css`: .gh-dot 紅點、.gr-tools、.gr-drop
- `css/v132.css`: 寶物分頁、專精按鈕、覺醒外框（.gw-art.aw3f/.aw5f）、戰鬥 ★5 光效
- `js/grow_v112.js`（v130）: S:重畫培養視窗時沿用舊的立繪 <img>（src 相同才沿用），避免大圖重新解碼閃爍
- `js/lobby_v121.js`＋`css/v121.css`: F:手機直式大廳的船長對話框放在限定召喚上方（量測左側圖示欄、右側欄、限定召喚橫條；依序：置中 → 偏左 → 縮小字級 → 收縮展開膠囊 say-fold／say-open） | A:lobbyPlaceSay
- `js/roster_v118.js`／`ext_v118.js`／`fx_v118.js`: F:尼卡魯夫（luffy_nika）與效果 dmgToShield、nikaThunder（battle.js 的 onEvaded 掛鉤）、nikaTeamHeal、nikaTriple、nikaLegacy
- `js/bag_v116.js`: F:背包 openBag（取代 app.js 版；分類 CAT_OF、獲取方式 SRC/GO、使用 USE）、頭像快取參數 FACES、橫式立繪偵測（.cer-char/.cx-art img 加 .wide） | S:vip_v115 之後載入；新道具要補 CAT_OF 與 SRC
- `css/v116.css`: F:背包 .bg2-*、船團 .gl-*（舊 .gd-card/.gd-wrap 是新手導覽的類別，船團不要再用）
- `js/vip_v115.js`: F:VIP 會員中心 openVIP（會員／月費／儲值）、VIP 等級 vipLevel（SAVE.data.vip.paid）、福利 PERK（貝里／經驗加成包住 addBerry、gainExp）、月費 MC（SAVE.data.mcard、每日寶藏幣 mcClaim）、登入宣傳 mc-ad（SAVE.data.mcAdHide；v141 起新手導覽 GUIDE 未完成或 .gd-wrap 顯示時不跳，guidePending）、新道具 event_ticket／char_select、openCharSelect、大廳徽章 refreshLobby、VIP.recharge（儲值入帳，目前只給後台測試） | R:modes.js openModes、lobby.js renderLobby、event.js（限定抽獎券）、social.js／guild.js（vipTag） | S:月費檔期改 MC；新月費要新的 id 與皮膚 monthCard 欄位
- `js/roster_v115.js`: F:燼（king）、皮膚 king_halloween、和之國篇小 BOSS 步驟 | S:必須在 roster_v91 之前載入；步驟插入的舊存檔轉換在 app.js chState（v115）
- `js/ext_v115.js`: F:效果 ppUpRandom、kingFlame（減傷＋反彈，熄滅時加速） | S:ext_v110 之後載入
- `js/fx_v115.js`: F:燼第 1～4 招專屬動畫
- `css/v115.css`: F:寶藏幣新圖示（覆蓋 .coin-ico）、VIP 會員中心、月費宣傳、VIP 徽章／頭像框／聊天氣泡
- `js/grow_v112.js`: F:角色培養視窗 openGrow（openGrow(id, tab)；分頁：升級／覺醒／技能／寶物；v133 覺醒頁 ★4 起顯示試煉 .gw-trial、奧義下方顯示羈絆 .gw-bond；v132 技能 Lv5 顯示專精按鈕 .gw-spec、寶物頁 gearPanel 與選擇清單 gearPick；升級頁、技能頁；v114 起技能列電腦點擊展開 skDetail、觸控長按 0.45 秒彈出 .gw-pop 說明卡） | R:crew.js(#cxPane_crew .sb-acts) | S:樣式在 css/v112.css＋v113.css＋v114.css；z-index 2000（說明卡 2100）
- `css/v114.css`: F:培養視窗置中對齊（.gw-lvl 等級列、.gw-pow）、技能詳細說明樣式、冒險選單 #lbModes 卡片等高與標題對齊（container query 縮放標題字級）
- `js/fx_v111.js`: F:奧義標題字過場（PRESET 風格表、SUB 角色→[風格, 副標]、cutIn 覆寫、ultTitle） | S:新角色要在 SUB 加一行，否則依屬性挑風格
- `js/fx_v106.js`: F:主題式專屬特效（TH 主題表、WHO 角色對應、kindOf 招式種類） | S:要讓角色換主題改 WHO；不覆蓋既有 CHOREO
- `js/fx_v105.js`: F:鷹眼／羅（七武海）／衛伯／巴基斯／斯巴可第 1～4 招專屬編排 | S:DOMContentLoaded 後註冊，不覆蓋既有 CHOREO
- `js/story_stage.js` (v106): 沒有立繪的說話者用 npc_blank（stageArt／isBlank）
- `js/story_more5.js`: F:任務收尾對白與 NPC 閒聊（以 step.title 定位） | R:app.js completeStep → playAfterLines
- `js/fx_v104.js`: F:一般招式精緻化外層、ANIMA_FX 補齊、巨人重擊、奧義主題補齊（DOMContentLoaded 後套用，因角色擴充檔較晚載入）、isTransformSkill／transformFx | R:battle.js（變身判斷） | S:fx_ult.js 之後載入
- `js/ext_v102.js`: F:v102 新戰鬥效果（birdcageHits、recastChance、clearBuffsChance、enemySpdDownTemp、endTurnCurse、copyDrainPP、*Range 隨機值） | S:ext_effects.js 之後載入；tests/check-data.mjs 也會讀它
- `js/roster_v103.js`: F:黑鬍子（七武海）blackbeard_w、鷹眼（七武海）mihawk_w、巴基斯 burgess、斯巴可 vasco；頂上戰爭篇小 BOSS 步驟與 NPC；通關角色補發 | S:roster_v91 之前載入；app.js chState 的 v103 進度位移
- `js/roster_v101.js`: F:愛德華·衛伯（SSR）、托拉法爾加·羅（七武海）law_w（SR，pending 立繪）、羅（SSR）改限定、七武海羈絆成員 | S:必須在 roster_v91 之前載入（序號 law_w 035、weevil 036）
- `js/roster_v92.js`: F:多利 SSR、洛基 UR+（限定池）、布洛基（立繪準備中，用 pending_giant.svg）、羈絆「艾爾巴夫的雙鬼」（capFree，可超過 10% 上限；dr＝減傷） | S:必須在 roster_v91 之前載入
- `js/roster_v91.js`: F:角色序號規則（使用者指定）：No.001～011 主角群、012～026 海軍與世界政府、027～039 王下七武海、040～102 四皇團員（白鬍子 16、紅髮 11、百獸 12、BIG MOM 8、黑鬍子 10、十字公會 6）、103～109 四皇、110～209 其他角色（依遊戲篇章分區）、No.??? 伊姆、No.??? 喬伊波伊；「?群組」是預留神秘編號，「!」是連編號都隱藏、寇沙／布魯克／多利數值調整 | S:新增角色時把 id 加進 ORDER 的對應篇章位置
- `js/roster_v90.js`: F:布魯克、阿玉、多利、寇沙 | R:roster_v89.js | S:布魯克的奧義 restoreOnce（藥水只能補一次）；靈魂歡歌用到 nextAttackMultChance、nextLifestealRange（battle_core 新增）
- `js/roster_v89.js`: F:稀有度八階（RAR_ORDER）、v89 新角色（克比三版本、甚平、錦衛門、懷帕、瑪琪諾）、既有角色等級調整、取得方式、已通關玩家補發 | R:hub.js(CHAR_RARITY),app.js(CHAR_RATE_BY_RARITY),crew.js(RAR_COLOR) | A:RAR_ORDER | S:新增稀有度時要同步 RAR_COLOR、ext_effects 的 RANK、SELL_VALUE、rarityScale、CSS 的 .r-*；C 級進一般召喚池時同時調高 charRate、調低 N 道具出率，讓 UR／SSR／SR 的實際出率不變

## 戰鬥
- `js/battle_core.js`: F:傷害公式、技能效果、狀態、難度套用 | R:battle.js,ext_effects.js | A:buildFighter,applyDamage,applySkillEffects,computeSkillOutcome,endTurnStatus,applyRarityScale | S:即時對戰（live.js）在主機上直接呼叫這些函式計算回合，函式不能依賴畫面元素
- `js/battle.js`: F:戰鬥畫面流程、HUD、出招順序 | R:battle_core.js,seer.js,fx_choreo.js | A:startBattle,battle(全域),STRUGGLE | S:battle 是 let 全域，即時對戰計算時會暫時替換它
- `js/ext_effects.js`: F:v63 新效果（暈眩、霸王色、老爹、神避、冰河時期、恢復全技能次數）與 enemyMod 擴充 | R:battle_core.js,emperor.js | A:CHAPTER_DIFFICULTY.emperor/pvp,grantDad | S:用包裝函式擴充，不改舊角色行為
- `js/fx.js`、`js/fx_choreo.js`、`js/fx_ult.js`: F:特效引擎、角色專屬編排、其餘角色的奧義與一般招式主題特效 | R:battle.js | A:X,CHOREO,playChoreo | S:X.text 會自動縮字並限制在畫面內；新增專屬編排時 fx_ult 不會覆蓋

## 登島 3D
- `js/engine3d.js`: F:舊版輕量 WebGL 引擎與幾何建構器 Builder | R:scenes.js | A:E3.Renderer,E3.Builder,E3.M | S:Builder.box 的 y 是底部不是中心；v125 起 global.E3_HD（e3three.js 設定）開啟時，terrain 網格加倍並用 triV 逐頂點顏色、記錄 Builder.smooth 範圍讓渲染器算平滑法線，sphere／cyl 分段 ×1.5
- `js/e3three.js`: F:Three.js 版渲染器，介面與 E3.Renderer 相同，13 座島共用；v125 toon({detail}) 世界座標表面細節、柔邊陰影、草叢分片、地面小石子 | R:engine3d.js,world.js,vendor/three | A:R3（取代 E3.Renderer）,setIsland | S:設定 op_r3=0 或不支援 WebGL2 時退回舊引擎；水面、天空不畫舊網格
- `js/scenes.js`: F:各島地形、建築、植被、NPC 造型（npcMesh／LOOKS） | R:landmarks.js,data.js | A:SCENES.buildScene,SCENES.npcMesh | S:建築與道具要避開 layout.path、NPC 位置與任務地點（CHAPTERS 是 const，要用 typeof CHAPTERS 取得，不能用 global.CHAPTERS）；被碰撞包住的 NPC 會自動推到外側；13 座島全部是正式版；共用擺放工具 placer(D,O,H,章節id)；`_xxxOld` 是舊版函式，已不再使用；P.ship 已改用細節版 P.ship2（回傳甲板高度與局部座標）；德雷斯羅薩暫用 _alabastaOld、蛋糕島暫用 _skypieaOld、蛋頭島暫用 _eniesOld、蜂巢島用 dark
- **立體結構（scenes.js 的 K）**: F:可走的平台／樓梯／橋（plats）、會擋人的牆（walls）、走進去會隱藏的屋頂（roofs）、兩層樓可進入的房子 house2 | R:world.js | A:scene.G(x,z,y),scene.onPlat,scene.walls,scene.roofs | S:只支援與 x／z 軸對齊的矩形；K.tower 是外圍螺旋樓梯高塔；牆頂要比上方地板低 0.6 以上，否則走上去會被牆卡住；樓梯每階高度 ≤0.38、玩家自動跨上 ≤0.8 的高度，超過要跳；平台高度相差要 >0.8 才不會誤判成同一層
- **環境飄落物（e3three.js setIsland 的 AMB 表）**: 每座島一組 [顏色, 數量, 上升/下降速度, 大小, 形狀 0塵 1花瓣 2氣泡 3光點]；低畫質自動減量
- `js/landmarks.js`: F:各島原作地標，自動找空地放置 | R:scenes.js | A:LANDMARKS.build | S:放置時同時加入碰撞清單 O
- `js/world.js`: F:探索、移動、跳躍與重力、牆壁碰撞、鏡頭、NPC 互動、小地圖 | R:scenes.js,app.js | A:World | S:只透過 renderer 介面繪圖，換引擎不用改這裡；空白鍵是跳躍、E／Enter 是互動
- `dev/east3.js` + `dev/sample_east.html`: F:東海 3D 場景樣板（開發用獨立頁面，用 <base href="../"> 對齊根目錄） | R:vendor/three | A:- | S:只是樣板，不影響正式關卡

## 大廳與介面
- `css/v127.css`: F:劇情對話框 #dialog 最終覆蓋：沒有 .show 時隱藏、名牌 .dlg-name 絕對定位在左上角、固定最小高度 | S:舊規則（lobby2.css opacity:1、style.css display:block）會讓隱藏中的對話框露出來，不要移除這裡的 :not(.show)
- `js/lobby.js` + `css/lobby2.css`: F:大廳（左側圖示、限定召喚、主線航路、出戰陣容、皇帝領海徽章、下方 7 欄導覽列：3 分頁＋盾形「出航」徽章＋3 分頁） | R:lobbyicons.js,settings.js(GUIDE) | A:renderLobby,lobbySyncLayout | S:左右面板的位置依實際量到的頂部列高度（--l2tb）與限定召喚卡底部（--l2eb）；遵守 8px 網格與同列等高置中
- `js/settings.js`: F:設定頁與新手教學 | R:lobby.js | A:openSettings,GUIDE | S:教學只能捲動可捲動的容器，不能捲整個頁面
- `js/ceremony.js`: F:「恭喜獲得」儀式畫面與篇章收穫結算 | R:app.js | A:showRewards | S:進島時記錄快照，通關時比對差異
- `js/daily.js`: F:七日之約、每日補給、掃蕩、匯出存檔 | A:openLogin,loginClaimable
- `js/crew.js`: F:船員背包（個人頁、圖鑑、碎片、訓練營）

## 模式
- `js/event.js` + `js/data.js`(EVENT_POOLS,EVENT_CALENDAR): F:限定活動抽獎池、檔期（live／soon／rest）、碎片合成 | R:lobby.js(lobbyPools),crew.js | A:eventPhase,eventWindow,eventWindows,eventSchedule,eventPoolsSorted,eventState | S:檔期用台灣時間；every:'year' 每年重複（MM-DD，end 早於 start 為跨年）、end 是「下一刻關閉」；預告期間 st() 不發抽獎券；新增活動＝在 EVENT_POOLS 加池、在 EVENT_CALENDAR 加一筆檔期
- `js/emperor.js` + `js/emperor_hall.js`: F:皇帝領海規則與四皇展示頁 | A:EMPEROR_DOMAIN,openEmperor(id),openEmperorHall | S:openEmperor(id) 進入單一四皇模式，返回會回到展示頁
- `js/tower.js`、`js/throne.js`、`js/runner.js`、`js/hardmode.js`、`js/exchange*.js`、`js/treasure.js`、`js/weekly.js`、`js/achieve.js`: 各模式與活動

## 多人
- `js/cloud.js`: F:Firebase 帳號（Google、信箱）與雲端存檔 | A:CLOUD | S:登入只用信箱；usernames 不存信箱；舊存檔覆蓋前一定先詢問
- `js/social.js`: F:好友、留言、送禮、排行榜、非同步對戰 | A:openSocial | S:好友對戰沒有獎勵
- `js/live.js`: F:即時對戰 1v1／3v3 與觀戰 | A:LIVE | S:邀請方是主機，所有回合由主機計算後寫回房間
- `js/guild.js`: F:船團、船團 BOSS、留言板 | A:openGuild,GUILD_CFG
- `firestore.rules`: F:Firestore 安全規則 | S:新增集合時一定要更新，並提醒使用者重新發布

## 測試
- `tests/check-data.mjs`: 資料檢查（node 執行）
- `tests/e2e/`: 瀏覽器自動測試（見 tests/e2e/README.md）
