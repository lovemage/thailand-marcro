# Netlify CMS 設置說明

## 完成的功能

✅ **基本 CMS 設置**
- 已設置 Netlify CMS 基本配置 (`/admin/config.yml`)
- 已建立 CMS 管理介面 (`/admin/index.html`)
- 已在主網站加入 Netlify Identity Widget

✅ **精選房產項目管理**
- 可以新增、編輯、刪除房產項目
- 支援圖片上傳和更換
- 包含標題、類別、描述等欄位
- 支援發布狀態和排序功能

✅ **Marco 頻道精選管理**
- 可以管理 YouTube 影片連結
- 自動生成縮圖 URL
- 包含影片標題和描述

✅ **Marco 短影片精選管理**
- 可以管理 YouTube Shorts 連結
- 支援短影片的特殊格式
- 自動生成縮圖 URL

✅ **最新資訊文章管理**
- 可以新增、編輯、刪除部落格文章
- 支援 Markdown 格式編輯
- 圖片上傳和管理功能
- 文章摘要、作者、發布日期等完整欄位
- 置頂文章功能

## 部署到 Netlify 的步驟

### 1. 部署網站
1. 將您的專案推送到 GitHub 存儲庫
2. 在 Netlify 中連接 GitHub 存儲庫
3. 設置構建命令：留空（純靜態站點）
4. 設置發布目錄：`.`（根目錄）

### 2. 啟用 Netlify Identity
1. 在 Netlify 儀表板中，轉到 **Identity** 頁面
2. 點擊 **"Enable Identity"**
3. 在 **Settings > Registration** 中，選擇 **"Invite only"**
4. 在 **Services > Git Gateway** 中，點擊 **"Enable Git Gateway"**

### 3. 邀請管理員
1. 在 Identity 頁面點擊 **"Invite users"**
2. 輸入管理員的電子郵件地址
3. 管理員會收到邀請郵件

### 4. 訪問 CMS
- CMS 管理介面：`https://your-site.netlify.app/admin/`
- 管理員可以登入後管理內容

## CMS 功能說明

### 房產項目管理
- **標題**：房產項目名稱
- **類別**：公寓大樓、獨棟別墅、商業地產
- **房產照片**：可上傳新圖片或使用現有圖片
- **詳細描述**：房產的詳細說明
- **發布狀態**：控制是否在網站顯示
- **排序順序**：控制顯示順序

### Marco 頻道精選管理
- **影片標題**：YouTube 影片標題
- **YouTube影片ID**：從 YouTube 網址提取的 ID
- **影片連結**：完整的 YouTube 影片網址
- **影片描述**：影片的簡短說明
- **縮圖網址**：自動生成，也可手動修改
- **發布狀態**：控制是否顯示
- **排序順序**：控制顯示順序

### Marco 短影片精選管理
- **短影片標題**：YouTube Shorts 標題
- **YouTube Shorts ID**：從 Shorts 網址提取的 ID
- **Shorts連結**：完整的 YouTube Shorts 網址
- **縮圖網址**：自動生成
- **發布狀態**：控制是否顯示
- **排序順序**：控制顯示順序

### 最新資訊文章管理
- **文章標題**：部落格文章的標題
- **文章圖片**：可上傳封面圖片
- **文章摘要**：顯示在首頁的簡短描述
- **文章內容**：支援 Markdown 格式的完整內容
- **作者**：預設為 Marco，可修改
- **發布日期**：可設定文章發布時間
- **文章連結**：可選擇外部連結或內部頁面
- **發布狀態**：控制文章是否公開顯示
- **置頂文章**：重要文章可設為置頂
- **排序順序**：控制文章顯示順序

## 注意事項

1. **更新 config.yml 中的網站 URL**：
   ```yaml
   site_url: https://your-actual-site.netlify.app
   display_url: https://your-actual-site.netlify.app
   ```

2. **圖片上傳**：
   - 圖片會上傳到 `/images/uploads/` 資料夾
   - 現有的房產圖片在 `/images/portfolio/` 中

3. **數據文件位置**：
   - 房產項目：`_data/properties/`
   - YouTube 影片：`_data/youtube/`
   - YouTube Shorts：`_data/shorts/`
   - 最新資訊文章：`_data/articles/`

4. **Git 權限**：
   - 確保啟用了 Git Gateway
   - CMS 會自動將更改提交到 GitHub

## 後續步驟

要讓 CMS 的更改反映在網站上，您需要：

1. 修改 `index.html` 中的靜態內容，使其從 `_data` 文件夾讀取數據
2. 可以考慮使用 Jekyll、Hugo 或其他靜態網站生成器來自動化這個過程
3. 或者使用 JavaScript 來動態載入 CMS 數據

現在 Netlify CMS 已經完全設置好，管理員可以通過 `/admin/` 介面輕鬆管理：
- 精選房產項目照片
- Marco 頻道的影片連結
- Marco 短影片精選
- 最新資訊部落格文章

所有內容都可以自由編輯、新增或刪除，讓網站內容管理變得更加便利！