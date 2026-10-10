/* v144：一般懸賞召喚新演出（電話蟲版）——使用者看過示意第 13 版後指定「一般抽獎池先上架電話蟲版本」，機密檔案、漂流瓶兩套開頭之後再處理。
   流程：深夜靜場 → 黃金電話蟲來電（手按接聽、鏡頭推近、閉眼）→ 畫面變暗後提示一個個出現 → 三選一懸賞令 → 釘上牆、賞金鑑定、昇格／霸王色／機會系演出 → 長按撕封條 → 開封 → 新船員登場 → 結果。
   十連：十張懸賞令自己點開（或「全部翻開」），最後一張聚光燈。百連、新手召喚維持原本的扭蛋機。
   結果一律由 app.js 的 pull() 決定並先發放（grant），這裡只負責演出；演出用 Shadow DOM 隔離樣式（css/gacha_v144.css），素材在 assets/gacha/。
   接法：包住 pull（記下 1／10 抽）、playMachine（新演出時不播扭蛋機）、showResults（改播新演出）、toast（演出中先排隊，關閉後再顯示，避免劇透）。
   演出等級：道具 N 白、R 藍、SR 紫、SSR 金；船員一律紅（大人物）、UR 以上虹。船員插話用玩家自己陣容裡的船員。新船員登場的數字改成「戰力」（遊戲沒有懸賞金資料）。 */
(function () {
  const V = 144, abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } }, AS = n => abs(`assets/gacha/${n}.webp?v=${V}`);
  const A = { bg: AS('bg'), wanted: AS('wanted'), den4: AS('den4'), den4c: AS('den4c'), hand: AS('hand'), icons: ICONS2() };
  let host = null, R = null, ENG = null, OPEN = false, running = false;
  const API = {};
  function ICONS2() { return {"potion_s": {"n": "小回復藥水", "h": "<svg class=\"ico ico2 r-N\" viewBox=\"0 0 64 64\" style=\"--g:#9fb3c4\" aria-hidden=\"true\"><defs><radialGradient id=\"ic0l\" cx=\".4\" cy=\".35\" r=\".7\"><stop offset=\"0\" stop-color=\"#beeacb\"/><stop offset=\".6\" stop-color=\"#6fd08c\"/><stop offset=\"1\" stop-color=\"#3d724d\"/></radialGradient></defs>\n        <path d=\"M26 6h12v12l0 0a18 18 0 1 1-12 0z\" fill=\"#d9ecf5\" fill-opacity=\".35\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M17 36a15 15 0 1 0 30 0c0-2-.4-3.8-1-5.5H18c-.6 1.7-1 3.5-1 5.5z\" fill=\"url(#ic0l)\"/>\n        <circle cx=\"26\" cy=\"42\" r=\"2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"36\" cy=\"38\" r=\"1.4\" fill=\"#fff\" opacity=\".6\"/><circle cx=\"31\" cy=\"47\" r=\"1.1\" fill=\"#fff\" opacity=\".5\"/>\n        <path d=\"M24 3h16v6H24z\" fill=\"#a8743f\" stroke=\"#1a1410\" stroke-width=\"2\" stroke-linejoin=\"round\"/><path d=\"M26 18h12\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M20 30c1-6 5-9 8-10\" stroke=\"#fff\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\" opacity=\".7\"/></svg>", "r": "N", "d": "恢復 25% 最大體力。"}, "herb": {"n": "淨化香草", "h": "<svg class=\"ico ico2 r-N\" viewBox=\"0 0 64 64\" style=\"--g:#9fb3c4\" aria-hidden=\"true\"><defs><linearGradient id=\"ic1g\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#b8e297\"/><stop offset=\"1\" stop-color=\"#5c8040\"/></linearGradient></defs>\n        <path d=\"M32 56V30\" stroke=\"#5a7a2a\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n        <path d=\"M32 34C18 34 10 22 12 10c12 0 20 10 20 24z\" fill=\"url(#ic1g)\" stroke=\"#1a1410\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n        <path d=\"M32 30c14 0 22-10 20-22-12 0-20 8-20 22z\" fill=\"url(#ic1g)\" stroke=\"#1a1410\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n        <path d=\"M32 42c-9 0-15-6-15-14 8 0 15 6 15 14zM32 40c9 0 14-5 14-13-8 0-14 5-14 13z\" fill=\"#83b65b\" stroke=\"#1a1410\" stroke-width=\"2\" stroke-linejoin=\"round\"/>\n        <path d=\"M14 12c6 4 12 10 16 20M50 10c-6 4-12 10-16 18\" stroke=\"#cdebb5\" stroke-width=\"1.4\" fill=\"none\"/>\n        <path d=\"M26 50h12l-2 6h-8z\" fill=\"#c8322b\" stroke=\"#1a1410\" stroke-width=\"1.8\"/></svg>", "r": "N", "d": "清除自身所有異常狀態（冰凍、燒傷、麻痺、恐懼等）。"}, "exp_s": {"n": "小經驗書", "h": "<svg class=\"ico ico2 r-N\" viewBox=\"0 0 64 64\" style=\"--g:#9fb3c4\" aria-hidden=\"true\"><defs><linearGradient id=\"ic2a\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#639ad6\"/><stop offset=\"1\" stop-color=\"#1f4e82\"/></linearGradient><linearGradient id=\"ic2p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fffaf0\"/><stop offset=\"1\" stop-color=\"#e6dcc4\"/></linearGradient></defs>\n        <path d=\"M14 14h36a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14z\" fill=\"url(#ic2p)\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M16 55h36M16 52h36\" stroke=\"#cbbf9f\" stroke-width=\"1.2\"/>\n        <path d=\"M10 10h38a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H10a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z\" fill=\"url(#ic2a)\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M13 10v44\" stroke=\"#183c64\" stroke-width=\"3\"/><path d=\"M17 14h31M17 50h31\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".9\"/>\n        <rect x=\"19\" y=\"17\" width=\"30\" height=\"30\" rx=\"4\" fill=\"none\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".85\"/><path d=\"M34 20l3.2 6.6 7.2 1-5.2 5 1.3 7.2L34 36.4l-6.5 3.4 1.3-7.2-5.2-5 7.2-1z\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n        <path d=\"M12 12h10l-8 30z\" fill=\"#fff\" opacity=\".18\"/></svg>", "r": "N", "d": "在船員畫面使用，角色經驗 +300。"}, "potion_l": {"n": "大回復藥水", "h": "<svg class=\"ico ico2 r-R\" viewBox=\"0 0 64 64\" style=\"--g:#5fb8ff\" aria-hidden=\"true\"><defs><radialGradient id=\"ic3l\" cx=\".4\" cy=\".35\" r=\".7\"><stop offset=\"0\" stop-color=\"#a9dee7\"/><stop offset=\".6\" stop-color=\"#3fb6c9\"/><stop offset=\"1\" stop-color=\"#23646f\"/></radialGradient></defs>\n        <path d=\"M26 6h12v12l0 0a18 18 0 1 1-12 0z\" fill=\"#d9ecf5\" fill-opacity=\".35\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M17 36a15 15 0 1 0 30 0c0-2-.4-3.8-1-5.5H18c-.6 1.7-1 3.5-1 5.5z\" fill=\"url(#ic3l)\"/>\n        <circle cx=\"26\" cy=\"42\" r=\"2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"36\" cy=\"38\" r=\"1.4\" fill=\"#fff\" opacity=\".6\"/><circle cx=\"31\" cy=\"47\" r=\"1.1\" fill=\"#fff\" opacity=\".5\"/>\n        <path d=\"M24 3h16v6H24z\" fill=\"#a8743f\" stroke=\"#1a1410\" stroke-width=\"2\" stroke-linejoin=\"round\"/><path d=\"M26 18h12\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M20 30c1-6 5-9 8-10\" stroke=\"#fff\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\" opacity=\".7\"/></svg>", "r": "R", "d": "恢復 60% 最大體力。"}, "pp_s": {"n": "技能補充劑", "h": "<svg class=\"ico ico2 r-R\" viewBox=\"0 0 64 64\" style=\"--g:#5fb8ff\" aria-hidden=\"true\"><defs><linearGradient id=\"ic4l\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9ac2ff\"/><stop offset=\"1\" stop-color=\"#486da6\"/></linearGradient></defs>\n        <path d=\"M24 5h16v4h-2v14l12 24a6 6 0 0 1-5.4 8.6H19.4A6 6 0 0 1 14 47l12-24V9h-2z\" fill=\"#e6f4fa\" fill-opacity=\".3\" stroke=\"#1a1410\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/>\n        <path d=\"M20 36h24l6 11a6 6 0 0 1-5.4 8.6H19.4A6 6 0 0 1 14 47z\" fill=\"url(#ic4l)\"/>\n        <path d=\"M22 44l3-3 3 3 3-3 3 3 3-3 3 3\" stroke=\"#fff\" stroke-width=\"1.6\" fill=\"none\" opacity=\".45\"/>\n        <rect x=\"23\" y=\"2\" width=\"18\" height=\"6\" rx=\"2\" fill=\"#6b4a2f\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <rect x=\"24\" y=\"24\" width=\"16\" height=\"7\" rx=\"1.5\" fill=\"#f4ead2\" stroke=\"#1a1410\" stroke-width=\"1.4\"/><path d=\"M27 27.5h10\" stroke=\"#6fa8ff\" stroke-width=\"2\"/>\n        <path d=\"M28 12v10\" stroke=\"#fff\" stroke-width=\"2.4\" stroke-linecap=\"round\" opacity=\".6\"/></svg>", "r": "R", "d": "恢復 2 次技能使用次數：優先補給用完的技能，其次是剩餘最少的、再其次是用過的（不會超過上限）。"}, "haki": {"n": "霸氣藥劑", "h": "<svg class=\"ico ico2 r-R\" viewBox=\"0 0 64 64\" style=\"--g:#5fb8ff\" aria-hidden=\"true\"><defs><linearGradient id=\"ic5l\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ef8876\"/><stop offset=\"1\" stop-color=\"#973726\"/></linearGradient></defs>\n        <path d=\"M24 5h16v4h-2v14l12 24a6 6 0 0 1-5.4 8.6H19.4A6 6 0 0 1 14 47l12-24V9h-2z\" fill=\"#e6f4fa\" fill-opacity=\".3\" stroke=\"#1a1410\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/>\n        <path d=\"M20 36h24l6 11a6 6 0 0 1-5.4 8.6H19.4A6 6 0 0 1 14 47z\" fill=\"url(#ic5l)\"/>\n        <path d=\"M22 44l3-3 3 3 3-3 3 3 3-3 3 3\" stroke=\"#fff\" stroke-width=\"1.6\" fill=\"none\" opacity=\".45\"/>\n        <rect x=\"23\" y=\"2\" width=\"18\" height=\"6\" rx=\"2\" fill=\"#6b4a2f\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <rect x=\"24\" y=\"24\" width=\"16\" height=\"7\" rx=\"1.5\" fill=\"#f4ead2\" stroke=\"#1a1410\" stroke-width=\"1.4\"/><path d=\"M27 27.5h10\" stroke=\"#e8553b\" stroke-width=\"2\"/>\n        <path d=\"M28 12v10\" stroke=\"#fff\" stroke-width=\"2.4\" stroke-linecap=\"round\" opacity=\".6\"/></svg>", "r": "R", "d": "攻擊能力 +2 階。"}, "exp_m": {"n": "航海日誌", "h": "<svg class=\"ico ico2 r-R\" viewBox=\"0 0 64 64\" style=\"--g:#5fb8ff\" aria-hidden=\"true\"><defs><linearGradient id=\"ic6a\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#a78362\"/><stop offset=\"1\" stop-color=\"#5a3b1e\"/></linearGradient><linearGradient id=\"ic6p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fffaf0\"/><stop offset=\"1\" stop-color=\"#e6dcc4\"/></linearGradient></defs>\n        <path d=\"M14 14h36a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14z\" fill=\"url(#ic6p)\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M16 55h36M16 52h36\" stroke=\"#cbbf9f\" stroke-width=\"1.2\"/>\n        <path d=\"M10 10h38a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H10a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z\" fill=\"url(#ic6a)\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M13 10v44\" stroke=\"#452d17\" stroke-width=\"3\"/><path d=\"M17 14h31M17 50h31\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".9\"/>\n        <rect x=\"19\" y=\"17\" width=\"30\" height=\"30\" rx=\"4\" fill=\"none\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".85\"/><circle cx=\"34\" cy=\"31\" r=\"9\" fill=\"none\" stroke=\"#f3c969\" stroke-width=\"2.4\"/><path d=\"M34 23l3 8-3 8-3-8z\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1\"/><circle cx=\"34\" cy=\"31\" r=\"1.6\" fill=\"#1a1410\"/>\n        <path d=\"M12 12h10l-8 30z\" fill=\"#fff\" opacity=\".18\"/></svg>", "r": "R", "d": "在船員畫面使用，角色經驗 +1500。"}, "shield": {"n": "鐵壁果實", "h": "<svg class=\"ico ico2 r-SR\" viewBox=\"0 0 64 64\" style=\"--g:#c58bff\" aria-hidden=\"true\"><defs><radialGradient id=\"ic7f\" cx=\".35\" cy=\".35\" r=\".75\"><stop offset=\"0\" stop-color=\"#e4cb9d\"/><stop offset=\".55\" stop-color=\"#c9973a\"/><stop offset=\"1\" stop-color=\"#654c1d\"/></radialGradient></defs>\n        <path d=\"M32 14c12 0 20 8 20 20s-9 22-20 22-20-10-20-22 8-20 20-20z\" fill=\"url(#ic7f)\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M22 28c4-4 10-2 10 2s-6 5-6 2 3-3 4-1M36 38c4-4 10-2 10 2s-6 5-6 2 3-3 4-1M22 44c3-3 8-2 8 1s-5 4-5 1\" stroke=\"#5a441a\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\"/>\n        <path d=\"M32 14c-1-4 0-8 4-10\" stroke=\"#5a3a1a\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M34 8c6-4 12-2 14 2-6 3-10 2-14-2z\" fill=\"#6fae3a\" stroke=\"#1a1410\" stroke-width=\"1.8\"/>\n        <ellipse cx=\"24\" cy=\"24\" rx=\"5\" ry=\"3\" fill=\"#fff\" opacity=\".45\" transform=\"rotate(-30 24 24)\"/></svg>", "r": "SR", "d": "獲得 35% 最大體力的護盾。"}, "tome": {"n": "奧義秘卷", "h": "<svg class=\"ico ico2 r-SR\" viewBox=\"0 0 64 64\" style=\"--g:#c58bff\" aria-hidden=\"true\"><defs><linearGradient id=\"ic8p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff6dc\"/><stop offset=\"1\" stop-color=\"#e2cfa0\"/></linearGradient></defs>\n        <path d=\"M14 14h36v36H14z\" fill=\"url(#ic8p)\" stroke=\"#1a1410\" stroke-width=\"2.2\"/>\n        <path d=\"M20 22h24M20 28h24M20 34h18M20 40h22\" stroke=\"#9a8460\" stroke-width=\"1.6\"/>\n        <rect x=\"8\" y=\"8\" width=\"48\" height=\"8\" rx=\"4\" fill=\"#9170cc\" stroke=\"#1a1410\" stroke-width=\"2.2\"/><rect x=\"8\" y=\"48\" width=\"48\" height=\"8\" rx=\"4\" fill=\"#9170cc\" stroke=\"#1a1410\" stroke-width=\"2.2\"/>\n        <circle cx=\"8\" cy=\"12\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"56\" cy=\"12\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"8\" cy=\"52\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"56\" cy=\"52\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/>\n        <circle cx=\"42\" cy=\"40\" r=\"6\" fill=\"#c8322b\" stroke=\"#1a1410\" stroke-width=\"1.8\"/><path d=\"M39 40l2 2 4-4\" stroke=\"#ffd26c\" stroke-width=\"1.6\" fill=\"none\"/></svg>", "r": "SR", "d": "奧義技能使用次數 +1，其餘技能 +1。"}, "awaken_gem": {"n": "覺醒結晶", "h": "<svg class=\"ico ico2 r-SR\" viewBox=\"0 0 64 64\" style=\"--g:#c58bff\" aria-hidden=\"true\"><defs><radialGradient id=\"ic9l\" cx=\".4\" cy=\".35\" r=\".7\"><stop offset=\"0\" stop-color=\"#ffbedf\"/><stop offset=\".6\" stop-color=\"#ff6fb8\"/><stop offset=\"1\" stop-color=\"#8c3d65\"/></radialGradient></defs>\n        <path d=\"M26 6h12v12l0 0a18 18 0 1 1-12 0z\" fill=\"#d9ecf5\" fill-opacity=\".35\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M17 36a15 15 0 1 0 30 0c0-2-.4-3.8-1-5.5H18c-.6 1.7-1 3.5-1 5.5z\" fill=\"url(#ic9l)\"/>\n        <circle cx=\"26\" cy=\"42\" r=\"2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"36\" cy=\"38\" r=\"1.4\" fill=\"#fff\" opacity=\".6\"/><circle cx=\"31\" cy=\"47\" r=\"1.1\" fill=\"#fff\" opacity=\".5\"/>\n        <path d=\"M24 3h16v6H24z\" fill=\"#a8743f\" stroke=\"#1a1410\" stroke-width=\"2\" stroke-linejoin=\"round\"/><path d=\"M26 18h12\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M20 30c1-6 5-9 8-10\" stroke=\"#fff\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\" opacity=\".7\"/></svg>", "r": "SR", "d": "角色覺醒（升星）用的結晶。在角色培養的「覺醒」分頁使用；重複的角色也能分解成覺醒結晶。"}, "skill_book": {"n": "秘傳書", "h": "<svg class=\"ico ico2 r-SR\" viewBox=\"0 0 64 64\" style=\"--g:#c58bff\" aria-hidden=\"true\"><defs><linearGradient id=\"ic10a\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9b6fd0\"/><stop offset=\"1\" stop-color=\"#4f297d\"/></linearGradient><linearGradient id=\"ic10p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fffaf0\"/><stop offset=\"1\" stop-color=\"#e6dcc4\"/></linearGradient></defs>\n        <path d=\"M14 14h36a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14z\" fill=\"url(#ic10p)\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M16 55h36M16 52h36\" stroke=\"#cbbf9f\" stroke-width=\"1.2\"/>\n        <path d=\"M10 10h38a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H10a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z\" fill=\"url(#ic10a)\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M13 10v44\" stroke=\"#3d2060\" stroke-width=\"3\"/><path d=\"M17 14h31M17 50h31\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".9\"/>\n        <rect x=\"19\" y=\"17\" width=\"30\" height=\"30\" rx=\"4\" fill=\"none\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".85\"/><circle cx=\"34\" cy=\"30\" r=\"8\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.5\"/><circle cx=\"31\" cy=\"29\" r=\"1.8\" fill=\"#1a1410\"/><circle cx=\"37\" cy=\"29\" r=\"1.8\" fill=\"#1a1410\"/><path d=\"M31 34h6\" stroke=\"#1a1410\" stroke-width=\"1.5\"/><path d=\"M24 40l20-18M24 22l20 18\" stroke=\"#f3c969\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>\n        <path d=\"M12 12h10l-8 30z\" fill=\"#fff\" opacity=\".18\"/></svg>", "r": "SR", "d": "提升技能等級用的秘笈。在角色培養的「技能」分頁使用。"}, "summon_ticket": {"n": "一般召喚券", "h": "<svg class=\"ico ico2 r-SR\" viewBox=\"0 0 64 64\" style=\"--g:#c58bff\" aria-hidden=\"true\"><defs><linearGradient id=\"ic11p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff6dc\"/><stop offset=\"1\" stop-color=\"#e2cfa0\"/></linearGradient></defs>\n        <path d=\"M14 14h36v36H14z\" fill=\"url(#ic11p)\" stroke=\"#1a1410\" stroke-width=\"2.2\"/>\n        <path d=\"M20 22h24M20 28h24M20 34h18M20 40h22\" stroke=\"#9a8460\" stroke-width=\"1.6\"/>\n        <rect x=\"8\" y=\"8\" width=\"48\" height=\"8\" rx=\"4\" fill=\"#4c93cc\" stroke=\"#1a1410\" stroke-width=\"2.2\"/><rect x=\"8\" y=\"48\" width=\"48\" height=\"8\" rx=\"4\" fill=\"#4c93cc\" stroke=\"#1a1410\" stroke-width=\"2.2\"/>\n        <circle cx=\"8\" cy=\"12\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"56\" cy=\"12\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"8\" cy=\"52\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"56\" cy=\"52\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/>\n        <circle cx=\"42\" cy=\"40\" r=\"6\" fill=\"#c8322b\" stroke=\"#1a1410\" stroke-width=\"1.8\"/><path d=\"M39 40l2 2 4-4\" stroke=\"#ffd26c\" stroke-width=\"1.6\" fill=\"none\"/></svg>", "r": "SR", "d": "懸賞處召喚用的召喚券，1 張＝抽 1 次（十連用 10 張）。召喚時會優先使用，不夠時才用寶藏幣。"}, "meat": {"n": "海賊大肉", "h": "<svg class=\"ico ico2 r-SSR\" viewBox=\"0 0 64 64\" style=\"--g:#ffcf5a\" aria-hidden=\"true\"><defs><radialGradient id=\"ic12m\" cx=\".4\" cy=\".35\" r=\".75\"><stop offset=\"0\" stop-color=\"#e8804a\"/><stop offset=\".65\" stop-color=\"#b8502a\"/><stop offset=\"1\" stop-color=\"#7a2e14\"/></radialGradient></defs>\n        <path d=\"M40 40l12 12\" stroke=\"#f4ead2\" stroke-width=\"7\" stroke-linecap=\"round\"/><path d=\"M40 40l12 12\" stroke=\"#1a1410\" stroke-width=\"9\" stroke-linecap=\"round\" opacity=\".0\"/>\n        <circle cx=\"53\" cy=\"49\" r=\"4\" fill=\"#fffaf0\" stroke=\"#1a1410\" stroke-width=\"2\"/><circle cx=\"49\" cy=\"54\" r=\"4\" fill=\"#fffaf0\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M44 42c-6 10-20 12-30 4S6 22 16 14s24-8 30 0 6 18-2 28z\" fill=\"url(#ic12m)\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M18 18c6-5 14-5 20 0\" stroke=\"#ffb07a\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\" opacity=\".75\"/>\n        <path d=\"M16 34c4 4 10 6 16 4\" stroke=\"#7a2e14\" stroke-width=\"2\" fill=\"none\"/></svg>", "r": "SSR", "d": "體力全滿，並清除所有異常狀態與負面能力。"}, "exp_l": {"n": "羅格鎮的傳說", "h": "<svg class=\"ico ico2 r-SSR\" viewBox=\"0 0 64 64\" style=\"--g:#ffcf5a\" aria-hidden=\"true\"><defs><linearGradient id=\"ic13a\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#639ad6\"/><stop offset=\"1\" stop-color=\"#1f4e82\"/></linearGradient><linearGradient id=\"ic13p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fffaf0\"/><stop offset=\"1\" stop-color=\"#e6dcc4\"/></linearGradient></defs>\n        <path d=\"M14 14h36a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14z\" fill=\"url(#ic13p)\" stroke=\"#1a1410\" stroke-width=\"2\"/>\n        <path d=\"M16 55h36M16 52h36\" stroke=\"#cbbf9f\" stroke-width=\"1.2\"/>\n        <path d=\"M10 10h38a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H10a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z\" fill=\"url(#ic13a)\" stroke=\"#1a1410\" stroke-width=\"2.4\"/>\n        <path d=\"M13 10v44\" stroke=\"#183c64\" stroke-width=\"3\"/><path d=\"M17 14h31M17 50h31\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".9\"/>\n        <rect x=\"19\" y=\"17\" width=\"30\" height=\"30\" rx=\"4\" fill=\"none\" stroke=\"#f3c969\" stroke-width=\"1.6\" opacity=\".85\"/><path d=\"M34 20l3.2 6.6 7.2 1-5.2 5 1.3 7.2L34 36.4l-6.5 3.4 1.3-7.2-5.2-5 7.2-1z\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n        <path d=\"M12 12h10l-8 30z\" fill=\"#fff\" opacity=\".18\"/></svg>", "r": "SSR", "d": "在船員畫面使用，角色經驗 +6000。"}, "skin_ticket": {"n": "限定皮膚選擇卷", "h": "<svg class=\"ico ico2 r-SSR\" viewBox=\"0 0 64 64\" style=\"--g:#ffcf5a\" aria-hidden=\"true\"><defs><linearGradient id=\"ic14p\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff6dc\"/><stop offset=\"1\" stop-color=\"#e2cfa0\"/></linearGradient></defs>\n        <path d=\"M14 14h36v36H14z\" fill=\"url(#ic14p)\" stroke=\"#1a1410\" stroke-width=\"2.2\"/>\n        <path d=\"M20 22h24M20 28h24M20 34h18M20 40h22\" stroke=\"#9a8460\" stroke-width=\"1.6\"/>\n        <rect x=\"8\" y=\"8\" width=\"48\" height=\"8\" rx=\"4\" fill=\"#cc62ae\" stroke=\"#1a1410\" stroke-width=\"2.2\"/><rect x=\"8\" y=\"48\" width=\"48\" height=\"8\" rx=\"4\" fill=\"#cc62ae\" stroke=\"#1a1410\" stroke-width=\"2.2\"/>\n        <circle cx=\"8\" cy=\"12\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"56\" cy=\"12\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"8\" cy=\"52\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/><circle cx=\"56\" cy=\"52\" r=\"3\" fill=\"#f3c969\" stroke=\"#1a1410\" stroke-width=\"1.6\"/>\n        <circle cx=\"42\" cy=\"40\" r=\"6\" fill=\"#c8322b\" stroke=\"#1a1410\" stroke-width=\"1.8\"/><path d=\"M39 40l2 2 4-4\" stroke=\"#ffd26c\" stroke-width=\"1.6\" fill=\"none\"/></svg>", "r": "SSR", "d": "從限定皮膚中任選一款（已擁有的不能選）。在背包裡使用。"}, "feather": {"n": "不死鳥之羽", "h": "<svg class=\"ico ico2 r-SSR\" viewBox=\"0 0 64 64\" style=\"--g:#ffcf5a\" aria-hidden=\"true\"><defs><linearGradient id=\"ic15f\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff3c4\"/><stop offset=\"1\" stop-color=\"#ff9a3a\"/></linearGradient><linearGradient id=\"ic15b\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#bff0ff\"/><stop offset=\"1\" stop-color=\"#3f8fe0\"/></linearGradient></defs>\n        <path d=\"M50 8C26 12 14 30 16 52c16-4 30-18 34-44z\" fill=\"url(#ic15b)\" stroke=\"#1a1410\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/>\n        <path d=\"M46 14C30 20 22 32 20 46c10-6 20-16 26-32z\" fill=\"url(#ic15f)\" opacity=\".9\"/>\n        <path d=\"M48 10L14 56\" stroke=\"#1a1410\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M46 14L16 52\" stroke=\"#fffaf0\" stroke-width=\"1.2\"/>\n        <path d=\"M22 44l-6 2M26 38l-7 1M31 31l-7 0M36 25l-7-1\" stroke=\"#1a1410\" stroke-width=\"1.2\" opacity=\".5\"/></svg>", "r": "SSR", "d": "本場戰鬥倒下時，以 50% 體力復活一次。"}}; }
  const STAGE = `<div class="phone" id="phone">
<div class="st" id="st">
<div class="shk">
<div class="bg" id="bg"></div>
<div class="lamp"></div>
<canvas class="env" id="env"></canvas>
<div class="eflash" id="eflash"></div>
<div class="vig" id="vig"></div>
<div class="idle" id="idle"><b>懸賞召喚</b><span>按下方「單抽」或「十連」開始。<br>建議開著音效看。</span></div>
<div class="bub" id="bub"></div>
<div class="den" id="den"><div class="dg"></div><img id="denImg" alt=""><div class="sheen" id="denSh"></div></div>
<div class="poster" id="poster">
<div class="gl" id="pGl"></div>
<img class="wf" id="pWf" alt=""><div class="wclip"><div class="wipe" id="pWipe"></div></div>
<div class="photo"><div class="pc" id="pPc"></div><div class="cv" id="pCv">?</div><div class="edge" id="pEdge"></div></div>
<div class="pname" id="pName"></div><div class="prar" id="pRar"></div>
<div class="stamps" id="stamps"></div><button class="tape" id="seal" aria-label="點擊撕開封條"><i class="ta"><span>海軍本部 ✦ 機密 ✦ MARINE ✦ 海軍本部 ✦ 機密</span></i><i class="tb"><span>海軍本部 ✦ 機密 ✦ MARINE ✦ 海軍本部 ✦ 機密</span></i></button><i class="pin p1" id="pin1"></i><i class="pin p2" id="pin2"></i>
</div>
<div class="roll" id="roll"></div><div class="choose" id="choose" hidden></div><div class="cutin" id="cutin"><img id="cutImg" alt=""><div class="ct" id="cutT"></div></div><div class="holdg" id="holdg"><b></b></div><div class="siren" id="siren"><i></i><b></b></div><img class="taphand" id="tapHand" alt=""><div class="appr" id="appr"><small>賞金鑑定</small><b id="apprN">฿ 0</b></div>
<div class="g10" id="g10" hidden></div>
<div class="spot" id="spot"></div>
<div class="tap" id="tap"></div>
<div class="yk" id="yk"></div>
<div class="sub" id="sub"></div>
<div class="black" id="black"></div><div class="hk" id="hk"><div class="hk-bg" id="hkBg"></div><div class="hk-rays"></div><div class="hk-glyph">霸</div><div id="hkWp"></div><div id="hkTags"></div><div class="hk-ban" id="hkBan"></div></div><div class="chance" id="chance"><div class="cr"></div><div class="ct" id="chanceT"></div></div><div class="cap" id="cap"></div>
<div class="splash" id="splash"><div class="rays" id="spRays"></div><div class="artbox"><img id="spArt" alt=""></div><div class="sr" id="spR"></div><div class="ttl" id="spT"></div><div class="sn" id="spN"></div><div class="stamp" id="spS"></div><div class="bty"><small>戰力</small><span id="spB">0</span></div><div class="cont">點擊繼續</div></div>
</div>
<div class="flash" id="flash"></div>
<canvas class="fx" id="fx"></canvas>
<div class="res" id="res"><div class="rrays"></div><h3 id="resT">召喚結果</h3><div class="rsum" id="rsum"></div><div class="rg" id="rg"></div><div class="rbest" id="rbest"></div><div class="pity" id="pityRow"><span>保底進度</span><i><b id="pityBar"></b></i><em id="pityTxt"></em></div><div class="colct" id="colct"></div><div class="rtap" id="rtap">點卡片看獎品詳細</div><div class="rbtns" id="rbtns"><button id="rAgain" class="go">再抽一次</button><button id="rClose">關閉</button></div><div class="sc" id="sc" hidden></div></div>
</div>
<button class="skip" id="skip" hidden>跳過 ▸▸</button>
<div class="gauge" id="gauge"><small>期待度</small><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></div>
<div class="op" id="op" hidden>
<div class="op-floor"></div>
<div class="op-cam" id="opCam"><div class="op-glow" id="opGlow"></div><div class="op-den" id="opDen"><img id="opImg" alt=""><img id="opImgC" class="eyesc" alt=""><div class="sh" id="opSh"></div></div></div>
<div class="op-fx" id="opFx"></div>
<div class="op-hand" id="opHand"><img id="handImg" alt=""></div>
<div class="op-cap" id="opCap"></div>
<div class="op-bub" id="opBub"></div><div class="op-orb" id="opOrb"></div><div class="op-hint" id="opHint"></div><div class="op-flash" id="opFlash"></div>
<div class="yk" id="opYk"></div>
<div class="op-black" id="opBlack"></div>
</div>
</div>`;
  function mount() {
    if (host) return; host = document.createElement('div'); host.className = 'gfx-host'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', '懸賞召喚');
    R = host.attachShadow({ mode: 'open' });
    R.innerHTML = `<link rel="stylesheet" href="${abs('css/gacha_v144.css?v=' + V)}"><style>:host{position:fixed;inset:0;z-index:9800;display:block;background:#05080f;color:#ece5d6;font:15px/1.7 var(--body);-webkit-tap-highlight-color:transparent}.phone{position:absolute;inset:0;width:auto;aspect-ratio:auto;border-radius:0;box-shadow:none}.phone>.skip{top:calc(12px + env(safe-area-inset-top,0px))}</style>` + STAGE;
  }
  function boot() {
    const $ = id => R.getElementById(id);
    const TC = ['#d9e2ea', '#5fb8ff', '#c58bff', '#ffcf5a', '#ff4a3d', '#ff6fd0'], TN = ['白', '藍', '紫', '金', '紅', '虹'];
  
    const CH = {}; /* 本次結果的船員資料（mapRes 填入） */
    const RAR = ['N', 'R', 'SR', 'SSR'];
    const KIND = ['silver', 'blue', 'purple', 'gold', 'red', 'rainbow'];
    const FM = ['linear-gradient(135deg,#ffffff,#8d99aa 38%,#f4f7fb 55%,#5d6878)', 'linear-gradient(135deg,#dff6ff,#2a7fd8 38%,#a6e4ff 55%,#123f8a)', 'linear-gradient(135deg,#f6e2ff,#8a3ad8 38%,#e6bcff 55%,#3e1278)', 'linear-gradient(135deg,#fff8d0,#c98a10 38%,#ffea8a 55%,#7a4600)', 'linear-gradient(135deg,#ffe0da,#c41a1a 38%,#ff9a80 55%,#5a0404)', 'conic-gradient(from 45deg,#ff4a4a,#ffd84a,#4affb0,#4ac8ff,#b44aff,#ff4adf,#ff4a4a)'];
    const PS = (t, k = 'gold', fs) => `<span class="ps k-${k}"${fs ? ` style="--fs:${fs}px"` : ''}>${('<b>' + t + '</b>').repeat(5)}</span>`;
  
    const APPR = [6, 7, 8, 9, 10, 10]; /* 賞金鑑定位數 */
    const LINES = [['喂？這裡是懸賞處。', '新的懸賞令到了。'], ['……有消息了。', '這張懸賞令有點意思。'], ['聽好了，<em>這次的賞金不得了</em>。'], ['……<em>是大人物</em>。準備好了嗎？']];
    const LINE_T = [0, 2, 3, 4]; /* 台詞等級對應的顏色 */
    const st = $('st'), phone = $('phone'), cv = $('fx'), cx = cv.getContext('2d'), ev = $('env'), ex = ev.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('bg').style.backgroundImage = `url(${A.bg})`; $('denImg').src = A.den4; $('tap').innerHTML = PS('點擊撕開封條', 'gold', 22); $('opImg').src = A.den4; $('opImgC').src = A.den4c; $('handImg').src = A.hand; $('tapHand').src = A.hand; $('opSh').style.setProperty('--m', `url(${A.den4})`); phone.style.setProperty('--pbg', `url(${A.bg})`); $('denSh').style.setProperty('--m', `url(${A.den4})`); $('yk').innerHTML = PS('號外！大人物出沒！', 'gold', 22); $('pWf').src = A.wanted;
    function fit() { const pw = phone.clientWidth, ph = phone.clientHeight, s = Math.min(pw / 360, ph / 640); st.style.transform = `translate(${(pw - 360 * s) / 2}px,${(ph - 640 * s) / 2}px) scale(${s})`; const d = Math.min(2, devicePixelRatio || 1) * s; for (const [c, g] of [[cv, cx], [ev, ex]]) { c.width = 360 * d; c.height = 640 * d; g.setTransform(d, 0, 0, d, 0, 0); } }
    new ResizeObserver(fit).observe(phone); fit();
  
    /* ---------- 音效（合成） ---------- */
    let AC = null; const sndOn = () => !(window.AUDIO && AUDIO.pref && AUDIO.pref.muted), SV = () => Math.max(0, Math.min(1.25, ((window.AUDIO && AUDIO.pref && AUDIO.pref.sfx) ?? .8) / .8)); /* 跟著遊戲的音效設定 */
    const ac = () => { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; };
    function tone(f, d, type = 'sine', v = .15, f2) { const a = sndOn() && ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime; o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(Math.max(.0001, v * SV()), t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d); }
    function noise(d, v = .2, fq = 800, q = 1, type = 'bandpass') { const a = sndOn() && ac(); if (!a) return; const n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = type; f.frequency.value = fq; f.Q.value = q; g.gain.value = v * SV(); s.connect(f).connect(g).connect(a.destination); s.start(); }
    const SND = {
      ring() { tone(1320, .06, 'square', .045); setTimeout(() => tone(990, .06, 'square', .045), 70); },
      pick() { tone(500, .05, 'square', .08); noise(.06, .2, 2000); },
      thud() { tone(140, .35, 'sine', .35, 40); noise(.2, .25, 300); },
      wind() { noise(1.3, .14, 500, .4); },
      beat() { tone(62, .12, 'sine', .5, 40); setTimeout(() => tone(55, .14, 'sine', .4, 36), 150); },
      up(l) { const b = 440 * Math.pow(1.26, l); [0, 1, 2].forEach(i => setTimeout(() => tone(b * [1, 1.25, 1.5][i], .22, 'triangle', .12), i * 60)); noise(.15, .12, 3000, 2); },
      boom() { tone(70, 1.4, 'sine', .55, 28); noise(1.1, .35, 160); },
      crack() { noise(.25, .4, 3500, .8); tone(1800, .08, 'square', .03, 300); },
      bolt() { noise(.35, .3, 1800, .6); tone(220, .2, 'sawtooth', .05, 60); },
      thunder() { noise(1.6, .28, 120, .5, 'lowpass'); },
      burn() { noise(1.6, .12, 2400, .8); },
      reveal(t) { const b = t >= 4 ? 523 : 392; [0, 1, 2, 3].forEach(i => setTimeout(() => tone(b * [1, 1.25, 1.5, 2][i], .45, 'triangle', .12), i * 90)); },
      stamp() { tone(110, .25, 'square', .12, 50); noise(.15, .3, 600); },
      flip() { noise(.12, .15, 4000, 1.5); },
      tick() { tone(1800, .03, 'square', .03); },
      rise(d) { tone(110, d, 'sawtooth', .05, 880); }
    };
  
    const vib = p => { try { if (!reduce && navigator.vibrate) navigator.vibrate(p); } catch (e) { } };
    const PITY = () => GAME_SETTINGS.gachaPity || 150;
    /* ---------- 心跳 ---------- */
    let hbId = null;
    function heart(ms) { clearTimeout(hbId); if (!ms) return; const go = () => { SND.beat(); const v = $('vig'); v.classList.remove('beat'); void v.offsetWidth; v.classList.add('beat'); hbId = setTimeout(go, ms * (fast ? .8 : 1)); }; go(); }
  
    /* ---------- 環境畫布（灰塵、濃霧、暴風雨） ---------- */
    const E = { lv: 0, motes: Array.from({ length: 34 }, () => ({ x: Math.random() * 360, y: Math.random() * 640, v: 4 + Math.random() * 10, r: .6 + Math.random() * 1.4, p: Math.random() * 6 })), fog: Array.from({ length: 9 }, (_, i) => ({ x: Math.random() * 500 - 70, y: 120 + Math.random() * 480, r: 90 + Math.random() * 90, v: 6 + Math.random() * 12 })), rain: Array.from({ length: 140 }, () => ({ x: Math.random() * 420, y: Math.random() * 640, v: 520 + Math.random() * 300 })), nextT: 0, fogA: 0 };
    function focus(t, dur) { E.focus = { t, t0: performance.now(), dur: dur * (fast ? .6 : 1) }; }
    function wipe(t) { const w = $('pWipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); }
    function setEnv(lv) { E.lv = lv; st.classList.toggle('storm', lv === 2); }
    function envDraw(dt, now) {
      ex.clearRect(0, 0, 360, 640);
      E.fogA += ((E.lv >= 1 ? 1 : 0) - E.fogA) * Math.min(1, dt * 1.5);
      for (const m of E.motes) { m.y -= m.v * dt; m.x += Math.sin(now / 900 + m.p) * 6 * dt; if (m.y < -5) { m.y = 645; m.x = Math.random() * 360; } ex.globalAlpha = .35 + .3 * Math.sin(now / 400 + m.p); ex.fillStyle = '#ffd9a0'; ex.beginPath(); ex.arc(m.x, m.y, m.r, 0, 6.283); ex.fill(); }
      if (E.fogA > .02) for (const f of E.fog) { f.x += f.v * dt; if (f.x - f.r > 360) f.x = -f.r; const g = ex.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r); g.addColorStop(0, `rgba(170,185,205,${.2 * E.fogA})`); g.addColorStop(1, 'rgba(170,185,205,0)'); ex.globalAlpha = 1; ex.fillStyle = g; ex.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); }
      if (E.lv === 2) { ex.globalAlpha = .45; ex.strokeStyle = '#b8cdf0'; ex.lineWidth = 1; ex.beginPath(); for (const r of E.rain) { r.y += r.v * dt; r.x -= r.v * .25 * dt; if (r.y > 650) { r.y = -20; r.x = Math.random() * 420; } ex.moveTo(r.x, r.y); ex.lineTo(r.x + 4, r.y - 16); } ex.stroke();
        if (now > E.nextT) { E.nextT = now + 2500 + Math.random() * 3000; const f = $('eflash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); setTimeout(SND.thunder, 120); } }
      if (E.focus) { const f = E.focus, k = (now - f.t0) / f.dur; if (k >= 1) E.focus = null; else { const al = k < .15 ? k / .15 : 1 - Math.max(0, (k - .6) / .4); ex.save(); ex.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, w = .006 + Math.random() * .014, r0 = 120 + Math.random() * 90; ex.globalAlpha = al * (.25 + Math.random() * .35); ex.fillStyle = i % 3 ? '#ffffff' : (f.t === 5 ? `hsl(${Math.random() * 360},100%,65%)` : TC[f.t]); ex.beginPath(); ex.moveTo(180 + Math.cos(a - w) * 520, 300 + Math.sin(a - w) * 520); ex.lineTo(180 + Math.cos(a) * r0, 300 + Math.sin(a) * r0); ex.lineTo(180 + Math.cos(a + w) * 520, 300 + Math.sin(a + w) * 520); ex.fill(); }
          if (f.t >= 4) { ex.lineWidth = 3; for (let i = 0; i < 7; i++) { const o = ((now / 3 + i * 140) % 1100) - 300; ex.globalAlpha = al * .7; ex.strokeStyle = f.t === 5 ? `hsl(${(now / 4 + i * 50) % 360},100%,60%)` : '#ff2030'; ex.shadowColor = ex.strokeStyle; ex.shadowBlur = 14; ex.beginPath(); ex.moveTo(o, 0); ex.lineTo(o - 400, 640); ex.stroke(); } }
          ex.restore(); } }
      ex.globalAlpha = 1;
    }
  
    /* ---------- 特效畫布 ---------- */
    let P = [], last = performance.now(), speedLines = null, cracks = null;
    const rainbow = (o = 0) => `hsl(${(performance.now() / 4 + o) % 360},100%,62%)`;
    const col = t => t === 5 ? rainbow() : TC[t];
    function ring(x, y, t, R = 140, w = 6, life = .6) { P.push({ k: 'ring', x, y, t, R, w, life, age: 0 }); }
    function burst(x, y, t, n = 30, sp = 260) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = sp * (.3 + Math.random() * .7); P.push({ k: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t, r: 1.5 + Math.random() * 2.5, life: .5 + Math.random() * .6, age: 0, o: Math.random() * 360 }); } }
    function ember(x, y) { P.push({ k: 'dot', x, y, vx: (Math.random() - .5) * 40, vy: -40 - Math.random() * 80, t: -1, r: 1 + Math.random() * 2, life: .5 + Math.random() * .6, age: 0 }); }
    function bolt(x1, y1, x2, y2, c = '#ff3b3b') { const pts = [[x1, y1]], n = 9; for (let i = 1; i < n; i++) { const k = i / n; pts.push([x1 + (x2 - x1) * k + (Math.random() - .5) * 60, y1 + (y2 - y1) * k + (Math.random() - .5) * 30]); } pts.push([x2, y2]); P.push({ k: 'bolt', pts, c, life: .28, age: 0 }); }
    function shards(n = 40, pal) { for (let i = 0; i < n; i++) { const x = Math.random() * 360, y = Math.random() * 640, a = Math.atan2(y - 300, x - 180), s = 200 + Math.random() * 400; P.push({ k: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: Math.random() * 6, vr: (Math.random() - .5) * 12, sz: 14 + Math.random() * 30, life: 1 + Math.random() * .5, age: 0, o: Math.random() * 360, c: pal ? pal[ri(pal.length)] : null }); } }
    function makeCracks() { const L = []; for (let i = 0; i < 11; i++) { let a = i / 11 * 6.283 + Math.random() * .4, x = 180, y = 300; const pts = [[x, y]]; for (let k = 0; k < 7; k++) { a += (Math.random() - .5) * .7; const d = 30 + Math.random() * 45; x += Math.cos(a) * d; y += Math.sin(a) * d; pts.push([x, y]); } L.push(pts); } return { L, t0: performance.now(), dur: 520 }; }
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now; envDraw(dt, now); cx.clearRect(0, 0, 360, 640);
      if (speedLines) { cx.save(); cx.globalCompositeOperation = 'lighter'; for (const s of speedLines.l) { s.d += dt * s.v; if (s.d > 520) { s.d = 20 + Math.random() * 40; s.a = Math.random() * 6.283; } const x = 180 + Math.cos(s.a) * s.d, y = 290 + Math.sin(s.a) * s.d, x2 = 180 + Math.cos(s.a) * (s.d + s.len), y2 = 290 + Math.sin(s.a) * (s.d + s.len); cx.strokeStyle = speedLines.t === 5 ? rainbow(s.a * 57) : TC[speedLines.t]; cx.globalAlpha = .3; cx.lineWidth = s.w; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x2, y2); cx.stroke(); } cx.restore(); }
      if (cracks) { const k = Math.min(1, (now - cracks.t0) / cracks.dur); cx.save(); cx.strokeStyle = '#fff'; cx.shadowColor = '#ff3b3b'; cx.shadowBlur = 10; cx.lineWidth = 2; for (const pts of cracks.L) { const n = Math.max(1, Math.floor(pts.length * k)); cx.beginPath(); for (let i = 0; i < n; i++) i ? cx.lineTo(pts[i][0], pts[i][1]) : cx.moveTo(pts[i][0], pts[i][1]); cx.stroke(); } cx.restore(); }
      cx.save(); cx.globalCompositeOperation = 'lighter';
      P = P.filter(p => (p.age += dt) < p.life);
      for (const p of P) {
        const k = p.age / p.life;
        if (p.k === 'ring') { cx.globalAlpha = 1 - k; cx.strokeStyle = col(p.t); cx.lineWidth = p.w * (1 - k) + 1; cx.beginPath(); cx.arc(p.x, p.y, p.R * (1 - Math.pow(1 - k, 3)), 0, 6.283); cx.stroke(); }
        else if (p.k === 'dot') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy = p.vy * .96 + 60 * dt; cx.globalAlpha = 1 - k; cx.fillStyle = p.t === -1 ? `hsl(${30 + 20 * Math.random()},100%,${55 + 20 * (1 - k)}%)` : p.t === 5 ? rainbow(p.o) : TC[p.t]; cx.beginPath(); cx.arc(p.x, p.y, p.r * (1 - k * .5), 0, 6.283); cx.fill(); }
        else if (p.k === 'bolt') { cx.strokeStyle = p.c; cx.shadowColor = p.c; cx.shadowBlur = 16; for (const [w, a] of [[7, .35], [2.5, 1]]) { cx.lineWidth = w; cx.globalAlpha = (1 - k) * a; cx.beginPath(); p.pts.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.stroke(); } cx.shadowBlur = 0; }
        else if (p.k === 'shard') { p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; cx.globalAlpha = 1 - k; cx.fillStyle = p.c || rainbow(p.o); cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.beginPath(); cx.moveTo(0, -p.sz / 2); cx.lineTo(p.sz / 2, p.sz / 3); cx.lineTo(-p.sz / 3, p.sz / 2); cx.closePath(); cx.fill(); cx.restore(); }
      }
      cx.restore(); if (OPEN) requestAnimationFrame(frame); else running = false;
    }
  
  
    /* ---------- 時間控制與跳過 ---------- */
    const SKIP = Symbol('skip'); let waiters = [], skipping = false, fast = false, busy = false;
    const W = ms => new Promise((res, rej) => { if (skipping) return rej(SKIP); const id = setTimeout(res, reduce ? Math.min(ms, 200) : ms * (fast ? .5 : 1)); waiters.push(() => { clearTimeout(id); rej(SKIP); }); });
    function doSkip() { skipping = true; waiters.splice(0).forEach(f => f()); }
    $('skip').onclick = doSkip;
    const note = () => { }; /* 示意版的流程說明，遊戲內不顯示 */
    const shake = () => { if (reduce) return; st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); };
    const flash = () => { const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); };
    function cap(text, kind = 'gold', fs = 52, quake = false, small = '') { const e = $('cap'); e.innerHTML = PS(text, kind, fs) + (small ? `<small>${small}</small>` : ''); e.className = 'cap'; void e.offsetWidth; e.className = 'cap ' + (quake ? 'quake' : 'show'); }
    const capOff = () => { $('cap').className = 'cap hide'; };
    async function sub(text, ms = 40) { const e = $('sub'); let t = ''; for (const ch of text) { if (skipping) break; t += ch; e.innerHTML = PS(t, 'silver', 22); await W(ms); } }
    const subOff = () => { $('sub').innerHTML = ''; };
    function setT(el, t) { el.style.setProperty('--tc', TC[t]); }
    function posterColor(t) { st.style.setProperty('--edge', TC[t]); setT($('poster'), t); setT($('appr'), t); [$('pGl'), $('seal')].forEach(e => e.classList.toggle('rb', t === 5)); $('seal').classList.add('glow'); $('pWf').classList.toggle('rb', t === 5); }
  
  
    /* ---------- v4：開頭動畫（電話蟲響→手按接聽→鏡頭轉向→閉眼→進入抽獎） ---------- */
    const BOLT = '<svg viewBox="0 0 40 48"><path d="M24 2 6 28h12l-4 18 20-28H22z" fill="#ffd23a" stroke="#7a4a00" stroke-width="2" stroke-linejoin="round"/></svg>';
    const opRect = el => { const o = $('op').getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height, W: o.width, H: o.height }; };
    function opCap(text, kind, pulse) { const c = $('opCap'); c.innerHTML = PS(text, kind); c.className = 'op-cap'; void c.offsetWidth; c.className = 'op-cap on' + (pulse ? ' pulse' : ''); }
    function opFx(cls, x, y, html = '') { const e = document.createElement('div'); e.className = cls; e.style.left = x + 'px'; e.style.top = y + 'px'; e.innerHTML = html; $('opFx').appendChild(e); return e; }
    function ringFx(on) { const fx = $('opFx'); if (!on) { fx.innerHTML = ''; return; } const d = opRect($('opDen'));
      fx.innerHTML = ''; const u = Math.min(d.W, d.H) / 100;
      opFx('bolt', d.x - 4 * u, d.y - 6 * u, BOLT); opFx('bolt', d.x + d.w * .62, d.y - 10 * u, BOLT).style.animationDelay = '.13s'; opFx('bolt', d.x + d.w * .86, d.y + d.h * .05, BOLT);
      opFx('arc', d.x - 9 * u, d.y + d.h * .12); opFx('arc', d.x - 15 * u, d.y + d.h * .08).style.transform = 'scale(1.4)'; opFx('arc r', d.x + d.w + 2 * u, d.y + d.h * .3); opFx('arc r', d.x + d.w + 8 * u, d.y + d.h * .26).style.transform = 'scaleX(-1) scale(1.4)'; }
    function noteFx() { const d = opRect($('opDen')), L = Math.random() < .5; const n = opFx('onote', L ? d.x - d.w * .1 + Math.random() * d.w * .2 : d.x + d.w * .8 + Math.random() * d.w * .2, d.y + Math.random() * d.h * .3, Math.random() < .5 ? '♪' : '♫'); setTimeout(() => n.remove(), 1300); }
    function focusOp() { const o = $('op').getBoundingClientRect(); const e = opFx('otap', o.width / 2, o.height * .5); e.style.width = e.style.height = '60cqmin'; e.style.margin = '-30cqmin 0 0 -30cqmin'; e.style.zIndex = 9; setTimeout(() => e.remove(), 600); }
    /* ---------- 電話台詞（每一級多句隨機，道具與船員分開） ---------- */
    const TALK = {
      lv: [
        ['新的懸賞令到了，過來看看吧。', '今天的懸賞令，就這一張。', '是你啊船長，懸賞令在這裡。'],
        ['……慢著，這張的封條是海軍本部的。', '情報屋剛傳來消息，你最好坐下聽。', '這張懸賞令，墨水還沒乾。'],
        { item: ['聽好了，這次的懸賞金位數不對勁！', '這張懸賞令上，印著傳說寶物的記號！', '整個海軍本部，都在找這張懸賞令！'],
          char: ['聽好了，這次的懸賞金位數不對勁！', '五老星的印章，蓋在這張懸賞令上！？', '整個海軍本部，都在找這個人！'] },
        ['……是大人物。足以撼動整個時代。', '新世界傳來消息，那傢伙出海了！', '這個名字，連四皇都得忌憚三分！']
      ],
      kind: ['silver', 'blue', 'gold', 'red'],
      gap: [[], ['……嗯？', '咦……？', '……慢著。'], ['什麼！？', '喂喂，開玩笑的吧！？', '你、你說什麼！？'], ['不……還不只這樣……', '等等，這張照片……！', '我的手……在發抖……']],
      end: [['……就這樣，祝你航海順利。'], ['……拿去吧，可別弄丟了。'], ['……小心點，這東西會引來麻煩。'], ['……準備好了嗎，船長。']],
      who: ['懸賞處老闆', '海軍情報員', '海軍情報員', '???'],
      nar: { storm: '轟隆——雷聲劃破了夜空……', fog: '濃霧，從門縫滲了進來……', voice: '電話那頭，傳來沙沙的雜音……' },
      key: () => tone(520 + Math.random() * 90, .03, 'square', .02)
    };
    const brk = t => t.replace(/([，。])(?=.)/g, '$1<br>');
    /* ---------- 共用：畫面變暗後，提示才在黑暗中一個一個出現 ---------- */
    async function darkHints(T, t0, line, yk, env, isChar) {
      note('畫面變暗', '先全暗、安靜一下，這時還沒有提示');
      heart(0); $('opBlack').style.opacity = .93; await W(1200);
      const hint = $('opHint');
      const say = async (txt, kind, ms, o = {}) => { hint.querySelectorAll('div').forEach(e => e.className += ' out'); await W(200);
        const box = document.createElement('div'); box.className = o.cls || ''; hint.innerHTML = ''; hint.appendChild(box);
        const who = o.who ? `<small style="font:700 11px var(--body);letter-spacing:.2em;color:#c7b996">${o.who}</small>` : '';
        if (o.type && !reduce) { let t = ''; for (const ch of txt) { if (skipping) break; t += ch; box.innerHTML = who + PS(brk(t), kind); if (ch !== '…' && ch !== '　') T.key(); await W(ch === '…' ? 90 : ch === '，' || ch === '。' ? 180 : 55); } }
        box.innerHTML = who + PS(brk(txt), kind); await W(ms); };
      note('暗中出現提示', `光點：${TN[t0]}；天氣：${['平靜', '濃霧', '暴風雨（金以上）'][env]}；台詞爬到第 ${line + 1} 級${yk ? '；號外（金以上）' : ''}`);
      await say('……', 'silver', 600, { cls: 'soft' });
      if (env) { setEnv(env); if (env === 2) { const f = $('opFlash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); SND.thunder(); shake(); await say(T.nar.storm, 'silver', 900, { cls: 'soft', type: 1 }); } else { await say(T.nar.fog, 'silver', 900, { cls: 'soft', type: 1 }); } }
      const orb = $('opOrb'); orb.style.setProperty('--oc', TC[t0]); orb.classList.toggle('rb', t0 === 5); orb.classList.add('on'); SND.up(t0); heart(800); st.style.setProperty('--edge', TC[t0]); st.classList.add('edge-on');
      await say(T.nar.voice, 'silver', 900, { cls: 'soft', type: 1 });
      for (let k = 0; k <= line; k++) {
        if (k) { heart(700 - k * 140); await say(pick(T.gap[k]), 'silver', 600, { cls: 'soft', type: 1 }); shake(); }
        const last = k === line, pool = k === 2 ? T.lv[2][isChar ? 'char' : 'item'] : T.lv[k]; SND.up(k + 1); if (k >= 2) focusOp();
        if (k === 3) { await say(pick(pool), 'red', 1700, { cls: 'big', who: T.who[3] }); shake(); SND.boom(); }
        else await say(pick(pool), T.kind[k], last ? 1200 + k * 200 : 800, { type: 1, who: T.who[k] });
      }
      if (line < 3 && Math.random() < .3) { heart(500); await say(pick(T.gap[line + 1]), 'silver', 700, { cls: 'soft', type: 1 }); shake(); await say(T.fake || '……抱歉，是我看錯了。', 'silver', 900, { cls: 'soft', type: 1 }); heart(0); }
      await say(T.end[line][0], 'silver', 1000, { cls: 'soft', type: 1 });
      if (yk) { $('opYk').innerHTML = PS(isChar ? '號外！大人物出沒！' : '號外！稀世珍寶出土！', 'gold', 22); $('opYk').className = 'yk on'; SND.stamp(); shake(); await W(1200); $('opYk').className = 'yk'; }
      hint.querySelectorAll('div').forEach(e => e.className += ' out'); orb.classList.remove('on'); heart(0);
      $('opBlack').style.opacity = 1; await W(800); hint.innerHTML = '';
    }
    async function stOpening(t0, line, yk, short, env = 0, isChar = false) {
      const op = $('op'), cam = $('opCam'), hand = $('opHand'), den = $('opDen'), dur = ms => reduce ? 1 : ms * (fast ? .55 : 1);
      [cam, hand, den, $('opGlow')].forEach(e => e.getAnimations().forEach(a => a.cancel()));
      subOff(); op.hidden = false; op.className = 'op'; $('opHint').innerHTML = ''; $('opOrb').className = 'op-orb'; op.style.setProperty('--gc', '#fff0c8'); $('opGlow').classList.remove('rb'); $('opGlow').style.opacity = 1; cam.style.transform = ''; $('opBlack').style.opacity = 0; $('opBub').className = 'op-bub'; $('opYk').className = 'yk'; hand.style.opacity = 0;
      note('② 黃金電話蟲來電', '從黑暗中浮現，響三輪（每輪跳動、搖晃、回彈），響鈴期間不給任何提示');
      /* 登場：從暗處浮上來 */
      den.animate([{ opacity: 0, transform: 'translate(-50%,-42%) scale(.9)' }, { opacity: 1, transform: 'translate(-50%,-51%) scale(1.01)', offset: .7 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: dur(800), easing: 'cubic-bezier(.2,.9,.3,1)' });
      $('opGlow').animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: dur(900), easing: 'ease-out' });
      await W(820);
      /* 響鈴：每輪「噗嚕噗嚕」跳一下、左右晃、慢慢回穩 */
      const RING = [{ transform: 'translate(-50%,-50%) rotate(0)' }, { transform: 'translate(-50%,-54%) rotate(-3.2deg) scale(1.03,.97)', offset: .1 }, { transform: 'translate(-50%,-50%) rotate(2.8deg) scale(.98,1.02)', offset: .22 }, { transform: 'translate(-50%,-53%) rotate(-2.4deg) scale(1.02,.98)', offset: .36 }, { transform: 'translate(-50%,-50%) rotate(1.8deg)', offset: .5 }, { transform: 'translate(-50%,-51.5%) rotate(-1.2deg)', offset: .64 }, { transform: 'translate(-50%,-50%) rotate(.6deg)', offset: .8 }, { transform: 'translate(-50%,-50%) rotate(0)' }];
      op.classList.add('ring'); opCap('噗嚕噗嚕噗嚕…', 'gold', true); ringFx(true); heart(700);
      const bursts = short ? 2 : 3, d0 = opRect(den), tx = d0.x + d0.w * .617, ty = d0.y + d0.h * .02, hw = hand.offsetWidth, hh = hand.offsetHeight;
      Object.assign(hand.style, { left: (tx - hw * .328) + 'px', top: (ty - hh * .997) + 'px' });
      const HOFF = `translate(${d0.W * .5}px,${-d0.H * .5}px) rotate(22deg)`, HUP = 'translate(0,-12px) rotate(4deg)', HDN = `translate(0,${d0.h * .025}px) rotate(4deg) scale(.98)`;
      for (let b = 0; b < bursts; b++) {
        den.animate(RING, { duration: dur(620 - b * 60), easing: 'linear' }); SND.ring(); setTimeout(() => SND.ring(), dur(300 - b * 30)); noteFx(); if (b % 2) noteFx();
        if (b === bursts - 1) { note('② 手按接聽', '最後一輪響鈴時，手從右上方伸進來'); hand.style.opacity = 1;
          hand.animate([{ transform: HOFF, opacity: 0 }, { transform: `translate(${d0.W * .14}px,${-d0.H * .18}px) rotate(11deg)`, opacity: 1, offset: .55 }, { transform: HUP, opacity: 1 }], { duration: dur(950), easing: 'cubic-bezier(.25,.8,.3,1)', fill: 'forwards' }); }
        await W(620 - b * 60); if (b < bursts - 1) await W(260 - b * 40);
      }
      await W(380);
      /* 按下：手指壓下、電話蟲被壓扁再彈回 */
      hand.animate([{ transform: HUP }, { transform: HDN }], { duration: dur(150), easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' }); await W(150);
      op.classList.remove('ring'); ringFx(false); heart(0);
      den.animate([{ transform: 'translate(-50%,-50%)' }, { transform: 'translate(-50%,-50%) scale(1.04,.93)', offset: .3 }, { transform: 'translate(-50%,-50%) scale(.98,1.03)', offset: .62 }, { transform: 'translate(-50%,-50%) scale(1.01,.99)', offset: .82 }, { transform: 'translate(-50%,-50%)' }], { duration: dur(520), easing: 'ease-out' });
      const d = opRect(den), bx = d.x + d.w * .61, by = d.y + d.h * .035;
      SND.pick(); opFx('otap', bx, by); opFx('spark', bx, by); $('opCap').className = 'op-cap'; $('opCap').innerHTML = '';
      { const u = Math.min(d.W, d.H) / 100, k = opFx('kc', d.x + d.w * .12, d.y - u * 2, PS('喀嚓！', 'silver')); setTimeout(() => { k.style.transition = 'opacity .3s'; k.style.opacity = 0; }, 800); setTimeout(() => k.remove(), 1200); }
      await W(260);
      hand.animate([{ transform: HDN, opacity: 1 }, { transform: 'translate(0,-18px) rotate(4deg)', opacity: 1, offset: .25 }, { transform: HOFF, opacity: 0 }], { duration: dur(750), easing: 'cubic-bezier(.45,0,.7,.3)', fill: 'forwards' });
      /* 鏡頭：一次連續的轉向＋推近，不分段 */
      note('③ 鏡頭轉向', '一個連續鏡頭：往側邊繞一點、轉回正面、推近到眼睛');
      { const ex = d.x + d.w * .3, ey = d.y + d.h * .22, sc = 1.75, dx = d.W / 2 - ex, dy = d.H * .5 - ey;
        cam.style.transformOrigin = `${ex}px ${ey}px`; SND.wind();
        cam.animate([{ transform: 'translate(0,0) rotateY(0) scale(1)' }, { transform: `translate(${dx * .25}px,${dy * .2}px) rotateY(-16deg) scale(1.12)`, offset: .38 }, { transform: `translate(${dx * .8}px,${dy * .8}px) rotateY(3deg) scale(${sc * .94})`, offset: .78 }, { transform: `translate(${dx}px,${dy}px) rotateY(0) scale(${sc})` }], { duration: dur(1800), easing: 'cubic-bezier(.42,0,.2,1)', fill: 'forwards' }); }
      await W(1900);
      /* 閉眼：先眨一下，再慢慢闔上、整隻往下沉 */
      note('④ 電話蟲閉眼', '先眨一下眼，再慢慢闔上，身體微微往下沉');
      op.classList.add('shut'); await W(150); op.classList.remove('shut'); await W(380);
      op.classList.add('shut'); tone(300, .3, 'sine', .08, 110);
      den.animate([{ transform: 'translate(-50%,-50%)' }, { transform: 'translate(-50%,-49%) scale(1.01,.985)' }], { duration: dur(900), easing: 'ease-out', fill: 'forwards' });
      $('opGlow').animate([{ opacity: 1 }, { opacity: .25 }], { duration: dur(900), fill: 'forwards' }); heart(900); await W(950);
      await darkHints(TALK, t0, line, yk, env, isChar);
      op.style.background = '';
      op.hidden = true; $('opFx').innerHTML = ''; [cam, hand, den, $('opGlow')].forEach(e => e.getAnimations().forEach(a => a.cancel()));
    }
  
  
    const pickOpening = () => stOpening; /* v144：先上架電話蟲版 */
  
    /* ---------- 賞金鑑定：位數＝顏色等級 ---------- */
    let apprId = null, apprDig = 6;
    function appr(t, spin = true) { apprDig = APPR[t]; const a = $('appr'); a.classList.add('on'); a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); clearInterval(apprId);
      const draw = () => { let s = String(1 + ri(9)); for (let i = 1; i < apprDig; i++) s += ri(10); $('apprN').textContent = '฿ ' + Number(s).toLocaleString('en-US'); };
      draw(); if (spin) apprId = setInterval(() => { draw(); if (Math.random() < .3) SND.tick(); }, 60); }
    const apprStop = () => clearInterval(apprId);
  
    /* ---------- 結果與演出規劃（先決定結果，再挑演出） ---------- */
    const ri = n => Math.floor(Math.random() * n);
    const pick = a => a[ri(a.length)];
    function rollTier() { const r = Math.random(); return r < .003 ? 5 : r < .03 ? 4 : r < .08 ? 3 : r < .23 ? 2 : r < .50 ? 1 : 0; }
    function makeRes(t) { if (t === 5) return { t, ch: 'mihawk', dup: Math.random() < .3 }; if (t === 4) return { t, ch: Math.random() < .67 ? 'ace' : 'law', dup: Math.random() < .5 }; const l = ITEMS[t]; return { t, it: pick(l) }; }
    function envOf(t) { const r = Math.random(); return [[.8, 1], [.7, 1], [.5, 1], [0, .6], [0, .4], [0, 0]][t].reduce((lv, p, i) => lv !== null ? lv : (r < p ? i : null), null) ?? 2; }
    function lineOf(t) { const max = t >= 4 ? 3 : t === 3 ? 2 : t === 2 ? 1 : 0; return Math.random() < .6 ? max : ri(max + 1); }
    function plan(t) {
      const yk = t >= 3 && Math.random() < .35, env = envOf(t), line = lineOf(t);
      if (t <= 2) { const k = t ? ri(t + 1) : 0, s = t - k; return { pre: range(s, t), pch: false, post: [], yk, env, line }; }
      if (t === 3) { if (Math.random() < .1) { const s = ri(2); return { pre: range(s, 2), pch: true, post: [3], yk, env, line }; } const s = 3 - ri(4); return { pre: range(s, 3), pch: false, post: [], yk, env, line }; }
      const s = 1 + ri(3), pre = range(s, 3);
      if (t === 5) return { pre, pch: true, post: [4, 5], yk, env, line };
      return Math.random() < .7 ? { pre, pch: true, post: [4], yk, env, line } : { pre, pch: false, post: [4], yk, env, line };
    }
    const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
    const nameOf = r => r.ch ? CH[r.ch].n : (ITEMS[r.it] ? ITEMS[r.it].name : r.it);
    const rarOf = r => r.ch ? CH[r.ch].r + ' 船員' : RAR[r.t];
    const iconHtml = (r, sil) => r.ch ? `<img src="${CH[r.ch].img}" alt=""${sil ? ' class="sil"' : ''}>` : itemHtml(r.it);
  
    /* ---------- 重置 ---------- */
    function reset() {
      skipping = false; waiters = []; P = []; speedLines = null; cracks = null; heart(0); apprStop();
      $('idle').hidden = true; $('op').hidden = true; $('op').className = 'op'; $('opHint').innerHTML = ''; $('opOrb').className = 'op-orb'; $('opFx').innerHTML = ''; $('res').classList.remove('on', 'sc-on'); $('sc').hidden = true; clearInterval(scTimer); E.focus = null; $('splash').classList.remove('on'); $('g10').hidden = true; $('g10').innerHTML = '';
      const p = $('poster'); p.className = 'poster'; p.style.cssText = ''; p.style.opacity = 0; $('pCv').style.cssText = ''; $('pCv').hidden = false; $('pEdge').style.opacity = 0; $('pPc').innerHTML = ''; $('pName').style.opacity = 0; $('pRar').style.opacity = 0; $('seal').className = 'tape'; $('seal').style.cssText = ''; $('stamps').innerHTML = ''; $('pin1').className = 'pin p1'; $('pin2').className = 'pin p2'; $('roll').className = 'roll'; $('tapHand').classList.remove('on', 'hold'); siren(false); gaugeOff(); $('chance').className = 'chance'; st.classList.remove('holding', 'hkpulse'); $('hk').className = 'hk'; $('hkWp').innerHTML = ''; $('hkTags').innerHTML = ''; $('hkBan').className = 'hk-ban'; $('choose').hidden = true; $('choose').innerHTML = ''; $('cutin').className = 'cutin'; $('holdg').classList.remove('on'); st.style.setProperty('--tp', 0);
      $('den').className = 'den'; $('tap').className = 'tap'; $('yk').className = 'yk'; $('cap').className = 'cap'; $('bub').className = 'bub'; $('appr').className = 'appr'; $('spot').className = 'spot'; $('black').style.cssText = ''; subOff();
      st.classList.remove('dim', 'dark', 'quake'); setEnv(0);
    }
    function idle() { reset(); st.classList.remove('run'); $('idle').hidden = false; note('待機', '選好結果後按單抽或十連'); }
  
    /* ---------- 各階段 ---------- */
    async function stQuiet(env, short) {
      note('① 深夜靜場', '還沒有任何提示');
      st.classList.remove('run'); void st.offsetWidth; st.classList.add('run', 'dim'); heart(1000);
      await W(300);
      await sub('深夜的懸賞處……', short ? 30 : 60);
      await W(short ? 200 : 600);
    }
    async function stCall(t0, short) {
      note('② 黃金電話蟲來電', `起始顏色：${TN[t0]}`);
      subOff(); const d = $('den'); setT(d, t0); d.querySelector('.dg').classList.toggle('rb', t0 === 5); d.className = 'den on'; await W(500);
      const rounds = short ? 2 : 3;
      for (let r = 0; r < rounds; r++) {
        d.classList.add('ring'); cap('噗嚕噗嚕…', 'silver', 34); const gap = 230 - r * 50, iv = setInterval(SND.ring, gap); SND.ring();
        try { await W(520 + r * 120); } finally { clearInterval(iv); }
        d.classList.remove('ring'); heart(820 - r * 160); if (r < rounds - 1) await W(260);
      }
      capOff();
    }
    async function stTalk(line, yk) {
      note('③ 接通・台詞', `台詞等級：${['一般', '有消息', '不得了（金以上）', '大人物（紅以上）'][line]}`);
      SND.pick(); cap('喀嚓！', 'silver', 44); await W(400); capOff();
      const b = $('bub'); b.style.setProperty('--bc', TC[LINE_T[line]]); b.innerHTML = pick(LINES[line]); b.className = 'bub on'; if (line >= 2) shake();
      await W(1200 + line * 150);
      if (yk) { $('yk').className = 'yk on'; SND.stamp(); shake(); await W(900); $('yk').className = 'yk'; }
      b.className = 'bub'; $('den').className = 'den'; await W(250);
    }
    const INK = ['#4a4f58', '#1c5fc4', '#7a2cc4', '#b07800', '#c8101a', '#c01890'];
    function stampMark(t, text, big) { const z = $('stamps'), n = z.children.length, e = document.createElement('div'); e.className = 'stp' + (big ? ' big' : '') + (t === 5 ? ' rb' : ''); e.textContent = text;
      e.style.setProperty('--ink', INK[t]); e.style.setProperty('--r', (Math.random() * 16 - 12) + 'deg'); const SL = [[27, 28], [73, 34], [29, 78], [71, 82], [50, 55]], q = SL[n % SL.length]; e.style.left = q[0] + '%'; e.style.top = q[1] + '%'; z.appendChild(e); }
  
  
    /* ---------- 7：緊張節點 ---------- */
    let sirenId = null;
    function siren(on) { $('siren').classList.toggle('on', on); clearInterval(sirenId); if (on) { let k = 0; sirenId = setInterval(() => tone(k++ % 2 ? 660 : 880, .22, 'square', .035), 250); } }
    /* 鑑定拉霸：數字由左到右一位一位鎖定，最後三位越停越慢 */
    async function stLock(t) {
      note('⑩ 鑑定鎖定', '賞金數字由左往右一位一位停下，最後三位越來越慢');
      apprStop(); const n = APPR[t], fin = String(1 + ri(9)) + Array.from({ length: n - 1 }, () => ri(10)).join(''), a = $('appr'); a.classList.add('on', 'lock'); heart(520);
      const fmt = k => { let out = ''; for (let i = 0; i < n; i++) { const d = i < k ? fin[i] : ri(10); const c = (n - i) % 3 === 0 && i ? ',' : ''; out += c + (i < k ? `<span class="lk">${d}</span>` : d); } return '฿ ' + out; };
      let k = 0; const spin = setInterval(() => { $('apprN').innerHTML = fmt(k); }, 45);
      try { for (k = 1; k <= n; k++) { const left = n - k; await W(left >= 3 ? 170 : left === 2 ? 420 : left === 1 ? 650 : 900); tone(1400 - left * 60, .05, 'square', .06); if (left < 3) { shake(); heart(left === 0 ? 0 : 300); } }
      } finally { clearInterval(spin); }
      $('apprN').innerHTML = fmt(n); a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); SND.up(t); ring(180, 448, t, 140, 6); await W(500);
    }
    /* 假結束：「就這樣了嗎……？」→ 只有後面真的還會再升時才會「還沒完！」 */
    async function stFake(next) {
      note('假結束', '畫面暗下、鑑定停住、心跳停止……後面還會再升才會出現「還沒完！」');
      heart(0); apprStop(); st.classList.add('dark'); cap('就這樣了嗎……？', 'silver', 34); await W(1500); capOff();
      st.classList.remove('dark'); flash(); shake(); SND.boom(); cap('還沒完！', KIND[next], 64, true); focus(next, 900); await W(1000); capOff();
    }
    /* 3‑2‑1 倒數；「1」可能突然全黑（只在金以上） */
    async function stCount(t, pch1) {
      note('⑪ 3‑2‑1 倒數', pch1 ? '數到「1」突然全黑一下＝金以上' : '倒數後撕封條');
      const c = $('cap');
      for (const k of [3, 2, 1]) {
        if (k === 1 && pch1) { const b = $('black'); b.style.transition = 'none'; b.style.background = '#000'; b.style.opacity = 1; heart(0); await W(550); SND.boom(); flash(); b.style.transition = 'opacity .3s'; b.style.opacity = 0; c.className = 'cap cnt'; cap('1', t >= 4 ? 'red' : 'gold', 150, true); c.classList.add('cnt'); focus(t, 900); shake(); await W(1000); }
        else { cap(String(k), 'silver', 150); c.classList.add('cnt'); SND.beat(); tone(k === 1 ? 880 : 660, .12, 'square', .05); shake(); await W(750); }
      }
      capOff(); c.classList.remove('cnt');
    }
  
  
    /* ---------- 11：期待度星級（★5 只給船員）、機會系演出（可能落空） ---------- */
    const STAR_CAP = [3, 3, 4, 4, 5, 5];
    let stars = 0, starCap = 3, starT = 0;
    function gaugeInit(t) { stars = 0; starCap = STAR_CAP[t]; starT = t; const g = $('gauge'); g.classList.add('on'); g.querySelectorAll('i').forEach(e => e.className = ''); }
    function addStar(n = 1) { const g = $('gauge'); for (let k = 0; k < n && stars < starCap; k++) { const e = g.querySelectorAll('i')[stars]; stars++; setTimeout(() => { e.className = 'on' + (stars === 5 && starT === 5 ? ' rb' : ''); tone(700 + stars * 120, .12, 'triangle', .08); }, k * 160); } }
    function gaugeOff() { $('gauge').classList.remove('on'); }
    /* 機會系：CHANCE! 爆發（顏色不會超過最終結果，所有結果都可能出現） */
    async function stChance(t) {
      const kinds = ['blue', 'blue', 'purple', 'gold', 'red', 'rainbow'], k = kinds[Math.max(1, t - (Math.random() < .35 ? 1 : 0))];
      note('CHANCE!', '機會系演出：所有結果都可能出現，字的顏色不會超過最終結果');
      const c = $('chance'); $('chanceT').innerHTML = PS('CHANCE!', k, 72); c.className = 'chance on'; flash(); shake(); SND.boom(); SND.up(t);
      for (let i = 0; i < 60; i++) { const a = Math.random() * 6.283, sp = 200 + Math.random() * 400; P.push({ k: 'dot', x: 180, y: 300, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: Math.min(t, 3), r: 2 + Math.random() * 2, life: .8, age: 0 }); }
      addStar(); await W(1300); c.className = 'chance'; await W(150);
    }
    /* 機會系：假霸王色（開頭和真的霸王色一模一樣，最後沒有炸開） */
    async function stFakeHaki() {
      note('霸氣……？', '機會系演出：開頭和真的霸王色完全相同，這次沒有炸開（所有結果都可能遇到）');
      heart(0); apprStop(); const b = $('black'); b.style.transition = 'none'; b.style.opacity = 1; b.style.background = '#000'; SND.rise(1.4);
      const suck = setInterval(() => { for (let k = 0; k < 4; k++) { const a = Math.random() * 6.283, d = 260 + Math.random() * 120; P.push({ k: 'dot', x: 180 + Math.cos(a) * d, y: 300 + Math.sin(a) * d, vx: -Math.cos(a) * d * 1.6, vy: -Math.sin(a) * d * 1.6, t: 4, r: 1.5 + Math.random() * 2, life: .6, age: 0 }); } }, 50);
      cap('……！', 'silver', 40); try { await W(1300); } finally { clearInterval(suck); } capOff();
      SND.crack(); cracks = makeCracks(); shake(); await W(450);
      await W(700); cracks = null; tone(90, .6, 'sine', .15, 50); cap('……風停了。', 'silver', 34); await W(1200); capOff();
      b.style.transition = 'opacity .5s'; b.style.opacity = 0; addStar(); await W(500); heart(500);
    }
  
    /* ---------- 6：三選一 ---------- */
    async function stChoose() {
      note('④ 三選一', '牆上掛著三捲懸賞令，選一捲（結果早已決定，選哪捲都一樣，是讓玩家參與）');
      const c = $('choose'); c.hidden = false; c.innerHTML = [80, 180, 280].map((x, i) => `<div class="scr" data-i="${i}" style="left:${x}px"></div>`).join('');
      cap('選一捲懸賞令！', 'gold', 34); heart(650);
      const els = [...c.children];
      const i = await new Promise((res, rej) => { let done = false; const go = k => { if (done) return; done = true; clearTimeout(id); res(k); };
        els.forEach((e, k) => e.onclick = () => go(k)); const id = setTimeout(() => go(ri(3)), fast ? 1500 : 4500); waiters.push(() => { if (done) return; done = true; clearTimeout(id); rej(SKIP); }); });
      capOff(); SND.pick(); const e = els[i]; e.classList.add('hov');
      els.forEach((x, k) => { if (k !== i) { x.classList.add('drop'); } }); SND.wind();
      await W(250); e.classList.add('pick'); e.style.left = '180px'; e.style.top = '60px';
      await W(500); c.hidden = true; c.innerHTML = '';
    }
    /* ---------- 6：船員插話（金以上才會出現） ---------- */
    async function stCutin(t) {
      /* 框色＝期待度：藍、紫、金、紅、虹（不會超過最終結果） */
      const ct = Math.max(1, Math.min(t, 5) - (Math.random() < .3 ? 1 : 0)), LINE = { 1: ['……嗯？有動靜。', '外面好像，有點吵。'], 2: ['這股氣息，不太一樣！', '喂，大家注意！'], 3: ['這張懸賞令，是稀世珍寶！', '好強的寶物氣息……！'], 4: ['這股霸氣，是大人物！', '來了，是大傢伙！'], 5: ['這、這是……傳說級的！', '整片海都在震動……！'] };
      note('船員插話', `框色＝期待度：${TN[ct]}（藍、紫可能是小獎；紅、虹只會是船員）`);
      const who = cutinCrew(); if (!who) return; const c = $('cutin'); setT(c, ct); $('cutImg').src = who.img; $('cutT').innerHTML = `<small>${who.n}</small>${PS(pick(LINE[ct]), KIND[ct], 24)}`;
      c.className = 'cutin'; void c.offsetWidth; c.className = 'cutin on'; SND.wind(); tone(220, .4, 'sawtooth', .06, 660); shake(); addStar();
      await W(1500); c.className = 'cutin on off'; await W(320); c.className = 'cutin';
    }
    /* ---------- 6：長按撕封條（partial＝撕到一半停住，用於逆轉） ---------- */
    function stHold(partial) {
      note(partial ? '⑦ 長按撕封條' : '⑦ 長按撕封條', '按住懸賞令，封條慢慢裂開；3 秒沒動作就自動撕');
      apprStop(); const poster = $('poster'), tape = $('seal'); $('tap').innerHTML = PS('長按撕開封條', 'gold', 22); $('tap').className = 'tap on'; $('tapHand').classList.add('on', 'hold'); $('holdg').classList.add('on'); tape.classList.remove('mend'); st.classList.add('holding');
      const limit = partial ? .55 : 1;
      return new Promise((res, rej) => {
        let prog = 0, hold = false, auto = false, done = false, last = performance.now(), crk = 0;
        const dn = e => { hold = true; e.preventDefault && e.preventDefault(); }, up = () => { hold = false; };
        poster.addEventListener('pointerdown', dn); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
        const aid = setTimeout(() => auto = true, fast ? 1000 : 3000);
        const clean = () => { clearTimeout(aid); poster.removeEventListener('pointerdown', dn); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); $('tap').className = 'tap'; $('tapHand').classList.remove('on', 'hold'); $('holdg').classList.remove('on'); tape.classList.remove('shiver'); st.classList.remove('holding'); };
        const step = now => { if (done) return; const dt = Math.min(.05, (now - last) / 1000); last = now;
          if (hold || auto) { prog = Math.min(limit, prog + dt / (fast ? .7 : 1.4)); tape.classList.add('shiver'); if ((crk += dt) > .09) { crk = 0; noise(.05, .12 + prog * .2, 3000 + prog * 2000, 2); } if (prog > .5 && Math.random() < .2) heart(260); } else tape.classList.remove('shiver');
          st.style.setProperty('--tp', prog);
          if (prog >= limit) { done = true; clean(); if (partial) res(); else tearTape().then(() => { st.style.setProperty('--tp', 0); res(); }); return; }
          requestAnimationFrame(step); };
        waiters.push(() => { if (done) return; done = true; clean(); rej(SKIP); });
        requestAnimationFrame(step);
      });
    }
    /* ---------- 6：逆轉（只會發生在金以上） ---------- */
    async function stReversal(t) {
      note('逆轉', '封條撕到一半突然停住 → 全黑 → 「逆轉！」＝必定金以上');
      heart(0); cap('……！？', 'silver', 46); await W(900); capOff();
      const b = $('black'); b.style.transition = 'none'; b.style.background = '#000'; b.style.opacity = 1; await W(650);
      SND.boom(); flash(); b.style.transition = 'opacity .5s'; b.style.opacity = 0; shards(40);
      const tape = $('seal'); tape.classList.add('mend'); st.style.setProperty('--tp', 0);
      cap('逆轉！', 'rainbow', 76, true); focus(5, 1300); shake(); await W(1400); capOff(); heart(450);
    }
  
    async function stDrop(t0, chosen) {
      note('④ 懸賞令釘上牆', `封條邊緣的光＝起始顏色：${TN[t0]}`);
      posterColor(t0); const p = $('poster'), roll = $('roll'); p.className = 'poster rolled'; p.style.opacity = 1;
      if (chosen) { roll.className = 'roll'; roll.style.top = '125px'; roll.style.opacity = 1; await W(60); roll.style.cssText = ''; SND.thud(); shake(); burst(180, 136, -1, 18, 140); }
      else { roll.className = 'roll'; void roll.offsetWidth; roll.className = 'roll fall'; SND.wind();
      await W(380); SND.thud(); shake(); vib(40); burst(180, 136, -1, 18, 140); }
      roll.className = 'roll down'; p.className = 'poster unroll'; noise(.8, .1, 5000, 1.2);
      await W(860); p.className = 'poster'; roll.className = 'roll';
      $('pin1').classList.add('on'); SND.stamp(); burst(108, 144, -1, 8, 80); await W(170);
      $('pin2').classList.add('on'); SND.stamp(); burst(252, 144, -1, 8, 80); shake(); ring(180, 268, t0, 170, 8);
      await W(300); appr(t0); heart(700); await W(700);
    }
    async function stUp(t, lvl, big) {
      note('⑤ 昇格', `→ ${TN[t]}（鑑定 ${APPR[t]} 位數）`);
      heart(420); await W(big ? 900 : 550);
      stampMark(t, big ? '激熱' : '懸賞上調', big); SND.stamp();
      posterColor(t); appr(t); SND.up(lvl); ring(180, 345, t, 120, 7); ring(180, 268, t, 200, 10, .8); burst(180, 345, t, big ? 70 : 36, big ? 380 : 250); shake();
      cap(big ? '激熱！' : '昇格！', big ? 'red' : KIND[t], big ? 68 : 54); if (big) focus(t, 900); wipe(t); await W(120);
      await W(big ? 900 : 560); capOff();
    }
    async function stHaki(final) {
      note('⑥ 霸王色', '集氣 → 裂屏 → 碎裂爆炸 → 紅黑閃爍、懸賞令四散、巨大「霸」字、確定橫幅＝必定金以上');
      heart(0); apprStop(); const b = $('black'), hk = $('hk'), bg = $('hkBg'), wp = $('hkWp'), tags = $('hkTags'), ban = $('hkBan');
      /* 1 集氣：全黑、聲音被抽走、紅色粒子往中心吸 */
      b.style.transition = 'none'; b.style.opacity = 1; b.style.background = '#000'; SND.rise(1.4);
      const suck = setInterval(() => { for (let k = 0; k < 4; k++) { const a = Math.random() * 6.283, d = 260 + Math.random() * 120; P.push({ k: 'dot', x: 180 + Math.cos(a) * d, y: 300 + Math.sin(a) * d, vx: -Math.cos(a) * d * 1.6, vy: -Math.sin(a) * d * 1.6, t: 4, r: 1.5 + Math.random() * 2, life: .6, age: 0 }); } }, 50);
      cap('……！', 'silver', 40); try { await W(1300); } finally { clearInterval(suck); } capOff();
      /* 2 裂屏 */
      SND.crack(); cracks = makeCracks(); shake(); await W(450); SND.crack(); await W(250);
      /* 3 碎裂爆炸 */
      cracks = null; vib([80, 40, 160, 40, 240]); hk.className = 'hk on'; bg.className = 'hk-bg strobe'; b.style.opacity = 0; flash(); SND.boom(); setTimeout(SND.boom, 120); noise(1.2, .35, 1500, .4);
      shards(80, ['#ff2a10', '#ff6a3a', '#ffffff', '#3a0004', '#8a0008']); st.classList.remove('hkpulse'); void st.offsetWidth; st.classList.add('hkpulse', 'quake');
      for (let k = 0; k < 5; k++) setTimeout(() => ring(180, 300, 4, 420, 16, .9), k * 110);
      for (let k = 0; k < 120; k++) { const a = Math.random() * 6.283, sp = 200 + Math.random() * 600; P.push({ k: 'dot', x: 180, y: 300, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: Math.random() < .3 ? 3 : 4, r: 1.5 + Math.random() * 3, life: .6 + Math.random() * .7, age: 0 }); }
      /* 懸賞令四散 */
      wp.innerHTML = Array.from({ length: 16 }, (_, k) => { const a = k / 16 * 6.283 + Math.random() * .3, d = 380 + Math.random() * 160; return `<img class="hk-wp" src="${A.wanted}" alt="" data-x="${Math.cos(a) * d}" data-y="${Math.sin(a) * d}" data-r="${(Math.random() - .5) * 720}">`; }).join('');
      wp.querySelectorAll('img').forEach((e, k) => e.animate([{ opacity: 1, transform: 'translate(0,0) scale(.2) rotate(0)' }, { opacity: 1, transform: `translate(${e.dataset.x * .5}px,${e.dataset.y * .5}px) scale(1.2) rotate(${e.dataset.r / 2}deg)`, offset: .4 }, { opacity: 0, transform: `translate(${e.dataset.x}px,${e.dataset.y}px) scale(1.8) rotate(${e.dataset.r}deg)` }], { duration: 1100 + Math.random() * 300, delay: k * 18, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' }));
      await W(500);
      /* 4 主畫面：燃燒背景＋旋轉紅光＋巨大「霸」字＋霸王色＋四周字卡 */
      bg.className = 'hk-bg burn'; hk.classList.add('boom'); focus(4, 2600);
      cap('霸王色', 'haki', 84, true, 'CONQUEROR\'S HAKI');
      const TG = [['激熱', 'red', 14, 160, -12], ['霸氣', 'gold', 262, 178, 10], ['確變', 'red', 14, 440, 8], ['爆', 'gold', 292, 430, -10]];
      tags.innerHTML = TG.map(([t, k, x, y, r], n) => `<span class="hk-tag" style="left:${x}px;top:${y}px;--r:${r}deg;animation-delay:${.35 + n * .18}s">${PS(t, k, 30)}</span>`).join('');
      TG.forEach((_, n) => setTimeout(() => { SND.stamp(); shake(); }, (350 + n * 180) * (fast ? .5 : 1)));
      const iv = setInterval(() => { const x = Math.random() * 360; bolt(x, -10, 180 + (Math.random() - .5) * 200, 200 + Math.random() * 300, Math.random() < .6 ? '#ff2a2a' : '#ffffff'); if (Math.random() < .5) bolt(Math.random() < .5 ? -10 : 370, Math.random() * 640, 180, 300, '#ff5a3a'); SND.bolt(); }, 110);
      try {
        await W(1300);
        /* 5 確定橫幅 */
        ban.innerHTML = PS('★ 金以上確定 ★', 'gold', 28); ban.className = 'hk-ban on'; SND.up(5); flash(); shake();
        await W(1500);
      } finally { clearInterval(iv); st.classList.remove('quake', 'hkpulse'); }
      capOff(); ban.className = 'hk-ban'; hk.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350 }); await W(350);
      hk.className = 'hk'; wp.innerHTML = ''; tags.innerHTML = ''; b.style.transition = ''; b.style.opacity = 0; await W(150); heart(380);
      for (let i = 0; i < final.length; i++) {
        const t = final[i];
        if (t === 5) { heart(0); cap('……還沒結束', 'silver', 40); await W(900); capOff(); b.style.transition = 'none'; b.style.opacity = 1; b.style.background = '#000'; SND.rise(1.1); await W(1100); SND.crack(); shards(60); flash(); b.style.transition = 'opacity .4s'; b.style.opacity = 0; }
        flash(); posterColor(t); appr(t); stampMark(t, t === 5 ? '覺醒' : t === 4 ? '大人物' : '懸賞上調', t >= 4); SND.stamp(); SND.up(3 + i * 2); ring(180, 268, t, 280, 14, .9); burst(180, 268, t, 90, 440); shake();
        if (t === 5) { for (let k = 0; k < 3; k++) setTimeout(() => ring(180, 268, 5, 320, 10, 1), k * 180); }
        cap(t === 5 ? '覺醒・虹！' : t === 4 ? '大人物！' : '昇格！', KIND[t], t === 5 ? 60 : 58); focus(t, 1200); wipe(t); await W(t === 5 ? 1500 : 1000); capOff();
        if (i < final.length - 1) await W(250);
      }
    }
    function stTap() {
      note('⑦ 撕開封條', '點懸賞令撕開海軍機密封條，3 秒沒點就自動撕開');
      apprStop(); const s = $('poster'); $('tapHand').classList.add('on'); $('tap').className = 'tap on';
      return new Promise((res, rej) => { let done = false; const go = () => { if (done) return; done = true; clearTimeout(id); s.onclick = null; $('tapHand').classList.remove('on'); $('tap').className = 'tap'; tearTape().then(res); }; const id = setTimeout(go, fast ? 1200 : 3000); s.onclick = go; waiters.push(() => { if (done) return; done = true; clearTimeout(id); s.onclick = null; rej(SKIP); }); });
    }
    async function tearTape() { const t = $('seal'); t.classList.add('torn'); noise(.35, .3, 4200, 1.4); setTimeout(() => noise(.25, .2, 3000, 1.2), 120); shake();
      for (let i = 0; i < 18; i++) { const a = Math.random() * 6.283, sp = 120 + Math.random() * 200; P.push({ k: 'dot', x: 180 + (Math.random() - .5) * 120, y: 240 + (Math.random() - .5) * 30, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, t: 0, r: 2 + Math.random() * 2, life: .7, age: 0 }); }
      await W(500); }
    async function burnIn(root, r, ms, sil) {
      const pc = root.querySelector('.pc'), c = root.querySelector('.cv'), e = root.querySelector('.edge'), box = root.querySelector('.photo').getBoundingClientRect(), sb = st.getBoundingClientRect(), sc = sb.width / 360;
      const x0 = (box.left - sb.left) / sc, y0 = (box.top - sb.top) / sc, w = box.width / sc, h = box.height / sc;
      pc.innerHTML = iconHtml(r, sil); setT(pc, r.t); e.style.opacity = 1; SND.burn();
      const t0 = performance.now();
      await new Promise(res => { const step = now => { const k = Math.min(1, (now - t0) / (ms * (fast ? .6 : 1))), b = k * 112 - 6; c.style.webkitMaskImage = c.style.maskImage = `linear-gradient(to top,transparent ${b}%,#000 ${b + 7}%)`; e.style.top = (100 - b) + '%'; if (Math.random() < .85) for (let i = 0; i < 2; i++) ember(x0 + Math.random() * w, y0 + h * (1 - b / 100)); if (k < 1 && !skipping) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
      c.hidden = true; e.style.opacity = 0;
    }
    async function stReveal(r) {
      note('⑦ 開封', r.ch ? '船員先出現剪影，停頓後才顯出真面目' : `${TN[r.t]}：${nameOf(r)}`);
      heart(r.t >= 4 ? 320 : 600);
      await burnIn($('poster'), r, 1600, !!r.ch);
      if (r.ch) { await sub('這個身影是……！？', 70); await W(700); const img = $('pPc').querySelector('img'); if (img) img.classList.remove('sil'); subOff(); }
      heart(0); flash(); vib(r.t >= 3 ? [60, 30, 120] : 30); SND.reveal(r.t); ring(180, 268, r.t, 230, 10); burst(180, 268, r.t, r.t >= 3 ? 80 : 34, 320);
      $('seal').style.opacity = 0; $('appr').classList.remove('on'); $('pName').textContent = nameOf(r); $('pRar').textContent = rarOf(r); $('pName').style.opacity = 1; $('pRar').style.opacity = 1;
      await W(r.t >= 4 ? 700 : 1300);
    }
    async function stSplash(r) {
      note('⑧ 新船員登場', `${CH[r.ch].r}：${CH[r.ch].n}（立繪等比例放大）`);
      const sp = $('splash'), c = CH[r.ch]; setT(sp, r.t); $('spArt').src = c.img; $('spT').textContent = c.t; $('spR').innerHTML = PS(c.r, KIND[r.t], 40); $('spS').innerHTML = PS('新船員加入！', 'red', 34); $('spRays').classList.toggle('rb', r.t === 5); $('spB').textContent = '0';
      $('spN').innerHTML = [...c.n.replace(/·/g, '・')].map(ch => ch === '・' ? '<span style="display:block;line-height:.7">・</span>' : ch).join('<br>');
      flash(); if (r.t === 5) { for (let i = 0; i < 5; i++) bolt(10 + i * 85, -10, 100 + i * 45, 640, '#ffffff'); SND.bolt(); shards(30); }
      speedLines = { t: r.t, l: Array.from({ length: 50 }, () => ({ a: Math.random() * 6.283, d: 20 + Math.random() * 500, v: 600 + Math.random() * 700, len: 40 + Math.random() * 120, w: 1 + Math.random() * 3 })) };
      sp.classList.remove('on'); void sp.offsetWidth; sp.classList.add('on'); SND.reveal(5); shake();
      setTimeout(() => { if (sp.classList.contains('on')) { SND.stamp(); shake(); } }, fast ? 1100 : 2200);
      const t0 = performance.now() + (fast ? 800 : 1600), dur = 1100; const roll = now => { const k = Math.max(0, Math.min(1, (now - t0) / dur)); $('spB').textContent = Math.round(c.b * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US'); if (k > 0 && k < 1 && Math.random() < .5) SND.tick(); if (k < 1 && sp.classList.contains('on')) requestAnimationFrame(roll); }; requestAnimationFrame(roll);
      try {
        await W(r.t === 5 ? 3200 : 2600);
        await new Promise((res, rej) => { const id = setTimeout(res, r.t === 5 ? 3300 : 1900); sp.onclick = () => { clearTimeout(id); res(); }; waiters.push(() => { clearTimeout(id); rej(SKIP); }); });
      } finally { sp.onclick = null; }
      sp.classList.remove('on'); speedLines = null;
    }
    let scTimer = null;
    const cardHtml = (r, i, best) => `<div class="rc${best ? ' best' : ''}" data-i="${i}" style="--tc:${TC[r.t]};--fm:${FM[r.t]};--d:${i * 90}ms;--sd:${(1 + i * .18).toFixed(2)}s"><div class="in"><div class="bk">?</div><div class="fr"><div class="face">${iconHtml(r)}${r.t >= 3 ? '<div class="foil"></div>' : ''}<div class="shn"></div><div class="plate">${nameOf(r)}</div></div></div></div><span class="bdg">${r.ch ? CH[r.ch].r : RAR[r.t]}</span>${r.ch ? `<span class="nw${r.dup ? ' dup' : ''}">${r.dup ? '重複' : 'NEW'}</span>` : ''}</div>`;
    function showcase(r, mode) {
      const sc = $('sc'); sc.style.setProperty('--tc', TC[r.t]); sc.style.setProperty('--fm', FM[r.t]);
      const desc = r.ch ? `${CH[r.ch].t}・戰力 ${CH[r.ch].b.toLocaleString('en-US')}${r.dup ? '<br>已擁有：重複卡可到海軍本部換貝里' : '<br>新船員已加入船隊'}` : ((ITEMS[r.it] && ITEMS[r.it].desc) || '');
      sc.innerHTML = `<div class="srays${r.t === 5 ? ' rb' : ''}"></div><div class="floor"></div><div class="card"><div class="face">${iconHtml(r)}${r.t >= 3 ? '<div class="foil"></div>' : ''}<div class="shn" style="--sd:.9s"></div></div><i class="crn a"></i><i class="crn b"></i><i class="crn c"></i><i class="crn d"></i></div><div class="rar">${PS(r.ch ? CH[r.ch].r : RAR[r.t], KIND[r.t], 44)}</div><div class="nm">${nameOf(r)}</div><p class="ds">${desc}</p><div class="scb${mode === 'detail' ? ' one' : ''}">${mode === 'detail' ? '<button data-b>返回結果</button>' : '<button class="go" data-a>再抽一次</button><button data-c>關閉</button>'}</div>`;
      sc.hidden = false; $('res').classList.add('sc-on'); flash(); SND.reveal(r.t); ring(180, 196, r.t, 220, 10, .9); burst(180, 196, r.t, r.t >= 3 ? 80 : 40, 320);
      setTimeout(() => { if (!sc.hidden) { SND.stamp(); burst(180, 330, r.t, 30, 200); } }, 750);
      clearInterval(scTimer); scTimer = setInterval(() => { if (sc.hidden) return clearInterval(scTimer); const a = Math.random() * 6.283, d = 110 + Math.random() * 40; P.push({ k: 'dot', x: 180 + Math.cos(a) * d * .8, y: 196 + Math.sin(a) * d, vx: 0, vy: -20, t: r.t, r: 1 + Math.random() * 2, life: .8, age: 0, o: Math.random() * 360 }); }, 70);
      const b = sc.querySelector('[data-b]'); if (b) b.onclick = () => { sc.hidden = true; $('res').classList.remove('sc-on'); };
      const a = sc.querySelector('[data-a]'); if (a) a.onclick = () => $('rAgain').click();
      const c = sc.querySelector('[data-c]'); if (c) c.onclick = () => $('rClose').click();
    }
    function showRes(list, title) {
      busy = false; setTimeout(() => { try { API.onShown && API.onShown(); } catch (e) { } }, 0); $('skip').hidden = true; speedLines = null; heart(0); apprStop(); $('splash').classList.remove('on'); st.classList.remove('dim', 'dark', 'edge-on'); setEnv(0);
      $('resT').innerHTML = PS(title, 'gold', 34); const g = $('rg'), single = list.length === 1;
      $('res').classList.add('on');
      if (single) { ['rg', 'rsum', 'rtap', 'rbtns', 'resT', 'rbest', 'pityRow', 'colct'].forEach(id => $(id).hidden = true); showcase(list[0], 'single'); note('獎品展示', `${TN[list[0].t]}：${nameOf(list[0])}`); return; }
      ['rg', 'rsum', 'rtap', 'rbtns', 'resT', 'rbest', 'pityRow', 'colct'].forEach(id => $(id).hidden = false); $('sc').hidden = true;
      const cnt = [0, 0, 0, 0, 0, 0]; list.forEach(r => cnt[r.t]++);
      $('rsum').innerHTML = cnt.map((n, t) => n ? `<span style="--tc:${TC[t]}">${TN[t]} ×${n}</span>` : '').join('');
      const top = Math.max(...list.map(x => x.t)); g.className = 'rg';
      g.innerHTML = list.map((r, i) => cardHtml(r, i, r.t === top && top >= 3)).join('');
      { const gr = g.getBoundingClientRect(), cxg = gr.left + gr.width / 2, cyg = gr.top + gr.height / 2, sb = st.getBoundingClientRect(), sc = sb.width / 360;
        g.querySelectorAll('.rc').forEach(e => { const r = e.getBoundingClientRect(); e.style.setProperty('--fx', ((cxg - r.left - r.width / 2) / sc) + 'px'); e.style.setProperty('--fy', ((cyg - r.top - r.height / 2) / sc) + 'px'); });
        const orb = document.createElement('div'); orb.className = 'rsrc'; orb.style.left = ((cxg - sb.left) / sc) + 'px'; orb.style.top = ((cyg - sb.top) / sc) + 'px'; $('res').appendChild(orb); setTimeout(() => orb.classList.add('out'), list.length * 90 + 300); setTimeout(() => orb.remove(), list.length * 90 + 900); }
      g.querySelectorAll('.rc').forEach(e => e.onclick = () => showcase(list[+e.dataset.i], 'detail'));
      const bi = list.findIndex(x => x.t === top), br = list[bi], rb = $('rbest'); rb.style.setProperty('--tc', TC[top]); rb.style.setProperty('--fm', FM[top]);
      rb.innerHTML = `<div class="bi"><div>${iconHtml(br)}</div></div><div class="bt"><small>本次最佳</small>${PS(br.ch ? CH[br.ch].r : RAR[br.t], KIND[top], 26)}<b>${nameOf(br)}</b></div>`; rb.onclick = () => showcase(br, 'detail');
      list.forEach((r, i) => setTimeout(() => { if (!$('res').classList.contains('on')) return; tone(500 + i * 40, .08, 'triangle', .06); SND.flip(); if (r.t >= 3) { const e = g.children[i], b = e.getBoundingClientRect(), sb = st.getBoundingClientRect(), sc = sb.width / 360; burst((b.left - sb.left) / sc + b.width / sc / 2, (b.top - sb.top) / sc + b.height / sc / 2, r.t, 24, 160); SND.up(r.t); } }, i * 90 + 700));
      { const pn = Math.min(PITY(), SAVE.data.pity || 0); $('pityBar').style.width = '0%'; requestAnimationFrame(() => { $('pityBar').style.width = (pn / PITY() * 100) + '%'; }); $('pityTxt').textContent = `再 ${Math.max(1, PITY() - pn)} 抽必出 SR 以上`; const own = Object.keys(SAVE.data.roster || {}).length, all = (typeof CHARACTER_ORDER !== 'undefined' ? CHARACTER_ORDER : Object.keys(CHARACTERS)).length; $('colct').innerHTML = `船員圖鑑 <b>${own}</b>／${all}`; }
      note('結算', `最高：${TN[top]}；點卡片看獎品詳細`);
    }
  
    /* ---------- 單抽 ---------- */
    async function single(r) {
      if (busy) return; busy = true; ac(); reset(); $('skip').hidden = false; lastMode = 1;
      const p = plan(r.t);
      try {
        await stQuiet(p.env, fast);
        const rev = r.t >= 3 && Math.random() < (r.t === 5 ? .35 : .25), cut = r.t >= 4 ? Math.random() < .6 : r.t === 3 && Math.random() < .2;
        await pickOpening()(rev ? 0 : p.pre[0], rev ? Math.min(p.line, 1) : p.line, rev ? false : p.yk, fast, rev ? 0 : p.env, r.t >= 4); subOff();
        await stChoose();
        const ups = rev ? range(1, p.pch && r.t === 3 ? 2 : Math.min(r.t, 3)) : p.pre.slice(1);
        gaugeInit(r.t); addStar();
        await stDrop(rev ? 0 : p.pre[0], true);
        if (rev) { heart(600); await W(500); await stHold(true); await stReversal(r.t); }
        if (cut || Math.random() < [.25, .3, .4, .45, 0, 0][r.t]) await stCutin(r.t);
        for (let i = 0; i < ups.length; i++) { await stUp(ups[i], i + 1); if (i === 0) addStar(); }
        if (!p.pch && Math.random() < [.25, .3, .35, .4, .4, 0][r.t]) await stFakeHaki();
        if ((p.pch || p.post.length) && Math.random() < .7) await stFake(p.post.length ? p.post[0] : r.t);
        if (p.pch) { await stHaki(p.post); addStar(2); } else for (const t of p.post) { await stUp(t, 4, true); addStar(); }
        const sir = r.t >= 4 && Math.random() < .6, pch1 = r.t >= 4 ? Math.random() < .7 : r.t === 3 && Math.random() < .4;
        heart(500); await W(400);
        await stLock(r.t);
        if (Math.random() < [.45, .5, .55, .6, .7, .8][r.t]) await stChance(r.t);
        if (sir) { note('紅色警報', '警報燈只在紅以上出現'); siren(true); addStar(); await W(900); }
        if (r.t >= 4) addStar(5);
        await stCount(r.t, pch1);
        await stHold(false); siren(false); gaugeOff(); await stReveal(r);
        if (r.ch) await stSplash(r);
        showRes([r], r.ch ? '新船員加入！' : '獲得道具');
      } catch (e) { if (e !== SKIP) throw e; reset(); showRes([r], r.ch ? '新船員加入！' : '獲得道具'); }
    }
  
    /* ---------- 十連 ---------- */
    async function ten(res) {
      if (busy) return; busy = true; ac(); reset(); $('skip').hidden = false; lastMode = 10;
      const list = res.map(r => r.t), top = Math.max(...list), p = plan(top);
      const starts = res.map(r => r.t >= 4 ? 3 : Math.max(0, r.t - (Math.random() < .4 ? 1 : 0)));
      const g = $('g10');
      try {
        await stQuiet(p.env, true);
        await pickOpening()(Math.min(top, Math.max(...starts)), p.line, p.yk, true, p.env, top >= 4); subOff();
        if (top === 5 || (top === 4 && Math.random() < .7)) await stHaki([]);
        note('十連', '每張懸賞令的光暈＝它的起始顏色；最亮的會閃動');
        g.hidden = false;
        g.innerHTML = res.map((r, i) => `<div class="mp" data-i="${i}" style="--tc:${TC[starts[i]]};left:${9 + (i % 5) * 70}px;top:${178 + Math.floor(i / 5) * 160}px;opacity:0;transform:translate(-300px,-500px) rotate(${(Math.random() - .5) * 120}deg)"><div class="gl"></div><img class="wf" src="${A.wanted}" alt=""><div class="photo"><div class="pc"></div><div class="cv">?</div><div class="edge"></div></div><div class="pname"></div></div>`).join('') + '<div class="hint10">' + PS('點擊懸賞令翻開', 'gold', 26) + '<small>最好的留到最後</small></div><button class="allbtn" id="allBtn">全部翻開</button>';
        const els = [...g.querySelectorAll('.mp')], topS = Math.max(...starts);
        SND.wind();
        for (let i = 0; i < 10; i++) { const e = els[i]; setTimeout(() => { e.style.opacity = 1; e.style.transform = 'none'; SND.flip(); if (starts[i] === topS && topS >= 2) e.classList.add('hi'); }, i * (fast ? 60 : 140)); }
        const opened = new Set(); let chain = Promise.resolve();
        const flip = (i, isLast) => { if (opened.has(i)) return chain; opened.add(i); chain = chain.then(() => flipOne(els[i], res[i], starts[i], isLast, els)); return chain; };
        els.forEach((e, i) => e.onclick = () => flip(i, opened.size === 9).catch(() => { }));
        const allDone = new Promise((resolve, rej) => { const chk = setInterval(() => { if (skipping) { clearInterval(chk); rej(SKIP); } else if (opened.size === 10) { clearInterval(chk); chain.then(resolve, rej); } }, 100); });
        $('allBtn').onclick = () => { $('allBtn').hidden = true; const order = [...Array(10).keys()].filter(i => !opened.has(i)).sort((a, b) => res[a].t - res[b].t || starts[a] - starts[b]); order.forEach((i, k) => flip(i, k === order.length - 1).catch(() => { })); };
        heart(800);
        await allDone; await W(600);
        showRes(res, '十連結果');
      } catch (e) { if (e !== SKIP) throw e; reset(); showRes(res, '十連結果'); }
    }
    async function flipOne(el, r, s, isLast, els) {
      el.classList.remove('hi'); el.classList.add('done');
      const pos = () => { const b = el.getBoundingClientRect(), sb = st.getBoundingClientRect(), sc = sb.width / 360; return [(b.left - sb.left) / sc + b.width / sc / 2, (b.top - sb.top) / sc + b.height / sc * .45]; };
      if (isLast && r.t >= 2) {
        note('十連・最後一張', '其他變暗、聚光燈、放大、心跳加速');
        $('allBtn') && ($('allBtn').hidden = true); { const h = R.querySelector('.hint10'); if (h) h.hidden = true; } els.forEach(e => e !== el && e.classList.add('fade')); el.classList.add('last'); const ix = +el.dataset.i, cxp = 9 + (ix % 5) * 70 + 31, cyp = 178 + Math.floor(ix / 5) * 160 + 45; el.style.transform = `translate(${180 - cxp}px,${300 - cyp}px) scale(2.3)`;
        const [x, y] = [180, 300]; await W(700); const sp = $('spot'); sp.style.setProperty('--sx', x + 'px'); sp.style.setProperty('--sy', y + 'px'); sp.style.background = `radial-gradient(circle at ${x}px ${y}px,transparent 130px,rgba(0,0,0,.85) 220px)`; sp.className = 'spot on';
        cap('最後一張……', 'silver', 40); await W(900); heart(360); await W(900); capOff(); await stCount(r.t, r.t >= 4 ? Math.random() < .7 : r.t === 3 && Math.random() < .4);
        for (let t = s + 1; t <= r.t; t++) { el.style.setProperty('--tc', TC[t]); if (t === 5) el.querySelector('.gl').classList.add('rb'); SND.up(t); const [px, py] = pos(); ring(px, py, t, 130, 8); burst(px, py, t, 40, 260); shake(); cap('昇格！', KIND[t], 50); focus(t, 600); await W(900); capOff(); }
        capOff();
      } else if (s < r.t) { el.style.setProperty('--tc', TC[r.t]); SND.up(r.t); const [px, py] = pos(); ring(px, py, r.t, 60, 5); await W(300); }
      if (r.t === 5) el.querySelector('.gl').classList.add('rb');
      await burnIn(el, r, isLast ? 1300 : 480, isLast && !!r.ch);
      if (isLast && r.ch) { await W(800); const img = el.querySelector('.pc img'); if (img) img.classList.remove('sil'); }
      const [x, y] = pos(); ring(x, y, r.t, isLast ? 160 : 70, 5); burst(x, y, r.t, r.t >= 3 ? 30 : 10, 180); SND.reveal(r.t); if (isLast) flash();
      el.querySelector('.pname').textContent = nameOf(r); el.querySelector('.pname').style.opacity = 1;
      if (r.ch) { vib([60, 30, 120]); await W(400); await stSplash(r); note('十連', '繼續翻牌'); } else await W(isLast ? 700 : 140);
      if (isLast) { heart(0); { const h = R.querySelector('.hint10'); if (h) h.hidden = false; } $('spot').className = 'spot'; els.forEach(e => e.classList.remove('fade')); el.style.transform = 'none'; setTimeout(() => el.classList.remove('last'), 700); }
    }
  
    /* ---------- v144：接上遊戲資料 ---------- */
    function itemHtml(id) { if (A.icons[id]) return A.icons[id].h; const it = ITEMS[id]; if (!it) return ''; if (it.skin && typeof SKINS !== 'undefined' && SKINS[it.skin] && SKINS[it.skin].image) return `<img src="${abs(SKINS[it.skin].image)}" alt="">`; /* 皮膚：顯示皮膚立繪 */ if (it.img) return `<img class="it" src="${abs(it.img)}" alt="">`; try { return typeof itemIcon === 'function' ? itemIcon(it) : ''; } catch (e) { return ''; } }
    function power(id) { const c = CHARACTERS[id]; let k = 1; try { k = typeof rarityScale === 'function' ? rarityScale(id) : 1; } catch (e) { } return Math.round(((c.maxHp || 1000) * 10 + (c.baseSpeed || 100) * 60) * k / 10) * 10; }
    /* 遊戲結果 → 演出等級：道具 N 白、R 藍、SR 紫、SSR 金；船員一律紅（大人物），UR 以上虹 */
    function mapRes(x) {
      if (x.char) { const id = x.char, c = CHARACTERS[id], rr = (typeof CHAR_RARITY !== 'undefined' && CHAR_RARITY[id]) || 'SSR';
        CH[id] = { n: c.name, r: rr, t: c.title || '', b: power(id), img: abs(c.image) }; return { t: /^UR/.test(rr) ? 5 : 4, ch: id, dup: !!x.dup }; }
      const it = ITEMS[x.item] || {}; return { t: { N: 0, R: 1, SR: 2, SSR: 3 }[it.rarity] ?? 0, it: x.item };
    }
    /* 船員插話：從玩家自己的陣容挑一位（不是這次抽到的人） */
    function cutinCrew() { const d = SAVE.data, ids = [...(d.lineup || []), ...Object.keys(d.roster || {})].filter((id, i, a) => CHARACTERS[id] && a.indexOf(id) === i && !CH[id]);
      if (!ids.length) return null; const id = ids[Math.random() < .6 ? 0 : ri(Math.min(3, ids.length))]; const img = typeof charArt === 'function' ? charArt(id) : CHARACTERS[id].image; return { n: CHARACTERS[id].name, img: abs(img) }; }
    let lastMode = 1;
    $('rAgain').onclick = () => { try { API.onAgain && API.onAgain(lastMode); } catch (e) { console.warn(e); } };
    $('rClose').onclick = () => { try { API.onClose && API.onClose(); } catch (e) { console.warn(e); } };
    return {
      play(res) { Object.keys(CH).forEach(k => delete CH[k]); const list = res.map(mapRes); if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } fit();
        return (list.length === 1 ? single(list[0]) : ten(list)).catch(e => { console.warn('gacha fx', e); reset(); showRes(list, list.length === 1 ? (list[0].ch ? '新船員加入！' : '獲得道具') : '十連結果'); }); },
      stop() { doSkip(); reset(); busy = false; },
      get busy() { return busy; }
    };
  
  }
  function open() { mount(); if (!host.isConnected) document.body.appendChild(host); OPEN = true; document.body.classList.add('gfx-open'); if (!ENG) ENG = boot(); }
  function close() { OPEN = false; if (ENG) ENG.stop(); if (host && host.isConnected) host.remove(); document.body.classList.remove('gfx-open'); flushToasts(); }
  /* 演出中的提示訊息先排隊，關閉後再依序顯示（避免「獲得皮膚」之類的提示提早劇透） */
  let _toast = null; const TQ = [];
  function flushToasts() { const q = TQ.splice(0); q.forEach(([a, b], i) => setTimeout(() => { try { _toast(...a); } catch (e) { } }, 300 + i * 1700)); }
  window.GACHA_FX = { open, close, get open_() { return OPEN; }, play: async (res) => { open(); await ENG.play(res); } };
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof pull !== 'function' || typeof showResults !== 'function' || typeof playMachine !== 'function') return;
    let pendingN = 0, lastTitle = '';
    if (typeof toast === 'function') { _toast = toast; toast = function () { if (OPEN) { TQ.push([[...arguments]]); return; } return _toast.apply(this, arguments); }; }
    const _pull = pull;
    pull = async function (n) { pendingN = n === 1 || n === 10 ? n : 0; try { return await _pull.apply(this, arguments); } finally { pendingN = 0; } };
    const _pm = playMachine; playMachine = async function () { if (pendingN) return; return _pm.apply(this, arguments); };
    const _sr = showResults;
    showResults = function (res, title) {
      if (!pendingN || !res || !res.length) return _sr.apply(this, arguments);
      lastTitle = title; open(); ENG.play(res); };
    /* 打開懸賞處時先預載演出素材，第一次抽也不會等圖片 */
    let pre = false; if (typeof openGacha === 'function') { const _og = openGacha; openGacha = function () { const r = _og.apply(this, arguments); if (!pre) { pre = true; ['bg', 'wanted', 'den4', 'den4c', 'hand'].forEach(k => { const i = new Image(); i.src = A[k]; }); fetch(abs('css/gacha_v144.css?v=' + V)).catch(() => { }); } return r; }; }
    API.onShown = () => { try { gachaBusy = false; updateGachaBtns(); coins(); } catch (e) { } };
    API.onClose = () => { close(); try { gachaBusy = false; updateGachaBtns(); coins(); } catch (e) { } };
    API.onAgain = n => { close(); try { gachaBusy = false; } catch (e) { }
      pull(n); setTimeout(() => { if (!OPEN && !(typeof gachaBusy !== 'undefined' && gachaBusy)) { try { _toast('寶藏幣不足，無法再抽一次', 'warn'); } catch (e) { } } }, 60); };
  });
})();
