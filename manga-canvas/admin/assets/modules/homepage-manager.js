// 首頁管理模組
class HomepageManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHomepageData();
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 首頁圖片表單提交
        const homepageImageForm = document.getElementById('homepageImageForm');
        if (homepageImageForm) {
            homepageImageForm.addEventListener('submit', (e) => this.saveHomepageImage(e));
        }

        // 圖片上傳預覽
        const homepageImageUpload = document.getElementById('homepageImageUpload');
        if (homepageImageUpload) {
            homepageImageUpload.addEventListener('change', (e) => this.previewHomepageImage(e));
        }
    }

    // 顯示新增首頁圖片模態框
    showAddHomepageImageModal() {
        document.getElementById('homepageImageModalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>新增首頁圖片';
        document.getElementById('homepageImageForm').reset();
        document.getElementById('homepageImageId').value = '';
        document.getElementById('homepageImagePreview').src = '/images/default-cover.jpg';

        const modal = new bootstrap.Modal(document.getElementById('homepageImageModal'));
        modal.show();
    }

    // 編輯首頁圖片
    editHomepageImage(id) {
        const images = this.homepageData?.carousel?.images || [];
        const imageToEdit = images.find(img => img.id === id);

        if (!imageToEdit) {
            this.showMessage('找不到要編輯的圖片', 'error');
            return;
        }

        // 填入表單
        document.getElementById('homepageImageModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>編輯首頁圖片';
        document.getElementById('homepageImageId').value = imageToEdit.id;
        document.getElementById('homepageImageTitle').value = imageToEdit.title || '';
        document.getElementById('homepageImageDescription').value = imageToEdit.description || '';
        document.getElementById('homepageImageAlt').value = imageToEdit.alt || '';
        document.getElementById('homepageImageOrder').value = imageToEdit.order || 1;
        document.getElementById('homepageImagePreview').src = imageToEdit.url || '/images/default-cover.jpg';

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('homepageImageModal'));
        modal.show();
    }

    // 預覽首頁圖片
    previewHomepageImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('homepageImagePreview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // 儲存首頁圖片
    async saveHomepageImage(event) {
        if (event) {
            event.preventDefault();
        }

        const form = document.getElementById('homepageImageForm');
        const formData = new FormData(form);
        const imageId = document.getElementById('homepageImageId').value;

        // 構建圖片資料物件
        const imageData = {
            title: formData.get('title') || '',
            description: formData.get('description') || '',
            alt: formData.get('alt') || '',
            order: parseInt(formData.get('order')) || 1
        };

        // 處理圖片上傳
        const fileInput = document.getElementById('homepageImageUpload');
        if (fileInput.files && fileInput.files[0]) {
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('file', fileInput.files[0]);

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authManager.token}`
                    },
                    body: uploadFormData
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResult.success) {
                    imageData.url = uploadResult.data.url;
                } else {
                    throw new Error(uploadResult.message);
                }
            } catch (error) {
                console.error('上傳圖片失敗:', error);
                this.showMessage('圖片上傳失敗', 'error');
                return;
            }
        }

        try {
            let response;
            if (imageId) {
                // 更新現有圖片
                response = await fetch(`/api/homepage/carousel/images/${imageId}`, {
                    method: 'PUT',
                    headers: authManager.getAuthHeaders(),
                    body: JSON.stringify(imageData)
                });
            } else {
                // 新增圖片
                response = await fetch('/api/homepage/carousel/images', {
                    method: 'POST',
                    headers: authManager.getAuthHeaders(),
                    body: JSON.stringify(imageData)
                });
            }

            const result = await response.json();
            if (result.success) {
                this.showMessage('首頁圖片儲存成功', 'success');
                this.hideModal('homepageImageModal');
                this.loadHomepageData();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('儲存首頁圖片失敗:', error);
            this.showMessage('儲存失敗，請稍後再試', 'error');
        }
    }

    // 載入首頁數據
    async loadHomepageData() {
        try {
            const response = await fetch('/api/homepage/public');
            const result = await response.json();

            if (result.success && result.data) {
                // 存儲完整的首頁資料
                this.homepageData = result.data;

                // 渲染輪播圖片 - 使用正確的路徑
                const carouselImages = result.data.carousel?.images || [];
                this.renderHomepageImages(carouselImages);
            }
        } catch (error) {
            console.error('載入首頁數據失敗:', error);
        }
    }

    // 渲染首頁圖片
    renderHomepageImages(images) {
        const container = document.getElementById('homepageImagesList');
        if (!container) return;

        if (!images || images.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">尚未新增首頁圖片</p>
                    <button class="btn btn-primary" onclick="homepageManager.showAddHomepageImageModal()">
                        <i class="fas fa-plus me-1"></i>新增圖片
                    </button>
                </div>
            `;
            return;
        }

        // 按順序排序圖片
        const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));

        container.innerHTML = sortedImages.map((image, index) => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100" style="border: 2px solid #000; border-radius: 0;">
                    <img src="${image.url || '/images/default-cover.jpg'}"
                         class="card-img-top" alt="${image.title || image.alt || '圖片'}"
                         style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title">${image.title || '未命名圖片'}</h6>
                        <p class="card-text text-muted small flex-grow-1">${image.description || '無描述'}</p>
                        <div class="mb-2">
                            <small class="text-info">排序: ${image.order || 0}</small>
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary flex-fill"
                                    onclick="homepageManager.editHomepageImage('${image.id}')">
                                <i class="fas fa-edit"></i> 編輯
                            </button>
                            <button class="btn btn-sm btn-outline-danger flex-fill"
                                    onclick="homepageManager.deleteHomepageImage('${image.id}')">
                                <i class="fas fa-trash"></i> 刪除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 渲染輪播設定
    renderCarouselSettings(carousel) {
        const settingsContainer = document.getElementById('carouselSettingsContainer');
        if (!settingsContainer) return;

        settingsContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-cog me-2"></i>輪播設定</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="carouselEnabled"
                                       ${carousel.enabled ? 'checked' : ''}>
                                <label class="form-check-label" for="carouselEnabled">
                                    啟用輪播
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="carouselAutoplay"
                                       ${carousel.autoplay ? 'checked' : ''}>
                                <label class="form-check-label" for="carouselAutoplay">
                                    自動播放
                                </label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="carouselSpeed" class="form-label">播放速度 (秒)</label>
                                <input type="number" class="form-control" id="carouselSpeed"
                                       value="${carousel.speed || 3}" min="1" max="10">
                            </div>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" onclick="homepageManager.saveCarouselSettings()">
                            <i class="fas fa-save me-1"></i>儲存設定
                        </button>
                        <button class="btn btn-secondary" onclick="homepageManager.loadHomepageData()">
                            <i class="fas fa-refresh me-1"></i>重新載入
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 儲存輪播設定
    async saveCarouselSettings() {
        const carouselSettings = {
            enabled: document.getElementById('carouselEnabled').checked,
            autoplay: document.getElementById('carouselAutoplay').checked,
            speed: parseInt(document.getElementById('carouselSpeed').value) || 3
        };

        try {
            const response = await fetch('/api/homepage/carousel/settings', {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(carouselSettings)
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage('輪播設定儲存成功', 'success');
                this.loadHomepageData(); // 重新載入資料
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('儲存輪播設定失敗:', error);
            this.showMessage('儲存失敗，請稍後再試', 'error');
        }
    }

    // 刪除首頁圖片
    async deleteHomepageImage(id) {
        if (!confirm('確定要刪除這張圖片嗎？')) {
            return;
        }

        try {
            const response = await fetch(`/api/homepage/carousel/images/${id}`, {
                method: 'DELETE',
                headers: authManager.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage('圖片刪除成功', 'success');
                this.loadHomepageData();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('刪除圖片失敗:', error);
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
window.homepageManager = new HomepageManager();

// 全域函數 - 為了向後兼容
window.showAddHomepageImageModal = function() {
    homepageManager.showAddHomepageImageModal();
};

window.saveHomepageImage = function() {
    homepageManager.saveHomepageImage();
};

window.editHomepageImage = function(id) {
    homepageManager.editHomepageImage(id);
};

window.deleteHomepageImage = function(id) {
    homepageManager.deleteHomepageImage(id);
};