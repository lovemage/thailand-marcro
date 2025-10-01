// 廣告管理模組
class AdsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAdsData();
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 廣告表單提交
        const adsSlideForm = document.getElementById('adsSlideForm');
        if (adsSlideForm) {
            adsSlideForm.addEventListener('submit', (e) => this.saveAdsSlide(e));
        }

        // 廣告圖片上傳預覽
        const adsImageUpload = document.getElementById('adsSlideMainImageUpload');
        if (adsImageUpload) {
            adsImageUpload.addEventListener('change', (e) => this.previewAdsImage(e));
        }
    }

    // 載入廣告數據
    async loadAdsData() {
        try {
            const response = await fetch('/api/ads/public');
            const result = await response.json();

            if (result.success && result.data) {
                this.adsData = result.data;
                this.renderAdsSlides(result.data.heroSlides || []);
            }
        } catch (error) {
            console.error('載入廣告數據失敗:', error);
        }
    }

    // 顯示新增廣告模態框
    showAddAdsSlideModal() {
        document.getElementById('adsSlideModalTitle').innerHTML = '<i class="fas fa-bullhorn me-2"></i>新增廣告橫幅';
        document.getElementById('adsSlideForm').reset();
        document.getElementById('adsSlideId').value = '';
        document.getElementById('adsSlideMainImagePreview').src = '';
        document.getElementById('adsSlideMainImagePreview').classList.add('d-none');

        const modal = new bootstrap.Modal(document.getElementById('adsSlideModal'));
        modal.show();
    }

    // 編輯廣告
    editAdsSlide(id) {
        // 實現編輯功能
        console.log('編輯廣告:', id);
        // TODO: 實現從 API 載入廣告數據並填入表單
    }

    // 預覽廣告圖片
    previewAdsImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('adsSlideMainImagePreview');
                preview.src = e.target.result;
                preview.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        }
    }

    // 儲存廣告
    async saveAdsSlide(event) {
        if (event) {
            event.preventDefault();
        }

        const form = document.getElementById('adsSlideForm');
        const formData = new FormData(form);
        const slideId = document.getElementById('adsSlideId').value;

        try {
            let response;
            if (slideId) {
                // 更新現有廣告
                response = await fetch(`/api/ads/slides/${slideId}`, {
                    method: 'PUT',
                    headers: authManager.getAuthHeaders(),
                    body: JSON.stringify(Object.fromEntries(formData))
                });
            } else {
                // 新增廣告
                response = await fetch('/api/ads/slides', {
                    method: 'POST',
                    headers: authManager.getAuthHeaders(),
                    body: JSON.stringify(Object.fromEntries(formData))
                });
            }

            const result = await response.json();
            if (result.success) {
                this.showMessage('廣告儲存成功', 'success');
                this.hideModal('adsSlideModal');
                this.loadAdsData();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('儲存廣告失敗:', error);
            this.showMessage('儲存失敗，請稍後再試', 'error');
        }
    }

    // 渲染廣告列表
    renderAdsSlides(slides) {
        const container = document.getElementById('adsSlidesList');
        if (!container) return;

        if (!slides || slides.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">尚未新增廣告橫幅</p>
                    <button class="btn btn-primary" onclick="adsManager.showAddAdsSlideModal()">
                        <i class="fas fa-plus me-1"></i>新增廣告
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = slides.map((slide, index) => `
            <div class="col-md-6 mb-3">
                <div class="card" style="border: 2px solid #000; border-radius: 0;">
                    <img src="${slide.image || '/images/default-cover.jpg'}"
                         class="card-img-top" alt="${slide.title}"
                         style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h6 class="card-title">${slide.title || '未命名廣告'}</h6>
                        <p class="card-text text-muted small">${slide.description || '無描述'}</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary"
                                    onclick="adsManager.editAdsSlide('${slide.id}')">
                                <i class="fas fa-edit"></i> 編輯
                            </button>
                            <button class="btn btn-sm btn-outline-danger"
                                    onclick="adsManager.deleteAdsSlide('${slide.id}')">
                                <i class="fas fa-trash"></i> 刪除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 刪除廣告
    async deleteAdsSlide(id) {
        if (!confirm('確定要刪除這個廣告嗎？')) {
            return;
        }

        try {
            const response = await fetch(`/api/ads/slides/${id}`, {
                method: 'DELETE',
                headers: authManager.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage('廣告刪除成功', 'success');
                this.loadAdsData();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('刪除廣告失敗:', error);
            this.showMessage('刪除失敗，請稍後再試', 'error');
        }
    }

    // 隱藏模態框
    hideModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) {
            modal.hide();
        }
    }

    // 顯示訊息
    showMessage(message, type = 'info') {
        if (window.uiManager) {
            uiManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// 導出單例實例
window.adsManager = new AdsManager();

// 全域函數 - 為了向後兼容
window.loadAdsData = function() {
    adsManager.loadAdsData();
};

window.showAddAdsSlideModal = function() {
    adsManager.showAddAdsSlideModal();
};

window.saveAdsSlide = function() {
    adsManager.saveAdsSlide();
};

window.editAdsSlide = function(id) {
    adsManager.editAdsSlide(id);
};

window.deleteAdsSlide = function(id) {
    adsManager.deleteAdsSlide(id);
};