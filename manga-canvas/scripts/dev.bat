@echo off
echo 正在清理端口3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo 正在停止所有Node程序...
taskkill /f /im node.exe >nul 2>&1

echo 等待2秒...
timeout /t 2 /nobreak >nul

echo 啟動開發伺服器...
cd /d "%~dp0.."
npm run dev