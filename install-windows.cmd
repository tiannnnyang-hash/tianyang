@echo off
cd /d "%~dp0"
echo 正在安装 Windows 桌面 App 依赖...
echo 如果 PowerShell 提示禁止运行脚本，请用这个 .cmd 文件安装，不要直接输入 npm install。
call npm.cmd install
if errorlevel 1 (
  echo.
  echo 安装失败。请确认已经安装 Node.js，并且当前网络可以访问 npm。
  pause
  exit /b 1
)
echo.
echo 安装完成。接下来可以双击 run-windows-app.cmd 试运行。
pause
