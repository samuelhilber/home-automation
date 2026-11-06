import type { CalendarEvent } from './api'
import { addDays, pad, utcDate, zurichNow } from './time'

// Made-up events for looking at the page without a calendar: open /tv/?demo.
// Nothing here is read from or written to any real calendar.
export const isDemo = () => new URLSearchParams(window.location.search).has('demo')

const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

export function demoEvents(): CalendarEvent[] {
  const now = zurichNow()
  const today = utcDate(now.y, now.m, now.d)
  const iso = (n: number) => addDays(today, n).toISOString().slice(0, 10)
  const ev = (title: string, n: number, start: string | null, end: string | null, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
    uid: `demo:${title}:${n}`,
    calendarId: 'demo',
    title,
    date: iso(n),
    start,
    end,
    day: 1,
    days: 1,
    allDay: start === null,
    series: false,
    shown: true,
    ...extra,
  })

  // One event that is running right now, so the highlight and the now line show.
  const nowMin = now.h * 60 + now.min
  const running = nowMin >= 7 * 60 && nowMin <= 20 * 60 ? [ev('Gerade jetzt', 0, hhmm(nowMin - 20), hhmm(nowMin + 40))] : []

  return [
    ev('Klassenlager', 0, null, null, { day: 1, days: 3 }),
    ev('Klassenlager', 1, null, null, { day: 2, days: 3 }),
    ev('Klassenlager', 2, null, null, { day: 3, days: 3 }),
    ev('Zug nach Zürich', 0, '07:15', '07:45'),
    ev('Daily Standup', 0, '09:00', '09:45'),
    ev('Workshop', 0, '10:15', '11:30'),
    ev('Call', 0, '10:30', '11:00'),
    ev('Review', 0, '10:45', '11:15'),
    ev('Mittag mit Sara', 0, '12:15', '13:00'),
    ev('Zahnarzt', 0, '15:00', '16:30'),
    ev('Sport', 0, '19:00', '20:00'),
    ...running,
    ev('Elterngespräch', 1, '11:00', '12:00'),
    ev('Einkaufen', 1, '16:00', '17:00'),
    ev('Meeting', 3, '09:00', '10:00'),
    ev('Meeting', 3, '14:00', '15:30'),
  ]
}
