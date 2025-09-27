# Marco Academic - 房產顧問網站

這是 Marco 房產顧問的新版網站，採用獨立目錄運作，包含完整的 Netlify CMS 功能。

## 專案結構

```
marco-academic/
├── admin/                 # Netlify CMS 後台
│   ├── config.yml        # CMS 配置
│   └── index.html        # CMS 管理界面
├── _data/                # CMS 資料
│   ├── articles/         # 文章資料
│   ├── properties/       # 房產項目資料
│   ├── shorts/           # YouTube Shorts 資料
│   ├── youtube/          # YouTube 影片資料
│   └── deploy.yml        # 部署觸發器
├── js/
│   └── cms-loader.js     # 專用的 CMS 資料載入器
├── images/               # 圖片資源
├── index.html            # 首頁
├── properties.html       # 房產項目頁面
├── news.html             # 房產資訊頁面
├── news-detail.html      # 文章詳細頁面
└── netlify.toml          # Netlify 部署配置
```

## 功能特色

- ✅ 獨立的 CMS 資料管理
- ✅ 動態載入房產項目和文章
- ✅ GitHub API 整合與本地回退
- ✅ Academic Template 專業視覺設計
- ✅ 響應式設計與深色/淺色模式
- ✅ 完整的 Bootstrap 5 + Canvas 框架
- ✅ Netlify 部署優化

## 部署說明

1. 將此目錄推送到 GitHub repository
2. 在 Netlify 中連接 repository
3. 設定部署目錄為 `marco-academic`
4. 啟用 Netlify Identity 和 Git Gateway
5. 訪問 `/admin/` 進行內容管理

## 開發說明

### CMS 資料載入

- `js/cms-loader.js` 會自動載入 `_data/` 目錄下的 markdown 檔案
- 支援 GitHub API 動態載入和本地回退機制
- 圖片路徑會自動處理和優化

### 頁面結構

- ✅ 已整合 Academic Template 專業視覺設計
- ✅ Side Header 佈局與品牌配色 (#ECA92D)
- ✅ 所有頁面都支援 CMS 動態內容載入
- ✅ 響應式設計適配各種設備
- ✅ 深色/淺色模式切換功能
- ✅ 社群媒體整合 (Facebook, 微博, LINE)

## 最新更新 (2024-09-27)

### ✅ 已完成
- 整合 Academic Template 完整視覺設計
- 複製所有必要的 CSS 和 JS 檔案
- 更新 index.html 使用專業的 Side Header 佈局
- 更新 properties.html 使用 Portfolio 展示風格
- 更新 news.html 使用 Blog 文章佈局
- 配置品牌配色和社群媒體連結

### 🔄 進行中
- 測試所有頁面的視覺效果和功能
- 優化 CMS 資料載入與顯示

## 後續計劃

1. ✅ ~~整合 academic-template 的視覺設計~~
2. 完善圖片資源管理和路徑優化
3. 添加更多互動功能 (篩選、搜尋等)
4. 優化 SEO 和性能
5. 完善 news-detail.html 詳細頁面

## 聯絡資訊

Marco 房產顧問 - 專業清邁房地產投資服務
