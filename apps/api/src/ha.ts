import type { AutomationConfig } from './automation.ts'
import { ID_PREFIX } from './automation.ts'

export type HaAutomation = { configId: string; on: boolean; config: AutomationConfig }

export type HaState = { entity_id: string; state: string; attributes: Record<string, any> }
export type HaForecastDay = { datetime: string; condition?: string; temperature?: number; templow?: number; precipitation?: number; wind_speed?: number }
export type HaConfigEntry = { domain: string; title: string; state: string; disabled_by: string | null }

// Everything the alarm routes need from Home Assistant, so tests can swap in a fake.
export interface HaClient {
  listAppAutomations(): Promise<HaAutomation[]>
  saveAutomation(configId: string, config: AutomationConfig): Promise<void>
  deleteAutomation(configId: string): Promise<void>
  setAutomationEnabled(configId: string, on: boolean): Promise<void>
  // Read-only status (the /api/status routes).
  getStates(): Promise<HaState[]>
  getDailyForecast(weatherEntity: string): Promise<HaForecastDay[]>
  listConfigEntries(): Promise<HaConfigEntry[]>
  // Calls a service without a response (the settings helpers, ADR-029). Throws if Home Assistant refuses.
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<void>
  // Asks the Workday sensor about a date (YYYY-MM-DD). Answers true when in doubt.
  isWorkday(date: string): Promise<boolean>
}

export class HaUnreachableError extends Error {}

type State = HaState

export class HttpHaClient implements HaClient {
  private base: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.base = baseUrl.replace(/\/$/, '')
    this.token = token
  }

  private async call(method: string, path: string, body?: unknown): Promise<Response> {
    let res: Response
    try {
      res = await fetch(this.base + path, {
        method,
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      })
    } catch (err) {
      throw new HaUnreachableError(`Home Assistant not reachable: ${(err as Error).message}`)
    }
    if (!res.ok && res.status !== 404) throw new Error(`Home Assistant answered ${res.status} for ${method} ${path}`)
    return res
  }

  private async appStates(): Promise<State[]> {
    const states = (await (await this.call('GET', '/api/states')).json()) as State[]
    return states.filter((s) => s.entity_id.startsWith('automation.') && s.attributes.id?.startsWith(ID_PREFIX))
  }

  async listAppAutomations(): Promise<HaAutomation[]> {
    const out: HaAutomation[] = []
    for (const s of await this.appStates()) {
      const configId = s.attributes.id as string
      const res = await this.call('GET', `/api/config/automation/config/${configId}`)
      if (res.status === 404) continue
      out.push({ configId, on: s.state === 'on', config: (await res.json()) as AutomationConfig })
    }
    return out
  }

  async saveAutomation(configId: string, config: AutomationConfig): Promise<void> {
    await this.call('POST', `/api/config/automation/config/${configId}`, config)
  }

  async deleteAutomation(configId: string): Promise<void> {
    await this.call('DELETE', `/api/config/automation/config/${configId}`)
  }

  async setAutomationEnabled(configId: string, on: boolean): Promise<void> {
    // After a save Home Assistant reloads automations in the background, so the
    // entity can take a moment to show up. Wait up to ~8 s before giving up.
    let entity: State | undefined
    for (let attempt = 0; attempt < 16 && !entity; attempt++) {
      entity = (await this.appStates()).find((s) => s.attributes.id === configId)
      if (!entity) await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (!entity) throw new Error(`No automation entity for ${configId}`)
    await this.call('POST', `/api/services/automation/turn_${on ? 'on' : 'off'}`, { entity_id: entity.entity_id })
  }

  async getStates(): Promise<HaState[]> {
    return (await (await this.call('GET', '/api/states')).json()) as HaState[]
  }

  async getDailyForecast(weatherEntity: string): Promise<HaForecastDay[]> {
    const res = await this.call('POST', '/api/services/weather/get_forecasts?return_response', {
      type: 'daily',
      entity_id: weatherEntity,
    })
    if (!res.ok) return []
    const body = (await res.json()) as { service_response?: Record<string, { forecast?: HaForecastDay[] }> }
    return body.service_response?.[weatherEntity]?.forecast ?? []
  }

  async listConfigEntries(): Promise<HaConfigEntry[]> {
    return (await (await this.call('GET', '/api/config/config_entries/entry')).json()) as HaConfigEntry[]
  }

  async callService(domain: string, service: string, data: Record<string, unknown>): Promise<void> {
    const res = await this.call('POST', `/api/services/${domain}/${service}`, data)
    // call() lets a 404 through; for a service call that means a missing service, which is an error.
    if (!res.ok) throw new Error(`Home Assistant answered ${res.status} for ${domain}.${service}`)
  }

  async isWorkday(date: string): Promise<boolean> {
    // Same fail-safe as the evening backup sync: if the check does not work, the
    // day counts as a working day. An unreachable Home Assistant still throws.
    try {
      const res = await this.call('POST', '/api/services/workday/check_date?return_response', {
        entity_id: 'binary_sensor.workday_sensor_ch_sg',
        check_date: date,
      })
      if (!res.ok) return true
      const body = (await res.json()) as { service_response?: Record<string, { workday?: boolean }> }
      return body.service_response?.['binary_sensor.workday_sensor_ch_sg']?.workday ?? true
    } catch (err) {
      if (err instanceof HaUnreachableError) throw err
      return true
    }
  }
}
