import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/ws': {
        target: 'http://localhost:3000',
        ws: true,
        // Only proxy WebSocket upgrades; pass regular HTTP through
        bypass(req) {
          if (req.headers['upgrade'] !== 'websocket') return req.url
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
