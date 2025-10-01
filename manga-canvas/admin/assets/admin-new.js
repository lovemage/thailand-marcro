// 模組化管理系統主控制器
class AdminPanel {
    constructor() {
        this.modules = {};
        this.init();
    }

    async init() {
        // 等待所有模組載入
        await this.waitForModules();

        // 初始化模組
        this.initializeModules();

        // 檢查認證
        await this.checkAuth();

        // 設置基本事件監聽器
        this.setupEventListeners();

        // 開始時鐘更新
        this.startClock();

        // 載入初始數據
        this.loadInitialData();
    }

    // 等待模組載入
    async waitForModules() {
        const maxWaitTime = 5000; // 5秒超時
        const startTime = Date.now();

        while (!window.authManager || !window.uiManager || !window.fileManager || !window.homepageManager || !window.mangaManager) {
            if (Date.now() - startTime > maxWaitTime) {
                throw new Error('模組載入超時');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // 初始化模組
    initializeModules() {
        this.modules = {
            auth: window.authManager,
            ui: window.uiManager,
            file: window.fileManager,
            homepage: window.homepageManager,
            manga: window.mangaManager
        };

        // 初始化檔案管理模組的拖拽功能
        this.modules.file.initDragAndDrop();

        console.log('所有模組初始化完成');
    }

    // 檢查認證狀態
    async checkAuth() {
        const isAuthenticated = await this.modules.auth.checkAuth();
        if (!isAuthenticated) {
            console.error('認證失敗，重定向到登入頁面');
            return false;
        }
        return true;
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 檔案上傳事件
        this.setupFileUploadEvents();

        // 表單提交事件
        this.setupFormEvents();

        // 登出按鈕
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.modules.ui.showConfirmDialog(
                    '確定要登出嗎？',
                    () => this.modules.auth.logout()
                );
            });
        }

        // 全局錯誤處理
        window.addEventListener('error', (e) => {
            console.error('全局錯誤:', e.error);
            this.modules.ui.showNotification('系統發生錯誤', 'error');
        });
    }

    // 設置檔案上傳事件
    setupFileUploadEvents() {
        // 封面圖片上傳
        const coverUpload = document.getElementById('coverUpload');
        if (coverUpload) {
            coverUpload.addEventListener('change', (e) => {
                this.modules.file.handleFileSelect(e, 'cover');
            });
        }

        // 漫畫頁面上傳
        const pagesUpload = document.getElementById('pagesUpload');
        if (pagesUpload) {
            pagesUpload.addEventListener('change', (e) => {
                this.modules.file.handleFileSelect(e, 'pages');
            });
        }
    }

    // 設置表單事件
    setupFormEvents() {
        // 漫畫上傳表單
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleMangaUpload(e);
            });
        }

        // 漫畫管理表單
        const mangaForm = document.getElementById('mangaForm');
        if (mangaForm) {
            mangaForm.addEventListener('submit', (e) => {
                this.modules.manga.handleMangaSubmit(e);
            });
        }
    }

    // 處理漫畫上傳
    async handleMangaUpload(event) {
        const formData = new FormData(event.target);
        const title = formData.get('title');
        const description = formData.get('description');
        const category = formData.get('category');
        const status = formData.get('status');

        if (!title?.trim()) {
            this.modules.ui.showNotification('請填寫作品標題', 'warning');
            return;
        }

        try {
            this.modules.ui.showLoading('正在上傳作品...');

            // 上傳封面圖片
            let coverUrl = null;
            const coverInput = document.getElementById('coverUpload');
            if (coverInput?.files[0]) {
                coverUrl = await this.modules.file.uploadCoverImage();
            }

            // 上傳漫畫頁面
            let pageUrls = [];
            const pagesInput = document.getElementById('pagesUpload');
            if (pagesInput?.files.length > 0) {
                pageUrls = await this.modules.file.uploadMangaPages();
            }

            // 創建漫畫數據
            const mangaData = {
                title: title.trim(),
                description: description?.trim() || '',
                category: category || 'general',
                status: status || '連載中',
                coverImage: coverUrl,
                pages: pageUrls
            };

            // 保存到後端
            const response = await fetch('/api/manga', {
                method: 'POST',
                headers: this.modules.auth.getAuthHeaders(),
                body: JSON.stringify(mangaData)
            });

            const result = await response.json();

            if (result.success) {
                this.modules.ui.showNotification('作品上傳成功！', 'success');
                this.modules.file.resetUploadState();
                this.modules.ui.switchTab('manga'); // 切換到漫畫管理頁面
            } else {
                throw new Error(result.message || '上傳失敗');
            }

        } catch (error) {
            console.error('上傳作品錯誤:', error);
            this.modules.ui.showNotification('上傳失敗: ' + error.message, 'error');
        } finally {
            this.modules.ui.hideLoading();
        }
    }

    // 開始時鐘更新
    startClock() {
        this.modules.ui.updateClock();
        setInterval(() => this.modules.ui.updateClock(), 60000);
    }

    // 載入初始數據
    loadInitialData() {
        // 載入控制台數據
        this.modules.ui.loadDashboardData();
    }

    // 公開方法供模板使用
    switchTab(tab) {
        this.modules.ui.switchTab(tab);
    }

    logout() {
        this.modules.auth.logout();
    }

    showNotification(message, type = 'info') {
        this.modules.ui.showNotification(message, type);
    }

    showConfirmDialog(message, onConfirm, onCancel) {
        return this.modules.ui.showConfirmDialog(message, onConfirm, onCancel);
    }

    // 模組存取器
    get auth() { return this.modules.auth; }
    get ui() { return this.modules.ui; }
    get file() { return this.modules.file; }
    get manga() { return this.modules.manga; }
}

// 錯誤處理
class AdminErrorHandler {
    static handle(error, context = '') {
        console.error(`Admin Error [${context}]:`, error);

        if (window.admin?.ui) {
            admin.ui.showNotification(
                `${context ? context + ': ' : ''}${error.message || '未知錯誤'}`,
                'error'
            );
        }
    }
}

// 全局變數和初始化
let admin = null;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        admin = new AdminPanel();
        window.admin = admin; // 全局存取

        console.log('管理系統初始化完成');
    } catch (error) {
        AdminErrorHandler.handle(error, '系統初始化');
    }
});

// 導出供全局使用
window.AdminPanel = AdminPanel;
window.AdminErrorHandler = AdminErrorHandler;