const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../../data/author.json');

// 確保數據目錄和文件存在
async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        // 如果文件不存在，創建初始數據
        const initialData = {
            profile: {
                name: "Tji",
                age: 23,
                title: "漫畫創作者，台灣",
                image: "/images/auther.png",
                introduction: [
                    "大家好，我是Tji，今年23歲，是一位專業的漫畫創作者。我的創作之路始於童年時光，6歲時便開始接觸水彩畫，那些繽紛的色彩為我開啟了藝術創作的大門。",
                    "10歲那年，我因為一本日本漫畫而深深著迷於這個奇妙的世界。從那時起，我不僅開始學習日文，更重要的是開始創作屬於自己的故事和繪本。漫畫不僅是我的興趣，更成為了我表達內心世界的重要媒介。",
                    "經過多年的努力與磨練，我致力於創作充滿想像力的原創漫畫作品。每一個故事都融合了我對生活的觀察與感悟，希望能夠透過筆下的角色和情節，與讀者產生共鳴，帶給大家溫暖與力量。",
                    "在Tji Studio，我專注於提供高品質的漫畫創作服務，包括原創故事構思、角色設計、以及完整的漫畫製作。歡迎您一同進入我創造的奇幻世界！"
                ]
            },
            works: [
                {
                    id: "work1",
                    title: "魔法少女的冒險日記",
                    image: "/images/20250923163432_360x480_76.jpg",
                    description: "一個充滿魔法與冒險的故事",
                    link: "/article.html"
                },
                {
                    id: "work2",
                    title: "黑暗之炎",
                    image: "/images/20250923151711_360x480_80.jpg",
                    description: "在黑暗中尋找光明的英雄傳說",
                    link: "/article.html"
                },
                {
                    id: "work3",
                    title: "機甲戰士",
                    image: "/images/20191202171505_360x480_73.jpg",
                    description: "未來世界的機械戰爭故事",
                    link: "/article.html"
                },
                {
                    id: "work4",
                    title: "幻想世界冒險記",
                    image: "/images/20191203095924_360x480_82.jpg",
                    description: "奇幻世界的冒險之旅",
                    link: "/article.html"
                },
                {
                    id: "work5",
                    title: "龍族傳說",
                    image: "/images/20191203102548_360x480_82.jpg",
                    description: "古老龍族的傳奇故事",
                    link: "/article.html"
                },
                {
                    id: "work6",
                    title: "星際戰士",
                    image: "/images/20191220112159_360x480_75.jpg",
                    description: "宇宙戰爭的英雄故事",
                    link: "/article.html"
                }
            ],
            socialLinks: [
                { platform: "facebook", url: "#", icon: "fa-brands fa-facebook-f" },
                { platform: "twitter", url: "#", icon: "fa-brands fa-x-twitter" },
                { platform: "github", url: "#", icon: "fa-brands fa-github" },
                { platform: "pinterest", url: "#", icon: "fa-brands fa-pinterest-p" },
                { platform: "forrst", url: "#", icon: "fa-solid fa-tree" }
            ],
            lastUpdated: new Date().toISOString()
        };

        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

// 讀取作者數據
async function readAuthorData() {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// 寫入作者數據
async function writeAuthorData(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 獲取作者資訊
router.get('/', async (req, res) => {
    try {
        const data = await readAuthorData();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('讀取作者數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 獲取公開的作者資訊 (供前端頁面使用，無需認證)
router.get('/public', async (req, res) => {
    try {
        const data = await readAuthorData();

        // 只返回公開資訊
        const publicData = {
            profile: data.profile,
            works: data.works,
            socialLinks: data.socialLinks
        };

        res.json({
            success: true,
            data: publicData
        });
    } catch (error) {
        console.error('讀取公開作者數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取數據失敗'
        });
    }
});

// 更新作者基本資訊
router.put('/profile', async (req, res) => {
    try {
        const { name, age, title, introduction } = req.body;

        const data = await readAuthorData();

        if (name !== undefined) data.profile.name = name;
        if (age !== undefined) data.profile.age = age;
        if (title !== undefined) data.profile.title = title;
        if (introduction !== undefined) data.profile.introduction = introduction;

        await writeAuthorData(data);

        res.json({
            success: true,
            message: '作者資訊更新成功',
            data: data.profile
        });
    } catch (error) {
        console.error('更新作者資訊錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新失敗'
        });
    }
});

// 更新作者頭像
router.put('/profile/image', async (req, res) => {
    try {
        const { image } = req.body;

        const data = await readAuthorData();
        data.profile.image = image;

        await writeAuthorData(data);

        res.json({
            success: true,
            message: '頭像更新成功',
            data: { image: data.profile.image }
        });
    } catch (error) {
        console.error('更新頭像錯誤:', error);
        res.status(500).json({
            success: false,
            message: '頭像更新失敗'
        });
    }
});

// 獲取作品列表
router.get('/works', async (req, res) => {
    try {
        const data = await readAuthorData();
        res.json({
            success: true,
            data: data.works
        });
    } catch (error) {
        console.error('讀取作品數據錯誤:', error);
        res.status(500).json({
            success: false,
            message: '讀取作品失敗'
        });
    }
});

// 新增作品
router.post('/works', async (req, res) => {
    try {
        const { title, image, description, link } = req.body;

        const data = await readAuthorData();
        const newWork = {
            id: 'work' + Date.now(),
            title,
            image,
            description: description || '',
            link: link || '/article.html'
        };

        data.works.push(newWork);
        await writeAuthorData(data);

        res.json({
            success: true,
            message: '作品新增成功',
            data: newWork
        });
    } catch (error) {
        console.error('新增作品錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增作品失敗'
        });
    }
});

// 更新作品
router.put('/works/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const data = await readAuthorData();
        const workIndex = data.works.findIndex(work => work.id === id);

        if (workIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '作品不存在'
            });
        }

        data.works[workIndex] = {
            ...data.works[workIndex],
            ...updateData
        };

        await writeAuthorData(data);

        res.json({
            success: true,
            message: '作品更新成功',
            data: data.works[workIndex]
        });
    } catch (error) {
        console.error('更新作品錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新作品失敗'
        });
    }
});

// 刪除作品
router.delete('/works/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const data = await readAuthorData();
        const workIndex = data.works.findIndex(work => work.id === id);

        if (workIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '作品不存在'
            });
        }

        data.works.splice(workIndex, 1);
        await writeAuthorData(data);

        res.json({
            success: true,
            message: '作品刪除成功'
        });
    } catch (error) {
        console.error('刪除作品錯誤:', error);
        res.status(500).json({
            success: false,
            message: '刪除作品失敗'
        });
    }
});

// 更新社群連結
router.put('/social', async (req, res) => {
    try {
        const { socialLinks } = req.body;

        const data = await readAuthorData();
        data.socialLinks = socialLinks;

        await writeAuthorData(data);

        res.json({
            success: true,
            message: '社群連結更新成功',
            data: data.socialLinks
        });
    } catch (error) {
        console.error('更新社群連結錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新社群連結失敗'
        });
    }
});

// 更新完整作者數據 (profile + works + socialLinks)
router.put('/', async (req, res) => {
    try {
        const { profile, works, socialLinks } = req.body;

        const data = await readAuthorData();

        // 更新 profile 數據
        if (profile) {
            data.profile = { ...data.profile, ...profile };
        }

        // 更新 works 數據
        if (works) {
            data.works = works;
        }

        // 更新 socialLinks 數據
        if (socialLinks) {
            data.socialLinks = socialLinks;
        }

        await writeAuthorData(data);

        res.json({
            success: true,
            message: '作者資料更新成功',
            data: data
        });
    } catch (error) {
        console.error('更新作者資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新作者資料失敗'
        });
    }
});

module.exports = router;