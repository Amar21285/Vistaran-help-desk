import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    // Use relative base path to ensure assets load correctly on GitHub Pages or cPanel
    base: './',
    server: {
      port: 3000,
      host: true
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || process.env.API_KEY)
    }
  };
});