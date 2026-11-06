import { beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { FakeHa, state } from './fakeHa.ts'

let ha: FakeHa
let at: Date
const app = () => buildApp(ha, () => at)
const get = async (path: string) => (await app().inject({ method: 'GET', url: '/api/status/' + path })).json()

const appAlarm = (id: string, time: string, weekday: string[], on = true) => {
  ha.store.set('app_alarm_' + id, {
    configId: 'app_alarm_' + id,
    on,
    config: {
      id: 'app_alarm_' + id,
      triggers: [{ trigger: 'time', at: time + ':00' }],
      conditions: [{ condition: 'time', weekday }],
      actions: [
        {
          action: 'script.alarm_ring',
          data: { zone_entity: 'media_player.kinderzimmer_kinderzimmer', playlist_uri: 'spotify:playlist:37i9dQZF1E8N3mKFwU3tJ8', volume_level: 0.05, wake_tv: false },
        },
      ],
    },
  })
}

beforeEach(() => {
  ha = new FakeHa()
  // Friday 2026-11-06, 20:00 in Zurich (19:00 UTC)
  at = new Date('2026-11-06T19:00:00Z')
  ha.states = [state('automation.alarm_mon_fri_06_30', 'on')]
})

describe('next alarm', () => {
  it('is the 06:30 weekday alarm on the next working day', async () => {
    // Friday evening: Sat/Sun are skipped, Monday 06:30 rings
    expect((await get('next-alarm')).alarm).toMatchObject({ time: '06:30', date: '2026-11-09', weekday: 0, inDays: 3, kind: 'weekday' })
  })

  it('prefers an earlier app alarm, also on a weekend', async () => {
    appAlarm('a1', '07:30', ['sat'])
    expect((await get('next-alarm')).alarm).toMatchObject({ time: '07:30', date: '2026-11-07', inDays: 1, kind: 'app', alarmId: 'a1' })
  })

  it('ignores alarms that are off and a switched-off weekday alarm', async () => {
    appAlarm('a1', '07:30', ['sat'], false)
    ha.states = [state('automation.alarm_mon_fri_06_30', 'off')]
    expect((await get('next-alarm')).alarm).toBeNull()
  })

  it('skips an alarm that already rang today and one on a public holiday', async () => {
    at = new Date('2026-11-09T05:45:00Z') // Monday 06:45
    ha.holidays.add('2026-11-10')
    expect((await get('next-alarm')).alarm).toMatchObject({ date: '2026-11-11', weekday: 2 })
  })

  it('still rings on a weekend day even though the workday sensor says no', async () => {
    appAlarm('a1', '08:00', ['sun'])
    ha.holidays.add('2026-11-08')
    expect((await get('next-alarm')).alarm).toMatchObject({ date: '2026-11-08', time: '08:00' })
  })

  it('uses Zurich time, not UTC (23:30 UTC in winter is already tomorrow)', async () => {
    at = new Date('2026-11-05T23:30:00Z') // Friday 00:30 in Zurich
    expect((await get('next-alarm')).alarm).toMatchObject({ date: '2026-11-06', inDays: 0 })
  })
})

describe('backup alarm', () => {
  it('is found by its Sonos alarm id, not by name', async () => {
    ha.states.push(
      state('switch.sonos_alarm_464', 'on', { alarm_id: '464', time: '07:30:00' }),
      state('switch.sonos_alarm_980', 'on', { alarm_id: '980', time: '06:40:00' }),
      state('automation.alarm_backup_sync_21_00', 'on', { last_triggered: '2026-11-06T20:00:00+00:00' }),
    )
    expect(await get('backup-alarm')).toEqual({
      found: true,
      on: true,
      time: '06:40',
      minutesAfter: 10,
      syncEnabled: true,
      lastSync: '2026-11-06T20:00:00+00:00',
    })
  })

  it('says so when the backup alarm is missing', async () => {
    expect(await get('backup-alarm')).toMatchObject({ found: false, on: false, time: null })
  })
})

describe('tv', () => {
  it('reports state and reachability', async () => {
    ha.states.push(
      state('media_player.schlafzimmer_samueltv', 'off', { friendly_name: 'SamuelTV' }),
      state('remote.schlafzimmer_samueltv', 'off'),
    )
    expect(await get('tv')).toEqual({ name: 'SamuelTV', state: 'off', reachable: true, remote: 'off' })
    ha.states = [state('media_player.schlafzimmer_samueltv', 'unavailable')]
    expect(await get('tv')).toMatchObject({ reachable: false, remote: null })
  })
})

describe('weather', () => {
  it('combines the current state with today and the next days of the forecast', async () => {
    ha.states.push(
      state('weather.home', 'cloudy', { temperature: 9.74, humidity: 98, pressure: 1023.1, wind_speed: 2, wind_speed_unit: 'm/s' }),
    )
    ha.forecast = [
      { datetime: '2026-11-06T11:00:00+00:00', condition: 'cloudy', temperature: 9.7, templow: 8.7, precipitation: 0.24 },
      { datetime: '2026-11-07T11:00:00+00:00', condition: 'rainy', temperature: 12.7, templow: 8.8 },
    ]
    const w = await get('weather')
    expect(w.now).toMatchObject({ place: 'St. Gallen', condition: 'cloudy', tempC: 9.7, windKmh: 7, humidityPercent: 98, rainMm: 0.2 })
    expect(w.forecast).toEqual([{ date: '2026-11-07', condition: 'rainy', hiC: 13, loC: 9 }])
  })
})

describe('player', () => {
  const p = (s: string, extra = {}) =>
    state('media_player.kinderzimmer_kinderzimmer', s, {
      media_title: 'Song',
      media_artist: 'Artist',
      media_duration: 200,
      media_position: 60,
      media_position_updated_at: '2026-11-06T18:59:50Z',
      ...extra,
    })

  it('adds the time since the last position update while playing', async () => {
    ha.states.push(p('playing'))
    expect(await get('player')).toMatchObject({ playing: true, title: 'Song', artist: 'Artist', durationSec: 200, positionSec: 70 })
  })

  it('keeps the position while paused and hides everything when idle', async () => {
    ha.states.push(p('paused'))
    expect(await get('player')).toMatchObject({ playing: false, positionSec: 60 })
    ha.states = [p('idle')]
    expect(await get('player')).toEqual({
      state: 'idle',
      playing: false,
      title: null,
      artist: null,
      playlist: null,
      durationSec: null,
      positionSec: null,
    })
  })
})

describe('connections', () => {
  it('maps config entries to ok, down and none', async () => {
    ha.entries = [
      { domain: 'sonos', title: 'Sonos', state: 'loaded', disabled_by: null },
      { domain: 'braviatv', title: 'TV', state: 'setup_retry', disabled_by: null },
    ]
    const { connections } = await get('connections')
    expect(connections).toEqual([
      { id: 'spotify', state: 'none' },
      { id: 'sonos', state: 'ok' },
      { id: 'tv', state: 'down' },
      { id: 'ha', state: 'ok' },
    ])
  })
})

describe('last backup', () => {
  it('is unknown before the first automatic backup', async () => {
    ha.states.push(
      state('sensor.backup_last_successful_automatic_backup', 'unknown'),
      state('sensor.backup_last_attempted_automatic_backup', 'unknown'),
    )
    expect(await get('last-backup')).toMatchObject({ ok: null, lastSuccess: null })
  })

  it('fails when the last attempt is newer than the last success', async () => {
    ha.states.push(
      state('sensor.backup_last_successful_automatic_backup', '2026-11-05T02:00:00+00:00'),
      state('sensor.backup_last_attempted_automatic_backup', '2026-11-06T02:00:00+00:00'),
    )
    expect(await get('last-backup')).toMatchObject({ ok: false })
    ha.states[1] = state('sensor.backup_last_successful_automatic_backup', '2026-11-06T02:00:00+00:00')
    expect(await get('last-backup')).toMatchObject({ ok: true })
  })
})

it('answers 502 for every status route when Home Assistant is down', async () => {
  ha.down = true
  for (const route of ['next-alarm', 'backup-alarm', 'tv', 'weather', 'player', 'connections', 'last-backup']) {
    expect((await app().inject({ method: 'GET', url: '/api/status/' + route })).statusCode).toBe(502)
  }
})

describe('system', () => {
  const reading = {
    cpuPercent: 14,
    tempC: 42.1,
    memory: { totalMb: 8062, usedMb: 1117, percent: 14 },
    disk: { totalGb: 984.1, usedGb: 11.7, percent: 1 },
    uptimeSeconds: 80398,
    load1: 0.01,
    internet: { reachable: true, latencyMs: 9 },
  }
  const withProbe = (r: typeof reading | null) =>
    buildApp(ha, () => at, { read: async () => r })
  const system = async (a: ReturnType<typeof buildApp>) => (await a.inject({ method: 'GET', url: '/api/status/system' })).json()

  it('passes the probe reading on and says Home Assistant answers', async () => {
    expect(await system(withProbe(reading))).toEqual({ probe: true, reading, homeAssistant: true })
  })

  it('still answers when the probe is missing or silent', async () => {
    expect(await system(withProbe(null))).toEqual({ probe: false, reading: null, homeAssistant: true })
    expect(await system(app())).toMatchObject({ probe: false, reading: null })
  })

  it('still answers when Home Assistant is down', async () => {
    ha.down = true
    expect(await system(withProbe(reading))).toMatchObject({ probe: true, homeAssistant: false })
  })
})
