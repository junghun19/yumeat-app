import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: 'all',
    host: '127.0.0.1',
    port: 8787,
    strictPort: true,
    open: true,
    hmr: {
      clientPort: 443
    }
  }
})
