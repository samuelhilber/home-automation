import type { AutomationConfig } from '../src/automation.ts'
import {
  HaUnreachableError,
  type HaAutomation,
  type HaClient,
  type HaConfigEntry,
  type HaForecastDay,
  type HaState,
} from '../src/ha.ts'

export class FakeHa implements HaClient {
  store = new Map<string, HaAutomation>()
  states: HaState[] = []
  forecast: HaForecastDay[] = []
  entries: HaConfigEntry[] = []
  holidays = new Set<string>()
  down = false
  private check() {
    if (this.down) throw new HaUnreachableError('down')
  }
  async listAppAutomations() {
    this.check()
    return [...this.store.values()]
  }
  async saveAutomation(configId: string, config: AutomationConfig) {
    this.check()
    this.store.set(configId, { configId, config, on: this.store.get(configId)?.on ?? true })
  }
  async deleteAutomation(configId: string) {
    this.check()
    this.store.delete(configId)
  }
  async setAutomationEnabled(configId: string, on: boolean) {
    this.check()
    this.store.get(configId)!.on = on
  }
  async getStates() {
    this.check()
    return this.states
  }
  async getDailyForecast() {
    this.check()
    return this.forecast
  }
  async listConfigEntries() {
    this.check()
    return this.entries
  }
  calls: { domain: string; service: string; data: Record<string, unknown> }[] = []
  async callService(domain: string, service: string, data: Record<string, unknown>) {
    this.check()
    this.calls.push({ domain, service, data })
    // Mimic the helpers so a read after a write shows the new value.
    const id = String(data.entity_id)
    const set = (s: string) => {
      this.states = this.states.filter((x) => x.entity_id !== id).concat(state(id, s))
    }
    if (service === 'turn_on') set('on')
    else if (service === 'turn_off') set('off')
    else if (service === 'set_value') set(String(data.value))
    else if (service === 'set_datetime') set(String(data.time))
  }
  async isWorkday(date: string) {
    this.check()
    return !this.holidays.has(date)
  }
}

export const state = (entity_id: string, s: string, attributes: Record<string, unknown> = {}): HaState => ({
  entity_id,
  state: s,
  attributes,
})
