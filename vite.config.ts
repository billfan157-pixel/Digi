import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      org: 'digiwell',
      project: 'digiwell-app',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }) : null,
    process.env.CAPACITOR_BUILD !== 'true' ? VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'DigiWell - Hydration Tracker',
        short_name: 'DigiWell',
        description: 'Track your daily water intake with gamification and AI insights',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      }
    }) : null,
    visualizer({
      template: 'treemap',
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: process.env.CAPACITOR_BUILD === 'true' ? ['@capacitor/haptics', '@capacitor/share', '@capacitor/local-notifications'] : [],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true
  }
})
