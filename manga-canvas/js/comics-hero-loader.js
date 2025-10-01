// 動態載入漫畫頁Hero輪播設定
class ComicsHeroCarousel {
    constructor() {
        this.swiper = null;
        this.slides = [];
        this.init();
    }

    async init() {
        try {
            console.log('Comics: 開始載入設定...');

            // 檢查 DOM 元素是否存在
            const sliderElement = document.querySelector('#slider');
            const swiperWrapper = document.querySelector('#slider .swiper-wrapper');
            console.log('Comics: 檢查 DOM 元素 - slider:', !!sliderElement);
            console.log('Comics: 檢查 DOM 元素 - swiper-wrapper:', !!swiperWrapper);

            const timestamp = new Date().getTime();

            // 載入廣告橫幅數據 (用於 Hero 輪播)
            const adsResponse = await fetch(`/api/ads/public?t=${timestamp}`);
            const adsResult = await adsResponse.json();

            // 載入漫畫頁設定 (用於標題和人氣作品)
            const comicsResponse = await fetch(`/api/comics/public?t=${timestamp}`);
            const comicsResult = await comicsResponse.json();

            console.log('Comics: 廣告API響應:', adsResult);
            console.log('Comics: 漫畫API響應:', comicsResult);

            // 設定 Hero 輪播（使用廣告橫幅）
            if (adsResult.success && adsResult.data && adsResult.data.heroSlides) {
                this.setupHeroCarousel(adsResult.data);
            } else {
                this.setupFallbackCarousel();
            }

            // 設定標題（使用漫畫頁設定的標題）
            if (comicsResult.success && comicsResult.data && comicsResult.data.heroTitle) {
                this.setupHeroTitle(comicsResult.data.heroTitle);
            } else {
                this.setupFallbackTitle();
            }


        } catch (error) {
            console.error('Comics: 載入設定失敗:', error);
            this.setupFallbackCarousel();
            this.setupFallbackTitle();
        }
    }

    // 設定Hero輪播功能（使用廣告橫幅）
    setupHeroCarousel(data) {
        const heroSlides = data.heroSlides;
        const heroCarousel = data.heroCarousel;

        if (!heroSlides || heroSlides.length === 0) {
            console.log('Comics: 沒有廣告橫幅可顯示');
            this.setupFallbackCarousel();
            return;
        }

        console.log('Comics: 開始設定Hero輪播（廣告橫幅）', heroSlides);

        this.slides = heroSlides.sort((a, b) => a.order - b.order);

        // 創建輪播內容
        this.createSwiperSlides();

        // 初始化 Swiper
        this.initSwiper(heroCarousel || { enabled: true, autoplay: true, speed: 3 });

        console.log('Comics: Hero輪播設定完成');
    }

    // 創建輪播幻燈片
    createSwiperSlides() {
        const swiperWrapper = document.querySelector('#slider .swiper-wrapper');
        if (!swiperWrapper) {
            console.error('Comics: 找不到 swiper-wrapper 容器');
            return;
        }

        console.log('Comics: 開始創建 swiper 幻燈片，總數:', this.slides.length);

        // 清空現有內容
        swiperWrapper.innerHTML = '';

        this.slides.forEach((slide, index) => {
            console.log(`Comics: 創建第 ${index + 1} 張幻燈片:`, slide.title, '圖片:', slide.mainImage);
            const slideElement = this.createSlideElement(slide, index);
            swiperWrapper.appendChild(slideElement);
        });

        console.log('Comics: swiper-wrapper 最終內容長度:', swiperWrapper.innerHTML.length);
    }

    // 創建單個幻燈片元素 - 廣告橫幅格式
    createSlideElement(slide, index) {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'swiper-slide';

        slideDiv.innerHTML = `
            <div class="position-relative" style="height: 100%; overflow: hidden;">
                <img src="${slide.mainImage || slide.image}"
                     alt="${slide.title}"
                     class="w-100 h-100"
                     style="object-fit: cover; border-radius: 5px;">
                <div class="position-absolute bottom-0 start-0 end-0 bg-gradient-dark p-4 text-white">
                    <h3 class="h4 mb-2">${slide.title}</h3>
                    <p class="mb-0">${slide.description}</p>
                </div>
            </div>
        `;

        return slideDiv;
    }


    // 初始化 Swiper
    initSwiper(heroSettings) {
        console.log('Comics: 準備初始化 Swiper，幻燈片數量:', this.slides.length);
        console.log('Comics: 輪播設定:', heroSettings);

        // 等待 DOM 完全載入
        setTimeout(() => {
            const swiperContainer = document.querySelector('.swiper-parent');
            if (!swiperContainer) {
                console.error('Comics: 找不到 .swiper-parent 容器');
                return;
            }

            const swiperWrapper = swiperContainer.querySelector('.swiper-wrapper');
            if (!swiperWrapper) {
                console.error('Comics: 找不到 .swiper-wrapper 容器');
                return;
            }

            console.log('Comics: swiper-wrapper 內容:', swiperWrapper.innerHTML.length > 0 ? '有內容' : '空的');

            this.swiper = new Swiper('.swiper-parent', {
                loop: this.slides.length > 1,
                autoplay: heroSettings && heroSettings.autoplay ? {
                    delay: (heroSettings.speed || 3) * 1000,
                    disableOnInteraction: false,
                } : false,
                speed: 800,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    bulletClass: 'swiper-pagination-bullet',
                    bulletActiveClass: 'swiper-pagination-bullet-active'
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                // 觸控支援
                touchEventsTarget: 'container',
                simulateTouch: true,
                allowTouchMove: true,
                touchMoveStopPropagation: false,
                // 鍵盤控制
                keyboard: {
                    enabled: true,
                },
                // 滑鼠滾輪控制
                mousewheel: {
                    enabled: false,
                },
                on: {
                    init: function() {
                        console.log('Comics: Swiper 初始化完成，當前幻燈片數量:', this.slides.length);
                    },
                    slideChange: function() {
                        console.log('Comics: 切換到幻燈片', this.activeIndex + 1);
                    }
                }
            });

            // 添加分頁指示器
            this.addPaginationIfNeeded();

        }, 200);
    }

    // 添加分頁指示器
    addPaginationIfNeeded() {
        if (this.slides.length <= 1) return;

        const sliderElement = document.getElementById('slider');
        if (!sliderElement) return;

        // 檢查是否已經有分頁指示器
        let pagination = sliderElement.querySelector('.swiper-pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.className = 'swiper-pagination';
            sliderElement.appendChild(pagination);
        }
    }

    // 設定預設輪播（當API失敗時）
    setupFallbackCarousel() {
        console.log('Comics: 使用預設Hero輪播內容');

        // 保持現有的靜態內容，只是確保 Swiper 正常運作
        setTimeout(() => {
            this.swiper = new Swiper('.swiper-parent', {
                loop: false,
                autoplay: false,
                speed: 800,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true
                },
                touchEventsTarget: 'container',
                simulateTouch: true,
                allowTouchMove: true,
                keyboard: {
                    enabled: true,
                },
                on: {
                    init: function() {
                        console.log('Comics: 預設 Swiper 初始化完成');
                    }
                }
            });
        }, 100);

        // 預設情況不顯示人氣作品
    }

    // 設定 Hero 標題區域
    setupHeroTitle(heroTitle) {
        const heroTitleElement = document.getElementById('heroTitle');
        const heroDescriptionElement = document.getElementById('heroDescription');

        if (heroTitle && heroTitleElement) {
            heroTitleElement.textContent = heroTitle.title || 'MangaPlaza, Your One-Stop Manga Website';
        }

        if (heroTitle && heroDescriptionElement) {
            heroDescriptionElement.textContent = heroTitle.description || 'Discover popular Japanese manga series with over 150,000 chapters to read on MangaPlaza! Sign up and read the 1st chapter of even more titles for FREE!';
        }

        console.log('Comics: Hero 標題設定完成');
    }

    // 設定預設標題（當API失敗時）
    setupFallbackTitle() {
        console.log('Comics: 使用預設Hero標題內容');

        const heroTitleElement = document.getElementById('heroTitle');
        const heroDescriptionElement = document.getElementById('heroDescription');

        if (heroTitleElement) {
            heroTitleElement.textContent = 'MangaPlaza, Your One-Stop Manga Website';
        }

        if (heroDescriptionElement) {
            heroDescriptionElement.textContent = 'Discover popular Japanese manga series with over 150,000 chapters to read on MangaPlaza! Sign up and read the 1st chapter of even more titles for FREE!';
        }
    }


    // 生成星級評分
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    }
}


// 當頁面載入完成後初始化輪播
document.addEventListener('DOMContentLoaded', function() {
    // 確保我們在漫畫頁面
    if (window.location.pathname.includes('comics.html') ||
        document.querySelector('#slider.slider-element')) {
        new ComicsHeroCarousel();
    }
});