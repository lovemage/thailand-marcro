const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../../data/homepage.json');

// 確保數據目錄和文件存在
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // 如果文件不存在，創建初始數據
        const initialData = {
            carousel: {
                enabled: true,
                autoplay: true,
                speed: 3, // 3秒
                images: [
                    {
                        id: 'slide1',
                        url: '/index_html_css/image/bg.jpg',
                        alt: '預設背景',
                        title: '歡迎來到 TJI Studio',
                        description: '專業漫畫創作工作室',
                        order: 1
                    }
                ]
            },
            dots: {
                enabled: true,
                count: 6
            },
            lastUpdated: new Date().toISOString()
        };

        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

// 讀取首頁數據
async function readHomepageData() {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// 寫入首頁數據
async function writeHomepageData(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 獲取首頁設定
router.get('/', async (req, res) => {
    try {
        const data = await readHomepageData();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('讀取首頁數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 獲取公開的首頁設定 (供前端頁面使用，無需認證)
router.get('/public', async (req, res) => {
    try {
        const data = await readHomepageData();
        res.json({
            success: true,
            data: {
                carousel: data.carousel,
                dots: data.dots
            }
        });
    } catch (error) {
        console.error('讀取公開首頁數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 更新輪播設定
router.put('/carousel', async (req, res) => {
    try {
        const { enabled, autoplay, speed } = req.body;

        const data = await readHomepageData();

        if (enabled !== undefined) data.carousel.enabled = enabled;
        if (autoplay !== undefined) data.carousel.autoplay = autoplay;
        if (speed !== undefined && [1, 2, 3].includes(speed)) {
            data.carousel.speed = speed;
        }

        await writeHomepageData(data);

        res.json({
            success: true,
            message: '輪播設定更新成功',
            data: data.carousel
        });
    } catch (error) {
        console.error('更新輪播設定錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新失敗'
        });
    }
});

// 新增輪播圖片
router.post('/carousel/images', async (req, res) => {
    try {
        const { url, alt, title, description } = req.body;

        const data = await readHomepageData();

        // 檢查圖片數量限制（最多5張）
        if (data.carousel.images.length >= 5) {
            return res.status(400).json({
                success: false,
                message: '輪播圖片最多只能有5張'
            });
        }

        const newImage = {
            id: 'slide' + Date.now(),
            url,
            alt: alt || '輪播圖片',
            title: title || '',
            description: description || '',
            order: data.carousel.images.length + 1
        };

        data.carousel.images.push(newImage);
        await writeHomepageData(data);

        res.json({
            success: true,
            message: '輪播圖片新增成功',
            data: newImage
        });
    } catch (error) {
        console.error('新增輪播圖片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增圖片失敗'
        });
    }
});

// 更新輪播圖片
router.put('/carousel/images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const data = await readHomepageData();
        const imageIndex = data.carousel.images.findIndex(img => img.id === id);

        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '圖片不存在'
            });
        }

        data.carousel.images[imageIndex] = {
            ...data.carousel.images[imageIndex],
            ...updateData
        };

        await writeHomepageData(data);

        res.json({
            success: true,
            message: '圖片更新成功',
            data: data.carousel.images[imageIndex]
        });
    } catch (error) {
        console.error('更新輪播圖片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新圖片失敗'
        });
    }
});

// 刪除輪播圖片
router.delete('/carousel/images/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const data = await readHomepageData();
        const imageIndex = data.carousel.images.findIndex(img => img.id === id);

        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '圖片不存在'
            });
        }

        data.carousel.images.splice(imageIndex, 1);

        // 重新排序
        data.carousel.images.forEach((img, index) => {
            img.order = index + 1;
        });

        await writeHomepageData(data);

        res.json({
            success: true,
            message: '圖片刪除成功'
        });
    } catch (error) {
        console.error('刪除輪播圖片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '刪除圖片失敗'
        });
    }
});

// 重新排序輪播圖片
router.put('/carousel/images/reorder', async (req, res) => {
    try {
        const { imageOrders } = req.body; // [{ id, order }, ...]

        const data = await readHomepageData();

        imageOrders.forEach(item => {
            const image = data.carousel.images.find(img => img.id === item.id);
            if (image) {
                image.order = item.order;
            }
        });

        // 按 order 排序
        data.carousel.images.sort((a, b) => a.order - b.order);

        await writeHomepageData(data);

        res.json({
            success: true,
            message: '圖片順序更新成功',
            data: data.carousel.images
        });
    } catch (error) {
        console.error('重新排序輪播圖片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '排序更新失敗'
        });
    }
});

module.exports = router;