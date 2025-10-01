// 動態載入 works.html 頁面的漫畫作品資訊
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Works頁面: 開始載入漫畫作品資訊...'); // 調試用

        // 載入漫畫資訊 (添加時間戳防止快取)
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/manga/public/list?t=${timestamp}`);

        console.log('Works頁面: API響應狀態:', response.status); // 調試用

        const result = await response.json();
        console.log('Works頁面: API回傳資料:', result); // 調試用

        if (result.success && result.data) {
            updateWorksPage(result.data);
        } else {
            console.error('Works頁面: API返回失敗:', result);
        }
    } catch (error) {
        console.error('Works頁面: 載入漫畫作品資訊失敗:', error);
    }
});

// 更新 works.html 中的漫畫作品展示
function updateWorksPage(mangaList) {
    if (!mangaList || mangaList.length === 0) {
        console.log('Works頁面: 無漫畫作品資料');
        showEmptyState();
        return;
    }

    console.log('Works頁面: 開始更新漫畫作品展示', mangaList);

    const shopContainer = document.getElementById('shop');
    if (!shopContainer) {
        console.error('Works頁面: 找不到shop容器');
        return;
    }

    // 清空現有內容
    shopContainer.innerHTML = '';

    // 動態生成新的卡片格式漫畫項目
    mangaList.forEach((manga, index) => {
        const workCard = document.createElement('div');
        workCard.className = 'work-card';

        // 從漫畫數據獲取信息
        const coverImage = manga.coverImage || 'images/default-cover.jpg';
        const title = manga.title || '未命名作品';
        const description = manga.description || '';
        const category = getCategoryDisplayName(manga.category);
        const type = manga.type || '';
        const status = manga.status || '連載中';
        const ageRating = manga.ageRating || '全年齡';

        // 構建漫畫詳情頁面連結
        const detailLink = `manga-detail.html?id=${manga.id}`;

        // 生成評分顯示
        const ratingDisplay = generateRatingDisplay(manga.rating);

        // 生成標籤顯示
        const tagsDisplay = generateTagsDisplay(manga.tags);

        workCard.innerHTML = `
            <div class="work-card-image" style="background-image: url('${coverImage}')">
                <div class="work-card-overlay">
                    <button class="work-card-play" onclick="window.location.href='${detailLink}'">
                        <i class="bi-play-circle"></i>
                    </button>
                    <div class="work-card-status status-${status.toLowerCase().replace(/\s+/g, '-')}">${status}</div>
                </div>
            </div>
            <div class="work-card-info">
                <div class="work-card-meta">
                    <span class="work-card-category">${category}</span>
                    ${type ? `<span class="work-card-type">${type}</span>` : ''}
                    <span class="work-card-age-rating">${ageRating}</span>
                </div>
                <div class="work-card-title">${title}</div>
                ${description ? `<div class="work-card-description">${truncateText(description, 80)}</div>` : ''}
                ${ratingDisplay}
                ${tagsDisplay}
                <div class="work-card-footer">
                    <a href="${detailLink}" class="work-card-button">
                        開始閱讀
                    </a>
                </div>
            </div>
        `;

        shopContainer.appendChild(workCard);
        console.log(`Works頁面: 新增漫畫卡片: ${title}`);
    });

    // 重新初始化 Bootstrap tooltips（如果需要）
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    console.log('Works頁面: 漫畫作品展示更新完成');
}

// 顯示空狀態
function showEmptyState() {
    const shopContainer = document.getElementById('shop');
    if (shopContainer) {
        shopContainer.innerHTML = `
            <div class="empty-state text-center py-5">
                <i class="bi-book" style="font-size: 4rem; color: #6c757d;"></i>
                <h3 class="mt-3 mb-2">暫無漫畫作品</h3>
                <p class="text-muted">作者正在努力創作中，請稍後再來瀏覽</p>
            </div>
        `;
    }
}

// 獲取分類顯示名稱
function getCategoryDisplayName(category) {
    const categoryMap = {
        'general': '一般',
        'action': '動作',
        'romance': '愛情',
        'comedy': '喜劇',
        'fantasy': '奇幻',
        'horror': '恐怖'
    };
    return categoryMap[category] || category || '漫畫';
}

// 生成評分顯示
function generateRatingDisplay(rating) {
    if (!rating || !rating.enabled) {
        return '';
    }

    const value = rating.value || 0;
    const maxStars = rating.stars || 5;
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;

    let starsHtml = '';

    // 添加實心星星
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="bi-star-fill"></i>';
    }

    // 添加半星
    if (hasHalfStar && fullStars < maxStars) {
        starsHtml += '<i class="bi-star-half"></i>';
    }

    // 添加空星星
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="bi-star"></i>';
    }

    return `
        <div class="work-card-rating">
            <span class="rating-stars">${starsHtml}</span>
            <span class="rating-value">${value}/${maxStars}</span>
        </div>
    `;
}

// 生成標籤顯示
function generateTagsDisplay(tags) {
    if (!tags || tags.length === 0) {
        return '';
    }

    const maxTags = 3; // 最多顯示3個標籤
    const displayTags = tags.slice(0, maxTags);
    const hasMoreTags = tags.length > maxTags;

    let tagsHtml = displayTags.map(tag => `<span class="work-card-tag">${tag}</span>`).join('');

    if (hasMoreTags) {
        tagsHtml += `<span class="work-card-tag-more">+${tags.length - maxTags}</span>`;
    }

    return `<div class="work-card-tags">${tagsHtml}</div>`;
}

// 截斷文字
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}