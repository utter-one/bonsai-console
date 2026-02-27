import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Serve VitePress docs build output at /help/ during development
    {
      name: 'serve-docs',
      configureServer(server) {
        const docsDir = path.resolve(__dirname, 'docs/.vitepress/dist')
        server.middlewares.use('/help', (req, res, next) => {
          const urlPath = (req.url === '/' || req.url === '') ? '/index.html' : req.url || '/index.html'
          const filePath = path.join(docsDir, urlPath)
          const indexPath = path.join(docsDir, urlPath.replace(/\/$/, ''), 'index.html')

          const tryServe = (p: string) => {
            if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return false
            const mimeMap: Record<string, string> = {
              '.html': 'text/html; charset=utf-8',
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.json': 'application/json',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.ico': 'image/x-icon',
            }
            const ext = path.extname(p)
            res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream')
            res.end(fs.readFileSync(p))
            return true
          }

          if (!tryServe(filePath) && !tryServe(indexPath)) next()
        })
      },
    },
    vue({
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Generate source maps for production debugging
    sourcemap: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize dependencies
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['lucide-vue-next'],
        },
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios'],
  },
})
