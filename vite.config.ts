import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// 版本号唯一来源是 package.json，产物目录名随之生成
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')
) as { version: string }

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    open: true, // 项目启动后自动打开浏览器
    // 其他配置项，例如：
    port: 8888, // 指定端口
  },
  plugins: [
    vue(),
    vueJsx()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // scss全局变量的配置
  css: {
    preprocessorOptions: {
      scss: {
        javascriptEnabled: true,
        additionalData: '@import "./src/style/variables.scss";'
      }
    }
  },
  build: {
    // 产物直接输出为可加载的扩展目录（manifest/images/background 来自 public/）
    outDir: `NewTaber_v${pkg.version}`,
    emptyOutDir: true
  }
})
