# 用 Blender（或 AI 3D 工具）強化島嶼地標

目前 13 座島是程式生成的立體結構（scenes.js 的 K）。要讓主角級地標（寶樹亞當、骷髏岩、龍宮城、萬國蛋糕城堡……）更精緻，用下面的流程，**可以走的地形與碰撞維持程式生成**，只把「看得到的外觀」換成模型。

## 流程
1. **製作模型**：在 Blender 建模，或用 Tripo／Meshy 產生後匯入 Blender 修整（減面到單一地標 3～8 萬面以內，材質用 1～2 張 1024px 貼圖）。
2. **放碰撞方塊**：在模型上擺幾個簡單方塊，名稱開頭用 `COL_`（牆）或 `PLAT_`（地板、樓梯平台）。方塊不要旋轉（只支援與 x／z 軸對齊）。樓梯每階高度 ≤ 0.38。
3. **匯出**：在 Blender 的 Scripting 分頁開啟 `dev/blender_export.py`，按執行。會在 .blend 旁邊產生 `名稱.glb`（Draco 壓縮）和 `名稱.collide.json`（碰撞方塊）。
4. **放進專案**：兩個檔案放到 `assets/models/`，在 `models.json` 登記；之後由開發助手把它掛到對應的島與座標上。

## 遊戲端還缺的一步
專案的 `vendor/three/` 目前沒有 GLTFLoader 與 DRACOLoader（three.js r186 的 `examples/jsm/loaders/`）。
第一次要用模型時，把這兩個檔案（以及 `examples/jsm/libs/draco/` 資料夾）一起上傳，開發助手就能加上「讀 glb＋套用 collide.json」的載入器。
