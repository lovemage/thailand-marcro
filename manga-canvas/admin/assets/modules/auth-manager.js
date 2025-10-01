// 認證管理模組
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }

    // 檢查認證狀態
    checkAuth() {
        if (!this.token) {
            window.location.href = '/admin/index.html';
            return false;
        }

        // 驗證 token
        return fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                this.logout();
                return false;
            } else {
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = result.user.username;
                }
                return true;
            }
        })
        .catch(() => {
            this.logout();
            return false;
        });
    }

    // 登出功能
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/admin/index.html';
    }

    // 獲取認證 headers
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // 檢查是否已登入
    isAuthenticated() {
        return !!this.token;
    }

    // 更新用戶資訊
    updateUser(userData) {
        this.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));
    }

    // 設置新的 token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }
}

// 導出單例實例
window.authManager = new AuthManager();