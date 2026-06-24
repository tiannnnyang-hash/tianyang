# 旅游员工每日业绩统计

一个无需后端的轻量级网页工具，适合旅行社或旅游销售团队记录员工每日数据。

## 功能

- 新增、编辑、删除每日员工记录
- 统计咨询量、加粉量、成交单数、成交率、成交金额
- 自动汇总当前筛选结果的团队总览
- 按员工姓名或日期搜索
- 数据保存在浏览器 `localStorage` 中
- 一键导出 CSV，方便用 Excel/WPS 继续分析


## 一个文件版本

如果你只想下载一个文件，请下载并双击：

```text
travel-dashboard.html
```

或者下载中文文件名版本：`旅游员工每日业绩统计-直接打开.html`。

这个文件已经把页面、样式和功能代码合在一起，不需要再下载 `styles.css` 或 `app.js`。

## 在自己电脑上打开

### 最简单方式

1. 把整个项目文件夹下载到你的电脑。
2. 双击 `index.html` 即可打开软件。
3. 录入的数据会保存在当前电脑的浏览器里。

> 注意：不要只复制 `index.html` 一个文件，`styles.css` 和 `app.js` 也要放在同一个文件夹里。

### Windows 推荐方式

双击 `start-windows.bat`，它会自动启动本地服务并打开浏览器。

### Mac / Linux 推荐方式

在项目目录执行：

```bash
./start-mac-linux.sh
```

或者手动启动：

```bash
python3 -m http.server 4173
```

然后访问 <http://localhost:4173/index.html>。

## Windows 桌面 App 版本

如果你想把它做成 Windows 电脑端 App，可以使用项目里的 Electron 配置打包。

### 推荐：直接双击脚本

PowerShell 可能会因为系统策略禁止直接执行 `npm.ps1`。为了避免这个问题，Windows 上优先使用下面这些 `.cmd` 文件：

1. 先安装 Node.js。
2. 双击 `install-windows.cmd` 安装依赖。
3. 双击 `run-windows-app.cmd` 试运行桌面 App。
4. 双击 `build-windows-app.cmd` 打包 Windows 安装包和便携版。

打包完成后，安装包会出现在 `dist` 目录里。安装后可以像普通 Windows 软件一样从桌面图标或开始菜单打开。

### 如果你想继续用 PowerShell

如果 PowerShell 提示“禁止运行脚本”，可以改用下面的命令，注意是 `npm.cmd`：

```powershell
npm.cmd install
npm.cmd start
npm.cmd run package:win
```

也可以用 Windows 自带的“命令提示符 CMD”打开项目目录，再执行：

```cmd
npm install
npm start
npm run package:win
```
