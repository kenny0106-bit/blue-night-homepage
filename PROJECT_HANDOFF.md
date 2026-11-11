# Blue Night 專案交接

更新日期：2026-11-11

## 1. 專案簡介

Blue Night 是地下音樂展演品牌的互動網站。此 Repository 是主網站，包含入口首頁、AR POSTER 互動體驗與 TICKET 門票作品展示。THE SOUND（原 NFC 網站）仍是另一個獨立網站，本專案只保留連往該站的入口，不包含它的原始碼。

- GitHub：<https://github.com/kenny0106-bit/blue-night-homepage>
- Production 網址：<https://blue-night-homepage.vercel.app/>
- 正式分支：`main`
- Vercel Root Directory：Repository 根目錄

## 2. 技術與架構

- React 19、Vite 8、原生 CSS。
- MindAR Image Tracking 與 Three.js 用於三張海報的圖片追蹤與影片平面。
- pnpm 管理套件；`pnpm-lock.yaml` 是套件鎖定檔。
- `vercel.json` 將 SPA 路徑導回 `index.html`，所以 `/ar-poster`、`/ticket` 可以直接開啟或重新整理。
- 不需要環境變數。

主要入口和路由判斷在 `src/main.jsx`；門票展示獨立於 `src/TicketPage.jsx` 與 `src/ticket.css`。

## 3. 頁面與路由

| 路徑／入口 | 用途 |
| --- | --- |
| `/` | 開場待機影片、Blue Night 主入口、15 秒無互動待機模式與工作人員的 STANDBY 控制。首頁主入口順序為 AR POSTER、THE SOUND、TICKET。 |
| `/ar-poster` | AR POSTER 說明頁；按 START SCANNING 後請求相機權限並進入即時掃描畫面。 |
| `/ticket` | 四款門票的作品展示頁，包含正反面 3D 翻轉、票根撕除與重新組合。 |
| THE SOUND 外連 | `https://blue-night-one.vercel.app/`。該網站是不同專案，本 Repo 不應代替或修改其內容。 |

## 4. 功能完成狀態

### 首頁與待機

- 首頁使用既有 Blue Night 字體與深色幾何唱片視覺。
- 開場／待機影片：`public/blue-night-standby.mp4`。此影片包含品牌與活動文字，不應在上方重複疊加品牌圖文。
- 首頁在 15 秒全域無輸入後進入網站待機；STANDBY 可立即進入相同模式；點擊待機畫面離開並重設計時。
- AR POSTER、THE SOUND、TICKET 入口已連接。THE SOUND 指向外部網站，另外兩者使用本機路由。

### AR POSTER

- 目前可辨識 Guitar、Microphone、French Horn 三個 MindAR targets；target index 順序是 `src/main.jsx` 的 `posterTargets`：0 Guitar、1 Microphone、2 French Horn。不可單獨調換此順序，除非同步重新編譯 `.mind` 資料庫。
- 每張海報有自己的 Three.js 影片平面；target lost 時隱藏／停止所屬影片。
- 一或兩張海報被追蹤時，對應海報影片使用內嵌音訊並單次播放；三張同時追蹤時影片同時循環且靜音，並可觸發 Little Jazz Secret Track 及 Ella Fitzgerald 繁體中文介紹跑馬燈。
- 相機與實體海報辨識必須在支援 `getUserMedia` 的環境驗收。正式站須 HTTPS；本機 `localhost` 通常可測相機。音訊可能受瀏覽器 autoplay 政策限制，介面已提供相應播放控制／狀態。
- 先前曾回報單張海報偶發誤認為兩張；程式有 pose collision 防護與 target state 管理，但實際誤判率仍需要不同光線、角度和實體印刷海報實測，不能僅以 build 視為解決。

### TICKET

- 四個原始 JPG 位於 `public/tickets/`，每張 JPG 左側為正面、右側為背面；程式根據各自原圖座標裁取兩面，維持比例。
- 點擊整張門票或 CLICK TO FLIP 以 CSS 3D 翻轉完整門票。
- TEAR OFF TICKET 從票面底部分離主票與票根；撕除後兩面仍可翻轉，REASSEMBLE TICKET 會恢復完整正面。
- 目前票根依 8 × 20 公分規格裁切，程式以 30 公分作為完整票長的比例基準，以保留 10 公分主票區域。原始 JPG 沒有實際物理尺寸，若印刷規格另有完整票長，調整 `src/TicketPage.jsx` 的 `FULL_TICKET_LENGTH_CM`。
- 票價與購票操作仍是 Coming Soon / disabled，沒有金流或訂單系統。

## 5. 主要素材位置

| 素材 | 路徑 |
| --- | --- |
| 首頁品牌 mark | `public/blue-night-mark-white.png` |
| 開場／待機影片 | `public/blue-night-standby.mp4` |
| 三張追蹤資料庫 | `public/ar/blue-night-posters.mind` |
| AR target 原圖 | `public/ar/poster-targets/guitar.png`、`microphone.png`、`french-horn.png` |
| AR 動畫影片 | `public/ar/poster-videos/guitar.mp4`、`microphone.mp4`、`french-horn.mp4` |
| Little Jazz 音檔 | `public/audio/little-jazz-ella-fitzgerald.mp3` |
| 門票原始 JPG | `public/tickets/blue-rock.jpg`、`funk.jpg`、`fusion.jpg`、`rnb.jpg` |

`public/ar/guitar.jpg` 和 `public/ar/guitar.mind` 是早期 Guitar 單張追蹤流程留下的素材；目前三張海報流程使用 `blue-night-posters.mind` 與 `poster-targets/` 下三張 PNG。修改或移除舊檔前，先用 `rg` 搜尋實際引用並確認不再需要。

## 6. 本機啟動與建置

在 Repository 根目錄執行：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Vite 會輸出本機網址（預設通常為 `http://localhost:5173/`）。直接路由測試可用 `/ar-poster` 和 `/ticket`。正式建置與本機預覽：

```sh
pnpm build
pnpm preview
```

Node.js 版本須符合 Vite 8 要求。無需 `.env`。`.gitignore` 已排除 `node_modules/`、`dist/`、`.vercel/`、`.env` 與本機 `*.local` 檔。

## 7. GitHub 與 Vercel 部署

- GitHub Repository：<https://github.com/kenny0106-bit/blue-night-homepage>，production branch 為 `main`。
- 原 Vercel Production URL：<https://blue-night-homepage.vercel.app/>。
- Vercel 專案應維持連結既有 GitHub Repository，Root Directory 為 `.`（Repository 根目錄），Framework 為 Vite，Build Command 為 `pnpm build`，Output Directory 為 `dist`，Install Command 使用 pnpm 自動偵測。
- 推送新提交到 `main` 後，既有 Vercel Git integration 應自動建立 Production deployment。若未啟動，登入 Vercel 的既有 Blue Night 專案，檢查 Git Repository / Production Branch 設定，並從該專案對最新 `main` 提交執行 Redeploy。
- 本次上線前應先 `pnpm build`，然後推送已確認的提交；確認 GitHub `main` SHA 與本機一致，再到 Vercel 檢查最新部署狀態、Build Logs 與正式網址。

## 8. 已知問題與尚未完成事項

- AR 相機影像辨識、追蹤掉失恢復，以及三張實體海報同時出現時的體驗，仍需在實際手機／平板、正式 HTTPS 網址與實際印刷品上驗收。自動化瀏覽器無法證明實體 target tracking 的準確度。
- AR 圖片特徵相似可能造成偶發誤辨；每次更新 target 圖或 `.mind` 檔後必須以三張印刷品分別及同時測試，並觀察 Console targetFound/targetLost 診斷紀錄。
- 手機瀏覽器的相機授權、影片解碼和音訊 autoplay 行為因裝置與瀏覽器而異，須實機測試。
- TICKET 購買流程、正式票價與創作理念文字尚未完成；目前刻意保留為展示作品頁與 disabled Coming Soon 控制。
- Git 歷史中已有部分提交使用不同於 Kenny 的作者識別。為遵守不任意改寫歷史的要求，本次不重寫這些提交；後續新提交應使用 Kenny 的 GitHub noreply email（例如本機既有 Kenny 提交使用的 `311019801+kenny0106-bit@users.noreply.github.com`）。GitHub Contributors 是否列出舊身份依既有提交及 GitHub 關聯而定，安全清除需先評估並另行授權歷史重寫。
- 最新一次本機 production build 已成功；Vite build 仍會提示 MindAR 對 `fs`、`buffer`、`util` 的 browser externalization 及部分 AR bundle 大於 500 kB。這些是警告，不是 build failure；可在後續效能工作中評估拆包。

## 9. 下一階段建議

1. 先在展場平板與手機的正式 HTTPS 網址上驗收首頁待機、相機授權及三張實體海報追蹤。
2. 依正式門票印刷尺寸核對底部 8 × 20 公分票根，再調整完整票長比例基準（若實際不同於目前 30 公分假設）。
3. 完成 TICKET 創作理念、價格／售票目的地後，再替換 Coming Soon 區域；勿先接入未確認的金流。
4. 持續在同一 Repository、同一 Vercel 專案中開發；保留 `.mind` target 順序與 AR asset pairing，部署前執行 `pnpm build`。
