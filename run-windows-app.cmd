@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动旅游员工每日业绩统计桌面 App...
echo.
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo 未检测到 npm.cmd。请先安装 Node.js。
  echo 如果你只是想使用软件，请直接双击 open-windows-app.cmd。
  goto end
)
if not exist "node_modules\electron" (
  echo 未检测到 Electron 依赖。请先双击 install-windows.cmd。
  echo 如果安装失败，也可以直接双击 open-windows-app.cmd 使用免安装版本。
  goto end
)
call npm.cmd start
if errorlevel 1 (
  echo.
  echo 启动失败。你可以直接双击 open-windows-app.cmd 使用免安装版本。
)
:end
echo.
echo 按任意键关闭窗口...
pause >nul
