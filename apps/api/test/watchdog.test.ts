import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { HealthchecksWatchdog, type Watchdog } from '../src/watchdog.ts'
import { FakeHa } from './fakeHa.ts'

// Made-up check data; no real address or key.
const checks = (list: unknown[]) => async () => new Response(JSON.stringify({ checks: list }), { status: 200 })
const fetchWith = (fn: () => Promise<Response>) => fn as unknown as typeof fetch

describe('HealthchecksWatchdog', () => {
  it('reads state and last ping of the only check', async () => {
    const w = new HealthchecksWatchdog('key', undefined, fetchWith(checks([{ name: 'Pi', status: 'up', last_ping: '2026-11-18T20:46:48+00:00' }])))
    expect(await w.read()).toEqual({ configured: true, reached: true, state: 'up', lastPing: '2026-11-18T20:46:48+00:00' })
  })

  it('picks the check by name and sends the key in a header', async () => {
    let seen: { url: string; key: string | null } | undefined
    const spy = async (url: string | URL | Request, init?: RequestInit) => {
      seen = { url: String(url), key: new Headers(init?.headers).get('X-Api-Key') }
      return new Response(JSON.stringify({ checks: [{ name: 'Other', status: 'down' }, { name: 'Pi', status: 'grace', last_ping: null }] }))
    }
    const w = new HealthchecksWatchdog('secret-key', 'Pi', spy as unknown as typeof fetch)
    expect(await w.read()).toMatchObject({ state: 'grace', lastPing: null })
    expect(seen?.key).toBe('secret-key')
    expect(seen?.url).toBe('https://healthchecks.io/api/v3/checks/')
  })

  it('says the service answered but the check is missing or ambiguous', async () => {
    const two = checks([{ name: 'A', status: 'up' }, { name: 'B', status: 'up' }])
    expect(await new HealthchecksWatchdog('key', undefined, fetchWith(two)).read()).toEqual({ configured: true, reached: true, state: null, lastPing: null })
    expect(await new HealthchecksWatchdog('key', 'Pi', fetchWith(two)).read()).toMatchObject({ reached: true, state: null })
  })

  it('never reports OK when the service does not answer or rejects the key', async () => {
    const unreached = { configured: true, reached: false, state: null, lastPing: null }
    const broken = async () => {
      throw new Error('offline')
    }
    expect(await new HealthchecksWatchdog('key', undefined, fetchWith(broken)).read()).toEqual(unreached)
    const rejected = async () => new Response('{}', { status: 401 })
    expect(await new HealthchecksWatchdog('key', undefined, fetchWith(rejected)).read()).toEqual(unreached)
  })

  it('ignores an unknown state', async () => {
    const w = new HealthchecksWatchdog('key', undefined, fetchWith(checks([{ name: 'Pi', status: 'weird' }])))
    expect(await w.read()).toMatchObject({ reached: true, state: null })
  })

  it('asks the service only once within 20 seconds', async () => {
    let calls = 0
    let clock = 1000
    const counting = async () => {
      calls++
      return new Response(JSON.stringify({ checks: [{ name: 'Pi', status: 'up' }] }))
    }
    const w = new HealthchecksWatchdog('key', undefined, fetchWith(counting), () => clock)
    await w.read()
    clock += 10_000
    await w.read()
    expect(calls).toBe(1)
    clock += 11_000
    await w.read()
    expect(calls).toBe(2)
  })
})

describe('GET /api/status/watchdog', () => {
  const get = async (a: ReturnType<typeof buildApp>) => (await a.inject({ method: 'GET', url: '/api/status/watchdog' })).json()

  it('says "not set up" without a key', async () => {
    expect(await get(buildApp(new FakeHa()))).toEqual({ configured: false, reached: false, state: null, lastPing: null })
  })

  it('passes the reading on and does not need Home Assistant', async () => {
    const ha = new FakeHa()
    ha.down = true
    const reading = { configured: true, reached: true, state: 'up', lastPing: '2026-11-18T20:46:48+00:00' } as const
    const fake: Watchdog = { read: async () => reading }
    expect(await get(buildApp(ha, () => new Date(), undefined, undefined, undefined, fake))).toEqual(reading)
  })
})
