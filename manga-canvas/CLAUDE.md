1    - 說中文
        2    - 如果修改量較大在每三次修改就要自動詢問是否要推送代碼
        3 -  - 在執行任務前,先使用mcp-Sequential Thinking
        6 +  ## 🎯 系統資料流和 API 對應規則
        7 +  
        8 +  **CRITICAL: 
          + 在修改管理界面或測試功能前，必須先確認資料流對應關係**
        9 +  
       10 +  ### 📋 系統架構對應表 (必須遵守)
       11 +  ```
       12 +  管理界面功能 → API端點 → 前端頁面 → 載入腳本
       13 +  
       14 +  1. 關於作者 → /api/author/public → about.html, comics.html,        
          + works.html → author-loader.js, comics-author-loader.js, 
          + works-loader.js
       15 +  2. 首頁設定 → /api/homepage/public → index.html → 
          + homepage-loader.js
       16 +  3. 廣告頁設定 → /api/ads/public → ❌ 沒有對應前端頁面 
          + (需創建或連接)
       17 +  4. 漫畫管理 → /api/manga/* → (動態內容)
       18 +  ```
       19 +  
       20 +  ### ⚠️ 避免混淆的檢查清單
       21 +  
       22 +  **在修改管理界面內容前必須確認:**
       23 +  1. **確定修改的是哪個 API** (author/ads/homepage/manga)
       24 +  2. **確認哪個前端頁面使用該 API**
       25 +  3. **告知用戶正確的測試頁面**
       26 +  
       27 +  **在測試修改結果時:**
       28 +  1. **先檢查 API 響應** (`curl -s 
          + http://localhost:PORT/api/XXX/public`)
       29 +  2. **確認前端頁面載入正確的 API**
       30 +  3. **如果沒有對應前端頁面，明確告知用戶**
       31 +  
       32 +  ### 🚨 常見錯誤避免
       33 +  - ❌ 不要假設頁面名稱對應功能 (comics.html ≠ 廣告頁)
       34 +  - ❌ 不要修改後隨便猜測測試頁面
       35 +  - ✅ 必須檢查實際的資料流對應關係
       36 +  - ✅ 必須告知用戶正確的測試方式