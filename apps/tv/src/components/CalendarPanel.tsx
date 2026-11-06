import { eventDayOffsets } from '../mockData'
import { DAYS, addDays, dm, pad, utcDate, type ZurichNow } from '../lib/time'
import './CalendarPanel.css'

export default function CalendarPanel({ now }: { now: ZurichNow }) {
  const today = utcDate(now.y, now.m, now.d)
  const end = addDays(today, 6)

  return (
    <section className="panel p-calendar">
      <div className="head">
        Kalender &mdash; {dm(today).slice(0, 3)}&ndash;{dm(end)}
        {end.getUTCFullYear()}
      </div>
      <div className="strip tabular">
        {Array.from({ length: 7 }, (_, i) => {
          const dt = addDays(today, i)
          return (
            <div key={i} className={`day${i === 0 ? ' today' : ''}`}>
              {DAYS[dt.getUTCDay()]}
              <b>{pad(dt.getUTCDate())}</b>
              {i === 0 ? (
                <span className="tag">HEUTE</span>
              ) : (
                <span className={`mk${eventDayOffsets.includes(i) ? ' has' : ''}`} />
              )}
            </div>
          )
        })}
      </div>
      <hr className="rule" />
      <div className="legend">
        <span>
          <i />
          Termin (Demo)
        </span>
        <span>
          <i className="grey" />
          Wichtig
        </span>
      </div>
      <img className="egg" src="/assets/egg-ichigo.png" alt="" />
    </section>
  )
}
