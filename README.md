# Chrome New Tab Page Extension

现代化 Chrome 新标签页扩展，提供节日展示和系统主题自适应功能。

## 功能特性

- ✨ **节日动态展示**：根据当前日期自动显示节假日信息
- 🌓 **智能主题切换**：自动跟随系统设置的白天/夜间模式
- 🎨 **全新首页设计**：基于 Vue3 重构的现代化界面
- ⚡ **轻量高效**：优化性能与资源占用

## 扩展资源

- **timor.tech API**: 用于获取节假日信息（下一个节假日、月度节假日和节假日提示）
  - 网站: http://timor.tech/api/holiday/
  - 用途: 为扩展提供节假日数据

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
3. 构建生产版本：
   ```bash
   npm run build
   ```
4. 在 Chrome 中加载扩展：
   - 打开 `chrome://extensions`
   - 启用开发者模式
   - 点击"加载已解压的扩展程序"
   - 选择 `dist` 目录

## 开发环境

```bash
# 启动开发服务器
npm run dev

# 打包生产版本
npm run build
```

## 项目结构

```
├── public/        # 静态资源
├── src/           # 源代码
│   ├── assets/    # 静态资源
│   ├── components # Vue 组件
│   ├── pages/     # 页面组件
│   └── main.js    # 入口文件
├── dist/          # 构建输出目录
└── package.json   # 项目配置
```

> 本项目基于 Vue3 构建，使用现代前端技术栈开发。\
> 当前版本：v3.0.0 | 最后更新：2026-04-14
