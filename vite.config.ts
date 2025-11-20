import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // For GitHub Pages deployment
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
        chunkSizeWarningLimit: 1000, // Reduce limit to 1000kb to encourage smaller bundles
        rollupOptions: {
          output: {
            manualChunks: {
              // Split vendor and firebase chunks to reduce main bundle size
              vendor: ['react', 'react-dom'],
              firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
              utils: [
                '@emailjs/browser'
              ]
            },
            // Optimize chunk naming
            chunkFileNames: 'assets/chunk-[name].[hash].js',
            entryFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]'
          }
        },
        // Enable minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.logs in production
            drop_debugger: true, // Remove debugger statements in production
            pure_funcs: ['console.info', 'console.debug'] // Remove specific console methods
          },
          mangle: {
            properties: {
              regex: /^__/,
            }
          },
          format: {
            comments: false // Remove comments
          }
        },
        // Additional optimizations
        cssCodeSplit: true, // Enable CSS code splitting
        sourcemap: false, // Disable sourcemaps in production
        reportCompressedSize: true, // Report compressed size
        commonjsOptions: {
          include: [/node_modules/],
          extensions: ['.js', '.ts', '.jsx', '.tsx']
        }
      }
    };
});