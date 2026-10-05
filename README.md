# 海賊新時代 AGE OF THE NEW OVERLORDS

從東海的風車村揚帆，一路航向艾爾巴夫的航海冒險 RPG。純前端靜態網站，部署在 GitHub Pages，手機、平板、電腦都能玩，也可以「加到主畫面」當成 App 使用。

- 遊戲網址：https://danny20010421.github.io/op-voyage/
- 目前版本：v99（版本號顯示在遊戲「設定」頁最下方）
- 更新紀錄：[CHANGELOG.md](CHANGELOG.md)（每 20 個版本統整一次）
- 待完成事項：[docs/TODO.md](docs/TODO.md)
- 遊戲介紹（商店文案）：[docs/STORE_LISTING.md](docs/STORE_LISTING.md)
- App 化規劃：[docs/APP_PLAN.md](docs/APP_PLAN.md)｜Android 安裝檔教學：[docs/ANDROID_APK.md](docs/ANDROID_APK.md)

## 遊戲內容一覽
- **主線 13 篇章**：東海 → 阿拉巴斯坦 → 空島 → 司法島 → 恐怖三桅帆船 → 頂上戰爭 → 魚人島 → 德雷斯羅薩 → 蛋糕島 → 和之國 → 蜂巢島 → 蛋頭島 → 巨人篇。Three.js 立體島嶼，可以跳躍、爬樓梯、走橋、走進建築；劇情約 1,500 句，對話時立繪登上舞台演出。
- **戰鬥**：三人陣容回合制，屬性克制、技能次數、奧義、異常狀態、羈絆加成。
- **玩法**：勇者之塔（250 層）、皇帝領海（挑戰四皇）、奪寶大冒險（划船跑酷）、登上虛空王座、船團 BOSS、好友對戰與即時對戰、每日懸賞、七日之約、活動中心。
- **收集**：60 多位船員（稀有度 UR+ ＞ UR ＞ SSR ＞ SR ＞ RRR ＞ RR ＞ R ＞ U ＞ C）、211 格圖鑑、皮膚圖鑑、碎片兌換。
- **帳號**：信箱登入、雲端存檔（Firebase），也可以匯出／匯入存檔檔案。

## 資料夾結構
```
├── index.html              遊戲本體（唯一的入口頁）
├── 404.html                找不到頁面時導回首頁
├── manifest.webmanifest    PWA 設定（App 名稱、圖示）
├── sw.js                   離線快取（Service Worker）
├── firestore.rules         Firebase 安全規則（新增集合時要更新並重新發布）
├── js/                     遊戲程式（載入順序見 docs/CODEMAP.md）
├── css/                    樣式
├── assets/                 圖片、音樂、影片
│   ├── chars/              角色立繪（<id>.webp）與頭像（<id>_face.webp）
│   ├── chapters/           篇章背景
│   ├── ui/                 介面圖、Logo、App 圖示
│   ├── login/              登入頁背景影片
│   ├── music/              背景音樂
│   ├── runner/             奪寶大冒險素材
│   └── models/             3D 模型清單
├── vendor/three/           Three.js r186（只放用到的檔案）
├── tests/                  自動測試（資料檢查、瀏覽器測試）
├── docs/                   開發文件：程式地圖、待辦、商店文案、App 規劃、歷史紀錄
├── design/                 GameDesignOS 工作區：已拍板的設計決策與待確認事項
├── dev/                    開發用頁面（3D 場景樣板、模型測試），不影響正式遊戲
├── .github/workflows/      自動部署（pages.yml）與自動測試（test.yml）
├── AGENTS.md               給開發助手的工作規則
└── CHANGELOG.md            更新紀錄
```

## 部署到 GitHub Pages
1. 把整個資料夾推到 repository 根目錄（包含 `.github/` 與 `.nojekyll`）。
2. Settings → Pages → Source 選 **GitHub Actions**（或 Deploy from a branch → `main` / root）。
3. 每次推送後約 1 分鐘生效；遊戲內所有資源都帶 `?v=版本號`，玩家重新整理就會拿到新版。

## 開發與測試
- 資料檢查：`node tests/check-data.mjs`
- 瀏覽器測試（需要 Playwright）：見 [tests/e2e/README.md](tests/e2e/README.md)
- 動手改程式前，先讀 [docs/CODEMAP.md](docs/CODEMAP.md) 與 [AGENTS.md](AGENTS.md)。

## 更新紀錄的寫法
- 每個版本的變更寫在 `CHANGELOG.md` 最上方的「未統整」區塊。
- 每累積約 20 個版本，把這一段統整成一個區塊（重點摘要），README 不再逐版記錄。
- 統整前的逐版完整紀錄保存在 `docs/archive/`。

## 聲明
本作為粉絲自製的非營利作品，角色與世界觀屬於原作者及其權利人所有。
