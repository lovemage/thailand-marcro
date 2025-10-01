const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// 配置 Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// 本地存儲配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允許上傳圖片文件 (JPEG, JPG, PNG, GIF, WebP)'));
        }
    }
});

// 上傳圖片到本地
router.post('/local', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '請選擇要上傳的圖片'
            });
        }

        // 將文件移動到 images 目錄
        const originalPath = req.file.path;
        const newFileName = req.file.filename;
        const newPath = path.join(__dirname, '../../images', newFileName);

        await fs.copyFile(originalPath, newPath);
        await fs.unlink(originalPath); // 刪除臨時文件

        res.json({
            success: true,
            message: '圖片上傳成功',
            data: {
                filename: newFileName,
                originalname: req.file.originalname,
                url: `/images/${newFileName}`,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('本地上傳錯誤:', error);
        res.status(500).json({
            success: false,
            message: '上傳失敗: ' + error.message
        });
    }
});

// 上傳圖片到 Cloudinary
router.post('/cloudinary', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '請選擇要上傳的圖片'
            });
        }

        // 檢查 Cloudinary 是否已配置
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return res.status(500).json({
                success: false,
                message: 'Cloudinary 尚未配置，請檢查環境變數'
            });
        }

        // 上傳到 Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'tji-studio',
            public_id: `manga-${Date.now()}`,
            transformation: [
                { width: 800, height: 1200, crop: 'limit' },
                { quality: 'auto' },
                { format: 'auto' }
            ]
        });

        // 刪除本地臨時文件
        await fs.unlink(req.file.path);

        res.json({
            success: true,
            message: '圖片上傳成功',
            data: {
                public_id: result.public_id,
                url: result.secure_url,
                originalname: req.file.originalname,
                size: result.bytes,
                width: result.width,
                height: result.height
            }
        });
    } catch (error) {
        console.error('Cloudinary 上傳錯誤:', error);
        res.status(500).json({
            success: false,
            message: '上傳失敗: ' + error.message
        });
    }
});

// 批量上傳漫畫頁面
router.post('/manga-pages', upload.array('pages', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請選擇要上傳的漫畫頁面'
            });
        }

        const results = [];

        for (const file of req.files) {
            try {
                let uploadResult;

                if (process.env.CLOUDINARY_CLOUD_NAME) {
                    // 上傳到 Cloudinary
                    uploadResult = await cloudinary.uploader.upload(file.path, {
                        folder: 'tji-studio/manga-pages',
                        public_id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        transformation: [
                            { width: 1000, height: 1500, crop: 'limit' },
                            { quality: 'auto' },
                            { format: 'auto' }
                        ]
                    });

                    results.push({
                        originalname: file.originalname,
                        public_id: uploadResult.public_id,
                        url: uploadResult.secure_url,
                        size: uploadResult.bytes
                    });

                    await fs.unlink(file.path); // 刪除本地臨時文件
                } else {
                    // 本地存儲
                    const newFileName = file.filename;
                    const newPath = path.join(__dirname, '../../images', newFileName);

                    await fs.copyFile(file.path, newPath);
                    await fs.unlink(file.path);

                    results.push({
                        originalname: file.originalname,
                        filename: newFileName,
                        url: `/images/${newFileName}`,
                        size: file.size
                    });
                }
            } catch (fileError) {
                console.error(`上傳文件 ${file.originalname} 失敗:`, fileError);
                results.push({
                    originalname: file.originalname,
                    error: fileError.message
                });
            }
        }

        res.json({
            success: true,
            message: `成功上傳 ${results.filter(r => !r.error).length} 個文件`,
            data: results
        });
    } catch (error) {
        console.error('批量上傳錯誤:', error);
        res.status(500).json({
            success: false,
            message: '批量上傳失敗: ' + error.message
        });
    }
});

// 多檔案上傳到 Cloudinary
router.post('/multiple-cloudinary', upload.array('images', 4), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請選擇要上傳的圖片文件'
            });
        }

        // 檢查是否配置了 Cloudinary
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Cloudinary 未配置'
            });
        }

        const uploadPromises = req.files.map(async (file) => {
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'manga-canvas/hero-slides',
                    transformation: [
                        { width: 800, height: 600, crop: 'fit' }
                    ]
                });

                // 刪除臨時文件
                await fs.unlink(file.path);

                return {
                    url: result.secure_url,
                    publicId: result.public_id,
                    originalName: file.originalname
                };
            } catch (error) {
                console.error(`上傳圖片 ${file.originalname} 錯誤:`, error);

                // 刪除臨時文件
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('刪除臨時文件錯誤:', unlinkError);
                }

                return {
                    error: error.message,
                    originalName: file.originalname
                };
            }
        });

        const results = await Promise.all(uploadPromises);

        const successUploads = results.filter(result => !result.error);
        const failedUploads = results.filter(result => result.error);

        res.json({
            success: true,
            message: `成功上傳 ${successUploads.length} 張圖片${failedUploads.length > 0 ? `，${failedUploads.length} 張失敗` : ''}`,
            data: results
        });

    } catch (error) {
        console.error('多檔案上傳錯誤:', error);

        // 清理可能的臨時文件
        if (req.files) {
            req.files.forEach(async (file) => {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('清理臨時文件錯誤:', unlinkError);
                }
            });
        }

        res.status(500).json({
            success: false,
            message: '多檔案上傳失敗: ' + error.message
        });
    }
});

// 通用上傳端點 - 自動選擇 Cloudinary 或本地存儲
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '請選擇要上傳的圖片'
            });
        }

        let uploadResult;

        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            // 上傳到 Cloudinary
            uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'tji-studio',
                public_id: `manga-${Date.now()}`,
                transformation: [
                    { width: 800, height: 1200, crop: 'limit' },
                    { quality: 'auto' },
                    { format: 'auto' }
                ]
            });

            // 刪除本地臨時文件
            await fs.unlink(req.file.path);

            res.json({
                success: true,
                message: '圖片上傳成功',
                data: {
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                    originalname: req.file.originalname,
                    size: uploadResult.bytes,
                    width: uploadResult.width,
                    height: uploadResult.height
                }
            });
        } else {
            // 本地存儲
            const originalPath = req.file.path;
            const newFileName = req.file.filename;
            const newPath = path.join(__dirname, '../../images', newFileName);

            await fs.copyFile(originalPath, newPath);
            await fs.unlink(originalPath); // 刪除臨時文件

            res.json({
                success: true,
                message: '圖片上傳成功',
                data: {
                    filename: newFileName,
                    originalname: req.file.originalname,
                    url: `/images/${newFileName}`,
                    size: req.file.size
                }
            });
        }
    } catch (error) {
        console.error('上傳錯誤:', error);

        // 清理臨時文件
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('清理臨時文件錯誤:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: '上傳失敗: ' + error.message
        });
    }
});

module.exports = router;