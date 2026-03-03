import { defineConfig, ConfigEnv, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const isDev = mode === 'development'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['share.svg', 'robots.txt'],
        manifest: {
          name: 'shaRe Member',
          short_name: 'shaRe',
          description:
            'Menschen verbinden – Verantwortung teilen – Gemeinschaft stärken',
          theme_color: '#ff1001',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/hub',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
        devOptions: {
          enabled: isDev,
        },
      }),
    ],
    base: '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
          },
          assetFileNames: assetInfo => {
            const name = assetInfo.name || 'asset'
            let extType = name.split('.').at(1) || 'asset'
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img'
            }
            return `assets/${extType}/[name]-[hash][extname]`
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  }
})
