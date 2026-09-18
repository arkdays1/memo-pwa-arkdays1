import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        name: '备忘录',
        short_name: '备忘录',
        description: '本地备忘录（无同步）',
        theme_color: '#0b0c10',
        background_color: '#0b0c10',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      // 让 React SPA 在离线时也能回退到 index.html
      workbox: {
        navigateFallback: '/'
      },

      // 可选：让你在 dev 模式也能看到 SW 注册（但注意 dev 体验不等于真实安装体验）
      devOptions: {
        enabled: true
      }
    })
  ]
})