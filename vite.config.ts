import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Vision Trainer',
        short_name: 'VisionTrainer',
        description: 'Local-first perceptual learning platform for contrast sensitivity training.',
        theme_color: '#0c0c1d',
        background_color: '#101820',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages'
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
});
