import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // The api serves the built TV page under /tv/ (ADR-026); the dev server stays at /.
  base: command === 'build' ? '/tv/' : '/',
  plugins: [react()],
  // The api (apps/api) listens on 8787 in dev.
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
}))
