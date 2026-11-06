import type { Alarm } from './mockData'

// Talks to apps/api. In dev, vite forwards /api to it (see vite.config.ts).
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'api_unreachable')
  }
  if (!res.ok) {
    const error = await res.json().then((j: { error?: string }) => j.error).catch(() => undefined)
    throw new ApiError(res.status, error ?? 'request_failed')
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export const alarmsApi = {
  list: () => request<Alarm[]>('GET', '/api/alarms'),
  create: (alarm: Omit<Alarm, 'id'>) => request<Alarm>('POST', '/api/alarms', alarm),
  update: (alarm: Alarm) => request<Alarm>('PUT', `/api/alarms/${alarm.id}`, alarm),
  setOn: (id: string, on: boolean) => request<Alarm>('PATCH', `/api/alarms/${id}`, { on }),
  remove: (id: string) => request<void>('DELETE', `/api/alarms/${id}`),
}

export type NextAlarm = { time: string; date: string; weekday: number; inDays: number; kind: 'weekday' | 'app'; alarmId?: string }
export type BackupAlarm = { found: boolean; on: boolean; time: string | null; minutesAfter: number; syncEnabled: boolean; lastSync: string | null }
export type TvStatus = { name: string | null; state: string; reachable: boolean; remote: string | null }
export type LastBackup = { ok: boolean | null; lastSuccess: string | null; lastAttempt: string | null; next: string | null; running: boolean }
export type Connection = { id: string; state: 'ok' | 'down' | 'none' }
export type SystemStatus = {
  probe: boolean // false: the probe on the Pi does not answer, so there is no reading
  homeAssistant: boolean
  reading: {
    cpuPercent: number
    tempC: number | null
    memory: { totalMb: number; usedMb: number; percent: number }
    disk: { totalGb: number; usedGb: number; percent: number }
    uptimeSeconds: number
    load1: number
    internet: { reachable: boolean; latencyMs: number | null }
  } | null
}

export type CalendarInfo = { id: string; source: string; name: string; on: boolean; ok: boolean; lastSuccess: string | null }
export type CalendarEvent = {
  uid: string
  calendarId: string
  title: string
  date: string // YYYY-MM-DD, Zurich
  start: string | null
  end: string | null
  allDay: boolean
  series: boolean
  shown: boolean
}
export type CalendarStatus = { calendars: CalendarInfo[]; events: CalendarEvent[] }

// Calendars imported by the api (ADR-028). The api never returns a link.
export const calendarApi = {
  status: (days = 2) => request<CalendarStatus>('GET', `/api/status/calendar?days=${days}`),
  setCalendarOn: (id: string, on: boolean) => request<CalendarInfo>('PATCH', `/api/calendar/calendars/${encodeURIComponent(id)}`, { on }),
  // Applies to a single event or to every occurrence of a series (same UID).
  setEventShown: (calendarId: string, uid: string, shown: boolean) =>
    request<void>('PATCH', '/api/calendar/events', { calendarId, uid, shown }),
}

// Read-only status from Home Assistant (apps/api, /api/status).
export const statusApi = {
  nextAlarm: () => request<{ alarm: NextAlarm | null }>('GET', '/api/status/next-alarm').then((r) => r.alarm),
  backupAlarm: () => request<BackupAlarm>('GET', '/api/status/backup-alarm'),
  tv: () => request<TvStatus>('GET', '/api/status/tv'),
  lastBackup: () => request<LastBackup>('GET', '/api/status/last-backup'),
  system: () => request<SystemStatus>('GET', '/api/status/system'),
  connections: () => request<{ connections: Connection[] }>('GET', '/api/status/connections').then((r) => r.connections),
}

// Text for the user; 502 means the api works but Home Assistant does not answer.
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 502) return 'Home Assistant antwortet nicht. Der Pi ist vermutlich nicht erreichbar.'
    if (err.status === 0) return 'Die Verwaltung (API) ist nicht erreichbar.'
    if (err.status === 404) return 'Dieser Wecker existiert nicht mehr. Seite neu laden.'
    if (err.status === 400) return `Eingabe nicht gültig: ${err.message}`
  }
  return 'Das hat nicht geklappt. Bitte nochmal versuchen.'
}
