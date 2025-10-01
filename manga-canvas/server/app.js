const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3007;

// 中間件設置
app.use(cors());
app.use(express.json({ charset: 'utf8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf8' }));

// 設置 UTF-8 編碼處理 (僅針對 API 路由)
app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 確保請求正確解析 UTF-8
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        req.headers['content-type'] = 'application/json; charset=utf-8';
    }

    next();
});

// 靜態文件服務 - 為現有的 HTML 網站提供服務
app.use(express.static(path.join(__dirname, '../')));

// 管理界面靜態文件
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/manga', require('./routes/manga'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/author', require('./routes/author'));
app.use('/api/homepage', require('./routes/homepage'));
app.use('/api/comics', require('./routes/comics'));
app.use('/api/ads', require('./routes/ads'));

// 主頁面路由 - 現有的 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 管理界面路由
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ message: '頁面不存在' });
});

// 錯誤處理
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: '伺服器內部錯誤' });
});

app.listen(PORT, () => {
    console.log(`🚀 TJI Studio CMS 服務器運行在 http://localhost:${PORT}`);
    console.log(`📱 管理界面: http://localhost:${PORT}/admin`);
    console.log(`🎨 前端網站: http://localhost:${PORT}`);
});