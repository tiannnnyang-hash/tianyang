#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
echo "正在启动旅游员工每日业绩统计软件..."
echo "如果浏览器没有自动打开，请手动访问：http://localhost:4173/index.html"
if command -v open >/dev/null 2>&1; then
  open "http://localhost:4173/index.html" || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:4173/index.html" || true
fi
python3 -m http.server 4173
