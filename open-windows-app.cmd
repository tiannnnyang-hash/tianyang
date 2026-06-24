@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "APP_FILE=%~dp0travel-dashboard.html"
echo 正在打开旅游员工每日业绩统计...
echo.
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%APP_FILE:\=/%"
  exit /b 0
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="file:///%APP_FILE:\=/%"
  exit /b 0
)
start "" "%APP_FILE%"
