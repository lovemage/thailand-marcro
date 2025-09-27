/**
 * CMS 數據加載器 - 動態加載 Netlify CMS 數據 (Marco Academic 版本)
 */

class CMSLoader {
    constructor() {
        this.dataCache = {};
        this.cacheTimestamp = {};
        this.cacheMaxAge = 5 * 60 * 1000; // 5分鐘緩存
    }

    /**
     * 清除過期緩存
     */
    clearExpiredCache(folder) {
        const now = Date.now();
        if (this.cacheTimestamp[folder] &&
            now - this.cacheTimestamp[folder] > this.cacheMaxAge) {
            console.log(`清除過期緩存: ${folder}`);
            delete this.dataCache[folder];
            delete this.cacheTimestamp[folder];
        }
    }

    /**
     * 解析 Markdown frontmatter
     */
    parseFrontmatter(content) {
        // 更靈活的 frontmatter 正則表達式，處理多行值
        const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
        const match = content.match(fmRegex);

        if (!match) {
            console.warn('無法匹配 frontmatter 格式:', content.substring(0, 150));
            // 嘗試直接解析為 YAML，可能缺少結尾的 ---
            const simpleRegex = /^---\r?\n([\s\S]*?)$/;
            const simpleMatch = content.match(simpleRegex);
            if (simpleMatch) {
                console.log('嘗試簡單格式解析');
                try {
                    const frontmatter = this.parseSimpleYAML(simpleMatch[1]);
                    return { frontmatter, content: '' };
                } catch (e) {
                    console.warn('簡單格式解析也失敗');
                }
            }
            return { frontmatter: {}, content: content };
        }

        const frontmatter = {};
        const yamlLines = match[1].split(/\r?\n/);

        yamlLines.forEach((line, index) => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();

                // 處理不同的 YAML 值格式
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value === 'true') {
                    value = true;
                } else if (value === 'false') {
                    value = false;
                } else if (!isNaN(value) && value !== '' && value !== 'null') {
                    value = Number(value);
                } else if (value.startsWith('>-')) {
                    // 處理多行文本
                    value = value.substring(2).trim();
                }

                // 移除可能的引號
                if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }

                frontmatter[key] = value;
                console.log(`解析屬性: ${key} = ${value} (類型: ${typeof value})`);
            }
        });

        return { frontmatter, content: match[2] };
    }

    /**
     * 解析簡單的 YAML 格式（處理多行值）
     */
    parseSimpleYAML(yamlString) {
        const lines = yamlString.split(/\r?\n/);
        const result = {};
        let currentKey = null;
        let currentValue = '';
        let inMultiLine = false;
        let multiLineStyle = '';

        for (let line of lines) {
            const originalLine = line;
            line = line.trim();

            if (!line || line.startsWith('#')) continue;

            if (line.includes(':') && !inMultiLine) {
                // 保存前一個鍵值對
                if (currentKey) {
                    let finalValue = currentValue;
                    if (multiLineStyle === '>-') {
                        // 折疊式多行，移除換行符但保留段落分隔
                        finalValue = finalValue.replace(/\n\s*\n/g, '\n\n').replace(/\n/g, ' ').trim();
                    }
                    result[currentKey] = finalValue.replace(/^["']|["']$/g, '').trim();
                }

                const colonIndex = line.indexOf(':');
                currentKey = line.substring(0, colonIndex).trim();
                currentValue = line.substring(colonIndex + 1).trim();

                // 檢查是否是YAML多行語法
                if (currentValue === '>-' || currentValue === '>' || currentValue === '|-' || currentValue === '|') {
                    inMultiLine = true;
                    multiLineStyle = currentValue;
                    currentValue = '';
                } else if ((currentValue.startsWith('"') && !currentValue.endsWith('"')) ||
                    (currentValue.startsWith("'") && !currentValue.endsWith("'"))) {
                    // 檢查是否是多行值（以引號開始但不結束）
                    inMultiLine = true;
                    multiLineStyle = 'quoted';
                } else {
                    inMultiLine = false;
                    multiLineStyle = '';
                }
            } else if (inMultiLine) {
                // 在多行模式下，檢查縮排來判斷是否還在同一個值中
                if (originalLine.startsWith('  ') || originalLine.startsWith('\t') || !originalLine.includes(':')) {
                    // 繼續多行值
                    if (currentValue) {
                        currentValue += '\n' + line;
                    } else {
                        currentValue = line;
                    }

                    // 檢查引號多行是否結束
                    if (multiLineStyle === 'quoted' &&
                        ((currentValue.startsWith('"') && line.endsWith('"')) ||
                         (currentValue.startsWith("'") && line.endsWith("'")))) {
                        inMultiLine = false;
                    }
                } else {
                    // 新的鍵開始，結束多行模式
                    if (currentKey) {
                        let finalValue = currentValue;
                        if (multiLineStyle === '>-') {
                            // 折疊式多行，移除換行符但保留段落分隔
                            finalValue = finalValue.replace(/\n\s*\n/g, '\n\n').replace(/\n/g, ' ').trim();
                        }
                        result[currentKey] = finalValue.replace(/^["']|["']$/g, '').trim();
                    }

                    // 處理當前行作為新的鍵值對
                    inMultiLine = false;
                    multiLineStyle = '';

                    const colonIndex = line.indexOf(':');
                    currentKey = line.substring(0, colonIndex).trim();
                    currentValue = line.substring(colonIndex + 1).trim();
                }
            }
        }

        // 保存最後一個鍵值對
        if (currentKey) {
            let finalValue = currentValue;
            if (multiLineStyle === '>-') {
                // 折疊式多行，移除換行符但保留段落分隔
                finalValue = finalValue.replace(/\n\s*\n/g, '\n\n').replace(/\n/g, ' ').trim();
            }
            result[currentKey] = finalValue.replace(/^["']|["']$/g, '').trim();
        }

        return result;
    }

    /**
     * 從 GitHub API 載入文件內容 (Marco Academic 版本)
     */
    async loadFromGitHub(folder, fileName) {
        // 注意：這裡需要調整為新的 GitHub repo 路徑
        // 目前暫時使用原路徑，後續需要建立新的 repo 或調整路徑
        const githubAPI = 'https://api.github.com/repos/lovemage/marco-academic/contents';
        const url = `${githubAPI}/_data/${folder}/${fileName}`;

        try {
            const response = await fetch(url);
            console.log(`API請求: ${url}, 狀態: ${response.status}`);

            if (response.status === 403) {
                console.warn(`GitHub API 403限制: ${fileName} - 跳過`);
                return null;
            }

            if (response.ok) {
                const data = await response.json();
                // GitHub API 返回 base64 編碼的內容，需要正確處理 UTF-8
                try {
                    const binaryString = atob(data.content);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const content = new TextDecoder('utf-8').decode(bytes);
                    return content;
                } catch (decodeError) {
                    console.warn(`內容解碼失敗: ${fileName}`, decodeError);
                    // 回退到簡單的 atob
                    const content = atob(data.content);
                    return content;
                }
            }
        } catch (error) {
            console.warn(`GitHub API 載入失敗: ${fileName}`, error);
        }
        return null;
    }

    /**
     * 載入並解析 Markdown 文件
     */
    async loadMarkdownFiles(folder) {
        // 檢查並清除過期緩存
        this.clearExpiredCache(folder);

        if (this.dataCache[folder]) {
            console.log(`使用緩存數據 ${folder}:`, this.dataCache[folder].length, '項目');
            return this.dataCache[folder];
        }

        try {
            const files = [];
            const fileList = await this.getFileList(folder);

            console.log(`嘗試載入 ${folder} 文件列表:`, fileList);

            // 如果獲取文件列表失敗，直接使用回退數據
            if (!fileList || fileList.length === 0) {
                console.warn(`${folder} 文件列表為空，使用回退數據`);
                throw new Error('文件列表為空');
            }

            // 添加延遲以避免 API 限制
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            let successCount = 0;
            let apiLimited = false;

            for (const fileName of fileList) {
                try {
                    let content = null;

                    // 優先嘗試本地路徑
                    const possiblePaths = [
                        `_data/${folder}/${fileName}`,
                        `/_data/${folder}/${fileName}`,
                        `./_data/${folder}/${fileName}`
                    ];

                    for (const path of possiblePaths) {
                        try {
                            const response = await fetch(path);
                            if (response.ok) {
                                content = await response.text();
                                console.log(`成功從本地載入: ${path}`);
                                break;
                            }
                        } catch (pathError) {
                            continue;
                        }
                    }

                    // 如果本地載入失敗，再嘗試 GitHub API
                    if (!content && !apiLimited && (successCount / Math.max(files.length, 1) > 0.3 || files.length < 2)) {
                        content = await this.loadFromGitHub(folder, fileName);
                        if (content) {
                            successCount++;
                            await delay(200); // 增加延遲避免 API 限制
                        } else {
                            // 如果前3次嘗試都失敗，標記為API受限
                            if (files.length >= 3 && successCount === 0) {
                                console.warn(`${folder} API連續失敗，切換到回退模式`);
                                apiLimited = true;
                            }
                            await delay(500); // API 失敗時更長延遲
                        }
                    }

                    if (content) {
                        const { frontmatter } = this.parseFrontmatter(content);
                        console.log(`解析 ${fileName} frontmatter:`, frontmatter);

                        if (frontmatter.published !== false) {
                            const fileData = {
                                ...frontmatter,
                                filename: fileName
                            };
                            console.log(`添加文件數據:`, fileData);
                            files.push(fileData);
                        }
                    } else {
                        console.warn(`無法載入文件: ${fileName}`);
                    }
                } catch (error) {
                    console.warn(`載入文件時發生錯誤: ${fileName}`, error);
                }
            }

            // 根據 order 排序
            files.sort((a, b) => (a.order || 999) - (b.order || 999));

            this.dataCache[folder] = files;
            this.cacheTimestamp[folder] = Date.now();
            console.log(`成功載入 ${files.length} 個 ${folder} 文件，已緩存`);
            return files;

        } catch (error) {
            console.error(`載入 ${folder} 數據失敗:`, error);
            return [];
        }
    }

    /**
     * 從 GitHub API 獲取文件列表 (Marco Academic 版本)
     */
    async getFileListFromGitHub(folder) {
        // 注意：這裡需要調整為新的 GitHub repo 路徑
        const githubAPI = 'https://api.github.com/repos/lovemage/marco-academic/contents';
        const url = `${githubAPI}/_data/${folder}`;

        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                return data
                    .filter(item => item.type === 'file' && item.name.endsWith('.md'))
                    .map(item => item.name);
            }
        } catch (error) {
            console.warn(`GitHub API 獲取文件列表失敗: ${folder}`, error);
        }
        return [];
    }

    /**
     * 獲取文件列表
     */
    async getFileList(folder) {
        // 首先嘗試從 GitHub API 獲取動態列表
        const githubFiles = await this.getFileListFromGitHub(folder);
        if (githubFiles.length > 0) {
            console.log(`從 GitHub 獲取到 ${githubFiles.length} 個 ${folder} 文件`);
            return githubFiles;
        }

        // 回退到硬編碼列表
        const knownFiles = {
            'properties': ['property-1.md', 'property-2.md', 'property-3.md', 'property-4.md', 'property-5.md', 'test-article.md'],
            'youtube': ['video-1.md', 'video-2.md', 'video-3.md', 'video-4.md'],
            'shorts': ['shorts-1.md', 'shorts-2.md', 'shorts-3.md', 'shorts-4.md', 'shorts-5.md', 'shorts-6.md'],
            'articles': [
                '2024-07-15-chiangmai-real-estate-investment-trends.md',
                '2024-07-10-thailand-property-purchase-guide.md',
                '2024-07-05-chiangmai-area-selection-guide.md'
            ]
        };

        return knownFiles[folder] || [];
    }

    /**
     * 從 CMS 文件中提取圖片路徑並確保正確格式
     */
    processImagePath(imagePath) {
        if (!imagePath) return 'images/portfolio/default.jpg';

        // 如果是完整的絕對路徑，移除開頭的 /
        if (imagePath.startsWith('/')) {
            return imagePath.substring(1);
        }

        // 如果已經是正確的相對路徑，直接返回
        if (imagePath.startsWith('images/')) {
            return imagePath;
        }

        // 如果是 HTTP 網址，直接返回
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // 其他情況，假設是文件名，添加到 images/uploads/
        return `images/uploads/${imagePath}`;
    }

    /**
     * 載入房產數據
     */
    async loadProperties() {
        return await this.loadMarkdownFiles('properties');
    }

    /**
     * 載入 YouTube 影片數據
     */
    async loadYouTubeVideos() {
        return await this.loadMarkdownFiles('youtube');
    }

    /**
     * 載入 YouTube Shorts 數據
     */
    async loadYouTubeShorts() {
        return await this.loadMarkdownFiles('shorts');
    }

    /**
     * 載入文章數據
     */
    async loadArticles() {
        return await this.loadMarkdownFiles('articles');
    }
}

/**
 * 動態生成房產項目 HTML
 */
function generatePropertyHTML(properties) {
    const loader = new CMSLoader();

    return properties.map((property, index) => {
        const workId = `workID-${index + 1}`;
        const gridClass = index % 3 === 0 ? 'fs' : index % 3 === 1 ? 'brand' : 'ill';
        const processedImage = loader.processImagePath(property.image);

        return `
            <div class="grid-item col-md-4 col-sm-4 col-xs-12 ${gridClass}">
                <div class="work-item">
                    <img src="${processedImage}" alt="${property.title}">
                    <div class="work-inner">
                        <a class="work-zoom" href="#${workId}"><i class="fa fa-search"></i></a>
                    </div>
                </div>
                <div id="${workId}" class="mfp-hide work-popup" data-mode="image">
                    <div class="work-popup-image-view active">
                        <img src="${processedImage}" alt="${property.title}">
                    </div>
                    <div class="work-popup-text-view">
                        <div class="work-popup-content">
                            <h3>${property.title}</h3>
                            <p>${property.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 動態生成 YouTube 影片 HTML
 */
function generateYouTubeHTML(videos) {
    return videos.slice(0, 4).map(video => `
        <div class="col-md-6 col-lg-3 youtube-item">
            <div class="youtube-card">
                <div class="youtube-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <div class="play-button">
                        <i class="fa fa-youtube-play"></i>
                    </div>
                </div>
                <div class="youtube-content">
                    <h4>${video.title}</h4>
                    <p>${video.description}</p>
                    <a href="${video.video_url}" target="_blank" class="youtube-link">
                        <i class="fa fa-youtube-play"></i> 觀看影片
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 動態生成 YouTube Shorts HTML
 */
function generateYouTubeShortsHTML(shorts) {
    console.log('生成 YouTube Shorts HTML，數據:', shorts);
    return shorts.slice(0, 6).map(short => {
        console.log('處理短影片:', short);

        // 安全地訪問屬性，提供默認值
        const title = short.title || short.filename || '短影片標題';
        const thumbnail = short.thumbnail || `https://img.youtube.com/vi/${short.video_id || 'default'}/hqdefault.jpg`;
        const shortsUrl = short.shorts_url || short.video_url || '#';

        console.log(`短影片數據: title="${title}", thumbnail="${thumbnail}", url="${shortsUrl}"`);

        return `
        <div class="col-md-4 col-sm-6 col-xs-12 shorts-item">
            <div class="shorts-card">
                <div class="shorts-thumbnail">
                    <img src="${thumbnail}" alt="${title}">
                    <div class="shorts-overlay">
                        <div class="shorts-play-button">
                            <i class="fa fa-youtube-play"></i>
                        </div>
                    </div>
                </div>
                <div class="shorts-content">
                    <h5>${title}</h5>
                    <a href="${shortsUrl}" target="_blank" class="shorts-link">
                        觀看 Shorts
                    </a>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

/**
 * 動態生成文章 HTML
 */
function generateArticlesHTML(articles) {
    const loader = new CMSLoader();

    return articles.slice(0, 3).map(article => {
        const date = new Date(article.date).toLocaleDateString('zh-TW');
        const processedImage = loader.processImagePath(article.image);
        return `
            <div class="col-md-4 col-sm-6 col-xs-12">
                <a href="${article.link || '#'}" class="blog-item">
                    <img src="${processedImage}" alt="${article.title}">
                    <div class="blog-item-text">
                        <h3>${article.title}</h3>
                        <p>${article.excerpt}</p>
                        <div class="blog-meta">
                            <span><i class="fa fa-user"></i> ${article.author}</span>
                            <span><i class="fa fa-calendar"></i> ${date}</span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}

/**
 * 回退數據（如果 CMS 載入失敗時使用）
 */
const fallbackData = {
    properties: [
        {
            title: "TEST ARTICLE",
            image: "images/uploads/螢幕擷取畫面-2025-09-24-091449.png",
            description: "TEST",
            category: "獨棟別墅",
            published: true,
            order: 6
        },
        {
            title: "清邁市中心精品公寓",
            image: "images/portfolio/23.jpeg",
            description: "位於清邁古城區黃金地段，步行即可到達週六夜市和塔佩門。現代化設計融合蘭納風格，24小時保全，游泳池及健身房等完整設施。適合投資收租或自住。"
        },
        {
            title: "機場附近商業大樓",
            image: "images/portfolio/44.jpg",
            description: "緊鄰清邁國際機場，交通極為便利。適合開設旅館、民宿或商業用途。完整的商業設施配置，停車空間充足，是商業投資的絕佳選擇。"
        },
        {
            title: "素帖山景觀公寓",
            image: "images/portfolio/55.jpg",
            description: "面向素帖山美景，環境清幽自然。採光極佳的高樓層設計，遠眺清邁市區夜景。社區規劃完善，綠化面積大，是享受清邁慢活的理想選擇。"
        },
        {
            title: "湄平河景別墅",
            image: "images/portfolio/1177421_16090215560046055777.jpg",
            description: "坐擁湄平河第一排水岸景觀，獨棟別墅設計。寬敞的河景露台，私人碼頭，奢華裝潢。適合高端客群投資或度假使用，極具增值潛力。"
        },
        {
            title: "杭東夜市商業店面",
            image: "images/portfolio/77.jpeg",
            description: "位於著名的杭東夜市旁，人流密集商機無限。一樓店面加二樓住宅設計，可經營餐廳、咖啡廳等。是小本創業或投資收租的好選擇。"
        }
    ],
    videos: [
        {
            title: "清邁房產投資指南",
            video_id: "Zw9MUMQa7MI",
            video_url: "https://youtu.be/Zw9MUMQa7MI",
            description: "Marco分享清邁房地產投資的重要注意事項",
            thumbnail: "https://img.youtube.com/vi/Zw9MUMQa7MI/hqdefault.jpg"
        },
        {
            title: "清邁生活體驗分享",
            video_id: "iNNH6Cew1VU",
            video_url: "https://youtu.be/iNNH6Cew1VU",
            description: "8年清邁生活經驗，帶您了解真實的清邁",
            thumbnail: "https://img.youtube.com/vi/iNNH6Cew1VU/hqdefault.jpg"
        },
        {
            title: "房產實地考察",
            video_id: "mHcaldyv-NQ",
            video_url: "https://youtu.be/mHcaldyv-NQ",
            description: "跟著Marco實地探訪清邁優質房產項目",
            thumbnail: "https://img.youtube.com/vi/mHcaldyv-NQ/hqdefault.jpg"
        },
        {
            title: "泰國買房流程",
            video_id: "TTkIYHOIado",
            video_url: "https://youtu.be/TTkIYHOIado",
            description: "詳細解說外國人在泰國購房的完整流程",
            thumbnail: "https://img.youtube.com/vi/TTkIYHOIado/hqdefault.jpg"
        }
    ],
    shorts: [
        {
            title: "清邁買房重點提醒",
            video_id: "VHHCbfO6QHo",
            shorts_url: "https://youtube.com/shorts/VHHCbfO6QHo?si=9ZYK6pn4iKA7gvoH",
            thumbnail: "https://img.youtube.com/vi/VHHCbfO6QHo/hqdefault.jpg"
        },
        {
            title: "泰國房產投資秘訣",
            video_id: "0tAGzff_sz0",
            shorts_url: "https://youtube.com/shorts/0tAGzff_sz0?si=bV6gGN9jtv0kq7L8",
            thumbnail: "https://img.youtube.com/vi/0tAGzff_sz0/hqdefault.jpg"
        },
        {
            title: "清邁區域選擇建議",
            video_id: "j6Utz5shepU",
            shorts_url: "https://youtube.com/shorts/j6Utz5shepU?si=eR2gx4IjhP6kw19N",
            thumbnail: "https://img.youtube.com/vi/j6Utz5shepU/hqdefault.jpg"
        },
        {
            title: "房產價格趨勢分析",
            video_id: "wQ3p3rqWaCk",
            shorts_url: "https://youtube.com/shorts/wQ3p3rqWaCk?si=ayixw7Yqa6gVBTjY",
            thumbnail: "https://img.youtube.com/vi/wQ3p3rqWaCk/hqdefault.jpg"
        },
        {
            title: "清邁房市最新動態",
            video_id: "S-h41KSQW8g",
            shorts_url: "https://youtube.com/shorts/S-h41KSQW8g?si=xRMVY2_ikE55rQlG",
            thumbnail: "https://img.youtube.com/vi/S-h41KSQW8g/hqdefault.jpg"
        },
        {
            title: "房產投資風險提醒",
            video_id: "BtlplUKI0b8",
            shorts_url: "https://youtube.com/shorts/BtlplUKI0b8?si=xvTS5Ebi_cOTWE7a",
            thumbnail: "https://img.youtube.com/vi/BtlplUKI0b8/hqdefault.jpg"
        }
    ],
    articles: [
        {
            title: "2024清邁房地產投資趨勢分析",
            image: "images/blog/blog1.jpg",
            excerpt: "隨著泰國經濟復甦，清邁房地產市場呈現穩健成長。Marco深度分析市場現況，為投資者提供最新的投資策略建議。",
            author: "Marco",
            date: "2024-07-15",
            link: "single-blog.html"
        },
        {
            title: "泰國房產購買完整指南",
            image: "images/blog/blog2.jpg",
            excerpt: "從看房到交屋的完整流程解析，包含法律程序、貸款申請、稅務規劃等重要環節。讓您安心完成清邁房產投資。",
            author: "Marco",
            date: "2024-07-10",
            link: "single-blog.html"
        },
        {
            title: "清邁生活圈選房攻略",
            image: "images/blog/blog3.jpg",
            excerpt: "古城區、尼曼區、機場周邊各有什麼特色？Marco分享8年在地經驗，教您如何選擇最適合的居住區域。",
            author: "Marco",
            date: "2024-07-05",
            link: "single-blog.html"
        }
    ]
};

/**
 * 初始化並載入所有 CMS 數據 (Marco Academic 版本)
 */
async function initializeCMS() {
    const loader = new CMSLoader();

    try {
        console.log('正在載入 CMS 數據...');
        console.log('DOM 載入狀態:', document.readyState);

        // 載入房產數據
        let properties = [];
        try {
            console.log('開始載入房產數據...');

            // 優先嘗試本地載入，GitHub API 作為備用
            properties = await loader.loadProperties();
            console.log(`從 CMS 載入了 ${properties.length} 個房產項目`);
            if (properties.length === 0) {
                throw new Error('CMS 返回空數據');
            }
        } catch (error) {
            console.warn('CMS 數據載入失敗，使用回退數據:', error.message);
            properties = fallbackData.properties;
            console.log(`使用回退數據，共 ${properties.length} 個房產項目`);
        }

        const propertiesContainer = document.querySelector('.portfolios-section .portfolio_container');
        console.log('房產容器:', propertiesContainer);
        if (propertiesContainer) {
            const loadingEl = propertiesContainer.querySelector('#properties-loading');
            console.log('載入指示器:', loadingEl);
            if (loadingEl) loadingEl.remove();
            propertiesContainer.innerHTML = generatePropertyHTML(properties);
            console.log(`成功載入 ${properties.length} 個房產項目到頁面`);
        } else {
            console.error('找不到房產容器！選擇器: .portfolios-section .portfolio_container');
        }

        // 載入文章數據
        let articles = [];
        try {
            articles = await loader.loadArticles();
            console.log(`從 CMS 載入了 ${articles.length} 篇文章`);
            if (articles.length === 0) {
                throw new Error('CMS 返回空數據');
            }
        } catch (error) {
            console.warn('CMS 文章數據載入失敗，使用回退數據:', error.message);
            articles = fallbackData.articles;
        }

        const articlesContainer = document.querySelector('.blog-section .row');
        if (articlesContainer) {
            const loadingEl = articlesContainer.querySelector('#articles-loading');
            if (loadingEl) loadingEl.remove();
            articlesContainer.innerHTML = generateArticlesHTML(articles);
            console.log(`載入了 ${articles.length} 篇文章`);
        }

        console.log('CMS 數據載入完成');

    } catch (error) {
        console.error('載入 CMS 數據時發生錯誤:', error);

        // 完全回退模式
        console.log('進入完全回退模式...');

        const propertiesContainer = document.querySelector('.portfolios-section .portfolio_container');
        if (propertiesContainer) {
            propertiesContainer.innerHTML = generatePropertyHTML(fallbackData.properties);
        }

        const articlesContainer = document.querySelector('.blog-section .row');
        if (articlesContainer) {
            articlesContainer.innerHTML = generateArticlesHTML(fallbackData.articles);
        }
    }
}

// 確保 DOM 完全載入後再初始化 CMS
function ensureDOMLoaded() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCMS);
    } else {
        // DOM 已經載入完成
        setTimeout(initializeCMS, 500); // 延遲確保所有元素都渲染完成
    }
}

// 如果 jQuery 可用，也在 jQuery ready 時執行
if (typeof $ !== 'undefined') {
    $(document).ready(function() {
        console.log('jQuery DOM ready, 開始初始化 CMS...');
        setTimeout(initializeCMS, 500); // 增加延遲確保所有元素都渲染完成
    });
} else {
    console.log('jQuery 不可用，使用原生 DOM 載入');
    ensureDOMLoaded();
}
