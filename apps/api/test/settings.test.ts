import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { CalendarImporter, httpFetcher } from '../src/calendar.ts'
import { SettingsStore } from '../src/settings.ts'
import { FakeHa, state } from './fakeHa.ts'

let ha: FakeHa
let store: SettingsStore
let at: Date
const app = () => buildApp(ha, () => at, undefined, new CalendarImporter([], httpFetcher, undefined), store)
const get = async () => (await app().inject({ method: 'GET', url: '/api/settings' })).json()
const patch = (body: unknown) => app().inject({ method: 'PATCH', url: '/api/settings', payload: body as object })

beforeEach(() => {
  ha = new FakeHa()
  store = new SettingsStore(undefined)
  // Friday 2026-11-06, 20:00 in Zurich
  at = new Date('2026-11-06T19:00:00Z')
  ha.states = [
    state('automation.alarm_mon_fri_06_30', 'on'),
    state('input_boolean.ring_on_holidays', 'off'),
    state('input_number.morning_screen_max_minutes', '15.0'),
    state('input_datetime.update_notice_time', '21:00:00'),
  ]
})

describe('GET /api/settings', () => {
  it('reads the helpers and turns "ring on holidays" into "skip holidays"', async () => {
    expect(await get()).toMatchObject({
      timeZone: 'Europe/Zurich',
      skipHolidays: true,
      defaultVolume: 5,
      morningScreenMaxMinutes: 15,
      updateNotice: '21:00',
    })
    ha.states = ha.states.map((s) => (s.entity_id === 'input_boolean.ring_on_holidays' ? state(s.entity_id, 'on') : s))
    expect((await get()).skipHolidays).toBe(false)
  })

  it('shows unknown values as null when the helpers are missing', async () => {
    ha.states = []
    expect(await get()).toMatchObject({ skipHolidays: null, morningScreenMaxMinutes: null, updateNotice: null, defaultVolume: 5 })
  })

  it('computes the install window from tomorrow\'s alarms', async () => {
    // Saturday: no weekday alarm, so 10:00
    expect((await get()).installWindow).toEqual({ from: '21:00', to: '10:00' })
    // Thursday evening: tomorrow is Friday, 06:30 + 2 h
    at = new Date('2026-11-05T19:00:00Z')
    expect((await get()).installWindow).toEqual({ from: '21:00', to: '08:30' })
  })

  it('answers 502 when Home Assistant is down', async () => {
    ha.down = true
    expect((await app().inject({ method: 'GET', url: '/api/settings' })).statusCode).toBe(502)
  })
})

describe('PATCH /api/settings', () => {
  it('writes the helpers and returns the new values', async () => {
    const res = await patch({ skipHolidays: false, morningScreenMaxMinutes: 20, updateNotice: '19:30' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ skipHolidays: false, morningScreenMaxMinutes: 20, updateNotice: '19:30' })
    expect(ha.calls).toEqual([
      { domain: 'input_boolean', service: 'turn_on', data: { entity_id: 'input_boolean.ring_on_holidays' } },
      { domain: 'input_number', service: 'set_value', data: { entity_id: 'input_number.morning_screen_max_minutes', value: 20 } },
      { domain: 'input_datetime', service: 'set_datetime', data: { entity_id: 'input_datetime.update_notice_time', time: '19:30:00' } },
    ])
  })

  it('keeps the default volume in the file, not in Home Assistant', async () => {
    const file = join(mkdtempSync(join(tmpdir(), 'settings-')), 'settings.json')
    store = new SettingsStore(file)
    expect((await patch({ defaultVolume: 12 })).json().defaultVolume).toBe(12)
    expect(ha.calls).toEqual([])
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ defaultVolume: 12 })
    expect(new SettingsStore(file).getDefaultVolume()).toBe(12)
  })

  it('rejects bad input and read-only keys', async () => {
    for (const body of [
      {},
      [],
      { skipHolidays: 'yes' },
      { defaultVolume: 0 },
      { defaultVolume: 101 },
      { defaultVolume: 5.5 },
      { morningScreenMaxMinutes: 0 },
      { morningScreenMaxMinutes: 61 },
      { updateNotice: '25:00' },
      { updateNotice: '9:00' },
      { timeZone: 'UTC' },
      { installWindow: { from: '00:00', to: '01:00' } },
    ]) {
      expect((await patch(body)).statusCode, JSON.stringify(body)).toBe(400)
    }
    expect(ha.calls).toEqual([])
  })

  it('leaves the file alone when Home Assistant is down', async () => {
    ha.down = true
    expect((await patch({ skipHolidays: false, defaultVolume: 30 })).statusCode).toBe(502)
    expect(store.getDefaultVolume()).toBe(5)
  })
})

describe('ring on holidays', () => {
  it('lets the next alarm fall on a Monday-Friday holiday', async () => {
    ha.holidays.add('2026-11-09')
    const next = async () => (await app().inject({ method: 'GET', url: '/api/status/next-alarm' })).json().alarm
    // Friday evening, Monday is a holiday: skipped, Tuesday rings
    expect(await next()).toMatchObject({ date: '2026-11-10' })
    ha.states = ha.states.map((s) => (s.entity_id === 'input_boolean.ring_on_holidays' ? state(s.entity_id, 'on') : s))
    expect(await next()).toMatchObject({ date: '2026-11-09' })
  })
})
