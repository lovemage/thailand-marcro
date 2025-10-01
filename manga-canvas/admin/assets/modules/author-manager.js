// 作者管理模組 - 與前端 about.html 數據結構完全一致
class AuthorManager {
    constructor() {
        this.authorData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAuthorData();
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 作者檔案表單提交
        const authorProfileForm = document.getElementById('authorProfileForm');
        if (authorProfileForm) {
            authorProfileForm.addEventListener('submit', (e) => this.saveAuthorProfile(e));
        }

        // 頭像上傳預覽
        const authorAvatarUpload = document.getElementById('authorAvatarUpload');
        if (authorAvatarUpload) {
            authorAvatarUpload.addEventListener('change', (e) => this.previewAuthorAvatar(e));
        }

        // 作品圖片上傳預覽
        const workImageUpload = document.getElementById('workImageUpload');
        if (workImageUpload) {
            workImageUpload.addEventListener('change', (e) => this.previewWorkImage(e));
        }
    }

    // 載入作者數據
    async loadAuthorData() {
        try {
            const response = await fetch('/api/author/public');
            const result = await response.json();

            if (result.success && result.data) {
                this.authorData = result.data;
                this.populateAuthorForm();
                this.renderWorks();
                this.renderSocialLinks();
                console.log('作者數據載入成功:', this.authorData);
            } else {
                console.log('未載入到作者數據', result);
                this.showMessage('無法載入作者數據', 'warning');
            }
        } catch (error) {
            console.error('載入作者數據失敗:', error);
            this.showMessage('載入作者數據失敗', 'error');
        }
    }

    // 填入作者表單
    populateAuthorForm() {
        if (!this.authorData || !this.authorData.profile) {
            console.log('無作者檔案數據');
            return;
        }

        const profile = this.authorData.profile;

        // 基本信息
        this.setInputValue('authorName', profile.name);
        this.setInputValue('authorAge', profile.age);
        this.setInputValue('authorTitle', profile.title);

        // 處理介紹 - 是一個字符串數組
        if (profile.introduction && Array.isArray(profile.introduction)) {
            const introText = profile.introduction.join('\n\n');
            this.setInputValue('authorIntroduction', introText);
        }

        // 頭像
        if (profile.image) {
            const avatarPreview = document.getElementById('authorAvatarPreview');
            if (avatarPreview) {
                avatarPreview.src = profile.image;
            }
        }

        console.log('作者檔案表單已填入:', profile);
    }

    // 設置輸入值的輔助函數
    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    }

    // 預覽作者頭像
    previewAuthorAvatar(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('authorAvatarPreview');
                if (preview) {
                    preview.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // 預覽作品圖片
    previewWorkImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('workImagePreview');
                if (preview) {
                    preview.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // 儲存作者檔案
    async saveAuthorProfile(event) {
        if (event) {
            event.preventDefault();
        }

        const form = document.getElementById('authorProfileForm');
        const formData = new FormData(form);

        // 構建與前端一致的數據結構
        const profile = {
            name: formData.get('name') || '',
            age: parseInt(formData.get('age')) || 23,
            title: formData.get('title') || '',
            introduction: (formData.get('introduction') || '').split('\n\n').filter(p => p.trim())
        };

        // 處理頭像上傳
        const avatarFile = formData.get('avatar');
        if (avatarFile && avatarFile.size > 0) {
            try {
                profile.image = await this.uploadFile(avatarFile);
            } catch (error) {
                this.showMessage('頭像上傳失敗', 'error');
                return;
            }
        } else if (this.authorData && this.authorData.profile && this.authorData.profile.image) {
            // 保持現有頭像
            profile.image = this.authorData.profile.image;
        }

        // 完整的作者數據結構
        const authorData = {
            profile: profile,
            works: this.authorData ? this.authorData.works : [],
            socialLinks: this.authorData ? this.authorData.socialLinks : []
        };

        try {
            const response = await fetch('/api/author', {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(authorData)
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage('作者檔案更新成功', 'success');
                this.loadAuthorData(); // 重新載入以獲取最新數據
            } else {
                this.showMessage(result.message || '更新失敗', 'error');
            }
        } catch (error) {
            console.error('儲存作者檔案失敗:', error);
            this.showMessage('儲存失敗，請稍後再試', 'error');
        }
    }

    // 渲染社交媒體連結
    renderSocialLinks() {
        if (!this.authorData || !this.authorData.socialLinks) return;

        const container = document.getElementById('socialLinksContainer');
        if (!container) return;

        const socialLinks = this.authorData.socialLinks;

        container.innerHTML = socialLinks.map((link, index) => `
            <div class="row mb-3" data-social-index="${index}">
                <div class="col-md-3">
                    <select class="form-control" name="socialPlatform">
                        <option value="facebook" ${link.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
                        <option value="twitter" ${link.platform === 'twitter' ? 'selected' : ''}>Twitter</option>
                        <option value="instagram" ${link.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                        <option value="github" ${link.platform === 'github' ? 'selected' : ''}>GitHub</option>
                        <option value="pinterest" ${link.platform === 'pinterest' ? 'selected' : ''}>Pinterest</option>
                        <option value="forrst" ${link.platform === 'forrst' ? 'selected' : ''}>Forrst</option>
                    </select>
                </div>
                <div class="col-md-7">
                    <input type="url" class="form-control" name="socialUrl" value="${link.url}"
                           placeholder="社交媒體連結 URL">
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-sm btn-outline-danger"
                            onclick="authorManager.removeSocialLink(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // 添加新增按鈕
        const addButton = document.createElement('div');
        addButton.className = 'text-center mt-3';
        addButton.innerHTML = `
            <button type="button" class="btn btn-outline-primary" onclick="authorManager.addSocialLink()">
                <i class="fas fa-plus me-1"></i>新增社交媒體
            </button>
        `;
        container.appendChild(addButton);
    }

    // 渲染作品列表
    renderWorks() {
        if (!this.authorData || !this.authorData.works) return;

        const container = document.getElementById('authorWorksList');
        if (!container) return;

        const works = this.authorData.works;

        if (works.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">尚未新增作品</p>
                    <button class="btn btn-primary" onclick="authorManager.showWorkModal()">
                        <i class="fas fa-plus me-1"></i>新增作品
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>作品列表 (${works.length})</h5>
                <button class="btn btn-primary btn-sm" onclick="authorManager.showWorkModal()">
                    <i class="fas fa-plus me-1"></i>新增作品
                </button>
            </div>
            <div class="row">
                ${works.map((work, index) => `
                    <div class="col-md-4 mb-3">
                        <div class="card" style="border: 2px solid #000; border-radius: 0;">
                            <img src="${work.image || '/images/default-cover.jpg'}"
                                 class="card-img-top" alt="${work.title}"
                                 style="height: 200px; object-fit: cover;">
                            <div class="card-body">
                                <h6 class="card-title">${work.title || '未命名作品'}</h6>
                                <p class="card-text text-muted small">${work.description || '無描述'}</p>
                                <p class="card-text text-muted small">
                                    <i class="fas fa-link"></i> ${work.link || '無連結'}
                                </p>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-outline-primary"
                                            onclick="authorManager.editWork('${work.id}')">
                                        <i class="fas fa-edit"></i> 編輯
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger"
                                            onclick="authorManager.deleteWork('${work.id}')">
                                        <i class="fas fa-trash"></i> 刪除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 顯示作品模態框
    showWorkModal(workId = null) {
        const modal = document.getElementById('workModal');
        const form = document.getElementById('workForm');

        if (workId && this.authorData && this.authorData.works) {
            // 編輯模式
            const work = this.authorData.works.find(w => w.id === workId);
            if (work) {
                document.getElementById('workModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>編輯作品';
                document.getElementById('workId').value = work.id;
                document.getElementById('workTitle').value = work.title || '';
                document.getElementById('workDescription').value = work.description || '';
                document.getElementById('workLink').value = work.link || '';

                const preview = document.getElementById('workImagePreview');
                if (preview && work.image) {
                    preview.src = work.image;
                }
            }
        } else {
            // 新增模式
            document.getElementById('workModalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>新增作品';
            form.reset();
            document.getElementById('workId').value = '';
            document.getElementById('workImagePreview').src = '/images/default-cover.jpg';
        }

        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    // 編輯作品
    editWork(id) {
        this.showWorkModal(id);
    }

    // 刪除作品
    async deleteWork(id) {
        if (!confirm('確定要刪除這個作品嗎？')) {
            return;
        }

        if (!this.authorData || !this.authorData.works) return;

        // 從作品數組中移除
        this.authorData.works = this.authorData.works.filter(work => work.id !== id);

        try {
            const response = await fetch('/api/author', {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(this.authorData)
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage('作品刪除成功', 'success');
                this.renderWorks();
            } else {
                this.showMessage(result.message, 'error');
                this.loadAuthorData(); // 重新載入以恢復數據
            }
        } catch (error) {
            console.error('刪除作品失敗:', error);
            this.showMessage('刪除失敗，請稍後再試', 'error');
            this.loadAuthorData(); // 重新載入以恢復數據
        }
    }

    // 儲存作品
    async saveWork() {
        const form = document.getElementById('workForm');
        const formData = new FormData(form);
        const workId = document.getElementById('workId').value;

        const workData = {
            id: workId || 'work' + Date.now(),
            title: formData.get('title'),
            description: formData.get('description'),
            link: formData.get('link')
        };

        // 處理圖片上傳
        const imageFile = formData.get('image');
        if (imageFile && imageFile.size > 0) {
            try {
                workData.image = await this.uploadFile(imageFile);
            } catch (error) {
                this.showMessage('圖片上傳失敗', 'error');
                return;
            }
        } else if (workId) {
            // 編輯模式，保持現有圖片
            const existingWork = this.authorData.works.find(w => w.id === workId);
            if (existingWork && existingWork.image) {
                workData.image = existingWork.image;
            }
        }

        if (!this.authorData) {
            this.authorData = { profile: {}, works: [], socialLinks: [] };
        }
        if (!this.authorData.works) {
            this.authorData.works = [];
        }

        if (workId) {
            // 編輯現有作品
            const index = this.authorData.works.findIndex(w => w.id === workId);
            if (index !== -1) {
                this.authorData.works[index] = workData;
            }
        } else {
            // 新增作品
            this.authorData.works.push(workData);
        }

        try {
            const response = await fetch('/api/author', {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(this.authorData)
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage('作品儲存成功', 'success');
                this.hideModal('workModal');
                this.renderWorks();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('儲存作品失敗:', error);
            this.showMessage('儲存失敗，請稍後再試', 'error');
        }
    }

    // 上傳文件
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authManager.token}`
                },
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                return result.data.url;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('文件上傳失敗:', error);
            throw error;
        }
    }

    // 隱藏模態框
    hideModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) {
            modal.hide();
        }
    }

    // 重置作者表單
    resetAuthorForm() {
        const form = document.getElementById('authorProfileForm');
        if (form) {
            form.reset();

            // 重置頭像預覽
            const avatarPreview = document.getElementById('authorAvatarPreview');
            if (avatarPreview) {
                avatarPreview.src = '/images/default-avatar.jpg';
            }

            this.showMessage('表單已重置', 'info');
        }
    }

    // 顯示訊息
    showMessage(message, type = 'info') {
        if (window.uiManager) {
            uiManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            // 簡單的 alert 作為後備
            if (type === 'error') {
                alert('錯誤: ' + message);
            } else if (type === 'success') {
                alert('成功: ' + message);
            }
        }
    }
}

// 導出單例實例
window.authorManager = new AuthorManager();

// 全域函數 - 為了向後兼容
window.loadAuthorData = function() {
    authorManager.loadAuthorData();
};

window.saveAuthorProfile = function(event) {
    authorManager.saveAuthorProfile(event);
};

window.showWorkModal = function(workId = null) {
    authorManager.showWorkModal(workId);
};

window.saveWork = function() {
    authorManager.saveWork();
};

window.editWork = function(id) {
    authorManager.editWork(id);
};

window.deleteWork = function(id) {
    authorManager.deleteWork(id);
};