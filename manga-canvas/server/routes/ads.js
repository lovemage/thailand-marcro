const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../../data/ads.json');

// 確保數據目錄和文件存在
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // 如果文件不存在，創建初始數據
        const initialData = {
            heroCarousel: {
                enabled: true,
                autoplay: true,
                speed: 4, // 4秒
            },
            heroSlides: [
                {
                    id: 'hero1',
                    title: '《魔法少女的冒險日記》',
                    subtitle: '2024新作',
                    badge: '精選作品',
                    description: '一個普通的高中生意外獲得了魔法能力，從此開啟了一段充滿奇幻色彩的冒險旅程。這是一部充滿熱血、友情和成長的精彩作品。',
                    author: 'Tji',
                    price: 'NT$980',
                    originalPrice: 'NT$1,200',
                    rating: 4.5,
                    buttonText: '查看作品',
                    buttonLink: '#',
                    mainImage: '/images/20250923163432_360x480_76.jpg',
                    sideImages: [
                        '/images/20191203103551_360x480_53.jpg',
                        '/images/20250923151711_360x480_80.jpg',
                        '/images/20191202171505_360x480_73.jpg',
                        '/images/20191220112159_360x480_75.jpg'
                    ],
                    cardEnabled: true,
                    cardTitle: 'Demo Heading',
                    cardContent: 'Sunt, laborum, nemo. Aperiam. Lorem ipsum dolor sit consectetur adipisicing elit.',
                    order: 1
                },
                {
                    id: 'hero2',
                    title: '《黑暗之炎》',
                    subtitle: '2024續集',
                    badge: '熱門作品',
                    description: '一位年輕的騎士為了救出被魔王擄走的公主，踏上了危險而充滿挑戰的旅程。黑暗與光明的永恆戰爭即將開始。',
                    author: 'Tji',
                    price: '會員限定',
                    originalPrice: '',
                    rating: 5,
                    buttonText: 'Add to Cart',
                    buttonLink: '#',
                    mainImage: '/images/20191203102548_360x480_82.jpg',
                    sideImages: [
                        '/images/20191203095924_360x480_82.jpg'
                    ],
                    cardEnabled: true,
                    cardTitle: 'Demo Heading',
                    cardContent: 'Sunt, laborum, nemo. Aperiam. Lorem ipsum dolor sit consectetur adipisicing elit.',
                    order: 2
                }
            ],
            lastUpdated: new Date().toISOString()
        };

        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

// 讀取廣告頁數據
async function readAdsData() {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// 寫入廣告頁數據
async function writeAdsData(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 簡單的認證中間件（可選）
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        // 如果沒有token，跳過認證（開發階段）
        return next();
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: '認證失敗' });
    }
};

// 獲取廣告頁設定
router.get('/', authMiddleware, async (req, res) => {
    try {
        const data = await readAdsData();

        // 確保heroSlides按order排序
        data.heroSlides.sort((a, b) => (a.order || 0) - (b.order || 0));

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('讀取廣告頁數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 獲取公開的廣告頁設定 (供前端頁面使用，無需認證)
router.get('/public', async (req, res) => {
    try {
        const data = await readAdsData();

        // 只返回啟用的資料，並按order排序
        const enabledSlides = data.heroSlides
            .filter(slide => data.heroCarousel.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        res.json({
            success: true,
            data: {
                heroCarousel: data.heroCarousel,
                heroSlides: enabledSlides
            }
        });
    } catch (error) {
        console.error('讀取公開廣告頁數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 更新Hero輪播設定
router.put('/hero-carousel', authMiddleware, async (req, res) => {
    try {
        const { enabled, autoplay, speed } = req.body;

        const data = await readAdsData();

        if (enabled !== undefined) data.heroCarousel.enabled = enabled;
        if (autoplay !== undefined) data.heroCarousel.autoplay = autoplay;
        if (speed !== undefined && [3, 4, 5, 6].includes(speed)) {
            data.heroCarousel.speed = speed;
        }

        await writeAdsData(data);

        res.json({
            success: true,
            message: 'Hero輪播設定更新成功',
            data: data.heroCarousel
        });
    } catch (error) {
        console.error('更新Hero輪播設定錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新失敗'
        });
    }
});

// 新增Hero輪播
router.post('/hero-slides', authMiddleware, async (req, res) => {
    try {
        const slideData = req.body;

        const data = await readAdsData();

        const newSlide = {
            id: 'hero' + Date.now(),
            ...slideData,
            order: data.heroSlides.length + 1
        };

        data.heroSlides.push(newSlide);
        await writeAdsData(data);

        res.json({
            success: true,
            message: 'Hero輪播新增成功',
            data: newSlide
        });
    } catch (error) {
        console.error('新增Hero輪播錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增Hero輪播失敗'
        });
    }
});

// 更新Hero輪播
router.put('/hero-slides/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const data = await readAdsData();
        const slideIndex = data.heroSlides.findIndex(slide => slide.id === id);

        if (slideIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Hero輪播不存在'
            });
        }

        data.heroSlides[slideIndex] = {
            ...data.heroSlides[slideIndex],
            ...updateData
        };

        await writeAdsData(data);

        res.json({
            success: true,
            message: 'Hero輪播更新成功',
            data: data.heroSlides[slideIndex]
        });
    } catch (error) {
        console.error('更新Hero輪播錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新Hero輪播失敗'
        });
    }
});

// 刪除Hero輪播
router.delete('/hero-slides/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const data = await readAdsData();
        const slideIndex = data.heroSlides.findIndex(slide => slide.id === id);

        if (slideIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Hero輪播不存在'
            });
        }

        data.heroSlides.splice(slideIndex, 1);

        // 重新排序
        data.heroSlides.forEach((slide, index) => {
            slide.order = index + 1;
        });

        await writeAdsData(data);

        res.json({
            success: true,
            message: 'Hero輪播刪除成功'
        });
    } catch (error) {
        console.error('刪除Hero輪播錯誤:', error);
        res.status(500).json({
            success: false,
            message: '刪除Hero輪播失敗'
        });
    }
});

// 重新排序Hero輪播
router.put('/hero-slides/reorder', authMiddleware, async (req, res) => {
    try {
        const { slideOrders } = req.body; // [{ id, order }, ...]

        const data = await readAdsData();

        slideOrders.forEach(item => {
            const slide = data.heroSlides.find(slide => slide.id === item.id);
            if (slide) {
                slide.order = item.order;
            }
        });

        // 按 order 排序
        data.heroSlides.sort((a, b) => (a.order || 0) - (b.order || 0));

        await writeAdsData(data);

        res.json({
            success: true,
            message: 'Hero輪播順序更新成功',
            data: data.heroSlides
        });
    } catch (error) {
        console.error('重新排序Hero輪播錯誤:', error);
        res.status(500).json({
            success: false,
            message: '排序更新失敗'
        });
    }
});

module.exports = router;