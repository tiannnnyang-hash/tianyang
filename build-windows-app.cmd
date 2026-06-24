@echo off
cd /d "%~dp0"
echo 正在打包 Windows 安装包和便携版...
call npm.cmd run package:win
if errorlevel 1 (
  echo.
  echo 打包失败。请确认已经先双击 install-windows.cmd 安装依赖。
  pause
  exit /b 1
)
echo.
echo 打包完成，请查看 dist 文件夹。
pause
