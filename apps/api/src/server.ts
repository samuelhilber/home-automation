import { buildApp } from './app.ts'
import { HttpHaClient } from './ha.ts'

const url = process.env.HA_URL
const token = process.env.HA_TOKEN
if (!url || !token) {
  console.error('Set HA_URL and HA_TOKEN (see .env.example).')
  process.exit(1)
}

const app = buildApp(new HttpHaClient(url, token))
// Localhost by default; reach it from the phone through Tailscale (ADR-008).
await app.listen({ host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 8787) })
console.log('api listening')
