import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000';

  return {
    plugins: [react(), tailwindcss()],
    base: '/h5-knowledgebase-site/',
    resolve: {
      alias: {
        '@h5-kb/shared': path.resolve(__dirname, '../../packages/shared/src/index.js'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: false,
      include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      restoreMocks: true,
      clearMocks: true,
      // Keep unit tests independent of developer .env catalog URLs.
      env: {
        VITE_CATALOG_API_URL: '',
        VITE_CHAT_API_URL: '',
        VITE_API_KEY: '',
      },
    },
  };
});
