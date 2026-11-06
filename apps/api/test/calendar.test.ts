import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { CalendarImporter, loadConfigs, type Fetcher } from '../src/calendar.ts'
import { FakeHa } from './fakeHa.ts'

// Made-up calendars only (CLAUDE.md, privacy).
const ics = (...events: string[]) => ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//test//EN', ...events, 'END:VCALENDAR'].join('\r\n')
const vevent = (lines: string[]) => ['BEGIN:VEVENT', 'DTSTAMP:20260101T000000Z', ...lines, 'END:VEVENT'].join('\r\n')

// Friday 2026-11-06, 20:00 in Zurich
const AT = new Date('2026-11-06T19:00:00Z')

const school = ics(
  // weekly Mon+Wed 08:15-09:00 Zurich, with Wed 2026-11-11 cancelled by EXDATE
  vevent([
    'UID:math',
    'SUMMARY:Test Math',
    'DTSTART;TZID=Europe/Zurich:20261102T081500',
    'DTEND;TZID=Europe/Zurich:20261102T090000',
    'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
    'EXDATE;TZID=Europe/Zurich:20261111T081500',
  ]),
  // one-off tomorrow: 07:00Z = 08:00 Zurich (winter time)
  vevent(['UID:once', 'SUMMARY:Test Dentist', 'DTSTART:20261107T070000Z', 'DTEND:20261107T080000Z']),
  vevent(['UID:day', 'SUMMARY:Test Holiday', 'DTSTART;VALUE=DATE:20261108', 'DTEND;VALUE=DATE:20261109']),
  vevent(['UID:gone', 'SUMMARY:Test Cancelled', 'STATUS:CANCELLED', 'DTSTART:20261107T090000Z', 'DTEND:20261107T100000Z']),
)

let dir: string
let stateFile: string
let answers: Record<string, string | Error>
const fetcher: Fetcher = async (url) => {
  const a = answers[url]
  if (a === undefined) throw new Error('no answer')
  if (a instanceof Error) throw a
  return a
}
const configs = [
  { id: 'school', source: 'Test School', name: 'Plan', url: 'https://example.invalid/secret-token-school' },
  { id: 'home', source: 'Test Home', name: 'Private', url: 'https://example.invalid/secret-token-home' },
]

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cal-'))
  stateFile = join(dir, 'state', 'calendar-state.json')
  answers = {
    [configs[0].url]: school,
    [configs[1].url]: ics(vevent(['UID:lunch', 'SUMMARY:Test Lunch', 'DTSTART:20261106T113000Z', 'DTEND:20261106T123000Z'])),
  }
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

async function importer() {
  const imp = new CalendarImporter(configs, fetcher, stateFile)
  await imp.refresh(AT)
  return imp
}

describe('importer', () => {
  it('expands a series, applies EXDATE, keeps Zurich times and handles all-day events', async () => {
    const { events } = (await importer()).status(AT, 7)
    const row = (e: (typeof events)[number]) => `${e.date} ${e.start ?? 'allday'}-${e.end ?? ''} ${e.title}`
    expect(events.map(row)).toEqual([
      '2026-11-06 12:30-13:30 Test Lunch',
      '2026-11-07 08:00-09:00 Test Dentist',
      '2026-11-08 allday- Test Holiday',
      '2026-11-09 08:15-09:00 Test Math', // Wednesday the 11th is excluded
    ])
    expect(events.find((e) => e.uid === 'math')?.series).toBe(true)
    expect(events.find((e) => e.uid === 'once')?.series).toBe(false)
  })

  it('finds the series on later days', async () => {
    const { events } = (await importer()).status(AT, 14)
    expect(events.filter((e) => e.uid === 'math').map((e) => e.date)).toEqual(['2026-11-09', '2026-11-16', '2026-11-18'])
  })

  it('keeps the last good answer when a download fails', async () => {
    const imp = await importer()
    answers[configs[0].url] = new Error('boom ' + configs[0].url)
    await imp.refresh(new Date(AT.getTime() + 900_000))
    const status = imp.status(AT, 7)
    expect(status.events.some((e) => e.uid === 'math')).toBe(true)
    expect(status.calendars.find((c) => c.id === 'school')).toMatchObject({ ok: true, lastSuccess: AT.toISOString() })
  })

  it('reports a calendar that never worked as not ok, without events', async () => {
    answers[configs[1].url] = new Error('down')
    const status = (await importer()).status(AT, 7)
    expect(status.calendars.find((c) => c.id === 'home')).toMatchObject({ ok: false, lastSuccess: null })
    expect(status.events.every((e) => e.calendarId === 'school')).toBe(true)
  })

  it('survives garbage instead of an ICS file', async () => {
    answers[configs[1].url] = '<html>login</html>'
    const status = (await importer()).status(AT, 7)
    expect(status.events.every((e) => e.calendarId === 'school')).toBe(true)
  })

  it('switches calendars, single events and whole series, and persists them', async () => {
    const imp = await importer()
    imp.setEventShown('school:math', false)
    imp.setCalendarOn('home', false)
    let status = imp.status(AT, 14)
    expect(status.events.filter((e) => e.uid === 'math').every((e) => !e.shown)).toBe(true)
    expect(status.events.find((e) => e.uid === 'once')?.shown).toBe(true)
    expect(status.events.some((e) => e.calendarId === 'home')).toBe(false)
    expect(status.calendars.find((c) => c.id === 'home')?.on).toBe(false)

    // a new process reads the file; the switched-out series stays out
    const again = new CalendarImporter(configs, fetcher, stateFile)
    await again.refresh(AT)
    status = again.status(AT, 14)
    expect(status.events.filter((e) => e.uid === 'math').every((e) => !e.shown)).toBe(true)
    expect(status.calendars.find((c) => c.id === 'home')?.on).toBe(false)

    again.setEventShown('school:math', true)
    expect(again.status(AT, 14).events.find((e) => e.uid === 'math')?.shown).toBe(true)
  })

  it('never writes a link into the state file', async () => {
    const imp = await importer()
    imp.setCalendarOn('school', false)
    expect(readFileSync(stateFile, 'utf8')).not.toContain('example.invalid')
  })
})

describe('links file', () => {
  it('skips broken entries, duplicates and non-http links; a missing file is empty', () => {
    const file = join(dir, 'calendars.json')
    writeFileSync(
      file,
      JSON.stringify({
        calendars: [
          { id: 'a', url: 'https://example.invalid/a', name: 'A' },
          { id: 'a', url: 'https://example.invalid/dup' },
          { id: 'b c', url: 'https://example.invalid/b' },
          { id: 'c', url: 'file:///etc/passwd' },
          { id: 'd', url: 'webcal://example.invalid/d' },
          null,
        ],
      }),
    )
    expect(loadConfigs(file).map((c) => c.id)).toEqual(['a', 'd'])
    expect(loadConfigs(join(dir, 'missing.json'))).toEqual([])
    expect(loadConfigs(undefined)).toEqual([])
  })
})

describe('routes', () => {
  async function app() {
    return buildApp(new FakeHa(), () => AT, undefined, await importer())
  }

  it('GET /api/status/calendar shows names and state but no link', async () => {
    const res = await (await app()).inject({ method: 'GET', url: '/api/status/calendar?days=2' })
    expect(res.statusCode).toBe(200)
    expect(res.body).not.toContain('example.invalid')
    expect(res.body).not.toContain('secret-token')
    const json = res.json()
    expect(json.calendars).toHaveLength(2)
    expect(json.events.map((e: { uid: string }) => e.uid)).toEqual(['lunch', 'once'])
  })

  it('PATCH switches work and reject bad input', async () => {
    const a = await app()
    const off = await a.inject({ method: 'PATCH', url: '/api/calendar/calendars/home', payload: { on: false } })
    expect(off.json()).toMatchObject({ id: 'home', on: false })
    expect((await a.inject({ method: 'PATCH', url: '/api/calendar/calendars/nope', payload: { on: false } })).statusCode).toBe(404)
    expect((await a.inject({ method: 'PATCH', url: '/api/calendar/calendars/home', payload: { on: 'x' } })).statusCode).toBe(400)

    const ev = await a.inject({ method: 'PATCH', url: '/api/calendar/events', payload: { calendarId: 'school', uid: 'once', shown: false } })
    expect(ev.statusCode).toBe(204)
    const json = (await a.inject({ method: 'GET', url: '/api/status/calendar?days=2' })).json()
    expect(json.events.find((e: { uid: string }) => e.uid === 'once').shown).toBe(false)
    expect((await a.inject({ method: 'PATCH', url: '/api/calendar/events', payload: { calendarId: 'nope', uid: 'x', shown: true } })).statusCode).toBe(404)
    expect((await a.inject({ method: 'PATCH', url: '/api/calendar/events', payload: { calendarId: 'school' } })).statusCode).toBe(400)
  })
})

describe('events that span several days', () => {
  const row = (e: { date: string; start: string | null; end: string | null; day: number; days: number; title: string }) =>
    `${e.date} ${e.start ?? 'allday'}-${e.end ?? ''} ${e.day}/${e.days} ${e.title}`

  async function statusFor(...events: string[]) {
    answers[configs[0].url] = ics(...events)
    answers[configs[1].url] = ics()
    return (await importer()).status(AT, 7).events.map(row)
  }

  it('gives a multi-day all-day event one entry per day, the end date being exclusive', async () => {
    expect(
      await statusFor(vevent(['UID:camp', 'SUMMARY:Test Camp', 'DTSTART;VALUE=DATE:20261107', 'DTEND;VALUE=DATE:20261110'])),
    ).toEqual(['2026-11-07 allday- 1/3 Test Camp', '2026-11-08 allday- 2/3 Test Camp', '2026-11-09 allday- 3/3 Test Camp'])
  })

  it('still shows today the event that began before today', async () => {
    expect(
      await statusFor(vevent(['UID:long', 'SUMMARY:Test Trip', 'DTSTART;VALUE=DATE:20261104', 'DTEND;VALUE=DATE:20261108'])),
    ).toEqual(['2026-11-06 allday- 3/4 Test Trip', '2026-11-07 allday- 4/4 Test Trip'])
  })

  it('cuts a timed event at midnight and fills the days between', async () => {
    // Zurich winter time is UTC+1: 21:00Z Fri = 22:00 Fri, 01:00Z Sun = 02:00 Sun
    expect(
      await statusFor(vevent(['UID:night', 'SUMMARY:Test Night', 'DTSTART:20261106T210000Z', 'DTEND:20261108T010000Z'])),
    ).toEqual(['2026-11-06 22:00-24:00 1/3 Test Night', '2026-11-07 00:00-24:00 2/3 Test Night', '2026-11-08 00:00-02:00 3/3 Test Night'])
  })

  it('does not add a day to an event that ends exactly at midnight', async () => {
    expect(
      await statusFor(vevent(['UID:late', 'SUMMARY:Test Late', 'DTSTART:20261106T210000Z', 'DTEND:20261106T230000Z'])),
    ).toEqual(['2026-11-06 22:00-24:00 1/1 Test Late'])
  })

  it('keeps a one-day event as one entry', async () => {
    expect(
      await statusFor(vevent(['UID:one', 'SUMMARY:Test One', 'DTSTART:20261107T090000Z', 'DTEND:20261107T100000Z'])),
    ).toEqual(['2026-11-07 10:00-11:00 1/1 Test One'])
  })
})
