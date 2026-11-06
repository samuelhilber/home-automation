import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import ical, { type ParameterValue, type VEvent } from 'node-ical'
import { addDays, zurichClock } from './time.ts'

// ADR-028: the api downloads read-only ICS links itself. The links live in a
// git-ignored file on the Pi (CALENDARS_FILE) and never leave this module: no
// route, log line or error message contains one.

export type CalendarConfig = { id: string; source: string; name: string; url: string }

// What the routes may show about a calendar: never the link.
export type CalendarInfo = {
  id: string
  source: string
  name: string
  on: boolean
  ok: boolean // false: the last download failed (or none ran yet) and the data is old or missing
  lastSuccess: string | null // ISO time of the last good download
}

export type CalendarEvent = {
  uid: string // with calendarId the switch target: covers a single event or a whole series
  calendarId: string
  title: string
  date: string // YYYY-MM-DD, Zurich
  start: string | null // HH:MM, null for all-day events
  end: string | null
  allDay: boolean
  series: boolean // true: the switch applies to every occurrence
  shown: boolean // false: switched out of the morning screen
}

export type CalendarStatus = { calendars: CalendarInfo[]; events: CalendarEvent[] }

// Everything is on unless it is listed here, so new calendars, events and new
// occurrences of a series show up by default (R5).
type State = { calendarsOff: string[]; eventsOff: string[] }

export interface Fetcher {
  (url: string): Promise<string>
}

export const httpFetcher: Fetcher = async (url) => {
  // webcal:// is only a hint to open a calendar app; the data is plain https.
  const res = await fetch(url.replace(/^webcal:/i, 'https:'), { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`status ${res.status}`)
  return res.text()
}

// Reads the links file. Malformed entries are skipped; a missing file means "no calendars yet".
export function loadConfigs(path: string | undefined): CalendarConfig[] {
  if (!path) return []
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return []
  }
  const list = (raw as { calendars?: unknown })?.calendars
  if (!Array.isArray(list)) return []
  const seen = new Set<string>()
  const out: CalendarConfig[] = []
  for (const c of list) {
    const { id, source, name, url } = (c ?? {}) as Record<string, unknown>
    if (typeof id !== 'string' || typeof url !== 'string' || !/^[a-z0-9_-]+$/i.test(id) || seen.has(id)) continue
    if (!/^(https?|webcal):\/\//i.test(url)) continue
    seen.add(id)
    out.push({ id, source: typeof source === 'string' ? source : id, name: typeof name === 'string' ? name : id, url })
  }
  return out
}

const text = (v: ParameterValue | undefined): string => {
  const s = typeof v === 'string' ? v : v && typeof v === 'object' && 'val' in v ? String(v.val) : ''
  return s.trim()
}

type Cached = { events: VEvent[]; lastSuccess: Date }

export class CalendarImporter {
  private cache = new Map<string, Cached>()
  private state: State = { calendarsOff: [], eventsOff: [] }

  private configs: CalendarConfig[]
  private fetcher: Fetcher
  private stateFile: string | undefined

  constructor(configs: CalendarConfig[], fetcher: Fetcher, stateFile: string | undefined) {
    this.configs = configs
    this.fetcher = fetcher
    this.stateFile = stateFile
    this.loadState()
  }

  private loadState() {
    if (!this.stateFile) return
    try {
      const s = JSON.parse(readFileSync(this.stateFile, 'utf8')) as Partial<State>
      const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
      this.state = { calendarsOff: strings(s.calendarsOff), eventsOff: strings(s.eventsOff) }
    } catch {
      // Losing the file only resets the switches (ADR-028).
    }
  }

  private saveState() {
    if (!this.stateFile) return
    mkdirSync(dirname(this.stateFile), { recursive: true })
    const tmp = this.stateFile + '.tmp'
    writeFileSync(tmp, JSON.stringify(this.state, null, 2))
    renameSync(tmp, this.stateFile)
  }

  // Downloads every calendar. A failure keeps the previous answer, so a slow or
  // broken calendar does not blank the screens.
  async refresh(at: Date = new Date()): Promise<void> {
    await Promise.all(
      this.configs.map(async (c) => {
        try {
          const parsed = ical.parseICS(await this.fetcher(c.url))
          const events = Object.values(parsed).filter((e): e is VEvent => e?.type === 'VEVENT')
          this.cache.set(c.id, { events, lastSuccess: at })
        } catch {
          // Deliberately no detail: the error text of a failed download can contain the link.
          console.error(`calendar ${c.id}: download or parsing failed`)
        }
      }),
    )
  }

  hasCalendar(id: string): boolean {
    return this.configs.some((c) => c.id === id)
  }

  setCalendarOn(id: string, on: boolean) {
    const off = new Set(this.state.calendarsOff)
    if (on) off.delete(id)
    else off.add(id)
    this.state.calendarsOff = [...off]
    this.saveState()
  }

  setEventShown(key: string, shown: boolean) {
    const off = new Set(this.state.eventsOff)
    if (shown) off.delete(key)
    else off.add(key)
    this.state.eventsOff = [...off]
    this.saveState()
  }

  calendars(): CalendarInfo[] {
    return this.configs.map((c) => {
      const cached = this.cache.get(c.id)
      return {
        id: c.id,
        source: c.source,
        name: c.name,
        on: !this.state.calendarsOff.includes(c.id),
        ok: cached !== undefined,
        lastSuccess: cached?.lastSuccess.toISOString() ?? null,
      }
    })
  }

  // Events of `days` Zurich days from today, sorted. Events of calendars that are off are left out;
  // switched-out ones stay in with `shown: false` so the admin app can switch them back on.
  status(at: Date, days: number): CalendarStatus {
    const today = zurichClock(at).date
    const last = addDays(today, days - 1)
    // A day of slack on both sides, then filtered by the Zurich date.
    const from = new Date(at.getTime() - 36 * 3600_000)
    const to = new Date(at.getTime() + (days + 1) * 24 * 3600_000)
    const events: CalendarEvent[] = []

    for (const info of this.calendars()) {
      const cached = this.cache.get(info.id)
      if (!info.on || !cached) continue
      for (const ev of cached.events) {
        if (String(ev.status ?? '').toUpperCase() === 'CANCELLED') continue
        let instances
        try {
          instances = ical.expandRecurringEvent(ev, { from, to })
        } catch {
          continue // one broken event must not hide the others
        }
        const key = `${info.id}:${ev.uid}`
        for (const inst of instances) {
          if (inst.event.status && String(inst.event.status).toUpperCase() === 'CANCELLED') continue
          const allDay = inst.isFullDay
          // All-day events carry a date, not a moment: take it as written, without a zone shift.
          const startClock = allDay ? null : zurichClock(inst.start)
          const date = allDay ? ymdLocal(inst.start) : startClock!.date
          if (date < today || date > last) continue
          events.push({
            uid: ev.uid,
            calendarId: info.id,
            title: text(inst.summary) || '(ohne Titel)',
            date,
            start: startClock?.time ?? null,
            end: allDay ? null : zurichClock(inst.end).time,
            allDay,
            series: ev.rrule !== undefined || inst.isRecurring,
            shown: !this.state.eventsOff.includes(key),
          })
        }
      }
    }
    events.sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? '') || a.title.localeCompare(b.title))
    return { calendars: this.calendars(), events }
  }
}

const ymdLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
