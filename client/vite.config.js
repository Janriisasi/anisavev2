import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
  },
  envPrefix: ['VITE_'],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // react-router v7 moved most code into the 'react-router'
          // package itself; 'react-router-dom' is now a thin wrapper.
          // Matching the shared prefix catches both.
          if (id.includes('node_modules/react-router')) return 'react-router';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@supabase')) return 'supabase-vendor';

          // Everything else (gsap, admin-only chart/table libs, etc.)
          // is intentionally left unassigned so Rollup keeps it inside
          // whichever lazy route chunk actually imports it, instead of
          // forcing it into one big chunk every page has to load.
        }
      }
    },
    cssCodeSplit: false,
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2
      }
    },
    sourcemap: !!process.env.TAURI_DEBUG,
    chunkSizeWarningLimit: 1000
  },
});