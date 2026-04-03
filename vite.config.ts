import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When building inside Tauri, TAURI_ENV_TARGET_TRIPLE is set.
const isTauri = !!process.env.TAURI_ENV_TARGET_TRIPLE;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Single-file output for GitHub Pages (not used in Tauri builds).
    ...(!isTauri ? [viteSingleFile()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Use the richer public/manifest.json we ship in the repo.
      useCredentials: false,
      manifest: {
        name: 'VOID Player',
        short_name: 'VOID',
        description: 'Privacy-focused, offline-first music player with cyberpunk aesthetics. Supports MP3, FLAC, WAV, AAC, OGG, OPUS and more.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['music', 'entertainment'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Open Player',
            url: '/#/player',
            description: 'Go directly to the music player',
          },
        ],
      },
      workbox: {
        // Cache all static assets.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
