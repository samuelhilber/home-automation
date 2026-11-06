import { SOURCES, ZONES } from './mapping.ts'

// Weekdays are 0 = Mo ... 6 = So, like in the admin app.
export type Alarm = {
  id: string
  time: string // HH:MM
  days: number[]
  zone: string
  source: string
  volume: number // 1..100, sent to Home Assistant as 0.01..1
  wakeTv: boolean
  on: boolean
}

export type AlarmInput = Omit<Alarm, 'id'>

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

// Returns the cleaned input, or a message for the first thing that is wrong.
export function parseAlarmInput(body: unknown): { ok: true; value: AlarmInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Body must be an object' }
  const b = body as Record<string, unknown>

  if (typeof b.time !== 'string' || !TIME.test(b.time)) return { ok: false, error: 'time must be HH:MM' }
  if (
    !Array.isArray(b.days) ||
    b.days.length === 0 ||
    !b.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  ) {
    return { ok: false, error: 'days must be a non-empty list of 0 (Mo) to 6 (So)' }
  }
  if (typeof b.zone !== 'string' || !(b.zone in ZONES)) return { ok: false, error: 'unknown zone' }
  if (typeof b.source !== 'string' || !(b.source in SOURCES)) return { ok: false, error: 'unknown source' }
  if (typeof b.volume !== 'number' || !Number.isInteger(b.volume) || b.volume < 1 || b.volume > 100) {
    return { ok: false, error: 'volume must be a whole number from 1 to 100' }
  }
  if (typeof b.wakeTv !== 'boolean') return { ok: false, error: 'wakeTv must be true or false' }
  if (typeof b.on !== 'boolean') return { ok: false, error: 'on must be true or false' }

  return {
    ok: true,
    value: {
      time: b.time,
      days: [...new Set(b.days as number[])].sort((x, y) => x - y),
      zone: b.zone,
      source: b.source,
      volume: b.volume,
      wakeTv: b.wakeTv,
      on: b.on,
    },
  }
}
