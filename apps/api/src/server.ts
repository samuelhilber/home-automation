import { buildApp } from './app.ts'
import { CalendarImporter, httpFetcher, loadConfigs } from './calendar.ts'
import { HttpHaClient } from './ha.ts'
import { SettingsStore } from './settings.ts'
import { serveApps } from './web.ts'
import { HttpProbe, NoProbe } from './probe.ts'
import { HealthchecksWatchdog, NoWatchdog } from './watchdog.ts'

const url = process.env.HA_URL
const token = process.env.HA_TOKEN
if (!url || !token) {
  console.error('Set HA_URL and HA_TOKEN (see .env.example).')
  process.exit(1)
}

// Optional: the probe on the Pi (tools/pi-probe), e.g. http://<pi>:8788/status.
const probeUrl = process.env.PI_PROBE_URL
// Calendars (ADR-028): CALENDARS_FILE holds the read-only links (git-ignored, on the Pi),
// CALENDAR_STATE_FILE the on/off switches (in a Docker volume). Without them there are no calendars.
const calendar = new CalendarImporter(loadConfigs(process.env.CALENDARS_FILE), httpFetcher, process.env.CALENDAR_STATE_FILE)
void calendar.refresh()
setInterval(() => void calendar.refresh(), 15 * 60 * 1000).unref()

// Settings (ADR-029): only the default volume lives here, in SETTINGS_FILE (a Docker volume).
const settings = new SettingsStore(process.env.SETTINGS_FILE)

// Watchdog (ADR-032): read-only Healthchecks.io key; without it the page shows "not set up".
const watchdogKey = process.env.HEALTHCHECKS_API_KEY
const watchdog = watchdogKey ? new HealthchecksWatchdog(watchdogKey, process.env.HEALTHCHECKS_CHECK_NAME || undefined) : new NoWatchdog()

const app = buildApp(new HttpHaClient(url, token), () => new Date(), probeUrl ? new HttpProbe(probeUrl) : new NoProbe(), calendar, settings, watchdog)
// In the container the built apps are served too (ADR-026); in dev vite does that.
if (process.env.WEB_ROOT) await serveApps(app, process.env.WEB_ROOT)
// Localhost by default; reach it from the phone through Tailscale (ADR-008).
await app.listen({ host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 8787) })
console.log('api listening')
