import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-64.png'],
      manifest: {
        name: 'TabataBeat — temporizador Tabata offline',
        short_name: 'TabataBeat',
        description: 'Temporizador Tabata simples e offline: define o número de tabatas e o descanso entre eles, carrega em play.',
        start_url: '/',
        display: 'standalone',
        background_color: '#12100e',
        theme_color: '#ff5a36',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,m4a}'],
        // The bundled workout audio (~3.4MB) exceeds Workbox's 2MB default precache limit.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  server: { host: '127.0.0.1' },
})
