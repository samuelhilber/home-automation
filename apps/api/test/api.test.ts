import { beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import type { AutomationConfig } from '../src/automation.ts'
import { HaUnreachableError, type HaAutomation, type HaClient } from '../src/ha.ts'

class FakeHa implements HaClient {
  store = new Map<string, HaAutomation>()
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
}

const body = {
  time: '06:30',
  days: [0, 1, 2, 3, 4],
  zone: 'Wohnzimmer-Gruppe',
  source: 'Discover Weekly',
  volume: 5,
  wakeTv: true,
  on: true,
}

let ha: FakeHa
let app: ReturnType<typeof buildApp>
beforeEach(() => {
  ha = new FakeHa()
  app = buildApp(ha)
})

describe('alarms', () => {
  it('creates an alarm and writes the automation Home Assistant will run', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/alarms', payload: body })
    expect(res.statusCode).toBe(201)
    const created = res.json()
    const cfg = ha.store.get(`app_alarm_${created.id}`)!.config as any
    expect(cfg.triggers[0]).toEqual({ trigger: 'time', at: '06:30:00' })
    expect(cfg.conditions[0].weekday).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
    expect(cfg.actions[0].action).toBe('script.alarm_ring')
    expect(cfg.actions[0].data.volume_level).toBe(0.05)
    expect(cfg.actions[0].data.wake_tv).toBe(true)
  })

  it('lists alarms sorted by time and reads back what it wrote', async () => {
    await app.inject({ method: 'POST', url: '/api/alarms', payload: { ...body, time: '08:30', days: [5, 6], on: false } })
    await app.inject({ method: 'POST', url: '/api/alarms', payload: body })
    const list = (await app.inject({ method: 'GET', url: '/api/alarms' })).json()
    expect(list.map((a: any) => a.time)).toEqual(['06:30', '08:30'])
    expect(list[1]).toMatchObject({ days: [5, 6], on: false, zone: 'Wohnzimmer-Gruppe', volume: 5 })
  })

  it('updates, switches and deletes', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/api/alarms', payload: body })).json()
    const put = await app.inject({ method: 'PUT', url: `/api/alarms/${id}`, payload: { ...body, time: '07:15' } })
    expect(put.json().time).toBe('07:15')

    const patch = await app.inject({ method: 'PATCH', url: `/api/alarms/${id}`, payload: { on: false } })
    expect(patch.json().on).toBe(false)
    expect(ha.store.get(`app_alarm_${id}`)!.on).toBe(false)

    expect((await app.inject({ method: 'DELETE', url: `/api/alarms/${id}` })).statusCode).toBe(204)
    expect(ha.store.size).toBe(0)
  })

  it('keeps an alarm off when it is saved while off', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/api/alarms', payload: { ...body, on: false } })).json()
    expect(ha.store.get(`app_alarm_${id}`)!.on).toBe(false)
  })

  it('removes a new alarm again when its switch cannot be set', async () => {
    ha.setAutomationEnabled = async () => {
      throw new Error('entity never appeared')
    }
    const res = await app.inject({ method: 'POST', url: '/api/alarms', payload: { ...body, on: false } })
    expect(res.statusCode).toBe(500)
    expect(ha.store.size).toBe(0)
  })

  it('answers 404 for an unknown alarm', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/api/alarms/nope' })).statusCode).toBe(404)
    expect((await app.inject({ method: 'PUT', url: '/api/alarms/nope', payload: body })).statusCode).toBe(404)
    expect((await app.inject({ method: 'PATCH', url: '/api/alarms/nope', payload: { on: true } })).statusCode).toBe(404)
  })

  it.each([
    ['time', { time: '25:00' }],
    ['days empty', { days: [] }],
    ['day 7', { days: [7] }],
    ['zone', { zone: 'Keller' }],
    ['source', { source: 'Radio' }],
    ['volume 0', { volume: 0 }],
    ['volume 101', { volume: 101 }],
    ['wakeTv', { wakeTv: 'yes' }],
  ])('rejects bad %s', async (_name, patch) => {
    const res = await app.inject({ method: 'POST', url: '/api/alarms', payload: { ...body, ...patch } })
    expect(res.statusCode).toBe(400)
    expect(ha.store.size).toBe(0)
  })

  it('ignores automations that do not have the shape it writes', async () => {
    ha.store.set('app_alarm_hand', { configId: 'app_alarm_hand', on: true, config: { id: 'app_alarm_hand', triggers: [] } })
    expect((await app.inject({ method: 'GET', url: '/api/alarms' })).json()).toEqual([])
  })

  it('answers 502 when Home Assistant is not reachable', async () => {
    ha.down = true
    const res = await app.inject({ method: 'GET', url: '/api/alarms' })
    expect(res.statusCode).toBe(502)
    expect(res.json()).toEqual({ error: 'ha_unreachable' })
  })

  it('offers zones and sources', async () => {
    const res = (await app.inject({ method: 'GET', url: '/api/alarms/options' })).json()
    expect(res.zones).toContain('Wohnzimmer-Gruppe')
    expect(res.sources).toEqual(['Discover Weekly'])
  })
})
