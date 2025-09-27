@echo off
echo 啟動 Marco Academic 測試服務器...
echo 服務器將在 http://localhost:8080 運行
echo 按 Ctrl+C 停止服務器
echo.
echo 正在檢查 Python...
python --version
if %errorlevel% neq 0 (
    echo Python 未安裝或不在 PATH 中
    pause
    exit /b 1
)
echo.
echo 啟動服務器...
python -m http.server 8080
pause
