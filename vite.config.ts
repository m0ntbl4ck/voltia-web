import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The browser talks to /api on the dev server, so the session cookie stays same-origin.
const api = process.env.API_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': api,
    },
  },
})
