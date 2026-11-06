// Alarms are Zurich wall-clock times (ADR-004), whatever zone the Pi runs in.
const ZONE = 'Europe/Zurich'

export type ZurichClock = { date: string; time: string }

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// "2026-11-06" and "20:46" in Zurich.
export function zurichClock(at: Date): ZurichClock {
  const o: Record<string, string> = {}
  for (const p of fmt.formatToParts(at)) o[p.type] = p.value
  return { date: `${o.year}-${o.month}-${o.day}`, time: `${o.hour}:${o.minute}` }
}

// Calendar days are plain strings, so daylight saving never shifts them.
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// 0 = Mo ... 6 = So, like the alarms.
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}
