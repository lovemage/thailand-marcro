// 漫畫管理模組
class MangaManager {
    constructor() {
        this.currentManga = null;
        this.mangaList = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMangaList();
    }

    // 設置事件監聽器
    setupEventListeners() {
        // 新增漫畫按鈕
        const addMangaBtn = document.getElementById('addMangaBtn');
        if (addMangaBtn) {
            addMangaBtn.addEventListener('click', () => this.showMangaForm());
        }

        // 漫畫表單提交
        const mangaForm = document.getElementById('mangaForm');
        if (mangaForm) {
            mangaForm.addEventListener('submit', (e) => this.handleMangaSubmit(e));
        }

        // 評價開關
        const ratingToggle = document.getElementById('mangaFormRatingEnabled');
        if (ratingToggle) {
            ratingToggle.addEventListener('change', (e) => this.toggleRatingSettings(e.target.checked));
        }

        // 標籤輸入
        const tagsInput = document.getElementById('mangaFormTags');
        if (tagsInput) {
            tagsInput.addEventListener('keydown', (e) => this.handleTagInput(e));
        }
    }

    // 載入漫畫列表
    async loadMangaList() {
        try {
            const response = await fetch('/api/manga', {
                headers: authManager.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                this.mangaList = result.data;
                this.renderMangaList();
            }
        } catch (error) {
            console.error('載入漫畫列表失敗:', error);
            this.showMessage('載入漫畫列表失敗', 'error');
        }
    }

    // 渲染漫畫列表
    renderMangaList() {
        const container = document.getElementById('mangaListContainer');
        if (!container) return;

        if (this.mangaList.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>尚無漫畫作品</p>
                    <button class="btn btn-primary" onclick="mangaManager.showMangaForm()">
                        <i class="fas fa-plus"></i> 新增第一部漫畫
                    </button>
                </div>
            `;
            return;
        }

        const mangaCards = this.mangaList.map(manga => `
            <div class="manga-card" data-id="${manga.id}">
                <div class="manga-cover">
                    <img src="${manga.coverImage || '/images/default-cover.jpg'}"
                         alt="${manga.title}"
                         onerror="this.src='/images/default-cover.jpg'">
                    <div class="manga-status status-${manga.status.toLowerCase().replace(/\s+/g, '-')}">
                        ${manga.status}
                    </div>
                </div>
                <div class="manga-info">
                    <h3 class="manga-title">${manga.title}</h3>
                    <p class="manga-type">${manga.type || '未分類'}</p>
                    <p class="manga-description">${this.truncateText(manga.description, 100)}</p>

                    ${manga.rating.enabled ? `
                        <div class="manga-rating">
                            <span class="rating-stars">${this.renderStars(manga.rating.value, manga.rating.stars)}</span>
                            <span class="rating-value">${manga.rating.value}/${manga.rating.stars}</span>
                        </div>
                    ` : ''}

                    <div class="manga-tags">
                        ${manga.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>

                    <div class="manga-meta">
                        <span class="age-rating">${manga.ageRating}</span>
                        <span class="category">${manga.category}</span>
                    </div>
                </div>
                <div class="manga-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="mangaManager.editManga('${manga.id}')">
                        <i class="fas fa-edit"></i> 編輯
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="mangaManager.deleteManga('${manga.id}')">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="manga-grid">
                ${mangaCards}
            </div>
        `;
    }

    // 顯示漫畫表單
    showMangaForm(mangaId = null) {
        const modal = document.getElementById('mangaModal');
        const form = document.getElementById('mangaForm');

        if (mangaId) {
            // 編輯模式
            this.currentManga = this.mangaList.find(m => m.id === mangaId);
            this.populateForm(this.currentManga);
        } else {
            // 新增模式
            this.currentManga = null;
            form.reset();
            this.resetForm();
        }

        // 使用 Bootstrap Modal 或自定義 modal
        if (modal) {
            if (window.bootstrap) {
                new bootstrap.Modal(modal).show();
            } else {
                modal.style.display = 'block';
            }
        }
    }

    // 填入表單資料
    populateForm(manga) {
        document.getElementById('mangaFormTitle').value = manga.title || '';
        document.getElementById('mangaFormDescription').value = manga.description || '';
        document.getElementById('mangaFormType').value = manga.type || '';
        document.getElementById('mangaFormCategory').value = manga.category || '';
        document.getElementById('mangaFormStatus').value = manga.status || '';
        document.getElementById('mangaFormAgeRating').value = manga.ageRating || '';

        // 評價設定
        const ratingEnabled = document.getElementById('mangaFormRatingEnabled');
        const ratingStars = document.getElementById('mangaFormRatingStars');
        const ratingValue = document.getElementById('mangaFormRatingValue');

        if (ratingEnabled) ratingEnabled.checked = manga.rating.enabled;
        if (ratingStars) ratingStars.value = manga.rating.stars;
        if (ratingValue) ratingValue.value = manga.rating.value;

        this.toggleRatingSettings(manga.rating.enabled);

        // 標籤
        this.displayTags(manga.tags);
    }

    // 重置表單
    resetForm() {
        document.getElementById('mangaFormRatingEnabled').checked = false;
        document.getElementById('mangaFormRatingStars').value = 5;
        document.getElementById('mangaFormRatingValue').value = 0;
        this.toggleRatingSettings(false);
        this.displayTags([]);
    }

    // 處理表單提交
    async handleMangaSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const mangaData = {
            title: formData.get('title'),
            description: formData.get('description'),
            type: formData.get('type'),
            category: formData.get('category'),
            status: formData.get('status'),
            ageRating: formData.get('ageRating'),
            rating: {
                enabled: document.getElementById('mangaFormRatingEnabled').checked,
                stars: parseInt(document.getElementById('mangaFormRatingStars').value),
                value: parseFloat(document.getElementById('mangaFormRatingValue').value)
            },
            tags: this.getCurrentTags()
        };

        // 如果有封面圖片
        const coverFile = formData.get('coverImage');
        if (coverFile && coverFile.size > 0) {
            mangaData.coverImage = await this.uploadCoverImage(coverFile);
        }

        try {
            let response;
            if (this.currentManga) {
                // 更新
                response = await fetch(`/api/manga/${this.currentManga.id}`, {
                    method: 'PUT',
                    headers: authManager.getAuthHeaders(),
                    body: JSON.stringify(mangaData)
                });
            } else {
                // 新增
                response = await fetch('/api/manga', {
                    method: 'POST',
                    headers: authManager.getAuthHeaders(),
                    body: JSON.stringify(mangaData)
                });
            }

            const result = await response.json();
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.hideModal();
                this.loadMangaList();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('儲存漫畫失敗:', error);
            this.showMessage('儲存漫畫失敗', 'error');
        }
    }

    // 切換評價設定顯示
    toggleRatingSettings(enabled) {
        const ratingSettings = document.getElementById('mangaFormRatingSettings');
        if (ratingSettings) {
            ratingSettings.style.display = enabled ? 'block' : 'none';
        }
    }

    // 處理標籤輸入
    handleTagInput(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const input = e.target;
            const tag = input.value.trim();
            if (tag) {
                this.addTag(tag);
                input.value = '';
            }
        }
    }

    // 添加標籤
    addTag(tag) {
        const container = document.getElementById('mangaFormTagsContainer');
        if (!container) return;

        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            ${tag}
            <button type="button" class="tag-remove" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(tagElement);
    }

    // 顯示現有標籤
    displayTags(tags) {
        const container = document.getElementById('mangaFormTagsContainer');
        if (!container) return;

        container.innerHTML = '';
        tags.forEach(tag => this.addTag(tag));
    }

    // 獲取當前標籤
    getCurrentTags() {
        const container = document.getElementById('mangaFormTagsContainer');
        if (!container) return [];

        return Array.from(container.querySelectorAll('.tag-item'))
            .map(el => el.textContent.replace('×', '').trim());
    }

    // 編輯漫畫
    editManga(id) {
        this.showMangaForm(id);
    }

    // 刪除漫畫
    async deleteManga(id) {
        if (!confirm('確定要刪除這部漫畫嗎？此操作無法復原。')) {
            return;
        }

        try {
            const response = await fetch(`/api/manga/${id}`, {
                method: 'DELETE',
                headers: authManager.getAuthHeaders()
            });

            const result = await response.json();
            if (result.success) {
                this.showMessage('漫畫刪除成功', 'success');
                this.loadMangaList();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('刪除漫畫失敗:', error);
            this.showMessage('刪除漫畫失敗', 'error');
        }
    }

    // 上傳封面圖片
    async uploadCoverImage(file) {
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
            console.error('上傳封面失敗:', error);
            throw error;
        }
    }

    // 輔助函數
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    renderStars(value, max) {
        const fullStars = Math.floor(value);
        const halfStar = value % 1 >= 0.5;
        const emptyStars = max - fullStars - (halfStar ? 1 : 0);

        return '★'.repeat(fullStars) +
               (halfStar ? '☆' : '') +
               '☆'.repeat(emptyStars);
    }

    hideModal() {
        const modal = document.getElementById('mangaModal');
        if (modal) {
            if (window.bootstrap) {
                bootstrap.Modal.getInstance(modal)?.hide();
            } else {
                modal.style.display = 'none';
            }
        }
    }

    showMessage(message, type = 'info') {
        if (window.uiManager) {
            uiManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// 導出單例實例
window.mangaManager = new MangaManager();