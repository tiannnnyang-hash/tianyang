@echo off
cd /d "%~dp0"
echo 正在启动旅游员工每日业绩统计桌面 App...
call npm.cmd start
if errorlevel 1 (
  echo.
  echo 启动失败。请先双击 install-windows.cmd 安装依赖。
  pause
  exit /b 1
)
