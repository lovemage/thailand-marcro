// 檔案管理模組
class FileManager {
    constructor() {
        this.uploadedFiles = [];
        this.supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    // 初始化拖拽上傳功能
    initDragAndDrop() {
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
                    const input = area.onclick?.toString().includes('coverUpload') ?
                        document.getElementById('coverUpload') :
                        document.getElementById('pagesUpload');

                    if (input) {
                        input.files = files;
                        const event = new Event('change', { bubbles: true });
                        input.dispatchEvent(event);
                    }
                }
            });
        });
    }

    // 處理檔案選擇
    handleFileSelect(event, type) {
        const files = Array.from(event.target.files);

        // 驗證檔案
        const validFiles = this.validateFiles(files);
        if (validFiles.length === 0) return;

        if (type === 'cover') {
            if (validFiles.length > 0) {
                this.previewCoverImage(validFiles[0]);
            }
        } else if (type === 'pages') {
            this.previewPages(validFiles);
        }
    }

    // 驗證檔案
    validateFiles(files) {
        const validFiles = [];

        files.forEach(file => {
            // 檢查檔案類型
            if (!this.supportedImageTypes.includes(file.type)) {
                this.showMessage(`不支援的檔案格式: ${file.name}`, 'warning');
                return;
            }

            // 檢查檔案大小
            if (file.size > this.maxFileSize) {
                this.showMessage(`檔案過大: ${file.name} (最大 10MB)`, 'warning');
                return;
            }

            validFiles.push(file);
        });

        return validFiles;
    }

    // 預覽封面圖片
    previewCoverImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const uploadArea = document.querySelector('#coverUpload').parentElement.querySelector('.upload-area');
            if (uploadArea) {
                uploadArea.innerHTML = `
                    <img src="${e.target.result}"
                         style="max-width: 100%; max-height: 200px; border-radius: 10px; object-fit: cover;">
                    <p class="text-muted mt-2 mb-0">${file.name}</p>
                    <button type="button" class="btn btn-sm btn-outline-danger mt-2"
                            onclick="fileManager.clearCoverPreview()">
                        <i class="fas fa-times"></i> 移除
                    </button>
                `;
            }
        };
        reader.readAsDataURL(file);
    }

    // 清除封面預覽
    clearCoverPreview() {
        const uploadArea = document.querySelector('#coverUpload').parentElement.querySelector('.upload-area');
        const coverInput = document.getElementById('coverUpload');

        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">點擊選擇封面圖片</p>
                <small class="text-muted">或拖拽文件到此處</small>
            `;
        }

        if (coverInput) {
            coverInput.value = '';
        }
    }

    // 預覽漫畫頁面
    previewPages(files) {
        const previewContainer = document.getElementById('uploadPreview');
        if (!previewContainer) return;

        previewContainer.innerHTML = '';

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <div class="position-relative">
                        <img src="${e.target.result}" alt="頁面 ${index + 1}"
                             style="width: 100px; height: 140px; object-fit: cover; border-radius: 8px;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                style="padding: 2px 6px; font-size: 10px;"
                                onclick="fileManager.removePreview(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="text-center mt-1">
                            <small class="text-muted">第 ${index + 1} 頁</small>
                        </div>
                    </div>
                `;
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });

        this.uploadedFiles = files;
    }

    // 移除預覽頁面
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

    // 上傳單個檔案到 Cloudinary
    async uploadSingleFile(file, type = 'image') {
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', type);

            const response = await fetch('/api/upload/cloudinary', {
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
                throw new Error(result.message || '上傳失敗');
            }
        } catch (error) {
            console.error('檔案上傳錯誤:', error);
            throw error;
        }
    }

    // 上傳多個檔案
    async uploadMultipleFiles(files, type = 'image') {
        const uploadPromises = files.map(file => this.uploadSingleFile(file, type));

        try {
            const results = await Promise.allSettled(uploadPromises);
            const successUrls = [];
            const errors = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successUrls.push(result.value);
                } else {
                    errors.push(`文件 ${index + 1} 上傳失敗: ${result.reason.message}`);
                }
            });

            if (errors.length > 0) {
                console.warn('部分檔案上傳失敗:', errors);
            }

            return {
                success: successUrls.length > 0,
                urls: successUrls,
                errors: errors
            };
        } catch (error) {
            console.error('批量上傳錯誤:', error);
            throw error;
        }
    }

    // 上傳封面圖片
    async uploadCoverImage() {
        const coverInput = document.getElementById('coverUpload');
        if (!coverInput || !coverInput.files[0]) {
            return null;
        }

        try {
            const url = await this.uploadSingleFile(coverInput.files[0], 'cover');
            return url;
        } catch (error) {
            this.showMessage('封面圖片上傳失敗', 'error');
            throw error;
        }
    }

    // 上傳漫畫頁面
    async uploadMangaPages() {
        const pagesInput = document.getElementById('pagesUpload');
        if (!pagesInput || pagesInput.files.length === 0) {
            return [];
        }

        try {
            const result = await this.uploadMultipleFiles(Array.from(pagesInput.files), 'manga-page');

            if (result.errors.length > 0) {
                this.showMessage(`部分頁面上傳失敗: ${result.errors.join(', ')}`, 'warning');
            }

            return result.urls;
        } catch (error) {
            this.showMessage('漫畫頁面上傳失敗', 'error');
            throw error;
        }
    }

    // 重置上傳狀態
    resetUploadState() {
        // 重置表單
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.reset();
        }

        // 清空預覽
        const previewContainer = document.getElementById('uploadPreview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }

        // 重置上傳區域
        this.clearCoverPreview();

        const pagesUploadArea = document.querySelector('#pagesUpload').parentElement.querySelector('.upload-area');
        if (pagesUploadArea) {
            pagesUploadArea.innerHTML = `
                <i class="fas fa-images fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">選擇漫畫頁面文件</p>
                <small class="text-muted">支援多選，按頁面順序選擇</small>
            `;
        }

        this.uploadedFiles = [];
    }

    // 檢查檔案是否為圖片
    isImageFile(file) {
        return this.supportedImageTypes.includes(file.type);
    }

    // 格式化檔案大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 生成縮圖
    async generateThumbnail(file, maxWidth = 200, maxHeight = 200) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const { width, height } = this.calculateAspectRatio(
                    img.width, img.height, maxWidth, maxHeight
                );

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // 計算縮放比例
    calculateAspectRatio(originalWidth, originalHeight, maxWidth, maxHeight) {
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        return {
            width: Math.round(originalWidth * ratio),
            height: Math.round(originalHeight * ratio)
        };
    }

    // 顯示訊息（依賴於其他模組）
    showMessage(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // 這裡可以整合到 UI 管理模組的通知系統
    }
}

// 導出單例實例
window.fileManager = new FileManager();