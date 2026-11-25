import { beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { WEEKDAY_ALARM } from '../src/mapping.ts'
import { FakeHa, state } from './fakeHa.ts'

// Thursday 26 Nov 2026; Zurich is UTC+1 then.
const at = (zurich: string) => new Date(`2026-11-26T${zurich}:00+01:00`)
const CORE = 'update.home_assistant_core_update'

let ha: FakeHa
const appAt = (zurich: string) => buildApp(ha, () => at(zurich))

beforeEach(() => {
  ha = new FakeHa()
  ha.states = [
    state(CORE, 'on', {
      title: 'Home Assistant Core',
      installed_version: '2026.10.3',
      latest_version: '2026.11.0',
      release_url: 'https://www.home-assistant.io/blog/',
      in_progress: false,
    }),
    state('update.sonos_helper', 'on', {
      friendly_name: 'Sonos Helper update',
      installed_version: '1.4.2',
      latest_version: '1.5.0',
      release_url: 'javascript:alert(1)',
    }),
    state('update.up_to_date', 'off', { installed_version: '1', latest_version: '1' }),
    state(WEEKDAY_ALARM.entity, 'on'),
  ]
})

describe('updates', () => {
  it('lists only pending updates and keeps only web addresses as release notes', async () => {
    const res = await appAt('12:00').inject({ method: 'GET', url: '/api/status/updates' })
    const { updates, blockedUntil } = res.json()
    expect(blockedUntil).toBeNull()
    expect(updates.map((u: any) => u.id)).toEqual([CORE, 'update.sonos_helper'])
    expect(updates[0]).toMatchObject({ name: 'Home Assistant Core', from: '2026.10.3', to: '2026.11.0', inProgress: false })
    expect(updates[1].notesUrl).toBeNull()
  })

  it('installs a pending update outside the night window', async () => {
    const res = await appAt('12:00').inject({ method: 'POST', url: `/api/updates/${CORE}/install` })
    expect(res.statusCode).toBe(202)
    expect(ha.calls).toEqual([{ domain: 'update', service: 'install', data: { entity_id: CORE } }])
  })

  it('refuses in the evening and says when the window closes', async () => {
    const app = appAt('21:30')
    expect((await app.inject({ method: 'GET', url: '/api/status/updates' })).json().blockedUntil).toBe('08:30')
    const res = await app.inject({ method: 'POST', url: `/api/updates/${CORE}/install` })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toEqual({ error: 'install_window', until: '08:30' })
    expect(ha.calls).toEqual([])
  })

  it('refuses in the early morning until two hours after the alarm, then allows it', async () => {
    expect((await appAt('07:00').inject({ method: 'POST', url: `/api/updates/${CORE}/install` })).statusCode).toBe(409)
    expect((await appAt('08:29').inject({ method: 'POST', url: `/api/updates/${CORE}/install` })).statusCode).toBe(409)
    expect((await appAt('08:30').inject({ method: 'POST', url: `/api/updates/${CORE}/install` })).statusCode).toBe(202)
  })

  it('refuses without an alarm until 10:00', async () => {
    ha.states = ha.states.filter((s) => s.entity_id !== WEEKDAY_ALARM.entity)
    expect((await appAt('09:00').inject({ method: 'POST', url: `/api/updates/${CORE}/install` })).statusCode).toBe(409)
    expect((await appAt('10:00').inject({ method: 'POST', url: `/api/updates/${CORE}/install` })).statusCode).toBe(202)
  })

  it('answers 404 for an update that is not pending and 409 while one is running', async () => {
    const app = appAt('12:00')
    expect((await app.inject({ method: 'POST', url: '/api/updates/update.up_to_date/install' })).statusCode).toBe(404)
    expect((await app.inject({ method: 'POST', url: '/api/updates/update.nope/install' })).statusCode).toBe(404)
    ha.states = ha.states.map((s) => (s.entity_id === CORE ? { ...s, attributes: { ...s.attributes, in_progress: true } } : s))
    const res = await app.inject({ method: 'POST', url: `/api/updates/${CORE}/install` })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('already_running')
  })

  it('answers 502 when Home Assistant is not reachable', async () => {
    ha.down = true
    expect((await appAt('12:00').inject({ method: 'GET', url: '/api/status/updates' })).statusCode).toBe(502)
  })
})
