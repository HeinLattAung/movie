import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/anime': {
        target: 'https://api.jikan.moe',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/anime/, '/v4'),
      },
    },
  },
})
