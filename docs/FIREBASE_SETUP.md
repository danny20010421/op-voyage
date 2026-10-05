# Firebase 設定檢查（雲端存檔、註冊、好友、船團）

專案裡的 `firestore.rules` **不會自動上傳**。每次更新後若出現「沒有權限」，請照下面做一次：

1. 打開 Firebase 主控台 → 選擇專案 **op-uc2026**。
2. 左側「Firestore Database」→ 上方「規則」分頁。
3. 把專案根目錄 `firestore.rules` 的全部內容貼上（取代原本的內容）→ 按「**發布**」。
4. 左側「Authentication」→「設定」→「授權網域」：確認遊戲網址（例如 `你的帳號.github.io`）在清單裡。
5. 「Authentication」→「登入方式」：確認「Google」與「電子郵件／密碼」都是「已啟用」。

發布規則後約 1 分鐘生效，重新整理遊戲再試一次即可。
