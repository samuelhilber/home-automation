import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The api (apps/api) listens on 8787 in dev; production serving is still to be decided.
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
})
