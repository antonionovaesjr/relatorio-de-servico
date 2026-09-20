// @ts-expect-error Node fs module types not bundled
import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const hasCert = fs.existsSync('./dev-cert.key') && fs.existsSync('./dev-cert.crt');

// https://vitejs.dev/config/
export default defineConfig({
  base: '/relatorio-servicos/',
  server: {
    https: hasCert
      ? {
          key: fs.readFileSync('./dev-cert.key'),
          cert: fs.readFileSync('./dev-cert.crt'),
        }
      : undefined,
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dev-redirect-root-to-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const requestUrl = (req as { url?: string }).url;
          if (requestUrl === '/' || requestUrl === '') {
            res.writeHead(302, { Location: '/relatorio-servicos/' });
            res.end();
            return;
          }
          next();
        });
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon-dev.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable.png',
      ],
      manifest: {
        id: '/relatorio-servicos/',
        name: 'Relatório de Serviço PWA',
        short_name: 'Relatório',
        description: 'Controle pessoal e offline do ministério de campo das Testemunhas de Jeová.',
        theme_color: '#001E62',
        background_color: '#0A111E',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/relatorio-servicos/',
        scope: '/relatorio-servicos/',
        lang: 'pt-BR',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'classic',
      },
    }),
  ],
});
