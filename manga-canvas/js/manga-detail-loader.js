// 漫畫詳情頁面動態載入器
class MangaDetailLoader {
    constructor() {
        this.mangaId = null;
        this.mangaData = null;
        this.init();
    }

    // 初始化
    init() {
        this.getMangaIdFromUrl();
        if (this.mangaId) {
            this.loadMangaDetail();
        } else {
            this.showError('未找到漫畫ID，請檢查網址是否正確');
        }
    }

    // 從 URL 獲取漫畫 ID
    getMangaIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.mangaId = urlParams.get('id');
    }

    // 載入漫畫詳情
    async loadMangaDetail() {
        try {
            const response = await fetch(`/api/manga/${this.mangaId}`);
            const result = await response.json();

            if (result.success) {
                this.mangaData = result.data;
                this.renderMangaDetail();
            } else {
                throw new Error(result.message || '載入漫畫詳情失敗');
            }
        } catch (error) {
            console.error('載入漫畫詳情錯誤:', error);
            this.showError('載入失敗，請稍後再試');
        }
    }

    // 渲染漫畫詳情
    renderMangaDetail() {
        const data = this.mangaData;

        // 更新頁面標題
        document.title = `${data.title} - Tji Studio | 漫畫創作工作室`;

        // 更新封面圖片
        const coverImg = document.querySelector('.col-md-4 img');
        if (coverImg && data.coverImage) {
            coverImg.src = data.coverImage;
            coverImg.alt = data.title;
        }

        // 更新作品標題
        const titleElements = document.querySelectorAll('h1');
        titleElements.forEach(el => {
            if (el.textContent.includes('魔法少女')) {
                el.textContent = data.title;
            }
        });

        // 更新麵包屑
        const breadcrumbItem = document.querySelector('.breadcrumb-item.active');
        if (breadcrumbItem) {
            breadcrumbItem.textContent = data.title;
        }

        // 更新評分顯示
        if (data.rating && data.rating.enabled) {
            this.updateRatingDisplay(data.rating);
        } else {
            this.hideRatingDisplay();
        }

        // 更新狀態信息
        this.updateStatusInfo(data);

        // 更新作品簡介
        this.updateDescription(data.description);

        // 更新標籤
        this.updateTags(data.tags || []);

        // 更新作者信息
        this.updateAuthorInfo();

        // 載入章節列表（如果有的話）
        this.loadChapterList();
    }

    // 更新評分顯示
    updateRatingDisplay(rating) {
        const ratingContainer = document.querySelector('.rating-stars');
        const ratingText = document.querySelector('.text-muted');

        if (ratingContainer) {
            // 清空現有星星
            ratingContainer.innerHTML = '';

            // 根據星數上限和評分值生成星星
            const maxStars = rating.stars || 5;
            const currentRating = rating.value || 0;
            const fullStars = Math.floor(currentRating);
            const hasHalfStar = currentRating % 1 >= 0.5;

            // 添加實心星星
            for (let i = 0; i < fullStars; i++) {
                ratingContainer.innerHTML += '<i class="bi-star-fill"></i>';
            }

            // 添加半星
            if (hasHalfStar && fullStars < maxStars) {
                ratingContainer.innerHTML += '<i class="bi-star-half"></i>';
            }

            // 添加空星星
            const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
            for (let i = 0; i < emptyStars; i++) {
                ratingContainer.innerHTML += '<i class="bi-star"></i>';
            }
        }

        if (ratingText) {
            ratingText.textContent = `(${currentRating}/${rating.stars} - 評價系統已啟用)`;
        }
    }

    // 隱藏評分顯示
    hideRatingDisplay() {
        const ratingContainer = document.querySelector('.d-flex.align-items-center.justify-content-between');
        if (ratingContainer) {
            const ratingSection = ratingContainer.querySelector('.d-flex.align-items-center');
            if (ratingSection) {
                ratingSection.style.display = 'none';
            }
        }
    }

    // 更新狀態信息
    updateStatusInfo(data) {
        // 更新狀態
        const statusElement = document.querySelector('.fw-bold.color');
        if (statusElement) {
            statusElement.textContent = data.status || '未知';
        }

        // 更新類型
        const typeElements = document.querySelectorAll('.fw-bold');
        typeElements.forEach(el => {
            if (el.textContent === '奇幻') {
                el.textContent = data.type || '未分類';
            }
        });

        // 更新年齡分級
        const ageRatingElements = document.querySelectorAll('.fw-bold');
        ageRatingElements.forEach(el => {
            if (el.textContent === '全年齡') {
                el.textContent = data.ageRating || '全年齡';
            }
        });
    }

    // 更新作品簡介
    updateDescription(description) {
        const descriptionContainer = document.querySelector('.mb-4 h4').parentElement;
        if (descriptionContainer && description) {
            const paragraphs = descriptionContainer.querySelectorAll('p');

            // 清空現有段落
            paragraphs.forEach(p => p.remove());

            // 添加新的描述
            const descriptionText = description.split('\n').filter(line => line.trim());
            if (descriptionText.length > 0) {
                descriptionText.forEach(paragraph => {
                    const p = document.createElement('p');
                    p.textContent = paragraph.trim();
                    descriptionContainer.appendChild(p);
                });
            } else {
                const p = document.createElement('p');
                p.textContent = description;
                descriptionContainer.appendChild(p);
            }
        }
    }

    // 更新標籤
    updateTags(tags) {
        const tagsContainer = document.querySelector('.mb-4 h5').parentElement.querySelector('div');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';

            if (tags.length > 0) {
                tags.forEach(tag => {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-secondary me-2 mb-2';
                    badge.textContent = tag;
                    tagsContainer.appendChild(badge);
                });
            } else {
                const noTags = document.createElement('span');
                noTags.className = 'text-muted';
                noTags.textContent = '暫無標籤';
                tagsContainer.appendChild(noTags);
            }
        }
    }

    // 更新作者信息
    async updateAuthorInfo() {
        try {
            const response = await fetch('/api/author/public');
            const result = await response.json();

            if (result.success && result.data) {
                const authorData = result.data;

                // 更新作者頭像
                const authorImg = document.querySelector('.rounded-circle');
                if (authorImg && authorData.avatar) {
                    authorImg.src = authorData.avatar;
                }

                // 更新作者姓名
                const authorName = document.querySelector('h4.mb-2');
                if (authorName && authorData.name) {
                    authorName.textContent = authorData.name;
                }

                // 更新作者標題
                const authorTitle = document.querySelector('.text-muted');
                if (authorTitle && authorData.title) {
                    authorTitle.textContent = authorData.title;
                }

                // 更新作者介紹
                const authorIntro = document.querySelector('h3.mb-3').parentElement;
                if (authorIntro && authorData.introduction) {
                    const paragraphs = authorIntro.querySelectorAll('p');
                    paragraphs.forEach((p, index) => {
                        if (index < 2) { // 只更新前兩個段落
                            const introLines = authorData.introduction.split('\n');
                            if (introLines[index]) {
                                p.textContent = introLines[index];
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('載入作者信息失敗:', error);
        }
    }

    // 載入章節列表
    async loadChapterList() {
        // 這裡暫時保留靜態內容，因為章節系統還未實現
        // 未來可以從 API 載入真實的章節數據
        console.log('章節列表功能待實現');
    }

    // 顯示錯誤信息
    showError(message) {
        const contentWrap = document.querySelector('.content-wrap');
        if (contentWrap) {
            contentWrap.innerHTML = `
                <div class="container">
                    <div class="row justify-content-center text-center" style="min-height: 400px; align-items: center;">
                        <div class="col-md-6">
                            <i class="bi-exclamation-triangle" style="font-size: 4rem; color: #dc3545;"></i>
                            <h2 class="mt-3">載入失敗</h2>
                            <p class="text-muted">${message}</p>
                            <a href="works.html" class="btn btn-primary">返回作品集</a>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    new MangaDetailLoader();
});