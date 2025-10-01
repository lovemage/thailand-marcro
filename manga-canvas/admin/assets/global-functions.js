// 全域函數定義 - 為了向後兼容性
// 當新的模組化系統載入後，這些函數將被模組提供的函數覆蓋

// 首頁相關函數
window.showAddHomepageImageModal = function() {
    if (window.homepageManager) {
        homepageManager.showAddHomepageImageModal();
    } else {
        console.warn('homepageManager 尚未載入');
    }
};

window.saveHomepageImage = function() {
    if (window.homepageManager) {
        homepageManager.saveHomepageImage();
    } else {
        console.warn('homepageManager 尚未載入');
    }
};

window.editHomepageImage = function(id) {
    if (window.homepageManager) {
        homepageManager.editHomepageImage(id);
    } else {
        console.warn('homepageManager 尚未載入');
    }
};

window.deleteHomepageImage = function(id) {
    if (window.homepageManager) {
        homepageManager.deleteHomepageImage(id);
    } else {
        console.warn('homepageManager 尚未載入');
    }
};

// 廣告相關函數
window.loadAdsData = function() {
    if (window.adsManager) {
        adsManager.loadAdsData();
    } else {
        console.warn('adsManager 尚未載入');
    }
};

window.showAddAdsSlideModal = function() {
    if (window.adsManager) {
        adsManager.showAddAdsSlideModal();
    } else {
        console.warn('adsManager 尚未載入');
    }
};

window.saveAdsSlide = function() {
    if (window.adsManager) {
        adsManager.saveAdsSlide();
    } else {
        console.warn('adsManager 尚未載入');
    }
};

window.editAdsSlide = function(id) {
    if (window.adsManager) {
        adsManager.editAdsSlide(id);
    } else {
        console.warn('adsManager 尚未載入');
    }
};

window.deleteAdsSlide = function(id) {
    if (window.adsManager) {
        adsManager.deleteAdsSlide(id);
    } else {
        console.warn('adsManager 尚未載入');
    }
};

// 作者相關函數
window.loadAuthorData = function() {
    if (window.authorManager) {
        authorManager.loadAuthorData();
    } else {
        console.warn('authorManager 尚未載入');
    }
};

window.saveAuthorProfile = function(event) {
    if (window.authorManager) {
        authorManager.saveAuthorProfile(event);
    } else {
        console.warn('authorManager 尚未載入');
    }
};

window.resetAuthorForm = function() {
    if (window.authorManager) {
        authorManager.resetAuthorForm();
    } else {
        console.warn('authorManager 尚未載入');
    }
};

window.resetUploadForm = function() {
    console.log('重置上傳表單');
    const form = document.getElementById('uploadForm');
    if (form) {
        form.reset();
        // 清空預覽區域
        const coverPreview = document.getElementById('coverPreview');
        const pagesPreview = document.getElementById('pagesPreview');
        if (coverPreview) coverPreview.innerHTML = '';
        if (pagesPreview) pagesPreview.innerHTML = '';
    }
};

window.removeIntroductionParagraph = function(button) {
    if (button && button.parentElement && button.parentElement.parentElement) {
        button.parentElement.parentElement.remove();
    }
};

window.addIntroductionParagraph = function() {
    const container = document.getElementById('introductionContainer');
    if (container) {
        const newParagraph = document.createElement('div');
        newParagraph.className = 'mb-3';
        newParagraph.innerHTML = `
            <div class="d-flex">
                <textarea class="form-control me-2" name="introduction[]" rows="3" placeholder="輸入介紹段落"></textarea>
                <button type="button" class="btn btn-sm btn-danger mt-1" onclick="removeIntroductionParagraph(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(newParagraph);
    }
};

window.showAddWorkModal = function() {
    if (window.authorManager) {
        authorManager.showWorkModal();
    } else {
        console.warn('authorManager 尚未載入');
    }
};

window.loadHomepageData = function() {
    if (window.homepageManager) {
        homepageManager.loadHomepageData();
    } else {
        console.warn('homepageManager 尚未載入');
    }
};

window.saveHeroSlide = function() {
    if (window.adsManager) {
        adsManager.saveAdsSlide();
    } else {
        console.warn('adsManager 尚未載入');
    }
};

// 作品相關函數（保留原有功能）
window.showWorkModal = function(workId = null) {
    if (window.authorManager) {
        authorManager.showWorkModal(workId);
    } else {
        console.log('顯示作品模態框:', workId);
    }
};

window.saveWork = function() {
    if (window.authorManager) {
        authorManager.saveWork();
    } else {
        console.log('儲存作品');
    }
};

window.editWork = function(id) {
    if (window.authorManager) {
        authorManager.editWork(id);
    } else {
        console.log('編輯作品:', id);
    }
};

window.deleteWork = function(id) {
    if (window.authorManager) {
        authorManager.deleteWork(id);
    } else {
        console.log('刪除作品:', id);
    }
};

// Hero 輪播相關函數
window.showAddHeroSlideModal = function() {
    console.log('顯示新增 Hero 輪播模態框');
};

window.saveHeroSlide = function() {
    console.log('儲存 Hero 輪播');
};

window.editHeroSlide = function(id) {
    console.log('編輯 Hero 輪播:', id);
};

window.deleteHeroSlide = function(id) {
    console.log('刪除 Hero 輪播:', id);
};

// 通用輔助函數
window.showConfirmDialog = function(message, callback) {
    if (confirm(message)) {
        callback();
    }
};

window.showNotification = function(message, type = 'info') {
    if (window.uiManager) {
        uiManager.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
};

console.log('全域函數已載入，等待模組化系統覆蓋...');