import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const sentryRelease =
  process.env.SENTRY_RELEASE ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      org: 'digiwell',
      project: 'digiwell-app',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/assets/**',
        ignore: ['./node_modules/**'],
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
      release: {
        name: sentryRelease,
        setCommits: {
          auto: true,
          ignoreMissing: true,
        },
        deploy: {
          env: process.env.VITE_APP_ENV || process.env.NODE_ENV || 'production',
        },
      },
    }) : null,
    process.env.CAPACITOR_BUILD !== 'true' ? VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-icon.svg', 'icons.svg'],
      manifest: {
        name: 'DigiWell - Hydration Tracker',
        short_name: 'DigiWell',
        description: 'Track your daily water intake with gamification and AI insights',
        theme_color: '#06B6D4',
        background_color: '#020617',
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
        globIgnores: ['**/stats.html', '**/push-sw.js'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Static assets (JS, CSS) — hashed filenames, safe to cache long-term
            urlPattern: /\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            // Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Image assets (PNG, SVG, WebP, AVIF)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Supabase API calls — always fetch fresh, fallback to cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
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
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? true : false,
    rollupOptions: {
      external: process.env.CAPACITOR_BUILD === 'true' ? ['@capacitor/haptics', '@capacitor/share', '@capacitor/local-notifications'] : [],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'vendor';
            if (id.includes('react/') || id.includes('react-is') || id.includes('scheduler')) return 'vendor';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('clsx') || id.includes('tailwind-merge')) return 'ui';
            if (id.includes('@sentry')) return 'sentry';
            if (id.includes('framer-motion') || id.includes('motion')) return 'motion';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
            if (id.includes('@tanstack')) return 'query';
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
