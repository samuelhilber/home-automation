import { buildApp } from './app.ts'
import { HttpHaClient } from './ha.ts'
import { serveApps } from './web.ts'
import { HttpProbe, NoProbe } from './probe.ts'

const url = process.env.HA_URL
const token = process.env.HA_TOKEN
if (!url || !token) {
  console.error('Set HA_URL and HA_TOKEN (see .env.example).')
  process.exit(1)
}

// Optional: the probe on the Pi (tools/pi-probe), e.g. http://<pi>:8788/status.
const probeUrl = process.env.PI_PROBE_URL
const app = buildApp(new HttpHaClient(url, token), () => new Date(), probeUrl ? new HttpProbe(probeUrl) : new NoProbe())
// In the container the built apps are served too (ADR-026); in dev vite does that.
if (process.env.WEB_ROOT) await serveApps(app, process.env.WEB_ROOT)
// Localhost by default; reach it from the phone through Tailscale (ADR-008).
await app.listen({ host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 8787) })
console.log('api listening')
