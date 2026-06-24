@echo off
cd /d "%~dp0"
echo 正在启动旅游员工每日业绩统计软件...
echo.
echo 如果浏览器没有自动打开，请手动访问：
echo http://localhost:4173/index.html
echo.
start "" "http://localhost:4173/index.html"
python -m http.server 4173
if errorlevel 1 (
  echo.
  echo 未检测到 Python，请直接双击 index.html 打开，或先安装 Python。
  pause
)
