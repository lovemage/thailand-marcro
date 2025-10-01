// 管理系統主要功能
class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.uploadedFiles = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.updateClock();
        this.loadDashboardData();

        // 每分鐘更新時間
        setInterval(() => this.updateClock(), 60000);
    }

    // 檢查認證狀態
    checkAuth() {
        if (!this.token) {
            window.location.href = '/admin/index.html';
            return;
        }

        // 驗證 token
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                this.logout();
            } else {
                document.getElementById('userName').textContent = result.user.username;
            }
        })
        .catch(() => this.logout());
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 導航標籤切換
        document.querySelectorAll('[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // 上傳表單
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        }

        // 檔案上傳
        const coverUpload = document.getElementById('coverUpload');
        const pagesUpload = document.getElementById('pagesUpload');

        if (coverUpload) {
            coverUpload.addEventListener('change', (e) => this.handleFileSelect(e, 'cover'));
        }

        if (pagesUpload) {
            pagesUpload.addEventListener('change', (e) => this.handleFileSelect(e, 'pages'));
        }

        // 拖拽上傳
        document.querySelectorAll('.upload-area').forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });

            area.addEventListener('dragleave', () => {
                area.classList.remove('dragover');
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const input = area.onclick.toString().includes('coverUpload') ?
                        document.getElementById('coverUpload') :
                        document.getElementById('pagesUpload');

                    input.files = files;
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                }
            });
        });
    }

    // 切換標籤頁
    switchTab(tabName) {
        // 更新導航狀態
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 切換內容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

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
        document.getElementById('pageTitle').textContent = titles[tabName];

        // 載入對應數據
        if (tabName === 'manga') {
            this.loadMangaList();
        } else if (tabName === 'author') {
            this.loadAuthorData();
        } else if (tabName === 'homepage') {
            this.loadHomepageData();
        } else if (tabName === 'ads') {
            this.loadAdsData();
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
        document.getElementById('currentTime').textContent = timeString;
    }

    // 載入控制台數據
    async loadDashboardData() {
        try {
            const response = await fetch('/api/manga', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const mangaCount = result.data ? result.data.length : 0;

                document.getElementById('totalManga').textContent = mangaCount;

                // 模擬其他統計數據
                document.getElementById('totalImages').textContent = mangaCount * 15;
                document.getElementById('storageUsed').textContent = (mangaCount * 2.5).toFixed(1);
            }
        } catch (error) {
            console.error('載入控制台數據錯誤:', error);
        }
    }

    // 載入漫畫列表
    async loadMangaList() {
        try {
            const response = await fetch('/api/manga', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.renderMangaList(result.data);
            } else {
                this.showAlert('載入漫畫列表失敗', 'danger');
            }
        } catch (error) {
            console.error('載入漫畫列表錯誤:', error);
            this.showAlert('載入漫畫列表失敗', 'danger');
        }
    }

    // 渲染漫畫列表
    renderMangaList(mangaList) {
        const container = document.getElementById('mangaList');

        if (!mangaList || mangaList.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-book fa-3x text-muted mb-3"></i>
                    <p class="text-muted">尚無漫畫作品</p>
                    <button class="btn btn-upload" onclick="admin.switchTab('upload')">
                        <i class="fas fa-plus me-1"></i>新增作品
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = mangaList.map(manga => `
            <div class="manga-item">
                <img src="${manga.coverImage || '/images/default-cover.jpg'}" alt="${manga.title}" onerror="this.src='/images/default-cover.jpg'">
                <div class="content">
                    <div class="title">${manga.title}</div>
                    <small class="text-muted">${manga.category || '一般'}</small>
                    <div class="actions">
                        <button class="btn btn-primary btn-sm-custom" onclick="admin.editManga('${manga.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm-custom" onclick="admin.deleteManga('${manga.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 處理文件選擇
    handleFileSelect(event, type) {
        const files = Array.from(event.target.files);

        if (type === 'cover') {
            if (files.length > 0) {
                this.previewCoverImage(files[0]);
            }
        } else if (type === 'pages') {
            this.previewPages(files);
        }
    }

    // 預覽封面圖片
    previewCoverImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const uploadArea = document.querySelector('#coverUpload').parentElement.querySelector('.upload-area');
            uploadArea.innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 10px;">
                <p class="text-muted mt-2 mb-0">${file.name}</p>
            `;
        };
        reader.readAsDataURL(file);
    }

    // 預覽漫畫頁面
    previewPages(files) {
        const previewContainer = document.getElementById('uploadPreview');
        previewContainer.innerHTML = '';

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="頁面 ${index + 1}">
                    <button class="remove-btn" onclick="admin.removePreview(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });

        this.uploadedFiles = files;
    }

    // 移除預覽
    removePreview(index) {
        const filesArray = Array.from(this.uploadedFiles);
        filesArray.splice(index, 1);

        // 更新文件輸入
        const dt = new DataTransfer();
        filesArray.forEach(file => dt.items.add(file));
        document.getElementById('pagesUpload').files = dt.files;

        // 重新預覽
        this.previewPages(filesArray);
    }

    // 處理上傳
    async handleUpload(event) {
        event.preventDefault();

        const formData = new FormData();
        const title = document.getElementById('mangaTitle').value;
        const description = document.getElementById('mangaDescription').value;
        const category = document.getElementById('mangaCategory').value;
        const status = document.getElementById('mangaStatus').value;

        if (!title.trim()) {
            this.showAlert('請填寫作品標題', 'warning');
            return;
        }

        const coverFile = document.getElementById('coverUpload').files[0];
        const pageFiles = document.getElementById('pagesUpload').files;

        try {
            let coverUrl = '';

            // 上傳封面圖片
            if (coverFile) {
                const coverFormData = new FormData();
                coverFormData.append('image', coverFile);

                const coverResponse = await fetch('/api/upload/cloudinary', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: coverFormData
                });

                const coverResult = await coverResponse.json();
                if (coverResult.success) {
                    coverUrl = coverResult.data.url;
                } else {
                    throw new Error(coverResult.message || '封面上傳失敗');
                }
            }

            // 上傳漫畫頁面
            let pageUrls = [];
            if (pageFiles.length > 0) {
                const pagesFormData = new FormData();
                Array.from(pageFiles).forEach(file => {
                    pagesFormData.append('pages', file);
                });

                const pagesResponse = await fetch('/api/upload/manga-pages', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: pagesFormData
                });

                const pagesResult = await pagesResponse.json();
                if (pagesResult.success) {
                    pageUrls = pagesResult.data.filter(item => !item.error).map(item => item.url);
                }
            }

            // 建立漫畫記錄
            const mangaData = {
                title,
                description,
                category,
                status,
                coverImage: coverUrl,
                pages: pageUrls
            };

            const mangaResponse = await fetch('/api/manga', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(mangaData)
            });

            const mangaResult = await mangaResponse.json();

            if (mangaResult.success) {
                this.showAlert('作品上傳成功！', 'success');
                this.resetUploadForm();
                this.loadDashboardData(); // 更新統計數據
            } else {
                throw new Error(mangaResult.message || '作品建立失敗');
            }

        } catch (error) {
            console.error('上傳錯誤:', error);
            this.showAlert('上傳失敗: ' + error.message, 'danger');
        }
    }

    // 重置上傳表單
    resetUploadForm() {
        document.getElementById('uploadForm').reset();
        document.getElementById('uploadPreview').innerHTML = '';

        // 重置上傳區域
        document.querySelectorAll('.upload-area').forEach(area => {
            const isImages = area.innerHTML.includes('fa-images');
            area.innerHTML = `
                <i class="fas fa-${isImages ? 'images' : 'cloud-upload-alt'} fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">${isImages ? '選擇漫畫頁面文件' : '點擊選擇封面圖片'}</p>
                <small class="text-muted">${isImages ? '支援多選，按頁面順序選擇' : '或拖拽文件到此處'}</small>
            `;
        });

        this.uploadedFiles = [];
    }

    // 編輯漫畫
    editManga(id) {
        // TODO: 實作編輯功能
        this.showAlert('編輯功能開發中...', 'info');
    }

    // 刪除漫畫
    async deleteManga(id) {
        if (!confirm('確定要刪除這個作品嗎？此操作無法復原。')) {
            return;
        }

        try {
            const response = await fetch(`/api/manga/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('作品刪除成功', 'success');
                this.loadMangaList();
                this.loadDashboardData();
            } else {
                this.showAlert(result.message || '刪除失敗', 'danger');
            }
        } catch (error) {
            console.error('刪除錯誤:', error);
            this.showAlert('刪除失敗', 'danger');
        }
    }

    // 顯示訊息
    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show position-fixed"
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' :
                              type === 'danger' ? 'exclamation-triangle' :
                              type === 'warning' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHtml);

        // 3秒後自動移除
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            if (alerts.length > 0) {
                alerts[alerts.length - 1].remove();
            }
        }, 3000);
    }

    // 登出
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/admin/index.html';
    }

    // === 作者管理相關方法 ===

    // 載入作者資料
    async loadAuthorData() {
        try {
            const response = await fetch('/api/author', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.populateAuthorForm(result.data);
                this.renderAuthorWorks(result.data.works);
            } else {
                this.showAlert('載入作者資料失敗', 'danger');
            }
        } catch (error) {
            console.error('載入作者資料錯誤:', error);
            this.showAlert('載入作者資料失敗', 'danger');
        }
    }

    // 填充作者表單
    populateAuthorForm(data) {
        document.getElementById('authorName').value = data.profile.name;
        document.getElementById('authorAge').value = data.profile.age;
        document.getElementById('authorTitle').value = data.profile.title;
        document.getElementById('authorImage').src = data.profile.image;

        // 清空並重新填充介紹段落
        const editor = document.getElementById('introductionEditor');
        editor.innerHTML = '';

        data.profile.introduction.forEach(paragraph => {
            this.addIntroductionParagraph(paragraph);
        });
    }

    // 新增介紹段落
    addIntroductionParagraph(content = '') {
        const editor = document.getElementById('introductionEditor');
        const paragraphDiv = document.createElement('div');
        paragraphDiv.className = 'introduction-paragraph mb-2';
        paragraphDiv.innerHTML = `
            <textarea class="form-control mb-1" rows="3" placeholder="請輸入段落內容...">${content}</textarea>
            <button type="button" class="btn btn-sm btn-danger" onclick="admin.removeIntroductionParagraph(this)">
                <i class="fas fa-trash"></i> 刪除段落
            </button>
        `;
        editor.appendChild(paragraphDiv);
    }

    // 移除介紹段落
    removeIntroductionParagraph(button) {
        const paragraphDiv = button.parentElement;
        paragraphDiv.remove();
    }

    // 重置作者表單
    resetAuthorForm() {
        this.loadAuthorData();
    }

    // 儲存作者資訊
    async saveAuthorProfile(event) {
        if (event) event.preventDefault();

        try {
            const formData = new FormData(document.getElementById('authorProfileForm'));

            // 收集介紹段落
            const introductionParagraphs = [];
            document.querySelectorAll('.introduction-paragraph textarea').forEach(textarea => {
                if (textarea.value.trim()) {
                    introductionParagraphs.push(textarea.value.trim());
                }
            });

            const profileData = {
                name: formData.get('name'),
                age: parseInt(formData.get('age')),
                title: formData.get('title'),
                introduction: introductionParagraphs
            };

            const response = await fetch('/api/author/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('作者資訊更新成功！', 'success');
            } else {
                this.showAlert(result.message || '更新失敗', 'danger');
            }
        } catch (error) {
            console.error('更新作者資訊錯誤:', error);
            this.showAlert('更新失敗', 'danger');
        }
    }

    // 上傳作者頭像
    async uploadAuthorImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload/cloudinary', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // 更新作者頭像
                const updateResponse = await fetch('/api/author/profile/image', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ image: result.data.url })
                });

                const updateResult = await updateResponse.json();

                if (updateResult.success) {
                    document.getElementById('authorImage').src = result.data.url;
                    this.showAlert('頭像更新成功！', 'success');
                } else {
                    this.showAlert('頭像更新失敗', 'danger');
                }
            } else {
                this.showAlert('圖片上傳失敗', 'danger');
            }
        } catch (error) {
            console.error('上傳頭像錯誤:', error);
            this.showAlert('上傳失敗', 'danger');
        }
    }

    // 渲染作者作品列表
    renderAuthorWorks(works) {
        const container = document.getElementById('authorWorksList');

        if (!works || works.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-palette fa-3x text-muted mb-3"></i>
                    <p class="text-muted">尚無作品</p>
                    <button class="btn btn-primary" onclick="admin.showAddWorkModal()">
                        <i class="fas fa-plus me-1"></i>新增作品
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = works.map(work => `
            <div class="col-md-2 mb-3">
                <div class="card" style="border: 2px solid #000; border-radius: 0;">
                    <img src="${work.image}" alt="${work.title}" style="height: 150px; object-fit: cover; border-bottom: 2px solid #000;">
                    <div class="card-body p-2">
                        <h6 class="card-title mb-1" style="font-size: 0.8rem;">${work.title}</h6>
                        <p class="card-text text-muted" style="font-size: 0.7rem;">${work.description || ''}</p>
                        <div class="d-flex gap-1">
                            <button class="btn btn-primary btn-sm" style="font-size: 0.7rem;" onclick="admin.editWork('${work.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" style="font-size: 0.7rem;" onclick="admin.deleteWork('${work.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 顯示新增作品模態視窗
    showAddWorkModal() {
        document.getElementById('workModalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>新增作品';
        document.getElementById('workForm').reset();
        document.getElementById('workId').value = '';
        document.getElementById('workImagePreview').src = '/images/default-cover.jpg';

        const modal = new bootstrap.Modal(document.getElementById('workModal'));
        modal.show();
    }

    // 編輯作品
    async editWork(workId) {
        try {
            const response = await fetch('/api/author', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const work = result.data.works.find(w => w.id === workId);
                if (work) {
                    document.getElementById('workModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>編輯作品';
                    document.getElementById('workId').value = work.id;
                    document.getElementById('workTitle').value = work.title;
                    document.getElementById('workDescription').value = work.description || '';
                    document.getElementById('workLink').value = work.link || '';
                    document.getElementById('workImagePreview').src = work.image;

                    const modal = new bootstrap.Modal(document.getElementById('workModal'));
                    modal.show();
                }
            }
        } catch (error) {
            console.error('載入作品資料錯誤:', error);
            this.showAlert('載入作品資料失敗', 'danger');
        }
    }

    // 儲存作品
    async saveWork() {
        try {
            const workId = document.getElementById('workId').value;
            const title = document.getElementById('workTitle').value;
            const description = document.getElementById('workDescription').value;
            const link = document.getElementById('workLink').value;

            if (!title.trim()) {
                this.showAlert('請填寫作品標題', 'warning');
                return;
            }

            let imageUrl = document.getElementById('workImagePreview').src;
            const imageFile = document.getElementById('workImageUpload').files[0];

            // 如果有新圖片，先上傳
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);

                const uploadResponse = await fetch('/api/upload/cloudinary', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: formData
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResult.success) {
                    imageUrl = uploadResult.data.url;
                } else {
                    throw new Error('圖片上傳失敗');
                }
            }

            const workData = {
                title,
                description,
                link: link || '/article.html',
                image: imageUrl
            };

            let response;
            if (workId) {
                // 更新作品
                response = await fetch(`/api/author/works/${workId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(workData)
                });
            } else {
                // 新增作品
                response = await fetch('/api/author/works', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(workData)
                });
            }

            const result = await response.json();

            if (result.success) {
                this.showAlert(workId ? '作品更新成功！' : '作品新增成功！', 'success');

                // 關閉模態視窗
                const modal = bootstrap.Modal.getInstance(document.getElementById('workModal'));
                modal.hide();

                // 重新載入作品列表
                this.loadAuthorData();
            } else {
                this.showAlert(result.message || '操作失敗', 'danger');
            }
        } catch (error) {
            console.error('儲存作品錯誤:', error);
            this.showAlert('儲存失敗: ' + error.message, 'danger');
        }
    }

    // 刪除作品
    async deleteWork(workId) {
        if (!confirm('確定要刪除這個作品嗎？此操作無法復原。')) {
            return;
        }

        try {
            const response = await fetch(`/api/author/works/${workId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('作品刪除成功', 'success');
                this.loadAuthorData();
            } else {
                this.showAlert(result.message || '刪除失敗', 'danger');
            }
        } catch (error) {
            console.error('刪除作品錯誤:', error);
            this.showAlert('刪除失敗', 'danger');
        }
    }

    // === 首頁管理相關方法 ===

    // 載入首頁數據
    async loadHomepageData() {
        try {
            const response = await fetch('/api/homepage', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.populateHomepageForm(result.data);
                this.renderHomepageImages(result.data.carousel.images);
            } else {
                this.showAlert('載入首頁資料失敗', 'danger');
            }
        } catch (error) {
            console.error('載入首頁資料錯誤:', error);
            this.showAlert('載入首頁資料失敗', 'danger');
        }
    }

    // 填充首頁表單
    populateHomepageForm(data) {
        document.getElementById('carouselEnabled').checked = data.carousel.enabled;
        document.getElementById('carouselAutoplay').checked = data.carousel.autoplay;
        document.getElementById('carouselSpeed').value = data.carousel.speed;
    }

    // 儲存輪播設定
    async saveCarouselSettings(event) {
        if (event) event.preventDefault();

        try {
            const enabled = document.getElementById('carouselEnabled').checked;
            const autoplay = document.getElementById('carouselAutoplay').checked;
            const speed = parseInt(document.getElementById('carouselSpeed').value);

            const response = await fetch('/api/homepage/carousel', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ enabled, autoplay, speed })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('輪播設定更新成功！', 'success');
            } else {
                this.showAlert(result.message || '更新失敗', 'danger');
            }
        } catch (error) {
            console.error('更新輪播設定錯誤:', error);
            this.showAlert('更新失敗', 'danger');
        }
    }

    // 渲染首頁圖片列表
    renderHomepageImages(images) {
        const container = document.getElementById('homepageImagesList');

        if (!images || images.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-images fa-3x text-muted mb-3"></i>
                    <p class="text-muted">尚無輪播圖片</p>
                    <button class="btn btn-primary" onclick="admin.showAddHomepageImageModal()">
                        <i class="fas fa-plus me-1"></i>新增圖片
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = images.map((image, index) => `
            <div class="col-md-4 mb-3">
                <div class="card" style="border: 2px solid #000; border-radius: 0;">
                    <img src="${image.url}" alt="${image.alt}" style="height: 200px; object-fit: cover; border-bottom: 2px solid #000;">
                    <div class="card-body p-2">
                        <h6 class="card-title mb-1">${image.title}</h6>
                        <p class="card-text text-muted small">${image.description || ''}</p>
                        <small class="text-muted">順序: ${image.order}</small>
                        <div class="d-flex gap-1 mt-2">
                            <button class="btn btn-primary btn-sm" onclick="admin.editHomepageImage('${image.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="admin.deleteHomepageImage('${image.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                            ${index > 0 ? `<button class="btn btn-secondary btn-sm" onclick="admin.moveHomepageImage('${image.id}', 'up')"><i class="fas fa-arrow-up"></i></button>` : ''}
                            ${index < images.length - 1 ? `<button class="btn btn-secondary btn-sm" onclick="admin.moveHomepageImage('${image.id}', 'down')"><i class="fas fa-arrow-down"></i></button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 顯示新增首頁圖片模態視窗
    showAddHomepageImageModal() {
        document.getElementById('homepageImageModalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>新增首頁圖片';
        document.getElementById('homepageImageForm').reset();
        document.getElementById('homepageImageId').value = '';
        document.getElementById('homepageImagePreview').src = '/images/default-cover.jpg';

        const modal = new bootstrap.Modal(document.getElementById('homepageImageModal'));
        modal.show();
    }

    // 編輯首頁圖片
    async editHomepageImage(imageId) {
        try {
            const response = await fetch('/api/homepage', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const image = result.data.carousel.images.find(img => img.id === imageId);
                if (image) {
                    document.getElementById('homepageImageModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>編輯首頁圖片';
                    document.getElementById('homepageImageId').value = image.id;
                    document.getElementById('homepageImageTitle').value = image.title;
                    document.getElementById('homepageImageDescription').value = image.description || '';
                    document.getElementById('homepageImageAlt').value = image.alt;
                    document.getElementById('homepageImagePreview').src = image.url;

                    const modal = new bootstrap.Modal(document.getElementById('homepageImageModal'));
                    modal.show();
                }
            }
        } catch (error) {
            console.error('載入圖片資料錯誤:', error);
            this.showAlert('載入圖片資料失敗', 'danger');
        }
    }

    // 儲存首頁圖片
    async saveHomepageImage() {
        try {
            const imageId = document.getElementById('homepageImageId').value;
            const title = document.getElementById('homepageImageTitle').value;
            const description = document.getElementById('homepageImageDescription').value;
            const alt = document.getElementById('homepageImageAlt').value;


            let imageUrl = document.getElementById('homepageImagePreview').src;
            const imageFile = document.getElementById('homepageImageUpload').files[0];

            // 如果有新圖片，先檢查橫向比例並上傳
            if (imageFile) {
                // 檢查圖片比例 - 支援16:10, 16:9, 4:3等常用橫向比例
                const isValidRatio = await this.checkImageRatio(imageFile);
                if (!isValidRatio) {
                    this.showAlert('請上傳橫向比例的圖片（支援16:10、16:9、4:3等常用比例）', 'warning');
                    return;
                }

                const formData = new FormData();
                formData.append('image', imageFile);

                const uploadResponse = await fetch('/api/upload/cloudinary', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: formData
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResult.success) {
                    imageUrl = uploadResult.data.url;
                } else {
                    throw new Error('圖片上傳失敗');
                }
            }

            const imageData = {
                url: imageUrl,
                alt: alt || title || '輪播圖片',
                title: title || '',
                description: description || ''
            };

            let response;
            if (imageId) {
                // 更新圖片
                response = await fetch(`/api/homepage/carousel/images/${imageId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(imageData)
                });
            } else {
                // 新增圖片
                response = await fetch('/api/homepage/carousel/images', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(imageData)
                });
            }

            const result = await response.json();

            if (result.success) {
                this.showAlert(imageId ? '圖片更新成功！' : '圖片新增成功！', 'success');

                // 關閉模態視窗
                const modal = bootstrap.Modal.getInstance(document.getElementById('homepageImageModal'));
                modal.hide();

                // 重新載入圖片列表
                this.loadHomepageData();
            } else {
                this.showAlert(result.message || '操作失敗', 'danger');
            }
        } catch (error) {
            console.error('儲存圖片錯誤:', error);
            this.showAlert('儲存失敗: ' + error.message, 'danger');
        }
    }

    // 檢查圖片比例 - 支援多種常用橫向比例
    checkImageRatio(file, tolerance = 0.15) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;

                // 常用橫向比例列表
                const validRatios = [
                    16/10,  // 1.6 (16:10)
                    16/9,   // 1.78 (16:9)
                    4/3,    // 1.33 (4:3)
                    3/2,    // 1.5 (3:2)
                    5/3,    // 1.67 (5:3)
                    2/1,    // 2.0 (2:1)
                ];

                // 檢查是否為橫向 (寬度 >= 高度)
                if (ratio < 1) {
                    resolve(false); // 直向圖片不接受
                    return;
                }

                // 檢查是否符合任一常用比例
                const isValid = validRatios.some(validRatio =>
                    Math.abs(ratio - validRatio) <= tolerance
                );

                resolve(isValid);
            };
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(file);
        });
    }

    // 刪除首頁圖片
    async deleteHomepageImage(imageId) {
        if (!confirm('確定要刪除這張圖片嗎？此操作無法復原。')) {
            return;
        }

        try {
            const response = await fetch(`/api/homepage/carousel/images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('圖片刪除成功', 'success');
                this.loadHomepageData();
            } else {
                this.showAlert(result.message || '刪除失敗', 'danger');
            }
        } catch (error) {
            console.error('刪除圖片錯誤:', error);
            this.showAlert('刪除失敗', 'danger');
        }
    }

    // 移動首頁圖片順序
    async moveHomepageImage(imageId, direction) {
        try {
            // 先取得目前資料
            const response = await fetch('/api/homepage', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const images = result.data.carousel.images;
                const imageIndex = images.findIndex(img => img.id === imageId);

                if (imageIndex !== -1) {
                    const newImages = [...images];
                    const targetIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;

                    if (targetIndex >= 0 && targetIndex < newImages.length) {
                        // 交換位置
                        [newImages[imageIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[imageIndex]];

                        // 更新order
                        const imageOrders = newImages.map((img, index) => ({
                            id: img.id,
                            order: index + 1
                        }));

                        const reorderResponse = await fetch('/api/homepage/carousel/images/reorder', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify({ imageOrders })
                        });

                        const reorderResult = await reorderResponse.json();

                        if (reorderResult.success) {
                            this.showAlert('順序更新成功', 'success');
                            this.loadHomepageData();
                        } else {
                            this.showAlert('順序更新失敗', 'danger');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('移動圖片錯誤:', error);
            this.showAlert('操作失敗', 'danger');
        }
    }

    // === 廣告頁設定相關方法 ===

    // 載入廣告頁數據
    async loadAdsData() {
        try {
            console.log('正在載入廣告橫幅資料...');

            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            // 載入廣告橫幅資料
            const adsResponse = await fetch('/api/ads', {
                headers: headers
            });
            const adsResult = await adsResponse.json();

            // 載入頁面標題資料
            const comicsResponse = await fetch('/api/comics', {
                headers: headers
            });
            const comicsResult = await comicsResponse.json();

            console.log('廣告橫幅: API回應狀態:', adsResponse.status);
            console.log('標題設定: API回應狀態:', comicsResponse.status);

            if (adsResult.success) {
                this.populateAdsForm(adsResult.data);
                this.renderHeroSlides(adsResult.data.heroSlides || []);
            }

            if (comicsResult.success && comicsResult.data.heroTitle) {
                this.populateComicsHeroTitle(comicsResult.data.heroTitle);
            }

            this.showAlert('廣告橫幅資料載入成功', 'success');
        } catch (error) {
            console.error('載入廣告橫幅資料錯誤:', error);
            this.showAlert('載入廣告橫幅資料失敗: ' + error.message, 'danger');
        }
    }

    // 填充廣告頁表單
    populateAdsForm(data) {
        try {
            console.log('正在填充廣告頁表單:', data);

            const adsHeroEnabled = document.getElementById('adsHeroEnabled');
            const adsAutoplay = document.getElementById('adsAutoplay');
            const adsSpeed = document.getElementById('adsSpeed');

            if (adsHeroEnabled) adsHeroEnabled.checked = data.heroCarousel.enabled;
            if (adsAutoplay) adsAutoplay.checked = data.heroCarousel.autoplay;
            if (adsSpeed) adsSpeed.value = data.heroCarousel.speed;

            console.log('表單填充完成');
        } catch (error) {
            console.error('填充表單錯誤:', error);
        }
    }

    // 儲存Hero輪播設定
    async saveHeroCarouselSettings(event) {
        if (event) event.preventDefault();

        try {
            const enabled = document.getElementById('adsHeroEnabled').checked;
            const autoplay = document.getElementById('adsAutoplay').checked;
            const speed = parseInt(document.getElementById('adsSpeed').value);

            const response = await fetch('/api/ads/hero-carousel', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ enabled, autoplay, speed })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Hero輪播設定更新成功！', 'success');
            } else {
                this.showAlert(result.message || '更新失敗', 'danger');
            }
        } catch (error) {
            console.error('更新Hero輪播設定錯誤:', error);
            this.showAlert('更新失敗', 'danger');
        }
    }

    // 渲染Hero輪播列表
    renderHeroSlides(slides) {
        console.log('正在渲染Hero輪播:', slides);
        const container = document.getElementById('adsSlidesList');
        console.log('容器元素:', container);

        if (!slides || slides.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-play-circle fa-3x text-muted mb-3"></i>
                    <p class="text-muted">尚無廣告橫幅</p>
                    <button class="btn btn-primary" onclick="admin.showAddAdsSlideModal()">
                        <i class="fas fa-plus me-1"></i>新增廣告橫幅
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = slides.map((slide, index) => `
            <div class="col-md-6 mb-4">
                <div class="card" style="border: 2px solid #000; border-radius: 0;">
                    <div class="position-relative">
                        <img src="${slide.mainImage}" alt="${slide.title}" style="height: 200px; width: 100%; object-fit: cover; border-bottom: 2px solid #000;">
                        <div class="position-absolute top-0 start-0 m-2">
                            <span class="badge bg-primary">#${index + 1}</span>
                            ${slide.badge ? `<span class="badge bg-secondary ms-1">${slide.badge}</span>` : ''}
                        </div>
                    </div>
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${slide.title}</h6>
                            <div class="rating-stars small">
                                ${this.generateStars(slide.rating)}
                            </div>
                        </div>
                        <p class="text-muted small mb-2">${slide.subtitle || ''}</p>
                        <p class="card-text small">${slide.description.substring(0, 100)}${slide.description.length > 100 ? '...' : ''}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="text-muted small">
                                作者: ${slide.author}
                                ${slide.price ? `| ${slide.price}` : ''}
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-primary btn-sm" onclick="admin.editAdsSlide('${slide.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="admin.deleteAdsSlide('${slide.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ${index > 0 ? `<button class="btn btn-secondary btn-sm" onclick="admin.moveAdsSlide('${slide.id}', 'up')"><i class="fas fa-arrow-up"></i></button>` : ''}
                                ${index < slides.length - 1 ? `<button class="btn btn-secondary btn-sm" onclick="admin.moveAdsSlide('${slide.id}', 'down')"><i class="fas fa-arrow-down"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 生成星星評分
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star text-warning"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star text-warning"></i>';
        }

        return stars;
    }

    // 顯示新增Hero輪播模態視窗
    showAddHeroSlideModal() {
        document.getElementById('heroSlideModalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>新增Hero輪播';
        document.getElementById('heroSlideForm').reset();
        document.getElementById('heroSlideId').value = '';
        document.getElementById('heroSlideMainImagePreview').src = '';
        document.getElementById('heroSlideMainImagePreview').classList.add('d-none');
        document.getElementById('heroSlideSideImagesPreview').innerHTML = '';

        const modal = new bootstrap.Modal(document.getElementById('heroSlideModal'));
        modal.show();
    }

    // 編輯Hero輪播
    async editHeroSlide(slideId) {
        try {
            const response = await fetch('/api/ads', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const slide = result.data.heroSlides.find(s => s.id === slideId);
                if (slide) {
                    document.getElementById('heroSlideModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>編輯Hero輪播';

                    // 填充表單
                    document.getElementById('heroSlideId').value = slide.id;
                    document.getElementById('heroSlideTitle').value = slide.title;
                    document.getElementById('heroSlideSubtitle').value = slide.subtitle || '';
                    document.getElementById('heroSlideBadge').value = slide.badge || '';
                    document.getElementById('heroSlideDescription').value = slide.description || '';
                    document.getElementById('heroSlideAuthor').value = slide.author || '';
                    document.getElementById('heroSlidePrice').value = slide.price || '';
                    document.getElementById('heroSlideOriginalPrice').value = slide.originalPrice || '';
                    document.getElementById('heroSlideRating').value = slide.rating || 5;
                    document.getElementById('heroSlideButtonText').value = slide.buttonText || '查看作品';
                    document.getElementById('heroSlideButtonLink').value = slide.buttonLink || '#';

                    // 顯示主圖
                    if (slide.mainImage) {
                        document.getElementById('heroSlideMainImagePreview').src = slide.mainImage;
                        document.getElementById('heroSlideMainImagePreview').classList.remove('d-none');
                    }

                    // 顯示側邊圖片
                    const sideImagesPreview = document.getElementById('heroSlideSideImagesPreview');
                    if (slide.sideImages && slide.sideImages.length > 0) {
                        sideImagesPreview.innerHTML = '';
                        slide.sideImages.forEach((imageUrl, index) => {
                            const previewItem = document.createElement('div');
                            previewItem.className = 'preview-item d-inline-block me-2 mb-2';
                            previewItem.innerHTML = `
                                <img src="${imageUrl}" alt="側邊圖片${index + 1}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 2px solid #000;">
                                <small class="d-block text-center text-muted">${index + 1}</small>
                            `;
                            sideImagesPreview.appendChild(previewItem);
                        });
                    } else {
                        sideImagesPreview.innerHTML = '<small class="text-muted">尚未上傳側邊圖片</small>';
                    }

                    // 卡片設定
                    document.getElementById('heroSlideCardEnabled').checked = slide.cardEnabled || false;
                    document.getElementById('heroSlideCardTitle').value = slide.cardTitle || '';
                    document.getElementById('heroSlideCardContent').value = slide.cardContent || '';

                    const modal = new bootstrap.Modal(document.getElementById('heroSlideModal'));
                    modal.show();
                }
            }
        } catch (error) {
            console.error('載入Hero輪播資料錯誤:', error);
            this.showAlert('載入Hero輪播資料失敗', 'danger');
        }
    }

    // 儲存Hero輪播
    async saveHeroSlide() {
        try {
            const slideId = document.getElementById('heroSlideId').value;
            const title = document.getElementById('heroSlideTitle').value;
            const subtitle = document.getElementById('heroSlideSubtitle').value;
            const badge = document.getElementById('heroSlideBadge').value;
            const description = document.getElementById('heroSlideDescription').value;
            const author = document.getElementById('heroSlideAuthor').value;
            const price = document.getElementById('heroSlidePrice').value;
            const originalPrice = document.getElementById('heroSlideOriginalPrice').value;
            const rating = parseFloat(document.getElementById('heroSlideRating').value);
            const buttonText = document.getElementById('heroSlideButtonText').value;
            const buttonLink = document.getElementById('heroSlideButtonLink').value;

            if (!title.trim()) {
                this.showAlert('請填寫作品標題', 'warning');
                return;
            }

            // 處理主圖上傳
            let mainImageUrl = '';
            const mainImageFile = document.getElementById('heroSlideMainImageUpload').files[0];
            if (mainImageFile) {
                const formData = new FormData();
                formData.append('image', mainImageFile);

                const uploadResponse = await fetch('/api/upload/cloudinary', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: formData
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResult.success) {
                    mainImageUrl = uploadResult.data.url;
                } else {
                    throw new Error('主圖上傳失敗');
                }
            } else if (!slideId) {
                this.showAlert('請上傳主要圖片', 'warning');
                return;
            }

            // 處理側邊圖片上傳
            let sideImages = [];
            const sideImageFiles = document.getElementById('heroSlideSideImagesUpload').files;
            if (sideImageFiles.length > 0) {
                const sideFormData = new FormData();
                Array.from(sideImageFiles).forEach(file => {
                    sideFormData.append('images', file);
                });

                const sideUploadResponse = await fetch('/api/upload/multiple-cloudinary', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: sideFormData
                });

                const sideUploadResult = await sideUploadResponse.json();
                if (sideUploadResult.success) {
                    sideImages = sideUploadResult.data.filter(item => !item.error).map(item => item.url);
                }
            }

            const slideData = {
                title,
                subtitle,
                badge,
                description,
                author,
                price,
                originalPrice,
                rating,
                buttonText,
                buttonLink,
                cardEnabled: document.getElementById('heroSlideCardEnabled').checked,
                cardTitle: document.getElementById('heroSlideCardTitle').value,
                cardContent: document.getElementById('heroSlideCardContent').value
            };

            if (mainImageUrl) slideData.mainImage = mainImageUrl;
            if (sideImages.length > 0) slideData.sideImages = sideImages;

            // 如果是更新模式且沒有上傳新的側邊圖片，保留現有圖片
            if (slideId && sideImages.length === 0) {
                // 獲取現有的側邊圖片
                try {
                    const currentResponse = await fetch('/api/ads', {
                        headers: { 'Authorization': `Bearer ${this.token}` }
                    });
                    const currentResult = await currentResponse.json();
                    if (currentResult.success) {
                        const currentSlide = currentResult.data.heroSlides.find(s => s.id === slideId);
                        if (currentSlide && currentSlide.sideImages) {
                            slideData.sideImages = currentSlide.sideImages;
                        }
                    }
                } catch (error) {
                    console.log('無法獲取現有側邊圖片:', error);
                }
            }

            let response;
            if (slideId) {
                // 更新
                response = await fetch(`/api/ads/hero-slides/${slideId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(slideData)
                });
            } else {
                // 新增
                response = await fetch('/api/ads/hero-slides', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(slideData)
                });
            }

            const result = await response.json();

            if (result.success) {
                this.showAlert(slideId ? 'Hero輪播更新成功！' : 'Hero輪播新增成功！', 'success');

                // 關閉模態視窗
                const modal = bootstrap.Modal.getInstance(document.getElementById('heroSlideModal'));
                modal.hide();

                // 重新載入列表
                this.loadAdsData();
            } else {
                this.showAlert(result.message || '操作失敗', 'danger');
            }
        } catch (error) {
            console.error('儲存Hero輪播錯誤:', error);
            this.showAlert('儲存失敗: ' + error.message, 'danger');
        }
    }

    // 刪除Hero輪播
    async deleteHeroSlide(slideId) {
        if (!confirm('確定要刪除這個Hero輪播嗎？此操作無法復原。')) {
            return;
        }

        try {
            const response = await fetch(`/api/ads/hero-slides/${slideId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Hero輪播刪除成功', 'success');
                this.loadAdsData();
            } else {
                this.showAlert(result.message || '刪除失敗', 'danger');
            }
        } catch (error) {
            console.error('刪除Hero輪播錯誤:', error);
            this.showAlert('刪除失敗', 'danger');
        }
    }

    // 移動Hero輪播順序
    async moveHeroSlide(slideId, direction) {
        try {
            const response = await fetch('/api/ads', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const slides = result.data.heroSlides;
                const slideIndex = slides.findIndex(s => s.id === slideId);

                if (slideIndex !== -1) {
                    const newSlides = [...slides];
                    const targetIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;

                    if (targetIndex >= 0 && targetIndex < newSlides.length) {
                        [newSlides[slideIndex], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[slideIndex]];

                        const slideOrders = newSlides.map((slide, index) => ({
                            id: slide.id,
                            order: index + 1
                        }));

                        const reorderResponse = await fetch('/api/ads/hero-slides/reorder', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify({ slideOrders })
                        });

                        const reorderResult = await reorderResponse.json();

                        if (reorderResult.success) {
                            this.showAlert('順序更新成功', 'success');
                            this.loadAdsData();
                        } else {
                            this.showAlert('順序更新失敗', 'danger');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('移動Hero輪播錯誤:', error);
            this.showAlert('操作失敗', 'danger');
        }
    }

    // 填充標題設定表單
    populateComicsHeroTitle(heroTitle) {
        try {
            console.log('正在填充標題設定:', heroTitle);

            const titleInput = document.getElementById('comicsHeroTitle');
            const descInput = document.getElementById('comicsHeroDescription');

            if (titleInput) titleInput.value = heroTitle.title || '';
            if (descInput) descInput.value = heroTitle.description || '';

            console.log('標題設定填充完成');
        } catch (error) {
            console.error('填充標題設定錯誤:', error);
        }
    }


    // === 漫畫頁管理相關方法 ===

    // 載入漫畫頁設定數據
    async loadComicsPageData() {
        try {
            console.log('正在載入漫畫頁設定數據...');

            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch('/api/comics', {
                headers: headers
            });

            console.log('漫畫頁設定: API回應狀態:', response.status);
            const result = await response.json();
            console.log('漫畫頁設定: API回應資料:', result);

            if (result.success) {
                this.populateComicsPageForm(result.data);
                this.renderComicsPageSlides(result.data.hero?.slides || []);
                this.showAlert('漫畫頁設定資料載入成功', 'success');
            } else {
                this.showAlert('載入漫畫頁設定資料失敗: ' + (result.message || '未知錯誤'), 'danger');
            }
        } catch (error) {
            console.error('載入漫畫頁設定資料錯誤:', error);
            this.showAlert('載入漫畫頁設定資料失敗: ' + error.message, 'danger');
        }
    }

    // 填充漫畫頁設定表單
    populateComicsPageForm(data) {
        try {
            console.log('正在填充漫畫頁設定表單:', data);

            // 填充標題設定
            if (data.heroTitle) {
                const titleInput = document.getElementById('comicsHeroTitle');
                const descInput = document.getElementById('comicsHeroDescription');

                if (titleInput) titleInput.value = data.heroTitle.title || '';
                if (descInput) descInput.value = data.heroTitle.description || '';
            }

            // 填充輪播設定
            if (data.hero) {
                const heroEnabled = document.getElementById('comicsHeroEnabled');
                const autoplay = document.getElementById('comicsAutoplay');
                const speed = document.getElementById('comicsSpeed');

                if (heroEnabled) heroEnabled.checked = data.hero.enabled;
                if (autoplay) autoplay.checked = data.hero.autoplay;
                if (speed) speed.value = data.hero.speed;
            }

            console.log('漫畫頁設定表單填充完成');
        } catch (error) {
            console.error('填充漫畫頁設定表單錯誤:', error);
        }
    }

    // 儲存漫畫頁標題設定
    async saveComicsHeroTitle(event) {
        if (event) event.preventDefault();

        try {
            const title = document.getElementById('comicsHeroTitle').value;
            const description = document.getElementById('comicsHeroDescription').value;

            const response = await fetch('/api/comics/hero/title', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ title, description })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('標題設定更新成功！', 'success');
            } else {
                this.showAlert(result.message || '更新失敗', 'danger');
            }
        } catch (error) {
            console.error('更新標題設定錯誤:', error);
            this.showAlert('更新失敗', 'danger');
        }
    }

    // 儲存漫畫頁輪播設定
    async saveComicsHeroSettings(event) {
        if (event) event.preventDefault();

        try {
            const enabled = document.getElementById('comicsHeroEnabled').checked;
            const autoplay = document.getElementById('comicsAutoplay').checked;
            const speed = parseInt(document.getElementById('comicsSpeed').value);

            const response = await fetch('/api/comics/hero', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ enabled, autoplay, speed })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('輪播設定更新成功！', 'success');
            } else {
                this.showAlert(result.message || '更新失敗', 'danger');
            }
        } catch (error) {
            console.error('更新輪播設定錯誤:', error);
            this.showAlert('更新失敗', 'danger');
        }
    }

    // 渲染漫畫頁輪播列表
    renderComicsPageSlides(slides) {
        console.log('正在渲染漫畫頁輪播:', slides);
        const container = document.getElementById('comicsSlidesList');

        if (!container) {
            console.error('找不到漫畫頁輪播列表容器');
            return;
        }

        if (!slides || slides.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-play-circle fa-3x text-muted mb-3"></i>
                    <p class="text-muted">尚無 Hero 輪播</p>
                    <button class="btn btn-primary" onclick="admin.showAddComicsSlideModal()">
                        <i class="fas fa-plus me-1"></i>新增輪播
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = slides.map((slide, index) => `
            <div class="col-md-6 mb-4">
                <div class="card" style="border: 2px solid #000; border-radius: 0;">
                    <div class="position-relative">
                        <img src="${slide.mainImage}" alt="${slide.title}" style="height: 200px; width: 100%; object-fit: cover; border-bottom: 2px solid #000;">
                        <div class="position-absolute top-0 start-0 m-2">
                            <span class="badge bg-primary">#${index + 1}</span>
                            ${slide.badge ? `<span class="badge bg-secondary ms-1">${slide.badge}</span>` : ''}
                        </div>
                    </div>
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${slide.title}</h6>
                            <div class="rating-stars small">
                                ${this.generateStars(slide.rating)}
                            </div>
                        </div>
                        <p class="text-muted small mb-2">${slide.subtitle || ''}</p>
                        <p class="card-text small">${slide.description.substring(0, 100)}${slide.description.length > 100 ? '...' : ''}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="text-muted small">
                                作者: ${slide.author}
                                ${slide.price ? `| ${slide.price}` : ''}
                            </div>
                            <div class="btn-group">
                                <button class="btn btn-primary btn-sm" onclick="admin.editComicsSlide('${slide.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="admin.deleteComicsSlide('${slide.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ${index > 0 ? `<button class="btn btn-secondary btn-sm" onclick="admin.moveComicsSlide('${slide.id}', 'up')"><i class="fas fa-arrow-up"></i></button>` : ''}
                                ${index < slides.length - 1 ? `<button class="btn btn-secondary btn-sm" onclick="admin.moveComicsSlide('${slide.id}', 'down')"><i class="fas fa-arrow-down"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 顯示新增漫畫頁輪播模態視窗（先簡化實現）
    showAddComicsSlideModal() {
        this.showAlert('漫畫頁輪播編輯功能開發中...', 'info');
    }

    // 編輯漫畫頁輪播（先簡化實現）
    editComicsSlide(slideId) {
        this.showAlert('漫畫頁輪播編輯功能開發中...', 'info');
    }

    // 刪除漫畫頁輪播（先簡化實現）
    deleteComicsSlide(slideId) {
        this.showAlert('漫畫頁輪播刪除功能開發中...', 'info');
    }

    // 移動漫畫頁輪播順序（先簡化實現）
    moveComicsSlide(slideId, direction) {
        this.showAlert('漫畫頁輪播排序功能開發中...', 'info');
    }

    // === 漫畫頁設定相關方法 ===

    // 載入漫畫頁數據
    async loadComicsData() {
        try {
            console.log('正在載入漫畫頁資料...');

            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch('/api/comics', {
                method: 'GET',
                headers: headers
            });

            console.log('漫畫頁: API響應狀態:', response.status);

            const result = await response.json();
            console.log('漫畫頁: API回應資料:', result);

            if (result.success && result.data) {
                console.log('正在填充漫畫頁表單:', result.data);

                // 填充 Hero 輪播設定
                const hero = result.data.hero;
                if (hero) {
                    document.getElementById('comicsHeroEnabled').checked = hero.enabled;
                    document.getElementById('comicsAutoplay').checked = hero.autoplay;
                    document.getElementById('comicsSpeed').value = hero.speed;
                }

                console.log('表單填充完成');

                // 渲染 Hero 輪播列表
                this.renderComicsSlidesList(hero.slides || []);
            } else {
                console.error('載入漫畫頁數據失敗:', result);
                this.showAlert('載入漫畫頁數據失敗', 'danger');
            }
        } catch (error) {
            console.error('載入漫畫頁數據錯誤:', error);
            this.showAlert('載入數據失敗，請檢查網路連接', 'danger');
        }
    }

    // 渲染漫畫頁 Hero 輪播列表
    renderComicsSlidesList(slides) {
        const container = document.getElementById('adsSlidesList');
        if (!container) {
            console.error('找不到廣告橫幅列表容器');
            return;
        }

        console.log('正在渲染漫畫頁Hero輪播:', slides);
        console.log('容器元素:', container);

        container.innerHTML = '';

        if (!slides || slides.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted text-center">尚無輪播內容</p></div>';
            return;
        }

        slides.forEach(slide => {
            const slideCard = document.createElement('div');
            slideCard.className = 'col-md-6 col-lg-4 mb-4';
            slideCard.innerHTML = `
                <div class="card h-100">
                    <div class="position-relative">
                        <img src="${slide.mainImage}" class="card-img-top" alt="${slide.title}" style="height: 200px; object-fit: cover; border-radius: 5px;">
                        <div class="position-absolute top-0 end-0 p-2">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-sm btn-light" onclick="editAdsSlide('${slide.id}')" title="編輯">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteAdsSlide('${slide.id}')" title="刪除">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">${slide.title}</h6>
                        <p class="card-text small text-muted">${slide.description ? slide.description.substring(0, 60) + '...' : ''}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">作者: ${slide.author}</small>
                            <span class="badge bg-primary">順序: ${slide.order}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(slideCard);
        });
    }

    // 顯示新增廣告橫幅模態視窗
    showAddAdsSlideModal() {
        // 清空表單
        document.getElementById('adsSlideForm').reset();
        document.getElementById('adsSlideId').value = '';

        // 重置圖片預覽
        document.getElementById('adsSlideMainImagePreview').classList.add('d-none');

        // 設定模態視窗標題
        document.getElementById('adsSlideModalTitle').innerHTML = '<i class="fas fa-image me-2"></i>新增廣告橫幅';

        // 顯示模態視窗
        const modal = new bootstrap.Modal(document.getElementById('adsSlideModal'));
        modal.show();

        // 設定圖片上傳預覽
        this.setupAdsImagePreviews();
    }

    // 設定廣告橫幅圖片預覽
    setupAdsImagePreviews() {
        // 主要圖片預覽
        const mainImageUpload = document.getElementById('adsSlideMainImageUpload');
        const mainImagePreview = document.getElementById('adsSlideMainImagePreview');

        if (mainImageUpload) {
            mainImageUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        mainImagePreview.src = e.target.result;
                        mainImagePreview.classList.remove('d-none');
                    };
                    reader.readAsDataURL(file);
                } else {
                    mainImagePreview.classList.add('d-none');
                }
            });
        }
    }

    // 儲存廣告橫幅
    async saveAdsSlide() {
        try {
            const form = document.getElementById('adsSlideForm');
            const formData = new FormData(form);
            const slideId = document.getElementById('adsSlideId').value;

            // 收集表單數據
            const slideData = {
                title: formData.get('title'),
                subtitle: formData.get('subtitle'),
                badge: formData.get('badge'),
                description: formData.get('description'),
                author: formData.get('author'),
                price: formData.get('price'),
                originalPrice: formData.get('originalPrice'),
                rating: parseFloat(formData.get('rating')),
                buttonText: formData.get('buttonText'),
                buttonLink: formData.get('buttonLink'),
                cardTitle: formData.get('cardTitle'),
                cardContent: formData.get('cardContent')
            };

            // 處理圖片上傳
            const mainImageFile = document.getElementById('adsSlideMainImageUpload').files[0];
            if (mainImageFile) {
                const imageFormData = new FormData();
                imageFormData.append('image', mainImageFile);

                const uploadResponse = await fetch('/api/upload/cloudinary', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: imageFormData
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResult.success) {
                    slideData.mainImage = uploadResult.data.url;
                }
            }


            // 提交數據
            const url = slideId ? `/api/ads/hero-slides/${slideId}` : '/api/ads/hero-slides';
            const method = slideId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(slideData)
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(slideId ? '輪播更新成功' : '輪播新增成功', 'success');

                // 關閉模態視窗
                const modal = bootstrap.Modal.getInstance(document.getElementById('adsSlideModal'));
                modal.hide();

                // 重新載入列表
                this.loadAdsData();
            } else {
                this.showAlert(result.message || '操作失敗', 'danger');
            }
        } catch (error) {
            console.error('儲存漫畫頁輪播錯誤:', error);
            this.showAlert('操作失敗，請稍後再試', 'danger');
        }
    }

    // 刪除廣告橫幅
    async deleteAdsSlide(slideId) {
        if (!confirm('確定要刪除這個輪播嗎？')) {
            return;
        }

        try {
            const response = await fetch(`/api/ads/hero-slides/${slideId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('輪播刪除成功', 'success');
                this.loadAdsData();
            } else {
                this.showAlert(result.message || '刪除失敗', 'danger');
            }
        } catch (error) {
            console.error('刪除廣告橫幅錯誤:', error);
            this.showAlert('刪除失敗，請稍後再試', 'danger');
        }
    }

    // 移動廣告橫幅順序
    async moveAdsSlide(slideId, direction) {
        try {
            const response = await fetch('/api/ads', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const slides = result.data.heroSlides;
                const slideIndex = slides.findIndex(s => s.id === slideId);

                if (slideIndex !== -1) {
                    const newSlides = [...slides];
                    const targetIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;

                    if (targetIndex >= 0 && targetIndex < newSlides.length) {
                        [newSlides[slideIndex], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[slideIndex]];

                        const slideOrders = newSlides.map((slide, index) => ({
                            id: slide.id,
                            order: index + 1
                        }));

                        const reorderResponse = await fetch('/api/ads/hero-slides/reorder', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.token}`
                            },
                            body: JSON.stringify({ slideOrders })
                        });

                        const reorderResult = await reorderResponse.json();

                        if (reorderResult.success) {
                            this.showAlert('順序更新成功', 'success');
                            this.loadAdsData();
                        } else {
                            this.showAlert('順序更新失敗', 'danger');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('移動廣告橫幅錯誤:', error);
            this.showAlert('操作失敗', 'danger');
        }
    }

    // 編輯廣告橫幅
    async editAdsSlide(slideId) {
        try {
            const response = await fetch('/api/ads', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                const slide = result.data.heroSlides?.find(s => s.id === slideId);
                if (slide) {
                    // 填充簡化表單數據
                    document.getElementById('adsSlideId').value = slide.id;
                    document.getElementById('adsSlideTitle').value = slide.title || '';
                    document.getElementById('adsSlideDescription').value = slide.description || '';

                    // 顯示主要圖片預覽
                    if (slide.mainImage) {
                        const mainImagePreview = document.getElementById('adsSlideMainImagePreview');
                        mainImagePreview.src = slide.mainImage;
                        mainImagePreview.classList.remove('d-none');
                    }

                    // 顯示模態視窗
                    document.getElementById('adsSlideModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>編輯廣告橫幅';
                    const modal = new bootstrap.Modal(document.getElementById('adsSlideModal'));
                    modal.show();

                    // 設定圖片預覽
                    this.setupAdsImagePreviews();
                }
            }
        } catch (error) {
            console.error('載入廣告橫幅錯誤:', error);
            this.showAlert('載入數據失敗', 'danger');
        }
    }
}

// 初始化管理面板
const admin = new AdminPanel();

// 添加事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    // 作者資訊表單提交
    const authorProfileForm = document.getElementById('authorProfileForm');
    if (authorProfileForm) {
        authorProfileForm.addEventListener('submit', (e) => admin.saveAuthorProfile(e));
    }

    // 作者頭像上傳
    const authorImageUpload = document.getElementById('authorImageUpload');
    if (authorImageUpload) {
        authorImageUpload.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                admin.uploadAuthorImage(e.target.files[0]);
            }
        });
    }

    // 作品圖片預覽
    const workImageUpload = document.getElementById('workImageUpload');
    if (workImageUpload) {
        workImageUpload.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('workImagePreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 首頁輪播設定表單提交
    const carouselSettingsForm = document.getElementById('carouselSettingsForm');
    if (carouselSettingsForm) {
        carouselSettingsForm.addEventListener('submit', (e) => admin.saveCarouselSettings(e));
    }

    // 首頁圖片上傳預覽
    const homepageImageUpload = document.getElementById('homepageImageUpload');
    if (homepageImageUpload) {
        homepageImageUpload.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('homepageImagePreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 廣告橫幅設定表單提交
    const adsHeroSettingsForm = document.getElementById('adsHeroSettingsForm');
    if (adsHeroSettingsForm) {
        adsHeroSettingsForm.addEventListener('submit', (e) => admin.saveHeroCarouselSettings(e));
    }

    // 漫畫頁標題設定表單提交
    const comicsHeroTitleForm = document.getElementById('comicsHeroTitleForm');
    if (comicsHeroTitleForm) {
        comicsHeroTitleForm.addEventListener('submit', (e) => admin.saveComicsHeroTitle(e));
    }

    // 漫畫頁輪播設定表單提交
    const comicsHeroSettingsForm = document.getElementById('comicsHeroSettingsForm');
    if (comicsHeroSettingsForm) {
        comicsHeroSettingsForm.addEventListener('submit', (e) => admin.saveComicsHeroSettings(e));
    }

    // Hero主圖上傳預覽
    const heroSlideMainImageUpload = document.getElementById('heroSlideMainImageUpload');
    if (heroSlideMainImageUpload) {
        heroSlideMainImageUpload.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('heroSlideMainImagePreview').src = e.target.result;
                    document.getElementById('heroSlideMainImagePreview').classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Hero側邊圖片上傳預覽
    const heroSlideSideImagesUpload = document.getElementById('heroSlideSideImagesUpload');
    if (heroSlideSideImagesUpload) {
        heroSlideSideImagesUpload.addEventListener('change', (e) => {
            const previewContainer = document.getElementById('heroSlideSideImagesPreview');
            previewContainer.innerHTML = '';

            Array.from(e.target.files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item d-inline-block me-2 mb-2';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="側邊圖片${index + 1}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                        <small class="d-block text-center text-muted">${index + 1}</small>
                    `;
                    previewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
        });
    }
});

// 全域函數
function switchTab(tabName) {
    admin.switchTab(tabName);
}

function loadMangaList() {
    admin.loadMangaList();
}

function resetUploadForm() {
    admin.resetUploadForm();
}

function logout() {
    admin.logout();
}

// 作者相關全域函數
function loadAuthorData() {
    admin.loadAuthorData();
}

function addIntroductionParagraph() {
    admin.addIntroductionParagraph();
}

function removeIntroductionParagraph(button) {
    admin.removeIntroductionParagraph(button);
}

function resetAuthorForm() {
    admin.resetAuthorForm();
}

function showAddWorkModal() {
    admin.showAddWorkModal();
}

function saveWork() {
    admin.saveWork();
}

// 首頁相關全域函數
function loadHomepageData() {
    admin.loadHomepageData();
}

function showAddHomepageImageModal() {
    admin.showAddHomepageImageModal();
}

function saveHomepageImage() {
    admin.saveHomepageImage();
}

// 廣告頁相關全域函數
function loadAdsData() {
    admin.loadAdsData();
}

function showAddHeroSlideModal() {
    admin.showAddHeroSlideModal();
}

function saveHeroSlide() {
    admin.saveHeroSlide();
}

// 廣告橫幅 Slides 相關全域函數
function showAddAdsSlideModal() {
    admin.showAddAdsSlideModal();
}

function saveAdsSlide() {
    admin.saveAdsSlide();
}

function editAdsSlide(slideId) {
    admin.editAdsSlide(slideId);
}

function deleteAdsSlide(slideId) {
    admin.deleteAdsSlide(slideId);
}

function moveAdsSlide(slideId, direction) {
    admin.moveAdsSlide(slideId, direction);
}