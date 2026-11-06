import type { CalendarEvent } from '../lib/api'
import { DAYS_TC, dm, pad, utcDate, type ZurichNow } from '../lib/time'
import './TodayPanel.css'

// Hours shown on the panel; an event sits in the row of the hour it starts.
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8)

export default function TodayPanel({ now, events }: { now: ZurichNow; events: CalendarEvent[] | null }) {
  const today = utcDate(now.y, now.m, now.d)
  const todayIso = `${now.y}-${pad(now.m)}-${pad(now.d)}`
  const mine = (events ?? []).filter((e) => e.date === todayIso)
  const timed = mine.filter((e) => e.start !== null)
  const allDay = mine.filter((e) => e.allDay)

  return (
    <section className="panel p-today">
      <div className="head">
        Heute &mdash; {DAYS_TC[today.getUTCDay()]} {dm(today)}
      </div>
      {allDay.length > 0 && <div className="allday">{allDay.map((e) => e.title).join('  ·  ')}</div>}
      <div className="hours tabular">
        {HOURS.map((h) => {
          const here = timed.filter((e) => Number(e.start!.slice(0, 2)) === h)
          return (
            <div key={h} className={`hour${h === now.h ? ' now' : ''}`}>
              <time>{pad(h)}:00</time>
              {here.length > 0 && (
                <div className="bar">
                  <span className="bar-text">{here.map((e) => `${e.start} ${e.title}`).join('  ·  ')}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <img className="egg" src="/assets/egg-ichigo.png" alt="" />
    </section>
  )
}
