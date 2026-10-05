# 海賊新時代：App 化規劃

目前遊戲是 GitHub Pages 上的網頁，已經具備 PWA 的基本條件（manifest、Service Worker、App 圖示）。以下依「成本由低到高」分成四個階段。

## 1. 第一階段：PWA（已可使用，持續完善）
玩家不需要任何商店，直接「加到主畫面」就像 App：全螢幕、有圖示、可以離線開啟。
- **Android（Chrome）**：開啟遊戲網址 → 右上選單 →「安裝應用程式」或「加到主畫面」。
- **iPhone（Safari）**：開啟遊戲網址 → 分享 →「加入主畫面」。
- 待完善：
  - 遊戲內加一個「安裝 App」按鈕（Android 用 `beforeinstallprompt`，iPhone 顯示圖文教學）。
  - Service Worker 預先快取核心檔案，讓第一次離線開啟更穩定。
  - 手機橫式／直式切換時的版面再檢查一次。

## 2. 第二階段：Android 安裝檔（APK／AAB）
用 **TWA（Trusted Web Activity）** 把網頁包成 Android App，內容仍然從網址載入，更新網站就等於更新 App。
1. 到 https://www.pwabuilder.com 輸入遊戲網址，選 Android → 產生安裝包（或用 Google 的 Bubblewrap 指令工具）。
2. 會得到：`.aab`（上架 Google Play 用）、`.apk`（可以直接傳給朋友安裝）、簽章金鑰（**務必備份**）、`assetlinks.json`。
3. **網域驗證**：`assetlinks.json` 必須放在「網域根目錄」的 `/.well-known/assetlinks.json`。目前網址是 `danny20010421.github.io/op-voyage/`（子路徑），有兩個解法：
   - 建立一個名為 `danny20010421.github.io` 的 repository，把 `.well-known/assetlinks.json` 放進去；或
   - 買一個自己的網域（例如 `pirates-newera.com`）綁定 GitHub Pages（費用約每年 400～1,000 元）。
   沒有完成驗證時，App 上方會出現網址列，但仍然可以玩。
4. **不上架也能發佈**：把 `.apk` 放在 GitHub Releases，玩家下載後允許「安裝未知來源應用程式」即可安裝。

## 3. 第三階段：商店上架
| 項目 | Google Play | App Store（iPhone） |
|---|---|---|
| 開發者帳號 | 一次 25 美元 | 每年 99 美元 |
| 打包方式 | TWA（第二階段的 .aab） | Capacitor 把網頁包成原生 App（需要 Mac 與 Xcode） |
| 新帳號要求 | 個人帳號需找 12 位測試者連續封閉測試 14 天才能正式上架 | 審核較嚴，純網頁包裝常被以「功能不足」退件 |
| 需要準備 | 圖示 512×512、宣傳圖 1024×500、手機截圖 4～8 張、隱私權政策網址、內容分級問卷 | 同左，另需各尺寸截圖 |

商店文案草稿見 [STORE_LISTING.md](STORE_LISTING.md)。

## 4. 上架前必須先解決：著作權
遊戲目前使用了《ONE PIECE》的角色、名稱、劇情與相關美術。
- 網頁上的非營利粉絲作品風險較低，但 **Google Play 與 App Store 都會審查智慧財產權**；未經授權使用知名作品角色的 App，通常會被拒絕上架，或在權利人檢舉後下架，嚴重時開發者帳號會被停權。
- 可行的方向：
  1. **維持粉絲作品**：只用 PWA 與 APK 私下分享，不上架商店、不收費、不放廣告。
  2. **原創化**：保留「海賊新時代」的系統、戰鬥、立體島嶼，把角色、島嶼名稱與劇情換成原創內容後再上架。新名字已經是很好的第一步。
  3. **取得授權**：向權利人申請授權（個人開發者取得的機會很低）。
- 建議：先走第 1 個方向讓朋友玩，同時評估第 2 個方向。

## 5. 建議時程
1. 本週：遊戲內「安裝 App」按鈕＋安裝教學（第一階段完善）。
2. 下一步：用 PWABuilder 產生 APK，放到 GitHub Releases 給朋友測試。
3. 決定方向：粉絲版（不上架）或原創版（準備上架）。
4. 若走原創版：替換角色與名稱 → 準備商店素材與隱私權政策 → Google Play 封閉測試 14 天 → 正式上架。
