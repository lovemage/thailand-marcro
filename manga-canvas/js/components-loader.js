// 載入共用組件的函數
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

// 頁面載入完成後載入組件
document.addEventListener('DOMContentLoaded', function() {
    // 載入導航組件
    if (document.getElementById('navbar-container')) {
        loadComponent('navbar-container', 'components/navbar.html');
    }

    // 載入Footer組件
    if (document.getElementById('footer-container')) {
        loadComponent('footer-container', 'components/footer.html');
    }
});