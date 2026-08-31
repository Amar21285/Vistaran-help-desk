import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['icons/icon-512x512.png', 'vistaran-logo.png', 'vistaran-logo.svg'],
        manifest: {
          name: 'Vistaran Help Desk',
          short_name: 'Vistaran',
          description: 'IT Support Ticket Management System for unified service architecture',
          theme_color: '#3b82f6',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'any',
          start_url: './',
          scope: './',
          icons: [
            {
              src: './icons/icon-512x512.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: './icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: './icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdnjs-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    // Use relative base path to ensure assets load correctly on GitHub Pages or cPanel
    base: './',
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  };
});