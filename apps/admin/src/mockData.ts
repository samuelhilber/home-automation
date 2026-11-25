// Placeholder values for what the backend cannot deliver yet (calendar connection rows,
// activity feed). Next alarm, backup alarm, TV, last backup, the watchdog and the Home
// Assistant connections come from apps/api (see api.ts, statusApi).

export const activityFeed = [
  { time: '20:46', title: 'Watchdog geprüft', detail: 'Alle Dienste antworten.' },
  { time: '20:30', title: 'Weckplan synchronisiert', detail: 'Nächster Start: morgen, 06:30.' },
  { time: '18:12', title: 'Updates gefunden', detail: '2 Pakete zur Installation bereit.' },
]

// Wecker page. Weekdays are 0 = Mo ... 6 = So.
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
