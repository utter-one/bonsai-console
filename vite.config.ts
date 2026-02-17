import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue ecosystem
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          
          // HTTP client and API
          'api-vendor': ['axios'],
          
          // Code editor (CodeMirror) - often one of the largest dependencies
          'codemirror-vendor': [
            'codemirror',
            '@codemirror/autocomplete',
            '@codemirror/lang-liquid',
            '@codemirror/language',
            '@codemirror/state',
            '@codemirror/view',
          ],
          
          // Icons library
          'icons-vendor': ['lucide-vue-next'],
          
          // Utilities
          'utils-vendor': ['zod'],
        },
      },
    },
    // Increase warning limit to 1000 kB (optional, but helps reduce noise)
    chunkSizeWarningLimit: 1000,
  },
})
