// 動態載入 comics.html 頁面的作者資訊
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Comics頁面: 開始載入作者資訊...'); // 調試用

        // 載入作者資訊 (添加時間戳防止快取)
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/author/public?t=${timestamp}`);

        console.log('Comics頁面: API響應狀態:', response.status); // 調試用

        const result = await response.json();
        console.log('Comics頁面: API回傳資料:', result); // 調試用

        if (result.success && result.data) {
            updateComicsAuthorProfile(result.data.profile);
            updateComicsAuthorWorks(result.data.works);
        } else {
            console.error('Comics頁面: API返回失敗:', result);
        }
    } catch (error) {
        console.error('Comics頁面: 載入作者資訊失敗:', error);
    }
});

// 更新 comics.html 中的作者基本資訊
function updateComicsAuthorProfile(profile) {
    console.log('Comics頁面: 開始更新作者資訊', profile); // 調試用

    // 更新作者頭像 (查找 images/auther.png)
    const imageElement = document.querySelector('img[src*="auther"], img[alt="Tji"]');
    if (imageElement && profile.image) {
        console.log('Comics頁面: 更新頭像:', profile.image); // 調試用
        const timestamp = new Date().getTime();
        const imageUrl = profile.image.includes('cloudinary.com')
            ? `${profile.image}?t=${timestamp}`
            : profile.image;
        imageElement.src = imageUrl;
        imageElement.alt = profile.name;

        // 強制重新載入圖片
        imageElement.onload = function() {
            console.log('Comics頁面: 頭像載入完成:', imageUrl);
        };
    } else {
        console.log('Comics頁面: 找不到頭像元素或無圖片URL');
    }

    // 更新作者姓名 (關於作者區塊的標題)
    const nameElement = document.querySelector('.heading-block h2.fw-bold.font-body');
    if (nameElement) {
        nameElement.textContent = profile.name;
        console.log('Comics頁面: 更新姓名:', profile.name);
    }

    // 更新職稱描述
    const titleElement = document.querySelector('.heading-block .text-muted');
    if (titleElement) {
        titleElement.textContent = profile.title;
        console.log('Comics頁面: 更新職稱:', profile.title);
    }

    // 更新自我介紹段落 (取前兩段)
    const introContainer = document.querySelector('.col-lg-4.col-sm-6.mt-3');
    if (introContainer && profile.introduction && profile.introduction.length > 0) {
        const paragraphs = introContainer.querySelectorAll('p');

        // 更新第一段
        if (paragraphs[0] && profile.introduction[0]) {
            paragraphs[0].textContent = profile.introduction[0];
            console.log('Comics頁面: 更新第一段介紹');
        }

        // 更新第二段（如果存在）
        if (paragraphs[1] && profile.introduction.length > 1) {
            // 合併剩餘段落或只取第二段
            const secondParagraph = profile.introduction.length > 2
                ? profile.introduction.slice(1).join(' ')
                : profile.introduction[1];
            paragraphs[1].textContent = secondParagraph;
            console.log('Comics頁面: 更新第二段介紹');
        }
    }

    // 更新推薦作品標題中的作者名稱
    const recommendTitle = document.querySelector('h4.mb-3.fw-normal.font-body');
    if (recommendTitle) {
        recommendTitle.innerHTML = `為您推薦的 <a href="#">${profile.name}</a> 人氣作品`;
        console.log('Comics頁面: 更新推薦標題');
    }

    // 更新輪播圖中的作者連結 (第65行和第102行)
    const authorLinks = document.querySelectorAll('h5 a[href="#"]');
    authorLinks.forEach(link => {
        if (link.textContent === 'Tji' || link.textContent.includes('Tji')) {
            link.textContent = profile.name;
            console.log('Comics頁面: 更新作者連結');
        }
    });
}

// 更新 comics.html 中的作者作品展示
function updateComicsAuthorWorks(works) {
    if (!works || works.length === 0) {
        console.log('Comics頁面: 無作品資料');
        return;
    }

    console.log('Comics頁面: 開始更新作品展示', works);

    // 更新推薦作品輪播區域
    const carousel = document.getElementById('oc-images');
    if (carousel) {
        const carouselItems = carousel.querySelectorAll('.oc-item');

        // 更新現有項目，最多6個
        const maxItems = Math.min(works.length, carouselItems.length);

        for (let i = 0; i < maxItems; i++) {
            const item = carouselItems[i];
            const work = works[i];
            const link = item.querySelector('a');
            const img = item.querySelector('img');

            if (link && img && work) {
                link.href = work.link || '/article.html';
                img.src = work.image;
                img.alt = work.title;
                img.title = work.description || work.title;
                console.log(`Comics頁面: 更新作品 ${i + 1}: ${work.title}`);
            }
        }

        // 如果有新的作品且現有項目不足，可以動態添加
        if (works.length > carouselItems.length) {
            for (let i = carouselItems.length; i < Math.min(works.length, 8); i++) {
                const work = works[i];
                const newItem = document.createElement('div');
                newItem.className = 'oc-item';
                newItem.innerHTML = `
                    <a href="${work.link || '/article.html'}">
                        <img src="${work.image}" alt="${work.title}" title="${work.description || work.title}">
                    </a>
                `;
                carousel.appendChild(newItem);
                console.log(`Comics頁面: 新增作品項目: ${work.title}`);
            }
        }
    }

    // 更新輪播圖中的主要作品封面
    updateMainSliderWorks(works);
}

// 更新主要輪播圖中的作品
function updateMainSliderWorks(works) {
    if (!works || works.length === 0) return;

    // 更新第一個slide的主要作品
    if (works[0]) {
        const mainImage = document.querySelector('.col-xl-2.col-md-3 img');
        if (mainImage) {
            mainImage.src = works[0].image;
            mainImage.alt = works[0].title;
        }

        // 更新標題和描述
        const titleElement = document.querySelector('.heading-block h2');
        const descElement = document.querySelector('.col-xl-6 p');

        if (titleElement) {
            titleElement.innerHTML = `《${works[0].title}》`;
        }

        if (descElement && works[0].description) {
            descElement.textContent = works[0].description;
        }
    }

    // 更新側邊的小圖片
    const sideImages = document.querySelectorAll('.col-xl-2.col-md-2 img, .col-xl-2.parallax img');
    let workIndex = 1; // 從第二個作品開始

    sideImages.forEach(img => {
        if (workIndex < works.length) {
            img.src = works[workIndex].image;
            img.alt = works[workIndex].title;
            img.title = works[workIndex].description || works[workIndex].title;
            workIndex++;
        }
    });

    console.log('Comics頁面: 更新主輪播圖作品完成');
}