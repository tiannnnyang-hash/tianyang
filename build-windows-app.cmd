@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在打包 Windows 安装包和便携版...
echo.
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo 未检测到 npm.cmd。请先安装 Node.js。
  goto end
)
if not exist "node_modules\electron-builder" (
  echo 未检测到 electron-builder 依赖。请先双击 install-windows.cmd。
  goto end
)
call npm.cmd run package:win
if errorlevel 1 (
  echo.
  echo 打包失败。请确认已经先双击 install-windows.cmd 安装依赖。
  goto end
)
echo.
echo 打包完成，请查看 dist 文件夹。
:end
echo.
echo 按任意键关闭窗口...
pause >nul
