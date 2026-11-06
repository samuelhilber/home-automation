import type { CalendarEvent } from './api'

// Layout of the "Heute" time axis (see prototypes/tv-kiosk/zeiten-sketch.html). Pure, so it can be
// checked without a browser. Times are minutes since midnight; "24:00" is 1440.

const DEFAULT_FROM = 8 // hours
const DEFAULT_TO = 18
const LIMIT_FROM = 6 // the window never grows past these
const LIMIT_TO = 22
const MIN_MINUTES = 30 // an event is drawn at least this tall so its title stays readable
const MAX_COLUMNS = 2

export type Block = {
  event: CalendarEvent
  topPct: number
  heightPct: number
  col: number
  cols: number
  more: number // further events at the same time that did not fit beside this one
  state: 'past' | 'current' | 'upcoming'
}

export type DayLayout = {
  from: number // first hour on the axis
  to: number // hour after the last row
  blocks: Block[]
  outside: CalendarEvent[] // timed events that lie entirely outside 06-22 h
}

export const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))

export function layoutDay(timed: CalendarEvent[], nowMinutes: number): DayLayout {
  const span = (e: CalendarEvent) => ({ s: minutes(e.start!), e: minutes(e.end ?? e.start!) })
  const lo = LIMIT_FROM * 60
  const hi = LIMIT_TO * 60
  const inside = timed.filter((e) => span(e).e > lo && span(e).s < hi)
  const outside = timed.filter((e) => !inside.includes(e))

  // Grow the window to whole hours around what is there, but never past the limits.
  let from = DEFAULT_FROM
  let to = DEFAULT_TO
  for (const e of inside) {
    const { s, e: end } = span(e)
    from = Math.min(from, Math.floor(s / 60))
    to = Math.max(to, Math.ceil(end / 60))
  }
  from = Math.max(LIMIT_FROM, from)
  to = Math.min(LIMIT_TO, to)
  const total = (to - from) * 60

  const items = inside
    .map((event) => {
      const { s, e } = span(event)
      // Clipped to the window; a clipped event still keeps its real times in the label.
      const start = Math.max(s, from * 60)
      const end = Math.min(Math.max(e, s + MIN_MINUTES), to * 60)
      return { event, s: start, e: Math.max(end, start + MIN_MINUTES), col: 0, cols: 1, more: 0 }
    })
    .sort((a, b) => a.s - b.s || b.e - a.e)

  // Two columns at most: an event goes beside what it overlaps; a third one only adds to "+N".
  const placed: typeof items = []
  for (const it of items) {
    const clash = placed.filter((p) => p.s < it.e && it.s < p.e)
    if (clash.length >= MAX_COLUMNS) {
      clash[MAX_COLUMNS - 1].more += 1
      continue
    }
    if (clash.length > 0) {
      const used = new Set(clash.map((c) => c.col))
      it.col = used.has(0) ? 1 : 0
      it.cols = MAX_COLUMNS
      for (const c of clash) c.cols = MAX_COLUMNS
    }
    placed.push(it)
  }

  const blocks: Block[] = placed.map((it) => ({
    event: it.event,
    topPct: ((it.s - from * 60) / total) * 100,
    heightPct: ((it.e - it.s) / total) * 100,
    col: it.col,
    cols: it.cols,
    more: it.more,
    state: span(it.event).e <= nowMinutes ? 'past' : span(it.event).s <= nowMinutes ? 'current' : 'upcoming',
  }))

  return { from, to, blocks, outside }
}

// Where the "now" line sits on the axis, or null when now is outside the window.
export function nowPct(layout: DayLayout, nowMinutes: number): number | null {
  const start = layout.from * 60
  const total = (layout.to - layout.from) * 60
  return nowMinutes >= start && nowMinutes <= start + total ? ((nowMinutes - start) / total) * 100 : null
}

// "09:00–10:30", with "ab gestern" and "bis morgen" for the part that lies on another day.
export function timeLabel(e: CalendarEvent): string {
  const start = e.day > 1 && e.start === '00:00' ? 'seit gestern' : e.start!
  const end = e.end === '24:00' ? 'bis morgen' : e.end!
  return e.end === '24:00' ? (start === 'seit gestern' ? 'ganztägig' : `${start} ${end}`) : `${start}–${end}`
}
