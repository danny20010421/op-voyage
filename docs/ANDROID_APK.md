# 製作 Android 安裝檔（APK）——一步一步做

這個方法叫 **TWA（Trusted Web Activity）**：把遊戲網址包成一個 Android App。App 打開後載入的就是 GitHub Pages 上的遊戲，所以之後更新網站，App 也會自動是最新版，**不用重新製作 APK**。

## 事前確認（已經完成）
- `manifest.webmanifest`：App 名稱「海賊新時代」、圖示（192、512、maskable）、全螢幕顯示。
- `sw.js`：離線快取。
- 遊戲網址：`https://danny20010421.github.io/op-voyage/`（新版要先推上 GitHub，等 1 分鐘生效）。

## 步驟 1：用 PWABuilder 產生安裝檔（約 5 分鐘）
1. 用電腦開啟 https://www.pwabuilder.com
2. 貼上遊戲網址，按 **Start**，等它分析完（會顯示 manifest、Service Worker 的檢查結果）。
3. 按 **Package For Stores** → 選 **Android** → **Generate Package**。
4. 跳出的設定視窗：
   - **Package ID**：填 `io.github.danny20010421.newera`（之後不能再改，請記下來）
   - **App name**：海賊新時代；**Short name**：海賊新時代
   - **Version**：1.0.0；**Version code**：1（之後每次重新打包要 +1）
   - **Signing key**：選 **Create new**（第一次）
   - 其他保持預設，按 **Download Package**。
5. 下載的 zip 解壓縮後會有：
   - `app-release-signed.apk` → **直接安裝用的 APK**
   - `app-release-bundle.aab` → 上架 Google Play 用
   - `signing.keystore` 與 `signing-key-info.txt` → **簽章金鑰，務必備份到安全的地方**（遺失後就無法更新同一個 App）
   - `assetlinks.json` → 步驟 3 用

## 步驟 2：發佈給朋友安裝
1. 到 GitHub 的 repository → 右側 **Releases** → **Create a new release**。
2. Tag 填 `v1.0.0`，標題「海賊新時代 Android 版」，把 `app-release-signed.apk` 拖進附件區，按 **Publish release**。
3. 把 Release 頁面的連結傳給朋友。朋友用 Android 手機下載 APK → 開啟 → 系統會詢問「允許安裝未知來源應用程式」→ 允許 → 安裝。

## 步驟 3（選做）：去掉 App 上方的網址列
沒做這一步也能正常玩，只是 App 最上方會多一條網址列。要去掉它，必須證明「這個網站是你的」：
- `assetlinks.json` 要放在 **網域根目錄**：`https://danny20010421.github.io/.well-known/assetlinks.json`
- 因為遊戲在子路徑 `/op-voyage/`，要另外建一個 repository：
  1. 在 GitHub 新建 repository，名稱必須是 **`danny20010421.github.io`**（Public）。
  2. 在裡面建立資料夾 `.well-known`，放入 PWABuilder 給的 `assetlinks.json`。
  3. 在這個 repository 根目錄放一個空檔案 `.nojekyll`（不然 GitHub 不會發佈以點開頭的資料夾）。
  4. 等 1 分鐘，用瀏覽器打開上面的網址看得到 JSON 內容就完成；重新開啟 App，網址列會消失。

## 之後更新
- **遊戲內容更新**：照常推到 GitHub 即可，App 會自動載入新版，不用重新打包。
- **只有在**改了 App 名稱、圖示、Package ID 以外的 App 設定時，才需要用同一把簽章金鑰重新打包（Version code +1）。

## 常見問題
- **安裝時出現「已封鎖」**：到手機「設定 → 安全性 → 安裝未知應用程式」，允許你用來下載的瀏覽器或檔案管理員。
- **打開是白畫面**：確認手機有網路；第一次開啟需要下載遊戲資源（約 60MB），之後會有快取。
- **上架 Google Play**：見 [APP_PLAN.md](APP_PLAN.md) 第 3、4 節（需要開發者帳號，並先處理著作權）。
