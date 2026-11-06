import type { CalendarEvent } from '../lib/api'
import { asset } from '../lib/asset'
import { DAYS, addDays, dm, pad, utcDate, type ZurichNow } from '../lib/time'
import './CalendarPanel.css'

export default function CalendarPanel({ now, events }: { now: ZurichNow; events: CalendarEvent[] | null }) {
  const today = utcDate(now.y, now.m, now.d)
  const end = addDays(today, 6)

  // Entries per day (a multi-day event has one per day), and the multi-day ones for the bar.
  const count = new Map<string, number>()
  const multi = new Map<string, CalendarEvent>()
  for (const e of events ?? []) {
    count.set(e.date, (count.get(e.date) ?? 0) + 1)
    if (e.days > 1) multi.set(e.date, e)
  }

  return (
    <section className="panel p-calendar">
      <div className="head">
        Kalender &mdash; {dm(today).slice(0, 3)}&ndash;{dm(end)}
        {end.getUTCFullYear()}
      </div>
      <div className="strip tabular">
        {Array.from({ length: 7 }, (_, i) => {
          const dt = addDays(today, i)
          const iso = dt.toISOString().slice(0, 10)
          const n = count.get(iso) ?? 0
          const long = multi.get(iso)
          return (
            <div key={i} className={`day${i === 0 ? ' today' : ''}`}>
              {DAYS[dt.getUTCDay()]}
              <b>{pad(dt.getUTCDate())}</b>
              {i === 0 && <span className="tag">HEUTE</span>}
              {/* a multi-day event is one bar that runs through its days */}
              {long && (
                <span
                  className={`span${long.day === 1 || i === 0 ? ' first' : ''}${long.day === long.days || i === 6 ? ' last' : ''}`}
                />
              )}
              <span className={`cnt${n > 0 ? ' has' : ''}`}>{n > 0 ? n : '–'}</span>
            </div>
          )
        })}
      </div>
      <hr className="rule" />
      <div className="legend">
        <span>
          <i />
          Termine pro Tag
        </span>
      </div>
      <img className="egg" src={asset('egg-ichigo.png')} alt="" />
    </section>
  )
}
