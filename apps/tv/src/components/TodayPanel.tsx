import type { CalendarEvent } from '../lib/api'
import { asset } from '../lib/asset'
import { layoutDay, nowPct, timeLabel } from '../lib/dayLayout'
import { DAYS_TC, dm, pad, utcDate, type ZurichNow } from '../lib/time'
import './TodayPanel.css'

// "Heute" as a time axis: events are blocks from start to end, two side by side at most, the
// window grows around early or late events (lib/dayLayout.ts, sketch: prototypes/tv-kiosk).
export default function TodayPanel({ now, events }: { now: ZurichNow; events: CalendarEvent[] | null }) {
  const today = utcDate(now.y, now.m, now.d)
  const todayIso = `${now.y}-${pad(now.m)}-${pad(now.d)}`
  const mine = (events ?? []).filter((e) => e.date === todayIso)
  const allDay = mine.filter((e) => e.allDay)
  const nowMinutes = now.h * 60 + now.min
  const layout = layoutDay(
    mine.filter((e) => e.start !== null),
    nowMinutes,
  )
  const line = nowPct(layout, nowMinutes)
  const hours = Array.from({ length: layout.to - layout.from }, (_, i) => layout.from + i)

  return (
    <section className="panel p-today">
      <div className="head">
        Heute &mdash; {DAYS_TC[today.getUTCDay()]} {dm(today)}
      </div>
      {(allDay.length > 0 || layout.outside.length > 0) && (
        <div className="top">
          {allDay.map((e) => (
            <div key={`${e.calendarId}:${e.uid}`} className="allday">
              {e.title}
              <i>{e.days > 1 ? `Tag ${e.day} von ${e.days}` : 'ganztägig'}</i>
            </div>
          ))}
          {layout.outside.map((e) => (
            <div key={`${e.calendarId}:${e.uid}:${e.start}`} className="allday">
              {e.title}
              <i>{timeLabel(e)}</i>
            </div>
          ))}
        </div>
      )}
      <div className="axis tabular">
        {hours.map((h) => (
          <div key={h} className={`hr${h === now.h ? ' now' : ''}`} style={{ height: `${100 / hours.length}%` }}>
            <time>{pad(h)}:00</time>
          </div>
        ))}
        {layout.blocks.map((b) => (
          <div
            key={`${b.event.calendarId}:${b.event.uid}:${b.event.start}`}
            className={`ev ${b.state}`}
            style={{
              top: `${b.topPct}%`,
              height: `calc(${b.heightPct}% - 2px)`,
              left: b.cols === 2 ? `calc(var(--gutter) + ${b.col} * ((100% - var(--gutter)) / 2))` : 'var(--gutter)',
              width: b.cols === 2 ? 'calc((100% - var(--gutter)) / 2 - 6px)' : 'calc(100% - var(--gutter))',
            }}
          >
            <span className="ev-title">{b.event.title}</span>
            <small>{timeLabel(b.event)}</small>
            {b.more > 0 && <em className="more">+{b.more}</em>}
          </div>
        ))}
        {line !== null && <div className="now-line" style={{ top: `${line}%` }} />}
      </div>
      <img className="egg" src={asset('egg-ichigo.png')} alt="" />
    </section>
  )
}
