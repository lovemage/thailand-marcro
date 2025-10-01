const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../../data/manga.json');

// 確保數據目錄和文件存在
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // 如果文件不存在，創建初始數據
        const initialData = {
            manga: [],
            lastUpdated: new Date().toISOString()
        };
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

// 讀取漫畫數據
async function readMangaData() {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// 寫入漫畫數據
async function writeMangaData(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 獲取所有漫畫
router.get('/', async (req, res) => {
    try {
        const data = await readMangaData();
        res.json({
            success: true,
            data: data.manga
        });
    } catch (error) {
        console.error('讀取漫畫數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 新增漫畫
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            coverImage,
            status,
            category,
            type,
            tags,
            ageRating,
            rating
        } = req.body;

        const data = await readMangaData();
        const newManga = {
            id: Date.now().toString(),
            title,
            description,
            coverImage,
            status: status || '連載中',
            category: category || 'general',
            type: type || '',                               // 類型（管理員輸入）
            tags: Array.isArray(tags) ? tags : [],          // 標籤陣列
            ageRating: ageRating || '全年齡',                // 年齡分級
            rating: {                                       // 評價系統
                enabled: rating?.enabled || false,          // 評價開關
                stars: rating?.stars || 5,                  // 星數（3-5）
                value: rating?.value || 0                   // 實際評分
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.manga.push(newManga);
        await writeMangaData(data);

        res.json({
            success: true,
            message: '漫畫新增成功',
            data: newManga
        });
    } catch (error) {
        console.error('新增漫畫錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增漫畫失敗'
        });
    }
});

// 更新漫畫
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const data = await readMangaData();
        const mangaIndex = data.manga.findIndex(manga => manga.id === id);

        if (mangaIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '漫畫不存在'
            });
        }

        data.manga[mangaIndex] = {
            ...data.manga[mangaIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        await writeMangaData(data);

        res.json({
            success: true,
            message: '漫畫更新成功',
            data: data.manga[mangaIndex]
        });
    } catch (error) {
        console.error('更新漫畫錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新漫畫失敗'
        });
    }
});

// 刪除漫畫
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const data = await readMangaData();
        const mangaIndex = data.manga.findIndex(manga => manga.id === id);

        if (mangaIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '漫畫不存在'
            });
        }

        data.manga.splice(mangaIndex, 1);
        await writeMangaData(data);

        res.json({
            success: true,
            message: '漫畫刪除成功'
        });
    } catch (error) {
        console.error('刪除漫畫錯誤:', error);
        res.status(500).json({
            success: false,
            message: '刪除漫畫失敗'
        });
    }
});

// 獲取單個漫畫詳情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await readMangaData();
        const manga = data.manga.find(manga => manga.id === id);

        if (!manga) {
            return res.status(404).json({
                success: false,
                message: '漫畫不存在'
            });
        }

        res.json({
            success: true,
            data: manga
        });
    } catch (error) {
        console.error('讀取漫畫詳情錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取漫畫詳情失敗'
        });
    }
});

// 公開API - 獲取所有漫畫（前端使用）
router.get('/public/list', async (req, res) => {
    try {
        const data = await readMangaData();
        // 只返回公開需要的欄位
        const publicManga = data.manga.map(manga => ({
            id: manga.id,
            title: manga.title,
            description: manga.description,
            coverImage: manga.coverImage,
            status: manga.status,
            category: manga.category,
            type: manga.type,
            tags: manga.tags,
            ageRating: manga.ageRating,
            rating: manga.rating.enabled ? {
                enabled: manga.rating.enabled,
                stars: manga.rating.stars,
                value: manga.rating.value
            } : { enabled: false }
        }));

        res.json({
            success: true,
            data: publicManga
        });
    } catch (error) {
        console.error('讀取公開漫畫列表錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取漫畫列表失敗'
        });
    }
});

module.exports = router;