// 動態載入首頁輪播設定
class HomepageCarousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = [];
        this.autoplayTimer = null;
        this.autoplaySpeed = 3000;
        this.isAutoplay = true;
        this.init();
    }

    async init() {
        try {
            console.log('首頁: 開始載入輪播設定...');

            // 載入首頁設定 (添加時間戳防止快取)
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/homepage/public?t=${timestamp}`);

            console.log('首頁: API響應狀態:', response.status);

            const result = await response.json();
            console.log('首頁: API回傳資料:', result);

            if (result.success && result.data) {
                this.setupCarousel(result.data);
            } else {
                console.error('首頁: API返回失敗:', result);
            }
        } catch (error) {
            console.error('首頁: 載入輪播設定失敗:', error);
        }
    }

    // 設定輪播功能
    setupCarousel(data) {
        const carousel = data.carousel;

        if (!carousel || !carousel.enabled || !carousel.images || carousel.images.length === 0) {
            console.log('首頁: 輪播未啟用或無圖片');
            return;
        }

        console.log('首頁: 開始設定輪播', carousel);

        this.slides = carousel.images;
        this.isAutoplay = carousel.autoplay;
        this.autoplaySpeed = carousel.speed * 1000; // 轉換為毫秒

        // 如果只有一張圖片，直接顯示
        if (this.slides.length === 1) {
            this.updateBackground(this.slides[0]);
            return;
        }

        // 設定點擊切換功能
        this.setupDotControls();

        // 設定鍵盤控制
        this.setupKeyboardControls();

        // 初始化第一張圖片
        this.updateBackground(this.slides[0]);
        this.updateDots();

        // 開始自動播放
        if (this.isAutoplay) {
            this.startAutoplay();
        }

        console.log('首頁: 輪播設定完成');
    }

    // 設定點控制
    setupDotControls() {
        const dots = document.querySelectorAll('.dot');

        // 確保點的數量與圖片數量一致
        const dotContainer = document.querySelector('.dots');
        if (dotContainer && this.slides.length !== dots.length) {
            // 重新生成點
            dotContainer.innerHTML = '';
            for (let i = 0; i < Math.min(this.slides.length, 5); i++) {
                const dot = document.createElement('span');
                dot.className = 'dot';
                dot.addEventListener('click', () => this.goToSlide(i));
                dotContainer.appendChild(dot);
            }
        } else {
            // 為現有點添加點擊事件
            dots.forEach((dot, index) => {
                if (index < this.slides.length) {
                    dot.addEventListener('click', () => this.goToSlide(index));
                } else {
                    dot.style.display = 'none'; // 隱藏多餘的點
                }
            });
        }
    }

    // 設定鍵盤控制
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case ' ': // 空白鍵暫停/播放
                    e.preventDefault();
                    this.toggleAutoplay();
                    break;
            }
        });
    }

    // 更新背景圖片
    updateBackground(slide) {
        const imageElement = document.querySelector('.image-container .image');
        if (imageElement && slide) {
            console.log(`首頁: 更新背景圖片: ${slide.title}`);

            // 使用時間戳防止快取
            const timestamp = new Date().getTime();
            const imageUrl = slide.url.includes('cloudinary.com')
                ? `${slide.url}?t=${timestamp}`
                : slide.url;

            imageElement.src = imageUrl;
            imageElement.alt = slide.alt || slide.title;
            imageElement.title = slide.description || slide.title;

            // 更新圖片資訊顯示
            this.updateCarouselInfo(slide);
        }
    }

    // 更新輪播資訊顯示
    updateCarouselInfo(slide) {
        const infoElement = document.getElementById('carouselInfo');
        if (infoElement && slide && (slide.title || slide.description)) {
            infoElement.innerHTML = `
                ${slide.title ? `<strong>${slide.title}</strong>` : ''}
                ${slide.title && slide.description ? '<br>' : ''}
                ${slide.description || ''}
            `;
            infoElement.classList.add('show');

            // 3秒後自動隱藏
            setTimeout(() => {
                infoElement.classList.remove('show');
            }, 3000);
        }
    }

    // 更新點狀態
    updateDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    // 跳到特定幻燈片
    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentSlide = index;
            this.updateBackground(this.slides[this.currentSlide]);
            this.updateDots();

            // 如果正在自動播放，重新開始計時
            if (this.isAutoplay) {
                this.startAutoplay();
            }
        }
    }

    // 下一張幻燈片
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    // 上一張幻燈片
    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    // 開始自動播放
    startAutoplay() {
        this.stopAutoplay(); // 先清除現有的計時器

        if (this.isAutoplay && this.slides.length > 1) {
            this.autoplayTimer = setInterval(() => {
                this.nextSlide();
            }, this.autoplaySpeed);
        }
    }

    // 停止自動播放
    stopAutoplay() {
        if (this.autoplayTimer) {
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = null;
        }
    }

    // 切換自動播放
    toggleAutoplay() {
        this.isAutoplay = !this.isAutoplay;

        if (this.isAutoplay) {
            this.startAutoplay();
            console.log('首頁: 開始自動播放');
        } else {
            this.stopAutoplay();
            console.log('首頁: 暫停自動播放');
        }
    }
}

// 當頁面載入完成後初始化輪播
document.addEventListener('DOMContentLoaded', function() {
    // 確保我們在首頁
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        new HomepageCarousel();
    }
});