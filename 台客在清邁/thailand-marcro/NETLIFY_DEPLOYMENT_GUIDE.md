# Netlify CMS 完整部署指南

## 錯誤解決方案

如果您看到 **"Your Git Gateway backend is not returning valid settings. Please make sure it is enabled."** 錯誤，請按照以下步驟進行設置。

## 第一步：準備 GitHub 存儲庫

### 1. 創建 GitHub 存儲庫
```bash
# 如果還沒有 Git 存儲庫，請執行：
git init
git add .
git commit -m "Initial commit with Netlify CMS setup"

# 在 GitHub 上創建新存儲庫後：
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### 2. 確保所有檔案都已推送
確認以下重要檔案都在 GitHub 存儲庫中：
- `/admin/index.html`
- `/admin/config.yml`
- `/_data/` 資料夾及其內容
- `/images/uploads/` 資料夾
- 更新後的 `index.html`（包含 Netlify Identity 腳本）

## 第二步：部署到 Netlify

### 1. 連接 GitHub 存儲庫
1. 登入 [Netlify](https://netlify.com)
2. 點擊 **"New site from Git"**
3. 選擇 **GitHub** 作為 Git 提供商
4. 授權 Netlify 存取您的 GitHub 帳戶
5. 選擇您的專案存儲庫

### 2. 配置部署設定
- **Branch to deploy**: `main`
- **Build command**: 留空（因為是純靜態網站）
- **Publish directory**: `.` （根目錄）
- 點擊 **"Deploy site"**

### 3. 更新網站設定
部署完成後：
1. 複製您的 Netlify 網站 URL（例如：`https://amazing-site-123456.netlify.app`）
2. 更新 `/admin/config.yml` 中的網站 URL：

```yaml
site_url: https://your-actual-netlify-url.netlify.app
display_url: https://your-actual-netlify-url.netlify.app
```

3. 提交並推送更改：
```bash
git add admin/config.yml
git commit -m "Update site URLs in CMS config"
git push
```

## 第三步：啟用 Netlify Identity

### 1. 啟用 Identity 服務
1. 在 Netlify 儀表板中，進入您的網站
2. 點擊 **"Identity"** 標籤
3. 點擊 **"Enable Identity"**

### 2. 配置 Identity 設定
在 Identity 設定中：

**Registration settings:**
- 選擇 **"Invite only"**（僅邀請制，更安全）

**External providers:**
- 可以選擇啟用 Google、GitHub 等第三方登入（可選）

### 3. 啟用 Git Gateway
**這是最重要的步驟！**
1. 在 Identity 頁面，向下滾動到 **"Services"** 區域
2. 找到 **"Git Gateway"**
3. 點擊 **"Enable Git Gateway"**
4. 系統會自動配置與您的 GitHub 存儲庫的連接

## 第四步：邀請管理員用戶

### 1. 邀請用戶
1. 在 Identity 頁面，點擊 **"Invite users"**
2. 輸入管理員的電子郵件地址
3. 點擊 **"Send"**

### 2. 用戶設置
1. 管理員會收到邀請郵件
2. 點擊郵件中的連結
3. 設置密碼並完成註冊

## 第五步：測試 CMS

### 1. 訪問 CMS
1. 前往 `https://your-netlify-site.netlify.app/admin/`
2. 使用邀請的帳戶登入
3. 現在應該能看到 CMS 管理介面

### 2. 功能測試
測試以下功能是否正常：
- 查看現有的房產項目
- 查看 YouTube 影片
- 查看部落格文章
- 嘗試編輯一個項目（不需要保存）

## 常見問題排解

### 問題 1: "Git Gateway backend is not returning valid settings"
**解決方案:**
1. 確認已啟用 Git Gateway
2. 確認網站 URL 在 `config.yml` 中正確設定
3. 等待 5-10 分鐘讓設定生效
4. 清除瀏覽器緩存並重新載入

### 問題 2: "Unable to access mode config"
**解決方案:**
1. 檢查 `/admin/config.yml` 檔案是否存在
2. 檢查 YAML 語法是否正確
3. 確認檔案已正確推送到 GitHub

### 問題 3: 無法看到 CMS 內容
**解決方案:**
1. 確認 `_data` 資料夾及其內容已推送到 GitHub
2. 檢查資料夾路徑是否與 `config.yml` 中的設定一致
3. 重新部署網站

### 問題 4: 圖片上傳失敗
**解決方案:**
1. 確認 `images/uploads` 資料夾存在
2. 檢查 `config.yml` 中的 media_folder 設定
3. 確認 Git Gateway 有寫入權限

## 本地開發測試

如果需要在本地測試 CMS（可選）：

### 1. 修改配置
在 `/admin/config.yml` 中臨時修改：
```yaml
backend:
  name: test-repo
  # name: git-gateway (註解掉這行)
  # branch: main (註解掉這行)
```

### 2. 啟動本地服務器
```bash
# 使用 Python 3
python -m http.server 8000

# 使用 Python 2
python -m SimpleHTTPServer 8000

# 使用 Node.js
npx http-server

# 使用 Live Server (VSCode 擴充功能)
```

### 3. 訪問本地 CMS
前往 `http://localhost:8000/admin/` 進行測試

**記住：測試完後要將配置改回 `git-gateway` 模式！**

## 部署檢查清單

在完成部署前，請確認：

- [ ] GitHub 存儲庫已創建並包含所有檔案
- [ ] 網站已成功部署到 Netlify
- [ ] `config.yml` 中的網站 URL 已更新為實際的 Netlify URL
- [ ] Netlify Identity 已啟用
- [ ] Git Gateway 已啟用
- [ ] 管理員用戶已被邀請並完成註冊
- [ ] 能夠成功登入 `/admin/` 介面
- [ ] CMS 功能測試正常

## 技術支援

如果仍有問題，請檢查：
1. Netlify 部署日誌是否有錯誤
2. 瀏覽器開發者工具的 Console 是否有錯誤訊息
3. 網路連接是否正常

完成這些步驟後，您的 Netlify CMS 應該就能正常工作了！