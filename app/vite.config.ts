import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ../data holds the generated dataset (repo-root, gitignored) — Vite's
    // dev server must be allowed to read outside the app/ root to serve it.
    fs: {
      allow: ['..'],
    },
  },
})
