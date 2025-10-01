const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../../data/comics.json');

// 確保數據目錄和文件存在
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // 如果文件不存在，創建初始數據
        const initialData = {
            hero: {
                enabled: true,
                autoplay: true,
                speed: 3, // 3秒
                slides: []
            },
            heroTitle: {
                title: 'MangaPlaza, Your One-Stop Manga Website',
                description: 'Discover popular Japanese manga series with over 150,000 chapters to read on MangaPlaza! Sign up and read the 1st chapter of even more titles for FREE!'
            },
            lastUpdated: new Date().toISOString()
        };

        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

// 讀取漫畫頁面數據
async function readComicsData() {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// 寫入漫畫頁面數據
async function writeComicsData(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 獲取漫畫頁面設定
router.get('/', async (req, res) => {
    try {
        const data = await readComicsData();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('讀取漫畫頁面數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 獲取公開的漫畫頁面設定 (供前端頁面使用，無需認證)
router.get('/public', async (req, res) => {
    try {
        const data = await readComicsData();
        res.json({
            success: true,
            data: {
                hero: data.hero,
                heroTitle: data.heroTitle
            }
        });
    } catch (error) {
        console.error('讀取公開漫畫頁面數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 更新 Hero 輪播設定
router.put('/hero', async (req, res) => {
    try {
        const { enabled, autoplay, speed } = req.body;

        const data = await readComicsData();

        if (enabled !== undefined) data.hero.enabled = enabled;
        if (autoplay !== undefined) data.hero.autoplay = autoplay;
        if (speed !== undefined && [1, 2, 3, 4, 5, 6].includes(speed)) {
            data.hero.speed = speed;
        }

        await writeComicsData(data);

        res.json({
            success: true,
            message: 'Hero輪播設定更新成功',
            data: data.hero
        });
    } catch (error) {
        console.error('更新Hero輪播設定錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新失敗'
        });
    }
});

// 新增 Hero 幻燈片
router.post('/hero/slides', async (req, res) => {
    try {
        const slideData = req.body;

        const data = await readComicsData();

        // 檢查幻燈片數量限制（最多5張）
        if (data.hero.slides.length >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Hero幻燈片最多只能有5張'
            });
        }

        const newSlide = {
            id: 'comics-slide' + Date.now(),
            title: slideData.title || '',
            subtitle: slideData.subtitle || '',
            badge: slideData.badge || '',
            description: slideData.description || '',
            author: slideData.author || 'Tji',
            price: slideData.price || '',
            originalPrice: slideData.originalPrice || '',
            rating: slideData.rating || 5,
            buttonText: slideData.buttonText || '查看作品',
            buttonLink: slideData.buttonLink || '#',
            mainImage: slideData.mainImage || '',
            sideImages: slideData.sideImages || [],
            cardTitle: slideData.cardTitle || '',
            cardContent: slideData.cardContent || '',
            order: data.hero.slides.length + 1
        };

        data.hero.slides.push(newSlide);
        await writeComicsData(data);

        res.json({
            success: true,
            message: 'Hero幻燈片新增成功',
            data: newSlide
        });
    } catch (error) {
        console.error('新增Hero幻燈片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增幻燈片失敗'
        });
    }
});

// 更新 Hero 幻燈片
router.put('/hero/slides/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const data = await readComicsData();
        const slideIndex = data.hero.slides.findIndex(slide => slide.id === id);

        if (slideIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '幻燈片不存在'
            });
        }

        data.hero.slides[slideIndex] = {
            ...data.hero.slides[slideIndex],
            ...updateData
        };

        await writeComicsData(data);

        res.json({
            success: true,
            message: '幻燈片更新成功',
            data: data.hero.slides[slideIndex]
        });
    } catch (error) {
        console.error('更新Hero幻燈片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新幻燈片失敗'
        });
    }
});

// 刪除 Hero 幻燈片
router.delete('/hero/slides/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const data = await readComicsData();
        const slideIndex = data.hero.slides.findIndex(slide => slide.id === id);

        if (slideIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '幻燈片不存在'
            });
        }

        data.hero.slides.splice(slideIndex, 1);

        // 重新排序
        data.hero.slides.forEach((slide, index) => {
            slide.order = index + 1;
        });

        await writeComicsData(data);

        res.json({
            success: true,
            message: '幻燈片刪除成功'
        });
    } catch (error) {
        console.error('刪除Hero幻燈片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '刪除幻燈片失敗'
        });
    }
});

// 重新排序 Hero 幻燈片
router.put('/hero/slides/reorder', async (req, res) => {
    try {
        const { slideOrders } = req.body; // [{ id, order }, ...]

        const data = await readComicsData();

        slideOrders.forEach(item => {
            const slide = data.hero.slides.find(slide => slide.id === item.id);
            if (slide) {
                slide.order = item.order;
            }
        });

        // 按 order 排序
        data.hero.slides.sort((a, b) => a.order - b.order);

        await writeComicsData(data);

        res.json({
            success: true,
            message: '幻燈片順序更新成功',
            data: data.hero.slides
        });
    } catch (error) {
        console.error('重新排序Hero幻燈片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '排序更新失敗'
        });
    }
});

// 更新 Hero 標題設定
router.put('/hero/title', async (req, res) => {
    try {
        const { title, description } = req.body;

        const data = await readComicsData();

        if (!data.heroTitle) {
            data.heroTitle = {};
        }

        if (title !== undefined) {
            data.heroTitle.title = title;
        }

        if (description !== undefined) {
            data.heroTitle.description = description;
        }

        await writeComicsData(data);

        res.json({
            success: true,
            message: 'Hero標題更新成功',
            data: data.heroTitle
        });
    } catch (error) {
        console.error('更新Hero標題錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新Hero標題失敗'
        });
    }
});

module.exports = router;