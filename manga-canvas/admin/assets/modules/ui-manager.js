// UI 管理模組
class UIManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.notifications = [];
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupModals();
        this.setupTooltips();
        this.initNotificationSystem();
    }

    // 設置標籤頁切換
    setupTabSwitching() {
        document.querySelectorAll('[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    }

    // 切換標籤頁
    switchTab(tabName) {
        // 更新導航狀態
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // 切換內容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // 更新頁面標題
        const titles = {
            'dashboard': '控制台',
            'manga': '漫畫管理',
            'upload': '上傳作品',
            'author': '關於作者',
            'homepage': '首頁設定',
            'ads': '廣告橫幅',
            'images': '圖片管理',
            'settings': '系統設定'
        };

        const titleElement = document.getElementById('pageTitle');
        if (titleElement && titles[tabName]) {
            titleElement.textContent = titles[tabName];
        }

        // 記錄當前標籤
        this.currentTab = tabName;

        // 載入對應數據
        this.loadTabData(tabName);
    }

    // 載入標籤數據
    loadTabData(tabName) {
        switch (tabName) {
            case 'manga':
                if (window.mangaManager) {
                    mangaManager.loadMangaList();
                }
                break;
            case 'dashboard':
                this.loadDashboardData();
                break;
            // 其他標籤的數據載入邏輯可以在這裡添加
        }
    }

    // 載入控制台數據
    async loadDashboardData() {
        try {
            const response = await fetch('/api/manga', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const result = await response.json();
                const mangaCount = result.data ? result.data.length : 0;

                const totalMangaElement = document.getElementById('totalManga');
                if (totalMangaElement) {
                    totalMangaElement.textContent = mangaCount;
                }

                // 模擬其他統計數據
                const totalImagesElement = document.getElementById('totalImages');
                if (totalImagesElement) {
                    totalImagesElement.textContent = mangaCount * 15;
                }

                const storageUsedElement = document.getElementById('storageUsed');
                if (storageUsedElement) {
                    storageUsedElement.textContent = (mangaCount * 2.5).toFixed(1);
                }
            }
        } catch (error) {
            console.error('載入控制台數據錯誤:', error);
            this.showNotification('載入控制台數據失敗', 'error');
        }
    }

    // 更新時間顯示
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
        });

        const clockElement = document.getElementById('currentTime');
        if (clockElement) {
            clockElement.textContent = timeString;
        }
    }

    // 設置 Modal 功能
    setupModals() {
        // 關閉 modal 按鈕
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') ||
                e.target.closest('.modal-close')) {
                this.hideModal();
            }

            // 點擊 modal 背景關閉
            if (e.target.classList.contains('modal')) {
                this.hideModal();
            }
        });

        // ESC 鍵關閉 modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    // 顯示 Modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.classList.add('modal-open');

            // 聚焦到 modal 內的第一個輸入欄位
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    // 隱藏 Modal
    hideModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
        document.body.classList.remove('modal-open');
    }

    // 設置工具提示
    setupTooltips() {
        // 使用 Bootstrap tooltips 如果可用
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    // 初始化通知系統
    initNotificationSystem() {
        // 創建通知容器
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'notification-container';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                width: 300px;
            `;
            document.body.appendChild(notificationContainer);
        }
    }

    // 顯示通知
    showNotification(message, type = 'info', duration = 5000) {
        const notificationId = 'notification-' + Date.now();
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `notification notification-${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="uiManager.hideNotification('${notificationId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // 添加樣式
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        // 動畫顯示
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 記錄通知
        this.notifications.push({
            id: notificationId,
            message,
            type,
            timestamp: new Date()
        });

        // 自動隱藏
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notificationId);
            }, duration);
        }

        return notificationId;
    }

    // 隱藏通知
    hideNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }

        // 從記錄中移除
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }

    // 獲取通知顏色
    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    // 顯示確認對話框
    showConfirmDialog(message, onConfirm, onCancel = null) {
        const dialogId = 'confirm-dialog-' + Date.now();
        const dialog = document.createElement('div');
        dialog.id = dialogId;
        dialog.className = 'modal';
        dialog.style.display = 'block';

        dialog.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">確認操作</h5>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="uiManager.hideConfirmDialog('${dialogId}', false)">
                            取消
                        </button>
                        <button type="button" class="btn btn-primary" onclick="uiManager.hideConfirmDialog('${dialogId}', true)">
                            確認
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        document.body.classList.add('modal-open');

        // 綁定確認/取消事件
        dialog.confirmCallback = onConfirm;
        dialog.cancelCallback = onCancel;

        return dialogId;
    }

    // 隱藏確認對話框
    hideConfirmDialog(dialogId, confirmed = false) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            if (confirmed && dialog.confirmCallback) {
                dialog.confirmCallback();
            } else if (!confirmed && dialog.cancelCallback) {
                dialog.cancelCallback();
            }

            dialog.remove();
            document.body.classList.remove('modal-open');
        }
    }

    // 顯示載入狀態
    showLoading(message = '載入中...') {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.innerHTML = `
                <div class="loader-backdrop">
                    <div class="loader-content">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 mb-0">${message}</p>
                    </div>
                </div>
            `;
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    }

    // 隱藏載入狀態
    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // 格式化日期時間
    formatDateTime(date) {
        return new Date(date).toLocaleString('zh-TW');
    }

    // 截斷文字
    truncateText(text, maxLength = 50) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // 獲取當前標籤
    getCurrentTab() {
        return this.currentTab;
    }

    // 刷新當前標籤
    refreshCurrentTab() {
        this.loadTabData(this.currentTab);
    }
}

// 導出單例實例
window.uiManager = new UIManager();