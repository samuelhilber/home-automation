const ZONE = 'Europe/Zurich'
const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

// "2026-11-04" -> "04. November 2026"
export function longDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
}

export const weekdayName = (weekday: number) => WEEKDAYS[weekday]

export function dayLabel(inDays: number): string {
  if (inDays === 0) return 'Heute'
  if (inDays === 1) return 'Morgen'
  return `In ${inDays} Tagen`
}

// "Europe/Zurich · MEZ (UTC+01:00)"
export function timezoneLabel(at = new Date()): string {
  const part = (timeZoneName: 'short' | 'longOffset') =>
    new Intl.DateTimeFormat('de-DE', { timeZone: ZONE, timeZoneName }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? ''
  return `${ZONE} · ${part('short')} (${part('longOffset').replace('GMT', 'UTC')})`
}

const time = (d: Date) => new Intl.DateTimeFormat('de-DE', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)
const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(d)

export const clockOf = (iso: string) => time(new Date(iso))

// "heute, 03:00" / "gestern, 21:00" / "03.11., 21:00"
export function whenLabel(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const diff = (Date.parse(day(now)) - Date.parse(day(d))) / 86400000
  const prefix =
    diff === 0
      ? 'heute'
      : diff === 1
        ? 'gestern'
        : new Intl.DateTimeFormat('de-DE', { timeZone: ZONE, day: '2-digit', month: '2-digit' }).format(d)
  return `${prefix}, ${time(d)}`
}

// 80398 -> "22 Std., 19 Min." / 1200000 -> "13 Tage, 21 Std."
export function uptimeLabel(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days} ${days === 1 ? 'Tag' : 'Tage'}, ${String(hours).padStart(2, '0')} Std.`
  return `${hours} Std., ${String(minutes).padStart(2, '0')} Min.`
}

export const gbLabel = (gb: number) => `${gb.toLocaleString('de-DE', { maximumFractionDigits: 1 })} GB`
