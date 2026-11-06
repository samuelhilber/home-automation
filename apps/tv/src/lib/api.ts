// Read-only status from apps/api. In dev, vite forwards /api to it (see vite.config.ts).
export type Weather = {
  now: {
    place: string
    source: string
    condition: string | null
    tempC: number | null
    windKmh: number | null
    humidityPercent: number | null
    pressureHpa: number | null
    rainMm: number | null
  }
  forecast: { date: string; condition: string | null; hiC: number | null; loC: number | null }[]
}

export type Player = {
  state: string
  playing: boolean
  title: string | null
  artist: string | null
  playlist: string | null
  durationSec: number | null
  positionSec: number | null
}

export type CalendarEvent = {
  uid: string
  calendarId: string
  title: string
  date: string // YYYY-MM-DD, Zurich
  start: string | null // HH:MM, null for all-day events
  end: string | null
  allDay: boolean
  series: boolean
  shown: boolean
}
export type CalendarStatus = { events: CalendarEvent[] }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path} answered ${res.status}`)
  return (await res.json()) as T
}

export const statusApi = {
  weather: () => get<Weather>('/api/status/weather'),
  player: () => get<Player>('/api/status/player'),
  calendar: () => get<CalendarStatus>('/api/status/calendar?days=7'),
}
