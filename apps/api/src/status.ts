import type { Alarm } from './alarm.ts'
import type { HaClient, HaState } from './ha.ts'
import { BACKUP_ALARM, ENTITIES, PLACE, WEEKDAY_ALARM } from './mapping.ts'
import { addDays, weekdayOf, zurichClock } from './time.ts'

// Everything here only reads. Each function turns Home Assistant states into the
// small shape one card or panel needs, so the apps never see raw entities.

const NONE = new Set(['unknown', 'unavailable', 'none', ''])
const find = (states: HaState[], id: string) => states.find((s) => s.entity_id === id)
const known = (s: HaState | undefined) => (s && !NONE.has(s.state) ? s.state : null)
const text = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const round = (v: number | null, digits = 0) => (v === null ? null : Math.round(v * 10 ** digits) / 10 ** digits)

// --- next alarm ----------------------------------------------------------

export type NextAlarm = {
  time: string // HH:MM
  date: string // YYYY-MM-DD, Zurich
  weekday: number // 0 = Mo
  inDays: number
  kind: 'weekday' | 'app'
  alarmId?: string
}

// The earliest alarm that will really ring: app alarms that are on plus the
// 06:30 weekday alarm if its automation is on, minus public holidays (Mon-Fri
// only, as in the automations themselves, ADR-012).
export async function nextAlarm(ha: HaClient, alarms: Alarm[], states: HaState[], at: Date): Promise<NextAlarm | null> {
  const now = zurichClock(at)
  const weekdayOn = find(states, WEEKDAY_ALARM.entity)?.state === 'on'
  const ringOnHolidays = find(states, ENTITIES.ringOnHolidays)?.state === 'on' // ADR-029
  const workdays = new Map<string, boolean>()
  const isWorkday = async (date: string) => {
    if (!workdays.has(date)) workdays.set(date, await ha.isWorkday(date))
    return workdays.get(date)!
  }

  for (let inDays = 0; inDays <= 8; inDays++) {
    const date = addDays(now.date, inDays)
    const weekday = weekdayOf(date)
    const candidates: Pick<NextAlarm, 'time' | 'kind' | 'alarmId'>[] = []
    for (const a of alarms) {
      if (a.on && a.days.includes(weekday)) candidates.push({ time: a.time, kind: 'app', alarmId: a.id })
    }
    if (weekdayOn && WEEKDAY_ALARM.days.includes(weekday)) candidates.push({ time: WEEKDAY_ALARM.time, kind: 'weekday' })

    const upcoming = candidates.filter((c) => inDays > 0 || c.time > now.time).sort((x, y) => x.time.localeCompare(y.time))
    if (upcoming.length === 0) continue
    if (weekday <= 4 && !ringOnHolidays && !(await isWorkday(date))) continue
    return { ...upcoming[0], date, weekday, inDays }
  }
  return null
}

// --- backup alarm --------------------------------------------------------

export type BackupAlarm = {
  found: boolean
  on: boolean
  time: string | null // HH:MM
  minutesAfter: number
  syncEnabled: boolean
  lastSync: string | null // ISO time the evening sync last ran
}

export function backupAlarm(states: HaState[]): BackupAlarm {
  const sonos = states.find(
    (s) => s.entity_id.startsWith('switch.sonos_alarm_') && String(s.attributes.alarm_id) === BACKUP_ALARM.sonosAlarmId,
  )
  const sync = find(states, BACKUP_ALARM.syncAutomation)
  return {
    found: sonos !== undefined,
    on: sonos?.state === 'on',
    time: text(sonos?.attributes.time)?.slice(0, 5) ?? null,
    minutesAfter: BACKUP_ALARM.minutesAfter,
    syncEnabled: sync?.state === 'on',
    lastSync: text(sync?.attributes.last_triggered),
  }
}

// --- TV ------------------------------------------------------------------

export type TvStatus = { name: string | null; state: string; reachable: boolean; remote: string | null }

export function tvStatus(states: HaState[]): TvStatus {
  const tv = find(states, ENTITIES.tv)
  const state = tv?.state ?? 'unavailable'
  return {
    name: text(tv?.attributes.friendly_name),
    state,
    reachable: state !== 'unavailable' && state !== 'unknown',
    remote: known(find(states, ENTITIES.tvRemote)),
  }
}

// --- weather -------------------------------------------------------------

export type WeatherNow = {
  place: string
  source: string
  condition: string | null // Home Assistant condition, e.g. "cloudy", "rainy"
  tempC: number | null
  windKmh: number | null
  humidityPercent: number | null
  pressureHpa: number | null
  rainMm: number | null // expected today
}
export type WeatherDay = { date: string; condition: string | null; hiC: number | null; loC: number | null }

const TO_KMH: Record<string, number> = { 'km/h': 1, 'm/s': 3.6, mph: 1.609344, kn: 1.852 }

export async function weather(ha: HaClient, states: HaState[], at: Date): Promise<{ now: WeatherNow; forecast: WeatherDay[] }> {
  const w = find(states, ENTITIES.weather)
  const wind = num(w?.attributes.wind_speed)
  const unit = text(w?.attributes.wind_speed_unit) ?? 'km/h'
  const today = zurichClock(at).date
  const days = (await ha.getDailyForecast(ENTITIES.weather)).map((f) => ({ f, date: zurichClock(new Date(f.datetime)).date }))
  const todays = days.find((d) => d.date === today)

  return {
    now: {
      place: PLACE,
      source: 'met.no',
      condition: known(w),
      tempC: round(num(w?.attributes.temperature), 1),
      windKmh: wind === null ? null : Math.round(wind * (TO_KMH[unit] ?? 1)),
      humidityPercent: round(num(w?.attributes.humidity)),
      pressureHpa: round(num(w?.attributes.pressure)),
      rainMm: round(num(todays?.f.precipitation), 1),
    },
    forecast: days
      .filter((d) => d.date > today)
      .slice(0, 7)
      .map((d) => ({
        date: d.date,
        condition: text(d.f.condition),
        hiC: round(num(d.f.temperature)),
        loC: round(num(d.f.templow)),
      })),
  }
}

// --- player --------------------------------------------------------------

export type Player = {
  state: string
  playing: boolean
  title: string | null
  artist: string | null
  playlist: string | null
  durationSec: number | null
  positionSec: number | null
}

export function player(states: HaState[], at: Date): Player {
  const p = find(states, ENTITIES.player)
  const state = p?.state ?? 'unavailable'
  const duration = num(p?.attributes.media_duration)
  let position = num(p?.attributes.media_position)
  const updated = text(p?.attributes.media_position_updated_at)
  // Home Assistant only stores the position when it changed; add the time since.
  if (position !== null && updated && state === 'playing') {
    position += Math.max(0, (at.getTime() - new Date(updated).getTime()) / 1000)
  }
  if (position !== null && duration !== null) position = Math.min(position, duration)
  const idle = state !== 'playing' && state !== 'paused'
  return {
    state,
    playing: state === 'playing',
    title: idle ? null : text(p?.attributes.media_title),
    artist: idle ? null : text(p?.attributes.media_artist),
    playlist: idle ? null : text(p?.attributes.media_playlist),
    durationSec: idle || duration === null ? null : Math.round(duration),
    positionSec: idle || position === null ? null : Math.round(position),
  }
}

// --- connections ---------------------------------------------------------

export type ConnectionState = 'ok' | 'down' | 'none'
export type Connection = { id: string; state: ConnectionState }

// Config entries that have a line on the settings page. Calendars, Tailscale and
// the watchdog are not Home Assistant entries and stay out of here.
const ENTRY_DOMAIN: Record<string, string> = { spotify: 'spotify', sonos: 'sonos', tv: 'braviatv' }

export function connections(entries: { domain: string; state: string; disabled_by: string | null }[]): Connection[] {
  const list = Object.entries(ENTRY_DOMAIN).map(([id, domain]): Connection => {
    const mine = entries.filter((e) => e.domain === domain && !e.disabled_by)
    if (mine.length === 0) return { id, state: 'none' }
    return { id, state: mine.every((e) => e.state === 'loaded') ? 'ok' : 'down' }
  })
  // We got an answer, so Home Assistant itself is running.
  return [...list, { id: 'ha', state: 'ok' }]
}

// --- last backup ---------------------------------------------------------

export type LastBackup = {
  // null = no automatic backup has run yet
  ok: boolean | null
  lastSuccess: string | null
  lastAttempt: string | null
  next: string | null
  running: boolean
}

export function lastBackup(states: HaState[]): LastBackup {
  const lastSuccess = known(find(states, ENTITIES.backupLastSuccess))
  const lastAttempt = known(find(states, ENTITIES.backupLastAttempt))
  let ok: boolean | null = null
  if (lastAttempt) ok = lastSuccess !== null && new Date(lastSuccess) >= new Date(lastAttempt)
  return {
    ok,
    lastSuccess,
    lastAttempt,
    next: known(find(states, ENTITIES.backupNext)),
    running: find(states, ENTITIES.backupState)?.state === 'create_backup',
  }
}
