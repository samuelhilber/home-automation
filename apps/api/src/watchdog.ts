// Reads the watchdog check from Healthchecks.io (ADR-032) with a read-only API key.
// Home Assistant does the pinging (homeassistant/automations/watchdog_ping.yaml); this
// only reads when the last ping arrived. The key and the ping address never leave the api.

// What Healthchecks.io calls them: `grace` means a ping is late but the alarm has not
// gone off yet, `down` means the phone has been notified.
export type WatchdogState = 'new' | 'up' | 'grace' | 'down' | 'paused'

export type WatchdogStatus = {
  // False when no API key is set up; the page then says so.
  configured: boolean
  // False when the service did not answer. Never reported as OK in that case.
  reached: boolean
  state: WatchdogState | null
  lastPing: string | null
}

// Tests swap in a fake.
export interface Watchdog {
  read(): Promise<WatchdogStatus>
}

export class NoWatchdog implements Watchdog {
  async read(): Promise<WatchdogStatus> {
    return { configured: false, reached: false, state: null, lastPing: null }
  }
}

type Check = { name?: unknown; status?: unknown; last_ping?: unknown }
const STATES: readonly string[] = ['new', 'up', 'grace', 'down', 'paused']
const CACHE_MS = 20_000

export class HealthchecksWatchdog implements Watchdog {
  private cached: { at: number; value: WatchdogStatus } | undefined

  private apiKey: string
  private checkName: string | undefined
  private fetchFn: typeof fetch
  private now: () => number
  private baseUrl: string

  // `checkName`: the check to show. Without a name the only check of the project is used.
  constructor(
    apiKey: string,
    checkName?: string,
    fetchFn: typeof fetch = fetch,
    now: () => number = Date.now,
    baseUrl = 'https://healthchecks.io',
  ) {
    this.apiKey = apiKey
    this.checkName = checkName
    this.fetchFn = fetchFn
    this.now = now
    this.baseUrl = baseUrl
  }

  async read(): Promise<WatchdogStatus> {
    // The page asks every 30 seconds from two places; one request to the service is enough.
    if (this.cached && this.now() - this.cached.at < CACHE_MS) return this.cached.value
    const value = await this.load()
    this.cached = { at: this.now(), value }
    return value
  }

  private async load(): Promise<WatchdogStatus> {
    const unreached: WatchdogStatus = { configured: true, reached: false, state: null, lastPing: null }
    try {
      const res = await this.fetchFn(`${this.baseUrl}/api/v3/checks/`, {
        headers: { 'X-Api-Key': this.apiKey },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return unreached
      const checks = ((await res.json()) as { checks?: Check[] }).checks ?? []
      const check = this.checkName ? checks.find((c) => c.name === this.checkName) : checks.length === 1 ? checks[0] : undefined
      if (!check) return { ...unreached, reached: true }
      const state = typeof check.status === 'string' && STATES.includes(check.status) ? (check.status as WatchdogState) : null
      return { configured: true, reached: true, state, lastPing: typeof check.last_ping === 'string' ? check.last_ping : null }
    } catch {
      return unreached
    }
  }
}
