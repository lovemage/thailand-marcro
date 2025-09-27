# Netlify CMS 快速故障排除

## 🚨 "Git Gateway backend is not returning valid settings" 錯誤

### 立即解決步驟：

#### 1. 檢查 Git Gateway 是否已啟用
```
前往 Netlify 儀表板 → 您的網站 → Identity → Services → Git Gateway
確認顯示 "Git Gateway is enabled" ✅
```

#### 2. 更新網站 URL（最常見原因）
編輯 `/admin/config.yml`:
```yaml
# 將這裡改成您實際的 Netlify URL
site_url: https://your-actual-site.netlify.app
display_url: https://your-actual-site.netlify.app
```

#### 3. 重新部署網站
```bash
git add .
git commit -m "Fix CMS configuration"
git push
```

#### 4. 清除緩存
- 清除瀏覽器緩存
- 等待 5-10 分鐘
- 重新訪問 `/admin/`

## 其他常見問題

### 問題：登入後看不到內容
**原因：** 資料文件夾路徑錯誤
**解決：** 確認以下文件夾存在並已推送到 GitHub：
- `_data/properties/`
- `_data/youtube/`
- `_data/shorts/`
- `_data/articles/`

### 問題：圖片無法上傳
**原因：** 媒體文件夾不存在
**解決：** 確認 `images/uploads/` 資料夾存在

### 問題：CMS 頁面空白
**原因：** JavaScript 錯誤
**解決：**
1. 按 F12 開啟開發者工具
2. 查看 Console 錯誤訊息
3. 檢查網路連接

## 一鍵檢查命令

```bash
# 檢查重要文件是否存在
ls -la admin/
ls -la _data/
ls -la images/uploads/

# 檢查 Git 狀態
git status
git remote -v
```

## 應急聯絡

如果以上步驟都無效，請：
1. 檢查 Netlify 部署日誌
2. 確認 GitHub 存儲庫權限
3. 嘗試重新啟用 Git Gateway

記住：最重要的是確保 **Git Gateway 已啟用** 且 **網站 URL 正確**！