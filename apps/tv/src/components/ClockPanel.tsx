import { DAYS_TC, dayOfYear, dm, isoWeek, pad, utcDate, type ZurichNow } from '../lib/time'
import './ClockPanel.css'

export default function ClockPanel({ now }: { now: ZurichNow }) {
  const today = utcDate(now.y, now.m, now.d)
  const filled = Math.floor((now.h * 60 + now.min) / 120) // one tick per two hours of the day

  return (
    <section className="panel clock">
      <div className="head">Uhrzeit</div>
      <div className="time tabular">
        {pad(now.h)}:{pad(now.min)}
      </div>
      <div className="date tabular">
        {DAYS_TC[today.getUTCDay()]}, {dm(today)}
        {now.y}
      </div>
      <div className="ticks">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : undefined} />
        ))}
      </div>
      <div className="foot tabular">
        KW {isoWeek(today)} &middot; {dayOfYear(today)}. Tag im Jahr
      </div>
    </section>
  )
}
