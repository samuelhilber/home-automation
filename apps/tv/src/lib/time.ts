export const DAYS = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA']
export const DAYS_TC = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export type ZurichNow = { y: number; m: number; d: number; h: number; min: number }

export const pad = (n: number) => (n < 10 ? '0' : '') + n

export function zurichNow(date = new Date()): ZurichNow {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const o: Record<string, string> = {}
  parts.forEach((p) => {
    o[p.type] = p.value
  })
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, min: +o.minute }
}

// Calendar days are handled as UTC midnight dates so DST never shifts them.
export const utcDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))
export const addDays = (dt: Date, n: number) => new Date(dt.getTime() + n * 86400000)

export function isoWeek(dt: Date) {
  const t = new Date(dt.getTime())
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7)
}

export function dayOfYear(dt: Date) {
  return Math.round((dt.getTime() - Date.UTC(dt.getUTCFullYear(), 0, 1)) / 86400000) + 1
}

export const dm = (dt: Date) => `${pad(dt.getUTCDate())}.${pad(dt.getUTCMonth() + 1)}.`
