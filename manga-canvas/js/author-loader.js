// 動態載入作者資訊
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('開始載入作者資訊...'); // 調試用

        // 載入作者資訊 (添加時間戳防止快取)
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/author/public?t=${timestamp}`);

        console.log('API響應狀態:', response.status); // 調試用

        const result = await response.json();
        console.log('API回傳資料:', result); // 調試用

        if (result.success && result.data) {
            updateAuthorProfile(result.data.profile);
            updateAuthorWorks(result.data.works);
            updateSocialLinks(result.data.socialLinks);
        } else {
            console.error('API返回失敗:', result);
        }
    } catch (error) {
        console.error('載入作者資訊失敗:', error);
    }
});

// 更新作者基本資訊
function updateAuthorProfile(profile) {
    // 更新作者姓名
    const nameElement = document.querySelector('h2 strong');
    if (nameElement) {
        nameElement.textContent = profile.name;
    }

    // 更新職稱
    const titleElement = document.querySelector('.text-muted');
    if (titleElement) {
        titleElement.textContent = profile.title;
    }

    // 更新作者頭像 (添加時間戳防止快取)
    const imageElement = document.querySelector('img[src*="auther"], img[alt="Tji"]');
    if (imageElement && profile.image) {
        console.log('更新頭像:', profile.image); // 調試用
        const timestamp = new Date().getTime();
        const imageUrl = profile.image.includes('cloudinary.com')
            ? `${profile.image}?t=${timestamp}`
            : profile.image;
        imageElement.src = imageUrl;
        imageElement.alt = profile.name;

        // 強制重新載入圖片
        imageElement.onload = function() {
            console.log('頭像載入完成:', imageUrl);
        };
    }

    // 更新自我介紹段落
    const introContainer = document.querySelector('.col-md-5.offset-lg-1');
    if (introContainer && profile.introduction) {
        // 找到所有 .lead 段落
        const leadElements = introContainer.querySelectorAll('.lead');

        // 清空現有段落（除了第一個包含姓名的段落）
        leadElements.forEach((el, index) => {
            if (index > 0) {
                el.remove();
            }
        });

        // 更新第一段並添加新段落
        profile.introduction.forEach((paragraph, index) => {
            if (index === 0) {
                // 更新第一個段落
                const firstLead = leadElements[0];
                if (firstLead) {
                    firstLead.textContent = paragraph;
                }
            } else {
                // 創建新段落
                const newParagraph = document.createElement('p');
                newParagraph.className = 'lead';
                newParagraph.textContent = paragraph;

                // 插入到合適位置（在 clear div 之前）
                const clearDiv = introContainer.querySelector('.clear');
                if (clearDiv) {
                    clearDiv.parentNode.insertBefore(newParagraph, clearDiv);
                }
            }
        });
    }
}

// 更新作品展示
function updateAuthorWorks(works) {
    if (!works || works.length === 0) return;

    // 找到最新作品區域
    const worksRow = document.querySelector('.heading-block + .row');
    if (worksRow) {
        // 清空現有作品
        worksRow.innerHTML = '';

        // 最多顯示6個作品
        const maxWorks = Math.min(works.length, 6);

        for (let i = 0; i < maxWorks; i++) {
            const work = works[i];
            const workColumn = document.createElement('div');
            workColumn.className = 'col-md-2';

            const workLink = document.createElement('a');
            workLink.href = work.link || '/article.html';

            const workImage = document.createElement('img');
            workImage.src = work.image;
            workImage.alt = work.title;
            workImage.title = work.description || work.title;

            workLink.appendChild(workImage);
            workColumn.appendChild(workLink);
            worksRow.appendChild(workColumn);
        }
    }
}

// 更新社群連結
function updateSocialLinks(socialLinks) {
    if (!socialLinks || socialLinks.length === 0) return;

    const socialContainer = document.querySelector('.mt-3');
    if (socialContainer) {
        // 清空現有社群連結
        socialContainer.innerHTML = '';

        socialLinks.forEach(link => {
            const socialLink = document.createElement('a');
            socialLink.href = link.url;

            // 根據平台設置樣式
            let bgClass = 'bg-' + link.platform;
            if (link.platform === 'twitter') {
                bgClass = 'bg-x-twitter';
            } else if (link.platform === 'forrst') {
                bgClass = 'bg-forrst';
            }

            socialLink.className = `social-icon si-small rounded-circle text-light border-0 ${bgClass}`;
            socialLink.title = link.platform.charAt(0).toUpperCase() + link.platform.slice(1);

            if (link.url !== '#') {
                socialLink.target = '_blank';
            }

            // 添加圖標 (雙重圖標效果)
            socialLink.innerHTML = `
                <i class="${link.icon}"></i>
                <i class="${link.icon}"></i>
            `;

            // 如果不是第一個，添加左邊距
            if (socialContainer.children.length > 0) {
                socialLink.classList.add('ms-1');
            }

            socialContainer.appendChild(socialLink);
        });
    }
}