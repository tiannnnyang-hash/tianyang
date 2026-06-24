@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在安装 Windows 桌面 App 依赖...
echo.
echo 提示：如果你只是想使用软件，不需要安装依赖，直接双击 open-windows-app.cmd 即可。
echo.
where node.exe >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。
  echo 请先安装 Node.js，或者直接双击 open-windows-app.cmd 使用免安装版本。
  goto end
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo 未检测到 npm.cmd。
  echo 请重新安装 Node.js，或者直接双击 open-windows-app.cmd 使用免安装版本。
  goto end
)
echo 正在执行 npm.cmd install，请稍等...
call npm.cmd install
if errorlevel 1 (
  echo.
  echo 安装失败。可能是网络无法下载 Electron 依赖。
  echo 你仍然可以直接双击 open-windows-app.cmd 使用免安装版本。
  goto end
)
echo.
echo 安装完成。接下来可以双击 run-windows-app.cmd 试运行桌面 App。
:end
echo.
echo 按任意键关闭窗口...
pause >nul
