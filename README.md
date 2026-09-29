<div align="center">
  <img align="center" src="images/icon32.png" alt="logo" >
  &nbsp;
  <strong>NewTaber（Vue3 + TypeScript）</strong>
</div>

<br>

<div style="display: flex; align-items: center;justify-content: center;margin: 30px 0;">
  <img src="images/preview.png" alt="logo">
</div>

<br>

# Chrome New Tab Page Extension

现代化 Chrome 新标签页扩展，提供节日展示和系统主题自适应功能。

## 功能特性

- ✨ **节日动态展示**：根据当前日期自动显示节假日信息
- 🌓 **智能主题切换**：自动跟随系统设置的白天/夜间模式
- 🎨 **全新首页设计**：基于 Vue3 重构的现代化界面
- ⚡ **轻量高效**：优化性能与资源占用

## 扩展资源

### 节假日数据

三级数据源，优先级由高到低，**永不为空**：

| 优先级 | 来源 | 说明 |
|---|---|---|
| 1 | `localStorage` | 服务器最近一次成功拉取，**永不过期** |
| 2 | `src/data/holidays.json` | 打包内置种子，当前年 ±1 年 |
| 3 | 空态 | 仅当 1、2 都无效（正常路径不可达） |

数据链路：

```
国务院办公厅公告（每年 11 月初）
  → chinese-days 当天同步（上游，MIT）
  → 服务器 cron 每天一次拉取并生成 holiday.json
  → 扩展开新标签时后台刷新（缓存周期 24 小时）
```

全程不需要重新打包、刷新或重装扩展，公告后最坏约 2 天生效（服务器次日 07:15 拉取 + 扩展 24 小时缓存）。

- 结构：`HolidayDataset { version, generated_at, years, holidays }`，`holidays[date] = { type, week, name }`，`type` 2=休 3=班
- 拉取失败（断网 / 超时 / 服务器不可用）→ **保持原有数据不变**，静默降级
- 节假日名称采用上游原样名（如「中秋」而非「中秋节」）

### 配置服务器地址

服务器地址不写在代码里，通过 `.env` 注入：

```bash
cp .env.example .env
# 编辑 .env
VITE_HOLIDAY_API=https://你的域名/holiday/holiday.json
```

- `.env` 已被 gitignore，不会提交
- 留空 = 不请求远程，仅使用内置种子
- 构建时自动校验并写入 `manifest.json` 的 `host_permissions`（支持 http/https，非法 URL 直接构建失败）

### 部署数据服务（服务器侧）

1. 上传 `server/build-holiday.mjs` 与 `server/update.sh` 到 `/opt/holiday/`
2. 手动跑一次验证：
   ```bash
   /opt/holiday/update.sh /var/www/holiday/holiday.json
   curl -i https://你的域名/holiday/holiday.json
   ```
3. 配置 crontab（每天一次）：
   ```cron
   15 7 * * * /opt/holiday/update.sh /var/www/holiday/holiday.json >> /var/log/holiday.log 2>&1
   ```
   国务院一年只发布一次（11 月初），上游偶有年中补丁，故每日一次足够；脚本幂等，内容没变不会写文件，失败次日自动重试。想更省可改为每周一：`15 7 * * 1`。
4. （可选）配置运行通知：**每次运行**（数据更新 / 无变化 / 失败）都向飞书群机器人推送一条结果摘要
   ```bash
   cp server/.env.example /opt/holiday/.env
   # 编辑 /opt/holiday/.env
   FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx
   ```
   Webhook 地址获取：飞书群 → 设置 → 群机器人 → 添加自定义机器人。不配置则不通知；通知失败只记日志，不影响数据更新。通知为富文本格式，含时间与耗时；如需指定时区可在 `.env` 中加 `TZ_NOTIFY=Asia/Shanghai`（默认跟随服务器 TZ）。
5. nginx 开启 CORS 与缓存：
   ```nginx
   location /holiday/ {
       root /var/www;
       add_header Access-Control-Allow-Origin * always;
       add_header Cache-Control "public, max-age=3600";
   }
   ```

### 更新内置种子数据

种子只在「服务器从未成功过」时生效，每年发版前更新一次即可：

```bash
npm run update:seed
```

## 安装指南

1. 克隆项目：
   ```bash
   git clone https://github.com/your-username/chrome-extension-newtab.git
   cd chrome-extension-newtab
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 配置数据接口（可选，留空则只用内置种子）：
   ```bash
   cp .env.example .env
   ```
4. 构建生产版本：
   ```bash
   npm run build
   ```
5. 在 Chrome 中加载扩展：
   - 打开 `chrome://extensions`
   - 启用开发者模式
   - 点击"加载已解压的扩展程序"
   - 选择 `NewTaber_v<版本号>` 目录（如 `NewTaber_v3.1.0`）

## 开发环境

```bash
# 启动开发服务器
npm run dev

# 打包生产版本（产物输出到 NewTaber_v<版本号>/）
npm run build

# 更新内置节假日种子
npm run update:seed
```

### 版本号

版本号唯一来源是 `package.json`，改完代码后升一档再构建：

```bash
npm run bump -- patch   # 修 bug / 小改动   3.1.0 → 3.1.1
npm run bump -- minor   # 新增功能         3.1.0 → 3.2.0
npm run bump -- major   # 不兼容改动       3.1.0 → 4.0.0
```

`bump` 会同步 `package.json` / `package-lock.json` / `public/manifest.json` 三处版本号，随后 `npm run build` 会：

- 生成 `NewTaber_v<新版本号>/` 目录，并把版本号写进产物 `manifest.json`
- 自动删除上一个版本的产物目录（只匹配 `NewTaber_vX.Y.Z` 形式）

## 项目结构

```
├── public/               # 静态资源（manifest.json / background.js / images）
├── scripts/
│   ├── build-seed.mjs    # 生成内置种子数据
│   ├── apply-config.mjs  # 构建后写入 manifest 版本号 + host_permissions，清理旧产物
│   └── sync-manifest.mjs # bump 时同步 public/manifest.json 版本号
├── server/               # 服务器侧数据生成脚本
├── src/
│   ├── data/holidays.json    # 内置种子数据
│   ├── utils/holidayData.ts  # 三级数据源 + 缓存 + 拉取
│   └── views/                # 页面组件
├── NewTaber_v<版本号>/   # 构建输出，可直接加载的扩展目录（不入库，需自行构建）
└── package.json
```

> 本项目基于 Vue3 构建，使用现代前端技术栈开发。\
> 当前版本：v3.0.0 | 最后更新：2026-04-14
