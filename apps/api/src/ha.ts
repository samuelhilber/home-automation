import type { AutomationConfig } from './automation.ts'
import { ID_PREFIX } from './automation.ts'

export type HaAutomation = { configId: string; on: boolean; config: AutomationConfig }

// Everything the alarm routes need from Home Assistant, so tests can swap in a fake.
export interface HaClient {
  listAppAutomations(): Promise<HaAutomation[]>
  saveAutomation(configId: string, config: AutomationConfig): Promise<void>
  deleteAutomation(configId: string): Promise<void>
  setAutomationEnabled(configId: string, on: boolean): Promise<void>
}

export class HaUnreachableError extends Error {}

type State = { entity_id: string; state: string; attributes: { id?: string } }

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
}
