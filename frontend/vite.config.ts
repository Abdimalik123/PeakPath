import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    watch: {
      usePolling: true,
    },
    hmr: false  // Disable hot reload for WSL
  },
  optimizeDeps: {
    force: true,  // Force re-optimization
    include: ['react', 'react-dom', 'react/jsx-dev-runtime']
  }
})
