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

// Read-only status from Home Assistant (apps/api, /api/status).
export const statusApi = {
  nextAlarm: () => request<{ alarm: NextAlarm | null }>('GET', '/api/status/next-alarm').then((r) => r.alarm),
  backupAlarm: () => request<BackupAlarm>('GET', '/api/status/backup-alarm'),
  tv: () => request<TvStatus>('GET', '/api/status/tv'),
  lastBackup: () => request<LastBackup>('GET', '/api/status/last-backup'),
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
