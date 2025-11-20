import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // For Vercel deployment
      server: {
        port: 5000,
        strictPort: false, // Allow falling back to another port if 5000 is in use
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1500, // Increase limit to 1500kb to reduce warnings
        rollupOptions: {
          output: {
            manualChunks: {
              // Split vendor and firebase chunks to reduce main bundle size
              vendor: ['react', 'react-dom'],
              firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth']
            }
          }
        }
      }
    };
});