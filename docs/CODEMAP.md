# 程式地圖（CODEMAP）

參考 [AOCI-CODE](https://github.com/aoci-spec/aoci-code) 的「一檔一行」格式，讓任何人或 AI 開發助手在動手前先看懂整個專案。
**每次修改檔案的職責、依賴或對外介面時，同一個版本內一併更新這裡。**

格式：`檔案: F:負責什麼 | R:要一起看的檔案 | A:別人依賴的對外介面 | S:從程式碼看不出來、但絕對不能弄錯的事`

## 載入順序（index.html）
資料 → 引擎 → 主程式 → 擴充（後載入的檔案用「包裝函式」覆寫前面的全域函式，順序不能任意調換）。
`data.js → data_ext.js → story_ext.js → engine3d.js → landmarks.js → scenes.js → isle2.js → isle2_parts.js → isle2_<島>.js → world.js →（模組）e3three.js → battle_core.js → battle.js → ext_effects.js → fx*.js → app.js → 其他模式與系統`

## 資料
- `js/data.js`: F:角色、篇章劇情、道具、難度等核心資料 | R:data_ext.js,story_ext.js | A:CHARACTERS,CHARACTER_ORDER,CHAPTERS,CHAPTER_DIFFICULTY,ITEMS,DATA_VERSION | S:改劇情或角色資料要把 DATA_VERSION 加一，否則後台舊設定會覆蓋新內容
- `js/data_ext.js`: F:v63 起的資料擴充（新角色、新篇章、四皇、立繪縮放 VIS、公告） | R:data.js,hub.js | A:CHARACTERS 的新增欄位,DEFAULT_NEWS | S:立繪縮放以 VIS 表為準，後台「立繪調整」的本機設定優先於這裡
- `js/story_more.js`～`story_more4.js`: F:劇情擴充第二彈（v86），各章序章、尾聲、任務對話、NPC 閒聊 | R:story_stage.js | A:- | S:同 story_ext 規則；閒聊（npc.chat）是一句一句的字串，依序播放
- `js/story_stage.js`: F:劇情立繪舞台（說話者亮起、聽者變暗、進場與呼吸動畫、旁白黑邊、每句特效 fx／emo）與 NPC→立繪對照表 | R:app.js(say/nextLine) | A:speakerArt,vnStageClear | S:NPC 對照只列確定同一人的（村裡的孩子 kid 不是尤斯塔斯·基德）；擊敗／連戰／蒐集任務完成時也會播該任務的台詞
- `js/story_ext.js`: F:為 13 篇章補對話、序章、尾聲與支線 | R:data.js | A:- | S:只能「加對話」不能增減任務步驟，否則舊存檔的任務進度會錯位

- `js/lobby_v118.js`: F:箭頭換 SVG（fixArrows）、點船長說話、限定召喚輪播控制、電腦版兩欄（搬移 DOM，.l2-colL/.l2-colR） | S:lobby.js 的 __lbEvNext 提供切換
- `js/rhythm_v118.js`＋`js/rhythm_charts.js`＋`css/v121_rhythm.css`（選曲／結算）＋`css/v121b_rhythm.css`（遊玩畫面 .rgx）＋`assets/ui/rhythm/`（預先處理的舞台素材）: S:舞台不要用 CSS mask／filter／混合模式（手機點擊時會閃黑），新效果先做進圖檔；美音晃動在 bob()（JS 改 transform） | F:歌姬挑戰（openRhythm；v121 由歌姬劇場改名），譜面 [ms, lane, 種類, 長按ms]；SAVE.data.rhythm（best、uta＝美音碎片 {shards, songs＝已領過的歌, total}；每首歌第一次 S 以上 +20）；長按 HOLD_OK＝0.7；FEVER（feverGain／feverOn）；潑墨背景 inkBg；固定 BOSS 美音 BOSS_CFG（依難度的體力、攻擊間隔、歌聲衝擊／催眠霧／五線譜束縛、HARD 魔王降臨）；半立體音軌（SF 遠端縮放、sAt/yAt/xAt 透視、laneOf(x,y) 依觸控高度換算軌道）；RHYTHM_UTA、renderShardPane 加上美音 | S:新歌用 tools/rhythm_chart_v144.py 產生（逐拍追蹤＋起音時間校正；--check 檢查譜面與音樂的誤差；v121 以前的產生器不再使用）；歌曲資料的 beats＝每一拍毫秒，節拍線與脈動 beatPhase／beatLines 使用；開啟時呼叫 MUSIC.hold(true) 停止背景音樂（js/music.js），關閉時 hold(false)；RHYTHM._auto(ms) 自動演奏、_atk(種類)、_warn、_demon 為測試用；霧與束縛的淡入用 performance.now（歌曲時鐘在部分裝置會跳格）
- `js/roster_v142.js`／`ext_v142.js`／`fx_v142.js`: F:娜美（nami，No.003，SSR，一般池）與效果 namiZeus（奧義依自身速度提升加傷）、namiSteal { pp, to }（偷走對手能力提升與技能次數）；皮膚 nami_cloud（event:'weather142'） | S:roster_v142 必須在 roster_v91 之前載入；ext_v142 在 ext_v121 之後、ext_v128 之前
- `js/skins_v143.js`: F:皮膚 nami_witch（月費 2026-10，MC.extraSkins）、robin_city（一般懸賞召喚 0.5%）＋抽獎道具 ITEMS.skin_robin_city（noPool）；包住 rollOne（無 minR 且抽到 SSR 道具時依比例換成皮膚）、grant（皮膚入 SAVE.data.skins.owned，重複換覺醒結晶 ×10）、openGacha（機率表加一列） | R:app.js、vip_v115.js | S:vip_v115 之後載入；ITEMS.noPool 的道具不進一般道具池與活動池
- `js/gacha_v144.js`＋`css/gacha_v144.css`＋`assets/gacha/`: F:一般懸賞召喚新演出（電話蟲版；window.GACHA_FX）。Shadow DOM 隔離樣式；包住 pull（記下 1／10 抽）、playMachine（新演出時跳過扭蛋機）、showResults（改播新演出）、toast（演出中排隊，關閉後顯示） | R:app.js（pull、grant、gachaBusy、updateGachaBtns、coins、itemIcon）、stab_v139.js（.gfx-host 算全畫面不透明） | S:結果由 pull 決定並先 grant，演出只呈現；百連與新手召喚仍用 playMachine；演出等級 mapRes（道具 N0～SSR3、船員 4、UR 以上 5）；改演出請改 js/gacha_v144.js 本身（原始示意在 v143 對話的 src5.html，已不再同步）
- `js/balance_v142.js`: F:全角色平衡表 STAT_V142（各角色 statScale）、RARITY_V142（各稀有度 rarityScale）；window.BALANCE_V142 | R:battle_core.js rarityScale、tests/tier-sim.js | S:必須在所有 roster 檔（含 roster_v91）之後載入；只影響套用 applyRarityScale 的玩家角色、PvP 與試煉換算，關卡敵人不受影響；新增角色後用 tier-sim 重新求值
- `js/weekly.js`（v142）: F:限時活動 WEATHER_FEST（天候祭：活動期間戰鬥勝利 goal 場領皮膚；SAVE.data.wfest {id, base, got}）、window.WFEST | S:進度從活動期間第一次進大廳時開始算；換新活動要換 id
- `tests/tier-sim.js`: F:稀有度對戰矩陣（window.__TIER = { ids, pairs?, n, scale, rs }），平衡調整用；復活規則與 live.js rise 相同
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
- `js/ext_v167.js`＋`js/balance_v167.js`: F:trueBurst（真實傷害追加最大體力 N%，對 BOSS 減半）、shadowAdd/shadowBonus（莫莉亞影子疊層，最多 5 層，4 回合消散）；七位角色數值
- `js/ext_v168.js`: 皇帝領海第二、三階段 noExec（攔截所有秒殺路徑→傷害 0、回滿體力）；loader.js 之前載入
- `js/ext_v169.js`: 通用效果 foresight（看穿：每回合第一次受到的攻擊必定迴避，破無敵／必中／自由不受影響）、imuPact.chain（契約連鎖後排扣血）、splash（後排波及）。ext_v165 新增 maxForm（伊姆晉升上限，塔 imuMaxForm）、paceNext、天罰 judge
- `js/fx_imu_v170.js`、`css/fx_imu_v170.css`：伊姆全技能特效（14 招專屬編排、晉升 imuFormFx 覆寫 fx_v165 版、天罰、看穿／後排波及提示、領域氛圍）。包住 playChoreo、triggerImpact、log、IMU165.preAct/postAct、onEvaded、applySkillEffects、endTurnStatus、renderHUD、startBattle、finishBattle；用 FXE 畫布＋立繪後方 DOM（王座、雙翼）＋VFX00.fx（fx_vfx_v155 新開放）。降級：減少動態／技能特效低／省電／手機
- `js/ext_v172.js`: F:洛基三型態（CHARACTERS.loki.forms／form2Skills／form3Skills、第 5 招 lokiAscend）與通用效果 lokiDispel（打散強化＋封鎖）、godSlayer（對變身中的對手加倍）、必中無視降低命中（包 IMU165.preAct）；第二、三型態招式與晉升特效（包 playChoreo）｜window.LOKI172 | S:伊姆第三型態 5 回合降回（ext_v165 revert3、forms[3].turns）
- `js/cam_v173.js`、`css/cam_v173.css`: F:自動取景，包 battle.js 的 updateCamera（下一幀 fit()：圖片不透明範圍 alphaBox、上下界＝.b-top 下緣～技能欄上緣、拉遠到 0.16、--fitX 左右推開） | S:只在原本鏡頭 <1 時啟動；window.__camDebug 印出取景過程 ｜ v195：fit() 改成解析式（box() 用 offset 版面座標＋--sc/--vx/--vy 算不透明範圍，place() 決定兩人位置，二分搜尋鏡頭倍率）；updateCamera 每場第一次之後保留目前鏡頭；匯出 __camBox(side)（畫面座標）、__camTx(side)（站位位移，fighterPoint 已加上）
- `js/account_v175.js`、`css/account_v175.css`: F:首次登入詢問帳號（包 startGame；ask／pick；聽 cloud:none、cloud:fresh；SHOW_LINE 開關）| S:cloud.js found() 找到雲端存檔的視窗、op_acct_asked 記住已問過
- `js/faces_data_v178.js`、`js/faces_v178.js`: F:立繪臉部對焦（CHAR_FACE＝{立繪路徑:[x,y,臉寬]}；MutationObserver 監看 assets/chars 的圖片，object-fit:cover 的依臉部算 object-position，小框加 translate＋scale；含 .gfx-host 的 shadow DOM；戰鬥結算 #bResImg 包 .res-art）| S:新增立繪後執行 tests/face_fp.py 重新產生
- `js/items_v179.js`: F:道具分類 ITEMS[id].cat／limit、新道具 potion_m／pp_l／guard_pot／haki_l、包 useItem（單場上限 battle.itemUse）、applyItem（itemDR、defUp、spdUp）、computeSkillOutcome（防禦藥劑減傷）、endTurnStatus、renderBag（分組）
- `js/content_v180.js`: F:角色介紹修正（CHARACTERS[id].desc）、BOUNTY_POOL／BOUNTY_PREMIUM 新任務（grows、pvp、sweeps、rhythm、digs）
- `js/stages_v181.js`＋`css/stages_v181.css`: F:活動關卡 #stageScreen（openStages('fest'|'realm')）、大廳右側入口 #v181Rail、限時祭典 FESTS（檔期、三難度、祭典商店 goods／buy）、每日秘境 REALMS（每天 3 次、掃蕩）、存檔 SAVE.data.stg、window.STAGES
- `css/sys_v183.css`: F:懸賞單精簡卡片（#bountyList .bounty.v183、.bt-head／#bountyAll）、道具商店（.shop-v183、.sh-cats、.sh-grid、#shopSheet 購買面板）、成就 .ach-head 全部領取。邏輯在 js/hub.js（renderBounty、claimBounty、bountyGo、BOUNTY_GO、renderShop、shopGoods、SHOP_CATS）與 js/achieve.js
- `js/roster_v185.js`: F:新角色 reiju（SR）、robin_wano（SSR）（技能、CHAR_RARITY、CHAR_OBTAIN、蛋糕島／和之國 NPC）、薇薇皮膚 vivi_water 換圖、刪除 robin_city 的存檔補償、CHAR_FACE 補值
- `js/viona_v187.js`: F:原創角色 viona（UR）資料、女神之印被動、魅惑／臣服狀態（ABN.charm、ABN.subdue）、維納斯型態（setVenus）、技能自訂效果 vio*、紫紅特效 VFX（v193：pt 角色範圍、back 身後圖層、sp 畫布素材、fw 畫布時間等待）、限定池 venus_viona＋檔期、皮膚 viona_bunny
- `js/passives_v190.js`: F:角色被動 CHARACTERS[id].passive（伊姆、洛基、尼卡魯夫、凱多），清理介紹與技能說明；尼卡魯夫開戰即帶 __legacy。顯示在 js/crew.js skillCards
- `css/align_v168.css`: 全畫面對齊修正（text-box 裁切置中、同列等高、省略號）；最後載入的 css。量測工具在 /root/promo/v168/align/
- `js/rocks_v166.js`＋`css/rocks_v166.css`: F:洛克斯新立繪（battleScale .85）、舊立繪皮膚 rocks_classic（擁有洛克斯自動獲得）、原造型戰鬥中的閃電環繞 .rocks-aura（包住 applyVisual）
- `js/ext_v165.js`＋`js/balance_v165.js`＋`js/fx_v165.js`＋`css/v165.css`: F:伊姆三型態（__imu.form 0/1/2、晉升、各種契約／領域／抹除狀態）與洛基、尼卡、洛克斯、黑鬍子的通用克制效果；IMU165.preAct/postAct 給 battle.js 與 tests/*-sim 共用 | A:assets/chars/imu_form1、imu_form2 | T:tests/imu-sim.js
- `js/twtime_v165.js`: F:window.TW（台灣時間 today/now/伺服器誤差校正），today() 都走這裡 | S:必須在 head 最前面載入
- `js/admin.js`: F:管理後台；DOMContentLoaded 套用、直接覆寫並記住原值、只存改過的欄位；DATA_VERSION 不同時備份停用
- `js/visual_admin.js`＋`css/admin_v165.css`: F:立繪測試；op_visual_v1 存 battleScale、faceLeft、dx、dy、img；型態代號 form:<id>（伊姆 form:imu_form1／form:imu_form2）；位置以 --vx/--vy translate 套用
- `css/fix_spin_v165.css`: F:戰鬥立繪待機與變身動畫改用 translate／scale 屬性（避免鏡射時被當成旋轉），保留 --vx/--vy
- `js/roster_v164.js`＋`js/ext_v164.js`: F:賈巴、雷利、巴托洛米奧（eventOnly）、三款皮膚、限定池 roger_hands／barto_fan、巨人篇 NPC gaban_n；ext_v164 的 bartoBarrier（絕對防禦期間還原對手造成的一切變化）、皮膚 bonus 在 buildFighter 套用
- `js/balance_v164.js`: F:娜美、羅賓→SR，亞爾麗塔→R，近海之王→RR 與 statScale
- `js/codex_order_v164.js`＋`css/codex_v164.css`: F:圖鑑全角色順序表（id|名字|篇章），載入後重給 no、重排 CHARACTER_ORDER、每 30 號留 5 格、最後 imu/rocks/joyboy；未實裝名字卡 | S:no 只用於顯示，存檔用 id
- `js/perf_v194.js`＋`css/perf_v194.css`: F:跨系統的效能與記憶體處理——離開島嶼時釋放 3D 後製緩衝（包住 showScreen）、分頁進背景時清特效；CSS：關閉的 .modal／.sheet／.loading 用 visibility:hidden、觸控裝置不做背景模糊 | S:新的全螢幕遮罩若用「opacity:0＋pointer-events:none」隱藏，記得一起加 visibility:hidden（否則仍會排版、佔圖層）；戰鬥的四層特效畫布（#bCanvas、#bBloom、#bPGL、#bVFX）閒置時是 visibility:hidden，新增畫特效的入口要走 FXE.add／kick／wake 才會顯示；量測工具在 /root/promo/v194（perf.py、mem.py、layers.py、sweep.py）
- `js/battle_v195.js`＋`css/battle_v195.css`: F:①覆寫 floatText——傷害／補血／狀態文字畫在 #battleScreen 最上層 #bDmgTop（位置用 __camBox，連續命中錯開）；②結算畫面——把 #bResTitle／#bResDesc／.res-actions 搬進全螢幕版面（.rs-team 直條立繪、.rs-emblem 菱形徽章），包 startBattle 記下開戰時的等級經驗，#bResult 出現 show 時 fill() | S:新增結算按鈕仍用 #bRetry／#bBack；只有一個動作時 .rs-one（點擊任意位置＝#bBack.click()） ｜ v197：徽章 .rs-emblem 重新設計（--ew 推算尺寸；.rs-rays／.rs-gem／.rs-sp；文字 .rs-cn＋.rs-en）；seer.js 的舊勝利過場（#bVictory）已移除
- `js/fx_v196.js`＋`assets/fx/v196/`: F:使用者素材的 8 招特效（MAP：角色 → 招式名 → 素材；VFX：dragon／burst／heart／drum／quake／ghosts／ghost／rail），install() 掛在 playChoreo 最外層；sp()（畫布素材，可裁切）、back()（立繪後方 DOM）、pt()、visTop()、visW()；開戰時預載出場角色的素材 | S:要替換素材直接換 assets/fx/v196 同名檔；新增招式在 MAP＋AN（定位點）＋VFX 加一筆；window.__fx196 供測試
- `js/balance_v205.js`: F:v205 大熊「毀滅光炮」（新效果 ppDownAllChance：機率使對手所有非奧義技能次數 -1）、密佛格（七武海）升 UR 的數值；v205 新增的 12 招特效在 fx_v196.js（croc_storm／croc_sabre／luffy_drum／aokiji_age／aokiji_pheasant／aokiji_blade／kuma_paw／kuma_bubble／kuma_beam／mihawk_slash／mihawk_aura／mihawk_eye）
- `js/balance_v196.js`: F:基德強化（磁氣機械臂、電磁砲、賦極的數值與說明）；effect.multKeepMax（包住 applySkillEffects，傷害倍率取較高的） | S:數值依 tests/tier-sim.js 量測（/root/promo/v196/kid.py）
- `js/compat_v164.js`＋`css/compat_v164.css`: F:儲存空間封鎖時的記憶體存檔與提示、多分頁保護（最後開的分頁才能存）、is-ios/is-inapp class；舊瀏覽器 color-mix 等後備 | S:必須在所有程式之前載入
- 月費檔期表：js/vip_v115.js 的 MCS（10/11/12 月），pickMC() 依時間挑當月；登入廣告只在大廳（onLobbyScreen、otherDialog）
- `chapterEnemyLv(chId, boss, info)`（js/app.js）：篇章敵人等級的唯一算法（基本→BOSS 加成→篇章 BOSS 加成→等級同步），enemyLvFor 與航路卡、電話蟲提示都用它
- `js/newbie_v163.js`＋`css/newbie_v163.css`: F:新手流程（入門船員 → 回大廳 → 新手 SR 拉霸 → 七日之約 → 導覽，一次一個視窗）；新手拉霸只抽未擁有的 SR、LV 100；沿用 #slotModal、slotSpin、slotResult、reel0～2
- `js/grow_v157.js`＋`css/grow_v157.css`: F:v157 角色培養視窗（openGrow 取代 grow_v112 的版本；分頁 升級／覺醒／技能／寶物、底部主按鈕、目標等級自動選書）| R:grow_v112（Esc、⬆培養按鈕、背包重畫仍在用）| S:沿用同一個視窗元素與類別名稱
- `js/gcard_v157.js`＋`css/gcard_v157.css`: F:統一的召喚結果卡片 window.GCARD（app.js showResults、event.js 使用）
- `js/balance_v161.js`: F:v161 四皇體質與黑鬍子倍率微調；皇帝領海難度在 js/emperor.js 的 EMPEROR_DOMAIN.dmgAdj
- `js/ext_v160.js`: F:v160 四皇新機制（印記與印記加成、無法解除的靈魂壓制、奪取／反轉能力、傷害轉體力、反彈負面、致命傷保命、護盾轉傷害、龍人型態加成、hpTilt）與 AI 權重 | R:battle_core pickEnemySkill、tests/*-sim
- `js/balance_v160.js`: F:六位四皇的技能資料、說明、標籤與 statScale
- `js/balance_v159.js`: F:漢庫克奧義與洛克斯五招加強（rocksKill 可為 {p,cut}、rocksStoreMult，見 ext_v129.js）
- `js/balance_v158.js`: F:巴基套用四皇規則（四分五裂清強化、威力 95、statScale 0.86）
- `js/balance_v157.js`: F:v157 四皇與天花板角色的清強化／淨化／高傷害技、STAT_V157 數值 | R:balance_v156、battle_core pickEnemySkill（清強化、淨化權重 ×1.8）
- `js/lobby_v156.js`＋`css/lobby_v156.css`: F:v156 大廳版面（主線航程卡 #v6Route、資訊區 #v6Side、左側欄常用 5 個＋「更多」抽屜）；只搬移既有節點，點擊功能沿用原本的；取代 v145 主線橫條與 v118 電腦版兩欄的呈現 | R:lobby_v118/v121/v145 | S:手機橫式不啟用，節點放回原位
- `js/balance_v156.js`: F:v156 強度定義與每位角色的 statScale、定位文字、路奇連擊；匯出 window.BALANCE_V156 | R:balance_v142、battle_core applyRarityScale（f.__rs）| S:只影響玩家角色、對戰、試煉，不影響關卡敵人與 BOSS；量測工具與表在 /root/promo/v156/balance（table.md）
- `js/story_boss_v156.js`: F:v156 逐章 BOSS 設定（bossHp、bossStages/bossStageAdj、bossLvUp、revives、bossDmg、bossUltCap、bossFix）| R:CHAPTER_DIFFICULTY（ext_effects.js）| S:必須在 ext_effects.js 之後載入；困難模式共用
- `js/modes_v156.js`＋`css/modes_v156.css`: F:懸賞召喚機率公示依 rollOne 實際算法重畫（window.GACHA_RATES）、召喚畫面手機／電腦版面修正
- `css/v156_crew.css`: F:角色背包與培養的版面（手機兩排橫滑名單、培養按鈕固定底部、訓練營全部領取、背包名稱列、圖鑑詳細頁手機排版）
- `js/fx_vfx_v155.js`＋`vendor/vfx00/vfx00.js`: F:00GameDevs Three.js 特效層（畫布 #bVFX，透視鏡頭對 z=0 平面，1 公尺＝立繪高度/5.5 像素）；MAP 依命中主題選特效，fx3d_v145 的 showDamage 掛勾呼叫 VFX00.hit，回傳 true 就不放原本的粒子；playChoreo 外層呼叫 VFX00.cast（輔助技）| R:FX3D.pt/geo/pal、CHAR_FX | A:vendor/vfx00（合併的執行期＋22 款預設、LICENSE.txt、meta.json）| S:開關跟 FX3D.enabled；新增素材時從 catalog.v2.json 下載、核對 SHA-256，把 preset 加進 PRESETS
- `js/roster_v154w.js`: F:和之國篇三位 SSR（zoro_wano／luffy_wano／sanji_wano），CHAR_OBTAIN boss:0（一般懸賞召喚）；必須在 roster_v91 之前載入
- `js/fx3d_v145.js`／`css/fx3d_v145.css`: F:戰鬥 3D 特效層（Three.js，第一次進戰鬥才載入）：背景 #bGL（衝擊波扭曲、推近與放射模糊、屬性打光、熱浪）、粒子 #bPGL（各屬性爆發 impact）、受擊白色剪影、出招殘影、奧義蓄力（粒子聚集、腳下光圈與上竄能量 aura、施放者屬性氣場 aura2、鏡頭推近 camPush）、奧義第一擊 finisher（集中線、三重衝擊波、光柱、連續爆發、焦痕、畫面邊緣光、命中停格 hitStop、鏡頭甩向對手）、奧義期間白色閃光改屬性色 | R:fx.js(X.flash、fighterPoint),fx_v138.js(__FXPAL) | A:FX3D | S:包住 showDamage、playChoreo、startBattle；技能特效「高」且畫質不是省電、支援 WebGL2 才開；鏡頭推近用 composite:'add' 疊在 .b-arena 原本的 --cam 縮放上，不要改成直接設定 transform
- `js/fx_v138.js`／`css/v138.css`: F:技能特效三層升級（FXPRO 泛光／命中／焦點；屬性氣場、魔法陣、屬性命中；CHAR_FX[id]=[主題, 奧義轉場, 配色]、__FXTR 轉場表、__FXPAL 主題配色）| D:FXE.add（啟動泛光）、FXE.P.flash／tint（期間降低泛光）、FXE.P.ring、hitFX、playChoreo（三層包裝） | S:開關 op_fxpro（'0'＝低）；新角色要在 CHAR_FX 加一行，否則依屬性挑主題、沒有奧義轉場；泛光圖層 #bBloom 跟著 #bCanvas 的位置
- `js/stab_v139.js`／`css/v139.css`: F:全畫面視窗打開時 body.ov-cover（隱藏後面的 .screen 與 .modal.show、暫停動畫）、body.ov-open；觸控裝置拿掉視窗毛玻璃與大圖陰影濾鏡 | S:新增全畫面不透明視窗時把 class 加進 OPAQUE；不要在大張立繪上用 filter:drop-shadow（手機 GPU 會繪製不完整）
- `js/fx_v140.js`: F:角色招牌動畫 MOTIF[id] → __MOTIF 繪製函式（每次出招，奧義放大；輔助招式繞著自己） | D:playChoreo | S:新角色要在 MOTIF 加一行；開關沿用 op_fxpro
- **class 名稱衝突（v140 修正）**: .ld-bg 是載入畫面的背景；天梯畫面請用 .ld-wrap .ld-bg，不要寫全域 .ld-bg
- `js/loader.js`: F:載入畫面，下載並檢查圖片後才顯示「點擊進入」；只預載已擁有角色的立繪與已擁有皮膚（v134），篇章封面與 *_bg 大背景（LATER）在進入後背景下載 | S:不要在其他檔案預先下載全部角色立繪（v134 前 app.js 會多下載約 33 MB）
- `js/hint_v134.js`: F:培養紅點 growHints(id)（star／trial／sk／gear）、寶物工具列（一鍵裝備最佳 bestEquip、分解 R／SR）、結算掉落 .gr-drop；window.GROWHINT | D:GEAR.addGear（戰鬥結束後的掉落寫進結算）、openGrow、openModes、SAVE.save（存檔後重畫紅點）；觀察 #growModal、#charModal 的變動 | S:#growModal.dataset.id 由 grow_v112 render 設定
- `css/v134.css`: .gh-dot 紅點、.gr-tools、.gr-drop
- `css/v132.css`: 寶物分頁、專精按鈕、覺醒外框（.gw-art.aw3f/.aw5f）、戰鬥 ★5 光效
- `js/grow_v112.js`（v130）: S:重畫培養視窗時沿用舊的立繪 <img>（src 相同才沿用），避免大圖重新解碼閃爍
- `js/lobby_v145.js`＋`css/lobby_v145.css`: F:手機直式左側圖示改單欄（常用 5 個 CORE＋「更多」#l2More 展開第二欄，隱藏項目有紅點時「更多」也亮）；右欄與左欄同寬 64px；直式（≤900）在限定召喚上方加主線航路橫條 #v5Strip（點擊＝#l2Mission）與船長名牌 #lbPlate；電腦版「備份存檔」改成整列提示條 | R:lobby.js,lobby_v118.js | A:lobbyV145 | S:位置用量到的限定召喚卡頂端（--v5pk）；CORE 順序：回歸禮、每日懸賞、活動中心、通行證、掛機寶藏、七日登入（最多 5 個）；頂部列維持原樣（使用者 10/31 選「用現在」）
- `js/lobby_v121.js`＋`css/v121.css`: F:手機直式大廳的船長對話框放在限定召喚上方（量測左側圖示欄、右側欄、限定召喚橫條；依序：置中 → 偏左 → 縮小字級 → 收縮展開膠囊 say-fold／say-open） | A:lobbyPlaceSay
- `js/roster_v118.js`／`ext_v118.js`／`fx_v118.js`: F:尼卡魯夫（luffy_nika）與效果 dmgToShield、nikaThunder（battle.js 的 onEvaded 掛鉤）、nikaTeamHeal、nikaTriple、nikaLegacy
- `js/bag_v116.js`: F:背包 openBag（取代 app.js 版；分類 CAT_OF、獲取方式 SRC/GO、使用 USE）、頭像快取參數 FACES、橫式立繪偵測（.cer-char/.cx-art img 加 .wide） | S:vip_v115 之後載入；新道具要補 CAT_OF 與 SRC
- `css/v116.css`: F:背包 .bg2-*、船團 .gl-*（舊 .gd-card/.gd-wrap 是新手導覽的類別，船團不要再用）
- `js/vip_v115.js`: F:VIP 會員中心 openVIP（會員／月費／儲值）、VIP 等級 vipLevel（SAVE.data.vip.paid）、福利 PERK（貝里／經驗加成包住 addBerry、gainExp）、月費 MC（SAVE.data.mcard、每日寶藏幣 mcClaim）、登入宣傳 mc-ad（SAVE.data.mcAdHide；v141 起新手導覽 GUIDE 未完成或 .gd-wrap 顯示時不跳，guidePending）、新道具 event_ticket／char_select、openCharSelect、大廳徽章 refreshLobby、VIP.recharge（儲值入帳，目前只給後台測試） | R:modes.js openModes、lobby.js renderLobby、event.js（限定抽獎券）、social.js／guild.js（vipTag） | S:月費檔期改 MC；新月費要新的 id 與皮膚 monthCard 欄位；MC.extraSkins＝額外贈送的皮膚（v143，已購買者進大廳補發 mcExtraGrant）
- `js/roster_v115.js`: F:燼（king）、皮膚 king_halloween、和之國篇小 BOSS 步驟 | S:必須在 roster_v91 之前載入；步驟插入的舊存檔轉換在 app.js chState（v115）
- `js/ext_v115.js`: F:效果 ppUpRandom、kingFlame（減傷＋反彈，熄滅時加速） | S:ext_v110 之後載入
- `js/fx_v115.js`: F:燼第 1～4 招專屬動畫
- `css/v115.css`: F:寶藏幣新圖示（覆蓋 .coin-ico）、VIP 會員中心、月費宣傳、VIP 徽章／頭像框／聊天氣泡
- `js/grow_v112.js`: F:角色培養視窗 openGrow（openGrow(id, tab)；分頁：升級／覺醒／技能／寶物；v133 覺醒頁 ★4 起顯示試煉 .gw-trial、奧義下方顯示羈絆 .gw-bond；v132 技能 Lv5 顯示專精按鈕 .gw-spec、寶物頁 gearPanel 與選擇清單 gearPick；升級頁、技能頁；v114 起技能列電腦點擊展開 skDetail、觸控長按 0.45 秒彈出 .gw-pop 說明卡） | R:crew.js(#cxPane_crew .sb-acts) | S:樣式在 css/v112.css＋v113.css＋v114.css；z-index 2000（說明卡 2100）
- `css/v114.css`: F:培養視窗置中對齊（.gw-lvl 等級列、.gw-pow）、技能詳細說明樣式、冒險選單 #lbModes 卡片等高與標題對齊（container query 縮放標題字級）
- `js/fx_v111.js`: F:奧義標題字過場（PRESET 風格表、SUB 角色→[風格, 副標]、cutIn 覆寫、ultTitle） | S:新角色要在 SUB 加一行，否則依屬性挑風格
- `js/fx_v106.js`: F:主題式專屬特效（TH 主題表、WHO 角色對應、kindOf 招式種類） | S:要讓角色換主題改 WHO；不覆蓋既有 CHOREO
- `js/fx_v171.js`: F:改寫 v106 主題式招式（只改 CHOREO 裡含「FXE.ensure(); await fn(A)」的、不動專屬編排與奧義）：招式名關鍵字 KW → 出手方式 GO（衝刺／飛彈／躍擊／地面／天降／瞬移）＋招牌元素 SIG；命中排列 LAYOUT；單雙數招互換主色；輔助法陣四種、削弱三種輪替。後半是自動畫質 FXAUTO（特效播放中幀率中位數 >42ms 就降級：1 級 3D 解析度降、2 級關 3D 層，記在 sessionStorage op_fxauto） | S:fx.js 的 shadowBlur 倍率 __fxShadowMul（技能特效高＝0，交給泛光層）；fx3d／VFX00 手機解析度 1、掉幀時 __fx3dDpr；fx_v140 招牌元素只在奧義與第 1、3 招
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
- **v145 高畫質（e3three.js，this.pro＝畫質不是省電）**: F:後製（景深只做遠景、深度環境遮蔽、高度霧、光束與鏡頭光斑、色差、顆粒、冷暖分色）、雲影、淺灘焦散、草浪與角色踩草、走路揚塵、積雲天空；每座島的招牌氣氛 LOOK 表（太陽高度°、陽光色與強度、色調 tint、光束 rays、空氣散射 scat、霧距 fogK、熱浪 heat、全島焦散 caus、天空 sky[天頂,地平線]、雲亮度 cl／暖色 cw、月亮 moon、地面霧 mist、煙柱 plume、光點 glow[色,數,0鬼火/1燈籠/2浮游]、閃電 bolt）；遠景地平線 HZN 表＋horizonGeo（hill／mesa／peak／spire／spike／fort／coral／cake／volcano／tower／tree／cloud，兩層 640／900） | R:engine3d.js（import 版本號） | A:LOOK,HZN,proTick | S:新增島嶼要在 LOOK、HZN 各加一筆，沒有就用 east；手機或畫質被自動降到最低時關閉景深（再低關閉環境遮蔽）；改 e3three.js 要同時改 engine3d.js 裡 import 的 ?v= 與 index.html 的 engine3d.js?v=
- **環境飄落物（e3three.js setIsland 的 AMB 表）**: 每座島一組 [顏色, 數量, 上升/下降速度, 大小, 形狀 0塵 1花瓣 2氣泡 3光點]；低畫質自動減量
- `js/landmarks.js`: F:各島原作地標，自動找空地放置 | R:scenes.js | A:LANDMARKS.build | S:放置時同時加入碰撞清單 O
- `js/isle2.js`: F:v146 新版島嶼系統（關卡設計版）：島嶼規格 D（設計座標 × SC）→ prepare() 烘焙高度 Hg、道路碼 Rg、建築／水域 Bg 網格（陸地塊 land、海灣 bays、地形 terrain{ramp,g}、河 rivers、湖 lakes、懸崖 cliffs、道路 roads[點,種類]）→ build() 蓋路緣石路燈、石橋、碼頭、特色建築 landmarks、沿街房屋 town、田地牧場、樹林椰子岩石、地形網格與河湖水面 → apply(ch) 把 story（spawn、boss、spots、route、npcs、steps 各欄位）寫回 CHAPTERS | R:scenes.js（buildScene 遇到 ISLE2[id] 就改用它）,isle2_parts.js | A:ISLE2.define,ISLE2[id],ISLE2.parts,ISLE2.util | S:道路種類順序就是 Rg 的道路碼（PAVED＝鋪石）；房屋只沿鋪石路、門面向道路、靠海側不蓋；story 的位置會先保留（occ），房子與樹不會蓋上去；地形只有鋪石路或河流經過的 128 單位區塊用細網格；I.tstat 是各部分三角形數；新島嶼加一個 isle2_<id>.js 並放在 isle2_parts.js 後面；v150 屋頂：house() 裡 slab(e0,e1,r0,r1) 畫有厚度的坡面（瓦紋、簷底、封簷板）、tiles() 在極致畫質順坡排瓦，gable／hip 出簷 0.6，S0.skirt（和風）簷口上翹；col() 是自然地面色（濕度、凹處、路邊泥土、沙草漸變、坡度露岩）；路緣石只在 promenade；D.post(h,dx,dz,sm) 可在烘焙後改高度（頂上戰爭冰面）
- `js/roster_v152.js`＋`js/ext_v152.js`＋`css/knights_v152.css`: F:v152 神之騎士團（gunko 軍子、shamrock 夏姆洛克）與巨人篇兩場 bossDuel；效果 fixedDot、sureHit（battle.js 閃避判定）、lowHpBonus、gunkoAfter、bgCutin（在 transformFx 'before' 之前播，圖層插在 #bGL 之後）、cerberus（.f-summon 圖層，--ssr） | R:battle_core.js,battle.js,fx_v104.js,app.js（beginFight 的 bossDuel、onBattleEnd、chState 的 v152 轉換） | A:CHARACTERS.gunko/shamrock,setSummon,gunkoCutin | S:step.bossDuel＝對決用 BOSS 強度；CSS 變數裡的圖片網址要用絕對網址
- **v154 幾何碰撞（scenes.js 的 GB → scene.gb(x,z,y)）**: F:建島後掃靜態網格 b 的三角形，|法線 y|<0.45、離腳下地面 0.35～1.8 的取樣點標成擋住（1 單位格，記兩層地面高度）；跳過三個頂點都貼地形的三角形、平台範圍 ±0.7 內、b.ncr 記下的頂點範圍（鳥籠、箭頭標誌） | R:world.js _okMove、_navGrid、_step | S:新零件若是純裝飾、會穿過道路，用 isle2_parts4.js 最後的 ncr 包裝
- **v154 鏡頭透視（e3three.js XRAY_GLSL、toon({xray})、outlineMat(thick, true)）**: F:draw(h, null, { xray:true }) 的網格（world.js 的靜態網格與屋頂）在鏡頭到角色的連線附近以網點挖洞；U.uPlayer 每次 flush 更新 | S:只有新版大地圖（S.maxStep）開啟
- `js/roster_v154.js`＋`js/isle2_parts4.js`: F:亞爾麗塔（CHAR_OBTAIN.clearDrop＝'east'、clearRate .5）；歷史本文、時計台炸彈（clocktower 的 o.bomb）、骷髏頭（覆蓋 parts2 的 skull） | R:app.js（boss 通關分支、NOT_IN_GACHA、charSource） | S:roster_v154 必須在 roster_v91 之前載入
- `js/story_v153.js`: F:v153 每章一份乾淨劇本 STORY153[id]＝{pro,epi,npcs{id:{name,role,look,pos,chat,add}},steps{序號:{title,desc,lines,after,npc,npcs,questions,pos/points/spots/to/area/goal/start…}},unlockAt,sides}；座標是 isle2 設計座標（×SC），新位置寫進 D.story 讓 keep() 避開；東海在 coby_e 之前插入「亞爾麗塔號」 | R:story_more5.js 之後載入；app.js（SPOTS 讀 step.spots、boss 開打前播 s.lines、chState 的 v153 轉換 east after 5 +1） | S:原始劇本在 promo/v153/script_<id>.js，改完用 cat 重組
- `js/isle2_parts3.js`＋`js/isle2_v153.js`: F:v153 劇情道具零件（stake、barrelbig、cage、ice、birdcage、coatship、noah、pod、freezer、robot、factory、arrowsign、poneglyph、kneel、bomb、rocketman、grave）與各島擺放（mod(id) 改 D.landmarks／D.piers，move 搬沉船） | R:isle2.js（parts 呼叫傳 MB 半透明網格） | S:必須在所有 isle2_<島>.js 之後載入；PT.bigship／PT.boat 可指定 head、masts、flag
- **v151 屋型（isle2.js house 的 o.arch）**: F:SY[風格].arch 是該風格可用的屋型；town 依序隨機挑、同一側相鄰不重複，尺寸 ±10%、斜屋頂風格 3 成換另一種屋頂。base、wing（側屋，先用 free() 檢查，放不下改 porch）、porch（門廊）、dormer（老虎窗，只有 gable）、shop（櫥窗＋遮雨棚＋招牌）、jetty／setback（上層外凸／內縮，fl≥2）、tower（角樓）；門邊隨機木桶、木箱、花盆、柴堆；o.wall0 是一樓牆色。norse 風格（艾爾巴夫）走 norse()：longhouse、logcabin、watchtower、stonebase、stump、workshop，town 第 7 欄 theme（west／craft／hunt／fish）是村子擺設 | R:isle2.js | A:I.house | S:直接呼叫 b.tri／b.quad 時顏色要先 hex()，傳字串會變成 NaN，整個畫面在後製後變黑；新屋型要加進 ARCH 表
- **v151 鏡頭（world.js render）**: F:新版大地圖（S.maxStep）鏡頭對準角色前方 cam.la（走路時 eff×0.42）；自動前往時依路徑前方 10 單位提前轉向，手動拖曳或 Q／R 後 3 秒內不自動轉（cam.manT）；被房子擋住只抬到 0.72；手機直拿 fov 加寬；各篇章距離與角度在 load 的 CP 表，進場面向 layout.path[1] | R:world.js | A:WORLD.cam
- **v151 原作補強零件（isle2_parts2.js 最後一段）**: legocastle（艾爾巴夫冥界）、goawall、trashheap（東海北岸）、heavengate、skybell（豆藤頂端，o.h）、ark（艾尼路方舟，o.y 浮空）、mobydick、tomb（葬祭殿）、punkrecords（o.h）；skyway 新樣式 rainbow（七色帶、起點延伸到海面）、rope（吊橋）；D.abyss {r,zMin}＋D.post2（司法島四周的大洞與瀑布，e3three 水面在 g<-30 的地方 discard）；D.homies（蛋糕島會說話的樹）；D.slopeRocks:false 不在陡坡放岩塊；I.D 是島嶼規格
- **v148 極致畫質（window.E3_ULTRA，e3three.js 設定；isle2.js 的 UL）**: F:isle2.build 產生 I.ultra＝{tiles:[{pos,col,idx}] 細網格地形, det:{cob,tile,block,peb,bush,tuft,flower: Float32Array(v150 起每筆 11 個：x,y,z,ry,rx,sx,sy,sz,r,g,b；rx 是前後傾斜，屋瓦順坡用)}, tris}；scenes.js 傳 scene.ultra；R3.ultraBuild 建地形 Mesh 與 80 單位分區的 InstancedMesh，ultraTick 依距離顯示並自動調整 ultraK | R:isle2.js,scenes.js,e3three.js,settings.js(gfxNow) | A:E3_ULTRA,R3.ultraBuild,R3.ultraTick | S:極致時不建 Builder 地形（b.smooth 為空）；新增細節種類要在 e3three ultraGeo、DIST 與 isle2 的 KT 三處都加
- `js/isle2_parts.js`: F:新版島嶼的特色建築：tavern、guild（工會，三層＋塔樓＋懸賞看板）、hall（鐘樓）、fishmarket、hut、windmill（D.windmills 會轉）、lighthouse、fort、wreck、barn、plaza（水井／噴水池）、stall、boat | R:isle2.js | A:ISLE2.parts | S:每個函式收 {b,x,z,ry,o,Hs,house,O,ST,P,K,fp,flatPad,hd,D,CHIMNEYS,r}，有 o.key 的會記到 I.lm
- `js/isle2_parts2.js`: F:新版島嶼第二批特色建築：palace、clocktower、casino、pyramid、obelisk、tent、ruin、well、bigship、cloudhut、goldbell、shandoraRuin、beanstalk、shrine、cloudpuff、court、tower、justiceGate、seatrain、platform、yard、hull、mast、darkcastle、graveyard、mansion、marineHQ、scaffold、ryugu、evetree、bubbles、colosseum、toyhouse、jcastle、torii、skull、bigtree、deck（天界平台，obj 平台：NPC、道具站上面）、chains、cakecastle、mirror、labegg、futuretower、crater | R:isle2.js | A:ISLE2.parts | S:需要擋路的用 A.markB(x,z,半徑)；deck 的欄杆用 ST.walls
- `js/isle2_giant.js`: F:v151 依原作重做：冥界（海平面雪原，西岸登陸、伊達的酒館；中央樹根處的冥界有鎖鏈、樂高城）→ 彩虹橋 → 陽界（半徑 126 高台，四個村子 V.west／craft／hunt／fish、北邊奧魯斯特城）→ 樹幹螺旋坡道 → 天界三平台；東邊繩索吊橋下冥界 | R:isle2.js,isle2_parts2.js | A:ISLE2.giant
- `js/isle2_<島>.js`（alabasta、skypiea、enies、thriller、marineford、fishman、dressrosa、wano、giant、wholecake、dark、egghead）: F:各島關卡規格（v147） | R:isle2.js,isle2_parts*.js | A:ISLE2[id] | S:規格欄位：base（整島底高）、terrain{ramp,g,plateau,ring,poly,fn,dunes,max}、rawFn（整個地形自訂，恐怖三桅帆船、頂上戰爭冰面）、colorFn、ramparts（城牆，gates、towers、towerEvery、seg、style:'wood'）、skyways（空中步道 style:cloud/wood/stone/red/root/metal，y:[起,終]、arch）、town[x,z,r,樓層,風格,倍率]、fields 第 6、7 欄是顏色、groves 種類 tree/pine/palm/dead/coral/kelp/sakura/snowpine/candy、style（房屋風格）、fine/coarse（地形網格）、houseStep/maxHouses、waterCol（河湖顏色）、story.steps[k] 可改 points/spots/pos/goal/to/area/start/guards/radius/r/desc
- `js/isle2_east.js`: F:東海・黎明島關卡規格（使用者 11/02 確認的東海關卡設計示意圖） | R:isle2.js,isle2_parts.js | A:ISLE2.east | S:改 NPC 或任務點後跑 /root/promo/reach.py 類的逐格搜尋，確認從登陸點走得到
- `js/world.js`: F:（v149：自動導航 findPath＝可行走網格 _navGrid 上的廣度優先搜尋，每格分 6 層高度（地面＋平台），_los 拉直；navTo／goTo／點地面都用它；_okMove 是實際移動規則（坡度 1.5、平台上下 0.85），_step／_stepC 是導航用的較嚴規則（坡度 0.8、平台上 0.7）；卡住時 _unstick 挪一步再找路；護送 NPC 走 _trail；地圖邊界用 scene.ext） NPC、道具、敵人、任務光柱用 scene.Ho＝含 obj 平台的高度）探索、移動、跳躍與重力、牆壁碰撞、鏡頭、NPC 互動、小地圖 | R:scenes.js,app.js | A:World | S:只透過 renderer 介面繪圖，換引擎不用改這裡；空白鍵是跳躍、E／Enter 是互動
- `promo/index.html`＋`promo/app.js`＋`promo/img/`＋`promo/v/`: F:滾動式宣傳網站（獨立頁面，不載入遊戲程式；片頭、偉大航路、四皇舞台、懸賞召喚、玩法懸賞單、虛空王座、揚帆出航） | R:js/fx_v111.js（奧義配色 PRESET／副標 SUB，複製到 app.js 的 P、EM）、js/data.js（CHAPTERS 篇名） | A:- | S:素材網址都帶 ?v=（app.js 的 V 與 index.html），改素材要一起加一，否則 sw.js 會給舊快取；四皇立繪靠 FACE 表（臉在圖上的比例）定位，換立繪要重量；動畫只用 transform／opacity，別加即時 filter 或大面積重畫，手機會卡；同時只播一支影片
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
