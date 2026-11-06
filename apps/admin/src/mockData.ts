// Placeholder values for what the backend cannot deliver yet (calendars, watchdog,
// activity feed, settings, updates). Next alarm, backup alarm, TV, last backup and the Home Assistant
// connections come from apps/api (see api.ts, statusApi).

export const systemStatus = {
  watchdog: { ok: true, lastSignal: 'Letztes Signal um 20:46:48' },
}

export const activityFeed = [
  { time: '20:46', title: 'Watchdog geprüft', detail: 'Alle Dienste antworten.' },
  { time: '20:30', title: 'Weckplan synchronisiert', detail: 'Nächster Start: morgen, 06:30.' },
  { time: '18:12', title: 'Updates gefunden', detail: '2 Pakete zur Installation bereit.' },
]

// Wecker page. Weekdays are 0 = Mo ... 6 = So.
// System page (placeholder values, matching the signed-off sketch).
export const systemPage = {
  watchdog: { ok: true, lastCheckIn: '20:46', agoSeconds: 12, externalReached: true },
}

// Einstellungen page: status only, never addresses, keys or passwords.
export type ConnectionState = 'ok' | 'down' | 'none'
export type Connection = {
  id: string
  name: string
  state: ConnectionState
  detail?: string
  value?: string // shown instead of a button for system parts
  action?: string // button label
}

// Rows without a Home Assistant source yet (calendars, Tailscale, watchdog). The rest comes from the api.
export const connections: Connection[] = [
  { id: 'icloud', name: 'iCloud', state: 'ok', action: 'Trennen' },
  { id: 'work', name: 'Outlook Arbeit', state: 'ok', action: 'Trennen' },
  { id: 'school', name: 'Outlook Schule', state: 'none', detail: 'Nicht angemeldet', action: 'Verbinden' },
  { id: 'tailscale', name: 'Tailscale', state: 'ok', detail: 'Zugriff von unterwegs', value: 'aktiv' },
  { id: 'watchdog', name: 'Watchdog-Dienst', state: 'ok', detail: 'Externer Dienst', value: 'erreicht' },
]

// Updates (made-up versions).
export type UpdateItem = { id: string; name: string; from: string; to: string; notesUrl: string }
export type UpdateHistoryItem = { id: string; name: string; from: string; to: string; ok: boolean; date: string }

export const initialPendingUpdates: UpdateItem[] = [
  { id: 'u1', name: 'Home Assistant Core', from: '2026.10.3', to: '2026.11.0', notesUrl: '#' },
  { id: 'u2', name: 'HACS Sonos-Helfer', from: '1.4.2', to: '1.5.0', notesUrl: '#' },
]

export const initialUpdateHistory: UpdateHistoryItem[] = [
  { id: 'h1', name: 'Home Assistant Core', from: '2026.10.2', to: '2026.10.3', ok: true, date: '02.11.' },
  { id: 'h2', name: 'Watchdog-Skript', from: '1.1', to: '1.2', ok: false, date: '28.10.' },
]

export const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export type Alarm = {
  id: string
  time: string
  days: number[]
  zone: string
  source: string
  volume: number
  wakeTv: boolean
  on: boolean
}

export const alarmZones = ['Wohnzimmer-Gruppe', 'Schlafzimmer']
export const alarmSources = ['Discover Weekly']

export const initialAlarms: Alarm[] = [
  {
    id: 'a1',
    time: '06:30',
    days: [0, 1, 2, 3, 4],
    zone: 'Wohnzimmer-Gruppe',
    source: 'Discover Weekly',
    volume: 5,
    wakeTv: true,
    on: true,
  },
  {
    id: 'a2',
    time: '08:30',
    days: [5, 6],
    zone: 'Schlafzimmer',
    source: 'Discover Weekly',
    volume: 5,
    wakeTv: false,
    on: false,
  },
]
