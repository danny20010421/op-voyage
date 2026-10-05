# 給開發助手（Claude、Codex、Cursor……）的工作規則

1. **動手前先讀** `docs/CODEMAP.md`（每個檔案的職責、依賴、不能弄錯的事）與 `design/01-decisions/`（使用者已拍板的設計決策）。
2. **使用者已決定的事不要自行改變**：見 `design/` 中狀態為 accepted 的 Decision。需要改變時，先向使用者提出並建立新的 Decision，等使用者同意（Human Gate）。
3. **自己做的假設要登記**：不確定原作設定、數值或使用者意圖時，做出合理預設並在 `design/` 建立 proposed 狀態的 Decision，回覆中明確告知使用者。
4. **版面規則**：8px 網格；同一列的控制項等高、垂直置中；不同裝置用實際量測排版，不寫死位置。
5. **改劇情或角色資料**：DATA_VERSION 加一；不能增減既有篇章的任務步驟數。
6. **新增 Firestore 集合**：更新 `firestore.rules` 並提醒使用者重新發布。
7. **發版前測試**：見 `tests/e2e/README.md`（含 `points_check.js` 任務地點檢查）；遊戲內公告一起更新。
8. **修改檔案職責或介面時**，同步更新 `docs/CODEMAP.md`。
9. **更新紀錄**：每個版本寫在 `CHANGELOG.md` 最上方的「未統整」區塊；**README 不逐版記錄**。每累積約 20 個版本統整成一段摘要，逐版原文移到 `docs/archive/`。
10. **遊戲名稱**：正式名稱是「海賊新時代 AGE OF THE NEW OVERLORDS」；劇情裡的「偉大航路」是地名，照原作保留。
11. **資料夾**：正式遊戲只用根目錄的 index.html；開發用頁面放 `dev/`；開發文件放 `docs/`。
